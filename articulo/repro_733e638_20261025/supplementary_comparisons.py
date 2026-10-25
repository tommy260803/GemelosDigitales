"""Compare saved reproduction artifacts with the manuscript's reported values."""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "results"

EXPECTED = {
    "skilled_staff_ratio": ("0.9424", "0.2623", "0.9546", "0.2672"),
    "blood_availability_rate": ("0.0341", "0.0868", "0.0550", "0.0257"),
    "road_quality_index": ("0.0011", "0.0174", "0.0028", "0.0008"),
    "travel_time_hours": ("-0.0015", "0.0068", "0.0004", "0.0001"),
    "community_trust_baseline": ("-0.0012", "0.0035", "0.0001", "0.00006"),
    "transport_cost_usd": ("0.0000", "0.0000", "0.0000", "0.0000"),
    "facility_delivery_fee_usd": ("0.0000", "0.0000", "0.0000", "0.0000"),
    "insurance_coverage_rate": ("0.0000", "0.0000", "0.0000", "0.0000"),
}


def main() -> None:
    for output in (RESULTS / "sobol_comparison_to_article.csv",):
        if output.exists():
            raise FileExistsError(f"Refusing to overwrite: {output}")

    reproduced = {}
    with (RESULTS / "sobol_garissa_scenario_d_12m_indices.csv").open(newline="", encoding="utf-8") as stream:
        reproduced = {row["parameter"]: row for row in csv.DictReader(stream)}
    rows = []
    for parameter, expected in EXPECTED.items():
        result = reproduced[parameter]
        actual = (result["S1"], result["S1_conf"], result["ST"], result["ST_conf"])
        names = ("S1", "S1_conf", "ST", "ST_conf")
        row = {"parameter": parameter}
        flags = []
        for name, value, published in zip(names, actual, expected):
            precision = len(published.split(".")[1])
            formatted = f"{float(value):.{precision}f}"
            row[f"reproduced_{name}"] = value
            row[f"manuscript_{name}"] = published
            row[f"{name}_matches_at_published_precision"] = formatted == published
            flags.append(formatted == published)
        row["all_four_match_at_published_precision"] = all(flags)
        rows.append(row)
    with (RESULTS / "sobol_comparison_to_article.csv").open("x", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    mc = json.loads((RESULTS / "monte_carlo_comparison.json").read_text(encoding="utf-8"))
    equity = json.loads((RESULTS / "equity_comparison.json").read_text(encoding="utf-8"))
    sobol_all_match = all(row["all_four_match_at_published_precision"] for row in rows)
    summary = {
        "sobol_all_8_parameters_match_at_published_precision": sobol_all_match,
        "sobol_parameters_compared": len(rows),
        "monte_carlo_mean_and_percentiles_match_at_published_precision": mc["rounded_means_and_intervals_match"],
        "equity_rounded_quintile_mmr_and_gap_match": equity["reproduction_rounded_values_match"] and round(equity["absolute_q1_q5_gap"], 2) == 5.24,
        "garissa_quintile_input_rows_used": 5,
        "quintile_input_source": "data/model_inputs/quintile_coverage_by_district.csv at source commit 733e63816e424bed53f2094646f46f6ca93955e4",
        "no_simulation_executed_by_this_comparator": True,
    }
    summary_path = RESULTS / "supplementary_comparison_summary.json"
    if summary_path.exists():
        raise FileExistsError(f"Refusing to overwrite: {summary_path}")
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
