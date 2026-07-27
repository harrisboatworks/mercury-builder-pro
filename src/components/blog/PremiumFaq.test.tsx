// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { PremiumFaq } from './PremiumFaq';

afterEach(cleanup);

describe('PremiumFaq', () => {
  it('renders markdown links instead of exposing markdown syntax', () => {
    const { container } = render(
      <MemoryRouter>
        <PremiumFaq
          faqs={[
            {
              question: 'What costs do buyers forget?',
              answer:
                'Read our [total cost guide](/blog/total-cost-of-owning-a-boat-ontario-2026) before deciding.',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'total cost guide' })).toHaveAttribute(
      'href',
      '/blog/total-cost-of-owning-a-boat-ontario-2026',
    );
    expect(container).not.toHaveTextContent(
      '[total cost guide](/blog/total-cost-of-owning-a-boat-ontario-2026)',
    );
  });

  it('opens external FAQ links safely', () => {
    render(
      <MemoryRouter>
        <PremiumFaq
          faqs={[
            {
              question: 'Where can I book?',
              answer:
                'Use the [HBW rental system](https://harrisboatworks.ca/rentals).',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'HBW rental system' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('link', { name: 'HBW rental system' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });
});
