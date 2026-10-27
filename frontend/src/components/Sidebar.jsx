import React from 'react';
import { 
  LayoutDashboard, SearchCheck, FileSearch, 
  Cpu, Scale, ShieldAlert, FileText, Settings, 
  ChevronRight 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
  { id: 'studio', label: 'Investigation Studio', icon: SearchCheck, highlight: true },
  { id: 'evidence', label: 'Evidence Explorer', icon: FileSearch },
  { id: 'models', label: 'Model Intelligence Lab', icon: Cpu },
  { id: 'rules', label: 'Expert Rules Explorer', icon: Scale },
  { id: 'pakistan', label: 'Pakistan Cyber Safety', icon: ShieldAlert },
  { id: 'reports', label: 'Investigation Reports', icon: FileText },
  { id: 'settings', label: 'Settings & Security', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Investigation Modules
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          );
        })}
      </div>

      {/* Forensic Disclaimer */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300 mb-1">AIES Project Build</div>
        <p className="leading-relaxed text-slate-400">
          CyberShield AI assists forensic inquiry. It does not submit automated complaints or take legal action.
        </p>
      </div>
    </aside>
  );
}
