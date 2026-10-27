import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StartupAnimation from './components/StartupAnimation';
import InvestigationStudioPage from './pages/InvestigationStudioPage';
import CasesPage from './pages/CasesPage';
import InsightsPage from './pages/InsightsPage';
import SafetyCenterPage from './pages/SafetyCenterPage';
import SettingsPage from './pages/SettingsPage';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { getInvestigation, listInvestigations, getHealthStatus } from './services/api';

function AppContent() {
  const [activeTab, setActiveTab] = useState('investigate');
  const [currentReport, setCurrentReport] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [h, cases] = await Promise.all([
          getHealthStatus().catch(() => null),
          listInvestigations(1).catch(() => [])
        ]);
        setHealthStatus(h);
        if (cases && cases.length > 0) {
          const latestCase = await getInvestigation(cases[0].case_id).catch(() => null);
          if (latestCase) setCurrentReport(latestCase);
        }
      } catch (e) {
        console.error('Initialization error', e);
      }
    }
    init();
  }, []);

  const handleOpenCase = (report) => {
    setCurrentReport(report);
    setActiveTab('investigate');
  };

  const handleNewInvestigation = () => {
    setActiveTab('investigate');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans">
      {/* 1.5s Skippable Startup Animation */}
      <StartupAnimation />

      {/* Top Application Bar with Language Selector */}
      <Navbar
        currentCaseId={currentReport?.case_id}
        onNewInvestigation={handleNewInvestigation}
        healthStatus={healthStatus}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Desktop) + Mobile Bottom Tab Bar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'investigate' && (
              <InvestigationStudioPage
                currentReport={currentReport}
                onReportGenerated={(rep) => setCurrentReport(rep)}
              />
            )}

            {activeTab === 'cases' && (
              <CasesPage
                onSelectCase={handleOpenCase}
              />
            )}

            {activeTab === 'insights' && (
              <InsightsPage />
            )}

            {activeTab === 'safety' && (
              <SafetyCenterPage />
            )}

            {activeTab === 'settings' && (
              <SettingsPage />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}
