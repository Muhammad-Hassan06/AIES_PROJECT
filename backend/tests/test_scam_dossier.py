"""
Unit and integration tests for Feature 4: Scam Timeline & Evidence Dossier.
Verifies:
1. Dossier creation and persistence.
2. Chronological timeline generation with explicit distinction between
   EXACT_RECORDED timestamps and INFERRED_ORDERING.
3. Adding custom timeline events with modality and evidence references.
4. Exporting comprehensive evidence dossier with SHA-256 cryptographic integrity hash.
"""

import pytest
from app.analytics.dossier_service import ScamDossierService

def test_dossier_lifecycle_and_timeline():
    service = ScamDossierService()

    # 1. Create a dossier
    dossier = service.create_dossier(
        title="Operation Test-Phish: Banking Syndicate",
        description="Investigation into credential theft ring.",
        target_institution="HBL Bank",
        case_ids=["CS-8171-A", "CS-8171-B"],
        tags=["Phishing", "Banking", "Test"]
    )

    assert dossier is not None
    assert "dossier_id" in dossier
    dossier_id = dossier["dossier_id"]
    assert dossier["title"] == "Operation Test-Phish: Banking Syndicate"

    # 2. Check auto-generated timeline
    assert len(dossier["timeline"]) >= 2
    types_found = set(ev["timestamp_type"] for ev in dossier["timeline"])
    assert "EXACT_RECORDED" in types_found or "INFERRED_ORDERING" in types_found

    # 3. Add a manual event with explicit timestamp type
    evt = service.add_timeline_event(
        dossier_id=dossier_id,
        title="Unauthorized Fund Transfer Attempt",
        description="Victim observed attempted withdrawal of 50,000 PKR from mobile wallet.",
        event_timestamp="2026-10-25T12:00:00Z",
        timestamp_type="EXACT_RECORDED",
        modality="TRANSACTION",
        evidence_reference="Bank Alert SMS Ref: 987654",
        risk_level="CRITICAL",
        ordering_rationale="Transaction alert received 18 minutes after victim visited phishing URL."
    )

    assert "event_id" in evt

    # 4. Fetch updated dossier
    updated = service.get_dossier(dossier_id)
    assert updated["timeline_count"] >= 3
    assert any(e["title"] == "Unauthorized Fund Transfer Attempt" for e in updated["timeline"])

    # 5. Export comprehensive report
    export_rep = service.export_dossier_report(dossier_id)
    assert export_rep is not None
    assert "forensic_integrity_sha256" in export_rep
    assert len(export_rep["forensic_integrity_sha256"]) == 64  # Valid SHA-256 hex string
    assert "markdown_report" in export_rep
    assert "Chronological Investigation Timeline" in export_rep["markdown_report"]
    assert "EXACT RECORDED" in export_rep["markdown_report"]

    # 6. Cleanup
    deleted = service.delete_dossier(dossier_id)
    assert deleted is True
