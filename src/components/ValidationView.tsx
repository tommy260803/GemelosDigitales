import React from 'react';
import { AlertTriangle, Database, SlidersHorizontal } from 'lucide-react';
import { DistrictData } from '../types';

interface ValidationViewProps { district: DistrictData; }

/** Former synthetic/hard-coded scientific claims are intentionally not shown. */
export const ValidationView: React.FC<ValidationViewProps> = ({ district }) => (
  <div className="space-y-4">
    <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-5 flex gap-3">
      <AlertTriangle className="w-6 h-6 text-amber-300 shrink-0" />
      <div><h2 className="font-semibold text-amber-100">Scientific validation is not available in this build</h2><p className="text-sm text-amber-100/80 mt-1">Synthetic KS samples, hard-coded Sobol indices, heuristic confidence intervals and claimed external-validation metrics were removed. This page intentionally reports no statistical validation result.</p></div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"><Database className="w-5 h-5 text-sky-400 mb-2" /><h3 className="font-medium">Data required</h3><p className="text-sm text-slate-400 mt-1">Independent observed outcomes, documented provenance, and a geographic/temporal match for {district.name}.</p></div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"><SlidersHorizontal className="w-5 h-5 text-sky-400 mb-2" /><h3 className="font-medium">Sensitivity required</h3><p className="text-sm text-slate-400 mt-1">Documented parameter ranges and model re-execution are required before uncertainty estimates are displayed.</p></div>
    </div>
  </div>
);
