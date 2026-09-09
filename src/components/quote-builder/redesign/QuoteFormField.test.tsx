// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuoteFormField } from './QuoteFormField';
import { QuoteInput } from './QuoteInput';

describe('QuoteFormField', () => {
  it('associates the visible label and error with the input', () => {
    render(
      <QuoteFormField label="Boat make" htmlFor="boat-make" required error="Enter a make">
        <QuoteInput id="boat-make" invalid aria-describedby="boat-make-error" />
      </QuoteFormField>,
    );

    const input = screen.getByLabelText(/Boat make/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a make');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a make');
  });
});
