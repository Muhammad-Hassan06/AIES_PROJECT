import React from 'react';
import { Shield, Radio, Sparkles, AlertCircle, PlusCircle, ExternalLink } from 'lucide-react';

export default function Navbar({ currentCaseId, onNewInvestigation, healthStatus }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white m-0">CyberShield AI</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              v1.0.0-PROD
            </span>
          </div>
          <p className="text-[11px] text-slate-400 -mt-0.5">
            Investigate smarter. Detect earlier. Stay safer.
          </p>
        </div>
      </div>

      {/* Pakistan Security Alert Ticker */}
      <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
        <span className="font-semibold text-red-400">PKCERT Advisory:</span>
        <span className="text-slate-300 truncate max-w-[280px]">
          Smishing Alert: Fraudsters impersonating commercial banks & BISP
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {currentCaseId && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-500">Active Case:</span>
            <span className="font-mono font-semibold text-cyan-400">{currentCaseId}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Engine Active</span>
        </div>

        <button
          onClick={onNewInvestigation}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Case</span>
        </button>
      </div>
    </header>
  );
}
