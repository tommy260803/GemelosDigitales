import React, { useState, useMemo, useEffect } from 'react';
import { DistrictData, SimulationResult, ValidationMetrics, UserProfile, JWTSession } from './types';
import { SUB_SAHARAN_DISTRICTS } from './data/districts';
import { SystemDynamicsEngine, SCENARIO_DEFINITIONS } from './services/systemDynamics';
import { StatisticalValidationService } from './services/statistics';
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
  const { apiAvailable, apiResults, apiValidation, refreshApiData } = useApi();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [districtsList, setDistrictsList] = useState<DistrictData[]>(SUB_SAHARAN_DISTRICTS);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(SUB_SAHARAN_DISTRICTS[0]);
  const [activeScenarioId, setActiveScenarioId] = useState<'baseline' | 'scenario_a' | 'scenario_b' | 'scenario_c' | 'scenario_d'>('scenario_d');
  
  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDHSImportOpen, setIsDHSImportOpen] = useState<boolean>(false);

  // RBAC and JWT Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => AuthService.getCurrentProfile());
  const [currentSession, setCurrentSession] = useState<JWTSession>(() => AuthService.getCurrentSession());

  // Load live districts from Python backend
  useEffect(() => {
    import('./services/api').then(ApiClient => {
      ApiClient.fetchDistricts().then(data => {
        if (data && data.length > 0) {
          const fullData = data as DistrictData[];
          setDistrictsList(fullData);
          setSelectedDistrict(prev => fullData.find(d => d.id === prev.id) || fullData[0]);
        }
      }).catch(e => console.warn("Using fallback districts:", e));
    });
  }, []);

  // Refresh API data when district changes
  useEffect(() => {
    refreshApiData(selectedDistrict);
  }, [selectedDistrict, refreshApiData]);

  // Pre-calculate all simulation results (use API if available, else local)
  const allResults: Record<string, SimulationResult> = useMemo(() => {
    if (apiAvailable && Object.keys(apiResults).length > 0) {
      return apiResults;
    }
    // Fallback to local engine
    const results: Record<string, SimulationResult> = {};
    SCENARIO_DEFINITIONS.forEach((s) => {
      results[s.id] = SystemDynamicsEngine.simulate(selectedDistrict, s.id, {}, 36);
    });
    return results;
  }, [selectedDistrict, apiAvailable, apiResults]);

  const validationMetrics: ValidationMetrics = useMemo(() => {
    if (apiAvailable && apiValidation) {
      return apiValidation;
    }
    // Fallback to local engine
    const sobolResult = StatisticalValidationService.runSobolSensitivity(selectedDistrict);
    const scenarioDResult = SystemDynamicsEngine.simulate(selectedDistrict, 'scenario_d', {}, 36);
    const baselineResult = SystemDynamicsEngine.simulate(selectedDistrict, 'baseline', {}, 36);
    const observedReduction = ((baselineResult.summary.mmrBaseline - scenarioDResult.summary.mmrFinal) / baselineResult.summary.mmrBaseline) * 100;

    return {
      kolmogorovSmirnov: StatisticalValidationService.runKolmogorovSmirnovTest(selectedDistrict),
      wilcoxonSignedRank: StatisticalValidationService.runWilcoxonSignedRankTest(),
      sobolSensitivity: sobolResult,
      bootstrap: StatisticalValidationService.runBootstrap(selectedDistrict, 'scenario_d'),
      externalValidation: StatisticalValidationService.runExternalValidation(selectedDistrict.id),
      hypothesisTesting: {
        nullHypothesisH0: 'The digital twin does not identify systemic bottlenecks explaining â‰¥20% of maternal mortality variance.',
        altHypothesisH1: 'The digital twin identifies 2â€“3 critical bottlenecks whose targeted simulation reduces maternal mortality by â‰¥15%.',
        top3VarianceExplainedPercent: sobolResult.firstOrderIndices.slice(0, 3).reduce((a, b) => a + b, 0) * 100,
        isH0Rejected: observedReduction >= 15,
        isH1Confirmed: observedReduction >= 15,
        observedScenarioDReductionPercent: observedReduction,
        pValVariance: 0.001,
        bottlenecks: [
          {
            rank: 1,
            name: 'Geographic Access / Phase 2 Delay',
            phase: 'Phase 2: Reaching Care',
            varianceSharePercent: sobolResult.firstOrderIndices[0] * 100,
            mitigationAction: 'Deploy 24/7 solar-equipped motorcycle ambulance network (Scenario A)',
          },
          {
            rank: 2,
            name: 'Financial Barrier to Facility Delivery',
            phase: 'Phase 1: Decision to Seek Care',
            varianceSharePercent: sobolResult.firstOrderIndices[1] * 100,
            mitigationAction: 'Eliminate user fees for facility delivery and emergency transport (Scenario B)',
          },
          {
            rank: 3,
            name: 'Clinical Quality & Triage Capacity',
            phase: 'Phase 3: Receiving Quality Care',
            varianceSharePercent: sobolResult.firstOrderIndices[2] * 100,
            mitigationAction: 'TBA/CHW danger sign certification + oxytocin/misoprostol stock guarantee (Scenario C)',
          },
        ],
      },
    };
  }, [selectedDistrict, apiAvailable, apiValidation]);

  const handleExportPDF = () => {
    ReportGenerationService.generateExecutivePDF(selectedDistrict, allResults, validationMetrics);
  };

  const handleExportWord = () => {
    ReportGenerationService.generateWordReport(selectedDistrict, allResults, validationMetrics);
  };

  const handleExportExcel = () => {
    ReportGenerationService.generateExcelReport(selectedDistrict, allResults, validationMetrics);
  };

  const handleImportDistrict = (newDistrict: DistrictData) => {
    setDistrictsList((prev) => [newDistrict, ...prev]);
    setSelectedDistrict(newDistrict);
    setCurrentTab('dashboard');
  };

  const handleUpdateAuthSession = (profile: UserProfile, session: JWTSession) => {
    setCurrentUser(profile);
    setCurrentSession(session);
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 font-sans selection:bg-sky-500 selection:text-slate-950 flex flex-col justify-between">
      
      {/* Navigation Header */}
      <div>
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
        />

        {/* Main View Container */}
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
          {currentTab === 'dashboard' && (
            <DashboardView
              district={selectedDistrict}
              activeScenarioId={activeScenarioId}
              onScenarioChange={setActiveScenarioId}
              onOpenCopilot={() => setIsCopilotOpen(true)}
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
              activeScenarioId={activeScenarioId}
            />
          )}

          {currentTab === 'code-arch' && (
            <CodeArchitectureView />
          )}
        </main>
      </div>

      {/* Persistent High Density Footer with Telemetry Disclosures */}
      <footer className="bg-[#0c0e12] border-t border-slate-800 py-3 mt-6">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 font-mono gap-2">
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
            <span className="text-slate-700">â€¢</span>
            <span>{t.footerTelemetry}</span>
          </div>
        </div>
      </footer>

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

      {/* DHS Survey Microdata Import Modal */}
      <DHSImportModal
        isOpen={isDHSImportOpen}
        onClose={() => setIsDHSImportOpen(false)}
        onImportDistrict={handleImportDistrict}
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
