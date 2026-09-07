import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SUBMITTED_QUOTE_CAD,
  exactSubmittedConsultationQuote,
  legacySavedQuote,
} from '@/test/consultation-submitted-quote.fixtures';
import { isPublicConsultationSubmittedQuote } from '@/lib/submitted-quote';
import { buildPublicQuoteData } from '../../../supabase/functions/get-shared-quote/public-quote';

const mocks = vi.hoisted(() => ({
  quoteId: '11111111-1111-4111-8111-111111111111',
  navigate: vi.fn(),
  dispatch: vi.fn(),
  toast: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ quoteId: mocks.quoteId }),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ dispatch: mocks.dispatch }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
  },
}));

import SavedQuotePage from './SavedQuotePage';

describe('SavedQuotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.quoteId = '11111111-1111-4111-8111-111111111111';
  });

  it('renders a consultation snapshot and never restores the live builder', async () => {
    const quote = buildPublicQuoteData(exactSubmittedConsultationQuote());
    expect(isPublicConsultationSubmittedQuote(quote)).toBe(true);
    expect(quote).not.toHaveProperty('source');
    expect(quote).not.toHaveProperty('quoteNumber');
    expect(quote).not.toHaveProperty('customer');
    expect(quote).not.toHaveProperty('accessories');
    expect(quote.pricing).not.toHaveProperty('totalPrice');
    expect(quote.tradeIn).not.toHaveProperty('value');
    mocks.invoke.mockResolvedValue({
      data: {
        quote_data: quote,
        customer_name: 'Ignored live name',
      },
      error: null,
    });

    render(<SavedQuotePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Submitted quote' })).toBeInTheDocument();
    });

    expect(mocks.invoke).toHaveBeenCalledWith('get-shared-quote', {
      body: { quoteId: mocks.quoteId },
    });
    expect(screen.getByText('Total cash price').parentElement).toHaveTextContent(SUBMITTED_QUOTE_CAD(18193));
    expect(screen.getByText('150 HP · 2026')).toBeInTheDocument();
    expect(screen.getByText('Stainless steering kit')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(-2500))).toBeInTheDocument();
    expect(screen.queryByText('HBW-150193')).not.toBeInTheDocument();
    expect(screen.queryByText('Alex Rivera')).not.toBeInTheDocument();
    expect(screen.queryByText('alex@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Ignored live name')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading your saved quote...')).not.toBeInTheDocument();
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalledWith('/quote/summary');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('still restores a legacy saved quote into the builder and opens summary', async () => {
    const quote = buildPublicQuoteData(legacySavedQuote());
    expect(isPublicConsultationSubmittedQuote(quote)).toBe(false);
    mocks.invoke.mockResolvedValue({
      data: {
        quote_data: quote,
        customer_name: 'Pat Boater',
        customer_notes: 'Call before pickup',
        is_admin_quote: false,
      },
      error: null,
    });

    render(<SavedQuotePage />);

    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'RESTORE_QUOTE',
        payload: expect.objectContaining({
          motor: quote.motor,
          customerName: 'Pat Boater',
          customerNotes: 'Call before pickup',
        }),
      });
    });
    expect(mocks.navigate).toHaveBeenCalledWith('/quote/summary');
    expect(screen.queryByText(/Submitted quote/)).not.toBeInTheDocument();
  });
});
