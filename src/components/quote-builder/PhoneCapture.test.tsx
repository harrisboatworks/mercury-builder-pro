import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SAVED_QUOTE_ID = '11111111-2222-4333-8444-555555555555';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  invoke: vi.fn(),
  quoteSelect: vi.fn(),
  quoteUpdate: vi.fn(),
  quoteUpdateResult: { error: null as { message: string } | null },
  profileUpdate: vi.fn(),
  profileUpdateResult: { error: null as { message: string } | null },
  authUser: {
    id: 'user-1',
    email: 'boater@example.com',
    user_metadata: { full_name: 'Pat Boater' },
  } as { id: string; email: string; user_metadata: { full_name: string } } | null,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DrawerHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: mocks.authUser }),
}));

vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: () => false,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'saved_quotes') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mocks.quoteSelect,
            }),
          }),
          update: (payload: unknown) => {
            mocks.quoteUpdate(payload);
            return {
              eq: () => Promise.resolve(mocks.quoteUpdateResult),
            };
          },
        };
      }
      if (table === 'profiles') {
        return {
          update: (payload: unknown) => {
            mocks.profileUpdate(payload);
            return {
              eq: () => Promise.resolve(mocks.profileUpdateResult),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    functions: { invoke: mocks.invoke },
  },
}));

import { PhoneCapture } from './PhoneCapture';

async function fillAndSavePhone() {
  fireEvent.change(screen.getByLabelText(/Phone number/i), {
    target: { value: '905-555-1234' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
}

describe('PhoneCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authUser = {
      id: 'user-1',
      email: 'boater@example.com',
      user_metadata: { full_name: 'Pat Boater' },
    };
    mocks.quoteSelect.mockResolvedValue({
      data: { quote_state: { motor: { model: '115 ELPT' } } },
      error: null,
    });
    mocks.quoteUpdateResult = { error: null };
    mocks.profileUpdateResult = { error: null };
    mocks.invoke.mockResolvedValue({ error: null });
  });

  it('toasts a real failure and stays open when the quote write is rejected', async () => {
    const onOpenChange = vi.fn();
    mocks.quoteUpdateResult = { error: { message: 'permission denied' } };

    render(
      <PhoneCapture open onOpenChange={onOpenChange} savedQuoteId={SAVED_QUOTE_ID} />,
    );

    await fillAndSavePhone();

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Could not save phone number',
        description: 'We could not save your phone number. Please try again, or call us at (905) 342-2153.',
        variant: 'destructive',
      }));
    });

    expect(mocks.quoteUpdate).toHaveBeenCalledWith({
      quote_state: { motor: { model: '115 ELPT' }, customerPhone: '9055551234' },
    });
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: '✓ Phone saved',
    }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('writes quote_state and only toasts success after both writes succeed', async () => {
    const onOpenChange = vi.fn();

    render(
      <PhoneCapture open onOpenChange={onOpenChange} savedQuoteId={SAVED_QUOTE_ID} />,
    );

    await fillAndSavePhone();

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: '✓ Phone saved',
      }));
    });

    expect(mocks.quoteUpdate).toHaveBeenCalledWith({
      quote_state: { motor: { model: '115 ELPT' }, customerPhone: '9055551234' },
    });
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ phone: '9055551234' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
