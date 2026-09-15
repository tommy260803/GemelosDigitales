import pandas as pd
import psycopg2
import os

print("⏳ Cargando archivo DHS (puede tomar unos segundos)...")
# Cargar el archivo de datos crudos de Stata
dhs_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'dhs', 'ETIR8AFL.dta')
df = pd.read_stata(dhs_path, columns=['v024', 'm14_1', 'm15_1'])

print(f"✅ Archivo cargado. Filas totales: {len(df)}")

# Definir el mapeo de regiones de Etiopía a nuestros IDs de base de datos
region_map = {
    'somali': 'et-somali',
    'afar': 'et-afar',
    'oromia': 'et-oromia',
    'amhara': 'et-amhara',
    'tigray': 'et-tigray'
}

# Filtrar solo las filas que tuvieron un nacimiento reciente (m14_1 no es NA) y que pertenecen a nuestras regiones
df = df.dropna(subset=['m14_1', 'm15_1'])
df = df[df['v024'].isin(region_map.keys())]

# Definir funciones lógicas para indicadores
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
    'government health center', 
    'government hospital', 
    'private hospital', 
    'government health post', 
    'private clinic', 
    'ngo health facility'
]
def is_institutional_delivery(val):
    return val in institutional_places

# Calcular variables booleanas
df['anc1'] = df['m14_1'].apply(is_anc1)
df['anc4'] = df['m14_1'].apply(is_anc4)
df['inst_del'] = df['m15_1'].apply(is_institutional_delivery)

# Agrupar y calcular porcentajes
results = df.groupby('v024').agg(
    total_births=('m14_1', 'count'),
    anc1_rate=('anc1', 'mean'),
    anc4_rate=('anc4', 'mean'),
    inst_del_rate=('inst_del', 'mean')
).reset_index()

print("\n📊 Resultados Empíricos Calculados para Etiopía:")
for idx, row in results.iterrows():
    print(f"Región: {row['v024'].upper()}")
    print(f" - Muestra: {row['total_births']} nacimientos recientes")
    print(f" - ANC1: {row['anc1_rate']*100:.1f}%")
    print(f" - ANC4: {row['anc4_rate']*100:.1f}%")
    print(f" - Parto Institucional: {row['inst_del_rate']*100:.1f}%\n")

# Actualizar la Base de Datos PostgreSQL
db_url = os.environ.get('DATABASE_URL', 'postgresql://twin_admin:secure_twin_password_2026@127.0.0.1:5433/maternal_twin_db')
try:
    print("🔌 Conectando a la base de datos PostgreSQL...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    for idx, row in results.iterrows():
        dist_id = region_map.get(row['v024'])
        if not dist_id or pd.isna(row['anc1_rate']):
            continue
            
        anc1_cov = round(row['anc1_rate'] * 100, 2)
        anc4_cov = round(row['anc4_rate'] * 100, 2)
        inst_del = round(row['inst_del_rate'] * 100, 2)
        
        # Opcional: También ajustamos ligeramente el MMR base según el parto institucional (heurística inversa)
        # Si inst_del_rate es bajo, el MMR sube.
        mmr_adj = max(200, 900 - (inst_del * 8)) 
        
        cur.execute("""
            UPDATE health_districts 
            SET anc1_coverage = %s,
                anc4_coverage = %s,
                institutional_delivery_rate = %s,
                baseline_mmr = %s
            WHERE id = %s
        """, (anc1_cov, anc4_cov, inst_del, mmr_adj, dist_id))
        print(f"✅ Inyectado distrito: {dist_id}")
        
    conn.commit()
    cur.close()
    conn.close()
    print("\n💾 ¡Sincronización a Base de Datos Completada Exitosamente!")
except Exception as e:
    print(f"\n❌ Error de Base de Datos: {e}")
