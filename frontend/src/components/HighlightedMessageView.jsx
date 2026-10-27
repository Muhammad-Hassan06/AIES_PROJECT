import React, { useState } from 'react';
import { AlertCircle, Tag, Info } from 'lucide-react';

const CATEGORY_COLORS = {
  'Credential Harvesting': 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30',
  'Urgency & Pressure': 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
  'Legal & Intimidation Threat': 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30',
  'Financial / Fee Request': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30',
  'Prize & Lottery Lure': 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30',
  'Institutional Impersonation': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
  'Roman Urdu Fraud Cue': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
  'Verification Bypass': 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30',
};

export default function HighlightedMessageView({ text = '', spans = [] }) {
  const [activeSpan, setActiveSpan] = useState(null);

  if (!text) {
    return <div className="text-slate-500 text-sm italic">No message text submitted.</div>;
  }

  // Sort spans ascending by start index
  const sortedSpans = [...spans].sort((a, b) => a.start - b.start);

  const elements = [];
  let currentIndex = 0;

  sortedSpans.forEach((span, idx) => {
    // Text before the span
    if (span.start > currentIndex) {
      elements.push(
        <span key={`text-${currentIndex}`}>
          {text.substring(currentIndex, span.start)}
        </span>
      );
    }

    const colorClass = CATEGORY_COLORS[span.category] || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

    elements.push(
      <span
        key={`span-${idx}`}
        onClick={() => setActiveSpan(span)}
        className={`inline-block px-1.5 py-0.5 mx-0.5 rounded border text-xs font-medium cursor-pointer transition-colors ${colorClass}`}
        title={`${span.category}: ${span.explanation}`}
      >
        {text.substring(span.start, span.end)}
      </span>
    );

    currentIndex = Math.max(currentIndex, span.end);
  });

  // Remaining text after last span
  if (currentIndex < text.length) {
    elements.push(
      <span key={`text-end`}>
        {text.substring(currentIndex)}
      </span>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-sm font-mono leading-relaxed select-text">
        {elements}
      </div>

      {activeSpan ? (
        <div className="p-3 rounded-lg bg-slate-900 border border-cyan-800/60 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center text-xs font-semibold text-cyan-400">
              <Tag className="w-3.5 h-3.5 mr-1" /> {activeSpan.category}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Offset [{activeSpan.start}:{activeSpan.end}]
            </span>
          </div>
          <div className="text-xs text-slate-300 mb-1">
            Flagged Token: <span className="text-amber-300 font-mono font-semibold">"{activeSpan.text}"</span>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            {activeSpan.explanation}
          </p>
        </div>
      ) : spans.length > 0 ? (
        <div className="flex items-center text-xs text-slate-500 italic">
          <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
          Click on any highlighted token above to inspect the diagnostic explanation.
        </div>
      ) : null}
    </div>
  );
}
