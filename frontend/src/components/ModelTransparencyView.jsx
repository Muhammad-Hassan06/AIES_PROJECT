import React, { useState, useEffect } from 'react';
import { Cpu, ExternalLink, AlertTriangle, Terminal } from 'lucide-react';
import { getModelMetrics, analyzeUrlDirect, analyzeMessageDirect } from '../services/api';

export default function ModelTransparencyView() {
  const [metrics, setMetrics] = useState(null);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <Cpu className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Model Transparency & Empirical Evaluation
            </h3>
            <p className="text-xs text-slate-500">
              Inspectable training methodologies, dataset schemas, confusion matrices, and limitations
            </p>
          </div>
        </div>

        {/* Mandatory Prominent Real-World Note */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5 leading-relaxed">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Critical Scientific Evaluation Note: Benchmark Inflation & Real-World Generalization</span>
          </div>
          <p>
            The URL classifier reports high benchmark metrics (near 100% accuracy and 1.000 ROC-AUC on static test splits like PhiUSIIL). 
            <strong>This must not be interpreted as proof of flawless real-world performance.</strong>
          </p>
          <p className="text-amber-900">
            Static benchmark datasets often suffer from dataset leakage, synthetic distribution artifacts, or trivial separability. 
            In live deployment, adversarial attackers continually evolve obfuscation techniques (e.g. typosquatting, legit CDN hosting, zero-day domains). 
            Real-world performance is anticipated to be lower, which is why CyberShield AI enforces <strong>deterministic expert rules</strong> and 
            multimodal cross-validation rather than relying solely on raw ML scores.
          </p>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Model 1: URL Threat Classifier */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                1. URL Threat Classifier (PhiUSIIL Schema)
              </h4>
              <a
                href="https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-700 hover:underline flex items-center space-x-1 mt-0.5"
              >
                <span>UCI ML Repository #967 (CC BY 4.0)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
              15 Features
            </span>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              <strong>Architecture:</strong> Random Forest Classifier (100 estimators) vs Baseline Logistic Regression.
            </p>
            <p>
              <strong>Dataset Split:</strong> 80% Train, 20% Stratified Test Split (N = {urlIntel?.test_count || '200'}).
            </p>
          </div>

          {/* Dynamic Metrics Table */}
          {urlIntel ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">ROC-AUC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    <tr className="text-slate-600">
                      <td className="py-2 px-3 font-sans font-medium">Logistic Regression (Baseline)</td>
                      <td className="py-2 px-3">{((urlIntel.baseline_model?.accuracy ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((urlIntel.baseline_model?.precision ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((urlIntel.baseline_model?.recall ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.baseline_model?.roc_auc ?? 0).toFixed(3)}</td>
                    </tr>
                    <tr className="bg-teal-50/50 text-teal-900 font-bold">
                      <td className="py-2 px-3 font-sans">Random Forest (Final)</td>
                      <td className="py-2 px-3">{((urlIntel.strong_model?.accuracy ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((urlIntel.strong_model?.precision ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((urlIntel.strong_model?.recall ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{(urlIntel.strong_model?.roc_auc ?? 0).toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Confusion Matrix */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs font-semibold text-slate-800 mb-2">
                  Test Split Confusion Matrix (N = {urlIntel.test_count})
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800">True Negatives (Legit)</div>
                    <div className="text-base font-bold text-emerald-900">{urlIntel.confusion_matrix?.true_negatives}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-stone-200">
                    <div className="text-[10px] text-slate-500">False Positives</div>
                    <div className="text-base font-bold text-slate-700">{urlIntel.confusion_matrix?.false_positives}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-stone-200">
                    <div className="text-[10px] text-slate-500">False Negatives</div>
                    <div className="text-base font-bold text-slate-700">{urlIntel.confusion_matrix?.false_negatives}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-[10px] text-red-800">True Positives (Phish)</div>
                    <div className="text-base font-bold text-red-900">{urlIntel.confusion_matrix?.true_positives}</div>
                  </div>
                </div>
              </div>

              {/* Top Feature Importances */}
              <div>
                <span className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Top Feature Importances:
                </span>
                <div className="space-y-1.5">
                  {urlIntel.top_features?.slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-center text-xs font-mono">
                      <span className="w-36 text-slate-600 truncate text-[11px]">{f.feature}</span>
                      <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden mx-2 border border-stone-200">
                        <div
                          className="bg-teal-700 h-full rounded-full"
                          style={{ width: `${Math.round(f.importance * 200)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-slate-700 text-[11px] font-semibold">
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="skeleton h-32 w-full" />
          )}
        </div>

        {/* Model 2: NLP Social Engineering Classifier */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                2. NLP Social Engineering & Smishing Classifier
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                TF-IDF (1-2 N-grams) + Multinomial Naive Bayes
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
              3,000 Vocab
            </span>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              <strong>Architecture:</strong> TF-IDF Vectorizer with Sublinear Term Frequency + MultinomialNB.
            </p>
            <p>
              <strong>Corpus:</strong> SMS Spam/Phishing collection augmented with authentic Pakistani Roman Urdu fraud scenarios (BISP, bank block, OTP threats).
            </p>
          </div>

          {/* Dynamic Metrics Table */}
          {nlpIntel ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    <tr className="text-slate-600">
                      <td className="py-2 px-3 font-sans font-medium">Logistic Regression (Baseline)</td>
                      <td className="py-2 px-3">{((nlpIntel.baseline_model?.accuracy ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((nlpIntel.baseline_model?.precision ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((nlpIntel.baseline_model?.recall ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((nlpIntel.baseline_model?.f1_score ?? 0) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr className="bg-teal-50/50 text-teal-900 font-bold">
                      <td className="py-2 px-3 font-sans">Multinomial Naive Bayes (Final)</td>
                      <td className="py-2 px-3">{((nlpIntel.strong_model?.accuracy ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((nlpIntel.strong_model?.precision ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((nlpIntel.strong_model?.recall ?? 0) * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">{((nlpIntel.strong_model?.f1_score ?? 0) * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Confusion Matrix */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-xs font-semibold text-slate-800 mb-2">
                  Test Split Confusion Matrix (N = {nlpIntel.test_count})
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800">True Negatives (Benign)</div>
                    <div className="text-base font-bold text-emerald-900">{nlpIntel.confusion_matrix?.true_negatives}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-stone-200">
                    <div className="text-[10px] text-slate-500">False Positives</div>
                    <div className="text-base font-bold text-slate-700">{nlpIntel.confusion_matrix?.false_positives}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-stone-200">
                    <div className="text-[10px] text-slate-500">False Negatives</div>
                    <div className="text-base font-bold text-slate-700">{nlpIntel.confusion_matrix?.false_negatives}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-[10px] text-red-800">True Positives (Social Eng)</div>
                    <div className="text-base font-bold text-red-900">{nlpIntel.confusion_matrix?.true_positives}</div>
                  </div>
                </div>
              </div>

              {/* Key Phishing Lures */}
              <div>
                <span className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Top Phishing Lure Tokens (Log-Odds Weights):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nlpIntel.key_phishing_tokens?.slice(0, 8).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-xs font-mono text-slate-800"
                    >
                      "{t.token}" <span className="text-slate-400">({t.weight})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="skeleton h-32 w-full" />
          )}
        </div>
      </div>

      {/* Live Inference Testing Playground */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <Terminal className="w-4 h-4 text-teal-700" />
            <h4 className="font-bold text-slate-900 text-sm">
              Live Model Execution Playground
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Real In-Memory Backend Inference
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* URL Test */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Test URL Classifier (PhiUSIIL Schema):
            </label>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <input
                type="text"
                value={testUrl}
                onChange={e => setTestUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-teal-600"
              />
              <button
                type="button"
                onClick={handleTestUrl}
                disabled={urlLoading}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {urlLoading ? '...' : 'Predict'}
              </button>
            </div>

            {urlPred && (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Classification:</span>
                  <span className={urlPred.is_phishing ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {urlPred.is_phishing ? 'MALICIOUS (PHISHING)' : 'BENIGN (LEGITIMATE)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Probability:</span>
                  <span className="text-slate-900 font-bold">{(urlPred.phishing_probability * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Model: {urlPred.model_name}</span>
                  <span>Latency: {urlPred.latency_ms} ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Text Test */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Test NLP Social Engineering Classifier:
            </label>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <textarea
                rows={2}
                value={testText}
                onChange={e => setTestText(e.target.value)}
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-teal-600 resize-y"
              />
              <button
                type="button"
                onClick={handleTestMessage}
                disabled={nlpLoading}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer self-start disabled:opacity-50"
              >
                {nlpLoading ? '...' : 'Predict'}
              </button>
            </div>

            {nlpPred && (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Classification:</span>
                  <span className={nlpPred.is_social_engineering ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {nlpPred.is_social_engineering ? 'SOCIAL ENGINEERING ATTACK' : 'BENIGN MESSAGE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="text-slate-900 font-bold">{(nlpPred.risk_score * 100).toFixed(2)}%</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Categories Flagged: {nlpPred.categories_detected?.join(', ') || 'None'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
