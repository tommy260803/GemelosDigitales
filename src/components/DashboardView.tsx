import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  AlertCircle, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DistrictData, SimulationResult, SDParameters } from '../types';
import { SystemDynamicsEngine, SCENARIO_DEFINITIONS, buildDefaultParameters } from '../services/systemDynamics';
import { useLanguage } from '../i18n/translations';

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
  const [horizonMonths, setHorizonMonths] = useState<number>(36);
  const [customParams, setCustomParams] = useState<Partial<SDParameters>>({});
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
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
  const currentSnapshot = hoveredMonth !== null 
    ? trajectories.find((t) => t.timeMonth === hoveredMonth) || trajectories[trajectories.length - 1]
    : trajectories[trajectories.length - 1];

  // Stock Colors for Visual Chart
  const stockColors = {
    pregnant: '#38bdf8', // S1: Light Blue
    anc: '#34d399',      // S2: Emerald
    delivery: '#818cf8', // S3: Indigo
    postpartum: '#fbbf24', // S4: Amber
    complications: '#f43f5e', // S5: Rose
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

  const getScenarioDesc = (sId: string, origDesc: string) => {
    if (sId === 'baseline') return t.baselineDesc;
    if (sId === 'scenario_a') return t.scenarioADesc;
    if (sId === 'scenario_b') return t.scenarioBDesc;
    if (sId === 'scenario_c') return t.scenarioCDesc;
    if (sId === 'scenario_d') return t.scenarioDDesc;
    return origDesc;
  };

  // Find max stock for SVG scaling
  const maxStock = Math.max(...trajectories.map((t) => Math.max(t.pregnantWomen, t.inANC * 1.5, t.inPostpartum)));

  return (
    <div className="space-y-4">
      
      {/* Top Protocol & Hypothesis Banner */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                {t.coreVersion}
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                {district.name} ({district.country}) â€” {language === 'es' ? 'Gemelo Digital de DinÃ¡mica de Sistemas Maternos' : 'Maternal Health System Dynamics Twin'}
              </h2>
            </div>
            <p className="text-sm text-slate-400 font-mono mt-0.5">
              {t.hypothesisH1}
            </p>
          </div>

          {/* Scenario Selector Pills - High Density */}
          <div className="flex items-center flex-wrap gap-1 bg-[#0c0e12] p-1 rounded-md border border-slate-800">
            {SCENARIO_DEFINITIONS.map((s) => {
              const isActive = activeScenarioId === s.id;
              const localizedName = getScenarioName(s.id, s.letter, s.name);
              return (
                <button
                  key={s.id}
                  id={`btn-scenario-${s.id}`}
                  onClick={() => onScenarioChange(s.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="opacity-70">({s.letter})</span> {localizedName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* High Density KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        
        {/* Baseline MMR */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.baselineMMR}</div>
          <div className="flex items-end gap-1.5 my-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-white">{district.baselineMMR}</span>
          </div>
          <div className="text-xs text-slate-600 font-mono italic">{t.per100kLiveBirths}</div>
        </div>

        {/* Simulated MMR */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.simulatedMMR}</div>
          <div className="flex items-end gap-1.5 my-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">{simResult.summary.mmrFinal}</span>
            <span className="text-xs text-emerald-400 mb-0.5 font-mono">-{simResult.summary.mmrReductionPercent}%</span>
          </div>
          <div className="text-xs text-slate-600 font-mono italic">{t.avertedMMR}</div>
        </div>

        {/* ANC 4+ Coverage */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.anc4Coverage}</div>
          <div className="flex items-end gap-1.5 my-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-white">{simResult.summary.anc4CoverageFinal}%</span>
            <span className="text-xs text-sky-400 mb-0.5 font-mono">+{simResult.summary.anc4CoverageFinal - district.anc4Coverage}%</span>
          </div>
          <div className="text-xs text-slate-600 font-mono italic">{t.baseLabel}: {district.anc4Coverage}%</div>
        </div>

        {/* Institutional Deliveries */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.facilityDelivery}</div>
          <div className="flex items-end gap-1.5 my-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-white">{simResult.summary.facilityDeliveryRateFinal}%</span>
            <span className="text-xs text-indigo-400 mb-0.5 font-mono">+{simResult.summary.facilityDeliveryRateFinal - district.institutionalDeliveryRate}%</span>
          </div>
          <div className="text-xs text-slate-600 font-mono italic">{t.baseLabel}: {district.institutionalDeliveryRate}%</div>
        </div>

        {/* Projected Lives Saved Highlight Card */}
        <div className={`bg-slate-900/50 border rounded-lg p-2.5 sm:p-3 flex flex-col justify-between ${
          activeScenarioId === 'baseline' ? 'border-slate-800' : 'bg-sky-900/10 border-sky-900/30 ring-1 ring-sky-500/20'
        }`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${activeScenarioId === 'baseline' ? 'text-slate-400' : 'text-sky-400'}`}>
            {t.livesSaved}
          </div>
          <div className="flex items-end gap-1.5 my-1">
            <span className={`text-2xl sm:text-3xl font-mono font-bold ${activeScenarioId === 'baseline' ? 'text-slate-400' : 'text-sky-400'}`}>
              {simResult.summary.livesSaved}
            </span>
            {activeScenarioId === 'baseline' && (
              <span className="text-xs text-slate-500 font-mono mb-1">({language === 'es' ? 'Control' : 'Ref'})</span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono italic">
            {activeScenarioId === 'baseline' 
              ? (language === 'es' ? 'Escenario de control (sin cambios)' : 'Baseline control (no intervention)')
              : `IC 95%: [${simResult.summary.livesSavedCI95[0]} - ${simResult.summary.livesSavedCI95[1]}]`}
          </div>
        </div>

        {/* Cost per Life Saved */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.costPerLife}</div>
          <div className="flex items-end gap-1.5 my-1">
            <span className="text-lg sm:text-xl font-mono font-bold text-white">
              {activeScenarioId === 'baseline' ? 'â€”' : `$${simResult.summary.costPerLifeSavedUSD.toLocaleString()}`}
            </span>
            {activeScenarioId === 'baseline' && (
              <span className="text-xs text-slate-500 font-mono mb-0.5">({language === 'es' ? 'LÃ­nea Base' : 'Baseline'})</span>
            )}
          </div>
          <div className="text-xs text-slate-600 font-mono italic">
            {activeScenarioId === 'baseline' 
              ? `${t.icerPerDaly}: â€”`
              : `${t.icerPerDaly}: $${simResult.summary.icerPerDALY}`}
          </div>
        </div>

      </div>

      {/* Main Grid: 5-Stock Time Series Chart & System Bottlenecks Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: 5-Stock Trajectory Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {t.monthlyTrajectoryTitle} ({horizonMonths} {t.monthsCount})
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {t.stockVisualSubtitle}
              </p>
            </div>

            {/* Parameter, Scale & Horizon controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Scale Mode Selector */}
              <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 font-mono text-xs">
                <button
                  onClick={() => setScaleMode('amplified')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    scaleMode === 'amplified' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={language === 'es' ? 'Escala amplificada para ver S3 y S5' : 'Amplified dual-scale for S3 & S5'}
                >
                  {language === 'es' ? 'Dual/Amp' : 'Dual/Amp'}
                </button>
                <button
                  onClick={() => setScaleMode('linear')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    scaleMode === 'linear' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={language === 'es' ? 'Escala lineal 1:1 real' : 'True 1:1 linear scale'}
                >
                  {language === 'es' ? 'Lineal 1:1' : 'Linear 1:1'}
                </button>
                <button
                  onClick={() => setScaleMode('logarithmic')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    scaleMode === 'logarithmic' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={language === 'es' ? 'Escala logarÃ­tmica log10' : 'Logarithmic scale log10'}
                >
                  Logâ‚â‚€
                </button>
              </div>

              <select
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2 py-1 focus:outline-none"
              >
                <option value={24}>24 {t.monthsCount}</option>
                <option value={36}>36 {t.monthsCount}</option>
                <option value={60}>60 {t.monthsCount} (5A)</option>
              </select>

              <button
                onClick={() => setIsParamsOpen(!isParamsOpen)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono font-semibold border transition cursor-pointer ${
                  isParamsOpen ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{language === 'es' ? 'PARÃMETROS' : 'PARAMETERS'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Stock Legend with Scale Clarifications */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3 text-sm font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stockColors.pregnant }} />
                <span className="text-slate-300">{language === 'es' ? 'S1: Gestantes' : 'S1: Preg'} ({currentSnapshot?.pregnantWomen?.toLocaleString()})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stockColors.anc }} />
                <span className="text-slate-300">
                  {language === 'es' ? 'S2: CPN 4+' : 'S2: ANC'} ({currentSnapshot?.inANC?.toLocaleString()})
                  {scaleMode === 'amplified' && <span className="text-xs text-emerald-500 ml-1 font-bold">Ã—1.5</span>}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stockColors.delivery }} />
                <span className="text-slate-300">
                  {language === 'es' ? 'S3: Parto Inst.' : 'S3: Del'} ({currentSnapshot?.inFacilityDelivery?.toLocaleString()})
                  {scaleMode === 'amplified' && <span className="text-xs text-indigo-400 ml-1 font-bold">Ã—6</span>}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stockColors.postpartum }} />
                <span className="text-slate-300">{language === 'es' ? 'S4: Puerperio' : 'S4: Postp'} ({currentSnapshot?.inPostpartum?.toLocaleString()})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stockColors.complications }} />
                <span className="text-rose-400 font-bold">
                  {language === 'es' ? 'S5: Compl. Graves' : 'S5: Compl'} ({currentSnapshot?.withComplications?.toLocaleString()})
                  {scaleMode === 'amplified' && <span className="text-xs text-rose-500 ml-1 font-bold">Ã—12</span>}
                </span>
              </div>
            </div>

            {/* Scale mode explanatory notification */}
            <div className="text-xs font-mono text-slate-500 flex items-center justify-between">
              <span>
                {scaleMode === 'amplified' && (language === 'es' 
                  ? 'Modo Escala Dual: S3 (Ã—6) y S5 (Ã—12) reescaladas visualmente para observar simultÃ¡neamente dinÃ¡micas comunitarias e intrahospitalarias.'
                  : 'Dual Scale Mode: S3 (Ã—6) and S5 (Ã—12) visually amplified for concurrent community and facility dynamic tracking.')}
                {scaleMode === 'linear' && (language === 'es' 
                  ? 'Modo Lineal 1:1: Todos los stocks graficados en escala fÃ­sica absoluta real sin multiplicadores.'
                  : 'Linear 1:1 Mode: All stocks plotted on exact true physical units with zero visual scaling.')}
                {scaleMode === 'logarithmic' && (language === 'es' 
                  ? 'Modo LogarÃ­tmico Logâ‚â‚€: Permite comparar magnitudes dispares (S1 ~10â´ vs S5 ~10Â²) en la misma escala continua.'
                  : 'Logâ‚â‚€ Mode: Enables direct visual tracking of disparate magnitudes (S1 ~10â´ vs S5 ~10Â²) continuously.')}
              </span>
            </div>
          </div>

          {/* SVG Multi-Curve Trajectory Chart */}
          <div className="relative w-full h-64 bg-[#131a26] rounded-lg p-2.5 border border-slate-800">
            <svg 
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 240"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              {[0, 60, 120, 180, 240].map((y) => (
                <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.8" />
              ))}

              {/* Curves for the 5 Stocks based on Scale Mode */}
              {(() => {
                const getY = (val: number, multiplier: number = 1) => {
                  if (scaleMode === 'linear') {
                    return 240 - (val / Math.max(100, maxStock)) * 220;
                  }
                  if (scaleMode === 'logarithmic') {
                    const logVal = Math.log10(Math.max(1, val));
                    const maxLog = Math.log10(Math.max(10, maxStock * 1.2));
                    return 240 - (logVal / maxLog) * 220;
                  }
                  // 'amplified' mode
                  return 240 - ((val * multiplier) / Math.max(100, maxStock)) * 220;
                };

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke={stockColors.pregnant}
                      strokeWidth="2.5"
                      points={trajectories.map((t, idx) => {
                        const x = (idx / (trajectories.length - 1)) * 700;
                        const y = getY(t.pregnantWomen, 1);
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    <polyline
                      fill="none"
                      stroke={stockColors.anc}
                      strokeWidth="2.5"
                      points={trajectories.map((t, idx) => {
                        const x = (idx / (trajectories.length - 1)) * 700;
                        const y = getY(t.inANC, 1.5);
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    <polyline
                      fill="none"
                      stroke={stockColors.postpartum}
                      strokeWidth="2.5"
                      points={trajectories.map((t, idx) => {
                        const x = (idx / (trajectories.length - 1)) * 700;
                        const y = getY(t.inPostpartum, 1);
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    <polyline
                      fill="none"
                      stroke={stockColors.delivery}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      points={trajectories.map((t, idx) => {
                        const x = (idx / (trajectories.length - 1)) * 700;
                        const y = getY(t.inFacilityDelivery, 6);
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    <polyline
                      fill="none"
                      stroke={stockColors.complications}
                      strokeWidth="3"
                      points={trajectories.map((t, idx) => {
                        const x = (idx / (trajectories.length - 1)) * 700;
                        const y = getY(t.withComplications, 12);
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </>
                );
              })()}
            </svg>

            {/* Month Hover & Timeline Scrubber */}
            <div className="absolute inset-x-3 bottom-1 flex justify-between text-xs font-mono text-slate-500">
              <span>{t.monthHover} 0</span>
              <span>{t.monthHover} {Math.round(horizonMonths / 2)}</span>
              <span>{t.monthHover} {horizonMonths}</span>
            </div>
          </div>

          {/* Feedback Loops & Delays Active Telemetry (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-[#0c0e12] p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold block">
                {language === 'es' ? 'Confianza (R1):' : 'Trust (R1):'}
              </span>
              <span className="font-bold text-sky-400">{Math.round(currentSnapshot.systemTrustLevel * 100)}% {language === 'es' ? 'Adherencia' : 'Confidence'}</span>
            </div>
            <div className="bg-[#0c0e12] p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold block">
                {language === 'es' ? 'SaturaciÃ³n (B1):' : 'Congestion (B1):'}
              </span>
              <span className={`font-bold ${currentSnapshot.facilityCongestionIndex > 1.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentSnapshot.facilityCongestionIndex}x {language === 'es' ? 'Carga' : 'Load'}
              </span>
            </div>
            <div className="bg-[#0c0e12] p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold block">
                {language === 'es' ? 'Traslado Fase 2:' : 'Phase 2 Transit:'}
              </span>
              <span className="font-bold text-cyan-400">{currentSnapshot.phase2DelayHours} {language === 'es' ? 'Horas' : 'Hours'}</span>
            </div>
            <div className="bg-[#0c0e12] p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold block">
                {language === 'es' ? 'Triage Fase 3:' : 'Phase 3 Triage:'}
              </span>
              <span className={`font-bold ${currentSnapshot.phase3DelayHours > 1.5 ? 'text-rose-400' : currentSnapshot.phase3DelayHours > 0.8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentSnapshot.phase3DelayHours} {language === 'es' ? 'Horas' : 'Hours'}
              </span>
            </div>
          </div>

          {/* Collapsible Parameter Customization Drawer */}
          {isParamsOpen && (
            <div className="bg-[#0c0e12] border border-sky-500/30 rounded-lg p-3 space-y-2 mt-3">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-1.5">
                <span className="font-bold text-sky-300 uppercase">{t.parameterControls}</span>
                <button
                  onClick={() => setCustomParams({})}
                  className="text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t.resetDefaults}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 flex justify-between mb-1 font-mono">
                    <span>{language === 'es' ? 'Tiempo Traslado (Horas):' : 'Travel Time (Hours):'}</span>
                    <span className="text-sky-300 font-bold">{activeParams.travelTimeHours}h</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={activeParams.travelTimeHours}
                    onChange={(e) => setCustomParams((prev) => ({ ...prev, travelTimeHours: Number(e.target.value) }))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-400 flex justify-between mb-1 font-mono">
                    <span>{language === 'es' ? 'Tarifa de Parto ($):' : 'Facility Delivery Fee ($):'}</span>
                    <span className="text-sky-300 font-bold">${activeParams.facilityDeliveryFeeUSD}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={activeParams.facilityDeliveryFeeUSD}
                    onChange={(e) => setCustomParams((prev) => ({ ...prev, facilityDeliveryFeeUSD: Number(e.target.value) }))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-400 flex justify-between mb-1 font-mono">
                    <span>{language === 'es' ? 'Personal Calificado (/1k):' : 'Skilled Staff Ratio (/1k):'}</span>
                    <span className="text-sky-300 font-bold">{activeParams.skilledStaffRatio}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={activeParams.skilledStaffRatio}
                    onChange={(e) => setCustomParams((prev) => ({ ...prev, skilledStaffRatio: Number(e.target.value) }))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                {/* Point 5: Blood Bank Availability Slider */}
                <div>
                  <label className="text-slate-400 flex justify-between mb-1 font-mono">
                    <span>{language === 'es' ? 'Banco de Sangre / Cadena FrÃ­o:' : 'Blood Bank Availability:'}</span>
                    <span className="text-rose-400 font-bold">{Math.round(activeParams.bloodAvailabilityRate * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={activeParams.bloodAvailabilityRate}
                    onChange={(e) => setCustomParams((prev) => ({ ...prev, bloodAvailabilityRate: Number(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Point 5: Oxytocin & Misoprostol Slider */}
                <div>
                  <label className="text-slate-400 flex justify-between mb-1 font-mono">
                    <span>{language === 'es' ? 'Stock Oxitocina/Misoprostol:' : 'Oxytocin/Misoprostol Stock:'}</span>
                    <span className="text-emerald-400 font-bold">{Math.round(activeParams.oxytocinMisoprostolStockRate * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={activeParams.oxytocinMisoprostolStockRate}
                    onChange={(e) => setCustomParams((prev) => ({ ...prev, oxytocinMisoprostolStockRate: Number(e.target.value) }))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-400 flex justify-between mb-1 font-mono">
                    <span>{language === 'es' ? 'EducaciÃ³n Secundaria Femenina:' : 'Female Secondary Education:'}</span>
                    <span className="text-indigo-300 font-bold">{Math.round(activeParams.maternalEducationRate * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={activeParams.maternalEducationRate}
                    onChange={(e) => setCustomParams((prev) => ({ ...prev, maternalEducationRate: Number(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: System Dynamics Stocks & Bottlenecks */}
        <div className="space-y-4">
          
          {/* System Dynamics Stocks HUD */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 flex flex-col">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {language === 'es' ? 'Stocks InstantÃ¡neos de DinÃ¡mica de Sistemas' : 'System Dynamics Instantaneous Stocks'}
            </div>
            
            <div className="flex-1 flex flex-col gap-2.5 relative justify-between font-mono">
              <div className="flex items-center justify-between border-l-2 border-sky-500 pl-3 py-1 bg-slate-950/40 rounded-r">
                <div>
                  <div className="text-xs font-bold text-slate-200">{language === 'es' ? 'Gestantes en Comunidad (S1)' : 'Pregnant Women (S1)'}</div>
                  <div className="text-xs text-slate-500">{t.stockS1Desc}</div>
                </div>
                <div className="text-base font-bold text-white">{currentSnapshot?.pregnantWomen?.toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-between border-l-2 border-emerald-500 pl-3 py-1 bg-slate-950/40 rounded-r">
                <div>
                  <div className="text-xs font-bold text-slate-200">{language === 'es' ? 'En Control CPN 4+ (S2)' : 'In ANC Routine (S2)'}</div>
                  <div className="text-xs text-slate-500">{t.stockS2Desc}</div>
                </div>
                <div className="text-base font-bold text-white">{currentSnapshot?.inANC?.toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-between border-l-2 border-indigo-500 pl-3 py-1 bg-slate-950/40 rounded-r">
                <div>
                  <div className="text-xs font-bold text-slate-200">{language === 'es' ? 'Parto Institucional (S3)' : 'Facility Delivery (S3)'}</div>
                  <div className="text-xs text-slate-500">{t.stockS3Desc}</div>
                </div>
                <div className="text-base font-bold text-white">{currentSnapshot?.inFacilityDelivery?.toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-between border-l-2 border-rose-500 pl-3 py-1 bg-rose-500/10 rounded-r">
                <div>
                  <div className="text-xs font-bold text-rose-400">{language === 'es' ? 'Complicaciones Graves (S5)' : 'Obstetric Compl. (S5)'}</div>
                  <div className="text-xs text-rose-300/70">{t.stockS5Desc}</div>
                </div>
                <div className="text-base font-bold text-rose-300">{currentSnapshot?.withComplications?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Identified Systemic Bottlenecks Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'es' ? 'Cuellos de Botella SistÃ©micos' : 'Identified Systemic Bottlenecks'}</span>
            </h3>

            <div className="space-y-2">
              {/* Bottleneck 1 */}
              <div className="bg-[#0c0e12] border border-rose-500/30 rounded p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-rose-300 text-sm">
                    {language === 'es' ? 'Retraso GeogrÃ¡fico de Traslado (Fase 2)' : 'Phase 2 Geographic Referral Delay'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300">
                    38% Var
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'es' 
                    ? `${district.avgDistanceToEmONC}km de distancia media y ${district.avgTravelTimeHours}h de traslado elevan el riesgo en hemorragias postparto.`
                    : `${district.avgDistanceToEmONC}km avg distance & ${district.avgTravelTimeHours}h transit time creates high risk in unmanaged PPH.`}
                </p>
              </div>

              {/* Bottleneck 2 */}
              <div className="bg-[#0c0e12] border border-amber-500/30 rounded p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-300 text-sm">
                    {language === 'es' ? 'Barrera de Tarifas de Bolsillo' : 'Out-of-Pocket User Fee Barrier'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300">
                    24% Var
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'es'
                    ? `Tasa de pobreza del ${district.povertyRate}% retrasa la decisiÃ³n de acudir al parto institucional en Q1 y Q2.`
                    : `Poverty rate of ${district.povertyRate}% creates delays in seeking institutional delivery among Q1 and Q2.`}
                </p>
              </div>
            </div>

            <button
              id="btn-ask-ai-dashboard"
              onClick={onOpenCopilot}
              className="w-full mt-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-mono font-bold uppercase flex items-center justify-center space-x-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>{t.aiCopilotBtn}</span>
            </button>
          </div>

        </div>

      </div>

      {/* High Density Scenario Comparison Matrix Row */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col">
        <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.policyMatrixTitle}
          </span>
          <div className="text-xs font-mono text-slate-500 italic">
            {t.timeHorizon} {horizonMonths} {t.monthsCount}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          {SCENARIO_DEFINITIONS.filter((s) => s.id !== 'baseline').map((s) => {
            const isOpt = s.id === 'scenario_d';
            const res = SystemDynamicsEngine.simulate(district, s.id, {}, horizonMonths);
            const isSelected = activeScenarioId === s.id;
            const localizedName = getScenarioName(s.id, s.letter, s.name);
            const localizedDesc = getScenarioDesc(s.id, s.description);

            return (
              <div 
                key={s.id} 
                onClick={() => onScenarioChange(s.id)}
                className={`p-3.5 transition-colors cursor-pointer group ${
                  isOpt 
                    ? 'bg-sky-900/10 border-l-2 border-sky-500/50 hover:bg-sky-900/20' 
                    : 'hover:bg-slate-800/30'
                } ${isSelected ? 'ring-1 ring-sky-500/50' : ''}`}
              >
                <div className={`text-xs font-bold uppercase mb-1.5 ${isOpt ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-300'}`}>
                  ({s.letter}) {localizedName}
                </div>
                <div className={`text-xl font-mono font-bold mb-1 ${isOpt ? 'text-white' : 'text-slate-200'}`}>
                  -{res.summary.mmrReductionPercent}% {language === 'es' ? 'RMM' : 'MMR'}
                </div>
                <div className="text-xs text-slate-400 mb-2.5 line-clamp-1">{localizedDesc}</div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">{language === 'es' ? 'Vidas:' : 'Lives:'}</span>
                  <span className="text-sky-400 font-bold">{res.summary.livesSaved} [IC: {res.summary.livesSavedCI95[0]}-{res.summary.livesSavedCI95[1]}]</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mt-1">
                  <span className="text-slate-500">{language === 'es' ? 'Costo:' : 'Cost:'}</span>
                  <span className="text-slate-300 font-bold">${res.summary.costPerLifeSavedUSD.toLocaleString()} / {language === 'es' ? 'Vida' : 'Life'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
