#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCanonicalPricing } from './lib/canonical-pricing.mjs';
import {
  WARRANTY_AGENT_NOTE,
  WARRANTY_AGENT_NOTE_BOLD,
  WARRANTY_POLICY_SENTENCE,
  WARRANTY_TABLE_CELL,
} from './lib/warranty-copy.mjs';

const failures = [];
const warnings = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const warn = (condition, message) => {
  if (!condition) warnings.push(message);
};

const read = (path) => readFileSync(path, 'utf8');
const proXsSeo = read('src/components/seo/MercuryProXSSEO.tsx');
const proXsPage = read('src/pages/landing/MercuryProXS.tsx');
const vercelConfig = read('vercel.json');
const prerenderScript = read('scripts/static-prerender.mjs');
const brandMetadata = read('public/.well-known/brand.json');
const blogArticles = read('src/data/blogArticles.ts');
const frenchBlogArticles = read('src/data/frenchBlogArticles.ts');
const blogFinancingCopy = read('src/data/blogFinancingCopy.ts');
const mercury115Twin = read('public/blog/mercury-115-hp-fourstroke-review-ontario.md');
const caseStudies = read('src/data/caseStudiesLongForm.ts');
const baseCaseStudies = read('src/data/caseStudies.ts');
const caseStudyGenerator = read('scripts/generate-markdown-twins.mjs');
const boostChecker = read('src/components/tools/BoostEligibilityChecker.tsx');
const mandarinArticlePage = read('src/pages/blog/MandarinBlogArticlePage.tsx');
const mandarinBlogIndex = read('src/pages/blog/BlogIndexZh.tsx');
const globalSeo = read('src/components/seo/GlobalSEO.tsx');
const homepageSeo = read('src/components/seo/HomepageSEO.tsx');
const appSource = read('src/App.tsx');
const canonicalComponent = read('src/components/seo/Canonical.tsx');
const canonicalUrlSource = read('src/lib/canonicalUrl.ts');
const homeHubAlternates = read('src/components/seo/homeHubAlternates.tsx');
const seoPageMetadata = JSON.parse(read('src/data/seoPageMetadata.json'));
const sitemapGenerator = read('src/utils/generateSitemap.ts');
const publicSitemap = read('public/sitemap.xml');
const blogClusters = read('src/data/blogClusters.ts');
const parsedVercelConfig = JSON.parse(vercelConfig);
const mandarinServiceGuide = read('src/data/mandarinBlogArticles.ts');
const mandarinServiceTwin = read('public/blog/zh/gta-chinese-mercury-service-guide.md');
const mandarinServiceSurface = `${mandarinServiceGuide}\n${mandarinServiceTwin}`;
const warrantyCopySource = read('scripts/lib/warranty-copy.mjs');
const faqDataSource = read('src/data/faqData.ts');
const warrantySources = [
  ['src/data/blogArticles.ts', blogArticles],
  ['scripts/static-prerender.mjs', prerenderScript],
  ['scripts/generate-markdown-twins.mjs', caseStudyGenerator],
  ['scripts/generate-motor-markdown.mjs', read('scripts/generate-motor-markdown.mjs')],
  ['scripts/lib/warranty-copy.mjs', warrantyCopySource],
  ['src/data/faqData.ts', faqDataSource],
];
const bonusWarrantyAllowlist = [
  'promotional bonus coverage can change',
  'promotional bonus coverage must be confirmed at the time of sale because those programs can change',
];

for (const allowed of bonusWarrantyAllowlist) {
  check(
    warrantySources.some(([, source]) => source.includes(allowed)),
    `Reviewed bonus-warranty allowlist entry is missing: ${allowed}`,
  );
}

for (const [sourceName, source] of warrantySources) {
  const unreviewed = bonusWarrantyAllowlist.reduce(
    (value, allowed) => value.split(allowed).join(''),
    source,
  );
  check(
    !/bonus\s+(warranty|coverage)/i.test(unreviewed),
    `${sourceName} contains unreviewed bonus warranty or bonus coverage wording.`,
  );
}

for (const [sourceName, source] of warrantySources.filter(([name]) => name !== 'src/data/blogArticles.ts')) {
  check(
    !/bonus-(warranty|coverage)/i.test(source),
    `${sourceName} contains retired hyphenated bonus-warranty wording.`,
  );
}

check(
  /run concurrently, not as six stacked years/i.test(WARRANTY_POLICY_SENTENCE) &&
    /written promotion terms explicitly include it/i.test(WARRANTY_POLICY_SENTENCE),
  'Shared warranty policy must state concurrent standard coverage and require explicit written promotional terms.',
);
check(
  WARRANTY_AGENT_NOTE.includes(WARRANTY_POLICY_SENTENCE) &&
    /running concurrently/i.test(WARRANTY_AGENT_NOTE_BOLD) &&
    /written promotion terms explicitly include it/i.test(WARRANTY_AGENT_NOTE_BOLD) &&
    /running concurrently/i.test(WARRANTY_TABLE_CELL) &&
    /written terms explicitly include it/i.test(WARRANTY_TABLE_CELL),
  'Every shared warranty output must preserve concurrent coverage and written-promotion qualification.',
);
check(
  /3-year limited warranty and a separate 3-year corrosion warranty/i.test(faqDataSource) &&
    /run concurrently, not as six stacked years/i.test(faqDataSource) &&
    /written promotion terms explicitly include it/i.test(faqDataSource),
  'Customer FAQ warranty copy must remain aligned with the shared Canadian policy.',
);

check(
  !/锌或铝阳极是发动机水下部分的["“]牺牲品|\| 操作员卡 \/ 钓鱼证 \| 不销售（请到 ontario\.ca 办理） \| ， \|/.test(mandarinServiceSurface),
  'Mandarin service guide revived the anode mistranslation or malformed service table row.',
);
check(
  /淡水环境通常使用镁阳极；咸水环境使用锌阳极/.test(mandarinServiceSurface) &&
    /\| 操作员卡 \/ 钓鱼证 \| 不适用 \| 不销售；请到 ontario\.ca 办理 \|/.test(mandarinServiceSurface),
  'Mandarin service guide must retain freshwater anode guidance and the corrected service table.',
);

check(
  !/Legend[^.\n]{0,100}(?:built in Whitefish|Canadian-built|built in Canada|Ontario-built|made in Canada|manufactured in Whitefish|manufactured in Canada)/i.test(blogArticles),
  'Legend copy must not imply Canadian or Whitefish manufacturing.',
);
check(
  /Legend is a Canadian company headquartered in Whitefish, Ontario, near Sudbury, and its boats are designed by Canadians for Canadian water/i.test(blogArticles),
  'The Legend power-package guide must use the approved Canadian design and headquarters disclosure.',
);

const pclRouteSlugs = [
  'pleasure-craft-licence-update-repower-ontario',
  'rice-lake-boat-launch-guide',
  'ontario-boating-season-tips',
  'rice-lake-boating-guide-2026',
  'total-cost-of-owning-a-boat-ontario-2026',
  'walleye-opener-boat-prep',
];
const sourceArticleSection = (slug) => {
  const start = blogArticles.search(new RegExp(`slug: ['"]${slug}['"],`));
  if (start < 0) return '';
  const remainder = blogArticles.slice(start + 1);
  const nextArticle = remainder.search(/\n {4}slug: ['"]/);
  const articleArrayEnd = remainder.search(/\n\s*},\n\s*];/);
  const boundaries = [nextArticle, articleArrayEnd].filter((offset) => offset >= 0);
  const end = boundaries.length ? start + 1 + Math.min(...boundaries) : blogArticles.length;
  return blogArticles.slice(start, end);
};
const pclRouteReview = pclRouteSlugs.map((slug) => {
  const surface = `${sourceArticleSection(slug)}\n${read(`public/blog/${slug}.md`)}`;
  return {
    slug,
    surface,
    amounts: [...new Set(surface.match(/\$24(?:\.41)?/g) ?? [])],
    hasBare24: /\$24(?!\.41\b|[\d,])/.test(surface),
  };
});
for (const route of pclRouteReview) {
  check(!route.hasBare24, `${route.slug} contains a bare $24 PCL fee instead of $24.41.`);
}

const regulatoryTwins = [
  'pleasure-craft-licence-update-repower-ontario',
  'trailer-boat-toronto-to-rice-lake-guide',
  'mercury-avator-range-rice-lake-cottage',
].map((slug) => read(`public/blog/${slug}.md`)).join('\n');
const regulatorySurface = `${blogArticles}\n${regulatoryTwins}`;
const pclFeeReviewedOn = new Date('2026-08-08T00:00:00Z');
const evaluatedAt = process.env.BLOG_REGULATORY_NOW
  ? new Date(process.env.BLOG_REGULATORY_NOW)
  : new Date();
check(!Number.isNaN(evaluatedAt.getTime()), 'BLOG_REGULATORY_NOW must be a valid date when provided.');
const now = Number.isNaN(evaluatedAt.getTime()) ? new Date() : evaluatedAt;
const thisYearsAprilReview = new Date(Date.UTC(now.getUTCFullYear(), 3, 1));
const latestAprilReview = now >= thisYearsAprilReview
  ? thisYearsAprilReview
  : new Date(Date.UTC(now.getUTCFullYear() - 1, 3, 1));
const pclFeeReviewStale = pclFeeReviewedOn < latestAprilReview;

check(
  !/1,400 kg|1,400–3,400 kg|7\.5 kW aggregate power for most freshwater lakes/i.test(regulatorySurface),
  'Blog source or Markdown twins revived an audit-identified stale regulatory figure.',
);
check(
  /\$24\.41 fee[\s\S]{0,180}inflation each April 1/.test(regulatorySurface) &&
    /1,360 kg \(3,000 lb\) or more/.test(regulatorySurface) &&
    /Schedule 3 of the Vessel Operation Restriction Regulations[\s\S]{0,220}not a general rule for most freshwater lakes/.test(regulatorySurface),
  'PCL fee, Ontario trailer-brake threshold and Schedule 3 electric allowance must retain current qualification.',
);
warn(
  !pclFeeReviewStale,
  `PCL fee needs its annual post-April-1 review. Last reviewed ${pclFeeReviewedOn.toISOString().slice(0, 10)}.`,
);

const unsourcedStatTwins = [
  'best-pontoon-boats-rice-lake-cottage-use',
  'mercury-9-9-vs-15-hp-tiller-ontario',
  'walleye-opener-boat-prep',
  'mercury-controls-rigging-guide-ontario',
  'mercury-outboard-spring-run-up-checklist-ontario',
  'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026',
].map((slug) => read(`public/blog/${slug}.md`)).join('\n');
const unsourcedStatSurface = `${blogArticles}\n${unsourcedStatTwins}`;

check(
  !/70% of our Rice Lake customers|70 percent of our small-motor customers|25 percent walk out|remaining 5 percent|40% of opener-morning failures|about 40% of failures|6 out of 10 motors|80% of what the motor knows|roughly 40 spring run-up issues|roughly 80 percent of our April-May service calls|actual customer data[\s\S]{0,120}average closer to 20 hours/i.test(unsourcedStatSurface),
  'Blog source or Markdown twins revived an audit-identified unsourced internal statistic.',
);
check(
  /In our shop experience, the 15 HP is the more common choice/.test(unsourcedStatSurface) &&
    /one of the most common opener-morning failures we see/.test(unsourcedStatSurface) &&
    /many motors that look fine to keep the existing controls still need new cables/.test(unsourcedStatSurface) &&
    /planning illustrations, not a claim about the average Rice Lake owner/.test(unsourcedStatSurface),
  'Shop-experience and scenario framing must remain on the corrected internal-stat surfaces.',
);

check(
  /DealerPlan/.test(blogFinancingCopy) &&
    /TD Auto Finance/.test(blogFinancingCopy) &&
    /on approved credit/.test(blogFinancingCopy) &&
    /canonicalBlogFinancingFaqCopy/.test(blogFinancingCopy) &&
    /mercuryrepower\.ca\/promotions/.test(blogFinancingCopy),
  'Canonical blog financing copy must identify DealerPlan and TD Auto Finance, include the approval qualifier, and keep FAQ schema plain-text.',
);
check(
  (blogArticles.match(/canonicalBlogFinancingCopy/g) || []).length >= 2 &&
    (blogArticles.match(/canonicalBlogFinancingFaqCopy/g) || []).length >= 5,
  'Affected blog financing body and FAQ answers must use the canonical shared financing copy.',
);

check(
  /CANONICAL_SKUS/.test(proXsSeo) && /family === 'ProXS'/.test(proXsSeo),
  'MercuryProXSSEO must derive prices from CANONICAL_SKUS.',
);
check(
  !/startingAt:\s*(?:14450|18300|23800|29300)\b/.test(proXsSeo),
  'MercuryProXSSEO contains a legacy hard-coded Pro XS price.',
);
check(
  !/\.select\([^)]*base_price/s.test(proXsPage) && !/m\.base_price/.test(proXsPage),
  'MercuryProXS public pricing must not select or display motor_models.base_price.',
);
check(
  /startingAt:\s*offer\.startingAt/.test(proXsPage) && !/m\.(?:sale_price|dealer_price)/.test(proXsPage),
  'MercuryProXS UI must use canonical static offers for price and Supabase only for stock status.',
);
check(
  !/"source":\s*"\/\(\(\?!api\//.test(vercelConfig),
  'vercel.json contains a broad SPA catch-all that turns unknown URLs into soft 404s.',
);
check(
  /writeFileSync\(join\(DIST, '404\.html'\)/.test(prerenderScript),
  'static-prerender must emit a root 404.html fallback.',
);
check(
  /"source":\s*"\/repower-legacy"[\s\S]{0,120}"destination":\s*"\/repower"/.test(vercelConfig),
  'vercel.json must redirect the retired /repower-legacy route to /repower.',
);
check(
  /"source":\s*"\/blog\/zh-hant"[\s\S]{0,120}"destination":\s*"\/index\.html"/.test(vercelConfig) &&
    /"source":\s*"\/blog\/zh-hant\/:slug"[\s\S]{0,120}"destination":\s*"\/index\.html"/.test(vercelConfig),
  'vercel.json must preserve the noindex zh-Hant pilot hub and article SPA routes.',
);
check(
  /"source":\s*"\/blog\/fr\/concessionnaire-mercury-platinum-ontario"[\s\S]{0,160}"destination":\s*"\/blog\/fr\/concessionnaire-mercury-premier-ontario"[\s\S]{0,80}"statusCode":\s*301/.test(vercelConfig),
  'vercel.json must permanently redirect the retired French Platinum URL to the Premier URL.',
);
check(
  /"source":\s*"\/blog\/fr\/concessionnaire-mercury-premier-ontario"[\s\S]{0,160}"destination":\s*"\/blog\/fr\/concessionnaire-mercury-premier-ontario\/index\.html"/.test(vercelConfig),
  'vercel.json must preserve the renamed standalone French Premier article prerender route.',
);
check(
  /<Route path="\/blog\/fr\/:slug" element=\{<FrenchBlogArticlePage \/>\}/.test(appSource) &&
    !/FrenchBlogArticle(?:"|'|\))/.test(appSource) &&
    !/\/blog\/fr\/concessionnaire-mercury-platinum-ontario/.test(appSource) &&
    !/\/blog\/fr\/concessionnaire-mercury-premier-ontario/.test(prerenderScript),
  'The canonical French article pipeline must own the Premier URL without reviving a one-off route, duplicate static prerender, or retired Platinum route.',
);
check(
  /slug:\s*['"]concessionnaire-mercury-premier-ontario['"]/.test(frenchBlogArticles) &&
    /premier arrivé, premier servi/i.test(frenchBlogArticles) &&
    /ferme le 1er décembre/i.test(frenchBlogArticles) &&
    !/Accès prioritaire aux pièces|le niveau le plus élevé|Mercury les envoie chez nous|le prix que vous voyez, c'est le prix/i.test(frenchBlogArticles),
  'The canonical French Premier source must keep the verified HBW service guidance without unsupported dealer claims.',
);
check(
  /socialImage\?: string/.test(blogArticles) &&
    /socialImage:\s*a\.socialImage\s*\|\|\s*null/.test(prerenderScript) &&
    /citations:\s*\(a\.citations\s*\|\|\s*\[\]\)\.map/.test(prerenderScript) &&
    /article\.socialImage \|\| article\.image/.test(prerenderScript) &&
    /Array\.isArray\(article\.citations\)/.test(prerenderScript) &&
    /mercury-oil-capacity-lookup-hbw-social\.png/.test(blogArticles) &&
    /mercury-maintenance-schedule-100-300-hbw-social\.png/.test(blogArticles),
  'Blog prerender output must retain raster social-preview and citation support.',
);
check(
  !/hreflang="zh-CA"/.test(prerenderScript),
  'static-prerender mixes the non-canonical zh-CA label into hreflang output.',
);
check(
  !/hreflang="zh-Hant"/.test(prerenderScript),
  'noindex zh-Hant pilot pages must not be advertised as hreflang alternates.',
);
check(
  !/hrefLang="zh-Hant"/.test(mandarinArticlePage) && !/hrefLang="zh-Hant"/.test(mandarinBlogIndex),
  'Hydrated Simplified Chinese pages must not advertise noindex zh-Hant pilots as alternates.',
);
check(
  !/hrefLang=/.test(globalSeo),
  'GlobalSEO must not inject homepage hreflang URLs into every hydrated route.',
);
check(
  /HOME_HUB_PATHS/.test(canonicalComponent) && /renderHomeHubAlternates\(\)/.test(canonicalComponent),
  'The route-aware canonical component must own the multilingual home-hub hreflang set.',
);
const expectedHomeAlternates = [
  { hrefLang: 'en-CA', path: '/' },
  { hrefLang: 'fr-CA', path: '/fr' },
  { hrefLang: 'zh-Hans', path: '/zh' },
  { hrefLang: 'x-default', path: '/' },
];
check(
  JSON.stringify(seoPageMetadata.home?.alternates) === JSON.stringify(expectedHomeAlternates),
  'Home hreflang metadata must contain only the reciprocal English, French, Simplified Chinese, and x-default home hubs.',
);
check(
  /new Set\(\['\/', '\/fr', '\/zh'\]\)/.test(canonicalComponent) &&
    /HOME_HUB_PATHS\.has\(canonicalPath\)/.test(canonicalComponent) &&
    /seoPageMetadata\.home\.alternates/.test(homeHubAlternates),
  'Only the English, French, and Mandarin home hubs may render the shared hreflang cluster.',
);
check(
  !/hrefLang="(?:ko|es|hi|pa)"/.test(homepageSeo),
  'Blog language hubs must not be advertised as translated homepage equivalents.',
);
check(
  (prerenderScript.match(/extraHead:\s*HOME_HUB_ALTERNATE_TAGS/g) ?? []).length === 3 &&
    /<link data-rh="true" rel="alternate"/.test(prerenderScript),
  'Static home-hub hreflang tags must use the shared reciprocal cluster and be adoptable by Helmet.',
);
check(
  /const \{ title, description \} = seoPageMetadata\.home/.test(homepageSeo) &&
    /title:\s*HOME_SEO\.title/.test(prerenderScript) &&
    /description:\s*HOME_SEO\.description/.test(prerenderScript),
  'Raw and hydrated homepage metadata must use the same source.',
);
check(
  /useLocation\(\)/.test(canonicalComponent) && /<Helmet>/.test(canonicalComponent) &&
    /canonicalUrlFor\(pathname\)/.test(canonicalComponent) && /<Canonical \/>/.test(appSource),
  'Hydrated canonicals must be route-aware and owned by Helmet.',
);
check(
  !/document\.createElement\(["']link["']\)/.test(appSource) &&
    !/document\.head\.appendChild/.test(appSource),
  'App must not imperatively mutate the canonical link after hydration.',
);
check(
  /'\/mercury-repower-faq':\s*'\/faq'/.test(canonicalUrlSource) &&
    /'\/motor-selection':\s*'\/quote\/motor-selection'/.test(canonicalUrlSource) &&
    /canonicalPath:\s*'\/quote\/motor-selection'/.test(prerenderScript),
  'Raw and hydrated canonicals must preserve the intentional FAQ and motor-selection aliases.',
);
check(
  parsedVercelConfig.trailingSlash === false,
  'vercel.json must redirect trailing-slash variants to the canonical no-slash URL.',
);
check(
  parsedVercelConfig.redirects?.some((redirect) =>
    redirect.source === '/REPOWER' && redirect.destination === '/repower' && redirect.statusCode === 301
  ),
  'vercel.json must redirect the observed uppercase /REPOWER variant to /repower.',
);
for (const [source, destination] of [
  [
    '/blog/zh/pcoc-pcl-fishing-licence-difference-ontario',
    '/blog/zh/gta-chinese-pcl-fishing-licence-guide',
  ],
  [
    '/blog/zh/pcoc-pcl-fishing-licence-difference-ontario.md',
    '/blog/zh/gta-chinese-pcl-fishing-licence-guide.md',
  ],
]) {
  check(
    parsedVercelConfig.redirects?.some((redirect) =>
      redirect.source === source &&
      redirect.destination === destination &&
      redirect.statusCode === 301
    ),
    `vercel.json must permanently consolidate ${source} into ${destination}.`,
  );
}
for (const loc of [
  '/mercury-product-protection.md',
  '/mercury-product-protection.json',
  '/pricing-reference.md',
  '/motor-selection',
  '/mercury-repower-faq',
]) {
  const escapedLoc = loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sitemapEntry = new RegExp(`loc:\\s*['"]${escapedLoc}['"]`);
  check(
    !sitemapEntry.test(sitemapGenerator) &&
      !sitemapEntry.test(prerenderScript) &&
      !publicSitemap.includes(`<loc>https://www.mercuryrepower.ca${loc}</loc>`),
    `Search sitemap must not list the noindexed or noncanonical URL ${loc}.`,
  );
}
check(
  !/mercuryrepower\.ca\/logo\.png/.test(brandMetadata),
  'brand.json references the removed /logo.png asset.',
);
check(
  /"url":\s*"https:\/\/www\.mercuryrepower\.ca\/email-assets\/harris-logo\.png"/.test(brandMetadata),
  'brand.json must reference the real PNG Harris logo asset.',
);
check(existsSync('public/email-assets/harris-logo.png'), 'The brand metadata logo asset is missing.');
if (existsSync('public/email-assets/harris-logo.png')) {
  const png = readFileSync('public/email-assets/harris-logo.png');
  check(png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'The brand logo asset must contain PNG bytes.');
}

const { skus } = loadCanonicalPricing();
for (const hp of [115, 150, 200, 250]) {
  const matching = skus.filter((sku) => sku.family === 'ProXS' && sku.hp === hp);
  check(matching.length > 0, `Canonical pricing is missing a ${hp} HP Pro XS SKU.`);
  check(matching.every((sku) => Number.isFinite(sku.dealer) && sku.dealer > 0), `Canonical ${hp} HP Pro XS price is invalid.`);
}

const specRouteSurfaces = (slug) => {
  const twinPath = `public/blog/${slug}.md`;
  return [
    [`${slug} source`, sourceArticleSection(slug)],
    [`${slug} twin`, existsSync(twinPath) ? read(twinPath) : ''],
  ];
};
const canonicalCommandThrustHps = [...new Set(
  skus.filter((sku) => /Command Thrust/i.test(sku.model)).map((sku) => sku.hp),
)].sort((a, b) => a - b);
check(canonicalCommandThrustHps.length > 0, 'Canonical pricing must contain at least one Command Thrust SKU.');
const checkedSpecRoutes = new Set();
const checkSpecRoute = (slug, inspect) => {
  checkedSpecRoutes.add(slug);
  for (const [label, surface] of specRouteSurfaces(slug)) {
    check(surface.length > 0, `${label} is missing from the product-spec integrity review.`);
    check(!surface.includes('\u2014'), `${label} contains a banned em dash.`);
    inspect(surface, label);
  }
};

checkSpecRoute('mercury-command-thrust-pontoon-eligibility-2026', (surface, label) => {
  const availabilitySection = surface.match(/## HP class availability[\s\S]*?(?=\n## |$)/i)?.[0] ?? '';
  const listing = availabilitySection
    .split(/\n\s*\n/)
    .find((paragraph) => /As of August 8, 2026,/i.test(paragraph) && /current Canadian listings/i.test(paragraph)) ?? '';
  check(!/25\s*(?:to|[-–])\s*115 HP/i.test(surface), `${label} revived the stale 25-to-115 HP Command Thrust range.`);
  check(
    /9\.9 HP/i.test(listing) &&
      /Command Thrust/i.test(listing) &&
      /ProKicker/i.test(listing) &&
      /9\.9 HP[\s\S]{0,180}40\s*,\s*50\s*,\s*60\s*,\s*90\s+and\s+115 HP/i.test(listing) &&
      canonicalCommandThrustHps.every((hp) => new RegExp(`(?:^|\\D)${String(hp).replace('.', '\\.')}\\b`).test(listing)) &&
      !/\b25\s*HP\b/i.test(listing),
    `${label} must retain the cache-busted Canadian Command Thrust configurations as of August 8, 2026.`,
  );
  check(surface.includes('/pricing-reference'), `${label} must point readers to the live pricing reference.`);
});

checkSpecRoute('center-console-mercury-motor-guide', (surface, label) => {
  const veradoSection = surface.match(/### Verado \(250 to 600 HP\)[\s\S]*?(?=\n### |\n## |$)/)?.[0] ?? '';
  check(
    !/Verado[\s\S]{0,80}200\s*(?:to|[-–])\s*600 HP/i.test(surface),
    `${label} revived the stale Verado 200-to-600 HP range.`,
  );
  check(
    /\bV8\b/.test(veradoSection) && /\bV10\b/.test(veradoSection) && /\bV12\b/.test(veradoSection),
    `${label} must retain the current Verado V8, V10 and V12 families within the 250-to-600 HP section.`,
  );
  check(/special-order at HBW/i.test(veradoSection), `${label} must retain HBW's Verado special-order disclosure.`);
  check(
    /mercurymarine\.com\/ca\/en\/engines\/outboard\/verado/.test(veradoSection) &&
      /\/pricing-reference/.test(veradoSection),
    `${label} must cite Mercury's Verado lineup and HBW's live availability source.`,
  );
});

checkSpecRoute('best-mercury-for-ski-wakeboard-boats', (surface, label) => {
  const joystickParagraph = surface
    .split(/\n\s*\n/)
    .find((paragraph) => /Joystick Piloting for Single-Engine Outboards with Thruster/i.test(paragraph)) ?? '';
  check(
    !/supports single-engine joystick steering/i.test(surface),
    `${label} revived the broad single-engine joystick claim.`,
  );
  check(
    /Joystick Piloting for Single-Engine Outboards with Thruster/i.test(surface) &&
      /electric[- ]steering/i.test(surface) &&
      /\bVerado\b/.test(surface) &&
      /\bSeaPro\b/.test(surface) &&
      /\bV8\b/.test(surface) &&
      /\bV10\b/.test(surface) &&
      /\bV12\b/.test(surface) &&
      /250 to 600 HP/.test(surface) &&
      /CAN-based variable-speed thruster/i.test(surface),
    `${label} must keep the narrow 250-to-600 HP Verado and SeaPro single-engine thruster-package constraints.`,
  );
  check(
    /not a fit recommendation for the ski and wake hulls/i.test(surface),
    `${label} must state that the package is not a ski/wake hull fit recommendation.`,
  );
  check(
    /mercurymarine\.com\/us\/en\/about-us\/news\/mercury-introduces-joystick-piloting-for-single-engine-outboards\.html/.test(surface),
    `${label} must cite Mercury's February 12, 2025 single-engine thruster-package release.`,
  );
  check(
    joystickParagraph.length > 0 && !/pontoon/i.test(joystickParagraph),
    `${label} must not associate the single-engine joystick package with a pontoon without route-specific evidence.`,
  );
});

for (const slug of [
  'mercury-avator-range-rice-lake-cottage',
  'mercury-avator-charging-cottage-dock',
]) {
  checkSpecRoute(slug, (surface, label) => {
    const chargerContext = surface
      .split(/\n\s*\n/)
      .find((passage) =>
        /110\s*W/i.test(passage) &&
        /standard household outlet/i.test(passage) &&
        /(?:about|approximately|roughly)\s*(?:9|nine)\s*hours/i.test(passage) &&
        /fully depleted/i.test(passage)
      ) ?? '';
    check(
      !/\b3\s*(?:to|[-–])\s*4\s*hours?\b/i.test(surface),
      `${label} revived the incorrect three-to-four-hour Avator charging claim.`,
    );
    check(
      !/(?:9\.5|9½|nine and a half)\s*hours?|offer ends|register by/i.test(surface),
      `${label} contains the expired-promotion charge figure or offer framing.`,
    );
    check(
      /standard household outlet/i.test(chargerContext) &&
        /(?:about|approximately|roughly)\s*(?:9|nine)\s*hours/i.test(chargerContext) &&
        /fully depleted/i.test(chargerContext),
      `${label} must pair the included 110 W charger with a standard outlet and about-nine-hour depleted-battery timing.`,
    );
    check(
      /mercurymarine\.com\/ca\/en\/engines\/electric\/avator\/avator-7-5e/.test(surface) &&
        /EMEA_Avator_Brochure_EN_screen\.pdf/.test(surface),
      `${label} must cite Mercury's current Avator 7.5e page and family brochure.`,
    );
  });
}

checkSpecRoute('mercury-avator-7-5e-review', (surface, label) => {
  check(/110\s*W/i.test(surface) && /standard household outlet/i.test(surface), `${label} must keep the included-charger reference facts.`);
  check(!/\b3\s*(?:to|[-–])\s*4\s*hours?\b/i.test(surface), `${label} contains the retired Avator 7.5e charge time.`);
});

const canonicalMaxProXsHp = Math.max(...skus.filter((sku) => sku.family === 'ProXS').map((sku) => sku.hp));
check(Number.isFinite(canonicalMaxProXsHp), 'Canonical pricing must contain at least one Pro XS SKU.');
check(canonicalMaxProXsHp === 300, `Canonical pricing changed the audited Pro XS maximum from 300 HP to ${canonicalMaxProXsHp} HP; re-review the salmon contract.`);
checkSpecRoute('best-mercury-outboard-lake-ontario-salmon-trout', (surface, label) => {
  const proXsClaims = [
    ...surface.matchAll(/\b(\d{2,3})(?:\s*(?:to|[-–])\s*(\d{2,3}))?\s*HP\s+Pro\s*XS\b/gi),
    ...surface.matchAll(/\bPro\s*XS\s*(?:\(|:)?\s*(\d{2,3})(?:\s*(?:to|[-–])\s*(\d{2,3}))?\s*HP\b/gi),
  ];
  const overMaximum = proXsClaims.filter((match) => Number(match[2] ?? match[1]) > canonicalMaxProXsHp);
  check(
    overMaximum.length === 0,
    `${label} contains a Pro XS claim above the canonical ${canonicalMaxProXsHp} HP maximum: ${overMaximum.map((match) => match[0]).join(', ')}`,
  );
  check(
    surface.includes('300 HP Pro XS V8 or 300–350 HP SeaPro') &&
      surface.includes('Pro XS or FourStroke V8 (200 to 300 HP) plus 15 HP ProKicker'),
    `${label} must retain the approved salmon recommendation and 15 HP ProKicker outcome.`,
  );
});

check(
  checkedSpecRoutes.size === 7,
  `Product-spec integrity must cover exactly seven route-scoped source/twin contracts; found ${checkedSpecRoutes.size}.`,
);

const qualifiedFactoryRigging = 'Many aluminum boats sold here, including models from Lund, Crestliner, Princecraft and Lowe, are commonly rigged with Mercury from the factory. Rigging varies by brand, model and package, so confirm what your specific boat came with.';
const ajaxPartsQualification = 'HBW probably carries the largest Mercury parts inventory in Ontario, but the exact part still depends on the engine serial number and current stock.';
const originalMarketRelatedLink = '[Why Mercury Dominates the Outboard Market in 2026](/blog/why-mercury-dominates-outboard-market), why Mercury leads the outboard market';
const marketRelatedOverride = blogClusters.match(/["']why-mercury-dominates-outboard-market["']\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
const marketRelatedOverrideSlugs = [...marketRelatedOverride.matchAll(/["']([a-z0-9-]+)["']/g)].map((match) => match[1]);
const expectedMarketRelatedOverride = [
  'mercury-vs-yamaha-outboards-ontario',
  'mercury-vs-yamaha-vs-honda-reliability-2026',
  'mercury-vs-suzuki-outboard-reliability-2026',
  'why-harris-boat-works-mercury-dealer',
  'harris-boat-works-since-1947-rice-lake-institution',
];
check(
  JSON.stringify(marketRelatedOverrideSlugs) === JSON.stringify(expectedMarketRelatedOverride),
  'The why-mercury related-guide source override must retain the reviewed five-route order, including Harris history.',
);
const superlativeRouteContracts = [
  {
    slug: 'why-mercury-dominates-outboard-market',
    forbidden: [
      [/deepest service network/i, 'deepest-service-network claim'],
      [/strongest factory relationships/i, 'strongest-factory-relationships claim'],
      [/one of the leading outboard manufacturers in the world by volume/i, 'unsupported manufacturer-volume ranking'],
      [/more dealerships, more certified technicians, and deeper parts supply chains than any other outboard brand/i, 'unsupported dealer and parts ranking'],
      [/one of the strongest dealer networks/i, 'strongest-dealer-network claim'],
      [/On those metrics, Mercury wins in this region/i, 'blanket regional winner FAQ'],
      [/most commonly installed kicker motor on Canadian fishing boats/i, 'unsupported most-common kicker claim'],
      [/Most aluminum fishing boats sold in Canada[\s\S]{0,120}come Mercury-rigged from the factory/i, 'unqualified factory-rigging claim'],
      [/Why do most aluminum boats sold in Ontario come Mercury-rigged\?/i, 'unqualified factory-rigging FAQ question'],
      [/factories rig with Mercury/i, 'unqualified factory-rigging FAQ answer'],
      [/Why Mercury Is a Practical (?:Ontario Outboard Choice|Outboard Choice in Ontario)/i, 'unauthorized SEO retitle'],
    ],
    required: [
      [/Mercury often has practical advantages in Ontario[\s\S]{0,220}service support near where you boat/i, 'qualified quick answer'],
      [/established Ontario service network[\s\S]{0,180}brand our customers were already using/i, 'qualified bias disclosure'],
      [/established outboard manufacturer[\s\S]{0,220}dealer locator for current support/i, 'qualified manufacturer and dealer statement'],
      [/broad Ontario dealer network[\s\S]{0,220}confirm the closest qualified shop/i, 'qualified local-network statement'],
      [/Mercury often fits well in our region[\s\S]{0,120}check support where they boat/i, 'qualified brand-comparison FAQ'],
      [/9\.9 ProKicker is a common kicker choice on Canadian fishing boats/i, 'qualified common-model FAQ'],
      [qualifiedFactoryRigging, 'qualified factory-rigging paragraph'],
      [/Why is Mercury commonly paired with aluminum boats sold in Ontario\?[\s\S]{0,500}Factory rigging varies by brand, model and package/i, 'qualified factory-rigging FAQ'],
    ],
    sourceRequired: [
      [/seoTitle:\s*["']Why Mercury Leads the Outboard Market in 2026 \| HBW["']/, 'original SEO title'],
      [/title:\s*["']Why Mercury Dominates the Outboard Market in 2026["']/, 'original article title'],
      [/description:\s*"Mercury Marine builds outboards from 2\.5 HP to 600 HP, with one of the largest dealer networks in Canada\. What makes Mercury the default choice in Ontario\."/, 'original description'],
      [/content:\s*`# Why Mercury Outboards Make Practical Sense for Ontario Boaters \(And Where We Are Biased\)/, 'original body H1'],
    ],
    twinRequired: [
      [/^title: "Why Mercury Dominates the Outboard Market in 2026"$/m, 'original twin title'],
      [/^description: "Mercury Marine builds outboards from 2\.5 HP to 600 HP, with one of the largest dealer networks in Canada\. What makes Mercury the default choice in Ontario\."$/m, 'original twin description'],
      [/^# Why Mercury Dominates the Outboard Market in 2026$/m, 'original generated H1'],
      [/## Related guides[\s\S]*\[Harris Boat Works: On Rice Lake Since 1947\]\(\/blog\/harris-boat-works-since-1947-rice-lake-institution\), the Harris Boat Works story since 1947/, 'Harris history link in the generated related guides'],
    ],
  },
  {
    slug: 'mercury-vs-yamaha-outboards-ontario',
    forbidden: [
      [/^## Where Mercury wins$/im, 'blanket Mercury-wins heading'],
      [/Mercury wins on dealer network density/i, 'blanket dealer-network winner FAQ'],
      [/practical reliability picture favors Mercury/i, 'blanket reliability winner FAQ'],
    ],
    required: [
      [/^## Where Mercury may fit better$/im, 'qualified comparison heading'],
      [/Mercury often benefits from dealer density[\s\S]{0,220}Check local service access, the exact boat package and resale demand before choosing/i, 'qualified comparison FAQ'],
    ],
    twinRequired: [[originalMarketRelatedLink, 'original inbound market-guide label']],
  },
  {
    slug: 'mercury-vs-yamaha-vs-honda-reliability-2026',
    forbidden: [
      [/On those metrics, Mercury wins in this region/i, 'blanket regional winner'],
      [/deepest dealer network in Ontario/i, 'deepest-dealer-network claim'],
      [/Largest dealer network in Ontario and Canada/i, 'largest-dealer-network claim'],
      [/default kicker motor on most Canadian fishing boats/i, 'unsupported default-kicker claim'],
      [/In Ontario freshwater, Mercury wins on dealer support/i, 'blanket freshwater winner'],
      [/Mercury wins on Ontario dealer density/i, 'blanket decision-card outcome'],
      [/Mercury holds resale value strongest in Ontario/i, 'unsupported resale ranking'],
      [/Mercury dealer network in Canada is the deepest/i, 'deepest Canadian network claim'],
      [/Most Lund, Crestliner, and Princecraft boats come Mercury-rigged from the factory/i, 'unqualified factory-rigging claim'],
    ],
    required: [
      [/practical difference often comes from local dealer access[\s\S]{0,180}Mercury is well represented in our region/i, 'qualified quick answer'],
      [/broad Ontario dealer network[\s\S]{0,220}inventory and appointment timing still need to be confirmed/i, 'qualified dealer-network paragraph'],
      [/Broad Canadian dealer coverage[\s\S]{0,160}common kicker choice/i, 'qualified strengths line'],
      [/In our part of Ontario, Mercury often offers more nearby dealer-support options/i, 'qualified regional service wording'],
      [/Mercury often offers more nearby Ontario dealer options/i, 'qualified decision-card outcome'],
      [/Compare local resale demand for the exact brand, horsepower and boat package/i, 'qualified resale question'],
      [qualifiedFactoryRigging, 'qualified factory-rigging FAQ'],
      [/For Ontario freshwater, compare the nearby authorized service options for both brands/i, 'qualified saltwater FAQ'],
      [/long-running relationships with Canadian boat manufacturers[\s\S]{0,180}Factory rigging still varies by boat brand, model and package/i, 'qualified manufacturer-relationship FAQ'],
    ],
    twinRequired: [[originalMarketRelatedLink, 'original inbound market-guide label']],
  },
  {
    slug: 'mercury-vs-suzuki-outboard-reliability-2026',
    forbidden: [
      [/deepest dealer network in Ontario by a wide margin/i, 'deepest-dealer-network claim'],
      [/largest buyer pool in Ontario/i, 'largest-buyer-pool claim'],
      [/resale pool for Mercury-powered boats in this class is the deepest in Ontario/i, 'deepest-resale-pool claim'],
    ],
    required: [
      [/broad dealer coverage across the Kawarthas, the GTA and Ontario cottage corridors[\s\S]{0,240}Confirm the required part and appointment capacity/i, 'qualified dealer-coverage paragraph'],
      [/Mercury-powered boats are common in the recreational market[\s\S]{0,220}compare current listings rather than assuming one brand always wins/i, 'qualified resale paragraph'],
      [/90 to 115 HP class[\s\S]{0,300}many nearby service options and a familiar resale market/i, 'qualified 90-to-115 HP comparison'],
    ],
    twinRequired: [[originalMarketRelatedLink, 'original inbound market-guide label']],
  },
  {
    slug: 'mercury-dealer-ajax-ontario-hbw',
    forbidden: [[/Premier-tier parts depth and warranty authorization/i, 'unsupported Premier-tier parts-depth claim']],
    required: [
      [ajaxPartsQualification, 'Jay-approved Ajax parts qualification'],
      [/we don't offer indoor, heated, climate-controlled, summer, or year-round storage/i, 'winter-only storage denial'],
      [/physical service resumes when we reopen in early April/i, 'protected early-April reopening wording'],
    ],
  },
  {
    slug: 'mercury-avator-vs-torqeedo',
    forbidden: [
      [/deepest Mercury Premier dealer network in Canada/i, 'deepest Avator dealer-network claim'],
      [/parts, service, and warranty work happen at any Mercury dealer across the country/i, 'any-dealer service promise'],
      [/Mercury Avator wins on infrastructure/i, 'blanket infrastructure winner'],
      [/within an hour of nearly every populated area/i, 'unsupported proximity claim'],
      [/one of the largest outboard manufacturers globally/i, 'unsupported manufacturer ranking'],
      [/^## Where Mercury Avator wins$/im, 'blanket Avator-wins heading'],
    ],
    required: [
      [/deciding factor for many Ontario buyers[\s\S]{0,260}confirm the exact location and capability before buying/i, 'qualified local-service quick answer'],
      [/\| Ontario service access \| Broad Mercury network; confirm Avator capability locally \| More concentrated network; confirm locally \|/, 'qualified service-access table row'],
      [/established global outboard manufacturer/i, 'qualified manufacturer wording'],
      [/Dealer capability, parts inventory and appointment capacity vary[\s\S]{0,180}confirm Avator support directly/i, 'qualified dealer-capability paragraph'],
      [/^## Where Mercury Avator may fit better$/im, 'qualified Avator heading'],
    ],
  },
];

const contractMatch = (surface, matcher) => typeof matcher === 'string' ? surface.includes(matcher) : matcher.test(surface);
for (const contract of superlativeRouteContracts) {
  const [[sourceLabel, source], [twinLabel, twin]] = specRouteSurfaces(contract.slug);
  check(source.length > 0, `${sourceLabel} is missing from the market-claim integrity review.`);
  check(twin.length > 0, `${twinLabel} is missing from the market-claim integrity review.`);

  for (const [label, surface] of [[sourceLabel, source], [twinLabel, twin]]) {
    for (const [matcher, description] of contract.forbidden) {
      check(!contractMatch(surface, matcher), `${label} revived the ${description}.`);
    }
    for (const [matcher, description] of contract.required) {
      check(contractMatch(surface, matcher), `${label} is missing the ${description}.`);
    }
  }

  for (const [matcher, description] of contract.sourceRequired ?? []) {
    check(contractMatch(source, matcher), `${sourceLabel} is missing the ${description}.`);
  }
  for (const [matcher, description] of contract.twinRequired ?? []) {
    check(contractMatch(twin, matcher), `${twinLabel} is missing the ${description}.`);
  }

  const sourceReviewDate = source.match(/dateModified:\s*["'](\d{4}-\d{2}-\d{2})["']/)?.[1] ?? '';
  const twinReviewDate = twin.match(/^date_modified:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1] ?? '';
  check(sourceReviewDate >= '2026-08-08', `${sourceLabel} must be reviewed on or after 2026-08-08.`);
  check(twinReviewDate >= '2026-08-08', `${twinLabel} must be reviewed on or after 2026-08-08.`);
}
check(
  superlativeRouteContracts.length === 6,
  `Market-claim integrity must cover exactly six route-scoped source/twin contracts; found ${superlativeRouteContracts.length}.`,
);

const accuracyFiles = [
  'src/data/blogArticles.ts',
  'src/data/caseStudiesLongForm.ts',
  'src/data/locationsLongForm.ts',
  'src/data/locationsLongFormUpgrades.ts',
  'src/components/tools/BoostEligibilityChecker.tsx',
  'src/components/tools/RepowerCostEstimator.tsx',
  'src/pages/RepowerCost.tsx',
  'src/pages/RepowerHub.tsx',
];
const falseBoost = /Boost[^\n]{0,180}(?:25\s+(?:extra\s+)?(?:HP|horsepower)|4\s*(?:[–-]|to)\s*6\s+seconds|press\s+(?:the\s+)?(?:Boost\s+)?button|button\s+press)/i;
const retiredBoostPricing = /(?:Boost adds 10 HP|Boost Software Upgrade adds HP|Boost[^\n]{0,120}adds roughly \$|BOOST_RANGE:\s*\[|realistic Canadian retail[^\n]{0,80}\$300|typically \$1,500 to \$3,000 CAD)/i;
const falseBoostPlaning = /Boost[^\n]{0,120}(?:improves?|shortens?)[^\n]{0,60}(?:hole[ -]?shot|time to plane)/i;
const blanketBoostBuildDate = /Boost[^\n]{0,160}(?:Q2 2026|built in Q2)/i;
const wrong175Architecture = /(?:V8\s+4\.6L\s+175|175\s+HP\s+(?:Pro\s*XS\s+)?V8)/i;

for (const file of accuracyFiles) {
  const source = read(file);
  check(!falseBoost.test(source), `${file} contains the retired false Boost horsepower/button/duration claim.`);
  check(!retiredBoostPricing.test(source), `${file} contains a retired Boost horsepower or unverified price claim.`);
  check(!falseBoostPlaning.test(source), `${file} incorrectly claims Boost improves hole shot or time to plane.`);
  check(!blanketBoostBuildDate.test(source), `${file} uses a blanket Q2 2026 Boost eligibility rule instead of serial status.`);
  check(!wrong175Architecture.test(source), `${file} describes the 175 HP Pro XS as a 4.6L V8.`);
}

const repowerToolSource = `${read('src/components/tools/RepowerCostEstimator.tsx')}\n${read('src/components/tools/TradeInValueEstimator.tsx')}`;
check(
  !/225-300 HP V6|350-400 HP V8|h === '225-300'[^\n]+\(V6\)|h === '350-400'[^\n]+\(V8\)/.test(repowerToolSource),
  'Repower tools attach a stale engine architecture to a broad horsepower band.',
);

const proXsGuide = blogArticles.match(
  /slug: 'mercury-150-300hp-pro-xs-performance-guide',[\s\S]*?\n\s*},\n\n\s*\/\/ Week 49/,
)?.[0] ?? '';
check(/175 HP V6, and 200-300 HP V8/.test(proXsGuide), 'The Pro XS comparison must preserve the current 175 V6 and 200-300 V8 architecture.');
check(!/(?:175-250 HP V6|200 Pro XS \(V6|225 Pro XS \(V6|250 Pro XS \(V6)/.test(proXsGuide), 'The Pro XS comparison contains a retired V6 architecture claim.');

const mercury90Review = blogArticles.match(
  /slug:\s*["']mercury-90-hp-fourstroke-review-ontario["'],[\s\S]*?\n\s*},\n\n\s*{/,
)?.[0] ?? '';
const mercury115Review = blogArticles.match(
  /slug:\s*["']mercury-115-hp-fourstroke-review-ontario["'],[\s\S]*?\n\s*},\n\n\s*{/,
)?.[0] ?? '';
const mercury150Review = blogArticles.match(
  /slug:\s*["']mercury-150-hp-fourstroke-pro-xs-review-ontario["'],[\s\S]*?\n\s*},\n\n\s*{/,
)?.[0] ?? '';
const mercury200Review = blogArticles.match(
  /slug:\s*["']mercury-200-hp-fourstroke-pro-xs-review-ontario["'],[\s\S]*?\n\s*},\n\n\s*{/,
)?.[0] ?? '';

const socialReviewChecks = [
  {
    label: 'Mercury 90',
    review: mercury90Review,
    currentGeneration: /current 2\.1-litre Mercury 90 introduced in 2014/,
  },
  {
    label: 'Mercury 115',
    review: mercury115Review,
    currentGeneration: /current 2\.1-litre 115 FourStroke and 115 Pro XS/,
  },
  {
    label: 'Mercury 150',
    review: mercury150Review,
    currentGeneration: /current 3\.0-litre 150 FourStroke and 150 Pro XS/,
  },
  {
    label: 'Mercury 200',
    review: mercury200Review,
    currentGeneration: /current 3\.4-litre V6 FourStroke and 4\.6-litre V8 Pro XS/,
  },
];

for (const { label, review, currentGeneration } of socialReviewChecks) {
  check(
    /## What Owners Actually Say Online/.test(review),
    `${label} review must keep its model-specific owner-buzz section.`,
  );
  check(
    currentGeneration.test(review),
    `${label} owner-buzz section must state the screened current engine generation.`,
  );
  check(!review.includes('—'), `${label} review must not contain em dashes.`);
}

check(
  /mercury-115-pro-xs-freshwater-ranger-full\.webp/.test(mercury115Review),
  'The Mercury 115 review must use the full-resolution direct Ranger image asset.',
);
check(
  /On a phone, swipe the table sideways to see every column/.test(mercury115Review),
  'The Mercury 115 comparison table must retain its mobile swipe guidance.',
);
check(
  /title: Mercury 115 Pro XS owner tests 19, 20 and 21-pitch propellers/.test(mercury115Review),
  'The Mercury 115 owner prop-test embed must keep its accurate accessible title.',
);
check(
  /tel:\+19053422153/.test(mercury115Review),
  'The Mercury 115 closing call path must remain tappable.',
);
check(
  /## What This Means on Ontario Water/.test(mercury115Review),
  'The Mercury 115 review must keep its Ontario-use section.',
);
check(
  /mercurymarine\.com\/ca\/en\/lifestyle\/dockline\/mercury-releases-new-mercury-40---115hp-tiller/.test(mercury115Review) &&
    /boats\.com\/reviews\/new-2016-outboards-mercury-and-seven-marine-make-news-in-miami/.test(mercury115Review),
  'The Mercury 115 review must retain its Canadian family-history and direct 2016 launch sources.',
);
check(
  !/mercurymarine\.com\/ch\/fr\/about-us\/news\/mercury-marine-announces-new-150-pro-xs-outboard/.test(mercury115Review),
  'The Mercury 115 review must not cite the Swiss-French 150 Pro XS article as its launch source.',
);
check(
  !/%32%30%32%35/.test(mercury115Review),
  'The Mercury 115 review contains an unnecessarily encoded year in the Princecraft source URL.',
);
check(
  /\[Mercury 115 Pro XS owner tests 19, 20 and 21-pitch propellers\]\(https:\/\/www\.youtube\.com\/watch\?v=HblsKMvjxCU\)/.test(mercury115Twin),
  'The Mercury 115 Markdown twin must preserve the owner prop-test video as a usable link.',
);

check(
  /200 FourStroke is a 3\.4-litre V6/.test(mercury200Review) &&
    /200 Pro XS is a 4\.6-litre V8/.test(mercury200Review),
  'The Mercury 200 review must preserve the current V6 FourStroke and V8 Pro XS architecture.',
);
check(
  /FourStroke's full-throttle range is 5,200–6,000 rpm/.test(mercury200Review) &&
    /Pro XS full-throttle range is 5,600–6,200 rpm/.test(mercury200Review),
  'The Mercury 200 review must preserve the current operating ranges.',
);
check(
  /does not:[\s\S]{0,220}raise the engine's rated horsepower[\s\S]{0,220}increase top speed[\s\S]{0,220}reduce time to plane/.test(mercury200Review),
  'The Mercury 200 review must preserve the official Boost horsepower, top-speed, and planing limits.',
);
check(
  /hero-mercury-200-fourstroke-pro-xs-review-2026-07\.webp/.test(mercury200Review) &&
    /mercury-200-fourstroke-vs-pro-xs-official\.webp/.test(mercury200Review),
  'The Mercury 200 review must keep its exact official-motor hero and comparison graphic.',
);
check(
  !/(?:200 FourStroke\s+(?:is|uses|has)\s+(?:a\s+)?4\.6(?:-litre| L)|200 Pro XS\s+(?:is|uses|has)\s+(?:a\s+)?3\.4(?:-litre| L)|200 Pro XS\s+(?:is|uses|has)\s+(?:a\s+)?V6)/i.test(mercury200Review),
  'The Mercury 200 review contains a retired or swapped engine architecture.',
);

for (const match of blogArticles.matchAll(/relatedSlugs:\s*\[([^\]]*)\]/g)) {
  const slugs = [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((entry) => entry[1]);
  check(new Set(slugs).size === slugs.length, `A blog article repeats a relatedSlugs entry: ${slugs.join(', ')}`);
}

check(
  !/(?:\$4,500\s*[–-]\s*\$6,500|\$22,000\s*[–-]\s*\$26,000)/.test(caseStudies),
  'Illustrative case studies contain a retired fixed installed-price range.',
);
check(
  (baseCaseStudies.match(/isIllustrative:\s*true/g) ?? []).length === 5,
  'All five base case-study cards must remain explicitly illustrative unless customer/job provenance is recorded.',
);
check(
  /is_illustrative:/.test(caseStudyGenerator) && /Illustrative planning scenario:/.test(caseStudyGenerator) && /Planning takeaway/.test(caseStudyGenerator),
  'Generated case-study Markdown must disclose illustrative status and must not label planning copy as a customer quote.',
);

const avatorAccuracyFiles = `${blogArticles}\n${caseStudies}`;
check(
  !/(?:45 minutes at half throttle|3 to 5 hours at a slow trolling|60[–-]90 minutes per battery|~14 kg|roughly four hours|running dual|10 to 20 percent off capacity|last for thousands of cycles|spare battery packs in stock|We have run the Avator|Avator owner we have rigged)/i.test(avatorAccuracyFiles),
  'Avator content contains a retired runtime, charging, battery, or unsupported HBW-experience claim.',
);
check(
  /60 minutes or 5 miles at full throttle/.test(avatorAccuracyFiles) && /19 hours or 34 miles at 25% throttle/.test(avatorAccuracyFiles),
  'Avator content must anchor range to Mercury\'s specified published test and disclose that results vary.',
);

const monthlyArticle = blogArticles.match(
  /slug: 'mercury-outboard-monthly-payment-ontario-2026',[\s\S]*?\n\s*},\n\s*{\n\s*slug: 'mercury-boost-cost-canada-2026'/,
)?.[0] ?? '';
check(/\$349 DealerPlan/.test(monthlyArticle) && /Bare-Motor Price/.test(monthlyArticle), 'Monthly-payment article must label canonical prices as bare-motor and include the $349 DealerPlan fee.');
check(!/\| Engine \| Installed Price|\| Engine \| Installed \(CAD/.test(monthlyArticle), 'Monthly-payment article relabels a bare-motor price as installed.');
check(!/(?:7\.99%|8\.99%|Mercury TD Always On program)/.test(caseStudies), 'Illustrative case studies contain stale or misleading financing-program language.');
const repowerProcessArticle = blogArticles.match(
  /slug: 'what-happens-during-mercury-repower',[\s\S]*?\n\s*},\n\s*{\n\s*slug: 'outboard-shaft-length-guide'/,
)?.[0] ?? '';
check(
  /\$200, \$500, or \$1,000 based on horsepower/.test(repowerProcessArticle) &&
    /boat repower financing through Canadian marine lenders/.test(repowerProcessArticle),
  'Repower-process article must use the live fixed-deposit model and Canadian financing wording.',
);
check(
  !/(?:25% of the all-in cost|Mercury Repower Financing|visit the boat where it['’]s stored|walk-arounds at your dock or storage location)/i.test(repowerProcessArticle),
  'Repower-process article contains a retired percentage deposit, U.S.-associated financing name, or off-site service promise.',
);
check(
  /drop-off only and does not provide boat pickup, hauling, delivery, or mobile service/.test(repowerProcessArticle),
  'Repower-process article must preserve the drop-off-only logistics boundary.',
);
const articleSource = (slug) =>
  blogArticles.match(new RegExp(`slug: ['"]${slug}['"],[\\s\\S]*?\\n\\s*},\\n\\s*{\\n\\s*slug: `))?.[0] ?? '';
const mercury90Vs115Article = articleSource('mercury-90-vs-115-hp-which-outboard-is-right-for-your-ontario-boat');
check(
  /Command Thrust: Who It's Actually For/.test(mercury90Vs115Article) &&
    /standard gearcase is the right choice for a planing aluminum or fibreglass V-hull/.test(mercury90Vs115Article),
  'The 90-vs-115 guide must preserve the pontoon/workboat Command Thrust boundary for planing V-hulls.',
);
check(
  !/(?:sensible upgrade that we routinely recommend|CT gearcase is worth considering on either engine|especially with Command Thrust|Pairing it with Command Thrust)/i.test(
    mercury90Vs115Article,
  ) && !/6 mph faster/i.test(mercury90Vs115Article),
  'The 90-vs-115 guide must not recommend Command Thrust as a V-hull load upgrade or hard-code the boat-specific speed delta.',
);
const mercury115Vs150Article = articleSource('mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026');
check(
  /we do not use Command Thrust to make a 115 behave like a 150/.test(mercury115Vs150Article),
  'The 115-vs-150 guide must preserve the V-hull Command Thrust correction.',
);
check(
  !/Tom K\.|115 Command Thrust will do everything you want/i.test(mercury115Vs150Article),
  'The 115-vs-150 guide must not restore the Tom K. Command Thrust testimonial.',
);
const dealerHeroCanon = [
  {
    slug: 'mercury-dealer-markham-ontario-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
  },
  {
    slug: 'mercury-dealer-richmond-hill-ontario-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-mercury-75-90-115-official-freshwater-2026-07.webp',
  },
  {
    slug: 'mercury-dealer-northumberland-county-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-mercury-spring-run-up-hbw-service-2026-07.webp',
  },
  {
    slug: 'mercury-dealer-mississauga-ontario-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
  },
  {
    slug: 'mercury-dealer-vaughan-ontario-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-d/hero-mercury-vaughan-hbw-service-real-2026-07.webp',
  },
  {
    slug: 'mercury-dealer-whitby-ontario-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-mercury-pontoon-90ct-freshwater-2026-07.webp',
  },
  {
    slug: 'mercury-dealer-oshawa-ontario-hbw',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-pontoon-outboard-115-freshwater-2026-07.webp',
  },
];
for (const { slug, image } of dealerHeroCanon) {
  const source = articleSource(slug);
  check(source.includes(`image: '${image}'`), `${slug} must use its provenance-documented HBW or official Mercury hero.`);
  check(
    !/(?:hero-gta-(?:mississauga|richmond-hill|vaughan)|hero-mercury-(?:90-shop-shot|dealer-(?:whitby|oshawa)))/.test(source),
    `${slug} must not regress to a false-branded or unproven generated dealer hero.`,
  );
}
const repowerEligibilityArticle = articleSource('mercury-repower-eligibility-guide');
check(
  repowerEligibilityArticle.includes(
    "image: '/lovable-uploads/blog-heroes-2026-07/hero-repair-repower-sell-hbw-real-2026-07.webp'",
  ),
  'The repower-eligibility guide must keep its authenticated HBW shop hero.',
);
check(
  repowerEligibilityArticle.includes(
    '/lovable-uploads/blog-graphics-2026-08/repower-fit-five-checks-2026-08.png',
  ),
  'The repower-eligibility guide must keep its claim-bounded five-check visual.',
);
check(
  !/(?:hero-mercury-repower-eligibility-guide|repower-eligibility-5-check-card|repower-eligibility-five-check)/.test(
    repowerEligibilityArticle,
  ),
  'The repower-eligibility guide must not regress to its synthetic hero or unsupported legacy decision cards.',
);
const authenticatedServiceHeroCanon = [
  {
    slug: 'mercury-water-pump-replacement-cost-ontario',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-d/hero-mercury-vaughan-hbw-service-real-2026-07.webp',
  },
  {
    slug: 'mercury-impeller-replacement-when-they-fail',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-mercury-spring-run-up-hbw-service-2026-07.webp',
  },
];
for (const { slug, image } of authenticatedServiceHeroCanon) {
  const source = articleSource(slug);
  check(source.includes(`image: '${image}'`) || source.includes(`image: "${image}"`), `${slug} must keep its authenticated HBW service hero.`);
  check(
    !source.includes('/lovable-uploads/hero-mercury-90-shop-shot.png'),
    `${slug} must not regress to the synthetic Mercury service-bay hero.`,
  );
}
for (const slug of ['mercury-dealer-whitby-ontario-hbw', 'mercury-dealer-oshawa-ontario-hbw']) {
  const source = articleSource(slug);
  check(
    /standard repower lineup is FourStroke and Pro XS/.test(source) &&
      /Verado is available on special order/.test(source) &&
      /SeaPro is a commercial-duty option we bring in to order/.test(source),
    `${slug} must preserve the accurate Verado special-order and SeaPro commercial-order framing.`,
  );
}
check(
  !/(?:twice the hole shot|10 seconds to 5 seconds|2[–-]3 mph|11[–-]13-inch|mid-50s mph|about half the time the old 90|20[–-]30% better fuel)/i.test(caseStudies),
  'Illustrative case studies contain an unsupported exact performance result.',
);

check(/FACTORY_STANDARD_SERIAL\s*=\s*'3B612425'/.test(boostChecker), 'Boost checker must recognize the standard factory-equipped threshold at 3B612425.');
check(/MAX_VERADO_350_DEALER_SERIAL\s*=\s*'3B578265'/.test(boostChecker), 'Boost checker must stop paid 350 eligibility at serial 3B578265.');
check(/FACTORY_VERADO_350_SERIAL\s*=\s*'3B578266'/.test(boostChecker), 'Boost checker must flag 350 serial 3B578266 and newer for factory-status review.');
check(
  (caseStudies.match(/isIllustrative:\s*true/g) ?? []).length === 7,
  'All seven long-form planning scenarios must remain explicitly illustrative.',
);

function walk(dir, predicate) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path, predicate));
    else if (predicate(path)) out.push(path);
  }
  return out;
}

const blogMarkdownFiles = walk('public/blog', (path) => path.endsWith('.md'));
const blogPublishingSurface = `${blogArticles}\n${blogMarkdownFiles.map(read).join('\n')}`;
for (const bannedLender of ['Medallion', 'Sheffield', 'LightStream', 'Financeit']) {
  check(
    !new RegExp(`\\b${bannedLender}\\b`, 'i').test(blogPublishingSurface),
    `Blog source or Markdown twins must not promote the US-only or non-partner lender ${bannedLender}.`,
  );
}
check(
  !/Mercury Repower Financing|Mercury repower financing|Mercury Marine financing programs|Mercury offers competitive repower financing/i.test(blogPublishingSurface),
  'Blog source or Markdown twins still contain US-program or generic Mercury-financing wording.',
);

for (const file of blogMarkdownFiles) {
  check(!/\{\{LIVE_RATE(?:_PCT)?\}\}/.test(read(file)), `${file} contains an unresolved live-rate placeholder.`);
}
for (const file of walk('public/case-studies', (path) => path.endsWith('.md'))) {
  const markdown = read(file);
  check(/is_illustrative:\s*true/.test(markdown), `${file} is missing illustrative frontmatter.`);
  check(/Illustrative planning scenario:/.test(markdown), `${file} is missing the agent-facing illustrative disclosure.`);
  check(!/## Customer quote/.test(markdown), `${file} labels planning prose as a customer quote.`);
}

mkdirSync('reports', { recursive: true });
writeFileSync(
  'reports/blog-regulatory-review.json',
  `${JSON.stringify({
    evaluatedAt: now.toISOString(),
    pclFeeReviewedOn: pclFeeReviewedOn.toISOString().slice(0, 10),
    latestAprilReview: latestAprilReview.toISOString().slice(0, 10),
    stale: pclFeeReviewStale,
    warnings,
    hardFailureCount: failures.length,
    pclRoutes: pclRouteReview.map(({ slug, amounts, hasBare24 }) => ({ slug, amounts, hasBare24 })),
  }, null, 2)}\n`,
);

if (warnings.length) {
  console.warn('\nPublishing integrity warnings\n');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error('\nPublishing integrity check FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Publishing integrity check passed: canonical Pro XS pricing, Boost/175 accuracy, illustrative scenarios, and generated-rate tokens.');
