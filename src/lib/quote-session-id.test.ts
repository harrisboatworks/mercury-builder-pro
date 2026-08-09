// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';

import { getOrCreateQuoteSessionId } from './quote-session-id';

describe('getOrCreateQuoteSessionId', () => {
  beforeEach(() => localStorage.clear());

  it('creates one persistent high-entropy quote session ID', () => {
    const first = getOrCreateQuoteSessionId();
    const second = getOrCreateQuoteSessionId();

    expect(first).toMatch(/^qa_[0-9a-f]{24}$/);
    expect(second).toBe(first);
    expect(localStorage.getItem('quote_activity_session_id')).toBe(first);
  });
});
