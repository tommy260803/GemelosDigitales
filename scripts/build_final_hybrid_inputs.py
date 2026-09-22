"""Build reproducible DHS-anchored hybrid inputs without altering raw DHS files.

The script first snapshots the Phase-2.1 CSVs on first use, then always rebuilds
the final inputs from that immutable local snapshot and the five repository DTA
files.  DHS provenance remains unverified externally; labels embedded in each
file are nevertheless used for country-specific classification.
"""
from __future__ import annotations

import argparse
import csv
import math
import shutil
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "dhs"
INPUT = ROOT / "data" / "model_inputs"
BASELINE = INPUT / "pre_hybrid_phase_2_1"
DERIVED = ROOT / "data" / "derived"

FILES = {
    "Ethiopia": "ETIR8AFL.dta", "Ghana": "GHIR8CFL.DTA", "Kenya": "KEIR8CFL.DTA",
    "Tanzania": "TZIR82FL.DTA", "Uganda": "UGIR7BFL.DTA",
}
INPUT_FILES = ["territorial_demographics.csv", "maternal_health_context.csv", "health_system_capacity.csv", "geographic_access.csv", "model_context.csv"]
ANCHORS = {
    "anc1_rate": ("anc1_rate", "annual_births"),
    "anc4_rate": ("anc4_rate", "annual_births"),
    "institutional_delivery_rate": ("institutional_delivery_rate", "annual_births"),
    "cesarean_rate": ("cesarean_rate", "annual_births"),
    "tba_prevalence": ("tba_rate", "annual_births"),
    "insurance_coverage_rate": ("insurance_coverage_rate", "population"),
    "female_education_rate": ("female_secondary_plus_rate", "population"),
}


def _numeric(value: Any) -> float | None:
    try:
        value = float(value)
        return value if math.isfinite(value) else None
    except (TypeError, ValueError):
        return None


def _weighted_rate(frame: pd.DataFrame, column: str) -> float | None:
    values = frame[[column, "weight"]].dropna()
    if values.empty or values["weight"].sum() <= 0:
        return None
    return float((values[column] * values["weight"]).sum() / values["weight"].sum())


def _label_metadata(path: Path) -> tuple[dict[str, str], dict[str, dict[Any, str]]]:
    reader = pd.io.stata.StataReader(path)
    variables = reader.variable_labels()
    reader.value_labels()  # Populate the reader's documented metadata structures.
    label_sets = dict(zip(variables.keys(), reader._lbllist))
    labels = {name: reader._value_label_dict.get(set_name, {}) for name, set_name in label_sets.items()}
    return dict(variables), labels


def _yes(value: Any, labels: dict[Any, str]) -> bool | None:
    number = _numeric(value)
    if number is None:
        return None
    text = labels.get(int(number), labels.get(number, "")).strip().lower()
    if text == "yes":
        return True
    if text == "no":
        return False
    return None


def _assistant_state(value: Any, labels: dict[Any, str]) -> tuple[bool, bool]:
    """Return (observed, assistant-present) from a country-specific m3 label."""
    number = _numeric(value)
    if number is None:
        return False, False
    text = labels.get(int(number), labels.get(number, "")).strip().lower()
    if text == "yes":
        return True, True
    if text == "no":
        return True, False
    # Some files encode the no-one category as 'yes: no assistance' or
    # 'no: some assistance'; both are observed, but neither names an assistant.
    if "no assistance" in text or "some assistance" in text:
        return True, False
    return False, False


def _skilled_label(text: str) -> bool:
    """Classify only explicitly named professional cadres.

    Assistant nurses, MCH aides, nursing aides, extension workers and CHWs are
    not promoted to SBA merely because a substring resembles a professional
    term. Assistant clinical officers remain included because the label itself
    explicitly identifies a clinical officer cadre.
    """
    text = text.lower()
    excluded = ("assistant nurse", "nursing aide", "mch aide", "health extension worker", "community health worker")
    if any(term in text for term in excluded):
        return False
    return any(term in text for term in ("doctor", "nurse/midwife", "nurse", "midwife", "health officer", "clinical officer", "medical assistant"))


def _problem(value: Any, labels: dict[Any, str]) -> bool | None:
    number = _numeric(value)
    if number is None:
        return None
    text = labels.get(int(number), labels.get(number, "")).strip().lower()
    if text == "big problem":
        return True
    if text == "not a big problem":
        return False
    return None


def _institutional(value: Any, labels: dict[Any, str]) -> bool | None:
    number = _numeric(value)
    if number is None:
        return None
    text = labels.get(int(number), labels.get(number, "")).lower()
    # Classify only observed place labels. Sector headers and 'other' remain NA.
    if text in {"", "home", "respondent's home", "her home", "other home", "tba premises", "on the way to the hospital", "other"}:
        return False if text and text != "other" else None
    facility_terms = ("hospital", "health center", "health centre", "health post", "clinic", "dispensary", "polyclinic", "maternity home", "medical sector", "chps", "outreach")
    return True if any(term in text for term in facility_terms) else None


def _valid_count(value: Any) -> float | None:
    number = _numeric(value)
    return number if number is not None and 0 <= number < 98 else None


def _national_women(frame: pd.DataFrame) -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    education = frame["v106"].map(lambda value: _numeric(value)) if "v106" in frame else pd.Series(dtype=float)
    # DHS labels use 2=secondary and 3=higher across these five inspected files;
    # confirm semantically through labels before treating the result as usable.
    out["female_secondary_plus_rate"] = _weighted_rate(pd.DataFrame({"indicator": education.map(lambda x: None if x is None else x >= 2), "weight": frame["weight"]}), "indicator")
    for source, target in [("v481", "insurance_coverage_rate"), ("v467b", "permission_barrier_rate"), ("v467c", "money_barrier_rate"), ("v467d", "distance_barrier_rate")]:
        out[target] = _weighted_rate(frame, target) if target in frame else None
    return out


def process_country(country: str, path: Path) -> tuple[dict[str, Any], pd.DataFrame, dict[str, Any]]:
    variables, labels = _label_metadata(path)
    needed = [x for x in ["v005", "v007", "v008", "v021", "v022", "v023", "v024", "v025", "v106", "v107", "v190", "v191", "v201", "v208", "v467b", "v467c", "v467d", "v481"] if x in variables]
    for prefix in ["b3_", "m13_", "m14_", "m15_", "m17_"]:
        needed.extend([f"{prefix}{i:02d}" if prefix == "b3_" else f"{prefix}{i}" for i in range(1, 7) if (f"{prefix}{i:02d}" if prefix == "b3_" else f"{prefix}{i}") in variables])
    needed.extend([f"m3{letter}_{i}" for letter in "abcdefghijklmn" for i in range(1, 7) if f"m3{letter}_{i}" in variables])
    df = pd.read_stata(path, columns=sorted(set(needed)), convert_categoricals=False)
    # Avoid pandas fragmentation warnings while adding the derived columns.
    df = df.copy()
    df["weight"] = pd.to_numeric(df["v005"], errors="coerce") / 1_000_000
    df["dhs_region_code"] = df.get("v024")
    df["dhs_region_name"] = df.get("v024", pd.Series(index=df.index)).map(lambda value: labels.get("v024", {}).get(int(value), None) if _numeric(value) is not None else None)
    for source, target in [("v481", "insurance_coverage_rate"), ("v467b", "permission_barrier_rate"), ("v467c", "money_barrier_rate"), ("v467d", "distance_barrier_rate")]:
        mapper = _yes if source == "v481" else _problem
        df[target] = df[source].map(lambda value, s=source, m=mapper: m(value, labels.get(s, {}))) if source in df else None
    education_labels = labels.get("v106", {})
    df["female_secondary_plus_rate"] = df.get("v106", pd.Series(index=df.index)).map(lambda value: (lambda t: True if t in {"secondary", "higher"} else False if t in {"no education", "primary"} else None)(education_labels.get(int(value), "").lower()) if _numeric(value) is not None else None)

    births: list[dict[str, Any]] = []
    # Variable family semantics repeat by position; construct each birth once.
    for index, woman in df.iterrows():
        for position in range(1, 7):
            b3 = f"b3_{position:02d}"
            if b3 not in df:
                continue
            birth_cmc, interview_cmc = _numeric(woman.get(b3)), _numeric(woman.get("v008"))
            if birth_cmc is None or interview_cmc is None or not 0 <= interview_cmc - birth_cmc <= 59:
                continue
            record = {"weight": woman["weight"], "dhs_region_code": woman["dhs_region_code"], "dhs_region_name": woman["dhs_region_name"]}
            m14, m13 = _valid_count(woman.get(f"m14_{position}")), _valid_count(woman.get(f"m13_{position}"))
            record["anc1_rate"] = None if m14 is None else m14 > 0
            record["anc4_rate"] = None if m14 is None else m14 >= 4
            record["early_anc_rate"] = None if m13 is None else 1 <= m13 <= 3
            record["institutional_delivery_rate"] = _institutional(woman.get(f"m15_{position}"), labels.get(f"m15_{position}", {}))
            record["cesarean_rate"] = _yes(woman.get(f"m17_{position}"), labels.get(f"m17_{position}", {}))
            assistants = []
            m3_observed = False
            for letter in "abcdefghijklmn":
                column = f"m3{letter}_{position}"
                if column in df:
                    observed, present = _assistant_state(woman.get(column), labels.get(column, {}))
                    m3_observed = m3_observed or observed
                    if present:
                        assistants.append(variables.get(column, "").lower())
            record["tba_rate"] = None if not m3_observed else any("traditional birth attendant" in text for text in assistants)
            record["skilled_birth_attendance_rate"] = None if not m3_observed else any(_skilled_label(text) for text in assistants)
            births.append(record)
    birth_df = pd.DataFrame(births)
    birth_metrics = ["anc1_rate", "anc4_rate", "early_anc_rate", "institutional_delivery_rate", "cesarean_rate", "tba_rate", "skilled_birth_attendance_rate"]
    women_metrics = _national_women(df)
    report = {
        "country": country, "source_type": "EMPIRICAL_DHS", "survey_year_start": int(pd.to_numeric(df["v007"], errors="coerce").min()), "survey_year_end": int(pd.to_numeric(df["v007"], errors="coerce").max()),
        "women_n": len(df), "recent_births_n": len(birth_df), **{metric: _weighted_rate(birth_df, metric) for metric in birth_metrics}, **women_metrics,
        "weighted": True, "weight_variable": "v005", "reference_period_births_months": 59,
    }
    regional_rows = []
    if not birth_df.empty:
        for (code, name), group in birth_df.groupby(["dhs_region_code", "dhs_region_name"], dropna=False):
            row = {"country": country, "source_type": "EMPIRICAL_DHS", "dhs_region_code": code, "dhs_region_name": name, "unweighted_n": len(group), "weighted_denominator": group["weight"].sum()}
            row.update({metric: _weighted_rate(group, metric) for metric in birth_metrics})
            regional_rows.append(row)
    meta = {"country": country, "file": path.name, "m15_rule": "facility labels only: hospital, health centre/center/post, clinic, dispensary, polyclinic, maternity home, medical sector, CHPS or outreach; home/TBA/transit excluded; other/headers unclassified", "skilled_rule": "assistant label contains doctor, nurse, midwife, health officer, clinical officer or medical assistant"}
    return report, pd.DataFrame(regional_rows), meta


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    names = fieldnames or list(rows[0])
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=names, extrasaction="ignore")
        writer.writeheader(); writer.writerows(rows)


def _logit(value: float) -> float:
    value = min(max(value, 1e-8), 1 - 1e-8)
    return math.log(value / (1 - value))


def _expit(value: float) -> float:
    return 1 / (1 + math.exp(-value))


def _anchor(values: list[float], weights: list[float], target: float) -> list[float]:
    """Solve a country-specific logit intercept so the weighted mean equals target."""
    target = min(max(target, 1e-8), 1 - 1e-8)
    low, high = -30.0, 30.0
    for _ in range(100):
        midpoint = (low + high) / 2
        mean = sum(weight * _expit(_logit(value) + midpoint) for value, weight in zip(values, weights)) / sum(weights)
        if mean < target: low = midpoint
        else: high = midpoint
    shift = (low + high) / 2
    return [_expit(_logit(value) + shift) for value in values]


def snapshot_if_needed() -> None:
    if BASELINE.exists():
        return
    BASELINE.mkdir(parents=True)
    for filename in INPUT_FILES:
        shutil.copy2(INPUT / filename, BASELINE / filename)


def build(dry_run: bool = False) -> None:
    reports, regions, metadata = [], [], []
    design_inventory = []
    for country, filename in FILES.items():
        report, regional, meta = process_country(country, RAW / filename)
        reports.append(report); regions.extend(regional.to_dict("records")); metadata.append(meta)
        design_vars = [name for name in ("v005", "v021", "v022", "v023", "v024", "v025") if name in _label_metadata(RAW / filename)[0]]
        design = pd.read_stata(RAW / filename, columns=design_vars, convert_categoricals=False)
        design_inventory.append({"country": country, "source_file": filename, "weight_variable": "v005", "weight_scale": "divide_by_1000000", "women_n": len(design), "psu_variable": "v021", "psu_n": design["v021"].nunique(dropna=True), "stratum_v022_variable": "v022", "stratum_v022_n": design["v022"].nunique(dropna=True), "stratum_v023_variable": "v023", "stratum_v023_n": design["v023"].nunique(dropna=True), "region_variable": "v024", "region_n": design["v024"].nunique(dropna=True), "residence_variable": "v025", "residence_categories": design["v025"].nunique(dropna=True)})
    if dry_run:
        print(f"Processed {len(reports)} DHS files; derived {sum(x['recent_births_n'] for x in reports)} eligible births. No files written.")
        return
    snapshot_if_needed()
    DERIVED.mkdir(parents=True, exist_ok=True)
    _write_csv(DERIVED / "dhs_country_indicators.csv", reports)
    _write_csv(DERIVED / "dhs_region_indicators.csv", regions, ["country", "source_type", "dhs_region_code", "dhs_region_name", "unweighted_n", "weighted_denominator", "anc1_rate", "anc4_rate", "early_anc_rate", "institutional_delivery_rate", "cesarean_rate", "tba_rate", "skilled_birth_attendance_rate"])
    _write_csv(DERIVED / "dhs_processing_rules.csv", metadata)
    _write_csv(DERIVED / "dhs_design_inventory.csv", design_inventory)

    demographic = _read_csv(BASELINE / "territorial_demographics.csv")
    context = _read_csv(BASELINE / "maternal_health_context.csv")
    demo_by_id = {row["territory_id"]: row for row in demographic}
    national = {row["country"]: row for row in reports}
    provenance: list[dict[str, Any]] = []
    for row in context:
        country = demo_by_id[row["territory_id"]]["country"]
        for variable, (metric, weight_name) in ANCHORS.items():
            previous = float(row[variable])
            target = national[country].get(metric)
            if target is None or (country == "Kenya" and variable == "insurance_coverage_rate"):
                provenance.append({"territory_id": row["territory_id"], "variable_name": variable, "source_type": "MODEL_INPUT", "source_file": "pre_hybrid_phase_2_1/maternal_health_context.csv", "derivation_method": "retained: DHS indicator unavailable", "original_value": previous, "final_value": previous, "transformation": "identity", "notes": "No DHS replacement applied."})
        # actual changes are done together country-by-country below
    for country in FILES:
        rows = [row for row in context if demo_by_id[row["territory_id"]]["country"] == country]
        for variable, (metric, weight_name) in ANCHORS.items():
            target = national[country].get(metric)
            if target is None or (country == "Kenya" and variable == "insurance_coverage_rate"):
                continue
            weights = [float(demo_by_id[row["territory_id"]][weight_name]) for row in rows]
            old = [float(row[variable]) for row in rows]
            final = _anchor(old, weights, float(target))
            for row, before, after in zip(rows, old, final):
                row[variable] = f"{after:.15g}"
                provenance.append({"territory_id": row["territory_id"], "variable_name": variable, "source_type": "EMPIRICALLY_ANCHORED", "source_file": f"data/dhs/{FILES[country]}", "derivation_method": f"DHS national weighted estimate ({metric}); {weight_name}-weighted logit-intercept shift", "original_value": before, "final_value": after, "transformation": "expit(logit(original)+country_shift)", "notes": "DHS file provenance not externally verified in repository."})
    # Record all non-anchored values as structured model inputs, plus complete context provenance.
    anchored_names = set(ANCHORS)
    for filename in INPUT_FILES:
        for row in _read_csv(BASELINE / filename):
            for name, value in row.items():
                if name == "territory_id" or (filename == "maternal_health_context.csv" and name in anchored_names):
                    continue
                provenance.append({"territory_id": row["territory_id"], "variable_name": name, "source_type": "MODEL_INPUT", "source_file": f"pre_hybrid_phase_2_1/{filename}", "derivation_method": "retained structured model input", "original_value": value, "final_value": value, "transformation": "identity", "notes": "Not directly derived from current DHS microdata."})
    _write_csv(INPUT / "maternal_health_context.csv", context)
    _write_csv(INPUT / "input_provenance.csv", provenance, ["territory_id", "variable_name", "source_type", "source_file", "derivation_method", "original_value", "final_value", "transformation", "notes"])
    print(f"Built hybrid inputs: {len(reports)} country rows, {len(regions)} regional rows, {len(provenance)} provenance rows.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(); parser.add_argument("--dry-run", action="store_true")
    build(parser.parse_args().dry_run)
