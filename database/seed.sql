-- =========================================================
-- MATERNAL HEALTH DIGITAL TWIN: SEED DATA
-- 25 Health Districts across 5 Sub-Saharan African Countries
-- Kenya, Tanzania, Uganda, Ghana, Ethiopia
-- =========================================================

INSERT INTO health_districts (
    id, name, country, region, population, annual_births, baseline_mmr,
    anc1_coverage, anc4_coverage, institutional_delivery_rate, c_section_rate,
    avg_distance_emonc_km, avg_travel_time_hours, skilled_staff_ratio,
    blood_bank_availability, essential_drugs_availability, insurance_coverage,
    poverty_rate, female_secondary_education, tba_prevalence,
    geom, wealth_quintiles_mmr
) VALUES
-- KENYA (5 districts)
('ke-garissa', 'Garissa District', 'Kenya', 'North Eastern', 841353, 29400, 646.00,
 62.40, 38.10, 46.50, 3.20, 38.50, 3.90, 1.10, 42.00, 68.00, 11.20, 65.50, 22.40, 48.00,
 ST_SetSRID(ST_MakePoint(39.6461, -0.4532), 4326),
 '{"q1_poorest": 890, "q2_poor": 760, "q3_middle": 610, "q4_richer": 490, "q5_richest": 340}'::jsonb
),
('ke-turkana', 'Turkana Central', 'Kenya', 'Rift Valley', 926976, 34200, 720.00,
 58.00, 32.50, 39.80, 2.10, 52.00, 4.80, 0.80, 35.00, 54.00, 8.50, 79.40, 16.80, 56.50,
 ST_SetSRID(ST_MakePoint(35.5966, 3.1191), 4326),
 '{"q1_poorest": 980, "q2_poor": 840, "q3_middle": 690, "q4_richer": 520, "q5_richest": 380}'::jsonb
),
('ke-kilifi', 'Kilifi South', 'Kenya', 'Coast', 1453787, 48500, 478.00,
 81.20, 51.40, 59.30, 5.40, 18.20, 2.10, 1.60, 61.00, 76.00, 21.00, 54.20, 34.50, 32.00,
 ST_SetSRID(ST_MakePoint(39.8499, -3.6305), 4326),
 '{"q1_poorest": 650, "q2_poor": 540, "q3_middle": 450, "q4_richer": 360, "q5_richest": 260}'::jsonb
),
('ke-kisumu', 'Kisumu West', 'Kenya', 'Nyanza', 1155574, 37200, 495.00,
 88.50, 62.00, 68.20, 7.20, 14.50, 1.60, 2.30, 72.00, 81.00, 29.50, 39.80, 46.20, 24.50,
 ST_SetSRID(ST_MakePoint(34.7680, -0.0917), 4326),
 '{"q1_poorest": 680, "q2_poor": 560, "q3_middle": 460, "q4_richer": 380, "q5_richest": 240}'::jsonb
),
('ke-kakamega', 'Kakamega Central', 'Kenya', 'Western', 1867579, 59800, 516.00,
 84.10, 54.80, 62.50, 5.80, 16.80, 1.90, 1.80, 58.00, 74.00, 24.20, 49.20, 39.00, 29.00,
 ST_SetSRID(ST_MakePoint(34.7519, 0.2827), 4326),
 '{"q1_poorest": 710, "q2_poor": 590, "q3_middle": 480, "q4_richer": 390, "q5_richest": 270}'::jsonb
),

-- TANZANIA (5 districts)
('tz-mwanza', 'Mwanza Rural (Ilemela/Magu)', 'Tanzania', 'Lake Victoria', 1245000, 43500, 532.00,
 82.00, 46.20, 64.00, 4.90, 22.40, 2.50, 1.50, 52.00, 69.00, 14.80, 48.00, 29.50, 33.00,
 ST_SetSRID(ST_MakePoint(32.9000, -2.5164), 4326),
 '{"q1_poorest": 740, "q2_poor": 620, "q3_middle": 505, "q4_richer": 410, "q5_richest": 290}'::jsonb
),
('tz-kigoma', 'Kigoma Rural', 'Tanzania', 'Western Tanganyika', 685000, 26800, 618.00,
 74.50, 36.80, 48.20, 3.40, 34.00, 3.60, 1.00, 38.00, 59.00, 9.20, 58.60, 21.00, 46.00,
 ST_SetSRID(ST_MakePoint(29.6267, -4.8769), 4326),
 '{"q1_poorest": 860, "q2_poor": 720, "q3_middle": 590, "q4_richer": 470, "q5_richest": 330}'::jsonb
),
('tz-dodoma', 'Dodoma Urban & Bahi', 'Tanzania', 'Central', 765000, 27100, 445.00,
 89.00, 58.40, 72.00, 6.80, 15.00, 1.70, 2.10, 68.00, 80.00, 26.00, 36.50, 38.00, 22.00,
 ST_SetSRID(ST_MakePoint(35.7516, -6.1630), 4326),
 '{"q1_poorest": 610, "q2_poor": 510, "q3_middle": 420, "q4_richer": 340, "q5_richest": 230}'::jsonb
),
('tz-arusha', 'Arusha Rural (Monduli)', 'Tanzania', 'Northern', 620000, 21500, 462.00,
 85.20, 53.00, 66.50, 6.10, 24.50, 2.40, 1.90, 64.00, 78.00, 28.50, 41.20, 35.00, 28.00,
 ST_SetSRID(ST_MakePoint(36.6830, -3.3869), 4326),
 '{"q1_poorest": 640, "q2_poor": 530, "q3_middle": 440, "q4_richer": 350, "q5_richest": 240}'::jsonb
),
('tz-morogoro', 'Morogoro Rural (Kilosa)', 'Tanzania', 'Eastern', 710000, 25900, 508.00,
 83.50, 48.00, 61.00, 5.20, 28.00, 2.90, 1.40, 49.00, 71.00, 16.00, 46.50, 31.00, 34.00,
 ST_SetSRID(ST_MakePoint(37.6591, -6.8278), 4326),
 '{"q1_poorest": 710, "q2_poor": 585, "q3_middle": 480, "q4_richer": 395, "q5_richest": 280}'::jsonb
),

-- UGANDA (5 districts)
('ug-gulu', 'Gulu District', 'Uganda', 'Northern Acholi', 460000, 18400, 440.00,
 86.40, 52.10, 69.50, 6.50, 17.50, 1.80, 2.00, 67.00, 79.00, 6.50, 47.00, 32.00, 26.00,
 ST_SetSRID(ST_MakePoint(32.2990, 2.7747), 4326),
 '{"q1_poorest": 620, "q2_poor": 505, "q3_middle": 415, "q4_richer": 335, "q5_richest": 230}'::jsonb
),
('ug-arua', 'Arua District', 'Uganda', 'West Nile', 580000, 23200, 512.00,
 79.20, 44.00, 58.00, 4.80, 25.00, 2.70, 1.30, 46.00, 67.00, 5.00, 55.00, 26.00, 37.00,
 ST_SetSRID(ST_MakePoint(30.9073, 3.0303), 4326),
 '{"q1_poorest": 715, "q2_poor": 590, "q3_middle": 485, "q4_richer": 390, "q5_richest": 275}'::jsonb
),
('ug-moroto', 'Moroto District (Karamoja)', 'Uganda', 'Karamoja', 135000, 5800, 690.00,
 60.50, 28.00, 41.50, 2.20, 44.00, 4.20, 0.90, 32.00, 51.00, 2.10, 74.20, 14.50, 54.00,
 ST_SetSRID(ST_MakePoint(34.6666, 2.5345), 4326),
 '{"q1_poorest": 950, "q2_poor": 810, "q3_middle": 660, "q4_richer": 500, "q5_richest": 360}'::jsonb
),
('ug-jinja', 'Jinja District', 'Uganda', 'Eastern Busoga', 520000, 19800, 388.00,
 91.00, 64.50, 76.00, 8.50, 11.50, 1.20, 2.60, 78.00, 85.00, 12.00, 31.00, 48.00, 18.00,
 ST_SetSRID(ST_MakePoint(33.2026, 0.4479), 4326),
 '{"q1_poorest": 540, "q2_poor": 440, "q3_middle": 360, "q4_richer": 290, "q5_richest": 200}'::jsonb
),
('ug-mbarara', 'Mbarara District', 'Uganda', 'Western Ankole', 490000, 18100, 375.00,
 92.50, 66.00, 78.20, 9.10, 12.00, 1.30, 2.70, 81.00, 87.00, 14.50, 28.50, 50.50, 16.50,
 ST_SetSRID(ST_MakePoint(30.6545, -0.6072), 4326),
 '{"q1_poorest": 520, "q2_poor": 425, "q3_middle": 350, "q4_richer": 280, "q5_richest": 195}'::jsonb
),

-- GHANA (5 districts)
('gh-northern', 'Tamale Metro & Sagnarigu', 'Ghana', 'Northern', 620000, 21000, 420.00,
 94.00, 68.00, 74.00, 8.00, 14.00, 1.50, 2.40, 75.00, 83.00, 68.00, 38.00, 42.00, 20.00,
 ST_SetSRID(ST_MakePoint(-0.8393, 9.4008), 4326),
 '{"q1_poorest": 580, "q2_poor": 480, "q3_middle": 395, "q4_richer": 315, "q5_richest": 215}'::jsonb
),
('gh-upper-east', 'Bolgatanga & Bongo', 'Ghana', 'Upper East', 410000, 13900, 448.00,
 92.50, 62.00, 71.00, 6.90, 18.00, 1.90, 2.10, 69.00, 79.00, 71.50, 44.50, 38.00, 22.50,
 ST_SetSRID(ST_MakePoint(-0.8514, 10.7856), 4326),
 '{"q1_poorest": 620, "q2_poor": 510, "q3_middle": 420, "q4_richer": 335, "q5_richest": 235}'::jsonb
),
('gh-volta', 'Ho Municipal & Central', 'Ghana', 'Volta', 360000, 11200, 355.00,
 96.00, 74.00, 81.00, 11.20, 12.00, 1.30, 2.80, 82.00, 88.00, 76.00, 26.00, 56.00, 14.00,
 ST_SetSRID(ST_MakePoint(0.4786, 6.6108), 4326),
 '{"q1_poorest": 490, "q2_poor": 405, "q3_middle": 330, "q4_richer": 265, "q5_richest": 180}'::jsonb
),
('gh-ashanti', 'Kumasi Metro', 'Ghana', 'Ashanti', 2800000, 84000, 295.00,
 98.00, 82.50, 88.50, 15.80, 6.50, 0.80, 3.80, 91.00, 94.00, 82.00, 16.50, 68.00, 8.50,
 ST_SetSRID(ST_MakePoint(-1.6244, 6.6885), 4326),
 '{"q1_poorest": 410, "q2_poor": 340, "q3_middle": 275, "q4_richer": 220, "q5_richest": 150}'::jsonb
),
('gh-accra', 'Greater Accra East', 'Ghana', 'Greater Accra', 3400000, 98000, 260.00,
 98.50, 86.00, 91.00, 18.50, 5.20, 0.70, 4.20, 94.00, 96.00, 85.00, 12.00, 74.00, 6.00,
 ST_SetSRID(ST_MakePoint(-0.1870, 5.6037), 4326),
 '{"q1_poorest": 360, "q2_poor": 295, "q3_middle": 240, "q4_richer": 195, "q5_richest": 135}'::jsonb
),

-- ETHIOPIA (5 districts)
('et-somali', 'Jigjiga Zone & Godey', 'Ethiopia', 'Somali', 1100000, 41800, 685.00,
 48.00, 26.50, 32.00, 2.30, 48.00, 4.50, 0.90, 36.00, 58.00, 12.00, 62.00, 18.00, 58.00,
 ST_SetSRID(ST_MakePoint(42.7950, 9.3533), 4326),
 '{"q1_poorest": 940, "q2_poor": 805, "q3_middle": 655, "q4_richer": 495, "q5_richest": 350}'::jsonb
),
('et-afar', 'Awash & Semera Zone', 'Ethiopia', 'Afar', 620000, 23500, 710.00,
 44.50, 24.00, 29.50, 1.80, 56.00, 5.10, 0.70, 30.00, 52.00, 9.00, 68.00, 14.00, 62.00,
 ST_SetSRID(ST_MakePoint(41.0089, 11.7925), 4326),
 '{"q1_poorest": 975, "q2_poor": 835, "q3_middle": 680, "q4_richer": 515, "q5_richest": 365}'::jsonb
),
('et-oromia', 'East Shewa (Adama)', 'Ethiopia', 'Oromia', 1750000, 57700, 430.00,
 84.00, 51.50, 62.00, 6.40, 18.00, 1.90, 1.90, 64.00, 77.00, 38.00, 34.00, 36.00, 31.00,
 ST_SetSRID(ST_MakePoint(39.2689, 8.5414), 4326),
 '{"q1_poorest": 595, "q2_poor": 490, "q3_middle": 410, "q4_richer": 325, "q5_richest": 225}'::jsonb
),
('et-amhara', 'West Gojjam (Bahir Dar)', 'Ethiopia', 'Amhara', 1600000, 51200, 455.00,
 81.50, 48.00, 58.50, 5.70, 22.00, 2.30, 1.70, 58.00, 73.00, 42.00, 38.50, 32.00, 35.00,
 ST_SetSRID(ST_MakePoint(37.3908, 11.5936), 4326),
 '{"q1_poorest": 630, "q2_poor": 520, "q3_middle": 435, "q4_richer": 340, "q5_richest": 240}'::jsonb
),
('et-tigray', 'Central Tigray (Mekelle)', 'Ethiopia', 'Tigray', 950000, 29500, 490.00,
 76.00, 42.00, 52.00, 4.80, 24.00, 2.60, 1.40, 48.00, 66.00, 28.00, 46.00, 29.00, 38.00,
 ST_SetSRID(ST_MakePoint(39.4767, 13.4967), 4326),
 '{"q1_poorest": 680, "q2_poor": 560, "q3_middle": 465, "q4_richer": 370, "q5_richest": 260}'::jsonb
);
