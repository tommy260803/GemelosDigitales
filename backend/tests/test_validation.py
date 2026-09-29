"""Tests for the real statistical validation procedures.

The procedures must compute their statistics from live engine output and
versioned inputs; these tests assert real-value ranges, documented scoping,
and reproducible parameter-uncertainty propagation.
"""
import math

import pytest

from services.model_inputs import districts_from_datasets
from services.validation import (
    PARAMETER_RANGES,
    ScientificProcedureUnavailable,
    StatisticalValidationPy,
)


@pytest.fixture(scope="module")
def all_districts():
    return districts_from_datasets()


def test_scope_requirement_raises_for_too_few_districts(garissa_district):
    with pytest.raises(ScientificProcedureUnavailable):
        StatisticalValidationPy.kolmogorov_smirnov([garissa_district])


def test_ks_two_sample_returns_real_statistics(all_districts):
    result = StatisticalValidationPy.kolmogorov_smirnov(all_districts)
    assert 0.0 <= result["statistic_d"] <= 1.0
    assert 0.0 <= result["p_value"] <= 1.0
    assert result["critical_value"] > 0
    assert result["n_observed"] == len(all_districts) == result["n_simulated"]
    assert result["is_statistically_equivalent"] is (result["p_value"] >= 0.05)
    observed = result["observed_values_pct"]
    simulated = result["simulated_values_pct"]
    assert len(observed) == len(simulated) == 25
    assert max(observed) > min(observed)
    assert max(simulated) > min(simulated)
    assert result["method"]


def test_wilcoxon_signed_rank_returns_real_statistics(all_districts):
    result = StatisticalValidationPy.wilcoxon_signed_rank(all_districts)
    assert 0.0 <= result["p_value"] <= 1.0
    assert result["statistic"] >= 0
    assert result["n_pairs"] == 25
    assert math.isfinite(result["median_difference_pct"])
    assert result["reject_null_bias"] is (result["p_value"] < 0.05)


def test_external_validation_cross_district_metrics(all_districts):
    result = StatisticalValidationPy.external_validation(all_districts, months=12)
    assert result["test_district"].startswith("all districts")
    assert 0.0 <= result["r_squared"] <= 1.0
    assert result["rmse"] >= 0 and result["mean_absolute_error"] >= 0
    assert result["observed_mmr"] > 0 and result["predicted_mmr"] > 0
    coverage = result["coverage_mean_absolute_error_pct"]
    assert set(coverage) == {"institutional_delivery", "anc1"}
    assert all(value >= 0 for value in coverage.values())


def test_bootstrap_propagates_parameter_uncertainty(garissa_district):
    result = StatisticalValidationPy.bootstrap_confidence_intervals(
        garissa_district, "scenario_d", iterations=10, months=12, seed=7
    )
    assert result["iterations"] == 10
    low, high = result["ci95_lives_saved"]
    assert low <= high
    assert math.isfinite(result["mean_lives_saved"])
    clow, chigh = result["ci95_cost_per_life_saved"]
    assert 0 <= clow <= chigh
    assert set(result["parameter_ranges"]) == set(PARAMETER_RANGES)
    assert result["seed"] == 7


def test_bootstrap_rejects_tiny_iteration_counts(garissa_district):
    with pytest.raises(ValueError):
        StatisticalValidationPy.bootstrap_confidence_intervals(
            garissa_district, iterations=5, months=12
        )


def test_sobol_indices_are_computed_not_fixed(garissa_district):
    result = StatisticalValidationPy.sobol_sensitivity(
        garissa_district, "scenario_d", n_samples=16, months=12, seed=42
    )
    names = result["parameters"]
    assert len(names) == len(PARAMETER_RANGES)
    assert result["n_model_runs"] == 16 * (len(names) + 2)
    assert len(result["first_order_indices"]) == len(names)
    assert len(result["total_order_indices"]) == len(names)
    assert all(math.isfinite(v) for v in result["first_order_indices"])
    assert all(math.isfinite(v) for v in result["total_order_indices"])
    assert all(-1.0 <= v <= 1.5 for v in result["total_order_indices"])
    assert len(result["top_variance_contributors"]) == 3
    assert result["output_variable"].startswith("deaths_avoided")


def test_sobol_rejects_non_power_of_two_samples(garissa_district):
    with pytest.raises(ValueError):
        StatisticalValidationPy.sobol_sensitivity(garissa_district, n_samples=100)


def test_sobol_is_deterministic_for_fixed_seed(garissa_district):
    kwargs = dict(scenario_id="scenario_d", n_samples=16, months=12, seed=42)
    first = StatisticalValidationPy.sobol_sensitivity(garissa_district, **kwargs)
    second = StatisticalValidationPy.sobol_sensitivity(garissa_district, **kwargs)
    assert first["first_order_indices"] == second["first_order_indices"]
    assert first["total_order_indices"] == second["total_order_indices"]
