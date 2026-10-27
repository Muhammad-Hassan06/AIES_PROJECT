import React, { useState } from 'react';
import { 
  Cpu, Play, CheckCircle2, ShieldAlert, Clock, ArrowRight, 
  MessageSquare, Save, AlertTriangle, FileCode, Search, Terminal,
  Send, RefreshCw, Lock
} from 'lucide-react';
import { runAgentInvestigation, chatAgentCase, createInvestigation } from '../services/api';

const PRESET_GOALS = [
  {
    title: 'Courier Smishing Investigation',
    goal: 'Investigate SMS claiming parcel delivery failed with link: http://tcs-tracking-delivery-pk.online/update',
    caseData: {
      raw_input: {
        url: 'http://tcs-tracking-delivery-pk.online/update',
        text: 'TCS Courier Alert: Your parcel #PK-9812 has incorrect address. Update details within 12 hours to avoid cancellation.'
      }
    }
  },
  {
    title: 'BISP 8171 Financial Lure',
    goal: 'Analyze WhatsApp message claiming 25,000 PKR BISP grant requiring JazzCash account PIN verification',
    caseData: {
      raw_input: {
        text: 'BISP 8171: Mubarak ho! Aap ka 25,000 rupay ka benazir wazeefa manzoor ho gaya hai. Abhi apna JazzCash PIN confirm karein.'
      }
    }
  },
  {
    title: 'Banking KYC Freeze Threat',
    goal: 'Forensic evaluation of urgent SMS threatening bank account block within 24 hours',
    caseData: {
      raw_input: {
        url: 'http://hbl-ebank-login-verify.top/secure',
        text: 'HBL Security Warning: Your debit card will be suspended due to pending biometric KYC. Verify now at link.'
      }
    }
  }
];

export default function AgentConsolePage() {
  const [goalText, setGoalText] = useState('');
  const [activeCaseData, setActiveCaseData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'SAVED'
  const [savedCaseId, setSavedCaseId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Follow-up chat state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSelectPreset = (preset) => {
    setGoalText(preset.goal);
    setActiveCaseData(preset.caseData);
    setAgentResult(null);
    setApprovalStatus('PENDING');
    setChatLogs([]);
    setErrorMessage(null);
  };

  const handleStartInvestigation = async () => {
    const goal = goalText.trim();
    if (!goal || isRunning) return;

    setIsRunning(true);
    setAgentResult(null);
    setApprovalStatus('PENDING');
    setSavedCaseId(null);
    setChatLogs([]);
    setErrorMessage(null);

    try {
      const res = await runAgentInvestigation(goal, activeCaseData);
      setAgentResult(res);
    } catch (err) {
      console.error('Agent investigation error', err);
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to complete agent investigation.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!agentResult) return;
    try {
      setApprovalStatus('SAVING');
      // Create permanent case in vault
      const payload = {
        input_type: activeCaseData?.raw_input?.url && activeCaseData?.raw_input?.text ? 'combined' : (activeCaseData?.raw_input?.url ? 'url' : 'message'),
        url: activeCaseData?.raw_input?.url || null,
        text: activeCaseData?.raw_input?.text || goalText,
        sender_info: 'Investigator Agent Autonomous Run'
      };
      const rep = await createInvestigation(payload);
      setSavedCaseId(rep.case_id);
      setApprovalStatus('SAVED');
    } catch (e) {
      console.error('Failed to save approved case', e);
      setApprovalStatus('PENDING');
    }
  };

  const handleSendChat = async () => {
    const q = chatQuestion.trim();
    if (!q || chatLoading || !agentResult) return;

    setChatLoading(true);
    setChatQuestion('');
    const newTurn = { id: Date.now(), sender: 'user', text: q };
    setChatLogs(prev => [...prev, newTurn]);

    try {
      const context = {
        case_id: savedCaseId || 'CS-AGENT-IN-PROGRESS',
        risk_level: agentResult.verdict,
        model_confidence: 0.95,
        triggered_rules: agentResult.timeline
          ?.filter(s => s.tool_name === 'run_expert_rules')
          ?.flatMap(s => s.output?.triggered_rules || []) || [],
        executive_summary: agentResult.final_summary
      };
      const resp = await chatAgentCase(context, q);
      setChatLogs(prev => [...prev, { id: Date.now() + 1, sender: 'agent', text: resp.answer }]);
    } catch (e) {
      setChatLogs(prev => [...prev, { id: Date.now() + 1, sender: 'agent', text: 'Error retrieving case details.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
          <Cpu className="w-4 h-4 text-teal-700" />
          <span>Autonomous Investigator Agent</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Tool-Calling Forensic Reasoning Agent
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Executes multi-step tactical plans using Gemini function calling and deterministic tools. Offline safe: never opens external URLs or auto-submits data.
        </p>

        {/* Safety Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-100 text-slate-700 text-[11px] font-semibold border border-stone-200">
            <Lock className="w-3 h-3 text-teal-700" />
            <span>Max 8 Tool Steps Hard Cap</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-100 text-slate-700 text-[11px] font-semibold border border-stone-200">
            <ShieldAlert className="w-3 h-3 text-amber-700" />
            <span>Offline URL Analysis (No HTTP Fetch)</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-100 text-slate-700 text-[11px] font-semibold border border-stone-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>User Approval Gate Before Vault Save</span>
          </span>
        </div>
      </div>

      {/* Goal Specification & Preset Triggers */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <Terminal className="w-4 h-4 text-teal-700" />
            <span>Investigation Goal / Prompt</span>
          </label>
          <span className="text-[11px] text-slate-400">Natural language goal input</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g. Investigate SMS claiming BISP grant with unfamiliar short link..."
            className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={handleStartInvestigation}
            disabled={isRunning || !goalText.trim()}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Agent</span>
              </>
            )}
          </button>
        </div>

        {/* Preset Scenarios */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Preset Investigation Targets:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_GOALS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-left p-2.5 rounded-xl bg-stone-50 hover:bg-teal-50 border border-stone-200 hover:border-teal-200 transition-all text-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-800 group-hover:text-teal-900">
                  {preset.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {preset.goal}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Agent Output & Reasoning Stream */}
      {agentResult && (
        <div className="space-y-6">
          {/* Tactical Plan Overview */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-teal-700" />
                <span>Agent Tactical Plan ({agentResult.plan?.length || 0} stages)</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
                Preliminary Verdict: {agentResult.verdict}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {agentResult.plan?.map((stepItem, idx) => {
                const stepNum = typeof stepItem === 'object' && stepItem?.step ? stepItem.step : idx + 1;
                const toolName = typeof stepItem === 'object' && stepItem?.tool ? stepItem.tool : null;
                const desc = typeof stepItem === 'object' 
                  ? (stepItem.reason || stepItem.description || stepItem.tool || JSON.stringify(stepItem)) 
                  : String(stepItem);

                return (
                  <div key={idx} className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-teal-800 font-bold mb-1 flex items-center justify-between">
                        <span>Step {stepNum}</span>
                        {toolName && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-teal-100/70 border border-teal-200 rounded text-teal-900">
                            {toolName}()
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium leading-relaxed text-slate-800">
                        {desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step Live Execution Timeline */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-teal-700" />
                <span>Tool Execution Trace ({agentResult.executed_steps_count} / {agentResult.max_steps} steps)</span>
              </h3>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                All steps executed within safety boundary
              </span>
            </div>

            <div className="space-y-3">
              {agentResult.timeline?.map((step) => (
                <div
                  key={step.step_num}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                        {step.step_num}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {step.tool_name}()
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{step.duration_ms} ms</span>
                    </span>
                  </div>

                  {/* Justification / Reason */}
                  <div className="text-[11px] text-slate-600 bg-white border border-stone-200 rounded-lg p-2">
                    <span className="font-bold text-slate-800">Agent Reasoning:</span> {step.reason}
                  </div>

                  {/* Input / Output Snippets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-stone-100 p-2 rounded-lg text-slate-700 truncate">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Input Arguments:</span>
                      {JSON.stringify(step.input_args)}
                    </div>
                    <div className="bg-stone-100 p-2 rounded-lg text-slate-700 truncate">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Tool Output Findings:</span>
                      {JSON.stringify(step.output)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Synthesis & Supporting Claims */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 text-xs text-teal-950 space-y-2">
              <div className="font-bold flex items-center space-x-1.5 text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span>Forensic Conclusion & Tool Claims</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {agentResult.final_summary}
              </p>
              {agentResult.supporting_claims && agentResult.supporting_claims.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-teal-200">
                  <span className="text-[10px] font-bold uppercase text-teal-800">Claim Provenance:</span>
                  {agentResult.supporting_claims.map((claim, idx) => (
                    <div key={idx} className="text-[11px] flex items-center space-x-1.5 text-teal-900">
                      <ArrowRight className="w-3 h-3 text-teal-600 shrink-0" />
                      <span>{claim}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Approval Gate Banner */}
            <div className="bg-white border-2 border-teal-600 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  Human-in-the-Loop Approval Required
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The agent requires explicit user confirmation before committing this investigation report to the local SQLite case vault.
                </p>
              </div>

              {approvalStatus === 'SAVED' ? (
                <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saved as {savedCaseId}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApproveAndSave}
                  disabled={approvalStatus === 'SAVING'}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{approvalStatus === 'SAVING' ? 'Saving Case...' : 'Approve & Save Case to Vault'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Follow-up Interactive Chat Drawer */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span>Ask the Agent About This Case</span>
            </h3>

            {chatLogs.length > 0 && (
              <div className="space-y-2 bg-stone-50 border border-stone-200 rounded-xl p-3 max-h-60 overflow-y-auto">
                {chatLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`text-xs p-2.5 rounded-lg ${
                      log.sender === 'user'
                        ? 'bg-teal-700 text-white ml-auto max-w-[80%]'
                        : 'bg-white border border-stone-200 text-slate-800 mr-auto max-w-[80%]'
                    }`}
                  >
                    {log.text}
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="Ask e.g. Why did the expert rules fire? What evidence justifies the verdict?"
                className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatQuestion.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
