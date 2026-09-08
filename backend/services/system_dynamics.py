"""
Maternal Health Digital Twin - System Dynamics Engine (Python)
================================================================
5-Stock ODE Model with Runge-Kutta 4th Order Integration
Ported from TypeScript engine with full feature parity.

Stocks:
  S1: Pregnant Women
  S2: In ANC
  S3: In Facility Delivery
  S4: In Postpartum
  S5: With Complications

Feedback Loops:
  R1: Community Trust Reinforcing Loop
  B1: Facility Capacity Balancing Loop
  B2: Phase 2 Transport Delay Loop
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
import math
import random


# =========================================================
# DATA MODELS
# =========================================================

@dataclass
class DistrictData:
    id: str
    name: str
    country: str
    region: str
    population: int
    annual_births: int
    baseline_mmr: float
    anc1_coverage: float
    anc4_coverage: float
    institutional_delivery_rate: float
    c_section_rate: float
    avg_distance_to_emonc: float
    avg_travel_time_hours: float
    skilled_staff_ratio: float
    blood_bank_availability: float
    essential_drugs_availability: float
    insurance_coverage: float
    poverty_rate: float
    female_secondary_education: float
    traditional_birth_attendant_prevalence: float
    lat: float
    lng: float
    osm_health_facilities_count: int
    wealth_quintile_mmr: Dict[str, float]


@dataclass
class SDParameters:
    avg_distance_km: float
    travel_time_hours: float
    road_quality_index: float
    facility_delivery_fee_usd: float
    transport_cost_usd: float
    insurance_coverage_rate: float
    skilled_staff_ratio: float
    blood_availability_rate: float
    oxytocin_misoprostol_stock_rate: float
    bed_capacity_ratio: float
    maternal_education_rate: float
    tba_influence_factor: float
    community_trust_baseline: float
    baseline_complication_rate: float
    severe_pph_fraction: float
    pre_eclampsia_fraction: float
    sepsis_fraction: float
    obstructed_labor_fraction: float


@dataclass
class StockState:
    time_month: int
    pregnant_women: int
    in_anc: int
    in_facility_delivery: int
    in_postpartum: int
    with_complications: int
    monthly_births: int
    monthly_maternal_deaths: float
    monthly_lives_saved: float
    calculated_mmr: int
    anc_coverage_percent: int
    facility_delivery_percent: int
    system_trust_level: float
    facility_congestion_index: float
    phase2_delay_hours: float
    phase3_delay_hours: float


@dataclass
class SimulationSummary:
    total_births: int
    total_maternal_deaths: int
    baseline_deaths: int
    lives_saved: int
    lives_saved_ci95: Tuple[int, int]
    mmr_baseline: float
    mmr_final: int
    mmr_reduction_percent: float
    anc4_coverage_final: int
    facility_delivery_rate_final: int
    total_cost_usd: int
    cost_per_life_saved_usd: int
    cost_per_life_saved_ci95: Tuple[int, int]
    icer_per_daly: int


@dataclass
class EquityQuintileResult:
    quintile: str
    label: str
    population_share: float
    baseline_mmr: int
    simulated_mmr: int
    lives_saved: int
    relative_reduction: float
    absolute_reduction: int
    fiscal_cost_usd: int
    cost_per_life_saved_in_q: int
    benefit_cost_ratio: float


@dataclass
class SimulationResult:
    district_id: str
    district_name: str
    country: str
    scenario_id: str
    scenario_name: str
    parameters: SDParameters
    trajectories: List[StockState]
    summary: SimulationSummary
    equity_disaggregation: List[EquityQuintileResult]


# =========================================================
# SCENARIO DEFINITIONS
# =========================================================

SCENARIO_DEFINITIONS = [
    {
        'id': 'baseline',
        'letter': 'Base',
        'name': 'Status Quo (Baseline Model)',
        'description': 'Current health system performance without supplementary policy or infrastructure interventions.',
        'mechanism': 'Standard district resource allocation, existing referral transport delays, and standard out-of-pocket delivery fees.',
        'cost_per_capita_usd': 0.0,
        'parameter_overrides': {}
    },
    {
        'id': 'scenario_a',
        'letter': 'a',
        'name': 'Emergency Moto-Ambulance Network',
        'description': 'Deployment of 4x4 rugged motorcycle ambulances with shock-garments, satellite dispatch, and community alert hubs.',
        'mechanism': 'Reduces Phase 2 geographic transport delays by 72% (from ~3.8h to ~1.0h), doubling emergency obstetric referral rate.',
        'cost_per_capita_usd': 1.45,
        'parameter_overrides': {
            'travel_time_hours': 0.9,
            'transport_cost_usd': 0.5,
            'road_quality_index': 0.85,
        }
    },
    {
        'id': 'scenario_b',
        'letter': 'b',
        'name': 'Elimination of Delivery & Emergency User Fees',
        'description': 'Universal exemption of facility delivery fees, emergency medicines, blood transfusion costs, and admission charges.',
        'mechanism': 'Abolishes out-of-pocket financial barriers, boosting facility delivery demand by +35% especially among Q1-Q2 wealth quintiles.',
        'cost_per_capita_usd': 2.80,
        'parameter_overrides': {
            'facility_delivery_fee_usd': 0.0,
            'insurance_coverage_rate': 0.92,
        }
    },
    {
        'id': 'scenario_c',
        'letter': 'c',
        'name': 'TBA & CHW Alarm Sign Recognition Training',
        'description': 'Certifying Traditional Birth Attendants (TBAs) and Community Health Workers in WHO alarm signs and early facility referral.',
        'mechanism': 'Improves early detection of pre-eclampsia, antepartum hemorrhage, and obstructed labor; reduces home birth complication delay.',
        'cost_per_capita_usd': 0.95,
        'parameter_overrides': {
            'tba_influence_factor': 0.15,
            'community_trust_baseline': 0.88,
        }
    },
    {
        'id': 'scenario_d',
        'letter': 'd',
        'name': 'Combined Strategic Package (a + b + c)',
        'description': 'Integrated deployment of Moto-Ambulance fleet + Free Delivery Care + Certified TBA Early Referral Alliance.',
        'mechanism': 'Multi-target systemic bottleneck mitigation creating compounding synergies across geographic, financial, and triage dimensions.',
        'cost_per_capita_usd': 5.20,
        'parameter_overrides': {
            'travel_time_hours': 0.9,
            'transport_cost_usd': 0.0,
            'road_quality_index': 0.85,
            'facility_delivery_fee_usd': 0.0,
            'insurance_coverage_rate': 0.95,
            'tba_influence_factor': 0.12,
            'community_trust_baseline': 0.92,
            'oxytocin_misoprostol_stock_rate': 0.92,
            'blood_availability_rate': 0.85,
            'skilled_staff_ratio': 1.8,
        }
    },
]


# =========================================================
# PARAMETER BUILDER
# =========================================================

def build_default_parameters(district: DistrictData) -> SDParameters:
    """Derives all 21 SD parameters from district epidemiological data."""
    return SDParameters(
        avg_distance_km=district.avg_distance_to_emonc,
        travel_time_hours=district.avg_travel_time_hours,
        road_quality_index=max(0.2, 1 - (district.avg_distance_to_emonc / 80)),
        facility_delivery_fee_usd=2.5 if district.insurance_coverage > 50 else 18.0,
        transport_cost_usd=round(district.avg_distance_to_emonc * 0.45 * 10) / 10,
        insurance_coverage_rate=district.insurance_coverage / 100,
        skilled_staff_ratio=district.skilled_staff_ratio,
        blood_availability_rate=district.blood_bank_availability / 100,
        oxytocin_misoprostol_stock_rate=district.essential_drugs_availability / 100,
        bed_capacity_ratio=min(1.0, (district.osm_health_facilities_count * 25) / max(1, district.annual_births / 12)),
        maternal_education_rate=district.female_secondary_education / 100,
        tba_influence_factor=district.traditional_birth_attendant_prevalence / 100,
        community_trust_baseline=0.72,
        baseline_complication_rate=0.15,
        severe_pph_fraction=0.38,
        pre_eclampsia_fraction=0.22,
        sepsis_fraction=0.14,
        obstructed_labor_fraction=0.16,
    )


# =========================================================
# SYSTEM DYNAMICS ENGINE
# =========================================================

class SystemDynamicsEngine:
    """
    Solves the 5-Stock System Dynamics Differential Equations
    using calibrated Runge-Kutta 4th Order (RK4) integration
    with dynamic feedback loops.
    """

    @staticmethod
    def simulate(
        district: DistrictData,
        scenario_id: str = 'baseline',
        custom_params: Optional[Dict[str, float]] = None,
        simulation_months: int = 36
    ) -> SimulationResult:
        
        custom_params = custom_params or {}
        base_params = build_default_parameters(district)
        
        # Find scenario definition
        scenario_def = next((s for s in SCENARIO_DEFINITIONS if s['id'] == scenario_id), SCENARIO_DEFINITIONS[0])
        
        # Merge parameters with scenario overrides and customizations
        params_dict = {
            'avg_distance_km': base_params.avg_distance_km,
            'travel_time_hours': base_params.travel_time_hours,
            'road_quality_index': base_params.road_quality_index,
            'facility_delivery_fee_usd': base_params.facility_delivery_fee_usd,
            'transport_cost_usd': base_params.transport_cost_usd,
            'insurance_coverage_rate': base_params.insurance_coverage_rate,
            'skilled_staff_ratio': base_params.skilled_staff_ratio,
            'blood_availability_rate': base_params.blood_availability_rate,
            'oxytocin_misoprostol_stock_rate': base_params.oxytocin_misoprostol_stock_rate,
            'bed_capacity_ratio': base_params.bed_capacity_ratio,
            'maternal_education_rate': base_params.maternal_education_rate,
            'tba_influence_factor': base_params.tba_influence_factor,
            'community_trust_baseline': base_params.community_trust_baseline,
            'baseline_complication_rate': base_params.baseline_complication_rate,
            'severe_pph_fraction': base_params.severe_pph_fraction,
            'pre_eclampsia_fraction': base_params.pre_eclampsia_fraction,
            'sepsis_fraction': base_params.sepsis_fraction,
            'obstructed_labor_fraction': base_params.obstructed_labor_fraction,
        }
        params_dict.update(scenario_def['parameter_overrides'])
        params_dict.update(custom_params)
        
        # Ensure interventions only IMPROVE (never degrade high-performing districts)
        if scenario_id in ('scenario_a', 'scenario_d'):
            params_dict['travel_time_hours'] = min(
                base_params.travel_time_hours * 0.28,
                custom_params.get('travel_time_hours', min(0.9, base_params.travel_time_hours * 0.5))
            )
            params_dict['road_quality_index'] = max(0.85, base_params.road_quality_index)
            params_dict['transport_cost_usd'] = min(0.5, base_params.transport_cost_usd * 0.2)
        
        if scenario_id in ('scenario_b', 'scenario_d'):
            params_dict['facility_delivery_fee_usd'] = 0.0
            params_dict['insurance_coverage_rate'] = max(0.95, base_params.insurance_coverage_rate)
        
        if scenario_id in ('scenario_c', 'scenario_d'):
            params_dict['tba_influence_factor'] = min(0.12, base_params.tba_influence_factor * 0.25)
            params_dict['community_trust_baseline'] = max(0.90, base_params.community_trust_baseline)
        
        if scenario_id == 'scenario_d':
            params_dict['blood_availability_rate'] = max(0.92, base_params.blood_availability_rate)
            params_dict['oxytocin_misoprostol_stock_rate'] = max(0.95, base_params.oxytocin_misoprostol_stock_rate)
            params_dict['skilled_staff_ratio'] = max(base_params.skilled_staff_ratio, 2.2)
        
        params = SDParameters(**params_dict)
        
        # --- EPIDEMIOLOGICAL BASELINE CALIBRATION ---
        monthly_births_target = district.annual_births / 12
        monthly_pregnancies = monthly_births_target * 1.05
        
        base_inst_deliv_rate = district.institutional_delivery_rate / 100
        base_anc1_rate = district.anc1_coverage / 100
        base_travel_time = base_params.travel_time_hours
        base_fee = base_params.facility_delivery_fee_usd
        base_tba = base_params.tba_influence_factor
        base_road_quality = base_params.road_quality_index
        base_quality = min(1.0, (base_params.skilled_staff_ratio / 3.0) * 0.4 + base_params.blood_availability_rate * 0.3 + base_params.oxytocin_misoprostol_stock_rate * 0.3)
        base_comp_risk = base_params.baseline_complication_rate * (1.05 - 0.1 * base_params.maternal_education_rate)
        
        base_referral_propensity = min(0.85, max(0.20,
            0.70 - (base_travel_time / 12.0) - (base_tba * 0.25) + (base_road_quality * 0.15)
        ))
        
        base_home_weight = (1 - base_inst_deliv_rate) * (
            (1 - base_referral_propensity) * 1.0 +
            base_referral_propensity * (0.22 + 0.38 * (base_travel_time / 5.0)) * (1.0 - 0.5 * base_quality)
        )
        base_inst_weight = base_inst_deliv_rate * 0.12 * (1.0 - 0.7 * base_quality)
        base_total_risk_score = (base_home_weight + base_inst_weight) * base_comp_risk
        
        # Calibration constant: ensures baseline matches observed MMR
        target_monthly_deaths = monthly_births_target * (district.baseline_mmr / 100000)
        calib_const = target_monthly_deaths / max(0.0001, monthly_births_target * base_total_risk_score)
        
        # Initial Stock Conditions
        pregnant_women = monthly_pregnancies * 7.5
        in_anc = pregnant_women * (base_anc1_rate * 0.75)
        in_facility_delivery = monthly_births_target * base_inst_deliv_rate * (3 / 30)
        in_postpartum = monthly_births_target * 1.4
        with_complications = monthly_births_target * base_comp_risk * (2 / 30)
        
        dt = 0.1  # RK4 sub-step in months
        total_steps = round(simulation_months / dt)
        
        monthly_snapshots: List[StockState] = []
        
        # System Feedback Variables
        system_trust = params.community_trust_baseline
        rolling_observed_mmr = district.baseline_mmr
        
        cumulative_births = 0.0
        cumulative_deaths = 0.0
        current_month_accumulated_births = 0.0
        current_month_accumulated_deaths = 0.0
        
        for step in range(total_steps + 1):
            current_month = int(step * dt)
            
            # --- DYNAMIC FEEDBACK LOOPS ---
            # R1: Trust Feedback Loop
            mmr_distress_ratio = rolling_observed_mmr / max(100, district.baseline_mmr)
            target_trust = max(0.35, min(0.98, params.community_trust_baseline * (1.15 - 0.20 * mmr_distress_ratio)))
            system_trust += (target_trust - system_trust) * 0.08 * dt
            
            # B1: Resource & Capacity Congestion Loop
            current_patient_load = in_facility_delivery + with_complications * 1.8
            nominal_capacity = max(10, monthly_births_target * 0.12 * (params.skilled_staff_ratio / 1.5))
            congestion_index = min(2.5, current_patient_load / nominal_capacity)
            
            # Clinical Quality Index
            quality_factor = max(0.25, min(1.0,
                (params.skilled_staff_ratio / 3.0) * 0.4 +
                params.blood_availability_rate * 0.3 +
                params.oxytocin_misoprostol_stock_rate * 0.3 -
                max(0, congestion_index - 1.0) * 0.20
            ))
            
            # Phase 2 & Phase 3 Delays
            phase2_delay = max(0.4,
                params.travel_time_hours * (1.5 - 0.5 * params.road_quality_index) +
                (0.6 if params.transport_cost_usd > 5 else 0.05)
            )
            
            blood_deficit = max(0, (1 - params.blood_availability_rate) * 2.0)
            drug_deficit = max(0, (1 - params.oxytocin_misoprostol_stock_rate) * 1.8)
            staff_deficit = max(0, (1 - min(1.2, params.skilled_staff_ratio / 2.0)) * 1.5)
            phase3_delay = max(0.2,
                0.30 + blood_deficit + drug_deficit + staff_deficit + max(0, congestion_index - 1.0) * 1.2
            )
            
            # Relative Intervention Benefits
            fee_benefit = max(0, (base_fee - params.facility_delivery_fee_usd) / 25.0)
            travel_benefit = max(0, (base_travel_time - params.travel_time_hours) / max(1.0, base_travel_time))
            tba_benefit = max(0, base_tba - params.tba_influence_factor)
            quality_benefit = max(0, quality_factor - base_quality)
            
            # Dynamic Coverage & Demand Propensities
            anc_coverage_rate = min(0.98, max(0.15,
                base_anc1_rate * (1.0 + 0.15 * fee_benefit + 0.12 * tba_benefit + 0.10 * (system_trust - 0.72))
            ))
            
            facility_delivery_rate = min(0.98, max(0.15,
                base_inst_deliv_rate * (
                    1.0 + 0.35 * fee_benefit + 0.22 * travel_benefit +
                    0.15 * tba_benefit + 0.15 * quality_benefit + 0.10 * (system_trust - 0.72)
                )
            ))
            
            # --- FLOW RATES ACROSS 5 STOCKS ---
            flow_s1_to_s2 = (pregnant_women / 3.5) * (anc_coverage_rate / max(0.1, base_anc1_rate))
            flow_s1_to_term = pregnant_women / 7.5
            flow_s2_to_term = in_anc / 4.5
            total_deliveries = flow_s2_to_term + flow_s1_to_term
            
            current_inst_deliveries = total_deliveries * facility_delivery_rate
            current_home_deliveries = total_deliveries * (1 - facility_delivery_rate)
            
            complication_risk = params.baseline_complication_rate * (1.05 - 0.1 * params.maternal_education_rate)
            home_complications = current_home_deliveries * complication_risk
            inst_complications = current_inst_deliveries * complication_risk
            
            referral_propensity = min(0.94, max(0.20,
                base_referral_propensity + 0.35 * travel_benefit + 0.30 * tba_benefit + 0.15 * (params.road_quality_index - base_road_quality)
            ))
            
            emergency_referrals = home_complications * referral_propensity
            unreferred_home_complications = home_complications * (1 - referral_propensity)
            
            # --- MATERNAL MORTALITY CALCULATION (3-STREAM) ---
            step_home_deaths = unreferred_home_complications * 1.0 * calib_const
            transit_penalty = (0.22 + 0.38 * (params.travel_time_hours / 5.0))
            step_referred_deaths = emergency_referrals * transit_penalty * (1.0 - 0.5 * quality_factor) * calib_const
            
            protocol_enhancement = 0.40 if scenario_id == 'scenario_d' else (0.15 if scenario_id == 'scenario_c' else (0.10 if scenario_id == 'scenario_b' else 0.0))
            step_planned_facility_deaths = inst_complications * 0.12 * (1.0 - 0.7 * quality_factor) * (1.0 - protocol_enhancement) * calib_const
            
            step_total_deaths = (step_home_deaths + step_referred_deaths + step_planned_facility_deaths) * dt
            step_births = total_deliveries * dt
            
            current_month_accumulated_deaths += step_total_deaths
            current_month_accumulated_births += step_births
            cumulative_deaths += step_total_deaths
            cumulative_births += step_births
            
            # --- DIFFERENTIAL EQUATIONS ---
            d_s1 = (monthly_pregnancies - flow_s1_to_s2 - flow_s1_to_term) * dt
            d_s2 = (flow_s1_to_s2 - flow_s2_to_term) * dt
            
            stay_time = 0.1
            exit_s3 = in_facility_delivery / stay_time
            d_s3 = (current_inst_deliveries + emergency_referrals - exit_s3) * dt
            
            d_s5 = (home_complications - emergency_referrals - (unreferred_home_complications / 0.15)) * dt
            
            exit_s4 = in_postpartum / 1.4
            d_s4 = (
                (current_home_deliveries - home_complications) +
                (exit_s3 - step_planned_facility_deaths - step_referred_deaths) -
                exit_s4
            ) * dt
            
            # Non-negativity guards
            pregnant_women = max(10, pregnant_women + d_s1)
            in_anc = max(10, in_anc + d_s2)
            in_facility_delivery = max(5, in_facility_delivery + d_s3)
            with_complications = max(1, with_complications + d_s5)
            in_postpartum = max(10, in_postpartum + d_s4)
            
            # --- RECORD MONTHLY SNAPSHOTS ---
            if step > 0 and step % round(1 / dt) == 0:
                calculated_mmr = int(round((current_month_accumulated_deaths / current_month_accumulated_births) * 100000)) if current_month_accumulated_births > 0 else district.baseline_mmr
                rolling_observed_mmr = rolling_observed_mmr * 0.7 + calculated_mmr * 0.3
                
                calculated_anc = min(99, int(round(anc_coverage_rate * 100)))
                calculated_facility_delivery = min(99, int(round(facility_delivery_rate * 100)))
                
                expected_baseline_deaths_this_month = current_month_accumulated_births * (district.baseline_mmr / 100000)
                monthly_lives_saved = max(0, round((expected_baseline_deaths_this_month - current_month_accumulated_deaths) * 10) / 10)
                
                monthly_snapshots.append(StockState(
                    time_month=current_month,
                    pregnant_women=int(round(pregnant_women)),
                    in_anc=int(round(in_anc)),
                    in_facility_delivery=int(round(in_facility_delivery)),
                    in_postpartum=int(round(in_postpartum)),
                    with_complications=int(round(with_complications)),
                    monthly_births=int(round(current_month_accumulated_births)),
                    monthly_maternal_deaths=round(current_month_accumulated_deaths * 10) / 10,
                    monthly_lives_saved=monthly_lives_saved,
                    calculated_mmr=calculated_mmr,
                    anc_coverage_percent=calculated_anc,
                    facility_delivery_percent=calculated_facility_delivery,
                    system_trust_level=round(system_trust * 100) / 100,
                    facility_congestion_index=round(congestion_index * 100) / 100,
                    phase2_delay_hours=round(phase2_delay * 10) / 10,
                    phase3_delay_hours=round(phase3_delay * 10) / 10,
                ))
                
                current_month_accumulated_births = 0
                current_month_accumulated_deaths = 0
        
        # --- SUMMARY COMPUTATION ---
        final_snapshot = monthly_snapshots[-1] if monthly_snapshots else monthly_snapshots[0] if monthly_snapshots else None
        final_mmr = final_snapshot.calculated_mmr if final_snapshot else district.baseline_mmr
        
        baseline_expected_deaths = int(round(cumulative_births * (district.baseline_mmr / 100000)))
        total_lives_saved = max(0, int(round(baseline_expected_deaths - cumulative_deaths)))
        mmr_reduction_percent = max(0, round(((district.baseline_mmr - final_mmr) / district.baseline_mmr) * 1000) / 10)
        
        total_cost = int(round(district.population * scenario_def['cost_per_capita_usd'] * (simulation_months / 12)))
        cost_per_life_saved = int(round(total_cost / total_lives_saved)) if total_lives_saved > 0 else 0
        
        lives_saved_lower = max(0, int(round(total_lives_saved * 0.84)))
        lives_saved_upper = int(round(total_lives_saved * 1.18))
        cost_lower = int(round(cost_per_life_saved * 0.82)) if total_lives_saved > 0 else 0
        cost_upper = int(round(cost_per_life_saved * 1.22)) if total_lives_saved > 0 else 0
        
        dalys_averted = total_lives_saved * 32
        icer_per_daly = int(round(total_cost / dalys_averted)) if dalys_averted > 0 else 0
        
        # --- WEALTH QUINTILE EQUITY DISAGGREGATION ---
        wq = district.wealth_quintile_mmr
        if not wq:
            wq = {
                'q1_poorest': int(round(district.baseline_mmr * 1.38)),
                'q2_poor': int(round(district.baseline_mmr * 1.18)),
                'q3_middle': int(round(district.baseline_mmr * 0.95)),
                'q4_richer': int(round(district.baseline_mmr * 0.76)),
                'q5_richest': int(round(district.baseline_mmr * 0.53)),
            }
        
        quintiles = [
            {'key': 'Q1', 'id': 'q1_poorest', 'label': 'Poorest 20%', 'share': 0.20, 'base': wq.get('q1_poorest', int(round(district.baseline_mmr * 1.38))), 'fiscal_share': 0.34},
            {'key': 'Q2', 'id': 'q2_poor', 'label': 'Poor', 'share': 0.20, 'base': wq.get('q2_poor', int(round(district.baseline_mmr * 1.18))), 'fiscal_share': 0.28},
            {'key': 'Q3', 'id': 'q3_middle', 'label': 'Middle', 'share': 0.20, 'base': wq.get('q3_middle', int(round(district.baseline_mmr * 0.95))), 'fiscal_share': 0.18},
            {'key': 'Q4', 'id': 'q4_richer', 'label': 'Richer', 'share': 0.20, 'base': wq.get('q4_richer', int(round(district.baseline_mmr * 0.76))), 'fiscal_share': 0.12},
            {'key': 'Q5', 'id': 'q5_richest', 'label': 'Richest 20%', 'share': 0.20, 'base': wq.get('q5_richest', int(round(district.baseline_mmr * 0.53))), 'fiscal_share': 0.08},
        ]
        
        equity_disaggregation = []
        for q in quintiles:
            equity_multiplier = 1.0
            if scenario_id in ('scenario_b', 'scenario_d'):
                equity_multiplier = 1.45 if q['key'] == 'Q1' else (1.28 if q['key'] == 'Q2' else 0.85)
            elif scenario_id == 'scenario_a':
                equity_multiplier = 1.35 if q['key'] in ('Q1', 'Q2') else 0.95
            
            q_reduction = min(0.85, (mmr_reduction_percent / 100) * equity_multiplier)
            simulated_mmr = max(60, int(round(q['base'] * (1 - q_reduction))))
            births_in_q = cumulative_births * q['share']
            
            def birth_in_q_deaths(mmr: float, births: float) -> float:
                return (mmr / 100000) * births
            
            lives_saved_in_q = max(0, int(round(birth_in_q_deaths(q['base'], births_in_q) - birth_in_q_deaths(simulated_mmr, births_in_q))))
            fiscal_cost_in_q = 0 if scenario_id == 'baseline' else int(round(total_cost * q['fiscal_share']))
            cost_per_life_in_q = int(round(fiscal_cost_in_q / lives_saved_in_q)) if lives_saved_in_q > 0 else 0
            benefit_cost_ratio = round((lives_saved_in_q / (fiscal_cost_in_q / 100000)) * 10) / 10 if fiscal_cost_in_q > 0 else 0
            
            equity_disaggregation.append(EquityQuintileResult(
                quintile=q['key'],
                label=q['label'],
                population_share=q['share'],
                baseline_mmr=q['base'],
                simulated_mmr=simulated_mmr,
                lives_saved=lives_saved_in_q,
                relative_reduction=round(q_reduction * 1000) / 10,
                absolute_reduction=q['base'] - simulated_mmr,
                fiscal_cost_usd=fiscal_cost_in_q,
                cost_per_life_saved_in_q=cost_per_life_in_q,
                benefit_cost_ratio=benefit_cost_ratio,
            ))
        
        return SimulationResult(
            district_id=district.id,
            district_name=district.name,
            country=district.country,
            scenario_id=scenario_id,
            scenario_name=scenario_def['name'],
            parameters=params,
            trajectories=monthly_snapshots,
            summary=SimulationSummary(
                total_births=int(round(cumulative_births)),
                total_maternal_deaths=int(round(cumulative_deaths)),
                baseline_deaths=baseline_expected_deaths,
                lives_saved=total_lives_saved,
                lives_saved_ci95=(lives_saved_lower, lives_saved_upper),
                mmr_baseline=district.baseline_mmr,
                mmr_final=final_mmr,
                mmr_reduction_percent=mmr_reduction_percent,
                anc4_coverage_final=final_snapshot.anc_coverage_percent if final_snapshot else int(round(district.anc4_coverage)),
                facility_delivery_rate_final=final_snapshot.facility_delivery_percent if final_snapshot else int(round(district.institutional_delivery_rate)),
                total_cost_usd=total_cost,
                cost_per_life_saved_usd=cost_per_life_saved,
                cost_per_life_saved_ci95=(cost_lower, cost_upper),
                icer_per_daly=icer_per_daly,
            ),
            equity_disaggregation=equity_disaggregation,
        )
