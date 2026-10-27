import React, { useState, useEffect } from 'react';
import { BarChart3, Cpu, Scale, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ModelTransparencyView from '../components/ModelTransparencyView';
import { getDashboardStats, getRulesCatalog } from '../services/api';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('trends'); // 'trends', 'models', 'rules'
  const [stats, setStats] = useState(null);
  const [rules, setRules] = useState([]);
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleSeverity, setRuleSeverity] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const [sData, rData] = await Promise.all([
          getDashboardStats().catch(() => null),
          getRulesCatalog().catch(() => [])
        ]);
        setStats(sData);
        setRules(rData);
      } catch (e) {
        console.error('Error loading insights data', e);
      }
    }
    loadData();
  }, []);

  // Format risk distribution data for Recharts
  const riskData = [
    { name: 'Critical', count: stats?.risk_distribution?.CRITICAL || 0, fill: '#DC2626' },
    { name: 'High', count: stats?.risk_distribution?.HIGH || 0, fill: '#EA580C' },
    { name: 'Medium', count: stats?.risk_distribution?.MEDIUM || 0, fill: '#D97706' },
    { name: 'Low', count: stats?.risk_distribution?.LOW || 0, fill: '#16A34A' },
    { name: 'Insufficient', count: stats?.risk_distribution?.INSUFFICIENT_EVIDENCE || 0, fill: '#64748B' },
  ];

  const modalityData = [
    { name: 'URL', count: stats?.type_distribution?.url || 0 },
    { name: 'Message', count: stats?.type_distribution?.message || 0 },
    { name: 'Screenshot', count: stats?.type_distribution?.screenshot || 0 },
    { name: 'Combined', count: stats?.type_distribution?.combined || 0 },
  ];

  const filteredRules = rules.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.rule_id.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(ruleSearch.toLowerCase());
    const matchesSev = ruleSeverity === 'ALL' || r.severity === ruleSeverity;
    return matchesSearch && matchesSev;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
              <BarChart3 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Insights, Analytics & Model Intelligence
              </h2>
              <p className="text-xs text-slate-500">
                Threat distribution trends, scientific model benchmarks, and symbolic expert rules
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 space-x-2 rtl:space-x-reverse">
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'trends'
                ? 'border-b-2 border-teal-700 text-teal-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Threat Trends & Activity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'border-b-2 border-teal-700 text-teal-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Model Transparency & Metrics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-b-2 border-teal-700 text-teal-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Expert Rules Catalog</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Trends & Distribution */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Strip (Limit to max 3 visual cards above the fold) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Total Cases Investigated
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {stats?.total_investigations || 0}
              </div>
              <div className="text-[11px] text-teal-700 mt-1 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Forensic vault active</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Confirmed High/Critical Threats
              </span>
              <div className="text-2xl font-bold font-mono text-red-700">
                {stats?.critical_cases || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Credential theft & extortion flagged
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Active Detection Subsystems
              </span>
              <div className="text-2xl font-bold font-mono text-teal-800">
                8 Agents
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Multimodal cross-validation pipeline
              </div>
            </div>
          </div>

          {/* Recharts Trend Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Risk Level Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Cases by Risk Level
                </h4>
                <p className="text-[11px] text-slate-500">
                  Severity distribution across all archived forensic investigations
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0F766E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Modality Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Investigations by Modality
                </h4>
                <p className="text-[11px] text-slate-500">
                  Breakdown by input type (URL, SMS/Message, Screenshot, Combined)
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modalityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0D9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Model Transparency & Live Playground */}
      {activeTab === 'models' && (
        <div className="animate-fade-in">
          <ModelTransparencyView />
        </div>
      )}

      {/* TAB 3: Inspectable Expert Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <input
              type="text"
              placeholder="Search expert rules by ID or keyword..."
              value={ruleSearch}
              onChange={e => setRuleSearch(e.target.value)}
              className="w-full sm:max-w-md px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-teal-700"
            />
            <select
              value={ruleSeverity}
              onChange={e => setRuleSeverity(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-teal-700 cursor-pointer font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map(rule => (
              <div
                key={rule.rule_id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-800 block">
                      {rule.rule_id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {rule.name}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-stone-100 text-slate-700 border border-stone-200">
                    {rule.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {rule.description}
                </p>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-teal-900 block text-[10px] uppercase tracking-wider mb-0.5">
                      IF (Conditions):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-mono text-[11px]">
                      {rule.conditions.map((cond, i) => (
                        <li key={i}>{cond}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-stone-200">
                    <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider mb-0.5">
                      THEN (Forensic Action):
                    </span>
                    <p className="text-slate-800 font-medium text-[11px]">
                      {rule.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
