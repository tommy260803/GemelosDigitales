"""Validate versioned CSV model inputs and upsert them into PostgreSQL."""
from __future__ import annotations
import argparse, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from services.model_inputs import load_rows

COLUMNS=('id','name','country','region','population','annual_births','baseline_mmr','anc1_coverage','anc4_coverage','institutional_delivery_rate','c_section_rate','avg_distance_emonc_km','avg_travel_time_hours','skilled_staff_ratio','blood_bank_availability','essential_drugs_availability','insurance_coverage','poverty_rate','female_secondary_education','tba_prevalence','geom','wealth_quintiles_mmr','health_facilities_count','road_quality_index','transport_cost_usd','community_trust_baseline','facility_delivery_fee_usd','baseline_complication_rate','staff_247_availability_rate')
PLACEHOLDERS=['ST_SetSRID(ST_MakePoint(%s,%s),4326)' if name=='geom' else '%s::jsonb' if name=='wealth_quintiles_mmr' else '%s' for name in COLUMNS]
SQL=f"INSERT INTO health_districts ({','.join(COLUMNS)}) VALUES ({','.join(PLACEHOLDERS)}) ON CONFLICT (id) DO UPDATE SET "+','.join(f'{name}=EXCLUDED.{name}' for name in COLUMNS if name!='id')

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--dry-run",action="store_true"); args=parser.parse_args()
    data=load_rows(); rows=[]
    for ident,d in data['demographics'].items():
        c,h,a,m=data['context'][ident],data['capacity'][ident],data['access'][ident],data['model'][ident]
        rows.append((ident,d,c,h,a,m))
    if args.dry_run:
        print(f"Validated {len(rows)} territories across five datasets; no database changes made.")
        return

    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not set; skipping database upsert. Backend will serve territories from versioned CSV datasets.")
        return

    # In production/Docker environments, skip localhost attempts if local DB isn't running
    if 'localhost' in db_url or '127.0.0.1' in db_url:
        if not os.environ.get('FORCE_LOCAL_DB'):
            print(f"DATABASE_URL points to localhost ({db_url}); skipping auto-migration to prevent boot crashes.")
            return

    import psycopg2
    conn = None
    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        cur = conn.cursor()
        
        # Check if table exists, create from schema.sql if available
        repo_root = Path(__file__).resolve().parents[1]
        schema_file = repo_root / 'database' / 'schema.sql'
        if schema_file.exists():
            try:
                cur.execute("SELECT 1 FROM information_schema.tables WHERE table_name = 'health_districts'")
                if not cur.fetchone():
                    print("Table health_districts does not exist; applying database/schema.sql...")
                    cur.execute(schema_file.read_text(encoding='utf-8'))
                    conn.commit()
            except Exception as se:
                print(f"Notice: schema check encountered: {se}")
                conn.rollback()

        migrations = sorted((repo_root / 'database' / 'migrations').glob('*.sql'))
        for migration in migrations:
            try:
                cur.execute(migration.read_text(encoding='utf-8'))
                conn.commit()
            except Exception as me:
                print(f"Notice: migration {migration.name} already applied or skipped: {me}")
                conn.rollback()

        for ident,d,c,h,a,m in rows:
            cur.execute(SQL,(ident,d['territory_name'],d['country'],d['region'],int(d['population']),int(d['annual_births']),float(d['baseline_mmr']),float(c['anc1_rate'])*100,float(c['anc4_rate'])*100,float(c['institutional_delivery_rate'])*100,float(c['cesarean_rate'])*100,float(a['avg_distance_to_emonc_km']),float(a['avg_travel_time_hours']),float(h['skilled_staff_per_10k']),float(h['blood_availability'])*100,float(h['essential_drugs_availability'])*100,float(c['insurance_coverage_rate'])*100,float(c['poverty_rate'])*100,float(c['female_education_rate'])*100,float(c['tba_prevalence'])*100,float(d['longitude']),float(d['latitude']),m['wealth_quintiles_mmr'],int(h['health_facilities_count']),float(a['road_quality_index']),float(a['transport_cost_usd']),float(m['community_trust_baseline']),float(m['facility_delivery_fee_usd']),float(m['baseline_complication_rate']),float(h['staff_247_availability_rate'])))
        conn.commit()
        print(f"Upserted {len(rows)} territories into health_districts.")
        cur.close()
    except Exception as e:
        print(f"Warning: Database connection or upsert failed ({e}). The application will gracefully fallback to versioned CSV datasets.")
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

if __name__=='__main__':
    main()
