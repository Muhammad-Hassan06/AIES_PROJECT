import React from 'react';
import { 
  CheckCircle2, Clock, XCircle, MinusCircle, 
  Workflow, ArrowRight, ShieldCheck, Cpu, 
  Search, FileText, Image as ImageIcon, Scale
} from 'lucide-react';

const AGENT_META = {
  agent_intake: { title: 'Intake & Planning', icon: Workflow },
  agent_vision: { title: 'Vision & OCR', icon: ImageIcon },
  agent_url: { title: 'URL Intelligence', icon: Search },
  agent_nlp: { title: 'Message NLP', icon: FileText },
  agent_rules: { title: 'Expert Rules Engine', icon: Scale },
  agent_verifier: { title: 'Evidence Verifier', icon: ShieldCheck },
  agent_risk: { title: 'Risk Assessor', icon: Cpu },
  agent_reporter: { title: 'Report Generator', icon: FileText },
};

export default function AgentWorkflowGraph({ trace = [], activeAgentId, onSelectAgent }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Done
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-700/60 px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3 mr-1 animate-spin" /> In Progress
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="flex items-center text-xs text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded-full">
            <MinusCircle className="w-3 h-3 mr-1" /> Skipped
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center text-xs text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Workflow className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">
            Agentic AI Investigation Pipeline
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Real Multi-Step Orchestration Trace ({trace.length} Agents)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {trace.map((step, idx) => {
          const meta = AGENT_META[step.agent_id] || { title: step.agent_name, icon: Cpu };
          const IconComponent = meta.icon;
          const isSelected = activeAgentId === step.agent_id;

          return (
            <div
              key={step.agent_id || idx}
              onClick={() => onSelectAgent && onSelectAgent(step)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-slate-800/90 text-cyan-400">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-xs text-slate-200 truncate">
                    {step.agent_name}
                  </span>
                </div>
                {getStatusBadge(step.status)}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-2 min-h-[32px]">
                {step.summary || 'Awaiting execution...'}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span>Findings: {step.findings_count}</span>
                <span>{step.duration_ms ? `${step.duration_ms.toFixed(1)} ms` : '--'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
