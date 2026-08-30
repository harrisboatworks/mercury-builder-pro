// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  formatFinancingRate,
  getDefaultFinancingRate,
  getFinancingHeadlineFaqAnswer,
  isMercuryPromoActive,
  MERCURY_PROMO_APR,
  MERCURY_PROMO_END_ISO,
} from '@/lib/finance';
import { getArticleBySlug } from './blogArticles';
import {
  buildCanonicalBlogFinancingCopy,
  buildCanonicalBlogFinancingFaqCopy,
} from './blogFinancingCopy';
import { getCaseStudyBySlug } from './caseStudies';
import { spanishBlogArticles } from './spanishBlogArticles';

const INLINE_CANONICAL_BODY = /^\s*\*\*Canonical URL:\*\*/m;
const LIVE_RATE_TOKEN = /\{\{LIVE_RATE(?:_PCT)?\}\}/;
const PHOTOGRAPHY_PENDING =
  /\b(?:Real photography still pending|until real photos arrive)\b/i;
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
    expect(study!.whyItWorked).toContain(
      'Clearly labelled as an illustrative planning scenario',
    );
    expect(
      [study!.excerpt, ...study!.whyItWorked].join('\n'),
    ).not.toMatch(PHOTOGRAPHY_PENDING);

    const twin = read('public/case-studies/cedar-strip-9-9-fourstroke.md');
    expect(twin).toContain(
      'A lightweight small-horsepower package for cottage and protected-water use.',
    );
    expect(twin).toContain(
      '- Clearly labelled as an illustrative planning scenario',
    );
    expect(twin).not.toMatch(PHOTOGRAPHY_PENDING);
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

  it('keeps the pre-publish leak scanner aligned with source and twin artifact surfaces', () => {
    const leakCheck = read('scripts/check-blog-leaks.mjs');
    expect(leakCheck).toContain("'src/data/caseStudies.ts'");
    expect(leakCheck).toContain("'src/data/caseStudiesLongForm.ts'");
    expect(leakCheck).toContain("walk('public/blog', ['.md'])");
    expect(leakCheck).toContain("walk('public/case-studies', ['.md'])");
    expect(leakCheck).toContain('/\\bEnd of file,\\s*\\d+\\s+posts total\\b/i');
    expect(leakCheck).toContain('until real photos arrive');
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
    expect(paymentGuide?.faqs[0]?.a).toContain(
      formatFinancingRate(MERCURY_PROMO_APR),
    );
  });

  it('switches generated financing copy to both standard tiers after promo expiry', () => {
    const activeCopy = getFinancingHeadlineFaqAnswer(
      new Date('2026-12-31T12:00:00-05:00'),
    );
    expect(activeCopy).toContain(formatFinancingRate(MERCURY_PROMO_APR));
    expect(activeCopy).toContain('through December 31, 2026');

    const expiredCopy = getFinancingHeadlineFaqAnswer(
      new Date('2027-01-01T12:00:00-05:00'),
    );
    expect(expiredCopy).toContain(formatFinancingRate(getDefaultFinancingRate(5_000)));
    expect(expiredCopy).toContain(formatFinancingRate(getDefaultFinancingRate(10_000)));
    expect(expiredCopy).not.toContain('December 31, 2026');
    expect(expiredCopy).not.toContain(formatFinancingRate(MERCURY_PROMO_APR));

    for (const canonicalCopy of [
      buildCanonicalBlogFinancingCopy(new Date('2027-01-01T12:00:00-05:00')),
      buildCanonicalBlogFinancingFaqCopy(new Date('2027-01-01T12:00:00-05:00')),
    ]) {
      expect(canonicalCopy).toContain(
        formatFinancingRate(getDefaultFinancingRate(5_000)),
      );
      expect(canonicalCopy).toContain(
        formatFinancingRate(getDefaultFinancingRate(10_000)),
      );
      expect(canonicalCopy).not.toContain('December 31, 2026');
      expect(canonicalCopy).not.toContain(formatFinancingRate(MERCURY_PROMO_APR));
    }
  });

  it('uses the Ontario promo cutoff exactly and keeps indexed FAQs expiry-aware', () => {
    const promoEnd = new Date(MERCURY_PROMO_END_ISO).getTime();
    expect(MERCURY_PROMO_END_ISO).toMatch(/-05:00$/);
    expect(new Date(promoEnd).toISOString()).toBe('2027-01-01T04:59:59.000Z');
    expect(isMercuryPromoActive(promoEnd)).toBe(true);
    expect(isMercuryPromoActive(promoEnd + 1)).toBe(false);

    const source = readFileSync('src/data/blogArticles.ts', 'utf8');
    expect(source).not.toMatch(
      /answer:\s*["'`][^\n]*\{\{LIVE_RATE\}\}[^\n]*(?:Dec(?:ember)? 31, 2026)/,
    );
  });
});
