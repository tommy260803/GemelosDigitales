"""Generate database/seed.sql from versioned model_inputs datasets."""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from services.model_inputs import load_rows

def main():
    data = load_rows()
    output_path = Path(__file__).resolve().parents[1] / "database" / "seed.sql"
    
    lines = [
        "-- =========================================================",
        "-- MATERNAL HEALTH DIGITAL TWIN: DATABASE SEED DATA",
        "-- Auto-generated from versioned inputs in data/model_inputs/",
        "-- 25 Health Districts across Kenya, Tanzania, Uganda, Ghana, Ethiopia",
        "-- =========================================================\n\n"
    ]
    
    for ident, d in data['demographics'].items():
        c = data['context'][ident]
        h = data['capacity'][ident]
        a = data['access'][ident]
        m = data['model'][ident]
        
        raw_q = m['wealth_quintiles_mmr']
        q_json = raw_q.replace("'", "''") if isinstance(raw_q, str) else json.dumps(raw_q).replace("'", "''")
        
        sql = (
            f"INSERT INTO health_districts ("
            f"id, name, country, region, population, annual_births, baseline_mmr, "
            f"anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate, "
            f"avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio, "
            f"blood_bank_availability, essential_drugs_availability, insurance_coverage, "
            f"poverty_rate, female_secondary_education, tba_prevalence, geom, "
            f"wealth_quintiles_mmr, health_facilities_count, road_quality_index, "
            f"transport_cost_usd, community_trust_baseline, facility_delivery_fee_usd, "
            f"baseline_complication_rate"
            f") VALUES ("
            f"'{ident}', '{d['territory_name']}', '{d['country']}', '{d['region']}', "
            f"{int(d['population'])}, {int(d['annual_births'])}, {float(d['baseline_mmr']):.2f}, "
            f"{float(c['anc1_rate'])*100:.2f}, {float(c['anc4_rate'])*100:.2f}, "
            f"{float(c['institutional_delivery_rate'])*100:.2f}, {float(c['cesarean_rate'])*100:.2f}, "
            f"{float(a['avg_distance_to_emonc_km']):.2f}, {float(a['avg_travel_time_hours']):.2f}, "
            f"{float(h['skilled_staff_per_10k']):.2f}, {float(h['blood_availability'])*100:.2f}, "
            f"{float(h['essential_drugs_availability'])*100:.2f}, {float(c['insurance_coverage_rate'])*100:.2f}, "
            f"{float(c['poverty_rate'])*100:.2f}, {float(c['female_education_rate'])*100:.2f}, "
            f"{float(c['tba_prevalence'])*100:.2f}, "
            f"ST_SetSRID(ST_MakePoint({float(d['longitude'])}, {float(d['latitude'])}), 4326), "
            f"'{q_json}'::jsonb, {int(h['health_facilities_count'])}, {float(a['road_quality_index']):.3f}, "
            f"{float(a['transport_cost_usd']):.2f}, {float(m['community_trust_baseline']):.3f}, "
            f"{float(m['facility_delivery_fee_usd']):.2f}, {float(m['baseline_complication_rate']):.4f}"
            f") ON CONFLICT (id) DO UPDATE SET "
            f"name = EXCLUDED.name, country = EXCLUDED.country, region = EXCLUDED.region, "
            f"population = EXCLUDED.population, annual_births = EXCLUDED.annual_births, "
            f"baseline_mmr = EXCLUDED.baseline_mmr, anc1_coverage = EXCLUDED.anc1_coverage, "
            f"anc4_coverage = EXCLUDED.anc4_coverage, "
            f"institutional_delivery_rate = EXCLUDED.institutional_delivery_rate, "
            f"c_section_rate = EXCLUDED.c_section_rate, "
            f"avg_distance_emonc_km = EXCLUDED.avg_distance_emonc_km, "
            f"avg_travel_time_hours = EXCLUDED.avg_travel_time_hours, "
            f"skilled_staff_ratio = EXCLUDED.skilled_staff_ratio, "
            f"blood_bank_availability = EXCLUDED.blood_bank_availability, "
            f"essential_drugs_availability = EXCLUDED.essential_drugs_availability, "
            f"insurance_coverage = EXCLUDED.insurance_coverage, poverty_rate = EXCLUDED.poverty_rate, "
            f"female_secondary_education = EXCLUDED.female_secondary_education, "
            f"tba_prevalence = EXCLUDED.tba_prevalence, geom = EXCLUDED.geom, "
            f"wealth_quintiles_mmr = EXCLUDED.wealth_quintiles_mmr, "
            f"health_facilities_count = EXCLUDED.health_facilities_count, "
            f"road_quality_index = EXCLUDED.road_quality_index, "
            f"transport_cost_usd = EXCLUDED.transport_cost_usd, "
            f"community_trust_baseline = EXCLUDED.community_trust_baseline, "
            f"facility_delivery_fee_usd = EXCLUDED.facility_delivery_fee_usd, "
            f"baseline_complication_rate = EXCLUDED.baseline_complication_rate;\n"
        )
        lines.append(sql)
        
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {len(data['demographics'])} territory seed rows into {output_path}")

if __name__ == "__main__":
    main()
