"""Validation and reading of versioned territorial model-input datasets."""
from __future__ import annotations
import csv, json
from pathlib import Path
from typing import Dict, List
from services.system_dynamics import DistrictData

ROOT = Path(__file__).resolve().parents[2]
INPUT_DIR = ROOT / "data" / "model_inputs"
FILES = {
    "demographics": ("territorial_demographics.csv", {"territory_id","territory_name","country","region","latitude","longitude","population","annual_births","baseline_mmr"}),
    "context": ("maternal_health_context.csv", {"territory_id","anc1_rate","anc4_rate","institutional_delivery_rate","cesarean_rate","insurance_coverage_rate","poverty_rate","female_education_rate","tba_prevalence"}),
    "capacity": ("health_system_capacity.csv", {"territory_id","skilled_staff_per_10k","blood_availability","essential_drugs_availability","health_facilities_count"}),
    "access": ("geographic_access.csv", {"territory_id","avg_distance_to_emonc_km","avg_travel_time_hours","road_quality_index","transport_cost_usd"}),
    "model": ("model_context.csv", {"territory_id","community_trust_baseline","facility_delivery_fee_usd","baseline_complication_rate","wealth_quintiles_mmr"}),
}
COUNTRIES = {"Ethiopia","Ghana","Kenya","Tanzania","Uganda"}

def _read(name: str) -> List[Dict[str,str]]:
    filename, required = FILES[name]; path=INPUT_DIR/filename
    if not path.exists(): raise FileNotFoundError(path)
    with path.open(newline="",encoding="utf-8") as f:
        reader=csv.DictReader(f); found=set(reader.fieldnames or [])
        missing=required-found
        if missing: raise ValueError(f"{filename}: missing columns {sorted(missing)}")
        rows=list(reader)
    ids=[r["territory_id"] for r in rows]
    if len(ids)!=25: raise ValueError(f"{filename}: expected 25 records, found {len(ids)}")
    if len(set(ids))!=len(ids): raise ValueError(f"{filename}: duplicate territory_id")
    return rows

def load_rows() -> Dict[str,Dict[str,Dict[str,str]]]:
    data={name:{r["territory_id"]:r for r in _read(name)} for name in FILES}
    expected=set(data["demographics"])
    for name,rows in data.items():
        if set(rows)!=expected: raise ValueError(f"{name}: territory IDs do not match demographics")
    for r in data["demographics"].values():
        if r["country"] not in COUNTRIES: raise ValueError(f"invalid country: {r['country']}")
        if float(r["population"])<=0 or float(r["annual_births"])<=0 or float(r["annual_births"])>=float(r["population"]) or float(r["baseline_mmr"])<=0: raise ValueError(f"invalid demographics: {r['territory_id']}")
        if not -90<=float(r["latitude"])<=90 or not -180<=float(r["longitude"])<=180: raise ValueError(f"invalid coordinates: {r['territory_id']}")
    for name in ("context","capacity","access","model"):
        for r in data[name].values():
            for key,value in r.items():
                if key=="territory_id" or key=="wealth_quintiles_mmr": continue
                v=float(value)
                if key.endswith("_rate") or key in {"poverty_rate","tba_prevalence","blood_availability","essential_drugs_availability","road_quality_index","community_trust_baseline","baseline_complication_rate"}:
                    if not 0<=v<=1: raise ValueError(f"{name}.{key} outside [0,1] for {r['territory_id']}")
                elif key in {"avg_distance_to_emonc_km","transport_cost_usd","health_facilities_count","skilled_staff_per_10k"} and v<0: raise ValueError(f"negative {key}")
                elif key=="avg_travel_time_hours" and v<=0: raise ValueError(f"non-positive travel time")
    return data

def districts_from_datasets() -> List[DistrictData]:
    data=load_rows(); result=[]
    for ident,d in data["demographics"].items():
        c,a,m=data["context"][ident],data["access"][ident],data["model"][ident]; h=data["capacity"][ident]
        result.append(DistrictData(ident,d["territory_name"],d["country"],d["region"],int(d["population"]),int(d["annual_births"]),float(d["baseline_mmr"]),float(c["anc1_rate"])*100,float(c["anc4_rate"])*100,float(c["institutional_delivery_rate"])*100,float(c["cesarean_rate"])*100,float(a["avg_distance_to_emonc_km"]),float(a["avg_travel_time_hours"]),float(h["skilled_staff_per_10k"]),float(h["blood_availability"])*100,float(h["essential_drugs_availability"])*100,float(c["insurance_coverage_rate"])*100,float(c["poverty_rate"])*100,float(c["female_education_rate"])*100,float(c["tba_prevalence"])*100,float(d["latitude"]),float(d["longitude"]),int(h["health_facilities_count"]),json.loads(m["wealth_quintiles_mmr"])))
    return result
