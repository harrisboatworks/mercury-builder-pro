import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";
import {
  handleNotificationWebhook,
  notificationWebhookCorsHeaders,
} from "../_shared/notification-webhook-handler.ts";
import {
  httpStatusForTwilioStatusApplyResult,
  isTwilioMessageSid,
  isTwilioMessageStatus,
  parseSmsLogIdFromRequestUrl,
} from "../_shared/twilio-status.ts";
import { applyTwilioStatusToSmsLog } from "../_shared/twilio-status-store.ts";

const corsHeaders = notificationWebhookCorsHeaders;

// Twilio webhook validation schema
const twilioWebhookSchema = z.object({
  MessageSid: z.string().min(1).max(100),
  MessageStatus: z.string().min(1).max(50),
  ErrorCode: z.string().max(20).optional(),
  ErrorMessage: z.string().max(500).optional(),
});

serve(async (req) => {
  try {
    return await handleNotificationWebhook(req, {
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      onVerified: async (rawBody) => {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Parse Twilio webhook data
        const params = new URLSearchParams(rawBody)
        
        // Extract and validate webhook data
        const rawData = {
          MessageSid: params.get('MessageSid') || undefined,
          MessageStatus: params.get('MessageStatus') || undefined,
          ErrorCode: params.get('ErrorCode') || undefined,
          ErrorMessage: params.get('ErrorMessage') || undefined,
        };

        const validationResult = twilioWebhookSchema.safeParse(rawData);
        if (!validationResult.success) {
          console.log('[notification-webhook] Validation failed:', validationResult.error.errors);
          return new Response(
            JSON.stringify({ error: 'Invalid webhook data', details: validationResult.error.errors }),
            { status: 400, headers: corsHeaders }
          )
        }

        const { MessageSid: messageSid, MessageStatus: messageStatus, ErrorCode: errorCode, ErrorMessage: errorMessage } = validationResult.data;

        if (!isTwilioMessageSid(messageSid) || !isTwilioMessageStatus(messageStatus)) {
          return new Response(
            JSON.stringify({ error: 'Invalid webhook data' }),
            { status: 400, headers: corsHeaders }
          )
        }

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
          errorCode: errorCode ?? null,
          errorMessage: errorMessage ?? null,
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
