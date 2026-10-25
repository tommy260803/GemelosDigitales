"""Reproduce article analyses from the immutable 733e638 source snapshot.

Writes only to this folder's results/ and logs/. Does not update source CSVs.
"""
from __future__ import annotations

import csv
import hashlib
import importlib.metadata as metadata
import json
import logging
import math
import platform
import subprocess
import sys
import tarfile
import tempfile
import time
from io import BytesIO
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[1]
SOURCE_COMMIT = "733e63816e424bed53f2094646f46f6ca93955e4"
# Materialize only the exact code and input files needed from the recorded
# historical commit. This avoids shipping a second full repository snapshot.
SOURCE_PATHS = [
    "backend/services/__init__.py",
    "backend/services/system_dynamics.py",
    "backend/services/validation.py",
    "backend/services/model_inputs.py",
    "scripts/export_final_simulation_results.py",
    "data/model_inputs/territorial_demographics.csv",
    "data/model_inputs/maternal_health_context.csv",
    "data/model_inputs/health_system_capacity.csv",
    "data/model_inputs/geographic_access.csv",
    "data/model_inputs/model_context.csv",
    "data/model_inputs/quintile_coverage_by_district.csv",
    "data/results/final_global_results.csv",
    "data/results/final_country_results.csv",
    "data/results/final_simulation_results.csv",
]
SOURCE_TEMP = tempfile.TemporaryDirectory(prefix="garissa_repro_source_")
SOURCE = Path(SOURCE_TEMP.name)
archive = subprocess.run(
    ["git", "archive", "--format=tar", SOURCE_COMMIT, *SOURCE_PATHS],
    cwd=REPO_ROOT,
    check=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)
with tarfile.open(fileobj=BytesIO(archive.stdout), mode="r:") as tar:
    tar.extractall(SOURCE, filter="data")
RESULTS = ROOT / "results"
LOGS = ROOT / "logs"
sys.path.insert(0, str(SOURCE / "backend"))

from services import validation  # noqa: E402
from services.model_inputs import districts_from_datasets, quintile_coverage_by_district  # noqa: E402
from services.system_dynamics import SystemDynamicsEngine  # noqa: E402


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def dump_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        raise ValueError(f"Refusing to write empty result file: {path}")
    with path.open("x", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    for folder in (RESULTS, LOGS):
        folder.mkdir(exist_ok=True)
    if any(RESULTS.iterdir()) or any(LOGS.iterdir()):
        raise FileExistsError("Output/log directory is not empty; refusing to overwrite prior artifacts")

    logger = logging.getLogger("article_reproduction")
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)sZ %(levelname)s %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
    formatter.converter = time.gmtime
    file_handler = logging.FileHandler(LOGS / "reproduction.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)

    start_utc = datetime.now(timezone.utc)
    source_files = [
        "backend/services/system_dynamics.py",
        "backend/services/validation.py",
        "backend/services/model_inputs.py",
        "scripts/export_final_simulation_results.py",
        "data/model_inputs/territorial_demographics.csv",
        "data/model_inputs/maternal_health_context.csv",
        "data/model_inputs/health_system_capacity.csv",
        "data/model_inputs/geographic_access.csv",
        "data/model_inputs/model_context.csv",
        "data/model_inputs/quintile_coverage_by_district.csv",
        "data/results/final_global_results.csv",
        "data/results/final_country_results.csv",
        "data/results/final_simulation_results.csv",
    ]
    hashes = {name: sha256(SOURCE / name) for name in source_files}
    versions = {name: metadata.version(name) for name in ("SALib", "numpy", "scipy", "pandas")}
    metadata_doc = {
        "source_commit": SOURCE_COMMIT,
        "source_commit_date": "2026-09-29T10:21:18-05:00",
        "execution_started_utc": start_utc.isoformat(),
        "python": sys.version,
        "platform": platform.platform(),
        "package_versions": versions,
        "analysis_config": {
            "equity": {"district_id": "ke-garissa", "scenario_id": "scenario_d", "months": 36, "dt": None, "model": "spa_247", "seed": None},
            "sobol": {"district_id": "ke-garissa", "scenario_id": "scenario_d", "months": 12, "n_samples": 64, "model_runs_expected": 640, "seed": 42, "dt": None},
            "monte_carlo_parametric": {"district_id": "ke-garissa", "scenario_id": "scenario_d", "months": 36, "iterations": 200, "seed": 42, "dt": None},
            "scenarios_abc": "Read directly from the committed 36-month global results CSV; no new simulation for these rows.",
        },
        "inputs_sha256": hashes,
        "database": "Not queried by this runner; read-only check and result are in logs/database_check.txt.",
    }
    write_json(RESULTS / "run_metadata.json", metadata_doc)
    logger.info("Source commit=%s; runtime=%s; package_versions=%s", metadata_doc["source_commit"], sys.version.split()[0], versions)

    districts = districts_from_datasets()
    district = next(row for row in districts if row.id == "ke-garissa")
    equity_inputs = quintile_coverage_by_district().get(district.id)
    if not equity_inputs or len(equity_inputs) != 5:
        raise RuntimeError("Expected five DHS quintile inputs for ke-garissa")

    equity_run = SystemDynamicsEngine.simulate(
        district, "scenario_d", simulation_months=36,
        clinical_capacity_model="spa_247", equity_inputs=equity_inputs,
    )
    equity_rows = [dict(row) for row in equity_run.equity_disaggregation]
    dump_csv(RESULTS / "equity_garissa_scenario_d_36m.csv", equity_rows)
    q1 = next(row for row in equity_rows if row["quintile"] == "q1_poorest")
    q5 = next(row for row in equity_rows if row["quintile"] == "q5_richest")
    equity_comparison = {
        "rows": len(equity_rows),
        "q1_simulated_mmr": q1["simulated_mmr"],
        "q5_simulated_mmr": q5["simulated_mmr"],
        "q1_minus_q5_signed_gap": q1["simulated_mmr"] - q5["simulated_mmr"],
        "absolute_q1_q5_gap": abs(q1["simulated_mmr"] - q5["simulated_mmr"]),
        "manuscript_rounded_q1": 169.39,
        "manuscript_rounded_q5": 174.63,
        "manuscript_reported_absolute_gap": 5.24,
        "reproduction_rounded_values_match": round(q1["simulated_mmr"], 2) == 169.39 and round(q5["simulated_mmr"], 2) == 174.63,
    }
    write_json(RESULTS / "equity_comparison.json", equity_comparison)
    logger.info("Equity rows=%d; Q1=%0.10f; Q5=%0.10f; signed Q1-Q5=%0.10f", len(equity_rows), q1["simulated_mmr"], q5["simulated_mmr"], equity_comparison["q1_minus_q5_signed_gap"])

    original_pair = validation._paired_deaths_avoided
    sobol_observations: list[dict] = []

    def capture_sobol(d, scenario_id, custom_params, months):
        value = original_pair(d, scenario_id, custom_params, months)
        sobol_observations.append({"scenario_id": scenario_id, "months": months, **custom_params, **value})
        return value

    validation._paired_deaths_avoided = capture_sobol
    try:
        sobol_result = validation.StatisticalValidationPy.sobol_sensitivity(
            district, "scenario_d", n_samples=64, months=12, seed=42,
        )
    finally:
        validation._paired_deaths_avoided = original_pair
    dump_csv(RESULTS / "sobol_garissa_scenario_d_12m_model_runs.csv", sobol_observations)
    write_json(RESULTS / "sobol_garissa_scenario_d_12m_summary.json", sobol_result)
    sobol_comparison = []
    for i, name in enumerate(sobol_result["parameters"]):
        sobol_comparison.append({
            "parameter": name,
            "S1": sobol_result["first_order_indices"][i],
            "S1_conf": sobol_result["first_order_confidence"][i],
            "ST": sobol_result["total_order_indices"][i],
            "ST_conf": sobol_result["total_order_confidence"][i],
        })
    dump_csv(RESULTS / "sobol_garissa_scenario_d_12m_indices.csv", sobol_comparison)
    logger.info("Sobol N=%d; model runs=%d; seed=%d; staff ST=%0.10f; blood ST=%0.10f", sobol_result["n_samples"], len(sobol_observations), sobol_result["seed"], sobol_result["total_order_indices"][sobol_result["parameters"].index("skilled_staff_ratio")], sobol_result["total_order_indices"][sobol_result["parameters"].index("blood_availability_rate")])

    original_sample = validation._sample_parameters
    original_pair = validation._paired_deaths_avoided
    mc_rows: list[dict] = []
    draw_queue: list[dict] = []

    def capture_sample(d, rng):
        draw = original_sample(d, rng)
        draw_queue.append(draw)
        return draw

    def capture_mc_pair(d, scenario_id, custom_params, months):
        value = original_pair(d, scenario_id, custom_params, months)
        mc_rows.append({"scenario_id": scenario_id, "months": months, **custom_params, **value})
        return value

    validation._sample_parameters = capture_sample
    validation._paired_deaths_avoided = capture_mc_pair
    try:
        mc_result = validation.StatisticalValidationPy.bootstrap_confidence_intervals(
            district, "scenario_d", iterations=200, months=36, seed=42,
        )
    finally:
        validation._sample_parameters = original_sample
        validation._paired_deaths_avoided = original_pair
    if len(draw_queue) != len(mc_rows):
        raise RuntimeError(f"Captured mismatched Monte Carlo draws/results: {len(draw_queue)} vs {len(mc_rows)}")
    mc_observations = [{"iteration": i + 1, **draw_queue[i], **mc_rows[i]} for i in range(len(mc_rows))]
    dump_csv(RESULTS / "monte_carlo_garissa_scenario_d_36m_draws.csv", mc_observations)
    write_json(RESULTS / "monte_carlo_garissa_scenario_d_36m_summary.json", mc_result)
    mc_comparison = {
        "method": mc_result["method"],
        "iterations": mc_result["iterations"],
        "seed": mc_result["seed"],
        "positive_draws_for_cost_metric": mc_result["positive_draws"],
        "mean_deaths_avoided": mc_result["mean_lives_saved"],
        "percentile_2_5_deaths_avoided": mc_result["ci95_lives_saved"][0],
        "percentile_97_5_deaths_avoided": mc_result["ci95_lives_saved"][1],
        "mean_cost_per_death_avoided": mc_result["mean_cost_per_life_saved"],
        "percentile_2_5_cost_per_death_avoided": mc_result["ci95_cost_per_life_saved"][0],
        "percentile_97_5_cost_per_death_avoided": mc_result["ci95_cost_per_life_saved"][1],
        "manuscript_mean_deaths_avoided": 173.15,
        "manuscript_ci95_deaths_avoided": [135.45, 195.63],
        "manuscript_mean_cost_per_death_avoided": 76844.90,
        "manuscript_ci95_cost_per_death_avoided": [67092.71, 96899.88],
        "rounded_means_and_intervals_match": (
            round(mc_result["mean_lives_saved"], 2) == 173.15
            and [round(x, 2) for x in mc_result["ci95_lives_saved"]] == [135.45, 195.63]
            and round(mc_result["mean_cost_per_life_saved"], 2) == 76844.90
            and [round(x, 2) for x in mc_result["ci95_cost_per_life_saved"]] == [67092.71, 96899.88]
        ),
    }
    write_json(RESULTS / "monte_carlo_comparison.json", mc_comparison)
    logger.info("Monte Carlo n=%d seed=%d positive_cost_draws=%d mean_deaths_avoided=%0.10f interval=[%0.10f,%0.10f]", mc_result["iterations"], mc_result["seed"], mc_result["positive_draws"], mc_result["mean_lives_saved"], *mc_result["ci95_lives_saved"])

    global_rows = []
    with (SOURCE / "data/results/final_global_results.csv").open(newline="", encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            if row["scenario"] in {"scenario_a", "scenario_b", "scenario_c"}:
                global_rows.append({
                    "scenario": row["scenario"],
                    "cumulative_births": float(row["cumulative_births"]),
                    "horizon_mmr": float(row["horizon_mmr"]),
                    "deaths_avoided": float(row["deaths_avoided"]),
                    "months": 36,
                    "provenance": "read from immutable 733e638 data/results/final_global_results.csv; not simulated by this runner",
                })
    dump_csv(RESULTS / "scenarios_A_B_C_global_36m_from_commit.csv", global_rows)

    end_utc = datetime.now(timezone.utc)
    metadata_doc["execution_finished_utc"] = end_utc.isoformat()
    write_json(RESULTS / "run_metadata.json", metadata_doc)
    comparison = {
        "equity": equity_comparison,
        "sobol": {
            "reproduction_runs": len(sobol_observations),
            "reproduction_staff_ST": sobol_result["total_order_indices"][sobol_result["parameters"].index("skilled_staff_ratio")],
            "manuscript_staff_ST": 0.9546,
            "reproduction_blood_ST": sobol_result["total_order_indices"][sobol_result["parameters"].index("blood_availability_rate")],
            "manuscript_blood_ST": 0.0550,
            "rounded_ST_match": (
                round(sobol_result["total_order_indices"][sobol_result["parameters"].index("skilled_staff_ratio")], 4) == 0.9546
                and round(sobol_result["total_order_indices"][sobol_result["parameters"].index("blood_availability_rate")], 4) == 0.0550
            ),
        },
        "monte_carlo": mc_comparison,
        "scenario_a_b_c_global_36m": global_rows,
        "article_location": "articulo/G23_GarciaVenturaAnthony_GonzalesEsquivelJeanfranco (1) (1).docx and ARTICLE_UPDATE_PACKAGE.md",
        "interpretation_of_95_percent_range": "Percentiles 2.5 and 97.5 of seeded parametric simulation outputs; not a sampling CI from observed patient/district outcome data.",
        "no_values_adjusted_to_match_manuscript": True,
    }
    write_json(RESULTS / "comparison_to_manuscript.json", comparison)
    logger.info("Finished at %s; no existing project results were overwritten", end_utc.isoformat())


if __name__ == "__main__":
    main()
