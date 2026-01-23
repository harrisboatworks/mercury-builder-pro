import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://eutsoqdpjurknjsshxes.lovableproject.com";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      // Return HTML page for missing token
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Link</title>
          <style>
            body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h1 { color: #ef4444; margin: 0 0 16px 0; }
            p { color: #64748b; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Invalid Link</h1>
            <p>This unsubscribe link is invalid or has expired.</p>
          </div>
        </body>
        </html>`,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and update the sequence
    const { data, error } = await supabase
      .from("email_sequence_queue")
      .update({
        status: "unsubscribed",
        updated_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", token)
      .select()
      .single();

    if (error || !data) {
      console.error("[unsubscribe] Token not found:", token);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <style>
            body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h1 { color: #f59e0b; margin: 0 0 16px 0; }
            p { color: #64748b; margin: 0 0 24px 0; }
            a { color: #1e40af; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Not Found</h1>
            <p>This unsubscribe link may have already been used or expired.</p>
            <a href="${APP_URL}">Return to Harris Boat Works</a>
          </div>
        </body>
        </html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    console.log(`[unsubscribe] Successfully unsubscribed: ${data.email}`);

    // Return success HTML page
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed</title>
        <style>
          body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
          .card { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          h1 { color: #10b981; margin: 0 0 16px 0; }
          p { color: #64748b; margin: 0 0 24px 0; }
          a { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          a:hover { background: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✓ Unsubscribed</h1>
          <p>You've been successfully unsubscribed from our repower email series. We're sorry to see you go!</p>
          <p style="font-size: 14px; margin-bottom: 24px;">You can still reach us anytime at <a href="tel:9053422153" style="background: none; padding: 0; color: #1e40af;">(905) 342-2153</a></p>
          <a href="${APP_URL}">Return to Harris Boat Works</a>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error: any) {
    console.error("[unsubscribe] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});