// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatFinancingRate } from '@/lib/finance';
import { getArticleBySlug } from './blogArticles';
import { getCaseStudyBySlug } from './caseStudies';
import { spanishBlogArticles } from './spanishBlogArticles';

const INLINE_CANONICAL_BODY = /^\s*\*\*Canonical URL:\*\*/m;
const LIVE_RATE_TOKEN = /\{\{LIVE_RATE(?:_PCT)?\}\}/;
const PHOTOGRAPHY_PENDING = 'Real photography still pending.';
const SPANISH_EOF_ARTIFACT = 'End of file, 12 posts total';

const NAMED_ENGLISH_SLUGS = [
  'best-mercury-for-family-runabouts',
  'cheapest-mercury-outboard-canada-2026',
  'boat-hull-replacement-vs-repower-decision',
  'mercury-boost-upgrade-150hp-pontoon-analysis',
  'mercury-outboard-rigging-costs-ontario',
  'what-happens-during-mercury-repower',
] as const;

const read = (path: string) => readFileSync(path, 'utf8');

describe('public artifact regression', () => {
  it('removes inline Canonical URL body lines and keeps route/SEO canonical metadata', () => {
    for (const slug of NAMED_ENGLISH_SLUGS) {
      const article = getArticleBySlug(slug);
      expect(article, slug).toBeDefined();
      expect(article!.content, slug).not.toMatch(INLINE_CANONICAL_BODY);

      const twin = read(`public/blog/${slug}.md`);
      expect(twin, slug).toMatch(
        new RegExp(`^canonical: https://www\\.mercuryrepower\\.ca/blog/${slug}(?:\\.md)?$`, 'm'),
      );
      expect(twin, slug).toContain(
        `**Canonical (HTML for humans):** https://www.mercuryrepower.ca/blog/${slug}`,
      );
      expect(twin, slug).not.toMatch(INLINE_CANONICAL_BODY);
    }
  });

  it('drops the pending-photography phrase from the cedar-strip 9.9 excerpt', () => {
    const study = getCaseStudyBySlug('cedar-strip-9-9-fourstroke');
    expect(study).toBeDefined();
    expect(study!.excerpt).toBe(
      'A lightweight small-horsepower package for cottage and protected-water use.',
    );
    expect(study!.excerpt).not.toContain(PHOTOGRAPHY_PENDING);

    const twin = read('public/case-studies/cedar-strip-9-9-fourstroke.md');
    expect(twin).toContain(
      'A lightweight small-horsepower package for cottage and protected-water use.',
    );
    expect(twin).not.toContain(PHOTOGRAPHY_PENDING);
  });

  it('removes the Spanish terminal file-count artifact', () => {
    const article = spanishBlogArticles.find(
      (candidate) => candidate.slug === 'remotorizacion-vs-bote-nuevo',
    );
    expect(article).toBeDefined();
    expect(article!.content).not.toContain(SPANISH_EOF_ARTIFACT);

    const twin = read('public/blog/es/remotorizacion-vs-bote-nuevo.md');
    expect(twin).not.toContain(SPANISH_EOF_ARTIFACT);
  });

  it('resolves generated-index live-rate tokens through the canonical helper', () => {
    const generator = read('scripts/generate-blog-index.ts');
    expect(generator).toContain('substituteLiveRateTokens');
    expect(generator).toContain('../src/lib/finance');
    expect(generator).not.toMatch(/5\.48/);

    const publicIndex = read('public/blog-index.json');
    const generatedTs = read('supabase/functions/_shared/blog-index-generated.ts');
    expect(publicIndex).not.toMatch(LIVE_RATE_TOKEN);
    expect(generatedTs).not.toMatch(LIVE_RATE_TOKEN);

    const index = JSON.parse(publicIndex) as {
      articles: Array<{ slug: string; faqs: Array<{ a: string }> }>;
    };
    const paymentGuide = index.articles.find(
      (article) => article.slug === 'mercury-outboard-monthly-payment-ontario-2026',
    );
    expect(paymentGuide?.faqs[0]?.a).toContain(formatFinancingRate());
  });
});
