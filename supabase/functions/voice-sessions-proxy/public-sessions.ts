type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isPrimitive = (value: unknown): value is string | number | boolean | null =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

const copyPrimitives = (source: JsonRecord, keys: readonly string[]): JsonRecord => {
  const target: JsonRecord = {};
  for (const key of keys) {
    const value = source[key];
    if (isPrimitive(value)) target[key] = value;
  }
  return target;
};

/**
 * Columns an anonymous voice_ session bearer may receive from `action: 'list'`.
 * Derived from the two src/ consumers — not from select('*').
 */
const SESSION_SCALAR_KEYS = [
  "started_at",
  "duration_seconds",
  "messages_exchanged",
  "summary",
] as const;

/**
 * motor_context is a closed write-shape from useVoiceSessionPersistence
 * ({ model, hp, price? }), not an open-ended blob. List readers only use
 * `model`; hp/price stay because they are the documented stored contract.
 */
const MOTOR_CONTEXT_KEYS = ["model", "hp", "price"] as const;

export function sanitizeMotorContext(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  const result = copyPrimitives(value, MOTOR_CONTEXT_KEYS);
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Build the only JSON shape that an unauthenticated voice_ session id may
 * receive from list. Unknown columns and nested motor_context keys fail closed.
 */
export function buildPublicVoiceSession(value: unknown): JsonRecord {
  if (!isRecord(value)) return {};
  const result = copyPrimitives(value, SESSION_SCALAR_KEYS);
  const motorContext = sanitizeMotorContext(value.motor_context);
  if (motorContext) result.motor_context = motorContext;
  return result;
}

export function buildPublicVoiceSessionsResponse(sessions: unknown) {
  const list = Array.isArray(sessions) ? sessions : [];
  return { sessions: list.map(buildPublicVoiceSession) };
}
