import React, { useMemo } from 'react';
import {
  TrendingDown,
  Users,
  Heart,
  Shield,
  Clock,
  AlertTriangle,
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { StatCard } from './ui/StatCard';
import { SectionHeader } from './ui/SectionHeader';
import { Badge } from './ui/Badge';
import { ChartCard } from './ui/ChartCard';

interface DashboardViewProps {
  district: DistrictData;
  activeScenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  onScenarioChange: (id: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d') => void;
  onOpenCopilot: () => void;
  simulationResult?: SimulationResult;
}

const SCENARIO_META: Record<string, { labelKey: string; color: string; letter: string }> = {
  baseline:   { labelKey: 'dashScenarioBase', color: '#94a3b8', letter: 'Base' },
  scenario_a: { labelKey: 'dashScenarioA',    color: '#38bdf8', letter: 'A' },
  scenario_b: { labelKey: 'dashScenarioB',    color: '#34d399', letter: 'B' },
  scenario_c: { labelKey: 'dashScenarioC',    color: '#818cf8', letter: 'C' },
  scenario_d: { labelKey: 'dashScenarioD',    color: '#fbbf24', letter: 'D' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  district,
  activeScenarioId,
  onScenarioChange,
  onOpenCopilot,
  simulationResult,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  if (!simulationResult) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 bg-amber-950/30 border border-amber-500/40 rounded-lg p-5">
          <AlertTriangle className="text-amber-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold">{t.dashBackendDown}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {t.dashBackendDownDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const s = simulationResult.summary;
  const trajectories = simulationResult.trajectories;
  const currentSnapshot = trajectories.length > 0 ? trajectories[trajectories.length - 1] : null;
  const scenarioLabel = (id: string) => t[SCENARIO_META[id]?.labelKey as keyof typeof t] as string;

  const equityData = useMemo(
    () => simulationResult.equityDisaggregation || [],
    [simulationResult]
  );

  const stockColors = {
    pregnant: '#38bdf8',
    anc: '#34d399',
    delivery: '#818cf8',
    postpartum: '#fbbf24',
    complications: '#f43f5e',
  };

  const maxStock = Math.max(
    ...trajectories.map((t) =>
      Math.max(t.pregnantWomen, t.inANC * 1.5, t.inPostpartum)
    )
  );

  const chartWidth = 800;
  const chartHeight = 260;
  const padding = { top: 10, right: 20, bottom: 30, left: 50 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const toPath = (data: number[]) => {
    if (data.length < 2) return '';
    const scaleX = (i: number) => padding.left + (i / (data.length - 1)) * innerW;
    const scaleY = (v: number) => padding.top + innerH - (v / Math.max(maxStock, 1)) * innerH;
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ');
  };

  const pregnantPath = toPath(trajectories.map((t) => t.pregnantWomen));
  const ancPath = toPath(trajectories.map((t) => t.inANC));
  const deliveryPath = toPath(trajectories.map((t) => t.inFacilityDelivery));
  const postpartumPath = toPath(trajectories.map((t) => t.inPostpartum));
  const complicationsPath = toPath(trajectories.map((t) => t.withComplications));

  const mmrReduction = s.mmrReductionPercent;
  const activeMeta = SCENARIO_META[activeScenarioId] || SCENARIO_META.baseline;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {district.name}
              </h2>
              <Badge variant="info" size="sm">{district.country}</Badge>
              <Badge variant="live" size="sm">{t.dashRk4Badge}</Badge>
            </div>
            {/* Territorial Metadata Tags */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
              <span>{t.dashPopulation} <strong className="text-slate-200 font-mono font-medium">{(district.population / 1000).toFixed(0)}k</strong> {t.dashHab}</span>
              <span className="text-slate-700">•</span>
              <span>{t.dashBaselineMMR} <strong className="text-slate-200 font-mono font-medium">{district.baselineMMR}</strong> / 100k</span>
              <span className="text-slate-700">•</span>
              <span>{t.dashPoverty} <strong className="text-slate-200 font-mono font-medium">{district.povertyRate}%</strong></span>
              <span className="text-slate-700">•</span>
              <span>{s.totalBirths.toFixed(0)} {t.dashAccumBirths}</span>
            </div>
          </div>
          <button
            onClick={onOpenCopilot}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] rounded-xl text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.aiCopilotBtn}</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t.dashSelectScenario}
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['baseline', 'scenario_a', 'scenario_b', 'scenario_c', 'scenario_d'] as const).map((id) => {
            const meta = SCENARIO_META[id];
            const isActive = id === activeScenarioId;
            return (
              <button
                key={id}
                onClick={() => onScenarioChange(id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  isActive
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300 shadow-md shadow-sky-500/10 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{meta.letter}: {scenarioLabel(id)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t.dashHorizonMMR}
          value={s.mmrFinal.toFixed(0)}
          subtitle={t.dashPer100k}
          icon={<TrendingDown className="w-5 h-5" />}
          variant={mmrReduction > 20 ? 'success' : mmrReduction > 10 ? 'warning' : 'danger'}
          change={mmrReduction > 0 ? { value: -mmrReduction, label: t.dashReduction } : undefined}
        />
        <StatCard
          label={t.dashMaternalDeaths}
          value={s.totalMaternalDeaths.toFixed(0)}
          subtitle={`${t.dashBaselineLine} ${s.baselineDeaths.toFixed(0)}`}
          icon={<Heart className="w-5 h-5" />}
          variant={s.livesSaved > 0 ? 'success' : 'default'}
          change={s.livesSaved > 0 ? { value: s.livesSaved, label: t.dashLivesSaved } : undefined}
        />
        <StatCard
          label={t.dashInstDelivery}
          value={`${s.facilityDeliveryRateFinal.toFixed(1)}%`}
          subtitle={`${t.dashCpn4} ${s.anc4CoverageFinal.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5" />}
          variant="info"
        />
        <StatCard
          label={t.dashCostLife}
          value={`$${s.costPerLifeSavedUSD.toFixed(0)}`}
          subtitle={`${t.dashTotalK} $${(s.totalCostUSD / 1000).toFixed(0)}k`}
          icon={<Shield className="w-5 h-5" />}
          variant="info"
        />
      </div>

      {/* Trajectory Chart */}
      <ChartCard
        title={t.dashTrajectoriesTitle}
        subtitle={`${t.dashTrajectoriesSub} · ${trajectories.length} · ${activeMeta.letter}: ${scenarioLabel(activeScenarioId)}`}
      >
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-72">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + innerH - pct * innerH;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke={theme === 'light' ? '#cbd5e1' : '#334155'}
                  strokeWidth={0.8}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono font-semibold"
                  fontSize={12}
                >
                  {(pct * maxStock / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}
          {/* X axis labels */}
          {trajectories.filter((_, i) => i % 6 === 0).map((tr) => {
            const idx = trajectories.indexOf(tr);
            const x = padding.left + (idx / Math.max(trajectories.length - 1, 1)) * innerW;
            return (
              <text
                key={idx}
                x={x}
                y={chartHeight - 6}
                textAnchor="middle"
                className="fill-slate-400 font-mono font-semibold"
                fontSize={12}
              >
                {t.dashMonthPrefix}{tr.timeMonth}
              </text>
            );
          })}
          {/* Lines */}
          <path d={pregnantPath} fill="none" stroke={stockColors.pregnant} strokeWidth={2.5} opacity={0.95} />
          <path d={ancPath} fill="none" stroke={stockColors.anc} strokeWidth={2.5} opacity={0.95} />
          <path d={deliveryPath} fill="none" stroke={stockColors.delivery} strokeWidth={2.5} opacity={0.95} />
          <path d={postpartumPath} fill="none" stroke={stockColors.postpartum} strokeWidth={2.5} opacity={0.95} />
          <path d={complicationsPath} fill="none" stroke={stockColors.complications} strokeWidth={2.5} opacity={0.95} strokeDasharray="5 3" />
        </svg>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-800 text-sm">
          {[
            [t.dashS1, stockColors.pregnant],
            [t.dashS2, stockColors.anc],
            [t.dashS3, stockColors.delivery],
            [t.dashS4, stockColors.postpartum],
            [t.dashS5, stockColors.complications],
          ].map(([label, color]) => (
            <div key={label as string} className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color as string }} />
              <span className="text-slate-300 font-medium">{label as string}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Bottom Row: MMR Trend + Current Phase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* MMR Over Time */}
        <ChartCard title={t.dashMmrTrendTitle} subtitle={t.dashMmrTrendSub}>
          <svg viewBox={`0 0 ${chartWidth} ${200}`} className="w-full h-52">
            {(() => {
              const mmrData = trajectories.map((t) => t.calculatedMMR);
              const maxMMR = Math.max(...mmrData, 1);
              const mmrH = 200 - padding.top - 20;
              const scaleY = (v: number) => padding.top + mmrH - (v / maxMMR) * mmrH;
              const mmrPath = mmrData.map((v, i) => {
                const x = padding.left + (i / Math.max(mmrData.length - 1, 1)) * innerW;
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${scaleY(v).toFixed(1)}`;
              }).join(' ');
              return (
                <>
                  {[0, 0.5, 1].map((pct) => {
                    const y = padding.top + mmrH - pct * mmrH;
                    return (
                      <g key={pct}>
                        <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={theme === 'light' ? '#cbd5e1' : '#334155'} strokeWidth={0.8} />
                        <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 font-mono font-semibold" fontSize={12}>
                          {(pct * maxMMR).toFixed(0)}
                        </text>
                      </g>
                    );
                  })}
                  <path d={mmrPath} fill="none" stroke="#f43f5e" strokeWidth={2.5} />
                  <circle cx={padding.left + innerW} cy={scaleY(mmrData[mmrData.length - 1])} r={4} fill="#f43f5e" />
                </>
              );
            })()}
          </svg>
        </ChartCard>

        {/* Current Phase Indicators */}
        <div className="space-y-3">
          <SectionHeader
            title={t.dashPhaseTitle}
            subtitle={`${t.dashPhaseSnapshot} ${currentSnapshot?.timeMonth ?? 0}`}
            icon={<Clock className="w-5 h-5" />}
          />
          {currentSnapshot && (
            <div className="grid grid-cols-2 gap-3">
              {[
                [t.dashPhaseANC, `${currentSnapshot.ancCoveragePercent.toFixed(1)}%`, stockColors.anc],
                [t.dashPhaseInst, `${currentSnapshot.facilityDeliveryPercent.toFixed(1)}%`, stockColors.delivery],
                [t.dashPhaseTrust, `${(currentSnapshot.systemTrustLevel * 100).toFixed(0)}%`, '#38bdf8'],
                [t.dashPhaseCongestion, currentSnapshot.facilityCongestionIndex.toFixed(2), stockColors.complications],
                [t.dashPhaseDelay2, `${currentSnapshot.phase2DelayHours.toFixed(1)}h`, '#fbbf24'],
                [t.dashPhaseDelay3, `${currentSnapshot.phase3DelayHours.toFixed(1)}h`, '#818cf8'],
              ].map(([label, value, color]) => (
                <div key={label as string} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color as string }} />
                    <span className="text-xs sm:text-sm font-semibold text-slate-300">{label as string}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">{value as string}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equity Disaggregation Preview */}
      {equityData.length > 0 && (
        <ChartCard
          title={t.dashEquityTitle}
          subtitle={t.dashEquitySub}
        >
          <div className="space-y-3">
            {equityData.map((q) => {
              const barWidth = Math.min(100, Math.max(0, q.relativeReduction));
              return (
                <div key={q.quintile} className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-300 w-36 shrink-0">{q.label}</span>
                  <div className="flex-1 h-6 bg-slate-800/80 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-sky-500/70 rounded-lg transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-bold text-sky-400 w-24 text-right">
                    -{barWidth.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}


      {/* Footer note */}
      <p className="text-xs text-slate-500">
        {t.dashDisclaimer}
      </p>
    </div>
  );
};
