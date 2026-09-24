import { DistrictData, SimulationResult } from '../types';

export function deriveEquityDisaggregation(
  district: DistrictData,
  activeScenarioId: string,
  summary: SimulationResult['summary']
): NonNullable<SimulationResult['equityDisaggregation']> {
  const qData = district.wealthQuintileMMR || district.wealthQuintilesMMR || {
    q1_poorest: district.baselineMMR * 1.35,
    q2_poor: district.baselineMMR * 1.15,
    q3_middle: district.baselineMMR * 0.95,
    q4_richer: district.baselineMMR * 0.82,
    q5_richest: district.baselineMMR * 0.70,
  };

  // Policy elasticities by scenario
  // Scenario B (Eliminación de tarifas) and D (Integral) provide the highest pro-poor benefit
  const elasticities: Record<string, [number, number, number, number, number]> = {
    baseline: [0, 0, 0, 0, 0],
    scenario_a: [1.20, 1.12, 1.00, 0.88, 0.75], // Geographic transport benefits remote/poorer quintiles
    scenario_b: [1.32, 1.18, 0.98, 0.82, 0.65], // Fee abolition eliminates catastrophic barriers for poorest
    scenario_c: [1.28, 1.15, 0.96, 0.85, 0.70], // TBA network identifies early cases in disadvantaged areas
    scenario_d: [1.30, 1.16, 0.98, 0.85, 0.68], // Integrated package has high progressive equity impact
  };

  const mults = elasticities[activeScenarioId] || [1.0, 1.0, 1.0, 1.0, 1.0];
  const avgReduction = Math.max(0, summary.mmrReductionPercent || 0);

  const quintilesDef = [
    { key: 'q1_poorest', label: 'Q1 - Más Pobre', base: qData.q1_poorest, mult: mults[0] },
    { key: 'q2_poor', label: 'Q2 - Pobre', base: qData.q2_poor, mult: mults[1] },
    { key: 'q3_middle', label: 'Q3 - Medio', base: qData.q3_middle, mult: mults[2] },
    { key: 'q4_richer', label: 'Q4 - Rico', base: qData.q4_richer, mult: mults[3] },
    { key: 'q5_richest', label: 'Q5 - Más Rico', base: qData.q5_richest, mult: mults[4] },
  ];

  const totalBirthsInDistrict = summary.totalBirths || (district.population * 0.038 * 3);
  const birthsPerQ = totalBirthsInDistrict * 0.20;
  const costPerQ = (summary.totalCostUSD || 0) * 0.20;

  return quintilesDef.map((q) => {
    const relRed = Math.min(95, Math.max(0, avgReduction * q.mult));
    const simMMR = Math.max(10, q.base * (1 - relRed / 100));
    const absRed = Math.max(0, q.base - simMMR);
    const livesSavedQ = Math.max(0, (absRed * birthsPerQ) / 100000);
    const costPerLifeSaved = livesSavedQ > 0 ? costPerQ / livesSavedQ : 0;
    const benefitCostRatio = costPerLifeSaved > 0 ? 50000 / costPerLifeSaved : 2.5;

    return {
      quintile: q.key,
      label: q.label,
      populationShare: 0.20,
      baselineMMR: q.base,
      simulatedMMR: simMMR,
      livesSaved: livesSavedQ,
      relativeReduction: relRed,
      absoluteReduction: absRed,
      fiscalCostUSD: costPerQ,
      costPerLifeSavedInQ: costPerLifeSaved,
      benefitCostRatio: Math.max(0.5, Math.min(15, benefitCostRatio)),
    };
  });
}
