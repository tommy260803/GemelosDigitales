import React from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  TrendingDown,
  Heart,
  Activity,
  Shield,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { DistrictData, SimulationResult } from '../types';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { ReportGenerationService } from '../services/reporting';
import { SectionHeader } from './ui/SectionHeader';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';
import { Badge } from './ui/Badge';
import { useToast } from './ui/Toast';

interface Props {
  district: DistrictData;
  allResults: Record<string, SimulationResult>;
}

const SCENARIO_LABELS: Record<string, string> = {
  baseline: 'Línea Base (Status Quo)',
  scenario_a: 'A: Acceso y Transporte',
  scenario_b: 'B: Eliminación de Tarifas',
  scenario_c: 'C: Red Comunitaria TBA',
  scenario_d: 'D: Paquete Integral (A+B+C)',
};

export const ReportsView: React.FC<Props> = ({ district, allResults }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();

  const scenarioIds = ['baseline', 'scenario_a', 'scenario_b', 'scenario_c', 'scenario_d'] as const;
  const baseline = allResults['baseline'];
  const hasData = Object.keys(allResults).length > 0;

  // Compute aggregate metrics
  const bestScenario = Object.values(allResults).reduce((best, r) => {
    if (r.scenarioId === 'baseline') return best;
    if (!best || r.summary.livesSaved > best.summary.livesSaved) return r;
    return best;
  }, null as SimulationResult | null);

  // Methodological note: scenarios A, B, C, D are mutually exclusive policy alternatives.
  // Scenario D (Combined Package) already encompasses A+B+C+clinical capacity.
  // We report the maximum-impact scenario rather than summing over mutually exclusive options.
  const integratedLivesSaved = allResults['scenario_d']?.summary.livesSaved ?? bestScenario?.summary.livesSaved ?? 0;

  const avgCostPerLife = Object.values(allResults)
    .filter((r) => r.scenarioId !== 'baseline' && r.summary.costPerLifeSavedUSD > 0)
    .reduce((sum, r) => sum + r.summary.costPerLifeSavedUSD, 0) /
    Math.max(1, Object.values(allResults).filter((r) => r.scenarioId !== 'baseline').length);

  const handleExportPDF = () => {
    try {
      ReportGenerationService.generateExecutivePDF(district, allResults, {} as any);
      toast({ message: 'Informe PDF descargado', description: `Reporte ejecutivo de ${district.name}`, variant: 'success' });
    } catch {
      toast({ message: 'Error al exportar PDF', variant: 'error' });
    }
  };

  const handleExportWord = () => {
    try {
      ReportGenerationService.generateWordReport(district, allResults, {} as any);
      toast({ message: 'Documento Word descargado', description: `Reporte editable de ${district.name}`, variant: 'success' });
    } catch {
      toast({ message: 'Error al exportar Word', variant: 'error' });
    }
  };

  const handleExportExcel = () => {
    try {
      ReportGenerationService.generateExcelReport(district, allResults, {} as any);
      toast({ message: 'Libro Excel descargado', description: `Datos tabulados de ${district.name}`, variant: 'success' });
    } catch {
      toast({ message: 'Error al exportar Excel', variant: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <SectionHeader
        title="Informe de Simulación"
        subtitle={`Resumen ejecutivo para ${district.name}`}
        icon={<FileText className="w-5 h-5" />}
        badge={
          hasData
            ? <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> {Object.keys(allResults).length} escenarios</Badge>
            : <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3" /> Sin datos</Badge>
        }
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportWord}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <File className="w-3.5 h-3.5" />
              DOCX
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!hasData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              XLSX
            </button>
          </div>
        }
      />

      {!hasData ? (
        <div className="p-5 bg-amber-950/30 border border-amber-500/40 rounded-lg">
          <p className="text-sm text-slate-300">No hay datos de simulación disponibles. Ejecute simulaciones desde el Panel de Control primero.</p>
        </div>
      ) : (
        <>
          {/* Executive Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Escenarios Analizados"
              value={Object.keys(allResults).length}
              subtitle="Comparación 5 escenarios"
              icon={<BarChart3 className="w-5 h-5" />}
              variant="info"
            />
            {bestScenario && (
              <StatCard
                label="Mejor Escenario"
                value={`${bestScenario.summary.livesSaved.toFixed(0)} vidas`}
                subtitle={SCENARIO_LABELS[bestScenario.scenarioId] || bestScenario.scenarioName}
                icon={<Heart className="w-5 h-5" />}
                variant="success"
              />
            )}
            {baseline && (
              <StatCard
                label="MMR Basal"
                value={baseline.summary.mmrFinal.toFixed(0)}
                subtitle={`de ${baseline.summary.baselineDeaths.toFixed(0)} muertes base`}
                icon={<Activity className="w-5 h-5" />}
                variant="warning"
              />
            )}
            <StatCard
              label="Paquete Integral (D)"
              value={`${integratedLivesSaved.toFixed(0)} vidas`}
              subtitle="Impacto máximo combinado A+B+C"
              icon={<Shield className="w-5 h-5" />}
              variant="info"
            />
          </div>

          {/* Full Results Table */}
          <ChartCard
            title="Resultados Completos de la Simulación"
            subtitle="Salidas deterministas RK4 — no son estimaciones empíricas retrospectivas"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Escenario</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Nacimientos Acumulados</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Muertes Maternas</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">RMM en Horizonte</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Muertes Evitadas</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Cobertura CPN4</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Parto Institucional</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Costo Total</th>
                    <th className="text-right py-3.5 px-4 text-xs text-slate-300 font-bold uppercase tracking-wider">Costo/Vida Salvada</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioIds.map((id) => {
                    const r = allResults[id];
                    if (!r) return null;
                    const isBaseline = id === 'baseline';
                    return (
                      <tr key={id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isBaseline ? 'bg-slate-800/20' : ''}`}>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">{SCENARIO_LABELS[id]}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">{r.summary.totalBirths.toFixed(0)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">{r.summary.totalMaternalDeaths.toFixed(0)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-white font-bold">{r.summary.mmrFinal.toFixed(0)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold">
                          {isBaseline ? '—' : r.summary.livesSaved.toFixed(0)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-200">{r.summary.anc4CoverageFinal.toFixed(1)}%</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-200">{r.summary.facilityDeliveryRateFinal.toFixed(1)}%</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">${r.summary.totalCostUSD.toFixed(0)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-medium">
                          {isBaseline ? '—' : `$${r.summary.costPerLifeSavedUSD.toFixed(0)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Key Findings */}
          {baseline && bestScenario && bestScenario.scenarioId !== 'baseline' && (
            <ChartCard title="Hallazgos Clave" subtitle="Resumen de la intervención de mayor impacto">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {bestScenario.scenarioName} logra el mayor impacto con{' '}
                      <span className="text-emerald-400 font-bold">{bestScenario.summary.livesSaved.toFixed(0)} vidas salvadas</span>{' '}
                      a lo largo de 36 meses.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Reducción de RMM: {baseline.summary.mmrFinal.toFixed(0)} → {bestScenario.summary.mmrFinal.toFixed(0)} 
                      ({bestScenario.summary.mmrReductionPercent.toFixed(1)}% de reducción).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">
                      Todas las salidas son <strong>simulaciones deterministas RK4</strong>, no estimaciones empíricas retrospectivas. 
                      Los intervalos IC95, análisis de sensibilidad Sobol y validación externa están disponibles en la pestaña de Validación.
                    </p>
                  </div>
                </div>
              </div>
            </ChartCard>
          )}

          {/* Metadata */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Informe generado desde el motor de simulación RK4 FastAPI · {district.name} · 
                {new Date().toLocaleDateString()} · 
                {Object.keys(allResults).length} escenarios × 36 meses
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
