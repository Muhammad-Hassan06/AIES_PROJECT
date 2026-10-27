import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

function TestComponent() {
  const { language, setLanguage, t, isRtl } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="is-rtl">{isRtl ? 'RTL' : 'LTR'}</span>
      <span data-testid="translated-title">{t('app_title')}</span>
      <button onClick={() => setLanguage('ur')}>Switch Urdu</button>
      <button onClick={() => setLanguage('ro')}>Switch Roman</button>
      <button onClick={() => setLanguage('en')}>Switch English</button>
    </div>
  );
}

describe('LanguageContext', () => {
  it('renders default English language and updates to Urdu with RTL', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('is-rtl').textContent).toBe('LTR');
    expect(screen.getByTestId('translated-title').textContent).toBe('CyberShield AI');

    // Switch to Urdu
    fireEvent.click(screen.getByText('Switch Urdu'));
    expect(screen.getByTestId('current-lang').textContent).toBe('ur');
    expect(screen.getByTestId('is-rtl').textContent).toBe('RTL');
    expect(screen.getByTestId('translated-title').textContent).toBe('سائبر شیلڈ اے آئی');

    // Switch to Roman Urdu
    fireEvent.click(screen.getByText('Switch Roman'));
    expect(screen.getByTestId('current-lang').textContent).toBe('ro');
    expect(screen.getByTestId('is-rtl').textContent).toBe('LTR');
  });
});
