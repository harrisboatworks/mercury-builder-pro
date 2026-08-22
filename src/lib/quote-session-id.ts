const QUOTE_SESSION_KEY = 'quote_activity_session_id';

let memoryQuoteSessionId: string | null = null;

function generateQuoteSessionId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `qa_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Shared quote-funnel session ID. The Supabase client sends the same value in
 * x-quote-session-id so the narrow soft-lead RPC can verify request binding.
 */
export function getOrCreateQuoteSessionId(): string {
  try {
    const stored = globalThis.localStorage?.getItem(QUOTE_SESSION_KEY);
    if (stored) return stored;

    const sessionId = memoryQuoteSessionId ?? generateQuoteSessionId();
    memoryQuoteSessionId = sessionId;
    globalThis.localStorage?.setItem(QUOTE_SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    memoryQuoteSessionId ??= generateQuoteSessionId();
    return memoryQuoteSessionId;
  }
}
