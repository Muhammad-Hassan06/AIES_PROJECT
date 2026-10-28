from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PrivacyInvestigationType(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    SPAM_SOURCE = "spam_source"
    COMBINED = "combined"

class ExposureCategory(str, Enum):
    BREACH_DATABASE = "BREACH_DATABASE"
    PUBLIC_DIRECTORY = "PUBLIC_DIRECTORY"
    PROMOTIONAL_SPAM = "PROMOTIONAL_SPAM"
    SUSPECTED_PHISHING = "SUSPECTED_PHISHING"
    DATA_BROKER = "DATA_BROKER"
    SEARCH_INDEX = "SEARCH_INDEX"
    UNVERIFIED_LEAK = "UNVERIFIED_LEAK"

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    POTENTIAL_MATCH = "POTENTIAL_MATCH"
    UNVERIFIED_INDEX = "UNVERIFIED_INDEX"
    SUSPECTED_ONLY = "SUSPECTED_ONLY"
    CONFLICTING = "CONFLICTING"

class PrivacyRiskLevel(str, Enum):
    CLEAN = "CLEAN"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RemediationActionType(str, Enum):
    UNSUBSCRIBE = "UNSUBSCRIBE"
    BLOCK_SENDER = "BLOCK_SENDER"
    REPORT_SPAM = "REPORT_SPAM"
    DATA_DELETION_REQUEST = "DATA_DELETION_REQUEST"
    SECURE_ACCOUNT = "SECURE_ACCOUNT"
    PTA_SPAM_BLOCK = "PTA_SPAM_BLOCK"
    REVIEW_PRIVACY = "REVIEW_PRIVACY"

class RemediationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    INSTRUCTIONS_AVAILABLE = "INSTRUCTIONS_AVAILABLE"
    REQUEST_DRAFTED = "REQUEST_DRAFTED"
    AWAITING_USER_ACTION = "AWAITING_USER_ACTION"
    REQUEST_SUBMITTED = "REQUEST_SUBMITTED"
    REMOVAL_VERIFIED = "REMOVAL_VERIFIED"
    REJECTED = "REJECTED"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"

class PrivacyFinding(BaseModel):
    finding_id: str
    investigation_id: str
    identifier_type: str  # email, phone, sender, domain
    exposure_category: ExposureCategory
    source_name: str
    source_url: Optional[str] = None
    source_type: str  # PUBLIC_WEB, BREACH_REPORTER, USER_EVIDENCE, SPAM_HEADER, CALL_LOG
    discovered_at: str
    evidence_reference: str
    evidence_excerpt_redacted: str
    verification_status: VerificationStatus
    confidence_score: float = Field(ge=0.0, le=1.0)
    confidence_explanation: str
    risk_level: PrivacyRiskLevel
    recommended_action: RemediationActionType
    last_checked_at: str
    removal_status: RemediationStatus = RemediationStatus.NOT_STARTED
    remediation_details: Optional[Dict[str, Any]] = None

class PrivacyRemediationTask(BaseModel):
    task_id: str
    investigation_id: str
    finding_id: Optional[str] = None
    action_type: RemediationActionType
    action_status: RemediationStatus = RemediationStatus.NOT_STARTED
    target_name: str
    target_identifier_masked: str
    instructions_text: str
    draft_payload: Optional[Dict[str, Any]] = None
    official_portal_url: Optional[str] = None
    evidence_of_completion: Optional[str] = None
    created_at: str
    last_updated_at: str
    follow_up_due_at: Optional[str] = None

class PrivacyInvestigationRequest(BaseModel):
    investigation_type: PrivacyInvestigationType
    email: Optional[str] = None
    phone: Optional[str] = None
    message_text: Optional[str] = None
    sender_email: Optional[str] = None
    sender_phone: Optional[str] = None
    email_headers: Optional[str] = None
    urls: Optional[List[str]] = None
    call_log_csv: Optional[str] = None
    screenshot_base64: Optional[str] = None
    user_description: Optional[str] = None
    user_consent_confirmed: bool = False
    authorized_for_identifiers: bool = False

class AgentExecutionStep(BaseModel):
    agent_id: str
    agent_name: str
    status: str  # PENDING, RUNNING, COMPLETED, PARTIAL, FAILED, SKIPPED
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    summary: str
    artifacts_generated: int = 0
    warnings: List[str] = []

class CoverageSummary(BaseModel):
    sources_checked: int = 0
    potential_matches: int = 0
    verified_findings: int = 0
    sources_unavailable: int = 0
    coverage_level: str = "Partial"  # Full, Partial, Local-Only, None
    provider_notes: List[str] = []

class PrivacyInvestigationResponse(BaseModel):
    investigation_id: str
    created_at: str
    investigation_type: PrivacyInvestigationType
    target_masked: str
    consent_given: bool
    execution_status: str
    risk_level: PrivacyRiskLevel
    risk_score: float = 0.0
    coverage_summary: CoverageSummary
    execution_trace: List[AgentExecutionStep] = []
    findings: List[PrivacyFinding] = []
    remediation_tasks: List[PrivacyRemediationTask] = []
    triggered_rules: List[Dict[str, Any]] = []
    llm_provider_used: Optional[str] = None
    is_deterministic_fallback: bool = False
    executive_summary: str
    limitations_disclosure: str

class ProviderStatus(BaseModel):
    provider_id: str
    provider_name: str
    provider_type: str  # LLM, DISCOVERY_SEARCH, EXPOSURE_CHECK
    is_configured: bool
    is_healthy: bool
    model_name: Optional[str] = None
    status_message: str
    supported_identifiers: List[str] = []
    rate_limit_info: Optional[str] = None

class PrivacyOverviewMetrics(BaseModel):
    total_investigations: int = 0
    verified_exposure_findings: int = 0
    potential_matches: int = 0
    open_remediation_tasks: int = 0
    completed_remediation_actions: int = 0
    latest_check_at: Optional[str] = None
    exposure_trends: List[Dict[str, Any]] = []
