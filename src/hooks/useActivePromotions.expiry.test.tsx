import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useActivePromotions } from './useActivePromotions';

const { order } = vi.hoisted(() => ({ order: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = { select: () => query, eq: () => query, or: () => query, order };
  return query;
} } }));
const offer = {
  id: 'deadline-offer', name: 'Synthetic offer', end_date: '2026-10-30',
  discount_percentage: 0, discount_fixed_amount: 0, warranty_extra_years: 2,
  promo_options: { type: 'layered', options: [{ id: 'cash_rebate', matrix: [{ hp_min: 4, hp_max: 9.9, rebate: 300 }] }] },
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-31T03:59:59.000Z'));
  order.mockResolvedValue({ data: [offer], error: null });
  order.mockClear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

async function mount(forceRefresh = true) {
  const hook = renderHook(() => useActivePromotions({ forceRefresh, motor: { hp: 9.9 } }));
  await act(async () => { await Promise.resolve(); });
  return hook;
}

describe('promotion deadline lifecycle', () => {
  it('removes rebate and bonus coverage from an already-open quote at Ontario midnight', async () => {
    const { result } = await mount();
    expect(result.current.getPromotionSavingsForMotor(9.9, 2999)).toBe(300);
    expect(result.current.getTotalWarrantyBonusYears()).toBe(2);
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(result.current.promotions).toEqual([]);
    expect(result.current.getPromotionSavingsForMotor(9.9, 2999)).toBe(0);
    expect(result.current.getTotalWarrantyBonusYears()).toBe(0);
  });

  it('rejects a stale action before a suspended tab timer runs and refreshes on focus', async () => {
    const { result } = await mount();
    const canUseDisplayedPromotion = result.current.arePromotionsCurrent;
    vi.setSystemTime(new Date('2026-10-31T04:00:00Z'));
    expect(canUseDisplayedPromotion()).toBe(false);
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(result.current.promotions).toEqual([]);
    expect(result.current.arePromotionsCurrent()).toBe(true);
  });

  it('filters an expired row from the five-minute cache without waiting for another fetch', async () => {
    const first = await mount();
    first.unmount();
    vi.setSystemTime(new Date('2026-10-31T04:00:00Z'));
    const { result } = await mount(false);
    expect(order).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.promotions).toEqual([]);
    expect(result.current.getPromotionSavingsForMotor(9.9, 2999)).toBe(0);
  });

  it('keeps deadline-free offers available', async () => {
    order.mockResolvedValue({ data: [{ ...offer, end_date: null }], error: null });
    const { result } = await mount();
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(result.current.getPromotionSavingsForMotor(9.9, 2999)).toBe(300);
  });
});
