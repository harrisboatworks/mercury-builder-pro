import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import {
  handleNotificationWebhook,
  notificationWebhookCorsHeaders,
} from "../_shared/notification-webhook-handler.ts";
import { readNotificationWebhookFields } from "../_shared/twilio-signature.ts";
import {
  httpStatusForTwilioStatusApplyResult,
  isTwilioMessageSid,
  isTwilioMessageStatus,
  parseSmsLogIdFromRequestUrl,
} from "../_shared/twilio-status.ts";
import { applyTwilioStatusToSmsLog } from "../_shared/twilio-status-store.ts";

const corsHeaders = notificationWebhookCorsHeaders;

serve(async (req) => {
  try {
    return await handleNotificationWebhook(req, {
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      configuredWebhookUrl: Deno.env.get('TWILIO_WEBHOOK_URL'),
      // Invoked only after URL, body, and signature validation.
      onVerified: async (rawBody) => {
        const fields = readNotificationWebhookFields(rawBody);
        if (!fields.ok) {
          return new Response(
            JSON.stringify({ error: fields.error }),
            { status: fields.status, headers: corsHeaders }
          )
        }

        const { messageSid, messageStatus, errorCode, errorMessage } = fields;
        if (!isTwilioMessageSid(messageSid) || !isTwilioMessageStatus(messageStatus)) {
          return new Response(
            JSON.stringify({ error: 'Invalid webhook data' }),
            { status: 400, headers: corsHeaders }
          )
        }

        // Service-role client is created only after URL/body/signature/SID/status validation.
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Received Twilio webhook:', {
          messageSid,
          messageStatus,
          errorCode,
          errorMessage
        })

        const result = await applyTwilioStatusToSmsLog(supabaseClient, {
          smsLogId: parseSmsLogIdFromRequestUrl(req.url),
          messageSid,
          messageStatus,
          errorCode,
          errorMessage,
        });

        const status = httpStatusForTwilioStatusApplyResult(result);
        if (result.kind === 'not_found') {
          return new Response(
            JSON.stringify({ error: 'SMS log not found' }),
            { status, headers: corsHeaders }
          )
        }
        if (result.kind === 'sid_conflict') {
          return new Response(
            JSON.stringify({ error: 'MessageSid conflict' }),
            { status, headers: corsHeaders }
          )
        }

        return new Response(
          JSON.stringify({ success: true, applied: result.kind === 'applied' }),
          { status: 200, headers: corsHeaders }
        )
      },
    });
  } catch (error) {
    console.error('Error in notification-webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update SMS status' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
