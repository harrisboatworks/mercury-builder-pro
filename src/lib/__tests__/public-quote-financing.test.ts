import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  buildPublicQuoteFinancing,
  DEALERPLAN_FEE_CAD,
  monthlyPaymentFromAprPercent,
} from '../../../supabase/functions/_shared/public-quote-financing';
import type { PromotionRecord } from '../../../supabase/functions/_shared/promotion-context';

const standing = [{
  id: 'td-always-on',
  name: 'TD Auto Finance — Always On',
  rate: 5.48,
  term_months: 60,
  promo_end_date: '2026-12-31',
  min_amount: 5000,
  is_active: true,
  display_order: 1,
}];

const summer: PromotionRecord[] = [{
  id: 'summer-savings',
  name: 'Summer Savings',
  end_date: '2026-08-31',
  details: {
    market: { country: 'CA' },
    eligibility: { backorders_qualify: false },
    combination_mode: 'layered',
  },
  promo_options: {
    options: [{
      id: 'special_financing',
      rates: [{ rate: 2.99, months: 24, minAmount: 5000 }],
    }],
  },
}];

describe('public quote financing policy', () => {
  it('treats APR as percentage points and adds the DealerPlan fee', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: standing,
      promotions: summer,
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });

    expect(DEALERPLAN_FEE_CAD).toBe(349);
    expect(result.amount_financed).toBe(11_649);
    expect(result.apr_percent).toBe(5.48);
    expect(result.annual_rate_decimal).toBe(0.0548);
    expect(result.contract_term_months).toBe(60);
    expect(result.amortization_months).toBe(60);
    expect(result.maximum_amortization_months).toBe(240);
    expect(result.monthly_payment).toBe(222.4);
    expect(monthlyPaymentFromAprPercent(11_649, 5.48, 60)).toBeCloseTo(222.4, 2);
  });

  it('lists the promotion but applies it only when explicitly selected and eligible', () => {
    const defaultResult = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: standing,
      promotions: summer,
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    const promo = defaultResult.available_offers.find((offer) => offer.source === 'promotion');
    expect(defaultResult.apr_percent).toBe(5.48);
    expect(promo?.apr_percent).toBe(2.99);

    const selectedResult = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: standing,
      promotions: summer,
      motorInStock: true,
      selectedOfferId: promo?.id,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(selectedResult.apr_percent).toBe(2.99);
    expect(selectedResult.contract_term_months).toBe(24);
    expect(selectedResult.monthly_payment).toBe(500.64);
    expect(selectedResult.selected_offer_applied).toBe(true);
  });

  it('tests eligibility before tax at the exact $5,000 boundary', () => {
    const below = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 4_999.99,
      finalPriceWithTax: 5_649.99,
      financing: standing,
      promotions: [],
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    const exact = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 5_000,
      finalPriceWithTax: 5_650,
      financing: standing,
      promotions: [],
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(below.eligible).toBe(false);
    expect(exact.eligible).toBe(true);
  });

  it('does not apply a backorder-ineligible promotion', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: standing,
      promotions: summer,
      motorInStock: false,
      selectedOfferId: 'promotion:summer-savings:0',
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(result.apr_percent).toBe(5.48);
    expect(result.selected_offer_applied).toBe(false);
    expect(result.reason).toContain('backordered');
  });

  it('keeps promotion offer ids unique across multiple special-financing options', () => {
    const promotionWithMultipleOptions: PromotionRecord[] = [{
      ...summer[0],
      promo_options: {
        options: [
          { id: 'special_financing', rates: [{ rate: 2.99, months: 24, minimum_amount: 5000 }] },
          { id: 'special_financing', rates: [{ rate: 4.49, months: 36, minAmount: 5000 }] },
        ],
      },
    }];
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: standing,
      promotions: promotionWithMultipleOptions,
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    const promotionIds = result.available_offers
      .filter((offer) => offer.source === 'promotion')
      .map((offer) => offer.id);
    expect(promotionIds).toEqual(['promotion:summer-savings:0', 'promotion:summer-savings:1']);
  });

  it('reports backorder ineligibility when no standing offer can apply', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: [],
      promotions: summer,
      motorInStock: false,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('Promotion does not apply to backordered motors');
  });

  it('returns pricing without financing when the live lookup has no offers', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: [],
      promotions: [],
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(result.available).toBe(false);
    expect(result.eligible).toBe(false);
    expect(result.amount_financed).toBe(0);
    expect(result.reason).toContain('no stale fallback');
  });

  it('filters expired, future, US-only, and inactive offers', () => {
    const invalidPromotions: PromotionRecord[] = [
      { ...summer[0], id: 'expired', end_date: '2026-08-14' },
      { ...summer[0], id: 'future', start_date: '2026-08-16' },
      { ...summer[0], id: 'us', details: { market: { country: 'US' } } },
    ];
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: [{ ...standing[0], is_active: false }],
      promotions: invalidPromotions,
      motorInStock: true,
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(result.available_offers).toEqual([]);
    expect(result.available).toBe(false);
  });

  it('fails closed on malformed offer dates and expired standing selections', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 10_000,
      finalPriceWithTax: 11_300,
      financing: [{ ...standing[0], promo_end_date: 'not-a-date' }],
      promotions: [{ ...summer[0], start_date: 'not-a-date' }],
      motorInStock: true,
      selectedOfferId: 'standing:td-always-on',
      now: new Date('2026-08-15T12:00:00Z'),
    });
    expect(result.available).toBe(false);
    expect(result.available_offers).toEqual([]);
  });

  it('contains no legacy lender, rates, or 144-month default in the handler', () => {
    const source = readFileSync('supabase/functions/public-quote-api/index.ts', 'utf8');
    expect(source).not.toMatch(/LightStream|Financeit|0\.0799|0\.0899|DEFAULT_TERM\s*=\s*144/);
    expect(source).toContain('caller-supplied APR or term is ignored');
  });
});
