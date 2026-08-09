import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const RETRY_DELAY_MS = 250;

interface PersistSoftLeadQuoteInput {
  sessionId: string;
  quoteState: unknown;
}

/**
 * Persist the latest anonymous quote snapshot through the atomic database RPC.
 * One bounded retry covers transient network failures without letting analytics
 * persistence interfere with the customer-facing quote flow.
 */
export async function persistSoftLeadQuote({
  sessionId,
  quoteState,
}: PersistSoftLeadQuoteInput): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase.rpc('upsert_soft_lead_quote', {
      p_quote_state: quoteState as Json,
      p_session_id: sessionId,
    });

    if (!error && data) return data;

    lastError = error ?? new Error('Soft-lead upsert returned no row ID');
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw lastError;
}
