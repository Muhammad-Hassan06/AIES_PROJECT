import re
import csv
import io
from typing import Dict, Any, List, Optional, Tuple

from app.nlp.text_classifier import text_classifier
from app.ml.url_classifier import url_classifier
from app.vision.ocr_engine import ocr_engine
from app.core.security import sanitize_url, redact_sensitive_identifiers
from app.privacy.schemas import ExposureCategory, PrivacyRiskLevel, RemediationActionType

PAKISTANI_ORGANIZATIONS = {
    "hbl": {"name": "Habib Bank Limited (HBL)", "official_domain": "hbl.com", "official_sms": "HBL"},
    "meezan": {"name": "Meezan Bank", "official_domain": "meezanbank.com", "official_sms": "MeezanBank"},
    "ubl": {"name": "United Bank Limited (UBL)", "official_domain": "ubldigital.com", "official_sms": "UBL"},
    "mcb": {"name": "MCB Bank", "official_domain": "mcb.com.pk", "official_sms": "MCB"},
    "alfalah": {"name": "Bank Alfalah", "official_domain": "bankalfalah.com", "official_sms": "Alfalah"},
    "jazzcash": {"name": "JazzCash", "official_domain": "jazzcash.com.pk", "official_sms": "JazzCash"},
    "easypaisa": {"name": "EasyPaisa", "official_domain": "easypaisa.com.pk", "official_sms": "easypaisa"},
    "bisp": {"name": "Benazir Income Support Programme (BISP 8171)", "official_domain": "bisp.gov.pk", "official_sms": "8171"},
    "ehsaas": {"name": "Ehsaas Programme (8171)", "official_domain": "pass.gov.pk", "official_sms": "8171"},
    "tcs": {"name": "TCS Express Courier", "official_domain": "tcsexpress.com", "official_sms": "TCS"},
    "leopard": {"name": "Leopards Courier Service", "official_domain": "leopardscourier.com", "official_sms": "Leopards"},
    "jazz": {"name": "Jazz Telecom", "official_domain": "jazz.com.pk", "official_sms": "Jazz"},
    "telenor": {"name": "Telenor Pakistan", "official_domain": "telenor.com.pk", "official_sms": "Telenor"},
    "zong": {"name": "Zong 4G", "official_domain": "zong.com.pk", "official_sms": "Zong"},
    "ufone": {"name": "Ufone 4G", "official_domain": "ufone.com", "official_sms": "Ufone"},
    "fia": {"name": "Federal Investigation Agency (FIA)", "official_domain": "fia.gov.pk", "official_sms": "FIA"}
}

PROMOTIONAL_KEYWORDS = [
    "discount", "sale", "off", "voucher", "promo", "deal", "limited time",
    "subscribe", "unsubscribe", "newsletter", "cashback", "flat", "coupon",
    "shop now", "order now", "free delivery", "exclusive offer", "buy 1 get 1"
]

CREDENTIAL_HARVEST_KEYWORDS = [
    "otp", "pin", "password", "cnic", "atm pin", "cvv", "verification code",
    "secret code", "account suspended", "blocked immediately", "frozen",
    "biometric", "update immediately", "click here to verify"
]

class SpamIntelligenceEngine:
    def __init__(self):
        pass

    def analyze_spam_source(
        self,
        message_text: Optional[str] = None,
        sender_email: Optional[str] = None,
        sender_phone: Optional[str] = None,
        email_headers: Optional[str] = None,
        urls: Optional[List[str]] = None,
        call_log_csv: Optional[str] = None,
        screenshot_base64: Optional[str] = None,
        user_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multi-modal spam intelligence combining NLP, URL classification, OCR,
        call logs, header parsing, and Pakistani organizational impersonation.
        """
        combined_text = message_text or ""
        extracted_ocr_text = ""
        url_findings = []
        impersonated_orgs = []
        indicators = []
        conflicts = []

        # 1. OCR analysis if screenshot is provided
        if screenshot_base64:
            try:
                ocr_res = ocr_engine.process_screenshot_base64(screenshot_base64)
                if ocr_res and ocr_res.get("text"):
                    extracted_ocr_text = ocr_res["text"]
                    combined_text += "\n" + extracted_ocr_text
                    indicators.append("Visual evidence extracted via OCR.")
            except Exception as e:
                indicators.append(f"Screenshot OCR error: {str(e)[:80]}")

        # 2. URL classification
        all_urls = list(urls or [])
        # Extract embedded URLs from message text
        embedded_urls = re.findall(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", combined_text)
        all_urls.extend(embedded_urls)
        all_urls = list(set([sanitize_url(u) for u in all_urls if u]))

        has_phishing_url = False
        for u in all_urls[:5]:
            try:
                u_res = url_classifier.predict(u)
                url_findings.append({
                    "url": u,
                    "is_phishing": u_res["is_phishing"],
                    "probability": u_res["phishing_probability"],
                    "signals": u_res["top_signals"]
                })
                if u_res["is_phishing"]:
                    has_phishing_url = True
            except Exception:
                pass

        # 3. NLP & Text Classification
        nlp_res = text_classifier.analyze(combined_text) if combined_text.strip() else {
            "risk_score": 0.0,
            "is_social_engineering": False,
            "highlighted_spans": [],
            "categories_detected": []
        }

        # 4. Check Pakistani Org Impersonation
        text_lower = combined_text.lower()
        sender_lower = (sender_email or "").lower() + " " + (sender_phone or "").lower()
        full_context = text_lower + " " + sender_lower

        for key, org in PAKISTANI_ORGANIZATIONS.items():
            if key in full_context:
                # Check if sender domain or sender SMS matches official
                is_legit_domain = org["official_domain"] in sender_lower
                impersonated_orgs.append({
                    "organization": org["name"],
                    "official_domain": org["official_domain"],
                    "official_sms": org["official_sms"],
                    "is_official_sender": is_legit_domain,
                    "suspicion": "High" if not is_legit_domain else "Verified Official"
                })

        # 5. Check Credential Harvesting vs Promotional
        otp_requested = any(kw in text_lower for kw in ["otp", "one time password", "verification code", "6-digit code"])
        pin_requested = any(kw in text_lower for kw in ["atm pin", "pin code", "secret pin", "cvv", "password"])
        urgency_detected = any(kw in text_lower for kw in ["immediately", "24 hours", "suspended", "frozen", "blocked", "arrest warrant"])
        prize_lure = any(kw in text_lower for kw in ["mubarik", "congratulations", "won", "inami", "prize", "lottery", "benazir income support"])
        advance_fee = any(kw in text_lower for kw in ["advance fee", "delivery fee", "transfer fee", "processing fee", "registration charges"])

        is_promotional = any(kw in text_lower for kw in PROMOTIONAL_KEYWORDS)
        is_transactional = any(kw in text_lower for kw in ["receipt", "invoice", "statement", "order delivered", "tracking number"])

        # Determine overall classification
        is_phishing = has_phishing_url or otp_requested or pin_requested or (prize_lure and advance_fee) or nlp_res.get("is_social_engineering", False)

        # 6. Call Log CSV Parsing (if provided)
        call_log_analysis = self._parse_call_log_csv(call_log_csv) if call_log_csv else None
        if call_log_analysis and call_log_analysis.get("robocall_risk") == "HIGH":
            indicators.append("Call log pattern reveals high-frequency automated robocall bursts.")

        # 7. Email Header Parsing (if provided)
        header_analysis = self._parse_email_headers(email_headers) if email_headers else None

        # Evidence conflicts check
        if is_promotional and is_phishing:
            conflicts.append("Message contains marketing discounts alongside credential harvesting phrases.")

        # Formulate reasoning
        if is_phishing:
            verdict = "SUSPECTED_CYBER_FRAUD"
            reasoning = (
                "High-risk threat indicators detected: message demands credentials, banking OTPs, or includes "
                "suspicious links impersonating established Pakistani financial or government institutions."
            )
            risk_level = PrivacyRiskLevel.CRITICAL if (otp_requested or pin_requested) else PrivacyRiskLevel.HIGH
            recommended_action = RemediationActionType.BLOCK_SENDER
        elif is_promotional:
            verdict = "PROMOTIONAL_MARKETING_SPAM"
            reasoning = (
                "Message represents routine commercial marketing or promotional advertising. "
                "No malicious links, credential theft, or banking impersonation detected."
            )
            risk_level = PrivacyRiskLevel.LOW
            recommended_action = RemediationActionType.UNSUBSCRIBE
        elif is_transactional:
            verdict = "TRANSACTIONAL_NOTIFICATION"
            reasoning = "Message contains routine transactional or delivery updates. Exercise standard verification."
            risk_level = PrivacyRiskLevel.CLEAN
            recommended_action = RemediationActionType.REVIEW_PRIVACY
        else:
            verdict = "INCONCLUSIVE_COMMUNICATION"
            reasoning = "Evidence is insufficient to confirm malicious phishing or commercial promotional intent."
            risk_level = PrivacyRiskLevel.LOW
            recommended_action = RemediationActionType.REVIEW_PRIVACY

        return {
            "verdict": verdict,
            "reasoning": reasoning,
            "risk_level": risk_level,
            "recommended_action": recommended_action,
            "is_phishing": is_phishing,
            "is_promotional": is_promotional,
            "is_transactional": is_transactional,
            "otp_requested": otp_requested,
            "pin_requested": pin_requested,
            "urgency_detected": urgency_detected,
            "prize_lure": prize_lure,
            "advance_fee": advance_fee,
            "impersonated_organizations": impersonated_orgs,
            "url_findings": url_findings,
            "nlp_analysis": nlp_res,
            "call_log_analysis": call_log_analysis,
            "header_analysis": header_analysis,
            "conflicts": conflicts,
            "indicators": indicators,
            "analyzed_text_redacted": redact_sensitive_identifiers(combined_text)
        }

    def _parse_call_log_csv(self, csv_data: str) -> Dict[str, Any]:
        """Parses user-provided call log export CSV to detect recurring spam and robocall bursts."""
        reader = csv.reader(io.StringIO(csv_data.strip()))
        rows = list(reader)
        if not rows:
            return {"total_calls": 0, "robocall_risk": "LOW"}

        caller_freq: Dict[str, int] = {}
        for row in rows[1:] if len(rows) > 1 else rows:
            if row:
                num = row[0].strip()
                caller_freq[num] = caller_freq.get(num, 0) + 1

        top_repeat_callers = [{"number": k, "calls_count": v} for k, v in sorted(caller_freq.items(), key=lambda x: x[1], reverse=True)[:5]]
        max_calls = top_repeat_callers[0]["calls_count"] if top_repeat_callers else 0

        return {
            "total_calls_analyzed": len(rows),
            "unique_callers": len(caller_freq),
            "top_repeat_callers": top_repeat_callers,
            "robocall_risk": "HIGH" if max_calls >= 4 else ("MEDIUM" if max_calls >= 2 else "LOW")
        }

    def _parse_email_headers(self, headers_text: str) -> Dict[str, Any]:
        """Inspects email headers for spoofing, SPF/DKIM flags, and Reply-To mismatch."""
        from_match = re.search(r"From:\s*([^\r\n]+)", headers_text, re.IGNORECASE)
        reply_to_match = re.search(r"Reply-To:\s*([^\r\n]+)", headers_text, re.IGNORECASE)
        return_path = re.search(r"Return-Path:\s*([^\r\n]+)", headers_text, re.IGNORECASE)

        from_header = from_match.group(1).strip() if from_match else ""
        reply_to = reply_to_match.group(1).strip() if reply_to_match else ""
        mismatch = bool(from_header and reply_to and from_header != reply_to)

        spf_pass = bool(re.search(r"spf=pass", headers_text, re.IGNORECASE))
        dkim_pass = bool(re.search(r"dkim=pass", headers_text, re.IGNORECASE))

        return {
            "from_header": from_header,
            "reply_to": reply_to,
            "return_path": return_path.group(1).strip() if return_path else "",
            "reply_to_mismatch": mismatch,
            "spf_pass": spf_pass,
            "dkim_pass": dkim_pass,
            "spoofing_suspicion": "HIGH" if (mismatch and not spf_pass) else "LOW"
        }

spam_intelligence_engine = SpamIntelligenceEngine()
