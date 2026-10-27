import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data/cybershield.db"))

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
