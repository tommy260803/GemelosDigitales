"""Report alignment between the simulated baseline and its WHO MMR input.

This is a calibration/implementation check, not external validation: the
territorial baseline MMR values were anchored to the same WHO national series.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WHO = ROOT / "data" / "derived" / "who_mmr_country_indicators.csv"
RESULTS = ROOT / "data" / "results" / "final_country_results.csv"
OUTPUT = ROOT / "data" / "results" / "baseline_mmr_alignment_check.csv"


def read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    who = {row["country"]: row for row in read(WHO)}
    baseline = [row for row in read(RESULTS) if row["scenario"] == "baseline"]
    if set(who) != {row["country"] for row in baseline}:
        raise ValueError("WHO MMR country table and baseline results do not contain the same countries")
    rows = []
    for row in sorted(baseline, key=lambda item: item["country"]):
        target = float(who[row["country"]]["horizon_mmr"])
        simulated = float(row["horizon_mmr"])
        rows.append({
            "country": row["country"],
            "who_mmr_year": who[row["country"]]["year"],
            "who_national_mmr": target,
            "simulated_baseline_horizon_mmr": simulated,
            "absolute_difference": simulated - target,
            "relative_difference_percent": (simulated / target - 1) * 100,
            "classification": "CALIBRATION_ALIGNMENT_NOT_EXTERNAL_VALIDATION",
        })
    with OUTPUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} calibration-alignment rows to {OUTPUT}")


if __name__ == "__main__":
    main()
