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
import { archivedBlogArticles } from './archivedBlogArticles';
import {
  buildCanonicalBlogFinancingCopy,
  buildCanonicalBlogFinancingFaqCopy,
} from './blogFinancingCopy';
import { getCaseStudyBySlug } from './caseStudies';
import { spanishBlogArticles } from './spanishBlogArticles';
import { cleanBlogContent } from '@/lib/cleanBlogContent.js';
import { mandarinBlogArticles, ZH_LANGUAGE_NOTE } from './mandarinBlogArticles';

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
    expect(leakCheck).toContain('CTA-parenthetical authoring heading');
    expect(leakCheck).toContain('Leftover Chinese internal-link authoring heading');
    expect(leakCheck).toContain('hbw-language-note');
    expect(leakCheck).toContain('Leftover heading-style language note');
    expect(leakCheck).toContain('Raw ::cta authoring fence in Markdown twin');
    expect(leakCheck).toContain('PUBLIC_TWIN_DIRECTIVE_PATTERNS');
    expect(leakCheck).toContain('Broken comma table cell');

    const cleaner = read('src/lib/cleanBlogContent.js');
    expect(cleaner).toContain('내부 링크');
    expect(cleaner).toContain('内部链接');
    expect(cleaner).toContain('内部连结');
    expect(cleaner).toContain('CTA_SUFFIX_HEADING_RE');
    expect(cleaner).toContain('CTA_PAREN_HEADING_RE');

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

  it('keeps leftover #82 dealer metadata fixes in the archived Mississauga and Port Hope records', () => {
    // Both city pages were retired in the 2026-09 blog audit and 301 to their
    // winners; the #82 metadata repairs must survive in the archive.
    expect(getArticleBySlug('mercury-dealer-mississauga-ontario-hbw')).toBeUndefined();
    expect(getArticleBySlug('mercury-dealer-port-hope-ontario-hbw')).toBeUndefined();

    const mississauga = archivedBlogArticles.find((a) => a.slug === 'mercury-dealer-mississauga-ontario-hbw');
    expect(mississauga).toBeDefined();
    expect(mississauga!.seoTitle).toBe('Mercury Dealer Near Mississauga | Harris Boat Works');
    expect(mississauga!.seoTitle).not.toBe('Mercury Repower Cost in Mississauga');

    const portHope = archivedBlogArticles.find((a) => a.slug === 'mercury-dealer-port-hope-ontario-hbw');
    expect(portHope).toBeDefined();
    expect(portHope!.description).toBe(
      'Harris Boat Works is a Mercury Premier dealer serving Port Hope boaters from Gores Landing on Rice Lake, about 30 minutes north via County Road 18.',
    );
    expect(portHope!.description).not.toMatch(/closest Mercury Premier dealer for Port Hope/);
  });

  it('repairs leftover #82 truncated metadata and broken table cells', () => {
    const brokenCell = /\|,\s*\|/;
    const avator = getArticleBySlug('mercury-avator-range-rice-lake-cottage');
    expect(avator).toBeDefined();
    expect(avator!.content).not.toMatch(brokenCell);
    expect(avator!.content).toContain(
      '| Quiet operation (early morning fishing) | Major advantage | Normal engine noise |',
    );

    const families = getArticleBySlug('fourstroke-vs-pro-xs');
    expect(families).toBeDefined();
    expect(families!.content).toContain('> *Jay Harris, Harris Boat Works*');
    expect(families!.content).not.toMatch(/^>: Jay Harris/m);

    const trent = getArticleBySlug('trent-severn-waterway-boating-guide-2026');
    expect(trent).toBeDefined();
    expect(trent!.description).toBe(
      "Free lockage runs June 19 to September 7, 2026, roughly $45 a day saved on a 20-footer. Our marina sits on the waterway; here's how we'd run it.",
    );
    expect(trent!.description).not.toMatch(/By Harris Boat\.$/);

    const french = read('src/data/frenchBlogArticles.ts');
    expect(french).toContain('| Perchaude | Toute l\'année | aucune | 50 |');
    expect(french).not.toMatch(brokenCell);

    expect(read('public/blog/mercury-avator-range-rice-lake-cottage.md')).not.toMatch(brokenCell);
    expect(read('public/blog/fourstroke-vs-pro-xs.md')).toContain('> *Jay Harris, Harris Boat Works*');
    expect(read('public/blog/trent-severn-waterway-boating-guide-2026.md')).toContain(trent!.description);
    expect(read('public/blog/fr/peche-lac-rice-ontario-guide-plaisanciers.md')).not.toMatch(brokenCell);
  });

  it('adds leftover #82 why-HBW competitive-pricing FAQs without the old inline questions', () => {
    const article = getArticleBySlug('why-harris-boat-works-mercury-dealer');
    expect(article).toBeDefined();
    expect(article!.content).not.toContain('## Common questions about HBW');
    expect(article!.content).not.toContain('Are you the most competitive on Mercury pricing?');

    const questions = (article!.faqs || []).map((faq) => faq.question);
    expect(questions).toContain('Are Harris Boat Works prices competitive with other Mercury dealers?');
    expect(questions).toContain('Can a multi-brand dealer offer a better Mercury price?');

    const competitive = article!.faqs!.find(
      (faq) => faq.question === 'Are Harris Boat Works prices competitive with other Mercury dealers?',
    );
    expect(competitive?.answer).toContain('when safe seasonal conditions allow');

    const twin = read('public/blog/why-harris-boat-works-mercury-dealer.md');
    expect(twin).toContain('### Are Harris Boat Works prices competitive with other Mercury dealers?');
    expect(twin).toContain('### Can a multi-brand dealer offer a better Mercury price?');
    expect(twin).not.toContain('## Common questions about HBW');
  });

  it('replaces leftover shrinkwrap-only winter-storage claims with the three-option canon', () => {
    const leftover = /outdoor winter (?:boat )?storage with shrinkwrap|we (?:do|offer) outdoor storage with shrinkwrap|Yes\. Outdoor storage with shrinkwrap|This is HBW's storage model/i;
    const storageCanon =
      'outdoor storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service';

    const whyHarris = getArticleBySlug('why-harris-boat-works-mercury-dealer');
    const storageFaq = whyHarris!.faqs!.find(
      (faq) => faq.question === 'Does Harris Boat Works offer boat storage?',
    );
    expect(storageFaq?.answer).toContain(storageCanon);
    expect(storageFaq?.answer).not.toMatch(leftover);

    const whyHarrisTwin = read('public/blog/why-harris-boat-works-mercury-dealer.md');
    expect(whyHarrisTwin).toContain(storageCanon);
    expect(whyHarrisTwin).not.toMatch(leftover);

    const brand = read('public/.well-known/brand.json');
    expect(brand).toContain(storageCanon);
    expect(brand).not.toMatch(leftover);

    const brandPage = read('src/data/harrisBoatWorksBrandPage.js');
    expect(brandPage).toContain(storageCanon);
    expect(brandPage).not.toMatch(leftover);
  });

  it('finishes leftover Korean 115-vs-150 hull-length dashes in the quick answer', () => {
    const source = read('src/data/koreanBlogArticles.ts');
    const twin = read('public/blog/ko/mercury-115-vs-150-comparison.md');
    const leftoverHyphen = /16-19피트|19-22피트/;

    for (const text of [source, twin]) {
      expect(text).toContain('16–19피트');
      expect(text).toContain('19–22피트');
      expect(text).toContain('16–19피트 알루미늄');
      expect(text).not.toMatch(leftoverHyphen);
    }
  });

  it('converts leftover heading-style language notes to Markdown blockquotes', () => {
    const leftoverHeading =
      /^#{2,3}\s+(?:Une note sur la langue|关于语言的说明|语言说明|언어 안내)\s*$/m;

    const surfaces = [
      'src/data/frenchBlogArticles.ts',
      'src/data/koreanBlogArticles.ts',
      'src/data/mandarinBlogArticles.ts',
      'public/blog/fr/revue-mercury-115-hp-fourstroke-ontario.md',
      'public/blog/ko/mercury-115-vs-150-comparison.md',
      'public/blog/zh/chinese-family-pontoon-mercury-outboard.md',
    ];

    for (const path of surfaces) {
      const text = read(path);
      expect(text, path).not.toMatch(leftoverHeading);
    }

    expect(read('src/data/spanishBlogArticles.ts')).toContain('## Una nota sobre el idioma');
    expect(read('src/data/frenchBlogArticles.ts')).toContain(
      '> **Une note sur la langue**\n> Cet article est une traduction de courtoisie.',
    );
    expect(read('src/data/koreanBlogArticles.ts')).toContain('> **언어 안내**');
    expect(read('src/data/mandarinBlogArticles.ts')).toContain('> **语言说明**\n> ${ZH_LANGUAGE_NOTE}');
    expect(read('src/data/mandarinBlogArticles.ts')).toContain('> **关于语言的说明**');
  });

  it('keeps leftover ZH language-note blockquotes in the twins that already have them in source', () => {
    const noteHeading = '> **语言说明**';
    const sourcesWithCanonNote = mandarinBlogArticles.filter((article) =>
      article.content.includes(`${noteHeading}\n> ${ZH_LANGUAGE_NOTE}`),
    );

    expect(sourcesWithCanonNote.map((article) => article.slug).sort()).toEqual([
      'gta-chinese-rice-lake-winter-storage-complete-guide',
      'mercury-repower-guide-gta',
      'rice-lake-fishing-guide-toronto-chinese',
    ]);

    for (const article of sourcesWithCanonNote) {
      const twin = read(`public/blog/zh/${article.slug}.md`);
      expect(twin, article.slug).toContain(noteHeading);
      expect(twin, article.slug).toContain(ZH_LANGUAGE_NOTE);
    }
  });

  it('adds leftover localized AuthorByline labels without rewriting titles', () => {
    const byline = read('src/components/blog/AuthorByline.tsx');
    expect(byline).toContain('byLabel = \'By\'');
    expect(byline).toContain('bioLabel = \'View author bio\'');

    const pages: Array<[string, string, string]> = [
      ['src/pages/blog/SpanishBlogArticlePage.tsx', 'byLabel="Por"', 'title="Propietario, Harris Boat Works"'],
      ['src/pages/blog/FrenchBlogArticlePage.tsx', 'byLabel="Par"', 'title="Propriétaire, Harris Boat Works"'],
      ['src/pages/blog/KoreanBlogArticlePage.tsx', 'byLabel="작성자"', 'title="Harris Boat Works 소유주"'],
      ['src/pages/blog/HindiBlogArticlePage.tsx', 'byLabel="लेखक"', 'title="Harris Boat Works के मालिक"'],
      ['src/pages/blog/PunjabiBlogArticlePage.tsx', 'byLabel="ਲੇਖਕ"', 'title="Harris Boat Works ਦੇ ਮਾਲਕ"'],
      ['src/pages/blog/TagalogBlogArticlePage.tsx', 'byLabel="Ni"', 'title="May-ari, Harris Boat Works"'],
      ['src/pages/blog/UrduBlogArticlePage.tsx', 'byLabel="مصنف"', 'title="Harris Boat Works کے مالک"'],
      ['src/pages/blog/MandarinBlogArticlePage.tsx', 'byLabel="作者"', 'title="Harris Boat Works 负责人"'],
      ['src/pages/blog/TraditionalChineseBlogArticlePage.tsx', 'byLabel="作者"', 'title="Harris Boat Works 負責人"'],
    ];

    for (const [path, byLabel, title] of pages) {
      const source = read(path);
      expect(source, path).toContain(byLabel);
      expect(source, path).toContain('bioLabel=');
      expect(source, path).toContain(title);
    }
  });

  it('strips leftover Chinese internal-link lists and parenthetical CTA headings', () => {
    const leftoverInternalHeading = /^##\s+(?:内部链接|内部连结)\s*$/m;
    const leftoverCtaHeading = /^##\s+.+\s*[（(]CTA[）)]\s*$/m;
    const twins = [
      'public/blog/zh/mercury-fuel-octane-ethanol-chinese-guide.md',
      'public/blog/zh/chinese-family-pontoon-mercury-outboard.md',
      'public/blog/zh/mercury-115-vs-150-comparison-zh.md',
      'public/blog/zh/rice-lake-fishing-guide-toronto-chinese.md',
      'public/blog/zh/pcoc-vs-rental-boat-safety-checklist-zh.md',
      'public/blog/zh/mercury-9-9-20hp-chinese-kicker-tiller-guide.md',
      'public/blog/zh/mercury-40-60hp-chinese-fishing-boat-guide.md',
    ];

    for (const path of twins) {
      const text = read(path);
      expect(text, path).not.toMatch(leftoverInternalHeading);
      expect(text, path).not.toMatch(leftoverCtaHeading);
    }

    const source = read('src/data/mandarinBlogArticles.ts');
    expect(source).not.toMatch(leftoverCtaHeading);
    expect(source).toContain('## 行动呼吁');

    const cleanedLinks = cleanBlogContent(
      '## 内部连结\n- [指南](/blog/zh/guide)\n\n## 行动呼吁（CTA）\n\n建立报价。',
    );
    expect(cleanedLinks).not.toMatch(leftoverInternalHeading);
    expect(cleanedLinks).not.toContain('/blog/zh/guide');
    expect(cleanedLinks).toBe('## 行动呼吁\n\n建立报价。');

    const hygiene = read('scripts/check-blog-output-hygiene.ts');
    expect(hygiene).toContain('leftover Chinese internal-link authoring heading');
    expect(hygiene).toContain('leftover parenthetical CTA authoring heading');
  });

  it('keeps leftover Korean HP tildes from becoming GFM strikethrough', () => {
    const renderer = read('src/components/blog/MarkdownSectionCards.tsx');
    expect(renderer).toContain('singleTilde: false');
  });
});
