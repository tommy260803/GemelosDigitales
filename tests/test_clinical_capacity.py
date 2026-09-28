"""Clinical SPA contract and mechanistic checks without the optional API agent stack."""
import sys
from dataclasses import replace
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from services.model_inputs import districts_from_datasets, load_rows
from services.system_dynamics import SystemDynamicsEngine as Engine
from build_spa_inputs import prepare
from load_model_inputs import COLUMNS, SQL


def test_spa_values_reach_all_25_districts_without_replacing_staff_density():
    rows = load_rows()
    districts = districts_from_datasets()
    expected = {"Ethiopia": .85, "Ghana": .52, "Kenya": .46, "Tanzania": .30, "Uganda": .55}
    assert len(districts) == 25
    for district in districts:
        assert district.staff_247_availability_rate == expected[district.country]
        assert district.skilled_staff_ratio == float(rows["capacity"][district.id]["skilled_staff_per_10k"])
        legacy = Engine.effective_parameters(district, "baseline")
        assert legacy.road_quality_index == max(.2, 1 - district.avg_distance_to_emonc / 80)
        assert legacy.facility_delivery_fee_usd == (2.5 if district.insurance_coverage > 50 else 18.)


def test_spa_extraction_matches_versioned_csv_and_loader_contract():
    capacity, _, survey = prepare()
    assert len(survey) == 15 and len(capacity) == 25
    assert len(COLUMNS) == 29
    assert SQL.count("%s") == 30  # geom uses longitude + latitude
    assert "staff_247_availability_rate=EXCLUDED.staff_247_availability_rate" in SQL


def test_spa_model_uses_documented_default_and_allows_override():
    district = districts_from_datasets()[0]
    default = Engine.simulate(district, clinical_capacity_model="spa_247", simulation_months=12)
    assert default.parameters.non247_relative_capacity == .33
    assert default.summary.clinical_capacity_model == "spa_247"
    with pytest.raises(ValueError, match="requires SPA staff coverage"):
        Engine.simulate(replace(district, staff_247_availability_rate=None),
                        clinical_capacity_model="spa_247",
                        custom_params={"non247_relative_capacity": .5}, simulation_months=12)


def test_spa_equations_use_distinct_staff_dimensions_and_are_deterministic():
    district = districts_from_datasets()[0]
    p0 = Engine.effective_parameters(district, "baseline", {"non247_relative_capacity": 0}, "spa_247")
    p1 = Engine.effective_parameters(district, "baseline", {"non247_relative_capacity": 1}, "spa_247")
    state = [50, 30, 20, 12, 8, .7]
    low = Engine._clinical_capacity(state, p0, 100, "spa_247")
    high = Engine._clinical_capacity(state, p1, 100, "spa_247")
    assert low[0] == high[0]  # nominal density unchanged
    assert low[1] < high[1]  # effective capacity changes with coverage
    assert low[2] >= high[2]  # congestion cannot improve with lower capacity
    assert low[4] >= high[4]  # modeled facility-delay index
    assert low[5] == district.staff_247_availability_rate and high[5] == 1
    arguments = {"clinical_capacity_model": "spa_247", "custom_params": {"non247_relative_capacity": .5}, "simulation_months": 12}
    first = Engine.simulate(district, **arguments)
    again = Engine.simulate(district, **arguments)
    assert first.summary == again.summary and first.trajectories == again.trajectories
    assert first.summary.deaths_avoided == 0
    assert first.trajectories[-1].effective_capacity > 0
