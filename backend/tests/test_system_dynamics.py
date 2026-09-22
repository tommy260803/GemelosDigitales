"""Scientific-integrity and numerical tests for the deterministic SD engine."""
import math
import pytest
from services.system_dynamics import SystemDynamicsEngine, SCENARIO_DEFINITIONS

def test_baseline_has_zero_paired_effect(garissa_district):
    r=SystemDynamicsEngine.simulate(garissa_district,'baseline')
    assert r.summary.deaths_avoided == 0
    assert r.summary.mortality_reduction_percent == 0
    assert r.summary.total_cost_usd == 0

def test_horizon_mmr_formula(garissa_district):
    r=SystemDynamicsEngine.simulate(garissa_district)
    assert r.summary.horizon_mmr == pytest.approx(r.summary.total_maternal_deaths/r.summary.total_births*100000)

def test_paired_deaths_avoided(garissa_district):
    base=SystemDynamicsEngine.simulate(garissa_district)
    for scenario in ('scenario_a','scenario_b','scenario_c','scenario_d'):
        r=SystemDynamicsEngine.simulate(garissa_district,scenario,baseline_result=base)
        assert r.summary.deaths_avoided == pytest.approx(base.summary.total_maternal_deaths-r.summary.total_maternal_deaths)

def test_state_bounds_and_telemetry(garissa_district):
    r=SystemDynamicsEngine.simulate(garissa_district,'scenario_d',simulation_months=12)
    assert len(r.trajectories)==12
    for x in r.trajectories:
        assert all(v>=0 and math.isfinite(v) for v in (x.pregnant_women,x.in_anc,x.in_facility_delivery,x.in_postpartum,x.with_complications,x.monthly_births,x.monthly_maternal_deaths,x.monthly_mmr,x.home_deliveries,x.facility_deliveries,x.emergency_referrals))
        assert 0<=x.referral_probability<=1 and 0<=x.anc_coverage_percent<=100 and 0<=x.facility_delivery_percent<=100 and 0<=x.system_trust_level<=1

def test_invalid_parameters_are_rejected(garissa_district):
    with pytest.raises(ValueError): SystemDynamicsEngine.simulate(garissa_district,custom_params={'insurance_coverage_rate':1.1})
    with pytest.raises(ValueError): SystemDynamicsEngine.simulate(garissa_district,custom_params={'unknown':1})

def test_deterministic(garissa_district):
    a=SystemDynamicsEngine.simulate(garissa_district,'scenario_d')
    b=SystemDynamicsEngine.simulate(garissa_district,'scenario_d')
    assert a.summary==b.summary and a.trajectories==b.trajectories

def test_rk4_convergence(garissa_district):
    c=SystemDynamicsEngine.convergence_check(garissa_district,'scenario_d',12)
    coarse,fine=c['0.1'],c['0.025']
    assert abs(coarse['horizon_mmr']-fine['horizon_mmr'])/fine['horizon_mmr'] < .01

def test_scenario_rules_are_explicit(garissa_district):
    base=SystemDynamicsEngine.effective_parameters(garissa_district,'baseline')
    assert SystemDynamicsEngine.effective_parameters(garissa_district,'scenario_a').travel_time_hours <= base.travel_time_hours
    assert SystemDynamicsEngine.effective_parameters(garissa_district,'scenario_b').facility_delivery_fee_usd == 0
    assert SystemDynamicsEngine.effective_parameters(garissa_district,'scenario_c').tba_influence_factor <= base.tba_influence_factor
    d=SystemDynamicsEngine.effective_parameters(garissa_district,'scenario_d')
    assert d.blood_availability_rate>=.92 and d.oxytocin_misoprostol_stock_rate>=.95 and d.skilled_staff_ratio>=2.2
    assert len(SCENARIO_DEFINITIONS)==5

def test_equity_is_not_synthetic_output(garissa_district):
    assert SystemDynamicsEngine.simulate(garissa_district,'scenario_d').equity_disaggregation == []
