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
    assert d.blood_availability_rate == .95
    assert d.oxytocin_misoprostol_stock_rate == .95
    assert d.staff_247_availability_rate == .95
    assert len(SCENARIO_DEFINITIONS)==5

def test_equity_is_not_synthetic_output(garissa_district):
    assert SystemDynamicsEngine.simulate(garissa_district,'scenario_d').equity_disaggregation == []

def test_equity_rows_come_from_supplied_stratified_inputs(garissa_district):
    rows=[
        {'quintile':'q1_poorest','label':'Q1 poorest','population_share':0.25,
         'anc1_rate':0.55,'anc4_rate':0.25,'institutional_delivery_rate':0.30},
        {'quintile':'q5_richest','label':'Q5 richest','population_share':0.25,
         'anc1_rate':0.95,'anc4_rate':0.80,'institutional_delivery_rate':0.94},
    ]
    r=SystemDynamicsEngine.simulate(garissa_district,'scenario_d',equity_inputs=rows)
    assert len(r.equity_disaggregation)==2
    q1,q5=r.equity_disaggregation
    assert q1['population_share']==0.25 and q5['population_share']==0.25
    assert q1['baseline_mmr']==garissa_district.wealth_quintile_mmr['q1_poorest']
    assert q5['baseline_mmr']==garissa_district.wealth_quintile_mmr['q5_richest']
    assert q1['benefit_cost_ratio'] is None
    assert q1['fiscal_cost_usd']>0 and q5['fiscal_cost_usd']>0
    assert q1['fiscal_cost_usd']+q5['fiscal_cost_usd'] < r.summary.total_cost_usd
    assert abs(q1['relative_reduction'])<60
    assert q1['lives_saved']>=0
    # the poorer quintile (lower coverage inputs) ends the horizon worse off
    assert q1['simulated_mmr']>q5['simulated_mmr']
