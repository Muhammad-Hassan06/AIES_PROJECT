from typing import Dict, Any, List, Optional
from app.models.schemas import TriggeredRule, RuleDefinition

# Master Catalog of Inspectable IF-THEN Expert Rules
EXPERT_RULES_CATALOG: List[RuleDefinition] = [
    RuleDefinition(
        rule_id="RULE_CRED_01",
        name="Credential & 2FA Token Harvesting",
        category="Credential Theft",
        severity="CRITICAL",
        description="Detects requests for OTP, PIN, password, or CNIC combined with external links or institutional impersonation.",
        conditions=[
            "Message or OCR requests OTP, PIN, password, or credentials",
            "Suspicious URL present OR institutional impersonation detected",
            "Target asks for immediate credential transmission"
        ],
        action="Flag Critical Warning: Immediate Credential Harvesting Hazard. Advise user never to disclose 2FA tokens."
    ),
    RuleDefinition(
        rule_id="RULE_URG_02",
        name="Coercive Urgency & Legal Intimidation",
        category="Social Engineering",
        severity="HIGH",
        description="Identifies panic-inducing time limits, arrest threats, or service suspension threats coercing the user.",
        conditions=[
            "Urgency keywords detected (within 24 hours, immediately, urgent)",
            "Intimidation or punitive threats detected (arrest warrant, FIA, police, account block)",
            "Call to action demands immediate non-standard compliance"
        ],
        action="Flag High Warning: Social Engineering Coercion. Advise independent channel verification."
    ),
    RuleDefinition(
        rule_id="RULE_URL_03",
        name="Independent URL Risk Corroboration",
        category="URL Intelligence",
        severity="HIGH",
        description="Corroborates ML URL threat classification with independent structural anomalies (IP hostname, entropy, suspicious TLD).",
        conditions=[
            "ML URL classifier indicates phishing probability >= 0.70",
            "At least one independent structural anomaly confirmed (e.g. Raw IP, Suspicious TLD, @ symbol, Excessive subdomains)"
        ],
        action="Elevate URL Threat Priority to Confirmed Malicious Domain."
    ),
    RuleDefinition(
        rule_id="RULE_DISCORD_04",
        name="Cross-Modal Evidence Discordance",
        category="Evidence Discrepancy",
        severity="MEDIUM",
        description="Addresses conflicting model outputs (e.g. clean URL with malicious social engineering message, or vice-versa).",
        conditions=[
            "(URL Model flags malicious AND NLP detects no threat) OR (NLP flags malicious AND URL appears benign)",
            "Evidence sources produce divergent risk indications"
        ],
        action="Preserve individual component warnings while explicitly documenting the discordance in the final assessment."
    ),
    RuleDefinition(
        rule_id="RULE_INSUFF_05",
        name="Insufficient Evidence Safeguard",
        category="Data Sufficiency",
        severity="LOW",
        description="Prevents forced classification when evidence is incomplete, truncated, or lacks definitive indicators.",
        conditions=[
            "No high-confidence signals from URL classifier, NLP model, or OCR",
            "Input text is under 15 characters without recognized entities or links",
            "No manual high-risk indicators provided by user"
        ],
        action="Return 'INSUFFICIENT_EVIDENCE' category with advisory to submit complete headers, screenshots, or links."
    ),
    RuleDefinition(
        rule_id="RULE_HARMFUL_06",
        name="Protective 2FA Advisory Directive",
        category="Harm Prevention",
        severity="HIGH",
        description="Enforces protective advisory whenever an OTP or confidential passcode is solicited.",
        conditions=[
            "Recipient is being asked to provide or relay a verification code, OTP, or PIN",
            "Communication originated outside an established, user-initiated authenticated session"
        ],
        action="Instruct user: Do NOT share OTP under any circumstances. Official institutions never ask for one-time passcodes."
    ),
    RuleDefinition(
        rule_id="RULE_OCR_07",
        name="Screenshot Visual Target Attribution",
        category="Computer Vision",
        severity="HIGH",
        description="Validates OCR-extracted URLs and visual brand impersonation from uploaded screenshot evidence.",
        conditions=[
            "OCR pipeline extracted target URL from screenshot image",
            "Screenshot depicts login prompt, balance claim, or payment gateway"
        ],
        action="Pass extracted URL to URL intelligence pipeline, attributing screenshot as the primary evidence provenance."
    ),
    RuleDefinition(
        rule_id="RULE_PAK_08",
        name="Pakistani Public Program & Bank Impersonation",
        category="Institutional Impersonation",
        severity="CRITICAL",
        description="Identifies fraudulent use of BISP, Ehsaas, FBR, SBP, Easypaisa, JazzCash, or Pakistani commercial banks.",
        conditions=[
            "Entity detected matches Pakistani public body (BISP, Ehsaas, FBR, SBP) or local bank/fintech",
            "Domain name does NOT match official .gov.pk or verified institutional domain",
            "Monetary transaction, balance grant, or credential prompt present"
        ],
        action="Flag Critical Warning: Unauthorized Pakistani Institutional Impersonation. Provide official PKCERT/NCCIA reporting links."
    ),
    RuleDefinition(
        rule_id="RULE_FIN_09",
        name="Advance-Fee & Fake Delivery Extortion",
        category="Financial Fraud",
        severity="HIGH",
        description="Detects unsolicited lottery prizes, gifts, or courier package releases contingent on upfront fee payment.",
        conditions=[
            "Prize/lottery claim (Jeeto Pakistan, lucky draw, cash grant) OR parcel detention claim (Pakistan Post, TCS)",
            "Request for processing fee, customs duty, or clearance charge"
        ],
        action="Flag High Warning: Advance-Fee Fraud Pattern. Advise user not to remit funds."
    ),
    RuleDefinition(
        rule_id="RULE_IP_10",
        name="Raw IP Hostname Hazard",
        category="Network Hygiene",
        severity="HIGH",
        description="Detects URLs hosted on raw IPv4/IPv6 addresses commonly used to bypass domain reputation blocks.",
        conditions=[
            "Hostname consists of numeric IP address rather than registered DNS name"
        ],
        action="Flag High Warning: Raw IP Target. Legitimate services do not direct customers to naked IP addresses."
    )
]

class RuleEngine:
    def __init__(self):
        self.catalog = EXPERT_RULES_CATALOG

    def get_catalog(self) -> List[RuleDefinition]:
        return self.catalog

    def evaluate(
        self,
        url_result: Optional[Dict[str, Any]] = None,
        nlp_result: Optional[Dict[str, Any]] = None,
        vision_result: Optional[Dict[str, Any]] = None,
        manual_indicators: Optional[List[str]] = None,
        input_type: str = "combined"
    ) -> List[TriggeredRule]:
        """
        Executes explicit IF-THEN rules across all modalities.
        Returns list of TriggeredRule objects with exact matched conditions and evidence citations.
        """
        triggered: List[TriggeredRule] = []
        manual = set(manual_indicators or [])

        # Extract features and signals
        has_url = url_result is not None and bool(url_result.get("url"))
        url_phishing_prob = url_result.get("phishing_probability", 0.0) if has_url else 0.0
        url_features = url_result.get("features", {}) if has_url else {}
        is_domain_ip = url_features.get("is_domain_ip", 0) == 1
        has_suspicious_tld = url_features.get("has_suspicious_tld", 0) == 1

        has_nlp = nlp_result is not None and bool(nlp_result.get("analyzed_text"))
        nlp_risk = nlp_result.get("risk_score", 0.0) if has_nlp else 0.0
        nlp_categories = set(nlp_result.get("categories_detected", [])) if has_nlp else set()
        pk_context = nlp_result.get("pakistan_context_detected", []) if has_nlp else []

        has_ocr = vision_result is not None and bool(vision_result.get("extracted_text"))
        ocr_urls = vision_result.get("extracted_urls", []) if has_ocr else []
        ocr_keywords = vision_result.get("detected_keywords", []) if has_ocr else []

        # Common cross-modal indicators
        otp_requested = (
            "Credential Harvesting" in nlp_categories
            or "otp_requested" in manual
            or "password_requested" in manual
            or any("otp" in kw for kw in ocr_keywords)
        )
        urgency_present = (
            "Urgency & Pressure" in nlp_categories
            or "urgency" in manual
        )
        intimidation_present = (
            "Legal & Intimidation Threat" in nlp_categories
        )
        fee_requested = (
            "Financial / Fee Request" in nlp_categories
            or "payment_requested" in manual
        )
        prize_claimed = (
            "Prize & Lottery Lure" in nlp_categories
        )

        # Rule 1 — Credential Harvesting (RULE_CRED_01)
        if otp_requested and (has_url or pk_context or len(ocr_keywords) > 0 or "credentials" in str(nlp_categories)):
            matched_conds = [
                "Credential/OTP request verified in submitted evidence",
                "Destination URL or institutional entity attached to request"
            ]
            citations = []
            if has_url: citations.append(f"Target URL: {url_result.get('url')}")
            if pk_context: citations.append(f"Target Institution: {', '.join(pk_context)}")
            if nlp_categories: citations.append(f"NLP Category: {', '.join(nlp_categories)}")

            triggered.append(TriggeredRule(
                rule_id="RULE_CRED_01",
                rule_name="Credential & 2FA Token Harvesting",
                category="Credential Theft",
                severity="CRITICAL",
                conditions_evaluated=EXPERT_RULES_CATALOG[0].conditions,
                conditions_matched=matched_conds,
                evidence_references=citations,
                resulting_action=EXPERT_RULES_CATALOG[0].action,
                explanation="The communication directly solicits one-time passwords, PINs, or confidential credentials. This is the hallmark pattern of account takeover and credential theft."
            ))

        # Rule 2 — Coercive Urgency & Legal Intimidation (RULE_URG_02)
        if urgency_present and (intimidation_present or fee_requested or otp_requested):
            matched_conds = [
                "Artificial deadline or immediate threat detected",
                "Punitive consequence or immediate compliance demanded"
            ]
            citations = [f"Urgency & Intimidation triggers in text: {', '.join(nlp_categories)}"]
            triggered.append(TriggeredRule(
                rule_id="RULE_URG_02",
                rule_name="Coercive Urgency & Legal Intimidation",
                category="Social Engineering",
                severity="HIGH",
                conditions_evaluated=EXPERT_RULES_CATALOG[1].conditions,
                conditions_matched=matched_conds,
                evidence_references=citations,
                resulting_action=EXPERT_RULES_CATALOG[1].action,
                explanation="Attackers use artificial urgency and punitive threats (arrest, blocking, penalties) to impair critical judgment and force hasty compliance."
            ))

        # Rule 3 — Independent URL Risk Corroboration (RULE_URL_03)
        if has_url and url_phishing_prob >= 0.70 and (is_domain_ip or has_suspicious_tld or url_features.get("suspicious_keyword_count", 0) > 0):
            matched_conds = [
                f"ML URL classifier indicates elevated risk ({url_phishing_prob:.2%})",
                f"Corroborated by structural URL signals (IP: {is_domain_ip}, Suspicious TLD: {has_suspicious_tld})"
            ]
            triggered.append(TriggeredRule(
                rule_id="RULE_URL_03",
                rule_name="Independent URL Risk Corroboration",
                category="URL Intelligence",
                severity="HIGH",
                conditions_evaluated=EXPERT_RULES_CATALOG[2].conditions,
                conditions_matched=matched_conds,
                evidence_references=[f"Evaluated URL: {url_result.get('url')}", f"Model: {url_result.get('model_name')}"],
                resulting_action=EXPERT_RULES_CATALOG[2].action,
                explanation="Both the trained machine learning model and independent structural heuristics concur on high phishing probability."
            ))

        # Rule 4 — Cross-Modal Evidence Discordance (RULE_DISCORD_04)
        if has_url and has_nlp:
            url_mal = url_phishing_prob >= 0.65
            nlp_mal = nlp_risk >= 0.65
            if (url_mal and not nlp_mal) or (nlp_mal and not url_mal):
                matched_conds = [
                    f"Divergence detected: URL model indicates {'Malicious' if url_mal else 'Benign'} ({url_phishing_prob:.2%}), NLP indicates {'Malicious' if nlp_mal else 'Benign'} ({nlp_risk:.2%})"
                ]
                triggered.append(TriggeredRule(
                    rule_id="RULE_DISCORD_04",
                    rule_name="Cross-Modal Evidence Discordance",
                    category="Evidence Discrepancy",
                    severity="MEDIUM",
                    conditions_evaluated=EXPERT_RULES_CATALOG[3].conditions,
                    conditions_matched=matched_conds,
                    evidence_references=[
                        f"URL Risk: {url_phishing_prob:.2%}",
                        f"Message Risk: {nlp_risk:.2%}"
                    ],
                    resulting_action=EXPERT_RULES_CATALOG[3].action,
                    explanation="One modality indicates threat while another appears benign (e.g. benign URL embedded in a deceptive message, or phishing link delivered with neutral greeting). Component findings are retained with highlighted uncertainty."
                ))

        # Rule 5 — Insufficient Evidence Safeguard (RULE_INSUFF_05)
        text_len = len(nlp_result.get("analyzed_text", "")) if has_nlp else 0
        if not has_url and text_len < 15 and not has_ocr and not manual:
            matched_conds = [
                "Evidence length under minimum diagnostic threshold",
                "Zero high-risk features detected across all models"
            ]
            triggered.append(TriggeredRule(
                rule_id="RULE_INSUFF_05",
                rule_name="Insufficient Evidence Safeguard",
                category="Data Sufficiency",
                severity="LOW",
                conditions_evaluated=EXPERT_RULES_CATALOG[4].conditions,
                conditions_matched=matched_conds,
                evidence_references=["Evidence payload too brief for conclusive forensic analysis"],
                resulting_action=EXPERT_RULES_CATALOG[4].action,
                explanation="To maintain high scientific integrity, CyberShield AI refrains from guessing when submitted input lacks sufficient diagnostic indicators."
            ))

        # Rule 6 — Protective 2FA Advisory Directive (RULE_HARMFUL_06)
        if otp_requested:
            matched_conds = [
                "2FA token, OTP, or secret PIN solicited in input"
            ]
            triggered.append(TriggeredRule(
                rule_id="RULE_HARMFUL_06",
                rule_name="Protective 2FA Advisory Directive",
                category="Harm Prevention",
                severity="HIGH",
                conditions_evaluated=EXPERT_RULES_CATALOG[5].conditions,
                conditions_matched=matched_conds,
                evidence_references=["Sensitive authentication token solicitation detected"],
                resulting_action=EXPERT_RULES_CATALOG[5].action,
                explanation="One-time passwords are strictly intended for user verification directly inside legitimate apps or bank portals. No legitimate customer service agent will ever request your OTP."
            ))

        # Rule 7 — Screenshot Visual Target Attribution (RULE_OCR_07)
        if has_ocr and (len(ocr_urls) > 0 or len(ocr_keywords) > 0):
            matched_conds = [
                f"OCR extracted {len(ocr_urls)} URL(s) and {len(ocr_keywords)} credential keyword(s) from visual artifact"
            ]
            citations = [f"OCR Engine: {vision_result.get('ocr_engine')}"]
            if ocr_urls: citations.append(f"Extracted URL: {ocr_urls[0]}")
            if ocr_keywords: citations.append(f"Visual Form Elements: {', '.join(ocr_keywords)}")

            triggered.append(TriggeredRule(
                rule_id="RULE_OCR_07",
                rule_name="Screenshot Visual Target Attribution",
                category="Computer Vision",
                severity="HIGH",
                conditions_evaluated=EXPERT_RULES_CATALOG[6].conditions,
                conditions_matched=matched_conds,
                evidence_references=citations,
                resulting_action=EXPERT_RULES_CATALOG[6].action,
                explanation="Visual evidence confirms a rendered form or link targeting user attention. Provenance is anchored to the uploaded screenshot."
            ))

        # Rule 8 — Pakistani Public Program & Bank Impersonation (RULE_PAK_08)
        if pk_context and (has_url or fee_requested or otp_requested or prize_claimed):
            matched_conds = [
                f"Pakistani institutional entities identified: {', '.join(pk_context)}",
                "Non-standard transaction, advance fee, or credential prompt associated with public entity"
            ]
            triggered.append(TriggeredRule(
                rule_id="RULE_PAK_08",
                rule_name="Pakistani Public Program & Bank Impersonation",
                category="Institutional Impersonation",
                severity="CRITICAL",
                conditions_evaluated=EXPERT_RULES_CATALOG[7].conditions,
                conditions_matched=matched_conds,
                evidence_references=[f"Entities: {', '.join(pk_context)}"],
                resulting_action=EXPERT_RULES_CATALOG[7].action,
                explanation="Scammers frequently impersonate public social-support programs (BISP, Ehsaas), tax authorities (FBR), or financial institutions (Easypaisa, JazzCash, HBL) to exploit vulnerable citizens."
            ))

        # Rule 9 — Advance-Fee & Fake Delivery Extortion (RULE_FIN_09)
        if (prize_claimed or "parcel" in str(nlp_result)) and fee_requested:
            matched_conds = [
                "Unsolicited prize or detained parcel claim detected",
                "Upfront processing charge, customs fee, or tax payment solicited"
            ]
            triggered.append(TriggeredRule(
                rule_id="RULE_FIN_09",
                rule_name="Advance-Fee & Fake Delivery Extortion",
                category="Financial Fraud",
                severity="HIGH",
                conditions_evaluated=EXPERT_RULES_CATALOG[8].conditions,
                conditions_matched=matched_conds,
                evidence_references=[f"Identified cues: {', '.join(nlp_categories)}"],
                resulting_action=EXPERT_RULES_CATALOG[8].action,
                explanation="Legitimate couriers and legitimate lotteries never require unverified direct money transfers through mobile wallets to release parcels or prizes."
            ))

        # Rule 10 — Raw IP Hostname Hazard (RULE_IP_10)
        if has_url and is_domain_ip:
            matched_conds = [
                f"Target hostname is an unmapped IP address: {url_result.get('url')}"
            ]
            triggered.append(TriggeredRule(
                rule_id="RULE_IP_10",
                rule_name="Raw IP Hostname Hazard",
                category="Network Hygiene",
                severity="HIGH",
                conditions_evaluated=EXPERT_RULES_CATALOG[9].conditions,
                conditions_matched=matched_conds,
                evidence_references=[f"URL: {url_result.get('url')}"],
                resulting_action=EXPERT_RULES_CATALOG[9].action,
                explanation="Standard web destinations use registered DNS domain names with TLS certificates. Naked IP addresses are commonly deployed in disposable phishing infrastructure."
            ))

        return triggered

expert_engine = RuleEngine()
