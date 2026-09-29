import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingDown,
  Calendar,
  DollarSign,
  Heart,
  Target,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';
import { Badge } from './ui/Badge';
import { KPIRowSkeleton, ChartCardSkeleton } from './ui/Skeleton';
import { runSimulation } from '../services/api';

interface Props {
  district: DistrictData;
}

const SCENARIO_META: Record<string, { labelKey: string; color: string }> = {
  baseline:   { labelKey: 'dashScenarioBase', color: '#94a3b8' },
  scenario_a: { labelKey: 'dashScenarioA',    color: '#38bdf8' },
  scenario_b: { labelKey: 'dashScenarioB',    color: '#34d399' },
  scenario_c: { labelKey: 'dashScenarioC',    color: '#818cf8' },
  scenario_d: { labelKey: 'dashScenarioD',    color: '#fbbf24' },
};

export const MultiYearProjectionView: React.FC<Props> = ({ district }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scenarioLabel = (id: string) => t[SCENARIO_META[id]?.labelKey as keyof typeof t] as string;

  const [projectionMonths, setProjectionMonths] = useState<number>(120);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    runProjection();
    return () => { isMounted.current = false; };
  }, [district.id, projectionMonths]);

  const runProjection = async () => {
    setLoading(true);
    setError(null);
    try {
      const scenarioIds = ['baseline', 'scenario_a', 'scenario_b', 'scenario_c', 'scenario_d'] as const;
      const simPromises = scenarioIds.map(async (id) => {
        const res = await runSimulation(district.id, id, projectionMonths);
        return { id, res };
      });
      const resolved = await Promise.all(simPromises);
      const newResults: Record<string, SimulationResult> = {};
      resolved.forEach(({ id, res }) => {
        newResults[id] = res;
      });
      if (isMounted.current) setResults(newResults);
    } catch (e: any) {
      if (isMounted.current) setError(e.message || t.myProjectionError);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const baseline = results['baseline'];
  const bestScenario = useMemo(() => {
    return Object.values(results).reduce((best, r) => {
      if (r.scenarioId === 'baseline') return best;
      if (!best || r.summary.livesSaved > best.summary.livesSaved) return r;
      return best;
    }, null as SimulationResult | null);
  }, [results]);

  const years = projectionMonths / 12;

  // Compute year-by-year data from trajectories (each trajectory has monthly snapshots)
  const yearByYear = useMemo(() => {
    if (!baseline) return [];
    const currentYear = new Date().getFullYear();
    const data: {
      year: number;
      baseline: number;
      scenarios: Record<string, number>;
    }[] = [];

    for (let yearIdx = 0; yearIdx < years; yearIdx++) {
      const monthIdx = Math.min((yearIdx + 1) * 12 - 1, (results['baseline']?.trajectories.length || 1) - 1);
      const yearData = {
        year: currentYear + yearIdx,
        baseline: results['baseline']?.trajectories[monthIdx]?.calculatedMMR || 0,
        scenarios: {} as Record<string, number>,
      };
      for (const [id, res] of Object.entries(results)) {
        if (id === 'baseline') continue;
        yearData.scenarios[id] = res.trajectories[monthIdx]?.calculatedMMR || 0;
      }
      data.push(yearData);
    }
    return data;
  }, [results, years]);

  // Chart dimensions
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxMMR = yearByYear.length > 0
    ? Math.max(...yearByYear.map((d) => Math.max(d.baseline, ...Object.values(d.scenarios))))
    : 1;

  const toPath = (values: number[]) => {
    if (values.length < 2) return '';
    const scaleX = (i: number) => padding.left + (i / (values.length - 1)) * innerW;
    const scaleY = (v: number) => padding.top + innerH - (v / Math.max(maxMMR, 1)) * innerH;
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <SectionHeader
        title={t.myTitle}
        subtitle={`${district.name} · ${t.mySubtitle.replace('{years}', String(years)).replace('{months}', String(projectionMonths))}`}
        icon={<Calendar className="w-5 h-5" />}
        badge={
          Object.keys(results).length > 0
            ? <Badge variant="success" size="sm"><BarChart3 className="w-3 h-3" /> {t.myDataLoaded}</Badge>
            : <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3" /> {t.myNotComputed}</Badge>
        }
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 dark:text-slate-400">{t.myHorizonLabel}</label>
        <select
          value={projectionMonths}
          onChange={(e) => setProjectionMonths(Number(e.target.value))}
          className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value={60}>{t.myOpt5}</option>
          <option value={96}>{t.myOpt8}</option>
          <option value={120}>{t.myOpt10}</option>
        </select>
        <button
          onClick={runProjection}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? t.myCalculating : t.myUpdateProjection}
        </button>
      </div>

      {error && (
        <div className="flex gap-2 items-center text-rose-400 text-sm bg-rose-950/30 border border-rose-500/40 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <KPIRowSkeleton count={4} />
          <ChartCardSkeleton lines={6} />
        </div>
      ) : !Object.keys(results).length && !error ? (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-center">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">{t.myTitle}</h3>
          <p className="text-sm text-slate-400 mb-4">
            {t.myEmptyDesc.replace('{years}', String(years))}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {bestScenario && baseline && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label={t.myHorizonKpi}
                value={`${years} ${t.myYearsUnit}`}
                subtitle={`${projectionMonths} ${t.myMonthsUnit}`}
                icon={<Calendar className="w-5 h-5" />}
                variant="info"
              />
              <StatCard
                label={t.myLivesSavedYears.replace('{years}', String(years))}
                value={bestScenario.summary.livesSaved.toFixed(0)}
                subtitle={scenarioLabel(bestScenario.scenarioId) || bestScenario.scenarioName}
                icon={<Heart className="w-5 h-5" />}
                variant="success"
              />
              <StatCard
                label={t.myFinalBaseline}
                value={baseline.summary.mmrFinal.toFixed(0)}
                subtitle={t.myFromDeaths.replace('{n}', baseline.summary.baselineDeaths.toFixed(0))}
                icon={<TrendingDown className="w-5 h-5" />}
                variant="warning"
              />
              <StatCard
                label={t.mySdgGapTitle}
                value={baseline.summary.mmrFinal > 70 ? `+${(baseline.summary.mmrFinal - 70).toFixed(0)}` : t.myOnTarget}
                subtitle={baseline.summary.mmrFinal > 70 ? t.myAboveTarget : t.myMmrLimit}
                icon={<Target className="w-5 h-5" />}
                variant={baseline.summary.mmrFinal > 70 ? 'danger' : 'success'}
              />
            </div>
          )}

          {/* Projection Chart */}
          {yearByYear.length > 0 && (
            <ChartCard
              title={t.myTrajectoryTitle}
              subtitle={t.myTrajectorySub.replace('{years}', String(years))}
            >
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-72">
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = padding.top + innerH - pct * innerH;
                  return (
                    <g key={pct}>
                      <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y}
                        stroke={theme === 'light' ? '#e2e8f0' : '#334155'} strokeWidth={0.5} />
                      <text x={padding.left - 5} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize={9}>
                        {(pct * maxMMR).toFixed(0)}
                      </text>
                    </g>
                  );
                })}
                {/* Year labels */}
                {yearByYear.map((d, i) => {
                  const x = padding.left + (i / Math.max(yearByYear.length - 1, 1)) * innerW;
                  return (
                    <text key={d.year} x={x} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500" fontSize={9}>
                      {d.year}
                    </text>
                  );
                })}
                {/* SDG Target line at MMR=70 */}
                {maxMMR > 70 && (
                  <g>
                    <line
                      x1={padding.left}
                      y1={padding.top + innerH - (70 / maxMMR) * innerH}
                      x2={chartWidth - padding.right}
                      y2={padding.top + innerH - (70 / maxMMR) * innerH}
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      opacity={0.6}
                    />
                    <text
                      x={chartWidth - padding.right + 2}
                      y={padding.top + innerH - (70 / maxMMR) * innerH + 3}
                      className="fill-rose-400"
                      fontSize={8}
                    >
                      {t.mySdg70}
                    </text>
                  </g>
                )}
                {/* Lines */}
                {Object.entries(SCENARIO_META).map(([id, meta]) => {
                  if (id === 'baseline') {
                    const values = yearByYear.map((d) => d.baseline);
                    return <path key={id} d={toPath(values)} fill="none" stroke={meta.color} strokeWidth={2} strokeDasharray="6 3" />;
                  }
                  const values = yearByYear.map((d) => d.scenarios[id] || 0);
                  return <path key={id} d={toPath(values)} fill="none" stroke={meta.color} strokeWidth={2} />;
                })}
              </svg>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                {Object.entries(SCENARIO_META).map(([id, meta]) => (
                  <div key={id} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded" style={{ backgroundColor: meta.color }} />
                    <span className="text-slate-400">{scenarioLabel(id)}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Year-by-Year Table */}
          {yearByYear.length > 0 && (
            <ChartCard title={t.myAnnualBreakdown} subtitle={t.myAnnualBreakdownSub} noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-xs text-slate-400">{t.myColYear}</th>
                      <th className="text-right py-2 px-3 text-xs text-slate-400">{t.myColBaseline}</th>
                      {Object.entries(SCENARIO_META).filter(([id]) => id !== 'baseline').map(([id, meta]) => (
                        <th key={id} className="text-right py-2 px-3 text-xs text-slate-400">{scenarioLabel(id)}</th>
                      ))}
                      <th className="text-right py-2 px-3 text-xs text-slate-400">{t.myColSdgGap}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearByYear.map((d) => (
                      <tr key={d.year} className="border-b border-slate-800/50">
                        <td className="py-2 px-3 font-medium">{d.year}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">{d.baseline.toFixed(0)}</td>
                        {Object.keys(SCENARIO_META).filter((id) => id !== 'baseline').map((id) => (
                          <td key={id} className="py-2 px-3 text-right font-mono" style={{ color: SCENARIO_META[id].color }}>
                            {(d.scenarios[id] || 0).toFixed(0)}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-mono text-xs">
                          {d.baseline > 70 ? (
                            <span className="text-rose-400">+{(d.baseline - 70).toFixed(0)}</span>
                          ) : (
                            <span className="text-emerald-400">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}

          {/* Cost-Effectiveness Summary */}
          {bestScenario && (
            <ChartCard title={t.myCostEffectiveness} subtitle={t.myCostEffectivenessSub}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t.myTotalInvestment}</div>
                  <div className="text-xl font-mono font-bold text-sky-400">
                    ${(bestScenario.summary.totalCostUSD / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t.myCostPerLifeLabel}</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    ${bestScenario.summary.costPerLifeSavedUSD.toFixed(0)}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t.myLives}</div>
                  <div className="text-xl font-mono font-bold">
                    {bestScenario.summary.livesSaved.toFixed(0)}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t.myMmrReduction}</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {bestScenario.summary.mmrReductionPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </ChartCard>
          )}
        </>
      )}

      <p className="text-xs text-slate-500">
        {t.myDisclaimer.replace('{months}', String(projectionMonths))}
      </p>
    </div>
  );
};
