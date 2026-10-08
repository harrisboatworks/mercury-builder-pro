import { describe, it, expect, vi } from 'vitest';
import { createVoiceSession } from '../../supabase/functions/voice-sessions-proxy/create-session';
const session_id = 'voice_' + 'a'.repeat(32);
const id = '11111111-1111-4111-8111-111111111111';
const input = { action: 'create', session_id, page: '/quote/motor-selection', motor_context: { model: '90 ELPT FourStroke', hp: 90, price: 12500 } };

describe('voice session create boundary', () => {
  it('creates an unowned anonymous session, returning only its id', async () => {
    const write = vi.fn().mockResolvedValue({data: {id, extra: 'private'}, error: null});
    const now = new Date('2026-10-07T12:00:00Z');
    const result = await createVoiceSession(input, null, write, now);
    expect(result).toEqual({status: 200, body: {id}});
    expect(write).toHaveBeenCalledWith({
      session_id, user_id: null, conversation_id: null, messages_exchanged: 0,
      context: {page: input.page, startedAt: now.toISOString()}, motor_context: input.motor_context,
    });
  });
  it('derives authenticated ownership from the verified actor', async () => {
    const write = vi.fn().mockResolvedValue({data: {id}, error: null});
    await createVoiceSession({action: 'create', session_id}, 'verified-owner', write);
    expect(write.mock.calls[0][0].user_id).toBe('verified-owner');
  });
  it.each([
    null, [], {session_id: 'chat_' + 'a'.repeat(64)},
    {...input, user_id: 'someone-else'}, {...input, conversation_id: id},
    {...input, context: {customer_email: 'synthetic@example.invalid'}},
    {...input, page: 'https://example.invalid'}, {...input, page: '//example.invalid'}, {...input, page: '/' + 'x'.repeat(512)},
    {...input, motor_context: {model: 'test', hp: -1}},
    {...input, motor_context: {model: 'test', hp: 90, customer_email: 'synthetic@example.invalid'}},
    {...input, motor_context: {model: 'test', hp: 90, price: Infinity}},
  ])('rejects malformed or privileged input without touching the database: %j', async body => {
    const write = vi.fn();
    expect((await createVoiceSession(body, null, write)).status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });
  it('does not return database errors or partial records on failure', async () => {
    const write = vi.fn().mockResolvedValue({data: null, error: {message: 'private database detail'}});
    expect(await createVoiceSession(input, null, write)).toEqual({status: 500, body: {error: 'Failed to create session'}});
  });
});
