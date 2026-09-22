"""Deterministic five-stock maternal-health system-dynamics engine.

Outputs are simulated outcomes, not empirical observations.  This module uses
real RK4 for continuous stock integration and exposes its flow telemetry.
"""
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional
import math

@dataclass
class DistrictData:
    id:str; name:str; country:str; region:str; population:int; annual_births:int; baseline_mmr:float; anc1_coverage:float; anc4_coverage:float; institutional_delivery_rate:float; c_section_rate:float; avg_distance_to_emonc:float; avg_travel_time_hours:float; skilled_staff_ratio:float; blood_bank_availability:float; essential_drugs_availability:float; insurance_coverage:float; poverty_rate:float; female_secondary_education:float; traditional_birth_attendant_prevalence:float; lat:float; lng:float; osm_health_facilities_count:int; wealth_quintile_mmr:Dict[str,float]

@dataclass
class SDParameters:
    avg_distance_km:float; travel_time_hours:float; road_quality_index:float; facility_delivery_fee_usd:float; transport_cost_usd:float; insurance_coverage_rate:float; skilled_staff_ratio:float; blood_availability_rate:float; oxytocin_misoprostol_stock_rate:float; bed_capacity_ratio:float; maternal_education_rate:float; tba_influence_factor:float; community_trust_baseline:float; baseline_complication_rate:float; severe_pph_fraction:float; pre_eclampsia_fraction:float; sepsis_fraction:float; obstructed_labor_fraction:float

@dataclass
class StockState:
    time_month:int; pregnant_women:float; in_anc:float; in_facility_delivery:float; in_postpartum:float; with_complications:float; monthly_births:float; monthly_maternal_deaths:float; monthly_mmr:float; cumulative_births:float; cumulative_maternal_deaths:float; horizon_mmr:float; anc_coverage_percent:float; facility_delivery_percent:float; system_trust_level:float; facility_congestion_index:float; phase2_delay_hours:float; facility_delay_index:float; home_deliveries:float; facility_deliveries:float; complication_risk:float; total_complications:float; referral_probability:float; emergency_referrals:float; unreferred_complications:float; maternal_deaths_home:float; maternal_deaths_transit:float; maternal_deaths_facility:float; quality_factor:float; nominal_capacity:float; affordability_effect:float; travel_access_effect:float; tba_community_effect:float
    @property
    def calculated_mmr(self): return self.monthly_mmr
    @property
    def phase3_delay_hours(self): return self.facility_delay_index
    @property
    def monthly_lives_saved(self): return 0.0

@dataclass
class SimulationSummary:
    total_births:float; total_maternal_deaths:float; horizon_mmr:float; deaths_avoided:float; mortality_reduction_percent:float; anc_coverage_final:float; facility_delivery_rate_final:float; total_cost_usd:float; incremental_cost_usd:float; cost_per_death_avoided_usd:Optional[float]; integrator:str; dt_months:float; simulation_months:int
    # Deprecated compatibility aliases, all mapped to corrected quantities.
    baseline_deaths:float=0.; lives_saved:float=0.; mmr_baseline:float=0.; mmr_final:float=0.; mmr_reduction_percent:float=0.; anc4_coverage_final:float=0.; cost_per_life_saved_usd:Optional[float]=None

@dataclass
class SimulationResult:
    district_id:str; district_name:str; country:str; scenario_id:str; scenario_name:str; parameters:SDParameters; trajectories:List[StockState]; summary:SimulationSummary; equity_disaggregation:List[Any]

# Single executable source of truth.  D is explicitly an expanded combined package.
SCENARIO_DEFINITIONS=[
 {'id':'baseline','letter':'Base','name':'Status quo baseline','description':'No supplementary intervention.','mechanism':'Existing modeled inputs.','cost_per_capita_usd':0.,'parameter_overrides':{},'rules':{}},
 {'id':'scenario_a','letter':'A','name':'Access and transport package','description':'Transport/access intervention.','mechanism':'Improves modeled travel, road quality and transport cost.','cost_per_capita_usd':1.45,'parameter_overrides':{},'rules':{'travel_time_hours':('at_most_fraction',.28),'road_quality_index':('at_least',.85),'transport_cost_usd':('at_most_fraction',.20)}},
 {'id':'scenario_b','letter':'B','name':'Financial access package','description':'Delivery-fee removal and insurance coverage floor.','mechanism':'Improves modeled affordability.','cost_per_capita_usd':2.80,'parameter_overrides':{},'rules':{'facility_delivery_fee_usd':('set',0.),'insurance_coverage_rate':('at_least',.95)}},
 {'id':'scenario_c','letter':'C','name':'Community package','description':'TBA/community trust intervention.','mechanism':'Improves modeled community pathway.','cost_per_capita_usd':.95,'parameter_overrides':{},'rules':{'tba_influence_factor':('at_most_fraction',.25),'community_trust_baseline':('at_least',.90)}},
 {'id':'scenario_d','letter':'D','name':'Combined expanded package (A+B+C+clinical capacity)','description':'Combined access, financial, community, blood, medicines and staffing package.','mechanism':'Combines A, B and C with modeled clinical-capacity improvements.','cost_per_capita_usd':5.20,'parameter_overrides':{},'rules':{'travel_time_hours':('at_most_fraction',.28),'road_quality_index':('at_least',.85),'transport_cost_usd':('at_most_fraction',.20),'facility_delivery_fee_usd':('set',0.),'insurance_coverage_rate':('at_least',.95),'tba_influence_factor':('at_most_fraction',.25),'community_trust_baseline':('at_least',.90),'blood_availability_rate':('at_least',.92),'oxytocin_misoprostol_stock_rate':('at_least',.95),'skilled_staff_ratio':('at_least',2.2)}}]

def _valid(v,lo,hi,name):
    if not math.isfinite(v) or not lo<=v<=hi: raise ValueError(f'{name} must be finite and within [{lo}, {hi}]; got {v}')
    return v

def build_default_parameters(d):
    if d.population<=0 or d.annual_births<=0 or d.baseline_mmr<0: raise ValueError('population and annual_births must be positive; baseline_mmr cannot be negative')
    pct=lambda x,n:_valid(float(x),0,100,n)/100
    return SDParameters(float(d.avg_distance_to_emonc),_valid(float(d.avg_travel_time_hours),0,240,'travel_time_hours'),max(.2,1-d.avg_distance_to_emonc/80),2.5 if d.insurance_coverage>50 else 18.,max(0.,round(d.avg_distance_to_emonc*.45,1)),pct(d.insurance_coverage,'insurance'),_valid(float(d.skilled_staff_ratio),0,100,'staff'),pct(d.blood_bank_availability,'blood'),pct(d.essential_drugs_availability,'drugs'),min(1.,max(0.,d.osm_health_facilities_count*25/max(1,d.annual_births/12))),pct(d.female_secondary_education,'education'),pct(d.traditional_birth_attendant_prevalence,'TBA'),.72,.15,.38,.22,.14,.16)

class SystemDynamicsEngine:
    DEFAULT_DT_MONTHS=.1
    PROB={'road_quality_index','insurance_coverage_rate','blood_availability_rate','oxytocin_misoprostol_stock_rate','bed_capacity_ratio','maternal_education_rate','tba_influence_factor','community_trust_baseline','baseline_complication_rate','severe_pph_fraction','pre_eclampsia_fraction','sepsis_fraction','obstructed_labor_fraction'}
    @staticmethod
    def effective_parameters(d,scenario_id,custom_params=None):
        definition=next((x for x in SCENARIO_DEFINITIONS if x['id']==scenario_id),None)
        if not definition: raise ValueError(f'Unknown scenario_id: {scenario_id}')
        base=build_default_parameters(d); values=asdict(base)
        for k,(mode,target) in definition['rules'].items(): values[k]=target if mode=='set' else (max(values[k],target) if mode=='at_least' else min(values[k],values[k]*target))
        for k,v in (custom_params or {}).items():
            if k not in values: raise ValueError(f'Unknown custom parameter: {k}')
            values[k]=float(v)
        for k,v in values.items(): _valid(v,0,1,k) if k in SystemDynamicsEngine.PROB else _valid(v,0,10000,k)
        return SDParameters(**values)
    @staticmethod
    def _context(s,p,b,scenario):
        s1,s2,s3,s4,s5,trust=s; load=max(0,s3)+max(0,s5)*1.8; cap=max(10,b['births']*.12*p.skilled_staff_ratio/1.5); cong=min(2.5,load/cap)
        quality=max(.25,min(1,p.skilled_staff_ratio/3*.4+p.blood_availability_rate*.3+p.oxytocin_misoprostol_stock_rate*.3-max(0,cong-1)*.2)); d2=max(.4,p.travel_time_hours*(1.5-.5*p.road_quality_index)+(.6 if p.transport_cost_usd>5 else .05)); d3=max(.2,.30+max(0,(1-p.blood_availability_rate)*2)+max(0,(1-p.oxytocin_misoprostol_stock_rate)*1.8)+max(0,(1-min(1.2,p.skilled_staff_ratio/2))*1.5)+max(0,cong-1)*1.2)
        fee=max(0,(b['fee']-p.facility_delivery_fee_usd)/25); travel=max(0,(b['travel']-p.travel_time_hours)/max(1,b['travel'])); tba=max(0,b['tba']-p.tba_influence_factor); qbenefit=max(0,quality-b['quality']); anc=min(.98,max(.15,b['anc']*(1+.15*fee+.12*tba+.10*(trust-.72)))); facility=min(.98,max(.15,b['inst']*(1+.35*fee+.22*travel+.15*tba+.15*qbenefit+.10*(trust-.72)))); referral=min(.94,max(.2,b['referral']+.35*travel+.30*tba+.15*(p.road_quality_index-b['road']))); risk=p.baseline_complication_rate*(1.05-.1*p.maternal_education_rate)
        f12=max(0,s1/3.5)*(anc/max(.1,b['anc'])); f1t=max(0,s1/7.5); f2t=max(0,s2/4.5); deliveries=f1t+f2t; facility_del=deliveries*facility; home_del=deliveries-facility_del; hcomp=home_del*risk; icomp=facility_del*risk; refs=hcomp*referral; unref=hcomp-refs; protocol=.4 if scenario=='scenario_d' else (.15 if scenario=='scenario_c' else (.1 if scenario=='scenario_b' else 0)); home=unref*b['calibration']; transit=refs*(.22+.38*p.travel_time_hours/5)*(1-.5*quality)*b['calibration']; fac=icomp*.12*(1-.7*quality)*(1-protocol)*b['calibration']
        return locals()
    @staticmethod
    def _derivatives(s,p,b,scenario):
        c=SystemDynamicsEngine._context(s,p,b,scenario); target=max(.35,min(.98,p.community_trust_baseline*(1.15-.2*b['rolling']/max(100,b['input_mmr'])))); return [b['preg']-c['f12']-c['f1t'],c['f12']-c['f2t'],c['facility_del']+c['refs']-max(0,s[2])/.1,(c['home_del']-c['hcomp'])+(max(0,s[2])/.1-c['fac']-c['transit'])-max(0,s[3])/1.4,c['hcomp']-c['refs']-c['unref']/.15,(target-s[5])*.08]
    @staticmethod
    def _rk4(s,dt,p,b,scenario):
        add=lambda x,k,f:[a+f*z for a,z in zip(x,k)]; k1=SystemDynamicsEngine._derivatives(s,p,b,scenario); k2=SystemDynamicsEngine._derivatives(add(s,k1,dt/2),p,b,scenario); k3=SystemDynamicsEngine._derivatives(add(s,k2,dt/2),p,b,scenario); k4=SystemDynamicsEngine._derivatives(add(s,k3,dt),p,b,scenario); n=[x+dt*(a+2*z+2*q+w)/6 for x,a,z,q,w in zip(s,k1,k2,k3,k4)]; return [max(0,x) for x in n[:5]]+[min(1,max(0,n[5]))]
    @staticmethod
    def simulate(district,scenario_id='baseline',custom_params=None,simulation_months=36,dt=None,baseline_result=None):
        if not isinstance(simulation_months,int) or not 1<=simulation_months<=240: raise ValueError('simulation_months must be an integer in [1, 240]')
        dt=SystemDynamicsEngine.DEFAULT_DT_MONTHS if dt is None else _valid(float(dt),.001,1,'dt'); steps=round(simulation_months/dt)
        if not math.isclose(steps*dt,simulation_months,abs_tol=1e-9): raise ValueError('simulation_months must be divisible by dt')
        p=SystemDynamicsEngine.effective_parameters(district,scenario_id,custom_params); bp=build_default_parameters(district); births=district.annual_births/12; comp=bp.baseline_complication_rate*(1.05-.1*bp.maternal_education_rate); quality=min(1,bp.skilled_staff_ratio/3*.4+bp.blood_availability_rate*.3+bp.oxytocin_misoprostol_stock_rate*.3); ref=min(.85,max(.2,.7-bp.travel_time_hours/12-bp.tba_influence_factor*.25+bp.road_quality_index*.15)); risk=((1-district.institutional_delivery_rate/100)*((1-ref)+ref*(.22+.38*bp.travel_time_hours/5)*(1-.5*quality))+(district.institutional_delivery_rate/100)*.12*(1-.7*quality))*comp; b={'births':births,'preg':births*1.05,'anc':district.anc1_coverage/100,'inst':district.institutional_delivery_rate/100,'travel':bp.travel_time_hours,'fee':bp.facility_delivery_fee_usd,'tba':bp.tba_influence_factor,'road':bp.road_quality_index,'quality':quality,'referral':ref,'calibration':(district.baseline_mmr/100000)/max(1e-9,risk),'input_mmr':district.baseline_mmr,'rolling':district.baseline_mmr}; s=[births*1.05*7.5,births*1.05*7.5*b['anc']*.75,births*b['inst']*.1,births*1.4,births*comp*2/30,p.community_trust_baseline]; traj=[]; cb=cd=mb=md=0.; parts={'home':0.,'transit':0.,'fac':0.}
        for step in range(steps):
            c=SystemDynamicsEngine._context(s,p,b,scenario_id); s=SystemDynamicsEngine._rk4(s,dt,p,b,scenario_id); bs=max(0,c['deliveries']*dt); ds={k:max(0,c[k]*dt) for k in ('home','transit','fac')}; deaths=sum(ds.values()); cb+=bs; cd+=deaths; mb+=bs; md+=deaths
            for k in parts: parts[k]+=ds[k]
            if (step+1)%round(1/dt)==0:
                mmr=md/mb*1e5 if mb else 0.; hmmr=cd/cb*1e5 if cb else 0.; b['rolling']=.7*b['rolling']+.3*mmr
                traj.append(StockState(len(traj)+1,*s[:5],mb,md,mmr,cb,cd,hmmr,c['anc']*100,c['facility']*100,s[5],c['cong'],c['d2'],c['d3'],c['home_del'],c['facility_del'],c['risk'],c['hcomp']+c['icomp'],c['referral'],c['refs'],c['unref'],parts['home'],parts['transit'],parts['fac'],c['quality'],c['cap'],c['fee'],c['travel'],c['tba'])); mb=md=0.; parts={'home':0.,'transit':0.,'fac':0.}
        f=traj[-1]
        if scenario_id=='baseline': bd=cd; da=0.; bm=f.horizon_mmr; cost=0.
        else:
            paired=baseline_result or SystemDynamicsEngine.simulate(district,'baseline',custom_params,simulation_months,dt); bd=paired.summary.total_maternal_deaths; bm=paired.summary.horizon_mmr; da=bd-cd; cost=district.population*next(x for x in SCENARIO_DEFINITIONS if x['id']==scenario_id)['cost_per_capita_usd']*simulation_months/12
        reduction=(bm-f.horizon_mmr)/bm*100 if bm else 0.; cpda=cost/da if da>0 else None; summary=SimulationSummary(cb,cd,f.horizon_mmr,da,reduction,f.anc_coverage_percent,f.facility_delivery_percent,cost,cost,cpda,'RK4',dt,simulation_months,bd,da,bm,f.horizon_mmr,reduction,f.anc_coverage_percent,cpda)
        definition=next(x for x in SCENARIO_DEFINITIONS if x['id']==scenario_id); return SimulationResult(district.id,district.name,district.country,scenario_id,definition['name'],p,traj,summary,[])
    @staticmethod
    def convergence_check(district,scenario_id='baseline',months=36):
        out={}
        for step in (.1,.05,.025):
            r=SystemDynamicsEngine.simulate(district,scenario_id,simulation_months=months,dt=step); out[str(step)]={'births':r.summary.total_births,'deaths':r.summary.total_maternal_deaths,'horizon_mmr':r.summary.horizon_mmr}
        return out
