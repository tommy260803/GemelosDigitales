import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className = '',
}) => {
  const { theme } = useTheme();

  const variantStyles = {
    default: {
      bg: theme === 'light' ? 'bg-slate-100' : 'bg-slate-800',
      text: theme === 'light' ? 'text-slate-700' : 'text-slate-300',
      border: theme === 'light' ? 'border-slate-200' : 'border-slate-700',
    },
    success: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
    },
    danger: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
    },
    info: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
    },
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const styles = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full border
        ${styles.bg} ${styles.text} ${styles.border}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
