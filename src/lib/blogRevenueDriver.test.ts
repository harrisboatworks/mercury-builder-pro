import { describe, expect, it } from 'vitest';
import { BLOG_REVENUE_DRIVER, getBlogRevenueDriver, getBlogRevenuePath, normalizeBlogCategory } from './blogRevenueDriver.js';

const dealerSlugs = [
  'bowmanville', 'whitby',
].map((city) => `mercury-dealer-${city}-ontario-hbw`).concat([
  'mercury-outboard-dealer-toronto-why-drive-to-hbw',
]);

describe('blog revenue driver', () => {
  it.each(dealerSlugs)('keeps dealer route %s on the repower path', (slug) => {
    expect(getBlogRevenueDriver('Service Area', slug)).toBe(BLOG_REVENUE_DRIVER.REPOWER);
  });

  it('normalizes both dealer category labels without treating Service Area as service', () => {
    expect(normalizeBlogCategory('Service Area')).toBe('Dealer Locations');
    expect(normalizeBlogCategory('Dealer Locations')).toBe('Dealer Locations');
    expect(getBlogRevenueDriver('Service Area', 'regional-dealer-guide')).toBe(BLOG_REVENUE_DRIVER.REPOWER);
  });

  it.each([
    ['Service & Maintenance', 'seasonal-engine-care'],
    ['Buying Guide', 'mercury-outboard-overheat-alarm-decoder'],
    ['Dépannage', 'guide-depannage-moteur'],
  ])('routes genuine service content to service', (category, slug) => {
    expect(getBlogRevenueDriver(category, slug)).toBe(BLOG_REVENUE_DRIVER.SERVICE);
  });

  it.each([
    ['Boating Lifestyle', 'group-boat-rentals-rice-lake'],
    ['租船与钓鱼', 'first-boat-rental-rice-lake-chinese-guide'],
  ])('routes genuine rental content to rentals', (category, slug) => {
    expect(getBlogRevenueDriver(category, slug)).toBe(BLOG_REVENUE_DRIVER.RENTALS);
  });

  it('keeps the warranty article on its dedicated product-protection path', () => {
    const driver = getBlogRevenueDriver('Warranty & Protection', 'mercury-extended-warranty-platinum-ontario');
    expect(driver).toBe(BLOG_REVENUE_DRIVER.PRODUCT_PROTECTION);
    expect(getBlogRevenuePath(driver)).toBe('/mercury-product-protection');
  });

  it('assigns repower to the five former zero-CTA slugs and trade-in content', () => {
    for (const slug of ['aluminum-vs-fiberglass-hull-ontario', 'best-boats-rice-lake-under-30000', 'boat-insurance-ontario-guide-2026', 'late-season-boating-safety', 'pleasure-craft-licence-update-repower-ontario', 'outboard-trade-in-value-ontario-hbw']) {
      expect(getBlogRevenueDriver('Boating', slug)).toBe(BLOG_REVENUE_DRIVER.REPOWER);
    }
  });

  it('suppresses only the Harris history commercial CTA', () => {
    const driver = getBlogRevenueDriver('About HBW', 'harris-boat-works-since-1947-rice-lake-institution');
    expect(driver).toBe(BLOG_REVENUE_DRIVER.NONE);
    expect(getBlogRevenuePath(driver)).toBeNull();
  });
});
