import math
import re
import os
import time
import joblib
import numpy as np
from urllib.parse import urlparse
from typing import Dict, Any, List, Tuple

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data"))
MODEL_PATH = os.path.join(MODEL_DIR, "url_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "url_scaler.joblib")

SUSPICIOUS_TLDS = {
    "xyz", "top", "club", "buzz", "work", "loan", "click", "vip", "fit", "surf",
    "gq", "cf", "ml", "tk", "ga", "country", "kim", "science"
}

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "account", "update", "banking", "online",
    "password", "credential", "otp", "confirm", "security", "wallet", "signin",
    "bisp", "ehsaas", "nadra", "fbr", "hbl", "ubl", "meezan", "alfalah", "jazzcash", "easypaisa"
]

FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "is_domain_ip",
    "subdomain_count",
    "digit_count",
    "digit_ratio",
    "special_char_count",
    "entropy",
    "is_https",
    "has_suspicious_tld",
    "suspicious_keyword_count",
    "has_at_symbol",
    "has_double_slash_redirect",
    "has_hyphen_in_domain",
    "char_continuation_rate"
]

def calculate_shannon_entropy(text: str) -> float:
    """Computes Shannon entropy of a string."""
    if not text:
        return 0.0
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    entropy = 0.0
    length = len(text)
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 4)

def extract_url_features(raw_url: str) -> Dict[str, Any]:
    """
    Extracts structural, lexical, and statistical features inspired by the PhiUSIIL dataset.
    """
    url = raw_url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "http://" + url

    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    full_str = url.lower()

    # 1. URL Length
    url_len = len(url)

    # 2. Domain Length
    domain_len = len(hostname)

    # 3. Is Domain an IP address
    is_ip = 1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname) else 0

    # 4. Subdomain count
    parts = hostname.split(".")
    subdomain_count = max(0, len(parts) - 2) if not is_ip else 0

    # 5. Digits
    digit_count = sum(c.isdigit() for c in url)
    digit_ratio = round(digit_count / max(1, url_len), 4)

    # 6. Special characters
    special_chars = sum(not c.isalnum() for c in url)

    # 7. Entropy
    entropy = calculate_shannon_entropy(url)

    # 8. HTTPS
    is_https = 1 if parsed.scheme == "https" else 0

    # 9. Suspicious TLD
    tld = parts[-1] if len(parts) > 1 and not is_ip else ""
    has_suspicious_tld = 1 if tld in SUSPICIOUS_TLDS else 0

    # 10. Suspicious keywords in URL
    kw_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in full_str)

    # 11. @ symbol
    has_at = 1 if "@" in url else 0

    # 12. Double slash redirect in path
    has_redirect = 1 if "//" in path else 0

    # 13. Hyphen in domain
    has_hyphen = 1 if "-" in hostname else 0

    # 14. Character continuation rate
    max_cont = 1
    cur_cont = 1
    for i in range(1, len(url)):
        if url[i] == url[i-1]:
            cur_cont += 1
            if cur_cont > max_cont:
                max_cont = cur_cont
        else:
            cur_cont = 1

    return {
        "url_length": url_len,
        "domain_length": domain_len,
        "is_domain_ip": is_ip,
        "subdomain_count": subdomain_count,
        "digit_count": digit_count,
        "digit_ratio": digit_ratio,
        "special_char_count": special_chars,
        "entropy": entropy,
        "is_https": is_https,
        "has_suspicious_tld": has_suspicious_tld,
        "suspicious_keyword_count": kw_count,
        "has_at_symbol": has_at,
        "has_double_slash_redirect": has_redirect,
        "has_hyphen_in_domain": has_hyphen,
        "char_continuation_rate": max_cont
    }

class URLThreatClassifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
            except Exception as e:
                print(f"[URLThreatClassifier] Error loading saved model: {e}")

    def predict(self, url: str) -> Dict[str, Any]:
        start_time = time.time()
        features = extract_url_features(url)
        feature_vec = np.array([[features[k] for k in FEATURE_NAMES]])

        # If model is loaded, run inference
        if self.model is not None and self.scaler is not None:
            scaled_vec = self.scaler.transform(feature_vec)
            # Probability of phishing (class 1 in trained binary classifier where 1=phishing, 0=legitimate)
            proba = self.model.predict_proba(scaled_vec)[0]
            phishing_prob = float(proba[1])
            is_phishing = bool(phishing_prob >= 0.50)
            model_name = "RandomForest (PhiUSIIL Trained)"
        else:
            # Deterministic heuristic fallback matching feature rules
            score = 0.0
            if features["is_domain_ip"]: score += 0.40
            if features["has_suspicious_tld"]: score += 0.25
            if features["suspicious_keyword_count"] > 0: score += 0.15 * features["suspicious_keyword_count"]
            if features["has_at_symbol"]: score += 0.30
            if features["has_double_slash_redirect"]: score += 0.25
            if features["entropy"] > 4.5: score += 0.15
            if features["url_length"] > 75: score += 0.10
            if features["subdomain_count"] >= 3: score += 0.15
            if not features["is_https"]: score += 0.10
            phishing_prob = min(0.99, max(0.01, round(score, 4)))
            is_phishing = phishing_prob >= 0.50
            model_name = "Heuristic Phishing Scorer (Uncalibrated Fallback)"

        # Generate interpretable signals for explainability
        top_signals = []
        if features["is_domain_ip"]:
            top_signals.append({
                "feature": "IP Address Host",
                "severity": "HIGH",
                "desc": "URL uses a raw IP address instead of a legitimate registered domain name."
            })
        if features["has_suspicious_tld"]:
            top_signals.append({
                "feature": "High-Risk TLD",
                "severity": "MEDIUM",
                "desc": "Uses a top-level domain frequently abused by ephemeral cyber-fraud campaigns."
            })
        if features["suspicious_keyword_count"] > 0:
            top_signals.append({
                "feature": f"{features['suspicious_keyword_count']} Target Keywords",
                "severity": "HIGH",
                "desc": "Contains high-risk target keywords (e.g. login, verify, banking, otp, bisp)."
            })
        if features["entropy"] > 4.2:
            top_signals.append({
                "feature": "High Character Entropy",
                "severity": "MEDIUM",
                "desc": f"Entropy of {features['entropy']} indicates random or obfuscated string composition."
            })
        if features["has_at_symbol"]:
            top_signals.append({
                "feature": "@ Credential Delimiter",
                "severity": "CRITICAL",
                "desc": "Contains '@' character often used to trick users into viewing fake prefixes."
            })
        if features["subdomain_count"] >= 3:
            top_signals.append({
                "feature": "Excessive Subdomains",
                "severity": "MEDIUM",
                "desc": f"{features['subdomain_count']} subdomain levels used to mimic legitimate infrastructure."
            })
        if features["url_length"] > 80:
            top_signals.append({
                "feature": "Unusual Length",
                "severity": "LOW",
                "desc": f"Length of {features['url_length']} characters exceeds typical benign URLs."
            })

        latency = (time.time() - start_time) * 1000.0

        return {
            "url": url,
            "is_phishing": is_phishing,
            "phishing_probability": round(phishing_prob, 4),
            "model_name": model_name,
            "features": features,
            "top_signals": top_signals,
            "latency_ms": round(latency, 2)
        }

url_classifier = URLThreatClassifier()
