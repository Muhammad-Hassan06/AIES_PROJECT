import React, { useState } from 'react';
import { 
  FileSearch, Search, FileText, Image as ImageIcon, 
  Scale, ShieldAlert, Cpu, ArrowUpRight, Filter 
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import HighlightedMessageView from '../components/HighlightedMessageView';
import EvidenceLedgerTable from '../components/EvidenceLedgerTable';

export default function EvidenceExplorerPage({ currentReport }) {
  const [activeTab, setActiveTab] = useState('all');

  if (!currentReport) {
    return (
      <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400">
        <FileSearch className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Active Case Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please run an investigation in the Investigation Studio or pick a case from the Overview page to inspect forensic evidence.
        </p>
      </div>
    );
  }

  const urlRes = currentReport.url_result;
  const nlpRes = currentReport.nlp_result;
  const ocrRes = currentReport.vision_result;
  const rules = currentReport.triggered_rules || [];
  const ledger = currentReport.evidence_ledger || [];

  return (
    <div className="space-y-6">
      {/* Header with Case Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-cyan-400 font-bold text-sm">
              CASE: {currentReport.case_id}
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-xs text-slate-400">{currentReport.timestamp}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Forensic Evidence Ledger & Deep Diagnostics
          </h2>
        </div>
        <div className="mt-3 md:mt-0 flex items-center space-x-3">
          <RiskBadge level={currentReport.risk_level} size="md" />
        </div>
      </div>

      {/* Forensic Modality Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* URL Diagnostic Panel */}
        {urlRes && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-200 text-sm">
                  URL Forensic Features (PhiUSIIL Schema)
                </h3>
              </div>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                urlRes.is_phishing ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {urlRes.is_phishing ? 'MALICIOUS' : 'BENIGN'} ({(urlRes.phishing_probability * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="text-xs font-mono text-slate-300 p-2.5 rounded bg-slate-950 border border-slate-800 break-all">
              {urlRes.url}
            </div>

            {/* Extracted PhiUSIIL Feature Badges */}
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-2">
                Computed Model Features:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {Object.entries(urlRes.features || {}).map(([key, val]) => (
                  <div key={key} className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px] truncate" title={key}>{key}</div>
                    <div className="text-slate-200 font-semibold">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Signals */}
            {urlRes.top_signals && urlRes.top_signals.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1.5">
                  Interpretable Warning Signals:
                </span>
                <div className="space-y-1.5">
                  {urlRes.top_signals.map((sig, idx) => (
                    <div key={idx} className="p-2 rounded bg-red-950/30 border border-red-900/40 text-xs text-red-300">
                      <span className="font-semibold mr-1">[{sig.severity}] {sig.feature}:</span>
                      <span className="text-slate-300">{sig.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NLP Semantic Diagnostic Panel */}
        {nlpRes && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-200 text-sm">
                  Linguistic Analysis & Highlighted Spans
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                Score: {(nlpRes.risk_score * 100).toFixed(1)}%
              </span>
            </div>

            <HighlightedMessageView
              text={nlpRes.analyzed_text}
              spans={nlpRes.highlighted_spans}
            />

            {nlpRes.pakistan_context_detected && nlpRes.pakistan_context_detected.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
                <span className="font-semibold text-emerald-400 block mb-1">
                  Pakistan Context / Local Entity Cues Detected:
                </span>
                <span className="text-slate-300">
                  {nlpRes.pakistan_context_detected.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* OCR Screenshot Panel */}
        {ocrRes && ocrRes.extracted_text && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-200 text-sm">
                  Screenshot Computer Vision & OCR
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Engine: {ocrRes.ocr_engine}
              </span>
            </div>

            <div className="text-xs text-slate-300 p-3 rounded bg-slate-950 font-mono whitespace-pre-wrap border border-slate-800 max-h-48 overflow-y-auto">
              {ocrRes.extracted_text}
            </div>

            {ocrRes.visual_indicators && ocrRes.visual_indicators.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Visual Observations:</span>
                {ocrRes.visual_indicators.map((ind, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {ind}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Triggered Expert Rules List */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Matched Expert Rules ({rules.length})
              </h3>
            </div>
          </div>

          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map(r => (
                <div key={r.rule_id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {r.rule_id}: {r.rule_name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{r.explanation}</p>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-medium text-slate-400">Matched Condition: </span>
                    {r.conditions_matched.join('; ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-xs italic">No expert rules triggered for this case.</div>
          )}
        </div>
      </div>

      {/* Full Evidence Ledger Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">
          Master Evidence Ledger (Factual Provenance)
        </h3>
        <EvidenceLedgerTable ledger={ledger} />
      </div>
    </div>
  );
}
