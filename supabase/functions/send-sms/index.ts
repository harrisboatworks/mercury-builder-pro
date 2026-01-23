import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  messageType: 'hot_lead' | 'quote_confirmation' | 'follow_up' | 'reminder' | 'manual';
  customerName?: string;
  leadScore?: number;
  quoteAmount?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    
    console.log('SMS request:', smsData);

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

    // Create Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);
    
    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', fromNumber);
    formData.append('Body', smsData.message);

    console.log('Sending SMS via Twilio:', { to: formattedPhone, from: fromNumber });

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
      throw new Error(`Twilio API error: ${responseData.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully:', responseData.sid);

    // Log SMS activity in database
    const { error: logError } = await supabase
      .from('sms_logs')
      .insert({
        to_phone: formattedPhone,
        message: smsData.message,
        status: 'sent',
        notification_id: responseData.sid,
      });

    if (logError) {
      console.error('Error logging SMS:', logError);
      // Don't fail the SMS if logging fails
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
    console.error('Error in send-sms function:', error);

    // Log failed SMS attempt
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase
        .from('sms_logs')
        .insert({
          to_phone: (await req.json().catch(() => ({})))?.to || 'unknown',
          message: (await req.json().catch(() => ({})))?.message || 'failed',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
    } catch (logError) {
      console.error('Error logging failed SMS:', logError);
    }

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