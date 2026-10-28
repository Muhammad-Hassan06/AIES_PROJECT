"""
CyberShield AI — Email Header Authentication & Sender Consistency Analyzer (Feature 2)
Parses raw RFC 5322 email headers and .eml text to audit sender authenticity,
SPF/DKIM/DMARC alignment, and Reply-To discrepancies.
References: M3AAWG Email Authentication Summary & IETF RFC 7489 (DMARC).
"""

import re
from email.parser import HeaderParser
from email.utils import parseaddr
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

class EmailHeaderAuthenticator:
    def __init__(self):
        self.parser = HeaderParser()

    def analyze(self, raw_headers_text: str) -> Dict[str, Any]:
        """
        Parses raw email headers and extracts authentication results, consistency indicators,
        and forensic discrepancies.
        """
        if not raw_headers_text or not raw_headers_text.strip():
            return {
                "error": "No email header content provided.",
                "is_valid_header": False
            }

        msg = self.parser.parsestr(raw_headers_text)
        
        # 1. Core Header Identity Extraction
        from_raw = msg.get("From", "")
        reply_to_raw = msg.get("Reply-To", "")
        return_path_raw = msg.get("Return-Path", "")
        subject = msg.get("Subject", "(No Subject)")
        date_str = msg.get("Date", "")
        message_id = msg.get("Message-ID", "")
        auth_results_raw = msg.get("Authentication-Results", "")
        received_spf_raw = msg.get("Received-SPF", "")
        dkim_sig_raw = msg.get("DKIM-Signature", "")
        received_headers = msg.get_all("Received", [])

        from_name, from_addr = parseaddr(from_raw)
        reply_to_name, reply_to_addr = parseaddr(reply_to_raw)
        _, return_path_addr = parseaddr(return_path_raw)

        from_domain = from_addr.split("@")[-1].lower() if "@" in from_addr else ""
        reply_to_domain = reply_to_addr.split("@")[-1].lower() if "@" in reply_to_addr else ""
        return_path_domain = return_path_addr.split("@")[-1].lower() if "@" in return_path_addr else ""

        # 2. Parse Authentication Results (SPF, DKIM, DMARC)
        spf_status, spf_details = self._parse_spf(auth_results_raw, received_spf_raw)
        dkim_status, dkim_details = self._parse_dkim(auth_results_raw, dkim_sig_raw)
        dmarc_status, dmarc_details = self._parse_dmarc(auth_results_raw)

        # 3. Sender Consistency & Spoofing Analysis
        discrepancies = []
        is_spoof_suspected = False
        confidence = 0.85

        # Check A: Reply-To Discrepancy
        if reply_to_addr and reply_to_addr.lower() != from_addr.lower():
            is_cross_domain = reply_to_domain != from_domain
            discrepancies.append({
                "type": "REPLY_TO_MISMATCH",
                "severity": "HIGH" if is_cross_domain else "MEDIUM",
                "title": "Reply-To Address Divergence",
                "description": f"Emails sent from '{from_addr}' request replies be routed to a different address: '{reply_to_addr}'.",
                "risk_explanation": "Classic phishing tactic where attackers display a reputable corporate sender name but hijack user replies to an external attacker-controlled mailbox."
            })
            if is_cross_domain:
                is_spoof_suspected = True

        # Check B: Envelope Return-Path vs Header From
        if return_path_domain and from_domain and return_path_domain != from_domain:
            discrepancies.append({
                "type": "RETURN_PATH_MISMATCH",
                "severity": "MEDIUM",
                "title": "Envelope Sender Alignment Mismatch",
                "description": f"Header 'From' domain ({from_domain}) does not match envelope bounce path ({return_path_domain}).",
                "risk_explanation": "May indicate legitimate bulk email relays (SendGrid, Mailchimp) OR unauthorized spoofing if SPF/DMARC fails."
            })

        # Check C: Explicit DMARC or SPF Failure
        if dmarc_status == "FAIL":
            discrepancies.append({
                "type": "DMARC_FAILURE",
                "severity": "CRITICAL",
                "title": "DMARC Policy Enforcement Rejection",
                "description": "Sending server failed domain owner's published DMARC authentication policy.",
                "risk_explanation": "The domain owner has explicitly instructed mail servers that this sending IP is unauthorized to send email on their behalf."
            })
            is_spoof_suspected = True

        if spf_status == "FAIL":
            discrepancies.append({
                "type": "SPF_HARD_FAIL",
                "severity": "HIGH",
                "title": "SPF Authentication Failure (-all)",
                "description": "Sending IP address is not listed in the sender domain's SPF record.",
                "risk_explanation": "Sending server is not authorized by the DNS administrator of the sender domain."
            })
            is_spoof_suspected = True

        # Check D: Completely missing authentication
        if spf_status == "NONE" and dkim_status == "NONE" and dmarc_status == "NONE":
            discrepancies.append({
                "type": "AUTHENTICATION_ABSENT",
                "severity": "MEDIUM",
                "title": "Unauthenticated Email Stream",
                "description": "No SPF, DKIM, or DMARC authentication headers detected in message.",
                "risk_explanation": "Email lacks modern cryptographic verification. Any sender could have forged the 'From' address without verification."
            })

        # Determine overall authenticity status
        if is_spoof_suspected or dmarc_status == "FAIL" or spf_status == "FAIL":
            overall_verdict = "SUSPECTED_SPOOFING"
            verdict_badge = "FAIL / HIGH RISK"
        elif spf_status == "PASS" and dkim_status == "PASS" and (dmarc_status in ("PASS", "NONE")) and not discrepancies:
            overall_verdict = "AUTHENTICATED"
            verdict_badge = "PASS"
        elif spf_status == "PASS" or dkim_status == "PASS":
            overall_verdict = "PARTIALLY_AUTHENTICATED"
            verdict_badge = "PARTIAL"
        else:
            overall_verdict = "UNAUTHENTICATED"
            verdict_badge = "UNAUTHENTICATED"

        return {
            "is_valid_header": True,
            "overall_verdict": overall_verdict,
            "verdict_badge": verdict_badge,
            "sender_identity": {
                "from_name": from_name,
                "from_address": from_addr,
                "from_domain": from_domain,
                "reply_to_address": reply_to_addr or None,
                "return_path_address": return_path_addr or None,
                "subject": subject,
                "date": date_str,
                "message_id": message_id
            },
            "authentication_protocols": {
                "spf": {
                    "status": spf_status,
                    "details": spf_details,
                    "explanation": self._explain_spf(spf_status)
                },
                "dkim": {
                    "status": dkim_status,
                    "details": dkim_details,
                    "explanation": self._explain_dkim(dkim_status)
                },
                "dmarc": {
                    "status": dmarc_status,
                    "details": dmarc_details,
                    "explanation": self._explain_dmarc(dmarc_status)
                }
            },
            "discrepancies_detected": discrepancies,
            "received_hops_count": len(received_headers),
            "recommendations": self._generate_recommendations(overall_verdict, discrepancies),
            "forensic_limitations": [
                "Passing SPF/DKIM proves the email came from an authorized server; it does NOT prove the sender's intentions are benign.",
                "Compromised legitimate email accounts pass all cryptographic authentication while distributing real malware or fraud.",
                "Missing DMARC headers may mean the receiving mail server did not record the check, rather than a failure at source."
            ]
        }

    def _parse_spf(self, auth_res: str, rec_spf: str) -> Tuple[str, str]:
        combined = f"{auth_res} {rec_spf}".lower()
        if "spf=pass" in combined or "pass" in rec_spf.lower():
            return "PASS", "Sending server IP is authorized by domain SPF record."
        if "spf=fail" in combined or "fail" in rec_spf.lower():
            return "FAIL", "Sending server IP is explicitly NOT authorized by domain SPF record (-all)."
        if "spf=softfail" in combined:
            return "SOFTFAIL", "Domain SPF record suggests server is unauthorized (~all) but requests acceptance."
        if "spf=neutral" in combined:
            return "NEUTRAL", "Domain owner does not assert whether IP is authorized (?all)."
        return "NONE", "No SPF authentication record found in headers."

    def _parse_dkim(self, auth_res: str, dkim_sig: str) -> Tuple[str, str]:
        auth_lower = auth_res.lower()
        if "dkim=pass" in auth_lower:
            return "PASS", "Cryptographic digital signature matches public key published in domain DNS."
        if "dkim=fail" in auth_lower:
            return "FAIL", "Digital signature verification failed. Body or headers may have been tampered with."
        if dkim_sig:
            return "PRESENT", "DKIM-Signature header is present in message."
        return "NONE", "No DKIM signature detected."

    def _parse_dmarc(self, auth_res: str) -> Tuple[str, str]:
        auth_lower = auth_res.lower()
        if "dmarc=pass" in auth_lower:
            return "PASS", "DMARC policy satisfied (SPF and/or DKIM alignment verified)."
        if "dmarc=fail" in auth_lower:
            return "FAIL", "DMARC policy validation failed. Message sender failed alignment check."
        return "NONE", "No DMARC evaluation entry in Authentication-Results."

    def _explain_spf(self, status: str) -> str:
        if status == "PASS":
            return "Sender Policy Framework verified that the mail server's IP address is authorized to dispatch mail for this domain."
        if status == "FAIL":
            return "SPF Hard Failure: The sending mail server is not listed in the domain's authorized DNS records."
        return "Sender Policy Framework verification was absent or inconclusive."

    def _explain_dkim(self, status: str) -> str:
        if status in ("PASS", "PRESENT"):
            return "DomainKeys Identified Mail verified the message's cryptographic signature, proving it was not altered in transit."
        return "No valid cryptographic DKIM signature was verified."

    def _explain_dmarc(self, status: str) -> str:
        if status == "PASS":
            return "DMARC confirmed alignment between visible 'From' identity and underlying SPF/DKIM authentication."
        if status == "FAIL":
            return "DMARC Rejection: Visible sender header claims to be from a domain whose anti-spoofing policy rejected this dispatch."
        return "DMARC policy status is not declared in available headers."

    def _generate_recommendations(self, verdict: str, discrepancies: List[Dict[str, Any]]) -> List[str]:
        actions = []
        if verdict == "SUSPECTED_SPOOFING":
            actions.append("DO NOT reply to this message or trust instructions requesting funds or credential updates.")
            actions.append("Inspect the visible 'From' address closely — the sending server is NOT authorized by the domain administrator.")
            actions.append("If this email claims to be your bank or employer, contact them via a verified external telephone number.")
        elif verdict == "AUTHENTICATED":
            actions.append("Technical email authentication passed. Verify message content independently if requesting unexpected money transfers.")
        else:
            actions.append("Authentication is missing or partial. Exercise heightened caution before downloading attachments or clicking links.")
        return actions

email_authenticator = EmailHeaderAuthenticator()
