import time
import uuid
import datetime
from typing import List, Dict, Any, Tuple, Optional

from app.privacy.schemas import (
    PrivacyInvestigationRequest, PrivacyInvestigationResponse,
    PrivacyFinding, PrivacyRemediationTask, AgentExecutionStep,
    CoverageSummary, PrivacyRiskLevel, VerificationStatus,
    ExposureCategory, RemediationActionType, RemediationStatus,
    PrivacyInvestigationType
)
from app.privacy.normalizer import (
    normalize_email, normalize_phone, mask_email, mask_phone, compute_identifier_hmac
)
from app.privacy.providers.discovery import discovery_manager
from app.privacy.providers.llm_provider import llm_service
from app.privacy.expert_rules import df_expert_rules
from app.privacy.spam_intelligence import spam_intelligence_engine
from app.core.security import redact_sensitive_identifiers

class DigitalPrivacyOrchestrator:
    def __init__(self):
        pass

    def run_investigation(self, req: PrivacyInvestigationRequest) -> PrivacyInvestigationResponse:
        now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
        inv_id = f"DF-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        trace: List[AgentExecutionStep] = []
        findings: List[PrivacyFinding] = []
        tasks: List[PrivacyRemediationTask] = []
        triggered_rules: List[Dict[str, Any]] = []

        # ==============================================================================
        # AGENT 1: Consent and Intake Agent
        # ==============================================================================
        a1_start = time.time()
        if not req.user_consent_confirmed or not req.authorized_for_identifiers:
            step_a1 = AgentExecutionStep(
                agent_id="agent_1_consent_intake",
                agent_name="Agent 1: Consent & Intake Agent",
                status="FAILED",
                started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                summary="Investigation halted: User consent or authorization not confirmed.",
                warnings=["Explicit user authorization is legally required before initiating external exposure checks."]
            )
            trace.append(step_a1)
            return PrivacyInvestigationResponse(
                investigation_id=inv_id,
                created_at=now_utc,
                investigation_type=req.investigation_type,
                target_masked="[UNAUTHORIZED]",
                consent_given=False,
                execution_status="FAILED",
                risk_level=PrivacyRiskLevel.CLEAN,
                coverage_summary=CoverageSummary(sources_checked=0, potential_matches=0, verified_findings=0, sources_unavailable=0, coverage_level="None"),
                execution_trace=trace,
                findings=[],
                remediation_tasks=[],
                triggered_rules=[],
                executive_summary="Investigation refused: Explicit authorization required.",
                limitations_disclosure="No investigation performed due to missing user consent."
            )

        # Validate inputs according to investigation type
        norm_email, norm_phone = None, None
        email_meta, phone_meta = {}, {}
        target_masked = "Multi-Target Evidence"

        if req.investigation_type in (PrivacyInvestigationType.EMAIL, PrivacyInvestigationType.COMBINED) and req.email:
            v_ok, v_err, email_meta = normalize_email(req.email)
            if not v_ok:
                return self._abort_validation(inv_id, now_utc, req, trace, f"Email validation failed: {v_err}")
            norm_email = v_err
            target_masked = email_meta.get("masked", req.email)

        if req.investigation_type in (PrivacyInvestigationType.PHONE, PrivacyInvestigationType.COMBINED) and req.phone:
            p_ok, p_err, phone_meta = normalize_phone(req.phone)
            if not p_ok:
                return self._abort_validation(inv_id, now_utc, req, trace, f"Phone validation failed: {p_err}")
            norm_phone = p_err
            target_masked = phone_meta.get("masked", req.phone)

        if norm_email and norm_phone:
            target_masked = f"{email_meta.get('masked')} / {phone_meta.get('masked')}"

        if req.investigation_type == PrivacyInvestigationType.SPAM_SOURCE and not norm_email and not norm_phone:
            target_masked = "Spam Evidence Package"

        step_a1 = AgentExecutionStep(
            agent_id="agent_1_consent_intake",
            agent_name="Agent 1: Consent & Intake Agent",
            status="COMPLETED",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Consent verified. Normalized inputs: {target_masked}. Privacy tokens generated."
        )
        trace.append(step_a1)

        # ==============================================================================
        # AGENT 2: Discovery Planning Agent
        # ==============================================================================
        plan_providers = []
        if norm_email:
            plan_providers.append("Breach Database Check (HIBP/Adapter)")
            plan_providers.append("Public Web Search for Email Mentions")
        if norm_phone:
            plan_providers.append("Pakistani Telecom Prefix Analysis")
            plan_providers.append("Public Web Search for Phone Directory Mentions")
        if req.message_text or req.screenshot_base64 or req.call_log_csv or req.urls:
            plan_providers.append("Multi-Modal Spam Intelligence Pipeline")
        plan_providers.append("Local SQLite Case Vault Cross-Correlation")

        step_a2 = AgentExecutionStep(
            agent_id="agent_2_discovery_planning",
            agent_name="Agent 2: Discovery Planning Agent",
            status="COMPLETED",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Constructed multi-source execution plan across {len(plan_providers)} inspection channels."
        )
        trace.append(step_a2)

        # ==============================================================================
        # AGENT 3: Public Exposure Discovery Agent
        # ==============================================================================
        raw_discovery_hits = []
        coverage_summary_dict = {"sources_checked": 0, "sources_unavailable": 0, "coverage_level": "Partial", "provider_notes": []}

        if norm_email:
            hits, cov = discovery_manager.run_discovery_pipeline("email", norm_email, email_meta)
            raw_discovery_hits.extend(hits)
            coverage_summary_dict["sources_checked"] += cov["sources_checked"]
            coverage_summary_dict["sources_unavailable"] += cov["sources_unavailable"]
            coverage_summary_dict["provider_notes"].extend(cov["provider_notes"])

        if norm_phone:
            hits, cov = discovery_manager.run_discovery_pipeline("phone", norm_phone, phone_meta)
            raw_discovery_hits.extend(hits)
            coverage_summary_dict["sources_checked"] += cov["sources_checked"]
            coverage_summary_dict["sources_unavailable"] += cov["sources_unavailable"]
            coverage_summary_dict["provider_notes"].extend(cov["provider_notes"])

        step_a3 = AgentExecutionStep(
            agent_id="agent_3_public_exposure",
            agent_name="Agent 3: Public Exposure Discovery Agent",
            status="COMPLETED" if coverage_summary_dict["sources_checked"] > 0 else "PARTIAL",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Polled discovery adapters. Retrieved {len(raw_discovery_hits)} candidate exposure records. ({coverage_summary_dict['sources_checked']} sources active, {coverage_summary_dict['sources_unavailable']} unconfigured/skipped)."
        )
        trace.append(step_a3)

        # ==============================================================================
        # AGENT 4: Spam Intelligence Agent
        # ==============================================================================
        spam_result = {}
        if req.investigation_type in (PrivacyInvestigationType.SPAM_SOURCE, PrivacyInvestigationType.COMBINED) or req.message_text or req.call_log_csv or req.screenshot_base64:
            spam_result = spam_intelligence_engine.analyze_spam_source(
                message_text=req.message_text,
                sender_email=req.sender_email,
                sender_phone=req.sender_phone,
                email_headers=req.email_headers,
                urls=req.urls,
                call_log_csv=req.call_log_csv,
                screenshot_base64=req.screenshot_base64,
                user_description=req.user_description
            )
            step_a4 = AgentExecutionStep(
                agent_id="agent_4_spam_intelligence",
                agent_name="Agent 4: Spam Intelligence Agent",
                status="COMPLETED",
                started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                summary=f"Spam intelligence completed: Classified as {spam_result['verdict']}. Found {len(spam_result.get('impersonated_organizations', []))} org impersonations and {len(spam_result.get('url_findings', []))} URLs."
            )
        else:
            step_a4 = AgentExecutionStep(
                agent_id="agent_4_spam_intelligence",
                agent_name="Agent 4: Spam Intelligence Agent",
                status="SKIPPED",
                started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                summary="No spam message text, headers, or screenshots submitted in current scope. Step skipped."
            )
        trace.append(step_a4)

        # ==============================================================================
        # AGENT 5: Evidence Verification Agent
        # ==============================================================================
        verified_findings: List[PrivacyFinding] = []
        dedup_set = set()
        dedup_count = 0

        # Process raw discovery hits
        for idx, hit in enumerate(raw_discovery_hits):
            s_name = hit.get("source_name", "Public Source")
            if s_name in dedup_set:
                dedup_count += 1
                continue
            dedup_set.add(s_name)

            s_type = hit.get("source_type", "PUBLIC_WEB")
            cat = hit.get("category", ExposureCategory.PUBLIC_DIRECTORY)

            # Distinguish verification status:
            # Breach reporter with confirmed dump -> VERIFIED
            # Search snippet without independent verification -> UNVERIFIED_INDEX
            # Local vault reference -> VERIFIED
            if s_type == "BREACH_REPORTER":
                v_status = VerificationStatus.VERIFIED
                conf = 0.92
                conf_exp = "Independently verified against cataloged public breach release records."
                r_level = PrivacyRiskLevel.HIGH
                rec_act = RemediationActionType.SECURE_ACCOUNT
            elif s_type == "LOCAL_VAULT":
                v_status = VerificationStatus.VERIFIED
                conf = 0.98
                conf_exp = "Direct cryptographic match within local CyberShield case history vault."
                r_level = PrivacyRiskLevel.MEDIUM
                rec_act = RemediationActionType.REVIEW_PRIVACY
            else:
                v_status = VerificationStatus.UNVERIFIED_INDEX
                conf = 0.45
                conf_exp = "Search engine keyword index proximity. Does not establish confirmed account creation."
                r_level = PrivacyRiskLevel.LOW
                rec_act = RemediationActionType.REVIEW_PRIVACY

            f_id = f"FND-{uuid.uuid4().hex[:6].upper()}"
            verified_findings.append(PrivacyFinding(
                finding_id=f_id,
                investigation_id=inv_id,
                identifier_type="email" if norm_email else "phone",
                exposure_category=cat,
                source_name=s_name,
                source_url=hit.get("source_url"),
                source_type=s_type,
                discovered_at=now_utc,
                evidence_reference=f"Adapter hit #{idx+1}",
                evidence_excerpt_redacted=redact_sensitive_identifiers(hit.get("snippet", "")),
                verification_status=v_status,
                confidence_score=conf,
                confidence_explanation=conf_exp,
                risk_level=r_level,
                recommended_action=rec_act,
                last_checked_at=now_utc,
                removal_status=RemediationStatus.NOT_STARTED,
                remediation_details={
                    "removal_procedure": "Review domain contact or privacy page to request indexing removal.",
                    "official_privacy_url": hit.get("source_url")
                }
            ))

        # Add spam intelligence finding if spam evidence was provided
        if spam_result:
            s_verdict = spam_result["verdict"]
            f_id_spam = f"FND-SPAM-{uuid.uuid4().hex[:5].upper()}"
            spam_cat = ExposureCategory.SUSPECTED_PHISHING if spam_result.get("is_phishing") else (
                ExposureCategory.PROMOTIONAL_SPAM if spam_result.get("is_promotional") else ExposureCategory.PUBLIC_DIRECTORY
            )
            verified_findings.append(PrivacyFinding(
                finding_id=f_id_spam,
                investigation_id=inv_id,
                identifier_type="sender",
                exposure_category=spam_cat,
                source_name="Submitted Communication Evidence",
                source_url=spam_result.get("url_findings", [{}])[0].get("url") if spam_result.get("url_findings") else None,
                source_type="USER_EVIDENCE",
                discovered_at=now_utc,
                evidence_reference="Direct User Submission & OCR",
                evidence_excerpt_redacted=spam_result.get("analyzed_text_redacted", "")[:250],
                verification_status=VerificationStatus.VERIFIED,
                confidence_score=0.90 if spam_result.get("is_phishing") else 0.80,
                confidence_explanation="Grounded directly in user-submitted headers, OCR text, and NLP forensic features.",
                risk_level=spam_result.get("risk_level", PrivacyRiskLevel.LOW),
                recommended_action=spam_result.get("recommended_action", RemediationActionType.REVIEW_PRIVACY),
                last_checked_at=now_utc,
                removal_status=RemediationStatus.NOT_STARTED
            ))

        step_a5 = AgentExecutionStep(
            agent_id="agent_5_evidence_verification",
            agent_name="Agent 5: Evidence Verification Agent",
            status="COMPLETED",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Verified and deduplicated {len(verified_findings)} structured findings. Deduplicated {dedup_count} overlapping nodes."
        )
        trace.append(step_a5)

        # ==============================================================================
        # AGENT 6: Privacy Risk Assessment Agent
        # ==============================================================================
        context_for_rules = {
            "findings": verified_findings,
            "spam_analysis": spam_result,
            "coverage_summary": coverage_summary_dict,
            "dedup_count": dedup_count,
            "evidence_conflicts": spam_result.get("conflicts", []),
            "unverified_llm_claims": 0
        }
        triggered_rules = df_expert_rules.evaluate_all(context_for_rules)

        # Compute deterministic overall risk level
        overall_risk = PrivacyRiskLevel.CLEAN
        if any(f.risk_level == PrivacyRiskLevel.CRITICAL for f in verified_findings) or any(r.get("severity") == "CRITICAL" for r in triggered_rules):
            overall_risk = PrivacyRiskLevel.CRITICAL
        elif any(f.risk_level == PrivacyRiskLevel.HIGH for f in verified_findings) or any(r.get("severity") == "HIGH" for r in triggered_rules):
            overall_risk = PrivacyRiskLevel.HIGH
        elif any(f.risk_level == PrivacyRiskLevel.MEDIUM for f in verified_findings) or any(r.get("severity") == "MEDIUM" for r in triggered_rules):
            overall_risk = PrivacyRiskLevel.MEDIUM
        elif any(f.risk_level == PrivacyRiskLevel.LOW for f in verified_findings):
            overall_risk = PrivacyRiskLevel.LOW

        risk_score_numeric = 0.95 if overall_risk == PrivacyRiskLevel.CRITICAL else (
            0.75 if overall_risk == PrivacyRiskLevel.HIGH else (
                0.50 if overall_risk == PrivacyRiskLevel.MEDIUM else (
                    0.20 if overall_risk == PrivacyRiskLevel.LOW else 0.05
                )
            )
        )

        step_a6 = AgentExecutionStep(
            agent_id="agent_6_risk_assessment",
            agent_name="Agent 6: Privacy Risk Assessment Agent",
            status="COMPLETED",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Risk assessment finalized as {overall_risk}. Evaluated {len(triggered_rules)} deterministic expert rules."
        )
        trace.append(step_a6)

        # ==============================================================================
        # AGENT 7: Remediation Planning Agent
        # ==============================================================================
        for f in verified_findings:
            t_id = f"TSK-{uuid.uuid4().hex[:6].upper()}"

            if f.recommended_action == RemediationActionType.BLOCK_SENDER:
                inst = (
                    "Device & Messaging Block:\n"
                    "1. On Android/iOS: Open message details and select 'Block Sender'.\n"
                    "2. On WhatsApp: Tap sender contact -> 'Block Contact' -> 'Report Spammer'.\n"
                    "3. In Pakistan: Forward unsolicited commercial/fraud SMS along with sender number to 9000 (PTA Spam Blocking)."
                )
                tasks.append(PrivacyRemediationTask(
                    task_id=t_id,
                    investigation_id=inv_id,
                    finding_id=f.finding_id,
                    action_type=RemediationActionType.BLOCK_SENDER,
                    action_status=RemediationStatus.INSTRUCTIONS_AVAILABLE,
                    target_name=f.source_name,
                    target_identifier_masked=target_masked,
                    instructions_text=inst,
                    official_portal_url="https://www.pta.gov.pk/en/consumer-support",
                    created_at=now_utc,
                    last_updated_at=now_utc
                ))

            elif f.recommended_action == RemediationActionType.UNSUBSCRIBE:
                inst = (
                    "Legitimate Promotional Unsubscribe:\n"
                    "1. Check if the message contains an official verified 'Unsubscribe' footer link.\n"
                    "2. To stop all promotional telemarketing in Pakistan, send your mobile number to PTA's Do Not Call Register (DNCR) via SMS to 4272.\n"
                    "3. If unwanted emails persist from this sender, configure an email rule to auto-archive."
                )
                tasks.append(PrivacyRemediationTask(
                    task_id=t_id,
                    investigation_id=inv_id,
                    finding_id=f.finding_id,
                    action_type=RemediationActionType.UNSUBSCRIBE,
                    action_status=RemediationStatus.INSTRUCTIONS_AVAILABLE,
                    target_name=f.source_name,
                    target_identifier_masked=target_masked,
                    instructions_text=inst,
                    created_at=now_utc,
                    last_updated_at=now_utc
                ))

            elif f.recommended_action == RemediationActionType.DATA_DELETION_REQUEST:
                draft_subject = f"Personal Data Deletion Request — PECA 2016 / GDPR [{target_masked}]"
                draft_body = (
                    f"Dear Privacy Officer / Support Team at {f.source_name},\n\n"
                    f"I am writing to formally request the permanent deletion and removal of my personal information "
                    f"(identifier: {target_masked}) from your publicly accessible databases, web pages, and directories.\n\n"
                    f"Under applicable privacy frameworks and Section 14/21 of the Prevention of Electronic Crimes Act (PECA 2016), "
                    f"I request that my information be expunged without undue delay.\n\n"
                    f"Please confirm once this removal request has been completed.\n\n"
                    f"Sincerely,\nAuthorized User"
                )
                inst = (
                    f"Personalized Deletion Request:\n"
                    f"Review the draft email below. Send it to {f.source_name}'s official privacy or support email address."
                )
                tasks.append(PrivacyRemediationTask(
                    task_id=t_id,
                    investigation_id=inv_id,
                    finding_id=f.finding_id,
                    action_type=RemediationActionType.DATA_DELETION_REQUEST,
                    action_status=RemediationStatus.REQUEST_DRAFTED,
                    target_name=f.source_name,
                    target_identifier_masked=target_masked,
                    instructions_text=inst,
                    draft_payload={"subject": draft_subject, "body": draft_body},
                    official_portal_url=f.source_url,
                    created_at=now_utc,
                    last_updated_at=now_utc
                ))

            elif f.recommended_action == RemediationActionType.SECURE_ACCOUNT:
                inst = (
                    "Urgent Account Hardening:\n"
                    "1. Immediately change passwords on accounts associated with this email.\n"
                    "2. Enable Multi-Factor Authentication (App-based TOTP or hardware key, avoid SMS OTP if possible).\n"
                    "3. Review active sessions and terminate unauthorized logged-in devices."
                )
                tasks.append(PrivacyRemediationTask(
                    task_id=t_id,
                    investigation_id=inv_id,
                    finding_id=f.finding_id,
                    action_type=RemediationActionType.SECURE_ACCOUNT,
                    action_status=RemediationStatus.INSTRUCTIONS_AVAILABLE,
                    target_name=f.source_name,
                    target_identifier_masked=target_masked,
                    instructions_text=inst,
                    created_at=now_utc,
                    last_updated_at=now_utc
                ))

        # Add carrier-specific SMS block task if Pakistani phone number is investigated
        if phone_meta.get("is_pakistani"):
            carrier_name = phone_meta.get("carrier", "Pakistani Telecom")
            tasks.append(PrivacyRemediationTask(
                task_id=f"TSK-PTA-{uuid.uuid4().hex[:5].upper()}",
                investigation_id=inv_id,
                action_type=RemediationActionType.PTA_SPAM_BLOCK,
                action_status=RemediationStatus.INSTRUCTIONS_AVAILABLE,
                target_name=f"{carrier_name} Spam Defense & PTA 9000",
                target_identifier_masked=phone_meta.get("masked", target_masked),
                instructions_text=(
                    f"Pakistani Carrier Spam Controls ({carrier_name}):\n"
                    "1. Block Fraud SMS: Forward unwanted spammer SMS and sender number to 9000 (PTA SMS Spam Portal).\n"
                    "2. Register on Do Not Call Register (DNCR): Send 'reg' to 4272 to stop all telemarketing calls.\n"
                    "3. Unlawful Blackmail / Impersonation: Lodge formal complaint at https://complaint.nccia.gov.pk/."
                ),
                official_portal_url="https://complaint.nccia.gov.pk/",
                created_at=now_utc,
                last_updated_at=now_utc
            ))

        step_a7 = AgentExecutionStep(
            agent_id="agent_7_remediation_planning",
            agent_name="Agent 7: Remediation Planning Agent",
            status="COMPLETED",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Synthesized {len(tasks)} actionable remediation tasks (blocking, opt-out, PTA 9000, and PECA deletion drafts)."
        )
        trace.append(step_a7)

        # ==============================================================================
        # AGENT 8: Follow-up and Reporting Agent
        # ==============================================================================
        prompt = (
            f"Generate an executive forensic summary for Digital Privacy Investigation {inv_id}.\n"
            f"Target: {target_masked}\n"
            f"Findings Count: {len(verified_findings)}\n"
            f"Risk Level: {overall_risk}\n"
            f"Triggered Rules: {[r.get('rule_id') for r in triggered_rules]}"
        )
        exec_summary, provider_used, is_fallback = llm_service.generate_explanation(
            prompt=prompt,
            system_prompt="You are CyberShield AI Executive Privacy Auditor. Provide concise, professional, calm summaries."
        )

        step_a8 = AgentExecutionStep(
            agent_id="agent_8_reporting",
            agent_name="Agent 8: Follow-up & Reporting Agent",
            status="COMPLETED",
            started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            summary=f"Audit report finalized. Executive summary rendered via {provider_used}."
        )
        trace.append(step_a8)

        # Compile coverage
        verified_count = sum(1 for f in verified_findings if f.verification_status == VerificationStatus.VERIFIED)
        potential_count = sum(1 for f in verified_findings if f.verification_status != VerificationStatus.VERIFIED)
        coverage_obj = CoverageSummary(
            sources_checked=coverage_summary_dict["sources_checked"],
            potential_matches=potential_count,
            verified_findings=verified_count,
            sources_unavailable=coverage_summary_dict["sources_unavailable"],
            coverage_level=coverage_summary_dict["coverage_level"],
            provider_notes=coverage_summary_dict["provider_notes"]
        )

        limitations = (
            "Forensic Coverage Disclosures: Search queries check public web indices, configured leak databases, "
            "and user-submitted evidence. CyberShield AI does not compromise private accounts, bypass CAPTCHAs, "
            "or probe third-party password-reset portals. Absence of exposure records in checked sources does not guarantee "
            "complete absence across unindexed deep-web or darknet databases."
        )

        return PrivacyInvestigationResponse(
            investigation_id=inv_id,
            created_at=now_utc,
            investigation_type=req.investigation_type,
            target_masked=target_masked,
            consent_given=True,
            execution_status="COMPLETED",
            risk_level=overall_risk,
            risk_score=risk_score_numeric,
            coverage_summary=coverage_obj,
            execution_trace=trace,
            findings=verified_findings,
            remediation_tasks=tasks,
            triggered_rules=triggered_rules,
            llm_provider_used=provider_used,
            is_deterministic_fallback=is_fallback,
            executive_summary=exec_summary,
            limitations_disclosure=limitations
        )

    def _abort_validation(
        self, inv_id: str, now_utc: str, req: PrivacyInvestigationRequest, trace: List[AgentExecutionStep], err_msg: str
    ) -> PrivacyInvestigationResponse:
        trace.append(AgentExecutionStep(
            agent_id="agent_1_consent_intake",
            agent_name="Agent 1: Consent & Intake Agent",
            status="FAILED",
            started_at=now_utc,
            completed_at=now_utc,
            summary=f"Validation rejected: {err_msg}",
            warnings=[err_msg]
        ))
        return PrivacyInvestigationResponse(
            investigation_id=inv_id,
            created_at=now_utc,
            investigation_type=req.investigation_type,
            target_masked="[INVALID-INPUT]",
            consent_given=True,
            execution_status="FAILED",
            risk_level=PrivacyRiskLevel.CLEAN,
            coverage_summary=CoverageSummary(sources_checked=0, potential_matches=0, verified_findings=0, sources_unavailable=0, coverage_level="None"),
            execution_trace=trace,
            findings=[],
            remediation_tasks=[],
            triggered_rules=[],
            executive_summary=f"Investigation aborted: {err_msg}",
            limitations_disclosure="Input failed validation checks."
        )

privacy_orchestrator = DigitalPrivacyOrchestrator()
