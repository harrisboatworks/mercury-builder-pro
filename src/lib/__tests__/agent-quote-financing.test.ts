import { describe, expect, it } from 'vitest';
import {
  buildAgentFinancing,
  getLivePromoFinancingRate,
} from '../../../supabase/functions/_shared/agent-quote-financing';
import { resolveFactoryRebate } from '../../../supabase/functions/_shared/public-quote-pricing';
import type { PromotionRecord } from '../../../supabase/functions/_shared/promotion-context';

const promo: PromotionRecord[] = [{
  id: 'chase-fin',
  name: 'Mercury Chase the Savings!',
  start_date: '2026-09-14',
  end_date: '2026-10-30',
  details: { combination_mode: 'layered' },
  promo_options: {
    options: [
      { id: 'cash_rebate', matrix: [{ hp_min: 15, hp_max: 20, rebate: 350 }] },
      {
        id: 'special_financing',
        minimum_amount: 5000,
        minimum_amount_exclusive: true,
        rates: [{ rate: 2.99, months: 24 }],
      },
    ],
  },
}];

const motor20 = { horsepower: 20, family: 'FourStroke', modelDisplay: '20 ELH FourStroke' };

describe('agent quote financing (shared §1 rule)', () => {
  it('extracts the live promo rate from rates[0]', () => {
    expect(getLivePromoFinancingRate(promo)).toEqual({
      rate: 2.99, months: 24, minimum: 5000, exclusive: true,
    });
    expect(getLivePromoFinancingRate([])).toBeNull();
  });

  it('returns no financing and a warning when no live promo rate exists', () => {
    const result = buildAgentFinancing({
      beforeTaxSubtotal: 10000, finalPrice: 11300, promotions: [],
    });
    expect(result.financing).toBeNull();
    expect(result.warning).toContain('No live promotional financing rate');
  });

  it('blocks promo when the standing before-tax minimum fails', () => {
    const result = buildAgentFinancing({
      beforeTaxSubtotal: 4300, finalPrice: 4300 * 1.13, promotions: promo,
    });
    expect(result.financing).toBeNull();
    expect(result.warning).toBe('Financing requires at least $5,000 CAD before tax');
  });

  it('amortizes finalPrice + $349 at the live rate when both minima pass', () => {
    const result = buildAgentFinancing({
      beforeTaxSubtotal: 5000, finalPrice: 5000 * 1.13, promotions: promo,
    });
    expect(result.warning).toBeUndefined();
    expect(result.financing?.rate).toBe(2.99);
    expect(result.financing?.term_months).toBe(24);
    expect(result.financing?.amount_financed).toBe(5999);
    expect(result.financing?.monthly_payment).toBe(257.82);
  });
});

describe('country filter (CA market wins)', () => {
  const now = new Date('2026-10-12T12:00:00Z');
  const usPromo: PromotionRecord = {
    id: 'us-first',
    name: 'US Promo',
    start_date: '2026-09-14',
    end_date: '2026-10-30',
    details: { market: { country: 'US' }, combination_mode: 'layered' },
    promo_options: {
      options: [
        { id: 'cash_rebate', matrix: [{ hp_min: 15, hp_max: 20, rebate: 999 }] },
        { id: 'special_financing', minimum_amount: 5000, rates: [{ rate: 9.99, months: 60 }] },
      ],
    },
  };
  const caPromo: PromotionRecord = {
    id: 'ca-second',
    name: 'CA Promo',
    start_date: '2026-09-14',
    end_date: '2026-10-30',
    details: { market: { country: 'CA' }, combination_mode: 'layered' },
    promo_options: {
      options: [
        { id: 'cash_rebate', matrix: [{ hp_min: 15, hp_max: 20, rebate: 350 }] },
        { id: 'special_financing', minimum_amount: 5000, minimum_amount_exclusive: true, rates: [{ rate: 2.99, months: 24 }] },
      ],
    },
  };

  it('CA rebate wins when a US promo is ordered first', () => {
    const rebate = resolveFactoryRebate([usPromo, caPromo], motor20, { now });
    expect(rebate?.amount).toBe(350);
    expect(rebate?.promotionId).toBe('ca-second');
  });

  it('CA rate wins when a US promo is ordered first', () => {
    expect(getLivePromoFinancingRate([usPromo, caPromo], now)).toEqual({
      rate: 2.99, months: 24, minimum: 5000, exclusive: true,
    });
    const result = buildAgentFinancing({
      beforeTaxSubtotal: 5000, finalPrice: 5000 * 1.13, promotions: [usPromo, caPromo], now,
    });
    expect(result.financing?.rate).toBe(2.99);
    expect(result.financing?.term_months).toBe(24);
  });

  it('ignores an expired promo rate even when it is the only promo', () => {
    const expired: PromotionRecord = {
      ...caPromo,
      id: 'expired-ca',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
    };
    expect(getLivePromoFinancingRate([expired], now)).toBeNull();
    const result = buildAgentFinancing({
      beforeTaxSubtotal: 10000, finalPrice: 11300, promotions: [expired], now,
    });
    expect(result.financing).toBeNull();
    expect(result.warning).toContain('No live promotional financing rate');
  });

  it('skips an expired CA promo and uses the next live CA promo rate', () => {
    const expired: PromotionRecord = {
      ...caPromo,
      id: 'expired-first',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      promo_options: {
        options: [{ id: 'special_financing', rates: [{ rate: 1.99, months: 12 }] }],
      },
    };
    expect(getLivePromoFinancingRate([expired, caPromo], now)?.rate).toBe(2.99);
  });
});

describe('agent quote rebate (shared resolveFactoryRebate)', () => {
  const now = new Date('2026-10-12T12:00:00Z');
  it('layers the rebate with special_financing', () => {
    expect(resolveFactoryRebate(promo, motor20, { now, selectedPromoOption: 'special_financing' })?.amount).toBe(350);
  });
  it('is suppressed only by no_payments', () => {
    expect(resolveFactoryRebate(promo, motor20, { now, selectedPromoOption: 'no_payments' })).toBeNull();
    expect(resolveFactoryRebate(promo, motor20, { now, selectedPromoOption: 'cash_rebate' })?.amount).toBe(350);
  });
  it('applies no rebate outside the live window', () => {
    expect(resolveFactoryRebate(promo, motor20, { now: new Date('2026-11-05T12:00:00Z') })).toBeNull();
  });
});
