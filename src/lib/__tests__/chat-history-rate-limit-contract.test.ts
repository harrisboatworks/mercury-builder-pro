import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/chat-history/index.ts', 'utf8');

describe('chat-history anonymous rate-limit contract', () => {
  it('classifies every mutating action as a write', () => {
    const writeActions = source.match(/const WRITE_ACTIONS = new Set\(\[([^\]]+)]\)/)?.[1] ?? '';

    for (const action of ['save_message', 'ensure', 'reaction', 'clear']) {
      expect(writeActions).toContain(`'${action}'`);
    }
    expect(writeActions).not.toContain("'history'");
    expect(source).toContain('const isWrite = WRITE_ACTIONS.has(action)');
  });

  it('limits reads and writes before the chat-history admin client is created', () => {
    const rateLimitAt = source.indexOf('const allowed = await checkRateLimit');
    const adminClientAt = source.indexOf('const adminClient = createClient');

    expect(rateLimitAt).toBeGreaterThan(-1);
    expect(adminClientAt).toBeGreaterThan(rateLimitAt);
    expect(source).toContain("action: isWrite ? 'chat_history_write' : 'chat_history_read'");
    expect(source).toContain('maxAttempts: isWrite ? 60 : 120');
    expect(source).toContain('windowMinutes: 10');
    expect(source).not.toContain('failClosed: true');
    expect(source).toContain('if (!allowed) return rateLimitedResponse(corsHeaders, 60)');
  });
});
