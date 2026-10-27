import React from 'react';
import { 
  ShieldAlert, PhoneCall, Copy, Printer, 
  ExternalLink, Ban, Lock, CheckCircle2, AlertOctagon 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { generateShareSafeReport } from '../utils/redact';

export default function ActionPlanCard({ report }) {
  const { addToast } = useToast();

  if (!report) return null;

  const isHighRisk = ['CRITICAL', 'HIGH'].includes((report.risk_level || '').toUpperCase());

  const handleCopy = () => {
    const text = generateShareSafeReport(report);
    navigator.clipboard.writeText(text);
    addToast('Redacted report summary copied to clipboard', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const standardSteps = [
    {
      icon: Ban,
      title: 'Do not click links or enter passwords',
      desc: 'Malicious links attempt to harvest banking credentials or download unauthorized APKs.'
    },
    {
      icon: Lock,
      title: 'Never disclose any OTP or PIN code',
      desc: 'Pakistani banks and agencies will NEVER phone or message you requesting your one-time passwords.'
    },
    {
      icon: PhoneCall,
      title: 'Call official bank helpline',
      desc: 'Dial only the telephone number printed physically on the back of your debit card or verified website.'
    },
    {
      icon: ShieldAlert,
      title: 'Report to official Pakistani authorities',
      desc: 'Citizens dial NCCIA 9999 (complaint.nccia.gov.pk). Organizations email PKCERT (incident@pkcert.gov.pk).'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <ShieldAlert className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              What should I do now?
            </h3>
            <p className="text-xs text-slate-500">
              Immediate safety protocol tailored to this investigation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy Report</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {standardSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start space-x-3 rtl:space-x-reverse"
            >
              <div className="p-2 rounded-lg bg-white border border-stone-200 text-teal-800 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900">
                  {idx + 1}. {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Portals Direct Reference */}
      <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950">
        <div>
          <span className="font-bold block">Pakistani Law Enforcement Hotlines:</span>
          <span className="text-teal-800">NCCIA Helpline: <strong>9999</strong> | PKCERT Advisory Desk</span>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="https://complaint.nccia.gov.pk/"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-semibold text-xs flex items-center space-x-1 hover:bg-teal-50 transition-colors"
          >
            <span>NCCIA Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://pkcert.gov.pk/report-incident/"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-semibold text-xs flex items-center space-x-1 hover:bg-teal-50 transition-colors"
          >
            <span>PKCERT Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
