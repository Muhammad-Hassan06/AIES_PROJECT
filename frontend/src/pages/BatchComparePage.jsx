import React, { useState } from 'react';
import { 
  Layers, Upload, FileText, CheckCircle2, AlertTriangle, 
  ArrowUpDown, Download, ShieldCheck, RefreshCw, Eye, GitCompare,
  Trash2
} from 'lucide-react';
import { runBatchScan } from '../services/api';
import { redactSensitiveData, formatCaseDate } from '../utils/format';

const DEMO_BATCH_ITEMS = `https://www.google.com
http://hbl-verify-security-login.top/account
BISP 8171: Aap ka 25,000 rupay ka benazir wazeefa manzoor ho gaya hai. Call karein.
TCS Courier: Parcel delivery failed due to address error. Update at http://tcs-redelivery-express.online
Meezan Bank Alert: Your biometric verification is pending. Please visit your nearest branch with CNIC 42101-1234567-1.`;

export default function BatchComparePage() {
  const [inputText, setInputText] = useState(DEMO_BATCH_ITEMS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [sortField, setSortField] = useState('risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Compare selection (holds exactly up to 2 case items)
  const [selectedToCompare, setSelectedToCompare] = useState([]);

  const handleRunBatch = async () => {
    const rawLines = inputText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (rawLines.length === 0) return;

    const items = rawLines.slice(0, 20).map((line) => {
      const isUrl = line.startsWith('http://') || line.startsWith('https://') || line.includes('.com') || line.includes('.top') || line.includes('.online');
      return {
        type: isUrl ? 'url' : 'text',
        url: isUrl ? line : '',
        text: isUrl ? '' : line,
        sender_info: 'Batch Scan Import'
      };
    });

    setIsScanning(true);
    setScanResults([]);
    setSelectedToCompare([]);

    try {
      const resp = await runBatchScan(items);
      setScanResults(resp.results || []);
    } catch (err) {
      console.error('Batch scan failed', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const toggleSelectForCompare = (item) => {
    if (selectedToCompare.some(c => c.case_id === item.case_id)) {
      setSelectedToCompare(prev => prev.filter(c => c.case_id !== item.case_id));
    } else {
      if (selectedToCompare.length >= 2) {
        setSelectedToCompare([selectedToCompare[1], item]);
      } else {
        setSelectedToCompare(prev => [...prev, item]);
      }
    }
  };

  const sortedResults = [...scanResults].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  // Export functions with optional PII redaction
  const handleExportJSON = (redact = false) => {
    const dataToExport = sortedResults.map(r => ({
      case_id: r.case_id,
      verdict: r.verdict,
      risk_score: r.risk_score,
      target: redact ? redactSensitiveData(r.target) : r.target,
      rules_fired: r.rules_fired,
      timestamp: r.timestamp
    }));
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybershield_batch_${redact ? 'redacted' : 'raw'}.json`;
    a.click();
  };

  const handleExportCSV = (redact = false) => {
    const headers = ['Case ID', 'Verdict', 'Risk Score', 'Target Input', 'Rules Fired Count', 'Timestamp'];
    const rows = sortedResults.map(r => [
      r.case_id,
      r.verdict,
      r.risk_score,
      `"${(redact ? redactSensitiveData(r.target) : r.target).replace(/"/g, '""')}"`,
      r.rules_fired_count,
      r.timestamp
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybershield_batch_${redact ? 'redacted' : 'raw'}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
            <Layers className="w-4 h-4 text-teal-700" />
            <span>High-Throughput Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Batch Scan & Case Compare
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze up to 20 URLs or messages concurrently, compare cases side-by-side, and generate redacted Share-Safe exports.
          </p>
        </div>

        {/* Export Actions Bar */}
        {scanResults.length > 0 && (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Share-Safe CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportJSON(true)}
              className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>Share-Safe JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Batch Input Console */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Paste URLs or Messages (One per line, Max 20)</span>
          </label>
          <div className="flex items-center space-x-2">
            <label className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Upload CSV/TXT</span>
              <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <textarea
          rows={5}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste up to 20 lines..."
          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {inputText.split('\n').filter(l => l.trim()).length} items entered (Max 20 per scan)
          </span>

          <button
            type="button"
            onClick={handleRunBatch}
            disabled={isScanning || !inputText.trim()}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning {inputText.split('\n').filter(l => l.trim()).length} items...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Execute Batch Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Side-by-Side Case Comparison Drawer (when 2 cases are selected) */}
      {selectedToCompare.length === 2 && (
        <div className="bg-teal-50/60 border-2 border-teal-600 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-teal-200">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-teal-800" />
              <h3 className="text-xs font-black text-teal-950 uppercase tracking-wide">
                Side-by-Side Forensic Comparison
              </h3>
            </div>
            <button
              onClick={() => setSelectedToCompare([])}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedToCompare.map((c, i) => (
              <div key={i} className="bg-white border border-teal-200 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900">{c.case_id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    c.verdict === 'CRITICAL' ? 'bg-red-100 text-red-900' :
                    c.verdict === 'HIGH' ? 'bg-amber-100 text-amber-900' :
                    'bg-teal-100 text-teal-900'
                  }`}>
                    {c.verdict} ({c.risk_score}%)
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-[11px] text-slate-800 break-words">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Target Input:</span>
                  {c.target}
                </div>

                <div className="space-y-1 text-[11px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Rules Fired:</span>
                  {c.rules_fired?.length > 0 ? (
                    c.rules_fired.map((rf, idx) => (
                      <span key={idx} className="inline-block bg-stone-100 text-slate-700 px-2 py-0.5 rounded mr-1 mb-1 text-[10px]">
                        {rf}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No rules fired</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Table */}
      {scanResults.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Batch Execution Results ({scanResults.length} cases)
            </h3>
            <span className="text-[11px] text-slate-500">
              Select any 2 checkboxes to compare side-by-side
            </span>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-slate-700 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3 w-8">Compare</th>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Target Payload</th>
                  <th className="p-3 cursor-pointer" onClick={() => { setSortField('verdict'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center space-x-1">
                      <span>Verdict</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => { setSortField('risk_score'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center space-x-1">
                      <span>Risk Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3">Rules Fired</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-slate-700">
                {sortedResults.map((r) => {
                  const isSelected = selectedToCompare.some(c => c.case_id === r.case_id);
                  return (
                    <tr key={r.item_index} className={`hover:bg-stone-50 ${isSelected ? 'bg-teal-50/50' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectForCompare(r)}
                          className="rounded text-teal-700 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {r.case_id}
                      </td>
                      <td className="p-3 max-w-xs truncate font-mono text-[11px] text-slate-600">
                        {r.target}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.verdict === 'CRITICAL' ? 'bg-red-100 text-red-900' :
                          r.verdict === 'HIGH' ? 'bg-amber-100 text-amber-900' :
                          r.verdict === 'MEDIUM' ? 'bg-yellow-100 text-yellow-900' :
                          'bg-teal-100 text-teal-900'
                        }`}>
                          {r.verdict}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {r.risk_score}%
                      </td>
                      <td className="p-3">
                        {r.rules_fired_count > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-slate-700 text-[10px] font-semibold">
                            {r.rules_fired_count} rules
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-[10px] text-slate-500 whitespace-nowrap">
                        {formatCaseDate(r.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
