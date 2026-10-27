import React from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, Copy, 
  Printer, Share2, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import RiskMeterGauge from './RiskMeterGauge';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { generateShareSafeReport } from '../utils/redact';

export default function RiskVerdictCard({
  report,
  isTechnicalMode,
  onToggleTechnical,
  onOpenShareSafe,
}) {
  const { t } = useLanguage();
  const { addToast } = useToast();

  if (!report) return null;

  const riskLevel = (report.risk_level || 'LOW').toUpperCase();
  const isInsufficient = riskLevel === 'INSUFFICIENT_EVIDENCE';
  const confidence = report.model_confidence || 0;
  const confidencePct = Math.round(confidence * 100);

  // Plain language summary: if insufficient evidence, calm informative message
  const plainSummary = isInsufficient
    ? t('insufficient_evidence_notice')
    : report.executive_summary || 'No suspicious anomalies detected in this submission.';

  // Top recommended actions (limit to 3 for clarity)
  const actions = (report.recommended_actions || []).slice(0, 3);

  const handleCopyReport = () => {
    const text = generateShareSafeReport(report);
    navigator.clipboard.writeText(text);
    addToast('Report copied to clipboard', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      data-testid="risk-verdict-card"
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6"
    >
      {/* Header bar: Verdict Title, Risk Badge, and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            {isInsufficient ? (
              <HelpCircle className="w-5 h-5" />
            ) : riskLevel === 'LOW' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-700" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t('risk_verdict_title')}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
              <span>CASE: {report.case_id}</span>
              <span>•</span>
              <span className="capitalize">{report.input_type || 'Investigation'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <RiskBadge level={riskLevel} size="lg" />

          {/* Simple / Technical Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTechnical}
            aria-label={`Switch to ${isTechnicalMode ? 'Simple' : 'Technical'} view`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
          >
            <span>{isTechnicalMode ? t('technical_view') : t('simple_view')}</span>
            {isTechnicalMode ? (
              <ToggleRight className="w-4 h-4 text-teal-700" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Risk Meter Gauge + Plain Language Verdict + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Animated Risk Meter (Gauge) (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-stone-50/60 rounded-xl border border-stone-100">
          <RiskMeterGauge score={confidence} level={riskLevel} size={150} />
          
          {/* In technical mode, show exact confidence & strength */}
          {isTechnicalMode && (
            <div className="mt-3 flex items-center justify-center space-x-4 text-xs font-mono text-slate-500">
              <div>
                Confidence: <strong className="text-slate-800">{confidencePct}%</strong>
              </div>
              <div>
                Strength: <strong className="text-slate-800">{report.evidence_strength || 'MODERATE'}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right: Plain-Language Summary + Top Actions (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block mb-1">
              Plain-Language Verdict
            </span>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {plainSummary}
            </p>
          </div>

          {/* 2-3 Immediate Recommended Actions */}
          {actions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Immediate Steps:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {actions.map((act, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-stone-200"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer: Share-Safe Summary, Copy Report, Print PDF */}
      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {isTechnicalMode
            ? 'Technical mode active (feature values and expert rule citations visible below)'
            : 'Simple view active (plain-language guidance for citizens)'}
        </div>

        <div className="flex items-center space-x-2">
          {onOpenShareSafe && (
            <button
              type="button"
              onClick={onOpenShareSafe}
              className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('share_safe_button')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{t('copy_report')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print_report')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
