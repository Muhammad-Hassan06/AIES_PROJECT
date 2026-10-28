"""
CyberShield AI — Synthetic Development Test Fixtures
Provides 10 fictional test phone numbers (in North American reserved 555-0100..0199 range)
and 10 corresponding synthetic test reports for offline demonstration and testing.

IMPORTANT:
- These are NOT real people or real phone numbers.
- They are NEVER sent to external discovery providers.
- They are isolated in DEMO / DEVELOPMENT mode and excluded from production results.
"""

from typing import List, Dict, Any, Optional
import datetime

SYNTHETIC_TEST_FIXTURES: List[Dict[str, Any]] = [
    {
        "fixture_id": "REP-SYNTH-01",
        "phone_id": "TEST-PHONE-01",
        "phone_number": "+1 202-555-0101",
        "phone_digits": "12025550101",
        "title": "Suspicious Bank Impersonation Alert",
        "scenario": "Suspicious bank impersonation SMS alleging unauthorized debit card charges",
        "message_summary": "URGENT from Chase Alert: Unauthorized $842 charge on your debit card. Call 202-555-0101 immediately to reverse transaction or account will be locked.",
        "category": "BANK_IMPERSONATION",
        "severity": "CRITICAL",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-15T10:00:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-02",
        "phone_id": "TEST-PHONE-02",
        "phone_number": "+1 202-555-0102",
        "phone_digits": "12025550102",
        "title": "Fake Sweepstakes & Lottery Prize Lure",
        "scenario": "Fake prize notification requesting advance processing fee",
        "message_summary": "Congratulations! Your mobile number was selected as 2nd prize winner in National Sweepstakes ($250,000). Call 202-555-0102 to remit $75 processing fee.",
        "category": "PRIZE_LOTTERY_LURE",
        "severity": "HIGH",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-16T11:30:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-03",
        "phone_id": "TEST-PHONE-03",
        "phone_number": "+1 202-555-0103",
        "phone_digits": "12025550103",
        "title": "Package Delivery Fee Phishing Attempt",
        "scenario": "Fake courier SMS claiming parcel detention pending customs fee",
        "message_summary": "USPS Notification: Parcel #US-99120 cannot be delivered due to missing postal code. Call delivery desk at 202-555-0103 to settle $2.85 redelivery charge.",
        "category": "DELIVERY_PHISHING",
        "severity": "HIGH",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-17T14:15:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-04",
        "phone_id": "TEST-PHONE-04",
        "phone_number": "+1 202-555-0104",
        "phone_digits": "12025550104",
        "title": "Fraudulent Remote Job Offer",
        "scenario": "High-paying work-from-home job scam soliciting equipment deposits",
        "message_summary": "Amazon HR: Flexible remote customer agent position available. Earn $45/hour from home. Text recruiter at 202-555-0104 to purchase equipment setup package.",
        "category": "FRAUDULENT_JOB_OFFER",
        "severity": "HIGH",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-18T09:45:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-05",
        "phone_id": "TEST-PHONE-05",
        "phone_number": "+1 202-555-0105",
        "phone_digits": "12025550105",
        "title": "Fake Technical Support Impersonation",
        "scenario": "Tech support pop-up claiming malware infection and demanding remote access",
        "message_summary": "CRITICAL ALERT: Trojan Spyware detected on your computer. Your financial data is exposed. Dial toll-free support at 202-555-0105 to connect to certified technician.",
        "category": "TECH_SUPPORT_FRAUD",
        "severity": "CRITICAL",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-19T16:20:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-06",
        "phone_id": "TEST-PHONE-06",
        "phone_number": "+1 202-555-0106",
        "phone_digits": "12025550106",
        "title": "Suspicious Pre-Approved Loan Offer",
        "scenario": "Predatory instant personal loan scam requesting upfront insurance",
        "message_summary": "Pre-approved: You qualify for an unsecured $15,000 personal loan with 2.5% APR regardless of credit score. Call 202-555-0106 to remit initial insurance deposit.",
        "category": "PREDATORY_LOAN",
        "severity": "HIGH",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-20T12:00:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-07",
        "phone_id": "TEST-PHONE-07",
        "phone_number": "+1 202-555-0107",
        "phone_digits": "12025550107",
        "title": "OTP Request & Account Takeover Scam",
        "scenario": "Deceptive 2FA verification code solicitation for account hijacking",
        "message_summary": "Google Security: Someone attempted to access your account from an unknown device. Reply with the 6-digit verification code sent to your phone or call 202-555-0107.",
        "category": "OTP_HARVESTING",
        "severity": "CRITICAL",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-21T18:10:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-08",
        "phone_id": "TEST-PHONE-08",
        "phone_number": "+1 202-555-0108",
        "phone_digits": "12025550108",
        "title": "Cryptocurrency Investment Solicitation",
        "scenario": "Unsolicited crypto trading scheme promising guaranteed exponential returns",
        "message_summary": "Earn guaranteed 300% weekly return on Bitcoin automated arbitrage algorithm. WhatsApp VIP broker at 202-555-0108 to open starter wallet with $250.",
        "category": "CRYPTO_INVESTMENT_FRAUD",
        "severity": "HIGH",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-22T08:30:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-09",
        "phone_id": "TEST-PHONE-09",
        "phone_number": "+1 202-555-0109",
        "phone_digits": "12025550109",
        "title": "Government Service & Tax Arrest Impersonation",
        "scenario": "Coercive tax authority impersonation threatening arrest or legal action",
        "message_summary": "FINAL LEGAL NOTICE from IRS Enforcement Division: An arrest warrant has been filed against you for tax evasion. Call 202-555-0109 immediately to avoid federal marshals.",
        "category": "GOVERNMENT_IMPERSONATION",
        "severity": "CRITICAL",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-23T15:40:00Z"
    },
    {
        "fixture_id": "REP-SYNTH-10",
        "phone_id": "TEST-PHONE-10",
        "phone_number": "+1 202-555-0110",
        "phone_digits": "12025550110",
        "title": "Repeated Unwanted Promotional Robocalls",
        "scenario": "Persistent aggressive telemarketing robocall for vehicle warranties",
        "message_summary": "Automated robocall alert: We have been trying to reach you regarding your vehicle's expiring extended warranty. Press 1 or call 202-555-0110 to speak to specialist.",
        "category": "PROMOTIONAL_ROBOCALL",
        "severity": "MEDIUM",
        "is_synthetic": True,
        "source_type": "development_fixture",
        "is_verified": False,
        "created_at": "2026-10-24T13:00:00Z"
    }
]

def get_fixture_by_phone(phone_query: str) -> Optional[Dict[str, Any]]:
    """
    Looks up a synthetic fixture by normalized phone number or raw string.
    Only active in development/demo fixtures.
    """
    clean_digits = "".join(c for c in phone_query if c.isdigit())
    if clean_digits.startswith("1") and len(clean_digits) == 11:
        clean_digits = clean_digits[1:]  # normalize 10-digit US
    
    for f in SYNTHETIC_TEST_FIXTURES:
        f_digits = "".join(c for c in f["phone_number"] if c.isdigit())
        if f_digits.startswith("1") and len(f_digits) == 11:
            f_digits = f_digits[1:]
        if clean_digits == f_digits or clean_digits in f_digits or phone_query in f["phone_number"]:
            return f
    return None

def is_synthetic_number(phone_query: str) -> bool:
    return get_fixture_by_phone(phone_query) is not None
