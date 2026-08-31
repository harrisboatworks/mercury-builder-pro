import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.53.1';
import {
  allowedCurrentStatusesFor,
  type TwilioStatusApplyResult,
  type TwilioStatusEvent,
} from './twilio-status.ts';

type SmsLogRow = {
  id: string;
  status: string | null;
  message_sid: string | null;
};

/**
 * Applies a Twilio state transition with the status predicate in the UPDATE.
 * PostgreSQL therefore re-checks the predicate after concurrent row locks and
 * cannot regress a newer callback with an older delivery state.
 */
export async function applyTwilioStatusToSmsLog(
  client: SupabaseClient,
  event: TwilioStatusEvent,
): Promise<TwilioStatusApplyResult> {
  const values: Record<string, string> = {
    status: event.messageStatus,
    message_sid: event.messageSid,
  };
  if (event.errorCode !== null) values.error_code = event.errorCode;
  if (event.errorMessage !== null) values.error = event.errorMessage;

  let update = client
    .from('sms_logs')
    .update(values)
    .in('status', [...allowedCurrentStatusesFor(event.messageStatus)]);

  if (event.smsLogId) {
    update = update
      .eq('id', event.smsLogId)
      .or(`message_sid.is.null,message_sid.eq.${event.messageSid}`);
  } else {
    update = update.eq('message_sid', event.messageSid);
  }

  const { data: updatedRows, error: updateError } = await update
    .select('id,status');
  if (updateError) throw new Error('Failed to update SMS status');

  if (updatedRows && updatedRows.length > 0) {
    return { kind: 'applied', currentStatus: event.messageStatus };
  }

  let lookup = client
    .from('sms_logs')
    .select('id,status,message_sid');
  lookup = event.smsLogId
    ? lookup.eq('id', event.smsLogId)
    : lookup.eq('message_sid', event.messageSid);

  const { data: current, error: lookupError } = await lookup.maybeSingle();
  if (lookupError) throw new Error('Failed to read SMS status');
  if (!current) return { kind: 'not_found', currentStatus: null };

  const row = current as SmsLogRow;
  if (row.message_sid && row.message_sid !== event.messageSid) {
    return { kind: 'sid_conflict', currentStatus: row.status };
  }
  return { kind: 'stale', currentStatus: row.status };
}
