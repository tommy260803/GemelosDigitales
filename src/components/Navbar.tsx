import React, { useState } from 'react';
import { 
  Activity, 
  GitMerge, 
  Layers, 
  Scale, 
  CheckCircle2, 
  FileText, 
  Code2, 
  MapPin, 
  Download,
  Sparkles,
  Globe,
  Map,
  TrendingUp,
  Upload,
  Shield,
  FileCode2,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  LogOut,
  BarChart3
} from 'lucide-react';
import { DistrictData, Country, UserProfile } from '../types';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../context/ApiContext';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedDistrict: DistrictData;
  onDistrictChange: (district: DistrictData) => void;
  districtsList?: DistrictData[];
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  onOpenDHSImport: () => void;
  onOpenCopilot: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportWord: () => void;
  onRefreshDistricts?: () => void;
  isRefreshing?: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedDistrict,
  onDistrictChange,
  districtsList = [],
  currentUser,
  onOpenAuthModal,
  onOpenDHSImport,
  onOpenCopilot,
  onExportPDF,
  onExportExcel,
  onExportWord,
  onRefreshDistricts,
  isRefreshing = false,
  onToggleSidebar,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { apiAvailable } = useApi();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const countries: Country[] = ['Kenya', 'Tanzania', 'Uganda', 'Ghana', 'Ethiopia'];

  const navGroups = [
    {
      label: language === 'es' ? 'EXPLORAR' : 'EXPLORE',
      items: [
        { id: 'dashboard', label: t.tabDashboard, icon: Activity },
        { id: 'gis-map', label: t.tabGISMap, icon: Map },
        { id: 'multi-year', label: t.tabMultiYear, icon: TrendingUp },
      ],
    },
    {
      label: language === 'es' ? 'ANALIZAR' : 'ANALYZE',
      items: [
        { id: 'causal-model', label: t.tabCausal, icon: GitMerge },
        { id: 'scenarios', label: t.tabScenarios, icon: Layers },
        { id: 'equity', label: t.tabEquity, icon: Scale },
        { id: 'validation', label: t.tabValidation, icon: CheckCircle2 },
      ],
    },
    {
      label: language === 'es' ? 'ENTREGABLES' : 'OUTPUTS',
      items: [
        { id: 'reports', label: t.tabReports, icon: FileText },
        { id: 'code-arch', label: t.tabCodeArch, icon: Code2 },
      ],
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-[72px]'
      } ${theme === 'light' 
        ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50' 
        : 'bg-[#0a0d14] border-slate-800/80 shadow-2xl shadow-black/50'
      }`}
    >
      {/* Logo & Branding */}
      <div className={`flex items-center h-16 px-4 border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-800/60'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold shrink-0 ${
          theme === 'light'
            ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30'
            : 'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/20'
        }`}>
          <Activity className="w-5 h-5" />
        </div>
        {isExpanded && (
          <div className="ml-3 min-w-0 overflow-hidden">
            <h1 className={`font-bold tracking-tight text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {t.appTitle}<span className="text-sky-500">AI</span>
            </h1>
            <p className={`text-[10px] font-mono truncate ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.protocolVersion} • {apiAvailable ? 'Python' : 'Local'}
            </p>
          </div>
        )}
      </div>

      {/* District Selector */}
      <div className={`px-3 py-3 border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-800/60'}`}>
        {isExpanded ? (
          <div className={`flex items-center rounded-xl px-3 py-2.5 text-sm border ${
            theme === 'light'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/50 border-slate-800'
          }`}>
            <MapPin className={`w-4 h-4 mr-2 shrink-0 ${
              theme === 'light' ? 'text-sky-600' : 'text-sky-400'
            }`} />
            <select
              value={selectedDistrict?.id || ''}
              onChange={(e) => {
                const d = districtsList.find((item) => item?.id === e.target.value);
                if (d) onDistrictChange(d);
              }}
              className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer truncate w-full ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              {countries.map((c) => {
                const inCountry = districtsList.filter((d) => d && d.country === c);
                if (inCountry.length === 0) return null;
                return (
                  <optgroup key={c} label={`${c.toUpperCase()}`}>
                    {inCountry.map((dist) => dist && (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className={`w-full h-10 rounded-xl flex items-center justify-center border transition-colors ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-sky-500" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {isExpanded ? (
              <p className={`mb-2 px-3 text-[10px] font-bold tracking-[0.2em] ${
                theme === 'light' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {group.label}
              </p>
            ) : (
              <div className={`mx-auto w-8 h-px mb-2 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`} />
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`group w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                      isExpanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'
                    } ${
                      isActive
                        ? theme === 'light'
                          ? 'bg-sky-50 text-sky-700 shadow-sm'
                          : 'bg-sky-500/10 text-sky-400 shadow-lg shadow-sky-500/5'
                        : theme === 'light'
                        ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    {isActive && !isExpanded && (
                      <div className="absolute left-0 w-1 h-6 bg-sky-500 rounded-r-full" />
                    )}
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sky-500' : ''}`} />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                    {isExpanded && isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`border-t px-3 py-3 space-y-1 ${theme === 'light' ? 'border-slate-100' : 'border-slate-800/60'}`}>
        {/* Quick Actions Row */}
        <div className={`flex items-center gap-1 rounded-xl p-1 ${
          theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/50'
        }`}>
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-white hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Cambiar idioma"
          >
            <Globe className="w-3.5 h-3.5" />
            {isExpanded && <span>{language === 'es' ? 'ES' : 'EN'}</span>}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-white hover:text-slate-900'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {isExpanded && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
          </button>
        </div>

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className={`w-full flex items-center gap-2.5 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              isExpanded ? 'px-3' : 'justify-center px-0'
            } ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-50'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <Download className="w-4 h-4" />
            {isExpanded && <span>{language === 'es' ? 'Exportar' : 'Export'}</span>}
          </button>
          {isExportOpen && isExpanded && (
            <div className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-xl py-1 z-50 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
            }`}>
              <button
                onClick={() => { onExportPDF(); setIsExportOpen(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => { onExportWord(); setIsExportOpen(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <FileCode2 className="w-4 h-4 text-blue-500" />
                <span>Word</span>
              </button>
              <button
                onClick={() => { onExportExcel(); setIsExportOpen(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Excel</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center gap-2.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
            isExpanded ? 'px-3' : 'justify-center px-0'
          } bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20`}
        >
          <Sparkles className="w-4 h-4" />
          {isExpanded && <span>{t.aiCopilotBtn}</span>}
        </button>

        {/* User Profile */}
        <button
          onClick={onOpenAuthModal}
          className={`w-full flex items-center gap-2.5 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            isExpanded ? 'px-3' : 'justify-center px-0'
          } ${
            theme === 'light'
              ? 'text-slate-600 hover:bg-slate-50'
              : 'text-slate-400 hover:bg-slate-800/50'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            currentUser?.role === 'INVESTIGATOR'
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
              : currentUser?.role === 'HEALTH_OFFICER'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            <Shield className="w-4 h-4" />
          </div>
          {isExpanded && (
            <div className="flex-1 text-left min-w-0">
              <p className={`text-xs font-semibold truncate ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                {currentUser?.name}
              </p>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentUser?.role === 'INVESTIGATOR' ? 'Investigador' : currentUser?.role === 'HEALTH_OFFICER' ? 'DHO' : 'Policymaker'}
              </p>
            </div>
          )}
        </button>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition-colors ${
            theme === 'light'
              ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Settings className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-90'}`} />
          {isExpanded && <span>{language === 'es' ? 'Colapsar' : 'Collapse'}</span>}
        </button>
      </div>
    </aside>
  );
};
