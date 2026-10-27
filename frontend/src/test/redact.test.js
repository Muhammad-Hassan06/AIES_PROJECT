import { describe, it, expect } from 'vitest';
import { maskCnic, maskPhoneNumber, maskBankAccount, maskOtp, redactSensitiveData } from '../utils/redact';

describe('redactSensitiveData utility', () => {
  it('masks CNIC numbers properly', () => {
    const text = 'Victim CNIC is 42101-1234567-1 recorded in report';
    expect(maskCnic(text)).toBe('Victim CNIC is 42101-*******-1 recorded in report');
  });

  it('masks Pakistani mobile numbers', () => {
    const text = 'Fraud caller used 0312-9988112 and +92-301-8891029 to call';
    const redacted = maskPhoneNumber(text);
    expect(redacted).toContain('0312-***-8112');
    expect(redacted).toContain('+92-301-***-1029');
    expect(redacted).not.toContain('9988112');
    expect(redacted).not.toContain('8891029');
  });

  it('masks bank accounts and card numbers', () => {
    const text = 'Transfer to PK36MEZN0001234567890123 or card 4123-4567-8901-2345';
    const redacted = maskBankAccount(text);
    expect(redacted).not.toContain('0001234567890123');
    expect(redacted).not.toContain('4567-8901');
    expect(redacted).toContain('2345');
  });

  it('masks OTP codes in urgent messages', () => {
    const text = 'Your OTP: 882910 is required immediately. PIN 4912';
    const redacted = maskOtp(text);
    expect(redacted).not.toContain('882910');
    expect(redacted).toContain('[REDACTED]');
  });

  it('handles empty and null inputs safely', () => {
    expect(redactSensitiveData('')).toBe('');
    expect(redactSensitiveData(null)).toBe('');
  });
});
