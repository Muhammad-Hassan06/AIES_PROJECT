import React from 'react';
import { ShieldCheck, FileSearch, ArrowUpRight, Scale } from 'lucide-react';

export default function EvidenceLedgerTable({ ledger = [] }) {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm border border-slate-800 rounded-xl bg-slate-900/40">
        No evidence ledger entries recorded for this case.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 shadow-md">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
          <tr>
            <th className="py-3 px-4">Forensic Finding</th>
            <th className="py-3 px-4">Evidence Source</th>
            <th className="py-3 px-4">Observed Value / Pattern</th>
            <th className="py-3 px-4">Component</th>
            <th className="py-3 px-4">Confidence</th>
            <th className="py-3 px-4">Rule Citation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {ledger.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-100 max-w-[220px]">
                {item.finding}
              </td>
              <td className="py-3 px-4 text-cyan-400 font-mono text-[11px]">
                {item.evidence_source}
              </td>
              <td className="py-3 px-4 text-slate-300 font-mono text-[11px] max-w-[260px] truncate" title={item.observed_value}>
                {item.observed_value}
              </td>
              <td className="py-3 px-4 text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                  {item.analysis_component}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-1.5">
                  <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${Math.round(item.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                {item.supporting_rule ? (
                  <span className="inline-flex items-center text-[11px] text-amber-400 font-mono bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
                    <Scale className="w-3 h-3 mr-1" />
                    {item.supporting_rule}
                  </span>
                ) : (
                  <span className="text-slate-600">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
