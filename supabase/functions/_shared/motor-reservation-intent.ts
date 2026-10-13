import {
  getMotorReservationDeposit,
  isVerifiedExpressMotorReservation,
} from "./deposit-policy.ts";
import {
  PUBLIC_SITE_URL,
  type PublicMotorRow,
} from "./public-motor-contract.ts";
import { resolveUcpPricedItem } from "./ucp-checkout-contract.ts";

export const MOTOR_RESERVATION_OPERATION = "motor_reservation" as const;

export const MOTOR_RESERVATION_TERMS_URL = `${PUBLIC_SITE_URL}/terms`;

export const MOTOR_RESERVATION_PREPARATION_SCOPE =
  "Deposit-only estimate. Buyer approval is required on the Harris Boat Works website. This preparation does not accept an order and does not reserve stock. Final motor sale, fitment, and pickup remain dealer-confirmed. Link is provided by Stripe Checkout when available. This preparation is not native Muse or UCP payment approval.";

export const MOTOR_RESERVATION_PREPARATION_FIELDS = [
  "operation",
  "session_id",
  "motor_id",
  "amount_cents",
  "currency",
  "payment_status",
  "status",
  "terms_url",
  "continue_url",
  "scope",
] as const;

export const MOTOR_RESERVATION_PREPARATION_OUTPUT_SCHEMA = {
  $id: "https://www.mercuryrepower.ca/schemas/motor-reservation-preparation.json",
  title: "Motor reservation preparation",
  description:
    "Custom Harris Boat Works result for a read-only CAD motor-reservation deposit estimate. This is not a UCP checkout, not a completed order, and not payment approval.",
  type: "object",
  additionalProperties: false,
  properties: {
    operation: { const: MOTOR_RESERVATION_OPERATION },
    session_id: { type: "string", description: "Existing UCP checkout session reference." },
    motor_id: { type: "string" },
    amount_cents: { type: "integer", minimum: 1 },
    currency: { const: "CAD" },
    payment_status: { const: "not_started" },
    status: { const: "requires_escalation" },
    terms_url: { type: "string" },
    continue_url: { type: "string", description: "Quote deep link with ucp, motor, and reservation=1." },
    scope: { const: MOTOR_RESERVATION_PREPARATION_SCOPE },
  },
  required: [...MOTOR_RESERVATION_PREPARATION_FIELDS],
} as const;

const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const MOTOR_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CALLER_KEYS = new Set(["id", "session_id", "operation", "meta"]);
const STORED_INSTRUMENT_KEYS = [
  "instrument",
  "payment",
  "payment_method",
  "shared_payment_token",
  "token",
] as const;

export type ServerLoadedReservationMotor = PublicMotorRow & {
  mercury_model_no?: string | null;
};

export type MotorReservationPreparation = {
  operation: typeof MOTOR_RESERVATION_OPERATION;
  session_id: string;
  motor_id: string;
  amount_cents: number;
  currency: "CAD";
  payment_status: "not_started";
  status: "requires_escalation";
  terms_url: string;
  continue_url: string;
  scope: string;
};

export type MotorReservationIntentFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
};

export type MotorReservationIntentSuccess = {
  ok: true;
  preparation: MotorReservationPreparation;
};

export type MotorReservationIntentResult =
  | MotorReservationIntentSuccess
  | MotorReservationIntentFailure;

export type MotorReservationPreparationIo = {
  loadSession: (sessionId: string) => Promise<unknown | null>;
  loadMotor: (motorId: string) => Promise<ServerLoadedReservationMotor | null>;
};

type CallerDecision = {
  ok: true;
  sessionId: string;
  operation: typeof MOTOR_RESERVATION_OPERATION;
};

type SessionDecision = {
  ok: true;
  sessionId: string;
  motorId: string;
  linePriceCents: number;
};

function failure(status: number, code: string, message: string): MotorReservationIntentFailure {
  return { ok: false, status, code, message };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function metaIsTransportOnly(meta: unknown): boolean {
  if (!isPlainObject(meta)) return false;
  const keys = Object.keys(meta);
  if (keys.length !== 1 || keys[0] !== "ucp-agent") return false;
  const agent = meta["ucp-agent"];
  if (!isPlainObject(agent)) return false;
  const agentKeys = Object.keys(agent);
  if (agentKeys.length === 0) return true;
  if (agentKeys.length !== 1 || agentKeys[0] !== "profile") return false;
  const profile = agent.profile;
  return typeof profile === "string" && profile.length > 0 && profile.length <= 2000 && !profile.includes("\u0000");
}

function readBoundedId(value: unknown): string | null | "invalid" {
  if (value === undefined) return null;
  if (typeof value !== "string" || !SESSION_ID_RE.test(value)) return "invalid";
  return value;
}

export function inspectReservationPreparationCaller(
  caller: unknown,
  routeSessionId?: string | null,
): CallerDecision | MotorReservationIntentFailure {
  if (!isPlainObject(caller)) {
    return failure(400, "invalid_request", "Reservation preparation accepts only a session reference and operation.");
  }
  if (Object.keys(caller).some((key) => !CALLER_KEYS.has(key))) {
    return failure(400, "invalid_request", "Reservation preparation accepts only a session reference and operation.");
  }
  if ("meta" in caller && !metaIsTransportOnly(caller.meta)) {
    return failure(400, "invalid_request", "Reservation preparation accepts only a session reference and operation.");
  }
  if (caller.operation !== MOTOR_RESERVATION_OPERATION) {
    return failure(400, "invalid_operation", "Reservation preparation requires operation motor_reservation.");
  }

  const routeId = routeSessionId == null || routeSessionId === ""
    ? null
    : readBoundedId(routeSessionId);
  if (routeId === "invalid") {
    return failure(400, "invalid_request", "Checkout session reference is invalid.");
  }
  const bodyId = readBoundedId(caller.id);
  const bodySessionId = readBoundedId(caller.session_id);
  if (bodyId === "invalid" || bodySessionId === "invalid") {
    return failure(400, "invalid_request", "Checkout session reference is invalid.");
  }
  if (bodyId && bodySessionId && bodyId !== bodySessionId) {
    return failure(400, "invalid_request", "Checkout session reference does not match.");
  }
  const callerId = bodyId || bodySessionId;
  if (callerId && routeId && callerId !== routeId) {
    return failure(400, "invalid_request", "Checkout session reference does not match.");
  }
  const sessionId = callerId || routeId;
  if (!sessionId) {
    return failure(400, "invalid_request", "Reservation preparation requires a checkout session reference.");
  }
  return { ok: true, sessionId, operation: MOTOR_RESERVATION_OPERATION };
}

function hasExpiryMessage(session: Record<string, unknown>): boolean {
  if (!Array.isArray(session.messages)) return false;
  return session.messages.some((message) => isPlainObject(message) && message.code === "session_expired");
}

function expiryState(expiresAt: unknown, now: Date): "missing" | "expired" | "active" {
  if (typeof expiresAt !== "string" || !expiresAt.trim()) return "missing";
  const time = Date.parse(expiresAt);
  if (!Number.isFinite(time)) return "missing";
  return time <= now.getTime() ? "expired" : "active";
}

export function assessPersistedReservationSession(
  persistedSession: unknown,
  sessionId: string,
  now = new Date(),
): SessionDecision | MotorReservationIntentFailure {
  if (!isPlainObject(persistedSession)) {
    return failure(400, "invalid_request", "Checkout session is missing.");
  }
  if (STORED_INSTRUMENT_KEYS.some((key) => key in persistedSession)) {
    return failure(400, "invalid_request", "Checkout session cannot be prepared.");
  }
  if (persistedSession.id !== sessionId) {
    return failure(400, "invalid_request", "Checkout session reference does not match.");
  }

  const status = persistedSession.status;
  if (status === "completed") {
    return failure(409, "session_terminal", "Checkout session is no longer active.");
  }
  if (status === "canceled") {
    return hasExpiryMessage(persistedSession)
      ? failure(409, "session_expired", "Checkout session is expired.")
      : failure(409, "session_terminal", "Checkout session is no longer active.");
  }
  const expiry = expiryState(persistedSession.expires_at, now);
  if (expiry !== "active") {
    return failure(409, "session_expired", "Checkout session is expired.");
  }
  if (status !== "requires_escalation") {
    return failure(409, "session_not_active", "Checkout session is not an active quote.");
  }
  if (persistedSession.currency !== "CAD") {
    return failure(400, "invalid_currency", "Reservation preparation requires CAD.");
  }

  // A mixed quote may contain one resolved motor plus rejected lines. Never
  // silently turn that partial cart into a one-motor reservation estimate.
  if (Array.isArray(persistedSession.messages) && persistedSession.messages.some(
    (message) => isPlainObject(message) &&
      (message.severity === "requires_buyer_input" || message.code === "special_order_only" ||
       message.code === "item_not_found" || message.code === "price_unavailable"),
  )) {
    return failure(409, "quote_incomplete", "Resolve all checkout line items before preparing a reservation.");
  }

  const lineItems = persistedSession.line_items;
  if (!Array.isArray(lineItems) || lineItems.length !== 1 || !isPlainObject(lineItems[0])) {
    return failure(400, "invalid_line_items", "Reservation preparation requires exactly one motor line.");
  }
  const line = lineItems[0];
  if (typeof line.quantity !== "number" || !Number.isInteger(line.quantity) || line.quantity !== 1) {
    return failure(400, "invalid_quantity", "Reservation preparation requires quantity 1.");
  }
  const item = isPlainObject(line.item) ? line.item : null;
  const motorId = item && typeof item.id === "string" ? item.id : "";
  if (!MOTOR_ID_RE.test(motorId)) {
    return failure(400, "invalid_line_items", "Reservation preparation requires exactly one motor line.");
  }
  if (!item || typeof item.price !== "number" || !Number.isSafeInteger(item.price) || item.price <= 0) {
    return failure(409, "stale_motor", "Checkout session does not match the current catalog motor.");
  }
  return { ok: true, sessionId, motorId, linePriceCents: item.price };
}

function catalogModelNumber(motor: ServerLoadedReservationMotor): string {
  if (typeof motor.mercury_model_no === "string" && motor.mercury_model_no) return motor.mercury_model_no;
  if (typeof motor.model_number === "string" && motor.model_number) return motor.model_number;
  return "";
}

export function reservationPreparationContinueUrl(sessionId: string, motorId: string): string {
  const params = new URLSearchParams();
  params.set("ucp", sessionId);
  params.set("motor", motorId);
  params.set("reservation", "1");
  return `${PUBLIC_SITE_URL}/quote/motor-selection?${params.toString()}`;
}

function derivePreparation(
  assessed: SessionDecision,
  serverLoadedMotor: ServerLoadedReservationMotor | null,
): MotorReservationIntentResult {
  if (!serverLoadedMotor || serverLoadedMotor.id !== assessed.motorId) {
    return failure(400, "motor_unavailable", "Motor is not available for reservation preparation.");
  }

  const horsepower = Number(serverLoadedMotor.horsepower);
  if (!Number.isFinite(horsepower) || horsepower <= 0) {
    return failure(400, "motor_unavailable", "Motor is not available for reservation preparation.");
  }

  const priced = resolveUcpPricedItem(serverLoadedMotor, 1);
  if (priced.problem) {
    if (priced.problem.code === "special_order_only") {
      return failure(400, "special_order_only", "Mercury Verado is special-order only and is not prepared as a public reservation deposit.");
    }
    if (priced.problem.code === "price_unavailable") {
      return failure(400, "price_unavailable", "Motor has no published finite public price.");
    }
    return failure(400, "motor_unavailable", "Motor is not available for reservation preparation.");
  }

  // Stock quantity is not an acceptance gate for quote sessions. Nothing here
  // claims an order was accepted or that stock was reserved.
  if (priced.cents !== assessed.linePriceCents) {
    return failure(409, "stale_motor", "Checkout session does not match the current catalog motor.");
  }

  const amountCents = getMotorReservationDeposit(
    horsepower,
    isVerifiedExpressMotorReservation({
      motorId: serverLoadedMotor.id,
      modelNumber: catalogModelNumber(serverLoadedMotor),
    }),
  ) * 100;
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents >= priced.cents) {
    return failure(400, "deposit_exceeds_merchandise", "Reservation deposit must be less than the motor merchandise total.");
  }

  const preparation: MotorReservationPreparation = {
    operation: MOTOR_RESERVATION_OPERATION,
    session_id: assessed.sessionId,
    motor_id: assessed.motorId,
    amount_cents: amountCents,
    currency: "CAD",
    payment_status: "not_started",
    status: "requires_escalation",
    terms_url: MOTOR_RESERVATION_TERMS_URL,
    continue_url: reservationPreparationContinueUrl(assessed.sessionId, assessed.motorId),
    scope: MOTOR_RESERVATION_PREPARATION_SCOPE,
  };
  return { ok: true, preparation };
}

export function prepareMotorReservationIntent(input: {
  persistedSession: unknown;
  serverLoadedMotor: ServerLoadedReservationMotor | null;
  caller: unknown;
  routeSessionId?: string | null;
  now?: Date;
}): MotorReservationIntentResult {
  const now = input.now ?? new Date();
  const callerDecision = inspectReservationPreparationCaller(input.caller, input.routeSessionId);
  if (callerDecision.ok === false) return callerDecision;
  const assessed = assessPersistedReservationSession(input.persistedSession, callerDecision.sessionId, now);
  if (assessed.ok === false) return assessed;
  return derivePreparation(assessed, input.serverLoadedMotor);
}

export async function runMotorReservationPreparation(input: {
  caller: unknown;
  routeSessionId?: string | null;
  io: MotorReservationPreparationIo;
  now?: Date;
}): Promise<MotorReservationIntentResult> {
  const now = input.now ?? new Date();
  const callerDecision = inspectReservationPreparationCaller(input.caller, input.routeSessionId);
  if (callerDecision.ok === false) return callerDecision;

  const persistedSession = await input.io.loadSession(callerDecision.sessionId);
  if (persistedSession == null) {
    return failure(404, "not_found", "No checkout session.");
  }
  const assessed = assessPersistedReservationSession(persistedSession, callerDecision.sessionId, now);
  if (assessed.ok === false) return assessed;

  const serverLoadedMotor = await input.io.loadMotor(assessed.motorId);
  return prepareMotorReservationIntent({
    persistedSession,
    serverLoadedMotor,
    caller: { id: callerDecision.sessionId, operation: MOTOR_RESERVATION_OPERATION },
    now,
  });
}
