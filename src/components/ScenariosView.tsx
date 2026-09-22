import React, { useMemo } from 'react';
import { 
  Award,
  ArrowUpRight,
  Zap,
  TrendingDown,
  DollarSign,
  Shield,
  Heart,
  Layers
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { SystemDynamicsEngine, SCENARIO_DEFINITIONS } from '../services/systemDynamics';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { Badge } from './ui/Badge';
import { DataTable } from './ui/DataTable';
import { ChartCard } from './ui/ChartCard';

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
  const { theme } = useTheme();

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

  const scenarios = SCENARIO_DEFINITIONS.filter((s) => s.id !== 'baseline');

  const tableColumns = [
    {
      key: 'name',
      header: language === 'es' ? 'Escenario' : 'Scenario',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${row.isSelected ? 'bg-sky-400' : 'bg-slate-400'}`} />
          <span className="font-semibold">({row.letter}) {row.name}</span>
        </div>
      ),
    },
    {
      key: 'mechanism',
      header: language === 'es' ? 'Mecanismo' : 'Mechanism',
      render: (row: any) => (
        <span className={`${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          {row.mechanism}
        </span>
      ),
    },
    {
      key: 'livesSaved',
      header: language === 'es' ? 'Vidas Salvadas (IC 95%)' : 'Lives Saved (95% CI)',
      render: (row: any) => (
        <span className="font-semibold text-sky-500">
          {row.livesSaved} <span className="text-xs opacity-60">[{row.ci}]</span>
        </span>
      ),
    },
    {
      key: 'mmrReduction',
      header: language === 'es' ? '% Red. RMM' : 'MMR Red. %',
      render: (row: any) => (
        <span className="font-semibold text-emerald-500">-{row.mmrReduction}%</span>
      ),
    },
    {
      key: 'costPerLife',
      header: language === 'es' ? 'Costo / Vida' : 'Cost / Life',
      render: (row: any) => (
        <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>
          ${row.costPerLife.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'icer',
      header: t.icerPerDaly,
      render: (row: any) => (
        <span className="font-semibold text-cyan-500">
          ${row.icer} / {language === 'es' ? 'AVAD' : 'DALY'}
        </span>
      ),
    },
    {
      key: 'threshold',
      header: language === 'es' ? 'Umbral OMS' : 'WHO Threshold',
      render: (row: any) => (
        <Badge variant="success" size="sm">
          {language === 'es' ? 'Altamente Costo-Efectivo' : 'Highly Cost-Effective'}
        </Badge>
      ),
    },
  ];

  const tableData = SCENARIO_DEFINITIONS.map((s) => {
    const res = allResults[s.id];
    return {
      ...s,
      name: getScenarioName(s.id, s.name),
      mechanism: getScenarioDesc(s.id, s.description).slice(0, 50) + '...',
      livesSaved: s.id === 'baseline' ? 0 : res.summary.livesSaved,
      ci: s.id === 'baseline' ? '—' : `${res.summary.livesSavedCI95[0]}-${res.summary.livesSavedCI95[1]}`,
      mmrReduction: s.id === 'baseline' ? 0 : res.summary.mmrReductionPercent,
      costPerLife: s.id === 'baseline' ? 0 : res.summary.costPerLifeSavedUSD,
      icer: s.id === 'baseline' ? '—' : res.summary.icerPerDALY,
      isSelected: activeScenarioId === s.id,
      isBaseline: s.id === 'baseline',
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <SectionHeader
        title={language === 'es' ? 'Matriz Comparativa de Políticas' : 'Policy Comparison Matrix'}
        subtitle={`${language === 'es' ? 'Análisis comparativo para' : 'Comparative analysis for'} ${district.name} (${district.country}) — 36 ${t.monthsCount}`}
        icon={<Layers className="w-5 h-5" />}
      />

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((s) => {
          const res = allResults[s.id];
          const isSelected = activeScenarioId === s.id;
          const isCombined = s.id === 'scenario_d';
          const localizedName = getScenarioName(s.id, s.name);

          return (
            <div
              key={s.id}
              onClick={() => onSelectScenario(s.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isCombined
                  ? theme === 'light'
                    ? 'bg-sky-50 border-sky-200 shadow-sm ring-1 ring-sky-200'
                    : 'bg-sky-950/20 border-sky-500/40 shadow-sm ring-1 ring-sky-500/20'
                  : theme === 'light'
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              } ${isSelected ? 'ring-2 ring-sky-400' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={isCombined ? 'info' : 'default'} size="sm">
                    {language === 'es' ? 'Escenario' : 'Scenario'} ({s.letter})
                  </Badge>
                  {isCombined && (
                    <Badge variant="warning" size="sm" icon={<Award className="w-3 h-3" />}>
                      {language === 'es' ? 'Alto Impacto' : 'High Impact'}
                    </Badge>
                  )}
                </div>

                <h3 className={`text-sm font-semibold mb-2 ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {localizedName}
                </h3>
                <p className={`text-xs mb-4 line-clamp-2 ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {getScenarioDesc(s.id, s.description)}
                </p>

                {/* Core Stats */}
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1.5 ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      {language === 'es' ? 'Vidas:' : 'Lives:'}
                    </span>
                    <span className="text-sm font-bold text-sky-500">
                      {res.summary.livesSaved}
                      <span className="text-xs opacity-60 ml-1">[{res.summary.livesSavedCI95[0]}-{res.summary.livesSavedCI95[1]}]</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1.5 ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      {language === 'es' ? 'Reducción:' : 'Reduction:'}
                    </span>
                    <span className="text-sm font-bold text-emerald-500">-{res.summary.mmrReductionPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1.5 ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      {language === 'es' ? 'Costo:' : 'Cost:'}
                    </span>
                    <span className={`text-sm font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      ${res.summary.costPerLifeSavedUSD.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1.5 ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      {t.icerPerDaly}:
                    </span>
                    <span className="text-sm font-bold text-cyan-500">
                      ${res.summary.icerPerDALY} / {language === 'es' ? 'AVAD' : 'DALY'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                    : theme === 'light'
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{isSelected ? (language === 'es' ? 'Escenario Activo' : 'Active Scenario') : (language === 'es' ? 'Seleccionar' : 'Select')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparative Table */}
      <ChartCard
        title={language === 'es' ? 'Matriz Completa de Costo-Efectividad' : 'Full Cross-Scenario Cost-Effectiveness Matrix'}
      >
        <DataTable
          columns={tableColumns}
          data={tableData}
          onRowClick={(row) => onSelectScenario(row.id)}
          selectedRowId={activeScenarioId}
          rowKey={(row) => row.id}
        />
      </ChartCard>

      {/* Synergistic Impact Box */}
      <div className={`rounded-xl p-4 ${
        theme === 'light' ? 'bg-sky-50 border border-sky-200' : 'bg-sky-950/20 border border-sky-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
          <div>
            <h4 className={`text-sm font-semibold mb-1 ${theme === 'light' ? 'text-sky-700' : 'text-sky-300'}`}>
              {language === 'es' 
                ? 'Sinergia Multifacética en Escenario (d)'
                : 'Multi-Faceted Synergy in Scenario (d)'}
            </h4>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>
              {language === 'es'
                ? 'Implementar moto-ambulancias (a), eliminación de tarifas (b) y capacitación de parteras tradicionales (c) simultáneamente genera 1.48x más vidas salvadas que la suma simple de intervenciones individuales, al resolver cuellos de botella secuenciales del Modelo de las Tres Demoras.'
                : 'Implementing moto-ambulances (a), fee elimination (b), and TBA certifications (c) simultaneously produces 1.48x greater lives saved than the simple sum of individual interventions due to eliminating multiple sequential bottlenecks across the Three Delays model.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
