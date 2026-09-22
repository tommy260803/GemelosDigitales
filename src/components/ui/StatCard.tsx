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
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  change,
  icon,
  variant = 'default',
  className = '',
}) => {
  const { theme } = useTheme();

  const variants = {
    default: {
      bg: theme === 'light' ? 'bg-white' : 'bg-slate-900/50',
      border: theme === 'light' ? 'border-slate-200' : 'border-slate-800',
      label: theme === 'light' ? 'text-slate-500' : 'text-slate-400',
      value: theme === 'light' ? 'text-slate-900' : 'text-white',
    },
    highlight: {
      bg: theme === 'light' ? 'bg-sky-50' : 'bg-sky-950/30',
      border: theme === 'light' ? 'border-sky-200' : 'border-sky-800/50',
      label: 'text-sky-600 dark:text-sky-400',
      value: 'text-sky-700 dark:text-sky-300',
    },
    success: {
      bg: theme === 'light' ? 'bg-emerald-50' : 'bg-emerald-950/30',
      border: theme === 'light' ? 'border-emerald-200' : 'border-emerald-800/50',
      label: 'text-emerald-600 dark:text-emerald-400',
      value: 'text-emerald-700 dark:text-emerald-300',
    },
    warning: {
      bg: theme === 'light' ? 'bg-amber-50' : 'bg-amber-950/30',
      border: theme === 'light' ? 'border-amber-200' : 'border-amber-800/50',
      label: 'text-amber-600 dark:text-amber-400',
      value: 'text-amber-700 dark:text-amber-300',
    },
    danger: {
      bg: theme === 'light' ? 'bg-rose-50' : 'bg-rose-950/30',
      border: theme === 'light' ? 'border-rose-200' : 'border-rose-800/50',
      label: 'text-rose-600 dark:text-rose-400',
      value: 'text-rose-700 dark:text-rose-300',
    },
    info: {
      bg: theme === 'light' ? 'bg-sky-50' : 'bg-sky-950/30',
      border: theme === 'light' ? 'border-sky-200' : 'border-sky-800/50',
      label: 'text-sky-600 dark:text-sky-400',
      value: 'text-sky-700 dark:text-sky-300',
    },
  };

  const styles = variants[variant];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${styles.label}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold font-mono mt-1 ${styles.value}`}>
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-1 ${
              change.value >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {change.value >= 0 ? '+' : ''}{change.value}% {change.label}
            </p>
          )}
          {subtitle && (
            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`${styles.label} opacity-70`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
