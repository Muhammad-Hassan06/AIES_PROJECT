import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, X, Share2, MessageCircle } from 'lucide-react';
import { generateShareSafeReport } from '../utils/redact';
import { useToast } from '../context/ToastContext';

export default function ShareSafeSummaryModal({ isOpen, onClose, report }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  if (!isOpen || !report) return null;

  const redactedText = generateShareSafeReport(report);

  const handleCopy = () => {
    navigator.clipboard.writeText(redactedText);
    setCopied(true);
    addToast('Redacted summary copied for safe sharing', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(redactedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share-Safe Redacted Summary"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Share-Safe Summary
              </h3>
              <p className="text-xs text-slate-500">
                Identifiers (CNIC, phones, bank accounts) automatically masked
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
          {redactedText}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-500">
            Safe to forward to relatives, bank fraud desk, or FIA/NCCIA officers.
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Forward via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              <span>{copied ? 'Copied!' : 'Copy Redacted Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
