// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  saveLead: vi.fn(),
  savedQuoteSingle: vi.fn(),
  toast: vi.fn(),
  trackAgentEvent: vi.fn(),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DrawerFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'boater@example.com' } }),
}));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/lib/activityGenerator', () => ({ generateSocialProofMessage: () => 'Trusted locally.' }));
vi.mock('@/lib/agentEvents', () => ({ trackAgentEvent: mocks.trackAgentEvent }));
vi.mock('@/lib/leadCapture', () => ({ saveLead: mocks.saveLead }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signInWithOtp: vi.fn() },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: mocks.savedQuoteSingle })),
      })),
    })),
    functions: { invoke: mocks.invoke },
  },
}));

import { SaveQuoteDialog } from './SaveQuoteDialog';

const storageError = new Error('saved_quotes insert failed');

describe('SaveQuoteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.saveLead.mockResolvedValue({ id: 'lead-1', lead_score: 10 });
    mocks.invoke.mockResolvedValue({ error: null });
  });

  it.each([
    ['returns an error', { data: null, error: storageError }],
    ['returns no durable binding ID', { data: null, error: null }],
  ])('fails closed when resumable storage %s', async (_case, storageResult) => {
    mocks.savedQuoteSingle.mockResolvedValue(storageResult);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <SaveQuoteDialog
        open
        onOpenChange={vi.fn()}
        quoteData={{ selectedMotor: { id: 'motor-1', hp: 115, msrp: 17000 } }}
        motorModel="115 ELPT"
        finalPrice={19000}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Pat Boater' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'pat@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '905-555-0100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save My Quote' }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error saving quote',
        variant: 'destructive',
      }));
    });

    expect(screen.queryByText('Quote Saved!')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toHaveValue('Pat Boater');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('pat@example.com');
    expect(screen.getByLabelText(/Phone/i)).toHaveValue('905-555-0100');
    expect(screen.getByRole('button', { name: 'Save My Quote' })).toBeEnabled();
    expect(localStorage.getItem('current_saved_quote_id')).toBeNull();
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.trackAgentEvent).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Error saving quote state:', storageResult.error);

    consoleError.mockRestore();
  });
});
