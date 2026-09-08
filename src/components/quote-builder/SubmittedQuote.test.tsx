import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SubmittedQuote from './SubmittedQuote';
import {
  SUBMITTED_QUOTE_CAD,
  exactSubmittedConsultationQuote,
  roundedSubmittedConsultationQuote,
} from '@/test/consultation-submitted-quote.fixtures';

describe('SubmittedQuote', () => {
  it('renders the stored 150HP receipt and never live calculator defaults', () => {
    const quote = exactSubmittedConsultationQuote();
    render(<SubmittedQuote quote={quote} />);

    expect(screen.getByRole('heading', { name: 'Submitted quote HBW-150193' })).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Mercury 150 FourStroke')).toBeInTheDocument();
    expect(screen.getByText('150 HP · 2026')).toBeInTheDocument();
    expect(screen.getByText('Motor MSRP')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(19000))).toBeInTheDocument();
    expect(screen.getByText('Motor price')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(18000))).toBeInTheDocument();
    expect(screen.getByText('Propeller: Use Existing')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(0))).toBeInTheDocument();
    expect(screen.getByText('Stainless steering kit')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(600))).toBeInTheDocument();
    expect(screen.getByText('Trade-in credit')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(-2500))).toBeInTheDocument();
    expect(screen.getByText('2018 Mercury 90 ELPT')).toBeInTheDocument();
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(16100))).toBeInTheDocument();
    expect(screen.getByText('HST (13%)')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(2093))).toBeInTheDocument();
    expect(screen.getByText('Total cash price')).toBeInTheDocument();
    expect(screen.getByText('Total cash price').parentElement).toHaveTextContent(SUBMITTED_QUOTE_CAD(18193));
    expect(screen.getByText('Keep the existing gauges.')).toBeInTheDocument();
    expect(screen.getByText('These are the prices recorded when this quote was submitted.')).toBeInTheDocument();

    expect(screen.getByText('Monthly payment')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(329))).toBeInTheDocument();
    expect(screen.getByText('5.99% APR · 60 months amortization · 60 months term')).toBeInTheDocument();
    expect(screen.queryByText('Quote rounding')).not.toBeInTheDocument();
    expect(screen.queryByText('7.99% APR')).not.toBeInTheDocument();
    expect(screen.queryByText(/48 months/)).not.toBeInTheDocument();
  });

  it('shows stored quote rounding instead of recomputing a live total', () => {
    const quote = roundedSubmittedConsultationQuote();
    const rounding = quote.pricing.totalPrice
      - Math.round((quote.pricing.subtotal + quote.pricing.hst) * 100) / 100;
    render(<SubmittedQuote quote={quote} />);

    expect(Math.abs(rounding)).toBeGreaterThanOrEqual(0.005);
    expect(screen.getByText('Quote rounding')).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(rounding))).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(16335))).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(2123.55))).toBeInTheDocument();
    expect(screen.getByText(SUBMITTED_QUOTE_CAD(18459))).toBeInTheDocument();
    expect(screen.queryByText(SUBMITTED_QUOTE_CAD(18458.55))).not.toBeInTheDocument();
  });
});
