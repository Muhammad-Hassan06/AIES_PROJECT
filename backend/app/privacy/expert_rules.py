from typing import List, Dict, Any, Optional
from app.privacy.schemas import (
    PrivacyFinding, VerificationStatus, PrivacyRiskLevel, RemediationActionType
)

class DigitalFootprintRule:
    def __init__(self, rule_id: str, rule_name: str, description: str, rationale: str):
        self.rule_id = rule_id
        self.rule_name = rule_name
        self.description = description
        self.rationale = rationale

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

class RuleDF01(DigitalFootprintRule):
    """RULE_DF_01: Verified public exposure of sensitive personal information requires a documented privacy recommendation."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_01",
            rule_name="Mandatory Remediation for Verified Exposure",
            description="Verified public exposure of sensitive personal information mandates an actionable remediation task.",
            rationale="Unremediated public personal data invites credential stuffing, targeted smishing, and identity impersonation."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        findings = context.get("findings", [])
        verified_count = sum(1 for f in findings if f.verification_status == VerificationStatus.VERIFIED)
        if verified_count > 0:
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "HIGH",
                "explanation": f"Detected {verified_count} independently verified exposure findings. Generating formal remediation and opt-out tasks.",
                "actions_mandated": ["DATA_DELETION_REQUEST", "REVIEW_PRIVACY"]
            }
        return None

class RuleDF02(DigitalFootprintRule):
    """RULE_DF_02: Credible report of exposure involving an email address and password requires urgent account-security guidance, without storing the password."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_02",
            rule_name="Credential Compromise Alert (No Password Retention)",
            description="Credible breach report containing email + password triggers urgent credential-rotation instructions without retaining secret text.",
            rationale="Password reuse across banking, email, and social portals is the leading cause of account takeover."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        findings = context.get("findings", [])
        for f in findings:
            text = (f.evidence_excerpt_redacted or "").lower() + " " + f.source_name.lower()
            if any(term in text for term in ["password", "hash", "plaintext password", "combo list", "stealer log"]):
                return {
                    "rule_id": self.rule_id,
                    "rule_name": self.rule_name,
                    "triggered": True,
                    "severity": "CRITICAL",
                    "explanation": f"Finding '{f.source_name}' indicates credentials (passwords/hashes) were included in exposure record. Urgent password reset and 2FA activation required.",
                    "actions_mandated": ["SECURE_ACCOUNT"]
                }
        return None

class RuleDF03(DigitalFootprintRule):
    """RULE_DF_03: Suspicious message requesting an OTP or banking PIN triggers the existing credential-harvesting safeguards."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_03",
            rule_name="Active OTP / Banking PIN Harvest Safeguard",
            description="Any incoming communication demanding an OTP, ATM PIN, or banking token is flagged as malicious cyber-fraud.",
            rationale="Per SBP Circular BPRD 2023-01, commercial banks and fintechs never request OTPs or PINs via SMS or phone calls."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        spam_analysis = context.get("spam_analysis", {})
        if spam_analysis.get("otp_requested") or spam_analysis.get("pin_requested"):
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "CRITICAL",
                "explanation": "Active OTP / PIN harvesting demand detected in supplied evidence. Immediately block sender and report to FIA/NCCIA.",
                "actions_mandated": ["BLOCK_SENDER", "REPORT_SPAM", "PTA_SPAM_BLOCK"]
            }
        return None

class RuleDF04(DigitalFootprintRule):
    """RULE_DF_04: A public search match without independent verification must not be presented as confirmed website registration."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_04",
            rule_name="Index Proximity Is Not Registration Proof",
            description="Search engine snippet matches are classified as UNVERIFIED_INDEX, never confirmed account registrations.",
            rationale="Search engines frequently index third-party aggregators, forum mentions, or scraper directories where the user never registered."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        findings = context.get("findings", [])
        index_matches = [f for f in findings if f.source_type == "PUBLIC_WEB" and f.verification_status != VerificationStatus.VERIFIED]
        if index_matches:
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "LOW",
                "explanation": f"{len(index_matches)} search engine index matches identified. Kept as UNVERIFIED_INDEX to avoid misleading the user that they registered with these domains.",
                "actions_mandated": ["REVIEW_PRIVACY"]
            }
        return None

class RuleDF05(DigitalFootprintRule):
    """RULE_DF_05: A missing or unavailable source must be reported as unknown, not clean."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_05",
            rule_name="Honest Unavailable Source Accounting",
            description="If a breach database or discovery API is unconfigured or timed out, report as 'Unavailable', never claim user is clean.",
            rationale="Absence of evidence is not evidence of absence; false negatives create dangerous complacency."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        coverage = context.get("coverage_summary", {})
        sources_unavailable = coverage.get("sources_unavailable", 0)
        if sources_unavailable > 0:
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "MEDIUM",
                "explanation": f"{sources_unavailable} discovery providers were unavailable or unconfigured. Reporting coverage as Partial.",
                "actions_mandated": []
            }
        return None

class RuleDF06(DigitalFootprintRule):
    """RULE_DF_06: A legitimate marketing email must not automatically be classified as a cyberattack."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_06",
            rule_name="Marketing vs Cyberattack Discrimination",
            description="Commercial promotional messages lacking malicious payload/phishing links are categorized as PROMOTIONAL_SPAM, not cyberattacks.",
            rationale="Conflating unsolicited retail newsletters with advanced persistent threats degrades user trust in security alerts."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        spam_analysis = context.get("spam_analysis", {})
        if spam_analysis.get("is_promotional") and not spam_analysis.get("is_phishing"):
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "LOW",
                "explanation": "Evidence represents commercial marketing / promotional solicitation without credential theft payloads. Recommending unsubscribe and carrier opt-out rather than emergency incident escalation.",
                "actions_mandated": ["UNSUBSCRIBE"]
            }
        return None

class RuleDF07(DigitalFootprintRule):
    """RULE_DF_07: A data-removal request is not equivalent to verified removal."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_07",
            rule_name="Removal Request State Invariance",
            description="Drafting or submitting an opt-out request sets status to REQUEST_SUBMITTED, never REMOVAL_VERIFIED without fresh re-inspection.",
            rationale="Organizations frequently delay, reject, or ignore deletion requests under local privacy exceptions."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Enforced during status transitions
        return None

class RuleDF08(DigitalFootprintRule):
    """RULE_DF_08: A successful sender-blocking action does not establish that the underlying data was deleted."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_08",
            rule_name="Sender Block vs Data Purge Disambiguation",
            description="Local device or carrier blocking prevents incoming alerts but does not delete phone/email records held by data brokers.",
            rationale="Users must understand that local filtering does not eliminate root exposure in leak databases."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        spam_analysis = context.get("spam_analysis", {})
        if spam_analysis.get("is_spam") or spam_analysis.get("is_phishing"):
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "LOW",
                "explanation": "Advising user that blocking spammer contact numbers stops incoming alerts on their device, but does not remove their number from commercial call lists.",
                "actions_mandated": []
            }
        return None

class RuleDF09(DigitalFootprintRule):
    """RULE_DF_09: A newly discovered source should be compared against existing evidence to avoid duplicate findings."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_09",
            rule_name="Finding De-duplication and Provenance Merging",
            description="Identical hostnames and leak identifiers are deduplicated into single high-confidence evidence nodes.",
            rationale="Duplicate warnings artificially inflate risk scores and overwhelm users with redundant alerts."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        dedup_count = context.get("dedup_count", 0)
        if dedup_count > 0:
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "LOW",
                "explanation": f"Deduplicated {dedup_count} overlapping source mentions into verified canonical findings.",
                "actions_mandated": []
            }
        return None

class RuleDF10(DigitalFootprintRule):
    """RULE_DF_10: An external AI-generated claim without supporting source evidence must not become a verified finding."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_10",
            rule_name="LLM Hallucination Guardrail",
            description="All verified findings must be grounded in raw HTTP citations, verified database dumps, or user-provided files.",
            rationale="Generative LLMs can fabricate breach names, URLs, or registration claims when prompted with an email or phone number."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        unverified_llm_claims = context.get("unverified_llm_claims", 0)
        if unverified_llm_claims > 0:
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "MEDIUM",
                "explanation": f"Filtered out {unverified_llm_claims} speculative LLM statements lacking verifiable source links.",
                "actions_mandated": []
            }
        return None

class RuleDF11(DigitalFootprintRule):
    """RULE_DF_11: An exposure report does not prove that a user suffered identity theft."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_11",
            rule_name="Exposure vs Actual Fraud Separation",
            description="Clarifies in reports that finding an email or phone in a leak does not mean bank accounts were breached.",
            rationale="Calm, accurate risk framing prevents panic and guides targeted preventive action."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return {
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "triggered": True,
            "severity": "LOW",
            "explanation": "Forensic framing applied: digital footprint exposure signifies elevated reconnaissance risk, not active financial compromise.",
            "actions_mandated": []
        }

class RuleDF12(DigitalFootprintRule):
    """RULE_DF_12: If evidence conflicts, lower the verification status and explain the conflict."""
    def __init__(self):
        super().__init__(
            rule_id="RULE_DF_12",
            rule_name="Conflicting Evidence Status Degradation",
            description="When user headers, URL features, or external reports contradict each other, downgrade finding to CONFLICTING.",
            rationale="Scientific expert systems must preserve doubt and explain anomalies rather than forcing false certainty."
        )

    def evaluate(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conflicts = context.get("evidence_conflicts", [])
        if conflicts:
            return {
                "rule_id": self.rule_id,
                "rule_name": self.rule_name,
                "triggered": True,
                "severity": "MEDIUM",
                "explanation": f"Identified {len(conflicts)} conflicting evidence signals: {'; '.join(conflicts)}. Marked affected findings as CONFLICTING.",
                "actions_mandated": []
            }
        return None

class DigitalFootprintRulesEngine:
    def __init__(self):
        self.rules: List[DigitalFootprintRule] = [
            RuleDF01(), RuleDF02(), RuleDF03(), RuleDF04(),
            RuleDF05(), RuleDF06(), RuleDF07(), RuleDF08(),
            RuleDF09(), RuleDF10(), RuleDF11(), RuleDF12()
        ]

    def evaluate_all(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        triggered = []
        for r in self.rules:
            res = r.evaluate(context)
            if res:
                triggered.append(res)
        return triggered

df_expert_rules = DigitalFootprintRulesEngine()
