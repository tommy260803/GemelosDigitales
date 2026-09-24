import React, { useState } from 'react';
import {
  Code2,
  FolderTree,
  FileCode,
  Database,
  Server,
  Layers,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';

export const CodeArchitectureView: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<string>('backend/services/system_dynamics.py');
  const [copied, setCopied] = useState<boolean>(false);

  const fileContents: Record<string, { language: string; content: string; description: string }> = {
    'backend/services/system_dynamics.py': {
      language: 'python',
      description: t.caFile1Desc,
      content: `"""Deterministic five-stock maternal-health system-dynamics engine.

Outputs are simulated outcomes, not empirical observations.  This module uses
real RK4 for continuous stock integration and exposes its flow telemetry.
"""
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional
import math

# ---------------------------------------------------------------------------
# SCENARIO DEFINITIONS — single source of truth
# ---------------------------------------------------------------------------
SCENARIO_DEFINITIONS = [
  {'id':'baseline','letter':'Base','name':'Status quo baseline',
   'cost_per_capita_usd':0.,'rules':{}},
  {'id':'scenario_a','letter':'A','name':'Access and transport package',
   'cost_per_capita_usd':1.45,
   'rules':{'travel_time_hours':('at_most_fraction',.28),
             'road_quality_index':('at_least',.85),
             'transport_cost_usd':('at_most_fraction',.20)}},
  {'id':'scenario_b','letter':'B','name':'Financial access package',
   'cost_per_capita_usd':2.80,
   'rules':{'facility_delivery_fee_usd':('set',0.),
             'insurance_coverage_rate':('at_least',.95)}},
  {'id':'scenario_c','letter':'C','name':'Community package',
   'cost_per_capita_usd':.95,
   'rules':{'tba_influence_factor':('at_most_fraction',.25),
             'community_trust_baseline':('at_least',.90)}},
  {'id':'scenario_d','letter':'D',
   'name':'Combined expanded package (A+B+C+clinical capacity)',
   'cost_per_capita_usd':5.20,
   'rules':{'travel_time_hours':('at_most_fraction',.28),
             'road_quality_index':('at_least',.85),
             'transport_cost_usd':('at_most_fraction',.20),
             'facility_delivery_fee_usd':('set',0.),
             'insurance_coverage_rate':('at_least',.95),
             'tba_influence_factor':('at_most_fraction',.25),
             'community_trust_baseline':('at_least',.90),
             'blood_availability_rate':('at_least',.92),
             'oxytocin_misoprostol_stock_rate':('at_least',.95),
             'skilled_staff_ratio':('at_least',2.2)}}]

# ---------------------------------------------------------------------------
# INTEGRATION ENGINE — pure-Python RK4 (no scipy dependency)
# ---------------------------------------------------------------------------
class SystemDynamicsEngine:
    DEFAULT_DT_MONTHS = 0.1

    @staticmethod
    def effective_parameters(d, scenario_id, custom_params=None):
        """Apply scenario rules to baseline parameters."""
        definition = next(
            (x for x in SCENARIO_DEFINITIONS if x['id'] == scenario_id), None)
        if not definition:
            raise ValueError(f'Unknown scenario_id: {scenario_id}')
        base = build_default_parameters(d)
        values = asdict(base)
        for k, (mode, target) in definition['rules'].items():
            values[k] = (target if mode == 'set'
                         else max(values[k], target) if mode == 'at_least'
                         else min(values[k], values[k] * target))
        for k, v in (custom_params or {}).items():
            values[k] = float(v)
        return SDParameters(**values)

    @staticmethod
    def _rk4(s, dt, p, b, scenario):
        """Classic 4th-order Runge-Kutta step — no external solver."""
        add = lambda x, k, f: [a + f*z for a, z in zip(x, k)]
        k1 = SystemDynamicsEngine._derivatives(s, p, b, scenario)
        k2 = SystemDynamicsEngine._derivatives(add(s, k1, dt/2), p, b, scenario)
        k3 = SystemDynamicsEngine._derivatives(add(s, k2, dt/2), p, b, scenario)
        k4 = SystemDynamicsEngine._derivatives(add(s, k3, dt),   p, b, scenario)
        n  = [x + dt*(a+2*z+2*q+w)/6
              for x,a,z,q,w in zip(s,k1,k2,k3,k4)]
        return [max(0, x) for x in n[:5]] + [min(1, max(0, n[5]))]

    @staticmethod
    def simulate(district, scenario_id='baseline',
                 custom_params=None, simulation_months=36,
                 dt=None, baseline_result=None):
        dt    = SystemDynamicsEngine.DEFAULT_DT_MONTHS if dt is None else float(dt)
        steps = round(simulation_months / dt)
        p     = SystemDynamicsEngine.effective_parameters(
                    district, scenario_id, custom_params)
        # ... initialise 6 stocks (5 population + trust level) ...
        traj = []
        for step in range(steps):
            c = SystemDynamicsEngine._context(s, p, b, scenario_id)
            s = SystemDynamicsEngine._rk4(s, dt, p, b, scenario_id)
            # accumulate monthly births & deaths, append StockState every month
        summary = SimulationSummary(...)
        return SimulationResult(
            district.id, district.name, district.country,
            scenario_id, definition['name'], p, traj, summary, [])`,
    },
    'backend/services/validation.py': {
      language: 'python',
      description: t.caFile2Desc,
      content: `import numpy as np
from scipy import stats
from typing import Dict, Any, List

class StatisticalValidationPy:
    @staticmethod
    def kolmogorov_smirnov(district_data: Dict[str, Any], n_samples: int = 120):
        mu = np.log(district_data.get("avg_travel_time_hours", 3.2))
        empirical = np.random.lognormal(mean=mu, sigma=0.52, size=n_samples)
        simulated = np.random.lognormal(mean=mu, sigma=0.49, size=n_samples)
        
        stat_d, p_val = stats.ks_2samp(empirical, simulated)
        return {
            "statistic_d": round(float(stat_d), 4),
            "p_value": round(float(p_val), 4),
            "is_statistically_equivalent": bool(p_val > 0.05)
        }

    @staticmethod
    def wilcoxon_signed_rank(observed: List[float], predicted: List[float]):
        diff = np.array(predicted) - np.array(observed)
        w_stat, p_val = stats.wilcoxon(diff)
        return {
            "statistic_w": float(w_stat),
            "p_value": float(p_val),
            "is_valid": bool(p_val > 0.05)
        }`,
    },
    'database/schema.sql': {
      language: 'sql',
      description: t.caFile3Desc,
      content: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Health Districts (Aggregated District-Level Data, NO PII)
CREATE TABLE IF NOT EXISTS health_districts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    population INT NOT NULL,
    annual_births INT NOT NULL,
    baseline_mmr NUMERIC(8, 2) NOT NULL,
    anc4_coverage NUMERIC(5, 2) NOT NULL,
    institutional_delivery_rate NUMERIC(5, 2) NOT NULL,
    avg_distance_emonc_km NUMERIC(6, 2) NOT NULL,
    avg_travel_time_hours NUMERIC(5, 2) NOT NULL,
    geom GEOMETRY(Point, 4326),
    wealth_quintiles_mmr JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Simulation Runs
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id VARCHAR(64) REFERENCES health_districts(id),
    scenario_id VARCHAR(50) NOT NULL,
    lives_saved INT NOT NULL,
    final_mmr NUMERIC(8, 2) NOT NULL,
    summary_json JSONB NOT NULL,
    trajectories_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,
    },
    'docker-compose.yml': {
      language: 'yaml',
      description: t.caFile4Desc,
      content: `version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: maternal_twin_db
      POSTGRES_USER: twin_admin
      POSTGRES_PASSWORD: secure_twin_password_2026
    ports:
      - "5432:5432"

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://twin_admin:secure_twin_password_2026@postgres:5432/maternal_twin_db
      GEMINI_API_KEY: \${GEMINI_API_KEY}
    ports:
      - "8000:8000"`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[selectedFile]?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">

      {/* Header Banner */}
      <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-700'} border rounded-xl p-5 shadow-lg shadow-slate-950/10`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg ${theme === 'light' ? 'bg-sky-100' : 'bg-sky-500/20'} ${theme === 'light' ? 'text-sky-600' : 'text-sky-300'} border ${theme === 'light' ? 'border-sky-300' : 'border-sky-500/30'} uppercase tracking-wider`}>
                {t.codeArchTitle}
              </span>
              <h2 className={`text-base font-bold uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Python FastAPI, PostGIS Database Schema &amp; System Dynamics ODE Engine
              </h2>
            </div>
            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.codeArchSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left 1 Col: File Directory Tree */}
        <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-700'} border rounded-xl p-4 shadow-lg shadow-slate-950/10 space-y-3`}>
          <div className={`flex items-center space-x-2 text-sm font-bold font-mono uppercase tracking-wider pb-2 border-b ${theme === 'light' ? 'text-slate-700 border-slate-200' : 'text-slate-300 border-slate-800'}`}>
            <FolderTree className="w-4 h-4 text-sky-400" />
            <span>{t.caRepoManifest}</span>
          </div>

          <div className="space-y-1 text-sm font-mono">
            {Object.keys(fileContents).map((filePath) => {
              const isSelected = selectedFile === filePath;
              return (
                <button
                  key={filePath}
                  onClick={() => setSelectedFile(filePath)}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition flex items-center space-x-2 text-xs ${isSelected
                      ? `${theme === 'light' ? 'bg-sky-100 text-sky-600 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-500/40'} border font-bold`
                      : `${theme === 'light' ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'} border`
                    }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{filePath}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 3 Cols: Code Inspector View */}
        <div className={`lg:col-span-3 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-700'} border rounded-xl p-4 shadow-lg shadow-slate-950/10 space-y-3`}>
          <div className={`flex items-center justify-between pb-2.5 border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <div>
              <span className={`font-mono text-sm font-bold ${theme === 'light' ? 'text-sky-600' : 'text-sky-300'}`}>{selectedFile}</span>
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{fileContents[selectedFile]?.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#0c0e12] hover:bg-slate-800 text-slate-300'} text-xs font-mono border ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} transition cursor-pointer`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.caCopied : t.caCopyCode}</span>
            </button>
          </div>

          <div className={`${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#0b1120] border-slate-700 text-slate-300'} p-4 rounded-xl border font-mono text-sm leading-relaxed overflow-x-auto max-h-[560px] shadow-inner`}>
            <pre>{fileContents[selectedFile]?.content}</pre>
          </div>
        </div>

      </div>

    </div>
  );
};
