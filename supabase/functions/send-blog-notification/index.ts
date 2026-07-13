import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { pingIndexNow } from "../_shared/indexnow.ts";

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
            
            const { buildEmail } = await import("../_shared/email-layout.ts");
            const safeTitle = String(articleTitle).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeDesc = String(articleDescription || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const imageBlock = articleImage
              ? `<p style="margin:0 0 18px 0;text-align:center;"><img src="${articleImage}" alt="${safeTitle}" style="max-width:100%;height:auto;border-radius:4px;border:1px solid #e5e7eb;" /></p>`
              : "";
            const body = `
              ${imageBlock}
              <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#1f2430;">${safeTitle}</h2>
              <p style="margin:0 0 14px 0;color:#1f2430;">${safeDesc}</p>
              <p style="margin:18px 0 0 0;color:#6b7280;font-size:13px;">From Harris Boat Works, your Mercury repower team on Rice Lake.</p>
            `;
            const html = buildEmail({
              preheader: safeDesc.slice(0, 140),
              heading: "New from the Harris Boat Works journal",
              bodyHtml: body,
              ctaText: "Read the full article",
              ctaUrl: articleUrl,
              unsubscribeUrl,
            });

            await resend.emails.send({
              from: "Harris Boat Works <updates@mercuryrepower.ca>",
              replyTo: "info@harrisboatworks.ca",
              to: [subscriber.email],
              subject: `New from Harris Boat Works: ${articleTitle}`,
              html,
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

    // Fire-and-forget IndexNow ping: ONLY the new article + the blog index.
    // (We intentionally do NOT blast KEY_URLS here — a new blog post does
    // not change the homepage / promotions / case-studies content.)
    pingIndexNow(
      [articleUrl, 'https://www.mercuryrepower.ca/blog'],
      'blog-notification',
    );

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
