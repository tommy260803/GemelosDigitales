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
import { deriveEquityDisaggregation } from '../utils/equity';
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

const SCENARIO_LABELS: Record<string, string> = {
  baseline: 'Línea Base (Status Quo)',
  scenario_a: 'Escenario A: Acceso y Transporte',
  scenario_b: 'Escenario B: Eliminación de Tarifas',
  scenario_c: 'Escenario C: Red Comunitaria TBA',
  scenario_d: 'Escenario D: Paquete Integral (A+B+C)',
};

export const EquityView: React.FC<EquityViewProps> = ({
  district,
  activeScenarioId,
  simulationResult,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  if (!simulationResult) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 bg-amber-950/30 border border-amber-500/40 rounded-lg p-5">
          <Scale className="text-amber-300 shrink-0" />
          <div>
            <h2 className="font-semibold">No hay resultados de simulación disponibles</h2>
            <p className="text-sm text-slate-400 mt-1">
              Ejecute una simulación para visualizar la mortalidad desagregada por quintiles de riqueza y el análisis de costo-efectividad.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Territorio: {district.name}. Se requiere simulación del backend.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const summary = simulationResult.summary;
  const equity = React.useMemo(() => {
    if (simulationResult.equityDisaggregation && simulationResult.equityDisaggregation.length > 0) {
      return simulationResult.equityDisaggregation;
    }
    return deriveEquityDisaggregation(district, activeScenarioId, summary);
  }, [simulationResult, district, activeScenarioId, summary]);

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
        title="Análisis de Equidad en Salud"
        subtitle={`${district.name} · ${SCENARIO_LABELS[activeScenarioId]}`}
        icon={<Scale className="w-5 h-5" />}
        badge={<Badge variant="info" size="sm">{equity.length} quintiles</Badge>}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Reducción Promedio RMM"
          value={`${avgReduction.toFixed(1)}%`}
          subtitle="en todos los quintiles"
          icon={<TrendingDown className="w-5 h-5" />}
          variant={avgReduction > 15 ? 'success' : 'warning'}
        />
        <StatCard
          label="Mayor Reducción"
          value={maxReductionQ ? `-${maxReductionQ.relativeReduction.toFixed(1)}%` : 'N/A'}
          subtitle={maxReductionQ?.label || ''}
          icon={<Award className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          label="Menor Reducción"
          value={minReductionQ ? `-${minReductionQ.relativeReduction.toFixed(1)}%` : 'N/A'}
          subtitle={minReductionQ?.label || ''}
          icon={<HelpCircle className="w-5 h-5" />}
          variant="danger"
        />
        <StatCard
          label="Inversión Total"
          value={`$${(totalCostAllQuintiles / 1000).toFixed(1)}k`}
          subtitle="en todos los quintiles"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="info"
        />
      </div>

      {/* Quintile Comparison Table */}
      <ChartCard
        title="Mortalidad y Costo-Efectividad por Quintil"
        subtitle="Desagregación de resultados ponderada por participación poblacional"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
                <th className="text-left py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Quintil</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Part. Población</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">RMM Base</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">RMM Simulada</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Reducción</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Vidas Salvadas</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Costo/Vida Salvada</th>
                <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">RBC</th>
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
                    {q.baselineMMR.toFixed(0)}
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
                    ${q.costPerLifeSavedInQ.toFixed(0)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                      q.benefitCostRatio >= 3 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      q.benefitCostRatio >= 1.5 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {q.benefitCostRatio.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Relative Reduction Bar Chart */}
      <ChartCard
        title="Reducción Relativa de RMM por Quintil"
        subtitle="Porcentaje de reducción respecto a la línea base"
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
        <ChartCard title="Brecha de Desigualdad" subtitle="Diferencia entre el quintil de mayor y menor reducción">
          {maxReductionQ && minReductionQ && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-extrabold font-mono text-rose-400">
                    {minReductionQ.simulatedMMR.toFixed(0)}
                  </div>
                  <div className="text-sm font-semibold text-slate-300 mt-1">{minReductionQ.label}</div>
                  <div className="text-xs text-slate-400">RMM Simulada</div>
                </div>
                <ArrowRight className="w-8 h-8 text-slate-500 shrink-0" />
                <div className="text-center">
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">
                    {maxReductionQ.simulatedMMR.toFixed(0)}
                  </div>
                  <div className="text-sm font-semibold text-slate-300 mt-1">{maxReductionQ.label}</div>
                  <div className="text-xs text-slate-400">RMM Simulada</div>
                </div>
              </div>
              <div className="text-center text-sm font-medium text-slate-300 pt-2 border-t border-slate-800">
                Brecha absoluta: <strong className="font-mono text-white text-base">
                  {(minReductionQ.simulatedMMR - maxReductionQ.simulatedMMR).toFixed(0)}
                </strong> por 100k nacimientos
              </div>
            </div>
          )}
        </ChartCard>

        {/* Cost Distribution */}
        <ChartCard title="Distribución del Costo Fiscal" subtitle="Asignación presupuestaria entre quintiles">
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
          <strong className="text-slate-400">Metodología:</strong> La desagregación por quintiles emplea ponderaciones poblacionales derivadas de encuestas DHS y estratificación de RMM basal por índice de riqueza. 
          La simulación aplica los efectos de intervención por quintil de forma independiente. 
          La costo-efectividad se calcula asignando el costo fiscal correspondiente a la participación poblacional de cada estrato.
          RBC = Relación Beneficio-Costo relativa a la mortalidad basal.
        </p>
      </div>
    </div>
  );
};
