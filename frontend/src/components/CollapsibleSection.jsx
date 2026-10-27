import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleSection({
  id,
  title,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  defaultOpen = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getBadgeClass = () => {
    switch (badgeType) {
      case 'danger':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'primary':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      data-testid={`collapsible-${id || 'section'}`}
      className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden transition-all duration-200"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${id}`}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-stone-100 text-slate-700">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="font-semibold text-slate-900 text-sm tracking-tight">
            {title}
          </span>
          {badge !== undefined && badge !== null && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-mono font-medium ${getBadgeClass()}`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">
            {isOpen ? 'Hide' : 'Show'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          id={`collapsible-content-${id}`}
          data-testid="collapsible-content"
          className="px-5 pb-5 pt-1 border-t border-stone-100 animate-fade-in"
        >
          {children}
        </div>
      )}
    </div>
  );
}
