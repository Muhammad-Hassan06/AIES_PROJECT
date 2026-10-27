import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, Search, Filter, Trash2, Printer, 
  Download, Share2, ArrowUpRight, Eye, ShieldCheck, 
  AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Info
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import ShareSafeSummaryModal from '../components/ShareSafeSummaryModal';
import { listInvestigations, getInvestigation, deleteInvestigation } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCaseDate, getConfidenceExplanation } from '../utils/format';

export default function CasesPage({ onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { addToast } = useToast();

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await listInvestigations(100);
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        const full = await getInvestigation(data[0].case_id).catch(() => null);
        if (full) setSelectedCase(full);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleInspect = async (caseId) => {
    try {
      const full = await getInvestigation(caseId);
      setSelectedCase(full);
    } catch (e) {
      addToast('Failed to load full case details', 'error');
    }
  };

  const handleOpenInStudio = (caseRecord) => {
    if (!caseRecord) return;
    if (onSelectCase) {
      onSelectCase(caseRecord);
    }
  };

  const handleDelete = async (caseId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete Case ${caseId}?`)) return;

    setDeletingId(caseId);
    try {
      await deleteInvestigation(caseId);
      addToast(`Case ${caseId} deleted successfully`, 'success');
      if (selectedCase?.case_id === caseId) {
        setSelectedCase(null);
      }
      loadCases();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
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
    addToast('Case JSON exported', 'success');
  };

  // Filter logic
  const filteredCases = cases.filter((c) => {
    const rawMatch = (c.raw_text || '').toLowerCase().includes(search.toLowerCase()) ||
                     (c.raw_url || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = 
      (c.case_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.summary || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.input_type || '').toLowerCase().includes(search.toLowerCase()) ||
      rawMatch;
    
    const matchesRisk = riskFilter === 'ALL' || (c.risk_level || '').toUpperCase() === riskFilter;
    const matchesType = typeFilter === 'ALL' || (c.input_type || '').toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesRisk && matchesType;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Top Header & Search/Filter Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
              <FolderArchive className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Case History & Forensic Vault
              </h2>
              <p className="text-xs text-slate-500">
                Search, filter, inspect, and export archived cyber threat investigations
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-slate-600 border border-stone-200 self-start sm:self-auto font-mono">
            {filteredCases.length} of {cases.length} Cases
          </span>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder="Search by case ID, URL, findings, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-700 shadow-xs font-sans"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="sm:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-teal-700 shadow-xs cursor-pointer font-medium font-sans"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Threats</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Suspicion</option>
              <option value="LOW">Low Risk / Clean</option>
              <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
            </select>
          </div>

          {/* Input Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-teal-700 shadow-xs cursor-pointer font-medium font-sans"
            >
              <option value="ALL">All Modalities</option>
              <option value="url">URL Only</option>
              <option value="message">SMS / Text</option>
              <option value="screenshot">Screenshot Vision</option>
              <option value="combined">Multimodal (Combined)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases List (4 cols) + Selected Dossier View (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Cases List Drawer */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Investigation Records
          </div>

          {filteredCases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching investigations found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.case_id === c.case_id;
                return (
                  <div
                    key={c.case_id}
                    onClick={() => handleInspect(c.case_id)}
                    className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-300 shadow-xs ring-1 ring-teal-200'
                        : 'bg-stone-50/60 border-stone-200 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">
                        {c.case_id}
                      </span>
                      <RiskBadge level={c.risk_level} size="sm" />
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {c.summary || c.raw_text || c.raw_url || 'Forensic investigation completed.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-stone-100">
                      <span className="capitalize">{c.input_type} • {formatCaseDate(c.timestamp)}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(c.case_id, e)}
                        disabled={deletingId === c.case_id}
                        className="p-1 rounded text-slate-400 hover:text-red-700 transition-colors"
                        title="Delete case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Case Dossier Preview */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          {selectedCase ? (
            <div className="space-y-6">
              {/* Dossier Header with Non-wrapping Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 rtl:space-x-reverse">
                    <span className="font-mono font-bold text-slate-700">CASE #{selectedCase.case_id}</span>
                    <span>•</span>
                    <span>{formatCaseDate(selectedCase.timestamp)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Forensic Intelligence Dossier
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 rtl:space-x-reverse">
                  <button
                    type="button"
                    onClick={() => handleOpenInStudio(selectedCase)}
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Load original input and results in the Studio"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Studio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Share-Safe</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportJSON}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Original Submitted Evidence Card */}
              {((selectedCase.raw_input?.url || selectedCase.raw_input?.text) || selectedCase.url_result?.url || selectedCase.nlp_result?.analyzed_text) && (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <span>Submitted Evidence Input</span>
                    <span className="font-mono text-teal-800 capitalize font-medium">{selectedCase.input_type}</span>
                  </div>
                  {selectedCase.raw_input?.url && (
                    <div className="text-xs font-mono text-teal-900 bg-white p-2 rounded border border-stone-200 break-all">
                      {selectedCase.raw_input.url}
                    </div>
                  )}
                  {selectedCase.raw_input?.text && (
                    <div className="text-xs text-slate-800 bg-white p-2.5 rounded border border-stone-200 leading-relaxed">
                      {selectedCase.raw_input.text}
                    </div>
                  )}
                  {selectedCase.raw_input?.sender_info && (
                    <div className="text-[11px] text-slate-500">
                      Sender / Header: <span className="font-mono text-slate-700">{selectedCase.raw_input.sender_info}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Assessment Metrics Strip with Honest Tooltip */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">RISK ASSESSMENT</span>
                    <RiskBadge level={selectedCase.risk_level} size="sm" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">MODEL CONFIDENCE</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {Math.round((selectedCase.model_confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">EVIDENCE STRENGTH</span>
                    <span className="font-semibold text-slate-800">{selectedCase.evidence_strength || 'MODERATE'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">INPUT MODALITY</span>
                    <span className="capitalize text-slate-800 font-medium">{selectedCase.input_type}</span>
                  </div>
                </div>

                {/* Honest Forensic Context Box */}
                <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 flex items-start space-x-2 text-[11px] text-slate-600">
                  <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Confidence Context:</strong> {getConfidenceExplanation(selectedCase.risk_level, selectedCase.model_confidence, selectedCase.evidence_strength)}
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  1. Executive Briefing
                </h4>
                <p className="text-xs text-slate-700 bg-stone-50 p-4 rounded-xl border border-stone-200 leading-relaxed font-medium">
                  {selectedCase.executive_summary}
                </p>
              </div>

              {/* Key Red Flags */}
              {selectedCase.key_warnings?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    2. Primary Threat Indicators
                  </h4>
                  <div className="space-y-1.5">
                    {selectedCase.key_warnings.map((w, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Remediation Guidance */}
              {selectedCase.recommended_actions?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    3. Recommended Remediation
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {selectedCase.recommended_actions.map((act, i) => (
                      <li key={i} className="flex items-start space-x-2 p-2 rounded-lg bg-stone-50 border border-stone-200 rtl:space-x-reverse">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Triggered Expert Rules */}
              {selectedCase.triggered_rules?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    4. Matched Deterministic Expert Rules ({selectedCase.triggered_rules.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedCase.triggered_rules.map((r) => (
                      <div key={r.rule_id} className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{r.rule_id}: {r.rule_name}</span>
                          <span className="text-[10px] font-mono text-red-700">[{r.severity}]</span>
                        </div>
                        <p className="text-slate-600">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an investigation case from the left list to review its complete dossier.
            </div>
          )}
        </div>
      </div>

      {/* Share-Safe Redacted Modal */}
      <ShareSafeSummaryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        report={selectedCase}
      />
    </div>
  );
}
