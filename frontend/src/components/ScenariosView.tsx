import React from 'react';
import {
  TrendingDown,
  Users,
  Heart,
  Shield,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';
import { Badge } from './ui/Badge';

interface Props {
  district: DistrictData;
  activeScenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  onSelectScenario: (id: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d') => void;
  results: Record<string, SimulationResult>;
}

const SCENARIO_META: Record<string, { name: string; letter: string; color: string; icon: React.ReactNode; mechanism: string }> = {
  baseline:   { name: 'Línea Base (Status Quo)',                letter: 'Base', color: '#94a3b8', icon: <Target className="w-5 h-5" />,       mechanism: 'Sin intervención adicional — trayectoria y capacidad actual' },
  scenario_a: { name: 'Acceso y Transporte (Moto-Ambulancias)', letter: 'A',    color: '#38bdf8', icon: <ArrowRight className="w-5 h-5" />,   mechanism: 'Red de ambulancias en moto y mejora de vías para mitigar el Retraso de Fase 2' },
  scenario_b: { name: 'Acceso Financiero (Sin Tarifas)',        letter: 'B',    color: '#34d399', icon: <Shield className="w-5 h-5" />,       mechanism: 'Abolición de costos de parto institucional y medicamentos esenciales' },
  scenario_c: { name: 'Alianza y Certificación TBA',            letter: 'C',    color: '#818cf8', icon: <Users className="w-5 h-5" />,        mechanism: 'Detección temprana y referencia oportuna mediante parteras tradicionales' },
  scenario_d: { name: 'Paquete Integral Expandido (A+B+C)',     letter: 'D',    color: '#fbbf24', icon: <Zap className="w-5 h-5" />,          mechanism: 'Intervención combinada: transporte + parto gratis + TBA + capacidad clínica' },
};

export const ScenariosView: React.FC<Props> = ({
  district,
  activeScenarioId,
  onSelectScenario,
  results,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const scenarioIds = ['baseline', 'scenario_a', 'scenario_b', 'scenario_c', 'scenario_d'] as const;
  const baseline = results['baseline'];
  const activeResult = results[activeScenarioId];

  return (
    <div className="space-y-4">
      {/* Header */}
      <SectionHeader
        title="Comparación de Escenarios"
        subtitle={`${district.name} · Análisis de dinámica de sistemas de 5 escenarios`}
        icon={<BarChart3 className="w-5 h-5" />}
        badge={
          Object.keys(results).length > 0
            ? <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> {Object.keys(results).length} escenarios cargados</Badge>
            : <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3" /> Sin datos</Badge>
        }
      />

      {!Object.keys(results).length ? (
        <div className="p-5 bg-amber-950/30 border border-amber-500/40 rounded-lg">
          <p className="text-sm text-slate-300">Backend no disponible. Los resultados de los escenarios no pueden calcularse localmente.</p>
        </div>
      ) : (
        <>
          {/* Scenario Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {scenarioIds.map((id) => {
              const meta = SCENARIO_META[id];
              const res = results[id];
              const isActive = id === activeScenarioId;
              const isBaseline = id === 'baseline';
              const isOptimal = id === 'scenario_d';
              const mmrChange = baseline && res && !isBaseline
                ? baseline.summary.mmrFinal - res.summary.mmrFinal
                : 0;
              const mmrPctChange = baseline && res && !isBaseline && baseline.summary.mmrFinal > 0
                ? ((baseline.summary.mmrFinal - res.summary.mmrFinal) / baseline.summary.mmrFinal) * 100
                : 0;

              return (
                <button
                  key={id}
                  onClick={() => onSelectScenario(id)}
                  className={`text-left p-4 rounded-xl border transition-all relative ${
                    isActive
                      ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                      : isOptimal
                      ? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="text-xs font-bold text-slate-300">{meta.letter}</span>
                    </div>
                    {isOptimal && (
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Óptimo
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mb-2 leading-tight">{meta.name}</h3>
                  {res ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-mono font-extrabold" style={{ color: meta.color }}>
                        {res.summary.mmrFinal.toFixed(0)}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">RMM en horizonte</div>
                      {!isBaseline && mmrPctChange > 0 && (
                        <div className="text-sm text-emerald-400 font-bold mt-1">
                          -{mmrPctChange.toFixed(1)}% vs base
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Cargando...</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Comparison Table */}
          <ChartCard
            title="Comparación de Resultados por Escenario"
            subtitle="Resultados de simulación determinista RK4 — no son estimaciones empíricas directas"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Escenario</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">RMM Final</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Reducción RMM</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Muertes Evitadas</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Costo Total</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Costo/Vida Salvada</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Parto Institucional</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioIds.map((id) => {
                    const res = results[id];
                    const meta = SCENARIO_META[id];
                    const isActive = id === activeScenarioId;
                    if (!res) return null;

                    const mmrReduction = baseline && id !== 'baseline' && baseline.summary.mmrFinal > 0
                      ? ((baseline.summary.mmrFinal - res.summary.mmrFinal) / baseline.summary.mmrFinal) * 100
                      : 0;

                    return (
                      <tr
                        key={id}
                        onClick={() => onSelectScenario(id)}
                        className={`border-b border-slate-800/50 cursor-pointer transition-colors ${
                          isActive ? 'bg-sky-900/20' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span className="font-medium">{meta.letter}: {meta.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {res.summary.mmrFinal.toFixed(0)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {id === 'baseline' ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <span className={`font-mono font-medium ${
                              mmrReduction > 20 ? 'text-emerald-400' :
                              mmrReduction > 10 ? 'text-amber-400' :
                              mmrReduction > 0 ? 'text-slate-300' : 'text-rose-400'
                            }`}>
                              -{mmrReduction.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {id === 'baseline' ? '—' : res.summary.livesSaved.toFixed(0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ${res.summary.totalCostUSD.toFixed(0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ${res.summary.costPerLifeSavedUSD.toFixed(0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {res.summary.facilityDeliveryRateFinal.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Active Scenario Detail */}
          {activeResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Scenario Description */}
              <ChartCard
                title={`${SCENARIO_META[activeScenarioId].letter}: ${SCENARIO_META[activeScenarioId].name}`}
                subtitle="Mecanismo de intervención"
              >
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    {SCENARIO_META[activeScenarioId].mechanism}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Nacimientos Acumulados</div>
                      <div className="text-lg font-mono font-bold">{activeResult.summary.totalBirths.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Muertes Maternas</div>
                      <div className="text-lg font-mono font-bold">{activeResult.summary.totalMaternalDeaths.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Cobertura CPN4</div>
                      <div className="text-lg font-mono font-bold">{activeResult.summary.anc4CoverageFinal.toFixed(1)}%</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Parto Institucional</div>
                      <div className="text-lg font-mono font-bold">{activeResult.summary.facilityDeliveryRateFinal.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </ChartCard>

              {/* Relative Performance */}
              <ChartCard title="Rendimiento Relativo vs Línea Base" subtitle="Mejora porcentual en métricas clave">
                {baseline && activeScenarioId !== 'baseline' ? (
                  <div className="space-y-3">
                    {[
                      ['Reducción RMM', activeResult.summary.mmrReductionPercent, '%'],
                      ['Vidas Salvadas', activeResult.summary.livesSaved, 'muertes'],
                      ['Costo por Vida Salvada', activeResult.summary.costPerLifeSavedUSD, 'USD'],
                    ].map(([label, value, unit]) => {
                      const pct = typeof value === 'number' ? value : 0;
                      return (
                        <div key={label as string} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-36 shrink-0">{label as string}</span>
                          <div className="flex-1 h-5 bg-slate-800 rounded overflow-hidden">
                            <div
                              className="h-full bg-sky-500/60 rounded"
                              style={{ width: `${Math.min(100, Math.max(0, unit === '%' ? pct : pct / 10))}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-300 w-20 text-right">
                            {unit === 'USD' ? `$${pct.toFixed(0)}` : `${pct.toFixed(1)}${unit}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-8 text-center">
                    Seleccione un escenario de intervención para ver su rendimiento relativo.
                  </div>
                )}
              </ChartCard>
            </div>
          )}

          {/* Synergy Box */}
          {results['scenario_d'] && baseline && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Sinergia del Paquete Integral
              </h3>
              <p className="text-xs text-slate-400">
                El Escenario D combina todas las intervenciones (expansión de CPN + personal + transporte + confianza). 
                El efecto combinado ({((baseline.summary.mmrFinal - results['scenario_d'].summary.mmrFinal) / baseline.summary.mmrFinal * 100).toFixed(1)}% de reducción de RMM) 
                supera la suma de los efectos individuales gracias a los bucles de retroalimentación sistémicos en el modelo ODE de 5 stocks.
              </p>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-slate-500">
        Las definiciones y simulaciones son provistas por FastAPI; no se ejecutan cálculos epidemiológicos en el frontend.
      </p>
    </div>
  );
};
