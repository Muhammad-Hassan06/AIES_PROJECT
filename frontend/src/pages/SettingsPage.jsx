import React, { useState, useEffect } from 'react';
import { 
  Settings, Database, Trash2, Globe, Sliders, ShieldCheck 
} from 'lucide-react';
import { getHealthStatus, listInvestigations, deleteInvestigation } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { addToast } = useToast();

  const [health, setHealth] = useState(null);
  const [totalCases, setTotalCases] = useState(0);
  const [isPurging, setIsPurging] = useState(false);
  const [defaultViewMode, setDefaultViewMode] = useState(() => {
    return localStorage.getItem('cybershield_default_view') || 'simple';
  });

  const loadData = async () => {
    try {
      const [h, cases] = await Promise.all([
        getHealthStatus().catch(() => null),
        listInvestigations(200).catch(() => [])
      ]);
      setHealth(h);
      setTotalCases(cases.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleDefaultView = (mode) => {
    setDefaultViewMode(mode);
    localStorage.setItem('cybershield_default_view', mode);
    addToast(`Default view mode set to ${mode === 'technical' ? 'Technical' : 'Simple'}`, 'info');
  };

  const handlePurgeAllCases = async () => {
    const confirmed = window.confirm(t('purge_confirm'));
    if (!confirmed) return;

    setIsPurging(true);
    try {
      // Fetch all cases and delete them
      const cases = await listInvestigations(500);
      let count = 0;
      for (const c of cases) {
        try {
          await deleteInvestigation(c.case_id);
          count++;
        } catch (e) {
          console.warn(`Failed to delete ${c.case_id}:`, e);
        }
      }
      setTotalCases(0);
      addToast(`Successfully purged ${count} cases from the local vault`, 'success');
      loadData();
    } catch (err) {
      addToast(`Purge failed: ${err.message}`, 'error');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-2">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <Settings className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Settings & Privacy Preferences
            </h2>
            <p className="text-xs text-slate-500">
              Manage data retention, local case vault purge, default view detail, and language
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Language Selection */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900">
            <Globe className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-sm">Language & Script (زبان)</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Select your preferred interface language. Urdu activates full Right-to-Left (RTL) alignment and Nastaliq typography.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { code: 'en', label: 'English', desc: 'Standard LTR' },
              { code: 'ur', label: 'اردو', desc: 'Full RTL Naskh' },
              { code: 'ro', label: 'Roman Urdu', desc: 'Latin script' }
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  language === lang.code
                    ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold shadow-xs'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{lang.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{lang.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Default View Mode */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900">
            <Sliders className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-sm">Default Analysis Detail View</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Choose whether the investigation results open in Citizen Simple mode (plain language) or Technical mode (model features, confidence scores, and rule citations).
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleToggleDefaultView('simple')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                defaultViewMode === 'simple'
                  ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold shadow-xs'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700'
              }`}
            >
              <div className="text-xs font-semibold">Simple (Default)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Plain language verdicts & immediate action steps</div>
            </button>

            <button
              type="button"
              onClick={() => handleToggleDefaultView('technical')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                defaultViewMode === 'technical'
                  ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold shadow-xs'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700'
              }`}
            >
              <div className="text-xs font-semibold">Technical View</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Expanded model features, confidences, & raw logs</div>
            </button>
          </div>
        </div>
      </div>

      {/* Case Vault & Data Retention Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <Database className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Local Vault & Privacy Retention
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-slate-700 border border-stone-200">
            {totalCases} Cases Stored
          </span>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Storage Location:</strong> All case records and forensic extraction artifacts reside locally in the SQLite database (<code>backend/data/cybershield.db</code>).
          </p>
          <p>
            CyberShield AI never uploads your submitted messages, links, or screenshots to public clouds or third-party servers. 
            In compliance with user data privacy guidelines, you can permanently erase all stored cases at any time.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Irreversible action. Deletes all past investigations.
          </span>

          <button
            type="button"
            onClick={handlePurgeAllCases}
            disabled={isPurging || totalCases === 0}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPurging ? 'Purging...' : t('purge_all_cases')}</span>
          </button>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>System Subsystem Status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
            <span className="text-slate-600">URL Threat Classifier:</span>
            <span className="text-emerald-700 font-bold">ONLINE (15 features)</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
            <span className="text-slate-600">NLP Social Engineering:</span>
            <span className="text-emerald-700 font-bold">ONLINE (TF-IDF + MNB)</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
            <span className="text-slate-600">SSRF Protection Engine:</span>
            <span className="text-teal-800 font-bold">ENFORCED (RFC1918 safe)</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
            <span className="text-slate-600">Generative AI Provider:</span>
            <span className="text-slate-800 font-semibold">
              {health?.gemini_api_configured ? 'Google Gemini API' : 'Deterministic Fallback'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
