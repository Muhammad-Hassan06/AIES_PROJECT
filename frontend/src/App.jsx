import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import InvestigationStudioPage from './pages/InvestigationStudioPage';
import EvidenceExplorerPage from './pages/EvidenceExplorerPage';
import ModelIntelligencePage from './pages/ModelIntelligencePage';
import ExpertRulesPage from './pages/ExpertRulesPage';
import PakistanSafetyPage from './pages/PakistanSafetyPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { getInvestigation, listInvestigations, getHealthStatus } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
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

  const handleOpenCase = async (caseId) => {
    try {
      const rep = await getInvestigation(caseId);
      setCurrentReport(rep);
      setActiveTab('evidence');
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewInvestigation = () => {
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Bar */}
      <Navbar
        currentCaseId={currentReport?.case_id}
        onNewInvestigation={handleNewInvestigation}
        healthStatus={healthStatus}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950/40">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPage
                onOpenCase={handleOpenCase}
                onNewInvestigation={handleNewInvestigation}
              />
            )}

            {activeTab === 'studio' && (
              <InvestigationStudioPage
                currentReport={currentReport}
                onReportGenerated={(rep) => setCurrentReport(rep)}
                onNavigateToExplorer={() => setActiveTab('evidence')}
              />
            )}

            {activeTab === 'evidence' && (
              <EvidenceExplorerPage
                currentReport={currentReport}
              />
            )}

            {activeTab === 'models' && (
              <ModelIntelligencePage />
            )}

            {activeTab === 'rules' && (
              <ExpertRulesPage />
            )}

            {activeTab === 'pakistan' && (
              <PakistanSafetyPage />
            )}

            {activeTab === 'reports' && (
              <ReportsPage
                currentReport={currentReport}
                onSelectCase={(rep) => setCurrentReport(rep)}
              />
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
