"""Extract DHS wealth-quintile coverage gradients for equity simulation.

Extends the hybrid-input ETL (`build_final_hybrid_inputs.py`, same helpers and
same national-anchoring philosophy):

1. For each repository DHS IR file, computes weighted coverage rates (ANC1,
   ANC4, institutional delivery) by wealth quintile (v190) among births in the
   last 59 months, plus the country overall rates from the same records.
2. Writes `data/derived/dhs_quintile_indicators.csv` (country x quintile).
3. Writes `data/model_inputs/quintile_coverage_by_district.csv`: each
   district's own input rate multiplied by the real DHS gradient
   (country_quintile / country_overall), so district levels are preserved and
   the wealth gradient comes exclusively from the microdata.
4. Appends idempotent rows to `data/model_inputs/input_provenance.csv`.

Run after `build_final_hybrid_inputs.py` (which rewrites the provenance file):
    python scripts/build_quintile_coverage.py
"""
from __future__ import annotations

import csv
import math
from pathlib import Path
from typing import Any

import pandas as pd

from build_final_hybrid_inputs import (
    FILES,
    RAW,
    ROOT,
    _institutional,
    _label_metadata,
    _numeric,
    _valid_count,
    _weighted_rate,
)

INPUT = ROOT / "data" / "model_inputs"
DERIVED = ROOT / "data" / "derived"
PROVENANCE = INPUT / "input_provenance.csv"

QUINTILE_KEYS = {1: "q1_poorest", 2: "q2_poor", 3: "q3_middle", 4: "q4_richer", 5: "q5_richest"}
METRICS = ("anc1_rate", "anc4_rate", "institutional_delivery_rate")


def _clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


def _quintile_births(country: str, path: Path) -> tuple[pd.DataFrame, dict[str, dict[str, float]]]:
    """Return birth-level records and weighted country overall rates."""
    variables, labels = _label_metadata(path)
    needed = ["v005", "v008", "v190"]
    for prefix, fmt in (("b3_", "{:02d}"), ("m14_", "{:d}"), ("m15_", "{:d}")):
        for i in range(1, 7):
            name = f"{prefix}{fmt.format(i)}"
            if name in variables:
                needed.append(name)
    df = pd.read_stata(path, columns=sorted(set(needed)), convert_categoricals=False)
    df = df.copy()
    df["weight"] = pd.to_numeric(df["v005"], errors="coerce") / 1_000_000

    records: list[dict[str, Any]] = []
    for _, woman in df.iterrows():
        for position in range(1, 7):
            b3 = f"b3_{position:02d}"
            if b3 not in df:
                continue
            birth_cmc, interview_cmc = _numeric(woman.get(b3)), _numeric(woman.get("v008"))
            if birth_cmc is None or interview_cmc is None or not 0 <= interview_cmc - birth_cmc <= 59:
                continue
            quintile = _numeric(woman.get("v190"))
            if quintile is None or int(quintile) not in QUINTILE_KEYS:
                continue
            m14 = _valid_count(woman.get(f"m14_{position}"))
            records.append({
                "weight": woman["weight"],
                "quintile": int(quintile),
                "anc1_rate": None if m14 is None else m14 > 0,
                "anc4_rate": None if m14 is None else m14 >= 4,
                "institutional_delivery_rate": _institutional(
                    woman.get(f"m15_{position}"), labels.get(f"m15_{position}", {})
                ),
            })
    births = pd.DataFrame(records)
    if births.empty:
        raise ValueError(f"{path.name}: no eligible births extracted")
    overall = {metric: _weighted_rate(births, metric) for metric in METRICS}
    return births, overall


def build_quintile_tables() -> tuple[list[dict[str, Any]], dict[str, dict[int, dict[str, Any]]]]:
    country_rows: list[dict[str, Any]] = []
    by_country: dict[str, dict[int, dict[str, Any]]] = {}
    for country, filename in FILES.items():
        births, overall = _quintile_births(country, RAW / filename)
        v190_labels = _label_metadata(RAW / filename)[1].get("v190", {})
        quintiles: dict[int, dict[str, Any]] = {}
        for code, group in births.groupby("quintile"):
            code = int(code)
            row = {
                "country": country,
                "quintile": QUINTILE_KEYS[code],
                "label": f"Q{code} {str(v190_labels.get(code, QUINTILE_KEYS[code].split('_')[1])).lower()}",
                "quintile_code": code,
                "unweighted_n": int(len(group)),
                "weighted_denominator": float(group["weight"].sum()),
            }
            for metric in METRICS:
                row[metric] = _weighted_rate(group, metric)
                row[f"overall_{metric}"] = overall[metric]
            for metric in METRICS:
                value, base = row[metric], row[f"overall_{metric}"]
                if value is None or base is None or base <= 0:
                    row[f"factor_{metric}"] = None
                else:
                    row[f"factor_{metric}"] = value / base
            quintiles[code] = row
            country_rows.append(row)
        if set(quintiles) != {1, 2, 3, 4, 5}:
            raise ValueError(f"{country}: expected quintiles 1-5, got {sorted(quintiles)}")
        shares = [quintiles[c]["weighted_denominator"] for c in sorted(quintiles)]
        total = sum(shares)
        if total <= 0:
            raise ValueError(f"{country}: non-positive weighted denominator")
        for code, row in quintiles.items():
            row["population_share"] = row["weighted_denominator"] / total
        by_country[country] = quintiles
        print(f"{country}: {len(births)} eligible births, overall " +
              ", ".join(f"{m}={overall[m]:.3f}" for m in METRICS))
    return country_rows, by_country


def _read_dict(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _write_dict(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_district_quintiles(by_country: dict[str, dict[int, dict[str, Any]]]) -> list[dict[str, Any]]:
    demographics = {row["territory_id"]: row for row in _read_dict(INPUT / "territorial_demographics.csv")}
    context = {row["territory_id"]: row for row in _read_dict(INPUT / "maternal_health_context.csv")}
    rows: list[dict[str, Any]] = []
    provenance: list[dict[str, Any]] = []
    for territory_id, demo in demographics.items():
        country = demo["country"]
        if country not in by_country:
            raise ValueError(f"{territory_id}: country {country} has no quintile table")
        ctx = context[territory_id]
        for code in sorted(by_country[country]):
            qrow = by_country[country][code]
            entry = {
                "territory_id": territory_id,
                "country": country,
                "quintile": QUINTILE_KEYS[code],
                "label": qrow["label"],
                "population_share": f"{qrow['population_share']:.6f}",
                "unweighted_n": qrow["unweighted_n"],
                "weighted_denominator": f"{qrow['weighted_denominator']:.6f}",
                "source_type": "EMPIRICAL_DHS_STRATIFIED",
                "source_file": f"data/dhs/{FILES[country]}",
                "derivation_method": "district input rate x (DHS country quintile rate / DHS country overall rate), weighted with v005",
            }
            for metric in METRICS:
                factor = qrow[f"factor_{metric}"]
                if factor is None:
                    raise ValueError(f"{country} {QUINTILE_KEYS[code]}: missing {metric} gradient")
                base = float(ctx[metric])
                value = _clamp(base * factor)
                entry[metric] = f"{value:.10f}"
                provenance.append({
                    "territory_id": territory_id,
                    "variable_name": f"quintile_coverage.{QUINTILE_KEYS[code]}.{metric}",
                    "source_type": "EMPIRICAL_DHS_STRATIFIED",
                    "source_file": f"data/dhs/{FILES[country]}",
                    "derivation_method": f"district {metric} x DHS national quintile gradient (v005-weighted, births <60 months)",
                    "original_value": f"{base:.10f}",
                    "final_value": f"{value:.10f}",
                    "transformation": "value * (dhs_country_quintile / dhs_country_overall), clamped to [0,1]",
                    "notes": "District level preserved; wealth gradient imported from DHS microdata. Run after build_final_hybrid_inputs.py, which rewrites this file.",
                })
            rows.append(entry)
    if len(rows) != 125:
        raise ValueError(f"expected 125 district-quintile rows, got {len(rows)}")
    return rows, provenance


def append_provenance(new_rows: list[dict[str, Any]]) -> None:
    existing = [row for row in _read_dict(PROVENANCE)
                if not str(row.get("variable_name", "")).startswith("quintile_coverage.")]
    fieldnames = ["territory_id", "variable_name", "source_type", "source_file",
                  "derivation_method", "original_value", "final_value", "transformation", "notes"]
    _write_dict(PROVENANCE, existing + new_rows, fieldnames)


def build() -> None:
    country_rows, by_country = build_quintile_tables()
    DERIVED.mkdir(parents=True, exist_ok=True)
    _write_dict(DERIVED / "dhs_quintile_indicators.csv", country_rows, [
        "country", "quintile", "label", "quintile_code", "unweighted_n", "weighted_denominator",
        *METRICS,
        *[f"overall_{m}" for m in METRICS],
        *[f"factor_{m}" for m in METRICS],
        "population_share",
    ])
    district_rows, provenance = write_district_quintiles(by_country)
    _write_dict(INPUT / "quintile_coverage_by_district.csv", district_rows, [
        "territory_id", "country", "quintile", "label", "population_share",
        "unweighted_n", "weighted_denominator", *METRICS,
        "source_type", "source_file", "derivation_method",
    ])
    append_provenance(provenance)
    print(f"Wrote {len(country_rows)} country-quintile rows, {len(district_rows)} district-quintile rows, "
          f"{len(provenance)} provenance rows.")


if __name__ == "__main__":
    build()
