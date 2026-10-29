import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from app.core.config import get_data_dir

DB_PATH = os.path.join(get_data_dir(), "cybershield.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigations (
            case_id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            input_type TEXT NOT NULL,
            status TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            model_confidence REAL,
            evidence_strength TEXT,
            summary TEXT,
            full_report_json TEXT,
            raw_url TEXT,
            raw_text TEXT,
            raw_sender TEXT,
            screenshot_name TEXT,
            model_versions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            action TEXT NOT NULL,
            risk_level TEXT,
            latency_ms REAL
        )
    """)

    # Digital Footprint & Privacy Remediation Module Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS privacy_investigations (
            investigation_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            investigation_type TEXT NOT NULL,
            target_masked TEXT NOT NULL,
            consent_given INTEGER NOT NULL,
            execution_status TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            risk_score REAL NOT NULL,
            full_response_json TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS privacy_findings (
            finding_id TEXT PRIMARY KEY,
            investigation_id TEXT NOT NULL,
            identifier_type TEXT NOT NULL,
            exposure_category TEXT NOT NULL,
            source_name TEXT NOT NULL,
            source_url TEXT,
            source_type TEXT NOT NULL,
            discovered_at TEXT NOT NULL,
            verification_status TEXT NOT NULL,
            confidence_score REAL NOT NULL,
            risk_level TEXT NOT NULL,
            recommended_action TEXT NOT NULL,
            removal_status TEXT NOT NULL,
            full_finding_json TEXT NOT NULL,
            FOREIGN KEY (investigation_id) REFERENCES privacy_investigations(investigation_id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS privacy_remediation_tasks (
            task_id TEXT PRIMARY KEY,
            investigation_id TEXT NOT NULL,
            finding_id TEXT,
            action_type TEXT NOT NULL,
            action_status TEXT NOT NULL,
            target_name TEXT NOT NULL,
            target_identifier_masked TEXT NOT NULL,
            official_portal_url TEXT,
            evidence_of_completion TEXT,
            created_at TEXT NOT NULL,
            last_updated_at TEXT NOT NULL,
            full_task_json TEXT NOT NULL,
            FOREIGN KEY (investigation_id) REFERENCES privacy_investigations(investigation_id) ON DELETE CASCADE
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS synthetic_test_fixtures (
            fixture_id TEXT PRIMARY KEY,
            phone_id TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            phone_digits TEXT NOT NULL,
            title TEXT NOT NULL,
            scenario TEXT NOT NULL,
            message_summary TEXT NOT NULL,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            is_synthetic INTEGER DEFAULT 1,
            source_type TEXT DEFAULT 'development_fixture',
            is_verified INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    # Feature 4: Scam Timeline & Evidence Dossier Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigation_dossiers (
            dossier_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            target_institution TEXT,
            status TEXT DEFAULT 'ACTIVE',
            tags TEXT DEFAULT '[]',
            case_ids_json TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dossier_timeline_events (
            event_id TEXT PRIMARY KEY,
            dossier_id TEXT NOT NULL,
            case_id TEXT,
            event_timestamp TEXT NOT NULL,
            timestamp_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            modality TEXT NOT NULL,
            evidence_reference TEXT,
            risk_level TEXT DEFAULT 'HIGH',
            ordering_rationale TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (dossier_id) REFERENCES investigation_dossiers(dossier_id) ON DELETE CASCADE
        )
    """)
    conn.commit()

    # Automatic safe migration for existing databases
    new_cols = [
        ("raw_url", "TEXT"),
        ("raw_text", "TEXT"),
        ("raw_sender", "TEXT"),
        ("screenshot_name", "TEXT"),
        ("model_versions", "TEXT")
    ]
    for col_name, col_type in new_cols:
        try:
            cursor.execute(f"ALTER TABLE investigations ADD COLUMN {col_name} {col_type}")
            conn.commit()
        except sqlite3.OperationalError:
            # Column already exists
            pass

    conn.close()

def save_investigation(case_id: str, report_dict: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()

    raw_input = report_dict.get("raw_input") or {}
    raw_url = raw_input.get("url") or (report_dict.get("url_result") or {}).get("url") or ""
    raw_text = raw_input.get("text") or (report_dict.get("nlp_result") or {}).get("analyzed_text") or ""
    raw_sender = raw_input.get("sender_info") or ""
    screenshot_name = raw_input.get("screenshot_name") or ""
    model_versions = json.dumps(report_dict.get("model_versions") or {})

    # Ensure raw_input is present in full_report_json
    report_dict["raw_input"] = {
        "url": raw_url,
        "text": raw_text,
        "sender_info": raw_sender,
        "screenshot_name": screenshot_name,
        "manual_indicators": raw_input.get("manual_indicators") or []
    }

    cursor.execute("""
        INSERT OR REPLACE INTO investigations (
            case_id, timestamp, input_type, status, risk_level, model_confidence, evidence_strength, summary,
            full_report_json, raw_url, raw_text, raw_sender, screenshot_name, model_versions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id,
        report_dict.get("timestamp", ""),
        report_dict.get("input_type", ""),
        report_dict.get("status", "COMPLETED"),
        report_dict.get("risk_level", "LOW"),
        report_dict.get("model_confidence", 0.0),
        report_dict.get("evidence_strength", "MODERATE"),
        report_dict.get("executive_summary", "")[:500],
        json.dumps(report_dict),
        raw_url,
        raw_text,
        raw_sender,
        screenshot_name,
        model_versions
    ))
    conn.commit()
    conn.close()

def get_investigation_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT full_report_json, raw_url, raw_text, raw_sender, screenshot_name, model_versions 
        FROM investigations WHERE case_id = ?
    """, (case_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None

    report = json.loads(row["full_report_json"])

    # Fallback reconstruction if raw_input was missing in older json records
    if not report.get("raw_input") or not any(report["raw_input"].values()):
        report["raw_input"] = {
            "url": row["raw_url"] or (report.get("url_result") or {}).get("url") or "",
            "text": row["raw_text"] or (report.get("nlp_result") or {}).get("analyzed_text") or "",
            "sender_info": row["raw_sender"] or "",
            "screenshot_name": row["screenshot_name"] or "",
            "manual_indicators": []
        }

    if not report.get("model_versions"):
        try:
            report["model_versions"] = json.loads(row["model_versions"]) if row["model_versions"] else {
                "url_classifier": "RandomForest-v1.0 (PhiUSIIL)",
                "nlp_classifier": "MultinomialNB-v1.0 (Pakistani Lures)",
                "expert_rules": "v1.2",
                "ocr_engine": "Tesseract OCR v5.0",
                "explainer": "Google Gemini 2.5 Flash / Fallback Synthesizer"
            }
        except Exception:
            report["model_versions"] = {}

    return report

def list_recent_investigations(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT case_id, timestamp, input_type, status, risk_level, model_confidence, evidence_strength, summary,
               raw_url, raw_text, created_at
        FROM investigations
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_investigation(case_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM investigations WHERE case_id = ?", (case_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM investigations")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as critical FROM investigations WHERE risk_level IN ('CRITICAL', 'HIGH')")
    critical = cursor.fetchone()["critical"]

    cursor.execute("SELECT risk_level, COUNT(*) as count FROM investigations GROUP BY risk_level")
    risk_dist = {row["risk_level"]: row["count"] for row in cursor.fetchall()}

    cursor.execute("SELECT input_type, COUNT(*) as count FROM investigations GROUP BY input_type")
    type_dist = {row["input_type"]: row["count"] for row in cursor.fetchall()}

    conn.close()
    return {
        "total_investigations": total,
        "critical_cases": critical,
        "risk_distribution": risk_dist,
        "type_distribution": type_dist
    }

def get_threat_trends(days: Optional[int] = None) -> Dict[str, Any]:
    """Computes threat trend metrics over saved cases in SQLite vault."""
    conn = get_db_connection()
    cursor = conn.cursor()

    time_filter = ""
    params = ()
    if days and days > 0:
        time_filter = "WHERE datetime(created_at) >= datetime('now', ?)"
        params = (f"-{days} days",)

    cursor.execute(f"SELECT COUNT(*) as total FROM investigations {time_filter}", params)
    total = cursor.fetchone()["total"]

    if total == 0:
        conn.close()
        return {
            "total_cases": 0,
            "timeline": [],
            "risk_breakdown": {},
            "modality_breakdown": {},
            "top_rules": [],
            "top_categories": [],
            "top_institutions": []
        }

    # Timeline by date
    cursor.execute(f"""
        SELECT date(created_at) as date, risk_level, COUNT(*) as count
        FROM investigations
        {time_filter}
        GROUP BY date(created_at), risk_level
        ORDER BY date(created_at) ASC
    """, params)
    timeline_rows = cursor.fetchall()
    
    timeline_map: Dict[str, Dict[str, int]] = {}
    for r in timeline_rows:
        d = r["date"] or "Unknown"
        if d not in timeline_map:
            timeline_map[d] = {"date": d, "CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INSUFFICIENT_EVIDENCE": 0, "total": 0}
        rl = r["risk_level"]
        cnt = r["count"]
        if rl in timeline_map[d]:
            timeline_map[d][rl] = cnt
        timeline_map[d]["total"] += cnt

    timeline = list(timeline_map.values())

    # Modality
    cursor.execute(f"""
        SELECT input_type, COUNT(*) as count 
        FROM investigations 
        {time_filter}
        GROUP BY input_type
    """, params)
    modality_breakdown = {r["input_type"]: r["count"] for r in cursor.fetchall()}

    # Risk
    cursor.execute(f"""
        SELECT risk_level, COUNT(*) as count 
        FROM investigations 
        {time_filter}
        GROUP BY risk_level
    """, params)
    risk_breakdown = {r["risk_level"]: r["count"] for r in cursor.fetchall()}

    # Detailed rule and category frequencies from full_report_json
    cursor.execute(f"SELECT full_report_json FROM investigations {time_filter}", params)
    rows = cursor.fetchall()
    conn.close()

    rule_counts: Dict[str, int] = {}
    category_counts: Dict[str, int] = {}
    institution_counts: Dict[str, int] = {}

    for row in rows:
        try:
            data = json.loads(row["full_report_json"])
            for rule in data.get("triggered_rules", []):
                r_name = rule.get("rule_name") or rule.get("rule_id", "Unknown Rule")
                rule_counts[r_name] = rule_counts.get(r_name, 0) + 1

            nlp = data.get("nlp_result") or {}
            for cat in nlp.get("categories_detected", []):
                category_counts[cat] = category_counts.get(cat, 0) + 1

            for inst in nlp.get("pakistan_context_detected", []):
                institution_counts[inst] = institution_counts.get(inst, 0) + 1
        except Exception:
            continue

    top_rules = [{"rule": k, "count": v} for k, v in sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
    top_categories = [{"category": k, "count": v} for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:8]]
    top_institutions = [{"institution": k, "count": v} for k, v in sorted(institution_counts.items(), key=lambda x: x[1], reverse=True)[:8]]

    return {
        "total_cases": total,
        "timeline": timeline,
        "risk_breakdown": risk_breakdown,
        "modality_breakdown": modality_breakdown,
        "top_rules": top_rules,
        "top_categories": top_categories,
        "top_institutions": top_institutions
    }


# ==============================================================================
# DIGITAL PRIVACY & SPAM DEFENSE DATABASE OPERATIONS
# ==============================================================================

def save_privacy_investigation(resp_dict: Dict[str, Any]) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()

    inv_id = resp_dict["investigation_id"]
    cursor.execute("""
        INSERT OR REPLACE INTO privacy_investigations (
            investigation_id, created_at, investigation_type, target_masked,
            consent_given, execution_status, risk_level, risk_score, full_response_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv_id,
        resp_dict["created_at"],
        resp_dict["investigation_type"],
        resp_dict["target_masked"],
        1 if resp_dict["consent_given"] else 0,
        resp_dict["execution_status"],
        resp_dict["risk_level"],
        resp_dict["risk_score"],
        json.dumps(resp_dict)
    ))

    # Save findings
    for f in resp_dict.get("findings", []):
        f_dict = f if isinstance(f, dict) else f.model_dump()
        cursor.execute("""
            INSERT OR REPLACE INTO privacy_findings (
                finding_id, investigation_id, identifier_type, exposure_category,
                source_name, source_url, source_type, discovered_at,
                verification_status, confidence_score, risk_level,
                recommended_action, removal_status, full_finding_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f_dict["finding_id"],
            inv_id,
            f_dict["identifier_type"],
            f_dict["exposure_category"],
            f_dict["source_name"],
            f_dict.get("source_url"),
            f_dict["source_type"],
            f_dict["discovered_at"],
            f_dict["verification_status"],
            f_dict["confidence_score"],
            f_dict["risk_level"],
            f_dict["recommended_action"],
            f_dict.get("removal_status", "NOT_STARTED"),
            json.dumps(f_dict)
        ))

    # Save remediation tasks
    for t in resp_dict.get("remediation_tasks", []):
        t_dict = t if isinstance(t, dict) else t.model_dump()
        cursor.execute("""
            INSERT OR REPLACE INTO privacy_remediation_tasks (
                task_id, investigation_id, finding_id, action_type,
                action_status, target_name, target_identifier_masked,
                official_portal_url, evidence_of_completion, created_at,
                last_updated_at, full_task_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t_dict["task_id"],
            inv_id,
            t_dict.get("finding_id"),
            t_dict["action_type"],
            t_dict["action_status"],
            t_dict["target_name"],
            t_dict["target_identifier_masked"],
            t_dict.get("official_portal_url"),
            t_dict.get("evidence_of_completion"),
            t_dict["created_at"],
            t_dict["last_updated_at"],
            json.dumps(t_dict)
        ))

    conn.commit()
    conn.close()
    return inv_id

def get_privacy_investigation(investigation_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_response_json FROM privacy_investigations WHERE investigation_id = ?", (investigation_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row["full_response_json"])
    return None

def list_privacy_investigations(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT investigation_id, created_at, investigation_type, target_masked,
               consent_given, execution_status, risk_level, risk_score, full_response_json
        FROM privacy_investigations
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        try:
            full = json.loads(r["full_response_json"])
            results.append(full)
        except Exception:
            results.append(dict(r))
    return results

def delete_privacy_investigation(investigation_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM privacy_remediation_tasks WHERE investigation_id = ?", (investigation_id,))
    cursor.execute("DELETE FROM privacy_findings WHERE investigation_id = ?", (investigation_id,))
    cursor.execute("DELETE FROM privacy_investigations WHERE investigation_id = ?", (investigation_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

def get_privacy_findings(investigation_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_finding_json FROM privacy_findings WHERE investigation_id = ?", (investigation_id,))
    rows = cursor.fetchall()
    conn.close()
    return [json.loads(r["full_finding_json"]) for r in rows]

def update_privacy_finding_status(finding_id: str, removal_status: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_finding_json FROM privacy_findings WHERE finding_id = ?", (finding_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False

    f_data = json.loads(row["full_finding_json"])
    f_data["removal_status"] = removal_status
    cursor.execute("""
        UPDATE privacy_findings
        SET removal_status = ?, full_finding_json = ?
        WHERE finding_id = ?
    """, (removal_status, json.dumps(f_data), finding_id))
    conn.commit()
    conn.close()
    return True

def list_privacy_remediation_tasks(investigation_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if investigation_id:
        cursor.execute("SELECT full_task_json FROM privacy_remediation_tasks WHERE investigation_id = ? ORDER BY created_at DESC", (investigation_id,))
    else:
        cursor.execute("SELECT full_task_json FROM privacy_remediation_tasks ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [json.loads(r["full_task_json"]) for r in rows]

def get_privacy_remediation_task(task_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_task_json FROM privacy_remediation_tasks WHERE task_id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row["full_task_json"])
    return None

def update_privacy_remediation_task(
    task_id: str,
    action_status: str,
    evidence_of_completion: Optional[str] = None
) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_task_json FROM privacy_remediation_tasks WHERE task_id = ?", (task_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False

    now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat() if "datetime" in globals() else ""
    if not now_utc:
        import datetime as dt
        now_utc = dt.datetime.now(dt.timezone.utc).isoformat()

    t_data = json.loads(row["full_task_json"])
    t_data["action_status"] = action_status
    t_data["last_updated_at"] = now_utc
    if evidence_of_completion:
        t_data["evidence_of_completion"] = evidence_of_completion

    cursor.execute("""
        UPDATE privacy_remediation_tasks
        SET action_status = ?, evidence_of_completion = ?, last_updated_at = ?, full_task_json = ?
        WHERE task_id = ?
    """, (action_status, evidence_of_completion, now_utc, json.dumps(t_data), task_id))
    conn.commit()
    conn.close()
    return True

def get_privacy_overview_metrics() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM privacy_investigations")
    total_inv = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM privacy_findings WHERE verification_status = 'VERIFIED'")
    verified_findings = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM privacy_findings WHERE verification_status != 'VERIFIED'")
    potential_matches = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM privacy_remediation_tasks WHERE action_status NOT IN ('REMOVAL_VERIFIED', 'COMPLETED')")
    open_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM privacy_remediation_tasks WHERE action_status IN ('REMOVAL_VERIFIED', 'COMPLETED', 'REQUEST_SUBMITTED')")
    completed_actions = cursor.fetchone()[0]

    cursor.execute("SELECT created_at FROM privacy_investigations ORDER BY created_at DESC LIMIT 1")
    latest_row = cursor.fetchone()
    latest_check = latest_row[0] if latest_row else None

    # Trend by date
    cursor.execute("""
        SELECT substr(created_at, 1, 10) as day, COUNT(*) as cnt
        FROM privacy_investigations
        GROUP BY day
        ORDER BY day ASC
        LIMIT 14
    """)
    trend_rows = cursor.fetchall()
    trends = [{"date": r["day"], "investigations": r["cnt"]} for r in trend_rows]

    conn.close()
    return {
        "total_investigations": total_inv,
        "verified_exposure_findings": verified_findings,
        "potential_matches": potential_matches,
        "open_remediation_tasks": open_tasks,
        "completed_remediation_actions": completed_actions,
        "latest_check_at": latest_check,
        "exposure_trends": trends
    }


# ==============================================================================
# Synthetic Test Fixtures Management (Part 7)
# ==============================================================================

def seed_synthetic_fixtures() -> int:
    """
    Idempotently seeds the 10 North American fictional test phone numbers and reports
    into synthetic_test_fixtures. Does NOT contaminate production investigations.
    """
    from app.privacy.fixtures import SYNTHETIC_TEST_FIXTURES
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    count = 0
    for f in SYNTHETIC_TEST_FIXTURES:
        cursor.execute("""
            INSERT OR REPLACE INTO synthetic_test_fixtures (
                fixture_id, phone_id, phone_number, phone_digits,
                title, scenario, message_summary, category, severity,
                is_synthetic, source_type, is_verified, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'development_fixture', 0, ?)
        """, (
            f["fixture_id"], f["phone_id"], f["phone_number"], f["phone_digits"],
            f["title"], f["scenario"], f["message_summary"], f["category"], f["severity"],
            f["created_at"]
        ))
        count += 1
    conn.commit()
    conn.close()
    return count

def reset_synthetic_fixtures() -> int:
    """Clears and re-seeds synthetic test fixtures."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM synthetic_test_fixtures")
    conn.commit()
    conn.close()
    return seed_synthetic_fixtures()

def list_synthetic_fixtures() -> List[Dict[str, Any]]:
    """Returns all 10 synthetic test fixtures."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM synthetic_test_fixtures ORDER BY fixture_id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def seed_sample_spam_cases() -> int:
    """
    Seeds 8 realistic, distinct fraud incident complaints against test spammer 03001234567
    into the local investigations case history.
    """
    cases = [
        ("CS-HBL-001", "HBL Urgent ATM Card Block OTP Phishing", "URGENT: Your HBL Bank debit card has been blocked. Send 6-digit OTP immediately to unlock.", "03001234567", "CRITICAL"),
        ("CS-BISP-002", "BISP 8171 Benazir Cash Grant Lure", "BISP Alert: You have been approved for Rs 25,000 cash grant. Call 03001234567 to verify CNIC and pay Rs 1,500 biometric fee.", "03001234567", "HIGH"),
        ("CS-JC-003", "JazzCash Wallet Biometric Suspension", "JazzCash Notice: Unusual login detected. Your wallet will be frozen within 2 hours. Call 03001234567 to confirm secret MPIN.", "03001234567", "CRITICAL"),
        ("CS-EP-004", "Easypaisa Lucky Draw Jeeto Pakistan", "Inam Mubarak! You have won Rs 100,000 in Jeeto Pakistan. Contact 03001234567 to claim prize after sending registration fee.", "03001234567", "HIGH"),
        ("CS-FBR-005", "FBR Tax Penalty & Police Raid Extortion", "FBR Warning: Outstanding tax default of Rs 42,000 against your CNIC. Contact officer at 03001234567 immediately to avoid arrest raid.", "03001234567", "CRITICAL"),
        ("CS-POST-006", "Pakistan Post Detained Parcel Customs Duty", "Pakistan Post Notice: Package detained at foreign customs. Pay Rs 850 clearance fee by calling customs dispatch at 03001234567.", "03001234567", "HIGH"),
        ("CS-FIA-007", "FIA Cyber Crime Arrest Warrant Summons", "LEGAL NOTICE: FIA Cyber Crime Wing has issued FIR warrant #8812 against your SIM. Settle FIR immediately by calling 03001234567.", "03001234567", "CRITICAL"),
        ("CS-MEEZ-008", "Meezan Bank NetBanking Re-KYC Prompt", "Dear Customer, your Meezan internet banking session expired. Update password and ATM PIN by contacting phone branch at 03001234567.", "03001234567", "CRITICAL"),
    ]
    conn = get_db_connection()
    cursor = conn.cursor()
    count = 0
    now_str = "2026-10-20T12:00:00Z"
    for cid, title, text, sender, r_level in cases:
        report_data = {
            "case_id": cid,
            "timestamp": now_str,
            "input_type": "sms",
            "status": "COMPLETED",
            "risk_level": r_level,
            "model_confidence": 0.95,
            "evidence_strength": "STRONG",
            "summary": f"{title}. Offending sender: {sender}. {text}",
            "raw_input": {"text": text, "sender_info": sender, "url": ""},
            "raw_text": text,
            "raw_sender": sender,
            "raw_url": ""
        }
        cursor.execute("""
            INSERT OR REPLACE INTO investigations (
                case_id, timestamp, input_type, status, risk_level,
                model_confidence, evidence_strength, summary,
                full_report_json, raw_url, raw_text, raw_sender
            ) VALUES (?, ?, 'sms', 'COMPLETED', ?, 0.95, 'STRONG', ?, ?, '', ?, ?)
        """, (cid, now_str, r_level, report_data["summary"], json.dumps(report_data), text, sender))
        count += 1
    conn.commit()
    conn.close()
    return count

