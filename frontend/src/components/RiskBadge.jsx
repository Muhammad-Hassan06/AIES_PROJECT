import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';

export default function RiskBadge({ level, size = 'md' }) {
  const norm = (level || 'LOW').toUpperCase();

  const configs = {
    CRITICAL: {
      bg: 'bg-red-950/70 text-red-400 border-red-700/60 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
      icon: AlertOctagon,
      label: 'CRITICAL THREAT'
    },
    HIGH: {
      bg: 'bg-rose-950/70 text-rose-400 border-rose-700/60 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
      icon: ShieldAlert,
      label: 'HIGH RISK'
    },
    MEDIUM: {
      bg: 'bg-amber-950/70 text-amber-400 border-amber-600/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      icon: AlertTriangle,
      label: 'MEDIUM SUSPICION'
    },
    LOW: {
      bg: 'bg-emerald-950/70 text-emerald-400 border-emerald-600/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      icon: ShieldCheck,
      label: 'LOW RISK / CLEAN'
    },
    INSUFFICIENT_EVIDENCE: {
      bg: 'bg-slate-900/80 text-slate-400 border-slate-700/60',
      icon: HelpCircle,
      label: 'INSUFFICIENT EVIDENCE'
    }
  };

  const conf = configs[norm] || configs.LOW;
  const Icon = conf.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-sm px-3 py-1 space-x-1.5 font-semibold',
    lg: 'text-base px-4 py-2 space-x-2 font-bold tracking-wide'
  }[size] || 'text-sm px-3 py-1 space-x-1.5 font-semibold';

  return (
    <span className={`inline-flex items-center rounded-md border ${conf.bg} ${sizeClasses}`}>
      <Icon className={size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{conf.label}</span>
    </span>
  );
}
