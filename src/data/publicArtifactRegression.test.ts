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
  /\b(?:Real photography still pending|until real photos arrive|illustrative pending real photography)\b/i;
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

    const prerender = read('scripts/static-prerender.mjs');
    expect(prerender).toContain(
      '<strong>Illustrative planning scenario.</strong>',
    );
    expect(prerender).not.toMatch(PHOTOGRAPHY_PENDING);

    const compactRouteStart = prerender.indexOf(
      "`<section><h2>What changed</h2><p><strong>Before:</strong>",
    );
    expect(compactRouteStart).toBeGreaterThan(-1);
    const compactRoute = prerender.slice(
      prerender.lastIndexOf('return (', compactRouteStart),
      prerender.indexOf('const locationDetailRoutes', compactRouteStart),
    );
    expect(compactRoute.indexOf('Illustrative planning scenario.')).toBeLessThan(
      compactRoute.indexOf('What changed'),
    );
    expect(compactRoute).toContain(
      "s.isIllustrative ? 'Why this configuration may fit' : 'Why it worked'",
    );
    expect(compactRoute).toContain('<h2>Planning takeaway</h2>');
  });

  it('keeps the pre-publish leak scanner aligned with source and twin artifact surfaces', () => {
    const leakCheck = read('scripts/check-blog-leaks.mjs');
    expect(leakCheck).toContain("'src/data/caseStudies.ts'");
    expect(leakCheck).toContain("'src/data/caseStudiesLongForm.ts'");
    expect(leakCheck).toContain("'scripts/static-prerender.mjs'");
    expect(leakCheck).toContain("'public/blog-index.json'");
    expect(leakCheck).toContain("'supabase/functions/_shared/blog-index-generated.ts'");
    expect(leakCheck).toContain("walk('public/blog', ['.md'])");
    expect(leakCheck).toContain("walk('public/case-studies', ['.md'])");
    expect(leakCheck).toContain('/\\bEnd of file,\\s*\\d+\\s+posts total\\b/i');
    expect(leakCheck).toContain('until real photos arrive');
    expect(leakCheck).toContain('illustrative pending real photography');
    expect(leakCheck).toContain('Canonical URL');
    expect(leakCheck).toContain('Artículo completo');
    expect(leakCheck).toContain('Article complet');
    expect(leakCheck).toContain('전체 기사');
    expect(leakCheck).toContain('CTA-prefixed authoring heading');
    expect(leakCheck).toContain('CTA-suffixed authoring heading');
    expect(leakCheck).toContain('hbw-language-note');
    expect(leakCheck).toContain('Raw ::cta authoring fence in Markdown twin');
    expect(leakCheck).toContain('PUBLIC_TWIN_DIRECTIVE_PATTERNS');

    const cleaner = read('src/lib/cleanBlogContent.js');
    expect(cleaner).toContain('내부 링크');
    expect(cleaner).toContain('CTA_SUFFIX_HEADING_RE');

    const packageJson = JSON.parse(read('package.json')) as {
      scripts: { build: string };
    };
    const prerenderIndex = packageJson.scripts.build.indexOf(
      'node scripts/static-prerender.mjs',
    );
    const finalLeakScanIndex = packageJson.scripts.build.lastIndexOf(
      'npm run check:blog-leaks',
    );
    expect(prerenderIndex).toBeGreaterThan(-1);
    expect(finalLeakScanIndex).toBeGreaterThan(prerenderIndex);
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

  it('renders download-card CTAs in Markdown twins instead of leftover ::cta fences', () => {
    const downloadCardTwins = [
      {
        slug: 'winter-repower-planning-guide',
        href: '/downloads/mercury-repower-planning-worksheet-hbw.pdf',
        label: 'Download repower worksheet (PDF)',
      },
      {
        slug: 'spring-outboard-commissioning-checklist',
        href: '/downloads/mercury-spring-launch-first-run-checklist-hbw.pdf',
        label: 'Download spring checklist (PDF)',
      },
      {
        slug: 'boat-trailer-maintenance-guide-ontario',
        href: '/downloads/five-minute-boat-trailer-check-hbw.pdf',
        label: 'Download trailer check (PDF)',
      },
      {
        slug: 'how-to-read-mercury-outboard-serial-number',
        href: '/downloads/mercury-service-request-prep-sheet-hbw.pdf',
        label: 'Download service prep sheet (PDF)',
      },
      {
        slug: 'mercury-outboard-wont-start-troubleshooting',
        href: '/downloads/mercury-alarm-no-start-action-card-hbw.pdf',
        label: 'Download action card (PDF)',
      },
      {
        slug: 'ethanol-octane-mercury-outboard-fuel-guide-ontario',
        href: '/downloads/marine-fuel-storage-quick-guide-hbw.pdf',
        label: 'Download fuel guide (PDF)',
      },
      {
        slug: 'diy-mercury-outboard-winterization-guide',
        href: '/downloads/fall-storage-winterization-checklist-hbw.pdf',
        label: 'Download fall checklist (PDF)',
      },
    ] as const;

    for (const { slug, href, label } of downloadCardTwins) {
      const article = getArticleBySlug(slug);
      expect(article, slug).toBeDefined();
      expect(article!.content, slug).toContain('::cta');
      expect(article!.content, slug).toContain(href);

      const twin = read(`public/blog/${slug}.md`);
      expect(twin, slug).not.toMatch(/^::cta\s*$/m);
      expect(twin, slug).toContain(`[${label}](${href})`);
    }

    const hygiene = read('scripts/check-blog-output-hygiene.ts');
    expect(hygiene).toContain('leftover raw ::cta authoring fence');
  });

  it('keeps Pro XS cost copy on the quote builder instead of leftover planning-range dollars', () => {
    const fabricatedRange = /high teens of thousands|mid-thirties of thousands/i;
    const article = getArticleBySlug('mercury-pro-xs-repower-rice-lake-kawartha-anglers');
    expect(article).toBeDefined();
    expect(article!.content).not.toMatch(fabricatedRange);
    expect(JSON.stringify(article!.faqs)).not.toMatch(fabricatedRange);
    expect(article!.content).toContain('Installed cost depends on HP, rigging, and what we can reuse');
    expect(article!.faqs?.some((faq) => faq.answer.includes('175 HP V6 and the 200–250 HP V8'))).toBe(true);

    const twin = read('public/blog/mercury-pro-xs-repower-rice-lake-kawartha-anglers.md');
    expect(twin).not.toMatch(fabricatedRange);
    expect(twin).toContain('175 HP V6 and the 200–250 HP V8');

    const publicIndex = read('public/blog-index.json');
    const generatedTs = read('supabase/functions/_shared/blog-index-generated.ts');
    expect(publicIndex).not.toMatch(fabricatedRange);
    expect(generatedTs).not.toMatch(fabricatedRange);

    const hygiene = read('scripts/check-blog-output-hygiene.ts');
    const priceHygiene = read('scripts/check-blog-price-hygiene.mjs');
    expect(hygiene).toContain('fabricated Pro XS planning-range dollars');
    expect(priceHygiene).toContain('mercury-pro-xs-repower-rice-lake-kawartha-anglers');
  });

  it('restores leftover #82 dealer metadata without the truncated Mississauga title or Port Hope closest claim', () => {
    const mississauga = getArticleBySlug('mercury-dealer-mississauga-ontario-hbw');
    expect(mississauga).toBeDefined();
    expect(mississauga!.seoTitle).toBe('Mercury Dealer Near Mississauga | Harris Boat Works');
    expect(mississauga!.seoTitle).not.toBe('Mercury Repower Cost in Mississauga');

    const portHope = getArticleBySlug('mercury-dealer-port-hope-ontario-hbw');
    expect(portHope).toBeDefined();
    expect(portHope!.description).toBe(
      'Harris Boat Works is a Mercury Premier dealer serving Port Hope boaters from Gores Landing on Rice Lake, about 30 minutes north via County Road 18.',
    );
    expect(portHope!.description).not.toMatch(/closest Mercury Premier dealer for Port Hope/);

    const twin = read('public/blog/mercury-dealer-port-hope-ontario-hbw.md');
    expect(twin).toContain(portHope!.description);
    expect(twin).not.toMatch(/^description: "Harris Boat Works is the closest Mercury Premier dealer for Port Hope/m);
  });
});
