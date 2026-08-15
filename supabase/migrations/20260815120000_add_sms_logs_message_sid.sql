-- DRAFT ONLY. Do not apply from this PR.
-- notification-webhook targets sms_logs by Twilio MessageSid. The current
-- schema only has to_phone, which can update the wrong newest row.

ALTER TABLE public.sms_logs
  ADD COLUMN IF NOT EXISTS message_sid text;

CREATE UNIQUE INDEX IF NOT EXISTS sms_logs_message_sid_uidx
  ON public.sms_logs (message_sid)
  WHERE message_sid IS NOT NULL;

COMMENT ON COLUMN public.sms_logs.message_sid IS
  'Twilio MessageSid. Used by notification-webhook to update delivery status without matching on To.';
