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
| staff, blood, drugs, facilities | staff/10k, proportions, count | >=0; proportions [0,1] | CURRENT_MODEL_INPUT | FUTURE_EXTERNAL_DATA | capacity/quality |
| distance, travel, road quality, transport cost | km, hours, proportion, USD-configured | >=0; time >0; road [0,1] | DERIVED_MODEL_PARAMETER/CURRENT_MODEL_INPUT | FUTURE_EXTERNAL_DATA | access/Delay 2 |
| trust, delivery fee, complication rate | proportion, USD-configured, proportion | [0,1], >=0, [0,1] | DERIVED_MODEL_PARAMETER | FUTURE_EXTERNAL_DATA | model equations |

`health_facilities_count=50` preserves the previous backend runtime expression
`50 as osm_health_facilities_count`. It is not an OSM-derived facility count.
`road_quality_index` and `transport_cost_usd` preserve previous deterministic
backend defaults derived from distance. `DEFAULT_SEED=42` is recorded for future
generators; the initialization itself uses no random values.
