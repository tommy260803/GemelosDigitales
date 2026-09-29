"""Re-apply an already-computed geospatial access CSV without recomputing.

Mirrors the ``--apply`` block of prepare_geospatial_inputs.py: reads the
derived CSV written by a finished run and updates geographic_access.csv plus
input_provenance.csv. Use it when the pipeline finished but --apply failed.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ACCESS = DATA / "model_inputs" / "geographic_access.csv"
PROVENANCE = DATA / "model_inputs" / "input_provenance.csv"
DEFAULT_INPUT = DATA / "derived" / "geospatial_access_empirical.csv"
ACCESS_FIELDS = [
    "territory_id", "avg_distance_to_emonc_km", "avg_travel_time_hours",
    "road_quality_index", "transport_cost_usd",
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT,
                        help="Derived CSV written by prepare_geospatial_inputs.py")
    parser.add_argument("--dry-run", action="store_true",
                        help="Report what would change without writing files")
    args = parser.parse_args()

    source = (args.input if args.input.is_absolute() else Path.cwd() / args.input).resolve()
    try:
        source_file = str(source.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        source_file = str(source)

    with source.open(newline="", encoding="utf-8") as handle:
        results = list(csv.DictReader(handle))
    if not results:
        raise ValueError(f"No rows in {source}")
    if len({row["territory_id"] for row in results}) != len(results):
        raise ValueError("Duplicate territory_id rows in derived geospatial CSV")
    derived = {row["territory_id"]: row for row in results}

    with ACCESS.open(newline="", encoding="utf-8") as handle:
        access_rows = list(csv.DictReader(handle))
    missing = sorted({row["territory_id"] for row in access_rows} - set(derived))
    if missing:
        raise ValueError(f"Derived CSV lacks territory rows: {missing}")
    for row in access_rows:
        source_row = derived[row["territory_id"]]
        row["avg_distance_to_emonc_km"] = source_row["population_weighted_road_distance_km"]
        row["avg_travel_time_hours"] = source_row["population_weighted_travel_time_hours"]

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
    updated = 0
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
                "source_file": source_file,
                "derivation_method": "population-weighted shortest modeled road path",
                "original_value": prior.get("final_value", ""),
                "final_value": value, "transformation": "OSM PBF + WorldPop + GADM",
                "notes": "OSM hospital destination proxy; speed profile is parametric; not observed travel time or verified EmONC.",
            }
            updated += 1

    print(f"source={source_file} rows={len(results)} access={len(access_rows)} provenance={updated}")
    if args.dry_run:
        print("Dry run: no files written")
        return

    with ACCESS.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=ACCESS_FIELDS)
        writer.writeheader()
        writer.writerows(access_rows)
    with PROVENANCE.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=provenance_fields)
        writer.writeheader()
        writer.writerows(provenance.values())
    print(f"Wrote {ACCESS.relative_to(ROOT)} and {PROVENANCE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
