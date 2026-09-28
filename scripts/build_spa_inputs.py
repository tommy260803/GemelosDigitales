"""Validate SPA extract and reproduce country-level clinical input anchoring.

The five territories in a country receive the same survey aggregate. This does
not make the result a territory-level observation. No simulation is run here.
"""
from __future__ import annotations

import argparse
import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPA = ROOT / 'data' / 'clinical' / 'spa_country_indicators.csv'
CAPACITY = ROOT / 'data' / 'model_inputs' / 'health_system_capacity.csv'
PROVENANCE = ROOT / 'data' / 'model_inputs' / 'input_provenance.csv'
COUNTRIES = {'et':'Ethiopia','gh':'Ghana','ke':'Kenya','tz':'Tanzania','ug':'Uganda'}
FIELDS = {'Blood availability':'blood_availability',
          'Uterotonic availability':'essential_drugs_availability',
          'Staff 24/7 availability':'staff_247_availability_rate'}
REQUIRED = {'country','indicator','value','unit','survey_year_start','survey_year_end',
            'facility_universe','numerator_definition','denominator_definition',
            'source_document','source_table','source_page','proxy_description'}


def read_spa(path=SPA):
    with path.open(newline='',encoding='utf-8-sig') as handle:
        reader=csv.DictReader(handle)
        if set(reader.fieldnames or [])!=REQUIRED: raise ValueError('SPA extract must contain the 13 documented columns')
        rows=list(reader)
    found={}
    for row in rows:
        key=(row['country'],row['indicator'])
        if row['country'] not in COUNTRIES or row['indicator'] not in FIELDS or key in found:
            raise ValueError(f'Unexpected or duplicate SPA indicator: {key}')
        if any(not row[name].strip() for name in REQUIRED-{'proxy_description'}):
            raise ValueError(f'Incomplete SPA provenance: {key}')
        value=float(row['value'])
        if not math.isfinite(value) or not 0<=value<=1 or row['unit']!='probability':
            raise ValueError(f'Invalid SPA proportion: {key}')
        if int(row['survey_year_start'])>int(row['survey_year_end']):
            raise ValueError(f'Invalid SPA survey years: {key}')
        found[key]=row
    if set(found)!={(country,indicator) for country in COUNTRIES for indicator in FIELDS}:
        raise ValueError('SPA extract requires three indicators in every country')
    return found


def prepare(spa_path=SPA, capacity_path=CAPACITY):
    survey=read_spa(spa_path)
    with capacity_path.open(newline='',encoding='utf-8') as handle:
        reader=csv.DictReader(handle); fieldnames=list(reader.fieldnames or []); rows=list(reader)
    if 'staff_247_availability_rate' not in fieldnames:
        fieldnames.append('staff_247_availability_rate')
    if len(rows)!=25 or len({row['territory_id'] for row in rows})!=25:
        raise ValueError('Expected 25 unique capacity rows')
    for row in rows:
        code=row['territory_id'].split('-',1)[0]
        if code not in COUNTRIES: raise ValueError(f"Unknown country prefix: {row['territory_id']}")
        for indicator,field in FIELDS.items():
            value=float(survey[(code,indicator)]['value'])
            if field!='staff_247_availability_rate' and not math.isclose(float(row[field]),value,abs_tol=1e-12):
                raise ValueError(f"Current {field} differs from SPA extract for {row['territory_id']}; no automatic overwrite")
            row[field]=format(value,'.15g')
    return rows,fieldnames,survey


def build_provenance(capacity_rows,survey,original_path=PROVENANCE):
    with original_path.open(newline='',encoding='utf-8') as handle:
        reader=csv.DictReader(handle); names=list(reader.fieldnames or []); rows=list(reader)
    if not {'territory_id','variable_name','source_type','source_file','derivation_method','original_value','final_value','transformation','notes'} <= set(names):
        raise ValueError('Unexpected provenance schema')
    by_key={(row['territory_id'],row['variable_name']):row for row in rows}
    if len(by_key)!=len(rows): raise ValueError('Duplicate provenance key')
    for district in capacity_rows:
        ident=district['territory_id']; code=ident.split('-',1)[0]
        for indicator,field in FIELDS.items():
            source=survey[(code,indicator)]; key=(ident,field)
            prior=by_key.get(key)
            final=district[field]
            entry={
                'territory_id':ident,'variable_name':field,
                'source_type':'SPA_NATIONAL_PROXY',
                'source_file':'data/clinical/spa_country_indicators.csv',
                'derivation_method':'country aggregate assigned identically to five modeled territories',
                'original_value':prior['original_value'] if prior else '',
                'final_value':final,'transformation':'country lookup, no territorial estimation',
                'notes':f"{source['source_document']}; {source['source_table']}; p.{source['source_page']}; {source['survey_year_start']}-{source['survey_year_end']}; universe: {source['facility_universe']}; denominator: {source['denominator_definition']}; {source['proxy_description']}",
            }
            by_key[key]=entry
    return list(by_key.values()),names


def write_csv(path,rows,fieldnames):
    with path.open('w',newline='',encoding='utf-8') as handle:
        writer=csv.DictWriter(handle,fieldnames=fieldnames)
        writer.writeheader();writer.writerows(rows)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--apply',action='store_true',help='Write validated capacity and provenance CSVs')
    args=parser.parse_args()
    rows,names,survey=prepare()
    provenance,pnames=build_provenance(rows,survey)
    if args.apply:
        write_csv(CAPACITY,rows,names)
        write_csv(PROVENANCE,provenance,pnames)
    print(f"Validated {len(survey)} SPA country indicators and {len(rows)} territories; {'wrote capacity/provenance' if args.apply else 'no files written'}.")


if __name__=='__main__':main()
