import { describe, it, expect } from 'vitest';
import { getOrCreateVoiceSessionId } from './voiceSessionId';

function store(values: Record<string,string> = {}) {
  return { getItem: (key: string) => values[key] ?? null, setItem: (key: string, value: string) => { values[key] = value; }, values };
}
describe('voice identity without text identity changes', () => {
  it('preserves text chat while allocating a stable independent voice identity', () => {
    const chat = 'chat_' + 'a'.repeat(64);
    const storage = store({ chat_session_id: chat });
    const voice = getOrCreateVoiceSessionId(storage);
    expect(voice).toMatch(/^voice_[a-f0-9]{32}$/);
    expect(getOrCreateVoiceSessionId(storage)).toBe(voice);
    expect(storage.values.chat_session_id).toBe(chat);
  });
  it('migrates an existing legacy voice bearer without modifying the legacy key', () => {
    const legacy = 'voice_' + 'b'.repeat(32);
    const storage = store({ chat_session_id: legacy });
    expect(getOrCreateVoiceSessionId(storage)).toBe(legacy);
    expect(storage.values).toEqual({chat_session_id: legacy, voice_session_id: legacy});
  });
  it('replaces malformed dedicated IDs and does not inherit malformed legacy IDs', () => {
    const storage = store({ voice_session_id: 'bad', chat_session_id: 'voice_short' });
    expect(getOrCreateVoiceSessionId(storage)).toMatch(/^voice_[a-f0-9]{32}$/);
    expect(storage.values.chat_session_id).toBe('voice_short');
  });
  it('keeps a valid dedicated identity when text chat rotates', () => {
    const voice = 'voice_' + 'c'.repeat(32);
    expect(getOrCreateVoiceSessionId(store({voice_session_id: voice, chat_session_id: 'chat_' + 'd'.repeat(64)}))).toBe(voice);
  });
});
