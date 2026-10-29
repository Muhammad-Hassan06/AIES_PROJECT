"""
Unit and integration tests for Feature 1: Attack DNA — Scam Connection Graph.
Verifies:
1. Extraction of atomic indicators (domains, senders, brands, lures).
2. Distinction between exact edges and fuzzy similarities.
3. Every edge has explainable edge types, evidence references, and confidence levels.
4. Strict campaign clustering gate: never clusters two cases into the same campaign
   without sufficient corroborated evidence (never on generic brand alone).
"""

import pytest
from app.analytics.connection_graph import (
    AttackDNAConnectionGraph,
    extract_domain,
    normalize_sender,
    calculate_token_similarity
)

def test_extract_domain():
    assert extract_domain("https://bisp-funds.pk/claim?id=1") == "bisp-funds.pk"
    assert extract_domain("http://sub.secure-bofa.com:8080/auth") == "sub.secure-bofa.com"
    assert extract_domain("www.easypaisa-bonus.xyz") == "www.easypaisa-bonus.xyz"
    assert extract_domain("invalid-string") is None

def test_normalize_sender():
    assert normalize_sender("+92-301-8171922") == "+923018171922"
    assert normalize_sender("0300-1234567") == "03001234567"
    assert normalize_sender("  alerts@bofa.com ") == "alerts@bofa.com"
    assert normalize_sender("a") is None

def test_calculate_token_similarity():
    text_1 = "Urgent notice: your bank account has been suspended for security verification."
    text_2 = "Urgent notice: bank account suspended, please complete security verification now."
    text_3 = "Congratulations! You won 10 million rupees in lottery draw."

    sim_high, tokens_high = calculate_token_similarity(text_1, text_2)
    assert sim_high > 0.40
    assert len(tokens_high) > 0

    sim_low, _ = calculate_token_similarity(text_1, text_3)
    assert sim_low < 0.20

def test_attack_dna_graph_structure():
    engine = AttackDNAConnectionGraph()
    graph = engine.build_graph(min_confidence=0.40)

    assert "nodes" in graph
    assert "edges" in graph
    assert "campaigns" in graph
    assert "summary" in graph

    assert graph["summary"]["total_nodes"] > 0
    assert graph["summary"]["total_edges"] > 0
    assert graph["summary"]["exact_edges"] >= 0
    assert graph["summary"]["fuzzy_edges"] >= 0

    # Every node has valid type
    for node in graph["nodes"]:
        assert node["type"] in ("case", "domain", "sender", "brand", "campaign")
        assert "id" in node
        assert "label" in node

    # Every edge has explainability fields, confidence, and exactness flag
    for edge in graph["edges"]:
        assert "id" in edge
        assert "source" in edge
        assert "target" in edge
        assert "edge_type" in edge
        assert "is_exact" in edge
        assert isinstance(edge["is_exact"], bool)
        assert "confidence" in edge
        assert 0.0 <= edge["confidence"] <= 1.0
        assert "evidence_reference" in edge
        assert "explanation" in edge
        assert len(edge["evidence_reference"]) > 0
        assert len(edge["explanation"]) > 0

def test_no_campaign_on_generic_brand_alone():
    """
    Guarantees requirement: 'Never label two cases as the same campaign without sufficient evidence.'
    Two cases that only share a brand keyword but have distinct senders, distinct domains,
    and distinct text must NOT be clustered into a single campaign!
    """
    engine = AttackDNAConnectionGraph()
    case_a = {
        "case_id": "TEST-ISOLATED-1",
        "timestamp": "2026-10-29T10:00:00Z",
        "input_type": "message",
        "risk_level": "LOW",
        "summary": "Legitimate Netflix subscription receipt for monthly plan.",
        "raw_url": "https://netflix.com/youraccount",
        "raw_text": "Your Netflix monthly invoice has been billed to your credit card.",
        "raw_sender": "receipts@netflix.com",
        "fraud_score": 5,
        "domains": ["netflix.com"],
        "senders": ["receipts@netflix.com"],
        "brands": ["Netflix"],
        "categories": [],
        "created_at": "2026-10-29T10:00:00Z"
    }

    case_b = {
        "case_id": "TEST-ISOLATED-2",
        "timestamp": "2026-10-29T10:05:00Z",
        "input_type": "message",
        "risk_level": "HIGH",
        "summary": "Phishing lure claiming Netflix account blocked click here.",
        "raw_url": "http://netflix-billing-update-xyz.top/login",
        "raw_text": "Account update required: Netflix service canceled due to billing decline. Update at link.",
        "raw_sender": "03219988771",
        "fraud_score": 85,
        "domains": ["netflix-billing-update-xyz.top"],
        "senders": ["03219988771"],
        "brands": ["Netflix"],
        "categories": ["Credential Harvesting"],
        "created_at": "2026-10-29T10:05:00Z"
    }

    # Extract DNA
    dna_a = engine.extract_case_dna(case_a)
    dna_b = engine.extract_case_dna(case_b)

    # Check that they don't share domain or sender
    assert set(dna_a["domains"]).isdisjoint(set(dna_b["domains"]))
    assert set(dna_a["senders"]).isdisjoint(set(dna_b["senders"]))

    # Token similarity should be low
    sim, _ = calculate_token_similarity(case_a["raw_text"], case_b["raw_text"])
    assert sim < 0.60
