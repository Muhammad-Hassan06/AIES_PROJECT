import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Command, FolderArchive, SearchCheck, 
  Cpu, BookOpen, TrendingUp, Database, GraduationCap, 
  ShieldCheck, Settings, Play, ArrowRight, X, EyeOff 
} from 'lucide-react';

import { DEMO_SCENARIOS } from './DemoScenarioCards';

export default function CommandPaletteModal({ 
  isOpen, 
  onClose, 
  onNavigateTab, 
  onRunScenario,
  cases = [],
  onOpenCaseById 
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          filteredResults[selectedIndex].action();
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  // Build searchable items list
  const tabActions = [
    { id: 'tab-investigate', title: 'Go to Investigate Studio', category: 'Navigation', icon: SearchCheck, action: () => onNavigateTab('investigate') },
    { id: 'tab-cases', title: 'Go to Cases Vault', category: 'Navigation', icon: FolderArchive, action: () => onNavigateTab('cases') },
    { id: 'tab-agent', title: 'Go to Investigator Agent Console', category: 'Navigation', icon: Cpu, action: () => onNavigateTab('agent') },
    { id: 'tab-rag', title: 'Go to Grounded Knowledge Base (PECA / SBP)', category: 'Navigation', icon: BookOpen, action: () => onNavigateTab('rag') },
    { id: 'tab-trends', title: 'Go to Threat Trends & Analytics', category: 'Navigation', icon: TrendingUp, action: () => onNavigateTab('trends') },
    { id: 'tab-models', title: 'Go to Models & Data Provenance', category: 'Navigation', icon: Database, action: () => onNavigateTab('models') },
    { id: 'tab-awareness', title: 'Go to Awareness Academy (Quiz & Lessons)', category: 'Navigation', icon: GraduationCap, action: () => onNavigateTab('awareness') },
    { id: 'tab-safety', title: 'Go to Official Safety Center (NCCIA & PKCERT)', category: 'Navigation', icon: ShieldCheck, action: () => onNavigateTab('safety') },
    { id: 'tab-privacy', title: 'Go to Digital Privacy & Spam Defense', category: 'Navigation', icon: EyeOff, action: () => onNavigateTab('privacy') },
    { id: 'tab-settings', title: 'Go to Settings & Retention', category: 'Navigation', icon: Settings, action: () => onNavigateTab('settings') },
  ];


  const scenarioActions = DEMO_SCENARIOS.map(sc => ({
    id: `scenario-${sc.id}`,
    title: `Run Demo: ${sc.title}`,
    subtitle: sc.desc,
    category: 'Demo Scenarios',
    icon: Play,
    action: () => {
      onNavigateTab('investigate');
      if (onRunScenario) onRunScenario(sc);
    }
  }));

  const caseActions = cases.slice(0, 10).map(c => ({
    id: `case-${c.case_id}`,
    title: `Open Case ${c.case_id}`,
    subtitle: `${c.risk_level} • ${c.input_type} • ${c.summary ? c.summary.slice(0, 60) + '...' : 'Investigation'}`,
    category: 'Recent Cases',
    icon: FolderArchive,
    action: () => {
      if (onOpenCaseById) onOpenCaseById(c.case_id);
    }
  }));

  const allActions = [...tabActions, ...scenarioActions, ...caseActions];

  const filteredResults = allActions.filter(item => {
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || 
           (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
           item.category.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-200 bg-stone-50">
          <Search className="w-5 h-5 text-teal-700 mr-3 rtl:mr-0 rtl:ml-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search tabs, cases (CS-XXXX), or scenarios..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-stone-200 rounded shadow-xs ml-2">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-stone-100">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or cases found.
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-teal-50 text-teal-950 font-semibold' : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                    <div className={`p-1.5 rounded-lg border shrink-0 ${
                      isSelected ? 'bg-white border-teal-200 text-teal-800' : 'bg-stone-100 border-stone-200 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="truncate text-slate-900">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate font-normal">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded shrink-0 ml-2 ${
                    isSelected ? 'bg-teal-100 text-teal-800' : 'bg-stone-100 text-slate-500'
                  }`}>
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Navigate with ↑ and ↓</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
