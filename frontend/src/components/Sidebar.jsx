import React from 'react';
import { 
  SearchCheck, FolderArchive, BarChart3, 
  ShieldAlert, Settings, ChevronRight 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NAV_ITEMS = [
  { id: 'investigate', labelKey: 'nav_investigate', defaultLabel: 'Investigate', icon: SearchCheck },
  { id: 'cases', labelKey: 'nav_cases', defaultLabel: 'Cases', icon: FolderArchive },
  { id: 'insights', labelKey: 'nav_insights', defaultLabel: 'Insights', icon: BarChart3 },
  { id: 'safety', labelKey: 'nav_safety', defaultLabel: 'Safety Center', icon: ShieldAlert },
  { id: 'settings', labelKey: 'nav_settings', defaultLabel: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  const { t } = useLanguage();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-stone-200 bg-white p-4 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = t(item.labelKey) || item.defaultLabel;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                  <span>{label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-700 rtl:rotate-180" />}
              </button>
            );
          })}
        </div>

        {/* Forensic Disclaimer */}
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700">Forensic Decision Support</div>
          <p className="leading-relaxed text-slate-500">
            CyberShield AI assists fraud investigation. It never submits reports on your behalf.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (fixed at bottom for screens < 768px) */}
      <nav 
        role="navigation"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const label = t(item.labelKey) || item.defaultLabel;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-teal-800 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px]">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
