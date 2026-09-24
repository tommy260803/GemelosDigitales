import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const formatMetric = (value: number) => Number(value.toFixed(2)).toString();

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  const { theme } = useTheme();

  const variantStyles = {
    default: {
      bg: theme === 'light' ? 'bg-white' : 'bg-slate-900/50',
      border: theme === 'light' ? 'border-slate-200' : 'border-slate-800',
      text: theme === 'light' ? 'text-slate-900' : 'text-white',
      accent: theme === 'light' ? 'text-slate-600' : 'text-slate-400',
    },
    success: {
      bg: theme === 'light' ? 'bg-emerald-50' : 'bg-emerald-950/30',
      border: theme === 'light' ? 'border-emerald-200' : 'border-emerald-800/50',
      text: theme === 'light' ? 'text-emerald-900' : 'text-emerald-100',
      accent: theme === 'light' ? 'text-emerald-600' : 'text-emerald-400',
    },
    warning: {
      bg: theme === 'light' ? 'bg-amber-50' : 'bg-amber-950/30',
      border: theme === 'light' ? 'border-amber-200' : 'border-amber-800/50',
      text: theme === 'light' ? 'text-amber-900' : 'text-amber-100',
      accent: theme === 'light' ? 'text-amber-600' : 'text-amber-400',
    },
    danger: {
      bg: theme === 'light' ? 'bg-rose-50' : 'bg-rose-950/30',
      border: theme === 'light' ? 'border-rose-200' : 'border-rose-800/50',
      text: theme === 'light' ? 'text-rose-900' : 'text-rose-100',
      accent: theme === 'light' ? 'text-rose-600' : 'text-rose-400',
    },
    info: {
      bg: theme === 'light' ? 'bg-sky-50' : 'bg-sky-950/30',
      border: theme === 'light' ? 'border-sky-200' : 'border-sky-800/50',
      text: theme === 'light' ? 'text-sky-900' : 'text-sky-100',
      accent: theme === 'light' ? 'text-sky-600' : 'text-sky-400',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider ${styles.accent} mb-1`}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${styles.text} font-mono`}>
              {value}
            </p>
            {trend && (
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {formatMetric(Math.abs(trend.value))}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-xs mt-1 ${styles.accent}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`${styles.accent} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
