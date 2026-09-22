import React, { useState, useMemo, useEffect } from 'react';
import { DistrictData, SimulationResult, ValidationMetrics, UserProfile, JWTSession } from './types';
import { ReportGenerationService } from './services/reporting';
import { AuthService } from './services/auth';
import { LanguageProvider, useLanguage } from './i18n/translations';
import { ThemeProvider } from './context/ThemeContext';
import { ApiProvider, useApi } from './context/ApiContext';

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
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [districtsList, setDistrictsList] = useState<DistrictData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d'>('scenario_d');
  
  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDHSImportOpen, setIsDHSImportOpen] = useState<boolean>(false);

  // RBAC and JWT Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => AuthService.getCurrentProfile());
  const [currentSession, setCurrentSession] = useState<JWTSession>(() => AuthService.getCurrentSession());
  const [isRefreshingDistricts, setIsRefreshingDistricts] = useState(false);


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
      }
    } catch (e) {
      console.warn("Error refreshing districts:", e);
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
    ReportGenerationService.generateExecutivePDF(selectedDistrict, allResults, validationMetrics);
  };

  const handleExportWord = () => {
    ReportGenerationService.generateWordReport(selectedDistrict, allResults, validationMetrics);
  };

  const handleExportExcel = () => {
    ReportGenerationService.generateExcelReport(selectedDistrict, allResults, validationMetrics);
  };

  const handleUpdateAuthSession = (profile: UserProfile, session: JWTSession) => {
    setCurrentUser(profile);
    setCurrentSession(session);
  };

  if (!selectedDistrict) {
    return <div className="min-h-screen bg-[#0c0e12] text-slate-300 grid place-items-center font-mono">Backend unavailable or territorial data are loading.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 font-sans selection:bg-sky-500 selection:text-slate-950 flex">
      
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
        onToggleSidebar={() => {}}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col ml-64">
        {/* Main View Container */}
        <main className="flex-1 px-6 py-6 lg:px-8 xl:px-10">
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
            <div className="flex items-center space-x-3 text-[10px] text-slate-500">
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
        onImportDistrict={() => {}}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ApiProvider>
          <AppContent />
        </ApiProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
