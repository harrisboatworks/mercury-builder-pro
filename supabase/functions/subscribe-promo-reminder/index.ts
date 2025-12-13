import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
        const appUrl = Deno.env.get("APP_URL") || "https://quote.harrisboatworks.ca";
        const unsubscribeUrl = `${appUrl}/unsubscribe/${subscription.unsubscribe_token}`;

        await resend.emails.send({
          from: "Harris Boat Works <noreply@hbwsales.ca>",
          to: [customerEmail],
          reply_to: "info@harrisboatworks.ca",
          subject: `You're subscribed to ${motorName} promotions`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a1a1a; margin-bottom: 10px;">You're All Set!</h1>
                <p style="color: #666; font-size: 16px;">We'll notify you when promotions are available.</p>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1a1a1a;">Motor You're Watching:</h2>
                <p style="margin: 0; font-size: 16px; color: #333; font-weight: 500;">${motorName}</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                When this motor goes on sale or a special promotion becomes available, 
                we'll send you an email right away so you don't miss out.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Harris Boat Works | (905) 342-2153 | info@harrisboatworks.ca<br>
                <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
              </p>
            </body>
            </html>
          `
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
