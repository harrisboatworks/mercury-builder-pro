import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import {
  handleServiceRoleRequest,
  validateNotificationPayload,
} from "../_shared/send-notification-policy.ts";

const jsonResponse = (
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {},
) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', ...headers },
});

const processNotification = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  let rawPayload: unknown;
  try {
    rawPayload = await req.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const payload = validateNotificationPayload(rawPayload);
  if (!payload.ok) {
    return jsonResponse({ error: payload.error }, 400);
  }

  const { user_id, title, message, type, metadata } = payload.value;
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Get user preferences.
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (!profile) {
    return jsonResponse({ error: 'User profile not found' }, 404);
  }

  // Create the in-app notification for the trusted caller's chosen recipient.
  const { data: notification, error: notificationError } = await supabaseClient
    .from('notifications')
    .insert({
      user_id,
      title,
      message,
      type,
      metadata,
      channel: 'in_app',
    })
    .select()
    .single();

  if (notificationError) {
    console.error('Failed to create notification:', notificationError);
    return jsonResponse({ error: 'Failed to create notification' }, 500);
  }

  let smsResult = null;

  // Send SMS if enabled and within allowed hours.
  if (profile.notification_sms_enabled && profile.phone) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const quietStart = profile.quiet_hours_start;
    const quietEnd = profile.quiet_hours_end;

    const isQuietTime = quietStart <= quietEnd
      ? currentTime >= quietStart && currentTime <= quietEnd
      : currentTime >= quietStart || currentTime <= quietEnd;

    if (!isQuietTime && Deno.env.get('NOTIFICATIONS_SMS_ENABLED') === 'true') {
      try {
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

        if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

          const smsMessage = `${title ? `${title}: ` : ''}${message}`;
          const formData = new URLSearchParams();
          formData.append('From', twilioFromNumber);
          formData.append('To', profile.phone);
          formData.append('Body', smsMessage);

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
          });

          const twilioResult = await twilioResponse.json();

          // Log SMS attempt.
          await supabaseClient
            .from('sms_logs')
            .insert({
              to_phone: profile.phone,
              message: smsMessage,
              status: twilioResult.status || 'sent',
              error: twilioResult.error_message || null,
              notification_id: notification.id,
            });

          smsResult = {
            sent: twilioResponse.ok,
            status: twilioResult.status,
            sid: twilioResult.sid,
          };
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);

        // Log failed SMS attempt.
        await supabaseClient
          .from('sms_logs')
          .insert({
            to_phone: profile.phone,
            message: `${title ? `${title}: ` : ''}${message}`,
            status: 'failed',
            error: smsError instanceof Error ? smsError.message : 'Unknown SMS error',
            notification_id: notification.id,
          });
      }
    }
  }

  return jsonResponse({
    success: true,
    notification,
    sms: smsResult,
  }, 200);
};

serve((req) => handleServiceRoleRequest(
  req,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  async () => {
    try {
      return await processNotification(req);
    } catch (error) {
      console.error('Error in send-notification:', error);
      return jsonResponse({ error: 'Failed to send notification' }, 500);
    }
  },
));
