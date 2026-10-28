import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, Image as ImageIcon, Mail, 
  Send, RefreshCw, Clipboard, AlertCircle, 
  Layers, Scale, Cpu, FolderArchive, X, Sparkles
} from 'lucide-react';
import RiskVerdictCard from '../components/RiskVerdictCard';
import CollapsibleSection from '../components/CollapsibleSection';
import HighlightedMessageView from '../components/HighlightedMessageView';
import EvidenceLedgerTable from '../components/EvidenceLedgerTable';
import ActionPlanCard from '../components/ActionPlanCard';
import ShareSafeSummaryModal from '../components/ShareSafeSummaryModal';
import AgentStepper from '../components/AgentStepper';
import AgentWorkflowGraph from '../components/AgentWorkflowGraph';
import DemoScenarioCards from '../components/DemoScenarioCards';
import { createInvestigation } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formatCaseDate } from '../utils/format';

export default function InvestigationStudioPage({ currentReport, onReportGenerated, onClearReport }) {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('url'); // 'url', 'message', 'screenshot', 'email'
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [manualIndicators, setManualIndicators] = useState([]);
  
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTechnicalMode, setIsTechnicalMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Restore saved case inputs into state whenever currentReport changes
  useEffect(() => {
    if (currentReport) {
      const raw = currentReport.raw_input || {};
      const targetUrl = raw.url || currentReport.url_result?.url || '';
      const targetText = raw.text || currentReport.nlp_result?.analyzed_text || '';
      const targetSender = raw.sender_info || '';
      const targetScreenshot = raw.screenshot_name || (currentReport.vision_result?.extracted_text ? 'screenshot.png' : '');
      const targetIndicators = raw.manual_indicators || [];

      setUrl(targetUrl);
      setText(targetText);
      setSenderInfo(targetSender);
      setScreenshotName(targetScreenshot);
      setManualIndicators(targetIndicators);

      if (currentReport.input_type === 'url') setActiveTab('url');
      else if (currentReport.input_type === 'message' || currentReport.input_type === 'email') setActiveTab('message');
      else if (currentReport.input_type === 'screenshot') setActiveTab('screenshot');
      else if (targetUrl) setActiveTab('url');
      else if (targetText) setActiveTab('message');
    }
  }, [currentReport?.case_id]);

  const handleCloseSavedCase = () => {
    setUrl('');
    setText('');
    setSenderInfo('');
    setScreenshotBase64('');
    setScreenshotName('');
    setManualIndicators([]);
    setErrorMessage('');
    if (onClearReport) onClearReport();
    addToast('Cleared saved case view', 'info');
  };

  const handleSelectScenario = (sc) => {
    setUrl(sc.url || '');
    setText(sc.text || '');
    setSenderInfo(sc.sender || '');
    setManualIndicators(sc.indicators || []);
    setScreenshotBase64('');
    setScreenshotName('');
    setErrorMessage('');

    if (sc.type === 'url') setActiveTab('url');
    else if (sc.type === 'message') setActiveTab('message');
    else setActiveTab('url');

    addToast(`Loaded scenario: ${sc.title}`, 'info');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds 10MB limit');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) {
        addToast('Clipboard is empty', 'info');
        return;
      }
      if (clipText.startsWith('http://') || clipText.startsWith('https://')) {
        setUrl(clipText);
        setActiveTab('url');
      } else {
        setText(clipText);
        setActiveTab('message');
      }
      addToast('Pasted from clipboard', 'success');
    } catch (err) {
      console.warn('Clipboard read error:', err);
      addToast('Unable to read clipboard', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Determine effective input_type based on active inputs
    let calculatedType = 'combined';
    if (activeTab === 'url' && !text && !screenshotBase64) {
      calculatedType = 'url';
    } else if ((activeTab === 'message' || activeTab === 'email') && !url && !screenshotBase64) {
      calculatedType = 'message';
    } else if (activeTab === 'screenshot' && !url && !text) {
      calculatedType = 'screenshot';
    }

    if (!url.trim() && !text.trim() && !screenshotBase64) {
      setErrorMessage('Please provide a URL, text message, or upload a screenshot to analyze.');
      return;
    }

    setIsInvestigating(true);

    try {
      const payload = {
        input_type: calculatedType,
        url: url.trim() || undefined,
        text: text.trim() || undefined,
        sender_info: senderInfo.trim() || undefined,
        screenshot_base64: screenshotBase64 || undefined,
        manual_indicators: manualIndicators
      };

      const report = await createInvestigation(payload);
      onReportGenerated(report);
      addToast('Investigation completed successfully', 'success');
    } catch (err) {
      setErrorMessage(err.message || 'Investigation execution failed');
      addToast('Investigation failed', 'error');
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* SAVED CASE BANNER */}
      {currentReport && (
        <div data-testid="saved-case-banner" className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl shrink-0">
              <FolderArchive className="w-5 h-5 text-teal-800" />
            </div>
            <div>
              <div className="text-[11px] text-teal-800 font-bold uppercase tracking-wider">
                Viewing Saved Case Record
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="font-mono text-teal-950 font-bold">{currentReport.case_id}</span>
                <span className="text-xs font-normal text-slate-600">
                  • Analyzed on {formatCaseDate(currentReport.timestamp)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isInvestigating}
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              title="Run a new analysis with these inputs (creates a new case)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run Analysis</span>
            </button>
            <button
              type="button"
              onClick={handleCloseSavedCase}
              className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
              title="Close saved case and clear studio inputs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: Single Primary Action Intake Studio */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Investigate Cyber Threat
            </h2>
            <p className="text-xs text-slate-500">
              Paste suspicious links, WhatsApp fraud messages, SMS, or screenshots for forensic analysis
            </p>
          </div>

          {/* Quick Paste from Clipboard button */}
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-slate-500" />
            <span>Paste from clipboard</span>
          </button>
        </div>

        {/* Tab Modality Selection */}
        <div className="flex border-b border-stone-200 space-x-2 rtl:space-x-reverse">
          {[
            { id: 'url', label: 'Website URL', icon: Search },
            { id: 'message', label: 'SMS / Message', icon: FileText },
            { id: 'screenshot', label: 'Screenshot Image', icon: ImageIcon },
            { id: 'email', label: 'Email Phish', icon: Mail },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                  active
                    ? 'border-b-2 border-teal-700 text-teal-800 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'url' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Suspicious Web Address (URL)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://example.com/hbl-login-verify.php"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-700 shadow-xs"
                />
              </div>
              {url.includes('@') && !url.includes('/') && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                  <span>Detected email address. To investigate exposed accounts, breach history, and spam sources, open the <strong>Digital Privacy</strong> center.</span>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                CyberShield AI safely parses URL structural signals without auto-opening or fetching malicious code.
              </p>
            </div>
          )}


          {(activeTab === 'message' || activeTab === 'email') && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Message, SMS, or Email Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste suspicious text (English, Urdu, or Roman Urdu)... e.g. BISP Alert: Aap k 25,000 rupay aagaye hain..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-700 shadow-xs resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Sender Phone / Header (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92-301-8891029 or FIA-Notice"
                  value={senderInfo}
                  onChange={e => setSenderInfo(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-700 shadow-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'screenshot' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Evidence Screenshot (Image)
              </label>
              <div className="p-6 border-2 border-dashed border-stone-200 hover:border-teal-600 rounded-xl bg-stone-50/70 text-center transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="screenshot-file-input"
                />
                <label htmlFor="screenshot-file-input" className="cursor-pointer block text-xs text-slate-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  {screenshotName ? (
                    <span className="text-teal-800 font-bold block">{screenshotName}</span>
                  ) : (
                    <span>Click to select screenshot or drag & drop (PNG, JPG, WebP up to 10MB)</span>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary CTA Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isInvestigating}
              className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-sm tracking-wide shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              {isInvestigating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('analyzing')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('analyze_button')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Animated Agent Stepper (visible during and after analysis) */}
      {(isInvestigating || currentReport) && (
        <AgentStepper
          isInvestigating={isInvestigating}
          trace={currentReport?.agent_execution_trace || []}
        />
      )}

      {/* SECTION 3: Results Display with Progressive Disclosure */}
      {currentReport && !isInvestigating && (
        <div className="space-y-6 animate-fade-in">
          {/* Top: Risk Verdict Card */}
          <RiskVerdictCard
            report={currentReport}
            isTechnicalMode={isTechnicalMode}
            onToggleTechnical={() => setIsTechnicalMode(!isTechnicalMode)}
            onOpenShareSafe={() => setIsShareModalOpen(true)}
          />

          {/* Models Used for This Case Strip */}
          <div data-testid="models-used-strip" className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-bold text-slate-900">Models Used for This Case:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-slate-700" title="Machine Learning Phishing Classifier">
                URL: <strong className="text-teal-900">{currentReport.model_versions?.url_classifier || 'RandomForest (PhiUSIIL)'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-slate-700" title="NLP Social Engineering Classifier">
                NLP: <strong className="text-teal-900">{currentReport.model_versions?.nlp_classifier || 'MultinomialNB (PK Lures)'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-slate-700" title="Symbolic Expert Rules Engine">
                Rules: <strong className="text-teal-900">{currentReport.model_versions?.expert_rules || 'v1.2 (Symbolic IF-THEN)'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-slate-700" title="Forensic Report Explainer">
                Explainer: <strong className="text-teal-900">{currentReport.model_versions?.explainer || 'Gemini 2.5 Flash'}</strong>
              </span>
            </div>
          </div>

          {/* Immediate Action Protocol Card */}
          <ActionPlanCard report={currentReport} />

          {/* Interactive Agent Pipeline Graph */}
          <AgentWorkflowGraph
            trace={currentReport.agent_execution_trace || []}
            urlResult={currentReport.url_result}
            nlpResult={currentReport.nlp_result}
            visionResult={currentReport.vision_result}
            triggeredRules={currentReport.triggered_rules}
          />

          {/* Collapsible Deep-Dive Sections (Collapsed by default per Part 2) */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Detailed Evidence & Forensics
            </div>

            {/* 1. Evidence Ledger */}
            {currentReport.evidence_ledger && currentReport.evidence_ledger.length > 0 && (
              <CollapsibleSection
                id="evidence-ledger"
                title={t('sec_why')}
                icon={Layers}
                badge={`${currentReport.evidence_ledger.length} findings`}
                badgeType="primary"
                defaultOpen={false}
              >
                <div className="pt-2">
                  <EvidenceLedgerTable ledger={currentReport.evidence_ledger} />
                </div>
              </CollapsibleSection>
            )}

            {/* 2. Highlighted NLP Message Spans */}
            {currentReport.nlp_result && (
              <CollapsibleSection
                id="highlighted-text"
                title={t('sec_highlighted')}
                icon={FileText}
                badge={
                  !isTechnicalMode
                    ? undefined
                    : `Score: ${(currentReport.nlp_result.risk_score * 100).toFixed(0)}%`
                }
                badgeType="warning"
                defaultOpen={false}
              >
                <div className="pt-2 space-y-3">
                  <HighlightedMessageView
                    text={currentReport.nlp_result.analyzed_text}
                    spans={currentReport.nlp_result.highlighted_spans}
                  />

                  {currentReport.nlp_result.pakistan_context_detected?.length > 0 && (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        Local Pakistani Entities / Context Flagged:
                      </span>
                      <span className="text-slate-600">
                        {currentReport.nlp_result.pakistan_context_detected.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* 3. URL Security Analysis */}
            {currentReport.url_result && (
              <CollapsibleSection
                id="url-analysis"
                title={t('sec_url')}
                icon={Search}
                badge={currentReport.url_result.is_phishing ? 'Malicious' : 'Benign'}
                badgeType={currentReport.url_result.is_phishing ? 'danger' : 'success'}
                defaultOpen={false}
              >
                <div className="pt-2 space-y-4">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-slate-800 break-all">
                    {currentReport.url_result.url}
                  </div>

                  {isTechnicalMode && currentReport.url_result.features && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">
                        PhiUSIIL Schema Computed Features:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                        {Object.entries(currentReport.url_result.features).map(([k, v]) => (
                          <div key={k} className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                            <div className="text-[10px] text-slate-400 truncate">{k}</div>
                            <div className="font-semibold text-slate-800">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentReport.url_result.top_signals?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Interpretable Diagnostic Signals:
                      </span>
                      {currentReport.url_result.top_signals.map((sig, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900">
                          <strong className="mr-1">[{sig.severity}] {sig.feature}:</strong>
                          <span>{sig.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* 4. Screenshot Vision & OCR */}
            {currentReport.vision_result?.extracted_text && (
              <CollapsibleSection
                id="screenshot-analysis"
                title={t('sec_screenshot')}
                icon={ImageIcon}
                badge={currentReport.vision_result.ocr_engine}
                badgeType="neutral"
                defaultOpen={false}
              >
                <div className="pt-2 space-y-3">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {currentReport.vision_result.extracted_text}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* 5. Rules Triggered */}
            {currentReport.triggered_rules && currentReport.triggered_rules.length > 0 && (
              <CollapsibleSection
                id="rules-triggered"
                title={t('sec_rules')}
                icon={Scale}
                badge={`${currentReport.triggered_rules.length} matched`}
                badgeType="warning"
                defaultOpen={false}
              >
                <div className="pt-2 space-y-3">
                  {currentReport.triggered_rules.map((rule) => (
                    <div key={rule.rule_id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {isTechnicalMode ? `${rule.rule_id}: ` : ''}{rule.rule_name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 font-mono">
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-slate-600">{rule.explanation}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* 6. Technical Report */}
            {isTechnicalMode && currentReport.technical_report && (
              <CollapsibleSection
                id="technical-report"
                title={t('sec_technical')}
                icon={Cpu}
                badge="Raw Forensic Log"
                badgeType="neutral"
                defaultOpen={false}
              >
                <div className="pt-2">
                  <div className="p-4 rounded-xl bg-stone-900 text-stone-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                    {currentReport.technical_report}
                  </div>
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: One-Click Demo Scenarios (Friendly cards) */}
      <DemoScenarioCards onSelectScenario={handleSelectScenario} />

      {/* Share-Safe Summary Modal */}
      <ShareSafeSummaryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        report={currentReport}
      />
    </div>
  );
}
