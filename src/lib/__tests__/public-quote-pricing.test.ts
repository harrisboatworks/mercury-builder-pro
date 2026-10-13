import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computePublicQuotePricing,
  resolveFactoryRebate,
} from '../../../supabase/functions/_shared/public-quote-pricing';
import {
  buildPublicQuoteFinancing,
  meetsAmountFinancedMinimum,
} from '../../../supabase/functions/_shared/public-quote-financing';
import type { PromotionRecord } from '../../../supabase/functions/_shared/promotion-context';

const CHASE_MATRIX = [
  { hp_min: 2.5, hp_max: 3.5, rebate: 250 },
  { hp_min: 4, hp_max: 9.9, rebate: 300 },
  { hp_min: 15, hp_max: 20, rebate: 350 },
  { hp_min: 25, hp_max: 30, rebate: 400 },
];

const chase: PromotionRecord = {
  id: 'chase',
  name: 'Mercury Chase the Savings!',
  start_date: '2026-09-14',
  end_date: '2026-10-30',
  details: { combination_mode: 'layered' },
  promo_options: { options: [{ id: 'cash_rebate', matrix: CHASE_MATRIX }] },
};

const expiredSummer: PromotionRecord = {
  id: 'summer',
  name: 'Mercury Summer Savings Rebate',
  start_date: '2026-06-01',
  end_date: '2026-08-31',
  details: { combination_mode: 'layered' },
  promo_options: { options: [{ id: 'cash_rebate', matrix: CHASE_MATRIX }] },
};

const motor20 = { horsepower: 20, family: 'FourStroke', modelDisplay: '20 ELH FourStroke' };

describe('public quote factory rebate', () => {
  it('applies the $350 tier pre-tax for a 20 HP $4,000 motor on 2026-10-12', () => {
    const rebate = resolveFactoryRebate([chase], motor20, { now: new Date('2026-10-12T12:00:00Z') });
    expect(rebate).toEqual({ amount: 350, promotionName: 'Mercury Chase the Savings!', promotionId: 'chase' });
    const pricing = computePublicQuotePricing({ subtotal: 4000, rebateAmount: rebate!.amount });
    expect(pricing.postRebateSubtotal).toBe(3650);
    expect(pricing.hst).toBe(474.5);
    expect(pricing.finalPrice).toBe(4124.5);
  });

  it('applies no rebate on 2026-11-05 after the window closes', () => {
    expect(resolveFactoryRebate([chase], motor20, { now: new Date('2026-11-05T12:00:00Z') })).toBeNull();
  });

  it('never applies an expired-but-active promotion', () => {
    expect(resolveFactoryRebate([expiredSummer], motor20, { now: new Date('2026-10-12T12:00:00Z') })).toBeNull();
    const rebate = resolveFactoryRebate([expiredSummer, chase], motor20, { now: new Date('2026-10-12T12:00:00Z') });
    expect(rebate?.promotionId).toBe('chase');
  });

  it('stays live through the Toronto end of day', () => {
    expect(resolveFactoryRebate([chase], motor20, { now: new Date('2026-10-31T03:59:00Z') })).not.toBeNull();
    expect(resolveFactoryRebate([chase], motor20, { now: new Date('2026-10-31T04:01:00Z') })).toBeNull();
  });

  it('caps trade credit against the post-rebate subtotal', () => {
    const pricing = computePublicQuotePricing({
      subtotal: 4000,
      rebateAmount: 350,
      tradeEstimatedValue: 5000,
      hasTradeIn: true,
    });
    expect(pricing.tradeInCredit).toBe(3650);
    expect(pricing.adjustedSubtotal).toBe(0);
    expect(pricing.finalPrice).toBe(0);
  });

  it('floors the total at 0 when the rebate exceeds the subtotal', () => {
    const pricing = computePublicQuotePricing({ subtotal: 200, rebateAmount: 350 });
    expect(pricing.factoryRebate).toBe(200);
    expect(pricing.adjustedSubtotal).toBe(0);
    expect(pricing.hst).toBe(0);
    expect(pricing.finalPrice).toBe(0);
  });

  it('layers with promotional financing but is suppressed by no_payments', () => {
    const now = new Date('2026-10-12T12:00:00Z');
    expect(resolveFactoryRebate([chase], motor20, { now, selectedPromoOption: 'special_financing' })?.amount).toBe(350);
    expect(resolveFactoryRebate([chase], motor20, { now, selectedPromoOption: 'no_payments' })).toBeNull();
  });

  it('mirrors motor-eligibility exclusions', () => {
    const restricted: PromotionRecord = {
      ...chase,
      details: { motor_eligibility: { min_hp: 2.5, max_hp: 425, excluded_families: ['racing'] } },
    };
    const now = new Date('2026-10-12T12:00:00Z');
    expect(resolveFactoryRebate([restricted], { horsepower: 20, family: 'Racing', modelDisplay: '20 Racing' }, { now })).toBeNull();
    expect(resolveFactoryRebate([restricted], motor20, { now })?.amount).toBe(350);
  });
});

const promoFinancing: PromotionRecord[] = [{
  id: 'chase-fin',
  name: 'Mercury Chase the Savings!',
  start_date: '2026-09-14',
  end_date: '2026-10-30',
  details: { combination_mode: 'layered' },
  promo_options: {
    options: [{
      id: 'special_financing',
      minimum_amount: 5000,
      minimum_amount_exclusive: true,
      rates: [{ rate: 2.99, months: 24 }],
    }],
  },
}];

describe('promotional financing requires standing and amount-financed minima', () => {
  // Promo needs BOTH: (a) before-tax subtotal >= $5,000 and (b) amount
  // financed (after tax + $349) meeting the promo minimum. Assert on the
  // promotional offer itself (fixtures select nothing / pass financing: []).
  it('is NOT eligible when before-tax $4,300 finances $5,208 (standing fails)', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 4300,
      finalPriceWithTax: 4300 * 1.13,
      financing: [],
      promotions: promoFinancing,
      motorInStock: true,
      now: new Date('2026-10-12T12:00:00Z'),
    });
    const promo = result.available_offers.find((o) => o.source === 'promotion');
    expect(promo).toBeDefined();
    expect(promo!.eligible).toBe(false);
    expect(promo!.minimum_basis).toBe('amount_financed');
    expect(promo!.minimum_before_tax_cad).toBe(5000);
    expect(promo!.ineligibility_reason).toBe('Financing requires at least $5,000 CAD before tax');
    expect(promo!.monthly_payment).toBeUndefined();
  });

  it('is eligible at before-tax $5,000 (standing and promo both met)', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 5000,
      finalPriceWithTax: 5000 * 1.13,
      financing: [{
        id: 'td', name: 'TD Auto Finance', rate: 5.48, term_months: 60, min_amount: 5000, is_active: true,
      }],
      promotions: promoFinancing,
      motorInStock: true,
      now: new Date('2026-10-12T12:00:00Z'),
    });
    const promo = result.available_offers.find((o) => o.source === 'promotion');
    const standingOffer = result.available_offers.find((o) => o.source === 'standing');
    expect(standingOffer!.eligible).toBe(true);
    expect(promo!.eligible).toBe(true);
    expect(promo!.minimum_basis).toBe('amount_financed');
    // $5,650 after tax + $349 fee = $5,999 financed at 2.99% over 24 months.
    expect(promo!.monthly_payment).toBe(257.82);
  });

  // The exclusive $5,000-financed boundary cannot be reached with (a) true:
  // before-tax >= $5,000 implies financed >= $5,000*1.13+$349 = $5,999.
  // So (b) at the boundary is tested via the pure minimum helper instead.
  it('tests the exclusive boundary via the pure minimum helper', () => {
    expect(meetsAmountFinancedMinimum(5000, 5000, true)).toBe(false);
    expect(meetsAmountFinancedMinimum(5000.01, 5000, true)).toBe(true);
    expect(meetsAmountFinancedMinimum(5000, 5000, false)).toBe(true);
    expect(meetsAmountFinancedMinimum(4999.99, 5000, false)).toBe(false);
  });

  it('keeps the loan-above text when only (b) fails with (a) true', () => {
    const highMinimum: PromotionRecord[] = [{
      ...promoFinancing[0],
      promo_options: {
        options: [{
          id: 'special_financing',
          minimum_amount: 10000,
          minimum_amount_exclusive: true,
          rates: [{ rate: 2.99, months: 24 }],
        }],
      },
    }];
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 5000,
      finalPriceWithTax: 5000 * 1.13,
      financing: [],
      promotions: highMinimum,
      motorInStock: true,
      now: new Date('2026-10-12T12:00:00Z'),
    });
    const promo = result.available_offers.find((o) => o.source === 'promotion');
    expect(promo!.eligible).toBe(false);
    expect(promo!.ineligibility_reason).toContain('above $10,000');
    expect(promo!.ineligibility_reason).not.toContain('before tax');
  });
});

describe('standing financing minimum uses the before-tax subtotal', () => {
  it('rejects before-tax $4,500 even though after-tax is $5,085', () => {
    const result = buildPublicQuoteFinancing({
      beforeTaxSubtotal: 4500,
      finalPriceWithTax: 4500 * 1.13,
      financing: [{
        id: 'td', name: 'TD Auto Finance', rate: 5.48, term_months: 60, min_amount: 5000, is_active: true,
      }],
      promotions: [],
      motorInStock: true,
      now: new Date('2026-10-12T12:00:00Z'),
    });
    expect(result.eligible).toBe(false);
    const standing = result.available_offers.find((o) => o.source === 'standing');
    expect(standing).toBeDefined();
    expect(standing!.minimum_basis).toBe('before_tax');
    expect(standing!.minimum_before_tax_cad).toBe(5000);
  });

  it('client quote gates compare the before-tax subtotal', () => {
    const summary = readFileSync('src/pages/quote/QuoteSummaryPage.tsx', 'utf8');
    const promoPage = readFileSync('src/pages/quote/PromoSelectionPage.tsx', 'utf8');
    expect(summary).not.toContain('displayPricing.total >= FINANCING_MINIMUM');
    expect(summary).toContain('displayPricing.subtotal >= FINANCING_MINIMUM');
    expect(promoPage).toContain('frozenPricing?.subtotal');
    expect(promoPage).not.toContain('frozenPricing?.total');
    const pdfBlock = summary.slice(summary.indexOf('promotionalFinancingAlternative'));
    expect(pdfBlock.slice(0, 900)).toContain('FINANCING_MINIMUM');
  });
});
