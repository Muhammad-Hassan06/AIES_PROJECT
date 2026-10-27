import React, { useEffect, useState } from 'react';

export default function RiskMeterGauge({ score = 0, level = 'LOW', size = 140 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const normLevel = (level || 'LOW').toUpperCase();
  const targetPct = Math.min(100, Math.max(0, Math.round(score * 100)));

  useEffect(() => {
    // Check reduced motion
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (prefersReduced) {
      setAnimatedScore(targetPct);
      return;
    }

    // Animate from 0 to targetPct
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
        return '#64748B'; // Insufficient Evidence Slate
    }
  };

  const color = getColor();
  // Semi-circle SVG coordinates: radius 40, circumference for half-circle is PI * 40 = 125.66
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * animatedScore) / 100;

  return (
    <div 
      className="flex flex-col items-center justify-center select-none"
      style={{ width: size, height: size * 0.75 }}
      role="meter"
      aria-valuenow={targetPct}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`Risk meter: ${animatedScore} percent`}
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
          style={{ fontSize: '18px' }}
        >
          {animatedScore}%
        </text>
        <text
          x="50"
          y="58"
          textAnchor="middle"
          className="font-medium font-sans fill-slate-500"
          style={{ fontSize: '7.5px' }}
        >
          RISK SCORE
        </text>
      </svg>
    </div>
  );
}
