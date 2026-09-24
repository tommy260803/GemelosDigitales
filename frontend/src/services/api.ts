/**
 * API Client for Maternal Health Digital Twin
 * Connects React frontend to FastAPI backend via Express proxy
 */

import { DistrictData, SimulationResult, ValidationMetrics } from '../types';

const API_BASE = '/api';

async function readJsonResponse(response: Response, fallbackMessage: string): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`${fallbackMessage}: ${response.status}${text ? ' (respuesta no JSON)' : ''}`);
  }
  return response.json();
}

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Check if API is available (no caching — always re-check on explicit calls)
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, {}, 5000);
    return response.ok;
  } catch {
    return false;
  }
}

// =========================================================
// DISTRICTS
// =========================================================

export async function fetchDistricts(country?: string): Promise<DistrictData[]> {
  const url = country
    ? `${API_BASE}/districts?country=${encodeURIComponent(country)}`
    : `${API_BASE}/districts`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Failed to fetch districts: ${response.status}`);
  return readJsonResponse(response, 'KS test failed');
}

export async function fetchDistrict(districtId: string): Promise<DistrictData> {
  const response = await fetchWithTimeout(`${API_BASE}/districts/${districtId}`);
  if (!response.ok) throw new Error(`Failed to fetch district: ${response.status}`);
  return readJsonResponse(response, 'Sobol analysis failed');
}

// =========================================================
// SIMULATIONS
// =========================================================

export async function runSimulation(
  districtId: string,
  scenarioId: string = 'baseline',
  months: number = 36,
  customParams?: Record<string, number>
): Promise<SimulationResult> {
  const response = await fetchWithTimeout(`${API_BASE}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, scenario_id: scenarioId, months, custom_params: customParams }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Simulation failed' }));
    throw new Error(error.detail || `Simulation failed: ${response.status}`);
  }

  const data = await response.json();

  // Transform API response to SimulationResult format
  return transformApiSimulationResult(data);
}

export async function compareScenarios(districtId: string, months: number = 36): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/simulation/compare/${districtId}?months=${months}`);
  if (!response.ok) throw new Error(`Failed to compare scenarios: ${response.status}`);
  return readJsonResponse(response, 'Bootstrap failed');
}

// =========================================================
// VALIDATION
// =========================================================

export async function runKolmogorovSmirnov(districtId: string): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/ks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, test_type: 'KS' }),
  });
  if (response.status === 410) throw new Error('VALIDATION_UNAVAILABLE');
  if (!response.ok) throw new Error(`KS test failed: ${response.status}`);
  return readJsonResponse(response, 'External validation failed');
}

export async function runSobolSensitivity(districtId: string): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/sobol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, test_type: 'SOBOL' }),
  });
  if (response.status === 410) throw new Error('VALIDATION_UNAVAILABLE');
  if (!response.ok) throw new Error(`Sobol analysis failed: ${response.status}`);
  return readJsonResponse(response, 'RK4 convergence validation failed');
}

export async function runBootstrap(districtId: string, scenarioId: string = 'scenario_d'): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, test_type: 'BOOTSTRAP' }),
  });
  if (response.status === 410) throw new Error('VALIDATION_UNAVAILABLE');
  if (!response.ok) throw new Error(`Bootstrap failed: ${response.status}`);
  return response.json();
}

export async function runExternalValidation(districtId: string): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/external/${districtId}`);
  if (response.status === 410) throw new Error('VALIDATION_UNAVAILABLE');
  if (!response.ok) throw new Error(`External validation failed: ${response.status}`);
  return response.json();
}

export async function runRK4Convergence(districtId: string, scenarioId = 'scenario_d', months = 36): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/convergence/${encodeURIComponent(districtId)}?scenario_id=${encodeURIComponent(scenarioId)}&months=${months}`);
  if (!response.ok) throw new Error(`RK4 convergence validation failed: ${response.status}`);
  return response.json();
}

// =========================================================
// SCENARIOS
// =========================================================

export async function fetchScenarios(): Promise<any[]> {
  const response = await fetchWithTimeout(`${API_BASE}/scenarios`);
  if (!response.ok) throw new Error(`Failed to fetch scenarios: ${response.status}`);
  return response.json();
}

// =========================================================
// TRANSFORM HELPERS
// =========================================================

function transformApiSimulationResult(data: any): SimulationResult {
  const summary = data.summary;

  return {
    districtId: data.district_id,
    districtName: data.district_name,
    country: data.country,
    scenarioId: data.scenario_id,
    scenarioName: data.scenario_name,
    parameters: {} as any, // Parameters are computed on backend
    trajectories: (data.trajectories || []).map((x: any) => ({
      timeMonth: x.time_month,
      pregnantWomen: x.pregnant_women,
      inANC: x.in_anc,
      inFacilityDelivery: x.in_facility_delivery,
      inPostpartum: x.in_postpartum,
      withComplications: x.with_complications,
      monthlyBirths: x.monthly_births,
      monthlyMaternalDeaths: x.monthly_maternal_deaths,
      monthlyLivesSaved: 0,
      calculatedMMR: x.monthly_mmr,
      ancCoveragePercent: x.anc_coverage_percent,
      facilityDeliveryPercent: x.facility_delivery_percent,
      systemTrustLevel: x.system_trust_level,
      facilityCongestionIndex: x.facility_congestion_index,
      phase2DelayHours: x.phase2_delay_hours,
      phase3DelayHours: x.facility_delay_index,
    })),
    summary: {
      totalBirths: summary.total_births,
      totalMaternalDeaths: summary.total_maternal_deaths,
      baselineDeaths: summary.total_maternal_deaths + summary.deaths_avoided,
      // Compatibility aliases use the corrected paired metrics, never heuristic CIs.
      livesSaved: summary.deaths_avoided,
      livesSavedCI95: [0, 0],
      mmrBaseline: summary.horizon_mmr / Math.max(1e-9, 1 - summary.mortality_reduction_percent / 100),
      mmrFinal: summary.horizon_mmr,
      mmrReductionPercent: summary.mortality_reduction_percent,
      anc4CoverageFinal: summary.anc_coverage_final,
      facilityDeliveryRateFinal: summary.facility_delivery_rate_final,
      totalCostUSD: summary.total_cost_usd,
      costPerLifeSavedUSD: summary.cost_per_death_avoided_usd ?? 0,
      costPerLifeSavedCI95: [0, 0],
      icerPerDALY: 0,
    },
    equityDisaggregation: (data.equity_disaggregation || []).map((q: any) => ({
      quintile: q.quintile,
      label: q.label,
      populationShare: q.population_share,
      baselineMMR: q.baseline_mmr,
      simulatedMMR: q.simulated_mmr,
      livesSaved: q.lives_saved,
      relativeReduction: q.relative_reduction,
      absoluteReduction: q.absolute_reduction,
      fiscalCostUSD: q.fiscal_cost_usd,
      costPerLifeSavedInQ: q.cost_per_life_saved_in_q,
      benefitCostRatio: q.benefit_cost_ratio,
    })),
  };
}
