import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActivePromotions } from './useActivePromotions';
import { getAppliedPromotion, getAppliedWarrantyExtraYears } from '@/lib/warranty-display';
import { buildProfessionalQuotePdfData } from '@/lib/react-pdf-generator';
import type { QuotePdfSnapshot } from '@/lib/quote-pdf-data';

const { promotion } = vi.hoisted(() => ({ promotion: {
  id: 'synthetic-chase', name: 'Synthetic seasonal offer',
  discount_fixed_amount: 0, discount_percentage: 0, warranty_extra_years: 2,
  end_date: '2026-10-30',
  details: { motor_eligibility: { stock_required: true, min_hp: 2.5, max_hp: 425, excluded_families: ['avator'] } },
  promo_options: { type: 'layered', options: [
    { id: 'cash_rebate', matrix: [{ hp_min: 25, hp_max: 30, rebate: 400 }] },
    { id: 'special_financing', rates: [{ rate: 2.99, months: 24 }] },
  ] },
} }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = { select: () => query, eq: () => query, or: () => query,
    order: async () => ({ data: [promotion], error: null }) };
  return query;
} } }));

afterEach(cleanup);

describe('stock-independent promotion flow', () => {
  it.each([
    { in_stock: false, stock_quantity: 0 },
    { stockStatus: 'On Order' },
    {},
  ])('carries 30 HP coverage and rebate into PDF data with inventory %j', async inventory => {
    const motor = { hp: 30, model: '30 ELHPT FourStroke', ...inventory };
    const { result } = renderHook(() => useActivePromotions({ motor, forceRefresh: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const applied = getAppliedPromotion(result.current.promotions);
    expect(applied?.id).toBe(promotion.id);
    const savings = result.current.getPromotionSavingsForMotor(30, 8000);
    const coverage = 3 + getAppliedWarrantyExtraYears(applied);
    expect(savings).toBe(400);
    expect(coverage).toBe(5);
    expect(result.current.getSpecialFinancingRates()).toEqual([{ rate: 2.99, months: 24 }]);
    const snapshot: QuotePdfSnapshot = {
      version: 1, createdAt: '2026-09-29T12:00:00Z',
      motor: { ...motor, msrp: 8000, modelYear: 2026, category: 'FourStroke' },
      pricing: { msrp: 8000, discount: 0, promoValue: savings, motorSubtotal: 7600, subtotal: 7600, hst: 988, totalCashPrice: 8588, savings },
      accessoryBreakdown: [], purchasePath: 'loose', includedCoverageYears: coverage,
      paymentMethod: 'cash_purchase', promotion: { name: applied!.name },
    };
    const pdf = buildProfessionalQuotePdfData({ quoteNumber: 'TEST-PROMO', customerName: 'Synthetic example', customerEmail: '', snapshot });
    expect(pdf.includedCoverageYears).toBe(5);
    expect(pdf.promoSavings).toBe('400.00');
    expect(pdf.total).toBe('8,588.00');
  });

  it('keeps coverage for an ordered 60 HP without inventing a portable rebate', async () => {
    const { result } = renderHook(() => useActivePromotions({ motor: { hp: 60, model: '60 ELPT FourStroke', in_stock: false, stock_quantity: 0 }, forceRefresh: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getAppliedWarrantyExtraYears(getAppliedPromotion(result.current.promotions))).toBe(2);
    expect(result.current.getPromotionSavingsForMotor(60, 10000)).toBe(0);
  });
});
