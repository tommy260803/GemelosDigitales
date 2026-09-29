import React from 'react';
import { DistrictData } from '../types';
import { useApi } from '../context/ApiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/translations';
import { Activity, Heart, TrendingDown, DollarSign, ShieldCheck, Layers } from 'lucide-react';

interface DigitalTwinProjectionCardProps {
  district: DistrictData;
  scenarioId?: string;
}

const SCENARIO_KEYS: Record<string, string> = {
  baseline: 'dashScenarioBase',
  scenario_a: 'dashScenarioA',
  scenario_b: 'dashScenarioB',
  scenario_c: 'dashScenarioC',
  scenario_d: 'dashScenarioD',
};

export const DigitalTwinProjectionCard: React.FC<DigitalTwinProjectionCardProps> = ({
  district,
  scenarioId = 'scenario_d',
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { apiResults, isLoading } = useApi();

  const result = apiResults[scenarioId] || apiResults['scenario_d'] || apiResults['baseline'];
  const baseline = apiResults['baseline'];

  const scenarioKey = SCENARIO_KEYS[scenarioId];
  const scenarioName = scenarioKey
    ? (t[scenarioKey as keyof typeof t] as string)
    : (result?.scenarioName || scenarioId);

  if (isLoading || !result) {
    return (
      <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0c0e12] border-slate-800'
        }`}>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-sky-500 animate-spin" />
          <h4 className="text-xs font-semibold text-slate-300">{t.dtCalculatingRk4}</h4>
        </div>
        <p className="text-sm text-slate-500">
          {t.dtStocksRunning.replace('{name}', district.name)}
        </p>
      </div>
    );
  }

  const baselineMmr = baseline?.summary?.mmrFinal || district.baselineMMR;
  const projectedMmr = result.summary.mmrFinal;
  const reductionPercent = result.summary.mmrReductionPercent;
  const livesSaved = result.summary.livesSaved;
  const facilityRate = result.summary.facilityDeliveryRateFinal;
  const costPerLife = result.summary.costPerLifeSavedUSD;

  return (
    <div className={`rounded-xl border p-4 transition-all ${theme === 'light'
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-[#0c0e12] border-slate-800/80 shadow-lg'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-base font-bold truncate ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
              {t.dtProjectionTitle}
            </h4>
            <p className="text-sm text-slate-400 truncate">{scenarioName}</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
          RK4 36m
        </span>
      </div>

      {/* Primary MMR Comparison */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-2.5 rounded-lg border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
          <div className="text-sm text-slate-400 mb-1">{t.dtBaselineMmrShort}</div>
          <div className="text-xl font-bold font-mono text-slate-300">
            {baselineMmr.toFixed(0)}
            <span className="text-xs font-normal text-slate-500 ml-1">/100k</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border ${reductionPercent > 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
          <div className="text-sm text-emerald-400 mb-1 flex items-center justify-between gap-2">
            <span>{t.dtProjectedMMR}</span>
            {reductionPercent > 0 && (
              <span className="font-bold flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                -{reductionPercent.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {projectedMmr.toFixed(0)}
            <span className="text-xs font-normal text-emerald-500/70 ml-1">/100k</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center mb-3">
        <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/40'}`}>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" /> {t.dtLivesShort}
          </div>
          <div className="text-base font-bold font-mono text-rose-400 mt-1">
            +{livesSaved.toFixed(0)}
          </div>
        </div>

        <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/40'}`}>
          <div className="text-xs text-slate-400">{t.dtInstDeliveryShort}</div>
          <div className="text-base font-bold font-mono text-sky-400 mt-1">
            {facilityRate.toFixed(1)}%
          </div>
        </div>

        <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/40'}`}>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-400" /> {t.dtCostPerLife}
          </div>
          <div className="text-base font-bold font-mono text-amber-400 mt-1">
            {costPerLife > 0 ? `$${costPerLife.toFixed(0)}` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Mathematical Engine Certification */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-500 border-t border-slate-800/40 pt-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          {t.dtFiveStocks}
        </span>
        <span className="font-mono text-xs">{t.dtTimestepLabel}</span>
      </div>
    </div>
  );
};
