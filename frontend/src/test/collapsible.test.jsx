import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CollapsibleSection from '../components/CollapsibleSection';

describe('CollapsibleSection', () => {
  it('is collapsed by default and expands on click', () => {
    render(
      <CollapsibleSection id="test-sec" title="Evidence Ledger" badge="3 items">
        <p>Detailed evidence content inside</p>
      </CollapsibleSection>
    );

    // Header visible
    expect(screen.getByText('Evidence Ledger')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();

    // Content should not be visible by default
    expect(screen.queryByText('Detailed evidence content inside')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByRole('button', { name: /Evidence Ledger/i }));
    expect(screen.getByText('Detailed evidence content inside')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByRole('button', { name: /Evidence Ledger/i }));
    expect(screen.queryByText('Detailed evidence content inside')).not.toBeInTheDocument();
  });

  it('respects defaultOpen prop if provided', () => {
    render(
      <CollapsibleSection id="open-sec" title="Open Section" defaultOpen={true}>
        <p>Already opened content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Already opened content')).toBeInTheDocument();
  });
});
