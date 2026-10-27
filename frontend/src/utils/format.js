/**
 * CyberShield AI Date & Metrics Formatting Utilities
 */

/**
 * Formats ISO or epoch timestamp into clean human-readable Pakistani/Editorial style:
 * Example: "27 Oct 2026, 4:24 PM"
 */
export function formatCaseDate(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

/**
 * Provides an honest forensic explanation when model confidence is high
 * alongside low or moderate evidence strength.
 */
export function getConfidenceExplanation(riskLevel, confidence, evidenceStrength) {
  const isHighConf = confidence >= 0.85;
  const isLowEvidence = (evidenceStrength || '').toUpperCase().includes('LOW') || (evidenceStrength || '').toUpperCase().includes('WEAK');

  if (riskLevel === 'INSUFFICIENT_EVIDENCE') {
    return 'The engine deliberately abstains from guessing because fewer than 2 corroborate-able signals were present in the submitted sample.';
  }

  if (riskLevel === 'LOW' && isHighConf) {
    return 'High confidence that no malicious indicators were matched. Evidence volume is naturally minimal because clean samples do not trigger attack indicators.';
  }

  if (isHighConf && isLowEvidence) {
    return 'High model probability based on specific lexical or structural indicators, though corroborating multi-modal signals from other components are limited.';
  }

  return 'Confidence reflects statistical agreement across the active ML models and expert-system rules for this case.';
}

/**
 * Redacts phone numbers, CNIC-like numbers, and account/IBAN numbers for Share-Safe exports.
 */
export function redactSensitiveData(text) {
  if (!text || typeof text !== 'string') return text || '';
  let clean = text;

  // Mask CNICs (e.g., 42101-1234567-1 or 4210112345671)
  clean = clean.replace(/\b\d{5}[- ]\d{7}[- ]\d\b|\b\d{13}\b/g, '[CNIC-REDACTED]');

  // Mask Pakistani IBANs
  clean = clean.replace(/\bPK\d{2}[A-Za-z]{4}\d{16}\b/gi, '[IBAN-REDACTED]');

  // Mask 14-16 digit bank accounts
  clean = clean.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{2,4}\b/g, '[ACCOUNT-REDACTED]');

  // Mask Mobile numbers (03001234567, +923001234567, 0300-1234567)
  clean = clean.replace(/(\+92|0092|0)[- ]?3\d{2}[- ]?\d{7}\b/g, '[PHONE-REDACTED]');

  return clean;
}
