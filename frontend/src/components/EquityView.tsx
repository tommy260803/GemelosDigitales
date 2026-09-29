import React from 'react';
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
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';
import { Badge } from './ui/Badge';

interface EquityViewProps {
  district: DistrictData;
  activeScenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  simulationResult?: SimulationResult;
}

const QUINTILE_COLORS: Record<string, string> = {
  q1_poorest: '#ef4444',
  q2_poor: '#f97316',
  q3_middle: '#eab308',
  q4_richer: '#22c55e',
  q5_richest: '#3b82f6',
};

const SCENARIO_LABEL_KEYS: Record<string, string> = {
  baseline: 'eqScenarioBaseline',
  scenario_a: 'eqScenarioA',
  scenario_b: 'eqScenarioB',
  scenario_c: 'eqScenarioC',
  scenario_d: 'eqScenarioD',
};

export const EquityView: React.FC<EquityViewProps> = ({
  district,
  activeScenarioId,
  simulationResult,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scenarioLabel = (id: string) => t[SCENARIO_LABEL_KEYS[id] as keyof typeof t] as string;

  if (!simulationResult) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 bg-amber-950/30 border border-amber-500/40 rounded-lg p-5">
          <Scale className="text-amber-300 shrink-0" />
          <div>
            <h2 className="font-semibold">{t.eqNoResults}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {t.eqNoResultsDesc}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t.eqTerritoryNeedsBackend.replace('{name}', district.name)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const equity = React.useMemo(
    () => simulationResult.equityDisaggregation || [],
    [simulationResult]
  );

  const referenceRows = React.useMemo(() => {
    const q = district.wealthQuintileMMR;
    if (!q) return [];
    return Object.entries(q).map(([key, value]) => ({
      key,
      label: key.split('_')[0].toUpperCase(),
      value,
    }));
  }, [district]);

  if (equity.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title={t.eqTitle}
          subtitle={`${district.name} · ${scenarioLabel(activeScenarioId)}`}
          icon={<Scale className="w-5 h-5" />}
          badge={<Badge variant="warning" size="sm">0 {t.eqQuintilesBadge}</Badge>}
        />
        <div className="flex gap-3 bg-amber-950/30 border border-amber-500/40 rounded-lg p-5">
          <HelpCircle className="text-amber-300 shrink-0" />
          <div>
            <h2 className="font-semibold">{t.eqNotComputedTitle}</h2>
            <p className="text-sm text-slate-400 mt-1">{t.eqNotComputedDesc}</p>
          </div>
        </div>
        {referenceRows.length > 0 && (
          <ChartCard title={t.eqRefQuintileMMR} subtitle={t.eqRefQuintileNote} noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColQuintile}</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColBaselineMMR}</th>
                  </tr>
                </thead>
                <tbody>
                  {referenceRows.map((row) => (
                    <tr key={row.key} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: QUINTILE_COLORS[row.key] || '#94a3b8' }}
                          />
                          <span className="font-semibold text-slate-200">{row.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">{row.value.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}
      </div>
    );
  }

  // Compute aggregate equity metrics
  const avgReduction = equity.length > 0
    ? equity.reduce((sum, q) => sum + q.relativeReduction, 0) / equity.length
    : 0;

  const maxReductionQ = equity.length > 0
    ? equity.reduce((max, q) => q.relativeReduction > max.relativeReduction ? q : max, equity[0])
    : null;

  const minReductionQ = equity.length > 0
    ? equity.reduce((min, q) => q.relativeReduction < min.relativeReduction ? q : min, equity[0])
    : null;

  const totalCostAllQuintiles = equity.reduce((sum, q) => sum + q.fiscalCostUSD, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <SectionHeader
        title={t.eqTitle}
        subtitle={`${district.name} · ${scenarioLabel(activeScenarioId)}`}
        icon={<Scale className="w-5 h-5" />}
        badge={<Badge variant="info" size="sm">{equity.length} {t.eqQuintilesBadge}</Badge>}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t.eqAvgReduction}
          value={`${avgReduction.toFixed(1)}%`}
          subtitle={t.eqAcrossQuintiles}
          icon={<TrendingDown className="w-5 h-5" />}
          variant={avgReduction > 15 ? 'success' : 'warning'}
        />
        <StatCard
          label={t.eqMaxReduction}
          value={maxReductionQ ? `-${maxReductionQ.relativeReduction.toFixed(1)}%` : 'N/A'}
          subtitle={maxReductionQ?.label || ''}
          icon={<Award className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          label={t.eqMinReduction}
          value={minReductionQ ? `-${minReductionQ.relativeReduction.toFixed(1)}%` : 'N/A'}
          subtitle={minReductionQ?.label || ''}
          icon={<HelpCircle className="w-5 h-5" />}
          variant="danger"
        />
        <StatCard
          label={t.eqTotalInvestment}
          value={`$${(totalCostAllQuintiles / 1000).toFixed(1)}k`}
          subtitle={t.eqAcrossQuintiles}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="info"
        />
      </div>

      {/* Quintile Comparison Table */}
      <ChartCard
        title={t.eqMortalityCostTitle}
        subtitle={t.eqMortalityCostSub}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
                <th className="text-left py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColQuintile}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColPopShare}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColBaselineMMR}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColSimMMR}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColReduction}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColSaved}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColCostLife}</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">{t.eqColBCR}</th>
              </tr>
            </thead>
            <tbody>
              {equity.map((q) => (
                <tr key={q.quintile} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: QUINTILE_COLORS[q.quintile] || '#94a3b8' }}
                      />
                      <span className="font-semibold text-slate-200">{q.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">
                    {(q.populationShare * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400 font-medium">
                    {q.baselineMMR != null ? q.baselineMMR.toFixed(0) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sky-300 font-bold">
                    {q.simulatedMMR.toFixed(0)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono font-bold ${
                      q.relativeReduction > 15 ? 'text-emerald-400' :
                      q.relativeReduction > 5 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      -{q.relativeReduction.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-200 font-semibold">
                    {q.livesSaved.toFixed(0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {q.costPerLifeSavedInQ != null ? `$${q.costPerLifeSavedInQ.toFixed(0)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {q.benefitCostRatio != null ? (
                      <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                        q.benefitCostRatio >= 3 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        q.benefitCostRatio >= 1.5 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {q.benefitCostRatio.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-500/15 text-slate-400 border border-slate-500/30">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Relative Reduction Bar Chart */}
      <ChartCard
        title={t.eqRelativeTitle}
        subtitle={t.eqRelativeSub}
      >
        <div className="space-y-4">
          {equity.map((q) => {
            const barWidth = Math.min(100, Math.max(0, q.relativeReduction));
            return (
              <div key={q.quintile} className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-300 w-36 shrink-0">{q.label}</span>
                <div className="flex-1 h-7 bg-slate-800/80 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: QUINTILE_COLORS[q.quintile] || '#94a3b8',
                      opacity: 0.85,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-mono font-bold text-white drop-shadow-sm">
                    -{barWidth.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Equity Gap Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inequality Gap */}
        <ChartCard title={t.eqGapTitle} subtitle={t.eqGapSub}>
          {maxReductionQ && minReductionQ && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-extrabold font-mono text-rose-400">
                    {minReductionQ.simulatedMMR.toFixed(0)}
                  </div>
                  <div className="text-sm font-semibold text-slate-300 mt-1">{minReductionQ.label}</div>
                  <div className="text-xs text-slate-400">{t.eqSimMMR}</div>
                </div>
                <ArrowRight className="w-8 h-8 text-slate-500 shrink-0" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">
                    {maxReductionQ.simulatedMMR.toFixed(0)}
                  </div>
                  <div className="text-sm font-semibold text-slate-300 mt-1">{maxReductionQ.label}</div>
                  <div className="text-xs text-slate-400">{t.eqSimMMR}</div>
                </div>
              </div>
              <div className="text-center text-sm font-medium text-slate-300 pt-2 border-t border-slate-800">
                {t.eqAbsGap} <strong className="font-mono text-white text-base">
                  {(minReductionQ.simulatedMMR - maxReductionQ.simulatedMMR).toFixed(0)}
                </strong> {t.eqPer100kBirths}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Cost Distribution */}
        <ChartCard title={t.eqFiscalTitle} subtitle={t.eqFiscalSub}>
          <div className="space-y-2">
            {equity.map((q) => {
              const pct = totalCostAllQuintiles > 0 ? (q.fiscalCostUSD / totalCostAllQuintiles) * 100 : 0;
              return (
                <div key={q.quintile} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-28 shrink-0">{q.label}</span>
                  <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-sky-500/40 rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-300 w-20 text-right">
                    ${q.fiscalCostUSD.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Methodology Note */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-400">{t.eqMethodology}</strong> {t.eqMethodologyDesc}{' '}
          {t.eqBcrNote}
        </p>
      </div>
    </div>
  );
};
