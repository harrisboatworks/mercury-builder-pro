import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

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

    const { user_id, title, message, type = 'info', metadata = {} } = await req.json()

    if (!user_id || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id and message are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user preferences
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Create in-app notification
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        metadata,
        channel: 'in_app'
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Failed to create notification:', notificationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: corsHeaders }
      )
    }

    let smsResult = null

    // Send SMS if enabled and within allowed hours
    if (profile.notification_sms_enabled && profile.phone) {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      const quietStart = profile.quiet_hours_start
      const quietEnd = profile.quiet_hours_end
      
      const isQuietTime = quietStart <= quietEnd 
        ? currentTime >= quietStart && currentTime <= quietEnd
        : currentTime >= quietStart || currentTime <= quietEnd

      if (!isQuietTime && Deno.env.get('NOTIFICATIONS_SMS_ENABLED') === 'true') {
        try {
          const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
          const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
          const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER')

          if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
            
            const formData = new URLSearchParams()
            formData.append('From', twilioFromNumber)
            formData.append('To', profile.phone)
            formData.append('Body', `${title ? title + ': ' : ''}${message}`)

            const twilioResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            })

            const twilioResult = await twilioResponse.json()
            
            // Log SMS attempt
            await supabaseClient
              .from('sms_logs')
              .insert({
                to_phone: profile.phone,
                message: `${title ? title + ': ' : ''}${message}`,
                status: twilioResult.status || 'sent',
                error: twilioResult.error_message || null,
                notification_id: notification.id
              })

            smsResult = {
              sent: twilioResponse.ok,
              status: twilioResult.status,
              sid: twilioResult.sid
            }
          }
        } catch (smsError) {
          console.error('SMS sending failed:', smsError)
          
          // Log failed SMS attempt
          await supabaseClient
            .from('sms_logs')
            .insert({
              to_phone: profile.phone,
              message: `${title ? title + ': ' : ''}${message}`,
              status: 'failed',
              error: smsError.message,
              notification_id: notification.id
            })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification,
        sms: smsResult
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in send-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})