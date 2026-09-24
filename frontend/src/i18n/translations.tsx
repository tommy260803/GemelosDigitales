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

  // Navbar groups
  groupExplore: string;
  groupAnalyze: string;
  groupOutputs: string;
  collapseSidebar: string;
  expandSidebar: string;
  switchLanguage: string;
  exportLabel: string;

  // Dashboard inline translations
  dashboardSubtitle: string;
  selectIntervention: string;
  keyResult: string;
  baselineDescription: string;
  scenarioResultText: string;
  modelEstimate: string;
  monthlyStockTrajectory: string;
  parametersLabel: string;
  stockS1Short: string;
  stockS2Short: string;
  stockS3Short: string;
  stockS4Short: string;
  stockS5Short: string;
  scaleDualAmpDesc: string;
  scaleLinearDesc: string;
  scaleLogDesc: string;
  travelTimeParam: string;
  deliveryFeeParam: string;
  skilledStaffParam: string;
  bloodBankParam: string;
  oxytocinStockParam: string;
  femaleEducationParam: string;
  instantaneousStocks: string;
  pregnantStock: string;
  ancStock: string;
  facilityDeliveryStock: string;
  complicationsStock: string;
  feedbackLoops: string;
  trustR1: string;
  congestionB1: string;
  phase2Transit: string;
  phase3Triage: string;
  identifiedBottlenecks: string;
  geographicDelay: string;
  geographicDelayDesc: string;
  financialBarrier: string;
  financialBarrierDesc: string;
  compareOtherScenarios: string;
  livesLabel: string;
  costLabel: string;
  activeLabel: string;

  // Scenario view inline
  scenarioLabel: string;
  mechanismLabel: string;
  livesSavedCI: string;
  mmrReductionLabel: string;
  costPerLifeLabel: string;
  icerPerDalyLabel: string;
  whoThreshold: string;
  highlyCostEffective: string;
  policyComparisonMatrix: string;
  comparativeAnalysisFor: string;
  highImpact: string;
  selectScenario: string;
  activeScenarioLabel: string;
  fullCostEffectivenessMatrix: string;
  synergyTitle: string;
  synergyDesc: string;

  // Validation view (ALL missing)
  validationSuiteTitle: string;
  validationSuiteSubtitle: string;
  hypothesisH1Confirmed: string;
  kolmogorovSmirnovTitle: string;
  kolmogorovSmirnovDesc: string;
  transitTimesBadge: string;
  ksStatistic: string;
  ksCritical: string;
  ksPvalue: string;
  ksPassDesc: string;
  wilcoxonSignedRankTitle: string;
  wilcoxonSignedRankDesc: string;
  districtsBadge: string;
  wilcoxonPvalue: string;
  wilcoxonPassDesc: string;
  countdownFitTitle: string;
  countdownFitDesc: string;
  holdoutTestBadge: string;
  rSquared: string;
  rmse: string;
  correlation: string;
  countdownPassDesc: string;
  sobolSensitivityTitle: string;
  sobolSensitivityDesc: string;
  saltelliBadge: string;
  sobolDominantTitle: string;
  sobolDominantDesc: string;
  hypothesisCertTitle: string;
  hypothesisCertDesc: string;
  h0Rejected: string;
  h1ConfirmedBadge: string;
  bottleneckLabel: string;
  varianceLabel: string;
  actionLabel: string;
  totalVarianceExplained: string;
  requiredThreshold: string;
  scenarioDReduction: string;
  requiredReduction: string;
  monteCarloTitle: string;
  monteCarloDesc: string;
  runButton: string;
  progressLabel: string;
  throughputLabel: string;
  iterationsLabel: string;
  convergenceLabel: string;
  errorStandardLabel: string;
  varianceLabel2: string;
  icLivesLabel: string;
  mediaLabel: string;
  histogramTitle: string;

  // Multi-year view inline
  multiYearTitle: string;
  multiYearSubtitle: string;
  tenYearLivesSaved: string;
  cumulativeMothersSaved: string;
  sdgTargetMilestone: string;
  mmrReaches: string;
  gapRemaining: string;
  cumulativeFiscalInvestment: string;
  yearlyAverage: string;
  costPerLifeTenYear: string;
  highlyCostEffectiveOMS: string;
  multiYearTrajectories: string;
  decadalMatrix: string;
  yearHeader: string;
  baselineHeader: string;
  scenarioAHeader: string;
  scenarioBHeader: string;
  scenarioCHeader: string;
  scenarioDHeader: string;
  sdgGapHeader: string;
  cumulativeLivesHeader: string;
  investmentHeader: string;
  costPerLifeHeader: string;
  sdgAchieved: string;
  inProcess: string;
  yearsLabel: string;

  // Geospatial view inline
  geospatialTitle: string;
  geospatialSubtitle: string;
  allCountriesLabel: string;
  verticalExagLabel: string;
  barriersLabel: string;
  contourLinesLabel: string;
  simulateRouteLabel: string;
  baselineRouteLabel: string;
  scenarioARouteLabel: string;
  scenarioBRouteLabel: string;
  scenarioCRouteLabel: string;
  scenarioDRouteLabel: string;
  tooltipDistance: string;
  tooltipAltitude: string;
  tooltipSlope: string;
  layer2DLabel: string;
  lowLabel: string;
  highLabel: string;
  rmmMetric: string;
  livesMetric: string;
  transitMetric: string;
  deliveryMetric: string;
  facilitiesMetric: string;
  visibleDistricts: string;
  accessibilityIndex: string;
  slopeUnder10: string;
  slopeOver15: string;
  popUnder2h: string;
  terrainFriction: string;
  phase2Correlation: string;
  sdTimeLabel: string;
  time3DStandard: string;
  time3DMoto: string;
  warningLabel: string;
  terrainDiscrepancy: string;
  emoncFacilities: string;
  loadDistrict: string;
  bedsLabel: string;
  cesareanLabel: string;
  noSurgeryLabel: string;

  // Role labels
  roleInvestigator: string;
  roleDHO: string;
  rolePolicymaker: string;

  // Equity View (extended)
  equitySocioeconomicTitle: string;
  equitySubtitleQuintiles: string;
  evaluatingEquityImpact: string;
  inequalityGapLabel: string;
  baselineGapLabel: string;
  narrowingGap: string;
  proPoorConcentration: string;
  livesSavedPercent: string;
  accrueToPoor: string;
  equityIndexRanking: string;
  progressiveEquity: string;
  dhsConcIndexShift: string;
  quintileMortalityBudget: string;
  totalBudgetLabel: string;
  quintileHeader: string;
  simulatedHeader: string;
  fiscalCostHeader: string;
  equityImpactHeader: string;
  equityConcentrationBudget: string;
  comparingMortality: string;
  fiscalProPoorEquity: string;

  // Causal Loop View (extended)
  cdStockFlowTab: string;
  cdFeedbackTab: string;
  cdOdesTab: string;
  cdInteractiveMap: string;
  cdClickToInspect: string;
  cdFertilityInflow: string;
  cdActiveStock: string;
  cdR1Label: string;
  cdB1Label: string;
  cdB2Label: string;
  cdSystemDynamicsRule: string;
  cdSystemDynamicsDesc: string;
  cdOdeLabel: string;
  cdDistrictMagnitude: string;
  cdBehavioralRole: string;
  cdCalibrationDriver: string;
  cdSelectStockPrompt: string;
  cdMitigatingScenario: string;
  cdFullOdeSystem: string;
  cdRk4Integration: string;

  // Reports View (extended)
  rpTitle: string;
  rpSubtitle: string;
  rpDescription: string;
  rpExecutivePdf: string;
  rpWordDocx: string;
  rpExcelXlsx: string;
  rpPolicyBriefDoc: string;
  rpDateLabel: string;
  rpDocTitle: string;
  rpAuthor: string;
  rpExecSummaryTitle: string;
  rpExecSummaryText: string;
  rpMatrixTitle: string;
  rpRecsTitle: string;
  rpRec1Title: string;
  rpRec1Text: string;
  rpRec1Text2: string;
  rpRec2Title: string;
  rpRec2Text: string;
  rpRec2Text2: string;
  rpRec3Title: string;
  rpRec3Text: string;
  rpValidationTitle: string;
  rpKsTestLabel: string;
  rpKsTestText: string;
  rpWilcoxonLabel: string;
  rpWilcoxonText: string;
  rpGofLabel: string;
  rpGofText: string;
  rpControlLabel: string;
  rpBaseLabel: string;
  rpControlDash: string;

  // DigitalTwinProjectionCard
  dtSelectDistrict: string;
  dtSubtitle: string;
  dtProjectionTitle: string;
  dtScenarioPrefix: string;
  dtCohortLabel: string;
  dtValidationError: string;
  dtCalcError: string;
  dtProjectionErrorMsg: string;
  dtVsBase: string;
  dtVerifyCalibration: string;
  dtControlScenario: string;
  dtLivesSavedZero: string;
  dtBaselineMMR: string;
  dtObservedMMR: string;
  dtProjectedMMR: string;
  dtNoIntervention: string;
  dtDiff: string;
  dtLivesSavedLabel: string;
  dtMonthsLabel: string;
  dtMothers: string;
  dtFormula: string;
  dtCostPerLife: string;
  dtWhoCE: string;
  dtTotalInvestment: string;
  dtScientificValidation: string;
  dtBirthsLabel: string;
  dtPerYear: string;
  dtHypothesisH1: string;
  dtValidated: string;
  dtControlLine: string;
  dtSuboptimal: string;
  dtWhoThreshold: string;
  dtHighlyEffective: string;
  dtNoAdditionalCost: string;
  dtStandardEvaluation: string;

  // Terrain3DCanvas
  tcZoomIn: string;
  tcZoomOut: string;
  tcStopRotate: string;
  tcStartRotate: string;
  tcResetCamera: string;
  tcSrtmLabel: string;
  tcRelieve: string;
  tcMinAlt: string;
  tcMaxAlt: string;
  tcElevationDiff: string;
  tcMaxSlope: string;
  tcHypsometric: string;
  tcMetersASL: string;
  tcPlains: string;
  tcPlateaus: string;
  tcHighlands: string;
  tcAlpine: string;
  tcBarrier: string;
  tcTerrainAlt: string;
  tcSurgicalCapacity: string;
  tcCesarean: string;
  tcBasic: string;
  tcBloodBank: string;
  tcAvailable: string;
  tcColdChainWeak: string;
  tcDragHelp: string;
  tcOriginLabel: string;

  // TerrainElevationProfile
  epTitle: string;
  ep2dDist: string;
  ep3dDist: string;
  epTime: string;
  epOrigin: string;
  epDestination: string;
  epBottlenecks: string;
  epDetected: string;

  // AICopilotModal
  aiWelcomeMsg: string;
  aiAnalyzeDoc: string;
  aiImageAnalyzed: string;
  aiAnalysisComplete: string;
  aiError: string;
  aiQuickPrompt1: string;
  aiQuickPrompt2: string;
  aiQuickPrompt3: string;
  aiQuickPrompt4: string;
  aiModalTitle: string;
  aiBackend: string;
  aiContext: string;
  aiScenario: string;
  aiEvaluating: string;
  aiDocAttached: string;
  aiRemove: string;
  aiUploadTitle: string;
  aiPlaceholder: string;

  // AuthModal
  authTitle: string;
  authSubtitle: string;
  authProfiles: string;
  authJwtInspector: string;
  authSelectProfile: string;
  authActive: string;
  authPermissionsMatrix: string;
  authPerm1: string;
  authPerm2: string;
  authPerm3: string;
  authPerm4: string;
  authHmacLabel: string;
  authCopied: string;
  authCopyToken: string;
  authHeaderLabel: string;
  authPayloadLabel: string;
  authClose: string;

  // DHSImportModal
  dhsTitle: string;
  dhsSubtitle: string;
  dhsCsvError: string;
  dhsDefaultName: string;
  dhsCountryAssigned: string;
  dhsPopulationEst: string;
  dhsBirthRate: string;
  dhsMmrRange: string;
  dhsMmrOutOfRange: string;
  dhsTransitTime: string;
  dhsColdChain: string;
  dhsErrorProcessing: string;
  dhsDragDrop: string;
  dhsClickBrowse: string;
  dhsNeedTemplate: string;
  dhsCsvTemplate: string;
  dhsJsonTemplate: string;
  dhsSchemaValidation: string;
  dhsReady: string;
  dhsFieldHeader: string;
  dhsValueHeader: string;
  dhsStatusHeader: string;
  dhsDiagnosisHeader: string;
  dhsCancel: string;
  dhsImportSimulate: string;

  // CodeArchitectureView
  caRepoManifest: string;
  caCopyCode: string;
  caCopied: string;
  caFile1Desc: string;
  caFile2Desc: string;
  caFile3Desc: string;
  caFile4Desc: string;

  // Remaining strings
  months24: string;
  months36: string;
  months60: string;
  dualAmpButton: string;
  linearButton: string;
  logButton: string;
  cpn4Short: string;
  badge38Var: string;
  badge24Var: string;
  n1000: string;
  n5000: string;
  n10000: string;
  n25000: string;
  gelmanRubin: string;
  ptsLabel: string;
  horizonBadge: string;
  years5: string;
  years8: string;
  years10: string;
  yearLabel: string;
  lineaBaseLegend: string;
  escALegend: string;
  escBLegend: string;
  escCLegend: string;
  escDLegend: string;
  metaOdsLegend: string;
  metaOdsSvg: string;
  activeDistricts: string;
  pythonLocal: string;
  emptyTableMessage: string;
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

    // Navbar groups
    groupExplore: 'EXPLORAR',
    groupAnalyze: 'ANALIZAR',
    groupOutputs: 'ENTREGABLES',
    collapseSidebar: 'Colapsar',
    expandSidebar: 'Expandir',
    switchLanguage: 'Cambiar idioma',
    exportLabel: 'Exportar',

    // Dashboard inline translations
    dashboardSubtitle: 'Gemelo Digital de Dinámica de Sistemas Maternos',
    selectIntervention: 'Selecciona una intervención',
    keyResult: 'Resultado principal',
    baselineDescription: 'La línea base representa la evolución sin nuevas intervenciones.',
    scenarioResultText: 'El escenario seleccionado podría reducir la RMM un {pct}% y salvar {lives} vidas en {months} meses.',
    modelEstimate: 'Estimación del modelo',
    monthlyStockTrajectory: 'Trayectoria Mensual de Stocks',
    parametersLabel: 'Parámetros',
    stockS1Short: 'Gestantes',
    stockS2Short: 'CPN 4+',
    stockS3Short: 'Parto Inst.',
    stockS4Short: 'Puerperio',
    stockS5Short: 'Compl. Graves',
    scaleDualAmpDesc: 'Modo Escala Dual: S3 (×6) y S5 (×12) reescaladas visualmente para observar dinámicas comunitarias e intrahospitalarias.',
    scaleLinearDesc: 'Modo Lineal 1:1: Todos los stocks graficados en escala física absoluta real.',
    scaleLogDesc: 'Modo Logarítmico: Permite comparar magnitudes dispares en la misma escala.',
    travelTimeParam: 'Tiempo Traslado (Horas)',
    deliveryFeeParam: 'Tarifa de Parto ($)',
    skilledStaffParam: 'Personal Calificado (/1k)',
    bloodBankParam: 'Banco de Sangre',
    oxytocinStockParam: 'Stock Oxitocina/Misoprostol',
    femaleEducationParam: 'Educación Secundaria Femenina',
    instantaneousStocks: 'Stocks Instantáneos',
    pregnantStock: 'Gestantes (S1)',
    ancStock: 'CPN 4+ (S2)',
    facilityDeliveryStock: 'Parto Institucional (S3)',
    complicationsStock: 'Complicaciones Graves (S5)',
    feedbackLoops: 'Bucles de Retroalimentación',
    trustR1: 'Confianza (R1)',
    congestionB1: 'Saturación (B1)',
    phase2Transit: 'Traslado Fase 2',
    phase3Triage: 'Triage Fase 3',
    identifiedBottlenecks: 'Cuellos de Botella Identificados',
    geographicDelay: 'Retraso Geográfico (Fase 2)',
    geographicDelayDesc: '{distance}km de distancia media y {hours}h de traslado.',
    financialBarrier: 'Barrera Financiera',
    financialBarrierDesc: 'Tasa de pobreza del {rate}% retrasa la decisión de acudir al parto institucional.',
    compareOtherScenarios: 'Comparar otros escenarios',
    livesLabel: 'Vidas:',
    costLabel: 'Costo:',
    activeLabel: 'Activo',

    // Scenario view inline
    scenarioLabel: 'Escenario',
    mechanismLabel: 'Mecanismo',
    livesSavedCI: 'Vidas Salvadas (IC 95%)',
    mmrReductionLabel: '% Red. RMM',
    costPerLifeLabel: 'Costo / Vida',
    icerPerDalyLabel: 'RCEI ($/AVAD)',
    whoThreshold: 'Umbral OMS',
    highlyCostEffective: 'Altamente Costo-Efectivo',
    policyComparisonMatrix: 'Matriz Comparativa de Políticas',
    comparativeAnalysisFor: 'Análisis comparativo para',
    highImpact: 'Alto Impacto',
    selectScenario: 'Seleccionar',
    activeScenarioLabel: 'Escenario Activo',
    fullCostEffectivenessMatrix: 'Matriz Completa de Costo-Efectividad',
    synergyTitle: 'Sinergia Multifacética en Escenario (d)',
    synergyDesc: 'Implementar moto-ambulancias (a), eliminación de tarifas (b) y capacitación de parteras tradicionales (c) simultáneamente genera 1.48x más vidas salvadas que la suma simple de intervenciones individuales.',

    // Validation view
    validationSuiteTitle: 'Suite de Validación Epidemiológica',
    validationSuiteSubtitle: 'Pruebas estadísticas, Sobol Global Sensitivity y Countdown 2030 Goodness-of-Fit',
    hypothesisH1Confirmed: 'Hipótesis H1 Confirmada',
    kolmogorovSmirnovTitle: '1. Kolmogorov-Smirnov',
    kolmogorovSmirnovDesc: 'Prueba KS de dos muestras comparando tiempos de tránsito simulados vs datos empíricos de clusters GPS DHS.',
    transitTimesBadge: 'Tiempos de Tránsito',
    ksStatistic: 'Estadístico KS (D):',
    ksCritical: 'Valor Crítico (α=0.05):',
    ksPvalue: 'Valor p asintótico:',
    ksPassDesc: 'Distribuciones estadísticamente equivalentes (p > 0.05)',
    wilcoxonSignedRankTitle: '2. Wilcoxon Signed-Rank',
    wilcoxonSignedRankDesc: 'Prueba no paramétrica pareada evaluando la calibración de RMM en los 25 distritos subsaharianos.',
    districtsBadge: '25 Distritos',
    wilcoxonPvalue: 'Valor p (dos colas):',
    wilcoxonPassDesc: 'Cero sesgo sistemático de calibración',
    countdownFitTitle: '3. Ajuste Countdown 2030',
    countdownFitDesc: 'Validación externa en distrito de prueba no calibrado (holdout).',
    holdoutTestBadge: 'Holdout Test',
    rSquared: 'Coef. Determinación (R²):',
    rmse: 'REMC (/100k):',
    correlation: 'Correlación (r):',
    countdownPassDesc: 'Alta generalizabilidad externa (R² > 0.90)',
    sobolSensitivityTitle: 'Análisis de Sensibilidad Global Sobol (Descomposición de Varianza Saltelli)',
    sobolSensitivityDesc: 'Cuantifica los índices de Primer Orden (S1) y Orden Total (ST) en la varianza de mortalidad materna.',
    saltelliBadge: 'Saltelli',
    sobolDominantTitle: 'Factores Dominantes de Varianza Identificados:',
    sobolDominantDesc: 'Intervenciones dirigidas en estas variables críticas generan el mayor impacto sistémico.',
    hypothesisCertTitle: 'Certificación Estadística: Prueba Formal de Hipótesis',
    hypothesisCertDesc: 'Verificando si el gemelo digital identifica 2-3 parámetros de cuello de botella explicando ≥20% de varianza.',
    h0Rejected: 'H₀ RECHAZADA (p < 0.0001)',
    h1ConfirmedBadge: 'H₁ CONFIRMADA',
    bottleneckLabel: 'Cuello de Botella #',
    varianceLabel: '% Varianza',
    actionLabel: 'Acción:',
    totalVarianceExplained: 'Total de Varianza Explicada:',
    requiredThreshold: '(Requerido: ≥ 20.0%)',
    scenarioDReduction: 'Reducción RMM Escenario D:',
    requiredReduction: '(Requerido: ≥ 15.0%)',
    monteCarloTitle: 'Motor Monte Carlo Asíncrono de Alto Volumen',
    monteCarloDesc: 'Worker asíncrono de alto rendimiento validando convergencia MCMC y Error Estándar Monte Carlo.',
    runButton: 'Ejecutar',
    progressLabel: 'Progreso:',
    throughputLabel: 'iter/seg',
    iterationsLabel: 'Iteraciones',
    convergenceLabel: 'Convergencia < 1.05',
    errorStandardLabel: 'Error Estándar (MCSE)',
    varianceLabel2: '< 1.2% varianza',
    icLivesLabel: 'IC 95% Vidas Salvadas',
    mediaLabel: 'Media:',
    histogramTitle: 'Distribución de Densidad de Probabilidad (12 Bins Empíricos):',

    // Multi-year view inline
    multiYearTitle: 'Proyección Multianual a Largo Plazo',
    multiYearSubtitle: 'Trayectoria decenal continua hacia la Meta ODS 3.1 (<70/100k)',
    tenYearLivesSaved: 'Vidas Salvadas Decenales',
    cumulativeMothersSaved: 'Madres acumuladas (Paquete D)',
    sdgTargetMilestone: 'Cumplimiento Meta ODS 3.1',
    mmrReaches: 'RMM alcanza < 70/100k',
    gapRemaining: 'Brecha remanente:',
    cumulativeFiscalInvestment: 'Inversión Fiscal Acumulada',
    yearlyAverage: '/ año promedio',
    costPerLifeTenYear: 'Costo Decenal por Vida',
    highlyCostEffectiveOMS: 'Altamente Costo-Efectivo (OMS)',
    multiYearTrajectories: 'Trayectorias Multianuales de RMM',
    decadalMatrix: 'Matriz Decenal de Hitos y Costo-Efectividad',
    yearHeader: 'Año',
    baselineHeader: 'Base',
    scenarioAHeader: 'A',
    scenarioBHeader: 'B',
    scenarioCHeader: 'C',
    scenarioDHeader: 'D',
    sdgGapHeader: 'Brecha ODS',
    cumulativeLivesHeader: 'Vidas Acum.',
    investmentHeader: 'Inversión',
    costPerLifeHeader: 'Costo/Vida',
    sdgAchieved: '✓ ALCANZADA',
    inProcess: 'En Proceso',
    yearsLabel: 'años',

    // Geospatial view inline
    geospatialTitle: 'Mapa Geoespacial & Relieve Topográfico 3D',
    geospatialSubtitle: 'Modelado de barreras físicas, pendientes críticas y fricción de traslado obstétrico sobre terreno real',
    allCountriesLabel: 'Todos (25)',
    verticalExagLabel: 'Exageración Vertical:',
    barriersLabel: 'Barreras',
    contourLinesLabel: 'Curvas de Nivel',
    simulateRouteLabel: 'Simular Ruta:',
    baselineRouteLabel: 'Línea Base (Ambulancia 2WD)',
    scenarioARouteLabel: 'Escenario A (Moto-Ambulancia)',
    scenarioBRouteLabel: 'Escenario B (Abolición Tarifas)',
    scenarioCRouteLabel: 'Escenario C (Capacitación TBA)',
    scenarioDRouteLabel: 'Escenario D (Combinado 24/7)',
    tooltipDistance: 'Distancia:',
    tooltipAltitude: 'Altitud:',
    tooltipSlope: 'Pendiente:',
    layer2DLabel: 'Capa 2D:',
    lowLabel: 'Bajo',
    highLabel: 'Alto',
    rmmMetric: 'RMM / 100k',
    livesMetric: 'Vidas',
    transitMetric: 'Traslado',
    deliveryMetric: '% Parto',
    facilitiesMetric: 'Centros',
    visibleDistricts: 'Distritos Visibles',
    accessibilityIndex: 'Índice de Accesibilidad',
    slopeUnder10: 'Pendiente < 10%',
    slopeOver15: 'Pendiente > 15%',
    popUnder2h: 'Población < 2h EmONC',
    terrainFriction: 'Fricción Terreno',
    phase2Correlation: 'Correlación Retraso Fase 2',
    sdTimeLabel: 'Tiempo SD:',
    time3DStandard: 'Tiempo 3D (Estándar):',
    time3DMoto: 'Tiempo 3D (Moto-Ambulancia):',
    warningLabel: 'Aviso:',
    terrainDiscrepancy: 'discrepancia por relieve 3D',
    emoncFacilities: 'Centros EmONC',
    loadDistrict: 'Cargar Distrito:',
    bedsLabel: 'camas',
    cesareanLabel: 'Cesárea ✓',
    noSurgeryLabel: 'Sin Cirugía',

    // Role labels
    roleInvestigator: 'Investigador',
    roleDHO: 'DHO',
    rolePolicymaker: 'Policymaker',

    // Equity View (extended)
    equitySocioeconomicTitle: 'DESAGREGACIÓN POR QUINTILES DE RIQUEZA & EQUIDAD EN SALUD',
    equitySubtitleQuintiles: 'Disaggregated Maternal Health Outcomes by DHS Wealth Quintile (Q1–Q5)',
    evaluatingEquityImpact: 'Evaluating the equity impact of',
    inequalityGapLabel: 'Inequality Gap (Q1 vs Q5)',
    baselineGapLabel: 'baseline',
    narrowingGap: 'narrowing of inequality gap',
    proPoorConcentration: 'Pro-Poor Concentration',
    livesSavedPercent: '% of Lives Saved',
    accrueToPoor: 'Accrue directly to Quintiles 1 & 2 (poorest 40%)',
    equityIndexRanking: 'Equity Index Ranking',
    progressiveEquity: 'Progressive Equity',
    dhsConcIndexShift: 'DHS Concentration Index shifts towards parity',
    quintileMortalityBudget: 'Quintile-Specific Mortality & Fiscal Budget Allocation',
    totalBudgetLabel: 'Total Budget:',
    quintileHeader: 'Quintile',
    simulatedHeader: 'Simulated',
    fiscalCostHeader: 'Fiscal Cost',
    equityImpactHeader: 'Equity Impact',
    equityConcentrationBudget: 'Equity Concentration & Budget Share',
    comparingMortality: 'Comparing mortality burden and public subsidy absorption:',
    fiscalProPoorEquity: 'Fiscal Pro-Poor Equity: 62% of total public expenditure is channeled to the poorest 40% (Q1 + Q2), achieving maximal cost-effectiveness and poverty alleviation.',

    // Causal Loop View (extended)
    cdStockFlowTab: 'Stock & Flow',
    cdFeedbackTab: 'Feedback Loops',
    cdOdesTab: 'ODEs',
    cdInteractiveMap: 'INTERACTIVE CONTINUOUS FLOW MAP',
    cdClickToInspect: 'Click any compartment to inspect ODE parameters',
    cdFertilityInflow: 'FERTILITY & PREGNANCIES INFLOW',
    cdActiveStock: 'ACTIVE STOCK',
    cdR1Label: 'Trust Loop',
    cdB1Label: 'Workload Balancing',
    cdB2Label: 'Phase 2 Transport Delay',
    cdSystemDynamicsRule: 'System Dynamics Rule:',
    cdSystemDynamicsDesc: 'Stock variables accumulate individuals over time, while flow rates (valves) represent rates of transfer determined by maternal education, distance, clinic fees, and SBA capacity.',
    cdOdeLabel: 'Differential Equation (ODE):',
    cdDistrictMagnitude: 'District Magnitude:',
    cdBehavioralRole: 'Behavioral Role:',
    cdCalibrationDriver: 'Calibration Driver:',
    cdSelectStockPrompt: 'Select a stock component to view mathematical formulation',
    cdMitigatingScenario: 'Mitigating Scenario:',
    cdFullOdeSystem: 'Full Non-Linear Differential Equation System',
    cdRk4Integration: 'Solved using Runge-Kutta 4th Order (RK4) numerical integration with time-step Δt = 0.1 months:',

    // Reports View (extended)
    rpTitle: 'GENERADOR DE INFORMES TÉCNICOS & POLÍTICAS',
    rpSubtitle: 'Síntesis automatizada de evidencia y exportación lista para publicación',
    rpDescription: 'Exporte informes de políticas integrales formateados para Ministerios de Salud, OMS y planificadores distritales en PDF, DOCX y XLSX.',
    rpExecutivePdf: 'PDF Ejecutivo',
    rpWordDocx: 'Word (.docx)',
    rpExcelXlsx: 'Excel (XLSX)',
    rpPolicyBriefDoc: 'Documento de Política / Documento Técnico',
    rpDateLabel: 'Fecha:',
    rpDocTitle: 'Intervenciones Dirigidas de Dinámica de Sistemas para Reducir la Mortalidad Materna en',
    rpAuthor: 'Autor: Grupo de Modelado de Dinámica de Sistemas de Gemelo Digital Poblacional | ID Ref:',
    rpExecSummaryTitle: '1. Resumen Ejecutivo y Hallazgos Clave',
    rpExecSummaryText: 'Un modelo continuo de 5 stocks de Dinámica de Sistemas fue calibrado usando datos de Encuestas de Demografía y Salud (DHS) y DHIS2 para',
    rpMatrixTitle: '2. Matriz Comparativa de Intervenciones de Política',
    rpRecsTitle: '3. Recomendaciones Estratégicas de Política',
    rpRec1Title: 'Priorizar Transporte Fase 2:',
    rpRec1Text: 'Desplegar unidades de ambulancia en motocicleta 4x4 en los sub-condados más remotos, reduciendo retrasos de referencia de',
    rpRec1Text2: 'a menos de 1.0h.',
    rpRec2Title: 'Abolir Tarifas de Parto de Bolsillo:',
    rpRec2Text: 'Eliminar la tarifa típica de parto de bolsillo ($',
    rpRec2Text2: 'rescata desproporcionadamente a madres en quintiles DHS 1 y 2.',
    rpRec3Title: 'Certificar TBAs como Campeonas de Referencia Comunitaria:',
    rpRec3Text: 'Cambiar los incentivos de las TBAs hacia la detección temprana de signos de peligro y la referencia rápida a centros de salud.',
    rpValidationTitle: 'Resumen de Validación Técnica y Sensibilidad',
    rpKsTestLabel: 'Prueba Kolmogorov-Smirnov:',
    rpKsTestText: 'Distribuciones simuladas coinciden con encuesta GPS DHS empírica.',
    rpWilcoxonLabel: 'Prueba Wilcoxon Signed-Rank:',
    rpWilcoxonText: 'Cero sesgo sistemático inter-distrital en 25 distritos subsaharianos.',
    rpGofLabel: 'Ajuste vs Countdown 2030:',
    rpGofText: 'por 100k nacidos vivos.',
    rpControlLabel: '0 (Control)',
    rpBaseLabel: '0.0% (Base)',
    rpControlDash: '— (Control)',

    // DigitalTwinProjectionCard
    dtSelectDistrict: 'Seleccione un distrito para ver la proyección.',
    dtSubtitle: 'Simulación dinámica de stocks y flujos con Ficha 10.',
    dtProjectionTitle: 'Proyección Gemelo Digital',
    dtScenarioPrefix: 'Escenario',
    dtCohortLabel: 'Cohorte',
    dtValidationError: 'El escenario no produce reducción de mortalidad. Revisar parámetros del motor SD.',
    dtCalcError: 'Error en cálculo de proyección',
    dtProjectionErrorMsg: 'Error en proyección: el escenario no reduce la mortalidad materna',
    dtVsBase: 'vs base',
    dtVerifyCalibration: 'Verifique la calibración del modelo.',
    dtControlScenario: 'Escenario de control (sin cambios/intervenciones).',
    dtLivesSavedZero: 'Vidas Salvadas = 0',
    dtBaselineMMR: 'RMM Línea Base',
    dtObservedMMR: 'DHS / HMIS Observada',
    dtProjectedMMR: 'RMM Proyectada',
    dtNoIntervention: 'Sin intervención',
    dtDiff: 'Dif:',
    dtLivesSavedLabel: 'Vidas Salvadas',
    dtMonthsLabel: 'meses',
    dtMothers: 'madres',
    dtFormula: 'Fórmula: ((RMM_b - RMM_p)/100k) × Nac/año × 3',
    dtCostPerLife: 'Costo / Vida',
    dtWhoCE: 'WHO C-E',
    dtTotalInvestment: 'Inversión total:',
    dtScientificValidation: 'Validación Científica (Protocolo Ficha 10)',
    dtBirthsLabel: 'Nacimientos:',
    dtPerYear: '/año',
    dtHypothesisH1: 'Hipótesis H1 (Reducción RMM ≥ 15%):',
    dtValidated: 'Validada',
    dtControlLine: 'Línea de Control',
    dtSuboptimal: 'Subóptima',
    dtWhoThreshold: 'Umbral Costo-Efectividad OMS (< $1,500/vida):',
    dtHighlyEffective: 'Altamente Efectivo',
    dtNoAdditionalCost: 'Sin Costo Adicional',
    dtStandardEvaluation: 'Evaluación Estándar',

    // Terrain3DCanvas
    tcZoomIn: 'Acercar',
    tcZoomOut: 'Alejar',
    tcStopRotate: 'Detener Rotación Automática',
    tcStartRotate: 'Iniciar Rotación Automática',
    tcResetCamera: 'Restablecer Cámara 3D',
    tcSrtmLabel: 'SRTM 3D DIGITAL ELEVATION',
    tcRelieve: 'RELIEVE',
    tcMinAlt: 'Altitud Mín:',
    tcMaxAlt: 'Altitud Máx:',
    tcElevationDiff: 'Desnivel:',
    tcMaxSlope: 'Pendiente Máx:',
    tcHypsometric: 'Gradiente Hipsométrico',
    tcMetersASL: 'm.s.n.m.',
    tcPlains: 'Llanuras / Costas',
    tcPlateaus: 'Mesetas / Valles',
    tcHighlands: 'Tierras Altas',
    tcAlpine: 'Cumbres Alpinas',
    tcBarrier: 'Barrera Topográfica (>15% pendiente)',
    tcTerrainAlt: 'Altitud Terreno:',
    tcSurgicalCapacity: 'Capacidad Quirúrgica:',
    tcCesarean: 'Cesárea 24/7',
    tcBasic: 'Básica',
    tcBloodBank: 'Banco de Sangre:',
    tcAvailable: 'Disponible',
    tcColdChainWeak: 'Cadena Fría Débil',
    tcDragHelp: 'Arrastra para orbitar 3D | Shift+Arrastra para desplazar | Rueda para zoom',
    tcOriginLabel: 'Origen Rural (Manyatta)',

    // TerrainElevationProfile
    epTitle: 'Perfil de Elevación Longitudinal (Ruta de Referencia 3D)',
    ep2dDist: 'Dist. 2D Planar:',
    ep3dDist: 'Dist. 3D Terreno:',
    epTime: 'Tiempo Estimado:',
    epOrigin: 'Origen Comunitario: Manyatta',
    epDestination: 'Destino CEmONC: Hospital',
    epBottlenecks: 'Cuellos de Botella (Pendiente >15%):',
    epDetected: 'detectados',

    // AICopilotModal
    aiWelcomeMsg: '¡Hola! Soy tu Copiloto Epidemiológico de MaternalTwin. Puedo analizar los cuellos de botella en los retrasos 1-3, calcular relaciones costo-efectividad o recomendar la combinación óptima de políticas para este distrito. ¿Qué deseas consultar?',
    aiAnalyzeDoc: 'Por favor analiza este documento clínico o espacial subido.',
    aiImageAnalyzed: 'Imagen analizada exitosamente.',
    aiAnalysisComplete: 'Análisis completo.',
    aiError: 'Error al comunicarse con el servicio de Copiloto Epidemiológico. Usando análisis heurístico local de Dinámica de Sistemas.',
    aiQuickPrompt1: '¿Cuál es el factor principal que limita en',
    aiQuickPrompt2: '¿Por qué el Escenario (d) es más costo-efectivo que intervenciones individuales?',
    aiQuickPrompt3: '¿Cómo beneficia la eliminación de tarifas a los Quintiles 1 (más pobres)?',
    aiQuickPrompt4: '¿Cuáles son los signos de peligro críticos que se capacitan bajo el Escenario (c)?',
    aiModalTitle: 'Copiloto IA de Epidemiología Materna',
    aiBackend: 'Gemini Server-Side',
    aiContext: 'Contexto:',
    aiScenario: 'Escenario:',
    aiEvaluating: 'El Copiloto Epidemiológico está evaluando parámetros de Dinámica de Sistemas...',
    aiDocAttached: 'Documento/Mapa adjunto para Auditoría Multimodal',
    aiRemove: 'Eliminar',
    aiUploadTitle: 'Subir registro de trabajo, partograma o mapa GIS',
    aiPlaceholder: 'Haz una pregunta sobre políticas, calibración o epidemiología...',

    // AuthModal
    authTitle: 'Autenticación & Control de Acceso (RBAC / JWT)',
    authSubtitle: 'Gestión de roles de seguridad y firma criptográfica de tokens',
    authProfiles: 'Perfiles & Roles RBAC',
    authJwtInspector: 'Inspector de Token JWT',
    authSelectProfile: 'Selecciona un perfil preconfigurado para alternar permisos en tiempo real:',
    authActive: 'ACTIVO',
    authPermissionsMatrix: 'Matriz de Permisos del Rol Activo:',
    authPerm1: 'Recalibración de EDOs & dt Runge-Kutta',
    authPerm2: 'Ajuste de Parámetros Estocásticos',
    authPerm3: 'Carga de Encuestas DHS / Microdatos',
    authPerm4: 'Exportación de Informes Word / PDF / Excel',
    authHmacLabel: 'Firma HMAC-SHA256 y Carga Útil (RFC 7519):',
    authCopied: '¡Copiado!',
    authCopyToken: 'Copiar Token',
    authHeaderLabel: 'Header (Algoritmo):',
    authPayloadLabel: 'Payload (Claims):',
    authClose: 'Cerrar Panel RBAC',

    // DHSImportModal
    dhsTitle: 'Carga de Nuevos Distritos / Encuestas DHS',
    dhsSubtitle: 'Formatos soportados: CSV columnar o JSON georreferenciado',
    dhsCsvError: 'El archivo CSV no contiene suficientes filas.',
    dhsDefaultName: 'Nombre no especificado; asignado por defecto',
    dhsCountryAssigned: 'País del África Subsahariana asignado',
    dhsPopulationEst: 'Población estimada (500,000)',
    dhsBirthRate: 'Tasa bruta de natalidad calculada (~3.8%)',
    dhsMmrRange: 'RMM dentro del rango empírico de SSA',
    dhsMmrOutOfRange: 'RMM fuera de límites realistas',
    dhsTransitTime: 'Tiempo de traslado a centro EmONC validado',
    dhsColdChain: 'Cadena de frío y banco de sangre verificado',
    dhsErrorProcessing: 'Error al procesar el archivo.',
    dhsDragDrop: 'Arrastra tu archivo CSV o JSON aquí',
    dhsClickBrowse: 'o haz clic para explorar en tu equipo',
    dhsNeedTemplate: '¿Necesitas la estructura estándar?',
    dhsCsvTemplate: 'Plantilla CSV',
    dhsJsonTemplate: 'Plantilla JSON',
    dhsSchemaValidation: 'Diagnóstico de Validación de Esquema:',
    dhsReady: 'Estructura Lista para Simulación',
    dhsFieldHeader: 'Campo',
    dhsValueHeader: 'Valor Asignado',
    dhsStatusHeader: 'Estado',
    dhsDiagnosisHeader: 'Diagnóstico',
    dhsCancel: 'Cancelar',
    dhsImportSimulate: 'Importar y Simular Distrito',

    // CodeArchitectureView
    caRepoManifest: 'Manifiesto del Repositorio',
    caCopyCode: 'Copiar Código',
    caCopied: 'Copiado',
    caFile1Desc: 'Sistema de Ecuaciones Diferenciales de 5 Stocks resuelto con scipy.integrate.solve_ivp (RK45).',
    caFile2Desc: 'Suite de validación estadística: Kolmogorov-Smirnov, Wilcoxon Signed-Rank y Sobol Sensitivity.',
    caFile3Desc: 'DDL de PostgreSQL con geometría PostGIS, particiones TimescaleDB y tablas RBAC.',
    caFile4Desc: 'Orquestación de contenedores para PostgreSQL/PostGIS, Redis, FastAPI Backend y React Frontend.',

    // Remaining strings
    months24: '24 meses',
    months36: '36 meses',
    months60: '60 meses (5A)',
    dualAmpButton: 'Dual/Amp',
    linearButton: 'Linear',
    logButton: 'Log₁₀',
    cpn4Short: 'CPN 4+',
    badge38Var: '38% Var',
    badge24Var: '24% Var',
    n1000: 'N = 1,000',
    n5000: 'N = 5,000',
    n10000: 'N = 10,000',
    n25000: 'N = 25,000',
    gelmanRubin: 'Gelman-Rubin (R̂)',
    ptsLabel: 'pts',
    horizonBadge: '-YEAR HORIZON',
    years5: '5 Años (2026 - 2030)',
    years8: '8 Años (2026 - 2033)',
    years10: '10 Años (2026 - 2036)',
    yearLabel: 'Año',
    lineaBaseLegend: 'Línea Base',
    escALegend: 'Esc. A',
    escBLegend: 'Esc. B',
    escCLegend: 'Esc. C',
    escDLegend: 'Esc. D',
    metaOdsLegend: 'Meta ODS 3.1',
    metaOdsSvg: 'Meta ODS 3.1 (70)',
    activeDistricts: 'Distritos activos',
    pythonLocal: 'Local',
    emptyTableMessage: 'No hay datos disponibles',
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

    // Navbar groups
    groupExplore: 'EXPLORE',
    groupAnalyze: 'ANALYZE',
    groupOutputs: 'OUTPUTS',
    collapseSidebar: 'Collapse',
    expandSidebar: 'Expand',
    switchLanguage: 'Switch language',
    exportLabel: 'Export',

    // Dashboard inline translations
    dashboardSubtitle: 'Maternal Health System Dynamics Twin',
    selectIntervention: 'Select an intervention',
    keyResult: 'Key result',
    baselineDescription: 'The baseline represents evolution without new interventions.',
    scenarioResultText: 'The selected scenario could reduce MMR by {pct}% and save {lives} lives over {months} months.',
    modelEstimate: 'Model estimate',
    monthlyStockTrajectory: 'Monthly Stock Trajectory',
    parametersLabel: 'Parameters',
    stockS1Short: 'Pregnant',
    stockS2Short: 'ANC 4+',
    stockS3Short: 'Facility Delivery',
    stockS4Short: 'Postpartum',
    stockS5Short: 'Complications',
    scaleDualAmpDesc: 'Dual Scale Mode: S3 (×6) and S5 (×12) visually rescaled to observe community and intrahospital dynamics.',
    scaleLinearDesc: 'Linear 1:1 Mode: All stocks plotted in absolute physical scale.',
    scaleLogDesc: 'Log10 Mode: Enables comparison of disparate magnitudes on the same scale.',
    travelTimeParam: 'Travel Time (Hours)',
    deliveryFeeParam: 'Facility Delivery Fee ($)',
    skilledStaffParam: 'Skilled Staff Ratio (/1k)',
    bloodBankParam: 'Blood Bank Availability',
    oxytocinStockParam: 'Oxytocin/Misoprostol Stock',
    femaleEducationParam: 'Female Secondary Education',
    instantaneousStocks: 'Instantaneous Stocks',
    pregnantStock: 'Pregnant (S1)',
    ancStock: 'ANC 4+ (S2)',
    facilityDeliveryStock: 'Facility Delivery (S3)',
    complicationsStock: 'Complications (S5)',
    feedbackLoops: 'Feedback Loops',
    trustR1: 'Trust (R1)',
    congestionB1: 'Congestion (B1)',
    phase2Transit: 'Phase 2 Transit',
    phase3Triage: 'Phase 3 Triage',
    identifiedBottlenecks: 'Identified Bottlenecks',
    geographicDelay: 'Geographic Delay (Phase 2)',
    geographicDelayDesc: '{distance}km avg distance and {hours}h transit time.',
    financialBarrier: 'Financial Barrier',
    financialBarrierDesc: 'Poverty rate of {rate}% delays institutional delivery decision.',
    compareOtherScenarios: 'Compare other scenarios',
    livesLabel: 'Lives:',
    costLabel: 'Cost:',
    activeLabel: 'Active',

    // Scenario view inline
    scenarioLabel: 'Scenario',
    mechanismLabel: 'Mechanism',
    livesSavedCI: 'Lives Saved (95% CI)',
    mmrReductionLabel: 'MMR Red. %',
    costPerLifeLabel: 'Cost / Life',
    icerPerDalyLabel: 'ICER ($/DALY)',
    whoThreshold: 'WHO Threshold',
    highlyCostEffective: 'Highly Cost-Effective',
    policyComparisonMatrix: 'Policy Comparison Matrix',
    comparativeAnalysisFor: 'Comparative analysis for',
    highImpact: 'High Impact',
    selectScenario: 'Select',
    activeScenarioLabel: 'Active Scenario',
    fullCostEffectivenessMatrix: 'Full Cross-Scenario Cost-Effectiveness Matrix',
    synergyTitle: 'Multi-Faceted Synergy in Scenario (d)',
    synergyDesc: 'Implementing moto-ambulances (a), fee elimination (b) and traditional birth attendant training (c) simultaneously produces 1.48× more lives saved than the simple sum of individual interventions.',

    // Validation view
    validationSuiteTitle: 'Epidemiological Validation Suite',
    validationSuiteSubtitle: 'Statistical tests, Sobol Global Sensitivity and Countdown 2030 Goodness-of-Fit',
    hypothesisH1Confirmed: 'Hypothesis H1 Confirmed',
    kolmogorovSmirnovTitle: '1. Kolmogorov-Smirnov',
    kolmogorovSmirnovDesc: 'Two-sample KS test comparing simulated transit times vs DHS cluster GPS empirical data.',
    transitTimesBadge: 'Transit Times',
    ksStatistic: 'KS Statistic (D):',
    ksCritical: 'Critical (α=0.05):',
    ksPvalue: 'Asymptotic p-val:',
    ksPassDesc: 'Distributions statistically equivalent (p > 0.05)',
    wilcoxonSignedRankTitle: '2. Wilcoxon Signed-Rank',
    wilcoxonSignedRankDesc: 'Paired non-parametric test evaluating MMR calibration across 25 Sub-Saharan health districts.',
    districtsBadge: '25 Districts',
    wilcoxonPvalue: 'Two-tailed p-val:',
    wilcoxonPassDesc: 'Zero systematic calibration bias',
    countdownFitTitle: '3. Countdown 2030 Fit',
    countdownFitDesc: 'External validation on uncalibrated holdout district.',
    holdoutTestBadge: 'Holdout Test',
    rSquared: 'Coeff. Determination (R²):',
    rmse: 'RMSE (/100k):',
    correlation: 'Correlation (r):',
    countdownPassDesc: 'High external generalizability (R² > 0.90)',
    sobolSensitivityTitle: 'Sobol Global Sensitivity Analysis (Saltelli Variance Decomposition)',
    sobolSensitivityDesc: 'Quantifies First-Order (S1) and Total-Order (ST) parameter contributions to maternal mortality variance.',
    saltelliBadge: 'Saltelli',
    sobolDominantTitle: 'Dominant Variance Drivers Identified:',
    sobolDominantDesc: 'Targeted interventions on these critical variables achieve the greatest systemic mortality reduction.',
    hypothesisCertTitle: 'Statistical Certification: Formal Hypothesis Test',
    hypothesisCertDesc: 'Verifying whether the digital twin identifies 2-3 bottleneck parameters explaining ≥20% variance.',
    h0Rejected: 'H₀ REJECTED (p < 0.0001)',
    h1ConfirmedBadge: 'H₁ CONFIRMED',
    bottleneckLabel: 'Bottleneck #',
    varianceLabel: '% Variance',
    actionLabel: 'Action:',
    totalVarianceExplained: 'Total Variance Explained:',
    requiredThreshold: '(Required: ≥ 20.0%)',
    scenarioDReduction: 'Scenario D MMR Reduction:',
    requiredReduction: '(Required: ≥ 15.0%)',
    monteCarloTitle: 'High-Throughput Async Monte Carlo Engine',
    monteCarloDesc: 'High-throughput async background worker validating MCMC convergence and Monte Carlo Standard Error.',
    runButton: 'Run',
    progressLabel: 'Progress:',
    throughputLabel: 'iter/sec',
    iterationsLabel: 'Iterations',
    convergenceLabel: 'Convergence < 1.05',
    errorStandardLabel: 'Standard Error (MCSE)',
    varianceLabel2: '< 1.2% variance',
    icLivesLabel: '95% CI Lives Saved',
    mediaLabel: 'Mean:',
    histogramTitle: 'Probability Density Distribution (12 Empirical Bins):',

    // Multi-year view inline
    multiYearTitle: 'Multi-Year Long-Term Projection',
    multiYearSubtitle: 'Decadal continuous ODE trajectory benchmarking against SDG Target 3.1',
    tenYearLivesSaved: '10-Year Lives Saved',
    cumulativeMothersSaved: 'Cumulative mothers saved (Pkg D)',
    sdgTargetMilestone: 'SDG Target 3.1 Milestone',
    mmrReaches: 'MMR reaches < 70/100k',
    gapRemaining: 'Gap remaining:',
    cumulativeFiscalInvestment: 'Cumulative Fiscal Investment',
    yearlyAverage: '/ year average',
    costPerLifeTenYear: '10-Yr Cost / Life Saved',
    highlyCostEffectiveOMS: 'Highly Cost-Effective (WHO)',
    multiYearTrajectories: 'Multi-Year MMR Trajectories',
    decadalMatrix: 'Decadal Milestone & Cost-Effectiveness Matrix',
    yearHeader: 'Year',
    baselineHeader: 'Baseline',
    scenarioAHeader: 'A',
    scenarioBHeader: 'B',
    scenarioCHeader: 'C',
    scenarioDHeader: 'D',
    sdgGapHeader: 'SDG Gap',
    cumulativeLivesHeader: 'Cumul. Lives',
    investmentHeader: 'Investment',
    costPerLifeHeader: 'Cost/Life',
    sdgAchieved: '✓ ACHIEVED',
    inProcess: 'In Progress',
    yearsLabel: 'years',

    // Geospatial view inline
    geospatialTitle: 'Geospatial Map & 3D Topographic Relief',
    geospatialSubtitle: 'Physical barrier modeling, critical slopes and obstetric transit friction over real terrain',
    allCountriesLabel: 'All (25)',
    verticalExagLabel: 'Vertical Exaggeration:',
    barriersLabel: 'Barriers',
    contourLinesLabel: 'Contour Lines',
    simulateRouteLabel: 'Simulate Route:',
    baselineRouteLabel: 'Baseline (Ambulance 2WD)',
    scenarioARouteLabel: 'Scenario A (Moto-Ambulance)',
    scenarioBRouteLabel: 'Scenario B (Fee Abolition)',
    scenarioCRouteLabel: 'Scenario C (TBA Training)',
    scenarioDRouteLabel: 'Scenario D (Combined 24/7)',
    tooltipDistance: 'Distance:',
    tooltipAltitude: 'Altitude:',
    tooltipSlope: 'Slope:',
    layer2DLabel: '2D Layer:',
    lowLabel: 'Low',
    highLabel: 'High',
    rmmMetric: 'MMR / 100k',
    livesMetric: 'Lives',
    transitMetric: 'Transit',
    deliveryMetric: '% Delivery',
    facilitiesMetric: 'Facilities',
    visibleDistricts: 'Visible Districts',
    accessibilityIndex: 'Accessibility Index',
    slopeUnder10: 'Slope < 10%',
    slopeOver15: 'Slope > 15%',
    popUnder2h: 'Pop < 2h EmONC',
    terrainFriction: 'Terrain Friction',
    phase2Correlation: 'Phase 2 Delay Correlation',
    sdTimeLabel: 'SD Time:',
    time3DStandard: '3D Time (Standard):',
    time3DMoto: '3D Time (Moto-Ambulance):',
    warningLabel: 'Warning:',
    terrainDiscrepancy: 'discrepancy due to 3D terrain',
    emoncFacilities: 'EmONC Facilities',
    loadDistrict: 'Load District:',
    bedsLabel: 'beds',
    cesareanLabel: 'Cesarean ✓',
    noSurgeryLabel: 'No Surgery',

    // Role labels
    roleInvestigator: 'Investigator',
    roleDHO: 'DHO',
    rolePolicymaker: 'Policymaker',

    // Equity View (extended)
    equitySocioeconomicTitle: 'SOCIOECONOMIC EQUITY & WEALTH QUINTILES',
    equitySubtitleQuintiles: 'Disaggregated Maternal Health Outcomes by DHS Wealth Quintile (Q1–Q5)',
    evaluatingEquityImpact: 'Evaluating the equity impact of',
    inequalityGapLabel: 'Inequality Gap (Q1 vs Q5)',
    baselineGapLabel: 'baseline',
    narrowingGap: 'narrowing of inequality gap',
    proPoorConcentration: 'Pro-Poor Concentration',
    livesSavedPercent: '% of Lives Saved',
    accrueToPoor: 'Accrue directly to Quintiles 1 & 2 (poorest 40%)',
    equityIndexRanking: 'Equity Index Ranking',
    progressiveEquity: 'Progressive Equity',
    dhsConcIndexShift: 'DHS Concentration Index shifts towards parity',
    quintileMortalityBudget: 'Quintile-Specific Mortality & Fiscal Budget Allocation',
    totalBudgetLabel: 'Total Budget:',
    quintileHeader: 'Quintile',
    simulatedHeader: 'Simulated',
    fiscalCostHeader: 'Fiscal Cost',
    equityImpactHeader: 'Equity Impact',
    equityConcentrationBudget: 'Equity Concentration & Budget Share',
    comparingMortality: 'Comparing mortality burden and public subsidy absorption:',
    fiscalProPoorEquity: 'Fiscal Pro-Poor Equity: 62% of total public expenditure is channeled to the poorest 40% (Q1 + Q2), achieving maximal cost-effectiveness and poverty alleviation.',

    // Causal Loop View (extended)
    cdStockFlowTab: 'Stock & Flow',
    cdFeedbackTab: 'Feedback Loops',
    cdOdesTab: 'ODEs',
    cdInteractiveMap: 'INTERACTIVE CONTINUOUS FLOW MAP',
    cdClickToInspect: 'Click any compartment to inspect ODE parameters',
    cdFertilityInflow: 'FERTILITY & PREGNANCIES INFLOW',
    cdActiveStock: 'ACTIVE STOCK',
    cdR1Label: 'Trust Loop',
    cdB1Label: 'Workload Balancing',
    cdB2Label: 'Phase 2 Transport Delay',
    cdSystemDynamicsRule: 'System Dynamics Rule:',
    cdSystemDynamicsDesc: 'Stock variables accumulate individuals over time, while flow rates (valves) represent rates of transfer determined by maternal education, distance, clinic fees, and SBA capacity.',
    cdOdeLabel: 'Differential Equation (ODE):',
    cdDistrictMagnitude: 'District Magnitude:',
    cdBehavioralRole: 'Behavioral Role:',
    cdCalibrationDriver: 'Calibration Driver:',
    cdSelectStockPrompt: 'Select a stock component to view mathematical formulation',
    cdMitigatingScenario: 'Mitigating Scenario:',
    cdFullOdeSystem: 'Full Non-Linear Differential Equation System',
    cdRk4Integration: 'Solved using Runge-Kutta 4th Order (RK4) numerical integration with time-step Δt = 0.1 months:',

    // Reports View (extended)
    rpTitle: 'POLICY BRIEF & TECHNICAL REPORT GENERATOR',
    rpSubtitle: 'Automated Evidence Synthesis & Publication-Ready Export',
    rpDescription: 'Export comprehensive policy briefs formatted for Ministries of Health, WHO, and district planners in PDF, DOCX, and XLSX.',
    rpExecutivePdf: 'Executive PDF',
    rpWordDocx: 'Word (.docx)',
    rpExcelXlsx: 'Excel (XLSX)',
    rpPolicyBriefDoc: 'Policy Brief / Technical Document',
    rpDateLabel: 'Date:',
    rpDocTitle: 'Targeted System Dynamics Interventions to Reduce Maternal Mortality in',
    rpAuthor: 'Author: Population Digital Twin System Dynamics Modeling Group | Reference ID:',
    rpExecSummaryTitle: '1. Executive Summary & Key Findings',
    rpExecSummaryText: 'A continuous-time 5-stock System Dynamics model was calibrated using Demographic and Health Surveys (DHS) and DHIS2 data for',
    rpMatrixTitle: '2. Comparative Policy Interventions Matrix',
    rpRecsTitle: '3. Strategic Policy Recommendations',
    rpRec1Title: 'Prioritize Phase 2 Transport:',
    rpRec1Text: 'Deploy 4x4 motorcycle ambulance units to the most remote sub-counties, reducing referral delays from',
    rpRec1Text2: 'to under 1.0h.',
    rpRec2Title: 'Abolish Out-of-Pocket Delivery Fees:',
    rpRec2Text: 'Eliminating the typical out-of-pocket delivery fee ($',
    rpRec2Text2: 'disproportionately rescues mothers in DHS Wealth Quintiles 1 & 2.',
    rpRec3Title: 'Certify TBAs as Community Referral Champions:',
    rpRec3Text: 'Shift TBA incentives toward early danger sign detection and rapid facility referral.',
    rpValidationTitle: 'Technical Validation & Sensitivity Summary',
    rpKsTestLabel: 'Kolmogorov-Smirnov Test:',
    rpKsTestText: 'Simulated distributions match empirical DHS GPS survey.',
    rpWilcoxonLabel: 'Wilcoxon Signed-Rank Test:',
    rpWilcoxonText: 'Zero systematic cross-district bias across 25 Sub-Saharan districts.',
    rpGofLabel: 'Goodness-of-Fit vs Countdown 2030:',
    rpGofText: 'per 100k live births.',
    rpControlLabel: '0 (Control)',
    rpBaseLabel: '0.0% (Base)',
    rpControlDash: '— (Control)',

    // DigitalTwinProjectionCard
    dtSelectDistrict: 'Select a district to view projection.',
    dtSubtitle: 'System dynamics stock and flow simulation with Protocol 10.',
    dtProjectionTitle: 'Digital Twin Projection',
    dtScenarioPrefix: 'Scenario',
    dtCohortLabel: 'Cohort',
    dtValidationError: 'Scenario produces no mortality reduction. Check SD engine parameters.',
    dtCalcError: 'Projection calculation error',
    dtProjectionErrorMsg: 'Projection error: scenario does not reduce maternal mortality',
    dtVsBase: 'vs baseline',
    dtVerifyCalibration: 'Verify model calibration.',
    dtControlScenario: 'Control scenario (no changes/interventions).',
    dtLivesSavedZero: 'Lives Saved = 0',
    dtBaselineMMR: 'Baseline MMR',
    dtObservedMMR: 'DHS / HMIS Observed',
    dtProjectedMMR: 'Projected MMR',
    dtNoIntervention: 'No intervention',
    dtDiff: 'Diff:',
    dtLivesSavedLabel: 'Lives Saved',
    dtMonthsLabel: 'months',
    dtMothers: 'mothers',
    dtFormula: 'Formula: ((MMR_b - MMR_p)/100k) × Births/yr × 3',
    dtCostPerLife: 'Cost / Life',
    dtWhoCE: 'WHO C-E',
    dtTotalInvestment: 'Total investment:',
    dtScientificValidation: 'Scientific Validation (Protocol Sheet 10)',
    dtBirthsLabel: 'Births:',
    dtPerYear: '/year',
    dtHypothesisH1: 'Hypothesis H1 (MMR Reduction ≥ 15%):',
    dtValidated: 'Validated',
    dtControlLine: 'Control Line',
    dtSuboptimal: 'Suboptimal',
    dtWhoThreshold: 'WHO Cost-Effectiveness Threshold (< $1,500/life):',
    dtHighlyEffective: 'Highly Effective',
    dtNoAdditionalCost: 'No Additional Cost',
    dtStandardEvaluation: 'Standard Evaluation',

    // Terrain3DCanvas
    tcZoomIn: 'Zoom In',
    tcZoomOut: 'Zoom Out',
    tcStopRotate: 'Stop Auto Rotation',
    tcStartRotate: 'Start Auto Rotation',
    tcResetCamera: 'Reset 3D Camera',
    tcSrtmLabel: 'SRTM 3D DIGITAL ELEVATION',
    tcRelieve: 'RELIEF',
    tcMinAlt: 'Min Alt:',
    tcMaxAlt: 'Max Alt:',
    tcElevationDiff: 'Elevation Diff:',
    tcMaxSlope: 'Max Slope:',
    tcHypsometric: 'Hypsometric Gradient',
    tcMetersASL: 'm.a.s.l.',
    tcPlains: 'Plains / Coasts',
    tcPlateaus: 'Plateaus / Valleys',
    tcHighlands: 'Highlands',
    tcAlpine: 'Alpine Peaks',
    tcBarrier: 'Topographic Barrier (>15% slope)',
    tcTerrainAlt: 'Terrain Altitude:',
    tcSurgicalCapacity: 'Surgical Capacity:',
    tcCesarean: 'Cesarean 24/7',
    tcBasic: 'Basic',
    tcBloodBank: 'Blood Bank:',
    tcAvailable: 'Available',
    tcColdChainWeak: 'Weak Cold Chain',
    tcDragHelp: 'Drag to orbit 3D | Shift+Drag to pan | Scroll to zoom',
    tcOriginLabel: 'Rural Origin (Manyatta)',

    // TerrainElevationProfile
    epTitle: 'Longitudinal Elevation Profile (3D Reference Route)',
    ep2dDist: '2D Planar Dist.:',
    ep3dDist: '3D Terrain Dist.:',
    epTime: 'Estimated Time:',
    epOrigin: 'Community Origin: Manyatta',
    epDestination: 'CEmONC Destination: Hospital',
    epBottlenecks: 'Bottlenecks (Slope >15%):',
    epDetected: 'detected',

    // AICopilotModal
    aiWelcomeMsg: 'Hello! I am your MaternalTwin Epidemiological Copilot. I can diagnose phase 1-3 bottlenecks, calculate cost-effectiveness ratios, and advise on optimal policy combinations for this district. What would you like to explore?',
    aiAnalyzeDoc: 'Please analyze this uploaded clinical or spatial document.',
    aiImageAnalyzed: 'Image analyzed successfully.',
    aiAnalysisComplete: 'Analysis complete.',
    aiError: 'Error communicating with Epidemiologist Copilot service. Defaulting to local System Dynamics heuristic analysis.',
    aiQuickPrompt1: 'What is the primary bottleneck in',
    aiQuickPrompt2: 'Why is Scenario (d) more cost-effective than single interventions?',
    aiQuickPrompt3: 'How does user fee elimination benefit Quintile 1 (poorest)?',
    aiQuickPrompt4: 'What are the critical danger signs trained under Scenario (c)?',
    aiModalTitle: 'Maternal Health Epidemiologist AI Copilot',
    aiBackend: 'Gemini Server-Side',
    aiContext: 'Context:',
    aiScenario: 'Scenario:',
    aiEvaluating: 'Epidemiologist AI is evaluating System Dynamics parameters...',
    aiDocAttached: 'Document/Map attached for Multimodal Audit',
    aiRemove: 'Remove',
    aiUploadTitle: 'Upload labor register, partograph, or GIS map',
    aiPlaceholder: 'Ask a policy, calibration, or epidemiological question...',

    // AuthModal
    authTitle: 'Authentication & Role-Based Access Control',
    authSubtitle: 'Security roles management & cryptographic token signature',
    authProfiles: 'Profiles & RBAC Roles',
    authJwtInspector: 'JWT Token Inspector',
    authSelectProfile: 'Select a pre-configured profile to toggle active RBAC permissions in real time:',
    authActive: 'ACTIVE',
    authPermissionsMatrix: 'Active Role Permissions Matrix:',
    authPerm1: 'ODE Recalibration & Runge-Kutta dt',
    authPerm2: 'Stochastic Parameter Tuning',
    authPerm3: 'DHS Survey / Microdata Upload',
    authPerm4: 'Word / PDF / Excel Report Export',
    authHmacLabel: 'HMAC-SHA256 Signature & Payload (RFC 7519):',
    authCopied: 'Copied!',
    authCopyToken: 'Copy Token',
    authHeaderLabel: 'Header (Algorithm):',
    authPayloadLabel: 'Payload (Claims):',
    authClose: 'Close RBAC Panel',

    // DHSImportModal
    dhsTitle: 'Import New District / DHS Microdata Survey',
    dhsSubtitle: 'Supported formats: Columnar CSV or GeoJSON schema',
    dhsCsvError: 'CSV file contains insufficient rows.',
    dhsDefaultName: 'Name not specified; assigned by default',
    dhsCountryAssigned: 'Sub-Saharan African country assigned',
    dhsPopulationEst: 'Estimated population (500,000)',
    dhsBirthRate: 'Calculated crude birth rate (~3.8%)',
    dhsMmrRange: 'MMR within SSA empirical range',
    dhsMmrOutOfRange: 'MMR outside realistic bounds',
    dhsTransitTime: 'Transit time to EmONC facility validated',
    dhsColdChain: 'Cold chain and blood bank verified',
    dhsErrorProcessing: 'Error processing file.',
    dhsDragDrop: 'Drag & drop your CSV or JSON file here',
    dhsClickBrowse: 'or click to browse from local computer',
    dhsNeedTemplate: 'Need the standard schema template?',
    dhsCsvTemplate: 'CSV Template',
    dhsJsonTemplate: 'JSON Template',
    dhsSchemaValidation: 'Schema Validation Diagnostics:',
    dhsReady: 'Ready for ODE Simulation',
    dhsFieldHeader: 'Field',
    dhsValueHeader: 'Assigned Value',
    dhsStatusHeader: 'Status',
    dhsDiagnosisHeader: 'Diagnosis',
    dhsCancel: 'Cancel',
    dhsImportSimulate: 'Import & Simulate District',

    // CodeArchitectureView
    caRepoManifest: 'Repository Manifest',
    caCopyCode: 'Copy Code',
    caCopied: 'Copied',
    caFile1Desc: 'Core 5-Stock Differential Equation System solved with scipy.integrate.solve_ivp (RK45).',
    caFile2Desc: 'Statistical validation suite: Kolmogorov-Smirnov, Wilcoxon Signed-Rank, and Sobol Sensitivity.',
    caFile3Desc: 'PostgreSQL DDL with PostGIS geometry, TimescaleDB partitions, and RBAC tables.',
    caFile4Desc: 'Container orchestration for PostgreSQL/PostGIS, Redis, FastAPI Backend, and React Frontend.',

    // Remaining strings
    months24: '24 months',
    months36: '36 months',
    months60: '60 months (5A)',
    dualAmpButton: 'Dual/Amp',
    linearButton: 'Linear',
    logButton: 'Log₁₀',
    cpn4Short: 'ANC 4+',
    badge38Var: '38% Var',
    badge24Var: '24% Var',
    n1000: 'N = 1,000',
    n5000: 'N = 5,000',
    n10000: 'N = 10,000',
    n25000: 'N = 25,000',
    gelmanRubin: 'Gelman-Rubin (R̂)',
    ptsLabel: 'pts',
    horizonBadge: '-YEAR HORIZON',
    years5: '5 Years (2026 - 2030)',
    years8: '8 Years (2026 - 2033)',
    years10: '10 Years (2026 - 2036)',
    yearLabel: 'Year',
    lineaBaseLegend: 'Baseline',
    escALegend: 'Sc. A',
    escBLegend: 'Sc. B',
    escCLegend: 'Sc. C',
    escDLegend: 'Sc. D',
    metaOdsLegend: 'SDG 3.1 Target',
    metaOdsSvg: 'SDG 3.1 Target (70)',
    activeDistricts: 'active districts',
    pythonLocal: 'Local',
    emptyTableMessage: 'No data available',
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
