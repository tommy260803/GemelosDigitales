from __future__ import annotations

import csv
import hashlib
import json
import os
import platform
import sys
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
import scipy

ROOT = Path(__file__).resolve().parent / "source_snapshot"
OUT = Path(__file__).resolve().parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT / "backend"))

from services.model_inputs import districts_from_datasets, load_rows  # noqa: E402
from services.system_dynamics import SCENARIO_DEFINITIONS, SystemDynamicsEngine  # noqa: E402

MATRIX = [
    {"variant": "D_corrected", "staff_247": 0.95, "blood": 0.95, "uterotonics": 0.95,
     "meaning": "D tal como está definido en el motor corregido."},
    {"variant": "D_moderate_readiness_stress", "staff_247": 0.75, "blood": 0.75, "uterotonics": 0.75,
     "meaning": "Sensibilidad: disponibilidad de los tres componentes 20 puntos porcentuales bajo D."},
    {"variant": "D_severe_readiness_stress", "staff_247": 0.50, "blood": 0.50, "uterotonics": 0.50,
     "meaning": "Sensibilidad severa: disponibilidad de los tres componentes 45 puntos porcentuales bajo D."},
]
CAPACITY_RULES = {
    "staff_247_availability_rate": "staff_247",
    "blood_availability_rate": "blood",
    "oxytocin_misoprostol_stock_rate": "uterotonics",
}


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        raise ValueError(f"Refusing to write empty result: {path}")
    cols = list(dict.fromkeys(k for row in rows for k in row))
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        writer.writerows(rows)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def set_variant_rules(variant: dict) -> dict:
    definition = next(x for x in SCENARIO_DEFINITIONS if x["id"] == "scenario_d")
    original = dict(definition["rules"])
    updated = dict(original)
    for parameter, matrix_key in CAPACITY_RULES.items():
        updated[parameter] = ("set", float(variant[matrix_key]))
    definition["rules"] = updated
    return original


def restore_rules(original: dict) -> None:
    next(x for x in SCENARIO_DEFINITIONS if x["id"] == "scenario_d")["rules"] = original


def aggregate(rows: list[dict], group_keys: list[str]) -> list[dict]:
    frame = pd.DataFrame(rows)
    output = []
    for keys, group in frame.groupby(group_keys, sort=True):
        if not isinstance(keys, tuple):
            keys = (keys,)
        row = dict(zip(group_keys, keys))
        births = float(group["births"].sum())
        deaths = float(group["deaths"].sum())
        baseline_deaths = float(group["baseline_deaths"].sum())
        baseline_births = float(group["baseline_births"].sum())
        row.update({
            "territories": int(group["territory_id"].nunique()),
            "months": 36,
            "births": births,
            "deaths": deaths,
            "horizon_mmr": deaths / births * 100000 if births else 0.0,
            "baseline_births": baseline_births,
            "baseline_deaths": baseline_deaths,
            "baseline_mmr": baseline_deaths / baseline_births * 100000 if baseline_births else 0.0,
            "deaths_avoided": baseline_deaths - deaths,
            "death_reduction_percent": (baseline_deaths - deaths) / baseline_deaths * 100 if baseline_deaths else 0.0,
            "mmr_reduction_percent": ((baseline_deaths / baseline_births * 100000 - deaths / births * 100000)
                                      / (baseline_deaths / baseline_births * 100000) * 100
                                      if births and baseline_births and baseline_deaths else 0.0),
        })
        output.append(row)
    return output


def main() -> None:
    if any((OUT / "results").glob("*.csv")):
        raise FileExistsError("Results already exist; copy the package to a new directory before rerunning.")
    started = datetime.now(timezone.utc)
    districts = districts_from_datasets()
    raw = load_rows()
    if len(districts) != 25:
        raise AssertionError(f"Expected 25 territories, got {len(districts)}")

    territory_rows: list[dict] = []
    parameter_rows: list[dict] = []
    effective_input_rows: list[dict] = []
    baseline_reference: dict[str, dict] = {}
    scenario_order = ["baseline", "scenario_a", "scenario_b", "scenario_c"]

    for district in districts:
        base = SystemDynamicsEngine.simulate(district, "baseline", simulation_months=36)
        b = base.summary
        baseline_reference[district.id] = {
            "births": float(b.total_births), "deaths": float(b.total_maternal_deaths),
            "mmr": float(b.horizon_mmr),
        }
        for key, val in vars(base.parameters).items():
            parameter_rows.append({"territory_id": district.id, "variant": "baseline",
                                   "parameter": key, "value": val})

        def add_result(name: str, result) -> None:
            s = result.summary
            br = baseline_reference[district.id]
            row = {
                "territory_id": district.id, "territory": district.name, "country": district.country,
                "variant": name, "months": 36,
                "births": float(s.total_births), "deaths": float(s.total_maternal_deaths),
                "horizon_mmr": float(s.horizon_mmr),
                "baseline_births": br["births"], "baseline_deaths": br["deaths"],
                "baseline_mmr": br["mmr"],
                "deaths_avoided": br["deaths"] - float(s.total_maternal_deaths),
                "death_reduction_percent": ((br["deaths"] - float(s.total_maternal_deaths)) / br["deaths"] * 100
                                            if br["deaths"] else 0.0),
                "mmr_reduction_percent": ((br["mmr"] - float(s.horizon_mmr)) / br["mmr"] * 100
                                          if br["mmr"] else 0.0),
            }
            territory_rows.append(row)
            return row

        add_result("baseline", base)
        for scenario in scenario_order[1:]:
            result = SystemDynamicsEngine.simulate(district, scenario, simulation_months=36,
                                                   baseline_result=base)
            add_result(scenario, result)
            for key, val in vars(result.parameters).items():
                parameter_rows.append({"territory_id": district.id, "variant": scenario,
                                       "parameter": key, "value": val})

        for variant in MATRIX:
            if variant["variant"] == "D_corrected":
                # Preserve the original D rule set exactly for the anchor run.
                pass
            else:
                original_rules = set_variant_rules(variant)
            try:
                result = SystemDynamicsEngine.simulate(district, "scenario_d", simulation_months=36,
                                                       baseline_result=base)
            finally:
                if variant["variant"] != "D_corrected":
                    restore_rules(original_rules)
            add_result(variant["variant"], result)
            for key, val in vars(result.parameters).items():
                parameter_rows.append({"territory_id": district.id, "variant": variant["variant"],
                                       "parameter": key, "value": val})
            row = {"territory_id": district.id, "variant": variant["variant"]}
            for group, rows_by_id in raw.items():
                row.update({f"{group}.{k}": v for k, v in rows_by_id[district.id].items()})
            for key, val in vars(result.parameters).items():
                row[f"effective.{key}"] = val
            row.update({"stress_staff_247": variant["staff_247"], "stress_blood": variant["blood"],
                        "stress_uterotonics": variant["uterotonics"]})
            effective_input_rows.append(row)

    write_csv(OUT / "results/territory_results.csv", territory_rows)
    write_csv(OUT / "results/effective_parameters.csv", parameter_rows)
    write_csv(OUT / "results/effective_inputs_by_territory_variant.csv", effective_input_rows)

    # Verify one unchanged, paired baseline is used for all counterfactuals.
    baseline_rows = [r for r in territory_rows if r["variant"] == "baseline"]
    if len(baseline_rows) != 25 or len({r["territory_id"] for r in baseline_rows}) != 25:
        raise AssertionError("Baseline must have exactly one row for each of the 25 territories")
    for r in territory_rows:
        ref = baseline_reference[r["territory_id"]]
        if not (np.isclose(r["baseline_births"], ref["births"], rtol=0, atol=1e-10)
                and np.isclose(r["baseline_deaths"], ref["deaths"], rtol=0, atol=1e-10)
                and np.isclose(r["baseline_mmr"], ref["mmr"], rtol=0, atol=1e-10)):
            raise AssertionError(f"Unpaired baseline detected for {r['territory_id']}/{r['variant']}")

    country_rows = aggregate(territory_rows, ["country", "variant"])
    global_rows = aggregate(territory_rows, ["variant"])
    write_csv(OUT / "results/country_results.csv", country_rows)
    write_csv(OUT / "results/global_results.csv", global_rows)

    # Check aggregates independently against the underlying territorial sums.
    for g in global_rows:
        source = [r for r in territory_rows if r["variant"] == g["variant"]]
        if len(source) != 25 or len({r["territory_id"] for r in source}) != 25:
            raise AssertionError(f"Variant {g['variant']} does not cover all 25 territories")
        for field in ("births", "deaths", "baseline_births", "baseline_deaths"):
            if not np.isclose(g[field], sum(r[field] for r in source), rtol=1e-12, atol=1e-8):
                raise AssertionError(f"Global {field} does not equal territorial sum for {g['variant']}")
    for g in country_rows:
        source = [r for r in territory_rows if r["variant"] == g["variant"] and r["country"] == g["country"]]
        for field in ("births", "deaths", "baseline_births", "baseline_deaths"):
            if not np.isclose(g[field], sum(r[field] for r in source), rtol=1e-12, atol=1e-8):
                raise AssertionError(f"Country {field} does not equal territorial sum for {g['country']}/{g['variant']}")

    territorial_comparisons = []
    for d_variant in ("D_corrected", "D_moderate_readiness_stress", "D_severe_readiness_stress"):
        for comparator in ("scenario_a", "scenario_b", "scenario_c"):
            for territory in sorted({r["territory_id"] for r in territory_rows}):
                drow = next(x for x in territory_rows if x["variant"] == d_variant and x["territory_id"] == territory)
                crow = next(x for x in territory_rows if x["variant"] == comparator and x["territory_id"] == territory)
                territorial_comparisons.append({"territory_id": territory, "D_variant": d_variant,
                    "comparator": comparator, "D_deaths_avoided": drow["deaths_avoided"],
                    "comparator_deaths_avoided": crow["deaths_avoided"],
                    "D_advantage_deaths_avoided": drow["deaths_avoided"] - crow["deaths_avoided"],
                    "D_horizon_mmr": drow["horizon_mmr"], "comparator_horizon_mmr": crow["horizon_mmr"],
                    "D_has_more_deaths_avoided": drow["deaths_avoided"] > crow["deaths_avoided"],
                    "D_has_lower_horizon_mmr": drow["horizon_mmr"] < crow["horizon_mmr"]})
    write_csv(OUT / "results/territory_D_vs_ABC.csv", territorial_comparisons)

    country_comparisons = []
    for d_variant in ("D_corrected", "D_moderate_readiness_stress", "D_severe_readiness_stress"):
        for comparator in ("scenario_a", "scenario_b", "scenario_c"):
            for country in sorted({r["country"] for r in country_rows}):
                drow = next(x for x in country_rows if x["variant"] == d_variant and x["country"] == country)
                crow = next(x for x in country_rows if x["variant"] == comparator and x["country"] == country)
                country_comparisons.append({"country": country, "D_variant": d_variant, "comparator": comparator,
                    "D_deaths_avoided": drow["deaths_avoided"], "comparator_deaths_avoided": crow["deaths_avoided"],
                    "D_advantage_deaths_avoided": drow["deaths_avoided"] - crow["deaths_avoided"],
                    "D_horizon_mmr": drow["horizon_mmr"], "comparator_horizon_mmr": crow["horizon_mmr"],
                    "D_has_more_deaths_avoided": drow["deaths_avoided"] > crow["deaths_avoided"],
                    "D_has_lower_horizon_mmr": drow["horizon_mmr"] < crow["horizon_mmr"]})
    write_csv(OUT / "results/country_D_vs_ABC.csv", country_comparisons)

    # Regression check against the independently preserved corrected-run global CSV.
    reference_path = OUT / "reference_corrected_global.csv"
    if reference_path.exists():
        ref = pd.read_csv(reference_path)
        compare_rows = []
        for variant, ref_scenario in (("baseline", "baseline"), ("scenario_a", "scenario_a"),
                                      ("scenario_b", "scenario_b"), ("scenario_c", "scenario_c"),
                                      ("D_corrected", "scenario_d")):
            now = next(x for x in global_rows if x["variant"] == variant)
            old = ref[ref["scenario_id"] == ref_scenario].iloc[0]
            compare_rows.append({"variant": variant, "reference_scenario": ref_scenario,
                "new_births": now["births"], "reference_births": float(old["births"]),
                "new_deaths": now["deaths"], "reference_deaths": float(old["deaths"]),
                "new_horizon_mmr": now["horizon_mmr"], "reference_horizon_mmr": float(old["horizon_mmr"]),
                "new_deaths_avoided": now["deaths_avoided"], "reference_deaths_avoided": float(old["deaths_avoided"]),
                "matches_with_tolerance_1e-9": all(np.isclose(now[k], float(old[refk]), rtol=0, atol=1e-9)
                    for k, refk in (("births", "births"), ("deaths", "deaths"),
                                    ("horizon_mmr", "horizon_mmr"), ("deaths_avoided", "deaths_avoided")))})
        if not all(row["matches_with_tolerance_1e-9"] for row in compare_rows):
            raise AssertionError("Control outputs do not match corrected reproduction at tolerance 1e-9")
        write_csv(OUT / "results/reference_corrected_comparison.csv", compare_rows)

    corrected = next(x for x in global_rows if x["variant"] == "D_corrected")
    differences = []
    for r in global_rows:
        if r["variant"] not in {"D_corrected", "baseline", "scenario_a", "scenario_b", "scenario_c"}:
            differences.append({"variant": r["variant"], **{
                f"delta_{f}_vs_D_corrected": r[f] - corrected[f]
                for f in ("births", "deaths", "horizon_mmr", "deaths_avoided",
                          "death_reduction_percent", "mmr_reduction_percent")}})
    write_csv(OUT / "results/global_stress_differences_vs_D.csv", differences)

    def make_differences(rows: list[dict], key_name: str, output_name: str) -> None:
        keys = sorted({(r.get(key_name), r["variant"]) for r in rows})
        out_rows = []
        value_fields = ("births", "deaths", "horizon_mmr", "deaths_avoided",
                        "death_reduction_percent", "mmr_reduction_percent")
        for entity, variant in keys:
            if variant not in {"D_moderate_readiness_stress", "D_severe_readiness_stress"}:
                continue
            current = next(r for r in rows if r.get(key_name) == entity and r["variant"] == variant)
            original = next(r for r in rows if r.get(key_name) == entity and r["variant"] == "D_corrected")
            out_rows.append({key_name: entity, "variant": variant,
                             **{f"delta_{field}_vs_D_corrected": current[field] - original[field]
                                for field in value_fields}})
        write_csv(OUT / f"results/{output_name}", out_rows)

    make_differences(territory_rows, "territory_id", "territory_stress_differences_vs_D.csv")
    make_differences(country_rows, "country", "country_stress_differences_vs_D.csv")

    comparisons = []
    for d_variant in ("D_corrected", "D_moderate_readiness_stress", "D_severe_readiness_stress"):
        drow = next(x for x in global_rows if x["variant"] == d_variant)
        for comparator in ("scenario_a", "scenario_b", "scenario_c"):
            crow = next(x for x in global_rows if x["variant"] == comparator)
            comparisons.append({"D_variant": d_variant, "comparator": comparator,
                                "D_deaths_avoided": drow["deaths_avoided"],
                                "comparator_deaths_avoided": crow["deaths_avoided"],
                                "D_advantage_deaths_avoided": drow["deaths_avoided"] - crow["deaths_avoided"],
                                "D_horizon_mmr": drow["horizon_mmr"], "comparator_horizon_mmr": crow["horizon_mmr"],
                                "D_has_more_deaths_avoided": drow["deaths_avoided"] > crow["deaths_avoided"],
                                "D_has_lower_horizon_mmr": drow["horizon_mmr"] < crow["horizon_mmr"]})
    write_csv(OUT / "results/global_D_vs_ABC.csv", comparisons)

    matrix_path = OUT / "stress_matrix.json"
    matrix_path.write_text(json.dumps({
        "basis": "D corrected rules set each preparation component to 0.95. Stress values 0.75 and 0.50 are analyst-defined sensitivity setpoints, not empirical estimates or probabilities; they represent 20 pp and 45 pp reductions from D's modeled assumption.",
        "fixed": ["same source inputs", "same engine snapshot", "same 36-month horizon and dt", "same per-territory baseline result reused for every comparator", "all other A+B+C and D rules"],
        "varies": ["staff_247_availability_rate", "blood_availability_rate", "oxytocin_misoprostol_stock_rate"],
        "matrix": MATRIX,
        "clinical_capacity_model": "spa_247; non247_relative_capacity remains the engine's assumed 0.33",
        "scenario_id_for_variants": "scenario_d; variants are sensitivity overrides, not the original D definition"
    }, indent=2), encoding="utf-8")

    finished = datetime.now(timezone.utc)
    input_root = ROOT / "data/model_inputs"
    source_root = ROOT / "backend"
    hashes = {}
    for root, label in ((source_root, "source_snapshot/backend"), (input_root, "source_snapshot/data/model_inputs")):
        for p in sorted(root.rglob("*")):
            if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc":
                hashes[(Path(label) / p.relative_to(root)).as_posix()] = sha256(p)
    metadata = {
        "started_utc": started.isoformat(), "finished_utc": finished.isoformat(),
        "started_lima": started.astimezone(ZoneInfo("America/Lima")).isoformat(),
        "finished_lima": finished.astimezone(ZoneInfo("America/Lima")).isoformat(),
        "command": "python articulo/robustez_escenario_d_20261026/run_stress_analysis.py",
        "python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__,
        "scipy": scipy.__version__, "SALib": version("SALib"),
        "source_commit": "e87c4d2b629b29de1a7039942a4345b4a640ac94",
        "source_branch": "main", "code_state": "reproduction corrected snapshot; local working tree had pre-existing changes",
        "source_hashes": hashes, "database_used": False, "territories": 25,
        "horizon_months": 36, "scenario_variants": [r["variant"] for r in MATRIX],
        "baseline_pairing": "one simulated baseline object per territory reused for A/B/C and every D variant",
        "checks": {"territories_each_variant": 25, "country_aggregates_checked": True,
                   "global_aggregates_checked": True, "paired_baseline_checked": True},
    }
    (OUT / "run_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
