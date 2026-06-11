import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  motorModelId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  preferredChannel: 'email' | 'sms' | 'both';
  motorDetails: Record<string, any>;
  quoteConfig: Record<string, any>;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting: Check IP-based limits
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      _identifier: clientIP,
      _action: 'promo_subscribe',
      _max_attempts: 10,
      _window_minutes: 60
    });

    if (!allowed) {
      console.log(`[subscribe-promo-reminder] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SubscribeRequest = await req.json();
    console.log("[subscribe-promo-reminder] Received request:", JSON.stringify(body));

    const { 
      motorModelId, 
      customerEmail, 
      customerPhone, 
      customerName,
      preferredChannel, 
      motorDetails, 
      quoteConfig 
    } = body;

    // Validate contact info
    if (!customerEmail && !customerPhone) {
      return new Response(
        JSON.stringify({ error: "Email or phone number required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing subscription
    let existingQuery = supabase
      .from('promo_reminder_subscriptions')
      .select('id, is_active')
      .eq('is_active', true);

    if (motorModelId) {
      existingQuery = existingQuery.eq('motor_model_id', motorModelId);
    }

    if (customerEmail) {
      existingQuery = existingQuery.eq('customer_email', customerEmail);
    } else if (customerPhone) {
      existingQuery = existingQuery.eq('customer_phone', customerPhone);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      console.log("[subscribe-promo-reminder] Already subscribed:", existing.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Already subscribed",
          subscriptionId: existing.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create subscription
    const { data: subscription, error: insertError } = await supabase
      .from('promo_reminder_subscriptions')
      .insert({
        motor_model_id: motorModelId || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        customer_name: customerName || null,
        preferred_channel: preferredChannel,
        motor_details: motorDetails,
        quote_config: quoteConfig
      })
      .select()
      .single();

    if (insertError) {
      console.error("[subscribe-promo-reminder] Insert error:", insertError);
      throw insertError;
    }

    console.log("[subscribe-promo-reminder] Subscription created:", subscription.id);

    // Send confirmation email
    if (customerEmail && (preferredChannel === 'email' || preferredChannel === 'both')) {
      try {
        const motorName = motorDetails?.model || 'the motor you configured';
        const appUrl = Deno.env.get("APP_URL") || "https://www.mercuryrepower.ca";
        const unsubscribeUrl = `${appUrl}/unsubscribe/${subscription.unsubscribe_token}`;

        const { buildEmail, detailsCard, esc } = await import("../_shared/email-layout.ts");

        const body = `
          <p style="margin:0 0 14px 0;">${customerName ? `Hi ${esc(customerName)},` : "Hi there,"}</p>
          <p style="margin:0 0 14px 0;">You are on the list. When this motor goes on sale or a Mercury promotion becomes available, we will send you a note right away.</p>
          ${detailsCard([{ label: "Watching", value: esc(motorName) }])}
          <p style="margin:18px 0 0 0;font-size:13px;color:#6b7280;">No spam, no resold lists. Unsubscribe any time.</p>
        `;

        const html = buildEmail({
          preheader: `You are subscribed to ${motorName} promotion alerts.`,
          eyebrow: "Promotion alerts",
          heading: "You are on the list",
          bodyHtml: body,
          unsubscribeUrl,
        });

        await resend.emails.send({
          from: "Harris Boat Works <noreply@mercuryrepower.ca>",
          to: [customerEmail],
          replyTo: "info@harrisboatworks.ca",
          subject: `You are subscribed to ${motorName} promotions`,
          html,
        });
        console.log("[subscribe-promo-reminder] Confirmation email sent");
      } catch (emailError) {
        console.error("[subscribe-promo-reminder] Email error:", emailError);
        // Don't fail the subscription if email fails
      }
    }

    // Send confirmation SMS
    if (customerPhone && (preferredChannel === 'sms' || preferredChannel === 'both')) {
      try {
        const motorName = motorDetails?.model || 'your configured motor';
        await supabase.functions.invoke('send-sms', {
          body: {
            to: customerPhone,
            message: `Harris Boat Works: You're subscribed! We'll text you when ${motorName} goes on sale. Reply STOP to unsubscribe.`,
            type: 'promo_subscription'
          }
        });
        console.log("[subscribe-promo-reminder] Confirmation SMS sent");
      } catch (smsError) {
        console.error("[subscribe-promo-reminder] SMS error:", smsError);
        // Don't fail the subscription if SMS fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscriptionId: subscription.id,
        message: "Successfully subscribed to promotions"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[subscribe-promo-reminder] Error:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
