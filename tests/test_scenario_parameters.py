import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from services.model_inputs import districts_from_datasets
from services.system_dynamics import SystemDynamicsEngine


def test_requested_scenario_assumptions_are_explicit():
    district = districts_from_datasets()[0]
    base = SystemDynamicsEngine.effective_parameters(district, "baseline")
    a = SystemDynamicsEngine.effective_parameters(district, "scenario_a")
    d = SystemDynamicsEngine.effective_parameters(district, "scenario_d")
    assert base.non247_relative_capacity == .33
    assert a.travel_time_hours <= base.travel_time_hours * .5
    assert d.staff_247_availability_rate == .95
    assert d.blood_availability_rate == .95
    assert d.oxytocin_misoprostol_stock_rate == .95
