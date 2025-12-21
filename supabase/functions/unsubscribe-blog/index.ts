import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateHtmlPage("Invalid Link", "The unsubscribe link is invalid or missing.", "error"),
        { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
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
      console.log(`[unsubscribe-blog] Token not found: ${token.substring(0, 8)}...`);
      return new Response(
        generateHtmlPage("Link Not Found", "This unsubscribe link is invalid or has expired.", "error"),
        { status: 404, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    if (!subscription.is_active) {
      return new Response(
        generateHtmlPage("Already Unsubscribed", "You have already been unsubscribed from our blog updates.", "info"),
        { status: 200, headers: { "Content-Type": "text/html", ...corsHeaders } }
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
      generateHtmlPage(
        "Unsubscribed Successfully", 
        "You have been unsubscribed from Harris Boat Works blog updates. We're sorry to see you go!",
        "success"
      ),
      { status: 200, headers: { "Content-Type": "text/html", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[unsubscribe-blog] Error:", error);
    return new Response(
      generateHtmlPage("Error", "An error occurred while processing your request. Please try again.", "error"),
      { status: 500, headers: { "Content-Type": "text/html", ...corsHeaders } }
    );
  }
};

function generateHtmlPage(title: string, message: string, type: "success" | "error" | "info"): string {
  const colors = {
    success: { bg: "#d4edda", border: "#c3e6cb", text: "#155724" },
    error: { bg: "#f8d7da", border: "#f5c6cb", text: "#721c24" },
    info: { bg: "#d1ecf1", border: "#bee5eb", text: "#0c5460" },
  };
  const color = colors[type];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Harris Boat Works</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          max-width: 500px;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          text-align: center;
        }
        .alert {
          padding: 20px;
          border-radius: 8px;
          background: ${color.bg};
          border: 1px solid ${color.border};
          color: ${color.text};
          margin-bottom: 20px;
        }
        h1 { color: #1a365d; margin-bottom: 10px; }
        p { color: #666; line-height: 1.6; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Harris Boat Works</h1>
        <div class="alert">
          <strong>${title}</strong>
          <p>${message}</p>
        </div>
        <p><a href="https://harrisboatworks.com/blog">← Return to Blog</a></p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
