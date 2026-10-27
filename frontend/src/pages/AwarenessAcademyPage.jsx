import React, { useState } from 'react';
import { 
  GraduationCap, AlertTriangle, CheckCircle2, XCircle, ArrowRight, 
  HelpCircle, Sparkles, BookOpen, ExternalLink, RefreshCw, Trophy
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SCAM_OF_THE_DAY = {
  title: 'Courier Parcel "Address Incomplete" Smishing (NCA-11.052424)',
  date: '27 Oct 2026',
  modality: 'SMS / iMessage',
  attackerTactic: 'Impersonating TCS, Leopard, or Pakistan Post claiming an urgent delivery cannot arrive due to an invalid postal code, forcing users to click an unverified .top or .online link to pay a nominal 45 PKR "redelivery charge".',
  targetData: 'Credit/Debit Card numbers, CVV, and SMS OTPs to drain account balances.',
  groundedReference: 'PKCERT National Advisory NCA-11.052424',
  goldenRule: 'Official couriers never ask for online debit card payments to correct delivery addresses via SMS links.'
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    scenario: 'You receive an SMS from "0345-1234567" stating: "BISP 8171 Alert: Aap ka 25,000 wazeefa agaya hai. Abhi call karein."',
    isScam: true,
    explanation: 'Official BISP communications ONLY originate from shortcode 8171. Standard 11-digit mobile phone numbers claiming to be BISP are fraudulent advance-fee lures.',
    ruleCited: 'RULE-005 (BISP Social Welfare Fraud)'
  },
  {
    id: 2,
    scenario: 'You receive an SMS from your bank labeled "HBL Alert": "Your account has been debited by PKR 500 at ATM #42." No link is attached, and no OTP is requested.',
    isScam: false,
    explanation: 'Legitimate banking informational SMS notifying account activity without asking for OTPs, passwords, or clicking external links.',
    ruleCited: 'Benign Transaction Telemetry'
  },
  {
    id: 3,
    scenario: 'A caller claiming to be from the FIA Cybercrime Wing threatens you with immediate arrest unless you transfer 30,000 PKR "bail security" via EasyPaisa to an officer\'s account.',
    isScam: true,
    explanation: 'Government law enforcement agencies never request cash bail or fine transfers to private mobile wallet accounts over telephone calls. PECA 2016 Section 14 makes this punishable by law.',
    ruleCited: 'RULE-004 (Law Enforcement Impersonation Extortion)'
  },
  {
    id: 4,
    scenario: 'An SMS arrives: "Dear Customer, your bank KYC has expired. Click http://meezan-bank-kyc-update.xyz to prevent card freeze."',
    isScam: true,
    explanation: 'Banks never send third-party domains (.xyz, .top, .online) for biometric or KYC verification. Under SBP CPD-02, all authentic portals use bank registered domains.',
    ruleCited: 'RULE-001 (Banking Credential Harvesting)'
  }
];

const GROUNDED_LESSONS = [
  {
    lang: 'en',
    title: 'The Golden Rule of Pakistani Digital Banking',
    content: 'State Bank of Pakistan (SBP) circular CPD Circular No. 02 of 2023 explicitly mandates that commercial banks, microfinance banks, and EMIs (EasyPaisa, JazzCash, Nayapay, Sadapay) will NEVER call, SMS, or email you requesting your PIN, Password, or 6-digit OTP.',
    citation: 'SBP CPD Circular 02/2023'
  },
  {
    lang: 'ro',
    title: 'BISP aur Wazeefa Scams Pehchanne Ka Tareeqa (Roman Urdu)',
    content: 'Benazir Income Support Programme (BISP) ki tamam tasdeeq sirf aur sirf 8171 shortcode se hoti hai. Agar kisi aam mobile number (03XX) se call ya WhatsApp aye ke aap ka 25,000 ya 50,000 rupay ka wazeefa aya hai, to yeh 100% fraud hai.',
    citation: 'PECA 2016 Section 14 & BISP Advisory'
  },
  {
    lang: 'ur',
    title: 'سوشل میڈیا اور موبائل والٹ فراڈ سے بچاؤ (Urdu)',
    content: 'جب بھی کوئی نامعلوم شخص آپ کو فوری رقم بھیجنے یا سیکیورٹی ڈپازٹ دینے کا کہے، تو ہرگز پیسے منتقل نہ کریں۔ پاکستان پینل کوڈ اور PECA 2016 کے تحت آن لائن دھوکہ دہی قابل تعزیر جرم ہے۔ فورا 9999 ہیلپ لائن پر شکایت درج کروائیں۔',
    citation: 'این سی سی آئی اے (NCCIA) عوامی آگاہی گائیڈ'
  }
];

export default function AwarenessAcademyPage() {
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // boolean
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[quizIndex];

  const handleAnswer = (userAns) => {
    if (showExplanation) return;
    setSelectedAnswer(userAns);
    setShowExplanation(true);
    if (userAns === currentQ.isScam) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold tracking-wide uppercase mb-1">
          <GraduationCap className="w-4 h-4 text-teal-700" />
          <span>Citizen Defense & Resilience</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Awareness Academy
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Interactive forensic learning, daily threat breakdowns, and grounded safety lessons in English, Urdu, and Roman Urdu.
        </p>
      </div>

      {/* Scam of the Day Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
              Scam of the Day
            </span>
            <span className="text-xs text-amber-900 font-bold">{SCAM_OF_THE_DAY.date}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-900">
            Modality: {SCAM_OF_THE_DAY.modality}
          </span>
        </div>

        <div>
          <h2 className="text-base font-black text-slate-900">
            {SCAM_OF_THE_DAY.title}
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed mt-1">
            {SCAM_OF_THE_DAY.attackerTactic}
          </p>
        </div>

        <div className="bg-white/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="font-semibold">{SCAM_OF_THE_DAY.goldenRule}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            Source: {SCAM_OF_THE_DAY.groundedReference}
          </span>
        </div>
      </div>

      {/* Spot the Scam Quiz Game */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              "Spot the Scam" Forensic Quiz Challenge
            </h3>
          </div>
          <span className="text-xs font-bold text-teal-900 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Score: {score} / {QUIZ_QUESTIONS.length}
          </span>
        </div>

        {!quizFinished ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Scenario {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
              <span>Evaluate for deception indicators</span>
            </div>

            {/* Scenario Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs font-medium text-slate-800 leading-relaxed">
              "{currentQ.scenario}"
            </div>

            {/* Action Buttons: Scam vs Legitimate */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                disabled={showExplanation}
                className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  showExplanation && currentQ.isScam
                    ? 'bg-red-50 text-red-900 border-red-300 ring-2 ring-red-400'
                    : 'bg-stone-50 hover:bg-red-50 text-slate-700 hover:text-red-900 border-stone-200 hover:border-red-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Malicious Scam</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(false)}
                disabled={showExplanation}
                className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  showExplanation && !currentQ.isScam
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400'
                    : 'bg-stone-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-stone-200 hover:border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Legitimate Message</span>
              </button>
            </div>

            {/* Feedback / Explanation Strip */}
            {showExplanation && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                selectedAnswer === currentQ.isScam
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                  : 'bg-red-50 text-red-950 border-red-200'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center space-x-1.5">
                    {selectedAnswer === currentQ.isScam ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Correct Identification!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Missed Threat Indicator</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase bg-white/70 px-2 py-0.5 rounded">
                    {currentQ.ruleCited}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {currentQ.explanation}
                </p>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {quizIndex + 1 < QUIZ_QUESTIONS.length ? 'Next Scenario →' : 'See Final Score'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <Trophy className="w-10 h-10 text-teal-700 mx-auto" />
            <h4 className="text-base font-black text-slate-900">
              Quiz Completed! You scored {score} out of {QUIZ_QUESTIONS.length}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {score === QUIZ_QUESTIONS.length
                ? 'Outstanding forensic awareness! You successfully spotted all localized Pakistani scam tactics.'
                : 'Good practice! Review the grounded lessons below to sharpen your detection of urgent OTP and BISP lures.'}
            </p>
            <button
              type="button"
              onClick={handleRestartQuiz}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Grounded Multilingual Micro-Lessons */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
          <BookOpen className="w-4 h-4 text-teal-700" />
          <span>Grounded Micro-Lessons (English / Urdu / Roman Urdu)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GROUNDED_LESSONS.map((lesson, idx) => (
            <div key={idx} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase bg-stone-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                    {lesson.lang}
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold truncate max-w-[140px]">
                    {lesson.citation}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {lesson.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {lesson.content}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Corpus-grounded</span>
                <span className="text-teal-700 font-bold">Knowledge Base</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
