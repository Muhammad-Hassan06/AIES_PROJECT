import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, AlertOctagon, ShieldAlert, AlertTriangle, Search, Filter } from 'lucide-react';
import { getRulesCatalog } from '../services/api';

export default function ExpertRulesPage() {
  const [rules, setRules] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      try {
        const data = await getRulesCatalog();
        setRules(data);
      } catch (e) {
        console.error('Error loading rules', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRules();
  }, []);

  const filtered = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.rule_id.toLowerCase().includes(search.toLowerCase()) ||
                          r.description.toLowerCase().includes(search.toLowerCase());
    const matchesSev = selectedSeverity === 'ALL' || r.severity === selectedSeverity;
    return matchesSearch && matchesSev;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-amber-950/30 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono font-semibold text-amber-400 tracking-wider uppercase">
            AIES Symbolic AI & Expert Systems
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Inspectable IF–THEN Rule Base
        </h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          The expert system acts as an independent symbolic arbiter that validates machine learning inferences
          against explicit deterministic cyber-safety rules, resolving evidence discrepancies and safeguarding against hallucinations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search rules by ID, title, or keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(rule => (
          <div
            key={rule.rule_id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-3 shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 block">
                  {rule.rule_id}
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  {rule.name}
                </h4>
              </div>
              {getSeverityBadge(rule.severity)}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {rule.description}
            </p>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-cyan-400 block text-[11px] uppercase tracking-wider mb-1">
                  IF (Antecedent Conditions):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                  {rule.conditions.map((cond, i) => (
                    <li key={i}>{cond}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="font-semibold text-amber-400 block text-[11px] uppercase tracking-wider mb-1">
                  THEN (Consequent Action):
                </span>
                <p className="text-slate-300 font-medium text-[11px]">
                  {rule.action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
