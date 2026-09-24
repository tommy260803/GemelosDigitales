import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline' | 'live';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  /** If true, shows an animated pulse dot before content (useful for live/realtime indicators) */
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className = '',
  pulse = false,
}) => {
  const { theme } = useTheme();

  const variantStyles: Record<string, { bg: string; text: string; border: string; dot?: string }> = {
    default: {
      bg:     theme === 'light' ? 'bg-slate-100'  : 'bg-slate-800',
      text:   theme === 'light' ? 'text-slate-700' : 'text-slate-300',
      border: theme === 'light' ? 'border-slate-200' : 'border-slate-700',
    },
    success: {
      bg:     'bg-emerald-500/10',
      text:   'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      dot:    'bg-emerald-500',
    },
    warning: {
      bg:     'bg-amber-500/10',
      text:   'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
      dot:    'bg-amber-500',
    },
    danger: {
      bg:     'bg-rose-500/10',
      text:   'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      dot:    'bg-rose-500',
    },
    info: {
      bg:     'bg-sky-500/10',
      text:   'text-sky-600 dark:text-sky-400',
      border: 'border-sky-500/20',
      dot:    'bg-sky-500',
    },
    purple: {
      bg:     'bg-purple-500/10',
      text:   'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
      dot:    'bg-purple-500',
    },
    outline: {
      bg:     'bg-transparent',
      text:   theme === 'light' ? 'text-slate-700' : 'text-slate-300',
      border: theme === 'light' ? 'border-slate-400' : 'border-slate-500',
    },
    live: {
      bg:     'bg-emerald-500/10',
      text:   'text-emerald-400',
      border: 'border-emerald-500/30',
      dot:    'bg-emerald-400',
    },
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const s = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full border
        ${s.bg} ${s.text} ${s.border}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {(pulse || variant === 'live') && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.dot || 'bg-current'}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${s.dot || 'bg-current'}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
