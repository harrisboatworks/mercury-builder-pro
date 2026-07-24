#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadCanonicalPricing } from './lib/canonical-pricing.mjs';

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const read = (path) => readFileSync(path, 'utf8');
const proXsSeo = read('src/components/seo/MercuryProXSSEO.tsx');
const proXsPage = read('src/pages/landing/MercuryProXS.tsx');
const vercelConfig = read('vercel.json');
const prerenderScript = read('scripts/static-prerender.mjs');
const brandMetadata = read('public/.well-known/brand.json');
const blogArticles = read('src/data/blogArticles.ts');
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
const parsedVercelConfig = JSON.parse(vercelConfig);

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
  /"source":\s*"\/blog\/fr\/concessionnaire-mercury-platinum-ontario"[\s\S]{0,160}"destination":\s*"\/blog\/fr\/concessionnaire-mercury-platinum-ontario\/index\.html"/.test(vercelConfig),
  'vercel.json must preserve the standalone French article prerender route.',
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

for (const file of walk('public/blog', (path) => path.endsWith('.md'))) {
  check(!/\{\{LIVE_RATE(?:_PCT)?\}\}/.test(read(file)), `${file} contains an unresolved live-rate placeholder.`);
}
for (const file of walk('public/case-studies', (path) => path.endsWith('.md'))) {
  const markdown = read(file);
  check(/is_illustrative:\s*true/.test(markdown), `${file} is missing illustrative frontmatter.`);
  check(/Illustrative planning scenario:/.test(markdown), `${file} is missing the agent-facing illustrative disclosure.`);
  check(!/## Customer quote/.test(markdown), `${file} labels planning prose as a customer quote.`);
}

if (failures.length) {
  console.error('\nPublishing integrity check FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Publishing integrity check passed: canonical Pro XS pricing, Boost/175 accuracy, illustrative scenarios, and generated-rate tokens.');
