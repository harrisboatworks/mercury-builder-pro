// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CANONICAL_SKUS } from '../../canonical-pricing.generated';
import { MID_RANGE_40_60HP } from '../mercuryLineupLandings';
import {
  applyCanonicalInventoryToVariants,
  formatLandingModelName,
} from '../apply-canonical-inventory.js';

const ELPT_60 = '1F60413GZ';
const ELPT_CT_60 = '1F60453GZ';
const EXLPT_60 = '1F60463GZ';

function rowBySku(sku: string) {
  const row = MID_RANGE_40_60HP.variants.find((variant) => variant.sku === sku);
  if (!row) throw new Error(`Missing mid-range landing row for ${sku}`);
  return row;
}

describe('formatLandingModelName', () => {
  it('spaces the 60 HP ELPT and EXLPT codes', () => {
    expect(formatLandingModelName('60ELPT FourStroke')).toBe('60 ELPT FourStroke');
    expect(formatLandingModelName('60EXLPT Command Thrust FourStroke')).toBe(
      '60 EXLPT Command Thrust FourStroke',
    );
  });
});

describe('mid-range 40–60 HP landing inventory overlay', () => {
  it('copies published 60 HP prices onto the React landing rows from the snapshot', () => {
    const byPartNo = Object.fromEntries(CANONICAL_SKUS.map((sku) => [sku.partNo, sku]));
    expect(rowBySku(ELPT_60)).toMatchObject({
      msrp: byPartNo[ELPT_60].msrp,
      hbwPrice: byPartNo[ELPT_60].dealer,
    });
    expect(rowBySku(ELPT_CT_60)).toMatchObject({
      msrp: byPartNo[ELPT_CT_60].msrp,
      hbwPrice: byPartNo[ELPT_CT_60].dealer,
    });
    expect(rowBySku(EXLPT_60)).toMatchObject({
      msrp: byPartNo[EXLPT_60].msrp,
      hbwPrice: byPartNo[EXLPT_60].dealer,
    });
  });

  it('marks 60 ELPT FourStroke available to order, not in stock', () => {
    expect(rowBySku(ELPT_60)).toMatchObject({
      name: '60 ELPT FourStroke',
      availability: 'BackOrder',
      availabilityLabel: 'Available to order',
    });
  });

  it('keeps the in-stock 60 as the Command Thrust ELPT', () => {
    expect(rowBySku(ELPT_CT_60)).toMatchObject({
      name: '60 ELPT Command Thrust FourStroke',
      availability: 'InStock',
      availabilityLabel: 'In stock',
    });
  });

  it('names the EXLPT 60 as Command Thrust when the inventory source includes it', () => {
    expect(rowBySku(EXLPT_60)).toMatchObject({
      name: '60 EXLPT Command Thrust FourStroke',
      config: '25-inch remote, Command Thrust',
      availability: 'BackOrder',
      availabilityLabel: 'Available to order',
    });
  });

  it('copies dealer and MSRP from a live motors-feed record when present', () => {
    const feedDealer = CANONICAL_SKUS.find((sku) => sku.partNo === ELPT_60)?.dealer;
    const feedMsrp = CANONICAL_SKUS.find((sku) => sku.partNo === ELPT_60)?.msrp;
    const [overlaid] = applyCanonicalInventoryToVariants(
      [
        {
          name: '60 ELPT FourStroke',
          hp: '60',
          config: '20-inch remote',
          sku: ELPT_60,
        },
      ],
      [
        {
          modelNumber: ELPT_60,
          modelDisplay: '60 ELPT FourStroke',
          availability: 'Available to Order',
          inStock: false,
          sellingPrice: feedDealer,
          msrp: feedMsrp,
        },
      ],
    );

    expect(overlaid).toMatchObject({
      name: '60 ELPT FourStroke',
      availability: 'BackOrder',
      availabilityLabel: 'Available to order',
      msrp: feedMsrp,
      hbwPrice: feedDealer,
    });
  });

  it('restores Command Thrust on a stale EXLPT display name via the part-number override', () => {
    const [overlaid] = applyCanonicalInventoryToVariants(
      [
        {
          name: '60 EXLPT FourStroke',
          hp: '60',
          config: '25-inch remote',
          sku: EXLPT_60,
        },
      ],
      [
        {
          model_number: EXLPT_60,
          model_display: '60 EXLPT FourStroke',
          availability: 'Available to Order',
          in_stock: false,
          commandThrust: true,
        },
        CANONICAL_SKUS.find((sku) => sku.partNo === EXLPT_60),
      ],
    );

    expect(overlaid.name).toBe('60 EXLPT Command Thrust FourStroke');
    expect(overlaid.config).toBe('25-inch remote, Command Thrust');
    expect(overlaid.availabilityLabel).toBe('Available to order');
    expect(overlaid.hbwPrice).toBe(
      CANONICAL_SKUS.find((sku) => sku.partNo === EXLPT_60)?.dealer,
    );
  });

  it('prefers a live motors-feed fact over a stale canonical status for the same SKU', () => {
    const canonical = CANONICAL_SKUS.find((sku) => sku.partNo === ELPT_60);
    expect(canonical).toBeTruthy();
    const [overlaid] = applyCanonicalInventoryToVariants(
      [
        {
          name: '60 ELPT FourStroke',
          hp: '60',
          config: '20-inch remote',
          sku: ELPT_60,
        },
      ],
      [
        {
          modelNumber: ELPT_60,
          modelDisplay: '60 ELPT FourStroke',
          availability: 'Available to Order',
          inStock: false,
        },
        canonical,
      ],
    );

    expect(overlaid.availabilityLabel).toBe('Available to order');
    expect(overlaid.availability).toBe('BackOrder');
    expect(overlaid.hbwPrice).toBe(
      CANONICAL_SKUS.find((sku) => sku.partNo === ELPT_60)?.dealer,
    );
  });
});
