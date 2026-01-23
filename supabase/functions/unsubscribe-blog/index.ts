import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token from request body (JSON)
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid unsubscribe token", success: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[unsubscribe-blog] Processing unsubscribe for token: ${token.substring(0, 8)}...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and update subscription
    const { data: subscription, error: findError } = await supabase
      .from("blog_subscriptions")
      .select("id, email, is_active")
      .eq("unsubscribe_token", token)
      .single();

    if (findError || !subscription) {
      console.error("[unsubscribe-blog] Subscription not found:", findError);
      return new Response(
        JSON.stringify({ error: "Subscription not found or invalid token", success: false }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subscription.is_active) {
      return new Response(
        JSON.stringify({ message: "You were already unsubscribed", success: true, alreadyUnsubscribed: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Deactivate subscription
    const { error: updateError } = await supabase
      .from("blog_subscriptions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("[unsubscribe-blog] Update error:", updateError);
      throw updateError;
    }

    console.log(`[unsubscribe-blog] Successfully unsubscribed: ${subscription.email}`);

    return new Response(
      JSON.stringify({ message: "You have been unsubscribed from blog updates", success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[unsubscribe-blog] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to unsubscribe", success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
