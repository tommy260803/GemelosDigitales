/**
 * API Client for Maternal Health Digital Twin
 * Connects React frontend to FastAPI backend via Express proxy
 */

import { DistrictData, SimulationResult, ValidationMetrics } from '../types';

const API_BASE = '/api';

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

// Check if API is available
let apiAvailable: boolean | null = null;

export async function checkApiAvailability(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, {}, 3000);
    apiAvailable = response.ok;
    return apiAvailable;
  } catch {
    apiAvailable = false;
    return false;
  }
}

export function resetApiAvailability() {
  apiAvailable = null;
}

// =========================================================
// DISTRICTS
// =========================================================

export async function fetchDistricts(country?: string): Promise<Partial<DistrictData>[]> {
  const url = country 
    ? `${API_BASE}/districts?country=${encodeURIComponent(country)}`
    : `${API_BASE}/districts`;
  
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Failed to fetch districts: ${response.status}`);
  return response.json();
}

export async function fetchDistrict(districtId: string): Promise<Partial<DistrictData>> {
  const response = await fetchWithTimeout(`${API_BASE}/districts/${districtId}`);
  if (!response.ok) throw new Error(`Failed to fetch district: ${response.status}`);
  return response.json();
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
  return response.json();
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
  if (!response.ok) throw new Error(`KS test failed: ${response.status}`);
  return response.json();
}

export async function runSobolSensitivity(districtId: string): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/sobol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, test_type: 'SOBOL' }),
  });
  if (!response.ok) throw new Error(`Sobol analysis failed: ${response.status}`);
  return response.json();
}

export async function runBootstrap(districtId: string, scenarioId: string = 'scenario_d'): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, test_type: 'BOOTSTRAP' }),
  });
  if (!response.ok) throw new Error(`Bootstrap failed: ${response.status}`);
  return response.json();
}

export async function runExternalValidation(districtId: string): Promise<any> {
  const response = await fetchWithTimeout(`${API_BASE}/validation/external/${districtId}`);
  if (!response.ok) throw new Error(`External validation failed: ${response.status}`);
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
    trajectories: [], // Trajectories not returned by API for performance (can be fetched separately)
    summary: {
      totalBirths: summary.total_births,
      totalMaternalDeaths: summary.total_maternal_deaths,
      baselineDeaths: summary.baseline_deaths,
      livesSaved: summary.lives_saved,
      livesSavedCI95: summary.lives_saved_ci95,
      mmrBaseline: summary.mmr_baseline,
      mmrFinal: summary.mmr_final,
      mmrReductionPercent: summary.mmr_reduction_percent,
      anc4CoverageFinal: summary.anc4_coverage_final,
      facilityDeliveryRateFinal: summary.facility_delivery_rate_final,
      totalCostUSD: summary.total_cost_usd,
      costPerLifeSavedUSD: summary.cost_per_life_saved_usd,
      costPerLifeSavedCI95: summary.cost_per_life_saved_ci95,
      icerPerDALY: summary.icer_per_daly,
    },
    equityDisaggregation: data.equity_disaggregation.map((q: any) => ({
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
