import socket
from urllib.parse import urlparse
from typing import Dict, Any, List
from app.core.security import validate_url_safe_for_network

KNOWN_LEGITIMATE_DOMAINS = {
    "google.com", "microsoft.com", "apple.com", "github.com", "wikipedia.org",
    "gov.pk", "pakistan.gov.pk", "pkcert.gov.pk", "nccia.gov.pk", "fbr.gov.pk",
    "bisp.gov.pk", "nadra.gov.pk", "pta.gov.pk", "sbp.org.pk",
    "hbl.com", "ubldigital.com", "meezanbank.com", "bankalfalah.com", "mcb.com.pk",
    "jazzcash.com.pk", "easypaisa.com.pk", "daraz.pk"
}

KNOWN_MALICIOUS_PATTERNS = [
    "bisp-funds", "jeeto-pakistan", "hbl-verify", "easypaisa-bonus", "jazzcash-lottery",
    "fia-notice", "police-warrant", "customs-duty", "pta-unlock"
]

PKCERT_ADVISORIES = [
    {
        "id": "PKCERT-ADV-2026-004",
        "title": "Advisory on Smishing & Credential Harvesting via SMS/WhatsApp Impersonating Commercial Banks",
        "date": "2026-09-15",
        "severity": "CRITICAL",
        "summary": "Fraudsters sending spoofed SMS alleging account blockage and directing users to counterfeit bank portals to harvest OTPs."
    },
    {
        "id": "PKCERT-ADV-2026-003",
        "title": "Advisory on Fraudulent Social Support (BISP/Ehsaas) Lottery Schemes",
        "date": "2026-08-20",
        "severity": "HIGH",
        "summary": "Unsolicited WhatsApp/SMS notifications promising cash disbursements under BISP requesting advance processing fees via mobile wallets."
    },
    {
        "id": "PKCERT-ADV-2026-002",
        "title": "Advisory on Fake Postal Customs Clearance and Courier SMS Fraud",
        "date": "2026-06-11",
        "severity": "HIGH",
        "summary": "Phishing text messages claiming detained international parcels with links demanding credit card details for small release charges."
    }
]

class ExternalThreatIntelligence:
    def __init__(self):
        pass

    def check_url_reputation(self, url: str) -> Dict[str, Any]:
        """
        Inspects domain against known threat indicators and PKCERT advisories with SSRF guard.
        Does NOT execute remote code or active web rendering.
        """
        parsed = urlparse(url if "://" in url else "http://" + url)
        hostname = (parsed.hostname or "").lower()

        is_safe_net, net_msg = validate_url_safe_for_network(url)

        # Check known legitimate domains
        is_known_legit = any(hostname == d or hostname.endswith("." + d) for d in KNOWN_LEGITIMATE_DOMAINS)

        # Check known malicious campaign keywords
        matches_malicious_feed = any(pat in hostname or pat in (parsed.path or "").lower() for pat in KNOWN_MALICIOUS_PATTERNS)

        # Correlate with PKCERT advisories
        correlated_advisories = []
        if "bank" in hostname or "hbl" in hostname or "ubl" in hostname or "meezan" in hostname:
            correlated_advisories.append(PKCERT_ADVISORIES[0])
        if "bisp" in hostname or "ehsaas" in hostname or "prize" in hostname or "jeeto" in hostname:
            correlated_advisories.append(PKCERT_ADVISORIES[1])
        if "post" in hostname or "parcel" in hostname or "courier" in hostname:
            correlated_advisories.append(PKCERT_ADVISORIES[2])

        return {
            "queried_url": url,
            "hostname": hostname,
            "network_safety": {
                "safe_for_retrieval": is_safe_net,
                "message": net_msg
            },
            "domain_reputation": {
                "known_legitimate": is_known_legit,
                "known_malicious_feed_match": matches_malicious_feed,
                "category": "Verified Trusted" if is_known_legit else ("Known Threat Feed Match" if matches_malicious_feed else "Neutral / Unrated")
            },
            "pkcert_correlated_advisories": correlated_advisories,
            "metadata": {
                "provider": "CyberShield Local Threat Intelligence Engine & PKCERT Feed Cache",
                "rate_limit": "Internal Cache (No API Key Required)",
                "data_retention": "Zero-Retention Static Lookups"
            }
        }

threat_intel = ExternalThreatIntelligence()
