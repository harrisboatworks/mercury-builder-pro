import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import glob from 'fast-glob';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BlogBackLink } from '../BlogBackLink';

/**
 * i18n consistency contract for blog article back links.
 *
 * Every language article page must route its back link through the shared
 * BlogBackLink component, which renders exactly one decorative arrow icon.
 * Literal arrow glyphs in labels previously produced two visible arrows.
 */
const ARROW_GLYPHS = /[\u2190\u21E6\u2B05]/;

const PAGES = glob.sync([
  'src/pages/blog/*ArticlePage.tsx',
  'src/pages/blog/MandarinBlogArticle.tsx',
]);

describe('BlogBackLink component', () => {
  it('renders exactly one decorative arrow icon hidden from assistive tech', () => {
    const { container } = render(
      <MemoryRouter>
        <BlogBackLink to="/blog" label="Volver al blog" />
      </MemoryRouter>,
    );
    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(1);
    expect(icons[0].getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('link').textContent ?? '').not.toMatch(ARROW_GLYPHS);
  });

  it('strips a literal arrow glyph from the label', () => {
    render(
      <MemoryRouter>
        <BlogBackLink to="/blog" label="← Bumalik sa Blog" />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link');
    expect(link.textContent).toBe('Bumalik sa Blog');
    expect(link.getAttribute('href')).toBe('/blog');
  });
});

describe('language article pages', () => {
  it('found the language pages to audit', () => {
    expect(PAGES.length).toBeGreaterThanOrEqual(9);
  });

  it.each(PAGES)('%s uses the shared back link with no duplicate arrows', (file) => {
    const src = readFileSync(file, 'utf8');
    const usages = src.match(/<BlogBackLink\b[^>]*\/>/g) ?? [];
    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatch(/label=\{/);
    expect(usages[0]).not.toMatch(ARROW_GLYPHS);
    // No hand-rolled ArrowLeft back links left behind.
    expect(src).not.toMatch(/<ArrowLeft\b/);
  });
});
