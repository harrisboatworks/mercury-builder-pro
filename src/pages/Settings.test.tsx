import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  upsert: vi.fn(),
  upsertResult: { error: null as { message: string } | null },
  setTheme: vi.fn(),
  user: {
    id: 'user-1',
    email: 'boater@example.com',
    user_metadata: { full_name: 'Pat Boater' },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mocks.toast,
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mocks.user,
    signOut: vi.fn(),
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: mocks.setTheme }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: unknown }) => <div>{children}</div>,
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'profiles') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'p1',
                user_id: 'user-1',
                full_name: 'Pat Boater',
                display_name: 'Pat',
                email: 'boater@example.com',
                phone: '',
                avatar_url: '',
                theme: 'system',
              },
              error: null,
            }),
          }),
        }),
        upsert: (payload: unknown) => {
          mocks.upsert(payload);
          return Promise.resolve(mocks.upsertResult);
        },
      };
    },
  },
}));

import Settings from './Settings';

describe('Settings theme write', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsertResult = { error: null };
  });

  it('does not claim Theme updated when the profile upsert is rejected', async () => {
    mocks.upsertResult = { error: { message: 'permission denied' } };

    render(<Settings />);

    const light = await screen.findByRole('button', { name: /Light/i });
    fireEvent.click(light);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Could not save theme',
        variant: 'destructive',
      }));
    });

    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      theme: 'light',
    }));
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Theme updated',
    }));
  });
});
