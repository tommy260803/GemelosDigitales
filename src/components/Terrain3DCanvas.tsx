import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { DistrictData, DEMTerrainGrid, HealthFacilityPoint, ObstetricReferralRoute } from '../types';
import { TerrainService } from '../services/terrainService';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Layers, 
  Compass, 
  AlertTriangle, 
  Activity, 
  Maximize2, 
  Minimize2,
  Navigation,
  Info
} from 'lucide-react';

interface Terrain3DCanvasProps {
  district: DistrictData;
  demGrid: DEMTerrainGrid;
  facilities: HealthFacilityPoint[];
  referralRoute: ObstetricReferralRoute;
  selectedFacility: HealthFacilityPoint | null;
  onSelectFacility: (facility: HealthFacilityPoint) => void;
  verticalExaggeration: number;
  showBarriers: boolean;
  showContourLines: boolean;
  activeScenarioId: 'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d';
}

export const Terrain3DCanvas: React.FC<Terrain3DCanvasProps> = ({
  district,
  demGrid,
  facilities,
  referralRoute,
  selectedFacility,
  onSelectFacility,
  verticalExaggeration = 1.8,
  showBarriers = true,
  showContourLines = true,
  activeScenarioId = 'baseline',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera Orbit State
  const [pitch, setPitch] = useState<number>(42); // 15 to 80 degrees
  const [yaw, setYaw] = useState<number>(35); // 0 to 360 degrees
  const [zoom, setZoom] = useState<number>(1.15); // 0.6 to 2.5
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  
  // Hover & Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    altitude: number;
    slope: number;
    lat: number;
    lng: number;
    isBarrier: boolean;
    facility?: HealthFacilityPoint;
  } | null>(null);

  // Handle Mouse Drag for Orbit Controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (e.shiftKey || e.buttons === 2) {
        // Pan
        setPanOffset((prev) => ({ x: prev.x + dx * 0.8, y: prev.y + dy * 0.8 }));
      } else {
        // Orbit
        setYaw((prev) => (prev + dx * 0.45) % 360);
        setPitch((prev) => Math.max(15, Math.min(80, prev + dy * 0.35)));
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Hover detection on facilities
      const hitFacility = facilities.find((fac) => {
        const p = project3D(fac.lat, fac.lng, fac.altitudeMeters, rect.width, rect.height);
        const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
        return dist < 18;
      });

      if (hitFacility) {
        setHoveredPoint({
          x: mouseX,
          y: mouseY,
          altitude: hitFacility.altitudeMeters,
          slope: 4.2,
          lat: hitFacility.lat,
          lng: hitFacility.lng,
          isBarrier: false,
          facility: hitFacility,
        });
      } else {
        // Approximate terrain hover
        setHoveredPoint(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.max(0.6, Math.min(2.6, prev + delta)));
  };

  // 3D Isometric / Perspective Transformation Function
  const project3D = useCallback((
    lat: number,
    lng: number,
    altitudeMeters: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const { minLat, maxLat, minLng, maxLng } = demGrid.bounds;
    
    // Normalize coordinates in -1 to 1 local space
    const u = ((lng - minLng) / (maxLng - minLng) - 0.5) * 2; // -1 (West) to 1 (East)
    const v = ((lat - minLat) / (maxLat - minLat) - 0.5) * 2; // -1 (South) to 1 (North)

    // Normalize altitude relative to district relief span
    const elevSpan = Math.max(200, demGrid.maxAltitude - demGrid.minAltitude);
    const zNorm = ((altitudeMeters - demGrid.minAltitude) / elevSpan) * 1.8 * verticalExaggeration;

    // Convert Euler angles (Pitch & Yaw) to Radians
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    // Rotate around Z axis (Yaw)
    const rotX = u * Math.cos(radYaw) - v * Math.sin(radYaw);
    const rotY = u * Math.sin(radYaw) + v * Math.cos(radYaw);

    // Project with Pitch & Perspective
    const scaleFactor = Math.min(canvasWidth, canvasHeight) * 0.38 * zoom;
    
    const projX = canvasWidth / 2 + panOffset.x + rotX * scaleFactor;
    const projY = canvasHeight / 2 + panOffset.y + (rotY * Math.sin(radPitch) - zNorm * Math.cos(radPitch) * 0.65) * scaleFactor;

    return { x: projX, y: projY, depth: rotY * Math.cos(radPitch) + zNorm * Math.sin(radPitch) };
  }, [demGrid, yaw, pitch, zoom, panOffset, verticalExaggeration]);

  // Auto-rotation animation loop
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 0.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas with sleek high-contrast dark GIS background
    ctx.fillStyle = '#06080d';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw subtle background coordinate grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const { gridSize, elevations, slopes, isBarrier, bounds } = demGrid;
    const { minLat, maxLat, minLng, maxLng } = bounds;

    // Light source vector for realistic shaded relief / hillshading
    const lightDir = { x: -0.6, y: -0.6, z: 0.8 };
    const lightLen = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= lightLen;
    lightDir.y /= lightLen;
    lightDir.z /= lightLen;

    // 2. Render 3D Topographic Terrain Mesh Polygons (Back-to-Front Painter's Algorithm)
    // Pre-project all grid vertices
    const projectedGrid: { x: number; y: number; depth: number }[][] = [];
    for (let r = 0; r < gridSize; r++) {
      const rowProj: { x: number; y: number; depth: number }[] = [];
      const lat = maxLat - (r / (gridSize - 1)) * (maxLat - minLat);
      for (let c = 0; c < gridSize; c++) {
        const lng = minLng + (c / (gridSize - 1)) * (maxLng - minLng);
        const alt = elevations[r][c];
        rowProj.push(project3D(lat, lng, alt, width, height));
      }
      projectedGrid.push(rowProj);
    }

    // Collect all grid quads and sort by camera depth
    interface QuadFace {
      r: number;
      c: number;
      avgDepth: number;
      p0: { x: number; y: number };
      p1: { x: number; y: number };
      p2: { x: number; y: number };
      p3: { x: number; y: number };
      alt: number;
      slope: number;
      barrier: boolean;
    }

    const quads: QuadFace[] = [];
    for (let r = 0; r < gridSize - 1; r++) {
      for (let c = 0; c < gridSize - 1; c++) {
        const p0 = projectedGrid[r][c];
        const p1 = projectedGrid[r][c + 1];
        const p2 = projectedGrid[r + 1][c + 1];
        const p3 = projectedGrid[r + 1][c];
        const avgDepth = (p0.depth + p1.depth + p2.depth + p3.depth) / 4;
        const avgAlt = (elevations[r][c] + elevations[r][c + 1] + elevations[r + 1][c + 1] + elevations[r + 1][c]) / 4;
        const avgSlope = (slopes[r][c] + slopes[r][c + 1] + slopes[r + 1][c + 1] + slopes[r + 1][c]) / 4;
        const barrier = isBarrier[r][c] || isBarrier[r + 1][c] || isBarrier[r][c + 1];

        quads.push({ r, c, avgDepth, p0, p1, p2, p3, alt: avgAlt, slope: avgSlope, barrier });
      }
    }

    // Sort by depth so furthest polygons are drawn first
    quads.sort((a, b) => a.avgDepth - b.avgDepth);

    // Draw Terrain Quads with Hypsometric Tinting & Hillshading
    quads.forEach((q) => {
      const baseColor = TerrainService.getHypsometricColor(q.alt);
      
      // Calculate normal vector & hillshade intensity
      const slopeFactor = Math.min(1.0, q.slope / 30.0);
      const shade = 0.8 + (1.0 - slopeFactor) * 0.25;

      let rCol = Math.round(baseColor.r * shade);
      let gCol = Math.round(baseColor.g * shade);
      let bCol = Math.round(baseColor.b * shade);

      // Highlight barrier zones (slope > 15%) in distinct warning amber/red hazard tint
      if (showBarriers && q.barrier) {
        rCol = Math.min(255, Math.round(rCol * 1.4 + 90));
        gCol = Math.round(gCol * 0.45);
        bCol = Math.round(bCol * 0.35);
      }

      ctx.beginPath();
      ctx.moveTo(q.p0.x, q.p0.y);
      ctx.lineTo(q.p1.x, q.p1.y);
      ctx.lineTo(q.p2.x, q.p2.y);
      ctx.lineTo(q.p3.x, q.p3.y);
      ctx.closePath();

      ctx.fillStyle = `rgb(${rCol},${gCol},${bCol})`;
      ctx.fill();

      // Contour / Wireframe mesh line
      if (showContourLines) {
        ctx.strokeStyle = q.barrier && showBarriers ? 'rgba(239, 68, 68, 0.4)' : 'rgba(15, 23, 42, 0.35)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });

    // 3. Draw 3D Obstetric Referral Route clamped to the terrain surface
    if (referralRoute && referralRoute.waypoints.length > 1) {
      const routePoints = referralRoute.waypoints.map((wp) =>
        project3D(wp.lat, wp.lng, wp.altitudeMeters, width, height)
      );

      // Route color based on scenario and transit time
      let routeColor = '#10b981'; // Green <30 min
      if (activeScenarioId === 'baseline') {
        if (referralRoute.estimatedTravelTimeMinutesStandard > 90) routeColor = '#ef4444'; // Red >90m
        else if (referralRoute.estimatedTravelTimeMinutesStandard > 30) routeColor = '#f59e0b'; // Yellow 30-90m
      } else if (activeScenarioId === 'scenario_a' || activeScenarioId === 'scenario_d') {
        // Moto-ambulance all-terrain agile path
        routeColor = referralRoute.estimatedTravelTimeMinutesMotoAmbulance > 45 ? '#38bdf8' : '#10b981';
      }

      // Outer glow line
      ctx.beginPath();
      ctx.moveTo(routePoints[0].x, routePoints[0].y);
      for (let i = 1; i < routePoints.length; i++) {
        ctx.lineTo(routePoints[i].x, routePoints[i].y);
      }
      ctx.strokeStyle = routeColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = routeColor;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Core crisp line
      ctx.beginPath();
      ctx.moveTo(routePoints[0].x, routePoints[0].y);
      for (let i = 1; i < routePoints.length; i++) {
        ctx.lineTo(routePoints[i].x, routePoints[i].y);
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw waypoints nodes
      routePoints.forEach((pt, idx) => {
        if (idx === 0 || idx === routePoints.length - 1 || idx % 4 === 0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, idx === 0 || idx === routePoints.length - 1 ? 5 : 3, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? '#38bdf8' : routeColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Origin Community Marker Tag
      const originPt = routePoints[0];
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(originPt.x - 60, originPt.y - 30, 120, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('📍 Origen Rural (Manyatta)', originPt.x, originPt.y - 17);

      // Draw Bottleneck Hazard Flags
      referralRoute.bottlenecks.forEach((bn) => {
        const bnPt = project3D(bn.lat, bn.lng, bn.altitudeMeters, width, height);
        
        // Hazard Beacon
        ctx.beginPath();
        ctx.arc(bnPt.x, bnPt.y - 14, 8, 0, Math.PI * 2);
        ctx.fillStyle = bn.hazardLevel === 'CRITICAL_BLOCK' ? '#ef4444' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', bnPt.x, bnPt.y - 10);

        // Warning Label
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.beginPath();
        ctx.roundRect(bnPt.x - 55, bnPt.y - 48, 110, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`Pendiente: ${bn.slopePercent}%`, bnPt.x, bnPt.y - 36);
      });
    }

    // 4. Render 3D EmONC Health Facilities Pins & Billboard Badges
    facilities.forEach((fac) => {
      const pt = project3D(fac.lat, fac.lng, fac.altitudeMeters, width, height);
      const isSelected = selectedFacility?.id === fac.id;
      const isCEmONC = fac.facilityType === 'CEmONC_Hospital';

      // Vertical Altitude Stem Line anchoring pin to terrain
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x, pt.y - 24);
      ctx.strokeStyle = isCEmONC ? '#38bdf8' : '#10b981';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Pin Head
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 26, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isCEmONC ? '#0284c7' : '#059669';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : '#e2e8f0';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Hospital Cross / Icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isCEmONC ? 'H' : '+', pt.x, pt.y - 23);

      // Facility Billboard Label (showing Altitude in meters a.s.l.)
      const labelText = `${fac.name.split(' ')[0]} (${fac.altitudeMeters}m)`;
      const labelWidth = labelText.length * 6 + 16;

      ctx.fillStyle = isSelected ? 'rgba(2, 132, 199, 0.95)' : 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pt.x - labelWidth / 2, pt.y - 50, labelWidth, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, pt.x, pt.y - 38);
    });

    // 5. Compass Rose & Scale Bar in Bottom Right
    const compassX = width - 45;
    const compassY = height - 45;
    const radYaw = (yaw * Math.PI) / 180;
    const northX = compassX + Math.sin(radYaw) * 20;
    const northY = compassY - Math.cos(radYaw) * 20;

    ctx.beginPath();
    ctx.arc(compassX, compassY, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // North Pointer Arrow
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(northX, northY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', northX, northY - 4);

  }, [
    demGrid,
    facilities,
    referralRoute,
    selectedFacility,
    project3D,
    yaw,
    pitch,
    zoom,
    panOffset,
    showBarriers,
    showContourLines,
    activeScenarioId,
  ]);

  // Resize canvas to match container dimensions
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width || 700;
      canvasRef.current.height = 460;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[480px] bg-[#06080d] rounded-lg overflow-hidden select-none border border-slate-800">
      
      {/* 3D WebGL / Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={720}
        height={460}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating 3D Control Bar (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-1.5 shadow-xl text-xs font-mono">
        <button
          onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.2))}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.2))}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Detener Rotación Automática' : 'Iniciar Rotación Automática'}
          className={`p-1.5 rounded transition ${autoRotate ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => {
            setPitch(42);
            setYaw(35);
            setZoom(1.15);
            setPanOffset({ x: 0, y: 10 });
          }}
          title="Restablecer Cámara 3D"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Top Left DEM Information Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1.5 shadow-xl max-w-[280px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">SRTM 3D DIGITAL ELEVATION</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
            {verticalExaggeration}x RELIEVE
          </span>
        </div>
        <div className="text-white font-bold text-xs truncate">{district.name} ({district.country})</div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
          <div>Altitud Mín: <strong className="text-slate-200">{demGrid.minAltitude}m</strong></div>
          <div>Altitud Máx: <strong className="text-slate-200">{demGrid.maxAltitude}m</strong></div>
          <div>Desnivel: <strong className="text-amber-300">{demGrid.maxAltitude - demGrid.minAltitude}m</strong></div>
          <div>Pendiente Máx: <strong className="text-rose-400">{referralRoute.maxSlopePercent}%</strong></div>
        </div>
      </div>

      {/* Hypsometric Elevation Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono space-y-1 shadow-xl">
        <div className="text-slate-400 font-bold flex items-center justify-between">
          <span>Gradiente Hipsométrico</span>
          <span className="text-slate-500">m.s.n.m.</span>
        </div>
        <div className="flex items-center space-x-1 pt-0.5">
          <span className="w-3.5 h-2.5 rounded-sm bg-[#148c28]" title="0 - 500m (Llanuras / Costas)" />
          <span className="text-slate-300 text-[9px]">0-500m</span>
          <span className="w-3.5 h-2.5 rounded-sm bg-[#eab308]" title="500 - 1500m (Mesetas / Valles)" />
          <span className="text-slate-300 text-[9px]">1.5k</span>
          <span className="w-3.5 h-2.5 rounded-sm bg-[#a55f32]" title="1500 - 2500m (Tierras Altas)" />
          <span className="text-slate-300 text-[9px]">2.5k</span>
          <span className="w-3.5 h-2.5 rounded-sm bg-[#f1f5f9]" title="> 2500m (Cumbres Alpinas)" />
          <span className="text-slate-300 text-[9px]">&gt;2.5k</span>
        </div>
        {showBarriers && (
          <div className="flex items-center space-x-1.5 pt-1 text-rose-400 text-[9px]">
            <span className="w-3 h-2 rounded-sm bg-rose-500/80" />
            <span>Barrera Topográfica (&gt;15% pendiente)</span>
          </div>
        )}
      </div>

      {/* Interactive Tooltip on Facility Hover */}
      {hoveredPoint?.facility && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(containerRef.current?.clientWidth ? containerRef.current.clientWidth - 240 : 400, hoveredPoint.x + 12),
            top: Math.max(10, hoveredPoint.y - 110),
            pointerEvents: 'none',
          }}
          className="z-30 bg-slate-950/95 backdrop-blur border border-sky-500/50 rounded-lg p-2.5 font-mono text-[10px] space-y-1 shadow-2xl w-[220px]"
        >
          <div className="font-bold text-white text-xs flex items-center justify-between">
            <span className="truncate">{hoveredPoint.facility.name}</span>
            <span className="text-sky-400 text-[9px] uppercase">
              {hoveredPoint.facility.facilityType.replace('_', ' ')}
            </span>
          </div>
          <div className="text-slate-300">
            Altitud Terreno: <strong className="text-amber-300">{hoveredPoint.facility.altitudeMeters} m.s.n.m.</strong>
          </div>
          <div className="text-slate-300">
            Capacidad Quirúrgica: <strong className={hoveredPoint.facility.cSectionCapable ? 'text-emerald-400' : 'text-rose-400'}>
              {hoveredPoint.facility.cSectionCapable ? 'Cesárea 24/7' : 'Básica'}
            </strong>
          </div>
          <div className="text-slate-300">
            Banco de Sangre: <strong className={hoveredPoint.facility.bloodBankReady ? 'text-emerald-400' : 'text-amber-400'}>
              {hoveredPoint.facility.bloodBankReady ? 'Disponible' : 'Cadena Fría Débil'}
            </strong>
          </div>
        </div>
      )}

      {/* Navigation Helper Footer */}
      <div className="absolute bottom-2 right-16 z-10 text-[9px] font-mono text-slate-500 hidden sm:block">
        Arrastra para orbitar 3D | Shift+Arrastra para desplazar | Rueda para zoom
      </div>

    </div>
  );
};
