from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class InvestigationType(str, Enum):
    URL = "url"
    MESSAGE = "message"
    EMAIL = "email"
    SCREENSHOT = "screenshot"
    COMBINED = "combined"

class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

class AgentStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"

class HighlightedSpan(BaseModel):
    start: int
    end: int
    text: str
    category: str
    explanation: str

class URLFeatures(BaseModel):
    url_length: int
    domain_length: int
    is_domain_ip: int
    subdomain_count: int
    digit_count: int
    digit_ratio: float
    special_char_count: int
    entropy: float
    is_https: int
    has_suspicious_tld: int
    suspicious_keyword_count: int
    has_at_symbol: int
    has_double_slash_redirect: int

class URLAnalysisResult(BaseModel):
    url: str
    is_phishing: bool
    phishing_probability: float
    model_name: str
    features: Dict[str, Any]
    top_signals: List[Dict[str, Any]]
    domain_info: Dict[str, Any] = Field(default_factory=dict)
    latency_ms: float

class NLPAnalysisResult(BaseModel):
    analyzed_text: str
    is_social_engineering: bool
    risk_score: float
    categories_detected: List[str]
    highlighted_spans: List[HighlightedSpan]
    pakistan_context_detected: List[str] = Field(default_factory=list)
    model_name: str
    latency_ms: float

class ScreenshotAnalysisResult(BaseModel):
    filename: Optional[str] = None
    extracted_text: str
    extracted_urls: List[str]
    detected_keywords: List[str]
    visual_indicators: List[str]
    ocr_engine: str
    ocr_warning: Optional[str] = None
    latency_ms: float
    layout_type: Optional[str] = "GENERIC_GRAPHIC"
    visual_phishing_probability: Optional[float] = 0.0
    is_legitimate_likelihood: Optional[float] = 1.0
    suspicious_regions: List[Dict[str, Any]] = Field(default_factory=list)
    visual_evidence_ledger: List[Dict[str, Any]] = Field(default_factory=list)
    forensics_summary: Optional[str] = ""

class TriggeredRule(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    severity: str
    conditions_evaluated: List[str]
    conditions_matched: List[str]
    evidence_references: List[str]
    resulting_action: str
    explanation: str

class AgentStepEvent(BaseModel):
    agent_id: str
    agent_name: str
    status: AgentStatus
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: float = 0.0
    summary: str = ""
    findings_count: int = 0
    error: Optional[str] = None

class EvidenceLedgerEntry(BaseModel):
    finding: str
    evidence_source: str
    observed_value: str
    analysis_component: str
    timestamp: str
    confidence: float
    supporting_rule: Optional[str] = None
    recommended_action: str
    contribution_points: Optional[str] = None
    correlation_group: Optional[str] = None
    reliability_limitation: Optional[str] = None

class OfficialResource(BaseModel):
    title: str
    category: str
    url: str
    description: str
    helpline: Optional[str] = None

class InvestigationReport(BaseModel):
    case_id: str
    timestamp: str
    input_type: str
    status: str
    risk_level: RiskLevel
    model_confidence: float
    evidence_strength: str
    executive_summary: str
    technical_report: str
    key_warnings: List[str]
    recommended_actions: List[str]
    limitations: List[str]
    official_resources: List[OfficialResource]
    evidence_ledger: List[EvidenceLedgerEntry]
    triggered_rules: List[TriggeredRule]
    agent_execution_trace: List[AgentStepEvent]
    url_result: Optional[URLAnalysisResult] = None
    nlp_result: Optional[NLPAnalysisResult] = None
    vision_result: Optional[ScreenshotAnalysisResult] = None
    fraud_risk_score: Optional[int] = 0
    predicted_class: str = "Likely Legitimate"
    score_interpretation: str = "Fraud Risk Score: 0/100"
    confidence_interpretation: str = "Model Confidence: 0% — not a calibrated probability"
    probability_calibrated: bool = True
    calibrated_fraud_probability: Optional[float] = 0.0
    conflict_score: Optional[float] = 0.0
    uncertainty_score: Optional[float] = 0.0
    is_discordant: Optional[bool] = False
    correlated_groups_summary: Optional[Dict[str, Any]] = None
    decision_status: str = "VERDICT_ISSUED"
    raw_input: Dict[str, Any] = Field(default_factory=dict)
    model_versions: Dict[str, str] = Field(default_factory=dict)

class InvestigationCreateRequest(BaseModel):
    input_type: InvestigationType
    url: Optional[str] = None
    text: Optional[str] = None
    sender_info: Optional[str] = None
    screenshot_base64: Optional[str] = None
    manual_indicators: List[str] = Field(default_factory=list)

class ModelMetricsResponse(BaseModel):
    dataset_name: str
    source_url: str
    total_records: int
    train_count: int
    test_count: int
    baseline_model: Dict[str, Any]
    strong_model: Dict[str, Any]
    confusion_matrix: Dict[str, int]
    top_features: List[Dict[str, Any]]
    limitations: List[str]

class RuleDefinition(BaseModel):
    rule_id: str
    name: str
    category: str
    severity: str
    description: str
    conditions: List[str]
    action: str
