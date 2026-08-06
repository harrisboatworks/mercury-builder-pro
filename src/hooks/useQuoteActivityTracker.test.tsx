// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackerHarness = vi.hoisted(() => ({
  state: { current: {} as Record<string, unknown> },
  pathname: { current: '/quote/motor-selection' },
  insert: vi.fn(),
  lt: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ state: trackerHarness.state.current }),
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useLocation: () => ({ pathname: trackerHarness.pathname.current }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: trackerHarness.from,
    supabaseUrl: 'https://example.supabase.co',
    supabaseKey: 'test-key',
  },
}));

import { useQuoteActivityTracker } from './useQuoteActivityTracker';

const motor = {
  id: 'motor-20-elhpt',
  model: '20 ELHPT FourStroke',
  hp: 20,
  price: 5528,
};

function quoteState(overrides: Record<string, unknown> = {}) {
  return {
    isLoading: false,
    motor: null,
    selectedOptions: [],
    purchasePath: null,
    hasTradein: false,
    tradeInInfo: null,
    financing: { term: 0, rate: 0, downPayment: 0 },
    boatInfo: null,
    installConfig: null,
    selectedPromoOption: null,
    selectedPackage: null,
    currentStep: 1,
    completedSteps: [],
    ...overrides,
  };
}

describe('useQuoteActivityTracker queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('quote_activity_session_id', 'qa_queue_test');

    trackerHarness.pathname.current = '/quote/motor-selection';
    trackerHarness.state.current = quoteState({ isLoading: true });
    trackerHarness.lt.mockResolvedValue({ count: 0, error: null });
    trackerHarness.from.mockImplementation(() => ({
      insert: trackerHarness.insert,
      select: () => ({
        eq: () => ({ lt: trackerHarness.lt }),
      }),
    }));
  });

  it('preserves rapid motor, options, and submission events while a write is in flight', async () => {
    let releaseFirstWrite: (value: { error: null }) => void = () => {};
    const firstWrite = new Promise<{ error: null }>((resolve) => {
      releaseFirstWrite = resolve;
    });
    trackerHarness.insert
      .mockImplementationOnce(() => firstWrite)
      .mockResolvedValue({ error: null });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    );

    const { rerender, unmount } = renderHook(() => useQuoteActivityTracker());

    trackerHarness.pathname.current = '/quote/options';
    trackerHarness.state.current = quoteState({ motor });
    rerender();

    trackerHarness.state.current = quoteState({
      motor,
      selectedOptions: [{
        optionId: 'battery',
        name: 'Starting battery',
        price: 179.99,
        category: 'electrical',
        assignmentType: 'available',
        isIncluded: false,
      }],
    });
    rerender();

    trackerHarness.pathname.current = '/quote/schedule';
    trackerHarness.state.current = quoteState({
      motor,
      selectedOptions: [{
        optionId: 'battery',
        name: 'Starting battery',
        price: 179.99,
        category: 'electrical',
        assignmentType: 'available',
        isIncluded: false,
      }],
      purchasePath: 'loose-motor',
      completedSteps: [1, 2, 7],
      currentStep: 7,
    });
    rerender();

    await waitFor(() => expect(trackerHarness.insert).toHaveBeenCalledTimes(1));
    expect(trackerHarness.insert.mock.calls[0][0].event_type).toBe('motor_selected');

    await act(async () => {
      releaseFirstWrite({ error: null });
      await firstWrite;
    });

    await waitFor(() => expect(trackerHarness.insert).toHaveBeenCalledTimes(4));
    expect(trackerHarness.insert.mock.calls.map(([payload]) => payload.event_type)).toEqual([
      'motor_selected',
      'options_configured',
      'purchase_path_chosen',
      'quote_submitted',
    ]);

    trackerHarness.pathname.current = '/quote/trade-in';
    rerender();

    await act(async () => {
      await Promise.resolve();
    });
    expect(trackerHarness.insert).toHaveBeenCalledTimes(4);
    expect(fetchSpy.mock.calls.some(([input]) => String(input).includes('submit-quote-lead'))).toBe(false);

    fetchSpy.mockRestore();
    unmount();
  });
});
