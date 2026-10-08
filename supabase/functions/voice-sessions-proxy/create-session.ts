type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export interface VoiceSessionInsert {
  session_id: string;
  user_id: string | null;
  conversation_id: null;
  messages_exchanged: number;
  context: { page: string | null; startedAt: string };
  motor_context: { model: string; hp: number; price?: number } | null;
}

type Writer = (row: VoiceSessionInsert) => PromiseLike<{
  data: { id: string } | null;
  error: unknown;
}>;

/** The caller can supply public page/motor context, never ownership or chat links. */
export async function createVoiceSession(
  body: unknown,
  userId: string | null,
  write: Writer,
  now = new Date(),
) {
  const invalid = () => ({ status: 400, body: { error: "Invalid session context" } });
  if (!isRecord(body) || body.action !== "create" || typeof body.session_id !== "string" ||
    !/^voice_[a-f0-9]{32}$/.test(body.session_id)) return invalid();
  const allowed = ["action", "session_id", "page", "motor_context"];
  if (Object.keys(body).some((key) => !allowed.includes(key))) return invalid();
  if (body.page !== undefined && (typeof body.page !== "string" ||
    !body.page.startsWith("/") || body.page.startsWith("//") || body.page.length > 512)) return invalid();

  let motor: VoiceSessionInsert["motor_context"] = null;
  if (body.motor_context !== undefined && body.motor_context !== null) {
    const value = body.motor_context;
    if (!isRecord(value) || Object.keys(value).some((key) => !["model", "hp", "price"].includes(key)) ||
      typeof value.model !== "string" || !value.model.trim() || value.model.length > 200 ||
      typeof value.hp !== "number" || !Number.isFinite(value.hp) || value.hp <= 0 || value.hp > 600 ||
      (value.price !== undefined && (typeof value.price !== "number" ||
        !Number.isFinite(value.price) || value.price < 0 || value.price > 1_000_000))) return invalid();
    motor = { model: value.model.trim(), hp: value.hp };
    if (typeof value.price === "number") motor.price = value.price;
  }

  const { data, error } = await write({
    session_id: body.session_id,
    user_id: userId,
    conversation_id: null,
    messages_exchanged: 0,
    context: { page: typeof body.page === "string" ? body.page : null, startedAt: now.toISOString() },
    motor_context: motor,
  });
  if (error || !data?.id) return { status: 500, body: { error: "Failed to create session" } };
  return { status: 200, body: { id: data.id } };
}
