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
    "capacity": ("health_system_capacity.csv", {"territory_id","skilled_staff_per_10k","staff_247_availability_rate","blood_availability","essential_drugs_availability","health_facilities_count"}),
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
        result.append(DistrictData(
            id=ident,name=d["territory_name"],country=d["country"],region=d["region"],
            population=int(d["population"]),annual_births=int(d["annual_births"]),baseline_mmr=float(d["baseline_mmr"]),
            anc1_coverage=float(c["anc1_rate"])*100,anc4_coverage=float(c["anc4_rate"])*100,
            institutional_delivery_rate=float(c["institutional_delivery_rate"])*100,c_section_rate=float(c["cesarean_rate"])*100,
            avg_distance_to_emonc=float(a["avg_distance_to_emonc_km"]),avg_travel_time_hours=float(a["avg_travel_time_hours"]),
            skilled_staff_ratio=float(h["skilled_staff_per_10k"]),blood_bank_availability=float(h["blood_availability"])*100,
            essential_drugs_availability=float(h["essential_drugs_availability"])*100,insurance_coverage=float(c["insurance_coverage_rate"])*100,
            poverty_rate=float(c["poverty_rate"])*100,female_secondary_education=float(c["female_education_rate"])*100,
            traditional_birth_attendant_prevalence=float(c["tba_prevalence"])*100,lat=float(d["latitude"]),lng=float(d["longitude"]),
            osm_health_facilities_count=int(h["health_facilities_count"]),wealth_quintile_mmr=json.loads(m["wealth_quintiles_mmr"]),
            staff_247_availability_rate=float(h["staff_247_availability_rate"]),
            road_quality_index=float(a["road_quality_index"]),transport_cost_usd=float(a["transport_cost_usd"]),
            facility_delivery_fee_usd=float(m["facility_delivery_fee_usd"]),
            community_trust_baseline=float(m["community_trust_baseline"]),
            baseline_complication_rate=float(m["baseline_complication_rate"]),
        ))
    return result

QUINTILE_FILE = "quintile_coverage_by_district.csv"
QUINTILE_REQUIRED = {"territory_id","quintile","label","population_share","anc1_rate","anc4_rate","institutional_delivery_rate"}

def quintile_coverage_by_district() -> Dict[str,List[Dict[str,float]]]:
    """Stratified quintile coverage rows per district, from the DHS-derived CSV.

    Returns {} when the file is absent so callers can report that equity was
    not computed instead of inventing a stratification.
    """
    path = INPUT_DIR / QUINTILE_FILE
    if not path.exists(): return {}
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f); found = set(reader.fieldnames or [])
        missing = QUINTILE_REQUIRED - found
        if missing: raise ValueError(f"{QUINTILE_FILE}: missing columns {sorted(missing)}")
        rows = list(reader)
    grouped: Dict[str,List[Dict[str,float]]] = {}
    seen = set()
    for r in rows:
        ident, quintile = r["territory_id"], r["quintile"]
        if (ident, quintile) in seen: raise ValueError(f"{QUINTILE_FILE}: duplicate {ident}/{quintile}")
        seen.add((ident, quintile))
        share, anc1, anc4, inst = (float(r[k]) for k in ("population_share","anc1_rate","anc4_rate","institutional_delivery_rate"))
        if not 0 < share <= 1: raise ValueError(f"{QUINTILE_FILE}: population_share outside (0,1] for {ident}/{quintile}")
        for name, value in (("anc1_rate",anc1),("anc4_rate",anc4),("institutional_delivery_rate",inst)):
            if not 0 <= value <= 1: raise ValueError(f"{QUINTILE_FILE}: {name} outside [0,1] for {ident}/{quintile}")
        grouped.setdefault(ident, []).append({
            "quintile": quintile, "label": r["label"], "population_share": share,
            "anc1_rate": anc1, "anc4_rate": anc4, "institutional_delivery_rate": inst,
            "source_file": r.get("source_file",""), "source_type": r.get("source_type",""),
        })
    for ident, items in grouped.items():
        items.sort(key=lambda x: x["quintile"])
        if abs(sum(x["population_share"] for x in items) - 1.0) > 0.05:
            raise ValueError(f"{QUINTILE_FILE}: population shares for {ident} do not sum to ~1")
    return grouped
