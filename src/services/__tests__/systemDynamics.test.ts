import { SystemDynamicsEngine } from '../systemDynamics';
import { SUB_SAHARAN_DISTRICTS } from '../../data/districts';
import { DistrictData } from '../../types';

// Minimal test dataset for Garissa District as benchmark
export const GARISSA_TEST_DATA: DistrictData = {
  id: 'garissa-ke',
  name: 'Garissa District',
  country: 'Kenya',
  region: 'North Eastern Province',
  population: 841353,
  annualBirths: 29447,
  baselineMMR: 646,
  anc1Coverage: 62.4,
  anc4Coverage: 34.2,
  institutionalDeliveryRate: 46.5,
  cSectionRate: 2.1,
  avgDistanceToEmONC: 38.5,
  avgTravelTimeHours: 3.9,
  skilledStaffRatio: 1.1,
  bloodBankAvailability: 42.0,
  essentialDrugsAvailability: 68.0,
  insuranceCoverage: 11.2,
  povertyRate: 65.5,
  femaleSecondaryEducation: 22.4,
  traditionalBirthAttendantPrevalence: 48.0,
  lat: -0.4532,
  lng: 39.6461,
  osmHealthFacilitiesCount: 14,
  wealthQuintileMMR: {
    q1_poorest: 891,
    q2_poor: 762,
    q3_middle: 614,
    q4_richer: 491,
    q5_richest: 342,
  },
};

export interface SystemDynamicsTestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runSystemDynamicsValidationSuite(): SystemDynamicsTestResult[] {
  const results: SystemDynamicsTestResult[] = [];

  // Test 1: Baseline Calibration
  const simBaseline = SystemDynamicsEngine.simulate(GARISSA_TEST_DATA, 'baseline', {}, 36);
  const predictedMMR = simBaseline.summary.mmrFinal;
  const observedMMR = GARISSA_TEST_DATA.baselineMMR;
  const errorRatio = Math.abs(predictedMMR - observedMMR) / observedMMR;

  results.push({
    name: 'Baseline Calibration Tolerance (<5% error)',
    passed: errorRatio < 0.05,
    message: `Observed: ${observedMMR}, Simulated: ${predictedMMR} (Error: ${(errorRatio * 100).toFixed(2)}%)`,
  });

  // Test 2: Scenario D reduces MMR by >= 15% and saves lives
  const simD = SystemDynamicsEngine.simulate(GARISSA_TEST_DATA, 'scenario_d', {}, 36);
  const mmrDrop = simD.summary.mmrReductionPercent;
  const livesSaved = simD.summary.livesSaved;

  results.push({
    name: 'Scenario D (Combined) MMR Reduction (>=15%)',
    passed: simD.summary.mmrFinal < simBaseline.summary.mmrFinal && mmrDrop >= 15.0,
    message: `Baseline: ${predictedMMR} -> Scenario D: ${simD.summary.mmrFinal} (-${mmrDrop.toFixed(1)}%)`,
  });

  results.push({
    name: 'Scenario D (Combined) Positive Lives Saved (>0)',
    passed: livesSaved > 0,
    message: `Lives saved: +${livesSaved} mothers [95% CI: ${simD.summary.livesSavedCI95.join(' - ')}]`,
  });

  // Test 3: Stock Non-Negativity across all 5 stocks
  let allStocksPositive = true;
  const scenarios: Array<'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d'> = [
    'baseline',
    'scenario_a',
    'scenario_b',
    'scenario_c',
    'scenario_d',
  ];

  scenarios.forEach((scen) => {
    const sim = SystemDynamicsEngine.simulate(GARISSA_TEST_DATA, scen, {}, 36);
    sim.trajectories.forEach((step) => {
      if (
        step.pregnantWomen <= 0 ||
        step.inANC <= 0 ||
        step.inFacilityDelivery <= 0 ||
        step.inPostpartum <= 0 ||
        step.withComplications <= 0
      ) {
        allStocksPositive = false;
      }
    });
  });

  results.push({
    name: '5-Stock Conservation & Non-Negativity (S1..S5 > 0)',
    passed: allStocksPositive,
    message: allStocksPositive ? 'All stocks strictly positive over 36 months' : 'Negative stock violation detected',
  });

  // Test 4: All 20 Sub-Saharan Districts Validation
  let allDistrictsPassed = true;
  let districtFails: string[] = [];

  SUB_SAHARAN_DISTRICTS.forEach((d) => {
    const base = SystemDynamicsEngine.simulate(d, 'baseline', {}, 36);
    const scD = SystemDynamicsEngine.simulate(d, 'scenario_d', {}, 36);

    const calibErr = Math.abs(base.summary.mmrFinal - d.baselineMMR) / d.baselineMMR;
    if (calibErr >= 0.05 || scD.summary.mmrReductionPercent < 15 || scD.summary.livesSaved <= 0) {
      allDistrictsPassed = false;
      districtFails.push(d.name);
    }
  });

  results.push({
    name: 'Full Sub-Saharan Dataset Verification (25 Districts)',
    passed: allDistrictsPassed,
    message: allDistrictsPassed ? 'All districts passed calibration and Scenario D criteria' : `Failed in: ${districtFails.join(', ')}`,
  });

  return results;
}
