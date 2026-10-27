import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, XCircle, MinusCircle, 
  Workflow, ArrowRight, ShieldCheck, Cpu, 
  Search, FileText, Image as ImageIcon, Scale,
  ChevronRight, X, AlertCircle, Sparkles, Layers
} from 'lucide-react';

const AGENT_META = {
  agent_intake: { 
    title: '1. Intake & Planning', 
    type: 'Orchestrator',
    badge: 'Task Scheduler',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: Workflow,
    description: 'Inspects input structure, sanitizes input for prompt-injection, validates schemas, and builds the DAG task plan.'
  },
  agent_vision: { 
    title: '2. Vision & OCR', 
    type: 'Computer Vision',
    badge: 'OCR Engine',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: ImageIcon,
    description: 'Decompresses screenshots, validates image headers, extracts visible text with Tesseract OCR, and parses visual credential inputs.'
  },
  agent_url: { 
    title: '3. URL Intelligence', 
    type: 'ML Model Prediction',
    badge: 'Random Forest (PhiUSIIL)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Search,
    description: 'Extracts 15 lexical and structural features (entropy, continuation rate, TLDs) and queries the trained Random Forest classifier.'
  },
  agent_nlp: { 
    title: '4. Message Analysis', 
    type: 'NLP Model Prediction',
    badge: 'Naive Bayes + TF-IDF',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: FileText,
    description: 'Evaluates social-engineering pressure, advance-fee lures, and urgency tactics with token-level span attribution in English and Roman Urdu.'
  },
  agent_rules: { 
    title: '5. Expert System', 
    type: 'Symbolic AI',
    badge: '10+ IF-THEN Rules',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Scale,
    description: 'Evaluates deterministic expert rules for credential harvesting, institutional impersonation, and cross-modal evidence conflict.'
  },
  agent_verifier: { 
    title: '6. Evidence Verifier', 
    type: 'Factual Arbiter',
    badge: 'Provenance Audit',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: ShieldCheck,
    description: 'Audits factual claims across models and rules, checks data provenance, and resolves discordant classifications.'
  },
  agent_risk: { 
    title: '7. Risk Assessor', 
    type: 'Decision Engine',
    badge: 'Calibrated Synthesis',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: Cpu,
    description: 'Synthesizes model probabilities, rule severities, and insufficient-evidence safeguards into a calibrated five-tier risk verdict.'
  },
  agent_reporter: { 
    title: '8. Report Generation', 
    type: 'Generative AI Explainer',
    badge: 'Gemini / Safe Fallback',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Sparkles,
    description: 'Compiles plain-language citizen summaries, technical forensic dossiers, and official Pakistan legal and regulatory advisories.'
  },
};

export default function AgentWorkflowGraph({ 
  trace = [], 
  activeAgentId, 
  onSelectAgent,
  urlResult = null,
  nlpResult = null,
  visionResult = null,
  triggeredRules = []
}) {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Done
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3 mr-1 animate-spin text-teal-600" /> Running
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="flex items-center text-[10px] font-medium text-slate-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
            <MinusCircle className="w-3 h-3 mr-1" /> Skipped
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 mr-1 text-red-600" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center text-[10px] font-medium text-slate-400 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
    }
  };

  const handleNodeClick = (step) => {
    setSelectedAgent(step);
    if (onSelectAgent) onSelectAgent(step);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <Workflow className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>8-Agent Autonomous Investigation Pipeline</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Interactive DAG Trace
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Click any agent node to inspect its exact inputs, reasoning engine, and telemetry output
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200">
            {trace.filter(t => t.status === 'COMPLETED').length} of {trace.length || 8} Active
          </span>
        </div>
      </div>

      {/* 8-Agent Animated Flow Grid */}
      <div className="relative">
        {/* Animated Connecting Flow Track (desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 -translate-y-1/2 z-0 opacity-40" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
          {trace.map((step, idx) => {
            const meta = AGENT_META[step.agent_id] || { 
              title: step.agent_name, 
              type: 'Analysis Module', 
              badge: 'Component',
              badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
              icon: Cpu,
              description: 'Processes case signals and generates forensic findings.'
            };
            const IconComponent = meta.icon;
            const isSelected = selectedAgent?.agent_id === step.agent_id;

            return (
              <div
                key={step.agent_id || idx}
                onClick={() => handleNodeClick(step)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 bg-white ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-200 shadow-sm bg-teal-50/20'
                    : 'border-stone-200 hover:border-teal-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="p-1.5 rounded-lg bg-stone-100 text-teal-800 border border-stone-200 shrink-0">
                        <IconComponent className="w-4 h-4 text-teal-700" />
                      </div>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {meta.title}
                      </span>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>

                  {/* Engine Identification Tag */}
                  <div className="mb-2">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {step.summary || meta.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-stone-100 font-mono">
                  <span>Findings: <strong className="text-slate-700">{step.findings_count}</strong></span>
                  <span className="text-teal-800 font-semibold">
                    {step.duration_ms ? `${step.duration_ms.toFixed(1)} ms` : '--'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Detail Inspection Drawer (when an agent is clicked) */}
      {selectedAgent && (
        <div className="bg-stone-50/80 rounded-xl border border-stone-200 p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <div className="p-2 rounded-lg bg-white border border-stone-200 text-teal-800">
                <Cpu className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedAgent.agent_name}
                </h4>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                  <span>ID: {selectedAgent.agent_id}</span>
                  <span>•</span>
                  <span>Duration: {selectedAgent.duration_ms?.toFixed(1) || '--'} ms</span>
                  <span>•</span>
                  <span>Findings: {selectedAgent.findings_count}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAgent(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: Component Role & Engine */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Engine Mechanism & Attribution
              </span>
              <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Methodology:</span>
                  <span className="font-semibold text-slate-800">
                    {AGENT_META[selectedAgent.agent_id]?.type || 'Modular Pipeline Agent'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trained Artifact:</span>
                  <span className="font-mono text-teal-900 font-medium">
                    {AGENT_META[selectedAgent.agent_id]?.badge || 'Internal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 pt-1 border-t border-stone-100">
                  {AGENT_META[selectedAgent.agent_id]?.description}
                </p>
              </div>
            </div>

            {/* Right: Output Summary & Telemetry */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Execution Output Summary
              </span>
              <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-800 font-sans">
                  {selectedAgent.summary || 'Completed with verified signals.'}
                </div>
                {selectedAgent.started_at && (
                  <div className="text-slate-400 text-[10px] pt-1">
                    Started: {selectedAgent.started_at}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
