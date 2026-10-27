from types import SimpleNamespace

import pytest

from services.model_inputs import districts_from_datasets, quintile_coverage_by_district
from services.system_dynamics import SystemDynamicsEngine


def test_equity_simulation_uses_the_quintile_mmr_it_reports(monkeypatch, garissa_district):
    equity_inputs = [
        {
            "quintile": "q1_poorest",
            "population_share": 0.5,
            "anc1_rate": 0.6,
            "institutional_delivery_rate": 0.4,
        },
        {
            "quintile": "q5_richest",
            "population_share": 0.5,
            "anc1_rate": 0.9,
            "institutional_delivery_rate": 0.9,
        },
    ]
    calls = []

    def fake_simulate(district, scenario_id, custom_params=None, simulation_months=36,
                      dt=None, baseline_result=None, clinical_capacity_model="spa_247",
                      **kwargs):
        calls.append((scenario_id, district.baseline_mmr))
        outcome_mmr = district.baseline_mmr if scenario_id == "baseline" else district.baseline_mmr * 0.8
        summary = SimpleNamespace(
            horizon_mmr=outcome_mmr,
            total_maternal_deaths=10.0,
            deaths_avoided=2.0,
            mortality_reduction_percent=20.0,
            total_cost_usd=100.0,
        )
        return SimpleNamespace(summary=summary)

    monkeypatch.setattr(SystemDynamicsEngine, "simulate", staticmethod(fake_simulate))
    result = SystemDynamicsEngine._equity(
        garissa_district,
        "scenario_d",
        equity_inputs,
        simulation_months=36,
        dt=0.1,
        clinical_capacity_model="spa_247",
    )

    expected = garissa_district.wealth_quintile_mmr
    baseline_calls = [mmr for scenario, mmr in calls if scenario == "baseline"]
    assert baseline_calls == [expected["q1_poorest"], expected["q5_richest"]]
    for row in result:
        assert row["simulated_baseline_mmr"] == pytest.approx(row["baseline_mmr"])
        assert "MODEL_INPUT" in row["baseline_mmr_source_type"]


def test_equity_rejects_quintile_without_mmr_anchor(garissa_district):
    garissa_district.wealth_quintile_mmr = {}
    with pytest.raises(ValueError, match="quintile MMR calibration anchor"):
        SystemDynamicsEngine._equity(
            garissa_district,
            "scenario_d",
            [{
                "quintile": "q1_poorest",
                "population_share": 1.0,
                "anc1_rate": 0.8,
                "institutional_delivery_rate": 0.7,
            }],
            simulation_months=36,
            dt=0.1,
            clinical_capacity_model="spa_247",
        )


def test_garissa_simulated_baseline_preserves_reference_mmr_order():
    district = next(d for d in districts_from_datasets() if d.id == "ke-garissa")
    equity_inputs = quintile_coverage_by_district()[district.id]
    result = SystemDynamicsEngine.simulate(
        district, "baseline", {}, 36, equity_inputs=equity_inputs
    )
    by_quintile = {row["quintile"]: row for row in result.equity_disaggregation}
    assert by_quintile["q1_poorest"]["baseline_mmr"] > by_quintile["q5_richest"]["baseline_mmr"]
    assert (
        by_quintile["q1_poorest"]["simulated_baseline_mmr"]
        > by_quintile["q5_richest"]["simulated_baseline_mmr"]
    )


def test_congestion_compares_stock_derived_flows_with_capacity_flow(garissa_district):
    parameters = SystemDynamicsEngine.effective_parameters(
        garissa_district, "baseline", clinical_capacity_model="spa_247"
    )
    births_per_month = garissa_district.annual_births / 12
    state = [0.0, 0.0, 120.0, 0.0, 15.0, 0.72]
    _, effective_capacity, congestion, _, _, _ = SystemDynamicsEngine._clinical_capacity(
        state, parameters, births_per_month, "spa_247"
    )
    delivery_flow = state[2] / SystemDynamicsEngine.DELIVERY_STOCK_RESIDENCE_MONTHS
    complication_flow = (
        state[4] * 1.8 / SystemDynamicsEngine.COMPLICATION_STOCK_RESIDENCE_MONTHS
    )
    assert congestion == pytest.approx(
        min(2.5, (delivery_flow + complication_flow) / effective_capacity)
    )


def test_stock_balance_accounts_for_deaths_recovery_and_boundary_outflow(monkeypatch):
    state = [20.0, 10.0, 8.0, 12.0, 5.0, 0.7]
    context = {
        "f12": 10.0,
        "f1t": 20.0,
        "f2t": 5.0,
        "facility_del": 20.0,
        "home_del": 5.0,
        "hcomp": 4.0,
        "refs": 2.0,
        "unref": 2.0,
        "home": 0.2,
        "fac": 0.1,
        "transit": 0.1,
    }
    monkeypatch.setattr(
        SystemDynamicsEngine,
        "_context",
        staticmethod(lambda *args, **kwargs: context),
    )
    parameters = SimpleNamespace(community_trust_baseline=0.72)
    anchors = {"preg": 30.0, "rolling": 400.0, "input_mmr": 400.0}
    derivatives = SystemDynamicsEngine._derivatives(
        state, parameters, anchors, "scenario_d"
    )
    expected_net = (
        anchors["preg"]
        - context["home"]
        - context["fac"]
        - context["transit"]
        - state[3] / SystemDynamicsEngine.POSTPARTUM_STOCK_RESIDENCE_MONTHS
    )
    assert sum(derivatives[:5]) == pytest.approx(expected_net)

