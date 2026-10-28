import React, { useState, useEffect } from 'react';
import { 
  EyeOff, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, 
  RefreshCw, Search, Filter, ExternalLink, Copy, Check, Lock, 
  FileText, Smartphone, Mail, AlertOctagon, HelpCircle, 
  Trash2, ChevronRight, ArrowRight, UserCheck, Layers, Info, Download, Printer
} from 'lucide-react';
import { 
  createPrivacyInvestigation, listPrivacyInvestigations, 
  getPrivacyInvestigation, deletePrivacyInvestigation, 
  listPrivacyRemediationTasks, preparePrivacyRemediation, 
  executePrivacyRemediation, getPrivacyProvidersStatus, 
  getPrivacyOverview 
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function DigitalPrivacyPage() {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, new_inv, exposure_map, spam_studio, remediation, report
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeInvestigation, setActiveInvestigation] = useState(null);
  const [investigationsList, setInvestigationsList] = useState([]);
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [providersStatus, setProvidersStatus] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [copiedTaskId, setCopiedTaskId] = useState(null);
  const [academicPanelOpen, setAcademicPanelOpen] = useState(false);

  // Form State
  const [investigationType, setInvestigationType] = useState('combined');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [messageTextInput, setMessageTextInput] = useState('');
  const [senderEmailInput, setSenderEmailInput] = useState('');
  const [senderPhoneInput, setSenderPhoneInput] = useState('');
  const [emailHeadersInput, setEmailHeadersInput] = useState('');
  const [urlsInput, setUrlsInput] = useState('');
  const [callLogCsvInput, setCallLogCsvInput] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);

  // Filter State for Exposure Map
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');

  // Load Overview Data on Mount
  useEffect(() => {
    loadOverviewAndHistory();
  }, []);

  const loadOverviewAndHistory = async () => {
    try {
      setLoading(true);
      const [metrics, list, pStatus] = await Promise.all([
        getPrivacyOverview().catch(() => null),
        listPrivacyInvestigations(30).catch(() => []),
        getPrivacyProvidersStatus().catch(() => [])
      ]);
      setOverviewMetrics(metrics);
      setInvestigationsList(list);
      setProvidersStatus(pStatus);

      // Load latest investigation if available and none selected
      if (list && list.length > 0 && !activeInvestigation) {
        setActiveInvestigation(list[0]);
      }
    } catch (err) {
      console.error('Failed to load privacy overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInvestigation = async (e) => {
    e.preventDefault();
    if (!consentConfirmed || !authorizationConfirmed) {
      addToast('You must confirm authorization and consent before initiating privacy checks.', 'error');
      return;
    }

    if (investigationType === 'email' && !emailInput.trim()) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    if (investigationType === 'phone' && !phoneInput.trim()) {
      addToast('Please enter a valid phone number.', 'error');
      return;
    }

    if (investigationType === 'spam_source' && !messageTextInput.trim() && !screenshotBase64 && !callLogCsvInput.trim()) {
      addToast('Please provide spam message text, screenshot, or call-log CSV.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const urlsParsed = urlsInput.split('\n').map(u => u.trim()).filter(Boolean);

      const payload = {
        investigation_type: investigationType,
        email: emailInput.trim() || null,
        phone: phoneInput.trim() || null,
        message_text: messageTextInput.trim() || null,
        sender_email: senderEmailInput.trim() || null,
        sender_phone: senderPhoneInput.trim() || null,
        email_headers: emailHeadersInput.trim() || null,
        urls: urlsParsed.length ? urlsParsed : null,
        call_log_csv: callLogCsvInput.trim() || null,
        screenshot_base64: screenshotBase64 || null,
        user_description: userDescription.trim() || null,
        user_consent_confirmed: consentConfirmed,
        authorized_for_identifiers: authorizationConfirmed
      };

      const res = await createPrivacyInvestigation(payload);
      setActiveInvestigation(res);
      addToast('Privacy & Spam Defense Investigation completed!', 'success');
      setActiveSubTab('exposure_map');
      loadOverviewAndHistory();
    } catch (err) {
      addToast(err.message || 'Investigation failed to execute.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast('Image exceeds maximum allowed size (8MB).', 'error');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      setScreenshotBase64(b64);
      addToast(`Evidence screenshot loaded: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleCallLogUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCallLogCsvInput(reader.result);
      addToast(`Call log CSV loaded (${file.name})`, 'info');
    };
    reader.readAsText(file);
  };

  const handleExecuteTask = async (taskId, action, note = '') => {
    try {
      const updated = await executePrivacyRemediation(taskId, action, note);
      addToast(`Remediation task updated: ${updated.action_status}`, 'success');
      // Refresh current investigation
      if (activeInvestigation?.investigation_id) {
        const fresh = await getPrivacyInvestigation(activeInvestigation.investigation_id);
        setActiveInvestigation(fresh);
      }
      loadOverviewAndHistory();
    } catch (err) {
      addToast(err.message || 'Failed to update remediation task', 'error');
    }
  };

  const handleCopyDraft = (text, taskId) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    addToast('Draft request copied to clipboard!', 'success');
    setTimeout(() => setCopiedTaskId(null), 2500);
  };

  const handleDeleteInvestigation = async (invId) => {
    if (!window.confirm(`Permanently purge investigation ${invId} and all associated findings from your local vault?`)) {
      return;
    }
    try {
      await deletePrivacyInvestigation(invId);
      addToast('Investigation permanently deleted.', 'info');
      if (activeInvestigation?.investigation_id === invId) {
        setActiveInvestigation(null);
      }
      loadOverviewAndHistory();
    } catch (err) {
      addToast(err.message || 'Failed to delete investigation', 'error');
    }
  };

  // Filter findings for Exposure Map
  const filteredFindings = (activeInvestigation?.findings || []).filter(f => {
    if (riskFilter !== 'ALL' && f.risk_level !== riskFilter) return false;
    if (verificationFilter !== 'ALL' && f.verification_status !== verificationFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
            <EyeOff className="w-4 h-4 text-teal-700" />
            <span>Privacy Remediation & Spam Defense Agent (DFSD)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Digital Footprint & Privacy Defense Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evidence-driven discovery for exposed email addresses, Pakistani phone numbers, unsolicited telemarketing, and practical cyber-threat remediation.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAcademicPanelOpen(prev => !prev)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-teal-700" />
            <span>{academicPanelOpen ? 'Hide Architecture' : 'AIES Architecture'}</span>
          </button>

          <button
            type="button"
            onClick={loadOverviewAndHistory}
            disabled={loading}
            className="p-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Academic AIES Architecture & Models Disclosure Panel */}
      {academicPanelOpen && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 text-slate-800 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-700 text-white rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-black text-teal-950 uppercase tracking-wide">
                AIES Semester Project Architecture: 8-Agent Explainable Engine
              </h2>
            </div>
            <span className="text-[10px] bg-teal-200/60 text-teal-900 font-mono font-bold px-2 py-0.5 rounded">
              AIES-DFSD-v1.0
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            This module integrates symbolic reasoning with supervised ML models to investigate digital exposure and spam sources without compromising personal privacy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1">
              <div className="font-bold text-teal-900">1. Machine Learning Models</div>
              <p className="text-[11px] text-slate-600">
                <strong>URL Phishing:</strong> Random Forest (100 trees) on PhiUSIIL dataset augmented with Pakistani banking lures (HBL, Meezan, JazzCash, BISP 8171).<br />
                <strong>NLP Text:</strong> Multinomial Naive Bayes with sublinear TF-IDF on curated Pakistani threat corpus.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1">
              <div className="font-bold text-teal-900">2. Deterministic Expert Rules</div>
              <p className="text-[11px] text-slate-600">
                12 explicit expert-system rules (<code>RULE_DF_01</code> to <code>RULE_DF_12</code>) strictly enforce evidence boundaries, OTP harvest safeguards, and distinguish commercial marketing from cyberattacks.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1">
              <div className="font-bold text-teal-900">3. Multi-Provider Fallback</div>
              <p className="text-[11px] text-slate-600">
                Supports Google Gemini 2.5 Flash, Groq LLaMA 3.3, OpenAI, and Anthropic. If APIs are unconfigured or fail, system operates with 100% deterministic local reasoning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-stone-200">
        {[
          { id: 'overview', label: 'Privacy Overview', icon: ShieldCheck },
          { id: 'new_inv', label: 'New Investigation', icon: Search },
          { id: 'exposure_map', label: `Exposure Map (${activeInvestigation?.findings?.length || 0})`, icon: EyeOff },
          { id: 'spam_studio', label: 'Spam Intelligence', icon: AlertOctagon },
          { id: 'remediation', label: `Remediation Center (${activeInvestigation?.remediation_tasks?.length || 0})`, icon: UserCheck },
          { id: 'report', label: 'Audit Report', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-slate-600 hover:text-slate-900 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRIVACY OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Investigations</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{overviewMetrics?.total_investigations || 0}</div>
              <div className="text-[10px] text-teal-700 font-medium mt-0.5">Audited cases</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verified Findings</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{overviewMetrics?.verified_exposure_findings || 0}</div>
              <div className="text-[10px] text-rose-700 font-medium mt-0.5">Confirmed leaks</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Potential Matches</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{overviewMetrics?.potential_matches || 0}</div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">Unverified index</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Open Tasks</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{overviewMetrics?.open_remediation_tasks || 0}</div>
              <div className="text-[10px] text-indigo-700 font-medium mt-0.5">Action pending</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Actions</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{overviewMetrics?.completed_remediation_actions || 0}</div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Verified removals</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Latest Audit</div>
              <div className="text-xs font-bold text-slate-800 mt-2 truncate">
                {overviewMetrics?.latest_check_at ? new Date(overviewMetrics.latest_check_at).toLocaleDateString() : 'None Yet'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">UTC Timestamp</div>
            </div>
          </div>

          {/* Banner: Active Case or Start New */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-mono font-bold">
                  {activeInvestigation ? activeInvestigation.investigation_id : 'NO ACTIVE AUDIT'}
                </span>
                {activeInvestigation && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    activeInvestigation.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                    activeInvestigation.risk_level === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                    activeInvestigation.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {activeInvestigation.risk_level} RISK
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeInvestigation ? `Active Investigation: ${activeInvestigation.target_masked}` : 'Protect Your Digital Footprint'}
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                {activeInvestigation
                  ? activeInvestigation.executive_summary
                  : 'Start an evidence-backed audit to discover where your Pakistani mobile number or email address appears in breach databases or public search indices.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSubTab('new_inv')}
                className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Start New Investigation</span>
              </button>
            </div>
          </div>

          {/* Configured Discovery & LLM Providers Status */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              <span>Provider Capabilities & Operational Status</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {providersStatus.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{p.provider_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.is_healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-slate-600'
                    }`}>
                      {p.is_healthy ? 'Active' : (p.is_configured ? 'Error' : 'Unconfigured')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{p.status_message}</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Type: {p.provider_type} {p.model_name ? `• Model: ${p.model_name}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Investigations List */}
          {investigationsList.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Recent Privacy Audit History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Investigation ID</th>
                      <th className="py-2.5 px-3">Target</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Risk Level</th>
                      <th className="py-2.5 px-3">Findings</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-slate-700">
                    {investigationsList.map(inv => (
                      <tr key={inv.investigation_id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-900">{inv.investigation_id}</td>
                        <td className="py-2.5 px-3 font-semibold">{inv.target_masked}</td>
                        <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">{inv.investigation_type}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            inv.risk_level === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                            inv.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {inv.risk_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{inv.findings?.length || 0}</td>
                        <td className="py-2.5 px-3 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInvestigation(inv);
                              setActiveSubTab('exposure_map');
                            }}
                            className="text-teal-700 hover:text-teal-900 font-bold cursor-pointer"
                          >
                            Open →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvestigation(inv.investigation_id)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer ml-2"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEW INVESTIGATION INTAKE FORM */}
      {activeSubTab === 'new_inv' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Start Privacy & Spam Source Investigation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your investigation scope and enter the identifiers you have explicit authorization to check.
            </p>
          </div>

          <form onSubmit={handleStartInvestigation} className="space-y-6">
            {/* Investigation Scope Radio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Investigation Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'combined', label: 'Full Combined Audit', desc: 'Email + Phone + Spam' },
                  { id: 'email', label: 'Email Exposure', desc: 'Breach databases & search' },
                  { id: 'phone', label: 'Phone Exposure', desc: 'Pakistani carrier + directory' },
                  { id: 'spam_source', label: 'Spam Source Only', desc: 'Message, headers & OCR' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInvestigationType(opt.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      investigationType === opt.id
                        ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-600'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Identifiers Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(investigationType === 'email' || investigationType === 'combined') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-700" />
                    <span>Your Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Masked as m***@domain.com in reports and hashed with keyed HMAC.</p>
                </div>
              )}

              {(investigationType === 'phone' || investigationType === 'combined') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                    <span>Your Phone Number (Pakistani Mobile / International)</span>
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 0300-1234567 or +923001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Supports Jazz, Zong, Ufone, Telenor, Warid, SCOM.</p>
                </div>
              )}
            </div>

            {/* Spam Evidence Inputs (for spam_source or combined) */}
            {(investigationType === 'spam_source' || investigationType === 'combined') && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  <span>Unwanted Communication & Spam Evidence (Optional)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pasted Message Content</label>
                  <textarea
                    rows={3}
                    value={messageTextInput}
                    onChange={(e) => setMessageTextInput(e.target.value)}
                    placeholder="Paste promotional SMS, WhatsApp message, or email body..."
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Sender Email (if known)</label>
                    <input
                      type="text"
                      value={senderEmailInput}
                      onChange={(e) => setSenderEmailInput(e.target.value)}
                      placeholder="e.g. promo@untrusted-store.pk"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Sender Phone / Caller ID (if known)</label>
                    <input
                      type="text"
                      value={senderPhoneInput}
                      onChange={(e) => setSenderPhoneInput(e.target.value)}
                      placeholder="e.g. +92-312-9988112"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Upload SMS/WhatsApp Screenshot</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                    {screenshotName && <p className="text-[10px] text-teal-700">Selected: {screenshotName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Upload Call Log Export (CSV)</label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCallLogUpload}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                    {callLogCsvInput && <p className="text-[10px] text-teal-700">CSV data loaded for burst analysis.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Mandatory Legal & Ethical Consent Checkboxes */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Consent & Privacy Notice (Ethical Safeguards)</span>
              </div>

              <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-teal-700 focus:ring-teal-700"
                />
                <span>
                  <strong>User Consent:</strong> I authorize CyberShield AI to execute privacy-preserving discovery checks for the supplied identifiers against configured public directories and exposure indices.
                </span>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={authorizationConfirmed}
                  onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-teal-700 focus:ring-teal-700"
                />
                <span>
                  <strong>Identifier Ownership:</strong> I certify that I own or hold explicit written authorization from the owner to investigate these identifiers.
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('overview')}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-slate-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:bg-stone-300 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer transition-colors"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Orchestrating 8-Agent Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Run Digital Footprint Audit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: EXPOSURE MAP (FINDINGS) */}
      {activeSubTab === 'exposure_map' && (
        <div className="space-y-4">
          {!activeInvestigation ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <EyeOff className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-700">No Active Exposure Map</div>
              <p className="text-xs max-w-md mx-auto">
                No active investigation selected. Run a new audit or select an existing case from the Overview tab.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('new_inv')}
                className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Start Investigation →
              </button>
            </div>
          ) : (
            <>
              {/* Coverage Disclosure Banner */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    Transparent Coverage Accounting ({activeInvestigation.coverage_summary.coverage_level} Coverage)
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Sources checked: <strong>{activeInvestigation.coverage_summary.sources_checked}</strong> • 
                    Potential matches: <strong>{activeInvestigation.coverage_summary.potential_matches}</strong> • 
                    Independently verified: <strong>{activeInvestigation.coverage_summary.verified_findings}</strong> • 
                    Unavailable/Skipped: <strong>{activeInvestigation.coverage_summary.sources_unavailable}</strong>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-stone-100 rounded-lg font-mono font-bold text-slate-700 text-[11px]">
                  Target: {activeInvestigation.target_masked}
                </span>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Findings:</span>
                </span>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="CRITICAL">Critical Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>

                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Verification States</option>
                  <option value="VERIFIED">Independently Verified</option>
                  <option value="UNVERIFIED_INDEX">Unverified Search Index</option>
                  <option value="POTENTIAL_MATCH">Potential Match</option>
                </select>

                <span className="text-slate-400 ml-auto">
                  Showing {filteredFindings.length} of {activeInvestigation.findings.length} findings
                </span>
              </div>

              {/* Findings Cards Grid */}
              {filteredFindings.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  Zero exposure findings match the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFindings.map(f => (
                    <div 
                      key={f.finding_id}
                      className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-teal-300 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            f.risk_level === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                            f.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {f.risk_level} RISK
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            f.verification_status === 'VERIFIED' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-stone-100 text-slate-600'
                          }`}>
                            {f.verification_status}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900">{f.source_name}</h4>
                          <p className="text-[11px] text-slate-400">Category: {f.exposure_category} • Source: {f.source_type}</p>
                        </div>

                        {f.evidence_excerpt_redacted && (
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-slate-600 font-mono leading-relaxed">
                            {f.evidence_excerpt_redacted}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          Action: <strong className="text-slate-800">{f.recommended_action}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedFinding(f)}
                          className="text-teal-700 hover:text-teal-900 font-bold cursor-pointer flex items-center space-x-1"
                        >
                          <span>Evidence & Provenance</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Finding Detail Drawer Modal */}
          {selectedFinding && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-teal-800 font-bold">{selectedFinding.finding_id}</span>
                    <h3 className="text-base font-black text-slate-900">{selectedFinding.source_name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFinding(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900">Verification & Confidence:</span>
                    <p className="mt-0.5 text-slate-600">{selectedFinding.confidence_explanation} (Confidence score: {selectedFinding.confidence_score})</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900">Redacted Evidence Excerpt:</span>
                    <div className="mt-1 p-3 rounded-xl bg-stone-50 border border-stone-200 font-mono text-[11px] text-slate-800 leading-relaxed">
                      {selectedFinding.evidence_excerpt_redacted || 'No textual snippet available.'}
                    </div>
                  </div>

                  {selectedFinding.source_url && (
                    <div>
                      <span className="font-bold text-slate-900">Verified Source Reference:</span>
                      <a
                        href={selectedFinding.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block text-teal-700 hover:underline break-all"
                      >
                        {selectedFinding.source_url}
                      </a>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px]">
                    <strong>Scientific Limitation Notice:</strong> A search result match indicates this identifier was referenced or indexed near this page. It does not prove account registration or active fraud.
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFinding(null);
                      setActiveSubTab('remediation');
                    }}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Go to Remediation Center →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SPAM INTELLIGENCE */}
      {activeSubTab === 'spam_studio' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Spam Source Forensics & Fraud Impersonation Engine
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analyzes unsolicited SMS, WhatsApp offers, and promotional call patterns for fraudulent Pakistani bank and telecom impersonation, pressure tactics, and credential harvesting.
            </p>

            {/* Impersonated Organizations Warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-teal-700" />
                  <span>Impersonation Analysis Criteria</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li><strong>Pakistani Commercial Banks:</strong> HBL, Meezan, UBL, MCB, Bank Alfalah</li>
                  <li><strong>Fintech Wallets:</strong> JazzCash, EasyPaisa, SadaPay, NayaPay</li>
                  <li><strong>Government Programs:</strong> BISP 8171, Ehsaas, NADRA, FIA</li>
                  <li><strong>Courier Services:</strong> TCS Express, Leopards Courier</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Regulatory PTA / SBP Rules</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>SBP strictly prohibits requesting customer OTPs or ATM PINs over calls or SMS.</li>
                  <li>Official BISP communications only originate from shortcode <strong>8171</strong>.</li>
                  <li>Unwanted promotional SMS can be reported to PTA by forwarding to <strong>9000</strong>.</li>
                  <li>Do Not Call Register (DNCR): Send 'reg' to <strong>4272</strong> to opt out.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REMEDIATION CENTER */}
      {activeSubTab === 'remediation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Privacy Remediation Tasks</h3>
              <p className="text-xs text-slate-500">Actionable tasks with verified tracking states and official opt-out procedures.</p>
            </div>
          </div>

          {(!activeInvestigation?.remediation_tasks || activeInvestigation.remediation_tasks.length === 0) ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No pending remediation tasks. All investigated sources are either clean or not yet audited.
            </div>
          ) : (
            <div className="space-y-4">
              {activeInvestigation.remediation_tasks.map(task => (
                <div key={task.task_id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-teal-800 font-bold">{task.task_id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-900">
                          {task.action_type}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{task.target_name}</h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      task.action_status === 'REMOVAL_VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                      task.action_status === 'REQUEST_SUBMITTED' ? 'bg-indigo-100 text-indigo-800' :
                      task.action_status === 'REQUEST_DRAFTED' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-slate-700'
                    }`}>
                      Status: {task.action_status}
                    </span>
                  </div>

                  {/* Instructions */}
                  <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {task.instructions_text}
                  </div>

                  {/* Draft payload for deletion request if available */}
                  {task.draft_payload && (
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Drafted Deletion Request (PECA 2016 Compliant)</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDraft(`${task.draft_payload.subject}\n\n${task.draft_payload.body}`, task.task_id)}
                          className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold text-teal-800 hover:bg-stone-50 cursor-pointer flex items-center space-x-1"
                        >
                          {copiedTaskId === task.task_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedTaskId === task.task_id ? 'Copied' : 'Copy Draft'}</span>
                        </button>
                      </div>
                      <div className="p-2 bg-white rounded border border-stone-200 font-mono text-[11px] text-slate-800 whitespace-pre-line">
                        <strong>Subject:</strong> {task.draft_payload.subject}
                        {'\n\n'}
                        {task.draft_payload.body}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {task.official_portal_url && (
                      <a
                        href={task.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:underline font-bold flex items-center space-x-1"
                      >
                        <span>Open Verified Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <div className="flex items-center space-x-2 ml-auto">
                      {task.action_status !== 'REQUEST_SUBMITTED' && task.action_status !== 'REMOVAL_VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleExecuteTask(task.task_id, 'submit', 'User submitted request')}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold cursor-pointer"
                        >
                          Mark as Submitted
                        </button>
                      )}

                      {task.action_status !== 'REMOVAL_VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleExecuteTask(task.task_id, 'verify', 'Verified data removal')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold cursor-pointer"
                        >
                          Mark as Verified
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT REPORT */}
      {activeSubTab === 'report' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto print:border-none print:shadow-none">
          {!activeInvestigation ? (
            <div className="text-center text-slate-400 py-12 text-xs">
              No investigation report to display.
            </div>
          ) : (
            <>
              {/* Report Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div>
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    CyberShield AI • Forensic Privacy Audit Report
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    Digital Footprint & Exposure Assessment
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ID: <span className="font-mono font-bold text-slate-800">{activeInvestigation.investigation_id}</span> • 
                    Target: <span className="font-semibold text-slate-800">{activeInvestigation.target_masked}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Executive Summary</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  {activeInvestigation.executive_summary}
                </p>
                <div className="text-[10px] text-slate-400">
                  Generated via: {activeInvestigation.llm_provider_used} {activeInvestigation.is_deterministic_fallback ? '(Local Fallback)' : ''}
                </div>
              </div>

              {/* Coverage Accounting Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Discovery Sources Checked</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-slate-500 text-[10px]">Sources Checked</span>
                    <div className="font-black text-slate-900 text-base">{activeInvestigation.coverage_summary.sources_checked}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-slate-500 text-[10px]">Potential Matches</span>
                    <div className="font-black text-amber-700 text-base">{activeInvestigation.coverage_summary.potential_matches}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-slate-500 text-[10px]">Verified Findings</span>
                    <div className="font-black text-rose-700 text-base">{activeInvestigation.coverage_summary.verified_findings}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <span className="text-slate-500 text-[10px]">Sources Unavailable</span>
                    <div className="font-black text-slate-500 text-base">{activeInvestigation.coverage_summary.sources_unavailable}</div>
                  </div>
                </div>
              </div>

              {/* 8-Agent Execution Trace */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Agentic Orchestration Trace</h4>
                <div className="divide-y divide-stone-100 text-xs">
                  {activeInvestigation.execution_trace.map((step, idx) => (
                    <div key={idx} className="py-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{step.agent_name}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{step.summary}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        step.status === 'SKIPPED' ? 'bg-stone-100 text-slate-500' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggered Rules */}
              {activeInvestigation.triggered_rules?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Triggered Expert Rules</h4>
                  <div className="space-y-1.5 text-xs">
                    {activeInvestigation.triggered_rules.map((rule, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start space-x-2">
                        <span className="font-mono font-bold text-teal-800 shrink-0">{rule.rule_id}:</span>
                        <span className="text-slate-700">{rule.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forensic Limitations Disclosure */}
              <div className="pt-4 border-t border-stone-200 text-[11px] text-slate-500 space-y-1">
                <strong>Forensic Disclosures & Academic Provenance:</strong>
                <p className="leading-relaxed">{activeInvestigation.limitations_disclosure}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
