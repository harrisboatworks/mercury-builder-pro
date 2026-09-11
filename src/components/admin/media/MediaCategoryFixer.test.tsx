import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const issue = {
  id: 'media-1',
  motor_id: 'motor-1',
  title: '115 spec sheet',
  media_type: 'pdf',
  media_category: 'gallery',
  media_url: 'https://example.com/spec.pdf',
};

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  update: vi.fn(),
  updateResult: { error: null as { message: string } | null },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'motor_media') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [issue], error: null }),
            }),
          }),
        }),
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

import { MediaCategoryFixer } from './MediaCategoryFixer';

describe('MediaCategoryFixer writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateResult = { error: null };
  });

  it('does not claim Issues Fixed when the category update is rejected', async () => {
    mocks.updateResult = { error: { message: 'column category does not exist' } };

    render(<MediaCategoryFixer />);

    fireEvent.click(screen.getByRole('button', { name: /Check for Issues/i }));

    const fix = await screen.findByRole('button', { name: /Fix 1 Issues/i });
    fireEvent.click(fix);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Fix failed',
        variant: 'destructive',
      }));
    });

    expect(mocks.update).toHaveBeenCalledWith({ media_category: 'specs' });
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Issues Fixed',
    }));
    expect(screen.getByText('115 spec sheet')).toBeInTheDocument();
  });
});
