"""
Maternal Health Digital Twin - Streamlit Evaluation UI
 ======================================================
Interactive bilingual (English / Español) dashboard for evaluating the
System Dynamics engine.

Compatible with the RK4 five-stock engine (spa_247 clinical capacity model),
its canonical SimulationSummary metrics and the live statistical validation
procedures: equity rows are rendered only from stratified DHS inputs, and the
KS/Wilcoxon/Sobol/bootstrap statistics are computed by the validation service
on each call instead of being hard-coded anywhere in this panel.
"""

import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.system_dynamics import (
    SystemDynamicsEngine, DistrictData, SCENARIO_DEFINITIONS,
    build_default_parameters, DEFAULT_CLINICAL_CAPACITY_MODEL
)
from services.validation import StatisticalValidationPy, ScientificProcedureUnavailable
from services.model_inputs import quintile_coverage_by_district

DEFAULT_DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://twin_admin:secure_twin_password_2026@localhost:5434/maternal_twin_db'
)

# =========================================================
# PAGE CONFIGURATION
# =========================================================

st.set_page_config(
    page_title="Maternal Health Digital Twin",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1e3a5f;
    }
    .metric-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 20px;
        border-left: 5px solid #1e3a5f;
    }
    .scenario-a { border-left-color: #e74c3c; }
    .scenario-b { border-left-color: #3498db; }
    .scenario-c { border-left-color: #2ecc71; }
    .scenario-d { border-left-color: #9b59b6; }
</style>
""", unsafe_allow_html=True)

# =========================================================
# INTERNATIONALISATION (en / es)
# =========================================================
# English is the source of truth; Spanish is the translation. A missing key
# falls back to English instead of breaking the panel.

STRINGS = {
    'en': {
        'language_label': '🌐 Language',
        'sidebar_title': '🏥 Digital Twin',
        'sidebar_engine': 'System Dynamics Engine v2.4 (RK4)',
        'dhs_header': '🌍 Master DHS Ingestion',
        'dhs_desc': 'Process raw Stata (`.DTA`) microdata for all 25 Sub-Saharan districts.',
        'dhs_button': '🚀 Process All DHS Files',
        'dhs_spinner': 'Crunching millions of DHS records...',
        'dhs_success': '✅ Database perfectly synchronized with real DHS data!',
        'dhs_info': '🔄 Refresh your React Frontend to see the new data.',
        'dhs_error': '❌ Process failed.',
        'db_empty': "Database is empty. Please run 'Process All DHS Files'.",
        'db_error': 'Database connection failed: {err}. Please ensure PostgreSQL is running.',
        'select_district': 'Select Health District',
        'select_scenario': 'Select Intervention Scenario',
        'clinical_model': 'Clinical capacity model',
        'clinical_help': 'spa_247 uses empirical SPA 24/7 staff coverage; legacy depends only on the skilled-staff density ratio.',
        'sim_params': 'Simulation Parameters',
        'horizon': 'Projection Horizon (months)',
        'run_button': '🚀 Run Simulation',
        'app_header': 'Maternal Health Digital Twin',
        'app_subtitle': '**Population Digital Twin & System Dynamics Simulation Platform** for predicting systemic bottlenecks and preventing maternal mortality across Sub-Saharan African Health Districts.',
        'info_initial': '👈 Select a district and scenario from the sidebar, then click **Run Simulation** to evaluate the engine.',
        'spinner_run': 'Running System Dynamics simulation...',
        'sim_failed': 'Simulation failed for `{sid}`: {err}',
        'sim_no_result': 'Simulation produced no result for the selected scenario.',
        'sim_ok': 'Simulation complete! {n} monthly snapshots generated (integrator {integrator}, dt={dt} months, clinical model `{model}`).',
        'metrics_header': '📊 Key Epidemiological Metrics',
        'm_baseline': 'Baseline MMR',
        'm_baseline_delta': 'per 100k births (paired baseline)',
        'm_projected': 'Projected MMR (horizon)',
        'm_projected_delta': '{delta:+.0f} ({red:.1f}% reduction)',
        'm_deaths': 'Deaths Avoided',
        'm_deaths_delta': 'baseline {b} vs simulated {s}',
        'm_cost': 'Cost per Death Avoided',
        'm_cost_delta': 'Total: {total} · Incremental: {inc}',
        'm_coverage': 'ANC4 / Facility Delivery (final)',
        'm_coverage_delta': 'modeled end-of-horizon coverage',
        'deterministic_caption': 'The engine run is deterministic RK4 (no stochastic output); confidence intervals appear only in the parameter-uncertainty bootstrap, and quintile rows only when DHS-stratified coverage inputs are provided. ICER/DALY are not produced.',
        'comparison_header': '📈 Scenario Comparison',
        'col_scenario': 'Scenario', 'col_id': 'ID', 'col_horizon': 'Horizon MMR',
        'col_deaths': 'Deaths Avoided', 'col_reduction': 'Reduction %',
        'col_total': 'Total Cost USD', 'col_incr': 'Incremental Cost USD',
        'col_cost_death': 'Cost / Death Avoided', 'col_anc': 'ANC4 Final %',
        'col_fd': 'Facility Delivery Final %', 'col_integrator': 'Integrator',
        'col_quintile': 'Quintile', 'col_label': 'Label', 'col_sim_mmr': 'Simulated MMR',
        'col_lives': 'Deaths Avoided', 'col_rel_red': 'Reduction %', 'col_fiscal': 'Fiscal Cost USD',
        'col_parameter': 'Parameter', 'col_value': 'Value',
        'comparison_caption': 'One row per scenario, each from an independent {months}-month RK4 run on the selected district (clinical model `{model}`). Horizon MMR is cumulative deaths / cumulative births at the last month; deaths avoided, reduction % and incremental cost are measured against the paired baseline run of the same horizon; cost per death avoided is empty when the scenario does not avoid deaths. Modeled outputs, not observed data.',
        'traj_header': '📉 MMR Trajectory Over Time',
        'traj_x': 'Months', 'traj_y': 'Maternal Mortality Ratio (per 100,000)',
        'traj_caption': 'Monthly maternal mortality ratio per 100,000 live births, i.e. deaths recorded in that month / births in that month × 100,000, plotted for every scenario on the same district and horizon. Curves start apart only after diverging from the shared initial state; this is a modeled trajectory from the RK4 integrator, not a fitted or observed time series.',
        'stocks_header': '🔄 5-Stock System Dynamics',
        'sub_s1': 'Pregnant Women (S1)', 'sub_s2': 'In ANC (S2)', 'sub_s3': 'Facility Delivery (S3)',
        'sub_s4': 'Postpartum (S4)', 'sub_s5': 'Complications (S5)', 'sub_trust': 'System Trust',
        'sub_quality': 'Quality Factor', 'sub_capacity': 'Effective Capacity',
        'sub_staff': 'Effective Staff Availability',
        'trace_trust': 'Trust', 'trace_quality': 'Quality',
        'trace_capacity': 'Effective capacity', 'trace_staff': 'Staff availability',
        'stocks_caption': 'RK4-integrated state vector, sampled monthly for the selected scenario. Top row: the five stocks (S1 pregnant women, S2 in ANC, S3 facility delivery, S4 postpartum, S5 complications) plus the system-trust stock, all in women per month. Bottom row: outputs of the clinical-capacity module — quality factor (0–1 survival-quality multiplier), effective capacity (nominal delivery capacity × SPA 24/7 staff availability, deliveries/month) and effective staff availability (`staff_247 + (1 − staff_247) × non247`, unitless 0–1). Non-`spa_247` runs leave staff availability empty.',
        'equity_header': '⚖️ Equity Analysis by Wealth Quintile',
        'equity_info': 'No quintile rows were computed for this run: `data/model_inputs/quintile_coverage_by_district.csv` (DHS wealth-quintile coverage gradients) has no rows for this district, so the engine received no stratified inputs. Nothing is imputed: quintile outcomes are only shown when those DHS-derived inputs exist, and `equity_status` reports their provenance when they do.',
        'equity_chart_title': 'MMR by Wealth Quintile',
        'equity_chart_y': 'MMR per 100,000',
        'equity_base': 'Baseline MMR', 'equity_sim': 'Simulated MMR',
        'equity_caption': 'Reference MMR (dataset `wealth_quintiles_mmr`) vs simulated end-of-horizon MMR per 100,000 births for each wealth quintile of the selected district, for the inspected scenario. Quintile rows are paired sub-simulations whose ANC1 and institutional-delivery inputs are the district rates multiplied by DHS national wealth-quintile gradients (v005-weighted, births in the last 60 months); costs are split by national quintile population share.',
        'val_header': '📐 Statistical Validation',
        'ks_title': 'Kolmogorov-Smirnov Test (25 districts)',
        'wilcoxon_title': 'Wilcoxon Signed-Rank (paired)',
        'sobol_title': 'Sobol Sensitivity (SALib)',
        'boot_title': 'Bootstrap 95% CI (parameter uncertainty)',
        'external_title': 'External Consistency (cross-district)',
        'conv_title': '**RK4 Convergence (available)**',
        'unavailable': '⛔ Unavailable: {msg}',
        'eval_error': '⛔ Evaluation error: {err}',
        'bad_response': '⛔ Uninterpretable response: {val}',
        'conv_dt': 'dt={dt} horizon MMR: {value}',
        'conv_rel': 'Relative error: {value}',
        'conv_yes': 'Convergent (<1%): ✅ Yes',
        'conv_no': 'Convergent (<1%): ❌ No',
        'val_caption': 'All statistics are computed live: the two-sample KS and paired Wilcoxon compare DHS-anchored observed district rates against simulated baseline end-states (n=25); Sobol indices come from a SALib Saltelli design over documented parameter ranges; the bootstrap percentile CIs propagate those ranges through paired engine runs; external consistency reports observed-input vs simulated-baseline agreement across districts. Procedures report `ScientificProcedureUnavailable` only when a scope/prerequisite requirement is unmet.',
        'delays_header': '⏱️ Three-Delays Model Analysis',
        'trace_phase2': 'Phase 2: Transit', 'trace_phase3': 'Phase 3: Care Quality',
        'trace_congestion': 'Congestion Index',
        'delays_title': 'Systemic Delay Dynamics', 'delays_x': 'Months',
        'delays_y': 'Delay (hours)', 'delays_y2': 'Congestion Index',
        'delays_caption': 'Three-delays telemetry for the selected scenario, sampled every 3rd month. Phase 2: modeled time from decision to reaching a facility (hours; function of travel time, road quality and transport cost). Phase 3: facility delay index in hours-equivalent, driven by blood/oxytocin availability, staff availability and congestion. Congestion (right axis): load ÷ effective capacity, where 1.0 means the facility is at its modeled capacity. Units are hours unless stated; modeled values.',
        'overview_header': 'District Overview',
        'ov_population': 'Population', 'ov_births': 'Annual Births',
        'ov_baseline': 'Baseline MMR', 'ov_distance': 'Distance to EmONC',
        'params_error': 'Could not derive SD parameters for this district: {err}',
        'params_header': 'Derived SD Parameters',
        'scen_header': 'Scenario Definitions',
        'p_description': 'Description', 'p_mechanism': 'Mechanism', 'p_cost': 'Cost',
        'p_per_capita': 'per capita', 'p_provenance': 'Provenance',
        'p_rules': 'Parameter rules', 'rules_none': 'none (status quo)',
        'na': 'n.d.', 'na_legacy': 'n.d. (legacy model only)',
        'param_travel': 'Travel Time (hours)', 'param_road': 'Road Quality Index',
        'param_fee': 'Facility Fee (USD)', 'param_transport': 'Transport Cost (USD)',
        'param_insurance': 'Insurance Coverage', 'param_staff': 'Skilled Staff Ratio (per 10k)',
        'param_staff247': 'SPA Staff 24/7 Availability', 'param_non247': 'Non-24/7 Relative Capacity',
        'param_blood': 'Blood Availability', 'param_drugs': 'Drug Stock Rate',
        'param_education': 'Education Rate',
        'param_tba': 'TBA Influence', 'param_trust': 'Community Trust',
        'param_complication': 'Baseline Complication Rate',
    },
    'es': {
        'language_label': '🌐 Idioma',
        'sidebar_title': '🏥 Gemelo Digital',
        'sidebar_engine': 'Motor de Dinámica de Sistemas v2.4 (RK4)',
        'dhs_header': '🌍 Ingesta maestra DHS',
        'dhs_desc': 'Procesa los microdatos Stata (`.DTA`) de los 25 distritos del África Subsahariana.',
        'dhs_button': '🚀 Procesar todos los archivos DHS',
        'dhs_spinner': 'Procesando millones de registros DHS...',
        'dhs_success': '✅ Base de datos sincronizada con datos DHS reales.',
        'dhs_info': '🔄 Actualiza el frontend React para ver los datos nuevos.',
        'dhs_error': '❌ El proceso falló.',
        'db_empty': "La base de datos está vacía. Ejecuta 'Procesar todos los archivos DHS'.",
        'db_error': 'Falló la conexión a la base de datos: {err}. Verifica que PostgreSQL esté en marcha.',
        'select_district': 'Seleccionar distrito sanitario',
        'select_scenario': 'Seleccionar escenario de intervención',
        'clinical_model': 'Modelo de capacidad clínica',
        'clinical_help': 'spa_247 usa la cobertura empírica de personal 24/7 del SPA; legacy depende solo de la densidad de personal calificado.',
        'sim_params': 'Parámetros de simulación',
        'horizon': 'Horizonte de proyección (meses)',
        'run_button': '🚀 Ejecutar simulación',
        'app_header': 'Gemelo Digital de Salud Materna',
        'app_subtitle': '**Plataforma de gemelo digital poblacional y simulación de dinámica de sistémica** para anticipar cuellos de botella y prevenir la mortalidad materna en los distritos del África Subsahariana.',
        'info_initial': '👈 Selecciona un distrito y un escenario en la barra lateral y pulsa **Ejecutar simulación** para evaluar el motor.',
        'spinner_run': 'Ejecutando la simulación de dinámica de sistemas...',
        'sim_failed': 'La simulación falló para `{sid}`: {err}',
        'sim_no_result': 'La simulación no produjo resultado para el escenario seleccionado.',
        'sim_ok': '¡Simulación completada! Se generaron {n} instantáneas mensuales (integrador {integrator}, dt={dt} meses, modelo clínico `{model}`).',
        'metrics_header': '📊 Métricas epidemiológicas clave',
        'm_baseline': 'MMR de referencia',
        'm_baseline_delta': 'por 100k nacimientos (línea base pareada)',
        'm_projected': 'MMR proyectado (horizonte)',
        'm_projected_delta': '{delta:+.0f} ({red:.1f}% de reducción)',
        'm_deaths': 'Muertes evitadas',
        'm_deaths_delta': 'línea base {b} vs simulado {s}',
        'm_cost': 'Costo por muerte evitada',
        'm_cost_delta': 'Total: {total} · Incremental: {inc}',
        'm_coverage': 'ANC4 / Parto en establecimiento (final)',
        'm_coverage_delta': 'cobertura modelada al final del horizonte',
        'deterministic_caption': 'La corrida del motor es RK4 determinista (sin salida estocástica); los intervalos de confianza aparecen solo en el bootstrap de incertidumbre de parámetros, y las filas por quintil solo cuando se proveen insumos DHS estratificados. No se producen ICER/DALY.',
        'comparison_header': '📈 Comparación de escenarios',
        'col_scenario': 'Escenario', 'col_id': 'ID', 'col_horizon': 'MMR horizonte',
        'col_deaths': 'Muertes evitadas', 'col_reduction': 'Reducción %',
        'col_total': 'Costo total USD', 'col_incr': 'Costo incremental USD',
        'col_cost_death': 'Costo / muerte evitada', 'col_anc': 'ANC4 final %',
        'col_fd': 'Parto en estab. final %', 'col_integrator': 'Integrador',
        'col_quintile': 'Quintil', 'col_label': 'Etiqueta', 'col_sim_mmr': 'MMR simulado',
        'col_lives': 'Muertes evitadas', 'col_rel_red': 'Reducción %', 'col_fiscal': 'Costo fiscal USD',
        'col_parameter': 'Parámetro', 'col_value': 'Valor',
        'comparison_caption': 'Una fila por escenario, cada una de una corrida RK4 independiente de {months} meses sobre el distrito seleccionado (modelo clínico `{model}`). El MMR horizonte es muertes acumuladas / nacimientos acumulados del último mes; muertes evitadas, % de reducción y costo incremental se miden contra la corrida de línea base pareada del mismo horizonte; el costo por muerte evitada queda vacío si el escenario no evita muertes. Salidas modeladas, no datos observados.',
        'traj_header': '📉 Trayectoria del MMR en el tiempo',
        'traj_x': 'Meses', 'traj_y': 'Ratio de mortalidad materna (por 100.000)',
        'traj_caption': 'Ratio mensual de mortalidad materna por 100.000 nacidos vivos, es decir, muertes registradas en el mes / nacimientos del mes × 100.000, graficado para cada escenario con el mismo distrito y horizonte. Las curvas solo se separan al divergir del estado inicial compartido: es una trayectoria modelada del integrador RK4, no una serie observada ni ajustada.',
        'stocks_header': '🔄 Dinámica de sistemas de 5 existencias',
        'sub_s1': 'Mujeres embarazadas (S1)', 'sub_s2': 'En ANC (S2)', 'sub_s3': 'Parto en establecimiento (S3)',
        'sub_s4': 'Puerperio (S4)', 'sub_s5': 'Complicaciones (S5)', 'sub_trust': 'Confianza del sistema',
        'sub_quality': 'Factor de calidad', 'sub_capacity': 'Capacidad efectiva',
        'sub_staff': 'Disponibilidad efectiva de personal',
        'trace_trust': 'Confianza', 'trace_quality': 'Calidad',
        'trace_capacity': 'Capacidad efectiva', 'trace_staff': 'Disponibilidad de personal',
        'stocks_caption': 'Vector de estado integrado con RK4, muestreado mensualmente para el escenario seleccionado. Fila superior: las cinco existencias (S1 mujeres embarazadas, S2 en ANC, S3 parto en establecimiento, S4 puerperio, S5 complicaciones) más la existencia de confianza, todas en mujeres por mes. Fila inferior: salidas del módulo de capacidad clínica — factor de calidad (multiplicador 0–1 de calidad de supervivencia), capacidad efectiva (capacidad nominal de partos × disponibilidad de personal SPA 24/7, partos/mes) y disponibilidad efectiva de personal (`staff_247 + (1 − staff_247) × non247`, unitaria 0–1). Las corridas que no son `spa_247` dejan la disponibilidad de personal vacía.',
        'equity_header': '⚖️ Análisis de equidad por quintil de riqueza',
        'equity_info': 'Esta corrida no produjo filas por quintil: `data/model_inputs/quintile_coverage_by_district.csv` (gradientes DHS de cobertura por quintil de riqueza) no tiene filas para este distrito, así que el motor no recibió insumos estratificados. No se imputa nada: los resultados por quintil solo se muestran cuando existen esos insumos derivados de DHS, y `equity_status` reporta su procedencia cuando existen.',
        'equity_chart_title': 'MMR por quintil de riqueza',
        'equity_chart_y': 'MMR por 100.000',
        'equity_base': 'MMR de referencia', 'equity_sim': 'MMR simulado',
        'equity_caption': 'MMR de referencia (dataset `wealth_quintiles_mmr`) vs MMR simulado a fin de horizonte por 100.000 nacimientos para cada quintil de riqueza del distrito seleccionado, para el escenario inspeccionado. Las filas por quintil son sub-simulaciones pareadas cuyas entradas de ANC1 y parto institucional son las tasas distritales multiplicadas por los gradientes nacionales DHS por quintil de riqueza (ponderados con v005, nacimientos de los últimos 60 meses); el costo se reparte según la participación poblacional nacional del quintil.',
        'val_header': '📐 Validación estadística',
        'ks_title': 'Kolmogorov-Smirnov (25 distritos)',
        'wilcoxon_title': 'Wilcoxon por pares (signed-rank)',
        'sobol_title': 'Sensibilidad de Sobol (SALib)',
        'boot_title': 'IC 95% bootstrap (incertidumbre de parámetros)',
        'external_title': 'Consistencia externa (cross-district)',
        'conv_title': '**Convergencia RK4 (disponible)**',
        'unavailable': '⛔ No disponible: {msg}',
        'eval_error': '⛔ Error al evaluar: {err}',
        'bad_response': '⛔ Respuesta no interpretable: {val}',
        'conv_dt': 'dt={dt} MMR horizonte: {value}',
        'conv_rel': 'Error relativo: {value}',
        'conv_yes': 'Convergente (<1%): ✅ Sí',
        'conv_no': 'Convergente (<1%): ❌ No',
        'val_caption': 'Todas las estadísticas se calculan en vivo: KS de dos muestras y Wilcoxon por pares comparan tasas observadas ancladas a DHS contra los estados finales simulados (n=25); los índices de Sobol provienen de un diseño Saltelli de SALib sobre rangos de parámetros documentados; los IC porcentuales del bootstrap propagan esos rangos mediante corridas pareadas del motor; la consistencia externa reporta el acuerdo entre entradas observadas y baseline simulado entre distritos. Un procedimiento solo reporta `ScientificProcedureUnavailable` cuando no se cumple un requisito de alcance o de datos.',
        'delays_header': '⏱️ Análisis del modelo de tres retrasos',
        'trace_phase2': 'Fase 2: Tránsito', 'trace_phase3': 'Fase 3: Calidad de atención',
        'trace_congestion': 'Índice de congestión',
        'delays_title': 'Dinámica de retrasos sistémicos', 'delays_x': 'Meses',
        'delays_y': 'Retraso (horas)', 'delays_y2': 'Índice de congestión',
        'delays_caption': 'Telemetría de los tres retrasos para el escenario seleccionado, muestreada cada 3 meses. Fase 2: tiempo modelado desde la decisión hasta llegar al establecimiento (horas; función del tiempo de viaje, calidad de la vía y costo de transporte). Fase 3: índice de demora en el establecimiento en horas-equivalente, gobernado por disponibilidad de sangre/oxitócina, disponibilidad de personal y congestión. Congestion (eje derecho): carga ÷ capacidad efectiva, donde 1.0 indica que el establecimiento está a su capacidad modelada. Las unidades son horas salvo indicación; valores modelados.',
        'overview_header': 'Resumen del distrito',
        'ov_population': 'Población', 'ov_births': 'Nacimientos anuales',
        'ov_baseline': 'MMR de referencia', 'ov_distance': 'Distancia a EmONC',
        'params_error': 'No se pudieron derivar los parámetros SD de este distrito: {err}',
        'params_header': 'Parámetros SD derivados',
        'scen_header': 'Definiciones de escenarios',
        'p_description': 'Descripción', 'p_mechanism': 'Mecanismo', 'p_cost': 'Costo',
        'p_per_capita': 'por habitante', 'p_provenance': 'Procedencia',
        'p_rules': 'Reglas de parámetros', 'rules_none': 'ninguna (status quo)',
        'na': 'n.d.', 'na_legacy': 'n.d. (solo modelo legacy)',
        'param_travel': 'Tiempo de viaje (horas)', 'param_road': 'Índice de calidad vial',
        'param_fee': 'Cuota del establecimiento (USD)', 'param_transport': 'Costo de transporte (USD)',
        'param_insurance': 'Cobertura de seguro', 'param_staff': 'Proporción de personal calificado (por 10k)',
        'param_staff247': 'Disponibilidad de personal SPA 24/7', 'param_non247': 'Capacidad relativa no 24/7',
        'param_blood': 'Disponibilidad de sangre', 'param_drugs': 'Nivel de stock de fármacos',
        'param_education': 'Nivel educativo',
        'param_tba': 'Influencia de la TBA', 'param_trust': 'Confianza comunitaria',
        'param_complication': 'Tasa de complicaciones de referencia',
    },
}

# Presentation-side translations of the engine-owned scenario texts.
SCENARIO_TEXT = {
    'en': {
        'baseline': ('Base', 'Status quo baseline', 'No supplementary intervention.', 'Existing modeled inputs.'),
        'scenario_a': ('A', 'Access and transport package', 'Transport/access intervention.', 'Reduces modeled travel time by 50%; road and transport rules are retained from the access package.'),
        'scenario_b': ('B', 'Financial access package', 'Delivery-fee removal and insurance coverage floor.', 'Improves modeled affordability.'),
        'scenario_c': ('C', 'Community package', 'TBA/community trust intervention.', 'Improves modeled community pathway.'),
        'scenario_d': ('D', 'Combined expanded package (A+B+C+clinical capacity)', 'Combined access, financial, community and clinical-capacity package.', 'Combines A, B and C with 95% modeled 24/7 staff coverage, blood availability and uterotonic availability.'),
    },
    'es': {
        'baseline': ('Base', 'Línea base sin intervención', 'Sin intervención suplementaria.', 'Insumos modelados existentes.'),
        'scenario_a': ('A', 'Paquete de acceso y transporte', 'Intervención de transporte/acceso.', 'Reduce el tiempo de viaje modelado un 50%; se conservan las reglas de carretera y transporte del paquete de acceso.'),
        'scenario_b': ('B', 'Paquete financiero', 'Eliminación de la cuota de parto y piso de cobertura de seguro.', 'Mejora la asequibilidad modelada.'),
        'scenario_c': ('C', 'Paquete comunitario', 'Intervención de partera tradicional (TBA)/confianza comunitaria.', 'Mejora el circuito comunitario modelado.'),
        'scenario_d': ('D', 'Paquete combinado expandido (A+B+C+capacidad clínica)', 'Paquete combinado de acceso, financiamiento, comunidad y capacidad clínica.', 'Combina A, B y C con 95% modelado de cobertura de personal 24/7, disponibilidad de sangre y de uterotónicos.'),
    },
}

LANGUAGES = {'English': 'en', 'Español': 'es'}

# =========================================================
# LANGUAGE SELECTION (first widget; preserved across switches)
# =========================================================
_language_label = st.sidebar.radio(
    STRINGS['en']['language_label'] + ' / ' + STRINGS['es']['language_label'],
    options=list(LANGUAGES),
    index=0,
    horizontal=True,
    key='language_picker',
)
LANG = LANGUAGES[_language_label]


def t(key: str, **kwargs) -> str:
    """Translate a key in the active language, falling back to English."""
    template = STRINGS.get(LANG, {}).get(key) or STRINGS['en'].get(key) or key
    try:
        return template.format(**kwargs)
    except (KeyError, IndexError):
        return template


def scenario_text(scenario_id: str) -> tuple[str, str, str, str]:
    """(letter, name, description, mechanism) of a scenario in the active language."""
    entry = SCENARIO_TEXT.get(LANG, {}).get(scenario_id) or SCENARIO_TEXT['en'][scenario_id]
    return entry


# =========================================================
# NO HARDCODED DATA (STRICT DB ENFORCEMENT)
# =========================================================
# DEMO_DISTRICTS has been removed to ensure the system strictly
# consumes empirical data from the PostgreSQL database.

SCENARIO_COLORS = ['#95a5a6', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c']
SCENARIO_IDS = [s['id'] for s in SCENARIO_DEFINITIONS]
COLORS_MAP = {sid: SCENARIO_COLORS[i % len(SCENARIO_COLORS)] for i, sid in enumerate(SCENARIO_IDS)}
DEFAULT_SCENARIO_ID = 'scenario_d' if 'scenario_d' in SCENARIO_IDS else SCENARIO_IDS[-1]


def money(value) -> str:
    """Format a currency metric that the engine may report as None."""
    if value is None:
        return t('na')
    return f"${value:,.0f}"


def pct(value, digits=1) -> str:
    if value is None:
        return t('na')
    return f"{value:.{digits}%}"


def render_statistical_procedure(title: str, callable_) -> None:
    """Render one statistical procedure; unavailable procedures are reported, never faked."""
    st.markdown(f"**{title}**")
    try:
        payload = callable_()
    except ScientificProcedureUnavailable as exc:
        st.caption(t('unavailable', msg=exc))
        return
    except Exception as exc:  # pragma: no cover - defensive UI path
        st.caption(t('eval_error', err=exc))
        return
    if not isinstance(payload, dict):
        st.caption(t('bad_response', val=payload))
        return
    for key, value in payload.items():
        if isinstance(value, float):
            st.write(f"{key}: {round(value, 4)}")
        elif isinstance(value, (list, tuple)) and len(value) <= 6:
            st.write(f"{key}: {[round(v, 3) if isinstance(v, float) else v for v in value]}")
        else:
            st.write(f"{key}: {value}")


# =========================================================
# SIDEBAR
# =========================================================

st.sidebar.markdown(f"<h1 style='text-align: center;'>{t('sidebar_title')}</h1>", unsafe_allow_html=True)
st.sidebar.markdown(f"<p style='text-align: center; color: gray;'>{t('sidebar_engine')}</p>", unsafe_allow_html=True)
st.sidebar.divider()

# =========================================================
# DATA INGESTION (ETL) PIPELINE
# =========================================================
st.sidebar.subheader(t('dhs_header'))
st.sidebar.markdown(t('dhs_desc'))

if st.sidebar.button(t('dhs_button'), type="primary", width='stretch'):
    from services.stata_etl import process_all_dhs_files

    dhs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'dhs')

    log_container = st.sidebar.empty()
    logs = []

    def streamlit_log(msg):
        logs.append(msg)
        log_container.markdown("<br>".join(logs[-10:]), unsafe_allow_html=True)

    with st.spinner(t('dhs_spinner')):
        success = process_all_dhs_files(dhs_dir, DEFAULT_DB_URL, log_callback=streamlit_log)

    if success:
        st.sidebar.success(t('dhs_success'))
        st.sidebar.info(t('dhs_info'))
    else:
        st.sidebar.error(t('dhs_error'))

st.sidebar.divider()

# District selection (labels are re-translated on language switch without
# losing the district that was already chosen).
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from main import fetch_all_districts_from_db

    live_districts = fetch_all_districts_from_db()
    if not live_districts:
        st.error(t('db_empty'))
        st.stop()
    district_options = {f"{d.name} ({d.country})": d for d in live_districts}
except Exception as e:
    st.error(t('db_error', err=e))
    st.stop()

_id_to_label = {d.id: label for label, d in district_options.items()}
if st.session_state.get('district_picker') not in district_options:
    saved_label = _id_to_label.get(st.session_state.get('district_id'))
    if saved_label:
        st.session_state['district_picker'] = saved_label

selected_district_name = st.sidebar.selectbox(
    t('select_district'),
    options=list(district_options.keys()),
    key='district_picker',
)
selected_district = district_options[selected_district_name]
st.session_state['district_id'] = selected_district.id

# Scenario selection (same treatment: the selected id survives a language switch)
scenario_label_to_id = {scenario_text(s['id'])[1]: s['id'] for s in SCENARIO_DEFINITIONS}
if st.session_state.get('scenario_picker') not in scenario_label_to_id:
    saved_label = next((label for label, sid in scenario_label_to_id.items()
                        if sid == st.session_state.get('scenario_id')), None)
    if saved_label:
        st.session_state['scenario_picker'] = saved_label

selected_scenario_name = st.sidebar.selectbox(
    t('select_scenario'),
    options=list(scenario_label_to_id.keys()),
    key='scenario_picker',
)
selected_scenario = scenario_label_to_id[selected_scenario_name]
st.session_state['scenario_id'] = selected_scenario

# Clinical capacity model (spa_247 is the engine default)
clinical_capacity_model = st.sidebar.selectbox(
    t('clinical_model'),
    options=[DEFAULT_CLINICAL_CAPACITY_MODEL, 'legacy'],
    index=0,
    help=t('clinical_help'),
    key='clinical_model_picker',
)

# Simulation parameters
st.sidebar.divider()
st.sidebar.subheader(t('sim_params'))
simulation_months = st.sidebar.slider(t('horizon'), 12, 60, 36, 12, key='horizon_picker')

# Run button
run_simulation = st.sidebar.button(t('run_button'), type="primary", width='stretch')

# =========================================================
# MAIN CONTENT
# =========================================================

st.markdown(f"<p class='main-header'>{t('app_header')}</p>", unsafe_allow_html=True)
st.markdown(t('app_subtitle'))

if run_simulation:
    with st.spinner(t('spinner_run')):
        # One run per scenario; the selected scenario reuses its own entry.
        all_results = {}
        error_message = None
        for s in SCENARIO_DEFINITIONS:
            try:
                all_results[s['id']] = SystemDynamicsEngine.simulate(
                    selected_district, s['id'], {}, simulation_months,
                    clinical_capacity_model=clinical_capacity_model,
                    equity_inputs=(quintile_coverage_by_district().get(selected_district.id)
                                   if s['id'] == selected_scenario else None),
                )
            except Exception as exc:
                error_message = t('sim_failed', sid=s['id'], err=exc)
                break
        result = all_results.get(selected_scenario)

    if error_message or result is None:
        st.error(error_message or t('sim_no_result'))
        st.stop()

    st.success(t('sim_ok', n=len(result.trajectories), integrator=result.summary.integrator,
                 dt=result.summary.dt_months, model=result.summary.clinical_capacity_model))

    # --- KEY METRICS ---
    st.subheader(t('metrics_header'))

    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        st.metric(
            t('m_baseline'),
            f"{result.summary.mmr_baseline:.0f}",
            t('m_baseline_delta'),
        )

    with col2:
        delta_mmr = result.summary.horizon_mmr - result.summary.mmr_baseline
        st.metric(
            t('m_projected'),
            f"{result.summary.horizon_mmr:.0f}",
            t('m_projected_delta', delta=delta_mmr, red=result.summary.mortality_reduction_percent),
        )

    with col3:
        st.metric(
            t('m_deaths'),
            f"{result.summary.deaths_avoided:,.0f}",
            t('m_deaths_delta', b=f"{result.summary.baseline_deaths:,.0f}",
              s=f"{result.summary.total_maternal_deaths:,.0f}"),
        )

    with col4:
        st.metric(
            t('m_cost'),
            money(result.summary.cost_per_death_avoided_usd),
            t('m_cost_delta', total=money(result.summary.total_cost_usd),
              inc=money(result.summary.incremental_cost_usd)),
        )

    with col5:
        st.metric(
            t('m_coverage'),
            f"{result.summary.anc_coverage_final:.1f}% / {result.summary.facility_delivery_rate_final:.1f}%",
            t('m_coverage_delta'),
        )

    st.caption(t('deterministic_caption'))
    st.divider()

    # --- SCENARIO COMPARISON ---
    st.subheader(t('comparison_header'))

    comparison_data = []
    for s in SCENARIO_DEFINITIONS:
        letter, name, _, _ = scenario_text(s['id'])
        r = all_results[s['id']]
        comparison_data.append({
            t('col_scenario'): f"({letter}) {name}",
            t('col_id'): s['id'],
            t('col_horizon'): r.summary.horizon_mmr,
            t('col_deaths'): r.summary.deaths_avoided,
            t('col_reduction'): r.summary.mortality_reduction_percent,
            t('col_total'): r.summary.total_cost_usd,
            t('col_incr'): r.summary.incremental_cost_usd,
            t('col_cost_death'): r.summary.cost_per_death_avoided_usd,
            t('col_anc'): r.summary.anc_coverage_final,
            t('col_fd'): r.summary.facility_delivery_rate_final,
            t('col_integrator'): r.summary.integrator,
        })

    comparison_df = pd.DataFrame(comparison_data)
    st.dataframe(comparison_df, width='stretch', hide_index=True)
    st.caption(t('comparison_caption', months=simulation_months, model=clinical_capacity_model))

    # --- TRAJECTORY PLOTS ---
    st.subheader(t('traj_header'))

    fig = go.Figure()

    for s in SCENARIO_DEFINITIONS:
        letter, name, _, _ = scenario_text(s['id'])
        r = all_results[s['id']]
        months = [t_.time_month for t_ in r.trajectories]
        mmrs = [t_.calculated_mmr for t_ in r.trajectories]

        fig.add_trace(go.Scatter(
            x=months, y=mmrs,
            mode='lines',
            name=f"({letter}) {name}",
            line=dict(color=COLORS_MAP[s['id']], width=3),
        ))

    fig.update_layout(
        xaxis_title=t('traj_x'),
        yaxis_title=t('traj_y'),
        hovermode='x unified',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        height=500,
    )

    st.plotly_chart(fig, width='stretch')
    st.caption(t('traj_caption'))

    # --- STOCK DYNAMICS ---
    st.subheader(t('stocks_header'))

    fig_stocks = make_subplots(
        rows=3, cols=3,
        subplot_titles=(t('sub_s1'), t('sub_s2'), t('sub_s3'),
                        t('sub_s4'), t('sub_s5'), t('sub_trust'),
                        t('sub_quality'), t('sub_capacity'), t('sub_staff')),
        vertical_spacing=0.08,
    )

    months = [t_.time_month for t_ in result.trajectories]

    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.pregnant_women for t_ in result.trajectories],
                                   mode='lines', name='S1', line=dict(color='#e74c3c')), row=1, col=1)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.in_anc for t_ in result.trajectories],
                                   mode='lines', name='S2', line=dict(color='#3498db')), row=1, col=2)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.in_facility_delivery for t_ in result.trajectories],
                                   mode='lines', name='S3', line=dict(color='#2ecc71')), row=1, col=3)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.in_postpartum for t_ in result.trajectories],
                                   mode='lines', name='S4', line=dict(color='#f39c12')), row=2, col=1)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.with_complications for t_ in result.trajectories],
                                   mode='lines', name='S5', line=dict(color='#9b59b6')), row=2, col=2)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.system_trust_level for t_ in result.trajectories],
                                   mode='lines', name=t('trace_trust'), line=dict(color='#1abc9c')), row=2, col=3)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.quality_factor for t_ in result.trajectories],
                                   mode='lines', name=t('trace_quality'), line=dict(color='#16a085')), row=3, col=1)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.effective_capacity for t_ in result.trajectories],
                                   mode='lines', name=t('trace_capacity'), line=dict(color='#2980b9')), row=3, col=2)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t_.effective_staff_availability for t_ in result.trajectories],
                                   mode='lines', name=t('trace_staff'), line=dict(color='#8e44ad')), row=3, col=3)

    fig_stocks.update_layout(height=800, showlegend=False)
    st.plotly_chart(fig_stocks, width='stretch')
    st.caption(t('stocks_caption'))

    # --- EQUITY ANALYSIS ---
    st.subheader(t('equity_header'))

    if not result.equity_disaggregation:
        st.info(t('equity_info'))
    else:
        col_quintile = t('col_quintile')
        col_baseline = t('m_baseline')
        col_simulated = t('col_sim_mmr')

        equity_df = pd.DataFrame([
            {
                col_quintile: q.get('quintile'),
                t('col_label'): q.get('label'),
                col_baseline: q.get('baseline_mmr'),
                col_simulated: q.get('simulated_mmr'),
                t('col_lives'): q.get('lives_saved'),
                t('col_rel_red'): q.get('relative_reduction'),
                t('col_fiscal'): q.get('fiscal_cost_usd'),
            }
            for q in result.equity_disaggregation
        ])

        col_eq1, col_eq2 = st.columns(2)

        with col_eq1:
            st.dataframe(equity_df, width='stretch', hide_index=True)

        with col_eq2:
            fig_eq = go.Figure()
            fig_eq.add_trace(go.Bar(
                x=equity_df[col_quintile],
                y=equity_df[col_baseline],
                name=t('equity_base'),
                marker_color='#e74c3c'
            ))
            fig_eq.add_trace(go.Bar(
                x=equity_df[col_quintile],
                y=equity_df[col_simulated],
                name=t('equity_sim'),
                marker_color='#2ecc71'
            ))
            fig_eq.update_layout(
                barmode='group',
                title=t('equity_chart_title'),
                yaxis_title=t('equity_chart_y'),
                height=400,
            )
            st.plotly_chart(fig_eq, width='stretch')
            st.caption(t('equity_caption'))

    # --- STATISTICAL VALIDATION ---
    st.subheader(t('val_header'))

    col_val1, col_val2, col_val3, col_val4 = st.columns(4)

    with col_val1:
        render_statistical_procedure(
            t('ks_title'),
            lambda: StatisticalValidationPy.kolmogorov_smirnov(live_districts),
        )
        render_statistical_procedure(
            t('wilcoxon_title'),
            lambda: StatisticalValidationPy.wilcoxon_signed_rank(live_districts),
        )

    with col_val2:
        render_statistical_procedure(
            t('sobol_title'),
            lambda: StatisticalValidationPy.sobol_sensitivity(selected_district),
        )

    with col_val3:
        render_statistical_procedure(
            t('boot_title'),
            lambda: StatisticalValidationPy.bootstrap_confidence_intervals(selected_district, selected_scenario),
        )
        render_statistical_procedure(
            t('external_title'),
            lambda: StatisticalValidationPy.external_validation(live_districts),
        )

    with col_val4:
        st.markdown(t('conv_title'))
        try:
            conv = SystemDynamicsEngine.convergence_check(
                selected_district, selected_scenario, simulation_months
            )
            coarse, fine = conv['0.1'], conv['0.025']
            rel_error = abs(coarse['horizon_mmr'] - fine['horizon_mmr']) / max(1e-6, fine['horizon_mmr'])
            st.write(t('conv_dt', dt='0.1', value=f"{coarse['horizon_mmr']:.2f}"))
            st.write(t('conv_dt', dt='0.025', value=f"{fine['horizon_mmr']:.2f}"))
            st.write(t('conv_rel', value=f"{rel_error:.4%}"))
            st.write(t('conv_yes') if rel_error < 0.01 else t('conv_no'))
        except Exception as exc:
            st.caption(t('eval_error', err=exc))

    st.caption(t('val_caption'))

    # --- DELAY ANALYSIS ---
    st.subheader(t('delays_header'))

    delays_df = pd.DataFrame([
        {
            'month': t_.time_month,
            'phase2': t_.phase2_delay_hours,
            'phase3': t_.phase3_delay_hours,
            'congestion': t_.facility_congestion_index,
        }
        for t_ in result.trajectories[::3]  # Every 3rd month for clarity
    ])

    fig_delays = go.Figure()
    fig_delays.add_trace(go.Scatter(
        x=delays_df['month'], y=delays_df['phase2'],
        mode='lines+markers', name=t('trace_phase2'), line=dict(color='#e74c3c')
    ))
    fig_delays.add_trace(go.Scatter(
        x=delays_df['month'], y=delays_df['phase3'],
        mode='lines+markers', name=t('trace_phase3'), line=dict(color='#3498db')
    ))
    fig_delays.add_trace(go.Scatter(
        x=delays_df['month'], y=delays_df['congestion'],
        mode='lines+markers', name=t('trace_congestion'), line=dict(color='#7f8c8d'), yaxis='y2'
    ))
    fig_delays.update_layout(
        title=t('delays_title'),
        xaxis_title=t('delays_x'),
        yaxis_title=t('delays_y'),
        yaxis2=dict(title=t('delays_y2'), overlaying='y', side='right', showgrid=False),
        height=400,
    )
    st.plotly_chart(fig_delays, width='stretch')
    st.caption(t('delays_caption'))

else:
    # Initial state - show instructions
    st.info(t('info_initial'))

    # Show district overview
    st.subheader(t('overview_header'))

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(t('ov_population'), f"{selected_district.population:,}")
    with col2:
        st.metric(t('ov_births'), f"{selected_district.annual_births:,}")
    with col3:
        st.metric(t('ov_baseline'), f"{selected_district.baseline_mmr:.0f}")
    with col4:
        st.metric(t('ov_distance'), f"{selected_district.avg_distance_to_emonc} km")

    # Show parameters
    try:
        params = build_default_parameters(selected_district)
    except Exception as exc:
        st.error(t('params_error', err=exc))
        st.stop()

    st.subheader(t('params_header'))
    param_rows = [
        {t('col_parameter'): t('param_travel'), t('col_value'): f"{params.travel_time_hours:.1f}"},
        {t('col_parameter'): t('param_road'), t('col_value'): f"{params.road_quality_index:.2f}"},
        {t('col_parameter'): t('param_fee'), t('col_value'): f"${params.facility_delivery_fee_usd:.1f}"},
        {t('col_parameter'): t('param_transport'), t('col_value'): f"${params.transport_cost_usd:.1f}"},
        {t('col_parameter'): t('param_insurance'), t('col_value'): pct(params.insurance_coverage_rate)},
        {t('col_parameter'): t('param_staff'), t('col_value'): f"{params.skilled_staff_ratio:.1f}"},
        {t('col_parameter'): t('param_staff247'),
         t('col_value'): pct(params.staff_247_availability_rate) if params.staff_247_availability_rate is not None else t('na_legacy')},
        {t('col_parameter'): t('param_non247'),
         t('col_value'): pct(params.non247_relative_capacity) if params.non247_relative_capacity is not None else t('na')},
        {t('col_parameter'): t('param_blood'), t('col_value'): pct(params.blood_availability_rate)},
        {t('col_parameter'): t('param_drugs'), t('col_value'): pct(params.oxytocin_misoprostol_stock_rate)},
        {t('col_parameter'): t('param_education'), t('col_value'): pct(params.maternal_education_rate)},
        {t('col_parameter'): t('param_tba'), t('col_value'): pct(params.tba_influence_factor)},
        {t('col_parameter'): t('param_trust'), t('col_value'): f"{params.community_trust_baseline:.2f}"},
        {t('col_parameter'): t('param_complication'), t('col_value'): pct(params.baseline_complication_rate, 2)},
    ]
    param_df = pd.DataFrame(param_rows)

    st.dataframe(param_df, width='stretch', hide_index=True)

    # Show scenario info
    st.subheader(t('scen_header'))
    for s in SCENARIO_DEFINITIONS:
        letter, name, description, mechanism = scenario_text(s['id'])
        with st.expander(f"({letter}) {name}"):
            st.write(f"**ID:** `{s['id']}`")
            st.write(f"**{t('p_description')}:** {description}")
            st.write(f"**{t('p_mechanism')}:** {mechanism}")
            st.write(f"**{t('p_cost')}:** ${s['cost_per_capita_usd']:.2f} {t('p_per_capita')}")
            if s.get('cost_source_type') or s.get('effect_source_type'):
                st.write(f"**{t('p_provenance')}:** {t('p_cost')} = {s.get('cost_source_type', 'n/a')}, "
                         f"{t('p_mechanism')} = {s.get('effect_source_type', 'n/a')}")
            rules = s.get('rules') or {}
            if rules:
                readable = {name_: f"{mode} {target}" for name_, (mode, target) in rules.items()}
                st.write(f"**{t('p_rules')}:** `{readable}`")
            else:
                st.write(f"**{t('p_rules')}:** {t('rules_none')}")
