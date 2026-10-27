import React from 'react';
import { ShieldCheck, FileSearch, Scale } from 'lucide-react';

export default function EvidenceLedgerTable({ ledger = [] }) {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs border border-stone-200 rounded-xl bg-stone-50">
        No evidence ledger entries recorded for this case.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-stone-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-stone-200">
          <tr>
            <th className="py-3 px-4">Forensic Finding</th>
            <th className="py-3 px-4">Evidence Source</th>
            <th className="py-3 px-4">Observed Value / Pattern</th>
            <th className="py-3 px-4">Component</th>
            <th className="py-3 px-4">Confidence</th>
            <th className="py-3 px-4">Rule Citation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {ledger.map((item, idx) => (
            <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-900 max-w-[220px]">
                {item.finding}
              </td>
              <td className="py-3 px-4 text-teal-800 font-mono text-[11px]">
                {item.evidence_source}
              </td>
              <td className="py-3 px-4 text-slate-600 font-mono text-[11px] max-w-[260px] truncate" title={item.observed_value}>
                {item.observed_value}
              </td>
              <td className="py-3 px-4 text-slate-600">
                <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-medium">
                  {item.analysis_component}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <div className="w-12 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-700 h-full rounded-full"
                      style={{ width: `${Math.round(item.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                {item.supporting_rule ? (
                  <span className="inline-flex items-center text-[10px] text-amber-900 font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                    <Scale className="w-3 h-3 mr-1 text-amber-700" />
                    {item.supporting_rule}
                  </span>
                ) : (
                  <span className="text-slate-400">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
