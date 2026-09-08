import React, { useState } from 'react';
import { ObstetricReferralRoute, RouteWaypoint3D } from '../types';
import { Mountain, Clock, AlertTriangle, ArrowRight, Gauge, Activity } from 'lucide-react';

interface TerrainElevationProfileProps {
  route: ObstetricReferralRoute;
  activeScenarioId: string;
}

export const TerrainElevationProfile: React.FC<TerrainElevationProfileProps> = ({
  route,
  activeScenarioId,
}) => {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<RouteWaypoint3D | null>(null);

  if (!route || !route.waypoints || route.waypoints.length === 0) return null;

  const waypoints = route.waypoints;
  const totalDist = route.distance2dKm || 1;
  
  // Calculate min and max altitude for chart scaling
  const altitudes = waypoints.map((w) => w.altitudeMeters);
  const minAlt = Math.max(0, Math.min(...altitudes) - 100);
  const maxAlt = Math.max(...altitudes) + 100;
  const altSpan = Math.max(150, maxAlt - minAlt);

  // SVG dimensions
  const svgWidth = 650;
  const svgHeight = 160;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 30;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Convert waypoint to SVG points
  const points = waypoints.map((w) => {
    const x = paddingLeft + (w.distanceFromStartKm / totalDist) * plotWidth;
    const y = paddingTop + plotHeight - ((w.altitudeMeters - minAlt) / altSpan) * plotHeight;
    return { x, y, waypoint: w };
  });

  // Create SVG path string
  const pathD = points.reduce((acc, p, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  // Fill area under the profile path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;

  const isMotoScenario = activeScenarioId === 'scenario_a' || activeScenarioId === 'scenario_d';
  const travelMinutes = isMotoScenario
    ? route.estimatedTravelTimeMinutesMotoAmbulance
    : route.estimatedTravelTimeMinutesStandard;

  return (
    <div className="bg-[#0c0e12] border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3">
      {/* Header with 3D vs 2D Summary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Mountain className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Perfil de Elevación Longitudinal (Ruta de Referencia 3D)
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-slate-400">
            Dist. 2D Planar: <strong className="text-slate-200">{route.distance2dKm} km</strong>
          </span>
          <span className="text-slate-400">
            Dist. 3D Terreno: <strong className="text-sky-300">{route.distance3dKm} km</strong> (+{Math.round(((route.distance3dKm - route.distance2dKm) / route.distance2dKm) * 100)}%)
          </span>
          <span className="text-slate-400">
            Tiempo Estimado: <strong className={travelMinutes > 90 ? 'text-rose-400' : travelMinutes > 45 ? 'text-amber-300' : 'text-emerald-400'}>
              {Math.floor(travelMinutes / 60)}h {travelMinutes % 60}m
            </strong>
          </span>
        </div>
      </div>

      {/* SVG Elevation Cross-Section Chart */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36">
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0c0e12" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3">
            {[0, 0.25, 0.5, 0.75, 1.0].map((factor) => {
              const y = paddingTop + plotHeight * factor;
              const altVal = Math.round(maxAlt - factor * altSpan);
              return (
                <g key={`grid-y-${factor}`}>
                  <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} />
                  <text x={paddingLeft - 6} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">
                    {altVal}m
                  </text>
                </g>
              );
            })}
          </g>

          {/* Shaded Area under Curve */}
          <path d={areaD} fill="url(#elevationGradient)" />

          {/* Profile Elevation Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Waypoints & Bottlenecks */}
          {points.map((p, idx) => {
            const isOrigin = idx === 0;
            const isDest = idx === points.length - 1;
            const isBottleneck = p.waypoint.slopePercent > 15;

            return (
              <g
                key={`wp-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredWaypoint(p.waypoint)}
                onMouseLeave={() => setHoveredWaypoint(null)}
              >
                {/* Node Circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isOrigin || isDest ? 5 : isBottleneck ? 4 : 2.5}
                  fill={isOrigin ? '#38bdf8' : isDest ? '#10b981' : isBottleneck ? '#ef4444' : '#ffffff'}
                  stroke="#0c0e12"
                  strokeWidth="1.5"
                />

                {/* Critical Bottleneck Alert Badge */}
                {isBottleneck && (
                  <g>
                    <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 14} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx={p.x} cy={p.y - 16} r="4" fill="#ef4444" />
                    <text x={p.x} y={p.y - 14} fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">!</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* X Axis Distance Labels */}
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={svgWidth - paddingRight} y2={paddingTop + plotHeight} stroke="#334155" strokeWidth="1" />
          {[0, 0.25, 0.5, 0.75, 1.0].map((f) => {
            const x = paddingLeft + f * plotWidth;
            const km = Math.round(f * totalDist * 10) / 10;
            return (
              <text key={`dist-${f}`} x={x} y={svgHeight - 10} fill="#64748b" fontSize="8" textAnchor="middle">
                {km} km
              </text>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Waypoint Hover */}
        {hoveredWaypoint && (
          <div className="absolute top-2 right-2 bg-slate-900/95 border border-sky-500/50 rounded p-2 text-[10px] space-y-0.5 shadow-lg max-w-[200px]">
            <div className="text-white font-bold">{hoveredWaypoint.terrainType}</div>
            <div className="text-slate-300">Distancia: <strong className="text-sky-400">{hoveredWaypoint.distanceFromStartKm} km</strong></div>
            <div className="text-slate-300">Altitud: <strong className="text-amber-300">{hoveredWaypoint.altitudeMeters} m.s.n.m.</strong></div>
            <div className="text-slate-300">Pendiente: <strong className={hoveredWaypoint.slopePercent > 15 ? 'text-rose-400' : 'text-emerald-400'}>{hoveredWaypoint.slopePercent}%</strong></div>
          </div>
        )}
      </div>

      {/* Cross-Section Legend & Bottleneck Warnings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Origen Comunitario: Manyatta ({waypoints[0]?.altitudeMeters}m)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Destino CEmONC: Hospital ({route.destinationFacility.altitudeMeters}m)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Cuellos de Botella (Pendiente &gt;15%): {route.bottlenecks.length} detectados</span>
        </div>
      </div>
    </div>
  );
};
