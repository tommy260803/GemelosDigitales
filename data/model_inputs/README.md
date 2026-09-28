# Versioned territorial model inputs

These five CSV files are the reproducible input layer for the 25 existing
simulation territories. They were initialized by a one-time migration from the
repository's prior `database/seed.sql`; this migration does **not**
verify external provenance or convert values into observations.

Runtime path: `CSV -> scripts/load_model_inputs.py validation/upsert -> PostgreSQL -> FastAPI -> Python RK4 -> React`.
PostgreSQL is the runtime authority. CSV files are the versioned loading source.

## Final hybrid-input build

`scripts/build_final_hybrid_inputs.py` preserves an immutable local copy of the
Phase-2.1 inputs in `pre_hybrid_phase_2_1/`, processes the five repository DTA
files, and rewrites only compatible maternal-context fields. It writes country
and DHS-region descriptive estimates under `data/derived/` and a complete
territory-variable audit trail in `input_provenance.csv`.

The traceability categories are `EMPIRICAL_DHS`, `EMPIRICALLY_ANCHORED`,
`MODEL_INPUT`, `DERIVED_MODEL_INPUT`, and `SCENARIO_PARAMETER`. The currently
anchored fields are ANC1, ANC4+, institutional delivery, caesarean delivery,
TBA prevalence, female secondary-or-higher education, and insurance where a
valid country DHS estimate exists. The five source files remain
`PROVENANCE NOT VERIFIED` outside the repository.

For each anchored country/indicator the script solves a weighted logit
intercept shift: `final_i = expit(logit(previous_i) + delta)`, choosing
`delta` so the annual-birth- or population-weighted territorial mean equals
the national weighted DHS point estimate. It never treats DHS regions as the
25 model territories.

| Variable group | Unit | Valid range | Current source type | Future expected source | Consumer |
|---|---|---|---|---|---|
| population, annual_births, baseline_mmr | persons, births/year, deaths/100k births | >0 | CURRENT_MODEL_INPUT | FUTURE_EXTERNAL_DATA | engine scaling/calibration |
| ANC, institutional delivery, cesarean, insurance, poverty, education, TBA | proportion | [0,1] | CURRENT_MODEL_INPUT; DHS_DERIVABLE where applicable | DHS_DERIVABLE | model context |
| staff density, 24/7 coverage, blood, uterotonic proxy, facilities | staff/10k, proportions, count | density >=0; proportions [0,1] | MODEL_INPUT / SPA_NATIONAL_PROXY | documented facility and workforce data | capacity/quality |
| distance, travel, road quality, transport cost | km, hours, proportion, USD-configured | >=0; time >0; road [0,1] | DERIVED_MODEL_PARAMETER/CURRENT_MODEL_INPUT | FUTURE_EXTERNAL_DATA | access/Delay 2 |
| trust, delivery fee, complication rate | proportion, USD-configured, proportion | [0,1], >=0, [0,1] | DERIVED_MODEL_PARAMETER | FUTURE_EXTERNAL_DATA | model equations |

`health_facilities_count=50` preserves the previous backend runtime expression
`50 as osm_health_facilities_count`. It is not an OSM-derived facility count.
`road_quality_index` and `transport_cost_usd` preserve previous deterministic
backend defaults derived from distance. `DEFAULT_SEED=42` is recorded for future
generators; the initialization itself uses no random values.

## WHO MMR anchoring

`scripts/anchor_baseline_mmr_from_who.py` reads the local
`data/mortality/MDG_0000000026.csv` and, for the selected common national year
(currently 2023), rescales existing territorial `baseline_mmr` values within
each country. The annual-birth-weighted country mean then equals the WHO
national estimate, while the pre-existing territorial relative pattern is
retained. This makes `baseline_mmr` **EMPIRICALLY_ANCHORED**, not an observed
territory-level WHO value. The country values and uncertainty bounds are stored
in `data/derived/who_mmr_country_indicators.csv`.

`scripts/extract_world_bank_oop.py` extracts the local WDI indicator
`SH.XPD.OOPC.CH.ZS` to `data/derived/world_bank_oop_country_indicators.csv`.
It is contextual financial-burden evidence only: it must not be interpreted as
a delivery fee, ambulance cost, intervention cost, or scenario effect size.

## Clinical SPA inputs and explicit model version

`scripts/build_spa_inputs.py` validates the 15 country-indicator rows in
`data/clinical/spa_country_indicators.csv`. `--apply` reproduces the
`staff_247_availability_rate` column and updates variable-level provenance.
The same national rate is attached to five simulated territories per country;
these are **national facility aggregates**, not measured territorial rates.
`skilled_staff_per_10k` remains a distinct, older model-density input. Uganda's
drug value is an ergometrine proxy, not observed oxytocin availability.

The API defaults to `clinical_capacity_model=spa_247`. The model uses the
explicit planning assumption `non247_relative_capacity=0.33`: an uncovered
facility is modeled as having one third of the effective availability of a
24/7 facility. This is a parametric assumption based on an 8-hour shift, not a
facility-level observation. The legacy formulation remains selectable with
`clinical_capacity_model=legacy` for sensitivity and backwards comparison.
The modeled effective availability is `A + (1-A)*r`, where `A` is the national
SPA 24/7 facility proportion and `r` is the documented assumption for relative
capacity at facilities without verified 24/7 coverage. It scales modeled
capacity and the staffing components of quality and Delay 3. Historical
coefficients in those equations remain assumptions, and the Delay 3 output is
an index rather than observed time. Both model versions remain simulations.
