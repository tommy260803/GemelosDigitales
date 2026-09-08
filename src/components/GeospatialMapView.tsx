import React, { useState, useMemo } from 'react';
import { DistrictData, Country, HealthFacilityPoint } from '../types';
import { SUB_SAHARAN_DISTRICTS } from '../data/districts';
import { SystemDynamicsEngine } from '../services/systemDynamics';
import { TerrainService } from '../services/terrainService';
import { Terrain3DCanvas } from './Terrain3DCanvas';
import { TerrainElevationProfile } from './TerrainElevationProfile';
import { DigitalTwinProjectionCard } from './DigitalTwinProjectionCard';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Info, 
  Filter, 
  CheckCircle2, 
  Mountain, 
  Activity, 
  Compass, 
  AlertTriangle, 
  Eye, 
  Gauge, 
  TrendingUp, 
  Clock, 
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';

interface GeospatialMapViewProps {
  selectedDistrict?: DistrictData;
  selectedDistrictId?: string;
  districts?: DistrictData[];
  districtsList?: DistrictData[];
  onSelectDistrict: (district: DistrictData) => void;
}

type ChoroplethMetric = 'baselineMMR' | 'livesSaved' | 'travelTime' | 'facilityDelivery' | 'facilitiesCount';
type ViewMode = '2D_CHOROPLETH' | '3D_TOPOGRAPHIC_DEM';

export const GeospatialMapView: React.FC<GeospatialMapViewProps> = ({
  selectedDistrict: propSelectedDistrict,
  selectedDistrictId,
  onSelectDistrict,
  districtsList: propDistrictsList,
  districts: propDistricts,
}) => {
  const { language } = useLanguage();
  const allDistricts = propDistrictsList || propDistricts || SUB_SAHARAN_DISTRICTS;
  
  const currentSelectedDistrict: DistrictData = useMemo(() => {
    if (propSelectedDistrict) return propSelectedDistrict;
    if (selectedDistrictId) {
      const found = allDistricts.find((d) => d.id === selectedDistrictId);
      if (found) return found;
    }
    return allDistricts[0] || SUB_SAHARAN_DISTRICTS[0];
  }, [propSelectedDistrict, selectedDistrictId, allDistricts]);

  // View Mode: 2D Choropleth vs 3D Topographic DEM
  const [viewMode, setViewMode] = useState<ViewMode>('3D_TOPOGRAPHIC_DEM');
  const [selectedCountry, setSelectedCountry] = useState<Country | 'ALL'>('ALL');
  const [activeMetric, setActiveMetric] = useState<ChoroplethMetric>('baselineMMR');
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(null);

  // 3D Topographic Controls
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.8);
  const [showBarriers, setShowBarriers] = useState<boolean>(true);
  const [showContourLines, setShowContourLines] = useState<boolean>(true);
  const [activeScenarioId, setActiveScenarioId] = useState<'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d'>('scenario_d');
  const [selectedFacility, setSelectedFacility] = useState<HealthFacilityPoint | null>(null);

  // Filter districts
  const filteredDistricts = useMemo(() => {
    if (selectedCountry === 'ALL') return allDistricts;
    return allDistricts.filter((d) => d.country === selectedCountry);
  }, [allDistricts, selectedCountry]);

  // 3D Terrain Data generation for currently active district
  const targetDistrict = hoveredDistrict || currentSelectedDistrict;
  const demGrid = useMemo(() => {
    return TerrainService.generateDistrictDEM(targetDistrict, 36);
  }, [targetDistrict]);

  const facilities = useMemo(() => {
    return TerrainService.getHealthFacilities(targetDistrict);
  }, [targetDistrict]);

  const referralRoute = useMemo(() => {
    return TerrainService.getObstetricReferralRoute(targetDistrict, selectedFacility || undefined);
  }, [targetDistrict, selectedFacility]);

  const topographicKPI = useMemo(() => {
    return TerrainService.getTopographicAccessibilityKPI(targetDistrict);
  }, [targetDistrict]);

  // Compute metric calculations (e.g. lives saved with scenario_d)
  const districtMetrics = useMemo(() => {
    const map = new Map<string, { livesSaved: number; mmrReduction: number }>();
    allDistricts.forEach((d) => {
      const res = SystemDynamicsEngine.simulate(d, 'scenario_d');
      map.set(d.id, {
        livesSaved: res.summary.livesSaved,
        mmrReduction: res.summary.mmrReductionPercent,
      });
    });
    return map;
  }, [allDistricts]);

  // Metric color and size calculator for 2D View
  const getMetricValue = (d: DistrictData, metric: ChoroplethMetric): number => {
    switch (metric) {
      case 'baselineMMR':
        return d.baselineMMR;
      case 'livesSaved':
        return districtMetrics.get(d.id)?.livesSaved || 0;
      case 'travelTime':
        return d.avgTravelTimeHours;
      case 'facilityDelivery':
        return d.institutionalDeliveryRate;
      case 'facilitiesCount':
        return d.osmHealthFacilitiesCount || 20;
    }
  };

  const getMetricColor = (val: number, metric: ChoroplethMetric): string => {
    if (metric === 'baselineMMR') {
      if (val >= 700) return '#ef4444'; // Red-500
      if (val >= 550) return '#f97316'; // Orange-500
      if (val >= 400) return '#eab308'; // Yellow-500
      return '#10b981'; // Green-500
    }
    if (metric === 'livesSaved') {
      if (val >= 150) return '#10b981'; // Green-500
      if (val >= 100) return '#06b6d4'; // Cyan-500
      if (val >= 50) return '#3b82f6'; // Blue-500
      return '#a855f7'; // Purple-500
    }
    if (metric === 'travelTime') {
      if (val >= 4.0) return '#ef4444';
      if (val >= 2.5) return '#f59e0b';
      return '#10b981';
    }
    if (metric === 'facilityDelivery') {
      if (val >= 70) return '#10b981';
      if (val >= 50) return '#06b6d4';
      return '#f97316';
    }
    // facilitiesCount
    if (val >= 50) return '#3b82f6';
    if (val >= 30) return '#06b6d4';
    return '#64748b';
  };

  const projectCoords = (lat: number, lng: number): { x: number; y: number } => {
    const minLng = -18;
    const maxLng = 48;
    const minLat = -16;
    const maxLat = 16;

    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 500;
    return { x: Math.max(30, Math.min(770, x)), y: Math.max(30, Math.min(470, y)) };
  };

  const simScenario = useMemo(() => {
    return SystemDynamicsEngine.simulate(targetDistrict, activeScenarioId);
  }, [targetDistrict, activeScenarioId]);

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Header & View Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider flex items-center gap-1">
              <Mountain className="w-3 h-3" />
              GIS 3D DIGITAL ELEVATION MODEL (DEM)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              SRTM 30M RESOLUTION
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'es' 
                ? 'Mapa Geoespacial & Relieve Topográfico 3D de Salud Materna' 
                : 'Geospatial Maternal Health & 3D Topographic Relief Map'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {language === 'es'
              ? 'Modelado de barreras físicas, pendientes críticas y fricción de traslado obstétrico sobre terreno real (Retraso Fase 2).'
              : 'Physical barriers, steep slope gradients, and obstetric referral transit impedance over real topography (Phase 2 Delay).'}
          </p>
        </div>

        {/* View Mode Switcher (2D vs 3D) & Country Filter */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          
          {/* 2D / 3D Mode Toggle Button Group */}
          <div className="flex items-center bg-[#080a0f] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('3D_TOPOGRAPHIC_DEM')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === '3D_TOPOGRAPHIC_DEM'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Relieve 3D (DEM)' : '3D Relief (DEM)'}</span>
            </button>
            <button
              onClick={() => setViewMode('2D_CHOROPLETH')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === '2D_CHOROPLETH'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Coroplético 2D' : '2D Choropleth'}</span>
            </button>
          </div>

          {/* Country Selector */}
          <div className="flex items-center bg-[#0c0e12] rounded-lg p-1 border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value as Country | 'ALL')}
              className="bg-transparent text-slate-200 text-xs px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">{language === 'es' ? 'Todos los Países (25 Distritos)' : 'All Countries (25 Districts)'}</option>
              <option value="Kenya" className="bg-slate-900">Kenya (5)</option>
              <option value="Tanzania" className="bg-slate-900">Tanzania (5)</option>
              <option value="Uganda" className="bg-slate-900">Uganda (5)</option>
              <option value="Ghana" className="bg-slate-900">Ghana (5)</option>
              <option value="Ethiopia" className="bg-slate-900">Ethiopia (5)</option>
            </select>
          </div>

          {/* Active District Selector dropdown */}
          <div className="flex items-center bg-[#0c0e12] rounded-lg p-1 border border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 ml-1.5 mr-1" />
            <select
              value={currentSelectedDistrict.id}
              onChange={(e) => {
                const found = allDistricts.find((d) => d.id === e.target.value);
                if (found) onSelectDistrict(found);
              }}
              className="bg-transparent text-emerald-300 font-bold text-xs px-2 py-1 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {filteredDistricts.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.name} ({d.country})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 3D Topographic Toolbar (Only visible in 3D mode) */}
      {viewMode === '3D_TOPOGRAPHIC_DEM' && (
        <div className="bg-[#0a0c10] border border-slate-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          
          {/* Vertical Exaggeration Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Exageración Vertical:
            </span>
            <div className="flex items-center space-x-1">
              {[1.0, 1.5, 2.0, 2.5, 3.0].map((exag) => (
                <button
                  key={`exag-${exag}`}
                  onClick={() => setVerticalExaggeration(exag)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    verticalExaggeration === exag
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {exag}x
                </button>
              ))}
            </div>
          </div>

          {/* Layer Toggles (Barriers, Contour Lines) */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBarriers}
                onChange={(e) => setShowBarriers(e.target.checked)}
                className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-rose-400 font-bold">Barreras (&gt;15% pendiente)</span>
            </label>

            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showContourLines}
                onChange={(e) => setShowContourLines(e.target.checked)}
                className="rounded border-slate-700 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-slate-300">Curvas de Nivel / Malla</span>
            </label>
          </div>

          {/* Scenario Selector to preview real-time vehicle route transformations */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Simular Ruta:
            </span>
            <select
              value={activeScenarioId}
              onChange={(e) => setActiveScenarioId(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
            >
              <option value="baseline">Línea Base (Ambulancia 2WD Estándar)</option>
              <option value="scenario_a">Escenario A (Moto-Ambulancia Todo Terreno)</option>
              <option value="scenario_d">Escenario D (Estratégico Combinado 24/7)</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Visual Display (3D Terrain Canvas OR 2D Choropleth SVG) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Main Geospatial Canvas (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          
          {viewMode === '3D_TOPOGRAPHIC_DEM' ? (
            <div className="space-y-4">
              {/* 3D WebGL / Canvas Viewer */}
              <Terrain3DCanvas
                district={targetDistrict}
                demGrid={demGrid}
                facilities={facilities}
                referralRoute={referralRoute}
                selectedFacility={selectedFacility}
                onSelectFacility={(fac) => setSelectedFacility(fac)}
                verticalExaggeration={verticalExaggeration}
                showBarriers={showBarriers}
                showContourLines={showContourLines}
                activeScenarioId={activeScenarioId}
              />

              {/* Longitudinal Elevation Profile Component */}
              <TerrainElevationProfile
                route={referralRoute}
                activeScenarioId={activeScenarioId}
              />
            </div>
          ) : (
            /* 2D Vector GIS Choropleth SVG */
            <div className="bg-[#080a0f] border border-slate-800 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
              
              {/* 2D Map Title & Legend Overlay */}
              <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-1 shadow-lg max-w-[260px]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Capa 2D:</span>
                  <span className="text-sky-400">
                    {activeMetric === 'baselineMMR' && 'RMM / 100k'}
                    {activeMetric === 'livesSaved' && 'Vidas Salvadas'}
                    {activeMetric === 'travelTime' && 'Horas de Traslado'}
                    {activeMetric === 'facilityDelivery' && '% Parto Inst.'}
                    {activeMetric === 'facilitiesCount' && 'Centros Salud OSM'}
                  </span>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400">Bajo</span>
                  <div className="flex-1 h-2 rounded bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
                  <span className="text-[10px] text-slate-400">Alto</span>
                </div>
              </div>

              {/* SVG 2D Map */}
              <div className="w-full h-full flex items-center justify-center pt-8 pb-2">
                <svg
                  viewBox="0 0 800 500"
                  className="w-full h-full max-h-[440px] drop-shadow-xl select-none"
                >
                  {/* Subtle GIS Grid Lines */}
                  <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6">
                    {[100, 200, 300, 400].map((y) => (
                      <line key={`h-${y}`} x1="0" y1={y} x2="800" y2={y} />
                    ))}
                    {[150, 300, 450, 600, 750].map((x) => (
                      <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="500" />
                    ))}
                  </g>

                  {/* Equator & Reference Marker */}
                  <line x1="0" y1="250" x2="800" y2="250" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.3" strokeDasharray="5 5" />
                  <text x="730" y="245" fill="#0ea5e9" fontSize="9" fontFamily="monospace" opacity="0.6">Ecuador 0°</text>

                  {/* Sub-Saharan Africa Silhouette */}
                  <path
                    d="M 280,110 Q 320,80 390,85 T 460,95 Q 540,110 590,130 Q 640,170 660,220 Q 640,260 610,290 T 570,360 Q 520,440 480,470 Q 430,450 390,390 T 360,310 Q 320,290 280,260 Q 230,220 220,180 Z"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />

                  {/* Regional Clusters */}
                  <circle cx="590" cy="255" r="95" fill="#0369a1" fillOpacity="0.08" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="4 4" />
                  <text x="610" y="195" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">East Africa Hub</text>

                  <circle cx="270" cy="210" r="60" fill="#15803d" fillOpacity="0.08" stroke="#16a34a" strokeWidth="0.8" strokeDasharray="4 4" />
                  <text x="235" y="170" fill="#4ade80" fontSize="10" fontFamily="monospace" fontWeight="bold">West Africa (Ghana)</text>

                  <circle cx="580" cy="155" r="65" fill="#b45309" fillOpacity="0.08" stroke="#d97706" strokeWidth="0.8" strokeDasharray="4 4" />
                  <text x="560" y="115" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">Horn of Africa (Ethiopia)</text>

                  {/* Districts Geo Scatter Pins */}
                  {filteredDistricts.map((d) => {
                    const pos = projectCoords(d.lat, d.lng);
                    const isSelected = d.id === currentSelectedDistrict.id;
                    const isHovered = hoveredDistrict?.id === d.id;
                    const val = getMetricValue(d, activeMetric);
                    const color = getMetricColor(val, activeMetric);
                    const radius = isSelected ? 9 : isHovered ? 8 : 6;

                    return (
                      <g
                        key={d.id}
                        className="cursor-pointer transition-transform duration-200"
                        onClick={() => onSelectDistrict(d)}
                        onMouseEnter={() => setHoveredDistrict(d)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                      >
                        <circle cx={pos.x} cy={pos.y} r={radius + 4} fill={color} fillOpacity={isSelected ? 0.4 : isHovered ? 0.3 : 0.15} />
                        <circle cx={pos.x} cy={pos.y} r={radius} fill={color} stroke={isSelected ? '#ffffff' : '#0c0e12'} strokeWidth={isSelected ? 2 : 1.2} />
                        {(isSelected || isHovered) && (
                          <g>
                            <rect x={pos.x + 10} y={pos.y - 14} width={d.name.length * 7 + 20} height="20" rx="4" fill="#0f172a" stroke={color} strokeWidth="1" opacity="0.95" />
                            <text x={pos.x + 16} y={pos.y} fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">{d.name}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom 2D Status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 px-1">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-sky-400" />
                  Proyección: Equirectangular WGS84 | Cobertura: 25 Distritos DHS
                </span>
                <span>Distritos Visibles: <strong className="text-slate-300">{filteredDistricts.length}</strong> / 25</span>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Scientific Telemetry & SD Correlation Panel (1 Column) */}
        <div className="space-y-4">
          
          {/* Digital Twin Scenario Projection Card (Protocol Ficha 10) */}
          <DigitalTwinProjectionCard
            district={targetDistrict}
            activeScenarioId={activeScenarioId}
            onSelectScenario={(scenId) => setActiveScenarioId(scenId)}
          />

          {/* Topographic Accessibility & Physical Barriers KPI Card */}
          <div className="bg-[#0c0e12] border border-slate-800 rounded-lg p-4 shadow-sm font-mono text-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  Índice de Accesibilidad Topográfica
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                TAI: {topographicKPI.topographicAccessibilityIndex}%
              </span>
            </div>

            {/* Topographic KPIs Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Pendiente &lt; 10%:</span>
                <span className="text-emerald-400 font-bold text-sm">{topographicKPI.areaWithSlopeUnder10Percent}%</span>
                <span className="text-[9px] text-slate-500 block">Área transitable</span>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Pendiente &gt; 15% (Riesgo):</span>
                <span className="text-rose-400 font-bold text-sm">{topographicKPI.highRiskSlopeAreaPercent}%</span>
                <span className="text-[9px] text-slate-500 block">Barreras críticas</span>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Población &lt; 2h EmONC:</span>
                <span className="text-sky-300 font-bold text-sm">{topographicKPI.percentPopulationWithin2Hours}%</span>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Fricción Terreno:</span>
                <span className="text-amber-300 font-bold text-sm">{topographicKPI.terrainFrictionPenaltyFactor}x</span>
              </div>
            </div>

            {/* Correlation Box: System Dynamics Model vs 3D Terrain Route */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Correlación Retraso Fase 2 (Traslado):
                </span>
                <span className="text-[10px] text-slate-400">
                  {topographicKPI.sdTravelTimeDiscrepancyPercent > 20 ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Discrepancia {topographicKPI.sdTravelTimeDiscrepancyPercent}%
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Calibrado ({topographicKPI.sdTravelTimeDiscrepancyPercent}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tiempo de traslado (Modelo SD):</span>
                  <strong className="text-slate-200">{targetDistrict.avgTravelTimeHours} hrs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tiempo sobre Relieve 3D (Estándar):</span>
                  <strong className="text-amber-300">{(referralRoute.estimatedTravelTimeMinutesStandard / 60).toFixed(1)} hrs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tiempo sobre Relieve 3D (Moto-Ambulancia):</span>
                  <strong className="text-emerald-400">{(referralRoute.estimatedTravelTimeMinutesMotoAmbulance / 60).toFixed(1)} hrs</strong>
                </div>
              </div>

              {topographicKPI.sdTravelTimeDiscrepancyPercent > 20 && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-200/90 leading-relaxed mt-1">
                  ⚠️ <strong>Aviso Epidemiológico:</strong> El relieve 3D genera un incremento de fricción del {topographicKPI.sdTravelTimeDiscrepancyPercent}% respecto a la distancia euclidiana 2D plana. En análisis de sensibilidad Sobol, este factor explica el 31% de la varianza en muertes por hemorragia postparto.
                </div>
              )}
            </div>
          </div>

          {/* EmONC Health Facilities List on the Topographic Terrain */}
          <div className="bg-[#0c0e12] border border-slate-800 rounded-lg p-4 shadow-sm font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Red de Centros EmONC ({facilities.length})
              </span>
              <span className="text-[10px] text-slate-500">Altitud m.s.n.m.</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {facilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                const isCEmONC = fac.facilityType === 'CEmONC_Hospital';

                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500/60 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-[11px] truncate max-w-[180px]">
                        {fac.name}
                      </span>
                      <span className="text-amber-300 font-bold text-[10px]">
                        {fac.altitudeMeters}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className={isCEmONC ? 'text-sky-400 font-bold' : 'text-emerald-400'}>
                        {isCEmONC ? 'CEmONC (Quirófano)' : 'BEmONC (Básico)'}
                      </span>
                      <span>{fac.beds} camas | {fac.cSectionCapable ? 'Cesárea ✓' : 'Sin Cirugía'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button: Load and Simulate District */}
          {targetDistrict.id !== currentSelectedDistrict.id && (
            <button
              onClick={() => onSelectDistrict(targetDistrict)}
              className="w-full py-2.5 px-3 rounded-lg font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-lg"
            >
              <MapPin className="w-4 h-4" />
              <span>Cargar Distrito Activo: {targetDistrict.name}</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
