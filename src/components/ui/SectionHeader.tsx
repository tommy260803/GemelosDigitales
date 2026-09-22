import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className = '',
}) => {
  const { theme } = useTheme();

  return (
    <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className={`mt-0.5 ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              {badge}
              <h2 className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
