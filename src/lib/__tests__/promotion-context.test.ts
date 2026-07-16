import { describe, expect, it } from 'vitest';
import {
  formatPromotionContext,
  getPromotionCombinationMode,
  getPromotionRebateMatrix,
  type PromotionRecord,
} from '../../../supabase/functions/_shared/promotion-context';

const summerSavings: PromotionRecord = {
  name: 'Mercury Summer Savings Rebate',
  start_date: '2026-07-15',
  end_date: '2026-08-31',
  discount_fixed_amount: 700,
  bonus_description: 'Save up to $700 CAD plus promotional financing.',
  details: {
    combination_mode: 'layered',
    eligibility: {
      products: ['New Mercury FourStroke repower engines'],
      use: 'Recreational-pleasure use',
      stock_requirement: 'Available new stock in dealer inventory',
      backorders_qualify: false,
      exclusions: ['Avator', 'Boat and engine packages'],
    },
    requirements: ['Retail sold and delivered during the offer window'],
    registration_deadline: '2026-09-15',
    consumer_rebate_method: 'Dealer-issued credit; no consumer cheque',
    financing_qualification: 'On approved credit, subject to terms and conditions',
  },
  promo_options: {
    // The explicit details field wins during the migration window, so a stale
    // legacy type cannot make chat or voice describe a layered offer as either/or.
    type: 'choose_one',
    options: [
      {
        id: 'cash_rebate',
        title: 'Factory Rebate',
        matrix: [
          { hp_min: 30, hp_max: 115, rebate: 250 },
          { hp_min: 225, hp_max: 425, rebate: 700 },
        ],
      },
      {
        id: 'special_financing',
        title: 'Promo Financing',
        rates: [{ rate: 2.99, months: 24 }],
      },
    ],
  },
};

describe('promotion context', () => {
  it('uses the canonical layered relationship and complete live facts', () => {
    const context = formatPromotionContext([summerSavings]);

    expect(getPromotionCombinationMode(summerSavings)).toBe('layered');
    expect(getPromotionRebateMatrix(summerSavings)).toHaveLength(2);
    expect(context).toContain('Offer structure: layered');
    expect(context).toContain('The eligible rebate is automatic');
    expect(context).toContain('30-115 HP: $250 CAD');
    expect(context).toContain('2.99% APR for 24 months (OAC');
    expect(context).toContain('Warranty registration deadline: September 15, 2026');
    expect(context).toContain('Backorders do not qualify');
    expect(context).toContain('Avator');
    expect(context).not.toContain('Discount: $700');
    expect(context).not.toContain('Offer structure: choose one');
  });

  it('preserves a genuinely choose-one offer', () => {
    const context = formatPromotionContext([{
      name: 'Example choice offer',
      promo_options: {
        type: 'choose_one',
        options: [{ id: 'cash_rebate', title: 'Cash rebate' }],
      },
    }]);

    expect(context).toContain('Offer structure: choose one');
    expect(context).toContain('Rebate option: Cash rebate');
  });

  it('never resurrects an expired offer when no active rows are supplied', () => {
    expect(formatPromotionContext([])).toContain('No active promotion is loaded');
    expect(formatPromotionContext([])).toContain('Do not quote or name an expired offer');
  });
});
