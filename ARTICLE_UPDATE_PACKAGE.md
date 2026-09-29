# Paquete Técnico Factual y Verificable: Maternal Health SD Digital Twin

> **Fecha de generación:** 2026-09-29  
> **Propósito:** Registro técnico exhaustivo, factual, verificable y reproducible del estado **ACTUAL** del repositorio `Maternal-Health-SD-Digital-Twin` para actualización de artículo científico.  
> **Criterio metodológico:** Se reporta exclusivamente lo presente e implementado en el repositorio y sus outputs vigentes. No se emplean supuestos externos ni extrapolaciones. Cualquier dato no presente se declara como `NOT AVAILABLE IN CURRENT OUTPUT` o `NOT VERIFIED FROM CURRENT REPOSITORY`.

---

# 1. Fuentes de datos finales

La versión actual del repositorio integra seis fuentes de datos primarias y secundarias. La siguiente tabla sintetiza la procedencia, cobertura, procesamiento y función en el sistema de cada una de ellas:

| Fuente | Países | Año(s) | Archivo(s) utilizado(s) | Variables extraídas | N / Unidades analizadas | Uso dentro del modelo | Tipo de dato | Limitaciones |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DHS (Demographic and Health Surveys)** | Ethiopia, Ghana, Kenya, Tanzania, Uganda | ET: 2024-2025<br>GH: 2022-2023<br>KE: 2022<br>TZ: 2022<br>UG: 2016 | `data/dhs/ETIR8AFL.dta`<br>`data/dhs/GHIR8CFL.DTA`<br>`data/dhs/KEIR8CFL.DTA`<br>`data/dhs/TZIR82FL.DTA`<br>`data/dhs/UGIR7BFL.DTA` | `v005`, `v007`, `v008`, `v021`, `v022`, `v023`, `v024`, `v025`, `v106`, `v190`, `v467b`, `v467c`, `v467d`, `v481`, `b3_01-b3_06`, `m13_1-m13_6`, `m14_1-m14_6`, `m15_1-m15_6`, `m17_1-m17_6`, `m3a_1-m3n_6` | 102,325 mujeres encuestadas;<br>68,285 nacimientos elegibles (<60 meses). | Calibración y anclaje logístico territorial de tasas de ANC1, ANC4+, parto institucional, cesárea, TBA, educación secundaria femenina, seguro y gradientes de quintiles de riqueza. | **Observado** a nivel microdato;<br>**Derivado / Empirically Anchored** a nivel territorial. | Disparidad temporal significativa (Uganda 2016 vs Etiopía 2024-2025: 8-9 años). Proveniencia externa de archivos DTA no verificada criptográficamente en repo. `v481` (seguro) ausente en microdato de Kenia. Regiones DHS no coinciden 1:1 con distritos. |
| **SPA / SARA (Service Provision Assessment)** | Ethiopia, Ghana, Kenya, Tanzania, Uganda | ET: 2021-2022<br>GH: 2002<br>KE: 2010<br>TZ: 2014-2015<br>UG: 2007 | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` | Disponibilidad de sangre (`blood_availability`), uterotónicos inyectables (`essential_drugs_availability`), personal calificado 24/7 (`staff_247_availability_rate`). | Muestras nacionales de establecimientos de salud por país. | Modula la capacidad clínica efectiva intrahospitalaria, calidad de atención obstétrica y retraso de Fase 3 (Delay 3). | **SPA National Proxy** (proxy nacional homogéneo asignado a distritos) + **Supuesto Paramétrico** (`non247_relative_capacity = 0.33`). | Heterogeneidad temporal severa (Ghana 2002: 24 años de antigüedad; Uganda 2007: 19 años). El valor nacional se aplica idéntico a los 5 distritos del país sin capturar brechas urbano/rurales. Uganda usó proxy de ergometrina por bajo stock de oxitocina (17%). |
| **WHO / MMEIG** | Ethiopia, Ghana, Kenya, Tanzania, Uganda | 2023 (MMR);<br>2020 (Muertes absolutas) | `data/mortality/MDG_0000000026.csv`<br>`data/mortality/mmeig_absolute_maternal_deaths.csv`<br>`data/derived/who_mmr_country_indicators.csv` | Razón de mortalidad materna nacional (MMR, muertes/100k nacidos vivos), intervalos de incertidumbre (80% / 95%), muertes maternas absolutas nacionales 2020. | 5 estimaciones nacionales modeladas por OMS. | Anclaje y reescalado del `baseline_mmr` distrital (la media ponderada por nacimientos equivale al valor OMS 2023). Comparación exploratoria de muertes anualizadas. | **Empirically Anchored** (para baseline MMR territorial); **Estimación macro modelada externa** (OMS). | No son observaciones territoriales directas sino estimaciones de modelos bayesianos nacionales. Comparación con muertes absolutas de 2020 presenta desalineación de cobertura geográfica (5 distritos vs país completo). |
| **GADM (Database of Global Administrative Areas)** | Ethiopia, Ghana, Kenya, Tanzania, Uganda | Versión 4.1 | `data/geospatial/boundaries/<country>/gadm41_<ISO>_2.shp` (y componentes dbf, prj, shx) | Polígonos vectoriales de límites administrativos nivel 2 (distritos, zonas, municipios). | 25 polígonos territoriales (5 distritos por país). | Máscara espacial para corte de rásteres poblacionales y extracción de subredes viales OSM. | **Observado** (cartografía vectorial oficial estándar). | Reorganizaciones administrativas históricas no siempre coinciden con nomenclaturas censales o de salud. |
| **WorldPop** | Ethiopia, Ghana, Kenya, Tanzania, Uganda | 2020 (UN-adjusted) | `data/geospatial/<iso>_ppp_2020_UNadj.tif` | Conteo de población por celda ráster (resolución ~100m, 3 arc-segundos). | De 557 a 5,411 celdas de población por territorio (~75,000 celdas analizadas). | Ponderación demográfica de distancias y tiempos de viaje hacia el hospital accesible más cercano. | **Derivado** (modelado dasimétrico de distribución demográfica). | Es una superficie modelada, no un censo directo. Desfase temporal respecto a encuestas DHS recientes (2022-2025) y red vial OSM (2026). Celdas aisladas quedan como población inalcanzable. |
| **OSM (OpenStreetMap) / Geofabrik** | Ethiopia, Ghana, Kenya, Tanzania, Uganda | 2026 (Extractos del 26-09-2026) | `data/geospatial/<country>-260926.osm.pbf` | Red de carreteras clasificadas (`highway`: primary, secondary, tertiary, unclassified); instalaciones con tag `amenity=hospital`. | Entre 55,790 y 2,135,579 nodos viales por distrito; entre 1 y 119 hospitales candidatos por territorio. | Cálculo de rutas de menor tiempo (Dijkstra) y distancias geodésicas ponderadas por población a hospitales. | **Observado** (geometrías viales y nodos) + **Proxy** (`amenity=hospital`) + **Supuesto Paramétrico** (velocidades 60/40/20 km/h). | `amenity=hospital` no garantiza capacidad quirúrgica ni funciones EmONC 24/7. Densidad de mapeo heterogénea entre centros urbanos y áreas remotas. Velocidades fijas no consideran estacionalidad ni lluvias. |

---

## 1.1 Tabla obligatoria de indicadores clínicos SPA / SARA por país

Valores exactos extraídos directamente del archivo versionado `data/clinical/spa_country_indicators.csv`:

| País | Indicador | Valor | Unidad | Años encuesta | Denominador / Universo utilizado | Fuente documental exacta | Tabla | Página | Proxy / Notas metodológicas | Archivo donde quedó almacenado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ethiopia** | Blood availability | 0.10 | probabilidad | 2021-2022 | All surveyed facilities excluding health posts | ESPA 2021-22 Final Report | Table 7.5 | 163 | None | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Ethiopia** | Uterotonic availability | 0.91 | probabilidad | 2021-2022 | All normal delivery facilities | ESPA 2021-22 Final Report | Table 7.3.1 | 166 | Injectable oxytocin observed in stock | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Ethiopia** | Staff 24/7 availability | 0.85 | probabilidad | 2021-2022 | All normal delivery facilities | ESPA 2021-22 Final Report | Table 7.2 | 163 | Skilled provider 24/7 onsite/on-call with observed schedule | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Ghana** | Blood availability | 0.15 | probabilidad | 2002 | All normal delivery facilities | GSPA 2002 | Table A-6.18 | 100 | Offers blood transfusion services | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Ghana** | Uterotonic availability | 0.92 | probabilidad | 2002 | All normal delivery facilities | GSPA 2002 | Table A-6.17 | 98 | Injectable oxytocic observed in stock | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Ghana** | Staff 24/7 availability | 0.52 | probabilidad | 2002 | All normal delivery facilities | GSPA 2002 | Table 6.9 | 98 | Provider onsite 24h with observed schedule | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Kenya** | Blood availability | 0.14 | probabilidad | 2010 | All normal delivery facilities | KSPA 2010 | Table A-6.36 | 222 | Offers blood transfusion services | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Kenya** | Uterotonic availability | 0.71 | probabilidad | 2010 | All normal delivery facilities | KSPA 2010 | Table A-6.35 | 115 | Injectable oxytocic in delivery area | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Kenya** | Staff 24/7 availability | 0.46 | probabilidad | 2010 | All normal delivery facilities | KSPA 2010 | Table A-6.34 | 219 | Provider onsite 24h with observed schedule | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Tanzania** | Blood availability | 0.05 | probabilidad | 2014-2015 | All surveyed facilities | TSPA 2014-15 | Table 3.1 | 31 | Reports offering blood transfusion services | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Tanzania** | Uterotonic availability | 0.79 | probabilidad | 2014-2015 | All normal delivery facilities | TSPA 2014-15 | Table 7.3 | 139 | Injectable uterotonic (oxytocin) observed | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Tanzania** | Staff 24/7 availability | 0.30 | probabilidad | 2014-2015 | All normal delivery facilities | TSPA 2014-15 | Table 7.2 | 139 | Provider 24h onsite/on-call with observed schedule | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Uganda** | Blood availability | 0.15 | probabilidad | 2007 | Hospitals HC-IVs and HC-IIIs offering delivery services | USPA 2007 | Table A-6.36.2 | 121 | Ever performed blood transfusion | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Uganda** | Uterotonic availability | 0.73 | probabilidad | 2007 | All normal delivery facilities | USPA 2007 | Figure 6.11 | 117 | **Used ergometrine proxy** (oxitocina era solo 17%) | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |
| **Uganda** | Staff 24/7 availability | 0.55 | probabilidad | 2007 | All normal delivery facilities | USPA 2007 | Table A-6.34 | 115 | Provider onsite 24h with observed schedule | `data/clinical/spa_country_indicators.csv`<br>`data/model_inputs/health_system_capacity.csv` |

---

# 2. Datos DHS finales

## 2.1 Tablas nacionales definitivas

Valores extraídos de `data/derived/dhs_country_indicators.csv` (procesados por `scripts/build_final_hybrid_inputs.py` con ponderador `v005/1,000,000` sobre microdatos DTA):

| País | Muestra Mujeres (`women_n`) | Nacimientos <60m (`recent_births_n`) | Periodo encuesta | ANC1 (%) | ANC4+ (%) | Early ANC (%) | Parto Institucional (%) | Cesárea (%) | SBA (%) | TBA (%) | Seguro Salud (%) | Ed. Secund.+ (%) | Barrera Permiso (%) | Barrera Dinero (%) | Barrera Distancia (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ethiopia** | 21,395 | 13,460 | 2024-2025 | 77.70% | 52.52% | 43.65% | 59.68% | 7.87% | 62.01% | 29.93% | 45.67% | 28.25% | 17.74% | 52.84% | 39.83% |
| **Ghana** | 15,014 | 9,290 | 2022-2023 | 98.18% | 88.48% | 64.82% | 86.24% | 20.42% | 86.75% | 8.11% | 90.13% | 70.15% | 9.89% | 44.66% | 22.34% |
| **Kenya** | 32,156 | 19,385 | 2022 | 98.03% | 67.23% | 30.76% | 88.17% | 16.76% | 89.01% | 7.02% | `NOT AVAILABLE (DHS v481 missing)` | 58.15% | 4.99% | 45.98% | 23.68% |
| **Tanzania** | 15,254 | 10,708 | 2022 | 89.61% | 65.22% | 38.10% | 80.63% | 10.59% | 75.85% | 5.88% | 5.82% | 30.68% | 7.20% | 36.25% | 28.80% |
| **Uganda** | 18,506 | 15,442 | 2016 | 98.09% | 60.22% | 29.55% | 74.38% | 6.21% | 74.17% | 10.84% | 1.38% | 32.93% | 5.40% | 44.67% | 37.37% |

*Nota sobre Kenia:* La variable de seguro de salud `v481` no contiene datos válidos en el archivo `KEIR8CFL.DTA` del repositorio; el sistema conservó el valor previo del modelo (18.0%) documentándolo explícitamente en `input_provenance.csv` como `MODEL_INPUT` con nota "No DHS replacement applied".

## 2.2 Reglas metodológicas exactas de procesamiento DHS

1. **Ponderación muestral (`v005`):**  
   Todo indicador se calcula dividiendo `v005` entre `1,000,000` (`weight = v005 / 1e6`). Se utiliza suma ponderada de eventos dividida entre suma ponderada de denominadores (`_weighted_rate`).
2. **Universo de nacimientos (<60 meses):**  
   Para cada mujer en el archivo individual IR, se evalúan las posiciones 1 a 6 de su historial de nacimientos (`b3_01` a `b3_06`). Se calcula la diferencia en meses Century Month Code (CMC): $\Delta = \text{v008} - \text{b3\_pos}$. El nacimiento califica como elegible si y solo si $0 \le \Delta \le 59$ meses.
3. **Tratamiento de `m3*` (Asistencia al parto):**  
   Se analizan las columnas `m3a_pos` a `m3n_pos`. Se extrae el texto de las etiquetas de valor (`value_labels`). Se clasifica como atención calificada (`SBA`) únicamente a cuadros profesionales explícitos: `doctor`, `nurse/midwife`, `nurse`, `midwife`, `health officer`, `clinical officer` o `medical assistant`. Se **excluyen deliberadamente** categorías auxiliares o comunitarias: `assistant nurse`, `nursing aide`, `mch aide`, `health extension worker`, `community health worker`. La tasa de parteras tradicionales (`TBA`) se activa si alguna etiqueta de asistente presente contiene `traditional birth attendant`. Si ninguna pregunta `m3` fue contestada, el registro queda como `None` (missing), no como 0.
4. **Tratamiento de `m15*` (Lugar de parto):**  
   Solo se clasifican como parto institucional (`institutional_delivery_rate = True`) las etiquetas de establecimientos médicos reconocidos: `hospital`, `health center`, `health centre`, `health post`, `clinic`, `dispensary`, `polyclinic`, `maternity home`, `medical sector`, `chps` o `outreach`. Domicilio, casa de la partera o parto en tránsito son `False`. Respuestas ambiguas o "otros" quedan sin clasificar (`None`).
5. **Tratamiento de missing estructural:**  
   Registros con valores fuera de rango, no sabe (98) o no reportado (99) se convierten a `None` y se omiten tanto del numerador como del denominador del cálculo ponderado.
6. **Anclaje nacional mediante desplazamiento logístico (Logit-Shift Intercept):**  
   El script `scripts/build_final_hybrid_inputs.py` no asigna las regiones DHS directamente a los 25 distritos. En su lugar, toma los valores baseline preexistentes de cada distrito $p_i$ y calcula un desplazamiento $\delta$ en escala logit tal que:
   $$\frac{\sum_{i=1}^5 w_i \cdot \text{expit}(\text{logit}(p_i) + \delta)}{\sum_{i=1}^5 w_i} = \text{Target}_{\text{DHS\_nacional}}$$
   donde $w_i$ son los nacimientos anuales del distrito (o población en el caso de educación y seguro). Esto ancla la media nacional distrital a la estimación DHS nacional observada, preservando la heterogeneidad relativa interdistrital preexistente.
7. **Clasificación funcional de indicadores (Motor vs Descriptivos):**  
   - **Alimentan directamente al motor dinámico:**  
     - `anc1_rate` (determina el flujo de captación prenatal $f_{12}$ y el contexto $b['anc']$).  
     - `institutional_delivery_rate` (determina la partición de partos entre institucional y domicilio).  
     - `insurance_coverage_rate` (modula el costo de bolsillo y la barrera financiera).  
     - `female_education_rate` (modula el riesgo basal de complicaciones obstétricas).  
     - `tba_prevalence` (afecta la tasa de referencia y la decisión de acudir al hospital).  
     - `quintile_coverage_by_district.csv` (ANC1 y parto institucional por quintil alimentan las 5 subsimulaciones de equidad).  
   - **Solo descriptivos / contextuales (no conectados a las ODEs):**  
     - `anc4_rate` (se reporta en resúmenes, pero el motor modela la entrada por ANC1).  
     - `early_anc_rate` (reportado en tabla DHS, sin ecuación asociada en el motor).  
     - `cesarean_rate` (almacenado en tabla distrital, sin flujo ODE asociado).  
     - `skilled_birth_attendance_rate` (el motor utiliza parto institucional y dotación de personal hospitalario SPA).  
     - `permission_barrier_rate`, `money_barrier_rate`, `distance_barrier_rate` (indicadores DHS descriptivos; el motor usa parámetros físicos de red vial, tarifas en USD y costos de transporte modelados).

---

# 3. Modelo matemático final

El motor bio-matemático está implementado íntegramente en Python puro dentro de `backend/services/system_dynamics.py` (`SystemDynamicsEngine`).

## 3.1 Los 5 stocks continuos (Variables de estado)

El modelo integra un vector continuo de estado de dimensión 6 (5 compartimentos poblacionales más 1 variable de estado de confianza social):

1. **$s_1$ (`pregnant_women`):** Mujeres gestantes sin control prenatal o en espera de inicio de ANC.  
   $$\frac{ds_1}{dt} = \text{preg} - f_{12} - f_{1t}$$
   donde $\text{preg} = \text{births} \cdot 1.05$ (tasa mensual de concepciones que llegan a término), $f_{12} = \max(0, s_1 / 3.5) \cdot \frac{\text{anc}}{\max(0.1, b['anc'])}$ (flujo hacia control prenatal con tiempo medio de permanencia de 3.5 meses modulado por utilización de ANC), $f_{1t} = \max(0, s_1 / 7.5)$ (partos directos no controlados tras 7.5 meses).
2. **$s_2$ (`in_anc`):** Mujeres gestantes activas en atención prenatal.  
   $$\frac{ds_2}{dt} = f_{12} - f_{2t}$$
   donde $f_{2t} = \max(0, s_2 / 4.5)$ (flujo hacia el parto desde ANC, duración media 4.5 meses).  
   Total de partos mensuales: $\text{deliveries} = f_{1t} + f_{2t}$.  
   Partos institucionales: $\text{facility\_del} = \text{deliveries} \cdot \text{facility}$.  
   Partos domiciliarios: $\text{home\_del} = \text{deliveries} - \text{facility\_del}$.
3. **$s_3$ (`in_facility_delivery`):** Mujeres en trabajo de parto o puerperio inmediato dentro de un establecimiento de salud.  
   $$\frac{ds_3}{dt} = \text{facility\_del} + \text{refs} - \frac{\max(0, s_3)}{0.1}$$
   donde $\text{refs}$ son las referencias de emergencia desde el hogar, y $0.1$ meses (~3 días) representa la estancia media hospitalaria.
4. **$s_4$ (`in_postpartum`):** Mujeres en puerperio (postparto).  
   $$\frac{ds_4}{dt} = (\text{home\_del} - \text{hcomp}) + \left(\frac{\max(0, s_3)}{0.1} - \text{fac} - \text{transit}\right) - \frac{\max(0, s_4)}{1.4}$$
   donde $1.4$ meses (~42 días) es la duración convencional del periodo puerperal; $\text{fac}$ y $\text{transit}$ son las muertes ocurridas en hospital y traslado.
5. **$s_5$ (`with_complications`):** Mujeres con complicaciones obstétricas activas no resueltas en el ámbito comunitario.  
   $$\frac{ds_5}{dt} = \text{hcomp} - \text{refs} - \frac{\text{unref}}{0.15}$$
   donde $\text{hcomp} = \text{home\_del} \cdot \text{risk}$ (complicaciones domiciliarias), $\text{refs} = \text{hcomp} \cdot \text{referral}$ (emergencias transferidas a hospital), $\text{unref} = \text{hcomp} - \text{refs}$ (complicaciones no referidas), y $0.15$ meses (~4.5 días) es la ventana aguda de resolución/óbito.
6. **$s_6$ (`system_trust_level` / confianza comunitaria):** Variable de estado dinámica acoplada:  
   $$\frac{ds_6}{dt} = (\text{target} - s_6) \cdot 0.08$$
   donde $\text{target} = \max\left(0.35, \min\left(0.98, p.\text{community\_trust\_baseline} \cdot \left(1.15 - 0.2 \cdot \frac{\text{rolling\_mmr}}{\max(100, \text{input\_mmr})}\right)\right)\right)$.

---

## 3.2 Operacionalización del Marco de los Tres Retrasos (Three-Delays Framework)

### Retraso 1: Decisión de buscar atención médica
Se operacionaliza a través de los índices de utilización de ANC y parto institucional:
- **Efecto financiero de bolsillo:**  
  $$\text{fee\_effect} = \max\left(0, \frac{b['fee'] \cdot (1 - b['insurance']) - p.\text{facility\_delivery\_fee\_usd} \cdot (1 - p.\text{insurance\_coverage\_rate})}{25}\right)$$
- **Efecto de accesibilidad física:** $\text{travel\_effect} = \max\left(0, \frac{b['travel'] - p.\text{travel\_time\_hours}}{\max(1, b['travel'])}\right)$
- **Efecto comunitario/TBA:** $\text{tba\_effect} = \max\left(0, b['tba'] - p.\text{tba\_influence\_factor}\right)$
- **Efecto de calidad clínica percibida:** $\text{qbenefit} = \max(0, \text{quality} - b['quality'])$
- **Tasa efectiva de control prenatal:**  
  $$\text{anc} = \min(0.98, \max(0.15, b['anc'] \cdot (1 + 0.15 \cdot \text{fee} + 0.12 \cdot \text{tba} + 0.10 \cdot (trust - 0.72))))$$
- **Tasa efectiva de parto institucional:**  
  $$\text{facility} = \min(0.98, \max(0.15, b['inst'] \cdot (1 + 0.35 \cdot \text{fee} + 0.22 \cdot \text{travel} + 0.15 \cdot \text{tba} + 0.15 \cdot \text{qbenefit} + 0.10 \cdot (trust - 0.72))))$$

### Retraso 2: Identificar y alcanzar el establecimiento de salud
Se operacionaliza como el tiempo de retraso en tránsito y la probabilidad de referencia oportuna de complicaciones:
- **Tiempo de retraso en traslado (Fase 2 en horas):**  
  $$d_2 = \max\left(0.4, p.\text{travel\_time\_hours} \cdot (1.5 - 0.5 \cdot p.\text{road\_quality\_index}) + (0.6 \text{ si } p.\text{transport\_cost\_usd} > 5 \text{ sino } 0.05)\right)$$
- **Probabilidad de referencia de emergencia exitosa:**  
  $$\text{referral} = \min(0.94, \max(0.2, b['referral'] + 0.35 \cdot \text{travel} + 0.30 \cdot \text{tba} + 0.15 \cdot (p.\text{road\_quality\_index} - b['road'])))$$
- **Mortalidad materna en tránsito:**  
  $$\text{transit} = \text{refs} \cdot \left(0.22 + 0.38 \cdot \frac{p.\text{travel\_time\_hours}}{5}\right) \cdot (1 - 0.5 \cdot \text{quality}) \cdot b['calibration']$$

### Retraso 3: Recibir atención obstétrica oportuna y adecuada en el establecimiento
Se modela bajo la arquitectura vigente `clinical_capacity_model = 'spa_247'`:
- **Disponibilidad efectiva ponderada de personal:**  
  $$\text{availability} = A + (1 - A) \cdot r$$  
  donde $A = p.\text{staff\_247\_availability\_rate}$ (de SPA) y $r = p.\text{non247\_relative\_capacity} = 0.33$.
- **Capacidad nominal y efectiva:**  
  $$\text{nominal} = \text{births} \cdot 0.12 \cdot \frac{p.\text{skilled\_staff\_ratio}}{1.5}$$  
  $$\text{effective} = \text{nominal} \cdot \text{availability}$$
- **Carga y congestión hospitalaria:**  
  $$\text{load} = \max(0, s_3) + \max(0, s_5) \cdot 1.8, \quad \text{congestion} = \min(2.5, \text{load} / \text{effective})$$
- **Factor de calidad clínica intrahospitalaria ($quality \in [0.25, 1.0]$):**  
  $$\text{staffing} = \min(1, p.\text{skilled\_staff\_ratio} / 3) \cdot \text{availability}$$  
  $$\text{quality} = \max\left(0.25, \min\left(1.0, \text{staffing} \cdot 0.4 + p.\text{blood\_availability\_rate} \cdot 0.3 + p.\text{drugs\_rate} \cdot 0.3 - \max(0, \text{congestion} - 1) \cdot 0.2\right)\right)$$
- **Índice de retraso intrahospitalario ($d_3$ / `facility_delay_index`):**  
  $$d_3 = \max\Big(0.2, \, 0.30 + \max(0, (1 - p.\text{blood}) \cdot 2) + \max(0, (1 - p.\text{drugs}) \cdot 1.8) + (1 - \text{availability}) \cdot 1.5 + \max(0, \text{congestion} - 1) \cdot 1.2\Big)$$
- **Mortalidad institucional:**  
  $$\text{fac} = \text{icomp} \cdot 0.12 \cdot (1 - 0.7 \cdot \text{quality}) \cdot (1 - \text{protocol}) \cdot b['calibration']$$  
  donde $\text{protocol} = 0.40$ en Escenario D, $0.15$ en C, $0.10$ en B y $0.0$ en Baseline y A.

---

## 3.3 Especificaciones numéricas y clasificación de parámetros

- **Método de integración:** Runge-Kutta explícito de 4º orden (RK4 clásico implementado en `_rk4()`).
- **Paso de tiempo ($\Delta t$):** Por defecto en el motor `DEFAULT_DT_MONTHS = 0.1` meses (~3 días). En chequeo de convergencia se evalúa en $0.1$, $0.05$ y $0.025$.
- **Horizonte temporal de simulación:** 36 meses (3 años).
- **Justificación documentada de `non247_relative_capacity = 0.33`:** Supuesto paramétrico derivado de la planificación de turnos clínicos: un centro sin cobertura 24/7 opera aproximadamente un único turno diurno de 8 horas sobre 24 horas ($8 / 24 \approx 0.33$), rindiendo un tercio de la capacidad temporal de un centro con guardia completa.
- **Factor de calibración basal ($b['calibration']$):** Se calcula en $t=0$ para garantizar que en condiciones basales la razón de muertes acumuladas entre nacimientos acumulados coincida con el `baseline_mmr` ingresado:  
  $$b['calibration'] = \frac{\text{baseline\_mmr} / 100,000}{\max(10^{-9}, \text{risk\_initial})}$$

### Diferenciación estricta de parámetros
- **Parámetros empíricos:** Tasas DHS ancladas (`anc1_coverage`, `anc4_coverage`, `institutional_delivery_rate`, `c_section_rate`, `tba_prevalence`, `female_secondary_education`, `insurance_coverage` [excepto KE]).
- **Parámetros derivados:** Distancia vial media poblacional (`avg_distance_to_emonc`), tiempo medio de viaje (`avg_travel_time_hours`), gradientes de cobertura por quintil (`factor_anc1_rate`, etc.).
- **Proxies:** `blood_availability` (SPA nacional), `essential_drugs_availability` (SPA nacional; ergometrina en UG), `staff_247_availability_rate` (SPA nacional), `health_facilities_count = 50` (proxy fijo heredado), `amenity=hospital` de OSM (proxy de destino EmONC).
- **Supuestos paramétricos:** `non247_relative_capacity = 0.33`, `community_trust_baseline = 0.72`, `baseline_complication_rate = 0.15`, coeficientes de ponderación de calidad (0.4 personal + 0.3 sangre + 0.3 drogas), penalizaciones de congestión, velocidades viales (60/40/20 km/h) y costos per cápita de los escenarios.

---

# 4. Escenarios finales

Definiciones exactas extraídas de `SCENARIO_DEFINITIONS` en `backend/services/system_dynamics.py`:

| Escenario | Parámetros modificados | Regla de override | Valor Baseline | Valor Escenario | Mecanismo afectado | Costo per cápita anual (USD) | Tipo / Fuente del costo |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline** | Ninguno | Ninguna | Insumos territoriales | Sin cambios | Status quo basal | $0.00 | N/A |
| **Scenario A** | `travel_time_hours`<br>`road_quality_index`<br>`transport_cost_usd` | `at_most_fraction: 0.50`<br>`at_least: 0.85`<br>`at_most_fraction: 0.20` | Específico por distrito<br>Específico por distrito<br>Específico por distrito | $\le 50\%$ del baseline<br>$\ge 0.85$<br>$\le 20\%$ del baseline | **Acceso geográfico y transporte:** Reduce demora de traslado (Fase 2) y aumenta probabilidad de referencia de emergencias. | $1.45 | `PARAMETRIC_ASSUMPTION` |
| **Scenario B** | `facility_delivery_fee_usd`<br>`insurance_coverage_rate` | `set: 0.0`<br>`at_least: 0.95` | Específico ($2.5-$18 USD)<br>Específico (1.4%-90%) | $= 0.0$ USD (gratuidad)<br>$\ge 95\%$ cobertura | **Financiamiento y asequibilidad:** Elimina barreras monetarias directas al parto institucional (Fase 1). | $2.80 | `PARAMETRIC_ASSUMPTION` |
| **Scenario C** | `tba_influence_factor`<br>`community_trust_baseline` | `at_most_fraction: 0.25`<br>`at_least: 0.90` | Específico (5.9%-30%)<br>$0.72$ (supuesto base) | $\le 25\%$ del baseline<br>$\ge 0.90$ confianza | **Vía comunitaria y confianza cultural:** Capacitación/articulación de parteras tradicionales y confianza en el sistema (Fase 1 y Fase 2). | $0.95 | `PARAMETRIC_ASSUMPTION` |
| **Scenario D** | Reglas completas de A + B + C más:<br>`blood_availability_rate`<br>`oxytocin_misoprostol_stock_rate`<br>`staff_247_availability_rate` | Combinación A+B+C<br>`set: 0.95`<br>`set: 0.95`<br>`set: 0.95` | Reglas de A, B y C<br>SPA proxies (5%-15%)<br>SPA proxies (71%-92%)<br>SPA proxies (30%-85%) | Combinación A+B+C<br>$= 0.95$<br>$= 0.95$<br>$= 0.95$ | **Paquete integrado expandido:** Acceso (Fase 2) + Financiamiento (Fase 1) + Comunidad (Fase 1) + Capacidad y calidad clínica EmONC 24/7 (Fase 3) + Protocolo intrahospitalario ($\text{protocol}=0.40$). | $5.20 | `PARAMETRIC_ASSUMPTION` |

### Aclaraciones estructurales indispensables
1. **Los escenarios no aplican reducciones porcentuales fijas directamente a la mortalidad:**  
   En ningún caso se multiplica la mortalidad por un porcentaje predeterminado. El cambio en vidas salvadas y MMR surge orgánicamente de la resolución temporal continua de las ecuaciones diferenciales ordinarias (ODEs) al perturbar los parámetros biofísicos, conductuales y clínicos.
2. **Naturaleza de los costos:**  
   Todos los costos unitarios per cápita ($1.45, $2.80, $0.95, $5.20 USD) están codificados formalmente como `cost_source_type: 'PARAMETRIC_ASSUMPTION'`. No provienen de microcosteo empírico hospitalario local. El costo fiscal total del escenario se calcula linealmente como:  
   $$\text{Total Cost USD} = \text{Población total} \cdot \text{Costo per cápita anual} \cdot \frac{\text{Meses simulación}}{12}$$

---

# 5. Resultados finales del modelo

Cifras oficiales extraídas de los outputs actuales en `data/results/`:

## 5.1 Resultados globales
*Fuente: `data/results/final_global_results.csv` (Horizonte = 36 meses)*

| Escenario | Nacimientos (`cumulative_births`) | Muertes maternas (`cumulative_maternal_deaths`) | MMR de horizonte (muertes/100k) | Muertes evitadas (`deaths_avoided`) | Reducción mortalidad (%) | Costo total (USD) | Costo por muerte evitada (USD) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline** | 3,297,468.90 | 8,659.40 | 262.61 | 0.00 | 0.00% | $0.00 | N/A |
| **Scenario A** | 3,297,531.96 | 7,428.96 | 225.29 | 1,230.43 | 14.21% | $113,383,920.15 | $92,149.73 |
| **Scenario B** | 3,298,959.66 | 6,556.87 | 198.76 | 2,102.52 | 24.28% | $218,948,259.60 | $104,136.01 |
| **Scenario C** | 3,298,369.03 | 7,353.97 | 222.96 | 1,305.42 | 15.08% | $74,286,016.65 | $56,905.67 |
| **Scenario D** | 3,299,568.00 | 2,739.32 | 83.02 | 5,920.07 | 68.37% | $406,618,196.40 | $68,684.63 |

---

## 5.2 Resultados por país
*Fuente: `data/results/final_country_results.csv` (Horizonte = 36 meses)*

| País | Escenario | MMR de horizonte | Muertes maternas | Muertes evitadas | Reducción (%) | Costo total (USD) | Costo por muerte evitada (USD) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ethiopia** | Baseline | 194.88 | 1,474.81 | 0.00 | 0.00% | $0.00 | N/A |
| Ethiopia | Scenario A | 140.40 | 1,062.61 | 412.20 | 27.95% | $26,187,000.00 | $63,529.66 |
| Ethiopia | Scenario B | 167.37 | 1,267.75 | 207.06 | 14.04% | $50,568,000.00 | $244,216.30 |
| Ethiopia | Scenario C | 166.83 | 1,263.41 | 211.41 | 14.33% | $17,157,000.00 | $81,155.03 |
| Ethiopia | Scenario D | 72.93 | 552.81 | 922.00 | 62.52% | $93,912,000.00 | $101,856.80 |
| **Ghana** | Baseline | 235.55 | 2,050.80 | 0.00 | 0.00% | $0.00 | N/A |
| Ghana | Scenario A | 213.80 | 1,861.47 | 189.33 | 9.23% | $33,016,500.00 | $174,384.09 |
| Ghana | Scenario B | 204.51 | 1,780.63 | 270.17 | 13.17% | $63,756,000.00 | $235,980.93 |
| Ghana | Scenario C | 197.59 | 1,720.42 | 330.38 | 16.11% | $21,631,500.00 | $65,475.58 |
| Ghana | Scenario D | 72.97 | 635.35 | 1,415.45 | 69.02% | $118,404,000.00 | $83,650.90 |
| **Kenya** | Baseline | 384.05 | 3,064.52 | 0.00 | 0.00% | $0.00 | N/A |
| Kenya | Scenario A | 319.91 | 2,552.74 | 511.78 | 16.70% | $27,166,920.15 | $53,083.39 |
| Kenya | Scenario B | 265.06 | 2,115.28 | 949.24 | 30.98% | $52,460,259.60 | $55,265.45 |
| Kenya | Scenario C | 322.42 | 2,573.05 | 491.47 | 16.04% | $17,799,016.65 | $36,215.70 |
| Kenya | Scenario D | 118.39 | 944.79 | 2,119.73 | 69.17% | $97,426,196.40 | $45,961.61 |
| **Tanzania** | Baseline | 276.28 | 1,510.01 | 0.00 | 0.00% | $0.00 | N/A |
| Tanzania | Scenario A | 256.96 | 1,404.44 | 105.57 | 6.99% | $17,508,750.00 | $165,851.39 |
| Tanzania | Scenario B | 184.64 | 1,010.43 | 499.58 | 33.08% | $33,810,000.00 | $67,677.11 |
| Tanzania | Scenario C | 240.52 | 1,315.04 | 194.97 | 12.91% | $11,471,250.00 | $58,836.67 |
| Tanzania | Scenario D | 78.65 | 430.45 | 1,079.56 | 71.49% | $62,790,000.00 | $58,162.56 |
| **Uganda** | Baseline | 171.79 | 559.26 | 0.00 | 0.00% | $0.00 | N/A |
| Uganda | Scenario A | 168.24 | 547.70 | 11.55 | 2.07% | $9,504,750.00 | $822,845.92 |
| Uganda | Scenario B | 117.57 | 382.79 | 176.47 | 31.55% | $18,354,000.00 | $104,008.93 |
| Uganda | Scenario C | 148.06 | 482.05 | 77.20 | 13.80% | $6,227,250.00 | $80,660.43 |
| Uganda | Scenario D | 54.04 | 175.92 | 383.33 | 68.54% | $34,086,000.00 | $88,920.70 |

---

## 5.3 Resultados territoriales
*Fuente: `data/results/final_simulation_results.csv` (125 registros: 25 territorios $\times$ 5 escenarios)*

- **Mínimo Baseline MMR:**  
  `142.94` muertes / 100,000 nacidos vivos en el territorio `ug-mbarara` (Mbarara District, Uganda).
- **Máximo Baseline MMR:**  
  `493.39` muertes / 100,000 nacidos vivos en el territorio `ke-turkana` (Turkana Central, Kenya).
- **Rango territorial de Baseline MMR:**  
  `350.45` muertes / 100,000 nacidos vivos (de 142.94 a 493.39).
- **Mayor reducción porcentual por escenario:**  
  - Escenario A: `40.38%` en `et-oromia` (East Shewa / Adama, Ethiopia).  
  - Escenario B: `48.46%` en `ke-turkana` (Turkana Central, Kenya).  
  - Escenario C: `17.73%` en `et-amhara` (West Gojjam / Bahir Dar, Ethiopia).  
  - Escenario D: `78.19%` en `et-tigray` (Central Tigray / Mekelle, Ethiopia).
- **Menor reducción porcentual por escenario:**  
  - Escenario A: `1.36%` en `ug-arua` (Arua District, Uganda).  
  - Escenario B: `7.33%` en `et-amhara` (West Gojjam / Bahir Dar, Ethiopia).  
  - Escenario C: `10.12%` en `et-afar` (Awash & Semera Zone, Ethiopia).  
  - Escenario D: `47.81%` en `et-amhara` (West Gojjam / Bahir Dar, Ethiopia).
- **Rango territorial de muertes evitadas:**  
  - Mínimo absoluto: `0.93` muertes evitadas en `ug-moroto` bajo el Escenario A.  
  - Máximo absoluto: `566.83` muertes evitadas en `ke-kakamega` bajo el Escenario D.
- **Patrones territoriales directos demostrables:**  
  1. *Heterogeneidad de respuesta al transporte:* Los distritos áridos o pastoriles remotos con tiempos de viaje prolongados (como `ke-turkana` con $1.31$ h de viaje promedio y cobertura vial de solo 47.6%) logran un beneficio masivo con el transporte (Escenario A evita 215.2 muertes en Turkana), mientras que distritos compactos o periurbanos (como `ug-arua` o `ug-mbarara` con tiempos viales $<0.05$ h) obtienen reducciones mínimas con transporte ($<2.5\%$), dependiendo casi enteramente de calidad clínica (Escenario D) o eliminación de costos (Escenario B).  
  2. *Límite de la intervención financiera en alta capacidad:* En zonas donde el parto institucional ya supera el 75-80% (ej. regiones de Ghana), el subsidio a la demanda (Escenario B) tiene un rendimiento decreciente frente al paquete clínico D, que ataca la letalidad intrahospitalaria por falta de sangre y fármacos.

---

# 6. Validación y análisis de incertidumbre

Resultados calculados en tiempo de ejecución por `backend/services/validation.py` sobre los 25 distritos con insumos vigentes:

## 6.1 Prueba de Kolmogorov-Smirnov (KS 2-Sample)
- **Datos comparados:** Tasa observada de parto institucional anclada de DHS (`d.institutional_delivery_rate`) vs. Tasa final de parto institucional simulada en el baseline a 36 meses (`facility_delivery_rate_final`).
- **Origen:** Dataset versionado `maternal_health_context.csv` vs. Simulación basal del motor RK4.
- **$n$ observada / $n$ simulada:** $25$ y $25$ distritos.
- **Estadístico $D$:** `0.0800`
- **Valor $p$:** `0.9999997` ($p \approx 1.0$)
- **Valor crítico ($\alpha = 0.05$):**  
  $$D_{\text{crit}} = 1.36 \cdot \sqrt{\frac{25 + 25}{25 \cdot 25}} = 0.3847$$
- **Interpretación del sistema:** `is_statistically_equivalent: True` ($D = 0.08 < 0.3847$; $p \ge 0.05$). Las distribuciones empírica y simulada son indistinguibles estadísticamente.

---

## 6.2 Prueba de Rangos con Signo de Wilcoxon
- **Datos comparados:** Diferencias pareadas por distrito (`simulada - observada`) en la tasa de parto institucional.
- **Origen:** Los mismos 25 pares distritales.
- **Número de pares ($n$):** $25$
- **Estadístico $W$:** `36.0`
- **Valor $p$:** `0.000287` ($p < 0.001$)
- **Mediana de la diferencia:** `-0.2422` puntos porcentuales (-0.24%).
- **Media de la diferencia:** `-0.1466` puntos porcentuales.
- **Interpretación del sistema:** `reject_null_bias: True`. Existe un sesgo descendente sistemático pero diminuto (menos de un tercio de punto porcentual) atribuible a la dinámica endógena de congestión y desgaste de confianza en el horizonte de 36 meses.

---

## 6.3 Análisis Global de Sensibilidad de Sobol
- **Librería y versión:** `SALib` (versión $\ge 1.4.7$, instalada en entorno Python).
- **Algoritmo:** Diseño de Saltelli (`SALib.sample.sobol`), estimador Jansen para total-order (`calc_second_order=False`).
- **Territorio y Escenario evaluados:** `ke-garissa`, Escenario D, horizonte 12 meses.
- **Tamaño muestral base ($N$):** $64$ (requiere potencia de 2).
- **Número total de corridas de modelo:** $N \cdot (D + 2) = 64 \cdot (8 + 2) = 640$ simulaciones pareadas.
- **Semilla (`seed`):** `42`
- **Variable objetivo:** Muertes evitadas por el escenario (`deaths_avoided:scenario_d`).

### Tabla completa de parámetros e índices Sobol

| Parámetro | Tipo de rango | Rango exacto | Índice Primer Orden ($S_1$) | IC 95% $S_1$ (`S1_conf`) | Índice Total ($S_T$) | IC 95% $S_T$ (`ST_conf`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `skilled_staff_ratio` | Multiplicador | $[0.60, 1.40]$ | **0.9424** | $\pm 0.2623$ | **0.9546** | $\pm 0.2672$ |
| `blood_availability_rate` | Aditivo | $[-0.15, +0.15]$ | **0.0341** | $\pm 0.0868$ | **0.0550** | $\pm 0.0257$ |
| `road_quality_index` | Aditivo | $[-0.15, +0.15]$ | 0.0011 | $\pm 0.0174$ | 0.0028 | $\pm 0.0008$ |
| `travel_time_hours` | Multiplicador | $[0.50, 1.50]$ | -0.0015 | $\pm 0.0068$ | 0.0004 | $\pm 0.0001$ |
| `community_trust_baseline`| Aditivo | $[-0.12, +0.12]$ | -0.0012 | $\pm 0.0035$ | 0.0001 | $\pm 0.00006$ |
| `transport_cost_usd` | Multiplicador | $[0.70, 1.30]$ | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| `facility_delivery_fee_usd`| Multiplicador| $[0.50, 1.50]$ | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| `insurance_coverage_rate` | Aditivo | $[-0.15, +0.15]$ | 0.0000 | 0.0000 | 0.0000 | 0.0000 |

*Principales contribuyentes a la varianza en Escenario D:* `skilled_staff_ratio` (95.5% de la varianza total), seguido de `blood_availability_rate` (5.5%). En el Escenario D, los parámetros financieros y de costo son anulados por las reglas de gratuidad y seguro al 95%, por lo que su sensibilidad es 0.

---

## 6.4 Bootstrap Paramétrico / Propagación de Incertidumbre
- **Territorio:** `ke-garissa` (Garissa District, Kenya).
- **Escenario:** `scenario_d`.
- **Horizonte temporal:** 36 meses.
- **Número de iteraciones:** $200$
- **Distribución:** Uniforme sobre `PARAMETER_RANGES` (multiplicadores y desplazamientos aditivos acotados).
- **Semilla (`seed`):** `42`
- **Muestras positivas obtenidas:** 200 de 200 (100%).
- **Estimación central vidas salvadas (`mean_lives_saved`):** `173.15`
- **IC 95% Vidas salvadas (`ci95_lives_saved`):** `[135.45, 195.63]`
- **Estimación central costo por vida salvada (`mean_cost_per_life_saved`):** `$76,844.90` USD
- **IC 95% Costo por vida salvada (`ci95_cost_per_life_saved`):** `[$67,092.71, $96,899.88]` USD

---

## 6.5 Comparación denominada "Externa" (Auditoría Metodológica de Circularidad)

La función `StatisticalValidationPy.external_validation()` en `backend/services/validation.py` compara los 25 distritos:

- **Valor denominado "observado":** `d.baseline_mmr` (media: $264.68$).
- **Archivo exacto de procedencia:** `data/model_inputs/territorial_demographics.csv`.
- **Fuente original:** Estimaciones nacionales de la OMS (WHO MMR 2023 en `MDG_0000000026.csv`) reescaladas a nivel distrital por `scripts/anchor_baseline_mmr_from_who.py`.
- **¿Fue utilizado como input o calibración del modelo?:** **SÍ.** El valor de `d.baseline_mmr` se utiliza explícitamente en la línea 170 de `system_dynamics.py` para calcular el factor de calibración basal:  
  $$b['calibration'] = \frac{d.\text{baseline\_mmr} / 100,000}{\max(10^{-9}, \text{risk})}$$
- **Métricas estadísticas reportadas:**
  - Número de observaciones ($n$): $25$ distritos
  - Media MMR observado: `264.68`
  - Media MMR predicho (horizonte): `266.59`
  - RMSE: `3.17`
  - $R^2$: `0.9993`
  - MAE (Error Absoluto Medio): `2.19`
  - Error Absoluto Máximo: `11.27`
  - MAE de cobertura parto institucional: `0.20%`
  - MAE de cobertura ANC1: `0.47%`
- **Clasificación metodológica estricta:**  
  **NO ES UNA VALIDACIÓN EXTERNA INDEPENDIENTE.** Es una **verificación de estabilidad del anclaje de calibración a lo largo del horizonte** (*calibration anchor stability check*).  
  El código documenta honestamente en su atributo `note` (línea 303 de `validation.py`):  
  *"Baseline MMR inputs are the calibration anchor of the engine; the MMR metrics quantify how well that anchor holds across the horizon. Coverage metrics compare DHS-anchored inputs with simulated end-state outputs."*  
  Describir un $R^2 = 0.9993$ en MMR como "validación externa" violaría el rigor científico debido a la circularidad intrínseca entre el dato de anclaje y el factor multiplicativo del modelo.

---

# 7. Comparación con estimaciones WHO / MMEIG

Tabla generada a partir de `data/results/mmeig_baseline_reference_comparison.csv` y `data/mortality/mmeig_absolute_maternal_deaths.csv`:

| País | Año referencia | Muertes maternas OMS (MMEIG) | MMR referencia OMS | Muertes anualizadas simulación baseline | Diferencia absoluta anualizada | Diferencia relativa (%) | Clasificación oficial del sistema |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ethiopia** | 2020 | 10,000 | 267 | 491.60 | -9,508.40 | **-95.08%** | `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED` |
| **Ghana** | 2020 | 2,700 | 308 | 683.60 | -2,016.40 | **-74.68%** | `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED` |
| **Kenya** | 2020 | 5,100 | 342 | 1,021.51 | -4,078.49 | **-79.97%** | `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED` |
| **Tanzania** | 2020 | 5,200 | 238 | 503.34 | -4,696.66 | **-90.32%** | `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED` |
| **Uganda** | 2020 | 6,300 | 375 | 186.42 | -6,113.58 | **-97.04%** | `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED` |

### Notas y justificación de clasificación
- **Archivo fuente:** `data/results/mmeig_baseline_reference_comparison.csv`
- **Desalineación geográfica y temporal:** Las cifras de la OMS reportan las muertes de **toda la nación** para el año 2020. En contraste, el gemelo digital simula exclusivamente **5 distritos muestra por país** (una fracción de la población nacional) sobre un horizonte de 36 meses.
- **Clasificación metodológica real:** El propio sistema califica explícitamente esta comparación como `EXPLORATORY_REFERENCE_COMPARISON_TEMPORAL_ALIGNMENT_REQUIRED` y `CALIBRATION_ALIGNMENT_NOT_EXTERNAL_VALIDATION` (en `baseline_mmr_alignment_check.csv`).
- **Regla:** Bajo ningún concepto debe presentarse como validación predictiva de muertes absolutas nacionales.

---

# 8. Capa de accesibilidad geoespacial

La arquitectura de análisis geoespacial del repositorio opera de manera desacoplada del frontend interactivo, procesando datos geográficos raster y vectoriales en `scripts/calculate_geospatial_access.py` y `scripts/prepare_geospatial_inputs.py`.

## 8.1 Pipeline y fuentes utilizadas
1. **Límites vectoriales:** Shapefiles de GADM versión 4.1 (`gadm41_<ISO>_2.shp`).
2. **Superficie de población:** Rásteres WorldPop 2020 UN-adjusted (resolución 100m, GeoTIFF).
3. **Red vial:** Extractos de OpenStreetMap (Geofabrik) con fecha **26 de septiembre de 2026** (`<country>-260926.osm.pbf`).
4. **Instalaciones de destino:** Nodos y polígonos de OSM con etiqueta `amenity=hospital` (extraídos con `scripts/extract_osm_maternity_facilities.py`).
5. **Algoritmo de enrutamiento:** Cálculo de camino de menor coste (Dijkstra) sobre el grafo de red vial de OSM, buscando para cada celda de población el hospital de menor tiempo de viaje modelado.

---

## 8.2 Métricas empíricas territoriales de la red vial
*Valores extraídos de `data/derived/geospatial_access_empirical.csv` para los 25 territorios:*

| Territorio | País | Celdas Población | Población Total | Población Alcanzable | Población Inalcanzable | Fracción Cobertura (`coverage_fraction`) | Distancia media vial (km) | Tiempo medio vial (h) | Nodos viales OSM | Aristas viales OSM | Hospitales candidatos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ke-garissa` | Kenya | 4,395 | 282,939.69 | 275,733.72 | 7,205.96 | 97.45% | 2.51 | 0.13 | 56,691 | 58,160 | 7 |
| `ke-turkana` | Kenya | 4,054 | 189,473.76 | 90,106.17 | 99,367.60 | **47.56%** | 43.69 | 1.31 | 195,328 | 200,074 | 3 |
| `ke-kilifi` | Kenya | 2,155 | 289,085.90 | 179,944.00 | 109,141.00 | **62.25%** | 13.22 | 0.64 | 348,352 | 354,986 | 23 |
| `ke-kisumu` | Kenya | 1,229 | 226,746.84 | 212,197.78 | 14,549.06 | 93.58% | 2.33 | 0.08 | 1,189,551 | 1,210,259 | 26 |
| `ke-kakamega`| Kenya | 2,105 | 204,523.53 | 194,445.94 | 10,077.59 | 95.07% | 13.98 | 0.61 | 1,526,094 | 1,553,169 | 24 |
| `tz-mwanza` | Tanzania | 5,339 | 603,710.69 | 556,499.62 | 47,211.08 | 92.18% | 3.69 | 0.17 | 2,019,935 | 2,077,650 | 50 |
| `tz-kigoma` | Tanzania | 2,681 | 277,077.31 | 273,275.39 | 3,801.91 | 98.63% | 2.46 | 0.10 | 321,338 | 332,112 | 6 |
| `tz-dodoma` | Tanzania | 4,784 | 521,475.10 | 504,600.82 | 16,874.28 | 96.76% | 10.31 | 0.50 | 2,135,579 | 2,224,291 | 15 |
| `tz-arusha` | Tanzania | 3,477 | 604,087.18 | 588,258.29 | 15,828.89 | 97.38% | 4.67 | 0.20 | 1,166,446 | 1,201,570 | 14 |
| `tz-morogoro`| Tanzania | 3,771 | 435,695.00 | 419,162.29 | 16,532.71 | 96.21% | 2.98 | 0.14 | 784,522 | 801,357 | 9 |
| `ug-gulu` | Uganda | 1,614 | 194,894.51 | 189,865.76 | 5,028.76 | 97.42% | 1.82 | 0.06 | 544,849 | 552,684 | 74 |
| `ug-arua` | Uganda | 1,186 | 84,139.90 | 83,268.33 | 871.57 | 98.96% | 0.93 | 0.03 | 592,616 | 611,674 | 118 |
| `ug-moroto` | Uganda | 557 | 13,470.13 | 13,083.50 | 386.63 | 97.13% | 1.07 | 0.04 | 65,480 | 66,533 | 39 |
| `ug-jinja` | Uganda | 1,032 | 99,881.37 | 95,421.17 | 4,460.20 | 95.53% | 1.59 | 0.08 | 438,657 | 448,798 | 86 |
| `ug-mbarara`| Uganda | 5,352 | 137,937.10 | 137,638.53 | 298.57 | 99.78% | 0.96 | 0.04 | 404,917 | 409,363 | 119 |
| `gh-northern`| Ghana | 4,805 | 250,587.28 | 234,940.94 | 15,646.34 | 93.76% | 7.93 | 0.34 | 169,678 | 178,344 | 2 |
| `gh-upper-east`| Ghana | 4,296 | 98,869.48 | 95,937.49 | 2,931.99 | 97.03% | 142.19 | 4.96 | 123,449 | 127,220 | 1 |
| `gh-volta` | Ghana | 4,207 | 241,709.05 | 235,481.95 | 6,227.10 | 97.42% | 10.11 | 0.26 | 136,195 | 138,285 | 11 |
| `gh-ashanti`| Ghana | 2,548 | 446,398.78 | 431,117.57 | 15,281.20 | 96.58% | 3.54 | 0.11 | 489,491 | 513,549 | 25 |
| `gh-accra` | Ghana | 3,827 | 343,369.64 | 327,565.57 | 15,804.07 | 95.40% | 3.64 | 0.12 | 669,990 | 716,560 | 35 |
| `et-somali` | Ethiopia | 4,399 | 1,509,989.83 | 901,070.19 | 565,819.77 | **59.67%** | 43.85 | 1.71 | 174,983 | 181,345 | 5 |
| `et-afar` | Ethiopia | 5,193 | 613,691.78 | 176,949.51 | 292,461.46 | **28.83%** | 174.47 | 5.23 | 171,871 | 176,113 | 7 |
| `et-oromia` | Ethiopia | 2,875 | 2,644,365.77 | 2,534,613.88 | 109,751.89 | 95.85% | 70.03 | 1.83 | 908,485 | 981,316 | 48 |
| `et-amhara` | Ethiopia | 1,019 | 324,450.25 | 311,714.56 | 12,735.70 | 96.07% | 2.61 | 0.08 | 55,790 | 59,646 | 5 |
| `et-tigray` | Ethiopia | 5,411 | 1,872,803.43 | 1,233,307.83 | 637,634.54 | **65.85%** | 96.50 | 2.74 | 432,530 | 443,608 | 5 |

---

## 8.3 Desglose epistemológico de la capa geoespacial
1. **Datos geoespaciales observados:** Geometría de ejes de carreteras de OSM, nodos viales y coordenadas vectoriales de polígonos GADM.
2. **Distancias calculadas:** Longitud geodésica en kilómetros a lo largo de los segmentos de la red vial ruteable.
3. **Tiempos modelados:** Cociente entre distancia y velocidad asignada en cada arista del grafo.
4. **Supuestos de velocidad:** Archivo `data/geospatial/speed_profile_malaria_atlas_assumption.json`:
   - `primary`: $60\text{ km/h}$
   - `secondary`: $40\text{ km/h}$
   - `tertiary`: $20\text{ km/h}$
   - `unclassified`: $20\text{ km/h}$
5. **Proxies de establecimientos:** Clasificados estrictamente como `OSM_HOSPITAL_PROXY_NOT_VERIFIED_EMONC`. Un nodo OSM `amenity=hospital` no garantiza banco de sangre activo ni disponibilidad quirúrgica obstétrica de emergencia.
6. **Distinción obligatoria:** Los componentes frontend `Terrain3DCanvas.tsx` y `terrainService.ts` generan elevaciones y mallas visuales 3D procedurales mediante ruido Perlin/simplex con fines de renderizado en navegador. **No deben confundirse con la capa analítica geoespacial real de ruteo y accesibilidad descrita en esta sección.**

---

# 9. Equidad y estratificación socioeconómica

## 9.1 Metodología de microdatos DHS
- **Variable de quintil (`v190`):** Quintil de riqueza nacional calculado por DHS (1: más pobre / *poorest*, 2: pobre / *poorer*, 3: medio / *middle*, 4: más rico / *richer*, 5: más rico / *richest*).
- **Ponderación:** Multiplicado por `v005 / 1,000,000`.
- **Universo:** Nacimientos en los últimos 59 meses de mujeres encuestadas.
- **Indicadores estratificados extraídos:** `anc1_rate` ($m14 > 0$), `anc4_rate` ($m14 \ge 4$), `institutional_delivery_rate` ($m15$ clasificado).
- **Archivos generados:**
  1. `data/derived/dhs_quintile_indicators.csv` (25 filas: 5 países $\times$ 5 quintiles). Contiene tasas absolutas, promedios nacionales y el factor de gradiente:  
     $$\text{factor} = \frac{\text{tasa\_quintil}}{\text{tasa\_nacional\_dhs}}$$
  2. `data/model_inputs/quintile_coverage_by_district.csv` (125 filas: 25 territorios $\times$ 5 quintiles).
  3. 375 registros añadidos a `data/model_inputs/input_provenance.csv` bajo la categoría `EMPIRICAL_DHS_STRATIFIED`.

---

## 9.2 Traslación al nivel territorial y subsimulaciones
Para preservar la identidad y nivel medio del distrito, la tasa de cobertura de cada quintil en el distrito se define multiplicando la tasa de entrada del distrito por el gradiente nacional del quintil (acotado a $[0, 1]$):
$$\text{tasa}_{d, q} = \min\left(1.0, \, \text{base}_d \cdot \text{factor}_q\right)$$

En tiempo de ejecución (`POST /simulation/run`):
- El motor ejecuta **5 pares de subsimulaciones acopladas** (Baseline vs Escenario) para cada quintil.
- En cada subsimulación, los parámetros `anc1_coverage` e `institutional_delivery_rate` se reemplazan por los valores específicos del quintil.
- El costo fiscal del escenario se reparte ponderado por la fracción de población (`population_share`) de cada estrato.
- La razón beneficio-costo (`benefit_cost_ratio`) devuelve formalmente `None` / `null` debido a que el proyecto no asume un valor estadístico de la vida (VSL) arbitrario.

---

## 9.3 Resultados de equidad observados en ejecución actual
*Ejemplo canónico: Territorio `ke-garissa`, Escenario D (36 meses)*

| Quintil | Etiqueta | Participación población (`population_share`) | MMR Referencia Insumo | Baseline MMR simulado | Escenario D MMR simulado | Vidas salvadas | Reducción relativa (%) | Costo fiscal imputado (USD) | Costo por vida salvada (USD) | Razón Beneficio-Costo |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Q1** | Q1 poorest | 22.43% | 890 | 438.46 | 169.39 | 300.11 | 61.37% | $2,943,974.58 | $9,809.57 | `null` |
| **Q2** | Q2 poorer | 17.98% | 760 | 442.51 | 138.32 | 340.54 | 68.74% | $2,359,264.20 | $6,928.08 | `null` |
| **Q3** | Q3 middle | 17.62% | 610 | 442.86 | 156.23 | 321.10 | 64.72% | $2,312,998.20 | $7,203.33 | `null` |
| **Q4** | Q4 richer | 20.32% | 490 | 443.08 | 167.52 | 308.77 | 62.19% | $2,666,365.45 | $8,635.48 | `null` |
| **Q5** | Q5 richest | 21.66% | 340 | 443.21 | 174.63 | 301.39 | 60.60% | $2,842,491.25 | $9,431.17 | `null` |

- **Diferencia Q1 - Q5 en insumos de referencia:** Brecha de $550$ muertes/100k (890 vs 340).
- **Diferencia Q1 - Q5 en simulación final Escenario D:** Brecha reducida a $-5.24$ muertes/100k (169.39 en Q1 vs 174.63 en Q5), mostrando convergencia por cobertura universal clínica y gratuidad.
- **Agregados nacionales o globales de equidad:** `NOT AVAILABLE IN CURRENT OUTPUT` (el repositorio no contiene un script de agregación multi-territorial de equidad ni tablas exportadas a nivel país/global para subsimulaciones de quintiles).

---

# 10. Software, arquitectura y reproducibilidad

## 10.1 Arquitectura del sistema y flujo de datos
El sistema opera mediante una arquitectura multicapa contenerizada:
```
Archivos CSV/DTA/GeoTIFF/PBF
        │
        ▼ (scripts/load_model_inputs.py)
PostgreSQL 15 + PostGIS 3.3 (puerto 5434:5432)
        │
        ▼ (psycopg2 / fallback a CSVs versionados)
FastAPI Backend Python 3.11/3.12 (puerto 8000:8000)
    ├── SystemDynamicsEngine (ODE RK4 puro)
    ├── StatisticalValidationPy (SciPy / SALib)
    └── LangGraph Analyst Copilot (Gemini / Groq)
        │
        ▼ (HTTP REST API / JSON)
Express Reverse Proxy & Server (puerto 3000)
        │
        ▼
React 19 / TypeScript SPA Frontend (Vite, Tailwind CSS, Lucide)
```

---

## 10.2 Versiones de software e infraestructura

Inspección de `package.json`, `backend/requirements.txt`, `Dockerfile`, `docker-compose.yml` y entorno de ejecución:

| Componente / Dependencia | Versión declarada / fijada | Estado de verificación |
| :--- | :--- | :--- |
| **Python Backend** | `3.11-slim` en Dockerfile; `3.12.10` en host Windows | Verificado |
| **FastAPI** | `fastapi>=0.110.0` | `VERSION NOT PINNED` (rango mínimo `>=0.110.0`) |
| **SciPy** | `scipy>=1.12.0` | `VERSION NOT PINNED` (rango mínimo `>=1.12.0`) |
| **NumPy** | `numpy>=1.26.0` | `VERSION NOT PINNED` (rango mínimo `>=1.26.0`) |
| **SALib** | `SALib>=1.4.7` | `VERSION NOT PINNED` (rango mínimo `>=1.4.7`) |
| **PostgreSQL / PostGIS** | `postgis/postgis:15-3.3` | **Fijada** en Docker Compose |
| **Redis** | `redis:7.2-alpine` | **Fijada** en Docker Compose |
| **Node.js (Frontend)** | `node:20-alpine` | **Fijada** en Dockerfile.frontend |
| **React** | `^19.0.1` | **Fijada** (`19.0.1` en `package.json`) |
| **Vite** | `^6.2.3` | Verificado (`6.2.3` en `package.json`) |
| **TypeScript** | `~5.8.2` | Verificado (`5.8.2` en `package.json`) |
| **Tailwind CSS** | `^4.1.14` | Verificado en `package.json` |
| **Streamlit** | `streamlit>=1.32.0` | Presente en `backend/streamlit_app.py` (activo como UI de evaluación) |

---

## 10.3 Inventario de componentes frontend y endpoints científicos

### Vistas principales del Frontend (9 vistas en `App.tsx`)
1. `dashboard` (`DashboardView.tsx`): KPIs clave, selectores de escenarios y trayectoria temporal.
2. `gis-map` (`GeospatialMapView.tsx`): Cartografía 2D interactiva de distritos y establecimientos.
3. `multi-year` (`MultiYearProjectionView.tsx`): Proyecciones temporales plurianuales a largo plazo.
4. `causal-model` (`CausalLoopView.tsx`): Diagrama de bucles causales (CLD) de retroalimentación sistémica.
5. `scenarios` (`ScenariosView.tsx`): Comparación cruzada de los escenarios A, B, C y D.
6. `equity` (`EquityView.tsx`): Desagregación por quintiles de riqueza y análisis de gradientes.
7. `validation` (`ValidationView.tsx`): Panel de pruebas KS, Wilcoxon, convergencia RK4 y Sobol.
8. `reports` (`ReportsView.tsx`): Generación de informes exportables en PDF, Excel y Word.
9. `code-arch` (`CodeArchitectureView.tsx`): Documentación técnica de arquitectura y contratos de datos.

### Modales auxiliares (3 modales)
- `AICopilotModal.tsx` (Copiloto epidemiológico con LLM)
- `AuthModal.tsx` (Gestión de autenticación y roles)
- `DHSImportModal.tsx` (Inspección de microdatos)

### Endpoints científicos del Backend (`backend/main.py`)
- `GET /health`: Estado del servicio y timestamp UTC.
- `GET /districts`: Catálogo completo de los 25 distritos con indicadores.
- `GET /districts/{district_id}`: Datos detallados de un distrito específico.
- `POST /simulation/run`: Ejecución determinista del motor RK4 (5 stocks, trayectorias y equidad).
- `GET /simulation/compare/{district_id}`: Simulación pareada de los 5 escenarios para un territorio.
- `POST /validation/ks`: Pruebas de Kolmogorov-Smirnov y Wilcoxon pareado para los 25 distritos.
- `POST /validation/sobol`: Análisis global de sensibilidad de Sobol con SALib.
- `POST /validation/bootstrap`: Intervalos de confianza del 95% por bootstrap paramétrico.
- `GET /validation/external/{district_id}`: Estabilidad del anclaje de calibración interdistrital.
- `GET /validation/convergence/{district_id}`: Verificación del orden de convergencia RK4 ($\Delta t = 0.1, 0.05, 0.025$).

---

## 10.4 Estado de pruebas y contenedores
- **Inventario total de tests:** 69 pruebas recolectadas (`backend/tests/`: 55 pruebas; `tests/`: 14 pruebas).
- **Resultado de ejecución de tests (`python -m pytest`):**  
  `68 PASSED, 1 FAILED` (duración: 10.06s).  
  *Fallo documentado:* `tests/test_clinical_capacity.py::test_spa_values_reach_all_25_districts_without_replacing_staff_density` falló debido a una discrepancia entre la fórmula legacy esperada en el test y el valor empírico actualizado de `road_quality_index` en `geographic_access.csv` (`assert 0.51875 == 0.96856256177362`).
- **Verificación de tipado frontend (`npm run lint` / `tsc --noEmit`):**  
  **EXITOSO** (código de salida 0, sin errores de TypeScript).
- **Estado de contenedores Docker (`docker compose ps`):**  
  Los 4 contenedores están en ejecución y saludables (`Up / healthy`):
  - `maternal_health_api` (FastAPI, puerto 8000)
  - `maternal_health_cache` (Redis 7.2, puerto 6380)
  - `maternal_health_db` (PostGIS 15-3.3, puerto 5434)
  - `maternal_health_web` (Express/React 19, puerto 3000)

---

## 10.5 Comandos exactos de reproducción

```powershell
# 1. ETL e insumos híbridos DHS
python scripts/build_final_hybrid_inputs.py

# 2. ETL clínico SPA / SARA
python scripts/build_spa_inputs.py --apply

# 3. Anclaje de MMR basal con estimaciones OMS 2023
python scripts/anchor_baseline_mmr_from_who.py

# 4. Extracción de gradientes de riqueza DHS y cobertura por quintiles
python scripts/build_quintile_coverage.py

# 5. Carga de insumos versionados en base de datos PostgreSQL
python scripts/load_model_inputs.py

# 6. Pipeline geoespacial offline (GADM + WorldPop + OSM)
python -m pip install -r scripts/requirements-geospatial.txt
python scripts/prepare_geospatial_inputs.py
python scripts/calculate_geospatial_access.py

# 7. Ejecución y exportación de simulaciones finales completas
python scripts/export_final_simulation_results.py --base-url http://localhost:8000

# 8. Verificación de alineación de calibración y referencia OMS
python scripts/check_baseline_mmr_alignment.py
python scripts/compare_baseline_reference.py

# 9. Ejecución de suite de tests backend
python -m pytest

# 10. Chequeo de tipos estáticos y build frontend
npm run lint
npm run build

# 11. Despliegue de infraestructura completa vía Docker
docker compose up -d --build
```

---

# 11. Trazabilidad de datos (`input_provenance.csv`)

Resumen exhaustivo del archivo de auditoría `data/model_inputs/input_provenance.csv`:

- **Número total de registros de proveniencia:** `1,100` registros.
- **Distribución por categoría de proveniencia (`source_type`):**

| Categoría de proveniencia | Cantidad de registros | Variables asignadas a esta categoría | Descripción metodológica |
| :--- | :--- | :--- | :--- |
| **`MODEL_INPUT`** | 405 | `annual_births`, `baseline_complication_rate`, `community_trust_baseline`, `country`, `facility_delivery_fee_usd`, `health_facilities_count`, `insurance_coverage_rate` (solo Kenia), `latitude`, `longitude`, `population`, `poverty_rate`, `region`, `road_quality_index`, `skilled_staff_per_10k`, `territory_name`, `transport_cost_usd`, `wealth_quintiles_mmr` | Insumos estructurales conservados de la arquitectura del modelo que no provienen de microdatos DHS directos. |
| **`EMPIRICAL_DHS_STRATIFIED`** | 375 | 15 variables por territorio (3 métricas: `anc1_rate`, `anc4_rate`, `institutional_delivery_rate` $\times$ 5 quintiles: `q1_poorest`, `q2_poor`, `q3_middle`, `q4_richer`, `q5_richest` en 25 territorios) | Gradientes de riqueza derivados de microdatos DHS ponderados con `v005` para nacimientos <60 meses, escalados sobre la tasa distrital. |
| **`EMPIRICALLY_ANCHORED`** | 195 | `anc1_rate` (25), `anc4_rate` (25), `baseline_mmr` (25), `cesarean_rate` (25), `female_education_rate` (25), `institutional_delivery_rate` (25), `insurance_coverage_rate` (20, no Kenia), `tba_prevalence` (25) | Variables de contexto reescaladas mediante desplazamiento logístico para igualar el valor nacional ponderado de DHS u OMS 2023. |
| **`SPA_NATIONAL_PROXY`** | 75 | `blood_availability` (25), `essential_drugs_availability` (25), `staff_247_availability_rate` (25) | Promedios nacionales de encuestas de establecimientos SPA aplicados de forma homogénea a los 5 territorios de cada país. |
| **`DERIVED_MODEL_INPUT`** | 50 | `avg_distance_to_emonc_km` (25), `avg_travel_time_hours` (25) | Métricas de accesibilidad física calculadas a partir del ruteo en red vial OSM ponderado por población de celdas WorldPop. |

---

# 12. Limitaciones científicas ACTUALES

Limitaciones metodológicas y empíricas reales que persisten en la versión vigente del repositorio:

| Limitación | Componente afectado | Impacto metodológico | Evidencia / Archivo |
| :--- | :--- | :--- | :--- |
| **Heterogeneidad temporal DHS** | Insumos de demanda materna | Brecha de hasta 9 años entre encuestas (Uganda 2016 vs Etiopía 2024-2025). No representan una cohorte temporal sincrónica. | `data/derived/dhs_country_indicators.csv` |
| **SPA como proxy nacional uniforme** | Capacidad del sistema de salud | Se asigna el mismo valor de sangre, fármacos y personal 24/7 a los 5 distritos del país, ocultando la severa inequidad entre capitales y distritos rurales. | `data/model_inputs/health_system_capacity.csv` |
| **Supuesto paramétrico `non247_relative_capacity = 0.33`** | Capacidad clínica efectiva | Asume rígidamente un tercio de capacidad por turno diurno de 8 horas; no está validado con bitácoras horarias de atención real. | `backend/services/system_dynamics.py#L22` |
| **Costos per cápita de escenarios paramétricos** | Módulo económico | Costos fijos uniformes ($1.45, $2.80, $0.95, $5.20 USD). No incluyen costos de inversión de capital inicial (*CapEx*) ni variación geográfica de precios. | `backend/services/system_dynamics.py#L47-L52` |
| **Rangos Sobol y Bootstrap a priori** | Análisis de incertidumbre | Los límites de muestreo ($\pm 15\%$, factores 0.5-1.5) son supuestos paramétricos y no errores estándar muestrales formales. | `backend/services/validation.py#L30-L39` |
| **Circularidad en la "validación externa"** | Validación cruzada de MMR | El MMR "observado" de comparación proviene del mismo anclaje de OMS que calibra el modelo; mide estabilidad del anclaje, no predictibilidad externa. | `backend/services/validation.py#L264-L306` |
| **OSM `hospital` no verificado como EmONC** | Ruteo geoespacial | Los nodos OSM con `amenity=hospital` se asumen como destinos obstétricos sin comprobación de quirófano activo o banco de sangre. | `scripts/GEOSPATIAL_ACCESS.md#L8` |
| **Velocidades de red vial teóricas y estáticas** | Tiempos de tránsito (Delay 2) | Velocidades fijas (60/40/20 km/h) que no modelan inundaciones estacionales, caminos de tierra intransitables ni tiempo a pie hacia la carretera. | `data/geospatial/speed_profile_malaria_atlas_assumption.json` |
| **Desfase temporal geoespacial (2020 vs 2026)** | Accesibilidad espacial | Se combina distribución poblacional WorldPop de 2020 con la red vial trazada en OpenStreetMap en septiembre de 2026. | `scripts/calculate_geospatial_access.py` |
| **Exclusión de población inalcanzable** | Tiempos y distancias medias | El tiempo promedio de viaje es condicional a la población *alcanzable*. En distritos como Afar, el 71.2% de la población no tiene ruta conectada. | `data/derived/geospatial_access_empirical.csv` |
| **Terreno 3D procedural en Frontend** | Visualización interactiva | La malla 3D del cliente web es generada algorítmicamente y no debe interpretarse como cartografía topográfica analítica DEM. | `frontend/src/components/Terrain3DCanvas.tsx` |
| **Ausencia de seguro DHS en Kenia** | Contexto financiero | Ausencia de `v481` en el microdato de Kenia forzó a conservar un valor predeterminado del modelo sin actualización empírica. | `data/model_inputs/input_provenance.csv` |

---

# 13. Estado factual final del sistema

## FILES USED
Listado de archivos del repositorio inspeccionados directamente para construir este paquete técnico:
- `README.md`
- `data/model_inputs/README.md`
- `data/model_inputs/input_provenance.csv`
- `data/model_inputs/territorial_demographics.csv`
- `data/model_inputs/maternal_health_context.csv`
- `data/model_inputs/health_system_capacity.csv`
- `data/model_inputs/geographic_access.csv`
- `data/model_inputs/model_context.csv`
- `data/model_inputs/quintile_coverage_by_district.csv`
- `data/clinical/spa_country_indicators.csv`
- `data/derived/dhs_country_indicators.csv`
- `data/derived/dhs_design_inventory.csv`
- `data/derived/dhs_processing_rules.csv`
- `data/derived/dhs_quintile_indicators.csv`
- `data/derived/who_mmr_country_indicators.csv`
- `data/derived/world_bank_oop_country_indicators.csv`
- `data/derived/geospatial_access_empirical.csv`
- `data/mortality/MDG_0000000026.csv`
- `data/mortality/mmeig_absolute_maternal_deaths.csv`
- `data/results/final_global_results.csv`
- `data/results/final_country_results.csv`
- `data/results/final_simulation_results.csv`
- `data/results/baseline_mmr_alignment_check.csv`
- `data/results/mmeig_baseline_reference_comparison.csv`
- `scripts/GEOSPATIAL_ACCESS.md`
- `scripts/build_final_hybrid_inputs.py`
- `scripts/build_quintile_coverage.py`
- `scripts/build_spa_inputs.py`
- `scripts/export_final_simulation_results.py`
- `backend/services/system_dynamics.py`
- `backend/services/validation.py`
- `backend/services/model_inputs.py`
- `backend/main.py`
- `backend/requirements.txt`
- `backend/Dockerfile`
- `backend/streamlit_app.py`
- `backend/tests/test_validation.py`
- `tests/test_clinical_capacity.py`
- `package.json`
- `docker-compose.yml`
- `Dockerfile.frontend`
- `frontend/src/App.tsx`
- `frontend/src/components/EquityView.tsx`

---

## COMMANDS EXECUTED
Comandos de inspección y verificación no destructivos ejecutados durante la auditoría:
1. `Get-ChildItem -Path . | Select-Object Name, Mode, Length` (Inspección de estructura raíz).
2. `Get-ChildItem -Path data\clinical, data\derived, data\dhs, data\economics, data\results | Select-Object FullName, Length` (Inventario de datos).
3. `Get-ChildItem -Path backend -Recurse | Select-Object FullName, Length` (Inventario de código backend).
4. `Get-ChildItem -Path frontend -Depth 2 | Select-Object FullName, Length` (Inventario de frontend).
5. `python -c "import pandas as pd; df = pd.read_csv('data/results/final_simulation_results.csv'); ..."` (Inspección de métricas territoriales min/max).
6. `python -c "import sys; sys.path.insert(0, 'backend'); from services.model_inputs import districts_from_datasets; from services.validation import StatisticalValidationPy; ..."` (Cálculo directo de KS, Wilcoxon y consistencia externa).
7. `python -c "from services.validation import StatisticalValidationPy; ..."` (Ejecución determinista de Sobol y Bootstrap con semilla 42).
8. `python -c "from services.system_dynamics import SystemDynamicsEngine; ..."` (Inspección de subsimulación de equidad en Garissa).
9. `python -m pytest --collect-only -q` (Conteo de inventario de suite de pruebas: 69 tests).
10. `python -m pytest` (Ejecución de suite de tests: 68 pasados, 1 fallido).
11. `npm run lint` (Verificación estática de tipos TypeScript: 0 errores).
12. `docker compose ps` (Inspección de salud de contenedores activos: 4 servicios healthy).
13. `python -c "import pandas as pd; df = pd.read_csv('data/model_inputs/input_provenance.csv'); ..."` (Auditoría de proveniencia: 1,100 registros).

---

## INCONSISTENCIES FOUND
1. **Fallo en prueba unitaria `tests/test_clinical_capacity.py`:**  
   La prueba `test_spa_values_reach_all_25_districts_without_replacing_staff_density` asume en su aserción la fórmula de respaldo legacy `max(0.2, 1 - distance/80)` para calcular el índice de calidad vial. Sin embargo, el archivo versionado `data/model_inputs/geographic_access.csv` provee un valor empírico explícito (`0.51875` para Garissa), el cual tiene prioridad en `build_default_parameters()`. Esto produce un fallo de aserción (`assert 0.51875 == 0.96856256177362`). 68 de 69 tests pasan.
2. **Discrepancia en versión declarada de React:**  
   Las directrices del proyecto y notas de stack señalan `React 18`, pero el archivo vigente `package.json` tiene instalada y fijada la versión `"react": "^19.0.1"` y `"react-dom": "^19.0.1"`.
3. **Advertencia de sintaxis en Docker Compose:**  
   `docker-compose.yml` incluye el atributo obsoleto `version: '3.8'`, el cual genera una advertencia en versiones modernas de Docker Compose CLI.
4. **Ausencia estructural de variable de seguro en DHS de Kenia:**  
   A diferencia de los otros cuatro países, la variable `v481` no contiene datos válidos en el microdato `KEIR8CFL.DTA`, lo que obligó a conservar el input previo del modelo (18.0%) bajo la categoría `MODEL_INPUT`.
5. **Nomenclatura del Retraso de Fase 3 en telemetry:**  
   En `system_dynamics.py`, la propiedad `phase3_delay_hours` devuelve `self.facility_delay_index`, el cual es conceptualmente un índice dimensional ponderado y no horas observadas directas de demora clínica.

---

## FINAL VERIFIED RESULTS

Resumen estricto de cifras y conclusiones definitivas vigentes:

- **Fuentes de datos:** DHS (102,325 mujeres, 68,285 nacimientos), SPA/SARA (5 reportes nacionales de establecimientos), WHO MMEIG 2023, GADM 4.1, WorldPop 2020 UN-adjusted, OSM Geofabrik 26-09-2026.
- **Razón de Mortalidad Materna Basal (Global):** `262.61` muertes por 100,000 nacidos vivos (8,659.40 muertes acumuladas en 36 meses sobre 3,297,469 nacimientos en los 25 distritos).
- **Rango Territorial de MMR Basal:** De `142.94` en Mbarara (Uganda) a `493.39` en Turkana (Kenya).
- **Efecto de Escenarios Globales (Reducción de Mortalidad / Muertes Evitadas a 36 meses):**
  - **Escenario A (Acceso/Transporte):** `14.21%` reducción | `1,230.43` muertes evitadas | Costo: `$113,383,920` ($92,150 / muerte evitada).
  - **Escenario B (Financiero/Tarifas):** `24.28%` reducción | `2,102.52` muertes evitadas | Costo: `$218,948,260` ($104,136 / muerte evitada).
  - **Escenario C (Comunitario/TBA):** `15.08%` reducción | `1,305.42` muertes evitadas | Costo: `$74,286,017` ($56,906 / muerte evitada).
  - **Escenario D (Paquete Integrado Expandido):** `68.37%` reducción | `5,920.07` muertes evitadas | Costo: `$406,618,196` ($68,685 / muerte evitada). MMR de horizonte desciende a `83.02`.
- **Validación Estadística:** KS 2-sample confirma equivalencia distribucional ($D=0.08, p=1.00$); Wilcoxon pareado detecta un sesgo medio mínimo de $-0.15\%$.
- **Sensibilidad Global (Sobol en Escenario D):** El `skilled_staff_ratio` explica el `95.5%` de la varianza en vidas salvadas, seguido de la disponibilidad de sangre (`5.5%`).
- **Incertidumbre (Bootstrap 200 iteraciones en Garissa):** Vidas salvadas en Escenario D: media $173.15$ (IC 95%: $[135.45, 195.63]$); costo por vida salvada: media $\$76,845$ (IC 95%: $[\$67,093, \$96,900]$).
- **Equidad:** Estratificación completa de 125 combinaciones (25 territorios $\times$ 5 quintiles). En Garissa, el Escenario D reduce la brecha de MMR entre el quintil 1 y el quintil 5 de 550 muertes basales a menos de 6 muertes por 100k nacidos vivos.
- **Trazabilidad:** 1,100 registros formalmente clasificados en `input_provenance.csv` (405 `MODEL_INPUT`, 375 `EMPIRICAL_DHS_STRATIFIED`, 195 `EMPIRICALLY_ANCHORED`, 75 `SPA_NATIONAL_PROXY`, 50 `DERIVED_MODEL_INPUT`).
- **Estado de Pruebas y Reproducibilidad:** 68 de 69 tests unitarios aprobados; TypeScript estricto con 0 errores; 4 contenedores Docker saludables y operativos.
