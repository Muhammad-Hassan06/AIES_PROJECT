import re
import os
import time
import joblib
from typing import Dict, Any, List
from app.models.schemas import HighlightedSpan

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data"))
NLP_MODEL_PATH = os.path.join(MODEL_DIR, "nlp_model.joblib")
TFIDF_PATH = os.path.join(MODEL_DIR, "nlp_tfidf.joblib")

# Category Patterns for Span Extraction and Signal Detection
SPAN_PATTERNS = [
    {
        "category": "Credential Harvesting",
        "pattern": r"\b(cnic(\s*(?:number|no\.?|card))?|otp|one[- ]time password|passcode|pin code|atm pin|password|login credentials|card number|cvv|seed phrase|recovery seed|mpin|verify your account|confirm your identity|verify identity|enter your card|account locked|access your account|sign in to|click here to verify|update your information|confirm account|account alert|unusual sign.?in|unauthorized access|new device detected|suspicious login|verify now|re.?verify|update billing|enter pin|reset password|reset your password)\b",
        "explanation": "Requesting one-time passwords, PINs, CNIC, or credentials directly violates legitimate authentication protocols."
    },
    {
        "category": "Urgency & Pressure",
        "pattern": r"\b(foran|jaldi|abhe|abhi|urgent(ly)?|immediately|within \d+ (hours?|minutes?)|immediate action|account will be (blocked|closed|terminated)|deactivat(ed|ion)|final notice|suspended immediately|act now|expires in|your account has been|limited access|restricted|we noticed|security alert|verify within|action required|review required)\b",
        "explanation": "Artificial deadlines, coercive haste, and panic inducement coerce victims into acting before verifying authenticity."
    },
    {
        "category": "Legal & Intimidation Threat",
        "pattern": r"\b(arrest warrant|fia|police|court notice|legal action|fir|penalty|fine of rs|prosecuted|detained|imei is blocked|meter will be disconnected|permanently blocked|copyright|banned in \d+)\b",
        "explanation": "Threatening legal arrest, penalties, or service disconnection is a high-pressure coercion tactic."
    },
    {
        "category": "Financial / Fee Request",
        "pattern": r"\b(processing fee|customs duty|unpaid duty|duty of|clearance charge|advance payment|tax payment|registration fee|redelivery fee|re-delivery fee|delivery charges?|deposit|wire money|transfer rs\.? ?\d+|western union|processing charges?)\b",
        "explanation": "Demanding advance fees or unusual processing charges before prize or parcel delivery is typical advance-fee fraud."
    },
    {
        "category": "Prize & Lottery Lure",
        "pattern": r"\b(won rs\.? ?\d+|prize of rs|cash prize|lottery winner|lucky draw|jeeto pakistan|congratulations you won|claim reward|unclaimed grant|\$\d+ freebies|freebies|free gift|gift card|survey mate|reward survey|scholarship|laptop scholarship|free iphone|100 gb free|cash grant|grant approved|beneficiary|financial assistance|\d+[\d,]*\s*(?:rupay|rupees|rs|pkr|account mein|account me))\b",
        "explanation": "Unsolicited cash rewards, survey freebies, or lottery wins entice victims into fraudulent fee payment or credential sharing."
    },
    {
        "category": "Institutional Impersonation",
        "pattern": r"\b(hbl|ubl|meezan bank|bank alfalah|mcb|allied bank|state bank of pakistan|sbp|bisp|ehsaas program|ehsaas|nadra|fbr|pta|pakistan post|tcs courier|fedex|dhl|ups|jazzcash|easypaisa|amazon|microsoft|apple|google|netflix|paypal|binance|metamask|state life|bank of america|bankofamerica|chase bank|wells fargo|wellsfargo|citibank|barclays|hsbc|standard chartered|td bank|us bank|capital one|american express|amex)\b",
        "explanation": "Invoking reputable brands, institutions, or public programs gives false credibility to the communication."
    },
    {
        "category": "Verification Bypass",
        "pattern": r"\b(bypass verification|do not tell anyone|secret procedure|direct agent|offline verification)\b",
        "explanation": "Instructing the recipient to bypass official channels or keep communications secret."
    },
    {
        "category": "Suspicious External Link",
        "pattern": r"(https?://[^\s<>\"']+|[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:top|xyz|info|live|buzz|club|fit|click)[^\s<>\"']*)",
        "explanation": "Contains links pointing to suspicious, high-risk, or non-official domain registrations."
    },
    {
        "category": "Roman Urdu Fraud Cue",
        "pattern": r"\b(inaam|mubarak ho|mubarak|paise jeet|parchi|account band|bisp raqam|bisp|ehsaas|raqam|rupay|rupees|account mein|account me|agaye hain|agye hain|foran|verify karwayen|verify karwaen|verify karain|code bhejein|jaldi karein|jaldi krain|easypaisa pin|jazzcash account|wazeefa manzoor|wazeefa|wazifa|foran rabta|tolay sona)\b",
        "explanation": "Common Roman Urdu phrasing frequently observed in localized SMS and WhatsApp cyber scams in Pakistan."
    }
]

def extract_highlighted_spans(text: str) -> List[HighlightedSpan]:
    """Finds exact character offsets and categorizes suspicious phrases in message text."""
    spans = []
    seen = set()

    for item in SPAN_PATTERNS:
        for match in re.finditer(item["pattern"], text, re.IGNORECASE):
            start, end = match.span()
            matched_text = match.group(0)
            key = (start, end)
            if key not in seen:
                seen.add(key)
                spans.append(HighlightedSpan(
                    start=start,
                    end=end,
                    text=matched_text,
                    category=item["category"],
                    explanation=item["explanation"]
                ))

    # Sort spans by their start offset in text
    spans.sort(key=lambda s: s.start)
    return spans

class SocialEngineeringNLPClassifier:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(NLP_MODEL_PATH) and os.path.exists(TFIDF_PATH):
            try:
                self.model = joblib.load(NLP_MODEL_PATH)
                self.vectorizer = joblib.load(TFIDF_PATH)
            except Exception as e:
                print(f"[NLPClassifier] Error loading saved model: {e}")

    def analyze(self, text: str) -> Dict[str, Any]:
        start_time = time.time()
        clean_text = text.strip() if text else ""
        spans = extract_highlighted_spans(clean_text)

        categories_detected = list(set(s.category for s in spans))
        pakistan_context = [
            s.text for s in spans
            if s.category in ("Institutional Impersonation", "Roman Urdu Fraud Cue")
        ]

        if self.model is not None and self.vectorizer is not None and len(clean_text) > 0:
            vec = self.vectorizer.transform([clean_text])
            if vec.nnz == 0:
                raw_prob = 0.05
            else:
                proba = self.model.predict_proba(vec)[0]
                raw_prob = float(proba[1])

            # Corroborate raw ML score with extracted semantic signals
            if len(spans) == 0:
                # Text contains zero detected regex categories.
                if raw_prob >= 0.75:
                    risk_score = round(raw_prob * 0.85, 3)
                    is_malicious = True
                    model_name = "TF-IDF + MultinomialNB (Strong Statistical Match)"
                else:
                    # Suppress out-of-vocabulary Naive Bayes prior drift on innocent messages.
                    risk_score = min(raw_prob * 0.25, 0.20)
                    is_malicious = False
                    model_name = "TF-IDF + MultinomialNB (Corroborated Legitimate)"
            else:
                # Semantic fraud indicators are corroborated by span analysis
                risk_score = raw_prob
                is_malicious = bool(risk_score >= 0.50)
                model_name = "TF-IDF + MultinomialNB (Social Engineering Corpus)"
        else:
            # Deterministic rule-based score based on span count and severity
            score = 0.0
            for s in spans:
                if s.category == "Credential Harvesting":
                    score += 0.45
                elif s.category == "Legal & Intimidation Threat":
                    score += 0.35
                elif s.category == "Urgency & Pressure":
                    score += 0.25
                elif s.category == "Financial / Fee Request":
                    score += 0.30
                elif s.category == "Prize & Lottery Lure":
                    score += 0.30
                elif s.category == "Institutional Impersonation":
                    score += 0.20
                elif s.category == "Roman Urdu Fraud Cue":
                    score += 0.25

            risk_score = min(0.99, max(0.02, round(score, 4)))
            is_malicious = risk_score >= 0.50
            model_name = "Pattern-Based Semantic NLP Engine (Fallback)"

        # Boost risk if explicit OTP or Credential Harvesting detected
        has_credential_harvesting = any(s.category == "Credential Harvesting" for s in spans)
        if has_credential_harvesting:
            risk_score = max(risk_score, 0.85)
            is_malicious = True

        latency = (time.time() - start_time) * 1000.0

        return {
            "analyzed_text": clean_text,
            "is_social_engineering": is_malicious,
            "risk_score": round(risk_score, 4),
            "categories_detected": categories_detected,
            "highlighted_spans": spans,
            "pakistan_context_detected": pakistan_context,
            "model_name": model_name,
            "latency_ms": round(latency, 2)
        }

text_classifier = SocialEngineeringNLPClassifier()
