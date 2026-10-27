import ipaddress
import re
import socket
from urllib.parse import urlparse
from typing import Tuple, Optional

# Disallowed IP networks for SSRF protection
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("10.0.0.0/8"),       # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),    # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),   # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local / Cloud metadata
    ipaddress.ip_network("0.0.0.0/8"),        # Current network
    ipaddress.ip_network("224.0.0.0/4"),      # Multicast
    ipaddress.ip_network("240.0.0.0/4"),      # Reserved
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 private
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]

SUSPICIOUS_PROMPT_INJECTIONS = [
    r"ignore (all )?previous instructions",
    r"disregard the system prompt",
    r"you are now in developer mode",
    r"output the raw prompt",
    r"jailbreak",
    r"system override",
]

def sanitize_url(raw_url: str) -> str:
    """Strip whitespace and dangerous control characters from raw URL."""
    if not raw_url:
        return ""
    cleaned = raw_url.strip().replace("\r", "").replace("\n", "").replace("\t", "")
    if not (cleaned.startswith("http://") or cleaned.startswith("https://")):
        cleaned = "http://" + cleaned
    return cleaned

def validate_url_safe_for_network(url: str) -> Tuple[bool, str]:
    """
    Validates that a URL does not resolve to private, loopback, or metadata addresses (SSRF defense).
    Returns (is_safe, error_message).
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: hostname could not be extracted"

        # Check raw IP directly if provided
        try:
            ip_obj = ipaddress.ip_address(hostname)
            for net in BLOCKED_IP_NETWORKS:
                if ip_obj in net:
                    return False, f"SSRF Blocked: Destination IP {hostname} is in prohibited private/reserved space."
        except ValueError:
            # It's a domain name, resolve it through DNS safely
            try:
                resolved_ips = socket.getaddrinfo(hostname, None)
                for res in resolved_ips:
                    ip_str = res[4][0]
                    ip_obj = ipaddress.ip_address(ip_str)
                    for net in BLOCKED_IP_NETWORKS:
                        if ip_obj in net:
                            return False, f"SSRF Blocked: Domain {hostname} resolves to prohibited internal address ({ip_str})."
            except (socket.gaierror, socket.herror) as e:
                return False, f"DNS resolution failed: {str(e)}"

        # Restrict ports to standard HTTP/HTTPS
        port = parsed.port
        if port and port not in (80, 443, 8080, 8443):
            return False, f"Prohibited port: {port}. Only standard web ports (80, 443) are allowed."

        return True, "URL is safe for network inspection"
    except Exception as e:
        return False, f"URL validation error: {str(e)}"

def sanitize_evidence_text(text: str) -> Tuple[str, bool]:
    """
    Sanitizes untrusted message/email text to prevent prompt injection attacks when fed into LLMs.
    Returns (sanitized_text, injection_detected).
    """
    if not text:
        return "", False

    injection_detected = False
    sanitized = text

    for pattern in SUSPICIOUS_PROMPT_INJECTIONS:
        if re.search(pattern, text, re.IGNORECASE):
            injection_detected = True
            sanitized = re.sub(pattern, "[PROMPT_INJECTION_FLAGGED]", sanitized, flags=re.IGNORECASE)

    # Truncate overly long text payloads to protect against DOS
    if len(sanitized) > 20000:
        sanitized = sanitized[:20000] + "\n[TEXT TRUNCATED FOR SECURITY]"

    return sanitized, injection_detected

def validate_image_header(file_bytes: bytes) -> Tuple[bool, str]:
    """
    Validates magic bytes of uploaded image files.
    """
    if len(file_bytes) < 8:
        return False, "File too small or empty"

    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return True, "image/png"
    # JPEG magic bytes: FF D8 FF
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return True, "image/jpeg"
    # WebP magic bytes: RIFF....WEBP
    if file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[:16]:
        return True, "image/webp"

    return False, "Unsupported file format. Only PNG, JPEG, and WebP are allowed."

def redact_sensitive_identifiers(text: str) -> str:
    """
    Redacts Pakistani PII identifiers for 'Share-Safe' export:
    - National Identity Cards (CNIC: XXXXX-XXXXXXX-X)
    - Mobile and landline phone numbers (+92 3XX-XXXXXXX, 03XXXXXXXXX)
    - Pakistani IBANs (PKXX ABCD XXXXXXXXXXXXXXXX) and standard 12-16 digit bank accounts
    """
    if not text:
        return ""

    redacted = text

    # Redact Pakistani CNICs: 5 digits - 7 digits - 1 digit
    cnic_pattern = r"\b\d{5}[- ]\d{7}[- ]\d\b|\b\d{13}\b"
    redacted = re.sub(cnic_pattern, "[CNIC-REDACTED]", redacted)

    # Redact Pakistani IBANs (PK followed by 2 digits, 4 letters, 16 digits)
    iban_pattern = r"\bPK\d{2}[A-Za-z]{4}\d{16}\b"
    redacted = re.sub(iban_pattern, "[IBAN-REDACTED]", redacted, flags=re.IGNORECASE)

    # Redact 14-16 digit bank account numbers
    acct_pattern = r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{2,4}\b"
    redacted = re.sub(acct_pattern, "[ACCOUNT-REDACTED]", redacted)

    # Redact Pakistani Mobile Numbers (+92-3XX-XXXXXXX, 03XXXXXXXXX)
    pk_phone_pattern = r"(\+92|0092|0)[- ]?3\d{2}[- ]?\d{7}\b"
    redacted = re.sub(pk_phone_pattern, "[PHONE-REDACTED]", redacted)

    return redacted
