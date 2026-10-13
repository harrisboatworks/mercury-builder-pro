import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  childId: 'ndc_' + 'a'.repeat(32),
  user: { id: 'buyer-a' } as { id: string } | null,
  invoke: vi.fn(),
  signIn: vi.fn(),
  stripe: vi.fn(),
  handleNextAction: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useParams: () => ({ childId: mocks.childId }),
}));
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: mocks.user, signIn: mocks.signIn }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import AgentDepositReviewPage from './AgentDepositReviewPage';

type InvokeResult = { data: Record<string, unknown>; error: null };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(settle => { resolve = settle; });
  return { promise, resolve };
}
function review(label: string, extra: Record<string, unknown> = {}) {
  return {
    motor: `Synthetic motor ${label}`,
    amount_cents: 50000,
    merchandise_cents: 1400000,
    currency: 'CAD',
    document_url: `https://example.invalid/private-quote-${label}.pdf`,
    terms: 'Synthetic reservation terms',
    approved: false,
    paid: false,
    payment_status: 'requires_escalation',
    nonce: label.repeat(64),
    review_digest: 'd'.repeat(64),
    ...extra,
  };
}
const result = (data: Record<string, unknown>): InvokeResult => ({ data, error: null });
const page = () => <MemoryRouter><AgentDepositReviewPage /></MemoryRouter>;
function openReview() {
  fireEvent.click(screen.getByRole('button', { name: 'Open my deposit review' }));
}
function changeContext(kind: 'account' | 'route') {
  if (kind === 'account') mocks.user = { id: 'buyer-b' };
  else mocks.childId = 'ndc_' + 'b'.repeat(32);
}
function exposeStripe() {
  Object.defineProperty(window, 'Stripe', { configurable: true, writable: true, value: mocks.stripe });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invoke.mockReset();
  mocks.handleNextAction.mockReset();
  mocks.stripe.mockReset();
  mocks.user = { id: 'buyer-a' };
  mocks.childId = 'ndc_' + 'a'.repeat(32);
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.handleNextAction.mockResolvedValue({});
  mocks.stripe.mockReturnValue({ handleNextAction: mocks.handleNextAction });
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_synthetic_only');
  exposeStripe();
});
afterEach(() => {
  cleanup();
  delete (window as Window & { Stripe?: unknown }).Stripe;
  document.querySelectorAll('script[src="https://js.stripe.com/v3/"]').forEach(script => script.remove());
  vi.unstubAllEnvs();
});

describe('AgentDepositReviewPage private context', () => {
  it('clears the private PDF, guest capability and approval controls when the account changes', async () => {
    mocks.invoke.mockResolvedValueOnce(result(review('a'))).mockResolvedValueOnce(result(review('b')));
    const { rerender } = render(page());
    fireEvent.change(screen.getByLabelText('Saved quote access code (guest quotes only)'), { target: { value: 'dep_synthetic_guest_a' } });
    openReview();
    await screen.findByText('Synthetic motor a');
    fireEvent.click(screen.getByRole('link', { name: 'Open the exact quote PDF' }));
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /Approve .* deposit/ })).toBeEnabled();
    expect(mocks.invoke).toHaveBeenNthCalledWith(1, 'native-deposit-review', {
      body: { action: 'review', child_id: mocks.childId }, headers: { 'x-resume-token': 'dep_synthetic_guest_a' },
    });

    mocks.user = null;
    rerender(page());
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open the exact quote PDF' })).not.toBeInTheDocument();
    mocks.user = { id: 'buyer-b' };
    rerender(page());
    expect(screen.queryByText('Synthetic motor a')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Saved quote access code (guest quotes only)')).toHaveValue('');
    openReview();
    await screen.findByText('Synthetic motor b');
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, 'native-deposit-review', {
      body: { action: 'review', child_id: mocks.childId }, headers: {},
    });
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: /Approve .* deposit/ })).toBeDisabled();
    expect(screen.getByText('Open the quote PDF before approving.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the exact quote PDF' })).toHaveAttribute('href', review('b').document_url);
  });

  it('requires a fresh review when the route changes instead of retaining the previous approval', async () => {
    mocks.invoke.mockResolvedValueOnce(result(review('a', { approved: true, nonce: null, payment_status: 'approved' })))
      .mockResolvedValueOnce(result(review('b')));
    const { rerender } = render(page());
    fireEvent.change(screen.getByLabelText('Saved quote access code (guest quotes only)'), { target: { value: 'dep_synthetic_guest_a' } });
    openReview();
    await screen.findByText(/Deposit approved\. Return to your assistant/);
    changeContext('route');
    rerender(page());
    expect(screen.queryByText(/Deposit approved\. Return to your assistant/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open the exact quote PDF' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Saved quote access code (guest quotes only)')).toHaveValue('');
    openReview();
    await screen.findByText('Synthetic motor b');
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, 'native-deposit-review', {
      body: { action: 'review', child_id: 'ndc_' + 'b'.repeat(32) }, headers: {},
    });
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: /Approve .* deposit/ })).toBeDisabled();
  });

  it.each(['account', 'route'] as const)('discards a late private review after the %s changes', async kind => {
    const pending = deferred<InvokeResult>();
    mocks.invoke.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(result(review('b')));
    const { rerender } = render(page());
    openReview();
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    changeContext(kind);
    rerender(page());
    openReview();
    await screen.findByText('Synthetic motor b');
    await act(async () => { pending.resolve(result(review('a'))); });
    expect(screen.queryByText('Synthetic motor a')).not.toBeInTheDocument();
    expect(screen.getByText('Synthetic motor b')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the exact quote PDF' })).toHaveAttribute('href', review('b').document_url);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Please wait…')).not.toBeInTheDocument();
  });
});

describe('AgentDepositReviewPage owned bank verification', () => {
  it('gets the secret only through owned step_up, calls Stripe.js and refreshes the paid receipt', async () => {
    mocks.invoke.mockResolvedValueOnce(result(review('a', { payment_status: 'requires_action', nonce: null })))
      .mockResolvedValueOnce(result({ client_secret: 'pi_synthetic_secret_bank' }))
      .mockResolvedValueOnce(result(review('a', { paid: true, payment_status: 'paid', nonce: null })));
    render(page());
    openReview();
    fireEvent.click(await screen.findByRole('button', { name: 'Verify payment securely' }));
    await screen.findByText(/deposit is paid\. HBW will confirm/);
    expect(mocks.invoke.mock.calls).toEqual([
      ['native-deposit-review', { body: { action: 'review', child_id: mocks.childId }, headers: {} }],
      ['native-deposit-review', { body: { action: 'step_up', child_id: mocks.childId }, headers: {} }],
      ['native-deposit-review', { body: { action: 'review', child_id: mocks.childId }, headers: {} }],
    ]);
    expect(mocks.stripe).toHaveBeenCalledExactlyOnceWith('pk_test_synthetic_only');
    expect(mocks.handleNextAction).toHaveBeenCalledExactlyOnceWith({ clientSecret: 'pi_synthetic_secret_bank' });
    expect(screen.queryByText('pi_synthetic_secret_bank')).not.toBeInTheDocument();
  });

  it('does not launch Stripe verification when step_up returns after an account switch', async () => {
    const pending = deferred<InvokeResult>();
    mocks.invoke.mockResolvedValueOnce(result(review('a', { payment_status: 'requires_action', nonce: null })))
      .mockReturnValueOnce(pending.promise);
    const { rerender } = render(page());
    openReview();
    fireEvent.click(await screen.findByRole('button', { name: 'Verify payment securely' }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
    changeContext('account');
    rerender(page());
    await act(async () => { pending.resolve(result({ client_secret: 'pi_synthetic_secret_bank' })); });
    expect(mocks.stripe).not.toHaveBeenCalled();
    expect(mocks.handleNextAction).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Open my deposit review' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not launch the previous quote verification if the route changes while Stripe.js loads', async () => {
    delete (window as Window & { Stripe?: unknown }).Stripe;
    mocks.invoke.mockResolvedValueOnce(result(review('a', { payment_status: 'requires_action', nonce: null })))
      .mockResolvedValueOnce(result({ client_secret: 'pi_synthetic_secret_bank' }));
    const { rerender } = render(page());
    openReview();
    fireEvent.click(await screen.findByRole('button', { name: 'Verify payment securely' }));
    let script!: HTMLScriptElement;
    await waitFor(() => {
      script = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]')!;
      expect(script).not.toBeNull();
    });
    changeContext('route');
    rerender(page());
    exposeStripe();
    await act(async () => { fireEvent.load(script); });
    expect(mocks.handleNextAction).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Open my deposit review' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not request the previous quote again when an in-flight bank challenge finishes after sign-out', async () => {
    const pending = deferred<{ error?: { message?: string } }>();
    mocks.handleNextAction.mockReturnValueOnce(pending.promise);
    mocks.invoke.mockResolvedValueOnce(result(review('a', { payment_status: 'requires_action', nonce: null })))
      .mockResolvedValueOnce(result({ client_secret: 'pi_synthetic_secret_bank' }))
      .mockResolvedValueOnce(result(review('a', { paid: true, payment_status: 'paid', nonce: null })));
    const { rerender } = render(page());
    openReview();
    fireEvent.click(await screen.findByRole('button', { name: 'Verify payment securely' }));
    await waitFor(() => expect(mocks.handleNextAction).toHaveBeenCalledTimes(1));
    mocks.user = null;
    rerender(page());
    await act(async () => { pending.resolve({}); });
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(screen.queryByRole('link', { name: 'Open the exact quote PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
