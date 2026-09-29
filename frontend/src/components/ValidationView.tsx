import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  BarChart2,
  Activity,
  HelpCircle,
  Layers,
  ShieldCheck,
  TrendingUp,
  Award,
  RefreshCw,
  AlertTriangle,
  Clock,
  Target,
  Database,
  SlidersHorizontal
} from 'lucide-react';
import { DistrictData } from '../types';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { SectionHeader } from './ui/SectionHeader';
import { StatCard } from './ui/StatCard';
import { ChartCard } from './ui/ChartCard';
import { Badge } from './ui/Badge';
import * as ApiClient from '../services/api';

interface ValidationViewProps {
  district: DistrictData;
}

interface KSResult {
  statistic_d: number;
  p_value: number;
  is_statistically_equivalent: boolean;
  critical_value: number;
}

interface SobolResult {
  parameters: string[];
  first_order_indices: number[];
  total_order_indices: number[];
  top_variance_contributors: string[];
}

interface BootstrapResult {
  iterations: number;
  mean_lives_saved: number;
  ci95_lives_saved: [number, number];
  mean_cost_per_life_saved: number;
  ci95_cost_per_life_saved: [number, number];
}

interface ExternalResult {
  test_district: string;
  country: string;
  observed_mmr: number;
  predicted_mmr: number;
  rmse: number;
  r_squared: number;
  mean_absolute_error: number;
}

interface RK4ConvergenceResult {
  district_id: string;
  district_name: string;
  scenario_id: string;
  integrator: string;
  timesteps: Record<string, { births: number; deaths: number; horizon_mmr: number }>;
  relative_error_mmr: number;
  relative_error_percent: number;
  is_convergent: boolean;
  tolerance: number;
  order_of_convergence: number;
  status: string;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ district }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [convergenceResult, setConvergenceResult] = useState<RK4ConvergenceResult | null>(null);
  const [ksResult, setKsResult] = useState<KSResult | null>(null);
  const [sobolResult, setSobolResult] = useState<SobolResult | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<BootstrapResult | null>(null);
  const [externalResult, setExternalResult] = useState<ExternalResult | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({
    ks: false,
    sobol: false,
    bootstrap: false,
    external: false,
  });

  const handleValidationError = (key: string, e: any) => {
    if (e.message === 'VALIDATION_UNAVAILABLE') {
      setUnavailable((p) => ({ ...p, [key]: true }));
      setErrors((p) => ({ ...p, [key]: '' }));
    } else {
      setErrors((p) => ({ ...p, [key]: e.message || t.rvTestFailed }));
    }
  };
  const runConvergence = async () => {
    setLoading((p) => ({ ...p, convergence: true }));
    setErrors((p) => ({ ...p, convergence: '' }));
    try {
      const data = await ApiClient.runRK4Convergence(district.id, 'scenario_d', 36);
      setConvergenceResult(data);
    } catch (e: any) {
      setErrors((p) => ({ ...p, convergence: e.message || t.rvConvergError }));
    } finally {
      setLoading((p) => ({ ...p, convergence: false }));
    }
  };

  useEffect(() => {
    runConvergence();
  }, [district.id]);

  const runKS = async () => {
    setLoading((p) => ({ ...p, ks: true }));
    setErrors((p) => ({ ...p, ks: '' }));
    setUnavailable((p) => ({ ...p, ks: false }));
    try {
      const data = await ApiClient.runKolmogorovSmirnov(district.id);
      setKsResult(data);
    } catch (e: any) {
      handleValidationError('ks', e);
    } finally {
      setLoading((p) => ({ ...p, ks: false }));
    }
  };

  const runSobol = async () => {
    setLoading((p) => ({ ...p, sobol: true }));
    setErrors((p) => ({ ...p, sobol: '' }));
    setUnavailable((p) => ({ ...p, sobol: false }));
    try {
      const data = await ApiClient.runSobolSensitivity(district.id);
      setSobolResult(data);
    } catch (e: any) {
      handleValidationError('sobol', e);
    } finally {
      setLoading((p) => ({ ...p, sobol: false }));
    }
  };

  const runBootstrap = async () => {
    setLoading((p) => ({ ...p, bootstrap: true }));
    setErrors((p) => ({ ...p, bootstrap: '' }));
    setUnavailable((p) => ({ ...p, bootstrap: false }));
    try {
      const data = await ApiClient.runBootstrap(district.id, 'scenario_d');
      setBootstrapResult(data);
    } catch (e: any) {
      handleValidationError('bootstrap', e);
    } finally {
      setLoading((p) => ({ ...p, bootstrap: false }));
    }
  };

  const runExternal = async () => {
    setLoading((p) => ({ ...p, external: true }));
    setErrors((p) => ({ ...p, external: '' }));
    setUnavailable((p) => ({ ...p, external: false }));
    try {
      const data = await ApiClient.runExternalValidation(district.id);
      setExternalResult(data);
    } catch (e: any) {
      handleValidationError('external', e);
    } finally {
      setLoading((p) => ({ ...p, external: false }));
    }
  };

  const hasResults = convergenceResult || ksResult || sobolResult || bootstrapResult || externalResult;

  return (
    <div className="space-y-4">
      {/* Header */}
      <SectionHeader
        title={t.rvSuiteTitle}
        subtitle={`Distrito: ${district.name} · ${t.rvSuiteSub}`}
        icon={<ShieldCheck className="w-5 h-5" />}
        badge={
          hasResults
            ? <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> {t.rvResultsLoaded}</Badge>
            : <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> {t.rvAwaitingRun}</Badge>
        }
      />

      {/* Run All Button */}
      <div className="flex gap-2">
        <button
          onClick={async () => { await Promise.all([runConvergence(), runKS(), runSobol(), runBootstrap(), runExternal()]); }}
          disabled={Object.values(loading).some(Boolean)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
          {t.rvRunAll}
        </button>
      </div>

      {/* RK4 Numerical Convergence Card */}
      <ChartCard
        title={t.rvRk4Title}
        subtitle={t.rvRk4Sub}
        actions={
          <button
            onClick={runConvergence}
            disabled={loading.convergence}
            className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
          >
            {loading.convergence ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            {loading.convergence ? t.rvVerifying : t.rvReverifyRk4}
          </button>
        }
      >
        {errors.convergence && (
          <div className="flex gap-2 items-center text-rose-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {errors.convergence}
          </div>
        )}

        {convergenceResult ? (
          <div className="space-y-4">
            {/* Top KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvIntegrator}</div>
                <div className="text-base font-mono font-bold text-sky-400">{t.rvRk4Classic}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{t.rvPrecisionOrder}</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvRelDiscError}</div>
                <div className="text-xl font-mono font-extrabold text-emerald-400">
                  {convergenceResult.relative_error_percent.toFixed(4)}%
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{t.rvMaxTol}</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvCauchyCriterion}</div>
                <div className="text-xl font-mono font-extrabold text-emerald-400">
                  {convergenceResult.is_convergent ? t.rvSatisfied : t.rvNotConverge}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">dt=0.1 vs dt=0.025</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvValidationStatus}</div>
                <div className="text-xl font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> {t.rvConverges}
                </div>
                <div className="text-xs text-slate-400 mt-1">{t.rvStability}</div>
              </div>
            </div>

            {/* Timestep Comparison Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-700/80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/70 border-b border-slate-700 text-slate-300">
                    <th className="text-left py-2 px-3 font-semibold">{t.rvColTimestep}</th>
                    <th className="text-right py-2 px-3 font-semibold">{t.rvColTotalSteps}</th>
                    <th className="text-right py-2 px-3 font-semibold">{t.rvColBirthsAcc}</th>
                    <th className="text-right py-2 px-3 font-semibold">{t.rvColDeathsAcc}</th>
                    <th className="text-right py-2 px-3 font-semibold">{t.rvColHorizon}</th>
                    <th className="text-right py-2 px-3 font-semibold">{t.rvColRelDiff}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(convergenceResult.timesteps).map(([dtKey, vals]) => {
                    const stepNum = Math.round(36 / parseFloat(dtKey));
                    const baselineMMR = convergenceResult.timesteps['0.025']?.horizon_mmr || vals.horizon_mmr;
                    const diff = Math.abs(vals.horizon_mmr - baselineMMR) / baselineMMR * 100;
                    return (
                      <tr key={dtKey} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-medium text-sky-400">Δt = {dtKey} {t.rvUnitMonth}</td>
                        <td className="text-right py-2 px-3 font-mono text-slate-400">{stepNum} {t.rvUnitSteps}</td>
                        <td className="text-right py-2 px-3 font-mono text-slate-300">{Math.round(vals.births).toLocaleString()}</td>
                        <td className="text-right py-2 px-3 font-mono text-slate-300">{vals.deaths.toFixed(1)}</td>
                        <td className="text-right py-2 px-3 font-mono font-bold text-slate-200">{vals.horizon_mmr.toFixed(2)}</td>
                        <td className="text-right py-2 px-3 font-mono text-emerald-400">
                          {dtKey === '0.025' ? t.rvRefStep : `${diff.toFixed(4)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-slate-400 italic">
              * {t.rvMethodNote}
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">
            {loading.convergence ? t.rvRunConvergence : t.rvClickReverify}
          </div>
        )}
      </ChartCard>

      {/* KS Test */}
      <ChartCard
        title={t.rvKsTwoSample}
        subtitle={t.rvKsEquivDesc}
        actions={
          <button onClick={runKS} disabled={loading.ks || unavailable.ks} className="text-sm text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed">
            {loading.ks ? t.rvRunning : unavailable.ks ? t.rvNotAvailable : t.rvRunKs}
          </button>
        }
      >
        {errors.ks && (
          <div className="flex gap-2 items-center text-rose-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {errors.ks}
          </div>
        )}
        {unavailable.ks && (
          <div className="flex gap-2 items-center text-amber-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {t.rvKsDisabled}
          </div>
        )}
        {ksResult ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">{t.rvStatKs}</div>
              <div className="text-xl font-mono font-bold">{ksResult.statistic_d.toFixed(4)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">{t.rvPValue}</div>
              <div className="text-xl font-mono font-bold">{ksResult.p_value.toFixed(4)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">{t.rvCriticalValue}</div>
              <div className="text-xl font-mono font-bold">{ksResult.critical_value.toFixed(4)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">{t.rvOutcome}</div>
              <div className={`text-xl font-bold ${ksResult.is_statistically_equivalent ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ksResult.is_statistically_equivalent ? t.rvApproved : t.rvNotApproved}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">
            {unavailable.ks ? t.rvConfigureDhs : t.rvRunKsHint}
          </div>
        )}
      </ChartCard>

      {/* Sobol Sensitivity */}
      <ChartCard
        title={t.rvSobolTitle}
        subtitle={t.rvSobolSub}
        actions={
          <button onClick={runSobol} disabled={loading.sobol || unavailable.sobol} className="text-sm text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed">
            {loading.sobol ? t.rvRunning : unavailable.sobol ? t.rvNotAvailable : t.rvRunSobol}
          </button>
        }
      >
        {errors.sobol && (
          <div className="flex gap-2 items-center text-rose-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {errors.sobol}
          </div>
        )}
        {unavailable.sobol && (
          <div className="flex gap-2 items-center text-amber-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {t.rvSobolDisabled}
          </div>
        )}
        {sobolResult ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-xs text-slate-400">{t.rvParam}</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400">{t.rvFirstOrder}</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400">{t.rvTotalOrder}</th>
                  </tr>
                </thead>
                <tbody>
                  {sobolResult.parameters.map((param, i) => (
                    <tr key={param} className="border-b border-slate-800/50">
                      <td className="py-2 px-3 font-mono text-xs">{param}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {(sobolResult.first_order_indices[i] * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {(sobolResult.total_order_indices[i] * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sobolResult.top_variance_contributors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-400">{t.rvTopVariance}</span>
                {sobolResult.top_variance_contributors.map((p) => (
                  <Badge key={p} variant="info" size="sm">{p}</Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">
            {unavailable.sobol ? t.rvConfigureRanges : t.rvRunSobolHint}
          </div>
        )}
      </ChartCard>

      {/* Bootstrap Confidence Intervals */}
      <ChartCard
        title={t.rvBootTitle}
        subtitle={t.rvBootSub}
        actions={
          <button onClick={runBootstrap} disabled={loading.bootstrap || unavailable.bootstrap} className="text-sm text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-not-allowed">
            {loading.bootstrap ? t.rvRunning : unavailable.bootstrap ? t.rvNotAvailable : t.rvRunBootstrap}
          </button>
        }
      >
        {errors.bootstrap && (
          <div className="flex gap-2 items-center text-rose-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {errors.bootstrap}
          </div>
        )}
        {unavailable.bootstrap && (
          <div className="flex gap-2 items-center text-amber-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {t.rvBootDisabled}
          </div>
        )}
        {bootstrapResult ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvIterations}</div>
              <div className="text-2xl font-mono font-extrabold text-white">{bootstrapResult.iterations}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvMeanLives}</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-400">{bootstrapResult.mean_lives_saved.toFixed(0)}</div>
              <div className="text-xs font-mono text-slate-300 mt-1">
                {t.rvCi95} [{bootstrapResult.ci95_lives_saved[0].toFixed(0)}, {bootstrapResult.ci95_lives_saved[1].toFixed(0)}]
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvMeanCostLife}</div>
              <div className="text-2xl font-mono font-extrabold text-sky-400">${bootstrapResult.mean_cost_per_life_saved.toFixed(0)}</div>
              <div className="text-xs font-mono text-slate-300 mt-1">
                {t.rvCi95} [${bootstrapResult.ci95_cost_per_life_saved[0].toFixed(0)}, ${bootstrapResult.ci95_cost_per_life_saved[1].toFixed(0)}]
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvIcWidthRatio}</div>
              <div className="text-2xl font-mono font-extrabold text-white">
                {bootstrapResult.mean_lives_saved > 0
                  ? ((bootstrapResult.ci95_lives_saved[1] - bootstrapResult.ci95_lives_saved[0]) / bootstrapResult.mean_lives_saved * 100).toFixed(0) + '%'
                  : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400 py-4 text-center">
            {unavailable.bootstrap ? t.rvConfigureUncertainty : t.rvRunBootHint}
          </div>
        )}
      </ChartCard>

      {/* External Validation */}
      <ChartCard
        title={t.rvExternalTitle}
        subtitle={t.rvExternalSub}
        actions={
          <button onClick={runExternal} disabled={loading.external || unavailable.external} className="text-sm font-semibold text-sky-400 hover:text-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">
            {loading.external ? t.rvRunning : unavailable.external ? t.rvNotAvailable : t.rvRunExternal}
          </button>
        }
      >
        {errors.external && (
          <div className="flex gap-2 items-center text-rose-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {errors.external}
          </div>
        )}
        {unavailable.external && (
          <div className="flex gap-2 items-center text-amber-400 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" /> {t.rvExternalDisabled}
          </div>
        )}
        {externalResult ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvTestDistrict}</div>
              <div className="text-xl font-bold text-white">{externalResult.test_district}</div>
              <div className="text-xs text-slate-400 mt-0.5">{externalResult.country}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvObservedMMR}</div>
              <div className="text-2xl font-mono font-extrabold text-rose-400">{externalResult.observed_mmr.toFixed(0)}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvPredictedMMR}</div>
              <div className="text-2xl font-mono font-extrabold text-sky-400">{externalResult.predicted_mmr.toFixed(0)}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">{t.rvRSquared}</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-400">{externalResult.r_squared.toFixed(3)}</div>
              <div className="text-xs font-mono text-slate-300 mt-1">{t.rvRmse}: {externalResult.rmse.toFixed(1)}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">
            {unavailable.external ? t.rvConfigureHoldout : t.rvRunExternalHint}
          </div>
        )}
      </ChartCard>

      {/* Data Requirements */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <Database className="w-5 h-5 text-sky-400 mb-2" />
          <h3 className="font-medium">{t.rvDataRequired}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {t.rvDataRequiredDesc}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <SlidersHorizontal className="w-5 h-5 text-sky-400 mb-2" />
          <h3 className="font-medium">{t.rvSensRequired}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {t.rvSensRequiredDesc}
          </p>
        </div>
      </div>
    </div>
  );
};
