export const TWILIO_MESSAGE_STATUSES = [
  'accepted',
  'scheduled',
  'queued',
  'sending',
  'sent',
  'partially_delivered',
  'delivered',
  'read',
  'canceled',
  'failed',
  'undelivered',
] as const;

export type TwilioMessageStatus = (typeof TWILIO_MESSAGE_STATUSES)[number];

const PRE_TERMINAL_STATUSES = [
  'pending',
  'accepted',
  'scheduled',
  'queued',
  'sending',
  'sent',
] as const;

const ALLOWED_CURRENT_STATUS: Readonly<
  Record<TwilioMessageStatus, readonly string[]>
> = {
  accepted: ['pending', 'accepted'],
  scheduled: ['pending', 'accepted', 'scheduled'],
  queued: ['pending', 'accepted', 'scheduled', 'queued'],
  sending: ['pending', 'accepted', 'scheduled', 'queued', 'sending'],
  sent: [...PRE_TERMINAL_STATUSES],
  partially_delivered: [...PRE_TERMINAL_STATUSES, 'partially_delivered'],
  delivered: [
    ...PRE_TERMINAL_STATUSES,
    'partially_delivered',
    'delivered',
  ],
  read: [
    ...PRE_TERMINAL_STATUSES,
    'partially_delivered',
    'delivered',
    'read',
  ],
  canceled: [...PRE_TERMINAL_STATUSES, 'canceled'],
  failed: [...PRE_TERMINAL_STATUSES, 'failed'],
  undelivered: [...PRE_TERMINAL_STATUSES, 'undelivered'],
};

export function isTwilioMessageStatus(
  value: string | null | undefined,
): value is TwilioMessageStatus {
  return TWILIO_MESSAGE_STATUSES.includes(value as TwilioMessageStatus);
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
  return status === 'canceled' || status === 'failed' || status === 'undelivered';
}

export type TwilioStatusEvent = {
  smsLogId: string | null;
  messageSid: string;
  messageStatus: TwilioMessageStatus;
  errorCode: string | null;
  errorMessage: string | null;
};

export type TwilioStatusApplyResult =
  | { kind: 'applied'; currentStatus: TwilioMessageStatus }
  | { kind: 'stale'; currentStatus: string | null }
  | { kind: 'not_found'; currentStatus: null }
  | { kind: 'sid_conflict'; currentStatus: string | null };
