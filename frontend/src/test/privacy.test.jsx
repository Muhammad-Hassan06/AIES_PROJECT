import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DigitalPrivacyPage from '../pages/DigitalPrivacyPage';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getPrivacyOverview: vi.fn(),
    listPrivacyInvestigations: vi.fn(),
    getPrivacyProvidersStatus: vi.fn(),
    createPrivacyInvestigation: vi.fn(),
    executePrivacyRemediation: vi.fn(),
    deletePrivacyInvestigation: vi.fn()
  };
});

const mockMetrics = {
  total_investigations: 3,
  verified_exposure_findings: 2,
  potential_matches: 1,
  open_remediation_tasks: 2,
  completed_remediation_actions: 1,
  latest_check_at: '2026-10-28T12:00:00Z',
  exposure_trends: [{ date: '2026-10-28', investigations: 3 }]
};

const mockProviders = [
  { provider_id: 'gemini', provider_name: 'Google Gemini', provider_type: 'LLM', is_configured: true, is_healthy: true, model_name: 'gemini-2.5-flash', status_message: 'Operational' },
  { provider_id: 'groq', provider_name: 'Groq API', provider_type: 'LLM', is_configured: false, is_healthy: false, status_message: 'Key not configured' },
  { provider_id: 'local_vault', provider_name: 'Local CyberShield Case Vault', provider_type: 'DISCOVERY', is_configured: true, is_healthy: true, status_message: 'Active and available' }
];

const mockInvestigation = {
  investigation_id: 'DF-20261028-TEST01',
  created_at: '2026-10-28T12:00:00Z',
  investigation_type: 'combined',
  target_masked: 'm***n@example.com / +92-300-***-4567',
  consent_given: true,
  execution_status: 'COMPLETED',
  risk_level: 'HIGH',
  risk_score: 0.75,
  coverage_summary: {
    sources_checked: 2,
    potential_matches: 1,
    verified_findings: 1,
    sources_unavailable: 1,
    coverage_level: 'Partial',
    provider_notes: ['Local vault checked', 'Search skipped']
  },
  execution_trace: [
    { agent_id: 'agent_1', agent_name: 'Agent 1: Consent & Intake Agent', status: 'COMPLETED', summary: 'Consent confirmed.' },
    { agent_id: 'agent_2', agent_name: 'Agent 2: Discovery Planning Agent', status: 'COMPLETED', summary: 'Planned 2 sources.' }
  ],
  findings: [
    {
      finding_id: 'FND-TEST-01',
      investigation_id: 'DF-20261028-TEST01',
      identifier_type: 'email',
      exposure_category: 'BREACH_DATABASE',
      source_name: 'Collection #1 Breach Dump',
      source_type: 'BREACH_REPORTER',
      discovered_at: '2026-10-28',
      evidence_reference: 'Leak Catalog',
      evidence_excerpt_redacted: 'Email and plaintext passwords exposed in forum dump.',
      verification_status: 'VERIFIED',
      confidence_score: 0.95,
      confidence_explanation: 'Independently verified breach entry.',
      risk_level: 'HIGH',
      recommended_action: 'SECURE_ACCOUNT',
      last_checked_at: '2026-10-28',
      removal_status: 'NOT_STARTED'
    }
  ],
  remediation_tasks: [
    {
      task_id: 'TSK-TEST-01',
      investigation_id: 'DF-20261028-TEST01',
      finding_id: 'FND-TEST-01',
      action_type: 'SECURE_ACCOUNT',
      action_status: 'INSTRUCTIONS_AVAILABLE',
      target_name: 'Collection #1 Breach Dump',
      target_identifier_masked: 'm***n@example.com',
      instructions_text: 'Immediately change passwords on exposed accounts and enable 2FA.',
      official_portal_url: 'https://haveibeenpwned.com',
      created_at: '2026-10-28',
      last_updated_at: '2026-10-28'
    }
  ],
  triggered_rules: [
    { rule_id: 'RULE_DF_01', explanation: 'Verified public exposure mandates remediation.' }
  ],
  llm_provider_used: 'Google Gemini',
  is_deterministic_fallback: false,
  executive_summary: 'Target identifier was identified in 1 verified exposure record.',
  limitations_disclosure: 'Search checks public sources and configured leak databases.'
};

describe('DigitalPrivacyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getPrivacyOverview.mockResolvedValue(mockMetrics);
    api.listPrivacyInvestigations.mockResolvedValue([mockInvestigation]);
    api.getPrivacyProvidersStatus.mockResolvedValue(mockProviders);
  });

  it('renders overview metrics and provider capabilities correctly', async () => {
    render(
      <LanguageProvider>
        <ToastProvider>
          <DigitalPrivacyPage />
        </ToastProvider>
      </LanguageProvider>
    );

    // Header
    expect(screen.getByText(/Digital Footprint & Privacy Defense Center/i)).toBeInTheDocument();

    // Metric values from mockMetrics
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // total investigations
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // verified findings / open tasks
    });

    // Provider status
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
    expect(screen.getByText('Local CyberShield Case Vault')).toBeInTheDocument();
  });

  it('navigates to New Investigation tab and enforces consent validation', async () => {
    render(
      <LanguageProvider>
        <ToastProvider>
          <DigitalPrivacyPage />
        </ToastProvider>
      </LanguageProvider>
    );

    // Switch to New Investigation tab via exact tab button
    const newInvBtn = screen.getByRole('button', { name: /^New Investigation$/i });
    fireEvent.click(newInvBtn);

    expect(screen.getByText(/Start Privacy & Spam Source Investigation/i)).toBeInTheDocument();

    // Try submitting without consent
    const submitBtn = screen.getByRole('button', { name: /Run Digital Footprint Audit/i });
    fireEvent.click(submitBtn);

    // Should not call createPrivacyInvestigation without consent
    expect(api.createPrivacyInvestigation).not.toHaveBeenCalled();
  });

  it('renders Exposure Map and displays finding details', async () => {
    render(
      <LanguageProvider>
        <ToastProvider>
          <DigitalPrivacyPage />
        </ToastProvider>
      </LanguageProvider>
    );

    // Wait for investigation to be active
    await waitFor(() => {
      expect(screen.getAllByText(/DF-20261028-TEST01/i).length).toBeGreaterThanOrEqual(1);
    });

    // Switch to Exposure Map tab
    const mapTabBtn = screen.getByRole('button', { name: /Exposure Map/i });
    fireEvent.click(mapTabBtn);

    // Check finding card
    expect(screen.getByText(/Collection #1 Breach Dump/i)).toBeInTheDocument();
    expect(screen.getAllByText(/VERIFIED/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/HIGH RISK/i).length).toBeGreaterThanOrEqual(1);
  });


  it('renders Remediation Center tasks and marks task as verified', async () => {
    api.executePrivacyRemediation.mockResolvedValue({
      task_id: 'TSK-TEST-01',
      action_status: 'REMOVAL_VERIFIED'
    });

    render(
      <LanguageProvider>
        <ToastProvider>
          <DigitalPrivacyPage />
        </ToastProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/DF-20261028-TEST01/i).length).toBeGreaterThanOrEqual(1);
    });

    // Switch to Remediation Center tab
    const remTabBtn = screen.getByRole('button', { name: /Remediation Center/i });
    fireEvent.click(remTabBtn);

    expect(screen.getByText(/Immediately change passwords on exposed accounts/i)).toBeInTheDocument();

    // Click Mark as Verified
    const verifyBtn = screen.getByRole('button', { name: /Mark as Verified/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(api.executePrivacyRemediation).toHaveBeenCalledWith('TSK-TEST-01', 'verify', expect.any(String));
    });
  });
});

