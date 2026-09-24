import React from 'react';

// ─── Skeleton primitives ──────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  const r = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded];
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-700/60 ${r} ${className}`}
    />
  );
}

// ─── StatCard skeleton ────────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-9 h-9" rounded="lg" />
      </div>
    </div>
  );
}

// ─── KPI row skeleton ─────────────────────────────────────────────────────────
export function KPIRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3`} aria-busy="true" aria-label="Cargando indicadores…">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── ChartCard skeleton ───────────────────────────────────────────────────────
export function ChartCardSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden" aria-hidden="true">
      <div className="px-5 py-4 border-b border-slate-800/80">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32 mt-1.5" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-5 ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-2 px-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-slate-800/50">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="py-2.5 px-3">
                  <Skeleton className={`h-4 ${c === 0 ? 'w-28' : 'w-16 ml-auto'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
