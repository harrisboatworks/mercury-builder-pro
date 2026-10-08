const VOICE_KEY = 'voice_session_id';
const LEGACY_KEY = 'chat_session_id';
const VOICE_ID = /^voice_[a-f0-9]{32}$/;

export function getOrCreateVoiceSessionId(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): string {
  const current = storage.getItem(VOICE_KEY);
  if (current && VOICE_ID.test(current)) return current;
  const legacy = storage.getItem(LEGACY_KEY);
  const bytes = new Uint8Array(16);
  let id: string;
  if (legacy && VOICE_ID.test(legacy)) {
    id = legacy;
  } else {
    crypto.getRandomValues(bytes);
    id = `voice_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
  }
  storage.setItem(VOICE_KEY, id);
  return id;
}
