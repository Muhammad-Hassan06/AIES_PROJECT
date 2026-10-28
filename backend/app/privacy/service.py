import datetime
from typing import List, Dict, Any, Optional

from app.privacy.schemas import (
    PrivacyInvestigationRequest, PrivacyInvestigationResponse,
    PrivacyFinding, PrivacyRemediationTask, RemediationStatus,
    ProviderStatus, PrivacyOverviewMetrics
)
from app.privacy.orchestrator import privacy_orchestrator
from app.privacy.providers.llm_provider import llm_service
from app.privacy.providers.discovery import discovery_manager
from app.db.database import (
    save_privacy_investigation, get_privacy_investigation,
    list_privacy_investigations, delete_privacy_investigation,
    get_privacy_findings, update_privacy_finding_status,
    list_privacy_remediation_tasks, get_privacy_remediation_task,
    update_privacy_remediation_task, get_privacy_overview_metrics
)

class DigitalPrivacyService:
    def __init__(self):
        pass

    def create_investigation(self, req: PrivacyInvestigationRequest) -> PrivacyInvestigationResponse:
        # Run 8-agent orchestrated investigation
        response = privacy_orchestrator.run_investigation(req)

        # Persist results in case vault if executed successfully
        if response.execution_status in ("COMPLETED", "PARTIAL"):
            save_privacy_investigation(response.model_dump())

        return response

    def get_investigation(self, investigation_id: str) -> Optional[Dict[str, Any]]:
        return get_privacy_investigation(investigation_id)

    def list_investigations(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list_privacy_investigations(limit=limit)

    def delete_investigation(self, investigation_id: str) -> bool:
        return delete_privacy_investigation(investigation_id)

    def get_findings_for_investigation(self, investigation_id: str) -> List[Dict[str, Any]]:
        return get_privacy_findings(investigation_id)

    def reanalyze_investigation(self, investigation_id: str) -> Optional[PrivacyInvestigationResponse]:
        saved = get_privacy_investigation(investigation_id)
        if not saved:
            return None

        # Re-run pipeline using saved metadata
        inv_type = saved.get("investigation_type", "combined")
        # Build request from saved safe metadata
        req = PrivacyInvestigationRequest(
            investigation_type=inv_type,
            user_consent_confirmed=True,
            authorized_for_identifiers=True
        )
        return self.create_investigation(req)

    def list_remediation_tasks(self, investigation_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return list_privacy_remediation_tasks(investigation_id)

    def prepare_remediation_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        task = get_privacy_remediation_task(task_id)
        if not task:
            return None

        # Transition status to REQUEST_DRAFTED
        update_privacy_remediation_task(task_id, RemediationStatus.REQUEST_DRAFTED.value)
        return get_privacy_remediation_task(task_id)

    def execute_remediation_task(
        self,
        task_id: str,
        action: str,  # submit, verify, reject
        evidence_note: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        task = get_privacy_remediation_task(task_id)
        if not task:
            return None

        new_status = RemediationStatus.REQUEST_SUBMITTED.value
        if action == "verify":
            new_status = RemediationStatus.REMOVAL_VERIFIED.value
        elif action == "reject":
            new_status = RemediationStatus.REJECTED.value
        elif action == "manual_instructions":
            new_status = RemediationStatus.AWAITING_USER_ACTION.value

        update_privacy_remediation_task(task_id, new_status, evidence_note)
        # Also update linked finding status if present
        f_id = task.get("finding_id")
        if f_id:
            update_privacy_finding_status(f_id, new_status)

        return get_privacy_remediation_task(task_id)

    def get_providers_status(self) -> List[Dict[str, Any]]:
        llm_statuses = llm_service.get_providers_status()
        disc_statuses = discovery_manager.get_providers_status()
        return llm_statuses + disc_statuses

    def get_overview_metrics(self) -> Dict[str, Any]:
        return get_privacy_overview_metrics()

privacy_service = DigitalPrivacyService()
