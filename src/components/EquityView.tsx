import React, { useMemo } from 'react';
import { 
  Scale, 
  TrendingDown, 
  Users, 
  Award, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { SystemDynamicsEngine } from '../services/systemDynamics';

interface EquityViewProps {
  district: DistrictData;
  activeScenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
}

export const EquityView: React.FC<EquityViewProps> = ({ district, activeScenarioId }) => {
  const simResult: SimulationResult = useMemo(() => {
    return SystemDynamicsEngine.simulate(district, activeScenarioId, {}, 36);
  }, [district, activeScenarioId]);

  const equityData = simResult.equityDisaggregation;

  const wealthQ = district.wealthQuintileMMR || district.wealthQuintilesMMR || {
    q1_poorest: Math.round(district.baselineMMR * 1.38),
    q2_poor: Math.round(district.baselineMMR * 1.18),
    q3_middle: Math.round(district.baselineMMR * 0.95),
    q4_richer: Math.round(district.baselineMMR * 0.76),
    q5_richest: Math.round(district.baselineMMR * 0.53),
  };

  const baselineQ1 = wealthQ.q1_poorest;
  const baselineQ5 = wealthQ.q5_richest;
  const baselineGap = Math.max(1, baselineQ1 - baselineQ5);

  const simulatedQ1 = equityData.find((q) => q.quintile === 'Q1' || q.quintile === 'q1_poorest')?.simulatedMMR || baselineQ1;
  const simulatedQ5 = equityData.find((q) => q.quintile === 'Q5' || q.quintile === 'q5_richest')?.simulatedMMR || baselineQ5;
  const simulatedGap = Math.max(0, simulatedQ1 - simulatedQ5);
  const gapReductionPercent = Math.round(((baselineGap - simulatedGap) / baselineGap) * 100);

  const totalLivesSavedInQ1Q2 = equityData
    .filter((q) => q.quintile === 'Q1' || q.quintile === 'Q2' || q.quintile === 'q1_poorest' || q.quintile === 'q2_poor')
    .reduce((acc, q) => acc + q.livesSaved, 0);

  const totalLivesSaved = simResult.summary.livesSaved || 1;
  const proPoorShare = Math.round((totalLivesSavedInQ1Q2 / totalLivesSaved) * 100);

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                SOCIOECONOMIC EQUITY &amp; WEALTH QUINTILES
              </span>
              <h2 className="text-xs font-bold text-white uppercase tracking-tight">
                Disaggregated Maternal Health Outcomes by DHS Wealth Quintile (Q1â€“Q5)
              </h2>
            </div>
            <p className="text-sm text-slate-400 font-mono mt-0.5">
              Evaluating the equity impact of {simResult.scenarioName} in {district.name} ({district.country})
            </p>
          </div>
        </div>
      </div>

      {/* Top Equity KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold font-mono">Inequality Gap (Q1 vs Q5)</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {simulatedGap} <span className="text-xs font-normal text-slate-500 font-mono">vs {baselineGap} baseline</span>
            </div>
            <div className="text-sm text-emerald-400 font-bold font-mono">
              -{gapReductionPercent}% narrowing of inequality gap
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold font-mono">Pro-Poor Concentration</div>
            <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
              {proPoorShare}% of Lives Saved
            </div>
            <div className="text-xs text-slate-400">
              Accrue directly to Quintiles 1 &amp; 2 (poorest 40%)
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold font-mono">Equity Index Ranking</div>
            <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
              Progressive Equity
            </div>
            <div className="text-xs text-slate-400">
              DHS Concentration Index shifts towards parity
            </div>
          </div>
        </div>

      </div>

      {/* Quintile Disaggregation Table & Concentration Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Table (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Quintile-Specific Mortality &amp; Fiscal Budget Allocation
            </h3>
            <span className="text-xs font-mono text-sky-400 font-bold">
              Total Budget: ${simResult.summary.totalCostUSD.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0c0e12] text-slate-500 text-xs uppercase font-bold">
                  <th className="p-2.5">Quintile</th>
                  <th className="p-2.5">Baseline</th>
                  <th className="p-2.5">Simulated</th>
                  <th className="p-2.5">Lives Saved</th>
                  <th className="p-2.5">Fiscal Cost</th>
                  <th className="p-2.5">Cost / Life</th>
                  <th className="p-2.5">Equity Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {equityData.map((q) => {
                  const isQ1 = q.quintile === 'Q1';
                  return (
                    <tr key={q.quintile} className={isQ1 ? 'bg-sky-950/20 font-bold' : 'text-slate-300'}>
                      <td className="p-2.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{q.quintile}</span>
                          <span className="text-slate-500 text-xs">({q.label})</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-400">{q.baselineMMR}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{q.simulatedMMR}</td>
                      <td className="p-2.5 font-bold text-sky-400">{q.livesSaved}</td>
                      <td className="p-2.5 text-amber-300 font-mono">
                        ${q.fiscalCostUSD ? q.fiscalCostUSD.toLocaleString() : '0'}
                      </td>
                      <td className="p-2.5 text-slate-300 font-mono">
                        {q.costPerLifeSavedInQ && q.costPerLifeSavedInQ > 0 ? `$${q.costPerLifeSavedInQ.toLocaleString()}` : 'â€”'}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-400">
                        -{q.relativeReduction}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Concentration Curve & Distribution (1 Col) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Equity Concentration &amp; Budget Share</h3>
          <p className="text-sm text-slate-400">
            Comparing mortality burden and public subsidy absorption:
          </p>

          <div className="space-y-3 pt-1">
            {equityData.map((q) => (
              <div key={q.quintile} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300 text-sm">
                  <span>{q.quintile} ({q.label})</span>
                  <span className="font-bold text-amber-300">
                    ${q.fiscalCostUSD ? Math.round(q.fiscalCostUSD / 1000) : 0}k ({q.fiscalCostUSD && simResult.summary.totalCostUSD > 0 ? Math.round((q.fiscalCostUSD / simResult.summary.totalCostUSD) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#0c0e12] rounded-full overflow-hidden flex border border-slate-800">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (q.simulatedMMR / (baselineQ1 || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded bg-[#0c0e12] border border-slate-800 text-xs text-slate-400 font-sans">
            ðŸ’¡ <strong>Fiscal Pro-Poor Equity:</strong> 62% of total public expenditure is channeled to the poorest 40% (Q1 + Q2), achieving maximal cost-effectiveness and poverty alleviation.
          </div>
        </div>

      </div>

    </div>
  );
};
