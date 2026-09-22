import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  TrendingDown,
  Users,
  Heart,
  Shield,
  Clock,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { DistrictData, SimulationResult, SDParameters } from '../types';
import { SystemDynamicsEngine, SCENARIO_DEFINITIONS, buildDefaultParameters } from '../services/systemDynamics';
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  district,
  activeScenarioId,
  onScenarioChange,
  onOpenCopilot,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [horizonMonths, setHorizonMonths] = useState<number>(36);
  const [customParams, setCustomParams] = useState<Partial<SDParameters>>({});
  const [isParamsOpen, setIsParamsOpen] = useState<boolean>(false);
  const [scaleMode, setScaleMode] = useState<'amplified' | 'linear' | 'logarithmic'>('amplified');

  // Run simulation
  const simResult: SimulationResult = useMemo(() => {
    return SystemDynamicsEngine.simulate(district, activeScenarioId, customParams, horizonMonths);
  }, [district, activeScenarioId, customParams, horizonMonths]);

  const defaultParams = useMemo(() => buildDefaultParameters(district), [district]);
  const activeParams: SDParameters = {
    ...defaultParams,
    ...(SCENARIO_DEFINITIONS.find((s) => s.id === activeScenarioId)?.parameterOverrides || {}),
    ...customParams,
  };

  const trajectories = simResult.trajectories;
  const currentSnapshot = trajectories[trajectories.length - 1];

  // Stock Colors for Visual Chart
  const stockColors = {
    pregnant: '#38bdf8',
    anc: '#34d399',
    delivery: '#818cf8',
    postpartum: '#fbbf24',
    complications: '#f43f5e',
  };

  // Scenario localized name helper
  const getScenarioName = (sId: string, letter: string, origName: string) => {
    if (sId === 'baseline') return t.baseline;
    if (sId === 'scenario_a') return t.scenarioAName;
    if (sId === 'scenario_b') return t.scenarioBName;
    if (sId === 'scenario_c') return t.scenarioCName;
    if (sId === 'scenario_d') return t.scenarioDName;
    return origName;
  };

  // Find max stock for SVG scaling
  const maxStock = Math.max(...trajectories.map((t) => Math.max(t.pregnantWomen, t.inANC * 1.5, t.inPostpartum)));

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <SectionHeader
        title={`${district.name} (${district.country})`}
        subtitle={language === 'es' 
          ? 'Gemelo Digital de Dinámica de Sistemas Maternos'
          : 'Maternal Health System Dynamics Twin'}
        icon={<Activity className="w-5 h-5" />}
        badge={
          <Badge variant="info" size="sm">
            {t.coreVersion}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <select
              value={horizonMonths}
              onChange={(e) => setHorizonMonths(Number(e.target.value))}
              className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <option value={24}>24 meses</option>
              <option value={36}>36 meses</option>
              <option value={60}>60 meses (5A)</option>
            </select>
          </div>
        }
      />

      {/* Scenario Selector */}
      <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            {language === 'es' ? 'Selecciona una intervención' : 'Select an intervention'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_DEFINITIONS.map((s) => {
            const isActive = activeScenarioId === s.id;
            const localizedName = getScenarioName(s.id, s.letter, s.name);
            return (
              <button
                key={s.id}
                onClick={() => onScenarioChange(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                    : theme === 'light'
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="opacity-70">({s.letter})</span> {localizedName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Result Banner */}
      <div className={`rounded-xl p-4 ${
        activeScenarioId === 'baseline'
          ? theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-slate-900/50 border border-slate-800'
          : 'bg-sky-500/10 border border-sky-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              activeScenarioId === 'baseline'
                ? theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                : 'text-sky-600 dark:text-sky-400'
            }`}>
              {language === 'es' ? 'Resultado principal' : 'Key result'}
            </p>
            <p className={`text-sm mt-1 ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {activeScenarioId === 'baseline'
                ? (language === 'es' ? 'La línea base representa la evolución sin nuevas intervenciones.' : 'The baseline represents the trajectory without new interventions.')
                : (language === 'es'
                  ? `El escenario seleccionado podría reducir la RMM un ${simResult.summary.mmrReductionPercent}% y salvar ${simResult.summary.livesSaved} vidas en ${horizonMonths} meses.`
                  : `The selected scenario could reduce MMR by ${simResult.summary.mmrReductionPercent}% and save ${simResult.summary.livesSaved} lives in ${horizonMonths} months.`)}
            </p>
          </div>
          <Badge variant={activeScenarioId === 'baseline' ? 'default' : 'success'} size="sm">
            {language === 'es' ? 'Estimación del modelo' : 'Model estimate'}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.baselineMMR}
          value={district.baselineMMR}
          icon={<Activity className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          label={t.simulatedMMR}
          value={simResult.summary.mmrFinal}
          change={activeScenarioId !== 'baseline' ? {
            value: -simResult.summary.mmrReductionPercent,
            label: language === 'es' ? 'reducción' : 'reduction'
          } : undefined}
          icon={<TrendingDown className="w-5 h-5" />}
          variant={activeScenarioId !== 'baseline' ? 'success' : 'default'}
        />
        <StatCard
          label={t.livesSaved}
          value={activeScenarioId === 'baseline' ? '—' : simResult.summary.livesSaved}
          subtitle={activeScenarioId !== 'baseline' ? `IC 95%: [${simResult.summary.livesSavedCI95[0]} - ${simResult.summary.livesSavedCI95[1]}]` : undefined}
          icon={<Heart className="w-5 h-5" />}
          variant={activeScenarioId !== 'baseline' ? 'highlight' : 'default'}
        />
        <StatCard
          label={t.costPerLife}
          value={activeScenarioId === 'baseline' ? '—' : `$${simResult.summary.costPerLifeSavedUSD.toLocaleString()}`}
          subtitle={`${t.icerPerDaly}: ${activeScenarioId === 'baseline' ? '—' : `$${simResult.summary.icerPerDALY}`}`}
          icon={<Shield className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title={language === 'es' ? 'Trayectoria Mensual de Stocks' : 'Monthly Stock Trajectory'}
            subtitle={`${horizonMonths} ${language === 'es' ? 'meses' : 'months'}`}
            actions={
              <div className="flex items-center gap-2">
                <div className={`flex items-center rounded-lg p-0.5 ${
                  theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
                }`}>
                  <button
                    onClick={() => setScaleMode('amplified')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      scaleMode === 'amplified'
                        ? 'bg-sky-500 text-white'
                        : theme === 'light'
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dual/Amp
                  </button>
                  <button
                    onClick={() => setScaleMode('linear')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      scaleMode === 'linear'
                        ? 'bg-sky-500 text-white'
                        : theme === 'light'
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Linear
                  </button>
                  <button
                    onClick={() => setScaleMode('logarithmic')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      scaleMode === 'logarithmic'
                        ? 'bg-sky-500 text-white'
                        : theme === 'light'
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Log₁₀
                  </button>
                </div>
                <button
                  onClick={() => setIsParamsOpen(!isParamsOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isParamsOpen
                      ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                      : theme === 'light'
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Parámetros' : 'Parameters'}</span>
                </button>
              </div>
            }
          >
            {/* Stock Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: stockColors.pregnant }} />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
                  S1: {language === 'es' ? 'Gestantes' : 'Pregnant'} ({currentSnapshot?.pregnantWomen?.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: stockColors.anc }} />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
                  S2: CPN 4+ ({currentSnapshot?.inANC?.toLocaleString()})
                  {scaleMode === 'amplified' && <span className="text-emerald-500 ml-1 text-xs">×1.5</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: stockColors.delivery }} />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
                  S3: {language === 'es' ? 'Parto Inst.' : 'Facility Delivery'} ({currentSnapshot?.inFacilityDelivery?.toLocaleString()})
                  {scaleMode === 'amplified' && <span className="text-indigo-400 ml-1 text-xs">×6</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: stockColors.postpartum }} />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
                  S4: {language === 'es' ? 'Puerperio' : 'Postpartum'} ({currentSnapshot?.inPostpartum?.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: stockColors.complications }} />
                <span className="text-rose-400 font-semibold">
                  S5: {language === 'es' ? 'Compl. Graves' : 'Complications'} ({currentSnapshot?.withComplications?.toLocaleString()})
                  {scaleMode === 'amplified' && <span className="text-rose-500 ml-1 text-xs">×12</span>}
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className={`w-full h-72 rounded-lg p-3 border ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#131a26] border-slate-800'
            }`}>
              <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 60, 120, 180, 240].map((y) => (
                  <line key={y} x1="0" y1={y} x2="700" y2={y} stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeDasharray="3 3" strokeWidth="0.8" />
                ))}

                {/* Curves */}
                {(() => {
                  const getY = (val: number, multiplier: number = 1) => {
                    if (scaleMode === 'linear') return 240 - (val / Math.max(100, maxStock)) * 220;
                    if (scaleMode === 'logarithmic') {
                      const logVal = Math.log10(Math.max(1, val));
                      const maxLog = Math.log10(Math.max(10, maxStock * 1.2));
                      return 240 - (logVal / maxLog) * 220;
                    }
                    return 240 - ((val * multiplier) / Math.max(100, maxStock)) * 220;
                  };

                  return (
                    <>
                      <polyline fill="none" stroke={stockColors.pregnant} strokeWidth="2.5"
                        points={trajectories.map((t, idx) => `${(idx / (trajectories.length - 1)) * 700},${getY(t.pregnantWomen, 1)}`).join(' ')} />
                      <polyline fill="none" stroke={stockColors.anc} strokeWidth="2.5"
                        points={trajectories.map((t, idx) => `${(idx / (trajectories.length - 1)) * 700},${getY(t.inANC, 1.5)}`).join(' ')} />
                      <polyline fill="none" stroke={stockColors.postpartum} strokeWidth="2.5"
                        points={trajectories.map((t, idx) => `${(idx / (trajectories.length - 1)) * 700},${getY(t.inPostpartum, 1)}`).join(' ')} />
                      <polyline fill="none" stroke={stockColors.delivery} strokeWidth="2.5" strokeDasharray="4 2"
                        points={trajectories.map((t, idx) => `${(idx / (trajectories.length - 1)) * 700},${getY(t.inFacilityDelivery, 6)}`).join(' ')} />
                      <polyline fill="none" stroke={stockColors.complications} strokeWidth="3"
                        points={trajectories.map((t, idx) => `${(idx / (trajectories.length - 1)) * 700},${getY(t.withComplications, 12)}`).join(' ')} />
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Scale Explanation */}
            <div className={`mt-3 text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {scaleMode === 'amplified' && (language === 'es' 
                ? 'Modo Escala Dual: S3 (×6) y S5 (×12) reescaladas visualmente para observar dinámicas comunitarias e intrahospitalarias.'
                : 'Dual Scale Mode: S3 (×6) and S5 (×12) visually amplified for concurrent community and facility dynamic tracking.')}
              {scaleMode === 'linear' && (language === 'es' 
                ? 'Modo Lineal 1:1: Todos los stocks graficados en escala física absoluta real.'
                : 'Linear 1:1 Mode: All stocks plotted on exact true physical units.')}
              {scaleMode === 'logarithmic' && (language === 'es' 
                ? 'Modo Logarítmico: Permite comparar magnitudes dispares en la misma escala.'
                : 'Log₁₀ Mode: Enables direct visual tracking of disparate magnitudes continuously.')}
            </div>

            {/* Parameter Drawer */}
            {isParamsOpen && (
              <div className={`mt-4 p-4 rounded-lg border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0c0e12] border-sky-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-sky-300'}`}>
                    {t.parameterControls}
                  </h4>
                  <button
                    onClick={() => setCustomParams({})}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.resetDefaults}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={`flex justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{language === 'es' ? 'Tiempo Traslado (Horas)' : 'Travel Time (Hours)'}</span>
                      <span className="text-sky-500 font-semibold">{activeParams.travelTimeHours}h</span>
                    </label>
                    <input
                      type="range" min="0.5" max="6.0" step="0.1"
                      value={activeParams.travelTimeHours}
                      onChange={(e) => setCustomParams((prev) => ({ ...prev, travelTimeHours: Number(e.target.value) }))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <label className={`flex justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{language === 'es' ? 'Tarifa de Parto ($)' : 'Facility Delivery Fee ($)'}</span>
                      <span className="text-sky-500 font-semibold">${activeParams.facilityDeliveryFeeUSD}</span>
                    </label>
                    <input
                      type="range" min="0" max="30" step="1"
                      value={activeParams.facilityDeliveryFeeUSD}
                      onChange={(e) => setCustomParams((prev) => ({ ...prev, facilityDeliveryFeeUSD: Number(e.target.value) }))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <label className={`flex justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{language === 'es' ? 'Personal Calificado (/1k)' : 'Skilled Staff Ratio (/1k)'}</span>
                      <span className="text-sky-500 font-semibold">{activeParams.skilledStaffRatio}</span>
                    </label>
                    <input
                      type="range" min="0.5" max="5.0" step="0.1"
                      value={activeParams.skilledStaffRatio}
                      onChange={(e) => setCustomParams((prev) => ({ ...prev, skilledStaffRatio: Number(e.target.value) }))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <label className={`flex justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{language === 'es' ? 'Banco de Sangre' : 'Blood Bank Availability'}</span>
                      <span className="text-rose-500 font-semibold">{Math.round(activeParams.bloodAvailabilityRate * 100)}%</span>
                    </label>
                    <input
                      type="range" min="0.1" max="1.0" step="0.05"
                      value={activeParams.bloodAvailabilityRate}
                      onChange={(e) => setCustomParams((prev) => ({ ...prev, bloodAvailabilityRate: Number(e.target.value) }))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <label className={`flex justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{language === 'es' ? 'Stock Oxitocina/Misoprostol' : 'Oxytocin/Misoprostol Stock'}</span>
                      <span className="text-emerald-500 font-semibold">{Math.round(activeParams.oxytocinMisoprostolStockRate * 100)}%</span>
                    </label>
                    <input
                      type="range" min="0.2" max="1.0" step="0.05"
                      value={activeParams.oxytocinMisoprostolStockRate}
                      onChange={(e) => setCustomParams((prev) => ({ ...prev, oxytocinMisoprostolStockRate: Number(e.target.value) }))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className={`flex justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{language === 'es' ? 'Educación Secundaria Femenina' : 'Female Secondary Education'}</span>
                      <span className="text-indigo-500 font-semibold">{Math.round(activeParams.maternalEducationRate * 100)}%</span>
                    </label>
                    <input
                      type="range" min="0.1" max="0.9" step="0.05"
                      value={activeParams.maternalEducationRate}
                      onChange={(e) => setCustomParams((prev) => ({ ...prev, maternalEducationRate: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* System Dynamics Stocks */}
          <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl p-4`}>
            <h3 className={`text-sm font-semibold mb-4 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {language === 'es' ? 'Stocks Instantáneos' : 'Instantaneous Stocks'}
            </h3>
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-sky-500 ${
                theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {language === 'es' ? 'Gestantes (S1)' : 'Pregnant (S1)'}
                  </p>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.stockS1Desc}
                  </p>
                </div>
                <p className={`text-lg font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {currentSnapshot?.pregnantWomen?.toLocaleString()}
                </p>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-emerald-500 ${
                theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {language === 'es' ? 'CPN 4+ (S2)' : 'ANC 4+ (S2)'}
                  </p>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.stockS2Desc}
                  </p>
                </div>
                <p className={`text-lg font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {currentSnapshot?.inANC?.toLocaleString()}
                </p>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-indigo-500 ${
                theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {language === 'es' ? 'Parto Institucional (S3)' : 'Facility Delivery (S3)'}
                  </p>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.stockS3Desc}
                  </p>
                </div>
                <p className={`text-lg font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {currentSnapshot?.inFacilityDelivery?.toLocaleString()}
                </p>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-rose-500 ${
                theme === 'light' ? 'bg-rose-50' : 'bg-rose-950/30'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-rose-700' : 'text-rose-300'}`}>
                    {language === 'es' ? 'Complicaciones Graves (S5)' : 'Complications (S5)'}
                  </p>
                  <p className={`text-xs ${theme === 'light' ? 'text-rose-500' : 'text-rose-400'}`}>
                    {t.stockS5Desc}
                  </p>
                </div>
                <p className={`text-lg font-bold font-mono ${theme === 'light' ? 'text-rose-700' : 'text-rose-300'}`}>
                  {currentSnapshot?.withComplications?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Loops */}
          <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl p-4`}>
            <h3 className={`text-sm font-semibold mb-3 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {language === 'es' ? 'Bucles de Retroalimentación' : 'Feedback Loops'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'}`}>
                <p className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Confianza (R1)' : 'Trust (R1)'}
                </p>
                <p className={`text-lg font-bold font-mono text-sky-500`}>
                  {Math.round(currentSnapshot.systemTrustLevel * 100)}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'}`}>
                <p className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Saturación (B1)' : 'Congestion (B1)'}
                </p>
                <p className={`text-lg font-bold font-mono ${
                  currentSnapshot.facilityCongestionIndex > 1.2 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {currentSnapshot.facilityCongestionIndex}x
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'}`}>
                <p className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Traslado Fase 2' : 'Phase 2 Transit'}
                </p>
                <p className={`text-lg font-bold font-mono text-cyan-500`}>
                  {currentSnapshot.phase2DelayHours}h
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40'}`}>
                <p className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Triage Fase 3' : 'Phase 3 Triage'}
                </p>
                <p className={`text-lg font-bold font-mono ${
                  currentSnapshot.phase3DelayHours > 1.5 ? 'text-rose-500' : 
                  currentSnapshot.phase3DelayHours > 0.8 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {currentSnapshot.phase3DelayHours}h
                </p>
              </div>
            </div>
          </div>

          {/* Bottlenecks */}
          <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                {language === 'es' ? 'Cuellos de Botella Identificados' : 'Identified Bottlenecks'}
              </h3>
            </div>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${
                theme === 'light' ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/30 border-rose-800/50'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-rose-700' : 'text-rose-300'}`}>
                    {language === 'es' ? 'Retraso Geográfico (Fase 2)' : 'Geographic Delay (Phase 2)'}
                  </p>
                  <Badge variant="danger" size="sm">38% Var</Badge>
                </div>
                <p className={`text-xs ${theme === 'light' ? 'text-rose-600' : 'text-rose-400'}`}>
                  {language === 'es' 
                    ? `${district.avgDistanceToEmONC}km de distancia media y ${district.avgTravelTimeHours}h de traslado.`
                    : `${district.avgDistanceToEmONC}km avg distance & ${district.avgTravelTimeHours}h transit time.`}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/30 border-amber-800/50'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>
                    {language === 'es' ? 'Barrera Financiera' : 'Financial Barrier'}
                  </p>
                  <Badge variant="warning" size="sm">24% Var</Badge>
                </div>
                <p className={`text-xs ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>
                  {language === 'es'
                    ? `Tasa de pobreza del ${district.povertyRate}% retrasa la decisión de acudir al parto institucional.`
                    : `Poverty rate of ${district.povertyRate}% creates delays in seeking institutional delivery.`}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenCopilot}
              className="w-full mt-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t.aiCopilotBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Comparison - Collapsible */}
      <details className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl`}>
        <summary className={`px-5 py-4 cursor-pointer list-none select-none ${
          theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {language === 'es' ? 'Comparar otros escenarios' : 'Compare other scenarios'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
          </div>
        </summary>
        <div className={`border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
            {SCENARIO_DEFINITIONS.filter((s) => s.id !== 'baseline').map((s) => {
              const res = SystemDynamicsEngine.simulate(district, s.id, {}, horizonMonths);
              const isSelected = activeScenarioId === s.id;
              const localizedName = getScenarioName(s.id, s.letter, s.name);

              return (
                <div 
                  key={s.id} 
                  onClick={() => onScenarioChange(s.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? theme === 'light' ? 'bg-sky-50' : 'bg-sky-950/30'
                      : theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold uppercase ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      ({s.letter})
                    </span>
                    {isSelected && <Badge variant="success" size="sm">Activo</Badge>}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {localizedName}
                  </p>
                  <p className={`text-2xl font-bold font-mono mb-2 ${
                    s.id === 'scenario_d' ? 'text-emerald-500' : theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    -{res.summary.mmrReductionPercent}%
                  </p>
                  <div className={`text-xs space-y-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div className="flex justify-between">
                      <span>{language === 'es' ? 'Vidas:' : 'Lives:'}</span>
                      <span className="text-sky-500 font-semibold">{res.summary.livesSaved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{language === 'es' ? 'Costo:' : 'Cost:'}</span>
                      <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>
                        ${res.summary.costPerLifeSavedUSD.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
};
