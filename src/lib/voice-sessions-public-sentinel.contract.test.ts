import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPublicVoiceSession,
  buildPublicVoiceSessionsResponse,
} from '../../supabase/functions/voice-sessions-proxy/public-sessions';

/**
 * Top-level keys an anonymous voice_ session bearer may receive per list row.
 *
 * Intentional strictness: widening this allowlist should require editing
 * this test so a human decides whether the new key is public.
 *
 * Derived from src/hooks/useVoiceSessionPersistence.ts (started_at,
 * duration_seconds, messages_exchanged, summary, motor_context.model) and
 * src/hooks/useCrossChannelContext.ts (summary, motor_context, started_at,
 * messages_exchanged).
 */
const PUBLIC_VOICE_SESSION_KEYS = [
  'started_at',
  'duration_seconds',
  'messages_exchanged',
  'summary',
  'motor_context',
] as const;

/**
 * motor_context keys copyPrimitives actually keeps. The write-shape in
 * useVoiceSessionPersistence is { model, hp, price? }; list readers only
 * use model. hp/price stay as the closed stored contract.
 */
const PUBLIC_MOTOR_CONTEXT_KEYS = ['model', 'hp', 'price'] as const;

const SENTINEL = {
  email: 'LEAK-caller-email@example.com',
  phone: 'LEAK-caller-phone-5550199',
  notes: 'LEAK-internal-notes',
  dealer: 'LEAK-dealer-cost',
  userId: 'LEAK-user-id',
  sessionId: 'voice_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  conversationId: 'LEAK-conversation-id',
  page: 'LEAK-context-page',
  serial: 'LEAK-serial-MOTOR',
};

const SENTINEL_VALUES = Object.values(SENTINEL);

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value === null || typeof value !== 'object') return keys;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

function leakyVoiceSessionRow() {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    session_id: SENTINEL.sessionId,
    user_id: SENTINEL.userId,
    conversation_id: SENTINEL.conversationId,
    started_at: '2026-09-01T12:00:00.000Z',
    ended_at: '2026-09-01T12:10:00.000Z',
    duration_seconds: 600,
    messages_exchanged: 8,
    summary: 'Discussed a 150 FourStroke',
    end_reason: 'user_ended',
    created_at: '2026-09-01T12:00:00.000Z',
    updated_at: '2026-09-01T12:10:00.000Z',
    caller_phone: SENTINEL.phone,
    caller_email: SENTINEL.email,
    internal_notes: SENTINEL.notes,
    dealer_cost: SENTINEL.dealer,
    context: {
      page: SENTINEL.page,
      startedAt: '2026-09-01T12:00:00.000Z',
      caller_email: SENTINEL.email,
      caller_phone: SENTINEL.phone,
    },
    motor_context: {
      model: 'Mercury 150 FourStroke',
      hp: 150,
      price: 18000,
      serialNumber: SENTINEL.serial,
      caller_email: SENTINEL.email,
      caller_phone: SENTINEL.phone,
      internal_notes: SENTINEL.notes,
      dealer_cost: SENTINEL.dealer,
    },
    unknownFutureField: { secret: SENTINEL.notes },
  };
}

function assertNoSentinels(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const sentinel of SENTINEL_VALUES) {
    expect(serialized).not.toContain(sentinel);
  }
}

describe('public voice session list sentinel contract', () => {
  it('strips identifying sentinels and pins the list-row allowlist', () => {
    const result = buildPublicVoiceSession(leakyVoiceSessionRow());

    expect(Object.keys(result).sort()).toEqual([...PUBLIC_VOICE_SESSION_KEYS].sort());
    expect(result.started_at).toBe('2026-09-01T12:00:00.000Z');
    expect(result.duration_seconds).toBe(600);
    expect(result.messages_exchanged).toBe(8);
    expect(result.summary).toBe('Discussed a 150 FourStroke');
    expect(result.motor_context).toEqual({
      model: 'Mercury 150 FourStroke',
      hp: 150,
      price: 18000,
    });
    expect(Object.keys(result.motor_context as object).sort()).toEqual(
      [...PUBLIC_MOTOR_CONTEXT_KEYS].sort(),
    );

    const publicKeys = collectKeys(result);
    for (const forbidden of [
      'id',
      'session_id',
      'user_id',
      'conversation_id',
      'ended_at',
      'end_reason',
      'created_at',
      'updated_at',
      'context',
      'caller_phone',
      'caller_email',
      'internal_notes',
      'dealer_cost',
      'unknownFutureField',
      'serialNumber',
    ]) {
      expect(publicKeys).not.toContain(forbidden);
    }

    assertNoSentinels(result);
  });

  it('keeps the HTTP wrapper on an exact key set and never serializes sentinels', () => {
    const response = buildPublicVoiceSessionsResponse([leakyVoiceSessionRow()]);

    expect(Object.keys(response).sort()).toEqual(['sessions']);
    expect(response.sessions).toHaveLength(1);
    expect(Object.keys(response.sessions[0]).sort()).toEqual(
      [...PUBLIC_VOICE_SESSION_KEYS].sort(),
    );
    assertNoSentinels(response);
  });

  it('drops an empty or non-object motor_context rather than re-emitting the blob', () => {
    expect(buildPublicVoiceSession({
      started_at: '2026-09-01T12:00:00.000Z',
      motor_context: { serialNumber: SENTINEL.serial, dealer_cost: SENTINEL.dealer },
    })).not.toHaveProperty('motor_context');

    expect(buildPublicVoiceSession({
      started_at: '2026-09-01T12:00:00.000Z',
      motor_context: null,
    })).not.toHaveProperty('motor_context');
  });

  it('wires the edge list path to the allowlist and an explicit select', () => {
    const edgeSource = readFileSync(
      resolve(process.cwd(), 'supabase/functions/voice-sessions-proxy/index.ts'),
      'utf8',
    );

    expect(edgeSource).toContain('buildPublicVoiceSessionsResponse');
    expect(edgeSource).toContain(
      '.select("started_at, duration_seconds, messages_exchanged, summary, motor_context")',
    );
    expect(edgeSource).not.toContain('.select("*")');
  });
});
