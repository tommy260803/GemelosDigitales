import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_dhs(num_records=10000, output_filename="synthetic_dhs_data.csv"):
    """
    Generates a synthetic dataset mimicking DHS Individual Recode (IR) microdata
    for Sub-Saharan African maternal health.
    """
    np.random.seed(42)
    random.seed(42)

    # Valid district IDs from our system
    districts = ['ke-garissa', 'ug-moroto', 'gh-ashanti', 'et-afar']
    
    # 1. Base demographics
    caseids = [f"CASE_{i:06d}" for i in range(num_records)]
    district_ids = np.random.choice(districts, size=num_records, p=[0.25, 0.25, 0.25, 0.25])
    
    # Maternal age (typically 15-49, skewed right)
    maternal_age = np.round(np.random.gamma(shape=5, scale=4, size=num_records) + 15).astype(int)
    maternal_age = np.clip(maternal_age, 15, 49)
    
    # Wealth Quintile (1 = Poorest, 5 = Richest)
    wealth_quintiles = np.random.randint(1, 6, size=num_records)
    
    # 2. Health Seeking Behaviors influenced by wealth and district
    anc_visits = []
    delivery_places = []
    
    for wq, dist in zip(wealth_quintiles, district_ids):
        # Base probabilities adjusted by wealth (richer = more visits)
        base_anc_mean = 2.0 + (wq * 0.8)
        # Adjust by district (some regions have better access)
        if dist == 'gh-ashanti': base_anc_mean += 2.0
        if dist == 'ug-moroto': base_anc_mean -= 1.0
        
        visits = int(np.random.normal(loc=base_anc_mean, scale=1.5))
        anc_visits.append(max(0, min(8, visits))) # Cap between 0 and 8
        
        # Institutional delivery prob (richer and more ANC visits = higher chance)
        inst_prob = 0.2 + (wq * 0.1) + (min(visits, 4) * 0.05)
        if dist == 'gh-ashanti': inst_prob += 0.3
        
        inst_prob = min(0.95, max(0.05, inst_prob))
        
        place = 'Health Facility' if random.random() < inst_prob else 'Home'
        delivery_places.append(place)

    # 3. Complications & Mortality
    had_complication = []
    maternal_death = []
    
    for place, wq in zip(delivery_places, wealth_quintiles):
        # Base complication rate ~15%
        comp_prob = 0.15 - (wq * 0.01) # Slightly lower for richer
        complication = random.random() < comp_prob
        had_complication.append(complication)
        
        # Mortality risk if complication occurs
        if complication:
            # Home deliveries have much higher mortality if complicated
            fatal_prob = 0.05 if place == 'Home' else 0.015
        else:
            # Very low baseline risk if no complication
            fatal_prob = 0.001
            
        maternal_death.append(random.random() < fatal_prob)

    # Create DataFrame
    df = pd.DataFrame({
        'caseid': caseids,
        'district_id': district_ids,
        'maternal_age': maternal_age,
        'wealth_quintile': wealth_quintiles,
        'anc_visits': anc_visits,
        'delivery_place': delivery_places,
        'had_complication': had_complication,
        'maternal_death': maternal_death
    })
    
    # Export to CSV
    # Guardamos en la raíz del proyecto para fácil acceso
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(project_root, output_filename)
    
    df.to_csv(output_path, index=False)
    print(f"Generated synthetic dataset with {num_records} records at: {output_path}")

if __name__ == "__main__":
    generate_synthetic_dhs()
