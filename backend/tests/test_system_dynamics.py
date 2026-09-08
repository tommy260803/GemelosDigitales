"""
Tests for the System Dynamics Engine (5-Stock ODE Model).
"""

from services.system_dynamics import (
    SystemDynamicsEngine, DistrictData, SDParameters,
    StockState, SimulationResult, SCENARIO_DEFINITIONS,
    build_default_parameters
)


class TestBuildDefaultParameters:
    """Tests for build_default_parameters()."""

    def test_returns_18_params(self, garissa_district):
        params = build_default_parameters(garissa_district)
        assert isinstance(params, SDParameters)
        fields = [f.name for f in SDParameters.__dataclass_fields__.values()]
        assert len(fields) == 18

    def test_values_are_reasonable(self, garissa_district):
        params = build_default_parameters(garissa_district)
        assert 0 < params.travel_time_hours < 20
        assert 0 <= params.road_quality_index <= 1.0
        assert 0 <= params.insurance_coverage_rate <= 1.0
        assert 0 <= params.skilled_staff_ratio < 10
        assert 0 <= params.blood_availability_rate <= 1.0


class TestSimulateBaseline:
    """Tests for baseline scenario (no reduction)."""

    def test_baseline_no_reduction(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline')
        assert isinstance(result, SimulationResult)
        assert result.scenario_id == 'baseline'
        assert result.summary.mmr_baseline == 646.0
        assert result.summary.mmr_reduction_percent == 0
        assert abs(result.summary.mmr_final - result.summary.mmr_baseline) <= 10

    def test_baseline_zero_cost(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline')
        assert result.summary.total_cost_usd == 0
        assert result.summary.cost_per_life_saved_usd == 0


class TestSimulateScenarios:
    """Tests for intervention scenarios."""

    def test_scenario_d_best_reduction(self, garissa_district):
        baseline = SystemDynamicsEngine.simulate(garissa_district, 'baseline')
        scenario_a = SystemDynamicsEngine.simulate(garissa_district, 'scenario_a')
        scenario_b = SystemDynamicsEngine.simulate(garissa_district, 'scenario_b')
        scenario_c = SystemDynamicsEngine.simulate(garissa_district, 'scenario_c')
        scenario_d = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')

        assert scenario_a.summary.mmr_reduction_percent > 0
        assert scenario_b.summary.mmr_reduction_percent > 0
        assert scenario_c.summary.mmr_reduction_percent > 0
        assert scenario_d.summary.mmr_reduction_percent > scenario_a.summary.mmr_reduction_percent
        assert scenario_d.summary.mmr_reduction_percent > scenario_b.summary.mmr_reduction_percent
        assert scenario_d.summary.mmr_reduction_percent > scenario_c.summary.mmr_reduction_percent

    def test_all_scenarios_reduce_lives_saved_positive(self, garissa_district):
        for scenario_id in ['scenario_a', 'scenario_b', 'scenario_c', 'scenario_d']:
            result = SystemDynamicsEngine.simulate(garissa_district, scenario_id)
            assert result.summary.lives_saved > 0, f"{scenario_id} should save lives"

    def test_scenario_costs_positive(self, garissa_district):
        for scenario_id in ['scenario_a', 'scenario_b', 'scenario_c', 'scenario_d']:
            result = SystemDynamicsEngine.simulate(garissa_district, scenario_id)
            assert result.summary.total_cost_usd > 0, f"{scenario_id} should have cost > 0"
            assert result.summary.cost_per_life_saved_usd > 0


class TestTrajectories:
    """Tests for simulation trajectory output."""

    def test_trajectory_count_36_months(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline', simulation_months=36)
        assert len(result.trajectories) == 36

    def test_trajectory_count_12_months(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline', simulation_months=12)
        assert len(result.trajectories) == 12

    def test_trajectory_fields_complete(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline', simulation_months=12)
        assert len(result.trajectories) > 0
        snapshot = result.trajectories[0]
        assert isinstance(snapshot, StockState)
        assert snapshot.time_month >= 0
        assert snapshot.pregnant_women >= 0
        assert snapshot.in_anc >= 0
        assert snapshot.in_facility_delivery >= 0
        assert snapshot.in_postpartum >= 0
        assert snapshot.with_complications >= 0
        assert snapshot.monthly_maternal_deaths >= 0
        assert snapshot.calculated_mmr >= 0
        assert 0 <= snapshot.system_trust_level <= 1.0
        assert snapshot.phase2_delay_hours >= 0
        assert snapshot.phase3_delay_hours >= 0


class TestEquity:
    """Tests for equity disaggregation."""

    def test_equity_5_quintiles(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')
        assert len(result.equity_disaggregation) == 5

    def test_equity_quintile_labels(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')
        labels = [q.label for q in result.equity_disaggregation]
        assert 'Poorest 20%' in labels
        assert 'Richest 20%' in labels

    def test_poorer_quintiles_get_more_benefit(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')
        q1 = result.equity_disaggregation[0]
        q5 = result.equity_disaggregation[4]
        assert q1.lives_saved >= q5.lives_saved


class TestMultiCountry:
    """Tests that engine works across different countries."""

    def test_ke_garissa(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')
        assert result.country == 'Kenya'
        assert result.summary.mmr_reduction_percent > 0

    def test_ug_moroto(self, moroto_district):
        result = SystemDynamicsEngine.simulate(moroto_district, 'scenario_d')
        assert result.country == 'Uganda'
        assert result.summary.mmr_reduction_percent > 0

    def test_gh_ashanti(self, ashanti_district):
        result = SystemDynamicsEngine.simulate(ashanti_district, 'scenario_d')
        assert result.country == 'Ghana'
        assert result.summary.mmr_reduction_percent > 0

    def test_et_afar(self, afar_district):
        result = SystemDynamicsEngine.simulate(afar_district, 'scenario_d')
        assert result.country == 'Ethiopia'
        assert result.summary.mmr_reduction_percent > 0


class TestScenarioDefinitions:
    """Tests for SCENARIO_DEFINITIONS."""

    def test_5_scenarios_defined(self):
        assert len(SCENARIO_DEFINITIONS) == 5

    def test_baseline_is_first(self):
        assert SCENARIO_DEFINITIONS[0]['id'] == 'baseline'
        assert SCENARIO_DEFINITIONS[0]['cost_per_capita_usd'] == 0.0

    def test_all_scenarios_have_required_fields(self):
        required = ['id', 'letter', 'name', 'description', 'mechanism', 'cost_per_capita_usd', 'parameter_overrides']
        for s in SCENARIO_DEFINITIONS:
            for field in required:
                assert field in s, f"Missing '{field}' in scenario {s['id']}"
