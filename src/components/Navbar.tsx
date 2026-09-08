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
  AlertTriangle,
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
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { DistrictData, Country, UserProfile } from '../types';
import { SUB_SAHARAN_DISTRICTS } from '../data/districts';
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedDistrict,
  onDistrictChange,
  districtsList = SUB_SAHARAN_DISTRICTS,
  currentUser,
  onOpenAuthModal,
  onOpenDHSImport,
  onOpenCopilot,
  onExportPDF,
  onExportExcel,
  onExportWord,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { apiAvailable } = useApi();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const countries: Country[] = ['Kenya', 'Tanzania', 'Uganda', 'Ghana', 'Ethiopia'];
  const isHighRiskDistrict = selectedDistrict?.baselineMMR >= 500;

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

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
      theme === 'light'
        ? 'bg-white/95 border-slate-200 shadow-sm text-slate-900'
        : 'bg-[#0c0e12]/95 border-slate-800 shadow-sm text-white'
    }`}>
      {/* Top Banner */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-14 gap-2">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
              theme === 'light'
                ? 'bg-sky-50 border-sky-200 text-sky-600'
                : 'bg-slate-800 border-slate-700 text-sky-400'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="text-sky-600 dark:text-sky-400 font-bold tracking-tighter text-sm sm:text-base lg:text-lg uppercase whitespace-nowrap">
                  {t.appTitle}<span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>AI</span>
                </h1>
                <span className={`text-xs sm:text-xs px-1 sm:px-1.5 py-0.5 rounded font-mono uppercase tracking-widest border hidden sm:inline-block ${
                  theme === 'light'
                    ? 'bg-slate-100 text-slate-600 border-slate-300'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {t.protocolVersion}
                </span>
                <span className={`text-xs sm:text-xs px-1 sm:px-1.5 py-0.5 rounded font-mono uppercase tracking-widest border hidden sm:inline-block ${
                  apiAvailable === true
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : apiAvailable === false
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {apiAvailable === true ? 'ðŸ Python Engine' : apiAvailable === false ? 'âš¡ Local Engine' : 'â³ Checking...'}
                </span>
                {isHighRiskDistrict && (
                  <span className="hidden xl:inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold border border-rose-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {t.highRiskMMR}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-xs text-slate-500 font-mono hidden md:block truncate max-w-[280px] lg:max-w-none">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* District & Country Selector + Action Buttons + Language Toggle */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* District Selector */}
            <div className={`flex items-center border rounded px-1.5 sm:px-2 py-1 text-xs shadow-inner max-w-[135px] sm:max-w-[160px] sm:max-w-[200px] md:max-w-none ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-slate-800/90 border-slate-700 text-slate-200'
            }`}>
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 dark:text-sky-400 mr-1 sm:mr-1.5 shrink-0" />
              <select
                id="district-selector"
                value={selectedDistrict?.id || ''}
                onChange={(e) => {
                  const d = districtsList.find((item) => item?.id === e.target.value);
                  if (d) onDistrictChange(d);
                }}
                className={`bg-transparent text-sm sm:text-xs font-mono font-bold focus:outline-none cursor-pointer truncate w-full pr-1 ${
                  theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                }`}
                aria-label={t.selectDistrict}
              >
                {countries.map((c) => {
                  const inCountry = districtsList.filter((d) => d && d.country === c);
                  if (inCountry.length === 0) return null;
                  return (
                    <optgroup
                      key={c}
                      label={`â€” ${c.toUpperCase()} â€”`}
                      className={theme === 'light' ? 'bg-white text-slate-900 font-bold' : 'bg-[#0c0e12] text-slate-200'}
                    >
                      {inCountry.map((dist) => dist && (
                        <option
                          key={dist.id}
                          value={dist.id}
                          className={theme === 'light' ? 'bg-white text-slate-800' : 'bg-[#0c0e12] text-slate-200'}
                        >
                          {dist.name} (MMR: {dist.baselineMMR})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                {/* Custom uploaded districts group if any */}
                {districtsList.some((d) => d?.id?.startsWith('custom-')) && (
                  <optgroup
                    label="â€” DISTRITOS PERSONALIZADOS DHS â€”"
                    className={theme === 'light' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'bg-[#0c0e12] text-emerald-300 font-bold'}
                  >
                    {districtsList.filter((d) => d?.id?.startsWith('custom-')).map((dist) => dist && (
                      <option
                        key={dist.id}
                        value={dist.id}
                        className={theme === 'light' ? 'bg-white text-emerald-700' : 'bg-[#0c0e12] text-emerald-300'}
                      >
                        â­ {dist.name} ({dist.country})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Import DHS Button (Desktop) */}
            <button
              id="btn-import-dhs"
              onClick={onOpenDHSImport}
              title={t.importDHS}
              className={`hidden xl:flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono border cursor-pointer transition shrink-0 ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>{t.importDHS}</span>
            </button>

            {/* Language Switcher Toggle (ES / EN) */}
            <div 
              id="language-selector-group"
              className={`flex items-center border rounded p-0.5 shadow-inner shrink-0 ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300'
                  : 'bg-[#0c0e12] border-slate-700'
              }`}
              title="Cambiar idioma / Switch language"
            >
              <div className="hidden xs:block px-1 text-slate-400">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 dark:text-sky-400" />
              </div>
              <button
                id="btn-lang-es"
                onClick={() => setLanguage('es')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-xs sm:text-sm font-mono font-bold uppercase transition-all cursor-pointer ${
                  language === 'es'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ES
              </button>
              <button
                id="btn-lang-en"
                onClick={() => setLanguage('en')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-xs sm:text-sm font-mono font-bold uppercase transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className={`flex items-center space-x-1 px-1.5 sm:px-2.5 py-1 rounded border transition shadow-inner cursor-pointer text-xs font-mono shrink-0 ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-800'
                  : 'bg-[#0c0e12] border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
              }`}
              aria-label={t.themeToggle}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden 2xl:inline text-xs text-slate-300 font-bold">{t.themeLight}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden 2xl:inline text-xs text-slate-800 font-bold">{t.themeDark}</span>
                </>
              )}
            </button>

            {/* AI Advisor Button */}
            <button
              id="btn-open-copilot"
              onClick={onOpenCopilot}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-sm sm:text-xs font-mono font-bold uppercase tracking-wider shadow-md shadow-sky-600/20 transition cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">{t.aiCopilotBtn}</span>
              <span className="sm:hidden">IA</span>
            </button>

            {/* Quick Export Menu (Desktop) */}
            <div className={`hidden lg:flex items-center space-x-1 border rounded p-0.5 shrink-0 ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-300'
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              <button
                id="btn-export-pdf-nav"
                onClick={onExportPDF}
                title={t.exportPDF}
                className={`px-1.5 sm:px-2 py-1 text-sm font-mono rounded transition flex items-center space-x-1 cursor-pointer ${
                  theme === 'light'
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                <span>PDF</span>
              </button>
              <button
                id="btn-export-word-nav"
                onClick={onExportWord}
                title={t.exportDOCX}
                className={`px-1.5 sm:px-2 py-1 text-sm font-mono rounded transition flex items-center space-x-1 cursor-pointer ${
                  theme === 'light'
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <FileCode2 className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                <span>Word</span>
              </button>
              <button
                id="btn-export-excel-nav"
                onClick={onExportExcel}
                title={t.exportXLSX}
                className={`px-1.5 sm:px-2 py-1 text-sm font-mono rounded transition flex items-center space-x-1 cursor-pointer ${
                  theme === 'light'
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Download className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>XLSX</span>
              </button>
            </div>

            {/* Quick Export Dropdown (Tablet / Mobile) */}
            <div className="relative lg:hidden">
              <button
                id="btn-export-dropdown-mobile"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className={`p-1.5 rounded border transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Exportar Reportes"
              >
                <Download className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              </button>

              {isExportDropdownOpen && (
                <div className={`absolute right-0 mt-1 w-36 rounded-lg shadow-xl border py-1 z-50 font-mono text-xs ${
                  theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}>
                  <button
                    onClick={() => { onExportPDF(); setIsExportDropdownOpen(false); }}
                    className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>PDF Brief</span>
                  </button>
                  <button
                    onClick={() => { onExportWord(); setIsExportDropdownOpen(false); }}
                    className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Word Report</span>
                  </button>
                  <button
                    onClick={() => { onExportExcel(); setIsExportDropdownOpen(false); }}
                    className="w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Excel Model</span>
                  </button>
                </div>
              )}
            </div>

            {/* RBAC Profile Badge (Desktop) */}
            <button
              id="btn-auth-rbac"
              onClick={onOpenAuthModal}
              className={`hidden sm:flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded border text-xs font-mono cursor-pointer transition shrink-0 ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="AutenticaciÃ³n y Roles RBAC"
            >
              <Shield className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span className={`text-xs font-bold hidden lg:inline truncate max-w-[100px] ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-300'
              }`}>
                {currentUser?.name?.split(' ')[0]}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-xs font-bold uppercase ${
                  currentUser?.role === 'INVESTIGATOR'
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                    : currentUser?.role === 'HEALTH_OFFICER'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                }`}
              >
                {currentUser?.role === 'INVESTIGATOR' ? 'INV' : currentUser?.role === 'HEALTH_OFFICER' ? 'DHO' : 'POL'}
              </span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded border sm:hidden transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              aria-label="Abrir menÃº de opciones"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* Mobile Expanded Drawer Menu */}
        {isMobileMenuOpen && (
          <div className={`sm:hidden p-3 border-t font-mono text-xs space-y-2.5 animate-in slide-in-from-top duration-150 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-500">SesiÃ³n &amp; Herramientas:</span>
              <button
                onClick={() => { onOpenAuthModal(); setIsMobileMenuOpen(false); }}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded border text-xs font-bold ${
                  theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                <span>Rol: {currentUser?.role === 'INVESTIGATOR' ? 'Investigador' : currentUser?.role === 'HEALTH_OFFICER' ? 'DHO' : 'Policymaker'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { onOpenDHSImport(); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-center space-x-1.5 p-2 rounded border font-bold text-xs ${
                  theme === 'light' ? 'bg-white border-slate-300 text-emerald-700' : 'bg-slate-800 border-slate-700 text-emerald-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t.importDHS}</span>
              </button>

              <button
                onClick={() => { onExportPDF(); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-center space-x-1.5 p-2 rounded border font-bold text-xs ${
                  theme === 'light' ? 'bg-white border-slate-300 text-rose-700' : 'bg-slate-800 border-slate-700 text-rose-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs - High Density Row with Horizontal Touch Scrolling */}
        <nav className={`flex space-x-1 overflow-x-auto py-1.5 scrollbar-none border-t touch-pan-x ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => {
                  onTabChange(tab.id);
                  if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? theme === 'light'
                      ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200 shadow-xs'
                      : 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sky-500' : tab.dot}`}></span>
                <span className="text-sm sm:text-xs">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
