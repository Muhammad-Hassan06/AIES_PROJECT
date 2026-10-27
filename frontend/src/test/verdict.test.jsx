import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RiskVerdictCard from '../components/RiskVerdictCard';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';

const mockReport = {
  case_id: 'CASE-2026-TEST',
  risk_level: 'CRITICAL',
  model_confidence: 0.985,
  evidence_strength: 'STRONG',
  input_type: 'combined',
  executive_summary: 'Critical phishing attack impersonating HBL internet banking credentials and demanding OTP.',
  recommended_actions: [
    'Never share your OTP or PIN code.',
    'Block the sender phone number immediately.',
    'Contact your bank helpline printed on your card.'
  ],
  key_warnings: ['Demands 6-digit OTP', 'High-urgency deadline']
};

describe('RiskVerdictCard', () => {
  it('renders risk verdict details, badge, summary, and actions', () => {
    const onToggle = vi.fn();
    const onShare = vi.fn();

    render(
      <LanguageProvider>
        <ToastProvider>
          <RiskVerdictCard
            report={mockReport}
            isTechnicalMode={false}
            onToggleTechnical={onToggle}
            onOpenShareSafe={onShare}
          />
        </ToastProvider>
      </LanguageProvider>
    );

    // Checks risk badge
    expect(screen.getByTestId('risk-verdict-card')).toBeInTheDocument();
    expect(screen.getByText(/CASE-2026-TEST/i)).toBeInTheDocument();
    expect(screen.getByText(/CRITICAL THREAT/i)).toBeInTheDocument();

    // Plain-language summary
    expect(screen.getByText(/Critical phishing attack impersonating HBL/i)).toBeInTheDocument();

    // Top actions
    expect(screen.getByText(/Never share your OTP or PIN code./i)).toBeInTheDocument();

    // Toggle button interaction
    const toggleBtn = screen.getByRole('button', { name: /Switch to Technical view/i });
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // Share safe button
    const shareBtn = screen.getByRole('button', { name: /Share-Safe Summary/i });
    fireEvent.click(shareBtn);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('renders calm Insufficient Evidence outcome when risk is INSUFFICIENT_EVIDENCE', () => {
    const insufficientReport = {
      ...mockReport,
      risk_level: 'INSUFFICIENT_EVIDENCE',
      model_confidence: 0.35
    };

    render(
      <LanguageProvider>
        <ToastProvider>
          <RiskVerdictCard
            report={insufficientReport}
            isTechnicalMode={false}
          />
        </ToastProvider>
      </LanguageProvider>
    );

    expect(screen.getAllByText(/INSUFFICIENT EVIDENCE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Insufficient evidence to confirm malicious intent/i)).toBeInTheDocument();
  });
});
