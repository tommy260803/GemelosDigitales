"""Repository pattern for retrieving health districts from PostgreSQL or versioned CSV fallbacks.

Centralizes database queries, connection strings, and model mapping to avoid
hardcoded connections, duplicate queries, and port divergence across services.
"""
from __future__ import annotations

import os
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

from services.system_dynamics import DistrictData
from services.model_inputs import districts_from_datasets

DEFAULT_DB_URL = "postgresql://twin_admin:secure_twin_password_2026@localhost:5434/maternal_twin_db"

DISTRICT_SELECT_SQL = """
    SELECT id, name, country, region, population, annual_births, baseline_mmr,
           anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate,
           avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio, staff_247_availability_rate,
           blood_bank_availability, essential_drugs_availability, insurance_coverage,
           poverty_rate, female_secondary_education, tba_prevalence,
           ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng,
           health_facilities_count as osm_health_facilities_count, wealth_quintiles_mmr,
           road_quality_index, transport_cost_usd, facility_delivery_fee_usd,
           community_trust_baseline, baseline_complication_rate
    FROM health_districts
"""


def get_db_connection():
    """Return a new database connection using the configured DATABASE_URL."""
    db_url = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


def _row_to_district(row: dict) -> DistrictData:
    """Map a health_districts database row to a DistrictData dataclass."""
    return DistrictData(
        id=row["id"],
        name=row["name"],
        country=row["country"],
        region=row["region"],
        population=row["population"],
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
        lat=float(row["lat"]),
        lng=float(row["lng"]),
        osm_health_facilities_count=row["osm_health_facilities_count"],
        wealth_quintile_mmr=row["wealth_quintiles_mmr"],
        staff_247_availability_rate=float(row["staff_247_availability_rate"]) if row["staff_247_availability_rate"] is not None else None,
        road_quality_index=float(row["road_quality_index"]) if row["road_quality_index"] is not None else None,
        transport_cost_usd=float(row["transport_cost_usd"]) if row["transport_cost_usd"] is not None else None,
        facility_delivery_fee_usd=float(row["facility_delivery_fee_usd"]) if row["facility_delivery_fee_usd"] is not None else None,
        community_trust_baseline=float(row["community_trust_baseline"]) if row["community_trust_baseline"] is not None else None,
        baseline_complication_rate=float(row["baseline_complication_rate"]) if row["baseline_complication_rate"] is not None else None,
    )


def fetch_district_from_db(district_id: str) -> Optional[DistrictData]:
    """Fetch PostgreSQL runtime district; versioned CSV datasets are the non-DB fallback."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(f"{DISTRICT_SELECT_SQL} WHERE id = %s", (district_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if row:
            return _row_to_district(row)
    except Exception as e:
        print(f"Database unavailable, using versioned model-input datasets: {e}")

    return next((d for d in districts_from_datasets() if d.id == district_id), None)


def fetch_all_districts_from_db() -> List[DistrictData]:
    """Fetch all runtime districts from PostgreSQL; versioned CSV datasets are the fallback."""
    districts = []
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(f"{DISTRICT_SELECT_SQL} ORDER BY country, name")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        for row in rows:
            districts.append(_row_to_district(row))
    except Exception as e:
        print(f"Database unavailable, using versioned model-input datasets: {e}")
        districts = districts_from_datasets()

    if not districts:
        print("Database returned zero districts, falling back to versioned model-input datasets.")
        districts = districts_from_datasets()

    return districts
