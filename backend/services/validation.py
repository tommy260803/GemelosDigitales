"""Real statistical validation procedures for the SD engine.

Every procedure here consumes either versioned model inputs, live engine
output, or documented parameter ranges.  Nothing is hard-coded: results are
computed at call time from scipy/SALib against real district data.  The
ScientificProcedureUnavailable exception remains for scope/prerequisite
failures (e.g. too few districts), so callers can report the missing
requirement instead of inventing a statistic.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Sequence

import numpy as np
from scipy import stats as sps

from services.system_dynamics import DistrictData, SystemDynamicsEngine


class ScientificProcedureUnavailable(RuntimeError):
    pass


# Documented parameter ranges for uncertainty propagation and global
# sensitivity analysis.  Multipliers apply to the district's baseline value,
# additive shifts are clamped to each parameter's admissible domain.  These
# ranges are PARAMETRIC_ASSUMPTIONS: they encode input-estimation uncertainty,
# not sampling error of the model output.
PARAMETER_RANGES: Dict[str, Dict[str, Any]] = {
    "travel_time_hours": {"kind": "multiplier", "low": 0.5, "high": 1.5},
    "road_quality_index": {"kind": "additive", "low": -0.15, "high": 0.15},
    "transport_cost_usd": {"kind": "multiplier", "low": 0.7, "high": 1.3},
    "facility_delivery_fee_usd": {"kind": "multiplier", "low": 0.5, "high": 1.5},
    "insurance_coverage_rate": {"kind": "additive", "low": -0.15, "high": 0.15},
    "skilled_staff_ratio": {"kind": "multiplier", "low": 0.6, "high": 1.4},
    "blood_availability_rate": {"kind": "additive", "low": -0.15, "high": 0.15},
    "community_trust_baseline": {"kind": "additive", "low": -0.12, "high": 0.12},
}

_PROB_PARAMS = {
    "road_quality_index", "insurance_coverage_rate", "blood_availability_rate",
    "community_trust_baseline",
}

MIN_SCOPE = 5
DEFAULT_SOBOL_N = 64
DEFAULT_BOOTSTRAP_ITERATIONS = 200
DEFAULT_SEED = 42


def _require_scope(districts: Optional[Sequence[DistrictData]], procedure: str) -> List[DistrictData]:
    scope = list(districts or [])
    if len(scope) < MIN_SCOPE:
        raise ScientificProcedureUnavailable(
            f"{procedure} requires at least {MIN_SCOPE} districts in scope; got {len(scope)}."
        )
    return scope


def _sample_parameters(district: DistrictData, rng: np.random.Generator) -> Dict[str, float]:
    """Draw one parameter vector from the documented ranges."""
    baseline = SystemDynamicsEngine.effective_parameters(district, "baseline")
    current = {name: float(getattr(baseline, name)) for name in PARAMETER_RANGES}
    draw: Dict[str, float] = {}
    for name, spec in PARAMETER_RANGES.items():
        base_value = current[name]
        if spec["kind"] == "multiplier":
            value = base_value * rng.uniform(spec["low"], spec["high"])
        else:
            value = base_value + rng.uniform(spec["low"], spec["high"])
        if name in _PROB_PARAMS:
            value = min(1.0, max(0.0, value))
        else:
            value = max(0.0, value)
        draw[name] = float(value)
    return draw


def _paired_deaths_avoided(district: DistrictData, scenario_id: str, custom_params: Dict[str, float], months: int) -> Dict[str, float]:
    baseline = SystemDynamicsEngine.simulate(district, "baseline", custom_params, months)
    scenario = SystemDynamicsEngine.simulate(district, scenario_id, custom_params, months, baseline_result=baseline)
    return {
        "deaths_avoided": float(scenario.summary.deaths_avoided),
        "cost_usd": float(scenario.summary.total_cost_usd),
    }


class StatisticalValidationPy:
    @staticmethod
    def kolmogorov_smirnov(districts: Sequence[DistrictData], months: int = 36) -> Dict[str, Any]:
        """Two-sample KS: simulated end-state facility delivery vs DHS-anchored observed rates.

        Sample 1 = observed institutional delivery rates (versioned model inputs,
        DHS-anchored); sample 2 = simulated baseline facility delivery rate at the
        end of the horizon for the same districts.  Tests whether the two
        distributions differ beyond sampling noise.
        """
        scope = _require_scope(districts, "KS validation")
        observed = np.array([float(d.institutional_delivery_rate) for d in scope])
        simulated = np.array([
            float(SystemDynamicsEngine.simulate(d, "baseline", {}, months).summary.facility_delivery_rate_final)
            for d in scope
        ])
        if np.allclose(observed, simulated):
            statistic, p_value = 0.0, 1.0
        else:
            result = sps.ks_2samp(observed, simulated)
            statistic, p_value = float(result.statistic), float(result.pvalue)
        n, m = len(observed), len(simulated)
        critical = 1.36 * math.sqrt((n + m) / (n * m))
        return {
            "method": "two-sample Kolmogorov-Smirnov on district rates (DHS-anchored observed vs simulated baseline end-state)",
            "statistic_d": statistic,
            "p_value": p_value,
            "alpha": 0.05,
            "critical_value": critical,
            "is_statistically_equivalent": bool(p_value >= 0.05),
            "n_observed": n,
            "n_simulated": m,
            "observed_values_pct": observed.tolist(),
            "simulated_values_pct": simulated.tolist(),
            "months": months,
        }

    @staticmethod
    def wilcoxon_signed_rank(districts: Sequence[DistrictData], months: int = 36) -> Dict[str, Any]:
        """Paired Wilcoxon signed-rank across districts: observed vs simulated coverage.

        Tests the median paired difference between DHS-anchored observed
        institutional delivery rates and the simulated end-state rates.
        """
        scope = _require_scope(districts, "Wilcoxon validation")
        observed = np.array([float(d.institutional_delivery_rate) for d in scope])
        simulated = np.array([
            float(SystemDynamicsEngine.simulate(d, "baseline", {}, months).summary.facility_delivery_rate_final)
            for d in scope
        ])
        differences = simulated - observed
        if np.allclose(differences, 0.0):
            statistic, p_value = 0.0, 1.0
        else:
            result = sps.wilcoxon(simulated, observed, alternative="two-sided")
            statistic, p_value = float(result.statistic), float(result.pvalue)
        return {
            "method": "Wilcoxon signed-rank test on paired district rates (simulated minus observed)",
            "statistic": statistic,
            "p_value": p_value,
            "alpha": 0.05,
            "n_pairs": len(scope),
            "median_difference_pct": float(np.median(differences)),
            "mean_difference_pct": float(np.mean(differences)),
            "reject_null_bias": bool(p_value < 0.05),
            "months": months,
        }

    @staticmethod
    def sobol_sensitivity(district: DistrictData, scenario_id: str = "scenario_d",
                          n_samples: int = DEFAULT_SOBOL_N, months: int = 12,
                          seed: int = DEFAULT_SEED) -> Dict[str, Any]:
        """Global first-order and total-order Sobol indices (SALib, Saltelli design).

        Output variable: deaths avoided by the scenario over the horizon,
        computed as a paired baseline/scenario run per sample.  Parameter
        ranges come from PARAMETER_RANGES (documented assumptions).
        """
        if n_samples < 16 or n_samples > 4096 or (n_samples & (n_samples - 1)) != 0:
            raise ValueError("n_samples must be a power of two in [16, 4096]")
        try:
            from SALib.sample import sobol as sobol_sample
            from SALib.analyze import sobol as sobol_analyze
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise ScientificProcedureUnavailable(f"SALib is not installed: {exc}") from exc

        names = list(PARAMETER_RANGES)
        problem = {
            "num_vars": len(names),
            "names": names,
            "bounds": [[PARAMETER_RANGES[name]["low"], PARAMETER_RANGES[name]["high"]] if PARAMETER_RANGES[name]["kind"] == "additive"
                       else [PARAMETER_RANGES[name]["low"], PARAMETER_RANGES[name]["high"]] for name in names],
        }
        # Multiplier ranges are sampled as multipliers; translate into the
        # absolute domain expected by the engine before each run.
        matrix = sobol_sample.sample(problem, n_samples, calc_second_order=False, seed=seed)
        outputs = np.empty(len(matrix), dtype=float)
        baseline_values = {name: float(getattr(SystemDynamicsEngine.effective_parameters(district, "baseline"), name)) for name in names}
        for row_index, row in enumerate(matrix):
            custom: Dict[str, float] = {}
            for name, factor in zip(names, row):
                spec = PARAMETER_RANGES[name]
                value = baseline_values[name] * factor if spec["kind"] == "multiplier" else baseline_values[name] + factor
                if name in _PROB_PARAMS:
                    value = min(1.0, max(0.0, value))
                else:
                    value = max(0.0, value)
                custom[name] = float(value)
            outputs[row_index] = _paired_deaths_avoided(district, scenario_id, custom, months)["deaths_avoided"]
        analysis = sobol_analyze.analyze(problem, outputs, calc_second_order=False, print_to_console=False, seed=seed)
        s1 = [float(x) for x in analysis["S1"]]
        st = [float(x) for x in analysis["ST"]]
        order = sorted(range(len(names)), key=lambda i: st[i], reverse=True)
        return {
            "method": "Sobol global sensitivity analysis (SALib Saltelli design, Jansen total-order estimator)",
            "output_variable": f"deaths_avoided:{scenario_id}",
            "scenario_id": scenario_id,
            "district_id": district.id,
            "months": months,
            "n_samples": n_samples,
            "n_model_runs": int(len(matrix)),
            "seed": seed,
            "parameters": names,
            "first_order_indices": s1,
            "total_order_indices": st,
            "first_order_confidence": [float(x) for x in analysis["S1_conf"]],
            "total_order_confidence": [float(x) for x in analysis["ST_conf"]],
            "parameter_ranges": PARAMETER_RANGES,
            "top_variance_contributors": [names[i] for i in order[:3]],
        }

    @staticmethod
    def bootstrap_confidence_intervals(district: DistrictData, scenario_id: str = "scenario_d",
                                       iterations: int = DEFAULT_BOOTSTRAP_ITERATIONS,
                                       months: int = 36, seed: int = DEFAULT_SEED) -> Dict[str, Any]:
        """Parametric bootstrap: percentile 95% CIs from parameter uncertainty.

        Each iteration draws the documented parameter ranges (seeded RNG),
        runs a paired baseline/scenario simulation and records deaths avoided
        and cost per death avoided.  The reported intervals propagate input
        uncertainty through the model; they are not output-noise heuristics.
        """
        if not 10 <= iterations <= 5000:
            raise ValueError("iterations must be in [10, 5000]")
        rng = np.random.default_rng(seed)
        lives: List[float] = []
        cost_per_death: List[float] = []
        for _ in range(iterations):
            draw = _sample_parameters(district, rng)
            run = _paired_deaths_avoided(district, scenario_id, draw, months)
            lives.append(run["deaths_avoided"])
            if run["deaths_avoided"] > 0 and run["cost_usd"] > 0:
                cost_per_death.append(run["cost_usd"] / run["deaths_avoided"])
        lives_arr = np.asarray(lives, dtype=float)
        cost_arr = np.asarray(cost_per_death, dtype=float)
        if cost_arr.size == 0:
            raise ScientificProcedureUnavailable(
                "Bootstrap produced no positive deaths-avoided draws; cost-per-death interval undefined."
            )
        return {
            "method": "parametric bootstrap (uniform draws over documented parameter ranges, paired engine runs)",
            "district_id": district.id,
            "scenario_id": scenario_id,
            "months": months,
            "seed": seed,
            "iterations": int(iterations),
            "mean_lives_saved": float(lives_arr.mean()),
            "ci95_lives_saved": [float(np.percentile(lives_arr, 2.5)), float(np.percentile(lives_arr, 97.5))],
            "mean_cost_per_life_saved": float(cost_arr.mean()),
            "ci95_cost_per_life_saved": [float(np.percentile(cost_arr, 2.5)), float(np.percentile(cost_arr, 97.5))],
            "positive_draws": int(cost_arr.size),
            "parameter_ranges": PARAMETER_RANGES,
        }

    @staticmethod
    def external_validation(districts: Sequence[DistrictData], months: int = 36) -> Dict[str, Any]:
        """Cross-district external consistency check.

        Compares each district's WHO/DHS-anchored baseline MMR input with the
        simulated baseline horizon MMR, and the DHS-anchored coverage inputs
        with the simulated end-state coverage.  MMR inputs double as the
        calibration anchor, so MMR deviation measures anchor stability over the
        horizon; coverage metrics compare against quantities not used to
        calibrate the mortality level.
        """
        scope = _require_scope(districts, "external validation")
        observed_mmr = np.array([float(d.baseline_mmr) for d in scope])
        observed_facility = np.array([float(d.institutional_delivery_rate) for d in scope])
        observed_anc1 = np.array([float(d.anc1_coverage) for d in scope])
        summaries = [SystemDynamicsEngine.simulate(d, "baseline", {}, months).summary for d in scope]
        predicted_mmr = np.array([s.horizon_mmr for s in summaries])
        predicted_facility = np.array([s.facility_delivery_rate_final for s in summaries])
        predicted_anc1 = np.array([s.anc_coverage_final for s in summaries])
        residuals = predicted_mmr - observed_mmr
        if np.std(observed_mmr) < 1e-12 or np.std(predicted_mmr) < 1e-12:
            r_squared = float("nan")
        else:
            r_squared = float(sps.pearsonr(observed_mmr, predicted_mmr).statistic ** 2)
        countries = sorted({d.country for d in scope})
        return {
            "method": "cross-district external consistency (observed model inputs vs simulated baseline outputs)",
            "test_district": f"all districts (n={len(scope)})",
            "country": ", ".join(countries),
            "observed_mmr": float(observed_mmr.mean()),
            "predicted_mmr": float(predicted_mmr.mean()),
            "rmse": float(np.sqrt(np.mean(residuals ** 2))),
            "r_squared": r_squared,
            "mean_absolute_error": float(np.mean(np.abs(residuals))),
            "max_absolute_error": float(np.max(np.abs(residuals))),
            "coverage_mean_absolute_error_pct": {
                "institutional_delivery": float(np.mean(np.abs(predicted_facility - observed_facility))),
                "anc1": float(np.mean(np.abs(predicted_anc1 - observed_anc1))),
            },
            "months": months,
            "note": ("Baseline MMR inputs are the calibration anchor of the engine; the MMR "
                     "metrics quantify how well that anchor holds across the horizon. Coverage "
                     "metrics compare DHS-anchored inputs with simulated end-state outputs."),
        }

    external = external_validation
