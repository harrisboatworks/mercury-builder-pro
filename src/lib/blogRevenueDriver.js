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
  'mercury-dealer-ajax-ontario-hbw',
  'mercury-dealer-bowmanville-ontario-hbw',
  'mercury-dealer-brampton-ontario-hbw',
  'mercury-dealer-burlington-ontario-hbw',
  'mercury-dealer-cobourg-ontario-hbw',
  'mercury-dealer-lindsay-ontario-hbw',
  'mercury-dealer-markham-ontario-hbw',
  'mercury-dealer-mississauga-ontario-hbw',
  'mercury-dealer-northumberland-county-hbw',
  'mercury-dealer-oakville-ontario-hbw',
  'mercury-dealer-oshawa-ontario-hbw',
  'mercury-dealer-peterborough-ontario-hbw',
  'mercury-dealer-pickering-ontario-hbw',
  'mercury-dealer-port-hope-ontario-hbw',
  'mercury-dealer-richmond-hill-ontario-hbw',
  'mercury-dealer-vaughan-ontario-hbw',
  'mercury-dealer-whitby-ontario-hbw',
  'mercury-outboard-dealer-toronto-why-drive-to-hbw',
]);

const SERVICE_SLUGS = new Set([
  'boat-electrical-safety-checklist-ontario-freshwater',
  'boat-storage-kawartha-lakes',
  'boat-trailering-mistakes-ontario',
  'common-pontoon-boat-problems-rice-lake',
  'diy-mercury-outboard-winterization-guide',
  'mercury-boat-battery-guide-ontario',
  'mercury-outboard-overheat-alarm-decoder',
  'mercury-outboard-overheating-at-idle-fix-ontario',
  'mercury-outboard-spring-run-up-checklist-ontario',
  'mercury-outboard-warranty-canada-2026',
  'mercury-smartcraft-connect-guide-ontario',
  'outdoor-boat-storage-shrinkwrap-rice-lake',
  'spring-outboard-commissioning-checklist',
  'used-boat-walkaround-inspection-ontario',
  'walleye-opener-boat-prep',
]);

const RENTAL_SLUGS = new Set([
  'docking-boat-in-wind-rice-lake',
  'group-boat-rentals-rice-lake',
  'rice-lake-boat-launch-guide',
  'rice-lake-boat-rental-guide-2026',
  'rice-lake-boating-guide-2026',
  'trent-severn-waterway-boating-guide-2026',
]);

const SPECIAL_REVENUE_SLUGS = new Map([
  ['mercury-avator-electric-boating-ontario', BLOG_REVENUE_DRIVER.AVATOR],
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
    case BLOG_REVENUE_DRIVER.SERVICE: return 'https://hbw.wiki/service';
    case BLOG_REVENUE_DRIVER.RENTALS: return 'https://harrisboatworks.ca/rentals';
    case BLOG_REVENUE_DRIVER.REPOWER: return '/quote/motor-selection';
    case BLOG_REVENUE_DRIVER.AVATOR: return '/electric/mercury-avator';
    case BLOG_REVENUE_DRIVER.PRODUCT_PROTECTION: return '/mercury-product-protection';
    case BLOG_REVENUE_DRIVER.COMMERCIAL: return '/contact';
    default: return null;
  }
}
