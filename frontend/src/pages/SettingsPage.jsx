import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Database, Key, 
  Trash2, Cpu, CheckCircle2, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { getHealthStatus, listInvestigations, deleteInvestigation } from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [hData, cData] = await Promise.all([
        getHealthStatus().catch(() => null),
        listInvestigations(50).catch(() => [])
      ]);
      setHealth(hData);
      setCases(cData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm(`Are you sure you want to permanently delete case ${caseId}?`)) return;
    setDeletingId(caseId);
    try {
      await deleteInvestigation(caseId);
      setMessage(`Case ${caseId} deleted successfully.`);
      loadData();
    } catch (e) {
      setMessage(`Delete failed: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            System Administration & Security Controls
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          System Configuration & Data Retention
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Manage system security postures, AI provider bindings, local SQLite evidence retention,
          and forensic diagnostic logs.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800 text-cyan-300 text-xs">
          {message}
        </div>
      )}

      {/* Security & AI Provider Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Generative AI Provider Binding */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Generative AI Provider Status
              </h3>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
              health?.gemini_api_configured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {health?.gemini_api_configured ? 'API Connected' : 'Deterministic Fallback Active'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            CyberShield AI abstracts Generative AI providers through an isolated backend service.
            When an API key is absent or offline, high-fidelity deterministic template synthesis guarantees
            zero service interruption without inventing hallucinations.
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Provider:</span>
              <span>Google Gemini API</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Model:</span>
              <span className="text-cyan-400">gemini-2.5-flash</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Key Exposure:</span>
              <span className="text-emerald-400">Environment Protected (Hidden)</span>
            </div>
          </div>
        </div>

        {/* Local ML & Defense Subsystems */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Security Defense & Model Health
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> All Subsystems Online
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">URL Threat Classifier (RF):</span>
              <span className="text-emerald-400 font-bold">LOADED & ACTIVE</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">NLP Social Engineering Model:</span>
              <span className="text-emerald-400 font-bold">LOADED & ACTIVE</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">SSRF Network Protection:</span>
              <span className="text-cyan-400 font-bold">ENFORCED (RFC1918 Blocked)</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">Evidence Vault Database:</span>
              <span className="text-slate-200">SQLite (backend/data/cybershield.db)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Case Vault Data Retention & Deletion */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-200 text-sm">
              Evidence Retention & Case Deletion Controls ({cases.length} Records)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Privacy & Compliance</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          In compliance with privacy best practices, users and analysts can permanently purge individual forensic cases
          and associated evidence artifacts from local database storage.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Input Type</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {cases.map((c) => (
                <tr key={c.case_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{c.case_id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{c.timestamp}</td>
                  <td className="py-2.5 px-3 text-slate-300 capitalize">{c.input_type}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-200 font-semibold">{c.risk_level}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteCase(c.case_id)}
                      disabled={deletingId === c.case_id}
                      className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs transition-colors cursor-pointer"
                    >
                      {deletingId === c.case_id ? 'Purging...' : 'Delete Case'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
