"""Extract local World Bank out-of-pocket expenditure as contextual evidence.

The indicator is the percentage of *current health expenditure* paid
out-of-pocket. It is not a delivery fee, ambulance cost, intervention cost, or
an effect size; this script intentionally does not modify model inputs.
"""
from __future__ import annotations

import argparse
import csv
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERN = str(ROOT / "data" / "economics" / "API_SH.XPD.OOPC.CH.ZS_DS2_en_csv_v2_*.csv")
OUTPUT = ROOT / "data" / "derived" / "world_bank_oop_country_indicators.csv"
COUNTRIES = ("Ethiopia", "Ghana", "Kenya", "Tanzania", "Uganda")


def source_file() -> Path:
    files = [Path(path) for path in glob.glob(PATTERN)]
    if len(files) != 1:
        raise ValueError(f"Expected one WDI OOP file, found {len(files)}")
    return files[0]


def read(year: int, path: Path | None = None) -> list[dict[str, str]]:
    path = path or source_file()
    with path.open(newline="", encoding="utf-8-sig") as handle:
        for _ in range(4):
            next(handle)
        rows = list(csv.DictReader(handle))
    selected = []
    for country in COUNTRIES:
        matches = [row for row in rows if row["Country Name"] == country]
        if len(matches) != 1:
            raise ValueError(f"Expected one WDI row for {country}; found {len(matches)}")
        value = matches[0].get(str(year), "").strip()
        if not value:
            raise ValueError(f"No OOP value for {country} in {year}")
        numeric = float(value)
        if not 0 <= numeric <= 100:
            raise ValueError(f"OOP percentage outside [0,100] for {country}")
        selected.append({
            "country": country,
            "year": str(year),
            "out_of_pocket_share_current_health_expenditure_percent": format(numeric, ".12g"),
            "indicator_code": matches[0]["Indicator Code"],
            "indicator_name": matches[0]["Indicator Name"],
            "source_file": str(path.relative_to(ROOT)).replace("\\", "/"),
            "use_constraint": "Contextual financial-burden indicator only; not a delivery fee, intervention cost, or scenario effect size.",
        })
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2023)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    rows = read(args.year)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} country OOP rows to {args.output}")


if __name__ == "__main__":
    main()
