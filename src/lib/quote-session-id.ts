const QUOTE_SESSION_KEY = 'quote_activity_session_id';
const QUOTE_SESSION_ID_PATTERN = /^qa_[0-9a-f]{24}$/;

let memoryQuoteSessionId: string | null = null;

function generateQuoteSessionId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `qa_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Shared quote-funnel session ID. The soft-lead writer sends the same value in
 * x-quote-session-id so the narrow RPC can verify request binding.
 */
export function getOrCreateQuoteSessionId(): string {
  try {
    const stored = globalThis.localStorage?.getItem(QUOTE_SESSION_KEY);
    if (stored && QUOTE_SESSION_ID_PATTERN.test(stored)) {
      memoryQuoteSessionId = stored;
      return stored;
    }

    const sessionId = memoryQuoteSessionId ?? generateQuoteSessionId();
    memoryQuoteSessionId = sessionId;
    globalThis.localStorage?.setItem(QUOTE_SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    memoryQuoteSessionId ??= generateQuoteSessionId();
    return memoryQuoteSessionId;
  }
}
