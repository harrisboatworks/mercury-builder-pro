import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { HelmetProvider } from '@/lib/helmet';
import { MotorComparisonProvider } from '@/contexts/MotorComparisonContext';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const motors = [
  {
    id: 'synthetic-short-99',
    model: '9.9MH FourStroke',
    model_display: '9.9MH FourStroke',
    model_number: 'SYNTH-99-MH',
    horsepower: 9.9,
    msrp: 1000,
    dealer_price: 900,
    availability: 'Available',
    in_stock: true,
    year: 2026,
    motor_type: 'FourStroke',
    features: [],
    images: [],
  },
  {
    id: 'synthetic-xl-115',
    model: '115EXLPT FourStroke',
    model_display: '115EXLPT FourStroke',
    model_number: 'SYNTH-115-EXLPT',
    horsepower: 115,
    msrp: 2000,
    dealer_price: 1800,
    availability: 'Available',
    in_stock: false,
    year: 2026,
    motor_type: 'FourStroke',
    features: [],
    images: [],
  },
];

function queryResult(table: string) {
  const data = table === 'motor_models' ? motors : [];
  const result = { data, error: null };
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  for (const method of ['select', 'order', 'eq', 'or', 'in', 'limit', 'neq', 'gte', 'lte', 'filter']) {
    builder[method] = chain;
  }
  builder.then = (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => queryResult(table),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => undefined,
  },
}));

vi.mock('@/components/chat/GlobalAIChat', () => ({
  useAIChat: () => ({
    openChat: () => undefined,
    closeChat: () => undefined,
    isOpen: false,
  }),
}));

class IntersectionObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
}

if (typeof window.IntersectionObserver !== 'function') {
  window.IntersectionObserver = IntersectionObserverPolyfill as unknown as typeof IntersectionObserver;
}

import MotorSelectionPage from '../MotorSelectionPage';

function renderSelection(search: string) {
  return render(
    <HelmetProvider>
    <MemoryRouter initialEntries={[`/quote/motor-selection?${search}`]}>
      <AuthProvider>
        <QuoteProvider>
          <MotorComparisonProvider>
            <TooltipProvider>
              <MotorSelectionPage />
            </TooltipProvider>
          </MotorComparisonProvider>
        </QuoteProvider>
      </AuthProvider>
    </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('MotorSelectionPage shaft filter', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('excludes 115EXLPT from Short and includes it in XL', async () => {
    const { unmount } = renderSelection('shaft=short');

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('1 motor matches');
    });
    expect(screen.getByText('Filtered by: short shaft')).toBeInTheDocument();
    expect(screen.getByText('9.9 MH FourStroke')).toBeInTheDocument();
    expect(screen.queryByText('115 EXLPT FourStroke')).not.toBeInTheDocument();

    unmount();
    renderSelection('shaft=xl');

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('1 motor matches');
    });
    expect(screen.getByText('Filtered by: xl shaft')).toBeInTheDocument();
    expect(screen.getByText('115 EXLPT FourStroke')).toBeInTheDocument();
    expect(screen.queryByText('9.9 MH FourStroke')).not.toBeInTheDocument();
  });
});
