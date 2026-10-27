import React from 'react';
import { Shield, PlusCircle, Globe, Search, Command } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ currentCaseId, onNewInvestigation, healthStatus, onOpenCommandPalette }) {
  const { language, setLanguage, t, isRtl } = useLanguage();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ur', label: 'اردو' },
    { code: 'ro', label: 'Roman Urdu' },
  ];

  return (
    <header className="h-16 border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Tagline */}
      <div 
        onClick={onNewInvestigation}
        className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer"
        title="CyberShield AI Home"
      >
        <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 m-0">
              {t('app_title')}
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-slate-600 border border-stone-200">
              v1.0.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
            {t('tagline')}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs text-slate-500 transition-colors cursor-pointer"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] hidden md:inline">Command Menu</span>
          <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-slate-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Active Case ID Pill */}
        {currentCaseId && (
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-xs">
            <span className="text-slate-500 font-medium">{t('active_case')}:</span>
            <span className="font-mono font-semibold text-teal-800">{currentCaseId}</span>
          </div>
        )}

        {/* Engine Status Dot */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600">
          <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          <span className={healthStatus?.status === 'healthy' ? 'text-slate-600' : 'text-red-700 font-medium'}>
            {healthStatus?.status === 'healthy' ? t('engine_active') : 'Backend Offline'}
          </span>
        </div>

        {/* Language Selector Dropdown */}
        <div className="relative flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1 rtl:mr-1.5 rtl:ml-1" />
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                language === l.code
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* New Investigation Button */}
        <button
          type="button"
          onClick={onNewInvestigation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('new_case')}</span>
        </button>
      </div>
    </header>
  );
}
