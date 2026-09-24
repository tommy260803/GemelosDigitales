import React, { useState, useMemo } from 'react';
import { DistrictData, Country, HealthFacilityPoint } from '../types';
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
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { Badge } from './ui/Badge';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';

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
  const { theme } = useTheme();
  const allDistricts = propDistrictsList || propDistricts || [];

  const currentSelectedDistrict: DistrictData = useMemo(() => {
    if (propSelectedDistrict) return propSelectedDistrict;
    if (selectedDistrictId) {
      const found = allDistricts.find((d) => d.id === selectedDistrictId);
      if (found) return found;
    }
    return allDistricts[0];
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
    return TerrainService.getHealthFacilities(targetDistrict, demGrid);
  }, [targetDistrict, demGrid]);

  const referralRoute = useMemo(() => {
    return TerrainService.getObstetricReferralRoute(targetDistrict, selectedFacility || undefined, demGrid);
  }, [targetDistrict, selectedFacility, demGrid]);

  const topographicKPI = useMemo(() => {
    return TerrainService.getTopographicAccessibilityKPI(targetDistrict);
  }, [targetDistrict]);

  // Scenario metrics are supplied by the backend; no client-side simulation is run here.
  const districtMetrics = useMemo(() => new Map<string, { livesSaved: number; mmrReduction: number }>(), []);

  // Metric color and size calculator for 2D View
  const getMetricValue = (d: DistrictData, metric: ChoroplethMetric): number => {
    switch (metric) {
      case 'baselineMMR': return d.baselineMMR;
      case 'livesSaved': return districtMetrics.get(d.id)?.livesSaved || 0;
      case 'travelTime': return d.avgTravelTimeHours;
      case 'facilityDelivery': return d.institutionalDeliveryRate;
      case 'facilitiesCount': return d.osmHealthFacilitiesCount || 20;
    }
  };

  const getMetricColor = (val: number, metric: ChoroplethMetric): string => {
    if (metric === 'baselineMMR') {
      if (val >= 700) return '#ef4444';
      if (val >= 550) return '#f97316';
      if (val >= 400) return '#eab308';
      return '#10b981';
    }
    if (metric === 'livesSaved') {
      if (val >= 150) return '#10b981';
      if (val >= 100) return '#06b6d4';
      if (val >= 50) return '#3b82f6';
      return '#a855f7';
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

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <SectionHeader
        title={language === 'es'
          ? 'Mapa Geoespacial & Relieve Topográfico 3D'
          : 'Geospatial Map & 3D Topographic Relief'}
        subtitle={language === 'es'
          ? 'Modelado de barreras físicas, pendientes críticas y fricción de traslado obstétrico sobre terreno real'
          : 'Physical barriers, steep slope gradients, and obstetric referral transit impedance over real topography'}
        icon={<Mountain className="w-5 h-5" />}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">GIS 3D DEM</Badge>
            <Badge variant="success" size="sm">SRTM 30M</Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {/* 2D / 3D Mode Toggle */}
            <div className={`flex items-center rounded-lg p-0.5 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <button
                onClick={() => setViewMode('3D_TOPOGRAPHIC_DEM')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === '3D_TOPOGRAPHIC_DEM'
                  ? 'bg-sky-500 text-white shadow-md'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Mountain className="w-4 h-4" />
                <span className="hidden sm:inline">3D Relief</span>
              </button>
              <button
                onClick={() => setViewMode('2D_CHOROPLETH')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === '2D_CHOROPLETH'
                  ? 'bg-sky-500 text-white shadow-md'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">2D Choropleth</span>
              </button>
            </div>

            {/* Country Selector */}
            <div className={`flex items-center rounded-lg p-1 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <Filter className="w-4 h-4 text-slate-400 ml-1.5" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value as Country | 'ALL')}
                className="bg-transparent text-sm px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{language === 'es' ? 'Todos (25)' : 'All (25)'}</option>
                <option value="Kenya">Kenya (5)</option>
                <option value="Tanzania">Tanzania (5)</option>
                <option value="Uganda">Uganda (5)</option>
                <option value="Ghana">Ghana (5)</option>
                <option value="Ethiopia">Ethiopia (5)</option>
              </select>
            </div>

            {/* District Selector */}
            <div className={`flex items-center rounded-lg p-1 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <MapPin className="w-4 h-4 text-emerald-500 ml-1.5" />
              <select
                value={currentSelectedDistrict.id}
                onChange={(e) => {
                  const found = allDistricts.find((d) => d.id === e.target.value);
                  if (found) onSelectDistrict(found);
                }}
                className="bg-transparent text-emerald-600 dark:text-emerald-400 font-medium text-sm px-2 py-1 focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {filteredDistricts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {/* 3D Topographic Toolbar */}
      {viewMode === '3D_TOPOGRAPHIC_DEM' && (
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0c10] border-slate-800/80'
          }`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <span className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {language === 'es' ? 'Exageración Vertical:' : 'Vertical Exaggeration:'}
              </span>
              <div className="flex items-center gap-1">
                {[1.0, 1.5, 2.0, 2.5, 3.0].map((exag) => (
                  <button
                    key={`exag-${exag}`}
                    onClick={() => setVerticalExaggeration(exag)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${verticalExaggeration === exag
                      ? 'bg-sky-500 text-white'
                      : theme === 'light'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                  >
                    {exag}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarriers}
                  onChange={(e) => setShowBarriers(e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-rose-500 font-medium">{language === 'es' ? 'Barreras' : 'Barriers'}</span>
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showContourLines}
                  onChange={(e) => setShowContourLines(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-300'}>
                  {language === 'es' ? 'Curvas de Nivel' : 'Contour Lines'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <select
              value={activeScenarioId}
              onChange={(e) => setActiveScenarioId(e.target.value as any)}
              className={`text-sm rounded-lg px-2 py-1 border focus:outline-none ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-amber-300'
                }`}
            >
              <option value="baseline">Línea Base: Ambulancia Convencional</option>
              <option value="scenario_a">Escenario A: Red Moto-Ambulancias 4x4</option>
              <option value="scenario_b">Escenario B: Eliminación de Tarifas</option>
              <option value="scenario_c">Escenario C: Red Comunitaria TBA</option>
              <option value="scenario_d">Escenario D: Paquete Integral 24/7</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="space-y-6">

        {/* Main Map Canvas */}
        <div className="w-full min-w-0">
          {viewMode === '3D_TOPOGRAPHIC_DEM' ? (
            <div className="space-y-4">
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
              <TerrainElevationProfile
                route={referralRoute}
                activeScenarioId={activeScenarioId}
              />
            </div>
          ) : (
            /* 2D Vector GIS Choropleth SVG */
            <div className={`relative overflow-hidden flex flex-col justify-between min-h-[480px] rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#080a0f] border-slate-800'
              }`}>
              {/* Legend Overlay */}
              <div className={`absolute top-4 left-4 z-10 p-3 rounded-xl border shadow-lg max-w-[220px] ${theme === 'light' ? 'bg-white/95 backdrop-blur border-slate-200' : 'bg-slate-900/90 backdrop-blur border-slate-800'
                }`}>
                <p className={`text-xs font-semibold mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                  {language === 'es' ? 'Capa 2D:' : '2D Layer:'}
                </p>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] text-slate-400">Bajo</span>
                  <div className="flex-1 h-2 rounded bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
                  <span className="text-[10px] text-slate-400">Alto</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(['baselineMMR', 'livesSaved', 'travelTime', 'facilityDelivery', 'facilitiesCount'] as ChoroplethMetric[]).map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setActiveMetric(metric)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${activeMetric === metric
                        ? 'bg-sky-500 text-white'
                        : theme === 'light'
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      {metric === 'baselineMMR' && 'RMM / 100k'}
                      {metric === 'livesSaved' && 'Vidas'}
                      {metric === 'travelTime' && 'Traslado'}
                      {metric === 'facilityDelivery' && '% Parto'}
                      {metric === 'facilitiesCount' && 'Centros'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG 2D Map */}
              <div className="w-full flex items-center justify-center pt-8 pb-2 aspect-[16/9] min-h-[360px] max-h-[720px]">
                <svg viewBox="0 0 800 500" className="w-full h-full drop-shadow-xl select-none">
                  {/* Grid Lines */}
                  <g stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6">
                    {[100, 200, 300, 400].map((y) => (
                      <line key={`h-${y}`} x1="0" y1={y} x2="800" y2={y} />
                    ))}
                    {[150, 300, 450, 600, 750].map((x) => (
                      <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="500" />
                    ))}
                  </g>

                  {/* Sub-Saharan Africa Silhouette */}
                  <path
                    d="M 280,110 Q 320,80 390,85 T 460,95 Q 540,110 590,130 Q 640,170 660,220 Q 640,260 610,290 T 570,360 Q 520,440 480,470 Q 430,450 390,390 T 360,310 Q 320,290 280,260 Q 230,220 220,180 Z"
                    fill={theme === 'light' ? '#f1f5f9' : '#0f172a'}
                    stroke={theme === 'light' ? '#cbd5e1' : '#334155'}
                    strokeWidth="1.2"
                    opacity="0.85"
                  />

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

              {/* Bottom Status */}
              <div className={`flex items-center justify-between text-xs px-4 py-2 border-t ${theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-500'
                }`}>
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-sky-400" />
                  WGS84 | {filteredDistricts.length} / 25
                </span>
                <span>{language === 'es' ? 'Distritos Visibles' : 'Visible Districts'}: <strong>{filteredDistricts.length}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Digital Twin Scenario Projection Card */}
          <DigitalTwinProjectionCard
            district={targetDistrict}
            scenarioId={activeScenarioId}
          />

          {/* Topographic Accessibility KPI */}
          <div className={`xl:col-span-1 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0c0e12] border-slate-800'} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                <Gauge className="w-4 h-4 text-sky-500" />
                {language === 'es' ? 'Índice de Accesibilidad' : 'Accessibility Index'}
              </h3>
              <Badge variant="info" size="sm">TAI: {topographicKPI.topographicAccessibilityIndex}%</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/70'}`}>
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Pendiente < 10%' : 'Slope < 10%'}
                </p>
                <p className="text-lg font-bold text-emerald-500">{topographicKPI.areaWithSlopeUnder10Percent}%</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/70'}`}>
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Pendiente > 15%' : 'Slope > 15%'}
                </p>
                <p className="text-lg font-bold text-rose-500">{topographicKPI.highRiskSlopeAreaPercent}%</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/70'}`}>
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Población < 2h EmONC' : 'Pop < 2h EmONC'}
                </p>
                <p className="text-lg font-bold text-sky-500">{topographicKPI.percentPopulationWithin2Hours}%</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/70'}`}>
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Fricción Terreno' : 'Terrain Friction'}
                </p>
                <p className="text-lg font-bold text-amber-500">{topographicKPI.terrainFrictionPenaltyFactor}x</p>
              </div>
            </div>

            {/* Correlation Box */}
            <div className={`mt-4 p-3 rounded-lg border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-sky-500" />
                <span className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Correlación Retraso Fase 2' : 'Phase 2 Delay Correlation'}
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                    {language === 'es' ? 'Tiempo SD:' : 'SD Time:'}
                  </span>
                  <span className={`font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {targetDistrict.avgTravelTimeHours} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                    {language === 'es' ? 'Tiempo 3D (Estándar):' : '3D Time (Standard):'}
                  </span>
                  <span className="font-semibold text-amber-500">
                    {(referralRoute.estimatedTravelTimeMinutesStandard / 60).toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                    {language === 'es' ? 'Tiempo 3D (Moto-Ambulancia):' : '3D Time (Moto-Ambulance):'}
                  </span>
                  <span className="font-semibold text-emerald-500">
                    {(referralRoute.estimatedTravelTimeMinutesMotoAmbulance / 60).toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {topographicKPI.sdTravelTimeDiscrepancyPercent > 20 && (
                <div className={`mt-3 p-2 rounded text-xs flex items-start gap-2 ${theme === 'light' ? 'bg-amber-50 text-amber-700' : 'bg-amber-950/30 text-amber-200/90'
                  }`}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'es' ? 'Aviso:' : 'Warning:'}</strong>
                    {' '}{topographicKPI.sdTravelTimeDiscrepancyPercent}% {language === 'es' ? 'discrepancia por relieve 3D' : 'discrepancy due to 3D terrain'}.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* EmONC Health Facilities List */}
          <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0c0e12] border-slate-800'} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {language === 'es' ? 'Centros EmONC' : 'EmONC Facilities'}
              </h3>
              <Badge variant="default" size="sm">{facilities.length}</Badge>
            </div>

            <div className="max-h-[280px] overflow-y-auto pr-1 divide-y divide-slate-800/70">
              {facilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                const isCEmONC = fac.facilityType === 'CEmONC_Hospital';

                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`px-2 py-3 transition-colors cursor-pointer ${isSelected
                      ? theme === 'light'
                        ? 'bg-sky-50'
                        : 'bg-sky-950/40'
                      : theme === 'light'
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-slate-900/70'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold truncate max-w-[70%] ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                        {fac.name}
                      </span>
                      <span className="text-xs font-medium text-amber-500">{fac.altitudeMeters}m</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={isCEmONC ? 'text-sky-500 font-semibold' : 'text-emerald-500'}>
                        {isCEmONC ? 'CEmONC' : 'BEmONC'}
                      </span>
                      <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                        {fac.beds} beds | {fac.cSectionCapable ? 'Cesárea ✓' : 'Sin Cirugía'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          {targetDistrict.id !== currentSelectedDistrict.id && (
            <button
              onClick={() => onSelectDistrict(targetDistrict)}
              className="w-full py-2.5 px-4 rounded-lg font-semibold bg-sky-500 hover:bg-sky-400 text-white text-sm transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {language === 'es' ? 'Cargar Distrito:' : 'Load District:'} {targetDistrict.name}
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
