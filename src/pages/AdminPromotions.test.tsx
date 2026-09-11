import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const end = new Date();
end.setDate(end.getDate() + 3);
const endDate = end.toISOString().split('T')[0];

const expiringPromo = {
  id: 'promo-1',
  name: 'Spring Sale',
  discount_percentage: 5,
  discount_fixed_amount: 0,
  is_active: true,
  start_date: null,
  end_date: endDate,
  stackable: false,
  kind: 'discount',
  bonus_title: null,
  bonus_short_badge: null,
  bonus_description: null,
  warranty_extra_years: null,
  terms_url: null,
  highlight: false,
  priority: 0,
  image_url: null,
  image_alt_text: null,
};

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  update: vi.fn(),
  updateResult: { error: null as { message: string } | null },
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/admin/AdminNav', () => ({
  default: () => <div>Admin nav</div>,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => {
        if (table === 'promotions') {
          return {
            order: () => Promise.resolve({ data: [expiringPromo], error: null }),
          };
        }
        return Promise.resolve({ data: [], error: null });
      },
      update: (payload: unknown) => {
        mocks.update(payload);
        return {
          eq: () => Promise.resolve(mocks.updateResult),
        };
      },
      insert: () => Promise.resolve({ error: null, data: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    channel: () => ({
      on() { return this; },
      subscribe() { return { unsubscribe() {} }; },
    }),
    removeChannel: vi.fn(),
  },
}));

import AdminPromotions from './AdminPromotions';

describe('AdminPromotions extend write', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateResult = { error: null };
  });

  it('does not claim Promotion Extended when the update is rejected', async () => {
    mocks.updateResult = { error: { message: 'permission denied' } };

    render(<AdminPromotions />);

    const extend = await screen.findByRole('button', { name: '+30 days' });
    fireEvent.click(extend);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        variant: 'destructive',
      }));
    });

    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Promotion Extended',
    }));
  });
});
