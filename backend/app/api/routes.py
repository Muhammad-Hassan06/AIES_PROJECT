import json
import os
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional

from app.models.schemas import (
    InvestigationCreateRequest, InvestigationReport,
    URLAnalysisResult, NLPAnalysisResult, ScreenshotAnalysisResult,
    RuleDefinition
)
from app.agents.orchestrator import orchestrator
from app.ml.url_classifier import url_classifier
from app.nlp.text_classifier import text_classifier
from app.vision.ocr_engine import ocr_engine
from app.rules.expert_system import expert_engine
from app.core.config import settings
from app.db.database import (
    save_investigation, get_investigation_by_id,
    list_recent_investigations, delete_investigation,
    get_dashboard_stats
)

router = APIRouter()

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data"))

@router.post("/investigations", response_model=InvestigationReport)
def create_investigation(req: InvestigationCreateRequest):
    """
    Submits an investigation to the 8-agent AI orchestrator.
    Executes real analysis across selected modalities, saves case, and returns structured report.
    """
    try:
        report = orchestrator.run_investigation(
            input_type=req.input_type,
            url=req.url,
            text=req.text,
            sender_info=req.sender_info,
            screenshot_base64=req.screenshot_base64,
            manual_indicators=req.manual_indicators
        )
        # Persist report in database
        save_investigation(report.case_id, report.model_dump())
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation workflow failed: {str(e)}")

@router.get("/investigations", response_model=List[Dict[str, Any]])
def list_investigations(limit: int = 50):
    """Returns recent investigations for case history."""
    return list_recent_investigations(limit=limit)

@router.get("/investigations/{case_id}", response_model=InvestigationReport)
def get_investigation(case_id: str):
    """Retrieves full case report by ID."""
    case = get_investigation_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return case

@router.delete("/investigations/{case_id}")
def remove_investigation(case_id: str):
    """Deletes investigation case and related records."""
    success = delete_investigation(case_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return {"status": "success", "message": f"Case {case_id} deleted."}

@router.post("/analyze/url")
def analyze_url_endpoint(payload: Dict[str, str]):
    """Direct standalone URL threat analysis."""
    url = payload.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="Missing 'url' parameter")
    return url_classifier.predict(url)

@router.post("/analyze/message")
def analyze_message_endpoint(payload: Dict[str, str]):
    """Direct standalone message and social engineering NLP analysis."""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text' parameter")
    return text_classifier.analyze(text)

@router.post("/analyze/screenshot")
def analyze_screenshot_endpoint(payload: Dict[str, str]):
    """Direct standalone screenshot OCR and computer vision analysis."""
    base64_str = payload.get("screenshot_base64", "")
    filename = payload.get("filename", "screenshot.png")
    if not base64_str:
        raise HTTPException(status_code=400, detail="Missing 'screenshot_base64' parameter")
    return ocr_engine.process_screenshot_base64(base64_str, filename=filename)

@router.get("/models/metrics")
def get_model_metrics():
    """Returns genuine evaluation metrics, confusion matrix, and feature importances for both ML and NLP models."""
    url_metrics_file = os.path.join(DATA_DIR, "url_metrics.json")
    nlp_metrics_file = os.path.join(DATA_DIR, "nlp_metrics.json")

    url_data = {}
    nlp_data = {}

    if os.path.exists(url_metrics_file):
        with open(url_metrics_file, "r") as f:
            url_data = json.load(f)

    if os.path.exists(nlp_metrics_file):
        with open(nlp_metrics_file, "r") as f:
            nlp_data = json.load(f)

    return {
        "url_model_intelligence": url_data,
        "nlp_model_intelligence": nlp_data
    }

@router.get("/rules", response_model=List[RuleDefinition])
def get_rules_catalog():
    """Returns the visual catalog of active IF-THEN expert rules."""
    return expert_engine.get_catalog()

@router.get("/stats")
def get_stats():
    """Returns dashboard overview metrics and telemetry."""
    return get_dashboard_stats()

@router.get("/health")
def health_check():
    """System health check and module operational status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ml_url_model_loaded": url_classifier.model is not None,
        "nlp_model_loaded": text_classifier.model is not None,
        "gemini_api_configured": bool(settings.GEMINI_API_KEY),
        "database_connected": True
    }
