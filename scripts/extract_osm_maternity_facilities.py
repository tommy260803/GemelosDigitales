"""Extract OSM hospital destination proxies from a local country PBF.

The result is a destination proxy, not a verified EmONC master facility list.
Routing must be explicitly invoked with --allow-osm-maternity-proxy.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path


def hospital_tag(tags) -> bool:
    amenity = str(tags.get("amenity", "")).lower()
    return amenity == "hospital"


# Backwards-compatible alias for callers that imported the former helper.
maternity_tag = hospital_tag


def extract(pbf: Path, country: str, output: Path) -> int:
    import osmium

    found = []

    class Handler(osmium.SimpleHandler):
        def node(self, node):
            if node.location.valid() and hospital_tag(node.tags):
                found.append((str(node.id), float(node.location.lat), float(node.location.lon)))

        def way(self, way):
            if not hospital_tag(way.tags):
                return
            points = [
                (float(node.location.lat), float(node.location.lon))
                for node in way.nodes if node.location.valid()
            ]
            if points:
                found.append((
                    str(way.id),
                    sum(point[0] for point in points) / len(points),
                    sum(point[1] for point in points) / len(points),
                ))

    Handler().apply_file(str(pbf), locations=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as handle:
        fields = ["facility_id", "country", "latitude", "longitude", "emonc_verified",
                  "classification", "verification_source", "verification_year"]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for ident, lat, lon in sorted(set(found)):
            writer.writerow({
                "facility_id": f"osm-{country.lower()}-{ident}",
                "country": country, "latitude": lat, "longitude": lon,
                "emonc_verified": "false",
                "classification": "OSM_HOSPITAL_PROXY",
                "verification_source": "Local OSM PBF amenity=hospital tag",
                "verification_year": "",
            })
    return len(set(found))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pbf", type=Path, required=True)
    parser.add_argument("--country", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    print(f"Extracted {extract(args.pbf, args.country, args.output)} OSM hospital proxies")


if __name__ == "__main__":
    main()
