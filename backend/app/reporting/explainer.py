import os
import json
from typing import Dict, Any, List
from app.core.config import settings

def generate_deterministic_report(
    evidence_dict: Dict[str, Any],
    risk_level: str,
    triggered_rules: List[Dict[str, Any]],
    url_result: Dict[str, Any],
    nlp_result: Dict[str, Any],
    vision_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    High-fidelity deterministic report generator used when offline or when no Gemini API key is configured.
    Strictly grounds findings in computed model outputs and matched expert rules.
    """
    key_warnings = []
    recommended_actions = []

    has_url = bool(url_result and url_result.get("url"))
    has_nlp = bool(nlp_result and nlp_result.get("analyzed_text"))
    has_ocr = bool(vision_result and vision_result.get("extracted_text"))

    # Warnings from rules and models
    for rule in triggered_rules:
        key_warnings.append(f"[{rule.get('severity')}] {rule.get('rule_name')}: {rule.get('explanation')}")

    if has_url and url_result.get("is_phishing"):
        prob = url_result.get("phishing_probability", 0.0)
        key_warnings.append(f"[HIGH] Machine Learning URL Threat Detector flagged target link with {prob:.1%} phishing probability.")

    if has_nlp and nlp_result.get("is_social_engineering"):
        score = nlp_result.get("risk_score", 0.0)
        cats = ", ".join(nlp_result.get("categories_detected", []))
        key_warnings.append(f"[HIGH] NLP Language Analysis identified deceptive tactics ({cats}) with a manipulation risk score of {score:.1%}.")

    # Formulate plain language executive summary
    if risk_level in ("CRITICAL", "HIGH"):
        exec_summary = (
            f"CyberShield AI identified significant malicious indicators in this case. "
            f"The evidence demonstrates high-risk social-engineering patterns, including potential credential harvesting "
            f"or deceptive institutional impersonation. We strongly advise treating this communication as untrusted."
        )
        recommended_actions = [
            "DO NOT click any embedded links or open attached files.",
            "NEVER share One-Time Passwords (OTP), PINs, or banking credentials.",
            "Verify the request independently by dialing the institution's official, publicly published contact number.",
            "If bank details were entered, immediately call your bank helpline to block your card and internet banking session.",
            "Report fraudulent activity to the National Cyber Crime Investigation Agency (NCCIA) at complaint.nccia.gov.pk or call 9999."
        ]
    elif risk_level == "MEDIUM":
        exec_summary = (
            f"CyberShield AI detected suspicious or conflicting indicators in this submission. "
            f"While there is no definitive confirmation of active credential harvesting, several caution markers "
            f"(such as urgency cues or unverified domain structure) warrant heightened scrutiny."
        )
        recommended_actions = [
            "Exercise caution before interacting with this sender or web address.",
            "Cross-verify the communication directly through the official mobile app or verified portal.",
            "Check for official security advisories on PKCERT (pkcert.gov.pk)."
        ]
    elif risk_level == "LOW":
        exec_summary = (
            f"CyberShield AI did not detect high-risk phishing or social engineering patterns in the provided evidence. "
            f"The message and destination structure align with standard legitimate communications. "
            f"Always remain vigilant regarding unsolicited requests."
        )
        recommended_actions = [
            "Proceed with normal security awareness.",
            "Ensure HTTPS padlock is present when submitting personal information.",
            "Always verify that website addresses match official organizational domain names."
        ]
    else:  # INSUFFICIENT_EVIDENCE
        exec_summary = (
            f"The submitted evidence lacks sufficient diagnostic data to reach a conclusive assessment. "
            f"Neither malicious markers nor verified legitimate organizational signatures could be established."
        )
        recommended_actions = [
            "Submit the complete message text, sender phone/email headers, or a clear screenshot of the page.",
            "Ensure the full URL including domain and path is provided for accurate analysis."
        ]

    # Technical report breakdown
    tech_sections = [
        f"### Forensic Technical Assessment",
        f"- **Primary Case Risk**: {risk_level}",
        f"- **Rules Triggered**: {len(triggered_rules)} active rule matches",
        f"- **Input Modalities Evaluated**: " + ", ".join(filter(None, [
            "URL Model" if has_url else None,
            "NLP Semantic Engine" if has_nlp else None,
            "Computer Vision OCR" if has_ocr else None
        ]))
    ]

    if has_url:
        tech_sections.append(
            f"#### URL Forensic Diagnostics:\n"
            f"- Target: `{url_result.get('url')}`\n"
            f"- Model: {url_result.get('model_name')}\n"
            f"- Estimated Phishing Probability: {url_result.get('phishing_probability', 0.0):.2%}\n"
            f"- Signal Count: {len(url_result.get('top_signals', []))} abnormal indicators identified"
        )

    if has_nlp:
        tech_sections.append(
            f"#### NLP Linguistic Diagnostics:\n"
            f"- Evaluated Spans: {len(nlp_result.get('highlighted_spans', []))} suspicious token ranges flagged\n"
            f"- Deception Index: {nlp_result.get('risk_score', 0.0):.2%}\n"
            f"- Categories: {', '.join(nlp_result.get('categories_detected', []))}"
        )

    if has_ocr:
        tech_sections.append(
            f"#### Computer Vision & OCR Diagnostics:\n"
            f"- Engine: {vision_result.get('ocr_engine')}\n"
            f"- Extracted URLs: {len(vision_result.get('extracted_urls', []))}\n"
            f"- Visual Form Elements: {', '.join(vision_result.get('detected_keywords', []))}"
        )

    technical_report = "\n\n".join(tech_sections)

    return {
        "executive_summary": exec_summary,
        "technical_report": technical_report,
        "key_warnings": key_warnings,
        "recommended_actions": recommended_actions,
        "explainer_provider": "CyberShield Deterministic Rule & Model Synthesizer (Fallback)"
    }

class GenerativeAISecurityExplainer:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[Explainer] Error initializing google-genai client: {e}")
                self.client = None

    def explain(
        self,
        evidence_dict: Dict[str, Any],
        risk_level: str,
        triggered_rules: List[Dict[str, Any]],
        url_result: Dict[str, Any],
        nlp_result: Dict[str, Any],
        vision_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Attempts Generative AI explanation with Gemini; falls back cleanly to deterministic synthesis if unavailable.
        """
        deterministic = generate_deterministic_report(
            evidence_dict, risk_level, triggered_rules, url_result, nlp_result, vision_result
        )

        # Try configured multi-provider LLM (Gemini, Groq, OpenAI, Anthropic)
        try:
            from app.privacy.providers.llm_provider import llm_service
            active_adapter, _ = llm_service.select_active_provider()
            if active_adapter:
                success, text, err = active_adapter.generate(prompt, temperature=0.2, max_tokens=1000)
                if success and text:
                    # Strip markdown fence if present
                    clean_text = text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.startswith("```"):
                        clean_text = clean_text[3:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    parsed = json.loads(clean_text.strip())
                    return {
                        "executive_summary": parsed.get("executive_summary", deterministic["executive_summary"]),
                        "technical_report": parsed.get("technical_report", deterministic["technical_report"]),
                        "key_warnings": parsed.get("key_warnings", deterministic["key_warnings"]),
                        "recommended_actions": parsed.get("recommended_actions", deterministic["recommended_actions"]),
                        "explainer_provider": f"{active_adapter.provider_name} ({active_adapter.model_name})"
                    }
        except Exception as e:
            print(f"[Explainer] Multi-provider LLM failed: {e}")

        # Fallback to direct Gemini client if initialized
        if self.client and self.api_key:
            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config={"response_mime_type": "application/json"}
                )
                parsed = json.loads(response.text)
                return {
                    "executive_summary": parsed.get("executive_summary", deterministic["executive_summary"]),
                    "technical_report": parsed.get("technical_report", deterministic["technical_report"]),
                    "key_warnings": parsed.get("key_warnings", deterministic["key_warnings"]),
                    "recommended_actions": parsed.get("recommended_actions", deterministic["recommended_actions"]),
                    "explainer_provider": f"Gemini ({settings.GEMINI_MODEL})"
                }
            except Exception as e:
                print(f"[Explainer] Gemini API call failed: {e}")

        return deterministic

security_explainer = GenerativeAISecurityExplainer()
