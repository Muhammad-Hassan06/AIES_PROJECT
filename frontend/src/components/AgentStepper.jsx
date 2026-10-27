import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, Workflow, Search, 
  FileText, Image as ImageIcon, Scale, ShieldCheck, Cpu 
} from 'lucide-react';

export const PIPELINE_AGENTS = [
  { id: 'agent_intake', name: 'Intake & Planning', icon: Workflow, desc: 'Validating payload and routing modalities' },
  { id: 'agent_vision', name: 'Vision & OCR', icon: ImageIcon, desc: 'Extracting text and visual forgery cues' },
  { id: 'agent_url', name: 'URL Intelligence', icon: Search, desc: 'Evaluating PhiUSIIL schema features' },
  { id: 'agent_nlp', name: 'Message NLP', icon: FileText, desc: 'Detecting urgency, tokens & Pakistani cues' },
  { id: 'agent_rules', name: 'Expert Rules Engine', icon: Scale, desc: 'Applying deterministic IF–THEN constraints' },
  { id: 'agent_verifier', name: 'Evidence Verifier', icon: ShieldCheck, desc: 'Validating cross-modal consistency' },
  { id: 'agent_risk', name: 'Risk Assessor', icon: Cpu, desc: 'Synthesizing final risk score & level' },
  { id: 'agent_reporter', name: 'Report Generator', icon: FileText, desc: 'Compiling structured explainable dossier' },
];

export default function AgentStepper({ isInvestigating, trace = [] }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (!isInvestigating) {
      if (trace.length > 0) {
        setActiveStepIndex(PIPELINE_AGENTS.length);
      }
      return;
    }

    // Step through calmly over ~2.5s without flashing
    setActiveStepIndex(0);
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < PIPELINE_AGENTS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 320);

    return () => clearInterval(interval);
  }, [isInvestigating, trace]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Workflow className="w-4 h-4 text-teal-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            8-Agent AI Investigation Pipeline
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {isInvestigating ? 'Orchestration Active' : 'Pipeline Complete'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PIPELINE_AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          const isDone = !isInvestigating ? true : idx < activeStepIndex;
          const isCurrent = isInvestigating && idx === activeStepIndex;
          const isPending = isInvestigating && idx > activeStepIndex;

          return (
            <div
              key={agent.id}
              className={`p-3 rounded-xl border text-xs transition-all duration-300 ${
                isDone
                  ? 'bg-stone-50/80 border-stone-200 text-slate-800'
                  : isCurrent
                  ? 'bg-teal-50/70 border-teal-300 shadow-xs'
                  : 'bg-white border-stone-100 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className={`p-1.5 rounded-lg ${isDone ? 'bg-teal-100 text-teal-800' : isCurrent ? 'bg-teal-600 text-white' : 'bg-stone-100 text-slate-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900 truncate">
                    {agent.name}
                  </span>
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {agent.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
