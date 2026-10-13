import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  childId: 'ndc_' + 'a'.repeat(32),
  user: { id: 'buyer-a' } as { id: string } | null,
  invoke: vi.fn(),
  signIn: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invoke.mockReset();
  mocks.user = { id: 'buyer-a' };
  mocks.childId = 'ndc_' + 'a'.repeat(32);
  mocks.signIn.mockResolvedValue({ error: null });
});
afterEach(() => {
  cleanup();
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

describe('AgentDepositReviewPage payment handoff and pending approvals', () => {
  it('directs bank verification to the original wallet and only refreshes the existing receipt', async () => {
    mocks.invoke.mockResolvedValueOnce(result(review('a', {
      payment_status: 'requires_action', nonce: null,
      client_secret: 'pi_synthetic_secret_not_for_the_merchant',
      next_action: { type: 'shared_payment_token_action', shared_payment_token_action: {} },
    }))).mockResolvedValueOnce(result(review('a', { paid: true, payment_status: 'paid', nonce: null })));
    render(page());
    openReview();
    expect(await screen.findByText(/Return to the wallet that approved this deposit to finish bank verification/)).toHaveTextContent(
      'Your original payment remains pending; do not start another deposit.',
    );
    expect(screen.queryByRole('button', { name: 'Verify payment securely' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve .* deposit/ })).not.toBeInTheDocument();
    expect(screen.queryByText('pi_synthetic_secret_not_for_the_merchant')).not.toBeInTheDocument();
    expect(document.querySelector('script[src="https://js.stripe.com/v3/"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh payment status' }));
    await screen.findByText(/deposit is paid\. HBW will confirm/);
    expect(mocks.invoke.mock.calls).toEqual([
      ['native-deposit-review', { body: { action: 'review', child_id: mocks.childId }, headers: {} }],
      ['native-deposit-review', { body: { action: 'review', child_id: mocks.childId }, headers: {} }],
    ]);
  });

  it('shows a definitive failure as dealer-assisted recovery instead of offering another payment', async () => {
    mocks.invoke.mockResolvedValueOnce(result(review('a', { payment_status: 'failed', approved: true })));
    render(page());
    openReview();
    expect(await screen.findByText(/Your payment did not complete/)).toHaveTextContent(
      'Contact HBW to check the original payment and prepare a fresh deposit.',
    );
    expect(screen.queryByText(/Payment reconciliation is pending/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deposit approved\. Return to your assistant/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve .* deposit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify payment securely' })).not.toBeInTheDocument();
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });

  it.each(['account', 'route'] as const)('discards a late approval after the %s changes without refreshing the old quote', async kind => {
    const pending = deferred<InvokeResult>();
    mocks.invoke.mockResolvedValueOnce(result(review('a'))).mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(result(review('b')));
    const { rerender } = render(page());
    openReview();
    await screen.findByText('Synthetic motor a');
    fireEvent.click(screen.getByRole('link', { name: 'Open the exact quote PDF' }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Approve .* deposit/ }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, 'native-deposit-review', {
      body: { action: 'approve', child_id: 'ndc_' + 'a'.repeat(32), nonce: 'a'.repeat(64), review_digest: 'd'.repeat(64), accept_terms: true },
      headers: {},
    });
    changeContext(kind);
    rerender(page());
    openReview();
    await screen.findByText('Synthetic motor b');
    await act(async () => { pending.resolve(result({ approved: true })); });
    expect(mocks.invoke).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Synthetic motor a')).not.toBeInTheDocument();
    expect(screen.queryByText(/Deposit approved\. Return to your assistant/)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: /Approve .* deposit/ })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['account', 'route'] as const)('does not show a stale private approval error in the new %s context', async kind => {
    const pending = deferred<InvokeResult>();
    mocks.invoke.mockResolvedValueOnce(result(review('a'))).mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(result(review('b')));
    const { rerender } = render(page());
    openReview();
    await screen.findByText('Synthetic motor a');
    fireEvent.click(screen.getByRole('link', { name: 'Open the exact quote PDF' }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Approve .* deposit/ }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
    changeContext(kind);
    rerender(page());
    openReview();
    await screen.findByText('Synthetic motor b');
    await act(async () => { pending.resolve(result({ error: 'Synthetic private buyer A approval error' })); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Synthetic motor b')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the exact quote PDF' })).toHaveAttribute('href', review('b').document_url);
    expect(screen.getByRole('button', { name: 'Refresh payment status' })).toBeEnabled();
    expect(mocks.invoke).toHaveBeenCalledTimes(3);
  });
});
