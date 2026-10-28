"""
CyberShield AI — Master Regression & Feature Verification Test Suite
Covers:
1. Model loading, class calibration, and Wikipedia false-positive prevention.
2. CRO KPI and Agent Tick workflow audit proofs.
3. Phone number isolation, personal zero-finding honesty, and synthetic fixtures.
4. Feature 1: Multi-Source Threat Intelligence (PhishTank, URLhaus, Safe Browsing).
5. Feature 2: Email Header Authentication & Consistency (SPF, DKIM, DMARC, Reply-To).
6. Feature 3: Scam Campaign Clustering & Pattern Detection.
"""

import os
import pytest
from app.ml.url_classifier import url_classifier, extract_url_features
from app.nlp.text_classifier import text_classifier
from app.intelligence.multi_threat_intel import multi_threat_intel, URLhausProvider, PhishTankProvider
from app.intelligence.email_authenticator import email_authenticator
from app.analytics.campaign_clustering import campaign_clustering_engine
from app.privacy.providers.discovery import discovery_manager
from app.privacy.fixtures import SYNTHETIC_TEST_FIXTURES, get_fixture_by_phone, is_synthetic_number
from app.db.database import (
    seed_synthetic_fixtures, reset_synthetic_fixtures,
    list_synthetic_fixtures, seed_sample_spam_cases
)
from app.agents.orchestrator import orchestrator
from app.models.schemas import InvestigationType, RiskLevel

# ==============================================================================
# 1. Model & Wikipedia False-Positive Tests
# ==============================================================================

def test_model_artifact_loaded():
    """Confirms RandomForest model and scaler artifacts are properly loaded."""
    assert url_classifier.model is not None, "url_classifier.model must be loaded from joblib"
    assert url_classifier.scaler is not None, "url_classifier.scaler must be loaded from joblib"

def test_wikipedia_domains_classified_benign():
    """Verifies that Wikipedia root and subdomains are classified as legitimate (not phishing)."""
    test_urls = [
        "https://www.wikipedia.org/",
        "https://en.wikipedia.org/wiki/Computer_security",
        "www.wikipedia.com",
        "http://wikipedia.org"
    ]
    for u in test_urls:
        pred = url_classifier.predict(u)
        assert pred["is_phishing"] is False, f"{u} must not be flagged as phishing"
        assert pred["phishing_probability"] < 0.15, f"{u} probability must be low, got {pred['phishing_probability']}"

def test_wikipedia_orchestrator_investigation_risk():
    """Verifies that an investigation of pure Wikipedia URL evaluates to LOW risk."""
    rep = orchestrator.run_investigation(input_type=InvestigationType.URL, url="www.wikipedia.com")
    assert rep.risk_level == RiskLevel.LOW, f"Wikipedia risk should be LOW, got {rep.risk_level.value}"
    assert rep.model_confidence >= 0.85

def test_known_malicious_phishing_url():
    """Verifies that actual phishing lures with IP addresses and banking keywords are detected."""
    malicious_url = "http://192.168.1.100/login/hbl-secure-update.php"
    pred = url_classifier.predict(malicious_url)
    assert pred["is_phishing"] is True
    assert pred["phishing_probability"] >= 0.70

# ==============================================================================
# 2. Phone Number Investigation & Isolation Tests
# ==============================================================================

def test_personal_clean_phone_number_returns_zero_findings():
    """A clean personal phone number with no breach or complaints must return 0 findings."""
    personal_number = "+92-332-9988776"
    results, coverage = discovery_manager.run_discovery_pipeline("phone", personal_number, {})
    assert len(results) == 0, f"Clean personal number must return 0 findings, got {len(results)}"
    vault_notes = [n for n in coverage["provider_notes"] if "Local CyberShield Case Vault" in n]
    assert any("0 results found in the sources checked" in n for n in vault_notes)

def test_synthetic_ten_numbers_demo_mode():
    """All 10 synthetic North American test numbers must resolve to their own synthetic reports."""
    seed_synthetic_fixtures()
    fixtures = list_synthetic_fixtures()
    assert len(fixtures) == 10

    for f in SYNTHETIC_TEST_FIXTURES:
        phone = f["phone_number"]
        results, cov = discovery_manager.run_discovery_pipeline("phone", phone, {})
        assert len(results) == 1, f"Expected 1 synthetic fixture for {phone}"
        assert results[0]["source_type"] == "development_fixture"
        assert results[0]["is_synthetic"] is True
        assert results[0]["is_verified"] is False
        assert f["fixture_id"] in results[0]["source_name"]

def test_number_isolation_no_cross_leakage():
    """Searching for number A must never return reports or findings for number B."""
    num_a = "+1 202-555-0101"
    num_b = "+1 202-555-0102"
    res_a, _ = discovery_manager.run_discovery_pipeline("phone", num_a, {})
    res_b, _ = discovery_manager.run_discovery_pipeline("phone", num_b, {})
    
    assert res_a[0]["fixture_id"] == "REP-SYNTH-01"
    assert res_b[0]["fixture_id"] == "REP-SYNTH-02"
    assert res_a[0]["fixture_id"] != res_b[0]["fixture_id"]

def test_spammer_number_returns_local_vault_complaints():
    """Searching a known spammer (03001234567) returns registered incident cases."""
    seed_sample_spam_cases()
    results, cov = discovery_manager.run_discovery_pipeline("phone", "03001234567", {})
    assert len(results) >= 8, f"Expected at least 8 spam complaints, got {len(results)}"
    assert all("CS-" in r["case_id"] for r in results)

# ==============================================================================
# 3. Feature 1: Multi-Source Threat Intelligence Tests
# ==============================================================================

def test_multi_threat_intel_clean_url():
    """Clean URLs return no confirmed matches across sources."""
    res = multi_threat_intel.verify_url("https://www.wikipedia.org")
    assert res["confirmed_threat_detected"] is False
    assert res["sources_queried_count"] == 3
    assert len(res["provider_breakdown"]) == 3

def test_multi_threat_intel_known_phish_seed():
    """Known benchmark phishing signature triggers PhishTank verified threat match."""
    phish_url = "http://secure-login.hbl-verify.top/auth/session"
    res = multi_threat_intel.verify_url(phish_url)
    assert res["confirmed_threat_detected"] is True
    assert res["primary_verdict"] == "Credential Phishing"

def test_urlhaus_malware_focus_distinction():
    """URLhaus provider primary focus must be Malware Distribution, not credential phishing."""
    prov = URLhausProvider()
    assert prov.primary_focus == "Malware Distribution"
    assert prov.provider_id == "urlhaus"

# ==============================================================================
# 4. Feature 2: Email Header Authentication Tests
# ==============================================================================

def test_email_authenticator_passing_headers():
    """Valid passing SPF, DKIM, and DMARC headers evaluate to AUTHENTICATED."""
    sample_headers = """From: Security Alerts <alerts@paypal.com>
To: user@example.com
Subject: Account Security Statement
Date: Mon, 20 Oct 2026 10:00:00 +0000
Authentication-Results: mx.google.com;
    spf=pass (google.com: domain of alerts@paypal.com designates 192.0.2.1 as permitted sender);
    dkim=pass header.i=@paypal.com;
    dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=paypal.com
Return-Path: <alerts@paypal.com>
"""
    rep = email_authenticator.analyze(sample_headers)
    assert rep["is_valid_header"] is True
    assert rep["overall_verdict"] == "AUTHENTICATED"
    assert rep["authentication_protocols"]["spf"]["status"] == "PASS"
    assert rep["authentication_protocols"]["dkim"]["status"] == "PASS"
    assert rep["authentication_protocols"]["dmarc"]["status"] == "PASS"
    assert len(rep["discrepancies_detected"]) == 0

def test_email_authenticator_spoofed_reply_to_mismatch():
    """Divergent Reply-To address on different domain flags SUSPECTED_SPOOFING."""
    spoofed_headers = """From: Habib Bank Limited <support@hbl.com>
Reply-To: phisher99@free-webmail.xyz
To: victim@example.com
Subject: URGENT: Verify Your Debit Card
Authentication-Results: mx.google.com;
    spf=fail (google.com: domain of support@hbl.com does not designate 198.51.100.25 as permitted sender);
    dmarc=fail (p=REJECT) header.from=hbl.com
Return-Path: <bounce@unrelated-server.net>
"""
    rep = email_authenticator.analyze(spoofed_headers)
    assert rep["overall_verdict"] == "SUSPECTED_SPOOFING"
    assert any(d["type"] == "REPLY_TO_MISMATCH" for d in rep["discrepancies_detected"])
    assert any(d["type"] == "DMARC_FAILURE" for d in rep["discrepancies_detected"])
    assert any(d["type"] == "SPF_HARD_FAIL" for d in rep["discrepancies_detected"])

def test_email_authenticator_malformed_input():
    """Empty or whitespace-only headers return an explicit validation error."""
    rep = email_authenticator.analyze("   ")
    assert rep["is_valid_header"] is False
    assert "error" in rep

# ==============================================================================
# 5. Feature 3: Scam Campaign Clustering Tests
# ==============================================================================

def test_scam_campaign_clustering_detects_repeat_senders():
    """Multiple cases sharing sender 03001234567 must be clustered into an active campaign."""
    seed_sample_spam_cases()
    campaigns = campaign_clustering_engine.detect_campaigns()
    assert len(campaigns) > 0
    # At least one campaign should center around 03001234567
    sender_camps = [c for c in campaigns if any("03001234567" in ind for ind in c["shared_indicators"])]
    assert len(sender_camps) >= 1
    camp = sender_camps[0]
    assert camp["incident_count"] >= 2
    assert "CMP-" in camp["cluster_id"]
    assert "disclaimer" in camp

# ==============================================================================
# 6. CRO KPI and Agent Tick Audit Assertions
# ==============================================================================

def test_cro_kpi_absence_assertion():
    """Formally verifies that CRO KPI does not exist in any backend module."""
    # Proof: searching all python modules for CRO KPI yields 0 occurrences
    app_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app")
    found = False
    for root, _, files in os.walk(app_dir):
        for f in files:
            if f.endswith(".py"):
                with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read()
                    if "cro kpi" in content.lower():
                        found = True
                        break
    assert found is False, "CRO KPI does not exist in any app/ code module"

def test_agent_orchestration_real_execution():
    """Verifies that the orchestrator executes real multi-agent steps and returns execution trace."""
    rep = orchestrator.run_investigation(
        input_type=InvestigationType.COMBINED,
        url="https://en.wikipedia.org",
        text="Hello, here is the syllabus for the semester exam."
    )
    assert len(rep.agent_execution_trace) >= 6
    step_names = [s.agent_name for s in rep.agent_execution_trace]
    assert any("Intake" in n for n in step_names)
    assert any("URL Intelligence" in n for n in step_names)
    assert any("Message Analysis" in n for n in step_names)
    assert any("Risk Assessment" in n for n in step_names)
    assert any("Report Generation" in n for n in step_names)
    assert rep.status == "COMPLETED"
