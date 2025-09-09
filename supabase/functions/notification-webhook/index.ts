import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    
    const messageSid = params.get('MessageSid')
    const messageStatus = params.get('MessageStatus')
    const to = params.get('To')
    const errorCode = params.get('ErrorCode')
    const errorMessage = params.get('ErrorMessage')

    console.log('Received Twilio webhook:', {
      messageSid,
      messageStatus,
      to,
      errorCode,
      errorMessage
    })

    if (!messageSid || !messageStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required webhook data' }),
        { status: 400, headers: corsHeaders }
      )
    }

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