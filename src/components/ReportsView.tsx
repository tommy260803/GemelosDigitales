import React from 'react';
import { DistrictData, SimulationResult } from '../types';

interface Props { district: DistrictData; allResults: Record<string, SimulationResult>; }
/** A compact, honest report preview. Formal validation/economic claims are excluded. */
export const ReportsView: React.FC<Props> = ({ district, allResults }) => (
  <div className="space-y-4"><div><h2 className="text-xl font-bold">Simulation report</h2><p className="text-sm text-slate-400">Deterministic model outputs for {district.name}. They are not empirical effect estimates.</p></div>
  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Scenario</th><th>Cumulative births</th><th>Maternal deaths</th><th>Horizon MMR</th><th>Deaths avoided vs baseline</th><th>Configured cost</th></tr></thead><tbody>{Object.values(allResults).map(r=><tr key={r.scenarioId} className="border-t border-slate-800"><td>{r.scenarioName}</td><td>{r.summary.totalBirths.toFixed(0)}</td><td>{r.summary.totalMaternalDeaths.toFixed(2)}</td><td>{r.summary.mmrFinal.toFixed(2)}</td><td>{r.summary.livesSaved.toFixed(2)}</td><td>${r.summary.totalCostUSD.toFixed(0)}</td></tr>)}</tbody></table></div>
  <p className="text-xs text-amber-300">No CI95, Sobol, external validation, empirical equity, DALY, or ICER result is exported by this interface.</p></div>
);
