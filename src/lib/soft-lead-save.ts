import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const RETRY_DELAY_MS = 250;
const COORDINATOR_RECOVERY_DELAY_MS = 2_000;
const SAVED_QUOTE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const serialized = JSON.stringify(quoteState);
  if (serialized === undefined) {
    throw new TypeError('Soft-lead quote state must be JSON-serializable');
  }
  return serialized;
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
  let persistedIdentity: string | null = null;
  let drainPromise: Promise<void> | null = null;
  let recoveryAttemptedIdentity: string | null = null;

  const requestIdentity = ({ sessionId, snapshotKey }: SoftLeadSaveRequest) =>
    JSON.stringify([sessionId, snapshotKey]);

  const drain = async () => {
    while (desired && requestIdentity(desired) !== persistedIdentity) {
      const request = desired;
      const identity = requestIdentity(request);
      try {
        await persist({
          sessionId: request.sessionId,
          quoteState: request.quoteState,
        });
        persistedIdentity = identity;
        recoveryAttemptedIdentity = null;
      } catch (error) {
        // A network failure can be ambiguous: the RPC may have committed even
        // though the response was lost. Treat completion as unknown. If the
        // desired state changed while this request was in flight, immediately
        // reconcile that newer state; otherwise make one delayed recovery.
        persistedIdentity = null;
        onError(error);
        if (desired && requestIdentity(desired) !== identity) {
          recoveryAttemptedIdentity = null;
          continue;
        }

        // The lower-level writer already retries once. Make one additional,
        // delayed idempotent reconciliation for an unchanged desired state so
        // a transient outage does not require another UI change to recover.
        if (recoveryAttemptedIdentity === identity) {
          desired = null;
          return;
        }
        recoveryAttemptedIdentity = identity;
        await new Promise((resolve) => setTimeout(resolve, COORDINATOR_RECOVERY_DELAY_MS));
      }
    }

    // Retain only the identity needed for deduplication, not the full quote.
    desired = null;
  };

  return {
    enqueue(request: SoftLeadSaveRequest): Promise<void> {
      desired = request;
      if (!drainPromise) {
        recoveryAttemptedIdentity = null;
        drainPromise = drain().finally(() => {
          drainPromise = null;
        });
      }
      return drainPromise;
    },
  };
}

// Keep one coordinator for the browser session so a pending write remains in
// the same ordered queue when the summary page unmounts and mounts again.
export const softLeadSaveCoordinator = createSoftLeadSaveCoordinator({
  onError: (error) => console.warn('Soft-lead save failed after retry:', error),
});

/**
 * Persist the latest anonymous quote snapshot through the atomic database RPC.
 * One bounded retry keeps background analytics from creating an unbounded
 * request loop or interfering with the customer-facing quote flow.
 */
export async function persistSoftLeadQuote({
  sessionId,
  quoteState,
}: PersistSoftLeadQuoteInput): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase
      .rpc('upsert_soft_lead_quote', {
        p_quote_state: quoteState as Json,
        p_session_id: sessionId,
      })
      // Keep this capability header on the one PostgREST call that consumes
      // it. A global Supabase header would also reach every Edge Function and
      // expand their CORS allowlists unnecessarily.
      .setHeader('x-quote-session-id', sessionId);

    if (!error && typeof data === 'string' && SAVED_QUOTE_ID_PATTERN.test(data)) {
      return data;
    }

    lastError = error ?? new Error('Soft-lead upsert returned no valid row ID');
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw lastError;
}
