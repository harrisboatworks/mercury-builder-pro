// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CANONICAL_SKUS } from '../../canonical-pricing.generated';
import {
  buildLineupLandingNoscriptHtml,
  buildLineupLandingSchemas,
} from '../lineup-landing-prerender.js';
import {
  MID_RANGE_40_60_PATH,
  MID_RANGE_40_60_VARIANT_SPECS,
  applyMidRangeInventorySnapshot,
  formatLandingCad,
} from '../mid-range-40-60-snapshot.js';

const ELPT_60 = '1F60413GZ';
const ELPT_CT_60 = '1F60453GZ';
const EXLPT_60 = '1F60463GZ';

const PRERENDER_STALE_AMOUNTS = [
  '12,161',
  '13,820',
  '12,469',
  '14,170',
  '12,815',
  '14,565',
  '9,532',
  '10,703',
];

function snapshotByPartNo() {
  return new Map(CANONICAL_SKUS.map((sku) => [sku.partNo, sku]));
}

function prerenderCfgFromSnapshot(inventory = CANONICAL_SKUS) {
  return applyMidRangeInventorySnapshot(
    {
      path: MID_RANGE_40_60_PATH,
      productName: 'Mercury 40 to 60 HP FourStroke Outboards',
      productDescription: 'Mercury 40, 50, and 60 HP FourStroke outboards.',
      ogImage: 'https://example.test/60.jpg',
      intro: 'Mercury 40 to 60 HP from {fromPrice} CAD at Harris Boat Works.',
      tableCaption: 'Mercury 40 to 60 HP prices: standard and Command Thrust FourStrokes (CAD)',
      tableNote: 'Prices in CAD, current pricing, confirm in the quote builder.',
      configColLabel: 'Shaft and gearcase',
      variants: MID_RANGE_40_60_VARIANT_SPECS.map((row) => ({ ...row })),
      whichOne: ['Command Thrust vs standard gearcase.'],
      faq: [
        { question: 'What does a Mercury 60 HP outboard cost in Canada?', answer: '' },
        { question: 'Are these in stock?', answer: 'Each row in the table lists current availability for that exact model.' },
      ],
      finalCtaHeading: 'Build your 40 to 60 HP Mercury quote in two minutes',
    },
    inventory,
  );
}

describe('mid-range 40–60 HP prerender and schema match the inventory snapshot', () => {
  const snapshot = snapshotByPartNo();
  const cfg = prerenderCfgFromSnapshot();
  const html = buildLineupLandingNoscriptHtml(cfg);
  const [productSchema, faqSchema] = buildLineupLandingSchemas(
    cfg,
    'https://www.mercuryrepower.ca',
  );

  it('copies every prerender row name, MSRP, HBW price, and availability from the snapshot', () => {
    expect(cfg.variants).toHaveLength(MID_RANGE_40_60_VARIANT_SPECS.length);
    for (const variant of cfg.variants) {
      const sku = snapshot.get(variant.sku);
      expect(sku, `missing snapshot SKU ${variant.sku}`).toBeTruthy();
      expect(variant.hbwPrice).toBe(sku.dealer);
      expect(variant.msrp).toBe(sku.msrp);
      expect(variant.availabilityLabel).toBe(
        sku.status.toLowerCase() === 'in stock' ? 'In stock' : 'Available to order',
      );
      expect(html).toContain(variant.name);
      expect(html).toContain(`<strong>${formatLandingCad(sku.dealer)}</strong>`);
      expect(html).toContain(formatLandingCad(sku.msrp));
      expect(html).toContain(variant.availabilityLabel);
    }
  });

  it('names the 60 HP rows the way the snapshot/feed does, including Command Thrust', () => {
    const bySku = Object.fromEntries(cfg.variants.map((variant) => [variant.sku, variant]));
    expect(bySku[ELPT_60].name).toBe('60 ELPT FourStroke');
    expect(bySku[ELPT_60].availabilityLabel).toBe('Available to order');
    expect(bySku[ELPT_CT_60].name).toBe('60 ELPT Command Thrust FourStroke');
    expect(bySku[ELPT_CT_60].availabilityLabel).toBe('In stock');
    expect(bySku[EXLPT_60].name).toBe('60 EXLPT Command Thrust FourStroke');
    expect(bySku[EXLPT_60].config).toContain('Command Thrust');
  });

  it('builds Product schema offers from the same snapshot dealer prices', () => {
    expect(productSchema.offers).toHaveLength(cfg.variants.length);
    for (const variant of cfg.variants) {
      const sku = snapshot.get(variant.sku);
      const offer = productSchema.offers.find((item) => item.name === variant.name);
      expect(offer, `schema offer for ${variant.name}`).toBeTruthy();
      expect(offer.price).toBe(String(sku.dealer));
      expect(offer.priceCurrency).toBe('CAD');
    }
  });

  it('builds the 60 HP FAQ answer and FAQPage schema from snapshot prices, not typed catalog amounts', () => {
    const elpt = snapshot.get(ELPT_60);
    const ct = snapshot.get(ELPT_CT_60);
    const start40 = Math.min(
      ...CANONICAL_SKUS.filter((sku) => sku.hp === 40 && MID_RANGE_40_60_VARIANT_SPECS.some((row) => row.sku === sku.partNo))
        .map((sku) => sku.dealer),
    );
    const start50 = Math.min(
      ...CANONICAL_SKUS.filter((sku) => sku.hp === 50 && MID_RANGE_40_60_VARIANT_SPECS.some((row) => row.sku === sku.partNo))
        .map((sku) => sku.dealer),
    );
    const answer = cfg.faq[0].answer;
    expect(answer).toContain(formatLandingCad(elpt.dealer));
    expect(answer).toContain(formatLandingCad(ct.dealer));
    expect(answer).toContain(formatLandingCad(start40));
    expect(answer).toContain(formatLandingCad(start50));
    expect(html).toContain(answer);
    expect(faqSchema.mainEntity[0].acceptedAnswer.text).toBe(answer);
    expect(cfg.intro).toContain(`from ${formatLandingCad(start40)} CAD`);
  });

  it('does not emit the stale prerender catalog amounts', () => {
    const blob = `${html}\n${JSON.stringify(productSchema)}\n${JSON.stringify(faqSchema)}\n${cfg.intro}`;
    for (const amount of PRERENDER_STALE_AMOUNTS) {
      expect(blob, `stale amount ${amount} leaked into prerender/schema`).not.toContain(amount);
    }
  });
});
