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

describe('SaveQuoteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.saveLead.mockResolvedValue({ id: 'lead-1', lead_score: 10 });
  });

  it('does not report success or send notifications when resumable storage fails', async () => {
    const saveError = new Error('saved_quotes insert failed');
    mocks.savedQuoteSingle.mockResolvedValue({ data: null, error: saveError });
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
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.trackAgentEvent).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Error saving quote state:', saveError);

    consoleError.mockRestore();
  });
});
