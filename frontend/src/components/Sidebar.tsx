import React from 'react';
import {
  Activity,
  CheckCircle2,
  Code2,
  FileText,
  GitMerge,
  Layers,
  Map,
  Scale,
  TrendingUp,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const navTabs = [
    { id: 'dashboard', label: t.tabDashboard, icon: Activity, dot: 'bg-sky-500' },
    { id: 'gis-map', label: t.tabGISMap, icon: Map, dot: 'bg-emerald-500' },
    { id: 'multi-year', label: t.tabMultiYear, icon: TrendingUp, dot: 'bg-amber-500' },
    { id: 'causal-model', label: t.tabCausal, icon: GitMerge, dot: 'bg-slate-500' },
    { id: 'scenarios', label: t.tabScenarios, icon: Layers, dot: 'bg-indigo-500' },
    { id: 'equity', label: t.tabEquity, icon: Scale, dot: 'bg-cyan-500' },
    { id: 'validation', label: t.tabValidation, icon: CheckCircle2, dot: 'bg-emerald-500' },
    { id: 'reports', label: t.tabReports, icon: FileText, dot: 'bg-amber-500' },
    { id: 'code-arch', label: t.tabCodeArch, icon: Code2, dot: 'bg-slate-400' },
  ];

  const groups = [
    { label: language === 'es' ? 'EXPLORAR' : 'EXPLORE', ids: ['dashboard', 'gis-map', 'multi-year'] },
    { label: language === 'es' ? 'ANALIZAR' : 'ANALYZE', ids: ['causal-model', 'scenarios', 'equity', 'validation'] },
    { label: language === 'es' ? 'ENTREGABLES' : 'OUTPUTS', ids: ['reports', 'code-arch'] },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label={language === 'es' ? 'Cerrar navegación' : 'Close navigation'}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r pt-16 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0 lg:pt-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${theme === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#10141b]'}`}
      >
        <div className="flex items-center justify-between border-b border-inherit px-5 py-4 lg:hidden">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {language === 'es' ? 'Navegación' : 'Navigation'}
          </span>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label={language === 'es' ? 'Navegación principal' : 'Main navigation'}>
          {groups.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 font-mono text-[10px] font-bold tracking-[0.2em] text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.ids.map((id) => {
                  const tab = navTabs.find((item) => item.id === id)!;
                  const Icon = tab.icon;
                  const active = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { onTabChange(tab.id); onClose(); }}
                      className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left font-mono text-xs transition-colors ${
                        active
                          ? theme === 'light'
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-sky-900/70 bg-sky-500/10 text-sky-400'
                          : theme === 'light'
                            ? 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${tab.dot} ${active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`border-t border-inherit px-5 py-4 font-mono text-[10px] uppercase tracking-wider ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="mb-1 block text-emerald-500">● {language === 'es' ? 'Sistema operativo' : 'System online'}</span>
          {language === 'es' ? 'Panel de salud materna' : 'Maternal health panel'}
        </div>
      </aside>
    </>
  );
};
