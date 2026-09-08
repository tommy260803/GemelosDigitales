"""
Maternal Health Digital Twin - FastAPI Backend
===============================================
RESTful API for System Dynamics Simulation Engine
"""

import os
import uuid
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

# Demo districts for when DB is unavailable
DEMO_DISTRICTS = {
    'ke-garissa': DistrictData(
        id='ke-garissa', name='Garissa District', country='Kenya', region='North Eastern',
        population=841353, annual_births=29400, baseline_mmr=646.0,
        anc1_coverage=62.4, anc4_coverage=38.1, institutional_delivery_rate=46.5,
        c_section_rate=3.2, avg_distance_to_emonc=38.5, avg_travel_time_hours=3.9,
        skilled_staff_ratio=1.1, blood_bank_availability=42.0, essential_drugs_availability=68.0,
        insurance_coverage=11.2, poverty_rate=65.5, female_secondary_education=22.4,
        traditional_birth_attendant_prevalence=48.0, lat=-0.4532, lng=39.6461,
        osm_health_facilities_count=48,
        wealth_quintile_mmr={'q1_poorest': 890, 'q2_poor': 760, 'q3_middle': 610, 'q4_richer': 490, 'q5_richest': 340}
    ),
    'ug-moroto': DistrictData(
        id='ug-moroto', name='Moroto District (Karamoja)', country='Uganda', region='Karamoja',
        population=135000, annual_births=5800, baseline_mmr=690.0,
        anc1_coverage=60.5, anc4_coverage=28.0, institutional_delivery_rate=41.5,
        c_section_rate=2.2, avg_distance_to_emonc=44.0, avg_travel_time_hours=4.2,
        skilled_staff_ratio=0.9, blood_bank_availability=32.0, essential_drugs_availability=51.0,
        insurance_coverage=2.1, poverty_rate=74.2, female_secondary_education=14.5,
        traditional_birth_attendant_prevalence=54.0, lat=2.5345, lng=34.6666,
        osm_health_facilities_count=18,
        wealth_quintile_mmr={'q1_poorest': 950, 'q2_poor': 810, 'q3_middle': 660, 'q4_richer': 500, 'q5_richest': 360}
    ),
    'gh-ashanti': DistrictData(
        id='gh-ashanti', name='Kumasi Metro', country='Ghana', region='Ashanti',
        population=2800000, annual_births=84000, baseline_mmr=295.0,
        anc1_coverage=98.0, anc4_coverage=82.5, institutional_delivery_rate=88.5,
        c_section_rate=15.8, avg_distance_to_emonc=6.5, avg_travel_time_hours=0.8,
        skilled_staff_ratio=3.8, blood_bank_availability=91.0, essential_drugs_availability=94.0,
        insurance_coverage=82.0, poverty_rate=16.5, female_secondary_education=68.0,
        traditional_birth_attendant_prevalence=8.5, lat=6.6885, lng=-1.6244,
        osm_health_facilities_count=168,
        wealth_quintile_mmr={'q1_poorest': 410, 'q2_poor': 340, 'q3_middle': 275, 'q4_richer': 220, 'q5_richest': 150}
    ),
    'et-afar': DistrictData(
        id='et-afar', name='Awash & Semera Zone', country='Ethiopia', region='Afar',
        population=620000, annual_births=23500, baseline_mmr=710.0,
        anc1_coverage=44.5, anc4_coverage=24.0, institutional_delivery_rate=29.5,
        c_section_rate=1.8, avg_distance_to_emonc=56.0, avg_travel_time_hours=5.1,
        skilled_staff_ratio=0.7, blood_bank_availability=30.0, essential_drugs_availability=52.0,
        insurance_coverage=9.0, poverty_rate=68.0, female_secondary_education=14.0,
        traditional_birth_attendant_prevalence=62.0, lat=11.7925, lng=41.0089,
        osm_health_facilities_count=28,
        wealth_quintile_mmr={'q1_poorest': 975, 'q2_poor': 835, 'q3_middle': 680, 'q4_richer': 515, 'q5_richest': 365}
    ),
}

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

# =========================================================
# HELPER FUNCTIONS
# =========================================================

def fetch_district_from_db(district_id: str) -> Optional[DistrictData]:
    """Fetch district data from PostgreSQL, fallback to demo data."""
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
                   ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng, 50 as osm_health_facilities_count, wealth_quintiles_mmr
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
        print(f"Database unavailable, using demo data: {e}")
    
    # Fallback to demo data
    return DEMO_DISTRICTS.get(district_id)

def fetch_all_districts_from_db() -> List[DistrictData]:
    """Fetch all districts from PostgreSQL, fallback to demo data."""
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
                   ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng, 50 as osm_health_facilities_count, wealth_quintiles_mmr
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
        print(f"Database unavailable, using demo data: {e}")
        districts = list(DEMO_DISTRICTS.values())
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
        "annual_births": d.annual_births,
        "baseline_mmr": d.baseline_mmr,
        "anc1_coverage": d.anc1_coverage,
        "anc4_coverage": d.anc4_coverage,
        "institutional_delivery_rate": d.institutional_delivery_rate,
        "avg_distance_to_emonc": d.avg_distance_to_emonc,
        "avg_travel_time_hours": d.avg_travel_time_hours,
        "skilled_staff_ratio": d.skilled_staff_ratio,
        "lat": d.lat,
        "lng": d.lng,
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
        "annual_births": district.annual_births,
        "baseline_mmr": district.baseline_mmr,
        "wealth_quintile_mmr": district.wealth_quintile_mmr,
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
                "baseline_deaths": result.summary.baseline_deaths,
                "lives_saved": result.summary.lives_saved,
                "lives_saved_ci95": result.summary.lives_saved_ci95,
                "mmr_baseline": result.summary.mmr_baseline,
                "mmr_final": result.summary.mmr_final,
                "mmr_reduction_percent": result.summary.mmr_reduction_percent,
                "anc4_coverage_final": result.summary.anc4_coverage_final,
                "facility_delivery_rate_final": result.summary.facility_delivery_rate_final,
                "total_cost_usd": result.summary.total_cost_usd,
                "cost_per_life_saved_usd": result.summary.cost_per_life_saved_usd,
                "cost_per_life_saved_ci95": result.summary.cost_per_life_saved_ci95,
                "icer_per_daly": result.summary.icer_per_daly,
            },
            "equity_disaggregation": [
                {
                    "quintile": q.quintile,
                    "label": q.label,
                    "population_share": q.population_share,
                    "baseline_mmr": q.baseline_mmr,
                    "simulated_mmr": q.simulated_mmr,
                    "lives_saved": q.lives_saved,
                    "relative_reduction": q.relative_reduction,
                    "fiscal_cost_usd": q.fiscal_cost_usd,
                    "cost_per_life_saved_in_q": q.cost_per_life_saved_in_q,
                }
                for q in result.equity_disaggregation
            ],
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
    for scenario in SCENARIO_DEFINITIONS:
        result = SystemDynamicsEngine.simulate(district, scenario['id'], {}, months)
        results[scenario['id']] = {
            "scenario_name": result.scenario_name,
            "mmr_final": result.summary.mmr_final,
            "lives_saved": result.summary.lives_saved,
            "mmr_reduction_percent": result.summary.mmr_reduction_percent,
            "total_cost_usd": result.summary.total_cost_usd,
            "cost_per_life_saved_usd": result.summary.cost_per_life_saved_usd,
            "icer_per_daly": result.summary.icer_per_daly,
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
    district = fetch_district_from_db(req.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {req.district_id} not found")
    
    try:
        result = StatisticalValidationPy.kolmogorov_smirnov(district)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KS test failed: {str(e)}")

@app.post("/validation/sobol")
async def sobol_sensitivity(req: ValidationRequest):
    district = fetch_district_from_db(req.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {req.district_id} not found")
    
    try:
        result = StatisticalValidationPy.sobol_sensitivity(district)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sobol analysis failed: {str(e)}")

@app.post("/validation/bootstrap")
async def bootstrap_confidence(req: ValidationRequest):
    district = fetch_district_from_db(req.district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {req.district_id} not found")
    
    try:
        result = StatisticalValidationPy.bootstrap_confidence_intervals(district, 'scenario_d')
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bootstrap failed: {str(e)}")

@app.get("/validation/external/{district_id}")
async def external_validation(district_id: str):
    district = fetch_district_from_db(district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District {district_id} not found")
    
    try:
        result = StatisticalValidationPy.external_validation(district)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"External validation failed: {str(e)}")

@app.get("/scenarios")
async def get_scenarios():
    return SCENARIO_DEFINITIONS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
