---
name: postgis-spatial-analysis
description: >-
  Use this skill when querying spatial datasets, computing geographic transit times,
  evaluating EmONC facility catchments, or processing 3D elevation and DEM data.
---

# PostGIS Spatial & Topographic Analysis Skill

This skill provides operational patterns for evaluating geographic accessibility and obstetric referral networks in Sub-Saharan African districts.

## Standard PostGIS Queries

### 1. Distance to Nearest Comprehensive EmONC
```sql
SELECT 
    d.id AS district_id,
    d.name AS district_name,
    f.name AS nearest_cemonc,
    ST_Distance(d.geom::geography, f.geom::geography) / 1000.0 AS distance_km
FROM health_districts d
CROSS JOIN LATERAL (
    SELECT name, geom
    FROM health_facilities
    WHERE facility_level = 'CEmONC'
    ORDER BY d.geom <-> geom
    LIMIT 1
) f;
```

### 2. Population Catchment within 2 Hours Transit
Using moto-ambulance travel speed models adjusted by topographic slope ($S$) and wet-season barrier friction ($F_{rain}$):

$$v_{effective} = v_{base} \cdot \exp(-0.035 \cdot S) \cdot F_{rain}$$

## Digital Elevation Model (DEM) Guidelines
- When rendering 3D terrain mesh in `Terrain3DCanvas`:
  - Vertical Exaggeration default is $1.8\times$ (adjustable between $1.0\times$ and $3.0\times$).
  - Elevation contour lines spaced every $100$ meters.
  - Highlight geographic barriers (unpaved river crossings, impassable slopes $> 15\%$).
