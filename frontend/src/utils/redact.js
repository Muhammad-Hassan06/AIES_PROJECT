/**
 * redactSensitiveData
 * Mask sensitive Pakistani identifiers (CNIC, phone numbers, bank accounts, cards, OTPs)
 * for safe sharing with family, law enforcement, or bank support.
 */

export function maskCnic(text) {
  if (!text) return '';
  // Formatted CNIC: 12345-1234567-1 -> 12345-*******-1
  let result = text.replace(/\b(\d{5})[- ]?(\d{7})[- ]?(\d{1})\b/g, '$1-*******-$3');
  return result;
}

export function maskPhoneNumber(text) {
  if (!text) return '';
  // Pakistani mobile: +92-3xx-xxxxxxx or 03xx-xxxxxxx or +923xxxxxxxxx or 03xxxxxxxxx
  // e.g., +92-301-8891029 -> +92-301-***-1029 or 0312-9988112 -> 0312-***-8112
  let result = text.replace(/(\+92[- ]?3\d{2}|03\d{2})[- ]?(\d{3})[- ]?(\d{4})/g, '$1-***-$3');
  // General fallback for unformatted 11-digit numbers starting with 03
  result = result.replace(/\b(03\d{2})(\d{3})(\d{4})\b/g, '$1-***-$3');
  return result;
}

export function maskBankAccount(text) {
  if (!text) return '';
  // Pakistani IBAN: PK followed by 2 digits, 4 letters bank code, and 16 digits
  let result = text.replace(/\b(PK\d{2})[A-Z]{4}\d{12}(\d{4})\b/gi, '$1-****-****-$2');
  // 16-digit credit/debit card numbers
  result = result.replace(/\b(\d{4})[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{4})\b/g, '$1-****-****-$4');
  return result;
}

export function maskOtp(text) {
  if (!text) return '';
  // Mentions of OTP or PIN followed by 4-6 digits: e.g. "OTP 882910" or "PIN: 1234"
  return text.replace(/(otp|pin|code|password)[:\s]+([0-9]{4,6})\b/gi, '$1: [REDACTED]');
}

export function redactSensitiveData(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;
  cleaned = maskCnic(cleaned);
  cleaned = maskPhoneNumber(cleaned);
  cleaned = maskBankAccount(cleaned);
  cleaned = maskOtp(cleaned);
  return cleaned;
}

export function generateShareSafeReport(report) {
  if (!report) return '';
  const caseId = report.case_id || 'UNKNOWN';
  const risk = (report.risk_level || 'LOW').toUpperCase();
  const summary = redactSensitiveData(report.executive_summary || '');
  const recActions = (report.recommended_actions || []).map((a, i) => `${i + 1}. ${a}`).join('\n');
  const warnings = (report.key_warnings || []).map(w => `• ${redactSensitiveData(w)}`).join('\n');

  return `[CyberShield AI Share-Safe Forensic Summary]
Case Reference: ${caseId}
Risk Level: ${risk}
Confidence: ${Math.round((report.model_confidence || 0) * 100)}%

Summary:
${summary}

Immediate Safety Advice:
${recActions || 'Do not click links or share verification codes.'}

${warnings ? `Key Red Flags Detected:\n${warnings}\n` : ''}
*Note: Personal Identifiers (CNIC, phone numbers, account digits) have been automatically redacted for privacy.*
For official reporting, contact NCCIA at 9999 or complaint.nccia.gov.pk`;
}
