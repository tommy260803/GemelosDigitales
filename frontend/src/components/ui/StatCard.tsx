import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  loading?: boolean;
  tooltip?: string;
}

const VARIANT_ICON_BG: Record<string, string> = {
  default:   'bg-slate-700/60',
  highlight: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  success:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  danger:    'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  info:      'bg-sky-500/20 text-sky-400 border border-sky-500/30',
};

const formatMetric = (value: number) => Number(value.toFixed(2)).toString();

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  change,
  icon,
  variant = 'default',
  className = '',
  loading = false,
}) => {
  const { theme } = useTheme();

  const variants = {
    default: {
      bg:     theme === 'light' ? 'bg-white' : 'bg-slate-900/60',
      border: theme === 'light' ? 'border-slate-200' : 'border-slate-800',
      label:  theme === 'light' ? 'text-slate-600' : 'text-slate-300',
      value:  theme === 'light' ? 'text-slate-900' : 'text-white',
      icon:   theme === 'light' ? 'text-slate-500' : 'text-slate-300',
    },
    highlight: {
      bg:     theme === 'light' ? 'bg-sky-50'     : 'bg-sky-950/30',
      border: theme === 'light' ? 'border-sky-200': 'border-sky-800/60',
      label:  'text-sky-600 dark:text-sky-300',
      value:  'text-sky-800 dark:text-sky-200',
      icon:   'text-sky-400',
    },
    success: {
      bg:     theme === 'light' ? 'bg-emerald-50'      : 'bg-emerald-950/30',
      border: theme === 'light' ? 'border-emerald-200' : 'border-emerald-800/60',
      label:  'text-emerald-700 dark:text-emerald-300',
      value:  'text-emerald-800 dark:text-emerald-200',
      icon:   'text-emerald-400',
    },
    warning: {
      bg:     theme === 'light' ? 'bg-amber-50'      : 'bg-amber-950/30',
      border: theme === 'light' ? 'border-amber-200' : 'border-amber-800/60',
      label:  'text-amber-700 dark:text-amber-300',
      value:  'text-amber-800 dark:text-amber-200',
      icon:   'text-amber-400',
    },
    danger: {
      bg:     theme === 'light' ? 'bg-rose-50'      : 'bg-rose-950/30',
      border: theme === 'light' ? 'border-rose-200' : 'border-rose-800/60',
      label:  'text-rose-700 dark:text-rose-300',
      value:  'text-rose-800 dark:text-rose-200',
      icon:   'text-rose-400',
    },
    info: {
      bg:     theme === 'light' ? 'bg-sky-50'     : 'bg-sky-950/30',
      border: theme === 'light' ? 'border-sky-200': 'border-sky-800/60',
      label:  'text-sky-600 dark:text-sky-300',
      value:  'text-sky-800 dark:text-sky-200',
      icon:   'text-sky-400',
    },
  };

  const s = variants[variant];

  if (loading) {
    return (
      <div className={`${s.bg} ${s.border} border rounded-xl p-5 ${className}`} aria-hidden="true">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2.5">
            <div className="h-3.5 w-28 rounded bg-slate-700/60 animate-pulse" />
            <div className="h-8 w-32 rounded bg-slate-700/60 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-700/60 animate-pulse" />
          </div>
          {icon && <div className="w-10 h-10 rounded-xl bg-slate-700/60 animate-pulse" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${s.bg} ${s.border} border rounded-xl p-5 
        transition-all hover:shadow-md 
        animate-fade-in
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${s.label}`}>
            {label}
          </p>
          <p className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1.5 leading-tight tracking-tight ${s.value}`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-1.5 font-semibold ${change.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change.value >= 0 ? '↑' : '↓'} {formatMetric(Math.abs(change.value))}% {change.label}
            </p>
          )}
          {subtitle && (
            <p className={`text-sm mt-1.5 leading-snug ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`${VARIANT_ICON_BG[variant]} ${s.icon} rounded-xl p-2.5 shrink-0 flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
