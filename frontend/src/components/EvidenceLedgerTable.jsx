import React from 'react';
import { ShieldCheck, FileSearch, Scale, Info, Layers, CheckCircle2 } from 'lucide-react';

export default function EvidenceLedgerTable({ ledger = [] }) {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs border border-stone-200 rounded-xl bg-stone-50">
        No evidence ledger entries recorded for this case.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>Traceable Evidence Ledger ({ledger.length} items recorded)</span>
        <span>Anti-Double-Counting Dampening Applied</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-stone-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-stone-200">
            <tr>
              <th className="py-3 px-4">Forensic Finding</th>
              <th className="py-3 px-4">Evidence Source</th>
              <th className="py-3 px-4">Observed Value / Pattern</th>
              <th className="py-3 px-4">Correlation Group</th>
              <th className="py-3 px-4">Point Contribution</th>
              <th className="py-3 px-4">Reliability Limitation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {ledger.map((item, idx) => {
              const points = item.contribution_points !== undefined 
                ? item.contribution_points 
                : Math.round((item.confidence || 0) * 20);
              const corrGroup = item.correlation_group || item.analysis_component || 'CORE_SIGNALS';
              const limitation = item.reliability_limitation || item.supporting_rule || 'Corroboration required.';

              return (
                <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-[220px]">
                    <div className="text-slate-900 font-bold">{item.finding}</div>
                    {item.supporting_rule && (
                      <span className="inline-flex items-center text-[9px] text-amber-900 font-mono bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md font-semibold mt-0.5">
                        <Scale className="w-2.5 h-2.5 mr-1 text-amber-700" />
                        {item.supporting_rule}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-teal-800 font-mono text-[11px]">
                    {item.evidence_source}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px] max-w-[240px] truncate" title={item.observed_value}>
                    {item.observed_value}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-mono font-medium text-slate-700">
                      {corrGroup}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      points > 0 
                        ? 'bg-red-50 text-red-800 border border-red-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {points > 0 ? `+${points} pts` : `${points} pts`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[220px]" title={limitation}>
                    <span className="line-clamp-2 leading-tight">{limitation}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

