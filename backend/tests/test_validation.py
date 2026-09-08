"""
Tests for Statistical Validation Suite.
"""

from services.validation import StatisticalValidationPy
import numpy as np


class TestKolmogorovSmirnov:
    """Tests for Kolmogorov-Smirnov two-sample test."""

    def test_ks_returns_valid_data(self, garissa_district):
        result = StatisticalValidationPy.kolmogorov_smirnov(garissa_district)
        assert "statistic_d" in result
        assert "p_value" in result
        assert 0 <= result["statistic_d"] <= 1
        assert 0 <= result["p_value"] <= 1

    def test_ks_has_critical_value(self, garissa_district):
        result = StatisticalValidationPy.kolmogorov_smirnov(garissa_district)
        assert "critical_value" in result
        assert result["critical_value"] > 0

    def test_ks_has_distributions(self, garissa_district):
        result = StatisticalValidationPy.kolmogorov_smirnov(garissa_district)
        assert "simulated_distribution" in result
        assert "dhs_empirical_distribution" in result
        assert len(result["simulated_distribution"]) == 40
        assert len(result["dhs_empirical_distribution"]) == 40


class TestSobolSensitivity:
    """Tests for Sobol global sensitivity analysis."""

    def test_sobol_returns_6_parameters(self, garissa_district):
        result = StatisticalValidationPy.sobol_sensitivity(garissa_district)
        assert len(result["parameters"]) == 6

    def test_sobol_first_order_sum_lte_1(self, garissa_district):
        result = StatisticalValidationPy.sobol_sensitivity(garissa_district)
        s1_sum = sum(result["first_order_indices"])
        assert s1_sum <= 1.0 + 1e-6

    def test_sobol_total_order_gte_first_order(self, garissa_district):
        result = StatisticalValidationPy.sobol_sensitivity(garissa_district)
        for s1, st in zip(result["first_order_indices"], result["total_order_indices"]):
            assert st >= s1

    def test_sobol_has_top_contributors(self, garissa_district):
        result = StatisticalValidationPy.sobol_sensitivity(garissa_district)
        assert "top_variance_contributors" in result
        assert len(result["top_variance_contributors"]) == 3

    def test_sobol_has_confidence_intervals(self, garissa_district):
        result = StatisticalValidationPy.sobol_sensitivity(garissa_district)
        assert "confidence_intervals" in result
        assert len(result["confidence_intervals"]) == 6
        for ci in result["confidence_intervals"]:
            assert len(ci) == 2
            assert ci[0] <= ci[1]


class TestBootstrapConfidence:
    """Tests for bootstrap confidence intervals."""

    def test_bootstrap_returns_iterations(self, garissa_district):
        result = StatisticalValidationPy.bootstrap_confidence_intervals(garissa_district, iterations=100)
        assert result["iterations"] == 100

    def test_bootstrap_ci_contains_mean(self, garissa_district):
        result = StatisticalValidationPy.bootstrap_confidence_intervals(garissa_district, iterations=200)
        mean = result["mean_lives_saved"]
        ci_low, ci_high = result["ci95_lives_saved"]
        assert ci_low <= mean <= ci_high

    def test_bootstrap_ci_ordered(self, garissa_district):
        result = StatisticalValidationPy.bootstrap_confidence_intervals(garissa_district, iterations=200)
        ci_low, ci_high = result["ci95_lives_saved"]
        assert ci_low <= ci_high
        ci_low_cost, ci_high_cost = result["ci95_cost_per_life_saved"]
        assert ci_low_cost <= ci_high_cost

    def test_bootstrap_lives_saved_positive(self, garissa_district):
        result = StatisticalValidationPy.bootstrap_confidence_intervals(garissa_district, iterations=200)
        assert result["mean_lives_saved"] > 0


class TestExternalValidation:
    """Tests for external holdout validation."""

    def test_external_validation_returns_metrics(self, garissa_district):
        result = StatisticalValidationPy.external_validation(garissa_district)
        assert "rmse" in result
        assert "r_squared" in result
        assert "mean_absolute_error" in result
        assert result["rmse"] >= 0
        assert result["mean_absolute_error"] >= 0

    def test_external_validation_multi_district(self, all_demo_districts):
        result = StatisticalValidationPy.external_validation(
            all_demo_districts[0], all_demo_districts
        )
        assert result["test_district"] == "Garissa District"
        assert result["rmse"] >= 0
