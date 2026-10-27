import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export default function StartupAnimation({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (prefersReduced) {
      setVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // Auto-dismiss after 1.5s
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setVisible(false);
    if (onComplete) onComplete();
  };

  if (!visible) return null;

  return (
    <div 
      onClick={handleSkip}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50/95 backdrop-blur-sm transition-opacity duration-300 cursor-pointer select-none"
      role="dialog"
      aria-label="Welcome to CyberShield AI"
    >
      <div className="flex flex-col items-center text-center p-8 max-w-md animate-fade-in">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md mb-4 transform transition-transform duration-700">
          <Shield className="w-9 h-9" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          CyberShield AI
        </h1>

        {/* Tagline */}
        <p className="text-sm font-medium text-slate-600 mb-6">
          Investigate smarter. Detect earlier. Stay safer.
        </p>

        {/* Subtle Progress Bar */}
        <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-teal-700 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-full" />
        </div>

        <button
          onClick={handleSkip}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium underline underline-offset-4 cursor-pointer"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
