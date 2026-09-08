import React, { useState, useMemo } from 'react';
import { DistrictData, MultiYearProjectionResult, MultiYearYearBreakdown } from '../types';
import { SystemDynamicsEngine } from '../services/systemDynamics';
import { TrendingUp, Target, DollarSign, Calendar, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n/translations';

interface MultiYearProjectionViewProps {
  district: DistrictData;
}

export const MultiYearProjectionView: React.FC<MultiYearProjectionViewProps> = ({ district }) => {
  const { language } = useLanguage();
  const [selectedHorizonYears, setSelectedHorizonYears] = useState<number>(10);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Compute 120-month (10-year) continuous ODE trajectories
  const projectionData: MultiYearProjectionResult = useMemo(() => {
    const totalMonths = selectedHorizonYears * 12;

    // Simulate all scenarios for full multi-year duration
    const simBaseline = SystemDynamicsEngine.simulate(district, 'baseline', {}, totalMonths);
    const simA = SystemDynamicsEngine.simulate(district, 'scenario_a', {}, totalMonths);
    const simB = SystemDynamicsEngine.simulate(district, 'scenario_b', {}, totalMonths);
    const simC = SystemDynamicsEngine.simulate(district, 'scenario_c', {}, totalMonths);
    const simD = SystemDynamicsEngine.simulate(district, 'scenario_d', {}, totalMonths);

    const yearByYear: MultiYearYearBreakdown[] = [];
    let cumLivesSavedD = 0;
    let cumCostD = 0;

    const baseCostPerYear = Math.round(simD.summary.totalCostUSD / 3);

    for (let yr = 1; yr <= selectedHorizonYears; yr++) {
      const monthEnd = yr * 12 - 1;
      const snapBase = simBaseline.trajectories[monthEnd] || simBaseline.trajectories[simBaseline.trajectories.length - 1];
      const snapA = simA.trajectories[monthEnd] || simA.trajectories[simA.trajectories.length - 1];
      const snapB = simB.trajectories[monthEnd] || simB.trajectories[simB.trajectories.length - 1];
      const snapC = simC.trajectories[monthEnd] || simC.trajectories[simC.trajectories.length - 1];
      const snapD = simD.trajectories[monthEnd] || simD.trajectories[simD.trajectories.length - 1];

      // Sum lives saved in this 12-month window
      let annualLivesD = 0;
      for (let m = (yr - 1) * 12; m <= monthEnd && m < simD.trajectories.length; m++) {
        annualLivesD += simD.trajectories[m].monthlyLivesSaved;
      }
      cumLivesSavedD += Math.round(annualLivesD);
      cumCostD += baseCostPerYear;

      const currentMMRD = snapD.calculatedMMR;
      const sdgGap = Math.max(0, currentMMRD - 70);

      yearByYear.push({
        year: 2026 + yr - 1,
        yearIndex: yr,
        baselineMMR: snapBase.calculatedMMR,
        scenarioAMMR: snapA.calculatedMMR,
        scenarioBMMR: snapB.calculatedMMR,
        scenarioCMMR: snapC.calculatedMMR,
        scenarioDMMR: currentMMRD,
        sdgTargetMMR: 70,
        sdgGap,
        cumulativeLivesSavedScenarioD: cumLivesSavedD,
        annualFiscalInvestmentUSD: baseCostPerYear,
        cumulativeFiscalInvestmentUSD: cumCostD,
        costEffectivenessPerLifeSavedUSD: cumLivesSavedD > 0 ? Math.round(cumCostD / cumLivesSavedD) : 0,
      });
    }

    const tenYearLivesSavedTotal = cumLivesSavedD;
    const tenYearTotalInvestmentUSD = cumCostD;
    const overallROIBenefitCostRatio = Math.round((tenYearLivesSavedTotal / (tenYearTotalInvestmentUSD / 100000)) * 10) / 10;

    return {
      district,
      startYear: 2026,
      endYear: 2026 + selectedHorizonYears - 1,
      totalMonths,
      tenYearLivesSavedTotal,
      tenYearTotalInvestmentUSD,
      overallROIBenefitCostRatio,
      yearByYear,
    };
  }, [district, selectedHorizonYears]);

  // Find when SDG Target 3.1 (< 70) is reached
  const sdgTargetReachedYear = projectionData.yearByYear.find((y) => y.scenarioDMMR <= 70)?.year || null;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              10-YEAR HORIZON (2026-2036)
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'es' ? 'Comparador Histórico de Políticas Multianuales' : 'Multi-Year Long-Term Policy Projection'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {language === 'es'
              ? 'Trayectoria decenal continua hacia la Meta ODS 3.1 (<70 por 100k) y análisis fiscal acumulado.'
              : 'Decadal continuous ODE trajectory benchmarking against SDG Target 3.1 (<70/100k) & fiscal return.'}
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">{language === 'es' ? 'Horizonte Temporal:' : 'Time Horizon:'}</span>
          <select
            value={selectedHorizonYears}
            onChange={(e) => setSelectedHorizonYears(Number(e.target.value))}
            className="bg-[#0c0e12] border border-slate-800 text-sky-300 font-bold rounded px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value={5}>5 Años (2026 - 2030 / 60 meses)</option>
            <option value={8}>8 Años (2026 - 2033 / 96 meses)</option>
            <option value={10}>10 Años (2026 - 2036 / 120 meses)</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Multi-Year KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'es' ? 'Vidas Salvadas Decenales:' : '10-Year Lives Saved:'}
          </span>
          <div className="text-xl font-bold text-emerald-400">
            +{projectionData.tenYearLivesSavedTotal.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {language === 'es' ? 'Madres acumuladas (Paquete D)' : 'Cumulative mothers saved (Pkg D)'}
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-sky-400" />
            {language === 'es' ? 'Cumplimiento Meta ODS 3.1:' : 'SDG Target 3.1 Milestone:'}
          </span>
          <div className="text-xl font-bold text-sky-300">
            {sdgTargetReachedYear ? `Año ${sdgTargetReachedYear}` : 'En Proceso'}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {sdgTargetReachedYear
              ? (language === 'es' ? 'RMM alcanza < 70/100k' : 'MMR reaches < 70/100k')
              : `Brecha remanente: ${projectionData.yearByYear[projectionData.yearByYear.length - 1].sdgGap} pts`}
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            {language === 'es' ? 'Inversión Fiscal Acumulada:' : 'Cumulative Fiscal Investment:'}
          </span>
          <div className="text-xl font-bold text-amber-300">
            ${(projectionData.tenYearTotalInvestmentUSD / 1000000).toFixed(2)}M
          </div>
          <span className="text-[10px] text-slate-400 block">
            ${Math.round(projectionData.tenYearTotalInvestmentUSD / selectedHorizonYears).toLocaleString()} / año promedio
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            {language === 'es' ? 'Costo Decenal por Vida:' : '10-Yr Cost / Life Saved:'}
          </span>
          <div className="text-xl font-bold text-cyan-300">
            ${Math.round(projectionData.tenYearTotalInvestmentUSD / projectionData.tenYearLivesSavedTotal).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 block font-bold">
            Altamente Costo-Efectivo (OMS)
          </span>
        </div>
      </div>

      {/* 10-Year Trajectory Multi-Line Canvas Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {language === 'es' ? 'Trayectorias Multianuales de RMM (2026 - 2036)' : 'Multi-Year MMR Trajectories (2026 - 2036)'}
          </h3>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-1 bg-slate-500 rounded" />
              <span className="text-slate-400">Línea Base (Status Quo)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-1 bg-blue-400 rounded" />
              <span className="text-slate-400">Escenario A (Ambulancias)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-1 bg-amber-400 rounded" />
              <span className="text-slate-400">Escenario B (Tarifas 0)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-1 bg-teal-400 rounded" />
              <span className="text-slate-400">Escenario C (Parteras)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-1.5 bg-emerald-400 rounded" />
              <span className="text-emerald-300 font-bold">Escenario D (Combinado)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-500" />
              <span className="text-rose-400 font-bold">Meta ODS 3.1 (&lt;70)</span>
            </div>
          </div>
        </div>

        {/* SVG Multi-Line Chart */}
        <div className="w-full h-64 bg-[#080a0f] rounded-lg border border-slate-800 p-2 relative">
          <svg viewBox="0 0 700 240" className="w-full h-full">
            {/* Grid lines */}
            {[40, 80, 120, 160, 200].map((y) => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.8" />
            ))}

            {/* ODS 3.1 Target Line (70 per 100k) */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const y70 = 230 - (70 / maxMMR) * 210;
              return (
                <g>
                  <line x1="0" y1={y70} x2="700" y2={y70} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                  <text x="610" y={y70 - 4} fill="#f87171" fontSize="9" fontWeight="bold">Meta ODS 3.1 (70)</text>
                </g>
              );
            })()}

            {/* Baseline Line */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const points = projectionData.yearByYear.map((y, idx) => {
                const x = (idx / (projectionData.yearByYear.length - 1)) * 700;
                const cy = 230 - (y.baselineMMR / maxMMR) * 210;
                return `${x},${cy}`;
              }).join(' ');
              return <polyline fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" points={points} />;
            })()}

            {/* Scenario A Line */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const points = projectionData.yearByYear.map((y, idx) => {
                const x = (idx / (projectionData.yearByYear.length - 1)) * 700;
                const cy = 230 - (y.scenarioAMMR / maxMMR) * 210;
                return `${x},${cy}`;
              }).join(' ');
              return <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={points} />;
            })()}

            {/* Scenario B Line */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const points = projectionData.yearByYear.map((y, idx) => {
                const x = (idx / (projectionData.yearByYear.length - 1)) * 700;
                const cy = 230 - (y.scenarioBMMR / maxMMR) * 210;
                return `${x},${cy}`;
              }).join(' ');
              return <polyline fill="none" stroke="#fbbf24" strokeWidth="2" points={points} />;
            })()}

            {/* Scenario C Line */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const points = projectionData.yearByYear.map((y, idx) => {
                const x = (idx / (projectionData.yearByYear.length - 1)) * 700;
                const cy = 230 - (y.scenarioCMMR / maxMMR) * 210;
                return `${x},${cy}`;
              }).join(' ');
              return <polyline fill="none" stroke="#2dd4bf" strokeWidth="2" points={points} />;
            })()}

            {/* Scenario D (Combined) Line - Prominent Bold */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const points = projectionData.yearByYear.map((y, idx) => {
                const x = (idx / (projectionData.yearByYear.length - 1)) * 700;
                const cy = 230 - (y.scenarioDMMR / maxMMR) * 210;
                return `${x},${cy}`;
              }).join(' ');
              return (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  points={points}
                />
              );
            })()}

            {/* Year Dots for Scenario D */}
            {projectionData.yearByYear.map((y, idx) => {
              const maxMMR = district.baselineMMR * 1.05;
              const cx = (idx / (projectionData.yearByYear.length - 1)) * 700;
              const cy = 230 - (y.scenarioDMMR / maxMMR) * 210;
              return (
                <circle
                  key={y.year}
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:r-6"
                  onMouseEnter={() => setHoveredYear(y.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
              );
            })}
          </svg>

          {/* Bottom X-Axis Years */}
          <div className="flex justify-between text-[10px] text-slate-400 pt-1 px-1 font-mono">
            {projectionData.yearByYear.map((y) => (
              <span key={y.year} className={`cursor-pointer ${hoveredYear === y.year ? 'text-sky-400 font-bold' : ''}`}>
                {y.year}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Year-by-Year Milestone Breakdown Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3 font-mono text-xs">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          {language === 'es' ? 'Matriz Decenal de Hitos y Costo-Efectividad Acumulada' : 'Decadal Milestone & Fiscal Cost-Effectiveness Matrix'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0c0e12] text-slate-500 text-[10px] uppercase font-bold">
                <th className="p-2.5">Año</th>
                <th className="p-2.5">Línea Base</th>
                <th className="p-2.5">Escenario A</th>
                <th className="p-2.5">Escenario B</th>
                <th className="p-2.5">Escenario C</th>
                <th className="p-2.5 text-emerald-400">Escenario D</th>
                <th className="p-2.5">Brecha ODS 3.1</th>
                <th className="p-2.5">Vidas Acum.</th>
                <th className="p-2.5">Inversión Acum.</th>
                <th className="p-2.5">Costo / Vida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projectionData.yearByYear.map((row) => {
                const isHovered = hoveredYear === row.year;
                const isTargetAchieved = row.scenarioDMMR <= 70;

                return (
                  <tr
                    key={row.year}
                    onMouseEnter={() => setHoveredYear(row.year)}
                    onMouseLeave={() => setHoveredYear(null)}
                    className={`transition ${isHovered ? 'bg-slate-800/70' : 'hover:bg-slate-900/40'}`}
                  >
                    <td className="p-2.5 font-bold text-white flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>{row.year} (A{row.yearIndex})</span>
                    </td>
                    <td className="p-2.5 text-slate-400">{row.baselineMMR}</td>
                    <td className="p-2.5 text-blue-300">{row.scenarioAMMR}</td>
                    <td className="p-2.5 text-amber-300">{row.scenarioBMMR}</td>
                    <td className="p-2.5 text-teal-300">{row.scenarioCMMR}</td>
                    <td className="p-2.5 font-bold text-emerald-400">
                      {row.scenarioDMMR}
                    </td>
                    <td className="p-2.5">
                      {isTargetAchieved ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          ✓ ALCANZADA
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">+{row.sdgGap} pts</span>
                      )}
                    </td>
                    <td className="p-2.5 font-bold text-sky-300">+{row.cumulativeLivesSavedScenarioD}</td>
                    <td className="p-2.5 text-slate-300">${(row.cumulativeFiscalInvestmentUSD / 1000).toLocaleString()}k</td>
                    <td className="p-2.5 text-cyan-300 font-bold">${row.costEffectivenessPerLifeSavedUSD.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
