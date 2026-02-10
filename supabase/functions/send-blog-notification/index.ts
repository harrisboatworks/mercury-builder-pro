import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlogNotificationRequest {
  articleSlug: string;
  articleTitle: string;
  articleDescription: string;
  articleUrl: string;
  articleImage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { 
      articleSlug, 
      articleTitle, 
      articleDescription, 
      articleUrl,
      articleImage 
    }: BlogNotificationRequest = await req.json();

    if (!articleSlug || !articleTitle || !articleUrl) {
      return new Response(
        JSON.stringify({ error: "Article slug, title, and URL are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-blog-notification] Sending notifications for: ${articleTitle}`);

    // Initialize clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    const resend = new Resend(resendApiKey);

    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from("blog_subscriptions")
      .select("id, email, name, unsubscribe_token")
      .eq("is_active", true);

    if (fetchError) {
      console.error("[send-blog-notification] Fetch error:", fetchError);
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("[send-blog-notification] No active subscribers found");
      return new Response(
        JSON.stringify({ message: "No active subscribers", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-blog-notification] Found ${subscribers.length} active subscribers`);

    const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
    let successCount = 0;
    let errorCount = 0;

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            const unsubscribeUrl = `${appUrl}/blog/unsubscribe?token=${subscriber.unsubscribe_token}`;
            
            await resend.emails.send({
              from: "Harris Boat Works <updates@hbwsales.ca>",
              to: [subscriber.email],
              subject: `New Post: ${articleTitle}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1a365d; font-size: 24px;">New Blog Post</h1>
                  
                  ${articleImage ? `<img src="${articleImage}" alt="${articleTitle}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">` : ''}
                  
                  <h2 style="color: #333; font-size: 20px; margin-bottom: 10px;">
                    <a href="${articleUrl}" style="color: #2563eb; text-decoration: none;">${articleTitle}</a>
                  </h2>
                  
                  <p style="color: #666; line-height: 1.6;">${articleDescription}</p>
                  
                  <a href="${articleUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
                    Read Full Article →
                  </a>
                  
                  <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0 20px;">
                  
                  <p style="color: #999; font-size: 12px;">
                    You're receiving this because you subscribed to blog updates from Harris Boat Works.<br>
                    <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
                  </p>
                </div>
              `,
            });
            successCount++;
          } catch (emailError) {
            console.error(`[send-blog-notification] Failed to send to ${subscriber.email}:`, emailError);
            errorCount++;
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[send-blog-notification] Complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Notifications sent to ${successCount} subscribers`,
        sent: successCount,
        failed: errorCount,
        total: subscribers.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[send-blog-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notifications" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
