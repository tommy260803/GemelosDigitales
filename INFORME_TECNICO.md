# Informe Técnico de Integración — Gemelo Digital de Salud Materna

**Proyecto:** Maternal Health SD Digital Twin (GemelosDigitales)
**Fecha de la bitácora:** 29 de septiembre de 2026
**Estado del sistema:** integración completa, verificada en código y sobre el despliegue Docker en vivo
**Alcance de este documento:** integración de los avances del Equipo 1 (motor y datos) con los avances adicionales del arquitecto (validación estadística real, equidad estratificada DHS, honestidad de la interfaz geoespacial) y el copiloto IA.

---

## 1. Resumen ejecutivo

El gemelo digital opera de extremo a extremo: **datos empíricos versionados → PostgreSQL → motor SD (RK4, Python) → API FastAPI → frontend React (9 vistas) → exportaciones**, con cuatro pilares ya integrados y verificados hoy:

1. **Motor matemático refactorizado** con capacidad clínica empírica (`spa_247`) anclada a las encuestas SPA/SARA, con la suposición de capacidad relativa `r = 0.33` documentada explícitamente.
2. **Capa de datos ampliada**: indicadores SPA por país, referencia absoluta de muertes maternas (OMS/ONU 2020) y acceso vial geoespacial poblacionalmente ponderado (GADM + WorldPop + OSM), todo con trazabilidad en `input_provenance.csv`.
3. **Validación estadística real** (KS, Wilcoxon, Sobol/SALib, Bootstrap, consistencia externa) calculada con datos y simulaciones reales — respuestas HTTP 200 en vivo.
4. **Equidad por quintil de riqueza** calculada con gradientes DHS reales (ponderados `v005`) aplicados a la cobertura distrital, mediante sub-simulaciones pareadas del motor.

**Estado de verificación (29-sep-2026):**

| Verificación | Resultado |
|---|---|
| `python -m pytest backend/tests -q` | **55 passed** |
| `npm run lint` (tsc) + `npm run build` | OK |
| Smoke Streamlit (ES/EN) | OK |
| Docker Compose (postgres, redis, backend, frontend) | 4 contenedores `healthy` |
| `POST /simulation/run` → `equity_disaggregation` | 5 filas DHS |
| `POST /validation/{ks,sobol,bootstrap}`, `GET /validation/external/{id}` | HTTP 200 con estadísticas reales |

---

## 2. Arquitectura integrada

```
DHS .dta / SPA-SARA / WHO-MMEIG / GADM+WorldPop+OSM
        │  scripts/ (ETL con provenance idempotente)
        ▼
data/model_inputs/*.csv  ──►  scripts/load_model_inputs.py  ──►  PostgreSQL/PostGIS
        │                                                          │
        └──► services/model_inputs.py (lectura directa CSV) ◄──────┘
                        │
                        ▼
        services/system_dynamics.py  (RK4, 5 stocks, spa_247)
                        │
        ┌───────────────┼──────────────────────┐
        ▼               ▼                      ▼
  main.py (FastAPI)  validation.py      streamlit_app.py
   /simulation/*      KS·Wilcoxon         dashboard
   /validation/*      Sobol·Bootstrap     (ES/EN)
                      external
                        │
                        ▼
   frontend/src (React 19 + Vite): 9 vistas, i18n ES/EN, exports PDF/Word/Excel
```

---

## 3. Avances del Equipo 1 (Motor y Datos)

### 3.1 Datos clínicos empíricos (SPA/SARA)

- Artefacto: `data/clinical/spa_country_indicators.csv` — **15 filas** (5 países × 3 indicadores): disponibilidad de sangre, disponibilidad de uterotónicos y cobertura de personal 24/7.
- Valores de referencia del personal 24/7: ET 0.85 · GH 0.52 · KE 0.46 · TZ 0.30 · UG 0.55; sangre: 0.05–0.15; uterotónicos: 0.71–0.92.
- Cargados a `health_system_capacity.csv` → `staff_247_availability_rate` distrital (agregado nacional por país), con validación en `services/model_inputs.py`.
- Prueba asociada: `backend/tests/test_hybrid_inputs.py` verifica dominios/formas.

### 3.2 Refactorización del motor matemático (`system_dynamics.py`)

- **Modelo clínico `spa_247` (por defecto):** la disponibilidad efectiva se calcula como `A + (1−A)·r`, donde `A` es la proporción nacional de establecimientos 24/7 (SPA) y **`r = 0.33` (`non247_relative_capacity`)** es la suposición de capacidad relativa de un establecimiento sin cobertura 24/7, documentada como basada en un turno de 8 horas. El modelo legacy sigue siendo selectable (`clinical_capacity_model=legacy`) para comparación de sensibilidad.
- `skilled_staff_ratio` **se conserva** como densidad de personal (staff/10k) que alimenta nominal, congestión y calidad en las ecuaciones; lo que se reemplazó fue su papel como *proxy único* de capacidad: ahora la capacidad base la fija `staff_247_availability_rate`.
- Validación estricta: `spa_247` lanza `ValueError` si faltan `staff_247_availability_rate` o `non247_relative_capacity` (nada de valores por defecto silenciosos).
- **Escenarios:** `SCENARIO_DEFINITIONS` (A–D) declaran ahora `cost_source_type: PARAMETRIC_ASSUMPTION` y `effect_source_type: PARAMETRIC_ASSUMPTION` para cada paquete; el costo fiscal del escenario se calcula `población × cost_per_capita_usd × meses/12` y se etiqueta como supuesto paramétrico, no como costo observado.
- Eliminación de parámetros muertos (sesión del arquitecto): `bed_capacity_ratio`, `severe_pph_fraction`, `pre_eclampsia_fraction`, `sepsis_fraction`, `obstructed_labor_fraction` removidos de `SDParameters` (fracciones globales con efecto constante absorbido por la calibración); `insurance_coverage_rate` **conectado** a la asequibilidad en `_context`.

### 3.3 Validación de muertes (WHO / MMEIG)

- Artefacto: `data/mortality/mmeig_absolute_maternal_deaths.csv` — muertes maternas absolutas ONU/OMS año **2020** por país (p. ej. ET 10.000; KE 5.100; GH 2.700) con su MMR de referencia.
- `scripts/compare_baseline_reference.py` compara el baseline simulado del motor contra esa referencia y escribe `data/results/mmeig_baseline_reference_comparison.csv`.
- **Resultado honesto:** la comparación se clasifica automáticamente como `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED`: las muertes anualizadas simuladas quedan −74.7 % a −95.1 % por debajo de la referencia absoluta 2020, es decir, el motor **no está calibrado a muertes absolutas nacionales** y la diferencia requiere alineación temporal/cobertura antes de citarse como validación. El script no fuerza ningún ajuste para "mejorar" el número.

### 3.4 Procesamiento geoespacial

- **Descargas locales versionadas en `data/geospatial/`:**
  - Fronteras GADM 4.1 (`boundaries/<país>/gadm41_*.shp`);
  - Población WorldPop 2020 UN-adjusted (`*_ppp_2020_UNadj.tif`, 5 rasters);
  - Red vial OSM de Geofabrik (`<país>-260926.osm.pbf`, 5 extractos fechados 2026-09-26).
- **Pipeline ejecutado:** `scripts/prepare_geospatial_inputs.py` → `data/derived/geospatial_access_empirical.csv` (25 territorios): tiempo y distancia vial **poblacionalmente ponderada** desde celdas WorldPop hasta el hospital OSM más accesible, con `coverage_fraction`, población inalcanzable, nodos/aristas del grafo y columnas de fuente.
- Etiquetado de supuestos en los propios datos: `speed_profile_type = PARAMETRIC_ASSUMPTION` (perfiles de velocidad 60/40/20 km/h por clase vial) y `destination_classification = OSM_HOSPITAL_PROXY_NOT_VERIFIED_EMONC`.
- **Carga:** `geographic_access.csv` actualizado (`avg_distance_to_emonc_km`, `avg_travel_time_hours`) y `scripts/load_model_inputs.py` lleva las 31 columnas (incluida `staff_247_availability_rate`) a PostgreSQL; `input_provenance.csv` registra `derivation_method: population-weighted shortest modeled road path` con la nota *"not observed travel time or verified EmONC"*.
- El motor consume estos campos vía `services/model_inputs.py` (archivo `geographic_access.csv`), por lo que el acceso vial empírico-modulado ya influye en Delay 1/2 de la simulación.
- Documentación de método y límites: `scripts/GEOSPATIAL_ACCESS.md` (desajuste temporal OSM 2026 vs WorldPop 2020, omisión de acceso off-road, umbral de snap, etc.).

### 3.5 Infraestructura

- Corregida la codificación de `.dockerignore` (UTF-8 sin BOM; primeros bytes `6E 6F 64 65` = "node") y reconstruidas las imágenes Docker (`backend` y `frontend` se sirven sin volume, por lo que todo cambio de código exige `docker compose up -d --build backend frontend`).
- Commit de referencia del equipo: `772a62a "Refactorización final del motor, integración SPA empírica y scripts geoespaciales"`.

---

## 4. Avances adicionales del arquitecto (integrados en este corte)

### 4.1 P1 — Parámetros muertos y cableado de seguros

Eliminación de los cinco parámetros estructuralmente inertes (§3.2) y conexión real de `insurance_coverage_rate` a la asequibilidad (`fee = ((fee_b·(1−ins_b)) − (fee·(1−ins)))/25`), con `'insurance'` inyectado en el contexto del demanda. Eliminados también de `streamlit_app.py`, `types.ts` y `api.ts`.

### 4.2 P4 — Validación estadística real (`services/validation.py`)

| Prueba | Método real | Resultado en vivo (hoy) |
|---|---|---|
| KS 2 muestras | `scipy.stats.ks_2samp` sobre tasas de parto institucional observadas (modelo DHS por país) vs baseline simulado, 25 vs 25 distritos; crítico `1.36·√((n+m)/(nm))` | D = 0.080, p ≈ 1.000, crítico 0.385 → equivalencia estadística |
| Wilcoxon pareado | `wilcoxon` por distrito sobre las mismas tasas | W = 36, p = 0.00029, diferencia mediana −0.24 pp, n = 25 |
| Sobol | SALib 1.6.0, `calc_second_order=False`, N = 64 (potencia de 2), 8 parámetros con `PARAMETER_RANGES`, Y = vidas salvadas pareadas, seed 42 | 640 corridas; S1 `skilled_staff_ratio` = 0.942, `blood_availability_rate` = 0.034; resto ≈ 0 |
| Bootstrap | Monte Carlo paramétrico uniforme sobre `PARAMETER_RANGES`, percentiles 2.5/97.5, seed 42 | 200 iter: 69.3 vidas salvadas IC95 [56.4, 84.8]; costo/vida $64.371 IC95 [$51.589 – $77.618] (ke-garissa, scenario_d, 12 m) |
| Externa | RMSE / R² de Pearson / MAE entre MMR observado y baseline simulado en los 25 distritos | RMSE 3.17, R² 0.9993, MAE 2.19 |

- Contrato de errores: alcance insuficiente (< 5 distritos) → `ScientificProcedureUnavailable` (410); entradas inválidas → 422; `district_id` ausente en Sobol/Bootstrap → **422 con mensaje explícito** (test `test_validation_requires_district_for_sobol_and_bootstrap`); distrito inexistente → 404.

### 4.3 P3 — Equidad estratificada real (DHS por quintil)

- ETL nuevo `scripts/build_quintile_coverage.py`: gradientes nacionales DHS por quintil de riqueza (`v190`, nacimientos < 60 meses, peso `v005`) para ANC1 (`m14>0`), ANC4+ (`m14≥4`) e institucional (`m15`), aplicados a la cobertura distrital → `data/model_inputs/quintile_coverage_by_district.csv` (**125 filas** = 25 × 5) + `data/derived/dhs_quintile_indicators.csv` + 375 filas idempotentes de provenance.
- Motor: parámetro `equity_inputs` en `SystemDynamicsEngine.simulate` → 5 sub-simulaciones pareadas (variante de `DistrictData` con ANC1/institucional del quintil), costo repartido por `population_share`, `baseline_mmr` desde `wealth_quintiles_mmr` y `benefit_cost_ratio = null` (no hay VSL documentado — se deja vacío en lugar de inventarlo).
- API: `POST /simulation/run` devuelve 5 filas y `equity_status: computed_from_dhs_stratified_coverage…` (en vivo: ke-garissa, shares 22.4/18.0/17.6/20.3/21.7 %).
- UI: `EquityView` null-safe (BCR/costo/vívida muestran "—" cuando es `null`), textos ES/EN describiendo el método real; Streamlit dibuja tabla + gráfico solo cuando existen filas.

### 4.4 P2 — Honestidad de la capa geoespacial del frontend

El terreno 3D y las instalaciones del frontend son **procedurales** (no hay DEM real en el repo). Se etiquetó honestamente: badge `TERRENO SINTÉTICO / SYNTHETIC TERRAIN`, leyenda `RELEVE 3D SINTÉTICO (PROCEDURAL)`, notas visibles de que el relieve es sintético y las instalaciones son plantillas ilustrativas (no capa OSM geocodificada), subtítulo del mapa corregido de "sobre terreno real" a "sobre terreno sintético procedural", y docstrings de `terrainService.ts` corregidos.

### 4.5 Copiloto IA (commit `c9c0674`)

`services/analysis_agent.py` soporta ahora **Groq** además de Gemini: `langchain_groq.ChatGroq` opcional (import con fallback), ids de modelo prefijados (`groq/openai/gpt-oss-120b`), API key desde `GROQ_API_KEY`, seleccionable entre proveedores.

---

## 5. Resultados del motor (referencia)

`data/results/final_simulation_results.csv`: **125 filas** (25 territorios × 5 escenarios) con nacimientos/muertes acumulados, MMR de horizonte, vidas salvadas, retrasos (Delay 1/2/3), congestión y costos. Ejemplo (et-afar, baseline vs scenario_a): MMR 260.8 → 192.2 (−26.3 %), 58.2 vidas salvadas, costo incremental $2.697.000 (supuesto paramétrico), costo por muerte evitada ≈ $46.369.

Las exportaciones (PDF/Word/Excel) y la vista de Validación consumen estos mismos objetos sin transformaciones ocultas.

---

## 6. Trazabilidad y supuestos paramétricos

Todo valor no observado queda etiquetado en el propio dato:

| Categoría | Ejemplos | Dónde queda registrada |
|---|---|---|
| `EMPIRICAL_DHS` / `EMPIRICALLY_ANCHORED` | ANC1/ANC4/institucional/CESáreo anclados al DHS nacional; MMR anclado WHO | `input_provenance.csv`, `data/model_inputs/README.md` |
| `PARAMETRIC_ASSUMPTION` | Costos y efectos de escenarios A–D; `non247_relative_capacity=0.33`; rangos Sobol/Bootstrap; perfiles de velocidad viales | `SCENARIO_DEFINITIONS`, `PARAMETER_RANGES`, columnas del CSV geoespacial |
| `SPA_NATIONAL_PROXY` | `staff_247_availability_rate` (agregado nacional aplicado a 5 territorios) | `build_spa_inputs.py` + README de insumos |
| `PROVENANCE NOT VERIFIED` | Los 5 `.dta` DHS originales (fuera del repo) | `data/model_inputs/README.md` |

---

## 7. Limitaciones conocidas (declaradas, no ocultadas)

1. **Comparación MMEIG:** clasificada `EXPLORATORY…TEMPORAL_ALIGNMENT_REQUIRED`; el motor no reproduce muertes absolutas nacionales 2020 y no se fuerza calibración.
2. **Acceso vial:** tiempos modelados con perfil de velocidad paramétrico y proxy de hospital OSM — no son tiempos de viaje observados ni destinos EmONC verificados; desajuste temporal OSM (2026) vs WorldPop (2020).
3. **Equidad:** sin filas DHS no se calcula nada; `benefit_cost_ratio` siempre `null` (sin VSL documentado).
4. **Terreno 3D e instalaciones del frontend:** sintéticos/procedurales, rotulados como tales en la UI.
5. **No se producen ICER ni DALY;** la UI no los muestra.
6. Dos scripts de acceso vial coexisten (`prepare_geospatial_inputs.py`, ejecutado, y `calculate_geospatial_access.py` documentado en `GEOSPATIAL_ACCESS.md`); el primero es el que actualizó `geographic_access.csv`.
7. `backend/diff_sd.txt` es un artefacto histórico, no código en ejecución.

---

## 8. Reproducibilidad

```bash
# ETLs (orden: insumos híbridos → quintiles; geoespacial → carga)
python scripts/build_final_hybrid_inputs.py
python scripts/build_quintile_coverage.py
python scripts/prepare_geospatial_inputs.py
python scripts/load_model_inputs.py

# Verificación
python -m pytest backend/tests -q        # 55 passed
cd frontend && npm run lint && npm run build

# Despliegue (imágenes sin volume)
docker compose up -d --build backend frontend

# Smoke de API
POST /simulation/run            → equity_disaggregation: 5 filas
POST /validation/ks             → 200 (D, p, Wilcoxon)
POST /validation/sobol          → 200 (district_id requerido)
POST /validation/bootstrap      → 200 (district_id requerido)
GET  /validation/external/{id}  → 200 (RMSE, R², MAE)
```

---

*Documento generado como bitácora científica de integración. Todas las cifras provienen de corridas determinísticas (RK4, seed 42) sobre los insumos versionados del repositorio.*
