// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrCreateQuoteSessionId } from './quote-session-id';

describe('getOrCreateQuoteSessionId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('creates one persistent high-entropy quote session ID', () => {
    const first = getOrCreateQuoteSessionId();
    const second = getOrCreateQuoteSessionId();

    expect(first).toMatch(/^qa_[0-9a-f]{24}$/);
    expect(second).toBe(first);
    expect(localStorage.getItem('quote_activity_session_id')).toBe(first);
  });

  it('replaces a malformed persisted ID before it can reach the RPC', () => {
    localStorage.setItem('quote_activity_session_id', 'qa_fallback_legacy');

    const sessionId = getOrCreateQuoteSessionId();

    expect(sessionId).toMatch(/^qa_[0-9a-f]{24}$/);
    expect(localStorage.getItem('quote_activity_session_id')).toBe(sessionId);
  });

  it('keeps one high-entropy in-memory ID when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const first = getOrCreateQuoteSessionId();
    const second = getOrCreateQuoteSessionId();

    expect(first).toMatch(/^qa_[0-9a-f]{24}$/);
    expect(second).toBe(first);
  });
});
