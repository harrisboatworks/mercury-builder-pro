/**
 * Blog translation route registry.
 *
 * A group represents one search intent offered in multiple languages. The
 * registry is the only source for article-level hreflang in the hydrated app,
 * prerendered HTML, and sitemap. Traditional Chinese pilot routes remain
 * intentionally excluded while they are noindex and awaiting native review.
 */

export const BLOG_LOCALES = {
  en: { hrefLang: 'en-CA', prefix: '/blog' },
  fr: { hrefLang: 'fr-CA', prefix: '/blog/fr' },
  ko: { hrefLang: 'ko', prefix: '/blog/ko' },
  zh: { hrefLang: 'zh-Hans', prefix: '/blog/zh' },
  es: { hrefLang: 'es', prefix: '/blog/es' },
  pa: { hrefLang: 'pa', prefix: '/blog/pa' },
  ur: { hrefLang: 'ur', prefix: '/blog/ur' },
  tl: { hrefLang: 'tl', prefix: '/blog/tl' },
  hi: { hrefLang: 'hi', prefix: '/blog/hi' },
};

export const BLOG_TRANSLATION_GROUPS = [
  { en: 'mercury-repower-cost-ontario-2026-cad', fr: 'prix-remotorisation-mercury-ontario' },
  {
    en: 'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026',
    fr: 'mercury-115-vs-150-hp-comparaison',
    ko: 'mercury-115-vs-150-comparison',
    zh: 'mercury-115-vs-150-comparison-zh',
    es: 'mercury-115-vs-150-comparacion',
  },
  {
    en: 'diy-mercury-outboard-winterization-guide',
    fr: 'hivernisation-moteur-mercury-ontario',
    ko: 'mercury-outboard-winterization-guide',
    zh: 'ontario-boat-winterization-guide-chinese',
    es: 'preparacion-invernal-motor-mercury',
    tl: 'outboard-service-winterization-tagalog',
  },
  { en: 'boat-repowering-guide-when-to-replace-motor', fr: 'remotorisation-vs-bateau-neuf' },
  {
    en: '2026-rice-lake-fishing-season-outlook',
    fr: 'peche-lac-rice-ontario-guide-plaisanciers',
    ko: 'rice-lake-fishing-guide',
    zh: 'rice-lake-fishing-guide-toronto-chinese',
    es: 'guia-pesca-rice-lake-ontario',
    pa: 'ontario-fishing-licence-punjabi-guide',
    ur: 'ontario-fishing-licence-rice-lake-urdu',
    tl: 'first-time-fishing-rice-lake-tagalog-family-guide',
  },
  {
    en: 'pleasure-craft-licence-update-repower-ontario',
    fr: 'permis-bateau-ontario-carte-conducteur-embarcation',
    ko: 'ontario-boating-licence-regulations',
    zh: 'ontario-boating-regulations-zh',
    es: 'licencia-navegacion-ontario-regulaciones',
    pa: 'boat-licence-rental-ontario-punjabi-pcoc-faq',
    tl: 'ontario-boat-rental-rules-tagalog-pcoc',
    hi: 'ontario-boat-licence-fishing-licence-hindi',
  },
  {
    en: 'mercury-outboard-wont-start-troubleshooting',
    fr: 'mercury-hors-bord-ne-demarre-pas-depannage',
  },
  { en: 'mercury-repower-gta-toronto-destination', fr: 'remotorisation-mercury-gta-toronto' },
  { en: 'mercury-75-hp-fourstroke-review-ontario', fr: 'revue-mercury-75-hp-fourstroke-ontario' },
  { en: 'mercury-90-hp-fourstroke-review-ontario', fr: 'revue-mercury-90-hp-fourstroke-ontario' },
  { en: 'mercury-115-hp-fourstroke-review-ontario', fr: 'revue-mercury-115-hp-fourstroke-ontario' },
  { en: 'mercury-outboard-overheating-at-idle-fix-ontario', fr: 'surchauffe-moteur-mercury-guide-urgence' },
  { en: 'boat-trailer-maintenance-guide-ontario', fr: 'entretien-remorque-bateau-ontario' },
  { en: 'boat-insurance-ontario-guide-2026', fr: 'guide-assurance-bateau-ontario-2026' },
  { en: 'mercury-extended-warranty-platinum-ontario', fr: 'garantie-prolongee-mercury-platinum-ontario' },
  { en: 'mercury-outboard-lineup-ontario', fr: 'gamme-mercury-hors-bord-2026-ontario' },
  {
    en: 'mercury-avator-electric-boating-ontario',
    fr: 'moteur-hors-bord-electrique-mercury-avator',
    ko: 'mercury-avator-jeondong-seonoegi',
  },
  {
    en: 'fourstroke-vs-pro-xs',
    fr: 'mercury-pro-xs-fourstroke-verado',
    ko: 'mercury-pro-xs-fourstroke-verado',
    zh: 'mercury-fourstroke-pro-xs-verado-chinese-comparison',
  },
  {
    en: 'mercury-outboard-weight-chart',
    fr: 'poids-moteur-hors-bord-mercury',
    ko: 'mercury-seonoegi-muge',
  },
  {
    en: 'repower-vs-new-boat',
    ko: 'repower-vs-new-boat',
    zh: 'mercury-repower-guide-gta',
    es: 'remotorizacion-vs-bote-nuevo',
  },
  {
    en: '2026-boating-market-ontario-boat-buyers',
    ko: 'ontario-boat-buying-guide',
    zh: 'gta-chinese-buy-boat-rice-lake-guide',
    es: 'guia-comprar-bote-ontario',
  },
  {
    en: 'outdoor-boat-storage-shrinkwrap-rice-lake',
    zh: 'gta-chinese-rice-lake-winter-storage-complete-guide',
    ur: 'boat-winterization-storage-toronto-urdu',
  },
  { en: 'best-mercury-outboard-lake-simcoe-walleye-fishing', zh: 'chinese-anglers-lake-simcoe-mercury-outboard' },
  { en: 'best-mercury-outboard-pontoon-boats', zh: 'chinese-family-pontoon-mercury-outboard' },
  { en: 'mercury-9-9-vs-15-hp-tiller-ontario', zh: 'mercury-9-9-20hp-chinese-kicker-tiller-guide' },
  { en: 'mercury-40-vs-60-hp-outboard-ontario', zh: 'mercury-40-60hp-chinese-fishing-boat-guide' },
  {
    en: 'why-harris-boat-works-mercury-dealer',
    fr: 'concessionnaire-mercury-premier-ontario',
    zh: 'why-chinese-boaters-choose-harris-boat-works',
  },
  { en: 'boat-rental-licence-ontario-guide', zh: 'pcoc-vs-rental-boat-safety-checklist-zh' },
  { en: 'pontoon-vs-v-hull-comparison-ontario', zh: 'pontoon-vs-fishing-boat-6-8-people-zh' },
  { en: 'mercury-100-hour-service-cost-ontario', zh: 'gta-chinese-mercury-service-guide' },
  { en: 'rice-lake-boat-rentals-from-toronto-gta', zh: 'gta-chinese-rice-lake-day-trip-plan' },
  { en: 'rice-lake-boating-guide-2026', zh: 'gta-chinese-pcl-fishing-licence-guide' },
  { en: 'best-mercury-outboard-rice-lake-fishing', zh: 'toronto-fishing-rice-lake-vs-lake-simcoe-kawarthas' },
  { en: 'how-to-choose-right-horsepower-boat', zh: 'mercury-outboard-horsepower-guide-toronto-chinese' },
  {
    en: 'ontario-mercury-outboard-price-guide',
    zh: 'mercury-outboard-price-dealer-guide-toronto-chinese',
    pa: 'mercury-outboard-prices-ontario-punjabi',
  },
  { en: 'spring-outboard-commissioning-checklist', zh: 'ontario-spring-boat-checklist-chinese' },
  {
    en: 'used-boat-walkaround-inspection-ontario',
    zh: 'used-boat-buying-checklist-toronto-chinese',
    ur: 'used-boat-buying-checklist-urdu',
  },
  { en: 'mercury-outboard-repair-guide', zh: 'mercury-outboard-troubleshooting-chinese-ontario' },
  { en: 'total-cost-of-owning-a-boat-ontario-2026', zh: 'boat-ownership-cost-ontario-chinese' },
  { en: 'renting-vs-owning-boat-ontario-math', zh: 'gta-chinese-rent-to-buy-boat-roadmap' },
  { en: 'first-time-boat-rental-rice-lake-guide', zh: 'first-boat-rental-rice-lake-chinese-guide' },
  {
    en: 'ethanol-octane-mercury-outboard-fuel-guide-ontario',
    zh: 'mercury-fuel-octane-ethanol-chinese-guide',
  },
];

const routeToGroup = new Map();

for (const group of BLOG_TRANSLATION_GROUPS) {
  if (!group.en) throw new Error('Every blog translation group requires an English route.');
  for (const [locale, slug] of Object.entries(group)) {
    if (!BLOG_LOCALES[locale]) throw new Error(`Unknown blog locale: ${locale}`);
    const key = `${locale}:${slug}`;
    if (routeToGroup.has(key)) throw new Error(`Duplicate blog translation route: ${key}`);
    routeToGroup.set(key, group);
  }
}

export function getBlogHreflangAlternates(locale, slug) {
  const group = routeToGroup.get(`${locale}:${slug}`);
  if (!group) return [];

  const alternates = Object.entries(group).map(([key, routeSlug]) => {
    const config = BLOG_LOCALES[key];
    return {
      hrefLang: config.hrefLang,
      path: `${config.prefix}/${routeSlug}`,
    };
  });

  const english = alternates.find((alternate) => alternate.hrefLang === 'en-CA');
  if (!english) throw new Error(`Blog translation group has no English alternate: ${locale}:${slug}`);
  alternates.push({ hrefLang: 'x-default', path: english.path });
  return alternates;
}

export function getBlogTranslationGroup(locale, slug) {
  return routeToGroup.get(`${locale}:${slug}`) || null;
}
