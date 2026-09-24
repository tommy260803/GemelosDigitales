"""
Tests for FastAPI API endpoints.
"""

from unittest.mock import patch


class TestHealthEndpoints:
    """Tests for health and root endpoints."""

    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Maternal Health Digital Twin API"
        assert data["version"] == "2.4.0"
        assert data["status"] == "operational"


class TestDistrictsEndpoint:
    """Tests for districts endpoints."""

    def test_districts_returns_all(self, client):
        response = client.get("/districts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 25

    def test_districts_filter_by_country(self, client):
        response = client.get("/districts?country=Kenya")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        assert all(d["country"] == "Kenya" for d in data)

    def test_district_by_id(self, client):
        response = client.get("/districts/ke-garissa")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "ke-garissa"
        assert data["name"] == "Garissa District"
        assert data["country"] == "Kenya"
        assert "wealthQuintileMMR" in data
        assert "baselineMMR" in data
        assert "anc4Coverage" in data

    def test_district_404(self, client):
        response = client.get("/districts/invalid-id")
        assert response.status_code == 404


class TestSimulationEndpoints:
    """Tests for simulation endpoints."""

    def test_simulation_run_baseline(self, client):
        response = client.post("/simulation/run", json={
            "district_id": "ke-garissa",
            "scenario_id": "baseline",
            "months": 12
        })
        assert response.status_code == 200
        data = response.json()
        assert data["district_id"] == "ke-garissa"
        assert data["scenario_id"] == "baseline"
        assert data["trajectory_count"] == 12
        assert "summary" in data
        assert data["equity_disaggregation"] == []
        assert len(data["trajectories"]) == 12
        assert data["summary"]["deaths_avoided"] == 0
        assert data["run_metadata"]["integrator"] == "RK4"
        assert data["run_metadata"]["deterministic"] is True

    def test_simulation_run_scenario_d(self, client):
        response = client.post("/simulation/run", json={
            "district_id": "ke-garissa",
            "scenario_id": "scenario_d",
            "months": 36
        })
        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "scenario_d"
        assert data["summary"]["mortality_reduction_percent"] > 0
        assert data["summary"]["deaths_avoided"] > 0

    def test_simulation_invalid_district(self, client):
        response = client.post("/simulation/run", json={
            "district_id": "nonexistent",
            "scenario_id": "baseline"
        })
        assert response.status_code == 404


class TestScenarioComparison:
    """Tests for scenario comparison endpoint."""

    def test_compare_returns_5_scenarios(self, client):
        response = client.get("/simulation/compare/ke-garissa")
        assert response.status_code == 200
        data = response.json()
        assert data["district_id"] == "ke-garissa"
        assert "comparison" in data
        comparison = data["comparison"]
        assert len(comparison) == 5
        assert "baseline" in comparison
        assert "scenario_a" in comparison
        assert "scenario_b" in comparison
        assert "scenario_c" in comparison
        assert "scenario_d" in comparison

    def test_compare_scenario_d_reduces_mmr(self, client):
        response = client.get("/simulation/compare/ke-garissa")
        data = response.json()
        comparison = data["comparison"]
        assert comparison["baseline"]["deaths_avoided"] == 0
        assert comparison["scenario_d"]["horizon_mmr"] < comparison["baseline"]["horizon_mmr"]


class TestValidationEndpoints:
    """Tests for validation endpoints."""

    def test_validation_ks(self, client):
        response = client.post("/validation/ks", json={"district_id": "ke-garissa"})
        assert response.status_code == 410

    def test_validation_sobol(self, client):
        response = client.post("/validation/sobol", json={"district_id": "ke-garissa"})
        assert response.status_code == 410

    def test_validation_bootstrap(self, client):
        response = client.post("/validation/bootstrap", json={"district_id": "ke-garissa"})
        assert response.status_code == 410

    def test_validation_external(self, client):
        response = client.get("/validation/external/ke-garissa")
        assert response.status_code == 410

    def test_validation_convergence(self, client):
        response = client.get("/validation/convergence/ke-garissa?scenario_id=scenario_d&months=12")
        assert response.status_code == 200
        data = response.json()
        assert data["district_id"] == "ke-garissa"
        assert data["is_convergent"] is True
        assert data["status"] == "PASS"
        assert "timesteps" in data
        assert "0.1" in data["timesteps"]
        assert "0.025" in data["timesteps"]
        assert data["relative_error_mmr"] < 0.01


class TestScenariosEndpoint:
    """Tests for scenarios endpoint."""

    def test_scenarios_returns_5(self, client):
        response = client.get("/scenarios")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        ids = [s['id'] for s in data]
        assert 'baseline' in ids
        assert 'scenario_d' in ids
