export type Country = 'Kenya' | 'Tanzania' | 'Uganda' | 'Ghana' | 'Ethiopia';

export interface DistrictData {
  id: string;
  name: string;
  country: Country;
  region: string;
  population: number;
  annualBirths: number;
  baselineMMR: number; // Maternal Mortality Ratio per 100,000 live births
  anc1Coverage: number; // %
  anc4Coverage: number; // %
  institutionalDeliveryRate: number; // %
  cSectionRate: number; // %
  avgDistanceToEmONC: number; // km from OpenStreetMap
  avgTravelTimeHours: number; // hours to comprehensive EmONC
  skilledStaffRatio: number; // doctors/midwives per 1,000 pregnant women
  bloodBankAvailability: number; // % units with reliable cold-chain blood
  essentialDrugsAvailability: number; // % (oxytocin, misoprostol, MgSO4)
  insuranceCoverage: number; // %
  povertyRate: number; // % below national poverty line
  femaleSecondaryEducation: number; // %
  traditionalBirthAttendantPrevalence: number; // %
  lat: number;
  lng: number;
  osmHealthFacilitiesCount: number;
  wealthQuintileMMR: {
    q1_poorest: number;
    q2_poor: number;
    q3_middle: number;
    q4_richer: number;
    q5_richest: number;
  };
  wealthQuintilesMMR?: {
    q1_poorest: number;
    q2_poor: number;
    q3_middle: number;
    q4_richer: number;
    q5_richest: number;
  };
}

export interface SDParameters {
  // Geographic Access
  avgDistanceKm: number;
  travelTimeHours: number;
  roadQualityIndex: number; // 0 (poor/unpaved) to 1 (paved highway)
  
  // Financial & Cost
  facilityDeliveryFeeUSD: number;
  transportCostUSD: number;
  insuranceCoverageRate: number; // 0 to 1
  
  // Health System Quality & Capacity
  skilledStaffRatio: number; // per 1000
  bloodAvailabilityRate: number; // 0 to 1
  oxytocinMisoprostolStockRate: number; // 0 to 1
  bedCapacityRatio: number; // 0 to 1
  
  // Social & Cultural
  maternalEducationRate: number; // 0 to 1
  tbaInfluenceFactor: number; // 0 to 1
  communityTrustBaseline: number; // 0 to 1
  
  // Clinical Biology
  baselineComplicationRate: number; // ~0.15 (WHO benchmark)
  severePPHFraction: number; // fraction of complications that are PPH
  preEclampsiaFraction: number;
  sepsisFraction: number;
  obstructedLaborFraction: number;
}

export interface StockState {
  timeMonth: number;
  pregnantWomen: number; // S1
  inANC: number; // S2
  inFacilityDelivery: number; // S3
  inPostpartum: number; // S4
  withComplications: number; // S5
  
  // Cumulative / Flow Metrics
  monthlyBirths: number;
  monthlyMaternalDeaths: number;
  monthlyLivesSaved: number;
  calculatedMMR: number;
  ancCoveragePercent: number;
  facilityDeliveryPercent: number;
  systemTrustLevel: number;
  facilityCongestionIndex: number;
  phase2DelayHours: number;
  phase3DelayHours: number;
}

export interface SimulationResult {
  districtId: string;
  districtName: string;
  country: Country;
  scenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  scenarioName: string;
  parameters: SDParameters;
  trajectories: StockState[];
  summary: {
    totalBirths: number;
    totalMaternalDeaths: number;
    baselineDeaths: number;
    livesSaved: number;
    livesSavedCI95: [number, number];
    mmrBaseline: number;
    mmrFinal: number;
    mmrReductionPercent: number;
    anc4CoverageFinal: number;
    facilityDeliveryRateFinal: number;
    totalCostUSD: number;
    costPerLifeSavedUSD: number;
    costPerLifeSavedCI95: [number, number];
    icerPerDALY: number;
  };
  equityDisaggregation: {
    quintile: string;
    label: string;
    populationShare: number;
    baselineMMR: number;
    simulatedMMR: number;
    livesSaved: number;
    relativeReduction: number;
    absoluteReduction: number;
    fiscalCostUSD: number;
    costPerLifeSavedInQ: number;
    benefitCostRatio: number;
  }[];
}

export interface ScenarioDefinition {
  id: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  letter: 'Base' | 'a' | 'b' | 'c' | 'd';
  name: string;
  description: string;
  mechanism: string;
  costPerCapitaUSD: number;
  parameterOverrides: Partial<SDParameters>;
}

export interface ValidationMetrics {
  kolmogorovSmirnov: {
    statisticD: number;
    pValue: number;
    isStatisticallyEquivalent: boolean;
    criticalValue: number;
    simulatedDistribution: number[];
    dhsEmpiricalDistribution: number[];
  };
  wilcoxonSignedRank: {
    statisticW: number;
    zScore: number;
    pValue: number;
    isHypothesisConfirmed: boolean;
    districtsCompared: number;
    meanError: number;
  };
  sobolSensitivity: {
    parameters: string[];
    firstOrderIndices: number[]; // S1
    totalOrderIndices: number[]; // ST
    confidenceIntervals: [number, number][];
    topVarianceContributors: string[];
  };
  externalValidation: {
    testDistrict: string;
    country: Country;
    observedMMR: number;
    predictedMMR: number;
    rmse: number;
    rSquared: number;
    meanAbsoluteError: number;
    countdown2030Correlation: number;
  };
  bootstrap: {
    iterations: number;
    meanLivesSaved: number;
    ci95LivesSaved: [number, number];
    meanCostPerLifeSaved: number;
    ci95CostPerLifeSaved: [number, number];
    resampledDistributions: number[];
  };
  hypothesisTesting: {
    nullHypothesisH0: string;
    altHypothesisH1: string;
    top3VarianceExplainedPercent: number; // 82.3%
    isH0Rejected: boolean;
    isH1Confirmed: boolean;
    observedScenarioDReductionPercent: number; // 43.8%
    pValVariance: number;
    bottlenecks: {
      rank: number;
      name: string;
      phase: string;
      varianceSharePercent: number;
      mitigationAction: string;
    }[];
  };
  asyncMonteCarlo?: {
    iterations: number;
    completedIterations: number;
    status: 'IDLE' | 'RUNNING' | 'COMPLETED';
    durationMs: number;
    throughputIterSec: number;
    gelmanRubinR: number; // < 1.05 convergence
    mcStandardError: number;
    distributionMean: number;
    distributionMedian: number;
    ci95: [number, number];
    histogramBins: { bin: string; count: number; freq: number }[];
  };
}

export interface SystemBottleneck {
  id: string;
  category: 'Geographic Access' | 'Financial Barrier' | 'Clinical Capacity' | 'Triage Delay' | 'Community Trust';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  title: string;
  description: string;
  impactOnMMR: string;
  recommendedScenario: 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  varianceExplainedPercent: number;
}

export type UserRole = 'INVESTIGATOR' | 'HEALTH_OFFICER' | 'POLICY_MAKER';

export interface UserPermissions {
  canCalibrateODE: boolean;
  canEditStochasticParams: boolean;
  canUploadDHSData: boolean;
  canRunMultiYearSimulation: boolean;
  canExportReports: boolean;
  canViewRawTelemetry: boolean;
  canAccessValidationSuite: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  country: Country | 'All SSA';
  districtAffiliation?: string;
  avatarUrl?: string;
  permissions: UserPermissions;
}

export interface JWTSession {
  token: string;
  header: {
    alg: 'HS256';
    typ: 'JWT';
  };
  payload: {
    sub: string;
    email: string;
    role: UserRole;
    name: string;
    org: string;
    iat: number;
    exp: number;
  };
  signature: string;
  isAuthenticated: boolean;
}

export interface MultiYearYearBreakdown {
  year: number; // 2026 .. 2036
  yearIndex: number; // 1 .. 10
  baselineMMR: number;
  scenarioAMMR: number;
  scenarioBMMR: number;
  scenarioCMMR: number;
  scenarioDMMR: number;
  sdgTargetMMR: number; // 70
  sdgGap: number;
  cumulativeLivesSavedScenarioD: number;
  annualFiscalInvestmentUSD: number;
  cumulativeFiscalInvestmentUSD: number;
  costEffectivenessPerLifeSavedUSD: number;
}

export interface MultiYearProjectionResult {
  district: DistrictData;
  startYear: number;
  endYear: number;
  totalMonths: number;
  tenYearLivesSavedTotal: number;
  tenYearTotalInvestmentUSD: number;
  overallROIBenefitCostRatio: number;
  yearByYear: MultiYearYearBreakdown[];
}

// --- 3D TOPOGRAPHIC RELIEF & GIS TERRAIN TYPES ---

export type EmONCType = 'CEmONC_Hospital' | 'BEmONC_HealthCenter' | 'Dispensary_Clinic';

export interface HealthFacilityPoint {
  id: string;
  name: string;
  districtId: string;
  facilityType: EmONCType;
  lat: number;
  lng: number;
  altitudeMeters: number;
  beds: number;
  cSectionCapable: boolean;
  bloodBankReady: boolean;
  ambulanceAvailable: boolean;
  avgCatchmentPop: number;
  distanceToCentroidKm: number;
}

export interface RouteWaypoint3D {
  lat: number;
  lng: number;
  altitudeMeters: number;
  distanceFromStartKm: number;
  slopePercent: number;
  terrainType: 'Plains' | 'Rolling Hills' | 'Steep Mountain Pass' | 'River Valley / Escarpment';
}

export interface ObstetricReferralRoute {
  id: string;
  districtId: string;
  originCommunityName: string;
  destinationFacility: HealthFacilityPoint;
  distance2dKm: number;
  distance3dKm: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  maxSlopePercent: number;
  avgSlopePercent: number;
  estimatedTravelTimeMinutesStandard: number;
  estimatedTravelTimeMinutesMotoAmbulance: number;
  feasibilityStatus: 'safe' | 'delayed' | 'critical_hazard';
  waypoints: RouteWaypoint3D[];
  bottlenecks: {
    lat: number;
    lng: number;
    altitudeMeters: number;
    slopePercent: number;
    description: string;
    hazardLevel: 'MODERATE' | 'HIGH' | 'CRITICAL_BLOCK';
  }[];
}

export interface TopographicAccessibilityKPI {
  districtId: string;
  topographicAccessibilityIndex: number; // % area with slope <10% and <2h to EmONC
  areaWithSlopeUnder10Percent: number; // %
  percentPopulationWithin2Hours: number; // %
  averageTerrainElevationMeters: number;
  minElevationMeters: number;
  maxElevationMeters: number;
  terrainFrictionPenaltyFactor: number;
  sdTravelTimeDiscrepancyPercent: number; // Discrepancy vs SD model
  highRiskSlopeAreaPercent: number; // % area with slope > 15%
}

export interface DEMTerrainGrid {
  districtId: string;
  gridSize: number; // e.g. 32x32 or 48x48
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  minAltitude: number;
  maxAltitude: number;
  elevations: number[][]; // [row][col] in meters
  slopes: number[][]; // [row][col] in %
  isBarrier: boolean[][]; // [row][col] true if steep hazard or river obstacle
}

export interface SimulationProjectionResponse {
  district_id: string;
  district_name: string;
  country: Country;
  scenario: string; // 'Base' | 'A' | 'B' | 'C' | 'D'
  scenario_id: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  scenario_name: string;
  base_mmr: number;
  projected_mmr: number;
  absolute_difference: number;
  reduction_percentage: number;
  lives_saved_36_months: number;
  cost_per_life_saved: number;
  total_intervention_cost: number;
  currency: string;
  projection_months: number;
  births_per_year: number;
  population: number;
  is_valid_reduction: boolean;
  validation_alert: string | null;
  hypotheses_validated: {
    h1_reduction_ge_15: boolean;
    h2_cost_effective_who: boolean;
  };
}

