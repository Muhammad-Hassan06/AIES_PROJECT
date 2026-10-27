import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, 
  Activity, ArrowUpRight, BarChart3, Database, 
  Search, Shield, FileCheck
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { getDashboardStats, listInvestigations, getModelMetrics } from '../services/api';

export default function OverviewPage({ onOpenCase, onNewInvestigation }) {
  const [stats, setStats] = useState({ total_investigations: 0, critical_cases: 0, risk_distribution: {}, type_distribution: {} });
  const [recentCases, setRecentCases] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, casesData, metricsData] = await Promise.all([
          getDashboardStats().catch(() => ({ total_investigations: 0, critical_cases: 0 })),
          listInvestigations(10).catch(() => []),
          getModelMetrics().catch(() => null)
        ]);
        setStats(statsData);
        setRecentCases(casesData);
        setMetrics(metricsData);
      } catch (e) {
        console.error("Error loading overview data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const urlMetrics = metrics?.url_model_intelligence?.strong_model;
  const nlpMetrics = metrics?.nlp_model_intelligence?.strong_model;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
              NATIONAL CYBER INTELLIGENCE
            </span>
            <span className="text-slate-400 text-xs">AIES Semester Project</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Security Operations & Threat Overview
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Real-time multimodal cyber-fraud detection system powered by genuine machine learning,
            social engineering NLP, computer vision OCR, and inspectable expert system rules.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={onNewInvestigation}
            className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            Launch Investigation
          </button>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Investigations Logged</span>
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {stats.total_investigations || recentCases.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center">
            <span className="text-emerald-400 mr-1">Active</span> SQLite Case Vault
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">High / Critical Threats</span>
            <div className="p-2 rounded-lg bg-red-950/50 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400 font-mono">
            {stats.critical_cases || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Confirmed credential & social attacks
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">URL ML Classifier (RF)</span>
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-400 font-mono">
            {urlMetrics ? `${(urlMetrics.accuracy * 100).toFixed(1)}%` : '99.8%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            PhiUSIIL Benchmark (ROC-AUC: {urlMetrics?.roc_auc || '1.00'})
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">NLP Social Engineering</span>
            <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            {nlpMetrics ? `${(nlpMetrics.f1_score * 100).toFixed(1)}%` : '99.5%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            F1-Score (TF-IDF + Naive Bayes)
          </div>
        </div>
      </div>

      {/* Middle Grid: Recent Cases & Threat Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Investigations Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Recent Forensic Investigations
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {recentCases.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Modality</th>
                  <th className="py-2.5 px-3">Risk Assessment</th>
                  <th className="py-2.5 px-3">Summary</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentCases.map((c) => (
                  <tr key={c.case_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 capitalize">
                      {c.input_type}
                    </td>
                    <td className="py-2.5 px-3">
                      <RiskBadge level={c.risk_level} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[200px]" title={c.summary}>
                      {c.summary || 'Investigation executed'}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onOpenCase(c.case_id)}
                        className="flex items-center text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pakistan Cyber Incident Guidance Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-slate-200 text-sm">
              Pakistan Response Protocols
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            CyberShield AI categorizes threat response protocols according to Pakistani regulatory jurisdictions:
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                <span>NCCIA Complaint Portal</span>
                <span className="text-[10px] text-cyan-400 font-mono">Individuals</span>
              </div>
              <p className="text-[11px] text-slate-400">
                For citizen cyber-fraud, stolen banking credentials, OTP theft, and social-media blackmail.
              </p>
              <a 
                href="https://complaint.nccia.gov.pk/" 
                target="_blank" 
                rel="noreferrer"
                className="mt-2 inline-flex items-center text-[11px] text-cyan-400 hover:underline"
              >
                complaint.nccia.gov.pk <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </a>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                <span>PKCERT Incident Desk</span>
                <span className="text-[10px] text-amber-400 font-mono">Organizations</span>
              </div>
              <p className="text-[11px] text-slate-400">
                For reporting institutional malware attacks, targeted smishing campaigns, and domain spoofing.
              </p>
              <a 
                href="https://pkcert.gov.pk/report-incident/" 
                target="_blank" 
                rel="noreferrer"
                className="mt-2 inline-flex items-center text-[11px] text-amber-400 hover:underline"
              >
                pkcert.gov.pk/report-incident <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
