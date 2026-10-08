export const BLOG_REVENUE_DRIVER = Object.freeze({
  REPOWER: 'repower',
  SERVICE: 'service',
  RENTALS: 'rentals',
  AVATOR: 'avator',
  PRODUCT_PROTECTION: 'product-protection',
  COMMERCIAL: 'commercial',
  NONE: 'none',
});

const DEALER_REPOWER_SLUGS = new Set([
  'mercury-dealer-bowmanville-ontario-hbw',
  'mercury-dealer-whitby-ontario-hbw',
  'mercury-outboard-dealer-toronto-why-drive-to-hbw',
]);

const SERVICE_SLUGS = new Set([
  'best-marina-rice-lake-ontario',
  'boat-electrical-safety-checklist-ontario-freshwater',
  'boat-storage-kawartha-lakes',
  'boat-trailering-mistakes-ontario',
  'boat-winterization-storage-toronto-urdu',
  'breaking-in-new-mercury-motor-guide',
  'common-pontoon-boat-problems-rice-lake',
  'diy-mercury-outboard-winterization-guide',
  'gta-chinese-rice-lake-winter-storage-complete-guide',
  'how-to-trim-boat-mercury-outboard',
  'mercury-boat-battery-guide-ontario',
  'mercury-boost-cost-canada-2026',
  'mercury-boost-software-upgrade-eligibility-2026',
  'mercury-boost-upgrade-150hp-pontoon-analysis',
  'mercury-fuel-octane-ethanol-chinese-guide',
  'mercury-nmea-2000-lowrance-garmin-guide',
  'mercury-outboard-overheat-alarm-decoder',
  'mercury-outboard-overheating-at-idle-fix-ontario',
  'mercury-outboard-spring-run-up-checklist-ontario',
  'mercury-outboard-warranty-canada-2026',
  'mercury-propeller-selection-guide',
  'mercury-smartcraft-connect-guide-ontario',
  'ontario-boat-winterization-guide-chinese',
  'ontario-boating-season-tips',
  'outdoor-boat-storage-shrinkwrap-rice-lake',
  'spring-outboard-commissioning-checklist',
  'trailer-boat-toronto-to-rice-lake-guide',
  'used-boat-walkaround-inspection-ontario',
  'walleye-opener-boat-prep',
]);

const RENTAL_SLUGS = new Set([
  'docking-boat-in-wind-rice-lake',
  'first-time-fishing-rice-lake-tagalog-family-guide',
  'group-boat-rentals-rice-lake',
  'gta-chinese-pcl-fishing-licence-guide',
  'gta-chinese-rice-lake-day-trip-plan',
  'guia-pesca-rice-lake-ontario',
  'ontario-boat-licence-fishing-licence-hindi',
  'ontario-fishing-licence-punjabi-guide',
  'ontario-fishing-licence-rice-lake-urdu',
  'pcoc-pcl-fishing-licence-difference-ontario',
  'peche-lac-rice-ontario-guide-plaisanciers',
  'renting-vs-owning-boat-ontario-math',
  'rice-lake-boat-launch-guide',
  'rice-lake-boat-rental-guide-2026',
  'rice-lake-boating-guide-2026',
  'rice-lake-fishing-guide',
  'rice-lake-fishing-guide-toronto-chinese',
  'toronto-fishing-rice-lake-vs-lake-simcoe-kawarthas',
  'trent-severn-waterway-boating-guide-2026',
]);

const SPECIAL_REVENUE_SLUGS = new Map([
  ['mercury-avator-electric-boating-ontario', BLOG_REVENUE_DRIVER.AVATOR],
  ['mercury-avator-7-5e-review', BLOG_REVENUE_DRIVER.AVATOR],
  ['mercury-avator-charging-cottage-dock', BLOG_REVENUE_DRIVER.AVATOR],
  ['mercury-avator-range-rice-lake-cottage', BLOG_REVENUE_DRIVER.AVATOR],
  ['mercury-avator-vs-torqeedo', BLOG_REVENUE_DRIVER.AVATOR],
  ['moteur-hors-bord-electrique-mercury-avator', BLOG_REVENUE_DRIVER.AVATOR],
  ['mercury-avator-jeondong-seonoegi', BLOG_REVENUE_DRIVER.AVATOR],
  ['garantie-prolongee-mercury-platinum-ontario', BLOG_REVENUE_DRIVER.PRODUCT_PROTECTION],
  ['mercury-extended-warranty-platinum-ontario', BLOG_REVENUE_DRIVER.PRODUCT_PROTECTION],
  ['mercury-seapro-commercial-outboard-guide', BLOG_REVENUE_DRIVER.COMMERCIAL],
]);

const NO_CTA_SLUGS = new Set([
  'harris-boat-works-since-1947-rice-lake-institution',
]);

const SERVICE_CATEGORY_RE = /^(?:service|maintenance|troubleshooting|winterization|diagnostics|service & maintenance|service & troubleshooting|entretien|d[eé]pannage|mantenimiento|maintenance|정비 가이드)$/i;
const RENTAL_CATEGORY_RE = /^(?:rental|rentals|boat hire|location de bateau|alquiler|租船|租船与钓鱼|렌탈)$/i;
const SERVICE_SLUG_RE = /(?:^|-)(?:alarm|beep|fault-code|wont-start|overheat|electrical|impeller|gearcase-oil|diagnostic|maintenance|winteriz|service|commission)(?:-|$)/;
const RENTAL_SLUG_RE = /(?:^|-)rentals?(?:-|$)/;

export function normalizeBlogCategory(category = '') {
  const value = String(category || '').trim();
  return /^(?:service area|dealer locations)$/i.test(value)
    ? 'Dealer Locations'
    : value;
}

export function getBlogRevenueDriver(category = '', slug = '') {
  const s = String(slug || '').toLowerCase();
  const cat = normalizeBlogCategory(category).toLowerCase();

  if (NO_CTA_SLUGS.has(s)) return BLOG_REVENUE_DRIVER.NONE;
  if (DEALER_REPOWER_SLUGS.has(s)) return BLOG_REVENUE_DRIVER.REPOWER;
  if (SPECIAL_REVENUE_SLUGS.has(s)) return SPECIAL_REVENUE_SLUGS.get(s);
  if (SERVICE_SLUGS.has(s)) return BLOG_REVENUE_DRIVER.SERVICE;
  if (RENTAL_SLUGS.has(s)) return BLOG_REVENUE_DRIVER.RENTALS;
  if (SERVICE_CATEGORY_RE.test(cat) || SERVICE_SLUG_RE.test(s)) return BLOG_REVENUE_DRIVER.SERVICE;
  if (RENTAL_CATEGORY_RE.test(cat) || RENTAL_SLUG_RE.test(s)) return BLOG_REVENUE_DRIVER.RENTALS;
  return BLOG_REVENUE_DRIVER.REPOWER;
}

export function getBlogRevenuePath(driver) {
  switch (driver) {
    case BLOG_REVENUE_DRIVER.SERVICE: return 'https://hbwservice.ca';
    case BLOG_REVENUE_DRIVER.RENTALS: return 'https://harrisboatworks.ca/rentals';
    case BLOG_REVENUE_DRIVER.REPOWER: return '/quote/motor-selection';
    case BLOG_REVENUE_DRIVER.AVATOR: return '/electric/mercury-avator';
    case BLOG_REVENUE_DRIVER.PRODUCT_PROTECTION: return '/mercury-product-protection';
    case BLOG_REVENUE_DRIVER.COMMERCIAL: return '/contact';
    default: return null;
  }
}
