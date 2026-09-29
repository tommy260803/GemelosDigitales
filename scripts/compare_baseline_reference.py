"""Compare simulated country baseline deaths against a local MMEIG reference.

The reference file is intentionally required and never synthesized. Results
are a reference comparison, not validation unless the reference is independent
of model calibration and temporally/geographically aligned.

``coverage_normalized`` reports the MMR implied by the model itself
(deaths simulated per year / annual births of the model territories * 100,000),
because the simulated territories are a subnational subset and cannot be
compared against national absolute death counts directly.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REFERENCE = ROOT / "data" / "mortality" / "mmeig_absolute_maternal_deaths.csv"
DEFAULT_RESULTS = ROOT / "data" / "results" / "final_country_results.csv"
DEFAULT_OUTPUT = ROOT / "data" / "results" / "mmeig_baseline_reference_comparison.csv"
DEMOGRAPHICS = ROOT / "data" / "model_inputs" / "territorial_demographics.csv"


def rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def births_by_country(path: Path) -> dict[str, float]:
    """Annual births covered by the model territories, per country."""
    totals: dict[str, float] = {}
    for row in rows(path):
        totals[row["country"]] = totals.get(row["country"], 0.0) + float(row["annual_births"])
    return totals


def compare(reference: Path, results: Path, year: int, simulation_months: int,
            demographics: Path = DEMOGRAPHICS) -> list[dict[str, object]]:
    if not reference.is_file():
        raise FileNotFoundError(
            f"MMEIG reference not found: {reference}. No mortality validation result was generated."
        )
    ref_rows = rows(reference)
    required = {"country", "year", "absolute_deaths"}
    if not ref_rows or not required <= set(ref_rows[0]):
        raise ValueError(f"MMEIG reference must contain columns {sorted(required)}")
    reference_by_country = {}
    for row in ref_rows:
        if int(row["year"]) != year:
            continue
        if row["country"] in reference_by_country:
            raise ValueError(f"Duplicate MMEIG country/year row: {row['country']}/{year}")
        reference_by_country[row["country"]] = float(row["absolute_deaths"])
    if simulation_months <= 0:
        raise ValueError("simulation_months must be positive")
    simulated = {
        row["country"]: float(row["cumulative_maternal_deaths"])
        for row in rows(results) if row["scenario"] == "baseline"
    }
    if set(reference_by_country) != set(simulated):
        raise ValueError("MMEIG and simulation countries do not match exactly")
    territory_births = births_by_country(demographics)
    missing_births = sorted(set(reference_by_country) - set(territory_births))
    if missing_births:
        raise ValueError(f"Model territories missing for: {missing_births}")
    return [
        {
            "country": country, "year": year,
            "reference_absolute_deaths": reference_by_country[country],
            "simulated_baseline_deaths_cumulative": simulated[country],
            "simulation_months": simulation_months,
            "simulated_baseline_deaths_annualized": simulated[country] * 12 / simulation_months,
            "absolute_difference_annualized": simulated[country] * 12 / simulation_months - reference_by_country[country],
            "relative_difference_percent_annualized": (simulated[country] * 12 / simulation_months / reference_by_country[country] - 1) * 100,
            "coverage_normalized": simulated[country] * 12 / simulation_months / territory_births[country] * 100000,
            "classification": "EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED",
        }
        for country in sorted(reference_by_country)
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--results", type=Path, default=DEFAULT_RESULTS)
    parser.add_argument("--demographics", type=Path, default=DEMOGRAPHICS)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--simulation-months", type=int, default=36)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = compare(args.reference, args.results, args.year, args.simulation_months, args.demographics)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output[0]))
        writer.writeheader()
        writer.writerows(output)
    print(f"Wrote {len(output)} MMEIG comparison rows to {args.output}")


if __name__ == "__main__":
    main()
