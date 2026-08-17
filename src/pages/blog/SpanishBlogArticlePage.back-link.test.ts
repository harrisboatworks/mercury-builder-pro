// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/pages/blog/SpanishBlogArticlePage.tsx', 'utf8');

describe('Spanish blog back-link contract', () => {
  it('renders one decorative arrow with a plain accessible label', () => {
    expect(source).toContain('<ArrowLeft className="w-4 h-4" aria-hidden="true" />');
    expect(source).toMatch(/<ArrowLeft[^>]+\/>\s*Volver al blog/);
    expect(source).not.toContain('← Volver al blog');
  });
});
