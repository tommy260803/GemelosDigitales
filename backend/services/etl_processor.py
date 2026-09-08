import pandas as pd

def process_dhs_microdata(df: pd.DataFrame) -> dict:
    """
    Procesa microdatos sintéticos del DHS (Encuestas) y extrae los 
    parámetros epidemiológicos agregados para calibrar el motor ODE.
    """
    # Validamos que las columnas necesarias existan
    required_cols = ['district_id', 'anc_visits', 'delivery_place', 'had_complication', 'maternal_death']
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"El dataset no tiene las columnas necesarias: {missing}")

    districts = df['district_id'].unique()
    extracted_params = {}

    for d_id in districts:
        d_df = df[df['district_id'] == d_id]
        
        total_pregnancies = len(d_df)
        if total_pregnancies == 0:
            continue
            
        # 1. Cobertura ANC 1 (Al menos 1 visita)
        anc1_count = len(d_df[d_df['anc_visits'] >= 1])
        anc1_coverage = (anc1_count / total_pregnancies) * 100
        
        # 2. Cobertura ANC 4 (Al menos 4 visitas - WHO standard)
        anc4_count = len(d_df[d_df['anc_visits'] >= 4])
        anc4_coverage = (anc4_count / total_pregnancies) * 100
        
        # 3. Parto Institucional
        inst_delivery_count = len(d_df[d_df['delivery_place'] == 'Health Facility'])
        inst_delivery_rate = (inst_delivery_count / total_pregnancies) * 100
        
        # 4. Tasa de Complicaciones
        complication_count = len(d_df[d_df['had_complication'] == True])
        complication_rate = (complication_count / total_pregnancies)
        
        # 5. Maternal Mortality Ratio (MMR) per 100,000 live births
        # Asumiendo 1 embarazo = 1 nacimiento para simplificar
        maternal_deaths = len(d_df[d_df['maternal_death'] == True])
        mmr = (maternal_deaths / total_pregnancies) * 100000

        extracted_params[d_id] = {
            'anc1_coverage': round(anc1_coverage, 1),
            'anc4_coverage': round(anc4_coverage, 1),
            'institutional_delivery_rate': round(inst_delivery_rate, 1),
            'baseline_complication_rate': round(complication_rate, 3),
            'baseline_mmr': round(mmr, 1),
            'sample_size': total_pregnancies
        }
        
    return extracted_params
