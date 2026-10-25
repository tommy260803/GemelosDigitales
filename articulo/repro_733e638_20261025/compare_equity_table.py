"""Compare every reproduced Garissa equity cell at the manuscript precision."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "results"
EXPECTED = {
    "q1_poorest": {"population_share": "22.43", "baseline_mmr": "890", "simulated_baseline_mmr": "438.46", "simulated_mmr": "169.39", "lives_saved": "300.11", "relative_reduction": "61.37", "fiscal_cost_usd": "2943974.58", "cost_per_life_saved_in_q": "9809.57"},
    "q2_poor": {"population_share": "17.98", "baseline_mmr": "760", "simulated_baseline_mmr": "442.51", "simulated_mmr": "138.32", "lives_saved": "340.54", "relative_reduction": "68.74", "fiscal_cost_usd": "2359264.20", "cost_per_life_saved_in_q": "6928.08"},
    "q3_middle": {"population_share": "17.62", "baseline_mmr": "610", "simulated_baseline_mmr": "442.86", "simulated_mmr": "156.23", "lives_saved": "321.10", "relative_reduction": "64.72", "fiscal_cost_usd": "2312998.20", "cost_per_life_saved_in_q": "7203.33"},
    "q4_richer": {"population_share": "20.32", "baseline_mmr": "490", "simulated_baseline_mmr": "443.08", "simulated_mmr": "167.52", "lives_saved": "308.77", "relative_reduction": "62.19", "fiscal_cost_usd": "2666365.45", "cost_per_life_saved_in_q": "8635.48"},
    "q5_richest": {"population_share": "21.66", "baseline_mmr": "340", "simulated_baseline_mmr": "443.21", "simulated_mmr": "174.63", "lives_saved": "301.39", "relative_reduction": "60.60", "fiscal_cost_usd": "2842491.25", "cost_per_life_saved_in_q": "9431.17"},
}

def main():
    out = RESULTS / "equity_full_table_comparison.csv"
    summary_path = RESULTS / "equity_full_table_comparison.json"
    if out.exists() or summary_path.exists():
        raise FileExistsError("Refusing to overwrite prior comparison artifact")
    with (RESULTS / "equity_garissa_scenario_d_36m.csv").open(newline="", encoding="utf-8") as stream:
        actual = {row["quintile"]: row for row in csv.DictReader(stream)}
    rows = []
    for quintile, expected in EXPECTED.items():
        row = {"quintile": quintile}
        matches = []
        for field, printed in expected.items():
            value = float(actual[quintile][field])
            value = value * 100 if field == "population_share" else value
            precision = len(printed.split(".")[1]) if "." in printed else 0
            formatted = f"{value:.{precision}f}"
            match = formatted == printed
            row[f"reproduced_{field}"] = actual[quintile][field]
            row[f"manuscript_{field}"] = printed
            row[f"{field}_match"] = match
            matches.append(match)
        row["all_cells_match_at_published_precision"] = all(matches)
        rows.append(row)
    with out.open("x", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)
    summary = {"quintiles_compared": len(rows), "cells_per_quintile": len(EXPECTED["q1_poorest"]), "all_published_cells_match_at_published_precision": all(r["all_cells_match_at_published_precision"] for r in rows), "rounding_or_adjustment_applied": False}
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    main()
