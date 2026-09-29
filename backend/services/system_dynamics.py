"""Deterministic five-stock maternal-health system-dynamics engine.

Outputs are simulated outcomes, not empirical observations.  This module uses
real RK4 for continuous stock integration and exposes its flow telemetry.
"""
from dataclasses import dataclass, asdict, replace
from typing import Any, Dict, List, Optional
import math

@dataclass
class DistrictData:
    id:str; name:str; country:str; region:str; population:int; annual_births:int; baseline_mmr:float; anc1_coverage:float; anc4_coverage:float; institutional_delivery_rate:float; c_section_rate:float; avg_distance_to_emonc:float; avg_travel_time_hours:float; skilled_staff_ratio:float; blood_bank_availability:float; essential_drugs_availability:float; insurance_coverage:float; poverty_rate:float; female_secondary_education:float; traditional_birth_attendant_prevalence:float; lat:float; lng:float; osm_health_facilities_count:int; wealth_quintile_mmr:Dict[str,float]
    # The legacy ratio is a density input per 10,000; SPA measures facility coverage.
    staff_247_availability_rate:Optional[float]=None
    # Dataset-backed model inputs; None falls back to the legacy formula/default.
    road_quality_index:Optional[float]=None; transport_cost_usd:Optional[float]=None; facility_delivery_fee_usd:Optional[float]=None; community_trust_baseline:Optional[float]=None; baseline_complication_rate:Optional[float]=None

@dataclass
class SDParameters:
    avg_distance_km:float; travel_time_hours:float; road_quality_index:float; facility_delivery_fee_usd:float; transport_cost_usd:float; insurance_coverage_rate:float; skilled_staff_ratio:float; blood_availability_rate:float; oxytocin_misoprostol_stock_rate:float; maternal_education_rate:float; tba_influence_factor:float; community_trust_baseline:float; baseline_complication_rate:float
    staff_247_availability_rate:Optional[float]=None
    non247_relative_capacity:Optional[float]=.33

@dataclass
class StockState:
    time_month:int; pregnant_women:float; in_anc:float; in_facility_delivery:float; in_postpartum:float; with_complications:float; monthly_births:float; monthly_maternal_deaths:float; monthly_mmr:float; cumulative_births:float; cumulative_maternal_deaths:float; horizon_mmr:float; anc_coverage_percent:float; facility_delivery_percent:float; system_trust_level:float; facility_congestion_index:float; phase2_delay_hours:float; facility_delay_index:float; home_deliveries:float; facility_deliveries:float; complication_risk:float; total_complications:float; referral_probability:float; emergency_referrals:float; unreferred_complications:float; maternal_deaths_home:float; maternal_deaths_transit:float; maternal_deaths_facility:float; quality_factor:float; nominal_capacity:float; affordability_effect:float; travel_access_effect:float; tba_community_effect:float
    effective_capacity:Optional[float]=None; effective_staff_availability:Optional[float]=None
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
    clinical_capacity_model:str='legacy'

@dataclass
class SimulationResult:
    district_id:str; district_name:str; country:str; scenario_id:str; scenario_name:str; parameters:SDParameters; trajectories:List[StockState]; summary:SimulationSummary; equity_disaggregation:List[Any]

# Single executable source of truth.  D is explicitly an expanded combined package.
SCENARIO_DEFINITIONS=[
 {'id':'baseline','letter':'Base','name':'Status quo baseline','description':'No supplementary intervention.','mechanism':'Existing modeled inputs.','cost_per_capita_usd':0.,'parameter_overrides':{},'rules':{}},
 {'id':'scenario_a','letter':'A','name':'Access and transport package','description':'Transport/access intervention.','mechanism':'Reduces modeled travel time by 50%; road and transport rules are retained from the access package.','cost_per_capita_usd':1.45,'cost_source_type':'PARAMETRIC_ASSUMPTION','effect_source_type':'PARAMETRIC_ASSUMPTION','rules':{'travel_time_hours':('at_most_fraction',.50),'road_quality_index':('at_least',.85),'transport_cost_usd':('at_most_fraction',.20)}},
 {'id':'scenario_b','letter':'B','name':'Financial access package','description':'Delivery-fee removal and insurance coverage floor.','mechanism':'Improves modeled affordability.','cost_per_capita_usd':2.80,'cost_source_type':'PARAMETRIC_ASSUMPTION','effect_source_type':'PARAMETRIC_ASSUMPTION','rules':{'facility_delivery_fee_usd':('set',0.),'insurance_coverage_rate':('at_least',.95)}},
 {'id':'scenario_c','letter':'C','name':'Community package','description':'TBA/community trust intervention.','mechanism':'Improves modeled community pathway.','cost_per_capita_usd':.95,'cost_source_type':'PARAMETRIC_ASSUMPTION','effect_source_type':'PARAMETRIC_ASSUMPTION','rules':{'tba_influence_factor':('at_most_fraction',.25),'community_trust_baseline':('at_least',.90)}},
 {'id':'scenario_d','letter':'D','name':'Combined expanded package (A+B+C+clinical capacity)','description':'Combined access, financial, community and clinical-capacity package.','mechanism':'Combines A, B and C with 95% modeled 24/7 staff coverage, blood availability and uterotonic availability.','cost_per_capita_usd':5.20,'cost_source_type':'PARAMETRIC_ASSUMPTION','effect_source_type':'PARAMETRIC_ASSUMPTION','rules':{'travel_time_hours':('at_most_fraction',.50),'road_quality_index':('at_least',.85),'transport_cost_usd':('at_most_fraction',.20),'facility_delivery_fee_usd':('set',0.),'insurance_coverage_rate':('at_least',.95),'tba_influence_factor':('at_most_fraction',.25),'community_trust_baseline':('at_least',.90),'blood_availability_rate':('set',.95),'oxytocin_misoprostol_stock_rate':('set',.95),'staff_247_availability_rate':('set',.95)}}]

DEFAULT_CLINICAL_CAPACITY_MODEL = 'spa_247'
DEFAULT_NON247_RELATIVE_CAPACITY = .33

def _valid(v,lo,hi,name):
    if not math.isfinite(v) or not lo<=v<=hi: raise ValueError(f'{name} must be finite and within [{lo}, {hi}]; got {v}')
    return v

def build_default_parameters(d):
    if d.population<=0 or d.annual_births<=0 or d.baseline_mmr<0: raise ValueError('population and annual_births must be positive; baseline_mmr cannot be negative')
    pct=lambda x,n:_valid(float(x),0,100,n)/100
    road=(_valid(float(d.road_quality_index),0,1,'road_quality_index') if d.road_quality_index is not None
          else max(.2,1-d.avg_distance_to_emonc/80))
    fee=(float(d.facility_delivery_fee_usd) if d.facility_delivery_fee_usd is not None
         else (2.5 if d.insurance_coverage>50 else 18.))
    transport=(float(d.transport_cost_usd) if d.transport_cost_usd is not None
               else max(0.,round(d.avg_distance_to_emonc*.45,1)))
    trust=(_valid(float(d.community_trust_baseline),0,1,'community_trust_baseline') if d.community_trust_baseline is not None
           else .72)
    complication=(_valid(float(d.baseline_complication_rate),0,1,'baseline_complication_rate') if d.baseline_complication_rate is not None
                  else .15)
    return SDParameters(float(d.avg_distance_to_emonc),_valid(float(d.avg_travel_time_hours),0,240,'travel_time_hours'),road,fee,transport,pct(d.insurance_coverage,'insurance'),_valid(float(d.skilled_staff_ratio),0,100,'staff'),pct(d.blood_bank_availability,'blood'),pct(d.essential_drugs_availability,'drugs'),pct(d.female_secondary_education,'education'),pct(d.traditional_birth_attendant_prevalence,'TBA'),trust,complication,d.staff_247_availability_rate,DEFAULT_NON247_RELATIVE_CAPACITY)

class SystemDynamicsEngine:
    DEFAULT_DT_MONTHS=.1
    PROB={'road_quality_index','insurance_coverage_rate','blood_availability_rate','oxytocin_misoprostol_stock_rate','maternal_education_rate','tba_influence_factor','community_trust_baseline','baseline_complication_rate','staff_247_availability_rate','non247_relative_capacity'}
    @staticmethod
    def effective_parameters(d,scenario_id,custom_params=None,clinical_capacity_model='legacy'):
        definition=next((x for x in SCENARIO_DEFINITIONS if x['id']==scenario_id),None)
        if not definition: raise ValueError(f'Unknown scenario_id: {scenario_id}')
        base=build_default_parameters(d); values=asdict(base)
        for k,(mode,target) in definition['rules'].items(): values[k]=target if mode=='set' else (max(values[k],target) if mode=='at_least' else min(values[k],values[k]*target))
        for k,v in (custom_params or {}).items():
            if k not in values: raise ValueError(f'Unknown custom parameter: {k}')
            values[k]=float(v)
        if clinical_capacity_model not in {'legacy','spa_247'}: raise ValueError('Unknown clinical_capacity_model')
        for k,v in values.items():
            if v is not None: _valid(v,0,1,k) if k in SystemDynamicsEngine.PROB else _valid(v,0,10000,k)
        if clinical_capacity_model=='spa_247':
            if values['staff_247_availability_rate'] is None or values['non247_relative_capacity'] is None:
                raise ValueError('spa_247 requires SPA staff coverage and an explicit, documented non247_relative_capacity')
            if values['skilled_staff_ratio']<=0 or values['staff_247_availability_rate']+(1-values['staff_247_availability_rate'])*values['non247_relative_capacity']<=0:
                raise ValueError('spa_247 requires positive modeled staff capacity')
        return SDParameters(**values)
    @staticmethod
    def _clinical_capacity(s,p,births,model):
        load=max(0,s[2])+max(0,s[4])*1.8
        if model=='spa_247':
            availability=p.staff_247_availability_rate+(1-p.staff_247_availability_rate)*p.non247_relative_capacity
            nominal=births*.12*p.skilled_staff_ratio/1.5
            effective=nominal*availability
            if effective<=0: raise ValueError('Effective capacity must be positive')
            congestion=min(2.5,load/effective)
            staffing=min(1,p.skilled_staff_ratio/3)*availability
            quality=max(.25,min(1,staffing*.4+p.blood_availability_rate*.3+p.oxytocin_misoprostol_stock_rate*.3-max(0,congestion-1)*.2))
            delay=max(.2,.30+max(0,(1-p.blood_availability_rate)*2)+max(0,(1-p.oxytocin_misoprostol_stock_rate)*1.8)+(1-availability)*1.5+max(0,congestion-1)*1.2)
        else:
            availability=None
            nominal=max(10,births*.12*p.skilled_staff_ratio/1.5)
            effective=nominal
            congestion=min(2.5,load/effective)
            quality=max(.25,min(1,p.skilled_staff_ratio/3*.4+p.blood_availability_rate*.3+p.oxytocin_misoprostol_stock_rate*.3-max(0,congestion-1)*.2))
            delay=max(.2,.30+max(0,(1-p.blood_availability_rate)*2)+max(0,(1-p.oxytocin_misoprostol_stock_rate)*1.8)+max(0,(1-min(1.2,p.skilled_staff_ratio/2))*1.5)+max(0,congestion-1)*1.2)
        return nominal,effective,congestion,quality,delay,availability
    @staticmethod
    def _context(s,p,b,scenario,clinical_capacity_model='legacy'):
        s1,s2,s3,s4,s5,trust=s
        cap,effective_cap,cong,quality,d3,staff_availability=SystemDynamicsEngine._clinical_capacity(s,p,b['births'],clinical_capacity_model)
        d2=max(.4,p.travel_time_hours*(1.5-.5*p.road_quality_index)+(.6 if p.transport_cost_usd>5 else .05))
        fee=max(0,(b['fee']*(1-b['insurance'])-p.facility_delivery_fee_usd*(1-p.insurance_coverage_rate))/25); travel=max(0,(b['travel']-p.travel_time_hours)/max(1,b['travel'])); tba=max(0,b['tba']-p.tba_influence_factor); qbenefit=max(0,quality-b['quality']); anc=min(.98,max(.15,b['anc']*(1+.15*fee+.12*tba+.10*(trust-.72)))); facility=min(.98,max(.15,b['inst']*(1+.35*fee+.22*travel+.15*tba+.15*qbenefit+.10*(trust-.72)))); referral=min(.94,max(.2,b['referral']+.35*travel+.30*tba+.15*(p.road_quality_index-b['road']))); risk=p.baseline_complication_rate*(1.05-.1*p.maternal_education_rate)
        f12=max(0,s1/3.5)*(anc/max(.1,b['anc'])); f1t=max(0,s1/7.5); f2t=max(0,s2/4.5); deliveries=f1t+f2t; facility_del=deliveries*facility; home_del=deliveries-facility_del; hcomp=home_del*risk; icomp=facility_del*risk; refs=hcomp*referral; unref=hcomp-refs; protocol=.4 if scenario=='scenario_d' else (.15 if scenario=='scenario_c' else (.1 if scenario=='scenario_b' else 0)); home=unref*b['calibration']; transit=refs*(.22+.38*p.travel_time_hours/5)*(1-.5*quality)*b['calibration']; fac=icomp*.12*(1-.7*quality)*(1-protocol)*b['calibration']
        return locals()
    @staticmethod
    def _derivatives(s,p,b,scenario,clinical_capacity_model='legacy'):
        c=SystemDynamicsEngine._context(s,p,b,scenario,clinical_capacity_model); target=max(.35,min(.98,p.community_trust_baseline*(1.15-.2*b['rolling']/max(100,b['input_mmr'])))); return [b['preg']-c['f12']-c['f1t'],c['f12']-c['f2t'],c['facility_del']+c['refs']-max(0,s[2])/.1,(c['home_del']-c['hcomp'])+(max(0,s[2])/.1-c['fac']-c['transit'])-max(0,s[3])/1.4,c['hcomp']-c['refs']-c['unref']/.15,(target-s[5])*.08]
    @staticmethod
    def _rk4(s,dt,p,b,scenario,clinical_capacity_model='legacy'):
        add=lambda x,k,f:[a+f*z for a,z in zip(x,k)]; k1=SystemDynamicsEngine._derivatives(s,p,b,scenario,clinical_capacity_model); k2=SystemDynamicsEngine._derivatives(add(s,k1,dt/2),p,b,scenario,clinical_capacity_model); k3=SystemDynamicsEngine._derivatives(add(s,k2,dt/2),p,b,scenario,clinical_capacity_model); k4=SystemDynamicsEngine._derivatives(add(s,k3,dt),p,b,scenario,clinical_capacity_model); n=[x+dt*(a+2*z+2*q+w)/6 for x,a,z,q,w in zip(s,k1,k2,k3,k4)]; return [max(0,x) for x in n[:5]]+[min(1,max(0,n[5]))]
    @staticmethod
    def _equity(district,scenario_id,equity_inputs,simulation_months,dt,clinical_capacity_model,custom_params=None):
        rows=[]
        for row in equity_inputs:
            variant=replace(district,anc1_coverage=row['anc1_rate']*100,institutional_delivery_rate=row['institutional_delivery_rate']*100)
            base=SystemDynamicsEngine.simulate(variant,'baseline',custom_params,simulation_months,dt,clinical_capacity_model=clinical_capacity_model)
            scen=base if scenario_id=='baseline' else SystemDynamicsEngine.simulate(variant,scenario_id,custom_params,simulation_months,dt,baseline_result=base,clinical_capacity_model=clinical_capacity_model)
            share=float(row['population_share']); da=float(scen.summary.deaths_avoided)
            cost=float(scen.summary.total_cost_usd)*share
            rows.append({
                'quintile':row['quintile'],'label':row.get('label') or row['quintile'],
                'population_share':share,
                'baseline_mmr':(district.wealth_quintile_mmr or {}).get(row['quintile']),
                'simulated_baseline_mmr':float(base.summary.horizon_mmr),
                'simulated_mmr':float(scen.summary.horizon_mmr),
                'lives_saved':da,
                'relative_reduction':float(scen.summary.mortality_reduction_percent),
                'absolute_reduction':float(base.summary.horizon_mmr-scen.summary.horizon_mmr),
                'fiscal_cost_usd':cost,
                'cost_per_life_saved_in_q':(cost/da if da>0 else None),
                'benefit_cost_ratio':None,
                'input_source':row.get('source_file',''),
            })
        return rows
    @staticmethod
    def simulate(district,scenario_id='baseline',custom_params=None,simulation_months=36,dt=None,baseline_result=None,clinical_capacity_model=DEFAULT_CLINICAL_CAPACITY_MODEL,equity_inputs=None):
        if not isinstance(simulation_months,int) or not 1<=simulation_months<=240: raise ValueError('simulation_months must be an integer in [1, 240]')
        dt=SystemDynamicsEngine.DEFAULT_DT_MONTHS if dt is None else _valid(float(dt),.001,1,'dt'); steps=round(simulation_months/dt)
        if not math.isclose(steps*dt,simulation_months,abs_tol=1e-9): raise ValueError('simulation_months must be divisible by dt')
        p=SystemDynamicsEngine.effective_parameters(district,scenario_id,custom_params,clinical_capacity_model)
        bp=SystemDynamicsEngine.effective_parameters(district,'baseline',custom_params,clinical_capacity_model)
        births=district.annual_births/12
        comp=bp.baseline_complication_rate*(1.05-.1*bp.maternal_education_rate)
        # Scenario C changes the initial modeled trust; retain the legacy
        # initialization so adding the SPA mode does not alter legacy runs.
        initial=[births*1.05*7.5,births*1.05*7.5*(district.anc1_coverage/100)*.75,births*(district.institutional_delivery_rate/100)*.1,births*1.4,births*comp*2/30,p.community_trust_baseline]
        quality=(SystemDynamicsEngine._clinical_capacity(initial,bp,births,clinical_capacity_model)[3] if clinical_capacity_model=='spa_247' else min(1,bp.skilled_staff_ratio/3*.4+bp.blood_availability_rate*.3+bp.oxytocin_misoprostol_stock_rate*.3))
        ref=min(.85,max(.2,.7-bp.travel_time_hours/12-bp.tba_influence_factor*.25+bp.road_quality_index*.15))
        risk=((1-district.institutional_delivery_rate/100)*((1-ref)+ref*(.22+.38*bp.travel_time_hours/5)*(1-.5*quality))+(district.institutional_delivery_rate/100)*.12*(1-.7*quality))*comp
        b={'births':births,'preg':births*1.05,'anc':district.anc1_coverage/100,'inst':district.institutional_delivery_rate/100,'travel':bp.travel_time_hours,'fee':bp.facility_delivery_fee_usd,'insurance':bp.insurance_coverage_rate,'tba':bp.tba_influence_factor,'road':bp.road_quality_index,'quality':quality,'referral':ref,'calibration':(district.baseline_mmr/100000)/max(1e-9,risk),'input_mmr':district.baseline_mmr,'rolling':district.baseline_mmr}
        s=initial; traj=[]; cb=cd=mb=md=0.; parts={'home':0.,'transit':0.,'fac':0.}
        for step in range(steps):
            c=SystemDynamicsEngine._context(s,p,b,scenario_id,clinical_capacity_model); s=SystemDynamicsEngine._rk4(s,dt,p,b,scenario_id,clinical_capacity_model); bs=max(0,c['deliveries']*dt); ds={k:max(0,c[k]*dt) for k in ('home','transit','fac')}; deaths=sum(ds.values()); cb+=bs; cd+=deaths; mb+=bs; md+=deaths
            for k in parts: parts[k]+=ds[k]
            if (step+1)%round(1/dt)==0:
                mmr=md/mb*1e5 if mb else 0.; hmmr=cd/cb*1e5 if cb else 0.; b['rolling']=.7*b['rolling']+.3*mmr
                traj.append(StockState(len(traj)+1,*s[:5],mb,md,mmr,cb,cd,hmmr,c['anc']*100,c['facility']*100,s[5],c['cong'],c['d2'],c['d3'],c['home_del'],c['facility_del'],c['risk'],c['hcomp']+c['icomp'],c['referral'],c['refs'],c['unref'],parts['home'],parts['transit'],parts['fac'],c['quality'],c['cap'],c['fee'],c['travel'],c['tba'],c['effective_cap'],c['staff_availability'])); mb=md=0.; parts={'home':0.,'transit':0.,'fac':0.}
        f=traj[-1]
        if scenario_id=='baseline': bd=cd; da=0.; bm=f.horizon_mmr; cost=0.
        else:
            paired=baseline_result or SystemDynamicsEngine.simulate(district,'baseline',custom_params,simulation_months,dt,clinical_capacity_model=clinical_capacity_model)
            if paired.district_id!=district.id or paired.summary.clinical_capacity_model!=clinical_capacity_model or paired.summary.simulation_months!=simulation_months or paired.summary.dt_months!=dt: raise ValueError('Incompatible paired baseline simulation')
            bd=paired.summary.total_maternal_deaths; bm=paired.summary.horizon_mmr; da=bd-cd; cost=district.population*next(x for x in SCENARIO_DEFINITIONS if x['id']==scenario_id)['cost_per_capita_usd']*simulation_months/12
        reduction=(bm-f.horizon_mmr)/bm*100 if bm else 0.; cpda=cost/da if da>0 else None; summary=SimulationSummary(cb,cd,f.horizon_mmr,da,reduction,f.anc_coverage_percent,f.facility_delivery_percent,cost,cost,cpda,'RK4',dt,simulation_months,bd,da,bm,f.horizon_mmr,reduction,f.anc_coverage_percent,cpda,clinical_capacity_model)
        definition=next(x for x in SCENARIO_DEFINITIONS if x['id']==scenario_id)
        equity=SystemDynamicsEngine._equity(district,scenario_id,equity_inputs,simulation_months,dt,clinical_capacity_model,custom_params) if equity_inputs else []
        return SimulationResult(district.id,district.name,district.country,scenario_id,definition['name'],p,traj,summary,equity)
    @staticmethod
    def convergence_check(district,scenario_id='baseline',months=36):
        out={}
        for step in (.1,.05,.025):
            r=SystemDynamicsEngine.simulate(district,scenario_id,simulation_months=months,dt=step); out[str(step)]={'births':r.summary.total_births,'deaths':r.summary.total_maternal_deaths,'horizon_mmr':r.summary.horizon_mmr}
        return out
