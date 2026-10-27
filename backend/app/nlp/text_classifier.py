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
        "pattern": r"\b(otp|one[- ]time password|passcode|pin code|atm pin|password|login credentials|cnic number|card number|cvv)\b",
        "explanation": "Requesting one-time passwords, PINs, or credentials directly violates legitimate authentication protocols."
    },
    {
        "category": "Urgency & Pressure",
        "pattern": r"\b(urgent(ly)?|immediately|within \d+ (hours?|minutes?)|immediate action|account will be blocked|deactivat(ed|ion)|final notice|suspended immediately|act now|expires in)\b",
        "explanation": "Artificial deadlines and panic inducement coerce victims into acting before verifying authenticity."
    },
    {
        "category": "Legal & Intimidation Threat",
        "pattern": r"\b(arrest warrant|fia|police|court notice|legal action|fir|penalty|fine of rs|prosecuted|detained)\b",
        "explanation": "Threatening legal arrest or law enforcement penalties is a high-pressure coercion tactic."
    },
    {
        "category": "Financial / Fee Request",
        "pattern": r"\b(processing fee|customs duty|clearance charge|advance payment|tax payment|transfer rs\.? ?\d+|wire money|deposit)\b",
        "explanation": "Demanding advance fees or unusual processing charges before prize or parcel delivery is typical advance-fee fraud."
    },
    {
        "category": "Prize & Lottery Lure",
        "pattern": r"\b(won rs\.? ?\d+|prize of rs|lottery winner|lucky draw|jeeto pakistan|congratulations you won|claim reward|unclaimed grant)\b",
        "explanation": "Unsolicited large cash rewards or lottery wins entice victims into fraudulent fee payment or credential sharing."
    },
    {
        "category": "Institutional Impersonation",
        "pattern": r"\b(hbl|ubl|meezan bank|bank alfalah|mcb|allied bank|state bank of pakistan|sbp|bisp|ehsaas program|nadra|fbr|pakistan post|tcs courier|jazzcash|easypaisa)\b",
        "explanation": "Invoking reputable institutions or Pakistani public programs gives false credibility to the communication."
    },
    {
        "category": "Verification Bypass",
        "pattern": r"\b(bypass verification|do not tell anyone|secret procedure|direct agent|offline verification)\b",
        "explanation": "Instructing the recipient to bypass official channels or keep communications secret."
    },
    {
        "category": "Roman Urdu Fraud Cue",
        "pattern": r"\b(inaam|mubarak ho|paise jeet|parchi|account band|bisp raqam|code bhejein|jaldi karein|easypaisa pin|jazzcash account)\b",
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
            proba = self.model.predict_proba(vec)[0]
            # Class 1 = Social Engineering / Fraud
            risk_score = float(proba[1])
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
