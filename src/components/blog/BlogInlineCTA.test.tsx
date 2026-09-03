// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlogInlineCTA } from './BlogInlineCTA';
import { MarkdownSectionCards } from './MarkdownSectionCards';

describe('BlogInlineCTA', () => {
  it('renders PDF resources as real download links', () => {
    render(
      <BlogInlineCTA
        variant="inline"
        heading="Print the checklist"
        body="Use this at the boat."
        primaryLabel="Download checklist (PDF)"
        primaryHref="/downloads/checklist.pdf"
      />,
    );

    expect(screen.getByRole('complementary', { name: 'Downloadable resource' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download checklist/ })).toHaveAttribute(
      'href',
      '/downloads/checklist.pdf',
    );
    expect(screen.getByRole('link', { name: /Download checklist/ })).toHaveAttribute('download');
  });

  it('turns an article CTA directive into a download card', () => {
    render(
      <MarkdownSectionCards
        content={`::cta
variant: inline
heading: Print the checklist
body: Use this at the boat.
primaryLabel: Download checklist (PDF)
primaryHref: /downloads/checklist.pdf
::`}
        markdownComponents={{}}
      />,
    );

    expect(screen.getByRole('complementary', { name: 'Downloadable resource' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download checklist/ })).toHaveAttribute('download');
  });
});
