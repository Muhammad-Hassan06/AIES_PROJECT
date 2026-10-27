import React, { useState, useEffect } from 'react';
import { 
  Cpu, BarChart2, Layers, ShieldCheck, 
  ExternalLink, ArrowRight, Activity, Terminal 
} from 'lucide-react';
import { getModelMetrics, analyzeUrlDirect, analyzeMessageDirect } from '../services/api';

export default function ModelIntelligencePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Playground state
  const [testUrl, setTestUrl] = useState('http://185.220.101.4/hbl-login-update.php');
  const [urlPred, setUrlPred] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);

  const [testText, setTestText] = useState('URGENT: Your bank card has been suspended. Reply with your 4-digit PIN immediately to unblock.');
  const [nlpPred, setNlpPred] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getModelMetrics();
        setMetrics(data);
      } catch (e) {
        console.error('Error fetching model metrics', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleTestUrl = async () => {
    if (!testUrl) return;
    setUrlLoading(true);
    try {
      const res = await analyzeUrlDirect(testUrl);
      setUrlPred(res);
    } catch (e) {
      console.error(e);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testText) return;
    setNlpLoading(true);
    try {
      const res = await analyzeMessageDirect(testText);
      setNlpPred(res);
    } catch (e) {
      console.error(e);
    } finally {
      setNlpLoading(false);
    }
  };

  const urlIntel = metrics?.url_model_intelligence;
  const nlpIntel = metrics?.nlp_model_intelligence;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/30 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider uppercase">
            AIES Research & Machine Learning Lab
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Model Intelligence & Empirical Evaluation
        </h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Comprehensive scientific documentation of trained classification algorithms, dataset schemas,
          train/test split methodologies, baseline-versus-final comparisons, and feature importance attribution.
        </p>
      </div>

      {/* Model Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* URL Threat Classifier Benchmark */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                1. URL Threat Classifier (PhiUSIIL Schema)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                UCI ML Repository #967 | CC BY 4.0
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              15 Features
            </span>
          </div>

          {urlIntel ? (
            <div className="space-y-4">
              {/* Baseline vs Strong Model Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Model</th>
                      <th className="py-2 px-3">Accuracy</th>
                      <th className="py-2 px-3">Precision</th>
                      <th className="py-2 px-3">Recall</th>
                      <th className="py-2 px-3">ROC-AUC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    <tr className="text-slate-400">
                      <td className="py-2 px-3">Baseline: Logistic Regression</td>
                      <td className="py-2 px-3">{(urlIntel.baseline_model.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.baseline_model.precision * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.baseline_model.recall * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.baseline_model.roc_auc).toFixed(3)}</td>
                    </tr>
                    <tr className="text-cyan-400 bg-cyan-950/20 font-semibold">
                      <td className="py-2 px-3">Final: Random Forest (100 Trees)</td>
                      <td className="py-2 px-3">{(urlIntel.strong_model.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.strong_model.precision * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.strong_model.recall * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.strong_model.roc_auc).toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Confusion Matrix */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Test Split Confusion Matrix (N = {urlIntel.test_count})
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40">
                    <div className="text-[10px] text-slate-400">True Negatives (Legitimate)</div>
                    <div className="text-lg font-bold text-emerald-400">{urlIntel.confusion_matrix.true_negatives}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">False Positives</div>
                    <div className="text-lg font-bold text-slate-300">{urlIntel.confusion_matrix.false_positives}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">False Negatives</div>
                    <div className="text-lg font-bold text-slate-300">{urlIntel.confusion_matrix.false_negatives}</div>
                  </div>
                  <div className="p-2 rounded bg-red-950/40 border border-red-800/40">
                    <div className="text-[10px] text-slate-400">True Positives (Phishing)</div>
                    <div className="text-lg font-bold text-red-400">{urlIntel.confusion_matrix.true_positives}</div>
                  </div>
                </div>
              </div>

              {/* Top Feature Importances */}
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-2">
                  Random Forest Feature Importances:
                </span>
                <div className="space-y-1.5">
                  {urlIntel.top_features?.map((f, i) => (
                    <div key={i} className="flex items-center text-xs font-mono">
                      <span className="w-48 text-slate-400 truncate text-[11px]">{f.feature}</span>
                      <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden mx-2 border border-slate-800">
                        <div
                          className="bg-cyan-500 h-full rounded-full"
                          style={{ width: `${Math.round(f.importance * 200)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-slate-300 text-[11px]">
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Loading model intelligence metrics...</div>
          )}
        </div>

        {/* NLP Social Engineering Benchmark */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                2. NLP Social Engineering & SMS Phishing Model
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                TF-IDF (1-2 N-grams) | Augmented PK Scenarios
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              3,000 Vocab
            </span>
          </div>

          {nlpIntel ? (
            <div className="space-y-4">
              {/* Baseline vs Strong Model Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Model</th>
                      <th className="py-2 px-3">Accuracy</th>
                      <th className="py-2 px-3">Precision</th>
                      <th className="py-2 px-3">Recall</th>
                      <th className="py-2 px-3">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    <tr className="text-slate-400">
                      <td className="py-2 px-3">Baseline: Logistic Regression</td>
                      <td className="py-2 px-3">{(nlpIntel.baseline_model.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(nlpIntel.baseline_model.precision * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(nlpIntel.baseline_model.recall * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(nlpIntel.baseline_model.f1_score * 100).toFixed(1)}%</td>
                    </tr>
                    <tr className="text-emerald-400 bg-emerald-950/20 font-semibold">
                      <td className="py-2 px-3">Final: Multinomial Naive Bayes</td>
                      <td className="py-2 px-3">{(nlpIntel.strong_model.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(nlpIntel.strong_model.precision * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(nlpIntel.strong_model.recall * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(nlpIntel.strong_model.f1_score * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Confusion Matrix */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Test Split Confusion Matrix (N = {nlpIntel.test_count})
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40">
                    <div className="text-[10px] text-slate-400">True Negatives (Benign)</div>
                    <div className="text-lg font-bold text-emerald-400">{nlpIntel.confusion_matrix.true_negatives}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">False Positives</div>
                    <div className="text-lg font-bold text-slate-300">{nlpIntel.confusion_matrix.false_positives}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">False Negatives</div>
                    <div className="text-lg font-bold text-slate-300">{nlpIntel.confusion_matrix.false_negatives}</div>
                  </div>
                  <div className="p-2 rounded bg-red-950/40 border border-red-800/40">
                    <div className="text-[10px] text-slate-400">True Positives (Social Eng)</div>
                    <div className="text-lg font-bold text-red-400">{nlpIntel.confusion_matrix.true_positives}</div>
                  </div>
                </div>
              </div>

              {/* Key Phishing Weights */}
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-2">
                  Top Phishing Lure Tokens (Log-Odds Weights):
                </span>
                <div className="flex flex-wrap gap-2">
                  {nlpIntel.key_phishing_tokens?.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                    >
                      "{t.token}" <span className="text-slate-500">({t.weight})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Loading NLP intelligence metrics...</div>
          )}
        </div>
      </div>

      {/* Interactive Model Prediction Playground */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-base">
              Live Model Execution Playground
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Real In-Memory Backend Inference
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test URL */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Test URL Classifier:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testUrl}
                onChange={e => setTestUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleTestUrl}
                disabled={urlLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                {urlLoading ? '...' : 'Predict'}
              </button>
            </div>

            {urlPred && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Class:</span>
                  <span className={urlPred.is_phishing ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {urlPred.is_phishing ? 'PHISHING (MALICIOUS)' : 'LEGITIMATE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Phishing Probability:</span>
                  <span className="text-cyan-400 font-bold">{(urlPred.phishing_probability * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Model: {urlPred.model_name}</span>
                  <span>Latency: {urlPred.latency_ms} ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Test Message */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Test NLP Classifier:
            </label>
            <div className="flex space-x-2">
              <textarea
                rows={2}
                value={testText}
                onChange={e => setTestText(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleTestMessage}
                disabled={nlpLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                {nlpLoading ? '...' : 'Predict'}
              </button>
            </div>

            {nlpPred && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Classification:</span>
                  <span className={nlpPred.is_social_engineering ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {nlpPred.is_social_engineering ? 'SOCIAL ENGINEERING ATTACK' : 'BENIGN COMMUNICATION'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="text-cyan-400 font-bold">{(nlpPred.risk_score * 100).toFixed(2)}%</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Categories Flagged: {nlpPred.categories_detected.join(', ') || 'None'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
