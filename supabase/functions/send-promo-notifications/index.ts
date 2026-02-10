import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";

    console.log("[send-promo-notifications] Starting promo notification check");

    // Get active promotions sorted by creation date (newest first)
    const now = new Date().toISOString().split('T')[0];
    const { data: activePromos, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false });

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

    // Get the NEWEST active promotion - this is the one we'll notify about
    const newestPromo = activePromos[0];
    console.log(`[send-promo-notifications] Newest active promo: ${newestPromo.name} (ID: ${newestPromo.id})`);

    // Get active subscriptions that HAVEN'T been notified about this specific promotion
    // They either have no last_notified_promo_id OR it's different from the newest promo
    const { data: subscriptions, error: subError } = await supabase
      .from('promo_reminder_subscriptions')
      .select('*')
      .eq('is_active', true)
      .or(`last_notified_promo_id.is.null,last_notified_promo_id.neq.${newestPromo.id}`);

    if (subError) {
      console.error("[send-promo-notifications] Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-promo-notifications] No subscribers need notification for current promo");
      return new Response(
        JSON.stringify({ success: true, message: "All subscribers already notified about current promo", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-promo-notifications] Found ${subscriptions.length} subscribers to notify about "${newestPromo.name}"`);

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
        const motorDetails = subscription.motor_details as Record<string, any>;
        const motorModel = motorDetails?.model || 'your configured motor';

        // Calculate discount text from the newest promo
        const discountText = newestPromo.discount_percentage > 0 
          ? `${newestPromo.discount_percentage}% off`
          : newestPromo.discount_fixed_amount > 0 
            ? `$${newestPromo.discount_fixed_amount} off`
            : 'special pricing';

        // Calculate expiry
        let expiresText = '';
        if (newestPromo.end_date) {
          const endDate = new Date(newestPromo.end_date);
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
              subject: `🎉 New Promotion: ${newestPromo.name}!`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1a1a1a; margin-bottom: 10px;">New Promotion Alert${subscription.customer_name ? `, ${subscription.customer_name}` : ''}!</h1>
                    <p style="color: #666; font-size: 18px;">We have a new sale that applies to ${motorModel}.</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #166534;">${newestPromo.name}</h2>
                    <p style="margin: 0; font-size: 24px; color: #15803d; font-weight: bold;">${discountText}${expiresText}</p>
                    ${newestPromo.bonus_description ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">${newestPromo.bonus_description}</p>` : ''}
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
            const smsMessage = `🎉 New promo${subscription.customer_name ? `, ${subscription.customer_name}` : ''}! ${newestPromo.name}: ${discountText} on ${motorModel}.${expiresText}\n\nView quote: ${appUrl}\n\n- Harris Boat Works\n\nReply STOP to unsubscribe`;
            
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

        // Update notified_at AND track which promo they were notified about
        await supabase
          .from('promo_reminder_subscriptions')
          .update({ 
            notified_at: new Date().toISOString(),
            last_notified_promo_id: newestPromo.id  // Track WHICH promo they saw
          })
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
        promoName: newestPromo.name,
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
