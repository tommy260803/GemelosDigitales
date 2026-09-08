**FICHA 10**

***Digital Twin of the Maternal Health Care Continuum: Predicting Bottlenecks and Preventing Maternal Mortality Through System Dynamics in Sub-Saharan Africa***

**Problema:** La mortalidad materna en África Subsahariana es 10× mayor que en países de alto ingreso. El "continuum de atención" (embarazo → parto → postparto) tiene múltiples puntos de fallo: barreras geográficas, culturales, de recursos y de calidad. Los modelos actuales son descriptivos, no predictivos ni dinámicos.

**Objetivo:** Construir un gemelo digital del continuum de salud materna que identifique cuellos de botella sistémicos y prediga el impacto de intervenciones (transporte de emergencia, clínicas móviles, incentivos financieros) sobre la mortalidad materna.

**Hipótesis:** *H*0​ : El twin no identifica cuellos de botella que expliquen ≥20% de la varianza en mortalidad materna. *H*1​ : El twin identifica 2--3 cuellos de botella críticos cuya mitigación simulada reduce la mortalidad materna en ≥15%.

**Metodología:**

-   **Módulo 1:** Integrar DHS (encuestas de salud materna), DHIS2 (sistema de información de salud de distrito, datos abiertos de países seleccionados), Countdown 2030 (indicadores de salud materna), y OpenStreetMap (acceso geográfico a centros de salud).

-   **Módulo 2:** Modelo de dinámica de sistemas con 5 stocks: mujeres embarazadas, en atención prenatal, en parto institucional, en postparto, y con complicaciones. Flujos: tasas de asistencia, tasas de referencia, tasas de mortalidad. Parámetros calibrados con datos de 5 países (Kenia, Tanzania, Uganda, Ghana, Etiopía).

-   **Módulo 3:** Validación interna: comportamiento del modelo vs. tendencias históricas de mortalidad materna (DHS). Validación externa: predicción para país no usado en calibración.

-   **Módulo 4:** Escenarios: (a) moto-ambulancia para referencia obstétrica, (b) eliminación de tarifas de parto, (c) capacitación de parteras tradicionales en reconocimiento de signos de alarma, (d) combinación de intervenciones.

-   **Módulo 5:** Análisis de escenarios: vidas salvadas, costo por vida salvada, y análisis de equidad (quintil de riqueza).

**Pruebas estadísticas:**

-   **KS:** Para validar distribución de tiempo de llegada al centro de salud simulado vs. DHS observado.

-   **Comparación:** Wilcoxon signed-rank para mortalidad materna predicha vs. observada por distrito.

-   **Sensibilidad:** Método de Sobol para identificar qué parámetros (acceso geográfico, costo, calidad percibida) explican más varianza en outcomes.

-   **Predictiva:** RMSE para predicción de tasa de mortalidad materna; R² para correlación con Countdown 2030.

-   **Bootstrap:** IC 95% para vidas salvadas y costo-efectividad.

**Protocolo:**

-   **Tipo:** Simulación basada en modelos con validación retrospectiva.

-   **DAG:** Embarazo → Barreras de acceso → Atención prenatal/parto → Calidad de atención → Supervivencia. Moderadores: riqueza, educación, distancia, edad.

-   **Población:** Distritos de salud en países de África Subsahariana.

-   **Inclusión:** Distritos con datos DHS + DHIS2 ≥3 años. Exclusión: distritos en conflicto activo.

-   **Pre-registro:** OSF.

-   **Ética:** Datos agregados a nivel de distrito. Consideración de consentimiento comunitario para datos etnográficos (si se incluyen).

-   **Timeline:** Meses 1--3: revisión + datos. Meses 4--6: calibración SD. Meses 7--10: simulación. Meses 11--13: validación + análisis de equidad. Meses 14--15: redacción.

**Datasets:** DHS (ICF), DHIS2 (países individuales), Countdown 2030, OpenStreetMap.

**Revistas:** *The Lancet Digital Health* (CiteScore ~20.0, afinidad: salud global + política); *PLOS Digital Health* (CiteScore ~6.0, afinidad: ciencia abierta + equidad); *Frontiers in Public Health* (CiteScore ~6.0, afinidad: salud materna + sistemas).

**MAPA DE CALOR DE OPORTUNIDADES**
ALTO IMPACTO
│
FICHA 2 ● │ ● FICHA 1
(Pandemias PIM) │ (Hospital EMV)
│
FICHA 5 ● │ ● FICHA 7
(SDOH) │ (AMR)
│
FICHA 10 ● │ ● FICHA 4
(Materna SSA) │ (Calor urbano)
│
FICHA 8 ● │ ● FICHA 3
(CUS) │ (Entorno alimentario)
│
FICHA 9 ● │ ● FICHA 6
(Federado) │ (EMS)
│
─────────────────────┼─────────────────────
BAJA FACTIBILIDAD │ ALTA FACTIBILIDAD
│
BAJO IMPACTO

**Cuadrantes:**

-   **Alta factibilidad + Alto impacto (esquina superior derecha):** Ficha 1 (Hospital EMV), Ficha 4 (Calor urbano), Ficha 6 (EMS). Recomendadas como primeras publicaciones por balance óptimo.

-   **Alto impacto + Baja factibilidad (esquina superior izquierda):** Ficha 2 (Pandemias PIM), Ficha 5 (SDOH), Ficha 10 (Materna SSA). Requieren alianzas internacionales y acceso a datos; recomendadas como proyectos de postdoctorado o consorcio.

-   **Novedad disruptiva:** Ficha 7 (AMR híbrido), Ficha 9 (Federado). Alto riesgo de rechazo por novedad extrema, pero potencial de definir un campo nuevo.