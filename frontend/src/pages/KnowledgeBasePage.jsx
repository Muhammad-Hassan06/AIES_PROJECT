import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, ExternalLink, ShieldAlert, CheckCircle2, 
  HelpCircle, Database, Award, RefreshCw, Globe, FileText, AlertCircle
} from 'lucide-react';
import { queryRAG, getRAGCorpus, getRAGEvaluation } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const COMMON_QUESTIONS = [
  {
    lang: 'en',
    label: 'PECA 2016 Fraud Penalties',
    query: 'What does PECA Section 14 state regarding electronic fraud penalties in Pakistan?'
  },
  {
    lang: 'en',
    label: 'SBP Unauthorised Debits',
    query: 'What is a bank customer\'s liability for unauthorized OTP transactions under SBP guidelines?'
  },
  {
    lang: 'en',
    label: 'Reporting Phishing to PKCERT',
    query: 'How do citizens and organizations report courier delivery smishing to PKCERT?'
  },
  {
    lang: 'ro',
    label: 'BISP 8171 Lottery Fraud (Roman Urdu)',
    query: 'Kya 8171 ke ilawa kisi mobile number se BISP ki call ya SMS asakta hai?'
  },
  {
    lang: 'ur',
    label: 'سائبر کرائم کی شکایت کہاں درج کروائیں؟ (Urdu)',
    query: 'این سی سی آئی اے (NCCIA) میں آن لائن فراڈ اور سائبر کرائم کی شکایت درج کروانے کا طریقہ کار کیا ہے؟'
  },
  {
    lang: 'en',
    label: 'Out-of-Scope Test (Abstention)',
    query: 'Who won the ICC Cricket World Cup in 1992?'
  }
];

export default function KnowledgeBasePage() {
  const { currentLang } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('chat'); // 'chat' | 'corpus' | 'eval'
  const [queryText, setQueryText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  // Corpus state
  const [corpusDocs, setCorpusDocs] = useState([]);
  const [corpusLoading, setCorpusLoading] = useState(false);

  // Eval benchmark state
  const [evalData, setEvalData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  useEffect(() => {
    loadCorpus();
  }, []);

  const loadCorpus = async () => {
    try {
      setCorpusLoading(true);
      const docs = await getRAGCorpus();
      setCorpusDocs(docs);
    } catch (e) {
      console.error('Failed to load corpus', e);
    } finally {
      setCorpusLoading(false);
    }
  };

  const handleAsk = async (textToAsk = null, lang = null) => {
    const q = (textToAsk || queryText).trim();
    if (!q || isLoading) return;

    const askLang = lang || selectedLang;
    setIsLoading(true);
    setQueryText('');

    // Optimistic user turn
    const userTurn = { id: Date.now(), sender: 'user', text: q, timestamp: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userTurn]);

    try {
      const resp = await queryRAG(q, askLang);
      const botTurn = {
        id: Date.now() + 1,
        sender: 'bot',
        isGrounded: resp.is_grounded,
        abstained: resp.abstained,
        answer: resp.answer,
        citations: resp.citations || [],
        confidence: resp.confidence_score,
        language: resp.language,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, botTurn]);
    } catch (err) {
      const errorTurn = {
        id: Date.now() + 1,
        sender: 'bot',
        isGrounded: false,
        abstained: true,
        answer: 'Sorry, the knowledge base service is temporarily offline or unreachable.',
        citations: [],
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, errorTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  const runBenchmark = async () => {
    try {
      setEvalLoading(true);
      const res = await getRAGEvaluation();
      setEvalData(res);
    } catch (e) {
      console.error('Evaluation run failed', e);
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>Grounded Knowledge Base (RAG)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pakistani Cyber Law & Advisory Vault
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Grounded directly in PECA 2016, PKCERT Advisories, State Bank Circulars, and NCCIA SOPs. Never hallucinates statutory law.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'chat' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ask Questions
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('corpus')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'corpus' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Corpus Explorer ({corpusDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('eval')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'eval' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Evaluation (20-Q)
          </button>
        </div>
      </div>

      {/* Subtab 1: Chat / Q&A */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Q&A Stream (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Conversation Window */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 min-h-[380px] max-h-[540px] overflow-y-auto space-y-4 shadow-xs">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 mb-3">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Search Pakistani Cyber Regulations & Advisories</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Ask questions in English, Urdu, or Roman Urdu. The engine will cite legal provisions or abstain if no authoritative source exists.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-teal-700 text-white font-medium rounded-tr-xs'
                          : msg.abstained
                          ? 'bg-amber-50 text-amber-950 border border-amber-200 rounded-tl-xs'
                          : 'bg-stone-50 text-slate-900 border border-stone-200 rounded-tl-xs'
                      }`}
                    >
                      {/* Abstention Banner if Bot Abstained */}
                      {msg.sender === 'bot' && msg.abstained && (
                        <div className="flex items-center space-x-1.5 text-amber-800 font-bold mb-2 pb-1.5 border-b border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Deliberate Abstention (Out-of-Scope / Ungrounded)</span>
                        </div>
                      )}

                      {/* Bot Answer */}
                      <div className="whitespace-pre-line text-xs font-normal">
                        {msg.answer}
                      </div>

                      {/* Citations Card Strip */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-900 flex items-center space-x-1">
                            <BookOpen className="w-3 h-3 text-teal-700" />
                            <span>Authoritative Sources Cited ({msg.citations.length}):</span>
                          </div>
                          {msg.citations.map((c, i) => (
                            <div key={i} className="bg-white border border-stone-200 rounded-lg p-2 text-[11px] text-slate-700">
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span>{c.document_title || c.doc_title}</span>
                                {c.source_url && (
                                  <a
                                    href={c.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-teal-700 hover:text-teal-900 inline-flex items-center space-x-0.5 ml-2"
                                  >
                                    <span>Gazette PDF</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                              <div className="text-slate-500 text-[10px] mt-0.5">
                                {c.section} • Published by {c.publisher}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[9px] mt-1 opacity-70 text-right">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center space-x-2 text-teal-800 text-xs py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-700" />
                  <span>Retrieving corpus chunks and verifying grounding...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex items-center space-x-2 bg-white border border-stone-300 rounded-2xl p-1.5 shadow-xs focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500"
            >
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask about PECA provisions, bank OTP fraud, PKCERT advisories, or BISP scams..."
                className="flex-1 bg-transparent border-0 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />

              {/* Language Selector */}
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-stone-100 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-stone-200 focus:outline-hidden"
              >
                <option value="en">English</option>
                <option value="ur">اردو (Urdu)</option>
                <option value="ro">Roman Urdu</option>
              </select>

              <button
                type="submit"
                disabled={isLoading || !queryText.trim()}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>Ask</span>
              </button>
            </form>
          </div>

          {/* Sidebar: Common Questions & Legal Scope (1 col) */}
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-teal-700" />
                  <span>Common Inquiries</span>
                </span>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                  Click to Ask
                </span>
              </div>

              <div className="space-y-2">
                {COMMON_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(q.query, q.lang)}
                    className="w-full text-left p-2.5 rounded-xl bg-stone-50 hover:bg-teal-50 border border-stone-200 hover:border-teal-200 transition-all text-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 group-hover:text-teal-900">
                        {q.label}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {q.lang}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 group-hover:text-slate-700">
                      {q.query}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Grounding Policy Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 mb-1 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-teal-700" />
                <span>Strict Grounding & Abstention Policy</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                CyberShield RAG answers solely from documents physically present in <code className="text-teal-900 font-mono">backend/data/corpus/</code>. If a question falls outside verified Pakistani cyber-crime law, the model politely abstains instead of fabricating hallucinated answers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Corpus Explorer */}
      {activeSubTab === 'corpus' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Authoritative Documents in Local Vault</h3>
              <p className="text-xs text-slate-500">Every statutory act and regulatory advisory has been verified from official gazettes and portals.</p>
            </div>
            <button
              onClick={loadCorpus}
              disabled={corpusLoading}
              className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold rounded-xl text-slate-700 flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${corpusLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Vault</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {corpusDocs.map((doc, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-bold">
                      {doc.doc_id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {doc.file_size_bytes ? `${Math.round(doc.file_size_bytes / 1024)} KB` : 'Local'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <div>
                    <span className="font-semibold text-slate-700">Category:</span> {doc.category || 'General'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Publisher:</span> {doc.publisher}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Sections:</span> {doc.sections_count || 'Full text'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Language:</span> {doc.language || 'en'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                  <span className="text-[10px] text-slate-400">
                    Retrieved: {doc.retrieval_date || '27 Oct 2026'}
                  </span>
                  {doc.source_url ? (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:text-teal-900 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">CyberShield FAQ</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Corpus Tracker */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
            <h4 className="font-bold text-amber-900 mb-1 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>Corpus Intake Roadmap (CORPUS_TODO.md)</span>
            </h4>
            <p className="text-amber-800 text-[11px] mb-2">
              CyberShield AI adheres strictly to authentic government gazettes. Future inclusions queued for digitization:
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-900 text-[11px]">
              <li>National Assembly PECA Amendment Ordinance Gazettes (Draft 2024 revisions)</li>
              <li>PTA DIRBS Mobile Device Counterfeiting Directives & Smishing Registry Rules</li>
              <li>SECP Digital Lending & Loan App Scam Enforcement Circulars (2023-2025)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Subtab 3: Mini Evaluation Benchmark */}
      {activeSubTab === 'eval' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-teal-700" />
                  <span>20-Question Grounded RAG Benchmark</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  15 in-scope Pakistani cyber safety questions + 5 adversarial out-of-scope questions testing abstention fidelity.
                </p>
              </div>

              <button
                type="button"
                onClick={runBenchmark}
                disabled={evalLoading}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evalLoading ? 'animate-spin' : ''}`} />
                <span>{evalLoading ? 'Running Benchmark...' : 'Execute Evaluation'}</span>
              </button>
            </div>

            {evalData ? (
              <div className="space-y-4 pt-3 border-t border-stone-100">
                {/* Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Questions</span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{evalData.total_questions}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">In-Scope Hit Rate</span>
                    <div className="text-xl font-black text-emerald-900 mt-0.5">
                      {(evalData.in_scope_hit_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-teal-800 uppercase font-bold tracking-wider">Abstention Rate</span>
                    <div className="text-xl font-black text-teal-900 mt-0.5">
                      {(evalData.abstention_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-purple-800 uppercase font-bold tracking-wider">Overall Accuracy</span>
                    <div className="text-xl font-black text-purple-900 mt-0.5">
                      {(evalData.overall_accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Question Breakdown Table */}
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-slate-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Question</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Expected Target</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-slate-700 font-sans">
                      {evalData.detailed_results?.map((r, i) => (
                        <tr key={i} className="hover:bg-stone-50">
                          <td className="p-2.5 font-mono text-[10px]">{r.id}</td>
                          <td className="p-2.5 max-w-xs truncate">{r.question}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              r.type === 'IN_SCOPE' ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {r.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">{r.expected_doc}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 w-fit ${
                              r.status.startsWith('PASSED') ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                            }`}>
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{r.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                Click "Execute Evaluation" to run the automated 20-Q benchmark against the local TF-IDF Grounded RAG index.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
