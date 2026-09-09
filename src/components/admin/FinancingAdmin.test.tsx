import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  insert: vi.fn(),
  insertResult: { error: null as { message: string } | null },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/admin/AdminNav', () => ({
  default: () => <div>Admin nav</div>,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'financing_options') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: (payload: unknown) => {
          mocks.insert(payload);
          return Promise.resolve(mocks.insertResult);
        },
      };
    },
  },
}));

import FinancingAdmin from './FinancingAdmin';

describe('FinancingAdmin writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertResult = { error: null };
  });

  it('does not claim Success or clear the form when insert is rejected', async () => {
    mocks.insertResult = { error: { message: 'permission denied' } };

    render(<FinancingAdmin />);

    fireEvent.click(await screen.findByRole('button', { name: /Add Financing Option/i }));

    const name = screen.getByPlaceholderText('e.g., Mercury Summer Promo');
    fireEvent.change(name, { target: { value: 'Summer 4.99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error creating financing option',
        variant: 'destructive',
      }));
    });

    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
    }));
    expect(name).toHaveValue('Summer 4.99');
  });
});
