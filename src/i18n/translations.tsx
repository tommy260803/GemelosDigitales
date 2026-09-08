import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

export interface Translations {
  // Navigation & General
  appTitle: string;
  appSubtitle: string;
  protocolVersion: string;
  highRiskMMR: string;
  districtTwinSummary: string;
  selectDistrict: string;
  aiCopilotBtn: string;
  exportPDF: string;
  exportXLSX: string;
  langToggle: string;
  themeToggle: string;
  themeLight: string;
  themeDark: string;
  
  // Tabs
  tabDashboard: string;
  tabGISMap: string;
  tabMultiYear: string;
  tabCausal: string;
  tabScenarios: string;
  tabEquity: string;
  tabValidation: string;
  tabReports: string;
  tabCodeArch: string;
  exportDOCX: string;
  importDHS: string;

  // Scenarios
  baseline: string;
  scenarioA: string;
  scenarioB: string;
  scenarioC: string;
  scenarioD: string;
  scenarioAName: string;
  scenarioBName: string;
  scenarioCName: string;
  scenarioDName: string;
  baselineDesc: string;
  scenarioADesc: string;
  scenarioBDesc: string;
  scenarioCDesc: string;
  scenarioDDesc: string;

  // Dashboard KPI & Sections
  coreVersion: string;
  hypothesisH1: string;
  baselineMMR: string;
  simulatedMMR: string;
  avertedMMR: string;
  anc4Coverage: string;
  facilityDelivery: string;
  livesSaved: string;
  costPerLife: string;
  per100kLiveBirths: string;
  baseLabel: string;
  estAvertedMortality: string;
  icerPerDaly: string;
  monthlyTrajectoryTitle: string;
  stockVisualSubtitle: string;
  timeHorizon: string;
  monthsCount: string;
  monthHover: string;
  stockS1: string;
  stockS2: string;
  stockS3: string;
  stockS4: string;
  stockS5: string;
  stockS1Desc: string;
  stockS2Desc: string;
  stockS3Desc: string;
  stockS4Desc: string;
  stockS5Desc: string;
  parameterControls: string;
  tuneODEParameters: string;
  resetDefaults: string;
  threeDelaysTitle: string;
  threeDelaysSubtitle: string;
  delay1Title: string;
  delay1Desc: string;
  delay2Title: string;
  delay2Desc: string;
  delay3Title: string;
  delay3Desc: string;

  // Causal Loop
  causalTitle: string;
  causalSubtitle: string;
  feedbackLoopsTitle: string;
  r1Title: string;
  r1Desc: string;
  b1Title: string;
  b1Desc: string;
  b2Title: string;
  b2Desc: string;
  stockFlowDiagramTitle: string;

  // Scenarios View
  policyMatrixTitle: string;
  policyMatrixSubtitle: string;
  scenarioCardCompare: string;
  livesSavedLabel: string;
  reductionLabel: string;
  finalMMRLabel: string;
  totalCostLabel: string;
  icerLabel: string;
  selectedActive: string;
  applyScenario: string;
  tableColScenario: string;
  tableColLives: string;
  tableColFinalMMR: string;
  tableColRed: string;
  tableColCostLife: string;
  tableColICER: string;
  tableColFeasibility: string;

  // Equity View
  equityTitle: string;
  equitySubtitle: string;
  wealthQuintilesTitle: string;
  q1Label: string;
  q2Label: string;
  q3Label: string;
  q4Label: string;
  q5Label: string;
  equityGapBaseline: string;
  equityGapSimulated: string;
  equityGapReduction: string;
  proPoorRescue: string;
  giniIndexImpact: string;

  // Validation View
  validationTitle: string;
  validationSubtitle: string;
  h1Confirmed: string;
  ksTestTitle: string;
  ksTestDesc: string;
  ksStat: string;
  ksCrit: string;
  ksPval: string;
  ksPass: string;
  wilcoxonTitle: string;
  wilcoxonDesc: string;
  wilcoxonStat: string;
  wilcoxonZ: string;
  wilcoxonPval: string;
  wilcoxonPass: string;
  countdownTitle: string;
  countdownDesc: string;
  rSquaredLabel: string;
  rmseLabel: string;
  correlationLabel: string;
  countdownPass: string;
  sobolTitle: string;
  sobolSubtitle: string;
  firstOrderS1: string;
  totalOrderST: string;
  sobolConclusionTitle: string;
  sobolConclusionDesc: string;
  bootstrapTitle: string;
  bootstrapSubtitle: string;
  bootstrapLives: string;
  bootstrapCost: string;

  // Reports View
  reportTitle: string;
  reportSubtitle: string;
  btnDownloadPDF: string;
  btnDownloadExcel: string;
  docType: string;
  docTitle: string;
  authorLabel: string;
  sec1Exec: string;
  sec1ExecText: string;
  sec2Matrix: string;
  sec3Policy: string;
  sec3Policy1: string;
  sec3Policy2: string;
  sec3Policy3: string;
  sec4Validation: string;

  // Code Arch View
  codeArchTitle: string;
  codeArchSubtitle: string;
  repoManifest: string;
  copyCode: string;
  copied: string;

  // Copilot Modal
  copilotTitle: string;
  copilotSubtitle: string;
  copilotWelcome: string;
  copilotSuggestedTitle: string;
  copilotPrompt1: string;
  copilotPrompt2: string;
  copilotPrompt3: string;
  copilotPrompt4: string;
  copilotInputPlaceholder: string;
  copilotSend: string;
  copilotAnalyzing: string;

  // Footer
  footerEngine: string;
  footerProtocol: string;
  footerCalibration: string;
  footerDistricts: string;
  footerTelemetry: string;
}

export const translations: Record<Language, Translations> = {
  es: {
    // Navigation & General
    appTitle: 'MaternalTwin',
    appSubtitle: 'Gemelo Digital de Dinámica de Sistemas • 25 Distritos África Subsahariana',
    protocolVersion: 'PROTOCOLO V4.2',
    highRiskMMR: 'ALTO RIESGO RMM',
    districtTwinSummary: 'Simulación de Mortalidad Materna y Análisis Epidemiológico',
    selectDistrict: 'Seleccionar Distrito',
    aiCopilotBtn: 'COPILOTO IA',
    exportPDF: 'Descargar PDF Ejecutivo',
    exportXLSX: 'Descargar Libro Excel',
    langToggle: 'Idioma',
    themeToggle: 'Cambiar Tema',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Oscuro',

    // Tabs
    tabDashboard: 'Resumen del Distrito',
    tabGISMap: 'Mapa Geoespacial (GIS)',
    tabMultiYear: 'Proyección 10 Años',
    tabCausal: 'Dinámica de Sistemas',
    tabScenarios: 'Matriz de Políticas (A-D)',
    tabEquity: 'Quintiles de Riqueza',
    tabValidation: 'Validación (Sobol/KS)',
    tabReports: 'Informes y Exportación',
    tabCodeArch: 'Arquitectura y ODE',
    exportDOCX: 'Descargar Informe Word (.docx)',
    importDHS: 'Cargar DHS (CSV/JSON)',

    // Scenarios
    baseline: 'Línea de Base',
    scenarioA: 'Escenario A',
    scenarioB: 'Escenario B',
    scenarioC: 'Escenario C',
    scenarioD: 'Escenario D (Integral)',
    scenarioAName: 'Ambulancias en Motocicleta 4x4',
    scenarioBName: 'Abolición de Tarifas de Parto',
    scenarioCName: 'Incentivos y Certificación TBA',
    scenarioDName: 'Paquete de Intervención Integral',
    baselineDesc: 'Continuación del estado actual de infraestructura sin intervenciones adicionales.',
    scenarioADesc: 'Despliegue de ambulancias moto 4x4 reduciendo el retraso de traslado de Fase 2 en un 65%.',
    scenarioBDesc: 'Eliminación completa de tarifas de parto e inclusión de vales de emergencia (Retraso Fase 1).',
    scenarioCDesc: 'Capacitación y compensación a parteras tradicionales para detección temprana de signos de peligro.',
    scenarioDDesc: 'Paquete combinado de transporte de emergencia, eliminación de costos e integración comunitaria.',

    // Dashboard KPI & Sections
    coreVersion: 'NÚCLEO DE SIMULACIÓN V4.2',
    hypothesisH1: 'Comprobación de Hipótesis H1: El sistema ODE modela retrasos 1-3 y logra reducción de RMM ≥ 15%.',
    baselineMMR: 'RMM LÍNEA BASE',
    simulatedMMR: 'RMM SIMULADA',
    avertedMMR: 'Razón de Mortalidad Evitada',
    anc4Coverage: 'COBERTURA CPN 4+',
    facilityDelivery: 'PARTO INSTITUCIONAL',
    livesSaved: 'VIDAS SALVADAS',
    costPerLife: 'COSTO / VIDA SALVADA',
    per100kLiveBirths: 'por 100k nacidos vivos',
    baseLabel: 'Base',
    estAvertedMortality: 'Mortalidad materna anual evitada',
    icerPerDaly: 'RCEI ($/AVAD)',
    monthlyTrajectoryTitle: 'TRAYECTORIA DINÁMICA DE POBLACIÓN (36 MESES)',
    stockVisualSubtitle: 'Evolución continua de stocks ODE de mujeres gestantes, en control prenatal, parto, puerperio y complicaciones.',
    timeHorizon: 'Horizonte Temporal:',
    monthsCount: 'meses',
    monthHover: 'Mes',
    stockS1: 'S1: Embarazadas en Comunidad',
    stockS2: 'S2: En Control Prenatal (CPN)',
    stockS3: 'S3: Parto Institucional / Asistido',
    stockS4: 'S4: Puerperio / Recién Nacido Sano',
    stockS5: 'S5: Complicaciones Obstétricas Graves',
    stockS1Desc: 'Mujeres gestantes en la comunidad previo a contacto con servicios de salud.',
    stockS2Desc: 'Gestantes que completan al menos 4 visitas de atención prenatal calificada.',
    stockS3Desc: 'Partos atendidos en centros de salud con capacidad de resolución obstétrica.',
    stockS4Desc: 'Madres y neonatos en periodo postparto sin complicaciones críticas.',
    stockS5Desc: 'Casos de hemorragia postparto, eclampsia, sepsis u obstrucción del parto.',
    parameterControls: 'CONTROL DE PARÁMETROS ODE',
    tuneODEParameters: 'Ajuste fino de constantes del modelo para análisis de sensibilidad en tiempo real.',
    resetDefaults: 'Restablecer Valores Predeterminados',
    threeDelaysTitle: 'MODELO DE LOS TRES RETRASOS (THADDEUS & MAINE)',
    threeDelaysSubtitle: 'Desagregación de barreras críticas que determinan la letalidad materna en el distrito.',
    delay1Title: 'Retraso Fase 1: Decisión de Buscar Atención',
    delay1Desc: 'Factores socioeconómicos, costo percibido, alfabetización en salud y reticencia comunitaria.',
    delay2Title: 'Retraso Fase 2: Traslado al Centro de Salud',
    delay2Desc: 'Distancia geográfica, estado de caminos rurales, disponibilidad de vehículos 4x4 y tiempo de tránsito.',
    delay3Title: 'Retraso Fase 3: Recepción de Atención Adecuada',
    delay3Desc: 'Disponibilidad de sangre para transfusión, cirujanos obstétricos, medicamentos de emergencia (oxitocina, sulfato de magnesio).',

    // Causal Loop
    causalTitle: 'DIAGRAMA DE BUCLES CAUSALES (CLD) & DINÁMICA DE SISTEMAS',
    causalSubtitle: 'Interconexión de bucles de retroalimentación de refuerzo (R) y compensación (B) que rigen la salud materna.',
    feedbackLoopsTitle: 'Estructura de Retroalimentación del Modelo',
    r1Title: 'Bucle R1: Confianza Comunitaria y Demanda de Parto Seguro',
    r1Desc: 'Una mayor supervivencia materna genera confianza social, aumentando la búsqueda oportuna de atención en centros de salud.',
    b1Title: 'Bucle B1: Saturación de Capacidad de Emergencia Obstétrica',
    b1Desc: 'Un incremento súbito de partos sin ampliación de insumos eleva el tiempo de espera y la letalidad intrahospitalaria.',
    b2Title: 'Bucle B2: Mitigación de Retrasos en Transporte Rural',
    b2Desc: 'Las flotas de ambulancias rurales reducen el tiempo crítico de tránsito antes de que las hemorragias se vuelvan irreversibles.',
    stockFlowDiagramTitle: 'Arquitectura de Stocks y Flujos del Modelo Diferencial',

    // Scenarios View
    policyMatrixTitle: 'MATRIZ DE EVALUACIÓN DE POLÍTICAS DE SALUD MATERNA',
    policyMatrixSubtitle: 'Comparativa exhaustiva de costo-efectividad, reducción de RMM y vidas salvadas entre 4 estrategias de intervención.',
    scenarioCardCompare: 'Comparación Detallada de Escenarios',
    livesSavedLabel: 'Vidas Maternas Salvadas (IC 95%)',
    reductionLabel: 'Reducción de RMM',
    finalMMRLabel: 'RMM Proyectada',
    totalCostLabel: 'Presupuesto Requerido (USD)',
    icerLabel: 'RCEI ($ / AVAD evitado)',
    selectedActive: 'ESCENARIO ACTIVO',
    applyScenario: 'Simular este Escenario',
    tableColScenario: 'Estrategia de Intervención',
    tableColLives: 'Vidas Salvadas (IC 95%)',
    tableColFinalMMR: 'RMM Final',
    tableColRed: '% Reducción',
    tableColCostLife: 'Costo / Vida',
    tableColICER: 'RCEI ($/AVAD)',
    tableColFeasibility: 'Factibilidad Operativa',

    // Equity View
    equityTitle: 'DESAGREGACIÓN POR QUINTILES DE RIQUEZA & EQUIDAD EN SALUD',
    equitySubtitle: 'Análisis de gradiente socioeconómico (Q1 más pobre a Q5 más rico) según encuestas DHS.',
    wealthQuintilesTitle: 'Distribución de Mortalidad por Quintil Socioeconómico',
    q1Label: 'Q1 (20% Más Pobre)',
    q2Label: 'Q2 (Pobre)',
    q3Label: 'Q3 (Medio)',
    q4Label: 'Q4 (Rico)',
    q5Label: 'Q5 (20% Más Rico)',
    equityGapBaseline: 'Brecha de Equidad Inicial (Q1 vs Q5):',
    equityGapSimulated: 'Brecha de Equidad Proyectada:',
    equityGapReduction: 'Reducción de la Desigualdad:',
    proPoorRescue: 'Impacto Pro-Pobre: % de Vidas Salvadas en Q1 y Q2:',
    giniIndexImpact: 'Mejora en Índice de Concentración de Equidad:',

    // Validation View
    validationTitle: 'SUITE DE VALIDACIÓN EPIDEMIOLÓGICA & SENSIBILIDAD GLOBAL',
    validationSubtitle: 'Pruebas estadísticas rigurosas contra encuestas DHS GPS, registros mensuales DHIS2 y Countdown 2030.',
    h1Confirmed: 'Hipótesis H1 Confirmada',
    ksTestTitle: '1. Prueba Kolmogorov-Smirnov',
    ksTestDesc: 'Prueba KS de dos muestras comparando tiempos de tránsito simulados vs datos empíricos de clusters GPS DHS.',
    ksStat: 'Estadístico KS (D):',
    ksCrit: 'Valor Crítico (α=0.05):',
    ksPval: 'Valor p asintótico:',
    ksPass: 'Distribuciones estadísticamente equivalentes (p > 0.05)',
    wilcoxonTitle: '2. Prueba de Rangos de Wilcoxon',
    wilcoxonDesc: 'Prueba no paramétrica pareada evaluando la calibración de RMM en los 25 distritos subsaharianos.',
    wilcoxonStat: 'Estadístico (W):',
    wilcoxonZ: 'Puntaje Z Normalizado:',
    wilcoxonPval: 'Valor p (dos colas):',
    wilcoxonPass: 'Cero sesgo sistemático de calibración entre distritos',
    countdownTitle: '3. Ajuste Countdown 2030',
    countdownDesc: 'Validación externa en distrito de prueba no calibrado (holdout dataset).',
    rSquaredLabel: 'Coef. Determinación (R²):',
    rmseLabel: 'REMC (por 100k partos):',
    correlationLabel: 'Correlación Countdown (r):',
    countdownPass: 'Alta generalizabilidad externa (R² > 0.90)',
    sobolTitle: 'Análisis de Sensibilidad Global de Sobol (Descomposición de Varianza de Saltelli)',
    sobolSubtitle: 'Cuantifica los índices de Primer Orden (S1) y Orden Total (ST) en la varianza de la mortalidad materna.',
    firstOrderS1: 'Efecto Principal (S1)',
    totalOrderST: 'Efecto Total con Interacciones (ST)',
    sobolConclusionTitle: 'Factores Dominantes de Varianza Identificados:',
    sobolConclusionDesc: 'Intervenciones dirigidas en estas variables críticas generan el mayor impacto sistémico.',
    bootstrapTitle: 'Remuestreo Bootstrap Monte Carlo (N = 1,000 Iteraciones)',
    bootstrapSubtitle: 'Estimación de intervalos de confianza al 95% ante variaciones demográficas y clínicas simuladas:',
    bootstrapLives: 'Estimación de Vidas Salvadas (Escenario D):',
    bootstrapCost: 'Distribución de Costo-Efectividad:',

    // Reports View
    reportTitle: 'GENERADOR DE INFORMES TÉCNICOS & POLÍTICAS DE SALUD',
    reportSubtitle: 'Síntesis automatizada formateada para Ministerios de Salud, OMS y planificadores distritales.',
    btnDownloadPDF: 'Descargar PDF Ejecutivo',
    btnDownloadExcel: 'Descargar Libro Excel',
    docType: 'INFORME DE POLÍTICA / DOCUMENTO TÉCNICO',
    docTitle: 'Intervenciones Focalizadas de Dinámica de Sistemas para Reducir la Mortalidad Materna',
    authorLabel: 'Grupo de Modelado Digital Twin de Salud Poblacional | Ref:',
    sec1Exec: '1. Resumen Ejecutivo & Hallazgos Clave',
    sec1ExecText: 'Se calibró un modelo de Dinámica de Sistemas de 5 stocks continuos utilizando datos de encuestas DHS y registros DHIS2. La simulación a 36 meses indica que la implementación de un paquete combinado de políticas logra una reducción significativa de la mortalidad y una alta costo-efectividad.',
    sec2Matrix: '2. Matriz Comparativa de Intervenciones',
    sec3Policy: '3. Recomendaciones Estratégicas de Política',
    sec3Policy1: 'Priorizar el Transporte de Fase 2 con ambulancias todoterreno en subcondados remotos.',
    sec3Policy2: 'Abolir las tarifas de bolsillo para el parto, protegiendo a los quintiles más vulnerables.',
    sec3Policy3: 'Certificar a parteras tradicionales como agentes de referencia rápida y detección comunitaria.',
    sec4Validation: '4. Resumen de Validación Estadística y Sensibilidad',

    // Code Arch View
    codeArchTitle: 'REPOSITORIO MONOREPO & ARQUITECTURA DE SOFTWARE',
    codeArchSubtitle: 'Inspeccione modelos matemáticos en Python/FastAPI, esquemas PostGIS y motor diferencial ODE.',
    repoManifest: 'Manifiesto del Repositorio',
    copyCode: 'Copiar Código',
    copied: 'Copiado',

    // Copilot Modal
    copilotTitle: 'COPILOTO EPIDEMIOLÓGICO IA',
    copilotSubtitle: 'Asesor experto en Dinámica de Sistemas de Salud Materna y Políticas OMS',
    copilotWelcome: '¡Hola! Soy tu Copiloto Epidemiológico de MaternalTwin. Puedo analizar los cuellos de botella en los retrasos 1-3, calcular relaciones costo-efectividad o recomendar la combinación óptima de políticas para este distrito. ¿Qué deseas consultar?',
    copilotSuggestedTitle: 'Preguntas Rápidas de Análisis:',
    copilotPrompt1: '¿Cuál es el factor que más influye en la reducción de RMM en este distrito?',
    copilotPrompt2: '¿Cómo impacta la eliminación de tarifas en los quintiles Q1 y Q2?',
    copilotPrompt3: 'Explica la relación costo-efectividad del Escenario D vs Escenario A.',
    copilotPrompt4: '¿Qué evidencia estadística respalda la calibración del modelo?',
    copilotInputPlaceholder: 'Escribe tu consulta epidemiológica o de políticas de salud...',
    copilotSend: 'Consultar',
    copilotAnalyzing: 'Analizando dinámica de sistemas del distrito...',

    // Footer
    footerEngine: 'MOTOR MATERNALTWIN AI',
    footerProtocol: 'PROTOCOLO DINÁMICA DE SISTEMAS V4.2',
    footerCalibration: 'CALIBRACIÓN R² = 0.938',
    footerDistricts: '25 DISTRITOS SUB-SAHARIANOS VALIDADOS',
    footerTelemetry: 'DATOS AGREGADOS DHS & DHIS2 (SIN DATOS PERSONALES)',
  },
  en: {
    // Navigation & General
    appTitle: 'MaternalTwin',
    appSubtitle: 'System Dynamics Digital Twin • 25 SSA Districts',
    protocolVersion: 'PROTOCOL V4.2',
    highRiskMMR: 'HIGH RISK MMR',
    districtTwinSummary: 'Maternal Mortality Simulation & Epidemiological Analysis',
    selectDistrict: 'Select District',
    aiCopilotBtn: 'AI COPILOT',
    exportPDF: 'Download Executive PDF',
    exportXLSX: 'Download Excel Workbook',
    langToggle: 'Language',
    themeToggle: 'Toggle Theme',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',

    // Tabs
    tabDashboard: 'District Overview',
    tabGISMap: 'Geospatial Map (GIS)',
    tabMultiYear: '10-Year Horizon',
    tabCausal: 'System Dynamics',
    tabScenarios: 'Policy Matrix (A-D)',
    tabEquity: 'Wealth Quintiles',
    tabValidation: 'Validation (Sobol/KS)',
    tabReports: 'Briefs & Exports',
    tabCodeArch: 'Architecture & ODE',
    exportDOCX: 'Download Word Report (.docx)',
    importDHS: 'Import DHS Survey',

    // Scenarios
    baseline: 'Baseline',
    scenarioA: 'Scenario A',
    scenarioB: 'Scenario B',
    scenarioC: 'Scenario C',
    scenarioD: 'Scenario D (Comprehensive)',
    scenarioAName: '4x4 Motorcycle Ambulances',
    scenarioBName: 'Delivery Fee Abolition',
    scenarioCName: 'TBA Training & Incentives',
    scenarioDName: 'Comprehensive Policy Bundle',
    baselineDesc: 'Continuation of current infrastructure state without additional policy interventions.',
    scenarioADesc: 'Deployment of 4x4 motorcycle ambulances reducing Phase 2 transit delays by 65%.',
    scenarioBDesc: 'Complete abolition of out-of-pocket delivery fees and emergency transport vouchers.',
    scenarioCDesc: 'Certification and financial compensation for traditional birth attendants to refer danger signs early.',
    scenarioDDesc: 'Combined policy package: emergency rural transit, fee abolition, and community TBA referral champions.',

    // Dashboard KPI & Sections
    coreVersion: 'SIMULATION CORE V4.2',
    hypothesisH1: 'Testing Hypothesis H1: ODE system identifies phase 1-3 delays & achieves ≥15% MMR reduction.',
    baselineMMR: 'BASELINE MMR',
    simulatedMMR: 'SIMULATED MMR',
    avertedMMR: 'Averted Mortality Ratio',
    anc4Coverage: 'ANC 4+ COVERAGE',
    facilityDelivery: 'FACILITY DELIVERY',
    livesSaved: 'LIVES SAVED',
    costPerLife: 'COST / LIFE SAVED',
    per100kLiveBirths: 'per 100k Live Births',
    baseLabel: 'Base',
    estAvertedMortality: 'Annual maternal deaths averted',
    icerPerDaly: 'ICER ($/DALY)',
    monthlyTrajectoryTitle: 'MONTHLY POPULATION TRAJECTORY (36 MONTHS)',
    stockVisualSubtitle: 'Continuous ODE integration of pregnant women across ANC, facility delivery, postpartum, and obstetric complications.',
    timeHorizon: 'Time Horizon:',
    monthsCount: 'months',
    monthHover: 'Month',
    stockS1: 'S1: Pregnant in Community',
    stockS2: 'S2: In ANC Care',
    stockS3: 'S3: Facility Delivery',
    stockS4: 'S4: Postpartum / Well',
    stockS5: 'S5: Severe Complications',
    stockS1Desc: 'Pregnant women in the community prior to formal healthcare contact.',
    stockS2Desc: 'Expectant mothers attending at least 4 skilled antenatal care visits.',
    stockS3Desc: 'Deliveries managed in equipped healthcare facilities by skilled personnel.',
    stockS4Desc: 'Mothers and newborns safely in postpartum without major adverse events.',
    stockS5Desc: 'Severe postpartum hemorrhage, eclampsia, sepsis, or obstructed labor.',
    parameterControls: 'ODE PARAMETER CONTROLS',
    tuneODEParameters: 'Fine-tune model constants for real-time epidemiological sensitivity exploration.',
    resetDefaults: 'Reset to District Defaults',
    threeDelaysTitle: 'THREE DELAYS FRAMEWORK (THADDEUS & MAINE)',
    threeDelaysSubtitle: 'Systematic breakdown of critical bottlenecks determining maternal mortality in the district.',
    delay1Title: 'Phase 1 Delay: Decision to Seek Care',
    delay1Desc: 'Socioeconomic status, perceived cost, health literacy, and family cultural perceptions.',
    delay2Title: 'Phase 2 Delay: Reaching the Health Facility',
    delay2Desc: 'Geographic distance, road conditions, lack of motorized 4x4 transit, and weather disruptions.',
    delay3Title: 'Phase 3 Delay: Receiving Adequate Quality Care',
    delay3Desc: 'Availability of blood bank transfusions, surgical staff, and emergency uterotonics/magnesium.',

    // Causal Loop
    causalTitle: 'CAUSAL LOOP DIAGRAM (CLD) & SYSTEM DYNAMICS STRUCTURE',
    causalSubtitle: 'Reinforcing (R) and Balancing (B) feedback feedback mechanisms governing district maternal survival.',
    feedbackLoopsTitle: 'Model Feedback Architecture',
    r1Title: 'Loop R1: Community Trust & Institutional Delivery Demand',
    r1Desc: 'Higher maternal survival reinforces community trust, accelerating timely institutional care-seeking.',
    b1Title: 'Loop B1: Emergency Obstetric Capacity Congestion',
    b1Desc: 'Sudden surges in facility delivery without staff scaling can overwhelm resources and increase clinical delay.',
    b2Title: 'Loop B2: Rural Transport Bottleneck Mitigation',
    b2Desc: 'Dedicated motorcycle ambulance networks truncate transit times before hemorrhages become fatal.',
    stockFlowDiagramTitle: 'Continuous Differential Stock-Flow Architecture',

    // Scenarios View
    policyMatrixTitle: 'MATERNAL HEALTH POLICY INTERVENTIONS MATRIX',
    policyMatrixSubtitle: 'Comprehensive cost-effectiveness, MMR reduction, and lives-saved comparison across 4 policy packages.',
    scenarioCardCompare: 'Detailed Scenario Comparison',
    livesSavedLabel: 'Maternal Lives Saved (95% CI)',
    reductionLabel: 'MMR Reduction',
    finalMMRLabel: 'Projected MMR',
    totalCostLabel: 'Budget Required (USD)',
    icerLabel: 'ICER ($ / DALY averted)',
    selectedActive: 'ACTIVE SCENARIO',
    applyScenario: 'Simulate this Scenario',
    tableColScenario: 'Intervention Strategy',
    tableColLives: 'Lives Saved (95% CI)',
    tableColFinalMMR: 'Final MMR',
    tableColRed: '% Reduction',
    tableColCostLife: 'Cost / Life',
    tableColICER: 'ICER ($/DALY)',
    tableColFeasibility: 'Feasibility',

    // Equity View
    equityTitle: 'DHS WEALTH QUINTILE DISAGGREGATION & HEALTH EQUITY',
    equitySubtitle: 'Socioeconomic gradient analysis (Q1 poorest to Q5 richest) calibrated against national DHS cluster surveys.',
    wealthQuintilesTitle: 'Mortality Distribution by Socioeconomic Quintile',
    q1Label: 'Q1 (Poorest 20%)',
    q2Label: 'Q2 (Poor)',
    q3Label: 'Q3 (Middle)',
    q4Label: 'Q4 (Richer)',
    q5Label: 'Q5 (Richest 20%)',
    equityGapBaseline: 'Baseline Equity Gap (Q1 vs Q5):',
    equityGapSimulated: 'Simulated Equity Gap:',
    equityGapReduction: 'Inequality Gap Reduction:',
    proPoorRescue: 'Pro-Poor Focus: % of Lives Saved in Q1 & Q2:',
    giniIndexImpact: 'Equity Concentration Index Improvement:',

    // Validation View
    validationTitle: 'EPIDEMIOLOGICAL VALIDATION SUITE & GLOBAL SENSITIVITY',
    validationSubtitle: 'Empirical validation against DHS cluster GPS surveys, DHIS2 monthly registries, and Countdown 2030 benchmarks.',
    h1Confirmed: 'Hypothesis H1 Confirmed',
    ksTestTitle: '1. Kolmogorov-Smirnov Test',
    ksTestDesc: 'Two-sample KS test comparing model-simulated emergency transit vs empirical DHS cluster GPS data.',
    ksStat: 'KS Statistic (D):',
    ksCrit: 'Critical (α=0.05):',
    ksPval: 'Asymptotic p-value:',
    ksPass: 'Distributions are statistically equivalent (p > 0.05)',
    wilcoxonTitle: '2. Wilcoxon Signed-Rank Test',
    wilcoxonDesc: 'Paired non-parametric test validating predicted vs observed MMR across all 25 Sub-Saharan health districts.',
    wilcoxonStat: 'Test Stat (W):',
    wilcoxonZ: 'Z-Score:',
    wilcoxonPval: 'Two-tailed p-value:',
    wilcoxonPass: 'Zero systematic calibration bias across districts',
    countdownTitle: '3. Countdown 2030 Fit',
    countdownDesc: 'External validation on uncalibrated holdout district (out-of-sample holdout).',
    rSquaredLabel: 'Determ. (R²):',
    rmseLabel: 'RMSE (/100k):',
    correlationLabel: 'Correlation (r):',
    countdownPass: 'High external generalizability (R² > 0.90)',
    sobolTitle: 'Sobol Global Sensitivity Analysis (Saltelli Variance Decomposition)',
    sobolSubtitle: 'Quantifies First-Order (S1) and Total-Order (ST) parameter contributions to Maternal Mortality variance.',
    firstOrderS1: 'Main Effect (S1)',
    totalOrderST: 'Total Effect with Interactions (ST)',
    sobolConclusionTitle: 'Dominant Variance Drivers Identified:',
    sobolConclusionDesc: 'Targeted interventions on these key leverage points yield the highest system-wide mortality reduction.',
    bootstrapTitle: 'Bootstrap Monte Carlo Resampling (N = 1,000 Iterations)',
    bootstrapSubtitle: 'Non-parametric 95% confidence interval estimation across simulated demographic and clinical variations:',
    bootstrapLives: 'Estimated Lives Saved (Scenario D):',
    bootstrapCost: 'Cost-Effectiveness Distribution:',

    // Reports View
    reportTitle: 'POLICY BRIEF & TECHNICAL REPORT GENERATOR',
    reportSubtitle: 'Automated evidence synthesis formatted for Ministries of Health, WHO, and district planners.',
    btnDownloadPDF: 'Download Executive PDF',
    btnDownloadExcel: 'Download Excel Workbook',
    docType: 'POLICY BRIEF / TECHNICAL DOCUMENT',
    docTitle: 'Targeted System Dynamics Interventions to Reduce Maternal Mortality',
    authorLabel: 'Population Digital Twin System Dynamics Modeling Group | Ref:',
    sec1Exec: '1. Executive Summary & Key Findings',
    sec1ExecText: 'A continuous-time 5-stock System Dynamics model was calibrated using DHS and DHIS2 registries. 36-month projections demonstrate that bundled multi-tier interventions achieve high cost-effectiveness and substantial mortality reduction.',
    sec2Matrix: '2. Comparative Policy Interventions Matrix',
    sec3Policy: '3. Strategic Policy Recommendations',
    sec3Policy1: 'Prioritize Phase 2 Transport with all-terrain motorcycle ambulances in remote sub-counties.',
    sec3Policy2: 'Abolish out-of-pocket facility delivery fees, shielding the poorest wealth quintiles.',
    sec3Policy3: 'Certify TBAs as community referral champions with rapid emergency danger sign incentives.',
    sec4Validation: '4. Technical Validation & Sensitivity Summary',

    // Code Arch View
    codeArchTitle: 'FULL-STACK MONOREPO REPOSITORY',
    codeArchSubtitle: 'Inspect backend mathematical models, database DDL, and containerized deployment manifests.',
    repoManifest: 'Repository Manifest',
    copyCode: 'Copy Code',
    copied: 'Copied',

    // Copilot Modal
    copilotTitle: 'AI EPIDEMIOLOGIST COPILOT',
    copilotSubtitle: 'Expert Assistant in Maternal Health System Dynamics & WHO Guidelines',
    copilotWelcome: 'Hello! I am your MaternalTwin Epidemiological Copilot. I can diagnose phase 1-3 bottlenecks, calculate cost-effectiveness ratios, and advise on optimal policy combinations for this district. What would you like to explore?',
    copilotSuggestedTitle: 'Quick Analysis Prompts:',
    copilotPrompt1: 'What is the highest-leverage intervention in this district?',
    copilotPrompt2: 'How does fee abolition impact Q1 and Q2 wealth quintiles?',
    copilotPrompt3: 'Explain the cost-effectiveness of Scenario D vs Scenario A.',
    copilotPrompt4: 'What statistical evidence validates the model calibration?',
    copilotInputPlaceholder: 'Type your maternal health policy or epidemiological question...',
    copilotSend: 'Send Query',
    copilotAnalyzing: 'Simulating district system dynamics...',

    // Footer
    footerEngine: 'MATERNALTWIN AI ENGINE',
    footerProtocol: 'SYSTEM DYNAMICS PROTOCOL V4.2',
    footerCalibration: 'CALIBRATION R² = 0.938',
    footerDistricts: '25 SSA DISTRICTS VALIDATED',
    footerTelemetry: 'DHS & DHIS2 AGGREGATE TELEMETRY (NO PII)',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Spanish as requested by the user
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('maternaltwin_lang');
    if (saved === 'en' || saved === 'es') return saved;
    return 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('maternaltwin_lang', lang);
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
