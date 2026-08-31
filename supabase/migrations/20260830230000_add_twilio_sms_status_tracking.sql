-- Schema only. Deploy before the send-sms and notification-webhook functions.
-- This migration is intentionally not applied by the PR validation workflow.

ALTER TABLE public.sms_logs
  ADD COLUMN IF NOT EXISTS message_sid text,
  ADD COLUMN IF NOT EXISTS error_code text;

CREATE UNIQUE INDEX IF NOT EXISTS sms_logs_message_sid_uidx
  ON public.sms_logs (message_sid)
  WHERE message_sid IS NOT NULL;

COMMENT ON COLUMN public.sms_logs.message_sid IS
  'Twilio MessageSid used to correlate delivery status callbacks.';

COMMENT ON COLUMN public.sms_logs.error_code IS
  'Latest Twilio ErrorCode received for the message, retained separately from the human-readable error.';
