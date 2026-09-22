import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
}) => {
  const { theme } = useTheme();

  return (
    <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-xl overflow-hidden ${className}`}>
      <div className={`px-5 py-4 border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-800/80'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};
