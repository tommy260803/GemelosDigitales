from pathlib import Path
from services.model_inputs import FILES, INPUT_DIR, districts_from_datasets, load_rows
from services.system_dynamics import SystemDynamicsEngine

def test_all_versioned_datasets_validate_and_share_territories():
    rows=load_rows()
    assert set(rows)==set(FILES)
    assert all(len(group)==25 for group in rows.values())
    assert len(set(rows['demographics']))==25

def test_dataset_fallback_builds_25_valid_districts():
    districts=districts_from_datasets()
    assert len(districts)==25
    assert all(d.population>0 and d.annual_births>0 and d.baseline_mmr>0 for d in districts)

def test_dataset_fallback_is_deterministic():
    first=districts_from_datasets()[0]
    a=SystemDynamicsEngine.simulate(first,'scenario_d')
    b=SystemDynamicsEngine.simulate(first,'scenario_d')
    assert a.summary==b.summary

def test_all_input_files_are_present():
    assert all((INPUT_DIR / filename).exists() for filename,_ in FILES.values())

def test_api_runtime_district_matches_versioned_input(client):
    expected=next(d for d in districts_from_datasets() if d.id=='ke-garissa')
    response=client.get('/districts/ke-garissa')
    assert response.status_code==200
    payload=response.json()
    assert payload['population']==expected.population
    assert payload['annualBirths']==expected.annual_births
    assert payload['avgTravelTimeHours']==expected.avg_travel_time_hours

def test_frontend_has_no_runtime_territory_or_scientific_engine_source():
    root=Path(__file__).resolve().parents[2]
    assert not (root/'src/services/systemDynamics.ts').exists()
    assert 'SUB_SAHARAN_DISTRICTS' not in (root/'src/data/districts.ts').read_text(encoding='utf-8')
    assert "from './data/districts'" not in (root/'src/App.tsx').read_text(encoding='utf-8')
