import React, { useState } from 'react';
import { 
  Search, FileText, Image as ImageIcon, Layers, 
  Send, Sparkles, AlertTriangle, ShieldCheck, 
  CheckCircle, ExternalLink, RefreshCw, Cpu, 
  ChevronRight, ArrowRight, ShieldAlert, AlertOctagon
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import AgentWorkflowGraph from '../components/AgentWorkflowGraph';
import HighlightedMessageView from '../components/HighlightedMessageView';
import { createInvestigation } from '../services/api';

const SAMPLE_SCENARIOS = [
  {
    label: 'HBL Bank Smishing (OTP Theft)',
    type: 'combined',
    url: 'http://secure-login.hbl-verify.top/auth/session?token=88291',
    text: 'URGENT: Your HBL Bank internet banking session has been suspended due to 3 failed attempts. Enter your 6-digit OTP code immediately at the link above to avoid permanent account freeze.',
    sender: '+92-301-8891029',
    indicators: ['otp_requested', 'urgency', 'password_requested']
  },
  {
    label: 'BISP Social Support Lottery (Roman Urdu)',
    type: 'message',
    url: '',
    text: 'BISP Alert: Mubarik ho! Aap k 25,000 rupay BISP Benazir Income Support Program mein aagaye hain. Foran call karein 0312-9988112 aur apna CNIC verify karwa k advance delivery fee 1,500 JazzCash bhejein.',
    sender: '0312-9988112',
    indicators: ['payment_requested']
  },
  {
    label: 'Detained Parcel Customs Scam',
    type: 'combined',
    url: 'http://pakistan-post-tracking-fee.top/delivery/parcel',
    text: 'Pakistan Post Notice: Your parcel #PK-9812 is held at Lahore Customs. Pay Rs. 850 customs duty within 12 hours to release for home delivery.',
    sender: 'PakPost-Alert',
    indicators: ['payment_requested', 'urgency']
  },
  {
    label: 'Legitimate PKCERT Advisory Portal',
    type: 'url',
    url: 'https://pkcert.gov.pk/advisories',
    text: 'Official PKCERT Incident Reporting and Security Advisories Portal',
    sender: 'info@pkcert.gov.pk',
    indicators: []
  },
  {
    label: 'Cross-Modal Discrepancy (Safe URL + Fraud Text)',
    type: 'combined',
    url: 'https://en.wikipedia.org/wiki/Phishing',
    text: 'FIA Cyber Crime Wing: An arrest warrant has been issued in your name for illegal transaction. Transfer Rs 35,000 penalty immediately or police will raid your address.',
    sender: 'FIA-Officer',
    indicators: ['urgency', 'payment_requested']
  }
];

export default function InvestigationStudioPage({ currentReport, onReportGenerated, onNavigateToExplorer }) {
  const [inputType, setInputType] = useState('combined');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [manualIndicators, setManualIndicators] = useState([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [selectedAgentStep, setSelectedAgentStep] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadScenario = (sc) => {
    setInputType(sc.type);
    setUrl(sc.url || '');
    setText(sc.text || '');
    setSenderInfo(sc.sender || '');
    setManualIndicators(sc.indicators || []);
    setScreenshotBase64('');
    setScreenshotName('');
    setErrorMessage('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds 10MB upload limit');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleIndicator = (ind) => {
    setManualIndicators(prev => 
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsInvestigating(true);

    try {
      const payload = {
        input_type: inputType,
        url: url.trim() || undefined,
        text: text.trim() || undefined,
        sender_info: senderInfo.trim() || undefined,
        screenshot_base64: screenshotBase64 || undefined,
        manual_indicators: manualIndicators
      };

      const report = await createInvestigation(payload);
      onReportGenerated(report);
      if (report.agent_execution_trace && report.agent_execution_trace.length > 0) {
        setSelectedAgentStep(report.agent_execution_trace[0]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Investigation execution failed');
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Presets Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Load Test Case Scenario:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SCENARIOS.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadScenario(sc)}
              className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Evidence Intake Form (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">
              1. Evidence Intake
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">UNTRUSTED INPUT</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Modality Mode Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Investigation Type
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                {[
                  { id: 'combined', label: 'Multi', icon: Layers },
                  { id: 'url', label: 'URL', icon: Search },
                  { id: 'message', label: 'Text', icon: FileText },
                  { id: 'screenshot', label: 'Vision', icon: ImageIcon },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = inputType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInputType(tab.id)}
                      className={`flex items-center justify-center space-x-1 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                        active ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target URL Field */}
            {(inputType === 'url' || inputType === 'combined') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Suspicious URL / Web Destination
                </label>
                <input
                  type="text"
                  placeholder="e.g. http://185.220.101.4/hbl-login.php"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Message / Email Text Field */}
            {(inputType === 'message' || inputType === 'combined') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message, SMS, or Email Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste suspicious text (English, Urdu, or Roman Urdu)..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono resize-y"
                />
              </div>
            )}

            {/* Sender / Caller ID */}
            {(inputType === 'message' || inputType === 'combined') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sender Phone / Header (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92-300-1234567 or FIA-Notice"
                  value={senderInfo}
                  onChange={e => setSenderInfo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Screenshot Upload Field */}
            {(inputType === 'screenshot' || inputType === 'combined') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Screenshot Image (PNG / JPG / WebP)
                </label>
                <div className="p-3 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg bg-slate-950/60 text-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="screenshot-file-input"
                  />
                  <label htmlFor="screenshot-file-input" className="cursor-pointer block text-xs text-slate-400">
                    <ImageIcon className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                    {screenshotName ? (
                      <span className="text-cyan-400 font-semibold">{screenshotName}</span>
                    ) : (
                      <span>Click to upload evidence screenshot</span>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Manual Risk Indicators */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Reported Warning Flags
              </label>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                {[
                  { id: 'otp_requested', label: 'OTP / PIN Asked' },
                  { id: 'urgency', label: 'Urgent Threat' },
                  { id: 'payment_requested', label: 'Fee / Payment' },
                  { id: 'password_requested', label: 'Password Asked' },
                ].map(ind => (
                  <label
                    key={ind.id}
                    className="flex items-center space-x-1.5 p-1.5 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={manualIndicators.includes(ind.id)}
                      onChange={() => toggleIndicator(ind.id)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    <span>{ind.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isInvestigating}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              {isInvestigating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Orchestrating 8-Agent Pipeline...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute AI Investigation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* COLUMN 2: Orchestration Workflow & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Workflow Graph Visualization */}
          <AgentWorkflowGraph
            trace={currentReport?.agent_execution_trace || []}
            activeAgentId={selectedAgentStep?.agent_id}
            onSelectAgent={setSelectedAgentStep}
          />

          {/* Results Summary and Risk Assessment Panel */}
          {currentReport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Executive Assessment Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-slate-100 text-sm uppercase">
                      Forensic Assessment
                    </h3>
                  </div>
                  <RiskBadge level={currentReport.risk_level} size="md" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Model Confidence:</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      {(currentReport.model_confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Evidence Strength:</span>
                    <span className="font-semibold text-slate-200">
                      {currentReport.evidence_strength}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <p className="font-medium text-slate-200 mb-1">Executive Summary:</p>
                    {currentReport.executive_summary}
                  </div>

                  {/* Button to Full Explorer */}
                  <button
                    onClick={onNavigateToExplorer}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/50 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Open Detailed Evidence Ledger ({currentReport.evidence_ledger?.length || 0})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Immediate Security Action Plan */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertOctagon className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-slate-100 text-sm uppercase">
                      Recommended Next Actions
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">URGENT</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  {currentReport.recommended_actions?.map((act, idx) => (
                    <li key={idx} className="flex items-start space-x-2 p-2 rounded bg-slate-950/70 border border-slate-800/70">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>

                {/* Triggered Rules Quick Pills */}
                {currentReport.triggered_rules && currentReport.triggered_rules.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                      Triggered Expert Rules ({currentReport.triggered_rules.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentReport.triggered_rules.map(r => (
                        <span
                          key={r.rule_id}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/50 text-amber-300 border border-amber-800/60"
                          title={r.explanation}
                        >
                          {r.rule_id}: {r.rule_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-sm space-y-2">
              <Cpu className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <div className="font-semibold text-slate-400">Investigation Engine Ready</div>
              <p className="max-w-md mx-auto text-xs text-slate-500">
                Submit a URL, message, or screenshot on the left panel, or select a pre-loaded test case to observe the 8-agent AI investigation pipeline in action.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
