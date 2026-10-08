import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useActivePromotions } from './useActivePromotions';

vi.mock('@/lib/quote-utils', () => ({
  activePromotionDateOrFilters: () => ({ startOr: '', endOr: '' }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const query = {
    select: () => query,
    eq: () => query,
    or: () => query,
    order: async () => ({
      data: [{
        id: 'stock-offer',
        name: 'Stock offer',
        details: { motor_eligibility: { stock_required: true, min_hp: 2.5 } },
      }],
      error: null,
    }),
  };
  return { supabase: { from: () => query } };
});

describe('useActivePromotions motor context', () => {
  it.each([undefined, null])('keeps offers visible when motor is %s', async motor => {
    const { result } = renderHook(() => useActivePromotions({ forceRefresh: true, motor }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.promotions.map(p => p.id)).toEqual(['stock-offer']);
  });

  it('applies product restrictions once a motor is selected', async () => {
    const { result, rerender } = renderHook(
      ({ hp }: { hp: number }) => useActivePromotions({
        forceRefresh: true,
        motor: { hp, stock_quantity: 0 },
      }),
      { initialProps: { hp: 20 } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.promotions.map(p => p.id)).toEqual(['stock-offer']);

    rerender({ hp: 2 });
    expect(result.current.promotions).toEqual([]);
  });
});
