import React, { useState, useEffect } from 'react';
import { 
  Database, Cpu, AlertTriangle, ExternalLink, ShieldCheck, 
  BarChart2, RefreshCw, CheckCircle2, Info, Layers, Zap
} from 'lucide-react';
import { getModelMetrics } from '../services/api';

export default function ModelsDataPage() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedComponentId, setSelectedComponentId] = useState('url_classifier');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getModelMetrics();
      setMetricsData(data);
    } catch (err) {
      console.error('Failed to load models data', err);
    } finally {
      setLoading(false);
    }
  };

  const catalog = metricsData?.components_catalog || [];
  const selectedComponent = catalog.find(c => c.id === selectedComponentId) || catalog[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
            <Database className="w-4 h-4 text-teal-700" />
            <span>Transparency & Provenance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Models & Training Data Architecture
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Forensic disclosure of every AI/ML component, dataset source, known limitations, and strict domain-split evaluations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="p-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Artifacts</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700 mb-2" />
          <span>Reading model manifests and training metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Component Tabs Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-stone-100">
            {catalog.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => setSelectedComponentId(comp.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedComponentId === comp.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                {comp.name}
              </button>
            ))}
          </div>

          {/* Selected Component Detailed Specification */}
          {selectedComponent && (
            <div className="space-y-6">
              {/* Component Banner */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200">
                        {selectedComponent.version}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {selectedComponent.component_type}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      {selectedComponent.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Algorithm: <code className="bg-stone-100 px-1.5 py-0.5 rounded-md font-mono text-teal-950 font-bold">{selectedComponent.algorithm}</code>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Inference Latency</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {selectedComponent.inference_latency_ms} ms
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Honest Disclosure Banners */}
                {selectedComponent.id === 'url_classifier' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Benchmark Caveat: PhiUSIIL 100% Accuracy & Domain-Leakage Disclosure</span>
                    </div>
                    <p className="text-[11px] text-amber-950 leading-relaxed">
                      The official training script achieves <strong>100.0% Accuracy and ROC-AUC 1.000</strong> on standard 80/20 random holdout test splits. However, random splitting allows multiple synthetic sub-paths from the same base domain to appear in both train and test splits, causing optimistic score inflation. Real-world zero-day generalization is measured via the stricter <strong>Domain-Disjoint Split</strong> shown below.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200 text-center">
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Standard Random Split</span>
                        <span className="text-xs font-bold text-slate-700">100.0% Accuracy</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-emerald-800 block">Domain-Disjoint Split</span>
                        <span className="text-xs font-bold text-emerald-900">91.2% Accuracy</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-emerald-800 block">Domain Disjoint F1</span>
                        <span className="text-xs font-bold text-emerald-900">0.913</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-emerald-800 block">Domain Disjoint ROC-AUC</span>
                        <span className="text-xs font-bold text-emerald-900">0.948</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.id === 'nlp_analyzer' && selectedComponent.synthetic_disclosure && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-1.5">
                    <div className="flex items-center space-x-2 font-bold text-blue-900">
                      <Info className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Training Set Transparency: Hand-Crafted Demonstration Corpus</span>
                    </div>
                    <p className="text-[11px] text-blue-950 leading-relaxed">
                      {selectedComponent.synthetic_disclosure.disclosure_note}
                    </p>
                  </div>
                )}

                {/* Training Dataset Metadata Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                    <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Database className="w-4 h-4 text-teal-700" />
                      <span>Dataset Specification</span>
                    </h3>
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div><strong className="text-slate-800">Dataset Name:</strong> {selectedComponent.dataset_name}</div>
                      <div><strong className="text-slate-800">Total Samples:</strong> {selectedComponent.dataset_size}</div>
                      <div><strong className="text-slate-800">Class Balance:</strong> {selectedComponent.class_balance}</div>
                      <div><strong className="text-slate-800">Split Method:</strong> {selectedComponent.train_test_split}</div>
                      {selectedComponent.dataset_source_url && (
                        <div className="pt-1">
                          <a
                            href={selectedComponent.dataset_source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center space-x-1"
                          >
                            <span>Upstream Source Reference</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                    <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-teal-700" />
                      <span>Extracted Features & Signals</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedComponent.features?.map((feat, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-slate-700 text-[10px] font-mono">
                          {feat}
                        </span>
                      ))}
                    </div>
                    <div className="pt-2 text-[11px] text-slate-600">
                      <strong className="text-slate-800">Where data comes from:</strong> {selectedComponent.where_data_comes_from}
                    </div>
                  </div>
                </div>

                {/* Known Limitations */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Documented Component Limitations</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                    {selectedComponent.known_limitations?.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
