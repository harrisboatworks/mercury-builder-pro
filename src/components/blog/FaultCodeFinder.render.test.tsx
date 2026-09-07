import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getArticleBySlug } from '@/data/blogArticles';
import { FaultCodeFinder } from './FaultCodeFinder';

const article = getArticleBySlug('mercury-outboard-fault-codes-lookup');
const content = article?.content ?? '';

describe('FaultCodeFinder rendered guidance', () => {
  it('makes serial-specific owner-manual guidance actionable', () => {
    render(<FaultCodeFinder content={content} />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '4502-23' },
    });

    const manualLink = screen.getByRole('link', {
      name: /serial-specific owner manual/i,
    });

    expect(manualLink).toHaveAttribute(
      'href',
      'https://www.mercurymarine.com/ca/en/service-and-support/owners-resources',
    );
    expect(manualLink).toHaveAttribute('target', '_blank');
    expect(manualLink.closest('p')).toHaveTextContent(
      /What to do now: Follow the unlock procedure/i,
    );
  });

  it('does not add a manual link to unrelated guidance', () => {
    render(<FaultCodeFinder content={content} />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '621-5' },
    });

    expect(
      screen.queryByRole('link', { name: /serial-specific owner manual/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Return to port now/i)).toBeInTheDocument();
  });
});
