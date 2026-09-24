import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** Remove inner padding — useful for full-width tables that should reach the card edges */
  noPadding?: boolean;
  /** Show a skeleton loading state instead of children */
  loading?: boolean;
  /** Left-border accent color (CSS color value, e.g. '#38bdf8') */
  accentColor?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
  noPadding = false,
  loading = false,
  accentColor,
}) => {
  const { theme } = useTheme();

  const borderClass = theme === 'light' ? 'border-slate-200' : 'border-slate-800';
  const bgClass     = theme === 'light' ? 'bg-white'         : 'bg-slate-900/60';
  const headBorder  = theme === 'light' ? 'border-slate-100' : 'border-slate-800/80';
  const titleClass  = theme === 'light' ? 'text-slate-900'   : 'text-white';
  const subClass    = theme === 'light' ? 'text-slate-600'   : 'text-slate-300';

  return (
    <div
      className={`${bgClass} ${borderClass} border rounded-xl overflow-hidden shadow-sm ${className}`}
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
    >
      {/* Card Header */}
      <div className={`px-6 py-4.5 border-b ${headBorder}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h3 className={`text-base sm:text-lg font-bold tracking-tight ${titleClass} truncate`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-sm mt-1 leading-snug ${subClass}`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Card Body */}
      {loading ? (
        <div className="p-6 space-y-3.5" aria-busy="true" aria-label="Cargando…">
          {[80, 60, 90, 70, 55].map((w, i) => (
            <div
              key={i}
              className="h-4.5 rounded-md animate-pulse bg-slate-700/60"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : (
        <div className={noPadding ? '' : 'p-6'}>
          {children}
        </div>
      )}
    </div>
  );
};
