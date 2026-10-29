import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisualForensicsCanvas from '../components/VisualForensicsCanvas';
import EvidenceLedgerTable from '../components/EvidenceLedgerTable';
import { ToastProvider } from '../context/ToastContext';
import { LanguageProvider } from '../context/LanguageContext';

describe('Feature 2: Explainable Visual Phishing Forensics (VisualForensicsCanvas)', () => {
  const sampleVisionResult = {
    layout_type: 'MOBILE_SCREENSHOT',
    visual_phishing_probability: 0.92,
    is_legitimate_likelihood: 0.08,
    ocr_engine: 'Windows WinRT OCR',
    forensics_summary: 'Detected urgent credential capture lure on mobile layout.',
    suspicious_regions: [
      {
        region_id: 'R1',
        category: 'CREDENTIAL_PROMPT',
        bounding_box: [0.35, 0.15, 0.45, 0.85],
        extracted_text: 'Enter your Online Banking Password',
        severity: 'CRITICAL',
        grounded_rationale: 'Credential input field on unauthorized domain context.',
        confidence: 0.94
      },
      {
        region_id: 'R2',
        category: 'COERCIVE_TIMER',
        bounding_box: [0.10, 0.20, 0.18, 0.80],
        extracted_text: 'Action required within 04:59 minutes',
        severity: 'HIGH',
        grounded_rationale: 'Urgent intimidation timer coercing immediate action.',
        confidence: 0.89
      }
    ]
  };

  it('renders layout type, dual probability bars, and suspicious region bounding boxes', () => {
    render(
      <ToastProvider>
        <LanguageProvider>
          <VisualForensicsCanvas visionResult={sampleVisionResult} />
        </LanguageProvider>
      </ToastProvider>
    );

    // Verify layout classification
    expect(screen.getByText('MOBILE_SCREENSHOT')).toBeInTheDocument();
    expect(screen.getByText('Explainable Visual Phishing Forensics')).toBeInTheDocument();

    // Verify dual probabilities
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();

    // Verify regions in table and canvas
    expect(screen.getAllByText('R1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('R2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CREDENTIAL_PROMPT')).toBeInTheDocument();
    expect(screen.getByText('COERCIVE_TIMER')).toBeInTheDocument();
  });

  it('shows clean state when no suspicious regions are present', () => {
    const cleanVision = {
      layout_type: 'INFORMATIONAL_ARTICLE',
      visual_phishing_probability: 0.05,
      is_legitimate_likelihood: 0.95,
      ocr_engine: 'Windows WinRT OCR',
      suspicious_regions: []
    };

    render(
      <ToastProvider>
        <LanguageProvider>
          <VisualForensicsCanvas visionResult={cleanVision} />
        </LanguageProvider>
      </ToastProvider>
    );

    expect(screen.getByText(/Clean Visual Forensics: No anomalous credential inputs/i)).toBeInTheDocument();
  });
});

describe('Feature 3: Evidence Fusion Ledger (EvidenceLedgerTable)', () => {
  const sampleLedger = [
    {
      finding: 'High Risk URL Path',
      evidence_source: 'Lexical Gradient Classifier',
      observed_value: 'login.bank-verify.com',
      correlation_group: 'DOMAIN_SECURITY_SIGNALS',
      contribution_points: 35,
      reliability_limitation: 'Lexical analysis; dynamic execution bypassed.',
      confidence: 0.95
    },
    {
      finding: 'Credential Harvesting Intimidation',
      evidence_source: 'Social Engineering NLP Transformer',
      observed_value: 'Enter your password immediately',
      correlation_group: 'LINGUISTIC_SOCIAL_ENGINEERING',
      contribution_points: 30,
      reliability_limitation: 'Text semantics only.',
      confidence: 0.91
    }
  ];

  it('renders point contributions and anti-double-counting correlation groups', () => {
    render(<EvidenceLedgerTable ledger={sampleLedger} />);

    expect(screen.getByText('High Risk URL Path')).toBeInTheDocument();
    expect(screen.getByText('DOMAIN_SECURITY_SIGNALS')).toBeInTheDocument();
    expect(screen.getByText('LINGUISTIC_SOCIAL_ENGINEERING')).toBeInTheDocument();
    expect(screen.getByText('+35 pts')).toBeInTheDocument();
    expect(screen.getByText('+30 pts')).toBeInTheDocument();
    expect(screen.getByText(/Anti-Double-Counting Dampening Applied/i)).toBeInTheDocument();
  });
});
