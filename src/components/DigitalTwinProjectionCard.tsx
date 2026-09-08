import React, { useState, useEffect } from 'react';
import { DistrictData, SimulationProjectionResponse } from '../types';
import { SystemDynamicsEngine, SCENARIO_DEFINITIONS } from '../services/systemDynamics';
import { 
  TrendingDown, 
  TrendingUp, 
  HeartHandshake, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';

interface DigitalTwinProjectionCardProps {
  district?: DistrictData | null;
  activeScenarioId?: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  onSelectScenario?: (id: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d') => void;
  compact?: boolean;
}

export const DigitalTwinProjectionCard: React.FC<DigitalTwinProjectionCardProps> = ({
  district,
  activeScenarioId = 'scenario_d',
  onSelectScenario,
  compact = false,
}) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState<boolean>(false);
  const [projectionData, setProjectionData] = useState<SimulationProjectionResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch projection from /api/simulation/projection with fallback to SystemDynamicsEngine
  useEffect(() => {
    if (!district) {
      setProjectionData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setApiError(null);

    const scenarioCode = activeScenarioId === 'baseline' ? 'Base' : activeScenarioId.replace('scenario_', '').toUpperCase();

    // Attempt backend fetch
    fetch(`/api/simulation/projection?district_id=${encodeURIComponent(district.id)}&scenario_code=${encodeURIComponent(scenarioCode)}&months=36`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SimulationProjectionResponse) => {
        if (isMounted) {
          setProjectionData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Backend projection fetch failed, using local System Dynamics engine:', err);
        if (isMounted) {
          // Fallback to local computation
          try {
            const validScenarioId = (['baseline', 'scenario_a', 'scenario_b', 'scenario_c', 'scenario_d'] as const).includes(activeScenarioId as any)
              ? (activeScenarioId as 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d')
              : 'scenario_d';
            const sim = SystemDynamicsEngine.simulate(district, validScenarioId, {}, 36);
            const baseMMR = district.baselineMMR;
            const projMMR = sim.summary.mmrFinal;
            const diff = Math.max(0, baseMMR - projMMR);
            const redPct = validScenarioId === 'baseline' ? 0 : Math.max(0, Math.round(((baseMMR - projMMR) / baseMMR) * 1000) / 10);
            const livesSaved = validScenarioId === 'baseline' ? 0 : sim.summary.livesSaved;
            const costPerLife = validScenarioId === 'baseline' ? 0 : sim.summary.costPerLifeSavedUSD;
            const isValid = validScenarioId === 'baseline' || projMMR < baseMMR;

            setProjectionData({
              district_id: district.id,
              district_name: district.name,
              country: district.country,
              scenario: scenarioCode,
              scenario_id: validScenarioId,
              scenario_name: sim.scenarioName,
              base_mmr: baseMMR,
              projected_mmr: projMMR,
              absolute_difference: diff,
              reduction_percentage: redPct,
              lives_saved_36_months: livesSaved,
              cost_per_life_saved: costPerLife,
              total_intervention_cost: sim.summary.totalCostUSD,
              currency: 'USD',
              projection_months: 36,
              births_per_year: district.annualBirths,
              population: district.population,
              is_valid_reduction: isValid,
              validation_alert: !isValid ? 'El escenario no produce reducción de mortalidad. Revisar parámetros del motor SD.' : null,
              hypotheses_validated: {
                h1_reduction_ge_15: redPct >= 15.0,
                h2_cost_effective_who: costPerLife > 0 && costPerLife < 1500,
              },
            });
          } catch (compErr: any) {
            setApiError(compErr?.message || 'Error en cálculo de proyección');
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [district?.id, activeScenarioId, district?.baselineMMR, district?.annualBirths]);

  // Empty state if no district
  if (!district) {
    return (
      <div className="bg-[#0c0e12] border border-slate-800 rounded-lg p-5 text-center font-mono text-xs text-slate-400">
        <Activity className="w-6 h-6 text-slate-600 mx-auto mb-2 animate-pulse" />
        <p className="font-bold text-slate-300">
          {language === 'es' ? 'Seleccione un distrito para ver la proyección.' : 'Select a district to view projection.'}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          {language === 'es' ? 'Simulación dinámica de stocks y flujos con Ficha 10.' : 'System dynamics stock and flow simulation with Protocol 10.'}
        </p>
      </div>
    );
  }

  // Loading skeleton state
  if (loading && !projectionData) {
    return (
      <div className="bg-[#0c0e12] border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3 animate-pulse">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="h-4 w-40 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-slate-900 rounded" />
          <div className="h-16 bg-slate-900 rounded" />
        </div>
        <div className="h-12 bg-slate-900 rounded" />
      </div>
    );
  }

  const p = projectionData;
  const isBaseline = activeScenarioId === 'baseline';
  const hasReductionError = !isBaseline && p && (!p.is_valid_reduction || p.projected_mmr >= p.base_mmr);
  const reductionPct = p?.reduction_percentage ?? 0;
  
  // Badge color for percentage reduction
  const getReductionBadgeColor = (pct: number) => {
    if (isBaseline) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (pct >= 15) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (pct >= 5) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="bg-[#0c0e12] border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3 shadow-md">
      
      {/* Header with Title & Scenario Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <span>Proyección Gemelo Digital</span>
              <span className="text-sky-400 font-extrabold">(Escenario {p?.scenario || 'D'})</span>
            </h3>
            <span className="text-[10px] text-slate-400 block">
              {district.name} ({district.country}) &bull; Cohorte {p?.projection_months || 36}m
            </span>
          </div>
        </div>

        {/* Quick Scenario Selector Buttons */}
        {onSelectScenario && (
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-md border border-slate-800">
            {(['baseline', 'scenario_a', 'scenario_b', 'scenario_c', 'scenario_d'] as const).map((scenId) => {
              const letter = scenId === 'baseline' ? 'Base' : scenId.replace('scenario_', '').toUpperCase();
              const isAct = activeScenarioId === scenId;
              return (
                <button
                  key={scenId}
                  onClick={() => onSelectScenario(scenId)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    isAct 
                      ? 'bg-sky-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={scenId}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical Validation Error Banner (if MMR increases or no reduction on intervention) */}
      {hasReductionError && (
        <div className="p-2.5 rounded bg-rose-950/40 border border-rose-600/60 text-rose-200 text-[11px] flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <strong>Error en proyección:</strong> el escenario no reduce la mortalidad materna ({p?.projected_mmr} vs base {p?.base_mmr}). Verifique la calibración del modelo.
          </div>
        </div>
      )}

      {/* Control Scenario Notice */}
      {isBaseline && (
        <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300 text-[10px] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Escenario de control (sin cambios/intervenciones).
          </span>
          <span className="text-slate-400 font-bold">Vidas Salvadas = 0</span>
        </div>
      )}

      {/* Main KPI Matrix: MMR Base vs Proyectada */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* RMM Baseline */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            RMM Línea Base
          </span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-xl font-black text-slate-200">
              {p?.base_mmr || district.baselineMMR}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">/100k</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1">DHS / HMIS Observada</span>
        </div>

        {/* RMM Proyectada */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider">
              RMM Proyectada
            </span>
            {!isBaseline && p && p.projected_mmr < p.base_mmr && (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className={`text-xl font-black ${
              isBaseline ? 'text-slate-300' : p && p.projected_mmr < p.base_mmr ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {p?.projected_mmr || district.baselineMMR}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">/100k</span>
          </div>
          <div className="flex items-center justify-between text-[9px] mt-1">
            <span className="text-slate-400">
              {isBaseline ? 'Sin intervención' : `Dif: -${p?.absolute_difference || 0}/100k`}
            </span>
            <span className={`px-1.5 py-0.2 rounded font-bold border ${getReductionBadgeColor(reductionPct)}`}>
              {isBaseline ? '0.0%' : `-${reductionPct}%`}
            </span>
          </div>
        </div>

      </div>

      {/* Lives Saved & Cost-Effectiveness Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Lives Saved (36 Months) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="uppercase font-bold tracking-wider flex items-center gap-1">
              <HeartHandshake className="w-3 h-3 text-emerald-400" />
              Vidas Salvadas
            </span>
            <span className="text-[9px] text-slate-500">36 meses</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-xl font-black ${
              isBaseline ? 'text-slate-400' : (p?.lives_saved_36_months || 0) > 0 ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {isBaseline ? '+0' : `+${p?.lives_saved_36_months || 0}`}
            </span>
            <span className="text-[10px] text-slate-400">madres</span>
          </div>
          <p className="text-[9px] text-slate-500">
            Fórmula: ((RMM_b - RMM_p)/100k) &times; Nac/año &times; 3
          </p>
        </div>

        {/* Cost per Life Saved (USD) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="uppercase font-bold tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" />
              Costo / Vida
            </span>
            <span className="text-[9px] text-emerald-400 font-bold">WHO C-E</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-black text-amber-300">
              {isBaseline ? '$0' : `$${p?.cost_per_life_saved || 0}`}
            </span>
            <span className="text-[9px] text-slate-500">USD</span>
          </div>
          <p className="text-[9px] text-slate-500">
            Inversión total: ${((p?.total_intervention_cost || 0) / 1000).toFixed(1)}k USD
          </p>
        </div>

      </div>

      {/* Hypothesis & Scientific Protocol Ficha 10 Validation */}
      <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] space-y-1.5">
        <div className="flex items-center justify-between font-bold text-slate-300 border-b border-slate-800/60 pb-1">
          <span className="flex items-center gap-1 text-sky-400">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Validación Científica (Protocolo Ficha 10)
          </span>
          <span className="text-[9px] text-slate-500">Nacimientos: {district.annualBirths.toLocaleString()}/año</span>
        </div>

        <div className="flex items-center justify-between text-slate-400 pt-0.5">
          <span>Hipótesis H1 (Reducción RMM &ge; 15%):</span>
          {reductionPct >= 15 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Validada ({reductionPct}%)
            </span>
          ) : isBaseline ? (
            <span className="text-slate-500 font-mono">Línea de Control</span>
          ) : (
            <span className="text-amber-400 font-bold flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Subóptima ({reductionPct}%)
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Umbral Costo-Efectividad OMS (&lt; $1,500/vida):</span>
          {!isBaseline && (p?.cost_per_life_saved || 0) > 0 && (p?.cost_per_life_saved || 0) <= 1500 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Altamente Efectivo
            </span>
          ) : isBaseline ? (
            <span className="text-slate-500 font-mono">Sin Costo Adicional</span>
          ) : (
            <span className="text-sky-300 font-bold">Evaluación Estándar</span>
          )}
        </div>
      </div>

    </div>
  );
};
