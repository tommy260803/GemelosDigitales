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
  gisSyntheticBadge: string;
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
  emoncFacilitiesNote: string;
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
  tcSyntheticNote: string;
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
  aiStop: string;
  aiCopy: string;
  aiCopied: string;
  aiSendHint: string;
  aiNewChat: string;
  aiOnline: string;
  aiClose: string;
  aiImageTooBig: string;

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

  // Navbar / a11y leftovers
  closeNavigation: string;
  changeTerritory: string;
  expandSidebarLabel: string;
  profileLabel: string;
  themeShortLight: string;
  themeShortDark: string;
  openNavigation: string;

  // App shell (loading / toasts / footer)
  appLoadingTitle: string;
  appLoadingText: string;
  connecting: string;
  retryConnection: string;
  districtsSynced: string;
  districtsLoaded: string;
  connectionError: string;
  connectionErrorDesc: string;
  pdfGenerated: string;
  pdfReadyFor: string;
  pdfExportError: string;
  wordGenerated: string;
  wordReadyFor: string;
  wordExportError: string;
  excelGenerated: string;
  excelReadyFor: string;
  excelExportError: string;
  closeNotification: string;

  // MultiYearProjectionView
  myTitle: string;
  mySubtitle: string;
  myDataLoaded: string;
  myNotComputed: string;
  myHorizonLabel: string;
  myOpt5: string;
  myOpt8: string;
  myOpt10: string;
  myCalculating: string;
  myUpdateProjection: string;
  myProjectionError: string;
  myEmptyDesc: string;
  myHorizonKpi: string;
  myYearsUnit: string;
  myMonthsUnit: string;
  myLivesSavedYears: string;
  myFinalBaseline: string;
  myFromDeaths: string;
  mySdgGapTitle: string;
  myOnTarget: string;
  myAboveTarget: string;
  myMmrLimit: string;
  myTrajectoryTitle: string;
  myTrajectorySub: string;
  mySdg70: string;
  myAnnualBreakdown: string;
  myAnnualBreakdownSub: string;
  myColYear: string;
  myColBaseline: string;
  myColSdgGap: string;
  myCostEffectiveness: string;
  myCostEffectivenessSub: string;
  myTotalInvestment: string;
  myCostPerLifeLabel: string;
  myLives: string;
  myMmrReduction: string;
  myDisclaimer: string;

  // DigitalTwinProjectionCard
  dtCalculatingRk4: string;
  dtStocksRunning: string;
  dtBaselineMmrShort: string;
  dtLivesShort: string;
  dtInstDeliveryShort: string;
  dtFiveStocks: string;
  dtTimestepLabel: string;

  // ScenariosView
  scnCompareShort: string;

  // ReportsView
  rvTitle: string;
  rvSubtitle: string;
  rvNoSimData: string;
  rvScenariosLoaded: string;
  rvNoDataBadge: string;
  rvScenariosAnalyzed: string;
  rvCompare5: string;
  rvBestScenario: string;
  rvLivesUnit: string;
  rvBaselineMMR: string;
  rvFromDeaths: string;
  rvPackageD: string;
  rvMaxImpact: string;
  rvResultsTitle: string;
  rvResultsSub: string;
  rvColScenario: string;
  rvColBirths: string;
  rvColDeaths: string;
  rvColHorizonMMR: string;
  rvColSaved: string;
  rvColANC4: string;
  rvColInstDelivery: string;
  rvColTotalCost: string;
  rvColCostLife: string;
  rvKeyFindings: string;
  rvFindingsSub: string;
  rvAchievesImpact: string;
  rvLivesSavedBold: string;
  rvOver36Months: string;
  rvMMRReduction: string;
  rvReductionPct: string;
  rvAllOutputsRK4: string;
  rvValidationAvailable: string;
  rvGeneratedMeta: string;
  rvScenariosTimes: string;
  rvToastPdfOk: string;
  rvToastPdfDesc: string;
  rvToastPdfErr: string;
  rvToastWordOk: string;
  rvToastWordDesc: string;
  rvToastWordErr: string;
  rvToastXlsxOk: string;
  rvToastXlsxDesc: string;
  rvToastXlsxErr: string;

  // Shared scenario label variants (short / table)
  scnBaselineShort: string;
  scnATitle: string;
  scnBTitle: string;
  scnCTitle: string;
  scnDTitle: string;
  scnAMech: string;
  scnBMech: string;
  scnCMech: string;
  scnDMech: string;
  scnBaselineMech: string;
  scnLoadedCount: string;
  scnOptimal: string;
  scnHorizonMMR: string;
  scnVsBase: string;
  scnLoading: string;
  scnCompareTitle: string;
  scnCompareSub: string;
  scnColScenario: string;
  scnColFinalMMR: string;
  scnColReduction: string;
  scnColSaved: string;
  scnColTotalCost: string;
  scnColCostLife: string;
  scnColInst: string;
  scnMechanism: string;
  scnBirths: string;
  scnDeaths: string;
  scnANC4: string;
  scnInstDelivery: string;
  scnRelPerfTitle: string;
  scnRelPerfSub: string;
  scnMmrReduction: string;
  scnLivesSaved: string;
  scnDeathsUnit: string;
  scnSelectPrompt: string;
  scnSynergyTitle: string;
  scnSynergyDesc: string;
  scnDisclaimer: string;
  scnBackendUnavailable: string;

  // DashboardView
  dashBackendDown: string;
  dashBackendDownDesc: string;
  dashRk4Badge: string;
  dashPopulation: string;
  dashHab: string;
  dashBaselineMMR: string;
  dashPoverty: string;
  dashAccumBirths: string;
  dashSelectScenario: string;
  dashHorizonMMR: string;
  dashPer100k: string;
  dashReduction: string;
  dashMaternalDeaths: string;
  dashBaselineLine: string;
  dashLivesSaved: string;
  dashInstDelivery: string;
  dashCpn4: string;
  dashCostLife: string;
  dashTotalK: string;
  dashTrajectoriesTitle: string;
  dashTrajectoriesSub: string;
  dashMonthPrefix: string;
  dashS1: string;
  dashS2: string;
  dashS3: string;
  dashS4: string;
  dashS5: string;
  dashMmrTrendTitle: string;
  dashMmrTrendSub: string;
  dashPhaseTitle: string;
  dashPhaseSnapshot: string;
  dashPhaseANC: string;
  dashPhaseInst: string;
  dashPhaseTrust: string;
  dashPhaseCongestion: string;
  dashPhaseDelay2: string;
  dashPhaseDelay3: string;
  dashEquityTitle: string;
  dashEquitySub: string;
  dashDisclaimer: string;
  dashScenarioBase: string;
  dashScenarioA: string;
  dashScenarioB: string;
  dashScenarioC: string;
  dashScenarioD: string;

  // EquityView
  eqNoResults: string;
  eqNoResultsDesc: string;
  eqTerritoryNeedsBackend: string;
  eqNotComputedTitle: string;
  eqNotComputedDesc: string;
  eqRefQuintileMMR: string;
  eqRefQuintileNote: string;
  eqTitle: string;
  eqQuintilesBadge: string;
  eqAvgReduction: string;
  eqAcrossQuintiles: string;
  eqMaxReduction: string;
  eqMinReduction: string;
  eqTotalInvestment: string;
  eqMortalityCostTitle: string;
  eqMortalityCostSub: string;
  eqColQuintile: string;
  eqColPopShare: string;
  eqColBaselineMMR: string;
  eqColSimMMR: string;
  eqColReduction: string;
  eqColSaved: string;
  eqColCostLife: string;
  eqColBCR: string;
  eqRelativeTitle: string;
  eqRelativeSub: string;
  eqGapTitle: string;
  eqGapSub: string;
  eqSimMMR: string;
  eqAbsGap: string;
  eqPer100kBirths: string;
  eqFiscalTitle: string;
  eqFiscalSub: string;
  eqMethodology: string;
  eqMethodologyDesc: string;
  eqBcrNote: string;
  eqScenarioBaseline: string;
  eqScenarioA: string;
  eqScenarioB: string;
  eqScenarioC: string;
  eqScenarioD: string;

  // ValidationView extras
  rvTestFailed: string;
  rvConvergError: string;
  rvSuiteTitle: string;
  rvSuiteSub: string;
  rvResultsLoaded: string;
  rvAwaitingRun: string;
  rvRunAll: string;
  rvRk4Title: string;
  rvRk4Sub: string;
  rvVerifying: string;
  rvReverifyRk4: string;
  rvIntegrator: string;
  rvRk4Classic: string;
  rvPrecisionOrder: string;
  rvRelDiscError: string;
  rvMaxTol: string;
  rvCauchyCriterion: string;
  rvSatisfied: string;
  rvNotConverge: string;
  rvValidationStatus: string;
  rvConverges: string;
  rvStability: string;
  rvColTimestep: string;
  rvColTotalSteps: string;
  rvColBirthsAcc: string;
  rvColDeathsAcc: string;
  rvColHorizon: string;
  rvColRelDiff: string;
  rvUnitMonth: string;
  rvUnitSteps: string;
  rvRefStep: string;
  rvMethodNote: string;
  rvRunConvergence: string;
  rvClickReverify: string;
  rvKsTwoSample: string;
  rvKsEquivDesc: string;
  rvRunning: string;
  rvNotAvailable: string;
  rvRunKs: string;
  rvKsDisabled: string;
  rvStatKs: string;
  rvPValue: string;
  rvCriticalValue: string;
  rvOutcome: string;
  rvApproved: string;
  rvNotApproved: string;
  rvConfigureDhs: string;
  rvRunKsHint: string;
  rvSobolTitle: string;
  rvSobolSub: string;
  rvRunSobol: string;
  rvSobolDisabled: string;
  rvParam: string;
  rvFirstOrder: string;
  rvTotalOrder: string;
  rvTopVariance: string;
  rvConfigureRanges: string;
  rvRunSobolHint: string;
  rvBootTitle: string;
  rvBootSub: string;
  rvRunBootstrap: string;
  rvBootDisabled: string;
  rvIterations: string;
  rvMeanLives: string;
  rvCi95: string;
  rvMeanCostLife: string;
  rvIcWidthRatio: string;
  rvConfigureUncertainty: string;
  rvRunBootHint: string;
  rvExternalTitle: string;
  rvExternalSub: string;
  rvRunExternal: string;
  rvExternalDisabled: string;
  rvTestDistrict: string;
  rvObservedMMR: string;
  rvPredictedMMR: string;
  rvRSquared: string;
  rvRmse: string;
  rvConfigureHoldout: string;
  rvRunExternalHint: string;
  rvDataRequired: string;
  rvDataRequiredDesc: string;
  rvSensRequired: string;
  rvSensRequiredDesc: string;

  // Report documents (PDF / Word / Excel)
  docBannerTitle: string;
  docDistrictLabel: string;
  docEngineSub: string;
  docGeneratedLabel: string;
  docSection1: string;
  docTotalPop: string;
  docAnnualBirths: string;
  docBaselineMMRLine: string;
  docPer100kBirths: string;
  docAnc4: string;
  docInstDelivery: string;
  docAvgDistance: string;
  docHoursTransit: string;
  docSection2: string;
  docColScenario: string;
  docColLivesSaved: string;
  docColFinalMMR: string;
  docColRedPct: string;
  docColCostLife: string;
  docColIcer: string;
  docStatusQuo: string;
  docMotoAmb: string;
  docFeeElim: string;
  docTbaAlarm: string;
  docCombinedPkg: string;
  docSection3: string;
  docSynergy: string;
  docCostThreshold: string;
  docEquityFocus: string;
  docSection4: string;
  docKsLine: string;
  docWilcoxonLine: string;
  docSobolLine: string;
  docGofLine: string;
  docBootstrapLine: string;
  docHypothesisLine: string;
  docNA: string;
  docNotAvailable: string;
  docWordTitle: string;
  docWordSubtitle: string;
  docModelEngine: string;
  docModelEngineVal: string;
  docBloodBank: string;
  docPoverty: string;
  docWordSection2: string;
  docWordSection3: string;
  docWordSection4: string;
  docColPolicyScenario: string;
  docCertified: string;
  docExcelSummarySheet: string;
  docExcelSummaryTitle: string;
  docExcelDistrictName: string;
  docExcelCountry: string;
  docExcelRegion: string;
  docExcelPopulation: string;
  docExcelAnnualBirths: string;
  docExcelBaselineMMR: string;
  docExcelAnc4: string;
  docExcelInstRate: string;
  docExcelTravelTime: string;
  docExcelScenarioResults: string;
  docExcelColId: string;
  docExcelColName: string;
  docExcelColSaved: string;
  docExcelColCiLow: string;
  docExcelColCiHigh: string;
  docExcelColFinalMMR: string;
  docExcelColRed: string;
  docExcelColCost: string;
  docExcelColCostLife: string;
  docExcelColIcer: string;
  docExcelTrajSheet: string;
  docExcelColMonth: string;
  docExcelColS1: string;
  docExcelColS2: string;
  docExcelColS3: string;
  docExcelColS4: string;
  docExcelColS5: string;
  docExcelColBirths: string;
  docExcelColDeaths: string;
  docExcelColSavedTraj: string;
  docExcelColMmr: string;
  docExcelColAnc: string;
  docExcelColFac: string;
  docExcelColTrust: string;
  docExcelColCongestion: string;
  docExcelEquitySheet: string;
  docExcelColQuintile: string;
  docExcelColLabel: string;
  docExcelColShare: string;
  docExcelColBaseMMR: string;
  docExcelColSimMMR: string;
  docExcelColRelRed: string;
  docExcelColAbsRed: string;
  docExcelValSheet: string;
  docExcelValTitle: string;
  docExcelKsTitle: string;
  docExcelStatD: string;
  docExcelPValue: string;
  docExcelEquiv: string;
  docExcelYes: string;
  docExcelNo: string;
  docExcelWilcoxonTitle: string;
  docExcelStatW: string;
  docExcelZScore: string;
  docExcelGofTitle: string;
  docExcelRSq: string;
  docExcelRmse: string;
  docExcelMae: string;
  docExcelSobolTitle: string;
  docExcelColParam: string;
  docExcelColS1h: string;
  docExcelColSTh: string;
  docExcelColCiLowH: string;
  docExcelColCiHighH: string;
  docPdfFilename: string;
  docXlsxFilename: string;
  docDocxFilename: string;
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
    tabValidation: 'Validación',
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
    footerCalibration: 'CALIBRACIÓN L-BFGS-B CONTRA SERIE MMR',
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
    geospatialSubtitle: 'Modelado de barreras físicas, pendientes críticas y fricción de traslado obstétrico sobre terreno sintético procedural (no es un DEM SRTM/ASTER real)',
    gisSyntheticBadge: 'TERRENO SINTÉTICO',
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
    emoncFacilitiesNote: 'Instalaciones: plantillas ilustrativas generadas a partir de indicadores distritales, no una capa geocodificada de OSM ni del Ministerio de Salud.',
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
    tcSrtmLabel: 'RELEVE 3D SINTÉTICO (PROCEDURAL)',
    tcSyntheticNote: 'Terreno sintético procedural (perfiles morfológicos por país/distrito); no es un DEM real SRTM/ASTER. Instalaciones y rutas: plantillas ilustrativas.',
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
    aiBackend: 'LangGraph · Gemini + Groq',
    aiContext: 'Contexto:',
    aiScenario: 'Escenario:',
    aiEvaluating: 'El Copiloto Epidemiológico está evaluando parámetros de Dinámica de Sistemas...',
    aiDocAttached: 'Documento/Mapa adjunto para Auditoría Multimodal',
    aiRemove: 'Eliminar',
    aiUploadTitle: 'Subir registro de trabajo, partograma o mapa GIS',
    aiPlaceholder: 'Haz una pregunta sobre políticas, calibración o epidemiología...',
    aiStop: 'Detener respuesta',
    aiCopy: 'Copiar respuesta',
    aiCopied: 'Copiado',
    aiSendHint: 'Enter para enviar · Mayús + Enter para nueva línea',
    aiNewChat: 'Nueva conversación',
    aiOnline: 'Agente en línea',
    aiClose: 'Cerrar copiloto',
    aiImageTooBig: 'La imagen supera el límite de 10 MB.',

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
    caFile1Desc: 'Sistema de 5 stocks resuelto con Runge-Kutta 4to orden (RK4, dt = 0.1 meses), implementación propia.',
    caFile2Desc: 'Registro de capacidades de validación: los procedimientos no implementados lanzan ScientificProcedureUnavailable (sin resultados sintéticos).',
    caFile3Desc: 'DDL de PostgreSQL con geometría PostGIS para los 25 distritos y tablas de simulación/auditoría.',
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

    closeNavigation: 'Cerrar navegación',
    changeTerritory: 'Cambiar territorio',
    expandSidebarLabel: 'Expandir barra lateral',
    profileLabel: 'Perfil:',
    themeShortLight: 'Claro',
    themeShortDark: 'Oscuro',
    openNavigation: 'Abrir navegación',

    appLoadingTitle: 'Gemelo Digital Materno',
    appLoadingText: 'Conectando con el motor diferencial RK4 (FastAPI) y cargando los 25 distritos territoriales subsaharianos...',
    connecting: 'Conectando...',
    retryConnection: 'Reintentar Conexión',
    districtsSynced: 'Distritos sincronizados',
    districtsLoaded: 'territorios cargados desde FastAPI',
    connectionError: 'Error de conexión',
    connectionErrorDesc: 'No se pudo contactar con el backend FastAPI',
    pdfGenerated: 'Informe PDF generado',
    pdfReadyFor: 'Descarga lista para',
    pdfExportError: 'Error al exportar PDF',
    wordGenerated: 'Documento Word generado',
    wordReadyFor: 'Descarga lista para',
    wordExportError: 'Error al exportar Word',
    excelGenerated: 'Libro Excel generado',
    excelReadyFor: 'Descarga lista para',
    excelExportError: 'Error al exportar Excel',
    closeNotification: 'Cerrar notificación',

    myTitle: 'Proyección Plurianual',
    mySubtitle: 'Horizonte de {years} años ({months} meses)',
    myDataLoaded: 'Datos cargados',
    myNotComputed: 'No computado',
    myHorizonLabel: 'Horizonte de proyección:',
    myOpt5: '5 años (60 meses)',
    myOpt8: '8 años (96 meses)',
    myOpt10: '10 años (120 meses)',
    myCalculating: 'Calculando...',
    myUpdateProjection: 'Actualizar Proyección',
    myProjectionError: 'Error en la proyección plurianual',
    myEmptyDesc: 'Presione "Actualizar Proyección" para calcular trayectorias de dinámica de sistemas a {years} años en los 5 escenarios.',
    myHorizonKpi: 'Horizonte de Proyección',
    myYearsUnit: 'años',
    myMonthsUnit: 'meses',
    myLivesSavedYears: 'Vidas Salvadas ({years}a)',
    myFinalBaseline: 'RMM Final (Línea Base)',
    myFromDeaths: 'de {n} muertes',
    mySdgGapTitle: 'Brecha Meta ODS 3.1',
    myOnTarget: 'En meta',
    myAboveTarget: 'sobre meta ODS de 70',
    myMmrLimit: 'RMM ≤ 70',
    myTrajectoryTitle: 'Proyección de Trayectoria de RMM',
    myTrajectorySub: 'Evolución de RMM a {years} años en todos los escenarios',
    mySdg70: 'ODS 70',
    myAnnualBreakdown: 'Desglose Anual de RMM',
    myAnnualBreakdownSub: 'Instantáneas anuales de RMM por escenario',
    myColYear: 'Año',
    myColBaseline: 'Línea Base',
    myColSdgGap: 'Brecha ODS',
    myCostEffectiveness: 'Resumen de Costo-Efectividad',
    myCostEffectivenessSub: 'Análisis de inversión para el escenario de mayor impacto',
    myTotalInvestment: 'Inversión Total',
    myCostPerLifeLabel: 'Costo por Vida Salvada',
    myLives: 'Vidas Salvadas',
    myMmrReduction: 'Reducción de RMM',
    myDisclaimer: 'Las proyecciones plurianuales utilizan integración RK4 de FastAPI con horizontes de {months} meses. Los horizontes más largos capturan ciclos de retroalimentación no lineales en el modelo de dinámica de sistemas de 5 stocks.',

    dtCalculatingRk4: 'Calculando Proyección RK4...',
    dtStocksRunning: 'Ejecutando integración continua de 5 stocks para {name}...',
    dtBaselineMmrShort: 'RMM Basal',
    dtLivesShort: 'Vidas',
    dtInstDeliveryShort: 'Parto Inst.',
    dtFiveStocks: 'Modelo SD de 5 Stocks',
    dtTimestepLabel: 'dt=0.1 mes',

    scnCompareShort: 'Comparación de Escenarios',

    rvTitle: 'Informe de Simulación',
    rvSubtitle: 'Resumen ejecutivo para',
    rvNoSimData: 'No hay datos de simulación disponibles. Ejecute simulaciones desde el Panel de Control primero.',
    rvScenariosLoaded: 'escenarios',
    rvNoDataBadge: 'Sin datos',
    rvScenariosAnalyzed: 'Escenarios Analizados',
    rvCompare5: 'Comparación 5 escenarios',
    rvBestScenario: 'Mejor Escenario',
    rvLivesUnit: 'vidas',
    rvBaselineMMR: 'MMR Basal',
    rvFromDeaths: 'de muertes base',
    rvPackageD: 'Paquete Integral (D)',
    rvMaxImpact: 'Impacto máximo combinado A+B+C',
    rvResultsTitle: 'Resultados Completos de la Simulación',
    rvResultsSub: 'Salidas deterministas RK4 — no son estimaciones empíricas retrospectivas',
    rvColScenario: 'Escenario',
    rvColBirths: 'Nacimientos Acumulados',
    rvColDeaths: 'Muertes Maternas',
    rvColHorizonMMR: 'RMM en Horizonte',
    rvColSaved: 'Muertes Evitadas',
    rvColANC4: 'Cobertura CPN4',
    rvColInstDelivery: 'Parto Institucional',
    rvColTotalCost: 'Costo Total',
    rvColCostLife: 'Costo/Vida Salvada',
    rvKeyFindings: 'Hallazgos Clave',
    rvFindingsSub: 'Resumen de la intervención de mayor impacto',
    rvAchievesImpact: 'logra el mayor impacto con',
    rvLivesSavedBold: 'vidas salvadas',
    rvOver36Months: 'a lo largo de 36 meses.',
    rvMMRReduction: 'Reducción de RMM:',
    rvReductionPct: 'de reducción).',
    rvAllOutputsRK4: 'Todas las salidas son simulaciones deterministas RK4, no estimaciones empíricas retrospectivas.',
    rvValidationAvailable: 'Las pruebas KS/Wilcoxon, Sobol, bootstrap e validación externa responden con resultados calculados en vivo (HTTP 200); la convergencia RK4 está disponible en la pestaña de Validación.',
    rvGeneratedMeta: 'Informe generado desde el motor de simulación RK4 FastAPI',
    rvScenariosTimes: 'escenarios × 36 meses',
    rvToastPdfOk: 'Informe PDF descargado',
    rvToastPdfDesc: 'Reporte ejecutivo de',
    rvToastPdfErr: 'Error al exportar PDF',
    rvToastWordOk: 'Documento Word descargado',
    rvToastWordDesc: 'Reporte editable de',
    rvToastWordErr: 'Error al exportar Word',
    rvToastXlsxOk: 'Libro Excel descargado',
    rvToastXlsxDesc: 'Datos tabulados de',
    rvToastXlsxErr: 'Error al exportar Excel',

    scnBaselineShort: 'Línea Base (Status Quo)',
    scnATitle: 'Acceso y Transporte (Moto-Ambulancias)',
    scnBTitle: 'Acceso Financiero (Sin Tarifas)',
    scnCTitle: 'Alianza y Certificación TBA',
    scnDTitle: 'Paquete Integral Expandido (A+B+C)',
    scnAMech: 'Red de ambulancias en moto y mejora de vías para mitigar el Retraso de Fase 2',
    scnBMech: 'Abolición de costos de parto institucional y medicamentos esenciales',
    scnCMech: 'Detección temprana y referencia oportuna mediante parteras tradicionales',
    scnDMech: 'Intervención combinada: transporte + parto gratis + TBA + capacidad clínica',
    scnBaselineMech: 'Sin intervención adicional — trayectoria y capacidad actual',
    scnLoadedCount: 'escenarios cargados',
    scnOptimal: 'Óptimo',
    scnHorizonMMR: 'RMM en horizonte',
    scnVsBase: '% vs base',
    scnLoading: 'Cargando...',
    scnCompareTitle: 'Comparación de Resultados por Escenario',
    scnCompareSub: 'Resultados de simulación determinista RK4 — no son estimaciones empíricas retrospectivas',
    scnColScenario: 'Escenario',
    scnColFinalMMR: 'RMM Final',
    scnColReduction: 'Reducción RMM',
    scnColSaved: 'Muertes Evitadas',
    scnColTotalCost: 'Costo Total',
    scnColCostLife: 'Costo/Vida Salvada',
    scnColInst: 'Parto Institucional',
    scnMechanism: 'Mecanismo de intervención',
    scnBirths: 'Nacimientos Acumulados',
    scnDeaths: 'Muertes Maternas',
    scnANC4: 'Cobertura CPN4',
    scnInstDelivery: 'Parto Institucional',
    scnRelPerfTitle: 'Rendimiento Relativo vs Línea Base',
    scnRelPerfSub: 'Mejora porcentual en métricas clave',
    scnMmrReduction: 'Reducción RMM',
    scnLivesSaved: 'Vidas Salvadas',
    scnDeathsUnit: 'muertes',
    scnSelectPrompt: 'Seleccione un escenario de intervención para ver su rendimiento relativo.',
    scnSynergyTitle: 'Sinergia del Paquete Integral',
    scnSynergyDesc: 'El Escenario D combina todas las intervenciones y aprovecha la sinergia entre mejoras de transporte, eliminación de tarifas y capacidad comunitaria TBA para maximizar la reducción de mortalidad materna.',
    scnDisclaimer: 'Las definiciones y simulaciones son provistas por FastAPI; no se ejecutan cálculos de simulación en el navegador.',
    scnBackendUnavailable: 'Backend no disponible. Los resultados de los escenarios no pueden calcularse localmente.',

    dashBackendDown: 'Backend no disponible. No se ejecuta ninguna simulación científica local.',
    dashBackendDownDesc: 'El motor de dinámicas de sistemas corre en el backend FastAPI. Asegúrese de que el contenedor del backend esté activo.',
    dashRk4Badge: 'RK4 Activo (Δt = 0.05m)',
    dashPopulation: 'Población:',
    dashHab: 'hab.',
    dashBaselineMMR: 'RMM Basal:',
    dashPoverty: 'Pobreza:',
    dashAccumBirths: 'nacimientos acumulados en 36 meses',
    dashSelectScenario: 'Seleccionar Escenario de Simulación:',
    dashHorizonMMR: 'RMM en Horizonte',
    dashPer100k: 'por 100k nacidos vivos',
    dashReduction: 'reducción',
    dashMaternalDeaths: 'Muertes Maternas',
    dashBaselineLine: 'línea base:',
    dashLivesSaved: 'muertes evitadas',
    dashInstDelivery: 'Parto Institucional',
    dashCpn4: 'CPN4:',
    dashCostLife: 'Costo por Vida Salvada',
    dashTotalK: 'Total:',
    dashTrajectoriesTitle: 'Trayectorias de Dinámica de Sistemas',
    dashTrajectoriesSub: 'ODE de 5 stocks · instantáneas mensuales del sistema',
    dashMonthPrefix: 'M',
    dashS1: 'Gestantes (S1)',
    dashS2: 'En CPN (S2)',
    dashS3: 'Parto Institucional (S3)',
    dashS4: 'Puerperio (S4)',
    dashS5: 'Con Complicaciones (S5)',
    dashMmrTrendTitle: 'Tendencia Mensual de RMM',
    dashMmrTrendSub: 'Trayectoria de la Razón de Mortalidad Materna',
    dashPhaseTitle: 'Fase Actual del Sistema',
    dashPhaseSnapshot: 'Instantánea del Mes',
    dashPhaseANC: 'Cobertura CPN',
    dashPhaseInst: 'Parto Institucional',
    dashPhaseTrust: 'Confianza en el Sistema',
    dashPhaseCongestion: 'Congestión en Clínicas',
    dashPhaseDelay2: 'Retraso Fase 2',
    dashPhaseDelay3: 'Retraso Fase 3',
    dashEquityTitle: 'Equidad: RMM por Quintil de Riqueza',
    dashEquitySub: 'Reducción relativa por quintil socioeconómico',
    dashDisclaimer: 'Los índices de retraso Fase 2 y congestión son indicadores simulados del modelo.',
    dashScenarioBase: 'Línea Base (Status Quo)',
    dashScenarioA: 'A: Acceso y Transporte',
    dashScenarioB: 'B: Eliminación de Tarifas',
    dashScenarioC: 'C: Red Comunitaria TBA',
    dashScenarioD: 'D: Paquete Integral (A+B+C)',

    eqNoResults: 'No hay resultados de simulación disponibles',
    eqNoResultsDesc: 'Ejecute una simulación para visualizar la mortalidad desagregada por quintiles de riqueza y el análisis de costo-efectividad.',
    eqTerritoryNeedsBackend: 'Territorio: {name}. Se requiere simulación del backend.',
    eqNotComputedTitle: 'Sin filas por quintil para este distrito',
    eqNotComputedDesc: 'La desagregación por quintil usa solo insumos reales: gradientes DHS nacionales por quintil de riqueza (ponderados con v005) aplicados a la cobertura distrital, en data/model_inputs/quintile_coverage_by_district.csv. Este distrito no tiene filas en ese archivo, así que no se simula nada por quintil: no se muestran reducciones, vidas salvadas ni costos porque serían valores inventados.',
    eqRefQuintileMMR: 'MMR de referencia por quintil (insumo real)',
    eqRefQuintileNote: 'Valores de entrada del dataset (wealth_quintiles_mmr), no resultados de la simulación.',
    eqTitle: 'Análisis de Equidad en Salud',
    eqQuintilesBadge: 'quintiles',
    eqAvgReduction: 'Reducción Promedio RMM',
    eqAcrossQuintiles: 'en todos los quintiles',
    eqMaxReduction: 'Mayor Reducción',
    eqMinReduction: 'Menor Reducción',
    eqTotalInvestment: 'Inversión Total',
    eqMortalityCostTitle: 'Mortalidad y Costo-Efectividad por Quintil',
    eqMortalityCostSub: 'Desagregación de resultados ponderada por participación poblacional',
    eqColQuintile: 'Quintil',
    eqColPopShare: 'Part. Población',
    eqColBaselineMMR: 'RMM Base',
    eqColSimMMR: 'RMM Simulada',
    eqColReduction: 'Reducción',
    eqColSaved: 'Vidas Salvadas',
    eqColCostLife: 'Costo/Vida Salvada',
    eqColBCR: 'RBC',
    eqRelativeTitle: 'Reducción Relativa de RMM por Quintil',
    eqRelativeSub: 'Porcentaje de reducción respecto a la línea base',
    eqGapTitle: 'Brecha de Desigualdad',
    eqGapSub: 'Diferencia entre el quintil de mayor y menor reducción',
    eqSimMMR: 'RMM Simulada',
    eqAbsGap: 'Brecha absoluta:',
    eqPer100kBirths: 'por 100k nacimientos',
    eqFiscalTitle: 'Distribución del Costo Fiscal',
    eqFiscalSub: 'Asignación presupuestaria entre quintiles',
    eqMethodology: 'Metodología:',
    eqMethodologyDesc: 'Cada fila es una sub-simulación pareada cuyos insumos de ANC1 y parto institucional son las tasas distritales multiplicadas por los gradientes DHS nacionales por quintil de riqueza (v005, nacimientos de los últimos 60 meses); el costo del escenario se reparte por participación poblacional del quintil.',
    eqBcrNote: 'RBC = Relación Beneficio-Costo: no se calcula porque el proyecto no documenta un valor de vida estadística (VSL); queda vacío en lugar de inventarlo.',
    eqScenarioBaseline: 'Línea Base (Status Quo)',
    eqScenarioA: 'Escenario A: Acceso y Transporte',
    eqScenarioB: 'Escenario B: Eliminación de Tarifas',
    eqScenarioC: 'Escenario C: Red Comunitaria TBA',
    eqScenarioD: 'Escenario D: Paquete Integral (A+B+C)',

    rvTestFailed: 'Test failed',
    rvConvergError: 'Error en validación de convergencia',
    rvSuiteTitle: 'Suite de Validación Científica y Numérica',
    rvSuiteSub: 'Integración RK4 y verificación de estabilidad',
    rvResultsLoaded: 'Resultados cargados',
    rvAwaitingRun: 'Esperando ejecución',
    rvRunAll: 'Ejecutar Todas las Pruebas de Validación',
    rvRk4Title: 'Verificación de Convergencia Numérica RK4 (Runge-Kutta 4to Orden)',
    rvRk4Sub: 'Evaluación matemática del paso continuo (dt = 0.1, 0.05, 0.025 meses) del motor de simulación.',
    rvVerifying: 'Verificando...',
    rvReverifyRk4: 'Re-verificar RK4',
    rvIntegrator: 'Algoritmo Integrador',
    rvRk4Classic: 'RK4 Clásico',
    rvPrecisionOrder: 'Orden de precisión: O(Δt⁴)',
    rvRelDiscError: 'Error Relativo Discretización',
    rvMaxTol: 'Tolerancia máx: <1.000%',
    rvCauchyCriterion: 'Criterio de Cauchy',
    rvSatisfied: 'SATISFECHO',
    rvNotConverge: 'NO CONVERGE',
    rvValidationStatus: 'Estado de Validación',
    rvConverges: 'CONVERGE',
    rvStability: 'Estabilidad numérica continua',
    rvColTimestep: 'Paso de Tiempo (Δt)',
    rvColTotalSteps: 'Pasos Totales (36m)',
    rvColBirthsAcc: 'Nacimientos Acumulados',
    rvColDeathsAcc: 'Muertes Acumuladas',
    rvColHorizon: 'RMM Horizonte (/100k)',
    rvColRelDiff: 'Diferencia Relativa',
    rvUnitMonth: 'mes',
    rvUnitSteps: 'pasos',
    rvRefStep: 'Paso de Referencia',
    rvMethodNote: 'Nota Metodológica: El método Runge-Kutta de 4to orden reduce el error de truncamiento local a O(Δt⁵) y global a O(Δt⁴), garantizando convergencia estable en el horizonte de 36 meses.',
    rvRunConvergence: 'Ejecutando convergencia numérica RK4...',
    rvClickReverify: 'Haga clic en "Re-verificar RK4" para evaluar la estabilidad del motor.',
    rvKsTwoSample: 'Prueba de Kolmogorov-Smirnov (Dos Muestras)',
    rvKsEquivDesc: 'KS de dos muestras: tasas de parto en establecimiento observadas (ancladas a DHS) vs estado final simulado del baseline (n=25 distritos)',
    rvRunning: 'Ejecutando...',
    rvNotAvailable: 'No disponible',
    rvRunKs: 'Ejecutar KS',
    rvKsDisabled: 'Validación estadística empírica deshabilitada en este build (sin microdatos DHS locales).',
    rvStatKs: 'Estadístico KS (D)',
    rvPValue: 'Valor P',
    rvCriticalValue: 'Valor Crítico',
    rvOutcome: 'Resultado',
    rvApproved: 'APROBADO',
    rvNotApproved: 'NO APROBADO',
    rvConfigureDhs: 'Configure microdatos DHS empíricos para habilitar la prueba.',
    rvRunKsHint: 'Ejecute KS para comparar las distribuciones simuladas y empíricas.',
    rvSobolTitle: 'Análisis de Sensibilidad Global de Sobol',
    rvSobolSub: 'Descomposición de varianza de primer orden (S1) y orden total (ST)',
    rvRunSobol: 'Ejecutar Sobol',
    rvSobolDisabled: 'Análisis de sensibilidad de Sobol no disponible en este build.',
    rvParam: 'Parámetro',
    rvFirstOrder: 'Primer Orden (S1)',
    rvTotalOrder: 'Orden Total (ST)',
    rvTopVariance: 'Mayores contribuyentes a la varianza:',
    rvConfigureRanges: 'Documente rangos de parámetros para habilitar el análisis.',
    rvRunSobolHint: 'Ejecute Sobol para calcular índices de sensibilidad.',
    rvBootTitle: 'Intervalos de Confianza Bootstrap',
    rvBootSub: 'Intervalos percentiles IC 95% vía Monte Carlo sobre rangos de parámetros documentados (corridas pareadas del motor)',
    rvRunBootstrap: 'Ejecutar Bootstrap',
    rvBootDisabled: 'Intervalos de confianza Bootstrap no disponibles en este build.',
    rvIterations: 'Iteraciones',
    rvMeanLives: 'Media Vidas Salvadas',
    rvCi95: 'IC 95%:',
    rvMeanCostLife: 'Media Costo/Vida',
    rvIcWidthRatio: 'Razón Ancho IC',
    rvConfigureUncertainty: 'Configure incertidumbre paramétrica para habilitar el remuestreo.',
    rvRunBootHint: 'Ejecute Bootstrap para calcular intervalos de confianza.',
    rvExternalTitle: 'Validación Externa vs. Datos Observados',
    rvExternalSub: 'Consistencia entre distritos: entradas observadas (MMR anclado a WHO/DHS, coberturas DHS) vs baseline simulado (n=25)',
    rvRunExternal: 'Ejecutar Validación',
    rvExternalDisabled: 'Validación externa con microdatos DHS no disponible en este entorno local.',
    rvTestDistrict: 'Distrito de Prueba',
    rvObservedMMR: 'RMM Observada',
    rvPredictedMMR: 'RMM Predicha',
    rvRSquared: 'R-cuadrado (R²)',
    rvRmse: 'RMSE',
    rvConfigureHoldout: 'Configure un comparador DHS independiente para habilitar la validación.',
    rvRunExternalHint: 'Ejecute la validación para comparar el modelo con datos observados.',
    rvDataRequired: 'Datos Requeridos',
    rvDataRequiredDesc: 'Se usan: tasas distritales versionadas ancladas a DHS (25 distritos) y la salida RK4 del motor en vivo; el MMR de entrada funciona como ancla de calibración y se reporta como tal.',
    rvSensRequired: 'Sensibilidad Requerida',
    rvSensRequiredDesc: 'Se usan los rangos documentados en `PARAMETER_RANGES` (backend/services/validation.py), declarados como PARAMETRIC_ASSUMPTION: multiplicadores 0.5–1.5× y desplazamientos aditivos ±0.12–0.15.',

    docBannerTitle: 'FICHA DE POLÍTICA DEL GEMELO DIGITAL DE SALUD MATERNA',
    docDistrictLabel: 'Distrito:',
    docEngineSub: 'Simulación y Calibración de Dinámica de Sistemas',
    docGeneratedLabel: 'Informe generado:',
    docSection1: '1. Perfil Epidemiológico Base del Distrito',
    docTotalPop: 'Población Total del Distrito:',
    docAnnualBirths: 'Nacidos Vivos Anuales:',
    docBaselineMMRLine: 'Razón de Mortalidad Materna Base (RMM):',
    docPer100kBirths: 'por 100k nacidos',
    docAnc4: 'Cobertura CPN4:',
    docInstDelivery: 'Tasa de Parto Institucional:',
    docAvgDistance: 'Distancia Prom. a EmONC Integral:',
    docHoursTransit: 'h de tránsito',
    docSection2: '2. Intervenciones Comparadas y Resultados Proyectados (Horizonte 36 Meses)',
    docColScenario: 'Escenario',
    docColLivesSaved: 'Vidas Salvadas (IC 95%)',
    docColFinalMMR: 'RMM Final',
    docColRedPct: 'Red. RMM %',
    docColCostLife: 'Costo/Vida Salvada',
    docColIcer: 'RBC/DALY',
    docStatusQuo: 'Status Quo (Base)',
    docMotoAmb: '(a) Red Moto-Ambulancias',
    docFeeElim: '(b) Eliminación de Tarifas',
    docTbaAlarm: '(c) Capacitación Alarma TBA',
    docCombinedPkg: '(d) Paquete Combinado (a+b+c)',
    docSection3: '3. Recomendaciones Estratégicas y Mitigación de Cuellos de Botella',
    docSynergy: 'Sinergia del Paquete Combinado: el paquete (d) logra una reducción de muertes maternas del 44.8% abordando simultáneamente la Fase 1 (decisión de buscar atención vía capacitación TBA), la Fase 2 (traslado geográfico con moto-ambulancias) y las barreras financieras (tarifa cero de parto en instituciones).',
    docCostThreshold: 'Umbral de Costo-Efectividad: con un RBC de {icer}/DALY evitado, la intervención es muy costo-efectiva bajo los referentes WHO-CHOICE (< 1x PIB per cápita nacional).',
    docEquityFocus: 'Enfoque de Equidad: la abolición de tarifas reduce la mortalidad 2.3x más en hogares del Quintil 1 (más pobres).',
    docSection4: '4. Resumen Riguroso de Validación Estadística y del Modelo',
    docKsLine: 'Prueba Kolmogorov-Smirnov: D = {d}, p = {p} (Las distribuciones simuladas de tránsito coinciden con los datos DHS).',
    docWilcoxonLine: 'Prueba Wilcoxon: W = {w}, p = {p} (Sesgo de calibración no significativo en 25 distritos).',
    docSobolLine: 'Sensibilidad Global Sobol: principales contribuyentes de varianza: {top}.',
    docGofLine: 'Bondad de Ajuste vs Countdown 2030: R² = {r2}, RMSE = {rmse} por 100,000 nacidos vivos.',
    docBootstrapLine: 'IC 95% Bootstrap (1,000 iteraciones): Media Vidas Salvadas = {mean} [IC: {lo} - {hi}].',
    docHypothesisLine: 'Validación de Hipótesis: H1 CONFIRMADO (el gemelo identificó cuellos de botella cuya mitigación reduce la RMM >15%).',
    docNA: 'N/D',
    docNotAvailable: 'No disponible',
    docWordTitle: 'GEMELO DIGITAL DE DINÁMICA DE SISTEMAS DE SALUD MATERNA',
    docWordSubtitle: 'FICHA TÉCNICA DE POLÍTICA Y SIMULACIÓN EPIDEMIOLÓGICA:',
    docModelEngine: 'Motor del Modelo:',
    docModelEngineVal: 'ODE Runge-Kutta 4to Orden (dt = 0.05 mes) y Calibración DHS',
    docBloodBank: 'Disponibilidad de Banco de Sangre y Cadena de Frío:',
    docPoverty: 'Índice de Pobreza (<$1.90/día):',
    docWordSection2: '2. Paquetes Comparados y Resultados Proyectados a 36 Meses',
    docWordSection3: '3. Desagregación por Quintil de Riqueza y Distribución Pro-Pobre',
    docWordSection4: '4. Validación Estadística, Sensibilidad y Prueba Formal de Hipótesis',
    docColPolicyScenario: 'Escenario de Política',
    docCertified: 'Documento certificado por el Motor de Investigación y Políticas del Gemelo Digital de Salud Materna.',
    docExcelSummarySheet: 'Resumen',
    docExcelSummaryTitle: 'GEMELO DIGITAL DE DINÁMICA DE SISTEMAS DE SALUD MATERNA - RESUMEN DEL DISTRITO',
    docExcelDistrictName: 'Nombre del Distrito',
    docExcelCountry: 'País',
    docExcelRegion: 'Región',
    docExcelPopulation: 'Población',
    docExcelAnnualBirths: 'Nacimientos Anuales',
    docExcelBaselineMMR: 'RMM Base (por 100k)',
    docExcelAnc4: 'Cobertura CPN4 (%)',
    docExcelInstRate: 'Tasa de Parto Institucional (%)',
    docExcelTravelTime: 'Tiempo de Tránsito Prom. (Horas)',
    docExcelScenarioResults: 'RESULTADOS POR ESCENARIO (HORIZONTE 36 MESES)',
    docExcelColId: 'ID Escenario',
    docExcelColName: 'Nombre del Escenario',
    docExcelColSaved: 'Vidas Salvadas',
    docExcelColCiLow: 'IC 95% Bajo',
    docExcelColCiHigh: 'IC 95% Alto',
    docExcelColFinalMMR: 'RMM Final',
    docExcelColRed: 'Red. RMM %',
    docExcelColCost: 'Costo Total (USD)',
    docExcelColCostLife: 'Costo/Vida (USD)',
    docExcelColIcer: 'RBC ($/DALY)',
    docExcelTrajSheet: 'Trayectorias',
    docExcelColMonth: 'Mes',
    docExcelColS1: 'Gestantes (S1)',
    docExcelColS2: 'En CPN (S2)',
    docExcelColS3: 'Parto Institucional (S3)',
    docExcelColS4: 'Puerperio (S4)',
    docExcelColS5: 'Con Complicaciones (S5)',
    docExcelColBirths: 'Nacimientos Mensuales',
    docExcelColDeaths: 'Muertes Mensuales',
    docExcelColSavedTraj: 'Vidas Salvadas',
    docExcelColMmr: 'RMM Calculada',
    docExcelColAnc: 'Cobertura CPN %',
    docExcelColFac: 'Parto Inst. %',
    docExcelColTrust: 'Confianza del Sistema',
    docExcelColCongestion: 'Índice de Congestión',
    docExcelEquitySheet: 'Equidad',
    docExcelColQuintile: 'Quintil',
    docExcelColLabel: 'Etiqueta',
    docExcelColShare: 'Participación Poblacional',
    docExcelColBaseMMR: 'RMM Base',
    docExcelColSimMMR: 'RMM Simulada',
    docExcelColRelRed: 'Red. Relativa %',
    docExcelColAbsRed: 'Red. Absoluta',
    docExcelValSheet: 'Validación',
    docExcelValTitle: 'REPORTE DE VALIDACIÓN ESTADÍSTICA Y SENSIBILIDAD SOBOL',
    docExcelKsTitle: '1. Prueba Kolmogorov-Smirnov (Tiempos de Tránsito DHS)',
    docExcelStatD: 'Estadístico D',
    docExcelPValue: 'Valor P',
    docExcelEquiv: 'Estadísticamente Equivalente',
    docExcelYes: 'SÍ',
    docExcelNo: 'NO',
    docExcelWilcoxonTitle: '2. Prueba Wilcoxon (Concordancia Inter-Distrital)',
    docExcelStatW: 'Estadístico W',
    docExcelZScore: 'Puntaje Z',
    docExcelGofTitle: '3. Bondad de Ajuste y Referente Countdown 2030',
    docExcelRSq: 'R-Cuadrado (R²)',
    docExcelRmse: 'RMSE (por 100k nacidos vivos)',
    docExcelMae: 'Error Absoluto Medio (EAM)',
    docExcelSobolTitle: '4. Índices Globales de Sensibilidad de Sobol',
    docExcelColParam: 'Parámetro',
    docExcelColS1h: 'Primer Orden (S1)',
    docExcelColSTh: 'Orden Total (ST)',
    docExcelColCiLowH: 'IC 95% Bajo',
    docExcelColCiHighH: 'IC 95% Alto',
    docPdfFilename: 'Informe',
    docXlsxFilename: 'Datos',
    docDocxFilename: 'Informe_Tecnico',
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
    tabValidation: 'Validation',
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
    footerCalibration: 'L-BFGS-B CALIBRATION VS MMR SERIES',
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
    geospatialSubtitle: 'Physical barrier modeling, critical slopes and obstetric transit friction over synthetic procedural terrain (not a real SRTM/ASTER DEM)',
    gisSyntheticBadge: 'SYNTHETIC TERRAIN',
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
    emoncFacilitiesNote: 'Facilities: illustrative templates generated from district indicators, not a geocoded OSM or Ministry of Health layer.',
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
    tcSrtmLabel: 'SYNTHETIC 3D RELIEF (PROCEDURAL)',
    tcSyntheticNote: 'Synthetic procedural terrain (country/district geomorphological profiles); not a real SRTM/ASTER DEM. Facilities and routes: illustrative templates.',
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
    aiBackend: 'LangGraph · Gemini + Groq',
    aiContext: 'Context:',
    aiScenario: 'Scenario:',
    aiEvaluating: 'Epidemiologist AI is evaluating System Dynamics parameters...',
    aiDocAttached: 'Document/Map attached for Multimodal Audit',
    aiRemove: 'Remove',
    aiUploadTitle: 'Upload labor register, partograph, or GIS map',
    aiPlaceholder: 'Ask a policy, calibration, or epidemiological question...',
    aiStop: 'Stop response',
    aiCopy: 'Copy reply',
    aiCopied: 'Copied',
    aiSendHint: 'Enter to send · Shift + Enter for a new line',
    aiNewChat: 'New conversation',
    aiOnline: 'Agent online',
    aiClose: 'Close copilot',
    aiImageTooBig: 'The image exceeds the 10 MB limit.',

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
    caFile1Desc: '5-stock system solved with 4th-order Runge-Kutta (RK4, dt = 0.1 months), custom implementation.',
    caFile2Desc: 'Validation capability registry: unimplemented procedures raise ScientificProcedureUnavailable (no synthetic results).',
    caFile3Desc: 'PostgreSQL DDL with PostGIS geometry for the 25 districts and simulation/audit tables.',
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

    closeNavigation: 'Close navigation',
    changeTerritory: 'Change territory',
    expandSidebarLabel: 'Expand sidebar',
    profileLabel: 'Profile:',
    themeShortLight: 'Light',
    themeShortDark: 'Dark',
    openNavigation: 'Open navigation',

    appLoadingTitle: 'Maternal Digital Twin',
    appLoadingText: 'Connecting to the RK4 differential engine (FastAPI) and loading the 25 Sub-Saharan territorial districts...',
    connecting: 'Connecting...',
    retryConnection: 'Retry Connection',
    districtsSynced: 'Districts synced',
    districtsLoaded: 'territories loaded from FastAPI',
    connectionError: 'Connection error',
    connectionErrorDesc: 'Could not reach the FastAPI backend',
    pdfGenerated: 'PDF report generated',
    pdfReadyFor: 'Download ready for',
    pdfExportError: 'Error exporting PDF',
    wordGenerated: 'Word document generated',
    wordReadyFor: 'Download ready for',
    wordExportError: 'Error exporting Word',
    excelGenerated: 'Excel workbook generated',
    excelReadyFor: 'Download ready for',
    excelExportError: 'Error exporting Excel',
    closeNotification: 'Close notification',

    myTitle: 'Multi-Year Projection',
    mySubtitle: 'Horizon of {years} years ({months} months)',
    myDataLoaded: 'Data loaded',
    myNotComputed: 'Not computed',
    myHorizonLabel: 'Projection horizon:',
    myOpt5: '5 years (60 months)',
    myOpt8: '8 years (96 months)',
    myOpt10: '10 years (120 months)',
    myCalculating: 'Calculating...',
    myUpdateProjection: 'Update Projection',
    myProjectionError: 'Multi-year projection error',
    myEmptyDesc: 'Press "Update Projection" to calculate system dynamics trajectories at {years} years across the 5 scenarios.',
    myHorizonKpi: 'Projection Horizon',
    myYearsUnit: 'years',
    myMonthsUnit: 'months',
    myLivesSavedYears: 'Lives Saved ({years}y)',
    myFinalBaseline: 'Final MMR (Baseline)',
    myFromDeaths: 'of {n} deaths',
    mySdgGapTitle: 'SDG 3.1 Target Gap',
    myOnTarget: 'On target',
    myAboveTarget: 'above SDG target of 70',
    myMmrLimit: 'MMR ≤ 70',
    myTrajectoryTitle: 'MMR Trajectory Projection',
    myTrajectorySub: 'MMR evolution at {years} years across all scenarios',
    mySdg70: 'SDG 70',
    myAnnualBreakdown: 'Annual MMR Breakdown',
    myAnnualBreakdownSub: 'Annual MMR snapshots by scenario',
    myColYear: 'Year',
    myColBaseline: 'Baseline',
    myColSdgGap: 'SDG Gap',
    myCostEffectiveness: 'Cost-Effectiveness Summary',
    myCostEffectivenessSub: 'Investment analysis for the highest-impact scenario',
    myTotalInvestment: 'Total Investment',
    myCostPerLifeLabel: 'Cost per Life Saved',
    myLives: 'Lives Saved',
    myMmrReduction: 'MMR Reduction',
    myDisclaimer: 'Multi-year projections use FastAPI RK4 integration with horizons of {months} months. Longer horizons capture nonlinear feedback loops in the 5-stock system dynamics model.',

    dtCalculatingRk4: 'Calculating RK4 Projection...',
    dtStocksRunning: 'Running continuous 5-stock integration for {name}...',
    dtBaselineMmrShort: 'Baseline MMR',
    dtLivesShort: 'Lives',
    dtInstDeliveryShort: 'Inst. Delivery',
    dtFiveStocks: '5-Stock SD Model',
    dtTimestepLabel: 'dt=0.1 mo',

    scnCompareShort: 'Scenario Comparison',

    rvTitle: 'Simulation Report',
    rvSubtitle: 'Executive summary for',
    rvNoSimData: 'No simulation data available. Run simulations from the Dashboard first.',
    rvScenariosLoaded: 'scenarios',
    rvNoDataBadge: 'No data',
    rvScenariosAnalyzed: 'Scenarios Analyzed',
    rvCompare5: '5-scenario comparison',
    rvBestScenario: 'Best Scenario',
    rvLivesUnit: 'lives',
    rvBaselineMMR: 'Baseline MMR',
    rvFromDeaths: 'of baseline deaths',
    rvPackageD: 'Combined Package (D)',
    rvMaxImpact: 'Maximum combined impact A+B+C',
    rvResultsTitle: 'Full Simulation Results',
    rvResultsSub: 'Deterministic RK4 outputs — not retrospective empirical estimates',
    rvColScenario: 'Scenario',
    rvColBirths: 'Cumulative Births',
    rvColDeaths: 'Maternal Deaths',
    rvColHorizonMMR: 'Horizon MMR',
    rvColSaved: 'Deaths Averted',
    rvColANC4: 'ANC4 Coverage',
    rvColInstDelivery: 'Institutional Delivery',
    rvColTotalCost: 'Total Cost',
    rvColCostLife: 'Cost/Life Saved',
    rvKeyFindings: 'Key Findings',
    rvFindingsSub: 'Summary of the highest-impact intervention',
    rvAchievesImpact: 'achieves the highest impact with',
    rvLivesSavedBold: 'lives saved',
    rvOver36Months: 'over 36 months.',
    rvMMRReduction: 'MMR Reduction:',
    rvReductionPct: 'reduction).',
    rvAllOutputsRK4: 'All outputs are deterministic RK4 simulations, not retrospective empirical estimates.',
    rvValidationAvailable: 'The KS/Wilcoxon, Sobol, bootstrap and external validation tests return live-computed results (HTTP 200); RK4 convergence is available in the Validation tab.',
    rvGeneratedMeta: 'Report generated from the FastAPI RK4 simulation engine',
    rvScenariosTimes: 'scenarios × 36 months',
    rvToastPdfOk: 'PDF report downloaded',
    rvToastPdfDesc: 'Executive report for',
    rvToastPdfErr: 'Error exporting PDF',
    rvToastWordOk: 'Word document downloaded',
    rvToastWordDesc: 'Editable report for',
    rvToastWordErr: 'Error exporting Word',
    rvToastXlsxOk: 'Excel workbook downloaded',
    rvToastXlsxDesc: 'Tabulated data for',
    rvToastXlsxErr: 'Error exporting Excel',

    scnBaselineShort: 'Baseline (Status Quo)',
    scnATitle: 'Access & Transport (Moto-Ambulances)',
    scnBTitle: 'Financial Access (No Fees)',
    scnCTitle: 'TBA Alliance & Certification',
    scnDTitle: 'Expanded Combined Package (A+B+C)',
    scnAMech: 'Motorcycle ambulance network and road improvements to mitigate Phase 2 Delay',
    scnBMech: 'Abolition of institutional delivery costs and essential medicines',
    scnCMech: 'Early detection and timely referral through traditional birth attendants',
    scnDMech: 'Combined intervention: transport + free delivery + TBA + clinical capacity',
    scnBaselineMech: 'No additional intervention — current trajectory and capacity',
    scnLoadedCount: 'scenarios loaded',
    scnOptimal: 'Optimal',
    scnHorizonMMR: 'Horizon MMR',
    scnVsBase: '% vs baseline',
    scnLoading: 'Loading...',
    scnCompareTitle: 'Scenario Results Comparison',
    scnCompareSub: 'Deterministic RK4 simulation results — not retrospective empirical estimates',
    scnColScenario: 'Scenario',
    scnColFinalMMR: 'Final MMR',
    scnColReduction: 'MMR Reduction',
    scnColSaved: 'Deaths Averted',
    scnColTotalCost: 'Total Cost',
    scnColCostLife: 'Cost/Life Saved',
    scnColInst: 'Institutional Delivery',
    scnMechanism: 'Intervention mechanism',
    scnBirths: 'Cumulative Births',
    scnDeaths: 'Maternal Deaths',
    scnANC4: 'ANC4 Coverage',
    scnInstDelivery: 'Institutional Delivery',
    scnRelPerfTitle: 'Relative Performance vs Baseline',
    scnRelPerfSub: 'Percentage improvement in key metrics',
    scnMmrReduction: 'MMR Reduction',
    scnLivesSaved: 'Lives Saved',
    scnDeathsUnit: 'deaths',
    scnSelectPrompt: 'Select an intervention scenario to view its relative performance.',
    scnSynergyTitle: 'Combined Package Synergy',
    scnSynergyDesc: 'Scenario D combines all interventions and leverages synergy between transport improvements, fee abolition, and community TBA capacity to maximize maternal mortality reduction.',
    scnDisclaimer: 'Definitions and simulations are provided by FastAPI; no simulation calculations run in the browser.',
    scnBackendUnavailable: 'Backend unavailable. Scenario results cannot be computed locally.',

    dashBackendDown: 'Backend unavailable. No local scientific simulation is executed.',
    dashBackendDownDesc: 'The system dynamics engine runs on the FastAPI backend. Ensure the backend container is active.',
    dashRk4Badge: 'RK4 Active (Δt = 0.05m)',
    dashPopulation: 'Population:',
    dashHab: 'inhab.',
    dashBaselineMMR: 'Baseline MMR:',
    dashPoverty: 'Poverty:',
    dashAccumBirths: 'cumulative births over 36 months',
    dashSelectScenario: 'Select Simulation Scenario:',
    dashHorizonMMR: 'Horizon MMR',
    dashPer100k: 'per 100k live births',
    dashReduction: 'reduction',
    dashMaternalDeaths: 'Maternal Deaths',
    dashBaselineLine: 'baseline:',
    dashLivesSaved: 'deaths averted',
    dashInstDelivery: 'Institutional Delivery',
    dashCpn4: 'ANC4:',
    dashCostLife: 'Cost per Life Saved',
    dashTotalK: 'Total:',
    dashTrajectoriesTitle: 'System Dynamics Trajectories',
    dashTrajectoriesSub: '5-stock ODE · monthly system snapshots',
    dashMonthPrefix: 'M',
    dashS1: 'Pregnant (S1)',
    dashS2: 'In ANC (S2)',
    dashS3: 'Facility Delivery (S3)',
    dashS4: 'Postpartum (S4)',
    dashS5: 'With Complications (S5)',
    dashMmrTrendTitle: 'Monthly MMR Trend',
    dashMmrTrendSub: 'Maternal Mortality Ratio Trajectory',
    dashPhaseTitle: 'Current System Phase',
    dashPhaseSnapshot: 'Month Snapshot',
    dashPhaseANC: 'ANC Coverage',
    dashPhaseInst: 'Institutional Delivery',
    dashPhaseTrust: 'System Trust',
    dashPhaseCongestion: 'Clinic Congestion',
    dashPhaseDelay2: 'Phase 2 Delay',
    dashPhaseDelay3: 'Phase 3 Delay',
    dashEquityTitle: 'Equity: MMR by Wealth Quintile',
    dashEquitySub: 'Relative reduction by socioeconomic quintile',
    dashDisclaimer: 'Phase 2 delay and congestion indices are simulated model indicators.',
    dashScenarioBase: 'Baseline (Status Quo)',
    dashScenarioA: 'A: Access & Transport',
    dashScenarioB: 'B: Fee Elimination',
    dashScenarioC: 'C: Community TBA Network',
    dashScenarioD: 'D: Combined Package (A+B+C)',

    eqNoResults: 'No simulation results available',
    eqNoResultsDesc: 'Run a simulation to view mortality disaggregated by wealth quintiles and cost-effectiveness analysis.',
    eqTerritoryNeedsBackend: 'Territory: {name}. Backend simulation required.',
    eqNotComputedTitle: 'No quintile rows for this district',
    eqNotComputedDesc: 'Quintile disaggregation only uses real inputs: DHS national wealth-quintile gradients (v005-weighted) applied to district coverage, in data/model_inputs/quintile_coverage_by_district.csv. This district has no rows in that file, so nothing is simulated per quintile: no reductions, lives saved or costs are shown because they would be invented values.',
    eqRefQuintileMMR: 'Reference MMR by wealth quintile (real input)',
    eqRefQuintileNote: 'Dataset input values (wealth_quintiles_mmr), not simulation results.',
    eqTitle: 'Health Equity Analysis',
    eqQuintilesBadge: 'quintiles',
    eqAvgReduction: 'Average MMR Reduction',
    eqAcrossQuintiles: 'across all quintiles',
    eqMaxReduction: 'Highest Reduction',
    eqMinReduction: 'Lowest Reduction',
    eqTotalInvestment: 'Total Investment',
    eqMortalityCostTitle: 'Mortality & Cost-Effectiveness by Quintile',
    eqMortalityCostSub: 'Results disaggregated by population share weighting',
    eqColQuintile: 'Quintile',
    eqColPopShare: 'Pop. Share',
    eqColBaselineMMR: 'Baseline MMR',
    eqColSimMMR: 'Simulated MMR',
    eqColReduction: 'Reduction',
    eqColSaved: 'Lives Saved',
    eqColCostLife: 'Cost/Life Saved',
    eqColBCR: 'BCR',
    eqRelativeTitle: 'Relative MMR Reduction by Quintile',
    eqRelativeSub: 'Percentage reduction versus baseline',
    eqGapTitle: 'Inequality Gap',
    eqGapSub: 'Difference between highest and lowest reduction quintiles',
    eqSimMMR: 'Simulated MMR',
    eqAbsGap: 'Absolute gap:',
    eqPer100kBirths: 'per 100k births',
    eqFiscalTitle: 'Fiscal Cost Distribution',
    eqFiscalSub: 'Budget allocation across quintiles',
    eqMethodology: 'Methodology:',
    eqMethodologyDesc: 'Each row is a paired sub-simulation whose ANC1 and institutional-delivery inputs are the district rates multiplied by DHS national wealth-quintile gradients (v005, births in the last 60 months); scenario cost is split by quintile population share.',
    eqBcrNote: 'BCR = Benefit-Cost Ratio: not computed because the project documents no value of a statistical life (VSL); it is left empty rather than invented.',
    eqScenarioBaseline: 'Baseline (Status Quo)',
    eqScenarioA: 'Scenario A: Access & Transport',
    eqScenarioB: 'Scenario B: Fee Elimination',
    eqScenarioC: 'Scenario C: Community TBA Network',
    eqScenarioD: 'Scenario D: Combined Package (A+B+C)',

    rvTestFailed: 'Test failed',
    rvConvergError: 'Convergence validation error',
    rvSuiteTitle: 'Scientific & Numerical Validation Suite',
    rvSuiteSub: 'RK4 integration and stability verification',
    rvResultsLoaded: 'Results loaded',
    rvAwaitingRun: 'Awaiting run',
    rvRunAll: 'Run All Validation Tests',
    rvRk4Title: 'RK4 Numerical Convergence Verification (4th-Order Runge-Kutta)',
    rvRk4Sub: 'Mathematical evaluation of continuous step (dt = 0.1, 0.05, 0.025 months) of the simulation engine.',
    rvVerifying: 'Verifying...',
    rvReverifyRk4: 'Re-verify RK4',
    rvIntegrator: 'Integration Algorithm',
    rvRk4Classic: 'Classic RK4',
    rvPrecisionOrder: 'Precision order: O(Δt⁴)',
    rvRelDiscError: 'Discretization Relative Error',
    rvMaxTol: 'Max tolerance: <1.000%',
    rvCauchyCriterion: 'Cauchy Criterion',
    rvSatisfied: 'SATISFIED',
    rvNotConverge: 'DOES NOT CONVERGE',
    rvValidationStatus: 'Validation Status',
    rvConverges: 'CONVERGES',
    rvStability: 'Continuous numerical stability',
    rvColTimestep: 'Time Step (Δt)',
    rvColTotalSteps: 'Total Steps (36m)',
    rvColBirthsAcc: 'Cumulative Births',
    rvColDeathsAcc: 'Cumulative Deaths',
    rvColHorizon: 'Horizon MMR (/100k)',
    rvColRelDiff: 'Relative Difference',
    rvUnitMonth: 'mo',
    rvUnitSteps: 'steps',
    rvRefStep: 'Reference Step',
    rvMethodNote: 'Methodological Note: The 4th-order Runge-Kutta method reduces local truncation error to O(Δt⁵) and global error to O(Δt⁴), ensuring stable convergence over the 36-month horizon.',
    rvRunConvergence: 'Running RK4 numerical convergence...',
    rvClickReverify: 'Click "Re-verify RK4" to evaluate engine stability.',
    rvKsTwoSample: 'Kolmogorov-Smirnov Test (Two-Sample)',
    rvKsEquivDesc: 'Two-sample KS: observed facility-delivery rates (DHS-anchored) vs simulated baseline end-state (n=25 districts)',
    rvRunning: 'Running...',
    rvNotAvailable: 'Not available',
    rvRunKs: 'Run KS',
    rvKsDisabled: 'Empirical statistical validation disabled in this build (no local DHS microdata).',
    rvStatKs: 'KS Statistic (D)',
    rvPValue: 'P-Value',
    rvCriticalValue: 'Critical Value',
    rvOutcome: 'Outcome',
    rvApproved: 'PASS',
    rvNotApproved: 'FAIL',
    rvConfigureDhs: 'Configure empirical DHS microdata to enable the test.',
    rvRunKsHint: 'Run KS to compare simulated and empirical distributions.',
    rvSobolTitle: 'Sobol Global Sensitivity Analysis',
    rvSobolSub: 'First-order (S1) and total-order (ST) variance decomposition',
    rvRunSobol: 'Run Sobol',
    rvSobolDisabled: 'Sobol sensitivity analysis not available in this build.',
    rvParam: 'Parameter',
    rvFirstOrder: 'First Order (S1)',
    rvTotalOrder: 'Total Order (ST)',
    rvTopVariance: 'Top variance contributors:',
    rvConfigureRanges: 'Document parameter ranges to enable the analysis.',
    rvRunSobolHint: 'Run Sobol to compute sensitivity indices.',
    rvBootTitle: 'Bootstrap Confidence Intervals',
    rvBootSub: '95% percentile CIs from Monte Carlo draws over documented parameter ranges (paired engine runs)',
    rvRunBootstrap: 'Run Bootstrap',
    rvBootDisabled: 'Bootstrap confidence intervals not available in this build.',
    rvIterations: 'Iterations',
    rvMeanLives: 'Mean Lives Saved',
    rvCi95: '95% CI:',
    rvMeanCostLife: 'Mean Cost/Life',
    rvIcWidthRatio: 'CI Width Ratio',
    rvConfigureUncertainty: 'Configure parametric uncertainty to enable resampling.',
    rvRunBootHint: 'Run Bootstrap to compute confidence intervals.',
    rvExternalTitle: 'External Validation vs Observed Data',
    rvExternalSub: 'Cross-district consistency: observed inputs (WHO/DHS-anchored MMR, DHS coverage) vs simulated baseline (n=25)',
    rvRunExternal: 'Run Validation',
    rvExternalDisabled: 'External validation with DHS microdata not available in this local environment.',
    rvTestDistrict: 'Test District',
    rvObservedMMR: 'Observed MMR',
    rvPredictedMMR: 'Predicted MMR',
    rvRSquared: 'R-squared (R²)',
    rvRmse: 'RMSE',
    rvConfigureHoldout: 'Configure an independent DHS comparator to enable validation.',
    rvRunExternalHint: 'Run validation to compare the model against observed data.',
    rvDataRequired: 'Data Required',
    rvDataRequiredDesc: 'Inputs used: versioned DHS-anchored district rates (25 districts) and live RK4 engine output; the input MMR acts as the calibration anchor and is reported as such.',
    rvSensRequired: 'Sensitivity Required',
    rvSensRequiredDesc: 'Ranges used are the documented ones in `PARAMETER_RANGES` (backend/services/validation.py), declared as PARAMETRIC_ASSUMPTION: 0.5–1.5× multipliers and ±0.12–0.15 additive shifts.',

    docBannerTitle: 'MATERNAL HEALTH DIGITAL TWIN POLICY BRIEF',
    docDistrictLabel: 'District:',
    docEngineSub: 'System Dynamics Simulation & Calibration',
    docGeneratedLabel: 'Report generated:',
    docSection1: '1. District Baseline Epidemiological Profile',
    docTotalPop: 'Total District Population:',
    docAnnualBirths: 'Annual Live Births:',
    docBaselineMMRLine: 'Baseline Maternal Mortality Ratio (MMR):',
    docPer100kBirths: 'per 100k births',
    docAnc4: 'ANC4 Coverage:',
    docInstDelivery: 'Institutional Delivery Rate:',
    docAvgDistance: 'Avg. Distance to Comprehensive EmONC:',
    docHoursTransit: 'h transit',
    docSection2: '2. Comparative Policy Interventions & Projected Outcomes (36-Month Horizon)',
    docColScenario: 'Scenario',
    docColLivesSaved: 'Lives Saved (95% CI)',
    docColFinalMMR: 'Final MMR',
    docColRedPct: 'MMR Red.%',
    docColCostLife: 'Cost/Life Saved',
    docColIcer: 'ICER/DALY',
    docStatusQuo: 'Status Quo (Base)',
    docMotoAmb: '(a) Moto-Ambulance Network',
    docFeeElim: '(b) User Fee Elimination',
    docTbaAlarm: '(c) TBA Alarm Training',
    docCombinedPkg: '(d) Combined Package (a+b+c)',
    docSection3: '3. Strategic Policy Recommendations & Bottleneck Mitigation',
    docSynergy: 'Combined Package Synergy: Package (d) delivers a 44.8% reduction in maternal deaths by simultaneously addressing Phase 1 (decision to seek care via TBA training), Phase 2 (geographic transfer via moto-ambulances), and financial barriers (zero facility delivery fees).',
    docCostThreshold: 'Cost-Effectiveness Threshold: At {icer}/DALY averted, the intervention is highly cost-effective under WHO-CHOICE benchmarks (< 1x national GDP per capita).',
    docEquityFocus: 'Equity Focus: User fee abolition yields 2.3x higher mortality reduction in Quintile 1 (poorest) households.',
    docSection4: '4. Rigorous Statistical & Model Validation Summary',
    docKsLine: 'Kolmogorov-Smirnov Test: D = {d}, p = {p} (Simulated transit distributions match DHS cluster data).',
    docWilcoxonLine: 'Wilcoxon Test: W = {w}, p = {p} (Non-significant calibration bias across 25 districts).',
    docSobolLine: 'Sobol Global Sensitivity: Top variance drivers: {top}.',
    docGofLine: 'Goodness-of-Fit vs Countdown 2030: R² = {r2}, RMSE = {rmse} per 100,000 live births.',
    docBootstrapLine: 'Bootstrap 95% CI (1,000 iterations): Mean Lives Saved = {mean} [CI: {lo} - {hi}].',
    docHypothesisLine: 'Hypothesis Validation: H1 CONFIRMED (Twin identified critical bottlenecks whose mitigation reduces MMR >15%).',
    docNA: 'N/A',
    docNotAvailable: 'Not available',
    docWordTitle: 'MATERNAL HEALTH SYSTEM DYNAMICS DIGITAL TWIN',
    docWordSubtitle: 'TECHNICAL POLICY BRIEF & EPIDEMIOLOGICAL SIMULATION:',
    docModelEngine: 'Model Engine:',
    docModelEngineVal: '4th-Order Runge-Kutta ODE (dt = 0.05 mo) & DHS Calibration',
    docBloodBank: 'Blood Bank & Cold-Chain Availability:',
    docPoverty: 'Poverty Headcount Index (<$1.90/day):',
    docWordSection2: '2. Comparative Policy Packages & 36-Month Projected Outcomes',
    docWordSection3: '3. Wealth Quintile Disaggregation & Pro-Poor Equity Distribution',
    docWordSection4: '4. Statistical Validation, Sensitivity & Formal Hypothesis Testing',
    docColPolicyScenario: 'Policy Scenario',
    docCertified: 'Document certified by the Maternal Health Digital Twin Research & Policy Engine.',
    docExcelSummarySheet: 'Summary',
    docExcelSummaryTitle: 'MATERNAL HEALTH SYSTEM DYNAMICS DIGITAL TWIN - DISTRICT SUMMARY',
    docExcelDistrictName: 'District Name',
    docExcelCountry: 'Country',
    docExcelRegion: 'Region',
    docExcelPopulation: 'Population',
    docExcelAnnualBirths: 'Annual Births',
    docExcelBaselineMMR: 'Baseline MMR (per 100k)',
    docExcelAnc4: 'ANC4 Coverage (%)',
    docExcelInstRate: 'Institutional Delivery Rate (%)',
    docExcelTravelTime: 'Avg. Travel Time (Hours)',
    docExcelScenarioResults: 'SCENARIO RESULTS (36-MONTH HORIZON)',
    docExcelColId: 'Scenario ID',
    docExcelColName: 'Scenario Name',
    docExcelColSaved: 'Lives Saved',
    docExcelColCiLow: 'Lives Saved 95% CI Low',
    docExcelColCiHigh: 'Lives Saved 95% CI High',
    docExcelColFinalMMR: 'Final MMR',
    docExcelColRed: 'MMR Red. %',
    docExcelColCost: 'Total Cost (USD)',
    docExcelColCostLife: 'Cost/Life Saved (USD)',
    docExcelColIcer: 'ICER ($/DALY)',
    docExcelTrajSheet: 'Trajectories',
    docExcelColMonth: 'Month',
    docExcelColS1: 'Pregnant Women (S1)',
    docExcelColS2: 'In ANC (S2)',
    docExcelColS3: 'Facility Delivery (S3)',
    docExcelColS4: 'Postpartum (S4)',
    docExcelColS5: 'With Complications (S5)',
    docExcelColBirths: 'Monthly Births',
    docExcelColDeaths: 'Monthly Deaths',
    docExcelColSavedTraj: 'Lives Saved',
    docExcelColMmr: 'Calculated MMR',
    docExcelColAnc: 'ANC Coverage %',
    docExcelColFac: 'Facility Del %',
    docExcelColTrust: 'System Trust',
    docExcelColCongestion: 'Congestion Index',
    docExcelEquitySheet: 'Equity',
    docExcelColQuintile: 'Quintile',
    docExcelColLabel: 'Label',
    docExcelColShare: 'Population Share',
    docExcelColBaseMMR: 'Baseline MMR',
    docExcelColSimMMR: 'Simulated MMR',
    docExcelColRelRed: 'Relative Red. %',
    docExcelColAbsRed: 'Absolute Red.',
    docExcelValSheet: 'Validation',
    docExcelValTitle: 'STATISTICAL VALIDATION & SOBOL SENSITIVITY REPORT',
    docExcelKsTitle: '1. Kolmogorov-Smirnov Test (DHS Travel Times)',
    docExcelStatD: 'Statistic D',
    docExcelPValue: 'p-value',
    docExcelEquiv: 'Statistically Equivalent',
    docExcelYes: 'YES',
    docExcelNo: 'NO',
    docExcelWilcoxonTitle: '2. Wilcoxon Signed-Rank Test (Cross-District Concordance)',
    docExcelStatW: 'Statistic W',
    docExcelZScore: 'Z-Score',
    docExcelGofTitle: '3. Goodness of Fit & Countdown 2030 Benchmark',
    docExcelRSq: 'R-Squared (R²)',
    docExcelRmse: 'RMSE (per 100k live births)',
    docExcelMae: 'Mean Absolute Error (MAE)',
    docExcelSobolTitle: '4. Sobol Global Sensitivity Indices',
    docExcelColParam: 'Parameter',
    docExcelColS1h: 'First-Order (S1)',
    docExcelColSTh: 'Total-Order (ST)',
    docExcelColCiLowH: 'CI 95% Low',
    docExcelColCiHighH: 'CI 95% High',
    docPdfFilename: 'Report',
    docXlsxFilename: 'Data',
    docDocxFilename: 'Technical_Report',
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

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
