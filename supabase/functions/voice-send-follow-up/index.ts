import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const COMPANY_PHONE = "(905) 342-2153";
const SERVICE_URL = "hbw.wiki/service";

// Message templates
const MESSAGE_TEMPLATES = {
  quote_interest: (name: string, motor?: string, motorId?: string) => {
    const link = motorId ? `\n\nView details: quote.harrisboatworks.ca/quote?motor=${motorId}` : '';
    return `Hi ${name}! Thanks for chatting with Harris Boat Works.${motor ? ` Want a full quote for the ${motor}?` : ''}${link} Reply YES or call us at ${COMPANY_PHONE}.`;
  },
  
  inventory_alert: (name: string, motor?: string, motorId?: string) => {
    const link = motorId ? `\n\nView details: quote.harrisboatworks.ca/quote?motor=${motorId}` : '';
    return `Hi ${name}! ${motor ? `The ${motor} you asked about is in stock.` : 'We have motors in stock!'} Ready when you are!${link}\n\n— Harris Boat Works 📞 ${COMPANY_PHONE}`;
  },
  
  service_reminder: (name: string) => 
    `Hi ${name}! Ready to book your service? Visit ${SERVICE_URL} or call ${COMPANY_PHONE} — Harris Boat Works`,
  
  general: (name: string, note?: string, motorId?: string) => {
    const link = motorId ? `\n\nView details: quote.harrisboatworks.ca/quote?motor=${motorId}` : '';
    return `Hi ${name}! ${note || 'Thanks for your interest in Harris Boat Works.'}${link} 📞 ${COMPANY_PHONE}`;
  },
  
  comparison: (name: string, note?: string) => 
    `Hi ${name}! Here's your motor comparison: quote.harrisboatworks.ca/compare${note ? ` (${note})` : ''}\n\n— Harris Boat Works 📞 ${COMPANY_PHONE}`,
  
  promo_reminder: (name: string) => 
    `Hi ${name}! Quick reminder: the Mercury Get 7 promo ends March 31st. 7-year warranty + pick your bonus!\n\nDetails: quote.harrisboatworks.ca/promotions\n\n— Harris Boat Works 📞 ${COMPANY_PHONE}`,
};

// Format phone number to E.164
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

// Validate phone number format
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_name, customer_phone, message_type, motor_model, motor_id, custom_note } = await req.json();

    console.log("[voice-send-follow-up] Request received:", { 
      customer_name, 
      customer_phone, 
      message_type, 
      motor_model 
    });

    // Validate required fields
    if (!customer_name || !customer_phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Customer name and phone number are required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone format
    if (!isValidPhone(customer_phone)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid phone number format. Please provide a valid 10-digit phone number." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("[voice-send-follow-up] Missing Twilio credentials");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SMS service not configured" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const formattedPhone = formatPhoneNumber(customer_phone);

    // Rate limiting: Check if we've sent more than 2 SMS to this number today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('sms_logs')
      .select('*', { count: 'exact', head: true })
      .eq('to_phone', formattedPhone)
      .gte('created_at', today.toISOString());

    if (countError) {
      console.error("[voice-send-follow-up] Rate limit check error:", countError);
    }

    if (count && count >= 2) {
      console.log("[voice-send-follow-up] Rate limit exceeded for:", formattedPhone);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "We've already sent texts to this number today. Please try again tomorrow." 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate message based on template
    let message: string;
    const firstName = customer_name.split(' ')[0]; // Use first name for friendlier messages

    switch (message_type) {
      case 'quote_interest':
        message = MESSAGE_TEMPLATES.quote_interest(firstName, motor_model, motor_id);
        break;
      case 'inventory_alert':
        message = MESSAGE_TEMPLATES.inventory_alert(firstName, motor_model, motor_id);
        break;
      case 'service_reminder':
        message = MESSAGE_TEMPLATES.service_reminder(firstName);
        break;
      case 'comparison':
        message = MESSAGE_TEMPLATES.comparison(firstName, custom_note);
        break;
      case 'promo_reminder':
        message = MESSAGE_TEMPLATES.promo_reminder(firstName);
        break;
      case 'general':
      default:
        message = MESSAGE_TEMPLATES.general(firstName, custom_note, motor_id);
        break;
    }

    console.log("[voice-send-follow-up] Sending SMS:", { to: formattedPhone, message });

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("[voice-send-follow-up] Twilio error:", twilioResult);
      
      // Log failed attempt
      await supabase.from('sms_logs').insert({
        to_phone: formattedPhone,
        message: message,
        status: 'failed',
        error: twilioResult.message || 'Twilio error',
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send text message. Please try again." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[voice-send-follow-up] SMS sent successfully:", twilioResult.sid);

    // Log successful send
    await supabase.from('sms_logs').insert({
      to_phone: formattedPhone,
      message: message,
      status: 'sent',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Text sent to ${customer_name} at ${customer_phone}`,
        message_type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[voice-send-follow-up] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
