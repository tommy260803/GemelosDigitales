"""Anchor territorial baseline MMR to the local WHO country estimates.

This does not claim that WHO reports territory-level MMR.  It preserves the
existing within-country relative pattern and scales it so that the
annual-birth-weighted mean for each country equals the selected WHO estimate.
Run without --apply to validate and write only the derived country table.
"""
from __future__ import annotations

import argparse
import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WHO_FILE = ROOT / "data" / "mortality" / "MDG_0000000026.csv"
DEMOGRAPHICS = ROOT / "data" / "model_inputs" / "territorial_demographics.csv"
PROVENANCE = ROOT / "data" / "model_inputs" / "input_provenance.csv"
DERIVED = ROOT / "data" / "derived" / "who_mmr_country_indicators.csv"
COUNTRY_CODES = {
    "Ethiopia": "ETH", "Ghana": "GHA", "Kenya": "KEN",
    "Tanzania": "TZA", "Uganda": "UGA",
}
PROVENANCE_FIELDS = (
    "territory_id", "variable_name", "source_type", "source_file",
    "derivation_method", "original_value", "final_value", "transformation",
    "notes",
)


def read_csv(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return list(reader), list(reader.fieldnames or ())


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str] | tuple[str, ...]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def who_estimates(year: int, path: Path = WHO_FILE) -> dict[str, dict[str, float | str]]:
    rows, fields = read_csv(path)
    required = {
        "IndicatorCode", "SpatialDimension", "SpatialDimensionValueCode",
        "TimeDim", "NumericValue", "Low", "High", "Value",
    }
    missing = required - set(fields)
    if missing:
        raise ValueError(f"WHO file missing columns: {sorted(missing)}")
    values: dict[str, dict[str, float | str]] = {}
    for country, code in COUNTRY_CODES.items():
        candidates = [
            row for row in rows
            if row["IndicatorCode"] == "MDG_0000000026"
            and row["SpatialDimension"] == "COUNTRY"
            and row["SpatialDimensionValueCode"] == code
            and row["TimeDim"] == str(year)
            and not row.get("DisaggregatingDimension1")
            and not row.get("DisaggregatingDimension2")
            and not row.get("DisaggregatingDimension3")
        ]
        if len(candidates) != 1:
            raise ValueError(f"Expected exactly one national MMR estimate for {country} in {year}; found {len(candidates)}")
        row = candidates[0]
        numeric = float(row["NumericValue"])
        if not math.isfinite(numeric) or numeric <= 0:
            raise ValueError(f"Invalid WHO MMR for {country}: {row['NumericValue']}")
        values[country] = {
            "country": country, "year": str(year), "horizon_mmr": numeric,
            "low": row["Low"], "high": row["High"], "display_value": row["Value"],
        }
    return values


def anchor(rows: list[dict[str, str]], estimates: dict[str, dict[str, float | str]]) -> list[dict[str, str]]:
    result = [dict(row) for row in rows]
    for country, estimate in estimates.items():
        subset = [row for row in result if row["country"] == country]
        if len(subset) != 5:
            raise ValueError(f"Expected five territories for {country}; found {len(subset)}")
        births = sum(float(row["annual_births"]) for row in subset)
        prior_mean = sum(float(row["annual_births"]) * float(row["baseline_mmr"]) for row in subset) / births
        target = float(estimate["horizon_mmr"])
        factor = target / prior_mean
        if not math.isfinite(factor) or factor <= 0:
            raise ValueError(f"Invalid MMR anchor factor for {country}")
        for row in subset:
            row["baseline_mmr"] = format(float(row["baseline_mmr"]) * factor, ".12g")
    return result


def build_provenance(original: list[dict[str, str]], final: list[dict[str, str]], estimates: dict[str, dict[str, float | str]]) -> list[dict[str, str]]:
    prior, fields = read_csv(PROVENANCE)
    if not set(PROVENANCE_FIELDS) <= set(fields):
        raise ValueError("Unexpected input provenance schema")
    by_key = {(row["territory_id"], row["variable_name"]): row for row in prior}
    originals = {row["territory_id"]: row for row in original}
    for row in final:
        old = originals[row["territory_id"]]
        estimate = estimates[row["country"]]
        by_key[(row["territory_id"], "baseline_mmr")] = {
            "territory_id": row["territory_id"],
            "variable_name": "baseline_mmr",
            "source_type": "EMPIRICALLY_ANCHORED",
            "source_file": "data/mortality/MDG_0000000026.csv",
            "derivation_method": "annual-birth-weighted national multiplicative anchoring",
            "original_value": old["baseline_mmr"],
            "final_value": row["baseline_mmr"],
            "transformation": "territory_mmr * (WHO national MMR / prior annual-birth-weighted country MMR)",
            "notes": f"WHO national MMR estimate for {row['country']}, {estimate['year']}: {estimate['display_value']}. Not a territory-level observation.",
        }
    return list(by_key.values())


def report(rows: list[dict[str, str]], estimates: dict[str, dict[str, float | str]]) -> None:
    for country, estimate in estimates.items():
        subset = [row for row in rows if row["country"] == country]
        births = sum(float(row["annual_births"]) for row in subset)
        mean = sum(float(row["annual_births"]) * float(row["baseline_mmr"]) for row in subset) / births
        if not math.isclose(mean, float(estimate["horizon_mmr"]), rel_tol=0, abs_tol=1e-8):
            raise AssertionError(f"Anchoring failed for {country}")
        print(f"{country}: weighted territorial MMR={mean:.6f}; WHO={float(estimate['horizon_mmr']):.6f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2023)
    parser.add_argument("--apply", action="store_true", help="Update structured demographics and provenance")
    args = parser.parse_args()
    original, fields = read_csv(DEMOGRAPHICS)
    required = {"territory_id", "country", "annual_births", "baseline_mmr"}
    if required - set(fields):
        raise ValueError("territorial_demographics.csv lacks required MMR anchoring columns")
    estimates = who_estimates(args.year)
    final = anchor(original, estimates)
    report(final, estimates)
    write_csv(DERIVED, list(estimates.values()), ["country", "year", "horizon_mmr", "low", "high", "display_value"])
    if args.apply:
        write_csv(DEMOGRAPHICS, final, fields)
        write_csv(PROVENANCE, build_provenance(original, final, estimates), PROVENANCE_FIELDS)
    print(f"Wrote {DERIVED.relative_to(ROOT)}; {'updated model inputs' if args.apply else 'model inputs unchanged'}.")


if __name__ == "__main__":
    main()
