import re
import hmac
import hashlib
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

PK_PREFIX_MAP = {
    "0300": "Jazz (Mobilink)", "0301": "Jazz (Mobilink)", "0302": "Jazz (Mobilink)",
    "0303": "Jazz (Mobilink)", "0304": "Jazz (Mobilink)", "0305": "Jazz (Mobilink)",
    "0306": "Jazz (Mobilink)", "0307": "Jazz (Mobilink)", "0308": "Jazz (Mobilink)",
    "0309": "Jazz (Mobilink)", "0320": "Warid / Jazz", "0321": "Warid / Jazz",
    "0322": "Warid / Jazz", "0323": "Warid / Jazz", "0324": "Warid / Jazz",
    "0325": "Warid / Jazz",
    "0310": "Zong (CMPak)", "0311": "Zong (CMPak)", "0312": "Zong (CMPak)",
    "0313": "Zong (CMPak)", "0314": "Zong (CMPak)", "0315": "Zong (CMPak)",
    "0316": "Zong (CMPak)", "0317": "Zong (CMPak)", "0318": "Zong (CMPak)",
    "0330": "Ufone (PTCL)", "0331": "Ufone (PTCL)", "0332": "Ufone (PTCL)",
    "0333": "Ufone (PTCL)", "0334": "Ufone (PTCL)", "0335": "Ufone (PTCL)",
    "0336": "Ufone (PTCL)", "0337": "Ufone (PTCL)",
    "0340": "Telenor Pakistan", "0341": "Telenor Pakistan", "0342": "Telenor Pakistan",
    "0343": "Telenor Pakistan", "0344": "Telenor Pakistan", "0345": "Telenor Pakistan",
    "0346": "Telenor Pakistan", "0347": "Telenor Pakistan", "0348": "Telenor Pakistan",
    "0349": "Telenor Pakistan",
    "0355": "SCOM (Special Communications Org - AJK/GB)"
}

DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "yopmail.com", "trashmail.com", "sharklasers.com", "throwawaymail.com"
}

def normalize_email(email_str: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates and normalizes an email address.
    Returns (is_valid, error_or_normalized, metadata).
    """
    if not email_str or not isinstance(email_str, str):
        return False, "Email address is required and cannot be empty.", {}

    cleaned = email_str.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        return False, f"Invalid email format: '{email_str}'. Must follow user@domain.tld.", {}

    parts = cleaned.split("@")
    user_part, domain_part = parts[0], parts[1]

    is_disposable = domain_part in DISPOSABLE_DOMAINS
    meta = {
        "raw": email_str,
        "normalized": cleaned,
        "domain": domain_part,
        "user_part": user_part,
        "is_disposable": is_disposable,
        "masked": mask_email(cleaned),
        "hmac_hash": compute_identifier_hmac(cleaned)
    }
    return True, cleaned, meta

def mask_email(email: str) -> str:
    """Masks email for UI display and telemetry (e.g. j***e@domain.com)."""
    if not email or "@" not in email:
        return "[INVALID-EMAIL]"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "***"
    else:
        masked_user = user_part[0] + "***" + user_part[-1]
    return f"{masked_user}@{domain}"

def normalize_phone(phone_str: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates and normalizes phone numbers with specialized Pakistani carrier detection
    and configurable international parsing.
    Returns (is_valid, error_or_e164, metadata).
    """
    if not phone_str or not isinstance(phone_str, str):
        return False, "Phone number is required and cannot be empty.", {}

    # Strip formatting: spaces, dashes, parentheses, dots
    digits_clean = re.sub(r"[\s\-\(\)\.]", "", phone_str.strip())

    # Check for Pakistani mobile patterns
    # Formats: 03XXXXXXXXX (11 digits), +923XXXXXXXXX, 00923XXXXXXXXX, 923XXXXXXXXX
    is_pk = False
    e164 = ""
    national = ""
    carrier = "International / Other"

    if re.match(r"^03\d{9}$", digits_clean):
        is_pk = True
        national = digits_clean
        e164 = "+92" + digits_clean[1:]
    elif re.match(r"^\+923\d{9}$", digits_clean):
        is_pk = True
        e164 = digits_clean
        national = "0" + digits_clean[3:]
    elif re.match(r"^00923\d{9}$", digits_clean):
        is_pk = True
        e164 = "+92" + digits_clean[4:]
        national = "0" + digits_clean[4:]
    elif re.match(r"^923\d{9}$", digits_clean):
        is_pk = True
        e164 = "+" + digits_clean
        national = "0" + digits_clean[2:]

    if is_pk:
        prefix = national[:4]
        carrier = PK_PREFIX_MAP.get(prefix, "Pakistani Mobile Operator")
        display = f"+92-{national[1:4]}-{national[4:]}"
        meta = {
            "is_pakistani": True,
            "carrier": carrier,
            "national_format": national,
            "e164": e164,
            "display": display,
            "masked": mask_phone(e164),
            "hmac_hash": compute_identifier_hmac(e164)
        }
        return True, e164, meta

    # Generic international number check (E.164: + followed by 7 to 15 digits)
    intl_clean = digits_clean
    if not intl_clean.startswith("+"):
        if intl_clean.startswith("00"):
            intl_clean = "+" + intl_clean[2:]
        elif len(intl_clean) >= 10:
            intl_clean = "+" + intl_clean

    if re.match(r"^\+[1-9]\d{6,14}$", intl_clean):
        meta = {
            "is_pakistani": False,
            "carrier": "International Carrier",
            "national_format": intl_clean[1:],
            "e164": intl_clean,
            "display": intl_clean,
            "masked": mask_phone(intl_clean),
            "hmac_hash": compute_identifier_hmac(intl_clean)
        }
        return True, intl_clean, meta

    return False, f"Invalid phone format: '{phone_str}'. Expected Pakistani (e.g. 0300-1234567, +923001234567) or standard E.164.", {}

def mask_phone(phone_e164: str) -> str:
    """Masks phone number for safe display (e.g. +92-300-***-4567)."""
    if not phone_e164:
        return "[INVALID-PHONE]"
    digits = re.sub(r"\D", "", phone_e164)
    if len(digits) >= 10:
        # e.g. 92 300 1234567 -> +92-300-***-4567
        if phone_e164.startswith("+92") or phone_e164.startswith("92"):
            sub = digits[2:] if digits.startswith("92") else digits
            if len(sub) == 10:
                return f"+92-{sub[:3]}-***-{sub[-4:]}"
        return f"{phone_e164[:4]}-***-{phone_e164[-3:]}"
    return "[PHONE-REDACTED]"

def compute_identifier_hmac(identifier: str) -> str:
    """Computes keyed HMAC-SHA256 hash of an identifier for privacy-preserving index lookups."""
    secret = settings.HMAC_SECRET_KEY.encode("utf-8")
    data = identifier.strip().lower().encode("utf-8")
    return hmac.new(secret, data, hashlib.sha256).hexdigest()
