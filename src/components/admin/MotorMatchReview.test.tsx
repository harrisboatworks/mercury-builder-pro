import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const pendingMatch = {
  id: 'match-1',
  scraped_motor_data: { name: '115 ELPT', hp: 115, stock: 'ST-1' },
  potential_matches: [],
  review_status: 'pending',
  confidence_score: 0.4,
};

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  update: vi.fn(),
  updateResult: { error: null as { message: string } | null },
  onReviewComplete: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'pending_motor_matches') {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [pendingMatch], error: null }),
            }),
          }),
          update: (payload: unknown) => {
            mocks.update(payload);
            return {
              eq: () => Promise.resolve(mocks.updateResult),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  },
}));

import { MotorMatchReview } from './MotorMatchReview';

describe('MotorMatchReview writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateResult = { error: null };
  });

  it('does not claim Review Complete when the match update is rejected', async () => {
    mocks.updateResult = { error: { message: 'permission denied' } };

    render(
      <MotorMatchReview
        isOpen
        onClose={mocks.onClose}
        onReviewComplete={mocks.onReviewComplete}
      />,
    );

    const noMatch = await screen.findByRole('button', { name: /No Match/i });
    fireEvent.click(noMatch);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        variant: 'destructive',
      }));
    });

    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Review Complete',
    }));
    expect(mocks.onReviewComplete).not.toHaveBeenCalled();
    expect(mocks.onClose).not.toHaveBeenCalled();
  });
});
