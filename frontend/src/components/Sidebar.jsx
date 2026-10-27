import React, { useState } from 'react';
import { 
  SearchCheck, FolderArchive, Cpu, BookOpen, 
  TrendingUp, Database, GraduationCap, ShieldCheck, 
  Settings, ChevronRight, MoreHorizontal, X, Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NAV_ITEMS = [
  { id: 'investigate', labelKey: 'nav_investigate', defaultLabel: 'Investigate', icon: SearchCheck },
  { id: 'cases', labelKey: 'nav_cases', defaultLabel: 'Cases', icon: FolderArchive },
  { id: 'agent', labelKey: 'nav_agent', defaultLabel: 'Agent Console', icon: Cpu },
  { id: 'rag', labelKey: 'nav_rag', defaultLabel: 'Knowledge Base', icon: BookOpen },
  { id: 'trends', labelKey: 'nav_trends', defaultLabel: 'Threat Trends', icon: TrendingUp },
  { id: 'models', labelKey: 'nav_models', defaultLabel: 'Models & Data', icon: Database },
  { id: 'awareness', labelKey: 'nav_awareness', defaultLabel: 'Awareness Academy', icon: GraduationCap },
  { id: 'batch', labelKey: 'nav_batch', defaultLabel: 'Batch & Compare', icon: Layers },
  { id: 'safety', labelKey: 'nav_safety', defaultLabel: 'Safety Center', icon: ShieldCheck },
  { id: 'settings', labelKey: 'nav_settings', defaultLabel: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  const { t } = useLanguage();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // Mobile bottom bar displays primary 4 tabs + More button
  const primaryMobileTabs = NAV_ITEMS.slice(0, 4);
  const extraMobileTabs = NAV_ITEMS.slice(4);

  const handleSelect = (id) => {
    onSelectTab(id);
    setMobileMoreOpen(false);
  };

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-stone-200 bg-white p-4 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] overflow-y-auto font-sans">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation Suite
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const translated = t(item.labelKey);
            const label = (translated && translated !== item.labelKey) ? translated : item.defaultLabel;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold shadow-xs ring-1 ring-teal-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span className="truncate">{label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-700 shrink-0 rtl:rotate-180" />}
              </button>
            );
          })}
        </div>

        {/* Forensic Disclaimer */}
        <div className="pt-4 mt-4 border-t border-stone-100">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Forensic Decision Support</div>
            <p className="leading-relaxed text-slate-500">
              CyberShield AI operates offline or via verified APIs. It never submits reports on your behalf.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (fixed at bottom for screens < 768px) */}
      <nav 
        role="navigation"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 flex items-center justify-around font-sans shadow-lg"
      >
        {primaryMobileTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const label = t(item.labelKey) || item.defaultLabel;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer min-w-[54px] ${
                isActive
                  ? 'text-teal-800 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span className="truncate max-w-[58px]">{label}</span>
            </button>
          );
        })}

        {/* Mobile "More" Tab Button */}
        <button
          type="button"
          onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
          className={`flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer min-w-[54px] ${
            mobileMoreOpen || extraMobileTabs.some(t => t.id === activeTab)
              ? 'text-teal-800 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet / Drawer */}
      {mobileMoreOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div 
            className="bg-white rounded-t-2xl p-5 pb-8 border-t border-stone-200 space-y-3 shadow-2xl animate-slideUp font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Additional Tools & Settings
              </span>
              <button 
                type="button" 
                onClick={() => setMobileMoreOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {extraMobileTabs.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const translated = t(item.labelKey);
                const label = (translated && translated !== item.labelKey) ? translated : item.defaultLabel;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
