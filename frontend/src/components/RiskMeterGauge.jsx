import React, { useEffect, useState } from 'react';

export default function RiskMeterGauge({ score = 0, level = 'LOW', size = 140, label = 'FRAUD RISK' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const normLevel = (level || 'LOW').toUpperCase();
  const isInsufficient = normLevel === 'INSUFFICIENT_EVIDENCE';
  
  // Normalize score: if score is > 1, assume 0-100 scale, else 0-1
  const rawScore = typeof score === 'number' ? score : 0;
  const targetPct = isInsufficient 
    ? 0 
    : Math.min(100, Math.max(0, rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100)));

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (prefersReduced) {
      setAnimatedScore(targetPct);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedScore(targetPct);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetPct]);

  const getColor = () => {
    switch (normLevel) {
      case 'CRITICAL':
        return '#DC2626'; // Red
      case 'HIGH':
        return '#EA580C'; // Orange
      case 'MEDIUM':
        return '#D97706'; // Amber
      case 'LOW':
        return '#16A34A'; // Green
      default:
        return '#94A3B8'; // Insufficient Evidence Slate
    }
  };

  const color = getColor();
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (isInsufficient ? 0 : animatedScore)) / 100;

  return (
    <div 
      className="flex flex-col items-center justify-center select-none"
      style={{ width: size, height: size * 0.75 }}
      role="meter"
      aria-valuenow={isInsufficient ? 0 : targetPct}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`Risk meter: ${isInsufficient ? 'Insufficient evidence' : animatedScore + ' / 100'}`}
    >
      <svg
        viewBox="0 0 100 60"
        className="w-full h-full overflow-visible"
      >
        {/* Background Track */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated Value Arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
          }}
        />
        {/* Score Text */}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          className="font-bold font-sans fill-slate-900"
          style={{ fontSize: isInsufficient ? '15px' : '18px' }}
        >
          {isInsufficient ? '--' : `${animatedScore}/100`}
        </text>
        <text
          x="50"
          y="58"
          textAnchor="middle"
          className="font-medium font-sans fill-slate-500 uppercase tracking-wider"
          style={{ fontSize: isInsufficient ? '5.5px' : '6.5px' }}
        >
          {isInsufficient ? 'EVIDENCE INSUFFICIENT' : label}
        </text>
      </svg>
    </div>
  );
}
