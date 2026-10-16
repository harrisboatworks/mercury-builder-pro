// Mid-range 40–60 HP landing rows, FAQ, and from-price copy from the published
// inventory snapshot. Catalog amounts are never typed here.

import { applyCanonicalInventoryToVariants } from './apply-canonical-inventory.js';

export const MID_RANGE_40_60_PATH = '/mercury/mid-range-40-60hp';

export const MID_RANGE_40_60_VARIANT_SPECS = Object.freeze([
  { name: '40 ELPT FourStroke', hp: '40', config: '20-inch remote', sku: '1F40413GZ' },
  { name: '40 ELPT Command Thrust FourStroke', hp: '40', config: '20-inch remote, Command Thrust', sku: '1F41453GZ' },
  { name: '50 ELPT FourStroke', hp: '50', config: '20-inch remote', sku: '1F51413GZ' },
  { name: '50 ELPT Command Thrust FourStroke', hp: '50', config: '20-inch remote, Command Thrust', sku: '1F51453GZ' },
  { name: '60 ELPT FourStroke', hp: '60', config: '20-inch remote', sku: '1F60413GZ' },
  { name: '60 ELPT Command Thrust FourStroke', hp: '60', config: '20-inch remote, Command Thrust', sku: '1F60453GZ' },
  { name: '60 EXLPT FourStroke', hp: '60', config: '25-inch remote', sku: '1F60463GZ' },
]);

const PRICING_FAQ_QUESTION = /what does a mercury 60 hp outboard cost/i;

export function formatLandingCad(n) {
  return `$${Number(n).toLocaleString('en-CA')}`;
}

export function midRangePricingFaqAnswer(variants) {
  const bySku = Object.fromEntries((variants || []).map((variant) => [variant.sku, variant]));
  const elpt60 = bySku['1F60413GZ'];
  const ct60 = bySku['1F60453GZ'];
  const start40 = Math.min(
    ...variants.filter((variant) => Number(variant.hp) === 40).map((variant) => variant.hbwPrice),
  );
  const start50 = Math.min(
    ...variants.filter((variant) => Number(variant.hp) === 50).map((variant) => variant.hbwPrice),
  );
  if (!elpt60 || !ct60 || !Number.isFinite(start40) || !Number.isFinite(start50)) {
    throw new Error('Mid-range pricing FAQ is missing snapshot rows');
  }
  return (
    `At Harris Boat Works, a ${elpt60.name} is ${formatLandingCad(elpt60.hbwPrice)} CAD, ` +
    `and the ${ct60.name} is ${formatLandingCad(ct60.hbwPrice)} CAD. ` +
    `The 40 HP starts at ${formatLandingCad(start40)} and the 50 HP at ${formatLandingCad(start50)}. ` +
    `Prices are CAD, current pricing, confirm in the quote builder.`
  );
}

function fillFromPriceCopy(text, fromPrice) {
  if (!text) return text;
  return String(text)
    .replaceAll('{fromPrice}', fromPrice)
    .replace(/from \$[\d,]+ CAD/g, `from ${fromPrice} CAD`);
}

export function applyMidRangeInventorySnapshot(cfg, inventory) {
  const specs = (cfg?.variants?.length ? cfg.variants : MID_RANGE_40_60_VARIANT_SPECS)
    .map((row) => ({ ...row }));
  const variants = applyCanonicalInventoryToVariants(specs, inventory);
  for (const variant of variants) {
    if (!variant.sku || !(variant.hbwPrice > 0) || !(variant.msrp > 0) || !variant.availabilityLabel) {
      throw new Error(
        `Mid-range landing snapshot is missing published name/price/availability for ${variant.sku || variant.name}`,
      );
    }
  }

  const fromPrice = formatLandingCad(Math.min(...variants.map((variant) => variant.hbwPrice)));
  return {
    ...cfg,
    intro: fillFromPriceCopy(cfg?.intro, fromPrice),
    heroLead: fillFromPriceCopy(cfg?.heroLead, fromPrice),
    h1: fillFromPriceCopy(cfg?.h1, fromPrice),
    variants,
    faq: (cfg?.faq || []).map((item) =>
      PRICING_FAQ_QUESTION.test(item.question)
        ? { ...item, answer: midRangePricingFaqAnswer(variants) }
        : item,
    ),
  };
}
