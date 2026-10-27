from __future__ import annotations
import csv, json, os, platform, sys
from datetime import datetime, timezone
from pathlib import Path
import numpy as np, pandas as pd, scipy, SALib
from importlib.metadata import version as package_version
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parent/'source_snapshot'; OUT=Path(__file__).resolve().parent
os.chdir(ROOT); sys.path.insert(0,str(ROOT/'backend'))
from services.model_inputs import districts_from_datasets, load_rows, quintile_coverage_by_district
from services.system_dynamics import SystemDynamicsEngine
from services.validation import PARAMETER_RANGES, _PROB_PARAMS, _sample_parameters, _paired_deaths_avoided

def write_csv(path, rows):
    rows=list(rows)
    if not rows: return
    keys=list(dict.fromkeys(k for r in rows for k in r))
    with path.open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=keys); w.writeheader(); w.writerows(rows)

def main():
    started=datetime.now(timezone.utc); districts=districts_from_datasets(); quintiles=quintile_coverage_by_district()
    scenarios=['baseline','scenario_a','scenario_b','scenario_c','scenario_d']; sims=[]; params=[]; traj=[]
    for d in districts:
        base=SystemDynamicsEngine.simulate(d,'baseline',simulation_months=36)
        for sid in scenarios:
            r=base if sid=='baseline' else SystemDynamicsEngine.simulate(d,sid,simulation_months=36,baseline_result=base)
            s=r.summary
            sims.append({'territory_id':d.id,'territory':d.name,'country':d.country,'scenario_id':sid,'months':36,'births':s.total_births,'deaths':s.total_maternal_deaths,'horizon_mmr':s.horizon_mmr,'baseline_deaths':s.baseline_deaths,'baseline_mmr':s.mmr_baseline,'deaths_avoided':s.deaths_avoided,'death_reduction_percent':s.deaths_avoided/s.baseline_deaths*100 if s.baseline_deaths else 0,'mmr_reduction_percent':s.mortality_reduction_percent,'anc_coverage_final':s.anc_coverage_final,'facility_delivery_rate_final':s.facility_delivery_rate_final,'cost_usd':s.total_cost_usd,'clinical_capacity_model':s.clinical_capacity_model})
            for k,v in vars(SystemDynamicsEngine.effective_parameters(d,sid)).items(): params.append({'territory_id':d.id,'scenario_id':sid,'parameter':k,'value':v})
            if sid=='scenario_d':
                for st in r.trajectories: traj.append({'territory_id':d.id,'territory':d.name,'country':d.country,'scenario_id':sid,**vars(st)})
    write_csv(OUT/'results/territory_scenario_results.csv',sims); write_csv(OUT/'results/effective_parameters.csv',params); write_csv(OUT/'results/scenario_d_monthly_trajectories.csv',traj)
    input_rows=load_rows(); param_map={(x['territory_id'],x['scenario_id'],x['parameter']):x['value'] for x in params}
    expanded=[]
    for srow in sims:
        row={'territory_id':srow['territory_id'],'scenario_id':srow['scenario_id']}
        for group,by_id in input_rows.items():
            for key,value in by_id[srow['territory_id']].items(): row[f'{group}.{key}']=value
        for key in sorted({k for _,_,k in param_map}): row[f'effective.{key}']=param_map[(srow['territory_id'],srow['scenario_id'],key)]
        expanded.append(row)
    write_csv(OUT/'results/effective_inputs_by_territory_scenario.csv',expanded)
    df=pd.DataFrame(sims); country=[]; glob=[]
    for (c,sc),g in df.groupby(['country','scenario_id']):
        b=g.births.sum(); d=g.deaths.sum(); bd=g.baseline_deaths.sum(); country.append({'country':c,'scenario_id':sc,'territories':len(g),'births':b,'deaths':d,'horizon_mmr':d/b*1e5,'deaths_avoided':bd-d,'death_reduction_percent':(bd-d)/bd*100 if bd else 0})
    for sc,g in df.groupby('scenario_id',sort=False):
        b=g.births.sum(); d=g.deaths.sum(); bd=g.baseline_deaths.sum(); glob.append({'scenario_id':sc,'territories':len(g),'months':36,'births':b,'deaths':d,'horizon_mmr':d/b*1e5,'deaths_avoided':bd-d,'death_reduction_percent':(bd-d)/bd*100 if bd else 0})
    write_csv(OUT/'results/country_results.csv',country); write_csv(OUT/'results/global_results.csv',glob)
    old_path=Path(__file__).resolve().parents[2]/'data/results/final_global_results.csv'
    if old_path.exists():
        old=pd.read_csv(old_path); new=pd.DataFrame(glob); old['scenario']=old['scenario'].replace({'baseline':'baseline','scenario_a':'scenario_a','scenario_b':'scenario_b','scenario_c':'scenario_c','scenario_d':'scenario_d'})
        cmp=[]
        for _,nr in new.iterrows():
            hit=old[old.scenario==nr.scenario_id]
            if len(hit):
                o=hit.iloc[0]; cmp.append({'scenario_id':nr.scenario_id,'old_births':o.cumulative_births,'new_births':nr.births,'delta_births':nr.births-o.cumulative_births,'old_deaths':o.cumulative_maternal_deaths,'new_deaths':nr.deaths,'delta_deaths':nr.deaths-o.cumulative_maternal_deaths,'old_horizon_mmr':o.horizon_mmr,'new_horizon_mmr':nr.horizon_mmr,'delta_horizon_mmr':nr.horizon_mmr-o.horizon_mmr,'old_deaths_avoided':o.deaths_avoided,'new_deaths_avoided':nr.deaths_avoided,'delta_deaths_avoided':nr.deaths_avoided-o.deaths_avoided,'old_death_reduction_percent':o.mortality_reduction_percent,'new_death_reduction_percent':nr.death_reduction_percent})
        write_csv(OUT/'results/previous_global_csv_comparison.csv',cmp)
    old_territory=Path(__file__).resolve().parents[2]/'data/results/final_simulation_results.csv'
    if old_territory.exists():
        old=pd.read_csv(old_territory); current=pd.DataFrame(sims); old['scenario_id']=old['scenario'].astype(str); old['territory_id']=old['territory_id'].astype(str)
        joined=current.merge(old,on=['territory_id','scenario_id'],suffixes=('_new','_old'))
        write_csv(OUT/'results/previous_territory_csv_comparison.csv',[{'territory_id':r.territory_id,'scenario_id':r.scenario_id,'new_deaths':r.deaths,'old_deaths':r.cumulative_maternal_deaths,'delta_deaths':r.deaths-r.cumulative_maternal_deaths,'new_horizon_mmr':r.horizon_mmr_new,'old_horizon_mmr':r.horizon_mmr_old,'delta_horizon_mmr':r.horizon_mmr_new-r.horizon_mmr_old,'new_deaths_avoided':r.deaths_avoided_new,'old_deaths_avoided':r.deaths_avoided_old,'delta_deaths_avoided':r.deaths_avoided_new-r.deaths_avoided_old} for r in joined.itertuples()])
    gd=next(d for d in districts if 'garissa' in d.name.lower()); gr=SystemDynamicsEngine.simulate(gd,'scenario_d',simulation_months=36,equity_inputs=quintiles[gd.id]); eq=gr.equity_disaggregation
    write_csv(OUT/'results/garissa_equity_d36.csv',eq); q1=next(x for x in eq if x['quintile'].startswith('q1')); q5=next(x for x in eq if x['quintile'].startswith('q5'))
    (OUT/'results/garissa_equity_summary.json').write_text(json.dumps({'territory_id':gd.id,'scenario':'scenario_d','months':36,'q1_simulated_mmr':q1['simulated_mmr'],'q5_simulated_mmr':q5['simulated_mmr'],'signed_gap_q1_minus_q5':q1['simulated_mmr']-q5['simulated_mmr'],'gap_definition':'simulated Q1 MMR minus simulated Q5 MMR; negative means Q1 lower','q1_anchor_mmr':q1['baseline_mmr'],'q5_anchor_mmr':q5['baseline_mmr'],'anchor_source_type':q1['baseline_mmr_source_type']},indent=2),encoding='utf-8')
    from SALib.sample import sobol as ss
    from SALib.analyze import sobol as sa
    names=list(PARAMETER_RANGES); problem={'num_vars':len(names),'names':names,'bounds':[[PARAMETER_RANGES[n]['low'],PARAMETER_RANGES[n]['high']] for n in names]}; matrix=ss.sample(problem,64,calc_second_order=False,seed=42)
    bp=SystemDynamicsEngine.effective_parameters(gd,'baseline'); bvals={n:float(getattr(bp,n)) for n in names}; ys=np.empty(len(matrix)); rows=[]
    for i,row in enumerate(matrix):
        custom={}
        for n,x in zip(names,row):
            sp=PARAMETER_RANGES[n]; v=bvals[n]*x if sp['kind']=='multiplier' else bvals[n]+x
            custom[n]=float(min(1,max(0,v)) if n in _PROB_PARAMS else max(0,v))
        ys[i]=_paired_deaths_avoided(gd,'scenario_d',custom,12)['deaths_avoided']; rows.append({'sample_index':i,'deaths_avoided':ys[i],**custom})
    a=sa.analyze(problem,ys,calc_second_order=False,print_to_console=False,seed=42); write_csv(OUT/'results/garissa_sobol_draws.csv',rows)
    write_csv(OUT/'results/garissa_sobol_indices.csv',[{'parameter':n,'S1':float(a['S1'][i]),'S1_conf':float(a['S1_conf'][i]),'ST':float(a['ST'][i]),'ST_conf':float(a['ST_conf'][i])} for i,n in enumerate(names)])
    (OUT/'results/garissa_sobol_summary.json').write_text(json.dumps({'territory_id':gd.id,'scenario':'scenario_d','months':12,'N':64,'model_runs':len(matrix),'seed':42,'output':'paired deaths avoided','design':'SALib Sobol sequence; calc_second_order=False','estimator':'SALib S1 and ST'},indent=2),encoding='utf-8')
    rng=np.random.default_rng(42); mc=[]
    for i in range(200): mc.append({'iteration':i+1,**(lambda x:{**x,**_paired_deaths_avoided(gd,'scenario_d',x,36)})(_sample_parameters(gd,rng))})
    write_csv(OUT/'results/garissa_monte_carlo_draws.csv',mc); arr=np.array([x['deaths_avoided'] for x in mc]); costs=np.array([x['cost_usd']/x['deaths_avoided'] for x in mc if x['deaths_avoided']>0])
    summary={'territory_id':gd.id,'scenario':'scenario_d','months':36,'iterations':200,'seed':42,'sampling_assumption':'independent uniform parameter draws within ranges, domain clipping','interval_type':'parametric_uncertainty_percentiles','percentile_levels':[2.5,97.5],'interpretation':'central 95% propagated parameter uncertainty; not sampling CI, predictive interval, or independent validation','mean_deaths_avoided':float(arr.mean()),'p2_5_deaths_avoided':float(np.percentile(arr,2.5)),'p97_5_deaths_avoided':float(np.percentile(arr,97.5)),'mean_cost_per_death_avoided':float(costs.mean()),'p2_5_cost_per_death_avoided':float(np.percentile(costs,2.5)),'p97_5_cost_per_death_avoided':float(np.percentile(costs,97.5)),'positive_draws_cost_ratio':int(len(costs)),'parameter_ranges':PARAMETER_RANGES}
    (OUT/'results/garissa_monte_carlo_summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    finished=datetime.now(timezone.utc)
    metadata={'started_utc':started.isoformat(),'finished_utc':finished.isoformat(),'started_lima':started.astimezone(ZoneInfo('America/Lima')).isoformat(),'finished_lima':finished.astimezone(ZoneInfo('America/Lima')).isoformat(),'python':platform.python_version(),'numpy':np.__version__,'pandas':pd.__version__,'scipy':scipy.__version__,'SALib':package_version('SALib'),'source_git_head':'e87c4d2b629b29de1a7039942a4345b4a640ac94','source_branch':'main','working_tree':'modified; see code_changes.diff and source_snapshot_sha256.json','territories':25,'scenarios':scenarios,'months':36,'clinical_capacity_model':'spa_247','database_used':False}
    (OUT/'run_metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
if __name__=='__main__': main()
