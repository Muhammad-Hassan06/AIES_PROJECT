import React, { useState } from 'react';
import { Tag, Info, AlertTriangle } from 'lucide-react';

const CATEGORY_STYLES = {
  'Credential Harvesting': {
    underline: 'border-b-2 border-red-500 bg-red-50 text-red-950 font-medium',
    pill: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
    desc: 'Requests passwords, PINs, or 2FA OTP codes'
  },
  'Urgency & Pressure': {
    underline: 'border-b-2 border-amber-500 bg-amber-50 text-amber-950 font-medium',
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    desc: 'Artificial time limits creating panic'
  },
  'Legal & Intimidation Threat': {
    underline: 'border-b-2 border-rose-600 bg-rose-50 text-rose-950 font-medium',
    pill: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
    desc: 'Fake arrest warrants or police threats'
  },
  'Financial / Fee Request': {
    underline: 'border-b-2 border-orange-500 bg-orange-50 text-orange-950 font-medium',
    pill: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
    desc: 'Solicits advance processing fees or wallet transfers'
  },
  'Prize & Lottery Lure': {
    underline: 'border-b-2 border-purple-500 bg-purple-50 text-purple-950 font-medium',
    pill: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    desc: 'Unsolicited cash grant or lottery claims'
  },
  'Institutional Impersonation': {
    underline: 'border-b-2 border-teal-600 bg-teal-50 text-teal-950 font-medium',
    pill: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
    desc: 'Posing as banks, BISP, Pakistan Post, or FIA'
  },
  'Roman Urdu Fraud Cue': {
    underline: 'border-b-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-medium',
    pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    desc: 'Colloquial Pakistani phishing patterns'
  },
  'Verification Bypass': {
    underline: 'border-b-2 border-amber-600 bg-amber-50 text-amber-950 font-medium',
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    desc: 'Attempts to redirect away from official apps'
  },
};

export default function HighlightedMessageView({ text = '', spans = [] }) {
  const [hoveredSpan, setHoveredSpan] = useState(null);
  const [activeSpan, setActiveSpan] = useState(null);

  if (!text) {
    return <div className="text-slate-400 text-xs italic">No message text submitted for this case.</div>;
  }

  // Sort spans ascending by start index
  const sortedSpans = [...spans].sort((a, b) => a.start - b.start);

  const elements = [];
  let currentIndex = 0;

  sortedSpans.forEach((span, idx) => {
    // Normal text before this span
    if (span.start > currentIndex) {
      elements.push(
        <span key={`text-${currentIndex}`}>
          {text.substring(currentIndex, span.start)}
        </span>
      );
    }

    const conf = CATEGORY_STYLES[span.category] || {
      underline: 'border-b-2 border-teal-500 bg-teal-50 text-teal-950',
      pill: 'bg-stone-100 text-slate-700 border-stone-200',
      dot: 'bg-teal-500',
      desc: 'Suspicious linguistic pattern'
    };

    elements.push(
      <span
        key={`span-${idx}`}
        tabIndex={0}
        onMouseEnter={() => setHoveredSpan(span)}
        onMouseLeave={() => setHoveredSpan(null)}
        onClick={() => setActiveSpan(span)}
        onFocus={() => setHoveredSpan(span)}
        onBlur={() => setHoveredSpan(null)}
        className={`inline-block px-1 py-0.5 mx-0.5 rounded cursor-pointer transition-all ${conf.underline}`}
        aria-label={`${span.category}: ${span.explanation}`}
        role="button"
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

  const selectedOrHovered = hoveredSpan || activeSpan;

  // Unique categories present in this message for dynamic legend
  const presentCategories = Array.from(new Set(spans.map(s => s.category)));

  return (
    <div className="space-y-4">
      {/* Category Legend */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
          Threat Legend:
        </span>
        {Object.entries(CATEGORY_STYLES).map(([cat, conf]) => (
          <div
            key={cat}
            className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${conf.pill} ${
              presentCategories.includes(cat) ? 'ring-1 ring-stone-300 font-semibold' : 'opacity-70'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
            <span>{cat}</span>
          </div>
        ))}
      </div>

      {/* Message Text with Underlined Highlights */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 text-slate-900 text-sm font-sans leading-relaxed select-text shadow-xs">
        {elements}
      </div>

      {/* Hover / Active Explanation Tooltip Card */}
      {selectedOrHovered ? (
        <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 shadow-xs animate-fade-in space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center font-bold text-teal-900">
              <Tag className="w-3.5 h-3.5 mr-1 text-teal-700" />
              {selectedOrHovered.category}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Token: "{selectedOrHovered.text}"
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-normal">
            {selectedOrHovered.explanation}
          </p>
        </div>
      ) : spans.length > 0 ? (
        <div className="flex items-center text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          <span>Hover or tap on any underlined token to view the threat explanation.</span>
        </div>
      ) : null}
    </div>
  );
}
