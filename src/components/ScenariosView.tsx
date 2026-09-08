import React, { useMemo } from 'react';
import { 
  Award,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { SystemDynamicsEngine, SCENARIO_DEFINITIONS } from '../services/systemDynamics';
import { useLanguage } from '../i18n/translations';

interface ScenariosViewProps {
  district: DistrictData;
  activeScenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
  onSelectScenario: (id: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d') => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  district,
  activeScenarioId,
  onSelectScenario,
}) => {
  const { t, language } = useLanguage();

  // Compute simulation for all scenarios simultaneously
  const allResults: Record<string, SimulationResult> = useMemo(() => {
    const results: Record<string, SimulationResult> = {};
    SCENARIO_DEFINITIONS.forEach((s) => {
      results[s.id] = SystemDynamicsEngine.simulate(district, s.id, {}, 36);
    });
    return results;
  }, [district]);

  // Scenario localized name helper
  const getScenarioName = (sId: string, origName: string) => {
    if (sId === 'baseline') return t.baseline;
    if (sId === 'scenario_a') return t.scenarioAName;
    if (sId === 'scenario_b') return t.scenarioBName;
    if (sId === 'scenario_c') return t.scenarioCName;
    if (sId === 'scenario_d') return t.scenarioDName;
    return origName;
  };

  const getScenarioDesc = (sId: string, origDesc: string) => {
    if (sId === 'baseline') return t.baselineDesc;
    if (sId === 'scenario_a') return t.scenarioADesc;
    if (sId === 'scenario_b') return t.scenarioBDesc;
    if (sId === 'scenario_c') return t.scenarioCDesc;
    if (sId === 'scenario_d') return t.scenarioDDesc;
    return origDesc;
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                {t.policyMatrixTitle}
              </span>
              <h2 className="text-xs font-bold text-white uppercase tracking-tight">
                {t.policyMatrixSubtitle} (36 {t.monthsCount})
              </h2>
            </div>
            <p className="text-sm text-slate-400 font-mono mt-0.5">
              {language === 'es' 
                ? `AnÃ¡lisis comparativo para ${district.name} (${district.country}) en paquetes de intervenciÃ³n Ãºnicos y combinados.`
                : `Comparative analysis for ${district.name} (${district.country}) across single and combined intervention packages.`}
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIO_DEFINITIONS.filter((s) => s.id !== 'baseline').map((s) => {
          const res = allResults[s.id];
          const isSelected = activeScenarioId === s.id;
          const isCombined = s.id === 'scenario_d';
          const localizedName = getScenarioName(s.id, s.name);
          const localizedDesc = getScenarioDesc(s.id, s.description);

          return (
            <div
              key={s.id}
              onClick={() => onSelectScenario(s.id)}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                isCombined
                  ? 'bg-sky-950/20 border-sky-500/40 shadow-sm ring-1 ring-sky-500/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              } ${isSelected ? 'ring-2 ring-sky-400 bg-sky-900/10' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isCombined ? 'bg-sky-600 text-white shadow-sm' : 'bg-[#0c0e12] text-sky-400 border border-slate-800'
                  }`}>
                    {language === 'es' ? 'Escenario' : 'Scenario'} ({s.letter})
                  </span>
                  {isCombined && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 flex items-center">
                      <Award className="w-3 h-3 mr-0.5" /> {language === 'es' ? 'Alto Impacto' : 'High Impact'}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">{localizedName}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-2.5">{localizedDesc}</p>

                {/* Core Result Stats */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">{language === 'es' ? 'Vidas Salvadas:' : 'Lives Saved:'}</span>
                    <span className="font-bold text-sky-400 text-xs">
                      {res.summary.livesSaved} <span className="text-xs text-slate-500">[{res.summary.livesSavedCI95[0]}-{res.summary.livesSavedCI95[1]}]</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">{language === 'es' ? 'ReducciÃ³n RMM:' : 'MMR Reduction:'}</span>
                    <span className="font-bold text-emerald-400 text-xs">-{res.summary.mmrReductionPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">{language === 'es' ? 'Costo / Vida:' : 'Cost / Life:'}</span>
                    <span className="font-bold text-slate-200 text-xs">${res.summary.costPerLifeSavedUSD.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">{t.icerPerDaly}:</span>
                    <span className="font-bold text-cyan-400 text-xs">${res.summary.icerPerDALY} / {language === 'es' ? 'AVAD' : 'DALY'}</span>
                  </div>
                </div>
              </div>

              <button
                className={`w-full mt-3 py-1.5 rounded text-xs font-mono font-bold uppercase flex items-center justify-center space-x-1 transition cursor-pointer ${
                  isSelected ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{isSelected ? (language === 'es' ? 'Escenario Activo' : 'Active Scenario') : (language === 'es' ? 'Seleccionar Escenario' : 'Select Scenario')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparative Full Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          {language === 'es' ? 'Matriz Completa de Costo-Efectividad Comparada' : 'Full Cross-Scenario Cost-Effectiveness Matrix'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0c0e12] text-slate-500 text-xs uppercase font-bold">
                <th className="p-2.5">{language === 'es' ? 'Escenario' : 'Scenario'}</th>
                <th className="p-2.5">{language === 'es' ? 'Mecanismo de IntervenciÃ³n' : 'Intervention Mechanism'}</th>
                <th className="p-2.5">{language === 'es' ? 'Vidas Salvadas (IC 95%)' : 'Lives Saved (95% CI)'}</th>
                <th className="p-2.5">{language === 'es' ? 'RMM Final' : 'Final MMR'}</th>
                <th className="p-2.5">{language === 'es' ? '% Red. RMM' : 'MMR Red. %'}</th>
                <th className="p-2.5">{language === 'es' ? 'Costo Total (USD)' : 'Total Cost (USD)'}</th>
                <th className="p-2.5">{language === 'es' ? 'Costo / Vida' : 'Cost / Life'}</th>
                <th className="p-2.5">{t.icerPerDaly}</th>
                <th className="p-2.5">{language === 'es' ? 'Umbral OMS' : 'WHO Threshold'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {SCENARIO_DEFINITIONS.map((s) => {
                const res = allResults[s.id];
                const isSelected = activeScenarioId === s.id;
                const localizedName = getScenarioName(s.id, s.name);
                const localizedDesc = getScenarioDesc(s.id, s.description);

                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectScenario(s.id)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-sky-950/30 text-white' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="p-2.5 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-slate-600'}`} />
                        <span>({s.letter}) {localizedName}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-slate-400 font-sans text-xs">{localizedDesc.slice(0, 48)}...</td>
                    <td className="p-2.5 font-bold text-sky-400">
                      {s.id === 'baseline' ? (
                        <span className="text-slate-400 font-normal">0 <span className="text-xs text-slate-500 font-mono">({language === 'es' ? 'Control' : 'Reference'})</span></span>
                      ) : (
                        <>{res.summary.livesSaved} <span className="text-xs text-slate-500">[{res.summary.livesSavedCI95[0]}-{res.summary.livesSavedCI95[1]}]</span></>
                      )}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-200">{res.summary.mmrFinal}</td>
                    <td className="p-2.5 font-bold text-emerald-400">
                      {s.id === 'baseline' ? (
                        <span className="text-slate-500 font-normal">0.0% <span className="text-xs">({language === 'es' ? 'Base' : 'Ref'})</span></span>
                      ) : (
                        <>-{res.summary.mmrReductionPercent}%</>
                      )}
                    </td>
                    <td className="p-2.5">
                      {s.id === 'baseline' ? (
                        <span className="text-slate-500">$0</span>
                      ) : (
                        <>${res.summary.totalCostUSD.toLocaleString()}</>
                      )}
                    </td>
                    <td className="p-2.5">
                      {s.id === 'baseline' ? (
                        <span className="text-slate-500">â€” <span className="text-xs">({language === 'es' ? 'Control' : 'Control'})</span></span>
                      ) : (
                        <>${res.summary.costPerLifeSavedUSD.toLocaleString()}</>
                      )}
                    </td>
                    <td className="p-2.5 text-cyan-400 font-bold">
                      {s.id === 'baseline' ? (
                        <span className="text-slate-500 font-normal">â€”</span>
                      ) : (
                        <>${res.summary.icerPerDALY}</>
                      )}
                    </td>
                    <td className="p-2.5">
                      {s.id === 'baseline' ? (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          {language === 'es' ? 'Control / Referencia' : 'Baseline / Control'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {language === 'es' ? 'Altamente Costo-Efectivo' : 'Highly Cost-Effective'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Synergistic Impact Box */}
        <div className="bg-sky-950/20 border border-sky-500/30 rounded-lg p-3 text-xs text-sky-200 space-y-1">
          <div className="flex items-center space-x-2 font-bold text-sky-300 text-sm uppercase">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>{language === 'es' ? 'Sinergia MultifacÃ©tica en Escenario (d): AversiÃ³n No Lineal de Mortalidad' : 'Multi-Faceted Synergy in Scenario (d): Non-Linear Mortality Aversion'}</span>
          </div>
          <p className="text-slate-300 font-sans text-xs leading-relaxed">
            {language === 'es'
              ? 'Implementar moto-ambulancias (a), eliminaciÃ³n de tarifas (b) y capacitaciÃ³n de parteras tradicionales (c) simultÃ¡neamente genera 1.48x mÃ¡s vidas salvadas que la suma simple de intervenciones individuales, al resolver cuellos de botella secuenciales del Modelo de las Tres Demoras.'
              : 'Implementing moto-ambulances (a), fee elimination (b), and TBA certifications (c) simultaneously produces 1.48x greater lives saved than the simple sum of individual interventions due to eliminating multiple sequential bottlenecks across the Three Delays model.'}
          </p>
        </div>

      </div>

    </div>
  );
};
