"""
Shared fixtures for Maternal Health Digital Twin tests.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.system_dynamics import DistrictData
from main import app
from fastapi.testclient import TestClient


@pytest.fixture
def garissa_district():
    """Garissa, Kenya - High MMR district."""
    return DistrictData(
        id='ke-garissa', name='Garissa District', country='Kenya', region='North Eastern',
        population=841353, annual_births=29400, baseline_mmr=646.0,
        anc1_coverage=62.4, anc4_coverage=38.1, institutional_delivery_rate=46.5,
        c_section_rate=3.2, avg_distance_to_emonc=38.5, avg_travel_time_hours=3.9,
        skilled_staff_ratio=1.1, blood_bank_availability=42.0, essential_drugs_availability=68.0,
        insurance_coverage=11.2, poverty_rate=65.5, female_secondary_education=22.4,
        traditional_birth_attendant_prevalence=48.0, lat=-0.4532, lng=39.6461,
        osm_health_facilities_count=48,
        wealth_quintile_mmr={'q1_poorest': 890, 'q2_poor': 760, 'q3_middle': 610, 'q4_richer': 490, 'q5_richest': 340}
    )


@pytest.fixture
def ashanti_district():
    """Kumasi Metro, Ghana - Low MMR district."""
    return DistrictData(
        id='gh-ashanti', name='Kumasi Metro', country='Ghana', region='Ashanti',
        population=2800000, annual_births=84000, baseline_mmr=295.0,
        anc1_coverage=98.0, anc4_coverage=82.5, institutional_delivery_rate=88.5,
        c_section_rate=15.8, avg_distance_to_emonc=6.5, avg_travel_time_hours=0.8,
        skilled_staff_ratio=3.8, blood_bank_availability=91.0, essential_drugs_availability=94.0,
        insurance_coverage=82.0, poverty_rate=16.5, female_secondary_education=68.0,
        traditional_birth_attendant_prevalence=8.5, lat=6.6885, lng=-1.6244,
        osm_health_facilities_count=168,
        wealth_quintile_mmr={'q1_poorest': 410, 'q2_poor': 340, 'q3_middle': 275, 'q4_richer': 220, 'q5_richest': 150}
    )


@pytest.fixture
def moroto_district():
    """Moroto, Uganda - Very high MMR, remote district."""
    return DistrictData(
        id='ug-moroto', name='Moroto District (Karamoja)', country='Uganda', region='Karamoja',
        population=135000, annual_births=5800, baseline_mmr=690.0,
        anc1_coverage=60.5, anc4_coverage=28.0, institutional_delivery_rate=41.5,
        c_section_rate=2.2, avg_distance_to_emonc=44.0, avg_travel_time_hours=4.2,
        skilled_staff_ratio=0.9, blood_bank_availability=32.0, essential_drugs_availability=51.0,
        insurance_coverage=2.1, poverty_rate=74.2, female_secondary_education=14.5,
        traditional_birth_attendant_prevalence=54.0, lat=2.5345, lng=34.6666,
        osm_health_facilities_count=18,
        wealth_quintile_mmr={'q1_poorest': 950, 'q2_poor': 810, 'q3_middle': 660, 'q4_richer': 500, 'q5_richest': 360}
    )


@pytest.fixture
def afar_district():
    """Awash & Semera, Ethiopia - Highest MMR district."""
    return DistrictData(
        id='et-afar', name='Awash & Semera Zone', country='Ethiopia', region='Afar',
        population=620000, annual_births=23500, baseline_mmr=710.0,
        anc1_coverage=44.5, anc4_coverage=24.0, institutional_delivery_rate=29.5,
        c_section_rate=1.8, avg_distance_to_emonc=56.0, avg_travel_time_hours=5.1,
        skilled_staff_ratio=0.7, blood_bank_availability=30.0, essential_drugs_availability=52.0,
        insurance_coverage=9.0, poverty_rate=68.0, female_secondary_education=14.0,
        traditional_birth_attendant_prevalence=62.0, lat=11.7925, lng=41.0089,
        osm_health_facilities_count=28,
        wealth_quintile_mmr={'q1_poorest': 975, 'q2_poor': 835, 'q3_middle': 680, 'q4_richer': 515, 'q5_richest': 365}
    )


@pytest.fixture
def all_demo_districts(garissa_district, moroto_district, ashanti_district, afar_district):
    """All 4 demo districts."""
    return [garissa_district, moroto_district, ashanti_district, afar_district]


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)
