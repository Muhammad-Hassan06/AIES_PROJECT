import React, { useState } from 'react';
import { 
  Sparkles, HelpCircle, CheckCircle2, XCircle, 
  AlertTriangle, ArrowRight, RotateCcw, Award, Lightbulb, Shield 
} from 'lucide-react';
import { SAMPLE_SCENARIOS } from './DemoScenarioCards';

const DAILY_SCAM = {
  title: 'Urgent Electricity Bill APK SMS Scam',
  institution: 'LESCO / K-Electric / FESCO Impersonation',
  hook: 'SMS stating your electricity meter will be disconnected at 9:00 PM tonight due to unpaid bill of Rs. 4,820.',
  lure: 'Victim is told to call an unverified 03xx mobile number or click an unofficial link downloading an Android APK file titled "BillUpdate.apk".',
  danger: 'The malicious APK captures SMS verification codes, banking credentials, and screen permissions.',
  defense: 'Power distribution companies (LESCO, K-Electric) never distribute APK files via SMS links. Pay bills only through official banking apps or verified customer service centers.'
};

const QUIZ_ITEMS = [
  {
    id: 1,
    title: 'Bank Debit Card SMS',
    content: 'Dear HBL Customer, your debit card #8812 has been blocked due to KYC inactivity. Call +92-301-8891029 immediately to update your verification and restore access.',
    isScam: true,
    redFlags: [
      'Call to an ordinary mobile phone number (+92-301-...) instead of bank short code',
      'Creating panic and false urgency regarding card suspension',
      'Banks never ask you to resolve KYC by calling personal cell numbers'
    ],
    explanation: 'This is Bank Vishing / Smishing. Real banks send notices from registered alphanumeric short codes (e.g. HBL) and ask you to visit a physical branch.'
  },
  {
    id: 2,
    title: 'Advisory Alert',
    content: 'Visit pkcert.gov.pk/advisories to inspect national cyber security vulnerability guidelines regarding browser vulnerabilities.',
    isScam: false,
    redFlags: [],
    explanation: 'This is legitimate. The link points strictly to the official government domain .gov.pk and does not ask for credentials, fees, or OTP codes.'
  },
  {
    id: 3,
    title: 'Benazir Support Grant',
    content: 'BISP Alert: Mubarik ho! Aap k 25,000 rupay BISP Benazir Income Support Program mein aagaye hain. Apna CNIC verify karwayen aur advance delivery fee 1,500 JazzCash bhejein.',
    isScam: true,
    redFlags: [
      'Demand for advance registration or delivery fee via mobile wallet',
      'BISP exclusively communicates through official 8171 SMS',
      'Colloquial lottery lure'
    ],
    explanation: 'Classic advance fee fraud. Government financial support programs NEVER demand fees before releasing payments.'
  },
  {
    id: 4,
    title: 'Postal Parcel Tracking',
    content: 'Your package #PK-9812 is held at Lahore Customs. Pay Rs. 850 customs duty within 12 hours at pakistan-post-tracking-fee.top',
    isScam: true,
    redFlags: [
      'Suspicious top-level domain (.top) instead of official .gov.pk',
      'Tight 12-hour deadline designed to prevent rational verification',
      'Payment demanded via online credit card form'
    ],
    explanation: 'Scammers create lookalike courier websites on cheap TLDs to capture debit/credit card details.'
  }
];

export default function AwarenessCenter() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const q = QUIZ_ITEMS[currentQuestion];

  const handleAnswer = (choice) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
    const correct = choice === q.isScam;
    if (correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_ITEMS.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6">
      {/* Scam of the Day Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Lightbulb className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
                Awareness Spotlight
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Scam of the Day: {DAILY_SCAM.title}
              </h3>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
            High Prevalence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-3.5 bg-white/80 rounded-xl border border-amber-100 space-y-1">
            <span className="font-bold text-slate-900 block">The Fraud Hook:</span>
            <p className="text-slate-600 leading-relaxed">{DAILY_SCAM.hook}</p>
          </div>
          <div className="p-3.5 bg-white/80 rounded-xl border border-amber-100 space-y-1">
            <span className="font-bold text-slate-900 block">The Deception / Threat:</span>
            <p className="text-slate-600 leading-relaxed">{DAILY_SCAM.lure}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start space-x-2.5 rtl:space-x-reverse">
          <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-emerald-900">Recommended Defense Rule:</span>
            <p className="text-emerald-800 leading-relaxed">{DAILY_SCAM.defense}</p>
          </div>
        </div>
      </div>

      {/* Spot the Scam Mini-Game */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
              <Award className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Spot the Scam Mini-Quiz
              </h3>
              <p className="text-xs text-slate-500">
                Sharpen your eye against common Pakistani phishing lures
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-semibold text-slate-600">
            Score: <span className="text-teal-700">{score}</span> / {QUIZ_ITEMS.length}
          </div>
        </div>

        {!quizFinished ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Scenario {currentQuestion + 1} of {QUIZ_ITEMS.length}</span>
              <span className="font-semibold text-slate-700">{q.title}</span>
            </div>

            {/* Prompt message preview */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 font-sans text-sm text-slate-900 leading-relaxed">
              "{q.content}"
            </div>

            {/* Question options */}
            {selectedAnswer === null ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAnswer(true)}
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-900 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-red-700" />
                  <span>This is a SCAM</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswer(false)}
                  className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>This is LEGITIMATE</span>
                </button>
              </div>
            ) : (
              /* Answer Feedback */
              <div className="space-y-4 pt-2 animate-fade-in">
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    selectedAnswer === q.isScam
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                    {selectedAnswer === q.isScam ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Correct! You spotted it accurately.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Caution! This is actually {q.isScam ? 'a Scam' : 'Legitimate'}.</span>
                      </>
                    )}
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>

                  {q.redFlags && q.redFlags.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60">
                      <span className="font-bold block mb-1">Key Red Flags to Look For:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {q.redFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>{currentQuestion < QUIZ_ITEMS.length - 1 ? 'Next Scenario' : 'View Results'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Finished State */
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Quiz Completed!
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              You scored <strong>{score} out of {QUIZ_ITEMS.length}</strong>. Understanding how social engineering triggers urgency and panic is your best defense.
            </p>
            <button
              type="button"
              onClick={resetQuiz}
              className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
