// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render as renderComponent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ANON_SAVED_QUOTE_ID = '11111111-2222-4333-8444-555555555555';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  saveLead: vi.fn(),
  savedQuoteInsert: vi.fn(),
  signInWithOtp: vi.fn(),
  signInWithGoogle: vi.fn(),
  toast: vi.fn(),
  trackAgentEvent: vi.fn(),
  authUser: { id: 'user-1', email: 'boater@example.com' } as { id: string; email: string } | null,
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
  useAuth: () => ({ user: mocks.authUser, signInWithGoogle: mocks.signInWithGoogle }),
}));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/lib/activityGenerator', () => ({ generateSocialProofMessage: () => 'Trusted locally.' }));
vi.mock('@/lib/agentEvents', () => ({ trackAgentEvent: mocks.trackAgentEvent }));
vi.mock('@/lib/leadCapture', () => ({ saveLead: mocks.saveLead }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signInWithOtp: mocks.signInWithOtp },
    from: vi.fn(() => ({
      insert: mocks.savedQuoteInsert,
    })),
    functions: { invoke: mocks.invoke },
  },
}));

import { SaveQuoteDialog } from './SaveQuoteDialog';

const render = (ui: ReactNode) => renderComponent(<MemoryRouter>{ui}</MemoryRouter>);

const STALE_SAVED_QUOTE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const storageError = new Error('saved_quotes insert failed');

async function fillAndSubmitSaveForm() {
  fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Pat Boater' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'pat@example.com' } });
  fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '905-555-0100' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save My Quote' }));
}

describe('SaveQuoteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.authUser = { id: 'user-1', email: 'boater@example.com' };
    mocks.saveLead.mockResolvedValue({ id: 'lead-1', lead_score: 10 });
    mocks.invoke.mockResolvedValue({ data: { data: { id: 'mail-1' }, error: null }, error: null });
    mocks.savedQuoteInsert.mockResolvedValue({ error: null });
    mocks.signInWithGoogle.mockResolvedValue({ error: null });
    mocks.signInWithOtp.mockResolvedValue({ error: null });
  });

  it('blocks an open save form when pricing expires before submission', async () => {
    let current = true;
    render(<SaveQuoteDialog open onOpenChange={vi.fn()} canSave={() => current}
      quoteData={{ selectedMotor: { id: 'motor-1', hp: 9.9, msrp: 3860 } }} finalPrice={3049.87} />);
    current = false;
    await fillAndSubmitSaveForm();
    expect(mocks.saveLead).not.toHaveBeenCalled();
    expect(mocks.savedQuoteInsert).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Quote pricing changed' }));
  });

  it('fails closed and clears a stale binding when resumable storage returns an error', async () => {
    mocks.savedQuoteInsert.mockResolvedValue({ error: storageError });
    localStorage.setItem('current_saved_quote_id', STALE_SAVED_QUOTE_ID);
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

    await fillAndSubmitSaveForm();

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
    expect(consoleError).toHaveBeenCalledWith('Error saving quote state:', storageError);

    consoleError.mockRestore();
  });

  it('associates required-field errors with their inputs', () => {
    render(
      <SaveQuoteDialog
        open
        onOpenChange={vi.fn()}
        quoteData={{ selectedMotor: { id: 'motor-1', hp: 115, msrp: 17000 } }}
        motorModel="115 ELPT"
        finalPrice={19000}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save My Quote' }));

    const name = screen.getByLabelText(/Name/i);
    const email = screen.getByLabelText(/Email/i);
    const phone = screen.getByLabelText(/Phone/i);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(phone).toHaveAttribute('aria-invalid', 'false');
    expect(phone).not.toHaveAttribute('aria-required', 'true');
    expect(name).toHaveAccessibleDescription('Name is required');
    expect(email).toHaveAccessibleDescription('Email address is required');
    expect(screen.getAllByRole('alert').map((node) => node.textContent)).toEqual([
      'Email address is required',
      'Name is required',
    ]);
  });

  it('succeeds on the anonymous manual-email path without requesting a representation', async () => {
    mocks.authUser = null;
    mocks.savedQuoteInsert.mockResolvedValue({ error: null });
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue(ANON_SAVED_QUOTE_ID);

    render(
      <SaveQuoteDialog
        open
        onOpenChange={vi.fn()}
        quoteData={{ selectedMotor: { id: 'motor-1', hp: 115, msrp: 17000 } }}
        motorModel="115 ELPT"
        finalPrice={19000}
      />,
    );

    await fillAndSubmitSaveForm();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Quote saved' })).toBeInTheDocument();
      expect(screen.getByText('Quote Saved!')).toBeInTheDocument();
    });

    expect(mocks.savedQuoteInsert).toHaveBeenCalledTimes(1);
    expect(mocks.savedQuoteInsert).toHaveBeenCalledWith(expect.objectContaining({
      id: ANON_SAVED_QUOTE_ID,
      email: 'pat@example.com',
      user_id: null,
    }));
    expect(localStorage.getItem('current_saved_quote_id')).toBe(ANON_SAVED_QUOTE_ID);
    expect(mocks.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'pat@example.com',
    }));
    expect(mocks.trackAgentEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'quote_saved',
    }));
    expect(mocks.invoke).toHaveBeenCalledWith(
      'send-saved-quote-email',
      expect.objectContaining({
        body: expect.objectContaining({ savedQuoteId: ANON_SAVED_QUOTE_ID }),
      }),
    );
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error saving quote',
    }));

    randomUUID.mockRestore();
  });

  it('saves and emails a guest quote without a phone number', async () => {
    mocks.authUser = null;
    render(<SaveQuoteDialog open onOpenChange={vi.fn()}
      quoteData={{ selectedMotor: { id: 'motor-1', hp: 115 } }} finalPrice={19000} />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'pat@example.com' } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Pat Boater' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save My Quote' }));
    await screen.findByText('Quote Saved!');
    expect(mocks.saveLead).toHaveBeenCalledWith(expect.objectContaining({ customer_phone: undefined }));
    expect(mocks.invoke).toHaveBeenCalledWith('send-quote-email', expect.objectContaining({
      body: expect.objectContaining({ customerPhone: null }),
    }));
    expect(mocks.invoke).toHaveBeenCalledWith('send-saved-quote-email', expect.objectContaining({
      body: expect.objectContaining({ customerEmail: 'pat@example.com' }),
    }));
    // Saving never texts the customer, including when they omit their phone.
    const smsCalls = mocks.invoke.mock.calls.filter(([name]) => name === 'send-sms');
    expect(smsCalls).toHaveLength(1);
    expect(smsCalls[0][1].body.to).toBe('admin');
    expect(smsCalls[0][1].body.message).toContain('Phone: Not provided');
  });

  it('rejects an incomplete phone number when one is supplied', async () => {
    render(<SaveQuoteDialog open onOpenChange={vi.fn()}
      quoteData={{ selectedMotor: { id: 'motor-1' } }} />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'pat@example.com' } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Pat Boater' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '905-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save My Quote' }));
    expect(screen.getByLabelText(/Phone/i)).toHaveAttribute('aria-invalid', 'true');
    expect(mocks.saveLead).not.toHaveBeenCalled();
  });

  it('shows Google after email saving and preserves the auto-save redirect', async () => {
    mocks.authUser = null;
    render(<SaveQuoteDialog open onOpenChange={vi.fn()}
      quoteData={{ selectedMotor: { id: 'motor-1' } }} />);
    const emailSave = screen.getByRole('button', { name: 'Save My Quote' });
    const google = screen.getByRole('button', { name: 'Continue with Google' });
    expect(emailSave.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(google);
    await waitFor(() => expect(mocks.signInWithGoogle).toHaveBeenCalledWith(
      expect.stringMatching(/\/quote\/summary\?auth_save=1$/),
    ));
    expect(mocks.saveLead).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: new Error('Function unavailable') },
    { data: null, error: null },
    { data: { data: null, error: { message: 'Provider rejected email' } }, error: null },
  ])('keeps a saved quote accessible without claiming failed email delivery', async (failure) => {
    mocks.invoke.mockImplementation(async (name: string) => name === 'send-saved-quote-email' ? failure : { error: null });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<SaveQuoteDialog open onOpenChange={vi.fn()}
      quoteData={{ selectedMotor: { id: 'motor-1' } }} />);
    await fillAndSubmitSaveForm();
    await screen.findByText('Quote Saved!');
    expect(screen.getByRole('status')).toHaveTextContent("we couldn't email the link");
    expect(screen.getByRole('link', { name: 'Open saved quote' })).toHaveAttribute(
      'href', `/quote/saved/${localStorage.getItem('current_saved_quote_id')}`,
    );
    expect(screen.queryByText(/sent details to/)).not.toBeInTheDocument();
    expect(mocks.savedQuoteInsert).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });


  it('does not promise account access when the optional sign-in email fails', async () => {
    mocks.authUser = null;
    mocks.signInWithOtp.mockResolvedValue({ error: new Error('OTP unavailable') });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<SaveQuoteDialog open onOpenChange={vi.fn()}
      quoteData={{ selectedMotor: { id: 'motor-1' } }} />);
    await fillAndSubmitSaveForm();
    await screen.findByText('Quote Saved!');
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
    expect(mocks.invoke).toHaveBeenCalledWith('send-saved-quote-email', expect.objectContaining({
      body: expect.objectContaining({ includeAccountInfo: false }),
    }));
    consoleError.mockRestore();
  });

});
