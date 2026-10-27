import React, { useState } from 'react';
import { 
  Building, UserCheck, CheckSquare, Square, 
  ExternalLink, PhoneCall, AlertTriangle, ShieldAlert, ArrowUpRight 
} from 'lucide-react';

export default function AuthorityReportHelper() {
  const [activeTab, setActiveTab] = useState('nccia');
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ncciaChecklist = [
    { id: 'n1', label: 'Exact screenshot or copy of the fraudulent SMS / WhatsApp message' },
    { id: 'n2', label: 'Sender phone number or alphanumeric SMS header (e.g. +92-301-...)' },
    { id: 'n3', label: 'Exact phishing URL or website link (do not click it yourself)' },
    { id: 'n4', label: 'Date and exact timestamp when communication was received' },
    { id: 'n5', label: 'Bank account number / IBAN and transaction ID (if money was transferred)' },
    { id: 'n6', label: 'Copy of your Pakistani CNIC (front and back) for identity verification' },
  ];

  const pkcertChecklist = [
    { id: 'p1', label: 'Full spoofed URL, domain name, or IP address observed' },
    { id: 'p2', label: 'Raw RFC822 email headers (if the attack was an institutional email lure)' },
    { id: 'p3', label: 'SHA256 hashes of any downloaded malware or APK files (if available)' },
    { id: 'p4', label: 'Estimated organizational impact (departments or employees targeted)' },
    { id: 'p5', label: 'Contact details of internal IT security incident coordinator' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="space-y-2 border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <ShieldAlert className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Official Cybercrime Reporting Helper (Pakistan)
            </h3>
            <p className="text-xs text-slate-500">
              Step-by-step evidence preparation checklist before filing official complaints
            </p>
          </div>
        </div>

        {/* Clear Mandatory Disclaimer */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5 rtl:space-x-reverse">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Privacy Notice:</strong> CyberShield AI is a local forensic analysis tool. 
            The system <strong>NEVER</strong> submits complaints or transmits evidence to government authorities on your behalf.
            You must manually register your complaint on the official portals below.
          </p>
        </div>
      </div>

      {/* Target Tab Selector: NCCIA vs PKCERT */}
      <div className="flex border-b border-stone-200 space-x-4 rtl:space-x-reverse">
        <button
          type="button"
          onClick={() => setActiveTab('nccia')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'nccia'
              ? 'border-b-2 border-teal-700 text-teal-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>NCCIA (For Citizens & Individuals)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pkcert')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'pkcert'
              ? 'border-b-2 border-teal-700 text-teal-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>PKCERT (For Organizations & Infrastructure)</span>
        </button>
      </div>

      {/* NCCIA Tab Content */}
      {activeTab === 'nccia' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              When to file with NCCIA:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The National Cyber Crime Investigation Agency (formerly FIA Cybercrime Wing) has statutory jurisdiction
              under PECA (Prevention of Electronic Crimes Act) to investigate financial cyber fraud, unauthorized mobile banking withdrawals,
              stolen CNIC credentials, OTP vishing, and online blackmail targeting individual citizens.
            </p>
            <div className="flex items-center space-x-2 text-xs text-teal-800 font-semibold pt-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>National Toll-Free Helpline: <strong>9999</strong> (24/7 Support)</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">
              Gather This Evidence Before Starting:
            </h4>
            <div className="space-y-2">
              {ncciaChecklist.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-xl border text-xs flex items-center space-x-3 transition-colors cursor-pointer select-none ${
                      isChecked
                        ? 'bg-teal-50 border-teal-200 text-teal-900 font-medium'
                        : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="https://complaint.nccia.gov.pk/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span>Open Verified NCCIA Citizen Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.nccia.gov.pk/"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <span>Official NCCIA Website</span>
            </a>
          </div>
        </div>
      )}

      {/* PKCERT Tab Content */}
      {activeTab === 'pkcert' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              When to report to PKCERT:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              PKCERT handles national and institutional cybersecurity posture, coordination of enterprise malware campaigns,
              domain name spoofing impersonating Pakistani banks, critical infrastructure ransomware, and zero-day threat advisories.
            </p>
            <div className="text-xs text-slate-600 pt-1 font-mono">
              Emergency Email: <strong className="text-slate-900">incident@pkcert.gov.pk</strong>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">
              Organizational Evidence Checklist:
            </h4>
            <div className="space-y-2">
              {pkcertChecklist.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-xl border text-xs flex items-center space-x-3 transition-colors cursor-pointer select-none ${
                      isChecked
                        ? 'bg-teal-50 border-teal-200 text-teal-900 font-medium'
                        : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="https://pkcert.gov.pk/report-incident/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span>Open Verified PKCERT Incident Desk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://pkcert.gov.pk/advisories"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1 transition-colors"
            >
              <span>Browse National Advisories</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
