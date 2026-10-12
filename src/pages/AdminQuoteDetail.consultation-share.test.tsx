/// <reference types="node" />

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exactSubmittedConsultationQuote } from '@/test/consultation-submitted-quote.fixtures';
import { SITE_URL } from '@/lib/site';

/**
 * Offline rendered harness for the admin quote detail share contract.
 * Synthetic rows only: a consultation-submit receipt versus a paid deposit packet.
 * No database, provider, or customer record is contacted.
 */

const DETAIL_ID = '11111111-1111-4111-8111-111111111111';
const DEPOSIT_CUSTOMER_QUOTE_ID = '33333333-3333-4333-8333-333333333333';
const PRIVATE_DOCUMENT_URL = 'https://documents.example.test/consultation/synthetic-share';
const PRIVATE_DOWNLOAD_URL = 'https://documents.example.test/consultation/synthetic-download';
const RESERVATION_DOWNLOAD_URL = 'https://documents.example.test/reservation/synthetic.pdf';

const harness = vi.hoisted(() => ({
  mode: 'submitted' as 'submitted' | 'deposit',
  invokes: [] as Array<{ name: string; body: Record<string, unknown> | undefined }>,
  anchorClicks: [] as Array<{ href: string; download: string }>,
  writeText: vi.fn().mockResolvedValue(undefined) as ReturnType<typeof vi.fn>,
}));

function submittedCustomerQuote() {
  const receipt = exactSubmittedConsultationQuote();
  return {
    id: DETAIL_ID,
    created_at: '2026-08-01T15:00:00Z',
    customer_name: receipt.customer.name,
    customer_email: receipt.customer.email,
    customer_phone: receipt.customer.phone,
    base_price: receipt.pricing.msrp,
    final_price: receipt.pricing.totalPrice,
    deposit_amount: 0,
    loan_amount: 0,
    monthly_payment: 0,
    term_months: 0,
    total_cost: receipt.pricing.totalPrice,
    admin_discount: 0,
    admin_notes: '',
    customer_notes: receipt.customerNotes,
    quote_data: receipt,
    lead_status: 'saved',
    lead_source: 'website',
    payment_status: null,
  };
}

function depositSavedQuote() {
  return {
    id: DETAIL_ID,
    created_at: '2026-08-02T15:00:00Z',
    email: 'synthetic-deposit@example.com',
    is_soft_lead: false,
    deposit_amount: 500,
    deposit_status: 'paid',
    deposit_paid_at: '2026-08-02T16:00:00Z',
    reference_number: 'HBW-900500',
    quote_pdf_path: `saved-quotes/${DETAIL_ID}/quote.pdf`,
    quote_pdf_sha256: 'synthetic-sha256-not-a-document',
    quote_state: {
      source: 'saved',
      motor: { model: 'Mercury 90 FourStroke', hp: 90, price: 12000 },
      basePrice: 12000,
      finalPrice: 12000,
      customerNotes: '',
    },
  };
}

function depositCustomerQuote() {
  return {
    id: DEPOSIT_CUSTOMER_QUOTE_ID,
    saved_quote_id: DETAIL_ID,
    created_at: '2026-08-02T15:00:00Z',
    customer_name: 'Synthetic Deposit',
    customer_email: 'synthetic-deposit@example.com',
    customer_phone: '+19055550000',
    base_price: 12000,
    final_price: 12000,
    deposit_amount: 500,
    loan_amount: 0,
    monthly_payment: 0,
    term_months: 0,
    total_cost: 12000,
    admin_discount: 0,
    lead_source: 'deposit',
    payment_status: 'paid',
    payment_paid_at: '2026-08-02T16:00:00Z',
    quote_data: {
      source: 'saved',
      motor: { model: 'Mercury 90 FourStroke', hp: 90 },
    },
  };
}

function queryResult() {
  return {
    select: () => queryResult(),
    eq: () => queryResult(),
    contains: () => queryResult(),
    maybeSingle: () => Promise.resolve(rowForCurrentTable()),
    then: (
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(rowForCurrentTable()).then(resolve, reject),
  };
}

let currentTable = '';

function rowForCurrentTable(): { data: unknown; error: null } {
  if (currentTable === 'saved_quotes') {
    return {
      data: harness.mode === 'deposit' ? depositSavedQuote() : null,
      error: null,
    };
  }
  if (currentTable === 'customer_quotes') {
    return {
      data: harness.mode === 'deposit' ? depositCustomerQuote() : submittedCustomerQuote(),
      error: null,
    };
  }
  if (currentTable === 'deposit_email_deliveries') {
    return { data: [], error: null };
  }
  return { data: null, error: null };
}

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: DETAIL_ID }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ dispatch: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'admin-synthetic' } }),
}));

vi.mock('@/components/admin/AdminNav', () => ({
  default: () => <div>Admin nav</div>,
}));

vi.mock('@/components/admin/QuoteChangeLog', () => ({
  QuoteChangeLog: () => null,
}));

vi.mock('@/components/admin/QuoteHistoryTimeline', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/ContactLog', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/FollowUpReminder', () => ({
  default: () => null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      currentTable = table;
      return queryResult();
    },
    rpc: () => Promise.resolve({ data: [], error: null }),
    functions: {
      invoke: (name: string, args?: { body?: Record<string, unknown> }) => {
        harness.invokes.push({ name, body: args?.body });
        if (name === 'admin-consultation-document' && args?.body?.action === 'admin-share') {
          return Promise.resolve({ data: { documentAccessUrl: PRIVATE_DOCUMENT_URL }, error: null });
        }
        if (name === 'admin-consultation-document' && args?.body?.action === 'admin-download') {
          return Promise.resolve({ data: { signedUrl: PRIVATE_DOWNLOAD_URL }, error: null });
        }
        if (name === 'admin-consultation-document' && args?.body?.action === 'admin-email') {
          return Promise.resolve({ data: { success: true }, error: null });
        }
        if (name === 'quote-document-api') {
          return Promise.resolve({ data: { signedUrl: RESERVATION_DOWNLOAD_URL }, error: null });
        }
        return Promise.resolve({ data: null, error: { message: `unexpected ${name}` } });
      },
    },
  },
}));

import AdminQuoteDetail from './AdminQuoteDetail';

const savedQuoteUrl = `${SITE_URL}/quote/saved/${DETAIL_ID}`;

function installBrowserStubs() {
  harness.writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: harness.writeText },
  });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url !== RESERVATION_DOWNLOAD_URL) {
      throw new Error(`blocked unexpected fetch ${url}`);
    }
    return {
      ok: true,
      blob: async () => new Blob(['%PDF-synthetic'], { type: 'application/pdf' }),
    };
  }));
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: () => 'blob:synthetic-reservation',
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: () => undefined,
  });
  HTMLAnchorElement.prototype.click = function recordAnchorClick(this: HTMLAnchorElement) {
    harness.anchorClicks.push({
      href: this.href,
      download: this.download,
    });
  };
}

const originalAnchorClick = HTMLAnchorElement.prototype.click;

describe('AdminQuoteDetail consultation and deposit share', () => {
  beforeEach(() => {
    harness.mode = 'submitted';
    harness.invokes.length = 0;
    harness.anchorClicks.length = 0;
    installBrowserStubs();
  });

  afterEach(() => {
    HTMLAnchorElement.prototype.click = originalAnchorClick;
    vi.unstubAllGlobals();
  });

  it('renders a submitted consultation as the private receipt, not a public saved-quote link', async () => {
    render(<AdminQuoteDetail />);

    expect(await screen.findByRole('heading', { name: 'Submitted quote HBW-150193' })).toBeInTheDocument();
    expect(screen.getByText('These are the prices recorded when this quote was submitted.')).toBeInTheDocument();
    expect(screen.getByText('Copy Link creates a private link to the original PDF, valid for 30 days.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trade-In' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Canonical reservation PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Full Quote' })).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${SITE_URL}/quote/saved/`))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Email Quote' })).toBeInTheDocument();
  });

  it('copies and downloads the private consultation document for a submitted quote', async () => {
    render(<AdminQuoteDetail />);
    await screen.findByRole('heading', { name: 'Submitted quote HBW-150193' });

    fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));

    await waitFor(() => {
      expect(harness.writeText).toHaveBeenCalledWith(PRIVATE_DOCUMENT_URL);
    });
    expect(harness.invokes).toContainEqual({
      name: 'admin-consultation-document',
      body: { action: 'admin-share', quoteId: DETAIL_ID },
    });
    expect(screen.getByText(PRIVATE_DOCUMENT_URL)).toBeInTheDocument();
    expect(harness.writeText).not.toHaveBeenCalledWith(savedQuoteUrl);

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => {
      expect(harness.anchorClicks).toEqual([
        expect.objectContaining({ href: PRIVATE_DOWNLOAD_URL }),
      ]);
    });
    expect(harness.invokes).toContainEqual({
      name: 'admin-consultation-document',
      body: { action: 'admin-download', quoteId: DETAIL_ID },
    });
    expect(harness.invokes.some((call) => call.name === 'quote-document-api')).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('emails a submitted quote through the private consultation document', async () => {
    render(<AdminQuoteDetail />);
    await screen.findByRole('button', { name: 'Email Quote' });

    fireEvent.click(screen.getByRole('button', { name: 'Email Quote' }));

    await waitFor(() => {
      expect(harness.invokes).toContainEqual({
        name: 'admin-consultation-document',
        body: { action: 'admin-email', quoteId: DETAIL_ID, emailIntent: 'send' },
      });
    });
    expect(harness.invokes.some((call) => call.name === 'send-quote-email')).toBe(false);
  });

  it('keeps a paid deposit packet on the saved-quote link and canonical reservation PDF', async () => {
    harness.mode = 'deposit';
    render(<AdminQuoteDetail />);

    expect(await screen.findByRole('heading', { name: 'Canonical reservation PDF' })).toBeInTheDocument();
    expect(screen.getByText('Status: bound')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Download canonical reservation PDF' }).length).toBeGreaterThan(0);
    expect(screen.getByText(`${SITE_URL}/quote/saved/${DETAIL_ID.slice(0, 8)}...`)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Submitted quote/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/private link to the original PDF/)).not.toBeInTheDocument();
    expect(screen.getByText(/tracked three-audience confirmation/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Email Quote' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));
    await waitFor(() => {
      expect(harness.writeText).toHaveBeenCalledWith(savedQuoteUrl);
    });
    expect(harness.invokes.some((call) => call.name === 'admin-consultation-document')).toBe(false);

    fireEvent.click(screen.getAllByRole('button', { name: 'Download canonical reservation PDF' })[0]);
    await waitFor(() => {
      expect(harness.invokes).toContainEqual({
        name: 'quote-document-api',
        body: { action: 'download', savedQuoteId: DETAIL_ID },
      });
    });
    expect(fetch).toHaveBeenCalledWith(RESERVATION_DOWNLOAD_URL);
    expect(harness.anchorClicks[0]?.download).toBe(`HBW-reservation-${DETAIL_ID.slice(0, 8)}.pdf`);
  });
});
