import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, ShieldAlert, BarChart3, PieChart as PieIcon, 
  Layers, Landmark, AlertTriangle, RefreshCw, Filter, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { getThreatTrends } from '../services/api';

const RISK_COLORS = {
  CRITICAL: '#991B1B', // Red 800
  HIGH: '#C2410C',     // Orange 700
  MEDIUM: '#D97706',   // Amber 600
  LOW: '#0F766E',      // Teal 700
  INSUFFICIENT_EVIDENCE: '#64748B' // Slate 500
};

const MODALITY_COLORS = ['#0F766E', '#0284C7', '#7C3AED', '#D97706', '#E11D48'];

export default function ThreatTrendsPage() {
  const [days, setDays] = useState(30);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, [days]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const data = await getThreatTrends(days);
      setTrends(data);
    } catch (err) {
      console.error('Failed to load threat trends', err);
    } finally {
      setLoading(false);
    }
  };

  const riskPieData = trends?.risk_breakdown
    ? Object.entries(trends.risk_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const modalityPieData = trends?.modality_breakdown
    ? Object.entries(trends.modality_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
            <TrendingUp className="w-4 h-4 text-teal-700" />
            <span>Forensic Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pakistani Threat Trends Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics computed directly from your local SQLite case vault. Zero telemetry sent to third parties.
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  days === d
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d === 365 ? 'All Time' : `${d} Days`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadTrends}
            disabled={loading}
            className="p-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 text-slate-600 transition-all cursor-pointer"
            title="Refresh trends"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700 mb-2" />
          <span>Aggregating threat metrics from local case vault...</span>
        </div>
      ) : trends?.total_cases === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-slate-400 text-xs space-y-3">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Investigation Data Found in This Range</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run investigations in the Investigate tab or perform a batch scan to populate threat trends.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cases</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{trends?.total_cases || 0}</div>
              <span className="text-[10px] text-teal-700 font-medium">Persisted in SQLite</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Critical Threats</span>
              <div className="text-2xl font-black text-red-800 mt-1">
                {trends?.risk_breakdown?.CRITICAL || 0}
              </div>
              <span className="text-[10px] text-slate-400">Immediate citizen harm</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">High Risk Fraud</span>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {trends?.risk_breakdown?.HIGH || 0}
              </div>
              <span className="text-[10px] text-slate-400">Corroborated lures</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Clean / Benign</span>
              <div className="text-2xl font-black text-teal-900 mt-1">
                {trends?.risk_breakdown?.LOW || 0}
              </div>
              <span className="text-[10px] text-slate-400">No malicious indicators</span>
            </div>
          </div>

          {/* Timeline Bar Chart */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                <span>Cases Over Time by Risk Level</span>
              </h3>
              <span className="text-[11px] text-slate-400">Daily case volume</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                  />
                  <Bar dataKey="CRITICAL" stackId="a" fill={RISK_COLORS.CRITICAL} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="HIGH" stackId="a" fill={RISK_COLORS.HIGH} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="MEDIUM" stackId="a" fill={RISK_COLORS.MEDIUM} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="LOW" stackId="a" fill={RISK_COLORS.LOW} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Charts Grid: Risk vs Modality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Distribution Pie */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <PieIcon className="w-4 h-4 text-teal-700" />
                <span>Risk Level Distribution</span>
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Modality Breakdown */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>Investigation Modality</span>
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modalityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {modalityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MODALITY_COLORS[index % MODALITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Granular Insights: Top Rules Triggered & Impersonated Institutions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Triggered Expert Rules */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-teal-700" />
                <span>Most Frequently Triggered Rules</span>
              </h3>
              <div className="space-y-2">
                {trends?.top_rules?.length > 0 ? (
                  trends.top_rules.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <span className="font-semibold text-slate-800 truncate pr-2">{item.rule}</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold font-mono text-[11px] shrink-0">
                        {item.count} hits
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">No rule activations in selected window.</div>
                )}
              </div>
            </div>

            {/* Impersonated Entities */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <Landmark className="w-4 h-4 text-teal-700" />
                <span>Most Impersonated Institutions</span>
              </h3>
              <div className="space-y-2">
                {trends?.top_institutions?.length > 0 ? (
                  trends.top_institutions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <span className="font-semibold text-slate-800">{item.institution}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold font-mono text-[11px]">
                        {item.count} cases
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">No institutional impersonation detected.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
