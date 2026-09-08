from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# ==========================================
# SQLALCHEMY ORM MODELS
# ==========================================

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="investigator") # investigator, policy_maker, viewer
    assigned_country = Column(String(50), nullable=True)
    preferred_language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HealthDistrict(Base):
    __tablename__ = "health_districts"
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False)
    population = Column(Integer, nullable=False)
    annual_births = Column(Integer, nullable=False)
    baseline_mmr = Column(Float, nullable=False)
    anc1_coverage = Column(Float, nullable=False)
    anc4_coverage = Column(Float, nullable=False)
    institutional_delivery_rate = Column(Float, nullable=False)
    c_section_rate = Column(Float, nullable=False)
    avg_distance_emonc_km = Column(Float, nullable=False)
    avg_travel_time_hours = Column(Float, nullable=False)
    skilled_staff_ratio = Column(Float, nullable=False)
    blood_bank_availability = Column(Float, nullable=False)
    essential_drugs_availability = Column(Float, nullable=False)
    insurance_coverage = Column(Float, nullable=False)
    poverty_rate = Column(Float, nullable=False)
    female_secondary_education = Column(Float, nullable=False)
    tba_prevalence = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    wealth_quintiles_mmr = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id = Column(String(36), primary_key=True)
    district_id = Column(String(64), ForeignKey("health_districts.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    scenario_id = Column(String(50), nullable=False) # baseline, scenario_a, scenario_b, scenario_c, scenario_d
    horizon_months = Column(Integer, default=36)
    parameters_json = Column(JSON, nullable=False)
    summary_results_json = Column(JSON, nullable=False)
    trajectories_json = Column(JSON, nullable=False)
    equity_breakdown_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ValidationExecution(Base):
    __tablename__ = "validation_executions"
    id = Column(String(36), primary_key=True)
    district_id = Column(String(64), ForeignKey("health_districts.id"), nullable=False)
    test_type = Column(String(50), nullable=False) # KS, WILCOXON, SOBOL, BOOTSTRAP, COUNTDOWN
    statistic_value = Column(Float, nullable=False)
    p_value = Column(Float, nullable=True)
    metrics_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==========================================
# PYDANTIC SCHEMAS (REQUESTS & RESPONSES)
# ==========================================

class SimulationRequest(BaseModel):
    district_id: str = Field(..., example="ke-garissa")
    scenario_id: Optional[str] = Field("baseline", example="scenario_d")
    months: Optional[int] = Field(36, ge=12, le=240)
    custom_params: Optional[Dict[str, float]] = None

class ScenarioComparisonRequest(BaseModel):
    district_id: str
    months: Optional[int] = 36

class CalibrationRequest(BaseModel):
    district_id: str
    empirical_mmr_series: Optional[List[float]] = None
    target_tolerance: Optional[float] = 0.05

class KSTestRequest(BaseModel):
    district_id: str
    sample_size: Optional[int] = 120

class SobolSensitivityRequest(BaseModel):
    district_id: str
    samples_per_param: Optional[int] = 1000

class BootstrapRequest(BaseModel):
    district_id: str
    scenario_id: str = "scenario_d"
    iterations: Optional[int] = 1000

class UserLoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_name: str
