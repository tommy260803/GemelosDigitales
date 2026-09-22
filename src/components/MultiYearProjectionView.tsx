import React, { useState, useMemo } from 'react';
import { DistrictData, MultiYearProjectionResult, MultiYearYearBreakdown } from '../types';
import { SystemDynamicsEngine } from '../services/systemDynamics';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  Heart,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { Badge } from './ui/Badge';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';
import { DataTable } from './ui/DataTable';

interface MultiYearProjectionViewProps {
  district: DistrictData;
}

export const MultiYearProjectionView: React.FC<MultiYearProjectionViewProps> = ({ district }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [selectedHorizonYears, setSelectedHorizonYears] = useState<number>(10);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Compute 120-month (10-year) continuous ODE trajectories
  const projectionData: MultiYearProjectionResult = useMemo(() => {
    const totalMonths = selectedHorizonYears * 12;

    // Simulate all scenarios for full multi-year duration
    const simBaseline = SystemDynamicsEngine.simulate(district, 'baseline', {}, totalMonths);
    const simA = SystemDynamicsEngine.simulate(district, 'scenario_a', {}, totalMonths);
    const simB = SystemDynamicsEngine.simulate(district, 'scenario_b', {}, totalMonths);
    const simC = SystemDynamicsEngine.simulate(district, 'scenario_c', {}, totalMonths);
    const simD = SystemDynamicsEngine.simulate(district, 'scenario_d', {}, totalMonths);

    const yearByYear: MultiYearYearBreakdown[] = [];
    let cumLivesSavedD = 0;
    let cumCostD = 0;

    const baseCostPerYear = Math.round(simD.summary.totalCostUSD / selectedHorizonYears);

    for (let yr = 1; yr <= selectedHorizonYears; yr++) {
      const monthEnd = yr * 12 - 1;
      const snapBase = simBaseline.trajectories[monthEnd] || simBaseline.trajectories[simBaseline.trajectories.length - 1];
      const snapA = simA.trajectories[monthEnd] || simA.trajectories[simA.trajectories.length - 1];
      const snapB = simB.trajectories[monthEnd] || simB.trajectories[simB.trajectories.length - 1];
      const snapC = simC.trajectories[monthEnd] || simC.trajectories[simC.trajectories.length - 1];
      const snapD = simD.trajectories[monthEnd] || simD.trajectories[simD.trajectories.length - 1];

      // Sum lives saved in this 12-month window
      let annualLivesD = 0;
      for (let m = (yr - 1) * 12; m <= monthEnd && m < simD.trajectories.length; m++) {
        annualLivesD += simD.trajectories[m].monthlyLivesSaved;
      }
      cumLivesSavedD += Math.round(annualLivesD);
      cumCostD += baseCostPerYear;

      const currentMMRD = snapD.calculatedMMR;
      const sdgGap = Math.max(0, currentMMRD - 70);

      yearByYear.push({
        year: 2026 + yr - 1,
        yearIndex: yr,
        baselineMMR: snapBase.calculatedMMR,
        scenarioAMMR: snapA.calculatedMMR,
        scenarioBMMR: snapB.calculatedMMR,
        scenarioCMMR: snapC.calculatedMMR,
        scenarioDMMR: currentMMRD,
        sdgTargetMMR: 70,
        sdgGap,
        cumulativeLivesSavedScenarioD: cumLivesSavedD,
        annualFiscalInvestmentUSD: baseCostPerYear,
        cumulativeFiscalInvestmentUSD: cumCostD,
        costEffectivenessPerLifeSavedUSD: cumLivesSavedD > 0 ? Math.round(cumCostD / cumLivesSavedD) : 0,
      });
    }

    const tenYearLivesSavedTotal = cumLivesSavedD;
    const tenYearTotalInvestmentUSD = cumCostD;

    return {
      district,
      startYear: 2026,
      endYear: 2026 + selectedHorizonYears - 1,
      totalMonths,
      tenYearLivesSavedTotal,
      tenYearTotalInvestmentUSD,
      overallROIBenefitCostRatio: Math.round((tenYearLivesSavedTotal / (tenYearTotalInvestmentUSD / 100000)) * 10) / 10,
      yearByYear,
    };
  }, [district, selectedHorizonYears]);

  // Find when SDG Target 3.1 (< 70) is reached
  const sdgTargetReachedYear = projectionData.yearByYear.find((y) => y.scenarioDMMR <= 70)?.year || null;

  const tableColumns = [
    {
      key: 'year',
      header: 'Año',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-500" />
          <span className="font-semibold">{row.year} (A{row.yearIndex})</span>
        </div>
      ),
    },
    {
      key: 'baselineMMR',
      header: 'Base',
      render: (row: any) => (
        <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>{row.baselineMMR}</span>
      ),
    },
    {
      key: 'scenarioAMMR',
      header: 'A',
      render: (row: any) => (
        <span className="text-blue-500">{row.scenarioAMMR}</span>
      ),
    },
    {
      key: 'scenarioBMMR',
      header: 'B',
      render: (row: any) => (
        <span className="text-amber-500">{row.scenarioBMMR}</span>
      ),
    },
    {
      key: 'scenarioCMMR',
      header: 'C',
      render: (row: any) => (
        <span className="text-teal-500">{row.scenarioCMMR}</span>
      ),
    },
    {
      key: 'scenarioDMMR',
      header: 'D',
      render: (row: any) => (
        <span className="font-semibold text-emerald-500">{row.scenarioDMMR}</span>
      ),
    },
    {
      key: 'sdgGap',
      header: 'Brecha ODS',
      render: (row: any) => (
        row.sdgGap <= 0 ? (
          <Badge variant="success" size="sm">✓ ALCANZADA</Badge>
        ) : (
          <span className="text-rose-500 font-semibold">+{row.sdgGap} pts</span>
        )
      ),
    },
    {
      key: 'cumulativeLivesSavedScenarioD',
      header: 'Vidas Acum.',
      render: (row: any) => (
        <span className="font-semibold text-sky-500">+{row.cumulativeLivesSavedScenarioD}</span>
      ),
    },
    {
      key: 'cumulativeFiscalInvestmentUSD',
      header: 'Inversión',
      render: (row: any) => (
        <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>
          ${(row.cumulativeFiscalInvestmentUSD / 1000).toLocaleString()}k
        </span>
      ),
    },
    {
      key: 'costEffectivenessPerLifeSavedUSD',
      header: 'Costo/Vida',
      render: (row: any) => (
        <span className="font-semibold text-cyan-500">
          ${row.costEffectivenessPerLifeSavedUSD.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <SectionHeader
        title={language === 'es' ? 'Proyección Multianual a Largo Plazo' : 'Multi-Year Long-Term Projection'}
        subtitle={`${language === 'es' ? 'Trayectoria decenal continua hacia la Meta ODS 3.1 (<70/100k)' : 'Decadal continuous ODE trajectory benchmarking against SDG Target 3.1'}`}
        icon={<TrendingUp className="w-5 h-5" />}
        badge={
          <Badge variant="warning" size="sm">
            {selectedHorizonYears}-YEAR HORIZON ({projectionData.startYear}-{projectionData.endYear})
          </Badge>
        }
        actions={
          <select
            value={selectedHorizonYears}
            onChange={(e) => setSelectedHorizonYears(Number(e.target.value))}
            className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none ${
              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value={5}>5 Años (2026 - 2030)</option>
            <option value={8}>8 Años (2026 - 2033)</option>
            <option value={10}>10 Años (2026 - 2036)</option>
          </select>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={language === 'es' ? 'Vidas Salvadas Decenales' : '10-Year Lives Saved'}
          value={`+${projectionData.tenYearLivesSavedTotal.toLocaleString()}`}
          subtitle={language === 'es' ? 'Madres acumuladas (Paquete D)' : 'Cumulative mothers saved (Pkg D)'}
          icon={<Heart className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          label={language === 'es' ? 'Cumplimiento Meta ODS 3.1' : 'SDG Target 3.1 Milestone'}
          value={sdgTargetReachedYear ? `Año ${sdgTargetReachedYear}` : 'En Proceso'}
          subtitle={sdgTargetReachedYear
            ? (language === 'es' ? 'RMM alcanza < 70/100k' : 'MMR reaches < 70/100k')
            : `Brecha remanente: ${projectionData.yearByYear[projectionData.yearByYear.length - 1].sdgGap} pts`}
          icon={<Target className="w-5 h-5" />}
          variant="highlight"
        />
        <StatCard
          label={language === 'es' ? 'Inversión Fiscal Acumulada' : 'Cumulative Fiscal Investment'}
          value={`$${(projectionData.tenYearTotalInvestmentUSD / 1000000).toFixed(2)}M`}
          subtitle={`$${Math.round(projectionData.tenYearTotalInvestmentUSD / selectedHorizonYears).toLocaleString()} / año promedio`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          label={language === 'es' ? 'Costo Decenal por Vida' : '10-Yr Cost / Life Saved'}
          value={projectionData.tenYearLivesSavedTotal > 0 
            ? `$${Math.round(projectionData.tenYearTotalInvestmentUSD / projectionData.tenYearLivesSavedTotal).toLocaleString()}`
            : '—'}
          subtitle="Altamente Costo-Efectivo (OMS)"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="info"
        />
      </div>

      {/* Multi-Year Trajectory Chart */}
      <ChartCard
        title={language === 'es' ? 'Trayectorias Multianuales de RMM' : 'Multi-Year MMR Trajectories'}
        subtitle={`${projectionData.startYear} - ${projectionData.endYear}`}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-slate-400 rounded" />
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Línea Base</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-400 rounded" />
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Esc. A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-400 rounded" />
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Esc. B</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-teal-400 rounded" />
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Esc. C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1.5 bg-emerald-400 rounded" />
              <span className="text-emerald-500 font-semibold">Esc. D</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-rose-500 border-b border-dashed border-rose-500" />
              <span className="text-rose-500 font-semibold">Meta ODS 3.1</span>
            </div>
          </div>
        }
      >
        <div className={`w-full h-72 rounded-lg p-3 border ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#080a0f] border-slate-800'
        }`}>
          <svg viewBox="0 0 700 240" className="w-full h-full">
            {/* Grid lines */}
            {[40, 80, 120, 160, 200].map((y) => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} strokeDasharray="3 3" strokeWidth="0.8" />
            ))}

            {/* ODS 3.1 Target Line */}
            {(() => {
              const maxMMR = district.baselineMMR * 1.05;
              const y70 = 230 - (70 / maxMMR) * 210;
              return (
                <g>
                  <line x1="0" y1={y70} x2="700" y2={y70} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                  <text x="610" y={y70 - 4} fill="#f87171" fontSize="9" fontWeight="bold">Meta ODS 3.1 (70)</text>
                </g>
              );
            })()}

            {/* Scenario Lines */}
            {[
              { key: 'baselineMMR', color: '#64748b', dasharray: '4 2', width: 2 },
              { key: 'scenarioAMMR', color: '#60a5fa', dasharray: undefined, width: 2 },
              { key: 'scenarioBMMR', color: '#fbbf24', dasharray: undefined, width: 2 },
              { key: 'scenarioCMMR', color: '#2dd4bf', dasharray: undefined, width: 2 },
              { key: 'scenarioDMMR', color: '#10b981', dasharray: undefined, width: 3.5 },
            ].map(({ key, color, dasharray, width }) => {
              const maxMMR = district.baselineMMR * 1.05;
              const points = projectionData.yearByYear.map((y, idx) => {
                const x = (idx / (projectionData.yearByYear.length - 1)) * 700;
                const cy = 230 - ((y as any)[key] / maxMMR) * 210;
                return `${x},${cy}`;
              }).join(' ');
              return (
                <polyline key={key} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dasharray} points={points} />
              );
            })}

            {/* Year Dots for Scenario D */}
            {projectionData.yearByYear.map((y, idx) => {
              const maxMMR = district.baselineMMR * 1.05;
              const cx = (idx / (projectionData.yearByYear.length - 1)) * 700;
              const cy = 230 - (y.scenarioDMMR / maxMMR) * 210;
              return (
                <circle
                  key={y.year}
                  cx={cx} cy={cy} r="4.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:r-6"
                  onMouseEnter={() => setHoveredYear(y.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
              );
            })}
          </svg>
        </div>

        {/* Bottom X-Axis Years */}
        <div className={`flex justify-between text-xs pt-2 px-1 font-mono ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {projectionData.yearByYear.map((y) => (
            <span key={y.year} className={`cursor-pointer ${hoveredYear === y.year ? 'text-sky-500 font-bold' : ''}`}>
              {y.year}
            </span>
          ))}
        </div>
      </ChartCard>

      {/* Year-by-Year Milestone Table */}
      <ChartCard
        title={language === 'es' ? 'Matriz Decenal de Hitos y Costo-Efectividad' : 'Decadal Milestone & Cost-Effectiveness Matrix'}
      >
        <DataTable
          columns={tableColumns}
          data={projectionData.yearByYear.map((row) => ({ ...row, id: row.year }))}
          rowKey={(row) => row.year.toString()}
        />
      </ChartCard>

    </div>
  );
};
