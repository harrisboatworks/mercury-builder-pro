import { describe, expect, it } from 'vitest';

import manifest from '@/data/imageVariantsManifest.json';

const SHOP_BASES = [
  '/images/shop/boat-drop-off-hbw-yard-bowrider-trailer',
  '/images/shop/harris-boat-works-shop-exterior-rice-lake',
  '/images/shop/hbw-launch-ramp-docks-rice-lake',
  '/images/shop/hbw-parts-counter-gores-landing',
  '/images/shop/hbw-service-bay-doors-boat-in-shop',
  '/images/shop/hbw-tractor-trailer-haul-out-office',
  '/images/shop/mercruiser-sterndrive-service-hbw-shop',
  '/images/shop/mercury-115-serial-model-label-transom',
  '/images/shop/mercury-pro-xs-pontoon-rigging-service-bay',
  '/images/shop/mercury-water-pump-repair-kits-parts-shelf',
];

const NEW_HERO_WIDTHS = {
  '/lovable-uploads/blog-photos-2026-10/avator-7-5e-cottage-dock': [640, 1024, 1920],
  '/lovable-uploads/blog-photos-2026-10/family-bowrider-mercury-fourstroke': [640, 1024, 1920],
  '/lovable-uploads/blog-photos-2026-10/lake-ontario-salmon-troller-mercury-pro-xs': [640, 1024, 1920],
  '/lovable-uploads/blog-photos-2026-10/used-aluminum-boat-outboard-inspection': [640, 1024, 1920],
};

describe('image variant manifest after the main merge', () => {
  it('stays internally consistent and keeps the named shop and hero triples', () => {
    expect(manifest.bases).toHaveLength(manifest.count);
    expect(new Set(manifest.bases).size).toBe(manifest.bases.length);
    expect(Object.keys(manifest.widths).sort()).toEqual([...manifest.bases].sort());

    for (const base of SHOP_BASES) {
      expect(manifest.widths[base], base).toEqual([640, 1024, 1600]);
    }

    for (const [base, widths] of Object.entries(NEW_HERO_WIDTHS)) {
      expect(manifest.widths[base], base).toEqual(widths);
    }
  });
});
