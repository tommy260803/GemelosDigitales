import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DHSImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Retained only for call-site compatibility; client-side imports are disabled. */
  onImportDistrict: (district: never) => void;
}

/**
 * Territorial records are operational data. They enter through the validated
 * CSV-to-PostgreSQL loader, never through a browser-generated district record.
 */
export const DHSImportModal: React.FC<DHSImportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c0e12] border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold">Client-side district import unavailable</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 text-sm text-slate-300 space-y-3">
          <p>Territorial model inputs are loaded only through the validated structured-input pipeline into PostgreSQL.</p>
          <p className="text-slate-500">Existing DHS microdata are preserved for a future audited ETL process; this interface does not generate fallback territorial values.</p>
          <button onClick={onClose} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white">Close</button>
        </div>
      </div>
    </div>
  );
};
