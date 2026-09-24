"""LangChain tools that expose the maternal-health digital-twin services.

Each tool wraps an existing backend function so the agent can call it
during a conversation without hard-coding orchestration logic.
"""
from __future__ import annotations

import json
from dataclasses import asdict
from typing import Optional

from langchain_core.tools import tool

from services.system_dynamics import (
    SystemDynamicsEngine,
    SCENARIO_DEFINITIONS,
    build_default_parameters,
)
from services.model_inputs import districts_from_datasets

# ---------------------------------------------------------------------------
# Internal helpers (reuse the main.py DB-fallback pattern)
# ---------------------------------------------------------------------------

def _fetch_district(district_id: str):
    """Return a DistrictData or None. Tries DB first, falls back to CSV."""
    try:
        import os, psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(
            os.environ.get(
                "DATABASE_URL",
                "postgresql://twin_admin:secure_twin_password_2026@localhost:5433/maternal_twin_db",
            ),
            cursor_factory=RealDictCursor,
        )
        cur = conn.cursor()
        cur.execute(
            """SELECT id, name, country, region, population, annual_births, baseline_mmr,
                      anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate,
                      avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio,
                      blood_bank_availability, essential_drugs_availability, insurance_coverage,
                      poverty_rate, female_secondary_education, tba_prevalence,
                      ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng,
                      health_facilities_count as osm_health_facilities_count,
                      wealth_quintiles_mmr
               FROM health_districts WHERE id = %s""",
            (district_id,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            from services.system_dynamics import DistrictData
            return DistrictData(
                id=row["id"], name=row["name"], country=row["country"],
                region=row["region"], population=row["population"],
                annual_births=row["annual_births"],
                baseline_mmr=float(row["baseline_mmr"]),
                anc1_coverage=float(row["anc1_coverage"]),
                anc4_coverage=float(row["anc4_coverage"]),
                institutional_delivery_rate=float(row["institutional_delivery_rate"]),
                c_section_rate=float(row["c_section_rate"]),
                avg_distance_to_emonc=float(row["avg_distance_emonc_km"]),
                avg_travel_time_hours=float(row["avg_travel_time_hours"]),
                skilled_staff_ratio=float(row["skilled_staff_ratio"]),
                blood_bank_availability=float(row["blood_bank_availability"]),
                essential_drugs_availability=float(row["essential_drugs_availability"]),
                insurance_coverage=float(row["insurance_coverage"]),
                poverty_rate=float(row["poverty_rate"]),
                female_secondary_education=float(row["female_secondary_education"]),
                traditional_birth_attendant_prevalence=float(row["tba_prevalence"]),
                lat=float(row["lat"]), lng=float(row["lng"]),
                osm_health_facilities_count=row["osm_health_facilities_count"],
                wealth_quintile_mmr=row["wealth_quintiles_mmr"],
            )
    except Exception:
        pass
    return next((d for d in districts_from_datasets() if d.id == district_id), None)


def _all_districts():
    """Return all districts. Tries DB first, falls back to CSV."""
    try:
        import os, psycopg2
        from psycopg2.extras import RealDictCursor
        from services.system_dynamics import DistrictData
        conn = psycopg2.connect(
            os.environ.get(
                "DATABASE_URL",
                "postgresql://twin_admin:secure_twin_password_2026@localhost:5433/maternal_twin_db",
            ),
            cursor_factory=RealDictCursor,
        )
        cur = conn.cursor()
        cur.execute(
            """SELECT id, name, country, region, population, annual_births, baseline_mmr,
                      anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate,
                      avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio,
                      blood_bank_availability, essential_drugs_availability, insurance_coverage,
                      poverty_rate, female_secondary_education, tba_prevalence,
                      ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng,
                      health_facilities_count as osm_health_facilities_count,
                      wealth_quintiles_mmr
               FROM health_districts ORDER BY country, name"""
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            DistrictData(
                id=r["id"], name=r["name"], country=r["country"],
                region=r["region"], population=r["population"],
                annual_births=r["annual_births"],
                baseline_mmr=float(r["baseline_mmr"]),
                anc1_coverage=float(r["anc1_coverage"]),
                anc4_coverage=float(r["anc4_coverage"]),
                institutional_delivery_rate=float(r["institutional_delivery_rate"]),
                c_section_rate=float(r["c_section_rate"]),
                avg_distance_to_emonc=float(r["avg_distance_emonc_km"]),
                avg_travel_time_hours=float(r["avg_travel_time_hours"]),
                skilled_staff_ratio=float(r["skilled_staff_ratio"]),
                blood_bank_availability=float(r["blood_bank_availability"]),
                essential_drugs_availability=float(r["essential_drugs_availability"]),
                insurance_coverage=float(r["insurance_coverage"]),
                poverty_rate=float(r["poverty_rate"]),
                female_secondary_education=float(r["female_secondary_education"]),
                traditional_birth_attendant_prevalence=float(r["tba_prevalence"]),
                lat=float(r["lat"]), lng=float(r["lng"]),
                osm_health_facilities_count=r["osm_health_facilities_count"],
                wealth_quintile_mmr=r["wealth_quintiles_mmr"],
            )
            for r in rows
        ]
    except Exception:
        pass
    return districts_from_datasets()


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@tool
def get_district_info(district_id: str) -> str:
    """Retrieve the full epidemiological profile of a health district.

    Use this when the user asks about a specific district's data, indicators,
    or baseline conditions. Returns population, MMR, coverage rates,
    infrastructure metrics, and equity quintile data.
    """
    d = _fetch_district(district_id)
    if not d:
        available = [dist.id for dist in _all_districts()]
        return json.dumps({
            "error": f"District '{district_id}' not found.",
            "available_districts": available,
        })
    return json.dumps({
        "id": d.id, "name": d.name, "country": d.country, "region": d.region,
        "population": d.population, "annual_births": d.annual_births,
        "baseline_mmr": d.baseline_mmr,
        "anc1_coverage": d.anc1_coverage, "anc4_coverage": d.anc4_coverage,
        "institutional_delivery_rate": d.institutional_delivery_rate,
        "c_section_rate": d.c_section_rate,
        "avg_distance_to_emonc_km": d.avg_distance_to_emonc,
        "avg_travel_time_hours": d.avg_travel_time_hours,
        "skilled_staff_ratio": d.skilled_staff_ratio,
        "blood_bank_availability": d.blood_bank_availability,
        "essential_drugs_availability": d.essential_drugs_availability,
        "insurance_coverage": d.insurance_coverage,
        "poverty_rate": d.poverty_rate,
        "female_secondary_education": d.female_secondary_education,
        "tba_prevalence": d.traditional_birth_attendant_prevalence,
        "lat": d.lat, "lng": d.lng,
        "health_facilities_count": d.osm_health_facilities_count,
        "wealth_quintile_mmr": d.wealth_quintile_mmr,
    }, indent=2)


@tool
def list_districts(country: Optional[str] = None) -> str:
    """List all available health districts, optionally filtered by country.

    Returns district IDs, names, countries, and baseline MMR.
    Supported countries: Kenya, Tanzania, Uganda, Ghana, Ethiopia.
    """
    districts = _all_districts()
    if country:
        districts = [d for d in districts if d.country.lower() == country.lower()]
    return json.dumps([
        {"id": d.id, "name": d.name, "country": d.country, "baseline_mmr": d.baseline_mmr}
        for d in districts
    ], indent=2)


@tool
def run_simulation(
    district_id: str,
    scenario_id: str = "baseline",
    months: int = 36,
) -> str:
    """Run a system-dynamics simulation for a district and scenario.

    scenario_id must be one of: baseline, scenario_a, scenario_b, scenario_c, scenario_d.
    Returns the simulation summary including MMR, deaths avoided, mortality
    reduction percentage, and cost-effectiveness metrics.
    """
    valid_scenarios = [s["id"] for s in SCENARIO_DEFINITIONS]
    if scenario_id not in valid_scenarios:
        return json.dumps({
            "error": f"Invalid scenario '{scenario_id}'.",
            "valid_scenarios": valid_scenarios,
        })
    d = _fetch_district(district_id)
    if not d:
        return json.dumps({"error": f"District '{district_id}' not found."})
    try:
        result = SystemDynamicsEngine.simulate(d, scenario_id, {}, months)
        s = result.summary
        return json.dumps({
            "district": result.district_name,
            "country": result.country,
            "scenario": result.scenario_name,
            "horizon_mmr": round(s.horizon_mmr, 2),
            "total_births": round(s.total_births, 1),
            "total_maternal_deaths": round(s.total_maternal_deaths, 2),
            "deaths_avoided": round(s.deaths_avoided, 2),
            "mortality_reduction_percent": round(s.mortality_reduction_percent, 2),
            "anc_coverage_final": round(s.anc_coverage_final, 2),
            "facility_delivery_rate_final": round(s.facility_delivery_rate_final, 2),
            "total_cost_usd": round(s.total_cost_usd, 2),
            "cost_per_death_avoided_usd": (
                round(s.cost_per_death_avoided_usd, 2)
                if s.cost_per_death_avoided_usd else None
            ),
            "simulation_months": s.simulation_months,
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def compare_scenarios(district_id: str, months: int = 36) -> str:
    """Compare all five scenarios (baseline + A/B/C/D) for a single district.

    Returns a side-by-side comparison of MMR, deaths avoided, mortality
    reduction, cost, and cost-effectiveness for each scenario.
    """
    d = _fetch_district(district_id)
    if not d:
        return json.dumps({"error": f"District '{district_id}' not found."})
    try:
        baseline = SystemDynamicsEngine.simulate(d, "baseline", {}, months)
        results = {}
        for scenario in SCENARIO_DEFINITIONS:
            sid = scenario["id"]
            if sid == "baseline":
                r = baseline
            else:
                r = SystemDynamicsEngine.simulate(
                    d, sid, {}, months, baseline_result=baseline
                )
            results[sid] = {
                "name": r.scenario_name,
                "horizon_mmr": round(r.summary.horizon_mmr, 2),
                "deaths_avoided": round(r.summary.deaths_avoided, 2),
                "mortality_reduction_percent": round(
                    r.summary.mortality_reduction_percent, 2
                ),
                "total_cost_usd": round(r.summary.total_cost_usd, 2),
                "cost_per_death_avoided_usd": (
                    round(r.summary.cost_per_death_avoided_usd, 2)
                    if r.summary.cost_per_death_avoided_usd else None
                ),
            }
        return json.dumps({
            "district_id": d.id,
            "district_name": d.name,
            "country": d.country,
            "comparison": results,
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_model_parameters(district_id: str) -> str:
    """Retrieve the default system-dynamics parameters for a district.

    Returns the full SDParameters set (travel time, fees, clinical capacity,
    community factors) derived from the district's epidemiological profile.
    """
    d = _fetch_district(district_id)
    if not d:
        return json.dumps({"error": f"District '{district_id}' not found."})
    params = build_default_parameters(d)
    return json.dumps({
        "district_id": d.id,
        "district_name": d.name,
        "parameters": asdict(params),
    }, indent=2)


# ---------------------------------------------------------------------------
# Public registry
# ---------------------------------------------------------------------------

ANALYSIS_TOOLS = [
    get_district_info,
    list_districts,
    run_simulation,
    compare_scenarios,
    get_model_parameters,
]
