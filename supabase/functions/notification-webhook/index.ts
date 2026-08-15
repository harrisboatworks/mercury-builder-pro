import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { decideNotificationWebhook } from "../_shared/twilio-signature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    const decision = await decideNotificationWebhook({
      signature: req.headers.get('X-Twilio-Signature'),
      rawBody,
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      // Canonical URL only. Do not derive this from Host or X-Forwarded-Host.
      webhookUrl: Deno.env.get('TWILIO_WEBHOOK_URL'),
    })

    if (!decision.ok) {
      return new Response(
        JSON.stringify({ error: decision.error }),
        { status: decision.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseClient
      .from('sms_logs')
      .update({
        status: decision.messageStatus,
        error: decision.error,
      })
      .eq('message_sid', decision.messageSid)

    if (error) {
      console.error('Failed to update SMS log:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update SMS status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (decision.messageStatus === 'failed' || decision.messageStatus === 'undelivered') {
      console.warn(`SMS delivery failed for ${decision.messageSid}: ${decision.error}`)
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: decision.messageSid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in notification-webhook:', error)
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
