"""Population-weighted road travel to verified obstetric facilities.

Exploratory analysis only: the output is never loaded into model inputs automatically.
Requires territory polygons, verified facility locations, and a documented road-speed
profile. OSM healthcare tags alone do not establish EmONC capability.
"""
from __future__ import annotations

import argparse
import csv
import heapq
import json
import math
from collections import defaultdict
from pathlib import Path


COUNTRIES = {
    "Ethiopia": ("ethiopia-260926.osm.pbf", "eth_ppp_2020_UNadj.tif"),
    "Ghana": ("ghana-260926.osm.pbf", "gha_ppp_2020_UNadj.tif"),
    "Kenya": ("kenya-260926.osm.pbf", "ken_ppp_2020_UNadj.tif"),
    "Tanzania": ("tanzania-260926.osm.pbf", "tza_ppp_2020_UNadj.tif"),
    "Uganda": ("uganda-260926.osm.pbf", "uga_ppp_2020_UNadj.tif"),
}
OUTPUT_COLUMNS = (
    "territory_id", "country", "reachable_population", "unreachable_population",
    "unsnapped_population", "population_weighted_travel_time_hours",
    "population_weighted_road_distance_km", "coverage_fraction",
    "facility_count_verified", "road_nodes", "road_edges",
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    a = math.sin(math.radians(lat2 - lat1) / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 12742.0088 * math.asin(min(1.0, math.sqrt(a)))


def shortest_paths(graph: dict[int, list[tuple[int, float, float]]], sources: set[int]):
    """Return (hours, kilometres) to the fastest reachable verified facility."""
    best = {node: (0.0, 0.0) for node in sources}
    queue = [(0.0, 0.0, node) for node in sources]
    heapq.heapify(queue)
    while queue:
        hours, km, node = heapq.heappop(queue)
        if (hours, km) != best[node]:
            continue
        for other, edge_hours, edge_km in graph.get(node, ()):
            candidate = (hours + edge_hours, km + edge_km)
            if candidate < best.get(other, (math.inf, math.inf)):
                best[other] = candidate
                heapq.heappush(queue, (*candidate, other))
    return best


def load_inputs(boundaries_path: Path, facilities_path: Path, profile_path: Path, allow_osm_maternity_proxy: bool = False):
    from shapely.geometry import shape

    with boundaries_path.open(encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    boundaries = {}
    for feature in features:
        props = feature["properties"]
        ident = str(props["territory_id"])
        if ident in boundaries:
            raise ValueError(f"Duplicate territory_id in boundaries: {ident}")
        polygon = shape(feature["geometry"])
        if not polygon.is_valid or polygon.is_empty or polygon.geom_type not in {"Polygon", "MultiPolygon"}:
            raise ValueError(f"Invalid territory polygon: {ident}")
        boundaries[ident] = (str(props["country"]), polygon)
    for ident, (country, polygon) in boundaries.items():
        for other, (other_country, other_polygon) in boundaries.items():
            if ident < other and country == other_country and polygon.intersection(other_polygon).area > 1e-10:
                raise ValueError(f"Overlapping territory polygons: {ident}, {other}")
    facilities = defaultdict(list)
    with facilities_path.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            verified = row["emonc_verified"].strip().lower() in {"true", "1", "yes"}
            proxy = row.get("classification", "").strip() in {
                "OSM_MATERNITY_PROXY",
                "OSM_HOSPITAL_PROXY",
            }
            if not verified and not (allow_osm_maternity_proxy and proxy):
                continue
            if verified and (not row.get("verification_source") or not row.get("verification_year")):
                raise ValueError(f"Verified destination requires source and year: {row['facility_id']}")
            lat, lon = float(row["latitude"]), float(row["longitude"])
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError(f"Invalid facility coordinates: {row['facility_id']}")
            facilities[row["country"]].append((row["facility_id"], lat, lon))
    with profile_path.open(encoding="utf-8") as handle:
        profile = json.load(handle)
    if not profile.get("source") or not isinstance(profile.get("speeds_kmh"), dict):
        raise ValueError("Speed profile requires source and speeds_kmh fields")
    speeds = profile["speeds_kmh"]
    if not speeds or any(not isinstance(v, (int, float)) or not math.isfinite(v) or v <= 0 for v in speeds.values()):
        raise ValueError("Speed profile must map highway types to positive km/h values")
    return boundaries, facilities, speeds


def road_graph(pbf_path: Path, speeds: dict[str, float]):
    import osmium

    graph = defaultdict(list)
    coordinates = {}
    count = 0

    class Roads(osmium.SimpleHandler):
        def way(self, way):
            nonlocal count
            road_type = way.tags.get("highway")
            if road_type not in speeds or way.tags.get("access") in {"private", "no"} or way.tags.get("motor_vehicle") in {"private", "no"}:
                return
            direction = way.tags.get("oneway")
            forward = direction != "-1"
            reverse = direction not in {"yes", "1", "true", "-1"} and way.tags.get("junction") != "roundabout"
            if direction == "-1":
                reverse = True
            nodes = list(way.nodes)
            for first, second in zip(nodes, nodes[1:]):
                if not first.location.valid() or not second.location.valid():
                    continue
                a = (first.location.lat, first.location.lon)
                b = (second.location.lat, second.location.lon)
                length = haversine_km(*a, *b)
                if length <= 0:
                    continue
                coordinates[first.ref], coordinates[second.ref] = a, b
                # Reverse road directions: routing searches from facility to origins.
                if forward:
                    graph[second.ref].append((first.ref, length / speeds[road_type], length))
                if reverse:
                    graph[first.ref].append((second.ref, length / speeds[road_type], length))
                count += 1

    Roads().apply_file(str(pbf_path), locations=True)
    if not coordinates:
        raise ValueError(f"No routable highways in {pbf_path}; check speed profile")
    return graph, coordinates, count


def node_index(coordinates):
    import numpy as np
    from scipy.spatial import cKDTree

    ids = np.fromiter(coordinates, dtype="int64", count=len(coordinates))
    points = np.asarray([coordinates[node] for node in ids], dtype=float)
    # 3-D unit sphere keeps nearest-node search valid across latitude/longitude.
    lat = np.radians(points[:, 0]); lon = np.radians(points[:, 1])
    xyz = np.column_stack((np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)))
    return ids, cKDTree(xyz)


def snap(ids, tree, latitudes, longitudes, max_snap_km):
    import numpy as np

    lat = np.radians(np.asarray(latitudes)); lon = np.radians(np.asarray(longitudes))
    xyz = np.column_stack((np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)))
    chord, indexes = tree.query(xyz)
    km = 12742.0088 * np.arcsin(np.minimum(1.0, chord / 2))
    return ids[indexes], km <= max_snap_km


def territory_result(country, ident, polygon, raster_path, ids, tree, best, max_snap_km):
    import numpy as np
    import rasterio
    from rasterio.features import geometry_mask
    from rasterio.windows import bounds as window_bounds
    from shapely.geometry import box

    reachable = unreachable = unsnapped = weighted_hours = weighted_km = 0.0
    with rasterio.open(raster_path) as raster:
        if raster.crs is None or raster.crs.to_epsg() != 4326 or raster.count != 1:
            raise ValueError(f"Raster must have one WGS84 band: {raster_path}")
        for _, window in raster.block_windows(1):
            if not polygon.intersects(box(*window_bounds(window, raster.transform))):
                continue
            values = raster.read(1, window=window, masked=True)
            transform = raster.window_transform(window)
            inside = geometry_mask([polygon.__geo_interface__], values.shape, transform=transform, invert=True)
            eligible = inside & ~np.ma.getmaskarray(values) & np.isfinite(values.data) & (values.data > 0)
            rows, cols = np.nonzero(eligible)
            if not len(rows):
                continue
            lon, lat = rasterio.transform.xy(transform, rows, cols, offset="center")
            population = np.asarray(values.data[rows, cols], dtype=float)
            nodes, connected = snap(ids, tree, lat, lon, max_snap_km)
            unsnapped += float(population[~connected].sum())
            for node in np.unique(nodes[connected]):
                weight = float(population[connected & (nodes == node)].sum())
                if int(node) in best:
                    hours, km = best[int(node)]
                    reachable += weight; weighted_hours += weight * hours; weighted_km += weight * km
                else:
                    unreachable += weight
    total = reachable + unreachable + unsnapped
    return {"territory_id": ident, "country": country,
            "reachable_population": reachable, "unreachable_population": unreachable,
            "unsnapped_population": unsnapped,
            "population_weighted_travel_time_hours": weighted_hours / reachable if reachable else None,
            "population_weighted_road_distance_km": weighted_km / reachable if reachable else None,
            "coverage_fraction": reachable / total if total else None}


def run(args):
    if args.max_snap_km <= 0 or not math.isfinite(args.max_snap_km):
        raise ValueError("--max-snap-km must be positive and finite")
    required = [args.boundaries, args.facilities, args.speed_profile, args.territories]
    required += [args.data_dir / name for pair in COUNTRIES.values() for name in pair]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing required input files: " + ", ".join(missing))
    boundaries, facilities, speeds = load_inputs(args.boundaries, args.facilities, args.speed_profile, getattr(args, "allow_osm_maternity_proxy", False))
    expected = {}
    with args.territories.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            expected[row["territory_id"]] = row["country"]
    if len(expected) != 25:
        raise ValueError(f"Expected 25 unique territorial IDs; found {len(expected)}")
    if set(boundaries) != set(expected) or any(boundaries[i][0] != country for i, country in expected.items()):
        raise ValueError("Boundary IDs and countries must match territorial_demographics.csv exactly")
    results = []
    for country, (pbf, tif) in COUNTRIES.items():
        if not facilities[country]:
            raise ValueError(f"No independently verified EmONC destinations for {country}")
        graph, coordinates, edges = road_graph(args.data_dir / pbf, speeds)
        ids, tree = node_index(coordinates)
        source_nodes, connected = snap(ids, tree, [f[1] for f in facilities[country]], [f[2] for f in facilities[country]], args.max_snap_km)
        if not all(connected):
            raise ValueError(f"One or more verified facilities cannot snap to a road in {country}")
        best = shortest_paths(graph, {int(n) for n in source_nodes})
        for ident, (name, polygon) in boundaries.items():
            if name == country:
                result = territory_result(country, ident, polygon, args.data_dir / tif, ids, tree, best, args.max_snap_km)
                result.update(facility_count_verified=len(facilities[country]), road_nodes=len(coordinates), road_edges=edges)
                results.append(result)
    # Refuse partial outputs: a single disconnected territory needs review.
    if len(results) != len(expected) or any(r["population_weighted_travel_time_hours"] is None for r in results):
        raise ValueError("At least one territory has no reachable populated cells")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader(); writer.writerows(results)
    print(f"Wrote {len(results)} exploratory territory results to {args.output}")


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=root / "data" / "geospatial")
    parser.add_argument("--territories", type=Path, default=root / "data" / "model_inputs" / "territorial_demographics.csv")
    parser.add_argument("--boundaries", type=Path, required=True, help="GeoJSON FeatureCollection: territory_id, country, Polygon/MultiPolygon")
    parser.add_argument("--facilities", type=Path, required=True, help="CSV: facility_id,country,latitude,longitude,emonc_verified")
    parser.add_argument("--speed-profile", type=Path, required=True, help="JSON map of OSM highway tag to documented speed in km/h")
    parser.add_argument("--max-snap-km", type=float, required=True, help="Documented maximum road snap distance in km")
    parser.add_argument("--allow-osm-maternity-proxy", action="store_true", help="Allow OSM maternity candidates as an explicitly non-EmONC destination proxy")
    parser.add_argument("--output", type=Path, default=root / "data" / "derived" / "geospatial_access_exploratory.csv")
    run(parser.parse_args())


if __name__ == "__main__":
    main()
