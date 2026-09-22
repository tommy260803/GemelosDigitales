"""Validate versioned CSV model inputs and upsert them into PostgreSQL."""
from __future__ import annotations
import argparse, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from services.model_inputs import load_rows

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--dry-run",action="store_true"); args=parser.parse_args()
    data=load_rows(); rows=[]
    for ident,d in data['demographics'].items():
        c,h,a,m=data['context'][ident],data['capacity'][ident],data['access'][ident],data['model'][ident]
        rows.append((ident,d,c,h,a,m))
    if args.dry_run:
        print(f"Validated {len(rows)} territories across five datasets; no database changes made."); return
    import psycopg2
    url=os.environ.get('DATABASE_URL','postgresql://twin_admin:secure_twin_password_2026@localhost:5433/maternal_twin_db')
    sql='''INSERT INTO health_districts (id,name,country,region,population,annual_births,baseline_mmr,anc1_coverage,anc4_coverage,institutional_delivery_rate,c_section_rate,avg_distance_emonc_km,avg_travel_time_hours,skilled_staff_ratio,blood_bank_availability,essential_drugs_availability,insurance_coverage,poverty_rate,female_secondary_education,tba_prevalence,geom,wealth_quintiles_mmr,health_facilities_count,road_quality_index,transport_cost_usd,community_trust_baseline,facility_delivery_fee_usd,baseline_complication_rate) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,ST_SetSRID(ST_MakePoint(%s,%s),4326),%s::jsonb,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,country=EXCLUDED.country,region=EXCLUDED.region,population=EXCLUDED.population,annual_births=EXCLUDED.annual_births,baseline_mmr=EXCLUDED.baseline_mmr,anc1_coverage=EXCLUDED.anc1_coverage,anc4_coverage=EXCLUDED.anc4_coverage,institutional_delivery_rate=EXCLUDED.institutional_delivery_rate,c_section_rate=EXCLUDED.c_section_rate,avg_distance_emonc_km=EXCLUDED.avg_distance_emonc_km,avg_travel_time_hours=EXCLUDED.avg_travel_time_hours,skilled_staff_ratio=EXCLUDED.skilled_staff_ratio,blood_bank_availability=EXCLUDED.blood_bank_availability,essential_drugs_availability=EXCLUDED.essential_drugs_availability,insurance_coverage=EXCLUDED.insurance_coverage,poverty_rate=EXCLUDED.poverty_rate,female_secondary_education=EXCLUDED.female_secondary_education,tba_prevalence=EXCLUDED.tba_prevalence,geom=EXCLUDED.geom,wealth_quintiles_mmr=EXCLUDED.wealth_quintiles_mmr,health_facilities_count=EXCLUDED.health_facilities_count,road_quality_index=EXCLUDED.road_quality_index,transport_cost_usd=EXCLUDED.transport_cost_usd,community_trust_baseline=EXCLUDED.community_trust_baseline,facility_delivery_fee_usd=EXCLUDED.facility_delivery_fee_usd,baseline_complication_rate=EXCLUDED.baseline_complication_rate'''
    conn=psycopg2.connect(url); cur=conn.cursor()
    try:
        for ident,d,c,h,a,m in rows:
            cur.execute(sql,(ident,d['territory_name'],d['country'],d['region'],int(d['population']),int(d['annual_births']),float(d['baseline_mmr']),float(c['anc1_rate'])*100,float(c['anc4_rate'])*100,float(c['institutional_delivery_rate'])*100,float(c['cesarean_rate'])*100,float(a['avg_distance_to_emonc_km']),float(a['avg_travel_time_hours']),float(h['skilled_staff_per_10k']),float(h['blood_availability'])*100,float(h['essential_drugs_availability'])*100,float(c['insurance_coverage_rate'])*100,float(c['poverty_rate'])*100,float(c['female_education_rate'])*100,float(c['tba_prevalence'])*100,float(d['longitude']),float(d['latitude']),m['wealth_quintiles_mmr'],int(h['health_facilities_count']),float(a['road_quality_index']),float(a['transport_cost_usd']),float(m['community_trust_baseline']),float(m['facility_delivery_fee_usd']),float(m['baseline_complication_rate'])))
        conn.commit(); print(f"Upserted {len(rows)} territories into health_districts.")
    except Exception:
        conn.rollback(); raise
    finally: cur.close(); conn.close()
if __name__=='__main__': main()
