import os
import pandas as pd
import psycopg2

REGION_MAP = {
    # Ethiopia
    'somali': 'et-somali',
    'afar': 'et-afar',
    'oromia': 'et-oromia',
    'amhara': 'et-amhara',
    'tigray': 'et-tigray',
    # Ghana
    'northern': 'gh-northern',
    'ashanti': 'gh-ashanti',
    'volta': 'gh-volta',
    'western': 'gh-western',
    'greater accra': 'gh-greater-accra',
    # Kenya
    'garissa': 'ke-garissa',
    'turkana': 'ke-turkana',
    'kilifi': 'ke-kilifi',
    'kisumu': 'ke-kisumu',
    'nairobi': 'ke-nairobi',
    # Tanzania
    'kigoma': 'tz-kigoma',
    'dodoma': 'tz-dodoma',
    'mbeya': 'tz-mbeya',
    'mwanza': 'tz-mwanza',
    'dar es salaam': 'tz-dar',
    # Uganda
    'karamoja': 'ug-karamoja',
    'acholi': 'ug-acholi',
    'busoga': 'ug-busoga',
    'south buganda': 'ug-buganda',
    'kampala': 'ug-kampala'
}

def is_anc1(val):
    return val != 'no antenatal visits'

def is_anc4(val):
    try:
        if val == 'no antenatal visits' or val == "don't know":
            return False
        return float(val) >= 4.0
    except:
        return False

institutional_places = [
    'government health center', 'government hospital', 'private hospital', 
    'government health post', 'private clinic', 'ngo health facility'
]

def is_institutional_delivery(val):
    if not isinstance(val, str):
        return False
    val = val.lower()
    return any(p in val for p in institutional_places)

def process_all_dhs_files(dhs_dir, db_url, log_callback=print):
    files = [f for f in os.listdir(dhs_dir) if f.lower().endswith('.dta')]
    
    if not files:
        log_callback("❌ No se encontraron archivos .DTA en la carpeta.")
        return False
        
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        log_callback(f"❌ Error conectando a BD: {e}")
        return False

    total_processed = 0
    for f in files:
        file_path = os.path.join(dhs_dir, f)
        log_callback(f"⏳ Procesando: {f}...")
        
        try:
            df = pd.read_stata(file_path, columns=['v024', 'm14_1', 'm15_1'])
            df = df.dropna(subset=['m14_1', 'm15_1'])
            
            # Map regions
            df['district_id'] = df['v024'].apply(lambda x: REGION_MAP.get(str(x).lower()))
            df = df[df['district_id'].notnull()]
            
            if df.empty:
                log_callback(f"⚠️ No hay regiones mapeadas en {f}")
                continue

            df['anc1'] = df['m14_1'].apply(is_anc1)
            df['anc4'] = df['m14_1'].apply(is_anc4)
            df['inst_del'] = df['m15_1'].apply(is_institutional_delivery)

            results = df.groupby('district_id').agg(
                anc1_rate=('anc1', 'mean'),
                anc4_rate=('anc4', 'mean'),
                inst_del_rate=('inst_del', 'mean')
            ).reset_index()

            for _, row in results.iterrows():
                dist_id = row['district_id']
                anc1_cov = round(row['anc1_rate'] * 100, 2)
                anc4_cov = round(row['anc4_rate'] * 100, 2)
                inst_del = round(row['inst_del_rate'] * 100, 2)
                mmr_adj = max(200, 900 - (inst_del * 8)) 
                
                cur.execute("""
                    UPDATE health_districts 
                    SET anc1_coverage = %s, anc4_coverage = %s,
                        institutional_delivery_rate = %s, baseline_mmr = %s
                    WHERE id = %s
                """, (anc1_cov, anc4_cov, inst_del, mmr_adj, dist_id))
                
                total_processed += 1
                log_callback(f"✅ Inyectado en BD: {dist_id} (Parto Inst: {inst_del}%)")
                
        except Exception as e:
            log_callback(f"❌ Error procesando {f}: {e}")
            
    conn.commit()
    cur.close()
    conn.close()
    
    log_callback(f"\n🎉 ¡Sincronización Completada! {total_processed} distritos calibrados con datos reales.")
    return True
