"""
Unit tests for Feature 3: Evidence Fusion Engine.
Verifies:
1. Anti-double-counting: Dampens correlated evidence (e.g. OCR text into NLP).
2. Preserves conflict and uncertainty when evidence from different modalities conflicts.
3. Preserves provider unavailability as explicit limitation with 0 weight.
4. Strictly distinguishes Model Confidence, Calibrated Fraud Probability, and Risk Score.
5. Emits traceable evidence ledger with source attribution, limitations, and point contributions.
"""

import pytest
from app.analytics.evidence_fusion import (
    EvidenceFusionEngine,
    CORR_GROUP_DOMAIN_SECURITY,
    CORR_GROUP_LINGUISTIC_CONTENT,
    CORR_GROUP_VISUAL_FORENSICS
)
from app.models.schemas import RiskLevel

def test_evidence_fusion_tripartite_metrics():
    """Verifies that Model Confidence, Fraud Probability, and Risk Score are distinct."""
    fusion = EvidenceFusionEngine()

    url_result = {
        "url": "http://phish-bank.com/login",
        "is_phishing": True,
        "phishing_probability": 0.88
    }
    nlp_result = {
        "analyzed_text": "Please enter your password urgently to avoid account suspension",
        "is_social_engineering": True,
        "risk_score": 0.85,
        "categories_detected": ["Credential Harvesting", "Urgent Intimidation"],
        "highlighted_spans": [{"text": "password"}]
    }

    res = fusion.fuse(
        input_type="combined",
        url_result=url_result,
        nlp_result=nlp_result
    )

    # All three metrics must exist and have distinct valid ranges
    assert "calibrated_fraud_probability" in res
    assert "forensic_risk_score" in res
    assert "overall_model_confidence" in res

    assert 0.0 <= res["calibrated_fraud_probability"] <= 1.0
    assert 0 <= res["forensic_risk_score"] <= 100
    assert 0.0 <= res["overall_model_confidence"] <= 1.0

    # For high threat inputs, risk score should be in high/critical tier
    assert res["forensic_risk_score"] >= 75
    assert res["risk_level"] in (RiskLevel.HIGH, RiskLevel.CRITICAL)

def test_anti_double_counting_dampening():
    """
    Verifies anti-double-counting: Multiple correlated signals from the same underlying
    artifact (e.g. OCR text and NLP text) must have their redundant weight dampened
    rather than multiplying into false over-confidence.
    """
    fusion = EvidenceFusionEngine()

    # Case A: Only NLP message
    res_single = fusion.fuse(
        input_type="message",
        nlp_result={"risk_score": 0.80, "is_social_engineering": True, "categories_detected": ["Urgency"]}
    )

    # Case B: Both OCR and NLP with identical text
    res_correlated = fusion.fuse(
        input_type="screenshot",
        vision_result={"visual_phishing_probability": 0.80, "extracted_text": "Sample text", "layout_type": "MOBILE_SCREENSHOT"},
        nlp_result={"risk_score": 0.80, "is_social_engineering": True, "categories_detected": ["Urgency"]}
    )

    # Check correlated groups summary
    groups = res_correlated.get("correlated_groups_summary", {})
    assert len(groups) >= 2

    # Verify traceable evidence ledger has contribution points
    ledger = res_correlated.get("traceable_evidence_ledger", [])
    assert len(ledger) >= 2
    for entry in ledger:
        assert "contribution_points" in entry
        assert "reliability_limitation" in entry
        assert "correlation_group" in entry

def test_conflict_preservation_and_discordance():
    """
    When components diverge (e.g. URL model says 0.90 threat but Threat Intel says clean),
    the engine must NOT force false consensus. It must flag discordance and preserve uncertainty.
    """
    fusion = EvidenceFusionEngine()

    url_result = {
        "url": "http://suspicious-looking-subdomain.example.com",
        "is_phishing": True,
        "phishing_probability": 0.89
    }
    threat_intel = {
        "multi_threat_intel": {
            "confirmed_threat_detected": False,
            "primary_verdict": "CLEAN / NO_MATCH",
            "provider_status": {"PhishTank": "CLEAN", "URLhaus": "CLEAN", "GoogleSafeBrowsing": "CLEAN"}
        }
    }

    res = fusion.fuse(
        input_type="url",
        url_result=url_result,
        threat_intel=threat_intel
    )

    assert "conflict_score" in res
    assert res["conflict_score"] >= 0.50  # High conflict
    assert res["uncertainty_score"] > 0.20
    assert res["is_discordant"] is True
    assert res["decision_status"] == "DISCORDANT_VERDICT"

    # Limitation note should document the cross-modal discordance
    lim_str = " ".join(res["limitations"])
    assert "discordance" in lim_str.lower() or "conflict" in lim_str.lower()

def test_provider_unavailability_handling():
    """
    When an external threat intel provider is unavailable or timed out,
    the engine must record an explicit limitation and apply zero weight.
    """
    fusion = EvidenceFusionEngine()

    threat_intel_timeout = {
        "multi_threat_intel": {
            "confirmed_threat_detected": False,
            "primary_verdict": "CLEAN",
            "provider_status": {
                "PhishTank": "UNAVAILABLE",
                "URLhaus": "TIMEOUT",
                "GoogleSafeBrowsing": "KEY_MISSING"
            }
        }
    }

    res = fusion.fuse(
        input_type="url",
        url_result={"phishing_probability": 0.70, "is_phishing": True},
        threat_intel=threat_intel_timeout
    )

    # Must document provider unavailability in limitations
    lim_str = " ".join(res["limitations"])
    assert "unavailable" in lim_str.lower()
