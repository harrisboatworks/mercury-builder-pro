import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const RETRY_DELAY_MS = 250;

export interface PersistSoftLeadQuoteInput {
  sessionId: string;
  quoteState: unknown;
}

export interface SoftLeadSaveRequest extends PersistSoftLeadQuoteInput {
  snapshotKey: string;
}

interface SoftLeadSaveCoordinatorOptions {
  persist?: (input: PersistSoftLeadQuoteInput) => Promise<string>;
  onError?: (error: unknown) => void;
}

/**
 * Use the same state that is written to the database as the client-side
 * idempotency key. A PDF snapshot keeps its original createdAt while pricing,
 * trade-in, accessories, payment choice, or notes can still change.
 */
export function buildSoftLeadSnapshotKey(quoteState: unknown): string {
  return JSON.stringify(quoteState);
}

/**
 * Serialize writes while continually reconciling toward the newest requested
 * state. This keeps A -> B -> A interactions from leaving B stored last just
 * because the second A arrived while B was still in flight.
 */
export function createSoftLeadSaveCoordinator({
  persist = persistSoftLeadQuote,
  onError = () => undefined,
}: SoftLeadSaveCoordinatorOptions = {}) {
  let desired: SoftLeadSaveRequest | null = null;
  let persistedKey: string | null = null;
  let drainPromise: Promise<void> | null = null;

  const drain = async () => {
    while (desired && desired.snapshotKey !== persistedKey) {
      const request = desired;
      try {
        await persist({
          sessionId: request.sessionId,
          quoteState: request.quoteState,
        });
        persistedKey = request.snapshotKey;
      } catch (error) {
        // A network failure can be ambiguous: the RPC may have committed even
        // though the response was lost. Treat completion as unknown. If the
        // desired state changed while this request was in flight, immediately
        // reconcile that newer state; otherwise wait for a future enqueue.
        persistedKey = null;
        onError(error);
        if (desired.snapshotKey === request.snapshotKey) return;
      }
    }
  };

  return {
    enqueue(request: SoftLeadSaveRequest): Promise<void> {
      desired = request;
      if (!drainPromise) {
        drainPromise = drain().finally(() => {
          drainPromise = null;
        });
      }
      return drainPromise;
    },
  };
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
