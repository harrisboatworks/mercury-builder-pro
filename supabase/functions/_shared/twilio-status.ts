/**
 * Twilio SMS delivery-status helpers.
 * Status names: https://www.twilio.com/docs/sms/api/message-resource#message-status-values
 *
 * Callback URLs are derived from SUPABASE_URL the same way
 * twilio-signature.ts signs inbound requests. TWILIO_WEBHOOK_URL is not used.
 */

import { resolveTwilioWebhookUrl } from "./twilio-signature.ts";

export const TWILIO_MESSAGE_STATUSES = [
  "accepted",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "partially_delivered",
  "delivered",
  "read",
  "canceled",
  "failed",
  "undelivered",
] as const;

export type TwilioMessageStatus = (typeof TWILIO_MESSAGE_STATUSES)[number];

const PRE_TERMINAL_STATUSES = [
  "pending",
  "accepted",
  "scheduled",
  "queued",
  "sending",
  "sent",
] as const;

const ALLOWED_CURRENT_STATUS: Readonly<
  Record<TwilioMessageStatus, readonly string[]>
> = {
  accepted: ["pending", "accepted"],
  scheduled: ["pending", "accepted", "scheduled"],
  queued: ["pending", "accepted", "scheduled", "queued"],
  sending: ["pending", "accepted", "scheduled", "queued", "sending"],
  sent: [...PRE_TERMINAL_STATUSES],
  partially_delivered: [...PRE_TERMINAL_STATUSES, "partially_delivered"],
  delivered: [
    ...PRE_TERMINAL_STATUSES,
    "partially_delivered",
    "delivered",
  ],
  read: [
    ...PRE_TERMINAL_STATUSES,
    "partially_delivered",
    "delivered",
    "read",
  ],
  canceled: [...PRE_TERMINAL_STATUSES, "canceled"],
  failed: [...PRE_TERMINAL_STATUSES, "failed"],
  undelivered: [...PRE_TERMINAL_STATUSES, "undelivered"],
};

const SMS_LOG_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MESSAGE_SID_PATTERN = /^SM[0-9a-f]{32}$/i;

export function isTwilioMessageStatus(
  value: string | null | undefined,
): value is TwilioMessageStatus {
  return TWILIO_MESSAGE_STATUSES.includes(value as TwilioMessageStatus);
}

export function isTwilioMessageSid(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && MESSAGE_SID_PATTERN.test(value);
}

export function allowedCurrentStatusesFor(
  incoming: TwilioMessageStatus,
): readonly string[] {
  return ALLOWED_CURRENT_STATUS[incoming];
}

export function canApplyTwilioStatus(
  current: string | null | undefined,
  incoming: TwilioMessageStatus,
): boolean {
  return current != null && allowedCurrentStatusesFor(incoming).includes(current);
}

export function isTwilioFailureStatus(status: TwilioMessageStatus): boolean {
  return status === "canceled" || status === "failed" || status === "undelivered";
}

export type TwilioStatusEvent = {
  smsLogId: string | null;
  messageSid: string;
  messageStatus: TwilioMessageStatus;
  errorCode: string | null;
  errorMessage: string | null;
};

export type TwilioStatusApplyResult =
  | { kind: "applied"; currentStatus: TwilioMessageStatus }
  | { kind: "stale"; currentStatus: string | null }
  | { kind: "not_found"; currentStatus: null }
  | { kind: "sid_conflict"; currentStatus: string | null };

export function parseSmsLogIdFromRequestUrl(
  requestUrl: string,
): string | null {
  try {
    const parsed = new URL(requestUrl);
    const values = parsed.searchParams.getAll("sms_log_id");
    if (values.length !== 1 || !SMS_LOG_ID_PATTERN.test(values[0])) return null;
    return values[0];
  } catch {
    return null;
  }
}

export function buildSmsStatusCallbackUrl(
  supabaseUrl: string | null | undefined,
  smsLogId: string,
): string | null {
  if (!SMS_LOG_ID_PATTERN.test(smsLogId)) return null;
  const callbackUrl = resolveTwilioWebhookUrl(
    supabaseUrl,
    `https://unused.invalid/?sms_log_id=${smsLogId}`,
  );
  // Twilio defaults to retrying connection failures only. Storage failures
  // return 5xx, so explicitly retry those and read timeouts as well. Twilio
  // strips this connection-override fragment before signing the callback.
  return callbackUrl ? `${callbackUrl}#rp=ct,rt,5xx&rc=2` : null;
}

export function httpStatusForTwilioStatusApplyResult(
  result: TwilioStatusApplyResult,
): 200 | 409 | 503 {
  if (result.kind === "not_found") return 503;
  if (result.kind === "sid_conflict") return 409;
  return 200;
}
