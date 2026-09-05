export const CONSULTATION_SUBMITTED_QUOTE_SOURCE = 'consultation-submit';

export function isConsultationSubmittedQuote(
  quoteData: unknown,
): quoteData is Record<string, unknown> {
  return Boolean(
    quoteData
    && typeof quoteData === 'object'
    && !Array.isArray(quoteData)
    && (quoteData as { source?: unknown }).source === CONSULTATION_SUBMITTED_QUOTE_SOURCE,
  );
}
