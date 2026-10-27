import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RiskBadge({ level, size = 'md' }) {
  const { t } = useLanguage();
  const norm = (level || 'LOW').toUpperCase();

  const configs = {
    CRITICAL: {
      bg: 'bg-red-50 text-red-800 border-red-200',
      icon: AlertOctagon,
      labelKey: 'risk_critical',
      defaultLabel: 'CRITICAL THREAT'
    },
    HIGH: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: ShieldAlert,
      labelKey: 'risk_high',
      defaultLabel: 'HIGH RISK'
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      labelKey: 'risk_medium',
      defaultLabel: 'MEDIUM SUSPICION'
    },
    LOW: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: ShieldCheck,
      labelKey: 'risk_low',
      defaultLabel: 'LOW RISK / CLEAN'
    },
    INSUFFICIENT_EVIDENCE: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: HelpCircle,
      labelKey: 'risk_insufficient',
      defaultLabel: 'INSUFFICIENT EVIDENCE'
    }
  };

  const conf = configs[norm] || configs.LOW;
  const Icon = conf.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 space-x-1 font-medium',
    md: 'text-xs px-2.5 py-1 space-x-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-bold tracking-wide'
  }[size] || 'text-xs px-2.5 py-1 space-x-1.5 font-semibold';

  const label = t ? t(conf.labelKey) : conf.defaultLabel;

  return (
    <span
      data-testid="risk-badge"
      className={`inline-flex items-center rounded-lg border ${conf.bg} ${sizeClasses} select-none`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
