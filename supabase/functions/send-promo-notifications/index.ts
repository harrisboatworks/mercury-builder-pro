import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const appUrl = Deno.env.get("APP_URL") || "https://quote.harrisboatworks.ca";

    console.log("[send-promo-notifications] Starting promo notification check");

    // Get active promotions
    const now = new Date().toISOString().split('T')[0];
    const { data: activePromos, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`);

    if (promoError) {
      console.error("[send-promo-notifications] Error fetching promotions:", promoError);
      throw promoError;
    }

    if (!activePromos || activePromos.length === 0) {
      console.log("[send-promo-notifications] No active promotions found");
      return new Response(
        JSON.stringify({ success: true, message: "No active promotions", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-promo-notifications] Found ${activePromos.length} active promotions`);

    // Get active subscriptions that haven't been notified in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: subscriptions, error: subError } = await supabase
      .from('promo_reminder_subscriptions')
      .select('*')
      .eq('is_active', true)
      .or(`notified_at.is.null,notified_at.lt.${sevenDaysAgo}`);

    if (subError) {
      console.error("[send-promo-notifications] Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-promo-notifications] No eligible subscriptions found");
      return new Response(
        JSON.stringify({ success: true, message: "No eligible subscriptions", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-promo-notifications] Found ${subscriptions.length} eligible subscriptions`);

    let notifiedCount = 0;
    const errors: string[] = [];

    // Check quiet hours (Eastern Time)
    const currentHour = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Toronto', 
      hour: 'numeric', 
      hour12: false 
    });
    const hour = parseInt(currentHour);
    const isQuietHours = hour >= 21 || hour < 8;

    if (isQuietHours) {
      console.log("[send-promo-notifications] Currently in quiet hours, skipping SMS notifications");
    }

    for (const subscription of subscriptions) {
      try {
        // Find matching promo for this motor
        const motorDetails = subscription.motor_details as Record<string, any>;
        const motorHp = motorDetails?.horsepower;
        const motorModel = motorDetails?.model || 'your configured motor';

        // Find best matching promo
        let matchingPromo = activePromos[0]; // Default to first promo

        // Calculate discount
        const discountText = matchingPromo.discount_percentage > 0 
          ? `${matchingPromo.discount_percentage}% off`
          : matchingPromo.discount_fixed_amount > 0 
            ? `$${matchingPromo.discount_fixed_amount} off`
            : 'special pricing';

        // Calculate expiry
        let expiresText = '';
        if (matchingPromo.end_date) {
          const endDate = new Date(matchingPromo.end_date);
          const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0 && daysLeft <= 14) {
            expiresText = ` Ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!`;
          }
        }

        const unsubscribeUrl = `${appUrl}/unsubscribe/${subscription.unsubscribe_token}`;

        // Send email notification
        if (subscription.customer_email && 
            (subscription.preferred_channel === 'email' || subscription.preferred_channel === 'both')) {
          try {
            await resend.emails.send({
              from: "Harris Boat Works <noreply@hbwsales.ca>",
              to: [subscription.customer_email],
              reply_to: "info@harrisboatworks.ca",
              subject: `🎉 ${motorModel} is now ${discountText}!`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1a1a1a; margin-bottom: 10px;">Great News${subscription.customer_name ? `, ${subscription.customer_name}` : ''}!</h1>
                    <p style="color: #666; font-size: 18px;">The motor you were watching is now on sale.</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #166534;">${motorModel}</h2>
                    <p style="margin: 0; font-size: 24px; color: #15803d; font-weight: bold;">${discountText}${expiresText}</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">${matchingPromo.name}</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">View Your Quote</a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; text-align: center;">
                    Questions? Call us at (905) 342-2153 or reply to this email.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Harris Boat Works | (905) 342-2153 | info@harrisboatworks.ca<br>
                    <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe from promotional emails</a>
                  </p>
                </body>
                </html>
              `
            });
            console.log(`[send-promo-notifications] Email sent to ${subscription.customer_email}`);
          } catch (emailErr) {
            console.error(`[send-promo-notifications] Email error for ${subscription.id}:`, emailErr);
            errors.push(`Email failed for ${subscription.id}`);
          }
        }

        // Send SMS notification (skip during quiet hours)
        if (!isQuietHours && 
            subscription.customer_phone && 
            (subscription.preferred_channel === 'sms' || subscription.preferred_channel === 'both')) {
          try {
            const smsMessage = `🎉 Great news${subscription.customer_name ? `, ${subscription.customer_name}` : ''}! The ${motorModel} is now ${discountText}.${expiresText}\n\nView your quote: ${appUrl}\n\n- Harris Boat Works\n\nReply STOP to unsubscribe`;
            
            await supabase.functions.invoke('send-sms', {
              body: {
                to: subscription.customer_phone,
                message: smsMessage,
                type: 'promo_active'
              }
            });
            console.log(`[send-promo-notifications] SMS sent to ${subscription.customer_phone}`);
          } catch (smsErr) {
            console.error(`[send-promo-notifications] SMS error for ${subscription.id}:`, smsErr);
            errors.push(`SMS failed for ${subscription.id}`);
          }
        }

        // Update notified_at timestamp
        await supabase
          .from('promo_reminder_subscriptions')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', subscription.id);

        notifiedCount++;
      } catch (err) {
        console.error(`[send-promo-notifications] Error processing subscription ${subscription.id}:`, err);
        errors.push(`Processing failed for ${subscription.id}`);
      }
    }

    console.log(`[send-promo-notifications] Completed. Notified: ${notifiedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: notifiedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-promo-notifications] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
