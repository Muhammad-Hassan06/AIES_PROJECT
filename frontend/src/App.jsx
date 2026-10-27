import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StartupAnimation from './components/StartupAnimation';
import CommandPaletteModal from './components/CommandPaletteModal';

// Pages
import InvestigationStudioPage from './pages/InvestigationStudioPage';
import CasesPage from './pages/CasesPage';
import AgentConsolePage from './pages/AgentConsolePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ThreatTrendsPage from './pages/ThreatTrendsPage';
import ModelsDataPage from './pages/ModelsDataPage';
import AwarenessAcademyPage from './pages/AwarenessAcademyPage';
import BatchComparePage from './pages/BatchComparePage';
import SafetyCenterPage from './pages/SafetyCenterPage';
import SettingsPage from './pages/SettingsPage';

import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { getInvestigation, listInvestigations, getHealthStatus } from './services/api';

function AppContent() {
  const [activeTab, setActiveTab] = useState('investigate');
  const [currentReport, setCurrentReport] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Check URL deep-linking on mount and history state
  useEffect(() => {
    async function handleDeepLink() {
      try {
        const path = window.location.pathname;
        const search = window.location.search;
        let targetCaseId = null;

        // Path-based deep link: /cases/CS-XXXX
        const match = path.match(/\/cases\/([A-Za-z0-9_-]+)/);
        if (match && match[1]) {
          targetCaseId = match[1];
        } else {
          // Query-based fallback: ?case=CS-XXXX
          const params = new URLSearchParams(search);
          if (params.get('case')) {
            targetCaseId = params.get('case');
          }
        }

        const [h, cases] = await Promise.all([
          getHealthStatus().catch(() => null),
          listInvestigations(50).catch(() => [])
        ]);
        setHealthStatus(h);
        setRecentCases(cases);

        if (targetCaseId) {
          const loadedCase = await getInvestigation(targetCaseId).catch(() => null);
          if (loadedCase) {
            setCurrentReport(loadedCase);
            setActiveTab('investigate');
            return;
          }
        }

        // If no deep link, load most recent case if available
        if (cases && cases.length > 0) {
          const latestCase = await getInvestigation(cases[0].case_id).catch(() => null);
          if (latestCase) setCurrentReport(latestCase);
        }
      } catch (e) {
        console.error('Initialization / deep-link error', e);
      }
    }

    handleDeepLink();

    // Listen to popstate (browser back/forward buttons)
    const onPopState = () => {
      const match = window.location.pathname.match(/\/cases\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        getInvestigation(match[1]).then(rep => {
          if (rep) {
            setCurrentReport(rep);
            setActiveTab('investigate');
          }
        });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCase = (report) => {
    setCurrentReport(report);
    setActiveTab('investigate');
    // Deep-link update without page reload
    if (report?.case_id) {
      window.history.pushState(null, '', `/cases/${report.case_id}`);
    }
  };

  const handleOpenCaseById = async (caseId) => {
    try {
      const rep = await getInvestigation(caseId);
      if (rep) {
        handleOpenCase(rep);
      }
    } catch (e) {
      console.error('Failed to open case by ID', e);
    }
  };

  const handleNewInvestigation = () => {
    setActiveTab('investigate');
    window.history.pushState(null, '', '/');
  };

  const handleRunScenario = (scenario) => {
    setActiveTab('investigate');
    // The studio will catch scenario selection or we can pass it
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans">
      {/* 1.5s Skippable Startup Animation */}
      <StartupAnimation />

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          setCommandPaletteOpen(false);
        }}
        onRunScenario={handleRunScenario}
        cases={recentCases}
        onOpenCaseById={handleOpenCaseById}
      />

      {/* Top Application Bar with Language Selector & Command Palette Trigger */}
      <Navbar
        currentCaseId={currentReport?.case_id}
        onNewInvestigation={handleNewInvestigation}
        healthStatus={healthStatus}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Cloud Backend Warning Banner if running on Vercel and backend is disconnected */}
      {healthStatus?.status !== 'healthy' && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-950 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold">⚠️ Cloud Backend Not Connected:</span>
            <span>Your frontend is running on Vercel, but no backend is linked yet.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded-md font-bold text-amber-900 cursor-pointer transition-colors shrink-0 ml-3"
          >
            Connect Render in Settings →
          </button>
        </div>
      )}

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
                onReportGenerated={(rep) => {
                  setCurrentReport(rep);
                  if (rep?.case_id) {
                    window.history.pushState(null, '', `/cases/${rep.case_id}`);
                  }
                }}
              />
            )}

            {activeTab === 'cases' && (
              <CasesPage
                onSelectCase={handleOpenCase}
              />
            )}

            {activeTab === 'agent' && (
              <AgentConsolePage />
            )}

            {activeTab === 'rag' && (
              <KnowledgeBasePage />
            )}

            {activeTab === 'trends' && (
              <ThreatTrendsPage />
            )}

            {activeTab === 'models' && (
              <ModelsDataPage />
            )}

            {activeTab === 'awareness' && (
              <AwarenessAcademyPage />
            )}

            {activeTab === 'batch' && (
              <BatchComparePage />
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
