import React, { useState } from 'react';
import { 
  ShieldAlert, UserCheck, Building, HelpCircle, 
  ExternalLink, PhoneCall, Award, BookOpen 
} from 'lucide-react';
import AwarenessCenter from '../components/AwarenessCenter';
import AuthorityReportHelper from '../components/AuthorityReportHelper';

export default function SafetyCenterPage() {
  const [activeSection, setActiveSection] = useState('awareness'); // 'awareness', 'helper'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
              <ShieldAlert className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Pakistan Cyber Safety & Authority Reporting Center
              </h2>
              <p className="text-xs text-slate-500">
                Citizen awareness tools, emerging scam education, and official reporting checklists
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-stone-200 space-x-2 rtl:space-x-reverse">
          <button
            type="button"
            onClick={() => setActiveSection('awareness')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSection === 'awareness'
                ? 'border-b-2 border-teal-700 text-teal-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Awareness & Scam Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('helper')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSection === 'helper'
                ? 'border-b-2 border-teal-700 text-teal-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Report-to-Authority Helper</span>
          </button>
        </div>
      </div>

      {/* Dynamic Content */}
      {activeSection === 'awareness' && (
        <div className="animate-fade-in">
          <AwarenessCenter />
        </div>
      )}

      {activeSection === 'helper' && (
        <div className="animate-fade-in">
          <AuthorityReportHelper />
        </div>
      )}
    </div>
  );
}
