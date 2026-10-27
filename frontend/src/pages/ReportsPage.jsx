import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, ShieldCheck, 
  AlertTriangle, ArrowUpRight, Scale, CheckCircle2, ChevronRight 
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { listInvestigations, getInvestigation } from '../services/api';

export default function ReportsPage({ currentReport, onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(currentReport);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCases() {
      try {
        const list = await listInvestigations(30);
        setCases(list);
        if (!selectedCase && list.length > 0) {
          const full = await getInvestigation(list[0].case_id);
          setSelectedCase(full);
        }
      } catch (e) {
        console.error('Error fetching investigations list', e);
      }
    }
    fetchCases();
  }, []);

  const handleCaseChange = async (caseId) => {
    setLoading(true);
    try {
      const full = await getInvestigation(caseId);
      setSelectedCase(full);
      if (onSelectCase) onSelectCase(full);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    if (!selectedCase) return;
    const blob = new Blob([JSON.stringify(selectedCase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CyberShield_Case_${selectedCase.case_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Forensic Investigation Dossier
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal, evidence-grounded cyber-fraud intelligence report.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedCase && (
            <>
              <button
                type="button"
                onClick={exportJSON}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Case Selector Drawer (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Archived Cases ({cases.length})
          </div>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {cases.map((c) => {
              const isSelected = selectedCase?.case_id === c.case_id;
              return (
                <button
                  key={c.case_id}
                  onClick={() => handleCaseChange(c.case_id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-semibold mb-1">
                    <span>{c.case_id}</span>
                    <span className="text-[10px] uppercase text-slate-400">{c.input_type}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{c.summary || 'Completed case'}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Report Document (9 cols) */}
        <div className="lg:col-span-9 rounded-xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
          {selectedCase ? (
            <div className="space-y-6 print:space-y-4">
              
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      CASE DOSSIER #{selectedCase.case_id}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedCase.timestamp}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white mt-1">
                    CyberShield AI Threat Forensic Report
                  </h1>
                </div>
                <RiskBadge level={selectedCase.risk_level} size="lg" />
              </div>

              {/* Assessment Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">MODEL CONFIDENCE</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {(selectedCase.model_confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">EVIDENCE STRENGTH</span>
                  <span className="text-slate-200 font-semibold">{selectedCase.evidence_strength}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">INPUT TYPE</span>
                  <span className="text-slate-200 capitalize">{selectedCase.input_type}</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  1. Executive Briefing
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {selectedCase.executive_summary}
                </p>
              </div>

              {/* Key Warnings */}
              {selectedCase.key_warnings && selectedCase.key_warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    2. Primary Threat Warning Signs
                  </h3>
                  <div className="space-y-1.5">
                    {selectedCase.key_warnings.map((w, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300">
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Forensic Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  3. Technical Forensic Details
                </h3>
                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedCase.technical_report}
                </div>
              </div>

              {/* Triggered Rules */}
              {selectedCase.triggered_rules && selectedCase.triggered_rules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    4. Triggered Expert-System Rules ({selectedCase.triggered_rules.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedCase.triggered_rules.map(r => (
                      <div key={r.rule_id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-amber-400 font-mono">{r.rule_id}: {r.rule_name}</span>
                          <span className="text-red-400 font-mono text-[10px]">[{r.severity}]</span>
                        </div>
                        <p className="text-slate-400">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  5. Actionable Remediation Guidance
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCase.recommended_actions?.map((act, i) => (
                    <li key={i} className="flex items-start space-x-2 p-2 rounded bg-slate-950 border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations Notice */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Investigative Limitations:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {selectedCase.limitations?.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              Select an investigation case on the left to preview and export the complete report dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
