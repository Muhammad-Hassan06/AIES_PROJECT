import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InvestigationStudioPage from '../pages/InvestigationStudioPage';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';
import { formatCaseDate, redactSensitiveData, getConfidenceExplanation } from '../utils/format';

const MOCK_SAVED_CASE = {
  case_id: 'CS-TEST-9988',
  timestamp: '2026-10-27T16:24:00Z',
  input_type: 'combined',
  status: 'COMPLETED',
  risk_level: 'CRITICAL',
  model_confidence: 0.985,
  evidence_strength: 'High (Corroborated across 3 modalities)',
  executive_summary: 'Severe credential harvesting attack targeting Pakistani banking credentials.',
  technical_report: 'Random Forest detected phishing URL entropy; NLP detected OTP solicitation.',
  key_warnings: ['Do not provide OTP', 'Bank never sends .top links'],
  recommended_actions: ['Contact HBL Helpline 111-111-425'],
  limitations: ['Offline model analysis'],
  official_resources: [],
  evidence_ledger: [
    {
      indicator: 'Suspicious TLD .top',
      modality: 'url',
      confidence: 0.99,
      risk_weight: 'CRITICAL',
      source_agent: 'URL Threat Agent'
    }
  ],
  triggered_rules: [
    {
      rule_id: 'RULE-001',
      rule_name: 'Urgent Banking OTP Credential Harvesting',
      severity: 'CRITICAL',
      confidence_modifier: 0.95,
      matched_conditions: ['OTP requested']
    }
  ],
  agent_execution_trace: [
    {
      agent_name: 'URL Threat Agent',
      status: 'COMPLETED',
      duration_ms: 18.5,
      findings_summary: 'Detected high entropy URL with .top TLD'
    }
  ],
  raw_input: {
    url: 'http://hbl-verify-security-login.top/account',
    text: 'URGENT: Your account is blocked. Verify OTP at the link.',
    sender_info: '+923001234567'
  },
  model_versions: {
    url_classifier: 'v1.2.0-rf100',
    nlp_analyzer: 'v1.1.0-nb'
  }
};

describe('Case History & Restore Fidelity', () => {
  it('formats dates as editorial string rather than raw ISO', () => {
    const formatted = formatCaseDate('2026-10-27T16:24:00Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
    expect(formatted).not.toContain('T');
    expect(formatted).not.toContain('Z');
  });

  it('explains confidence when high confidence is paired with low evidence', () => {
    const explanation = getConfidenceExplanation('HIGH', 0.95, 'Low');
    expect(explanation).toContain('limited');
  });

  it('redacts Pakistani PII (CNIC, phone numbers, IBAN) for Share-Safe exports', () => {
    const raw = 'Contact 03001234567 with CNIC 42101-1234567-1 and IBAN PK36MEZN0001234567890123';
    const redacted = redactSensitiveData(raw);

    expect(redacted).not.toContain('03001234567');
    expect(redacted).toContain('[PHONE-REDACTED]');
    expect(redacted).not.toContain('42101-1234567-1');
    expect(redacted).toContain('[CNIC-REDACTED]');
    expect(redacted).not.toContain('PK36MEZN0001234567890123');
    expect(redacted).toContain('[IBAN-REDACTED]');
  });

  it('renders Viewing Saved Case banner with Re-run and Close actions', () => {
    render(
      <LanguageProvider>
        <ToastProvider>
          <InvestigationStudioPage currentReport={MOCK_SAVED_CASE} />
        </ToastProvider>
      </LanguageProvider>
    );

    // Banner must be visible
    expect(screen.getByText(/Viewing Saved Case/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CS-TEST-9988/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Re-run Analysis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();

    // Input fields must be populated with original statement and URL
    const urlInput = screen.getByPlaceholderText(/example\.com/i);
    expect(urlInput.value).toBe('http://hbl-verify-security-login.top/account');

    // Switch to message tab to verify restored text
    const messageTabBtn = screen.getByRole('button', { name: /SMS \/ Message/i });
    fireEvent.click(messageTabBtn);

    const msgInput = screen.getByPlaceholderText(/Paste suspicious text/i);
    expect(msgInput.value).toBe('URGENT: Your account is blocked. Verify OTP at the link.');
  });

  it('clears saved case view and resets input fields when Close is clicked', () => {
    const handleClear = vi.fn();
    render(
      <LanguageProvider>
        <ToastProvider>
          <InvestigationStudioPage currentReport={MOCK_SAVED_CASE} onClearReport={handleClear} />
        </ToastProvider>
      </LanguageProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});


