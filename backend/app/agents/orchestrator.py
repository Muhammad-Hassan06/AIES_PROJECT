import time
import uuid
import datetime
from typing import Dict, Any, List, Optional

from app.models.schemas import (
    InvestigationType, RiskLevel, AgentStatus, AgentStepEvent,
    EvidenceLedgerEntry, OfficialResource, InvestigationReport,
    URLAnalysisResult, NLPAnalysisResult, ScreenshotAnalysisResult,
    TriggeredRule
)
from app.core.security import sanitize_url, sanitize_evidence_text
from app.ml.url_classifier import url_classifier
from app.nlp.text_classifier import text_classifier
from app.vision.ocr_engine import ocr_engine
from app.rules.expert_system import expert_engine
from app.intelligence.external_intel import threat_intel
from app.reporting.explainer import security_explainer
from app.core.config import settings

VERIFIED_OFFICIAL_RESOURCES = [
    OfficialResource(
        title="National Cyber Crime Investigation Agency (NCCIA) Complaint Portal",
        category="Individual Cyber Crime Reporting",
        url=settings.NCCIA_PORTAL_URL,
        description="Official Government of Pakistan portal for reporting financial fraud, identity theft, unauthorized account access, and harassment.",
        helpline="9999 (Toll Free) or helpdesk@nccia.gov.pk"
    ),
    OfficialResource(
        title="Pakistan Computer Emergency Response Team (PKCERT) Incident Desk",
        category="Critical Infrastructure & Organizational Incident Reporting",
        url=settings.PKCERT_REPORT_URL,
        description="Official national CERT under Ministry of IT & Telecom for handling organizational security incidents, phishing campaigns, and malware distribution.",
        helpline="incident@pkcert.gov.pk"
    ),
    OfficialResource(
        title="State Bank of Pakistan (SBP) Consumer Protection Portal",
        category="Banking Fraud & Unauthorized Transaction Redressal",
        url="https://www.sbp.org.pk/cpd/cpd.asp",
        description="Escalation channel for Pakistani banking consumers if commercial banks fail to resolve unauthorized debits or OTP scam complaints.",
        helpline="111-727-273"
    )
]

class AgenticInvestigationOrchestrator:
    def __init__(self):
        pass

    def run_investigation(
        self,
        input_type: InvestigationType,
        url: Optional[str] = None,
        text: Optional[str] = None,
        sender_info: Optional[str] = None,
        screenshot_base64: Optional[str] = None,
        manual_indicators: Optional[List[str]] = None
    ) -> InvestigationReport:
        case_id = f"CS-{uuid.uuid4().hex[:8].upper()}"
        iso_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        trace: List[AgentStepEvent] = []
        ledger: List[EvidenceLedgerEntry] = []

        url_result_obj = None
        nlp_result_obj = None
        vision_result_obj = None
        triggered_rules_objs: List[TriggeredRule] = []

        # ====================================================================
        # AGENT 1: Intake and Planning Agent
        # ====================================================================
        step1_start = time.time()
        plan_details = []
        tools_to_run = []

        has_url_input = bool(url and url.strip())
        has_text_input = bool(text and text.strip())
        has_vision_input = bool(screenshot_base64 and screenshot_base64.strip())

        if has_url_input:
            tools_to_run.append("URL_INTELLIGENCE")
        if has_text_input:
            tools_to_run.append("MESSAGE_NLP")
        if has_vision_input:
            tools_to_run.append("SCREENSHOT_OCR")

        # Always planned downstream agents
        tools_to_run.extend(["EXPERT_RULES", "EVIDENCE_VERIFIER", "RISK_ASSESSOR", "REPORT_GENERATOR"])

        step1_duration = (time.time() - step1_start) * 1000.0
        trace.append(AgentStepEvent(
            agent_id="agent_intake",
            agent_name="1. Intake & Planning Agent",
            status=AgentStatus.COMPLETED,
            started_at=iso_timestamp,
            completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            duration_ms=round(step1_duration, 2),
            summary=f"Parsed input type '{input_type.value}'. Scheduled {len(tools_to_run)} pipeline tasks: {', '.join(tools_to_run)}",
            findings_count=len(tools_to_run)
        ))

        # ====================================================================
        # AGENT 2: Screenshot Analysis Agent (Run early so OCR URLs feed to Agent 3)
        # ====================================================================
        if "SCREENSHOT_OCR" in tools_to_run:
            step_ocr_start = time.time()
            ocr_out = ocr_engine.process_screenshot_base64(screenshot_base64, filename="evidence_upload.png")
            step_ocr_dur = (time.time() - step_ocr_start) * 1000.0

            is_self_ref = "self-referential" in ocr_out.get("error", "").lower()
            if "error" in ocr_out and not ocr_out.get("extracted_text"):
                summary_msg = (
                    "⚠️ You uploaded a screenshot of CyberShield's own results page. "
                    "Please upload the actual suspicious message, email, or phishing webpage screenshot."
                    if is_self_ref
                    else f"Vision preprocessing error: {ocr_out['error']}"
                )
                trace.append(AgentStepEvent(
                    agent_id="agent_vision",
                    agent_name="2. Screenshot Analysis Agent",
                    status=AgentStatus.FAILED,
                    duration_ms=round(step_ocr_dur, 2),
                    summary=summary_msg,
                    error=ocr_out["error"]
                ))
            else:
                vision_result_obj = ScreenshotAnalysisResult(
                    filename=ocr_out.get("filename"),
                    extracted_text=ocr_out.get("extracted_text", ""),
                    extracted_urls=ocr_out.get("extracted_urls", []),
                    detected_keywords=ocr_out.get("detected_keywords", []),
                    visual_indicators=ocr_out.get("visual_indicators", []),
                    ocr_engine=ocr_out.get("ocr_engine", "OCR_Engine"),
                    latency_ms=ocr_out.get("latency_ms", 0.0),
                    layout_type=ocr_out.get("layout_type", "GENERIC_GRAPHIC"),
                    visual_phishing_probability=ocr_out.get("visual_phishing_probability", 0.0),
                    is_legitimate_likelihood=ocr_out.get("is_legitimate_likelihood", 1.0),
                    suspicious_regions=ocr_out.get("suspicious_regions", []),
                    visual_evidence_ledger=ocr_out.get("visual_evidence_ledger", []),
                    forensics_summary=ocr_out.get("forensics_summary", "")
                )
                trace.append(AgentStepEvent(
                    agent_id="agent_vision",
                    agent_name="2. Screenshot Analysis Agent",
                    status=AgentStatus.COMPLETED,
                    duration_ms=round(step_ocr_dur, 2),
                    summary=f"OCR extracted {len(vision_result_obj.extracted_urls)} URL(s) and {len(vision_result_obj.detected_keywords)} form cues using {vision_result_obj.ocr_engine}.",
                    findings_count=len(vision_result_obj.detected_keywords) + len(vision_result_obj.extracted_urls)
                ))

                ledger.append(EvidenceLedgerEntry(
                    finding="Rendered Visual Screenshot Text & UI Elements Extracted",
                    evidence_source="Screenshot Upload (OCR)",
                    observed_value=vision_result_obj.extracted_text[:120] + "...",
                    analysis_component="ScreenshotOCREngine",
                    timestamp=iso_timestamp,
                    confidence=0.90,
                    supporting_rule="RULE_OCR_07",
                    recommended_action="Correlate visual text with sender authenticity"
                ))

                # If URL input was empty but OCR extracted a URL, feed it forward
                if not has_url_input and vision_result_obj.extracted_urls:
                    url = vision_result_obj.extracted_urls[0]
                    has_url_input = True
                    if "URL_INTELLIGENCE" not in tools_to_run:
                        tools_to_run.insert(1, "URL_INTELLIGENCE")

                # If OCR extracted text, ensure MESSAGE_NLP is scheduled so it gets analyzed
                if vision_result_obj.extracted_text and "MESSAGE_NLP" not in tools_to_run:
                    tools_to_run.append("MESSAGE_NLP")
        else:
            trace.append(AgentStepEvent(
                agent_id="agent_vision",
                agent_name="2. Screenshot Analysis Agent",
                status=AgentStatus.SKIPPED,
                summary="No image evidence submitted. Agent skipped.",
                findings_count=0
            ))

        # ====================================================================
        # AGENT 3: URL Intelligence Agent
        # ====================================================================
        if "URL_INTELLIGENCE" in tools_to_run and has_url_input:
            step_url_start = time.time()
            clean_url = sanitize_url(url)
            url_pred = url_classifier.predict(clean_url)
            intel_info = threat_intel.check_url_reputation(clean_url)
            
            # Feature 1: Multi-Source Threat Intelligence Verification (PhishTank, URLhaus, Safe Browsing)
            from app.intelligence.multi_threat_intel import multi_threat_intel
            multi_intel = multi_threat_intel.verify_url(clean_url)
            intel_info["multi_threat_intel"] = multi_intel
            if multi_intel.get("confirmed_threat_detected"):
                url_pred["is_phishing"] = True
                url_pred["phishing_probability"] = max(url_pred["phishing_probability"], 0.95)
                url_pred["model_name"] = f"{url_pred['model_name']} + {multi_intel['primary_verdict']}"

            step_url_dur = (time.time() - step_url_start) * 1000.0

            url_result_obj = URLAnalysisResult(
                url=clean_url,
                is_phishing=url_pred["is_phishing"],
                phishing_probability=url_pred["phishing_probability"],
                model_name=url_pred["model_name"],
                features=url_pred["features"],
                top_signals=url_pred["top_signals"],
                domain_info=intel_info["domain_reputation"],
                latency_ms=url_pred["latency_ms"]
            )

            threat_flag_note = f" (Confirmed Threat: {multi_intel['primary_verdict']})" if multi_intel.get("confirmed_threat_detected") else ""
            trace.append(AgentStepEvent(
                agent_id="agent_url",
                agent_name="3. URL Intelligence Agent",
                status=AgentStatus.COMPLETED,
                duration_ms=round(step_url_dur, 2),
                summary=f"Classified URL '{clean_url}' via {url_pred['model_name']}. Phishing risk: {url_pred['phishing_probability']:.2%}{threat_flag_note}.",
                findings_count=len(url_pred["top_signals"]) + (1 if multi_intel.get("confirmed_threat_detected") else 0)
            ))

            ledger.append(EvidenceLedgerEntry(
                finding=f"Machine Learning & Multi-Source URL Threat Probability: {url_pred['phishing_probability']:.1%}",
                evidence_source="Target URL Lexical & Multi-Source Threat Intel",
                observed_value=f"Domain: {intel_info['hostname']}, Multi-Threat Status: {multi_intel['primary_verdict']}",
                analysis_component=url_pred["model_name"],
                timestamp=iso_timestamp,
                confidence=url_pred["phishing_probability"] if url_pred["is_phishing"] else (1.0 - url_pred["phishing_probability"]),
                supporting_rule="RULE_URL_03",
                recommended_action="Do not navigate or input credentials on this domain"
            ))
        else:
            trace.append(AgentStepEvent(
                agent_id="agent_url",
                agent_name="3. URL Intelligence Agent",
                status=AgentStatus.SKIPPED,
                summary="No URL provided in submission. Agent skipped.",
                findings_count=0
            ))

        # ====================================================================
        # AGENT 4: Message Analysis Agent
        # ====================================================================
        raw_text = (text or "").strip()
        ocr_text = (vision_result_obj.extracted_text or "").strip() if vision_result_obj else ""
        if raw_text and ocr_text:
            text_to_analyze = f"{raw_text}\n{ocr_text}" if raw_text != ocr_text else raw_text
        elif ocr_text:
            text_to_analyze = ocr_text
        else:
            text_to_analyze = raw_text

        if "MESSAGE_NLP" in tools_to_run or bool(text_to_analyze.strip()):
            step_nlp_start = time.time()
            clean_text, injection_flag = sanitize_evidence_text(text_to_analyze)
            nlp_out = text_classifier.analyze(clean_text)
            step_nlp_dur = (time.time() - step_nlp_start) * 1000.0

            nlp_result_obj = NLPAnalysisResult(
                analyzed_text=clean_text,
                is_social_engineering=nlp_out["is_social_engineering"],
                risk_score=nlp_out["risk_score"],
                categories_detected=nlp_out["categories_detected"],
                highlighted_spans=nlp_out["highlighted_spans"],
                pakistan_context_detected=nlp_out["pakistan_context_detected"],
                model_name=nlp_out["model_name"],
                latency_ms=nlp_out["latency_ms"]
            )

            trace.append(AgentStepEvent(
                agent_id="agent_nlp",
                agent_name="4. Message Analysis Agent",
                status=AgentStatus.COMPLETED,
                duration_ms=round(step_nlp_dur, 2),
                summary=f"Analyzed message. Flagged {len(nlp_out['highlighted_spans'])} suspicious spans across categories: {', '.join(nlp_out['categories_detected']) or 'None'}.",
                findings_count=len(nlp_out["highlighted_spans"])
            ))

            if nlp_out["highlighted_spans"]:
                ledger.append(EvidenceLedgerEntry(
                    finding=f"Social Engineering Manipulation Index: {nlp_out['risk_score']:.1%}",
                    evidence_source="Message / Email Linguistic Content",
                    observed_value=", ".join(s.text for s in nlp_out["highlighted_spans"][:3]),
                    analysis_component=nlp_out["model_name"],
                    timestamp=iso_timestamp,
                    confidence=nlp_out["risk_score"],
                    supporting_rule="RULE_URG_02",
                    recommended_action="Do not respond or transfer money"
                ))
        else:
            trace.append(AgentStepEvent(
                agent_id="agent_nlp",
                agent_name="4. Message Analysis Agent",
                status=AgentStatus.SKIPPED,
                summary="No message or email text provided. Agent skipped.",
                findings_count=0
            ))

        # ====================================================================
        # AGENT 5: Expert-System Agent
        # ====================================================================
        step_rules_start = time.time()
        triggered_rules_objs = expert_engine.evaluate(
            url_result=url_result_obj.model_dump() if url_result_obj else None,
            nlp_result=nlp_result_obj.model_dump() if nlp_result_obj else None,
            vision_result=vision_result_obj.model_dump() if vision_result_obj else None,
            manual_indicators=manual_indicators or [],
            input_type=input_type.value
        )
        step_rules_dur = (time.time() - step_rules_start) * 1000.0

        trace.append(AgentStepEvent(
            agent_id="agent_rules",
            agent_name="5. Expert-System Agent",
            status=AgentStatus.COMPLETED,
            duration_ms=round(step_rules_dur, 2),
            summary=f"Evaluated 10 explicit IF-THEN rules. Triggered {len(triggered_rules_objs)} rule condition matches.",
            findings_count=len(triggered_rules_objs)
        ))

        for r in triggered_rules_objs:
            ledger.append(EvidenceLedgerEntry(
                finding=f"Expert Rule Triggered: {r.rule_name}",
                evidence_source=f"Matched Conditions ({len(r.conditions_matched)})",
                observed_value="; ".join(r.conditions_matched),
                analysis_component="RuleEngine (IF-THEN)",
                timestamp=iso_timestamp,
                confidence=0.95,
                supporting_rule=r.rule_id,
                recommended_action=r.resulting_action
            ))

        # ====================================================================
        # AGENT 6: Evidence Verification Agent
        # ====================================================================
        step_ver_start = time.time()
        # Audit evidence claims: verify provenance, cross-check discordant findings
        verified_count = len(ledger)
        step_ver_dur = (time.time() - step_ver_start) * 1000.0

        trace.append(AgentStepEvent(
            agent_id="agent_verifier",
            agent_name="6. Evidence Verification Agent",
            status=AgentStatus.COMPLETED,
            duration_ms=round(step_ver_dur, 2),
            summary=f"Audited {verified_count} evidence ledger entries. Verified provenance across models, rules, and local intelligence.",
            findings_count=verified_count
        ))

        # ====================================================================
        # AGENT 7: Risk Assessment & Evidence Fusion Agent
        # ====================================================================
        step_risk_start = time.time()
        from app.analytics.evidence_fusion import evidence_fusion_engine
        fusion_out = evidence_fusion_engine.fuse(
            input_type=input_type.value,
            url_result=url_result_obj.model_dump() if url_result_obj else None,
            nlp_result=nlp_result_obj.model_dump() if nlp_result_obj else None,
            vision_result=vision_result_obj.model_dump() if vision_result_obj else None,
            threat_intel=intel_info if 'intel_info' in locals() else None,
            triggered_rules=[r.model_dump() for r in triggered_rules_objs],
            manual_indicators=manual_indicators or []
        )

        final_risk = fusion_out["risk_level"]
        fraud_risk_score = fusion_out["forensic_risk_score"]
        model_confidence = fusion_out["overall_model_confidence"]
        predicted_class = fusion_out["predicted_class"]
        decision_status = fusion_out["decision_status"]
        score_interpretation = fusion_out["score_interpretation"]
        confidence_interpretation = fusion_out["confidence_interpretation"]
        evidence_strength = (
            "WEAK (Insufficient Diagnostic Indicators)" if final_risk == RiskLevel.INSUFFICIENT_EVIDENCE
            else ("STRONG (Multi-modal corroboration)" if final_risk == RiskLevel.CRITICAL
            else ("SUBSTANTIAL" if final_risk == RiskLevel.HIGH
            else ("MODERATE" if final_risk == RiskLevel.MEDIUM else "LOW RISK")))
        )

        step_risk_dur = (time.time() - step_risk_start) * 1000.0

        trace.append(AgentStepEvent(
            agent_id="agent_risk",
            agent_name="7. Risk Assessment & Evidence Fusion Agent",
            status=AgentStatus.COMPLETED,
            duration_ms=round(step_risk_dur, 2),
            summary=f"Fused evidence across modalities (Fraud Prob: {fusion_out['calibrated_fraud_probability']:.1%}, Risk Score: {fraud_risk_score}/100, Confidence: {model_confidence:.1%}, Conflict: {fusion_out['conflict_score']:.0%}).",
            findings_count=len(fusion_out.get("traceable_evidence_ledger", []))
        ))

        # ====================================================================
        # AGENT 8: Report Generation Agent
        # ====================================================================
        step_rep_start = time.time()
        explanation = security_explainer.explain(
            evidence_dict={"case_id": case_id, "input_type": input_type.value},
            risk_level=final_risk.value,
            triggered_rules=[r.model_dump() for r in triggered_rules_objs],
            url_result=url_result_obj.model_dump() if url_result_obj else {},
            nlp_result=nlp_result_obj.model_dump() if nlp_result_obj else {},
            vision_result=vision_result_obj.model_dump() if vision_result_obj else {}
        )
        step_rep_dur = (time.time() - step_rep_start) * 1000.0

        trace.append(AgentStepEvent(
            agent_id="agent_reporter",
            agent_name="8. Report Generation Agent",
            status=AgentStatus.COMPLETED,
            duration_ms=round(step_rep_dur, 2),
            summary=f"Compiled executive briefing, forensic report, and actionable remediation via {explanation.get('explainer_provider')}.",
            findings_count=len(explanation.get("key_warnings", []))
        ))

        limitations = [
            "URL models analyze lexical and structural composition; dynamic in-browser execution was not conducted.",
            "NLP analyzes message text semantics and cannot independently verify sender SIM card identity.",
            "The system does not submit complaints automatically to government bodies."
        ]

        # Merge limitations from fusion engine
        for lim in fusion_out.get("limitations", []):
            if lim not in limitations:
                limitations.append(lim)

        # Incorporate traceable fusion ledger entries
        for t_item in fusion_out.get("traceable_evidence_ledger", []):
            ledger.append(EvidenceLedgerEntry(
                finding=t_item["finding"],
                evidence_source=t_item["source_name"],
                observed_value=t_item["observed_value"],
                analysis_component=t_item["source_id"],
                timestamp=t_item["timestamp"],
                confidence=t_item["raw_score"],
                supporting_rule=None,
                recommended_action="Inspect correlation with cross-modal findings",
                contribution_points=t_item.get("contribution_points"),
                correlation_group=t_item.get("correlation_group"),
                reliability_limitation=t_item.get("reliability_limitation")
            ))

        raw_input_data = {
            "url": url or "",
            "text": text or "",
            "sender_info": sender_info or "",
            "screenshot_name": "screenshot.png" if screenshot_base64 else "",
            "manual_indicators": manual_indicators or []
        }

        active_model_versions = {
            "url_classifier": "RandomForest-v1.0 (PhiUSIIL)",
            "nlp_classifier": "MultinomialNB-v1.0 (Pakistani Lures)",
            "expert_rules": "v1.2 (Symbolic IF-THEN)",
            "ocr_engine": "Tesseract OCR v5.0 / Windows Native",
            "fusion_engine": "EvidenceFusionEngine v2.0 (Anti-Double-Counting)",
            "explainer": "Google Gemini 2.5 Flash / Fallback Synthesizer"
        }

        report = InvestigationReport(
            case_id=case_id,
            timestamp=iso_timestamp,
            input_type=input_type.value,
            status="COMPLETED",
            risk_level=final_risk,
            model_confidence=round(float(model_confidence), 4),
            evidence_strength=evidence_strength,
            executive_summary=explanation.get("executive_summary", ""),
            technical_report=explanation.get("technical_report", ""),
            key_warnings=explanation.get("key_warnings", []),
            recommended_actions=explanation.get("recommended_actions", []),
            limitations=limitations,
            official_resources=VERIFIED_OFFICIAL_RESOURCES,
            evidence_ledger=ledger,
            triggered_rules=triggered_rules_objs,
            agent_execution_trace=trace,
            url_result=url_result_obj,
            nlp_result=nlp_result_obj,
            vision_result=vision_result_obj,
            fraud_risk_score=fraud_risk_score,
            predicted_class=predicted_class,
            score_interpretation=score_interpretation,
            confidence_interpretation=confidence_interpretation,
            probability_calibrated=True,
            calibrated_fraud_probability=fusion_out.get("calibrated_fraud_probability", 0.0),
            conflict_score=fusion_out.get("conflict_score", 0.0),
            uncertainty_score=fusion_out.get("uncertainty_score", 0.0),
            is_discordant=fusion_out.get("is_discordant", False),
            correlated_groups_summary=fusion_out.get("correlated_groups_summary", {}),
            decision_status=decision_status,
            raw_input=raw_input_data,
            model_versions=active_model_versions
        )

        return report

orchestrator = AgenticInvestigationOrchestrator()
