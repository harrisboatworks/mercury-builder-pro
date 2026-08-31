import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

/**
 * Contract guard for the Spanish blog article back link.
 *
 * The renderer already decorates the link with a lucide <ArrowLeft /> icon.
 * A literal "←" glyph in the label produced two visible arrows. Keep exactly
 * one decorative arrow while preserving the Spanish label and /blog target.
 */
const FILE = 'src/pages/blog/SpanishBlogArticlePage.tsx';

describe('Spanish blog back link', () => {
  const src = readFileSync(FILE, 'utf8');
  const nav = src.match(/<nav className="mb-8">[\s\S]*?<\/nav>/)?.[0] ?? '';

  it('renders the back nav', () => {
    expect(nav).not.toBe('');
    expect(nav).toContain('to="/blog"');
  });

  it('keeps the Spanish label without a literal arrow glyph', () => {
    expect(nav).toContain('Volver al blog');
    expect(nav).not.toContain('\u2190');
  });

  it('uses exactly one decorative arrow icon, hidden from assistive tech', () => {
    const icons = nav.match(/<ArrowLeft\b[^>]*\/>/g) ?? [];
    expect(icons).toHaveLength(1);
    expect(icons[0]).toContain('aria-hidden="true"');
  });
});
