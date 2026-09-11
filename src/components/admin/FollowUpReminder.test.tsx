import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  update: vi.fn(),
  updateResult: { error: null as { message: string } | null },
  onUpdate: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'customer_quotes') throw new Error(`unexpected table ${table}`);
      return {
        update: (payload: unknown) => {
          mocks.update(payload);
          return {
            eq: () => Promise.resolve(mocks.updateResult),
          };
        },
      };
    },
  },
}));

import FollowUpReminder from './FollowUpReminder';

describe('FollowUpReminder writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateResult = { error: null };
  });

  it('does not claim Reminder Cleared when the update is rejected', async () => {
    mocks.updateResult = { error: { message: 'permission denied' } };

    render(
      <FollowUpReminder
        quoteId="quote-1"
        currentDate="2026-09-15T12:00:00.000Z"
        onUpdate={mocks.onUpdate}
      />,
    );

    fireEvent.click(screen.getByText(/Follow-up:/));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const iconButtons = screen.getAllByRole('button').filter((button) => button !== cancel);
    fireEvent.click(iconButtons[1]);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        variant: 'destructive',
      }));
    });

    expect(mocks.update).toHaveBeenCalledWith({ follow_up_date: null });
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Reminder Cleared',
    }));
    expect(mocks.onUpdate).not.toHaveBeenCalled();
  });
});
