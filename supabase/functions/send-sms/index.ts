import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  PUBLIC_CONSULTATION_SMS_UNAVAILABLE,
  assertPublicConsultationSmsAllowed,
  assertTokenSafeSmsLog,
  isTokenBearingSmsMessage,
} from "../_shared/consultation-sms-policy.ts";
import { ConsultationDocumentRequestError } from "../_shared/consultation-document-policy.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface SMSRequest {
  to: string;
  message: string;
  messageType: 'hot_lead' | 'quote_confirmation' | 'follow_up' | 'reminder' | 'manual' | 'saved_quote_alert' | 'chat_lead';
  customerName?: string;
  leadScore?: number;
  quoteAmount?: number;
  auditMessage?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authentication gate: require admin JWT or internal secret. This prevents
  // anonymous abuse of Twilio credit and outbound SMS to arbitrary recipients.
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio credentials');
    }

    const smsData: SMSRequest = await req.json();
    const tokenBearing = isTokenBearingSmsMessage(smsData.message);
    if (!tokenBearing) {
      console.log('SMS request accepted', { messageType: smsData.messageType });
    }

    if (!smsData.message || smsData.message.length > 1500) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid SMS message length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let logMessage: string;
    try {
      logMessage = assertTokenSafeSmsLog({
        message: smsData.message,
        auditMessage: smsData.auditMessage,
      });
    } catch (auditError) {
      const message = auditError instanceof ConsultationDocumentRequestError
        ? auditError.message
        : 'SMS audit message is required';
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ipAllowed = await checkRateLimit(req, {
      action: 'send_sms_ip',
      maxAttempts: 60,
      windowMinutes: 60,
      failClosed: tokenBearing,
    });
    if (!ipAllowed) return rateLimitedResponse(corsHeaders, 300);

    const recipientAllowed = await checkRateLimit(req, {
      identifier: String(smsData.to || 'unknown').replace(/\s+/g, ''),
      action: 'send_sms_recipient',
      maxAttempts: 6,
      windowMinutes: 60,
      failClosed: tokenBearing,
    });
    if (!recipientAllowed) return rateLimitedResponse(corsHeaders, 300);

    const adminPhone = Deno.env.get('ADMIN_PHONE') || '+19053766208';
    if (smsData.to === 'admin') {
      smsData.to = adminPhone;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(smsData.to.replace(/\D/g, ''))) {
      throw new Error('Invalid phone number format');
    }

    // Format phone number (ensure it starts with +1 for North American numbers)
    let formattedPhone = smsData.to.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    try {
      assertPublicConsultationSmsAllowed({
        to: formattedPhone,
        message: smsData.message,
        adminPhone,
      });
    } catch (smsPolicyError) {
      const message = smsPolicyError instanceof Error ? smsPolicyError.message : PUBLIC_CONSULTATION_SMS_UNAVAILABLE;
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: outbox, error: outboxError } = await supabase
      .from('sms_logs')
      .insert({
        to_phone: formattedPhone,
        message: logMessage,
        status: 'pending',
      })
      .select('id')
      .single();
    if (tokenBearing && (outboxError || !outbox?.id)) {
      return new Response(JSON.stringify({ success: false, error: 'SMS outbox unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);
    
    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', fromNumber);
    formData.append('Body', smsData.message);

    if (!tokenBearing) {
      console.log('Sending SMS via Twilio:', { to: formattedPhone, from: fromNumber });
    }

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', responseData);
      if (outbox?.id) {
        await supabase.from('sms_logs').update({
          status: 'failed',
          error: 'provider_error',
        }).eq('id', outbox.id);
      }
      throw new Error(`Twilio API error: ${responseData.message || 'Unknown error'}`);
    }

    if (!tokenBearing) {
      console.log('SMS sent successfully:', responseData.sid);
    }

    if (outbox?.id) {
      const { error: logError } = await supabase
        .from('sms_logs')
        .update({ status: 'sent' })
        .eq('id', outbox.id);
      if (logError) {
        console.error('Error logging SMS:', logError instanceof Error ? logError.name : 'unknown');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.sid,
        status: responseData.status,
        to: formattedPhone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-sms function:', error instanceof Error ? error.name : 'unknown');

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
