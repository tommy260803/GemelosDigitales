"""
Maternal Health Digital Twin - FastAPI Backend
===============================================
RESTful API for System Dynamics Simulation Engine
"""

import os
import uuid
from dataclasses import asdict
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor

from services.system_dynamics import (
    SystemDynamicsEngine, DistrictData, SimulationResult,
    SCENARIO_DEFINITIONS, build_default_parameters
)
from services.validation import StatisticalValidationPy
from services.calibrator import ModelCalibratorPy
from services.model_inputs import districts_from_datasets
from services.analysis_agent import run_agent

# =========================================================
# APP CONFIGURATION
# =========================================================

app = FastAPI(
    title="Maternal Health Digital Twin API",
    description="System Dynamics Simulation Engine for Sub-Saharan African Health Districts",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_db_connection():
    db_url = os.environ.get('DATABASE_URL', 'postgresql://twin_admin:secure_twin_password_2026@localhost:5433/maternal_twin_db')
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

# =========================================================
# PYDANTIC MODELS
# =========================================================

class SimulationRequest(BaseModel):
    district_id: str
    scenario_id: str = 'baseline'
    months: int = Field(default=36, ge=12, le=240)
    custom_params: Optional[Dict[str, float]] = None

class CalibrationRequest(BaseModel):
    district_id: str
    empirical_mmr_series: List[float]

class ValidationRequest(BaseModel):
    district_id: str
    test_type: str = 'KS'  # KS, WILCOXON, SOBOL, BOOTSTRAP

class AgentChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    district_id: Optional[str] = None
    scenario_id: Optional[str] = None

class AgentAnalyzeRequest(BaseModel):
    district_id: str
    analysis_type: str = 'bottleneck'  # bottleneck, comparison, intervention
    months: int = Field(default=36, ge=12, le=240)

class DistrictResponse(BaseModel):
    id: str
    name: str
    country: str
    region: str
    population: int
    annual_births: int
    baseline_mmr: float
    anc1_coverage: float
    anc4_coverage: float
    institutional_delivery_rate: float
    c_section_rate: float
    avg_distance_to_emonc: float
    avg_travel_time_hours: float
    skilled_staff_ratio: float
    blood_bank_availability: float
    essential_drugs_availability: float
    insurance_coverage: float
    poverty_rate: float
    female_secondary_education: float
    traditional_birth_attendant_prevalence: float
    lat: float
    lng: float
    osm_health_facilities_count: int
    wealth_quintile_mmr: Dict[str, float]

class SimulationResponse(BaseModel):
    district_id: str
    district_name: str
    country: str
    scenario_id: str
    scenario_name: str
    summary: Dict[str, Any]
    equity_disaggregation: List[Dict[str, Any]]
    trajectory_count: int
    trajectories: List[Dict[str, Any]] = []
    equity_status: Optional[str] = None
    run_metadata: Dict[str, Any] = {}

# =========================================================
# HELPER FUNCTIONS
# =========================================================

def fetch_district_from_db(district_id: str) -> Optional[DistrictData]:
    """Fetch PostgreSQL runtime data; CSV inputs are the non-DB fallback."""
    # Try database first
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, country, region, population, annual_births, baseline_mmr,
                   anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate,
                   avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio,
                   blood_bank_availability, essential_drugs_availability, insurance_coverage,
                   poverty_rate, female_secondary_education, tba_prevalence,
                   ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng, health_facilities_count as osm_health_facilities_count, wealth_quintiles_mmr
            FROM health_districts WHERE id = %s
        """, (district_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            return DistrictData(
                id=row['id'],
                name=row['name'],
                country=row['country'],
                region=row['region'],
                population=row['population'],
                annual_births=row['annual_births'],
                baseline_mmr=float(row['baseline_mmr']),
                anc1_coverage=float(row['anc1_coverage']),
                anc4_coverage=float(row['anc4_coverage']),
                institutional_delivery_rate=float(row['institutional_delivery_rate']),
                c_section_rate=float(row['c_section_rate']),
                avg_distance_to_emonc=float(row['avg_distance_emonc_km']),
                avg_travel_time_hours=float(row['avg_travel_time_hours']),
                skilled_staff_ratio=float(row['skilled_staff_ratio']),
                blood_bank_availability=float(row['blood_bank_availability']),
                essential_drugs_availability=float(row['essential_drugs_availability']),
                insurance_coverage=float(row['insurance_coverage']),
                poverty_rate=float(row['poverty_rate']),
                female_secondary_education=float(row['female_secondary_education']),
                traditional_birth_attendant_prevalence=float(row['tba_prevalence']),
                lat=float(row['lat']),
                lng=float(row['lng']),
                osm_health_facilities_count=row['osm_health_facilities_count'],
                wealth_quintile_mmr=row['wealth_quintiles_mmr']
            )
    except Exception as e:
        print(f"Database unavailable, using versioned model-input datasets: {e}")
    
    return next((d for d in districts_from_datasets() if d.id == district_id), None)

def fetch_all_districts_from_db() -> List[DistrictData]:
    """Fetch all runtime districts; versioned datasets are the fallback."""
    districts = []
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, country, region, population, annual_births, baseline_mmr,
                   anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate,
                   avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio,
                   blood_bank_availability, essential_drugs_availability, insurance_coverage,
                   poverty_rate, female_secondary_education, tba_prevalence,
                   ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng, health_facilities_count as osm_health_facilities_count, wealth_quintiles_mmr
            FROM health_districts ORDER BY country, name
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        for row in rows:
            districts.append(DistrictData(
                id=row['id'],
                name=row['name'],
                country=row['country'],
                region=row['region'],
                population=row['population'],
                annual_births=row['annual_births'],
                baseline_mmr=float(row['baseline_mmr']),
                anc1_coverage=float(row['anc1_coverage']),
                anc4_coverage=float(row['anc4_coverage']),
                institutional_delivery_rate=float(row['institutional_delivery_rate']),
                c_section_rate=float(row['c_section_rate']),
                avg_distance_to_emonc=float(row['avg_distance_emonc_km']),
                avg_travel_time_hours=float(row['avg_travel_time_hours']),
                skilled_staff_ratio=float(row['skilled_staff_ratio']),
                blood_bank_availability=float(row['blood_bank_availability']),
                essential_drugs_availability=float(row['essential_drugs_availability']),
                insurance_coverage=float(row['insurance_coverage']),
                poverty_rate=float(row['poverty_rate']),
                female_secondary_education=float(row['female_secondary_education']),
                traditional_birth_attendant_prevalence=float(row['tba_prevalence']),
                lat=float(row['lat']),
                lng=float(row['lng']),
                osm_health_facilities_count=row['osm_health_facilities_count'],
                wealth_quintile_mmr=row['wealth_quintiles_mmr']
            ))
    except Exception as e:
        print(f"Database unavailable, using versioned model-input datasets: {e}")
        districts = districts_from_datasets()
    if not districts:
        print("Database returned zero districts, falling back to versioned model-input datasets.")
        districts = districts_from_datasets()
    return districts

# =========================================================
# API ENDPOINTS
# =========================================================

@app.get("/")
async def root():
    return {
        "service": "Maternal Health Digital Twin API",
        "version": "2.4.0",
        "engine": "System Dynamics 5-Stock RK4",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/districts")
async def get_districts(country: Optional[str] = None):
    districts = fetch_all_districts_from_db()
    if country:
        districts = [d for d in districts if d.country.lower() == country.lower()]
    return [{
        "id": d.id,
        "name": d.name,
        "country": d.country,
        "region": d.region,
        "population": d.population,
        "annualBirths": d.annual_births,
        "baselineMMR": d.baseline_mmr,
        "anc1Coverage": d.anc1_coverage,
        "anc4Coverage": d.anc4_coverage,
        "institutionalDeliveryRate": d.institutional_delivery_rate,
        "cSectionRate": d.c_section_rate,
        "avgDistanceToEmONC": d.avg_distance_to_emonc,
        "avgTravelTimeHours": d.avg_travel_time_hours,
        "skilledStaffRatio": d.skilled_staff_ratio,
        "bloodBankAvailability": d.blood_bank_availability,
        "essentialDrugsAvailability": d.essential_drugs_availability,
        "insuranceCoverage": d.insurance_coverage,
        "povertyRate": d.poverty_rate,
        "femaleSecondaryEducation": d.female_secondary_education,
        "traditionalBirthAttendantPrevalence": d.traditional_birth_attendant_prevalence,
        "lat": d.lat,
        "lng": d.lng,
        "osmHealthFacilitiesCount": d.osm_health_facilities_count,
        "wealthQuintileMMR": d.wealth_quintile_mmr,
    } for d in districts]

@app.get("/districts/{district_id}")
async def get_district(district_id: str):
    district = fetch_district_from_db(district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {district_id} not found")
    return {
        "id": district.id,
        "name": district.name,
        "country": district.country,
        "region": district.region,
        "population": district.population,
        "annualBirths": district.annual_births,
        "baselineMMR": district.baseline_mmr,
        "anc1Coverage": district.anc1_coverage,
        "anc4Coverage": district.anc4_coverage,
        "institutionalDeliveryRate": district.institutional_delivery_rate,
        "cSectionRate": district.c_section_rate,
        "avgDistanceToEmONC": district.avg_distance_to_emonc,
        "avgTravelTimeHours": district.avg_travel_time_hours,
        "skilledStaffRatio": district.skilled_staff_ratio,
        "bloodBankAvailability": district.blood_bank_availability,
        "essentialDrugsAvailability": district.essential_drugs_availability,
        "insuranceCoverage": district.insurance_coverage,
        "povertyRate": district.poverty_rate,
        "femaleSecondaryEducation": district.female_secondary_education,
        "traditionalBirthAttendantPrevalence": district.traditional_birth_attendant_prevalence,
        "lat": district.lat,
        "lng": district.lng,
        "osmHealthFacilitiesCount": district.osm_health_facilities_count,
        "wealthQuintileMMR": district.wealth_quintile_mmr,
    }

@app.post("/simulation/run", response_model=SimulationResponse)
async def run_simulation(req: SimulationRequest):
    district = fetch_district_from_db(req.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {req.district_id} not found")
    
    try:
        result = SystemDynamicsEngine.simulate(
            district, req.scenario_id, req.custom_params or {}, req.months
        )
        return {
            "district_id": result.district_id,
            "district_name": result.district_name,
            "country": result.country,
            "scenario_id": result.scenario_id,
            "scenario_name": result.scenario_name,
            "summary": {
                "total_births": result.summary.total_births,
                "total_maternal_deaths": result.summary.total_maternal_deaths,
                "horizon_mmr": result.summary.horizon_mmr,
                "deaths_avoided": result.summary.deaths_avoided,
                "mortality_reduction_percent": result.summary.mortality_reduction_percent,
                "anc_coverage_final": result.summary.anc_coverage_final,
                "facility_delivery_rate_final": result.summary.facility_delivery_rate_final,
                "total_cost_usd": result.summary.total_cost_usd,
                "incremental_cost_usd": result.summary.incremental_cost_usd,
                "cost_per_death_avoided_usd": result.summary.cost_per_death_avoided_usd,
                "integrator": result.summary.integrator,
                "dt_months": result.summary.dt_months,
                "simulation_months": result.summary.simulation_months,
            },
            "equity_disaggregation": [],
            "equity_status": "not_computed_without_empirical stratification data",
            "trajectories": [asdict(snapshot) for snapshot in result.trajectories],
            "run_metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "integrator": result.summary.integrator,
                "dt_months": result.summary.dt_months,
                "simulation_months": result.summary.simulation_months,
                "effective_parameters": asdict(result.parameters),
                "random_seed": None,
                "deterministic": True,
            },
            "trajectory_count": len(result.trajectories),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/simulation/scenario")
async def run_scenario(req: SimulationRequest):
    return await run_simulation(req)

@app.get("/simulation/compare/{district_id}")
async def compare_scenarios(district_id: str, months: int = 36):
    district = fetch_district_from_db(district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {district_id} not found")
    
    results = {}
    baseline = SystemDynamicsEngine.simulate(district, 'baseline', {}, months)
    for scenario in SCENARIO_DEFINITIONS:
        result = baseline if scenario['id'] == 'baseline' else SystemDynamicsEngine.simulate(district, scenario['id'], {}, months, baseline_result=baseline)
        results[scenario['id']] = {
            "scenario_name": result.scenario_name,
            "horizon_mmr": result.summary.horizon_mmr,
            "deaths_avoided": result.summary.deaths_avoided,
            "mortality_reduction_percent": result.summary.mortality_reduction_percent,
            "total_cost_usd": result.summary.total_cost_usd,
            "cost_per_death_avoided_usd": result.summary.cost_per_death_avoided_usd,
        }
    return {"district_id": district_id, "district_name": district.name, "comparison": results}

@app.post("/simulation/calibrate")
async def calibrate_model(req: CalibrationRequest):
    district = fetch_district_from_db(req.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {req.district_id} not found")
    
    try:
        calibration = ModelCalibratorPy.calibrate(district, req.empirical_mmr_series)
        return calibration
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration failed: {str(e)}")

@app.post("/validation/ks")
async def kolmogorov_smirnov_test(req: ValidationRequest):
    raise HTTPException(status_code=410, detail="Disabled: no empirical travel-time distribution is configured.")

@app.post("/validation/sobol")
async def sobol_sensitivity(req: ValidationRequest):
    raise HTTPException(status_code=410, detail="Disabled: documented parameter ranges and a real global sensitivity design are required.")

@app.post("/validation/bootstrap")
async def bootstrap_confidence(req: ValidationRequest):
    raise HTTPException(status_code=410, detail="Disabled: output perturbation is not parameter uncertainty propagation.")

@app.get("/validation/external/{district_id}")
async def external_validation(district_id: str):
    raise HTTPException(status_code=410, detail="Disabled: no independent external comparator is configured.")

@app.get("/validation/convergence/{district_id}")
async def rk4_convergence(district_id: str, scenario_id: str = "scenario_d", months: int = 36):
    """Validate numerical convergence across integration timesteps (dt=0.1, 0.05, 0.025)."""
    district = fetch_district_from_db(district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {district_id} not found")
    
    if scenario_id not in [s['id'] for s in SCENARIO_DEFINITIONS]:
        raise HTTPException(status_code=400, detail=f"Invalid scenario_id: {scenario_id}")
        
    c = SystemDynamicsEngine.convergence_check(district, scenario_id, months)
    coarse, fine = c['0.1'], c['0.025']
    rel_error = abs(coarse['horizon_mmr'] - fine['horizon_mmr']) / max(1e-6, fine['horizon_mmr'])
    is_convergent = rel_error < 0.01
    
    return {
        "district_id": district_id,
        "district_name": district.name,
        "scenario_id": scenario_id,
        "integrator": "RK4 (Classic 4th-order Runge-Kutta)",
        "timesteps": c,
        "relative_error_mmr": round(float(rel_error), 6),
        "relative_error_percent": round(float(rel_error * 100), 4),
        "is_convergent": bool(is_convergent),
        "tolerance": 0.01,
        "order_of_convergence": 4.0,
        "status": "PASS" if is_convergent else "FAIL"
    }

@app.get("/scenarios")
async def get_scenarios():
    return SCENARIO_DEFINITIONS

# =========================================================
# AGENT ENDPOINTS (LangGraph Analyst Agent)
# =========================================================

@app.post("/agent/chat")
async def agent_chat(req: AgentChatRequest):
    """Multi-turn conversational agent with tool access.

    The agent can call simulation tools, query district data, and produce
    evidence-based epidemiological analysis grounded in real model outputs.
    """
    try:
        result = run_agent(
            user_message=req.message,
            conversation_history=req.conversation_history,
            district_id=req.district_id,
            scenario_id=req.scenario_id,
        )
        return {
            "reply": result["reply"],
            "tools_used": result["tools_used"],
            "conversation_id": req.conversation_id or str(uuid.uuid4()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

@app.post("/agent/analyze")
async def agent_analyze(req: AgentAnalyzeRequest):
    """Predefined multi-step analysis for a district.

    analysis_type:
      - bottleneck: Identifies systemic delays and bottlenecks
      - comparison: Compares all intervention scenarios
      - intervention: Recommends optimal intervention package
    """
    district = fetch_district_from_db(req.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {req.district_id} not found")

    analysis_prompts = {
        "bottleneck": (
            f"Analyze the systemic bottlenecks in {district.name} ({district.country}). "
            f"Run the baseline simulation and identify which of the Three-Delays phases "
            f"is the most critical bottleneck. Use the simulation data to quantify each "
            f"delay component and recommend which intervention scenario would most "
            f"effectively address the primary bottleneck."
        ),
        "comparison": (
            f"Compare all five intervention scenarios for {district.name} ({district.country}). "
            f"Run simulations for baseline, scenario_a, scenario_b, scenario_c, and scenario_d. "
            f"Provide a comprehensive comparison of MMR reduction, cost-effectiveness, and "
            f"equity implications. Recommend the most cost-effective scenario."
        ),
        "intervention": (
            f"Based on the epidemiological profile of {district.name} ({district.country}), "
            f"recommend the optimal intervention package. Consider the district's specific "
            f"bottlenecks: travel time ({district.avg_travel_time_hours}h), ANC4 coverage "
            f"({district.anc4_coverage}%), skilled staff ratio ({district.skilled_staff_ratio}), "
            f"and baseline MMR ({district.baseline_mmr}). Run relevant simulations to "
            f"support your recommendation."
        ),
    }

    prompt = analysis_prompts.get(req.analysis_type)
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid analysis_type '{req.analysis_type}'. Must be: bottleneck, comparison, intervention",
        )

    try:
        result = run_agent(
            user_message=prompt,
            district_id=req.district_id,
            scenario_id="baseline",
        )
        return {
            "analysis_type": req.analysis_type,
            "district_id": district.id,
            "district_name": district.name,
            "reply": result["reply"],
            "tools_used": result["tools_used"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
