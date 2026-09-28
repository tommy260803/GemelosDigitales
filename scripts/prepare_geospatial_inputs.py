"""Prepare population-weighted road travel inputs from local PBF and WorldPop.

The script processes one model territory at a time. OSM PBF files are read
through GDAL/Pyogrio (no pyosmium dependency), filtered by bounding box, and
discarded after each territory. GADM polygons identify the territorial
catchment. OSM hospitals are intentionally treated as destination proxies,
not verified EmONC facilities; amenity=hospital is not evidence of CEmONC capacity.

This produces modeled road travel times, not observed journey times. The
result is written to data/derived by default; --apply is required to update
geographic_access.csv and provenance.
"""
from __future__ import annotations

import argparse
import csv
import gc
import heapq
import json
import math
import re
from pathlib import Path
from typing import Iterable

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.transform import xy
from rasterio.windows import bounds as window_bounds
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from affine import Affine
from shapely.geometry import Point, box
from pyproj import Geod
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
GEO = DATA / "geospatial"
DEMOGRAPHICS = DATA / "model_inputs" / "territorial_demographics.csv"
ACCESS = DATA / "model_inputs" / "geographic_access.csv"
PROVENANCE = DATA / "model_inputs" / "input_provenance.csv"
OUTPUT = DATA / "derived" / "geospatial_access_empirical.csv"
GEOD = Geod(ellps="WGS84")

COUNTRIES = {
    "Ethiopia": ("ethiopia-260926.osm.pbf", "eth_ppp_2020_UNadj.tif", "ETH"),
    "Ghana": ("ghana-260926.osm.pbf", "gha_ppp_2020_UNadj.tif", "GHA"),
    "Kenya": ("kenya-260926.osm.pbf", "ken_ppp_2020_UNadj.tif", "KEN"),
    "Tanzania": ("tanzania-260926.osm.pbf", "tza_ppp_2020_UNadj.tif", "TZA"),
    "Uganda": ("uganda-260926.osm.pbf", "uga_ppp_2020_UNadj.tif", "UGA"),
}
SPEEDS_KMH = {
    "motorway": 60.0, "trunk": 60.0, "primary": 60.0,
    "secondary": 40.0, "tertiary": 20.0, "unclassified": 20.0,
    "residential": 20.0, "service": 20.0, "track": 20.0, "path": 20.0,
    "primary_link": 60.0, "secondary_link": 40.0,
    "tertiary_link": 20.0,
}
SPEED_PROFILE = GEO / "speed_profile_malaria_atlas_assumption.json"
TAGS_RE = re.compile(r'"([^"]+)"=>"([^"]*)"')
OUTPUT_FIELDS = [
    "territory_id", "territory_name", "country",
    "population_cells", "population_total", "reachable_population",
    "unreachable_population", "unsnapped_population",
    "population_weighted_travel_time_hours",
    "population_weighted_road_distance_km", "coverage_fraction",
    "facility_proxy_count", "road_nodes", "road_edges",
    "boundary_source", "population_source", "road_source",
    "speed_profile_type", "destination_classification",
]


def tags(value: object) -> dict[str, str]:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return {}
    return {key: val for key, val in TAGS_RE.findall(str(value))}


def geodesic_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    _, _, metres = GEOD.inv(a[0], a[1], b[0], b[1])
    return abs(metres) / 1000.0


def expanded_bbox(geometry, buffer_km: float) -> tuple[float, float, float, float]:
    minx, miny, maxx, maxy = geometry.bounds
    lat = max(0.1, abs((miny + maxy) / 2))
    dy = buffer_km / 111.32
    dx = buffer_km / (111.32 * max(math.cos(math.radians(lat)), 0.1))
    return minx - dx, miny - dy, maxx + dx, maxy + dy


def read_chunks(path: Path, layer: str, bbox: tuple[float, float, float, float],
                columns: list[str], chunk_size: int = 100_000) -> Iterable[gpd.GeoDataFrame]:
    import pyogrio

    offset = 0
    while True:
        frame = pyogrio.read_dataframe(
            path, layer=layer, bbox=bbox, columns=columns,
            skip_features=offset, max_features=chunk_size,
            use_arrow=True,
        )
        if frame.empty:
            return
        yield frame
        offset += len(frame)
        if len(frame) < chunk_size:
            return


def load_boundary(country: str, point: Point, boundary_root: Path) -> tuple[object, str]:
    code = COUNTRIES[country][2]
    paths = sorted((boundary_root / country.lower()).glob(f"gadm41_{code}_*.shp"))
    if not paths:
        raise FileNotFoundError(f"No GADM shapefile for {country} under {boundary_root / country.lower()}")
    candidates = [p for p in paths if re.search(r"_[12]\.shp$", p.name)]
    for path in sorted(candidates, key=lambda p: (0 if "_2." in p.name else 1, str(p))):
        frame = gpd.read_file(path)
        frame = frame.to_crs("EPSG:4326")
        matches = frame[frame.geometry.covers(point)]
        if not matches.empty:
            return matches.iloc[0].geometry, str(path.resolve().relative_to(ROOT.resolve())).replace("\\\\", "/")
    raise ValueError(f"Model centroid {point.x},{point.y} is outside GADM level 1/2 polygons for {country}")


def population_origins(raster_path: Path, geometry, max_cells: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, int]:
    with rasterio.open(raster_path) as raster:
        geom = geometry
        if raster.crs is not None and raster.crs.to_epsg() != 4326:
            geom = gpd.GeoSeries([geometry], crs="EPSG:4326").to_crs(raster.crs).iloc[0]
        window = from_bounds(*geom.bounds, transform=raster.transform)
        window = window.round_offsets().round_lengths()
        if window.width <= 0 or window.height <= 0:
            return np.array([]), np.array([]), np.array([]), 0
        factor = max(1, math.ceil(math.sqrt((window.width * window.height) / max_cells)))
        height = max(1, math.ceil(window.height / factor))
        width = max(1, math.ceil(window.width / factor))
        # Rasterio does not support ``sum`` for a plain read (only for warp
        # operations).  Aggregate population cells with an area-preserving
        # average and restore the population total for each coarsened cell.
        values = raster.read(
            1, window=window, out_shape=(height, width),
            resampling=Resampling.average, masked=True,
        )
        if factor > 1:
            values = values * float(factor * factor)
        transform_out = raster.window_transform(window)
        transform_out = transform_out * Affine.scale(factor, factor)
        mask = geometry_mask([geom.__geo_interface__], values.shape, transform=transform_out, invert=True)
        valid = mask & ~np.ma.getmaskarray(values) & np.isfinite(values.data) & (values.data > 0)
        rows, cols = np.nonzero(valid)
        if not len(rows):
            return np.array([]), np.array([]), np.array([]), 0
        longitudes, latitudes = xy(transform_out, rows, cols, offset="center")
        population = np.asarray(values.data[rows, cols], dtype=float)
        return np.asarray(latitudes), np.asarray(longitudes), population, len(rows)


def road_graph(pbf: Path, bbox: tuple[float, float, float, float], speed_profile: dict[str, float]):
    graph: dict[tuple[float, float], list[tuple[tuple[float, float], float, float]]] = {}
    edge_count = 0
    columns = ["highway", "other_tags", "geometry"]
    for frame in read_chunks(pbf, "lines", bbox, columns):
        for row in frame.itertuples(index=False):
            highway = str(row.highway) if row.highway is not None else ""
            speed = speed_profile.get(highway)
            if speed is None or row.geometry is None or row.geometry.is_empty:
                continue
            row_tags = tags(row.other_tags)
            if row_tags.get("access") in {"private", "no"} or row_tags.get("motor_vehicle") in {"private", "no"}:
                continue
            geometries = list(row.geometry.geoms) if row.geometry.geom_type == "MultiLineString" else [row.geometry]
            for geometry in geometries:
                coordinates = [(round(x, 7), round(y, 7)) for x, y in geometry.coords]
                if len(coordinates) < 2:
                    continue
                oneway_value = row_tags.get("oneway", "").lower()
                for first, second in zip(coordinates, coordinates[1:]):
                    distance = geodesic_km((first[1], first[0]), (second[1], second[0]))
                    if distance <= 0:
                        continue
                    hours = distance / speed
                    graph.setdefault(first, [])
                    graph.setdefault(second, [])
                    if oneway_value in {"-1", "reverse"}:
                        graph[second].append((first, hours, distance))
                    else:
                        graph[first].append((second, hours, distance))
                    if oneway_value not in {"yes", "true", "1", "-1", "reverse"}:
                        graph[second].append((first, hours, distance))
                    edge_count += 1
    if not graph:
        raise ValueError(f"No routable OSM roads found in bbox for {pbf}")
    return graph, edge_count


def hospital_destinations(pbf: Path, bbox: tuple[float, float, float, float]) -> list[tuple[float, float]]:
    destinations = []
    for layer in ("points", "multipolygons"):
        for frame in read_chunks(pbf, layer, bbox, ["other_tags", "geometry"]):
            for row in frame.itertuples(index=False):
                row_tags = tags(row.other_tags)
                if row_tags.get("amenity") != "hospital":
                    continue
                if row.geometry is None or row.geometry.is_empty:
                    continue
                point = row.geometry if row.geometry.geom_type == "Point" else row.geometry.representative_point()
                destinations.append((float(point.x), float(point.y)))
    return sorted(set(destinations))


def nearest_nodes(graph: dict, coordinates: list[tuple[float, float]], max_snap_km: float):
    nodes = np.asarray(list(graph), dtype=float)
    xyz = np.column_stack([
        np.cos(np.radians(nodes[:, 1])) * np.cos(np.radians(nodes[:, 0])),
        np.cos(np.radians(nodes[:, 1])) * np.sin(np.radians(nodes[:, 0])),
        np.sin(np.radians(nodes[:, 1])),
    ])
    tree = cKDTree(xyz)
    query = np.asarray([
        [math.cos(math.radians(lat)) * math.cos(math.radians(lon)),
         math.cos(math.radians(lat)) * math.sin(math.radians(lon)),
         math.sin(math.radians(lat))]
        for lon, lat in coordinates
    ])
    chord, indexes = tree.query(query)
    distances = 12742.0088 * np.arcsin(np.minimum(1, chord / 2))
    selected = [
        tuple(nodes[index]) if distance <= max_snap_km else None
        for index, distance in zip(indexes, distances)
    ]
    return selected, distances


def shortest_paths(graph: dict, sources: list[tuple[float, float]]) -> dict[tuple[float, float], tuple[float, float]]:
    best = {node: (0.0, 0.0) for node in sources}
    queue = [(0.0, 0.0, node) for node in sources]
    heapq.heapify(queue)
    while queue:
        hours, distance, node = heapq.heappop(queue)
        if (hours, distance) != best[node]:
            continue
        for other, edge_hours, edge_distance in graph.get(node, []):
            candidate = (hours + edge_hours, distance + edge_distance)
            if candidate < best.get(other, (math.inf, math.inf)):
                best[other] = candidate
                heapq.heappush(queue, (*candidate, other))
    return best


def territorial_result(row, boundary_root: Path, max_cells: int, network_buffer_km: float, max_snap_km: float,
                       speed_profile: dict[str, float], pbf: Path, raster: Path) -> dict[str, object]:
    centroid = Point(float(row["longitude"]), float(row["latitude"]))
    polygon, boundary_source = load_boundary(row["country"], centroid, boundary_root)
    bbox = expanded_bbox(polygon, network_buffer_km)
    graph, edge_count = road_graph(pbf, bbox, speed_profile)
    destinations = hospital_destinations(pbf, bbox)
    if not destinations:
        raise ValueError(f"No OSM hospital proxy destinations in network bbox for {row['territory_id']}")
    destination_nodes, destination_snap = nearest_nodes(graph, destinations, max_snap_km)
    destination_nodes = [node for node in destination_nodes if node is not None]
    if not destination_nodes:
        raise ValueError(f"No OSM hospital proxy destination snaps to road for {row['territory_id']}")
    best = shortest_paths(graph, destination_nodes)
    latitudes, longitudes, population, cell_count = population_origins(raster, polygon, max_cells)
    origin_nodes, origin_snap = nearest_nodes(graph, list(zip(longitudes, latitudes)), max_snap_km)
    reachable = unreachable = unsnapped = weighted_hours = weighted_distance = 0.0
    for index, node in enumerate(origin_nodes):
        weight = float(population[index])
        if node is None:
            unsnapped += weight
        elif node not in best:
            unreachable += weight
        else:
            reachable += weight
            weighted_hours += weight * best[node][0]
            weighted_distance += weight * best[node][1]
    total = reachable + unreachable + unsnapped
    return {
        "territory_id": row["territory_id"], "territory_name": row["territory_name"],
        "country": row["country"], "population_cells": cell_count,
        "population_total": total, "reachable_population": reachable,
        "unreachable_population": unreachable, "unsnapped_population": unsnapped,
        "population_weighted_travel_time_hours": weighted_hours / reachable if reachable else None,
        "population_weighted_road_distance_km": weighted_distance / reachable if reachable else None,
        "coverage_fraction": reachable / total if total else None,
        "facility_proxy_count": len(destinations), "road_nodes": len(graph),
        "road_edges": edge_count, "boundary_source": boundary_source,
        "population_source": str(raster.relative_to(ROOT)).replace("\\\\", "/"),
        "road_source": str(pbf.relative_to(ROOT)).replace("\\\\", "/"),
        "speed_profile_type": "PARAMETRIC_ASSUMPTION",
        "destination_classification": "OSM_HOSPITAL_PROXY_NOT_VERIFIED_EMONC",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--boundary-root", type=Path, default=GEO / "boundaries")
    parser.add_argument("--max-origin-cells", type=int, default=10000)
    parser.add_argument("--network-buffer-km", type=float, default=40)
    parser.add_argument("--max-snap-km", type=float, default=10)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--speed-profile", type=Path, default=SPEED_PROFILE)
    parser.add_argument("--territory-id", help="Process one territory for a smoke test; omit for all 25")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.max_origin_cells <= 0 or args.network_buffer_km <= 0 or args.max_snap_km <= 0:
        raise ValueError("Origin limit and spatial thresholds must be positive")
    with DEMOGRAPHICS.open(newline="", encoding="utf-8-sig") as handle:
        territories = list(csv.DictReader(handle))
    if len(territories) != 25 or len({row["territory_id"] for row in territories}) != 25:
        raise ValueError("Expected exactly 25 unique model territories")
    if args.territory_id:
        territories = [row for row in territories if row["territory_id"] == args.territory_id]
        if not territories:
            raise ValueError(f"Unknown territory_id: {args.territory_id}")
    profile = dict(SPEEDS_KMH)
    if args.speed_profile.is_file():
        with args.speed_profile.open(encoding="utf-8") as handle:
            supplied = json.load(handle).get("speeds_kmh", {})
        if not isinstance(supplied, dict) or not supplied:
            raise ValueError("Speed profile must contain a non-empty speeds_kmh object")
        profile = {str(key): float(value) for key, value in supplied.items()}
        if any(not math.isfinite(value) or value <= 0 for value in profile.values()):
            raise ValueError("Speed profile values must be positive finite km/h")
    results = []
    for index, row in enumerate(territories, start=1):
        pbf_name, raster_name, _ = COUNTRIES[row["country"]]
        print(f"[{index}/25] {row['territory_id']} ({row['country']})")
        results.append(territorial_result(
            row, args.boundary_root, args.max_origin_cells, args.network_buffer_km,
            args.max_snap_km, profile, GEO / pbf_name, GEO / raster_name,
        ))
        gc.collect()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(results)
    if args.apply:
        with ACCESS.open(newline="", encoding="utf-8") as handle:
            access_rows = list(csv.DictReader(handle))
            access_fields = ["territory_id", "avg_distance_to_emonc_km", "avg_travel_time_hours", "road_quality_index", "transport_cost_usd"]
        derived = {row["territory_id"]: row for row in results}
        for row in access_rows:
            source = derived[row["territory_id"]]
            row["avg_distance_to_emonc_km"] = source["population_weighted_road_distance_km"]
            row["avg_travel_time_hours"] = source["population_weighted_travel_time_hours"]
        with ACCESS.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=access_fields)
            writer.writeheader()
            writer.writerows(access_rows)
        with PROVENANCE.open(newline="", encoding="utf-8-sig") as handle:
            provenance_rows = list(csv.DictReader(handle))
            provenance_fields = list(provenance_rows[0]) if provenance_rows else [
                "territory_id", "variable_name", "source_type", "source_file",
                "derivation_method", "original_value", "final_value",
                "transformation", "notes",
            ]
        provenance = {
            (item["territory_id"], item["variable_name"]): item
            for item in provenance_rows
        }
        for item in results:
            for variable, value in (
                ("avg_distance_to_emonc_km", item["population_weighted_road_distance_km"]),
                ("avg_travel_time_hours", item["population_weighted_travel_time_hours"]),
            ):
                key = (item["territory_id"], variable)
                prior = provenance.get(key, {})
                provenance[key] = {
                    "territory_id": item["territory_id"], "variable_name": variable,
                    "source_type": "DERIVED_MODEL_INPUT",
                    "source_file": str(args.output.relative_to(ROOT)).replace("\\\\", "/"),
                    "derivation_method": "population-weighted shortest modeled road path",
                    "original_value": prior.get("final_value", ""),
                    "final_value": value, "transformation": "OSM PBF + WorldPop + GADM",
                    "notes": "OSM hospital destination proxy; speed profile is parametric; not observed travel time or verified EmONC.",
                }
        with PROVENANCE.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=provenance_fields)
            writer.writeheader()
            writer.writerows(provenance.values())
    print(f"Wrote {len(results)} territory geospatial rows to {args.output}")


if __name__ == "__main__":
    main()
