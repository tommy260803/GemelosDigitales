-- =========================================================
-- MATERNAL HEALTH DIGITAL TWIN: DATABASE SCHEMA DDL
-- Extensions: PostGIS, TimescaleDB, pg_trgm, uuid-ossp
-- Target: PostgreSQL 15+
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Users, Roles & Access Control (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('investigator', 'policy_maker', 'viewer', 'admin')),
    assigned_country VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Health Districts (Aggregated District-Level Data, NO PII)
CREATE TABLE IF NOT EXISTS health_districts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    population INT NOT NULL,
    annual_births INT NOT NULL,
    baseline_mmr NUMERIC(8, 2) NOT NULL, -- per 100,000 live births
    anc1_coverage NUMERIC(5, 2) NOT NULL,
    anc4_coverage NUMERIC(5, 2) NOT NULL,
    institutional_delivery_rate NUMERIC(5, 2) NOT NULL,
    c_section_rate NUMERIC(5, 2) NOT NULL,
    avg_distance_emonc_km NUMERIC(6, 2) NOT NULL,
    avg_travel_time_hours NUMERIC(5, 2) NOT NULL,
    skilled_staff_ratio NUMERIC(5, 2) NOT NULL,
    blood_bank_availability NUMERIC(5, 2) NOT NULL,
    essential_drugs_availability NUMERIC(5, 2) NOT NULL,
    insurance_coverage NUMERIC(5, 2) NOT NULL,
    poverty_rate NUMERIC(5, 2) NOT NULL,
    female_secondary_education NUMERIC(5, 2) NOT NULL,
    tba_prevalence NUMERIC(5, 2) NOT NULL,
    geom GEOMETRY(Point, 4326),
    wealth_quintiles_mmr JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. System Dynamics Model Parameter Sets
CREATE TABLE IF NOT EXISTS sd_model_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id VARCHAR(64) REFERENCES health_districts(id) ON DELETE CASCADE,
    scenario_id VARCHAR(50) NOT NULL, -- baseline, scenario_a, scenario_b, scenario_c, scenario_d
    travel_time_hours NUMERIC(5, 2) NOT NULL,
    facility_fee_usd NUMERIC(6, 2) NOT NULL,
    transport_cost_usd NUMERIC(6, 2) NOT NULL,
    road_quality_index NUMERIC(4, 2) NOT NULL,
    insurance_coverage_rate NUMERIC(4, 2) NOT NULL,
    skilled_staff_ratio NUMERIC(5, 2) NOT NULL,
    blood_availability_rate NUMERIC(4, 2) NOT NULL,
    oxytocin_stock_rate NUMERIC(4, 2) NOT NULL,
    tba_influence_factor NUMERIC(4, 2) NOT NULL,
    community_trust_baseline NUMERIC(4, 2) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Simulation Runs & Outcomes
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id VARCHAR(64) REFERENCES health_districts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    scenario_id VARCHAR(50) NOT NULL,
    horizon_months INT DEFAULT 36,
    lives_saved INT NOT NULL,
    lives_saved_ci_low INT NOT NULL,
    lives_saved_ci_high INT NOT NULL,
    final_mmr NUMERIC(8, 2) NOT NULL,
    mmr_reduction_percent NUMERIC(5, 2) NOT NULL,
    total_cost_usd NUMERIC(12, 2) NOT NULL,
    cost_per_life_saved NUMERIC(10, 2) NOT NULL,
    icer_per_daly NUMERIC(10, 2) NOT NULL,
    summary_json JSONB NOT NULL,
    trajectories_json JSONB NOT NULL,
    equity_breakdown_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Statistical Validation Executions (KS, Wilcoxon, Sobol, Bootstrap)
CREATE TABLE IF NOT EXISTS validation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id VARCHAR(64) REFERENCES health_districts(id) ON DELETE CASCADE,
    test_type VARCHAR(50) NOT NULL, -- KS, WILCOXON, SOBOL, BOOTSTRAP, COUNTDOWN
    statistic_value NUMERIC(10, 4) NOT NULL,
    p_value NUMERIC(10, 4),
    hypothesis_confirmed BOOLEAN NOT NULL,
    metrics_json JSONB NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs for Parameter Governance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    before_value JSONB,
    after_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-speed spatial & analytical queries
CREATE INDEX IF NOT EXISTS idx_health_districts_country ON health_districts(country);
CREATE INDEX IF NOT EXISTS idx_health_districts_geom ON health_districts USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_simulation_district ON simulation_runs(district_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenario ON simulation_runs(scenario_id);
