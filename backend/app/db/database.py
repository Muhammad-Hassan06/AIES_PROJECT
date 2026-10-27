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
    conn.close()

def save_investigation(case_id: str, report_dict: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO investigations (
            case_id, timestamp, input_type, status, risk_level, model_confidence, evidence_strength, summary, full_report_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id,
        report_dict.get("timestamp", ""),
        report_dict.get("input_type", ""),
        report_dict.get("status", "COMPLETED"),
        report_dict.get("risk_level", "LOW"),
        report_dict.get("model_confidence", 0.0),
        report_dict.get("evidence_strength", "MODERATE"),
        report_dict.get("executive_summary", "")[:500],
        json.dumps(report_dict)
    ))
    conn.commit()
    conn.close()

def get_investigation_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT full_report_json FROM investigations WHERE case_id = ?", (case_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row["full_report_json"])
    return None

def list_recent_investigations(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT case_id, timestamp, input_type, status, risk_level, model_confidence, evidence_strength, summary
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
