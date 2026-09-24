import React, { useState, useMemo, useEffect } from 'react';
import { DistrictData, SimulationResult, ValidationMetrics, UserProfile, JWTSession } from './types';
import { Menu, Sparkles, Activity, RefreshCw } from 'lucide-react';
import { ReportGenerationService } from './services/reporting';
import { AuthService } from './services/auth';
import { LanguageProvider, useLanguage } from './i18n/translations';
import { ThemeProvider } from './context/ThemeContext';
import { ApiProvider, useApi } from './context/ApiContext';
import { ToastProvider, useToast } from './components/ui/Toast';

import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GeospatialMapView } from './components/GeospatialMapView';
import { MultiYearProjectionView } from './components/MultiYearProjectionView';
import { CausalLoopView } from './components/CausalLoopView';
import { ScenariosView } from './components/ScenariosView';
import { EquityView } from './components/EquityView';
import { ValidationView } from './components/ValidationView';
import { ReportsView } from './components/ReportsView';
import { CodeArchitectureView } from './components/CodeArchitectureView';
import { AICopilotModal } from './components/AICopilotModal';
import { AuthModal } from './components/AuthModal';
import { DHSImportModal } from './components/DHSImportModal';

function AppContent() {
  const { t } = useLanguage();
  const { apiAvailable, apiResults, refreshApiData } = useApi();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [districtsList, setDistrictsList] = useState<DistrictData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d'>('baseline');

  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDHSImportOpen, setIsDHSImportOpen] = useState<boolean>(false);

  // RBAC and JWT Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => AuthService.getCurrentProfile());
  const [currentSession, setCurrentSession] = useState<JWTSession>(() => AuthService.getCurrentSession());
  const [isRefreshingDistricts, setIsRefreshingDistricts] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);


  // Refresh districts from FastAPI
  const handleRefreshDistricts = async () => {
    setIsRefreshingDistricts(true);
    try {
      const ApiClient = await import('./services/api');
      const data = await ApiClient.fetchDistricts();
      if (data && data.length > 0) {
        const fullData = data as DistrictData[];
        setDistrictsList(fullData);
        setSelectedDistrict(prev => fullData.find(d => d.id === prev?.id) || fullData[0]);
        toast({ message: 'Distritos sincronizados', description: `${fullData.length} territorios cargados desde FastAPI`, variant: 'success' });
      }
    } catch (e) {
      console.warn("Error refreshing districts:", e);
      toast({ message: 'Error de conexión', description: 'No se pudo contactar con FastAPI (puerto 8000)', variant: 'error' });
    } finally {
      setIsRefreshingDistricts(false);
    }
  };

  // Load live districts from Python backend
  useEffect(() => {
    import('./services/api').then(ApiClient => {
      ApiClient.fetchDistricts().then(data => {
        if (data && data.length > 0) {
          const fullData = data as DistrictData[];
          setDistrictsList(fullData);
          setSelectedDistrict(prev => fullData.find(d => d.id === prev?.id) || fullData[0]);
        }
      }).catch(e => console.warn("Backend unavailable:", e));
    });
  }, []);

  // Refresh API data when district changes
  useEffect(() => {
    if (selectedDistrict) refreshApiData(selectedDistrict);
  }, [selectedDistrict, refreshApiData]);

  // Pre-calculate all simulation results (use API if available, else local)
  const allResults: Record<string, SimulationResult> = useMemo(() => {
    if (apiAvailable && Object.keys(apiResults).length > 0) {
      return apiResults;
    }
    return {};
  }, [apiAvailable, apiResults]);

  const validationMetrics: ValidationMetrics = useMemo(() => {
    // Validation endpoints intentionally return no scientific metrics until a
    // documented empirical protocol is configured.
    return {} as ValidationMetrics;
  }, []);

  const handleExportPDF = () => {
    try {
      ReportGenerationService.generateExecutivePDF(selectedDistrict!, allResults, validationMetrics);
      toast({ message: 'Informe PDF generado', description: `Descarga lista para ${selectedDistrict?.name}`, variant: 'success' });
    } catch (err) {
      toast({ message: 'Error al exportar PDF', variant: 'error' });
    }
  };

  const handleExportWord = () => {
    try {
      ReportGenerationService.generateWordReport(selectedDistrict!, allResults, validationMetrics);
      toast({ message: 'Documento Word generado', description: `Descarga lista para ${selectedDistrict?.name}`, variant: 'success' });
    } catch (err) {
      toast({ message: 'Error al exportar Word', variant: 'error' });
    }
  };

  const handleExportExcel = () => {
    try {
      ReportGenerationService.generateExcelReport(selectedDistrict!, allResults, validationMetrics);
      toast({ message: 'Libro Excel generado', description: `Descarga lista para ${selectedDistrict?.name}`, variant: 'success' });
    } catch (err) {
      toast({ message: 'Error al exportar Excel', variant: 'error' });
    }
  };

  const handleUpdateAuthSession = (profile: UserProfile, session: JWTSession) => {
    setCurrentUser(profile);
    setCurrentSession(session);
  };

  if (!selectedDistrict) {
    return (
      <div className="min-h-screen bg-[#0c0e12] text-slate-300 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-5 shadow-lg shadow-sky-500/10">
          <Activity className="w-8 h-8 text-sky-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">Gemelo Digital Materno</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Conectando con el motor diferencial RK4 (FastAPI · puerto 8000) y cargando los 25 distritos territoriales subsaharianos...
        </p>
        <button
          onClick={handleRefreshDistricts}
          disabled={isRefreshingDistricts}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-sky-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshingDistricts ? 'animate-spin' : ''}`} />
          {isRefreshingDistricts ? 'Conectando...' : 'Reintentar Conexión'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 font-sans selection:bg-sky-500 selection:text-slate-950 flex flex-col lg:flex-row">

      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0a0d14] border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
            aria-label="Abrir navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Gemelo Digital</h1>
              <p className="text-xs text-sky-400 font-mono font-medium truncate max-w-[150px]">{selectedDistrict.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs">Copilot</span>
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        districtsList={districtsList}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenDHSImport={() => setIsDHSImportOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onExportWord={handleExportWord}
        onRefreshDistricts={handleRefreshDistricts}
        isRefreshing={isRefreshingDistricts}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded(!isSidebarExpanded)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ml-0 ${isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-[72px]'
        }`}>
        {/* Main View Container */}
        <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10 overflow-y-auto w-full">
          <div key={currentTab} className="tab-content-enter">
            {currentTab === 'dashboard' && (
              <DashboardView
                district={selectedDistrict}
                activeScenarioId={activeScenarioId}
                onScenarioChange={setActiveScenarioId}
                onOpenCopilot={() => setIsCopilotOpen(true)}
                simulationResult={allResults[activeScenarioId]}
              />
            )}

            {currentTab === 'gis-map' && (
              <GeospatialMapView
                districtsList={districtsList}
                selectedDistrict={selectedDistrict}
                selectedDistrictId={selectedDistrict.id}
                onSelectDistrict={(district) => setSelectedDistrict(district)}
              />
            )}

            {currentTab === 'multi-year' && (
              <MultiYearProjectionView district={selectedDistrict} />
            )}

            {currentTab === 'causal-model' && (
              <CausalLoopView district={selectedDistrict} />
            )}

            {currentTab === 'scenarios' && (
              <ScenariosView
                district={selectedDistrict}
                activeScenarioId={activeScenarioId}
                onSelectScenario={setActiveScenarioId}
                results={allResults}
              />
            )}

            {currentTab === 'equity' && (
              <EquityView
                district={selectedDistrict}
                activeScenarioId={activeScenarioId}
                simulationResult={allResults[activeScenarioId]}
              />
            )}

            {currentTab === 'validation' && (
              <ValidationView district={selectedDistrict} />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                district={selectedDistrict}
                allResults={allResults}
              />
            )}

            {currentTab === 'code-arch' && (
              <CodeArchitectureView />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-3 mt-auto">
          <div className="w-full px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 font-mono gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t.footerEngine}
              </span>
              <span className="text-slate-700">|</span>
              <span>{t.footerProtocol}</span>
              <span className="text-slate-700">|</span>
              <span className="text-sky-400">{t.footerCalibration}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
              <span>{t.footerDistricts} ({districtsList.length} Distritos activos)</span>
              <span className="text-slate-700">•</span>
              <span>{t.footerTelemetry}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Epidemiologist Copilot Modal */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedDistrict={selectedDistrict}
        activeScenarioId={activeScenarioId}
      />

      {/* Auth & RBAC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentProfile={currentUser}
        currentSession={currentSession}
        onUpdateSession={handleUpdateAuthSession}
      />

      <DHSImportModal
        isOpen={isDHSImportOpen}
        onClose={() => setIsDHSImportOpen(false)}
        onImportDistrict={() => { }}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ApiProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ApiProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
