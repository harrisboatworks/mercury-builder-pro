import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unsubscribe token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[unsubscribe-promo-reminder] Processing unsubscribe for token:", token);

    // Find and deactivate subscription
    const { data: subscription, error: findError } = await supabase
      .from('promo_reminder_subscriptions')
      .select('id, customer_email, motor_details')
      .eq('unsubscribe_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (findError) {
      console.error("[unsubscribe-promo-reminder] Find error:", findError);
      throw findError;
    }

    if (!subscription) {
      console.log("[unsubscribe-promo-reminder] Subscription not found or already inactive");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Already unsubscribed or subscription not found" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate subscription
    const { error: updateError } = await supabase
      .from('promo_reminder_subscriptions')
      .update({ is_active: false })
      .eq('id', subscription.id);

    if (updateError) {
      console.error("[unsubscribe-promo-reminder] Update error:", updateError);
      throw updateError;
    }

    console.log("[unsubscribe-promo-reminder] Successfully unsubscribed:", subscription.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully unsubscribed from promotional reminders"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[unsubscribe-promo-reminder] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
