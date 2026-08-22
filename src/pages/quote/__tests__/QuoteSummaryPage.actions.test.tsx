// @vitest-environment happy-dom
/**
 * No-write populated /quote/summary fixture for issue #358.
 *
 * Renders a configured quote and exercises every customer-facing summary
 * action while analytics, CRM, reservation, financing-application, and
 * payment writes are intercepted. Used to find deterministic broken or
 * misleading affordances on the high-intent summary step.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { initialState, type QuoteState } from '@/contexts/QuoteContext';
import type { Motor } from '@/components/QuoteBuilder';
import { HelmetProvider } from '@/lib/helmet';

const navigateMock = vi.fn();
const dispatchMock = vi.fn();
const trackEventMock = vi.fn();
const trackAgentEventMock = vi.fn();
const saveLeadMock = vi.fn();
const generateQuotePDFMock = vi.fn();
const downloadPDFMock = vi.fn();
const generateQrMock = vi.fn();
const toastMock = vi.fn();
const signInWithGoogleMock = vi.fn();

type RecordedWrite = {
  table?: string;
  op: string;
  payload?: unknown;
  fn?: string;
};

const writes: RecordedWrite[] = [];

function blockedResult() {
  return Promise.resolve({ data: null, error: { message: 'no-write fixture blocked this write' } });
}

function createQuery(table: string) {
  const query: Record<string, unknown> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.or = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
  query.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
  query.insert = vi.fn((payload: unknown) => {
    writes.push({ table, op: 'insert', payload });
    return blockedResult();
  });
  query.update = vi.fn((payload: unknown) => {
    writes.push({ table, op: 'update', payload });
    return query;
  });
  query.upsert = vi.fn((payload: unknown) => {
    writes.push({ table, op: 'upsert', payload });
    return blockedResult();
  });
  query.delete = vi.fn(() => {
    writes.push({ table, op: 'delete' });
    return query;
  });
  query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    blockedResult().then(resolve, reject);
  return query;
}

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/components/quote-builder/QuoteLayout', () => ({
  QuoteLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/ScrollToTop', () => ({
  ScrollToTop: () => null,
}));

vi.mock('@/components/seo/QuoteSummaryPageSEO', () => ({
  QuoteSummaryPageSEO: () => null,
}));

vi.mock('@/hooks/useAutoSaveQuoteOnAuth', () => ({
  useAutoSaveQuoteOnAuth: () => undefined,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

vi.mock('@/lib/agentEvents', () => ({
  trackAgentEvent: (...args: unknown[]) => trackAgentEventMock(...args),
}));

vi.mock('@/lib/leadCapture', () => ({
  saveLead: (...args: unknown[]) => saveLeadMock(...args),
}));

vi.mock('@/lib/react-pdf-generator', () => ({
  generateQuotePDF: (...args: unknown[]) => generateQuotePDFMock(...args),
  downloadPDF: (...args: unknown[]) => downloadPDFMock(...args),
  generatePDFBlob: vi.fn(),
}));

vi.mock('@/lib/saved-quote-qr', () => ({
  generateSavedQuoteQrCode: (...args: unknown[]) => generateQrMock(...args),
}));

vi.mock('@/hooks/useGoogleReviewStats', () => ({
  useGoogleReviewStats: () => ({ rating: 4.9, totalReviews: 120, isLive: false, isLoading: false }),
}));

vi.mock('@/hooks/useActiveFinancingPromo', () => ({
  useActiveFinancingPromo: () => ({
    promo: { id: 'td-always-on', name: 'Always On', rate: 7.99 },
    loading: false,
  }),
}));

vi.mock('@/hooks/useActivePromotions', () => ({
  useActivePromotions: () => ({
    promotions: [],
    loading: false,
    getTotalPromotionalSavings: () => 0,
    getPromotionSavingsForMotor: () => 0,
    getPromotionOptions: () => [],
    getRebateForHP: () => null,
    getSpecialFinancingRates: () => null,
    getAppliedPromotion: () => null,
  }),
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
    loading: false,
    signInWithGoogle: signInWithGoogleMock,
  }),
}));

vi.mock('@/components/auth/GoogleSignInButton', () => ({
  GoogleSignInButton: () => <button type="button">Continue with Google</button>,
}));

const fixtureMotor: Motor = {
  id: 'motor-150-elpt',
  model: '150 ELPT FourStroke',
  year: 2026,
  hp: 150,
  price: 16900,
  salePrice: 16900,
  msrp: 18500,
  image: '/test-motor.webp',
  stockStatus: 'In Stock',
  category: 'mid-range',
  type: 'FourStroke',
  specs: '',
};

const fixtureState: QuoteState = {
  ...initialState,
  isLoading: false,
  motor: fixtureMotor,
  purchasePath: 'installed',
  boatInfo: { type: 'pontoon' } as QuoteState['boatInfo'],
  selectedPackage: { id: 'good', label: 'Configured Quote', priceBeforeTax: 0 },
  selectedPaymentMethod: 'standard_financing',
  completedSteps: [1, 2, 3, 4, 5],
  currentStep: 6,
};

vi.mock('@/contexts/QuoteContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/QuoteContext')>();
  return {
    ...actual,
    useQuote: () => ({
      state: fixtureState,
      dispatch: dispatchMock,
      getQuoteData: () => ({
        motor: fixtureMotor,
        boatInfo: fixtureState.boatInfo,
        financing: fixtureState.financing,
        warrantyConfig: fixtureState.warrantyConfig,
        hasTradein: fixtureState.hasTradein,
        purchasePath: fixtureState.purchasePath,
        installConfig: fixtureState.installConfig,
        fuelTankConfig: fixtureState.fuelTankConfig,
        tradeInInfo: fixtureState.tradeInInfo,
        selectedOptions: fixtureState.selectedOptions,
        selectedPackage: fixtureState.selectedPackage,
        adminDiscount: fixtureState.adminDiscount,
        adminNotes: fixtureState.adminNotes,
        customerNotes: fixtureState.customerNotes,
        isAdminQuote: fixtureState.isAdminQuote,
        selectedPromoOption: fixtureState.selectedPromoOption,
        selectedPromoRate: fixtureState.selectedPromoRate,
        selectedPromoTerm: fixtureState.selectedPromoTerm,
        selectedPromoValue: fixtureState.selectedPromoValue,
        selectedPaymentMethod: fixtureState.selectedPaymentMethod,
        looseMotorBattery: fixtureState.looseMotorBattery,
        pdfSnapshot: fixtureState.pdfSnapshot,
      }),
    }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => createQuery(table),
    functions: {
      invoke: vi.fn((fn: string, payload?: unknown) => {
        writes.push({ op: 'invoke', fn, payload });
        return blockedResult();
      }),
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: vi.fn(() => {
          writes.push({ op: 'storage-upload' });
          return blockedResult();
        }),
      }),
    },
  },
}));

import QuoteSummaryPage from '../QuoteSummaryPage';

async function renderPopulatedSummary() {
  const view = render(
    <HelmetProvider>
      <QuoteSummaryPage />
    </HelmetProvider>,
  );
  await screen.findByRole('button', { name: /reserve this motor/i });
  return view;
}

function iconName(button: HTMLElement): string | null {
  const svg = button.querySelector('svg');
  if (!svg) return null;
  const iconClass = [...svg.classList].find((cls) => cls.startsWith('lucide-') && cls !== 'lucide');
  return iconClass ?? svg.getAttribute('class');
}

function mobileAction(name: RegExp | string) {
  const section = document.querySelector('.lg\\:hidden.space-y-3');
  if (!section) {
    throw new Error('Mobile summary action section was not rendered');
  }
  return within(section as HTMLElement).getByRole('button', { name });
}

describe('populated quote summary actions (no-write fixture, #358)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writes.length = 0;
    localStorage.clear();
    sessionStorage.clear();
    generateQuotePDFMock.mockResolvedValue('blob:fixture-pdf');
    downloadPDFMock.mockResolvedValue(undefined);
    generateQrMock.mockResolvedValue('data:image/png;base64,qr');
    saveLeadMock.mockResolvedValue(undefined);
    signInWithGoogleMock.mockResolvedValue({ error: null });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
  });

  it('renders every populated summary action and keeps writes intercepted', async () => {
    await renderPopulatedSummary();

    const reserve = mobileAction(/reserve this motor/i);
    const review = mobileAction(/have hbw review my quote/i);
    const save = mobileAction(/save for later/i);
    const pdf = mobileAction(/^download pdf$/i);
    const financing = mobileAction(/apply for financing/i);

    expect(reserve).toBeEnabled();
    expect(review).toBeEnabled();
    expect(save).toBeEnabled();
    expect(pdf).toBeEnabled();
    expect(financing).toBeEnabled();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(saveLeadMock).not.toHaveBeenCalled();
    expect(writes.some((write) => write.fn === 'create-payment')).toBe(false);
    expect(writes.every((write) => write.op !== 'insert' || write.table === 'saved_quotes')).toBe(true);
  });

  it('opens reservation, review, save, PDF, and financing without completing side-effect flows', async () => {
    const { unmount: unmountReserve } = await renderPopulatedSummary();
    fireEvent.click(mobileAction(/reserve this motor/i));
    expect(await screen.findByRole('heading', { name: /reserve this motor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review secure checkout/i })).toBeEnabled();
    expect(writes.some((write) => write.fn === 'create-payment')).toBe(false);
    unmountReserve();

    const { unmount: unmountReview } = await renderPopulatedSummary();
    fireEvent.click(mobileAction(/have hbw review my quote/i));
    expect(navigateMock).toHaveBeenCalledWith('/quote/schedule');
    expect(saveLeadMock).not.toHaveBeenCalled();
    unmountReview();

    const { unmount: unmountSave } = await renderPopulatedSummary();
    fireEvent.click(mobileAction(/save for later/i));
    expect(await screen.findByRole('heading', { name: /save your quote/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(signInWithGoogleMock).not.toHaveBeenCalled();
    expect(saveLeadMock).not.toHaveBeenCalled();
    unmountSave();

    const { unmount: unmountPdf } = await renderPopulatedSummary();
    fireEvent.click(mobileAction(/^download pdf$/i));
    await waitFor(() => {
      expect(generateQuotePDFMock).toHaveBeenCalled();
    });
    expect(saveLeadMock).not.toHaveBeenCalled();
    expect(writes.some((write) => write.fn === 'create-payment')).toBe(false);
    unmountPdf();

    await renderPopulatedSummary();
    fireEvent.click(mobileAction(/apply for financing/i));
    expect(navigateMock).toHaveBeenCalledWith('/financing/apply');
    expect(saveLeadMock).not.toHaveBeenCalled();
    expect(writes.some((write) => write.fn === 'create-payment')).toBe(false);
  });

  it('does not dress the mobile save action as a download next to Download PDF', async () => {
    await renderPopulatedSummary();
    const save = mobileAction(/save for later/i);
    const pdf = mobileAction(/^download pdf$/i);

    expect(iconName(save)).toBe('lucide-bookmark');
    expect(iconName(pdf)).toBe('lucide-download');
    expect(within(save).queryByText(/download/i)).not.toBeInTheDocument();
  });
});
