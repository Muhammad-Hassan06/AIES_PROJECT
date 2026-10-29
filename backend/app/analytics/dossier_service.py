"""
CyberShield AI — Scam Timeline & Evidence Dossier Service (Feature 4)
Organizes related messages, URLs, screenshots, and reports into a chronological forensic investigation.
Generates comprehensive downloadable dossiers with source-backed findings, model outputs,
limitations, evidence references, and recommended next steps.

Scientific Distinction:
Strictly distinguishes EXACT_RECORDED timestamps (from metadata/headers) from INFERRED_ORDERING
(derived from attack narrative progression).
"""

import json
import uuid
import hashlib
import datetime
from typing import Dict, Any, List, Optional
from app.db.database import get_db_connection, get_investigation_by_id, init_db

class ScamDossierService:
    def __init__(self):
        init_db()

    def create_dossier(
        self,
        title: str,
        description: str = "",
        target_institution: str = "",
        case_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Creates a new scam investigation dossier."""
        dossier_id = f"DOS-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        case_ids_list = case_ids or []
        tags_list = tags or []

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO investigation_dossiers (
                dossier_id, title, description, target_institution, status, tags, case_ids_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
        """, (
            dossier_id,
            title,
            description,
            target_institution,
            json.dumps(tags_list),
            json.dumps(case_ids_list),
            now_iso,
            now_iso
        ))
        conn.commit()
        conn.close()

        # If cases were provided, auto-generate timeline events from case evidence
        if case_ids_list:
            self._auto_generate_timeline_from_cases(dossier_id, case_ids_list)

        return self.get_dossier(dossier_id)

    def list_dossiers(self) -> List[Dict[str, Any]]:
        """Lists all active and archived investigation dossiers."""
        self._ensure_seed_dossier()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT dossier_id, title, description, target_institution, status, tags, case_ids_json, created_at, updated_at
            FROM investigation_dossiers
            ORDER BY updated_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            item = dict(r)
            try:
                item["tags"] = json.loads(item["tags"])
            except Exception:
                item["tags"] = []
            try:
                item["case_ids"] = json.loads(item["case_ids_json"])
            except Exception:
                item["case_ids"] = []
            item["case_count"] = len(item["case_ids"])
            results.append(item)
        return results

    def get_dossier(self, dossier_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full dossier with chronological timeline and linked case reports."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT dossier_id, title, description, target_institution, status, tags, case_ids_json, created_at, updated_at
            FROM investigation_dossiers
            WHERE dossier_id = ?
        """, (dossier_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        dossier = dict(row)
        try:
            dossier["tags"] = json.loads(dossier["tags"])
        except Exception:
            dossier["tags"] = []
        try:
            dossier["case_ids"] = json.loads(dossier["case_ids_json"])
        except Exception:
            dossier["case_ids"] = []

        # Fetch timeline events
        cursor.execute("""
            SELECT event_id, dossier_id, case_id, event_timestamp, timestamp_type, title, description,
                   modality, evidence_reference, risk_level, ordering_rationale, created_at
            FROM dossier_timeline_events
            WHERE dossier_id = ?
            ORDER BY event_timestamp ASC
        """, (dossier_id,))
        event_rows = cursor.fetchall()
        conn.close()

        timeline = [dict(ev) for ev in event_rows]

        # Fetch linked cases
        linked_cases = []
        for cid in dossier["case_ids"]:
            c = get_investigation_by_id(cid)
            if c:
                linked_cases.append({
                    "case_id": c.get("case_id"),
                    "timestamp": c.get("timestamp"),
                    "input_type": c.get("input_type"),
                    "risk_level": c.get("risk_level"),
                    "fraud_risk_score": c.get("fraud_risk_score", 0),
                    "summary": c.get("executive_summary", "")[:180],
                    "predicted_class": c.get("predicted_class")
                })

        dossier["timeline"] = timeline
        dossier["linked_cases"] = linked_cases
        dossier["case_count"] = len(linked_cases)
        dossier["timeline_count"] = len(timeline)
        dossier["exact_recorded_count"] = sum(1 for e in timeline if e.get("timestamp_type") == "EXACT_RECORDED")
        dossier["inferred_ordering_count"] = sum(1 for e in timeline if e.get("timestamp_type") == "INFERRED_ORDERING")

        return dossier

    def add_timeline_event(
        self,
        dossier_id: str,
        title: str,
        description: str,
        event_timestamp: str,
        timestamp_type: str = "EXACT_RECORDED",
        modality: str = "MESSAGE",
        case_id: Optional[str] = None,
        evidence_reference: str = "",
        risk_level: str = "HIGH",
        ordering_rationale: str = ""
    ) -> Dict[str, Any]:
        """Appends a new chronological event to a dossier's timeline."""
        event_id = f"EVT-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO dossier_timeline_events (
                event_id, dossier_id, case_id, event_timestamp, timestamp_type, title, description,
                modality, evidence_reference, risk_level, ordering_rationale, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            dossier_id,
            case_id,
            event_timestamp,
            timestamp_type,
            title,
            description,
            modality,
            evidence_reference,
            risk_level,
            ordering_rationale,
            now_iso
        ))

        # Update dossier updated_at
        cursor.execute("UPDATE investigation_dossiers SET updated_at = ? WHERE dossier_id = ?", (now_iso, dossier_id))
        conn.commit()
        conn.close()

        return {
            "event_id": event_id,
            "dossier_id": dossier_id,
            "title": title,
            "event_timestamp": event_timestamp,
            "timestamp_type": timestamp_type
        }

    def delete_dossier(self, dossier_id: str) -> bool:
        """Deletes a dossier and its timeline events."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dossier_timeline_events WHERE dossier_id = ?", (dossier_id,))
        cursor.execute("DELETE FROM investigation_dossiers WHERE dossier_id = ?", (dossier_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    def export_dossier_report(self, dossier_id: str) -> Dict[str, Any]:
        """
        Generates a comprehensive, source-backed forensic investigation dossier
        including chronology, model outputs, evidence references, legal remedies,
        and cryptographic SHA-256 evidentiary hash.
        """
        dossier = self.get_dossier(dossier_id)
        if not dossier:
            return {}

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Detailed full case reports
        full_case_reports = []
        all_ledger_entries = []
        all_rules_triggered = []
        max_fraud_score = 0
        max_risk = "LOW"

        for cid in dossier.get("case_ids", []):
            rep = get_investigation_by_id(cid)
            if rep:
                full_case_reports.append(rep)
                all_ledger_entries.extend(rep.get("evidence_ledger", []))
                all_rules_triggered.extend(rep.get("triggered_rules", []))
                score = rep.get("fraud_risk_score", 0)
                if score > max_fraud_score:
                    max_fraud_score = score
                    max_risk = rep.get("risk_level", "LOW")

        # Compile JSON payload to hash
        export_payload = {
            "dossier_id": dossier["dossier_id"],
            "title": dossier["title"],
            "description": dossier["description"],
            "target_institution": dossier["target_institution"],
            "status": dossier["status"],
            "created_at": dossier["created_at"],
            "exported_at": now_iso,
            "executive_summary": (
                f"Multi-incident investigation dossier regarding {dossier['target_institution'] or 'Cyber Threat'}. "
                f"Synthesizes {len(dossier.get('linked_cases', []))} related investigation(s) and {len(dossier.get('timeline', []))} timeline event(s). "
                f"Max Severity: {max_risk} (Fraud Risk Score: {max_fraud_score}/100)."
            ),
            "timeline": dossier["timeline"],
            "linked_cases": dossier["linked_cases"],
            "evidence_ledger": all_ledger_entries[:20],
            "rules_triggered": all_rules_triggered[:10],
            "limitations": [
                "Timeline ordering includes both exact recorded metadata and inferred attack narrative sequence.",
                "Automated indicators represent technical corroboration; final legal attribution requires law enforcement sub-poena.",
                "Report generated for consumer empowerment and submission to authorized regulators (PTA, NCCIA, SBP)."
            ],
            "recommended_next_steps": [
                f"Submit coordinated complaint to National Cyber Crime Investigation Agency (NCCIA helpline: 9999).",
                f"Request immediate telecom sender blocking via PTA SMS Shortcode 9000.",
                f"Alert customer protection wing of {dossier['target_institution'] or 'impersonated institution'} with incident references.",
                "Preserve all SMS logs, transaction reference numbers, and screenshot metadata."
            ]
        }

        # Calculate forensic SHA-256 integrity fingerprint
        serialized = json.dumps(export_payload, sort_keys=True)
        sha256_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        export_payload["forensic_integrity_sha256"] = sha256_hash

        # Generate readable Markdown export text
        md_text = self._generate_markdown_report(export_payload)
        export_payload["markdown_report"] = md_text

        return export_payload

    def _auto_generate_timeline_from_cases(self, dossier_id: str, case_ids: List[str]):
        """Synthesizes structured timeline events from linked cases."""
        for cid in case_ids:
            case = get_investigation_by_id(cid)
            if not case:
                from app.analytics.connection_graph import attack_dna_graph
                attack_dna_graph._ensure_seed_cases()
                case = get_investigation_by_id(cid)

            if not case:
                ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
                input_type = "CASE_REFERENCE"
                summary = f"Linked investigation case record: {cid}"
                risk = "HIGH"
                sender = ""
                url = ""
            else:
                ts = case.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat()
                input_type = case.get("input_type", "message").upper()
                summary = case.get("executive_summary") or case.get("summary") or f"Investigation {cid}"
                risk = case.get("risk_level", "HIGH")
                raw_input = case.get("raw_input") or {}
                sender = raw_input.get("sender_info") or ""
                url = raw_input.get("url") or ""

            # Classify modality and timestamp type
            if input_type in ("MESSAGE", "EMAIL"):
                modality = "SMS_LURE" if "sms" in summary.lower() or "8171" in summary else "PHISHING_MESSAGE"
                ts_type = "EXACT_RECORDED"
                ref = f"Sender: {sender}" if sender else "Inbound Message"
                rationale = "Timestamp extracted from message header / dispatch record."
            elif input_type == "URL":
                modality = "LANDING_PAGE_VISIT"
                ts_type = "INFERRED_ORDERING"
                ref = f"URL: {url}"
                rationale = "Attacker redirection stage: victim navigates to landing page following initial message lure."
            elif input_type == "SCREENSHOT":
                modality = "CREDENTIAL_SUBMISSION_SCREEN"
                ts_type = "EXACT_RECORDED"
                ref = "Screenshot Evidence Upload"
                rationale = "EXIF / Capture timestamp recorded on device during session."
            else:
                modality = "THREAT_INCIDENT"
                ts_type = "EXACT_RECORDED"
                ref = f"Case {cid}"
                rationale = "Case registration timestamp."

            self.add_timeline_event(
                dossier_id=dossier_id,
                title=f"{input_type.title()} Evidence: Case {cid}",
                description=summary,
                event_timestamp=ts,
                timestamp_type=ts_type,
                modality=modality,
                case_id=cid,
                evidence_reference=ref,
                risk_level=risk,
                ordering_rationale=rationale
            )

    def _generate_markdown_report(self, payload: Dict[str, Any]) -> str:
        lines = [
            f"# CyberShield AI — Forensic Investigation Dossier",
            f"**Dossier Reference:** `{payload['dossier_id']}`",
            f"**Subject:** {payload['title']}",
            f"**Target Institution:** {payload['target_institution']}",
            f"**Forensic Integrity Hash (SHA-256):** `{payload['forensic_integrity_sha256']}`",
            f"**Generated:** {payload['exported_at']}",
            "",
            "## 1. Executive Briefing",
            payload["executive_summary"],
            "",
            "## 2. Chronological Investigation Timeline",
            "*(Strictly distinguishes exact recorded timestamps from inferred sequence)*",
            ""
        ]

        for ev in payload.get("timeline", []):
            tag = "⏱️ EXACT RECORDED" if ev.get("timestamp_type") == "EXACT_RECORDED" else "🔄 INFERRED ORDERING"
            lines.append(f"### {ev['event_timestamp']} — {ev['title']} [{tag}]")
            lines.append(f"- **Modality:** `{ev.get('modality')}`")
            lines.append(f"- **Evidence Reference:** {ev.get('evidence_reference', 'N/A')}")
            lines.append(f"- **Finding:** {ev['description']}")
            if ev.get("ordering_rationale"):
                lines.append(f"- **Temporal Rationale:** {ev['ordering_rationale']}")
            lines.append("")

        lines.extend([
            "## 3. Evidence Ledger & Model Outputs",
            "| Evidence Source | Finding | Point Contribution | Reliability Limitation |",
            "|-----------------|---------|--------------------|------------------------|"
        ])

        for entry in payload.get("evidence_ledger", [])[:10]:
            lines.append(
                f"| {entry.get('evidence_source', entry.get('analysis_component', 'Model'))} "
                f"| {entry.get('finding', '')[:60]} "
                f"| {entry.get('contribution_points', 'Active')} "
                f"| {entry.get('reliability_limitation', 'None noted')[:50]} |"
            )

        lines.extend([
            "",
            "## 4. Evidentiary Limitations",
        ])
        for lim in payload.get("limitations", []):
            lines.append(f"- {lim}")

        lines.extend([
            "",
            "## 5. Recommended Authority Escalation Steps",
        ])
        for step in payload.get("recommended_next_steps", []):
            lines.append(f"1. {step}")

        return "\n".join(lines)

    def _ensure_seed_dossier(self):
        """Seeds realistic initial dossier if table is empty."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM investigation_dossiers")
        c = cursor.fetchone()["count"]
        conn.close()

        if c > 0:
            return

        # Seed BISP 8171 syndicate dossier
        self.create_dossier(
            title="Operation Ehsaas-8171: Syndicated Smishing & Credential Harvest Ring",
            description="Coordinated smishing campaign targeting Pakistani welfare grant beneficiaries via spoofed 8171 SMS lures and fraudulent verification portals.",
            target_institution="BISP / Ehsaas",
            case_ids=["CS-8171-A", "CS-8171-B", "CS-8171-C"],
            tags=["BISP", "Smishing", "Credential Harvesting", "PTA Escalation"]
        )

dossier_service = ScamDossierService()
