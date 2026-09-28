# Offline road-access analysis

`calculate_geospatial_access.py` computes a **modeled, population-weighted road-network travel time** from WorldPop raster cells to the fastest reachable **independently verified obstetric destination**. OSM roads and WorldPop population are inputs; travel time is calculated from an explicitly supplied speed profile, not observed journey time. The current OSM extracts are dated 2026-09-26; the raster filenames indicate 2020. Do not treat these years as contemporaneous.

Before running, supply three additional files that are **not in this repository**:

* WGS84 GeoJSON FeatureCollection with 25 nonoverlapping Polygon/MultiPolygon geometries, each carrying `territory_id` and `country` properties matching `territorial_demographics.csv`. A centroid is not a territorial boundary.
* CSV of confirmed destinations with `facility_id,country,latitude,longitude,emonc_verified,verification_source,verification_year`. Only `true`, `1` or `yes` are routed to, and these require a source and year. An OSM `hospital` tag by itself is insufficient to verify EmONC. The repository also provides `scripts/extract_osm_maternity_facilities.py`, which creates explicitly labeled `OSM_HOSPITAL_PROXY` candidates (hospital-only, without requiring `maternity=yes`); these require the opt-in `--allow-osm-maternity-proxy` flag and must not be reported as verified EmONC.
* JSON with `source` and `speeds_kmh` fields; the latter maps OSM `highway` categories to positive speed values in km/h. The source may explicitly state that speeds are scenario assumptions. Roads absent from this profile are excluded.

The supplied `data/geospatial/speed_profile_malaria_atlas_assumption.json` uses
60, 40, and 20 km/h for primary, secondary, and tertiary/unclassified roads.
These are modeled speeds, not observed journey times.

Install dependencies from a locally available package cache or other authorized environment:

```powershell
python -m pip install -r scripts/requirements-geospatial.txt
```

Run, with a documented maximum origin/destination snap distance:

```powershell
python scripts/calculate_geospatial_access.py --boundaries PATH_TO_BOUNDARIES.geojson --facilities PATH_TO_VERIFIED_FACILITIES.csv --speed-profile PATH_TO_SPEEDS.json --max-snap-km YOUR_DOCUMENTED_THRESHOLD --output data/derived/geospatial_access_exploratory.csv
```

The command does **not** update `geographic_access.csv` or PostgreSQL. Inspect `coverage_fraction`, `unreachable_population`, and `unsnapped_population` before considering any model input update. Mean time and distance are conditional on *reachable* population. The route uses the shortest modeled time along OSM highway segments; access time between a cell/facility and its nearest road node is omitted. Country-scale PBFs may require substantial RAM. Validate route topology, speeds, destination eligibility, boundaries, population raster units, and temporal mismatch before citing results. A separate provenance table should record all sources, dates, thresholds, and speed assumptions.
