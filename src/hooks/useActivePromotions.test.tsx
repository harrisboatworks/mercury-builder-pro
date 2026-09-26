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

  it('retains a stock offer for a pricing-only motor but rejects known absent stock', async () => {
    const { result, rerender } = renderHook(
      ({ stockQuantity }: { stockQuantity?: number }) => useActivePromotions({
        forceRefresh: true,
        motor: { hp: 20, stock_quantity: stockQuantity },
      }),
      { initialProps: { stockQuantity: undefined as number | undefined } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.promotions.map(p => p.id)).toEqual(['stock-offer']);

    rerender({ stockQuantity: 0 });
    expect(result.current.promotions).toEqual([]);
  });
});
