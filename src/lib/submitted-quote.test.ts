import { describe, expect, it } from 'vitest';

import { CONSULTATION_SAVED_QUOTE_SOURCE } from '../../supabase/functions/_shared/consultation-authoritative-quote.ts';
import { CONSULTATION_SUBMITTED_QUOTE_SOURCE, isConsultationSubmittedQuote } from '@/lib/submitted-quote';

describe('isConsultationSubmittedQuote', () => {
  it('only treats a top-level consultation source as a submitted receipt', () => {
    expect(CONSULTATION_SUBMITTED_QUOTE_SOURCE).toBe(CONSULTATION_SAVED_QUOTE_SOURCE);
    expect(isConsultationSubmittedQuote({ source: CONSULTATION_SUBMITTED_QUOTE_SOURCE })).toBe(true);
    expect(isConsultationSubmittedQuote({
      source: CONSULTATION_SUBMITTED_QUOTE_SOURCE,
      motor: { model: 'Mercury 150 FourStroke', hp: 150 },
      pdfSnapshot: { pricing: { totalCashPrice: 99999 } },
    })).toBe(true);
    expect(isConsultationSubmittedQuote({
      motor: { hp: 150 },
      pdfSnapshot: { source: CONSULTATION_SUBMITTED_QUOTE_SOURCE },
    })).toBe(false);
    expect(isConsultationSubmittedQuote({ source: 'saved' })).toBe(false);
    expect(isConsultationSubmittedQuote(null)).toBe(false);
    expect(isConsultationSubmittedQuote(['consultation-submit'])).toBe(false);
  });
});
