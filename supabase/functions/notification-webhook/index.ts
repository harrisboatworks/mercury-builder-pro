import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Twilio webhook validation schema
const twilioWebhookSchema = z.object({
  MessageSid: z.string().min(1).max(100),
  MessageStatus: z.string().min(1).max(50),
  To: z.string().max(50).optional(),
  ErrorCode: z.string().max(20).optional(),
  ErrorMessage: z.string().max(500).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse Twilio webhook data
    const body = await req.text()
    const params = new URLSearchParams(body)
    
    // Extract and validate webhook data
    const rawData = {
      MessageSid: params.get('MessageSid') || undefined,
      MessageStatus: params.get('MessageStatus') || undefined,
      To: params.get('To') || undefined,
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

    const { MessageSid: messageSid, MessageStatus: messageStatus, To: to, ErrorCode: errorCode, ErrorMessage: errorMessage } = validationResult.data;

    console.log('Received Twilio webhook:', {
      messageSid,
      messageStatus,
      to,
      errorCode,
      errorMessage
    })

    // Update SMS log status
    const { error } = await supabaseClient
      .from('sms_logs')
      .update({
        status: messageStatus,
        error: errorMessage || null
      })
      .eq('to_phone', to)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Failed to update SMS log:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update SMS status' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // If message failed, you could implement retry logic here
    if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      console.warn(`SMS delivery failed for ${to}: ${errorMessage}`)
      // Could trigger retry or alternative notification method
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in notification-webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})