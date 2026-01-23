import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client first for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check IP-based limits
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      _identifier: clientIP,
      _action: 'blog_subscribe',
      _max_attempts: 10,
      _window_minutes: 60
    });

    if (!allowed) {
      console.log(`[subscribe-blog] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, name }: SubscribeRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[subscribe-blog] Processing subscription for: ${email}`);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("blog_subscriptions")
      .select("id, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      if (existing.is_active) {
        return new Response(
          JSON.stringify({ message: "You're already subscribed!", alreadySubscribed: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from("blog_subscriptions")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (updateError) throw updateError;

        console.log(`[subscribe-blog] Reactivated subscription for: ${email}`);
        return new Response(
          JSON.stringify({ message: "Welcome back! Your subscription has been reactivated.", reactivated: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Insert new subscription
    const { data: subscription, error: insertError } = await supabase
      .from("blog_subscriptions")
      .insert({
        email: email.toLowerCase(),
        name: name || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[subscribe-blog] Insert error:", insertError);
      throw insertError;
    }

    console.log(`[subscribe-blog] New subscription created: ${subscription.id}`);

    // Send confirmation email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const appUrl = Deno.env.get("APP_URL") || "https://harrisboatworks.com";
        const unsubscribeUrl = `${appUrl}/blog/unsubscribe?token=${subscription.unsubscribe_token}`;

        await resend.emails.send({
          from: "Harris Boat Works <updates@harrisboatworks.com>",
          to: [email],
          subject: "Welcome to Harris Boat Works Blog Updates!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a365d;">Welcome${name ? `, ${name}` : ''}!</h1>
              <p>Thank you for subscribing to the Harris Boat Works blog. You'll receive notifications when we publish new articles about:</p>
              <ul>
                <li>Mercury outboard motor guides and tips</li>
                <li>Boat maintenance advice</li>
                <li>Buying guides and comparisons</li>
                <li>Industry news and updates</li>
              </ul>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't subscribe, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                Harris Boat Works - Ontario's trusted Mercury dealer since 1965
              </p>
            </div>
          `,
        });
        console.log(`[subscribe-blog] Confirmation email sent to: ${email}`);
      } catch (emailError) {
        console.error("[subscribe-blog] Email send error:", emailError);
        // Don't fail the subscription if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Successfully subscribed! Check your email for confirmation.", 
        success: true 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[subscribe-blog] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to subscribe" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
