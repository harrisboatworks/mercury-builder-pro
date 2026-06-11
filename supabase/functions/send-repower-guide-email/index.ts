import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PDF_DOWNLOAD_URL = "https://www.dropbox.com/scl/fi/abc123/cottage-repower-guide.pdf?dl=1";
const APP_URL = Deno.env.get("APP_URL") || "https://eutsoqdpjurknjsshxes.lovableproject.com";
const FUNCTIONS_URL = `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1`;

// Helper to wrap URLs with click tracking
const trackClick = (url: string, token: string, step: number) => 
  `${FUNCTIONS_URL}/track-email-event?type=click&token=${token}&step=${step}&url=${encodeURIComponent(url)}`;

// Helper to get tracking pixel
const trackingPixel = (token: string, step: number) => 
  `<img src="${FUNCTIONS_URL}/track-email-event?type=open&token=${token}&step=${step}" width="1" height="1" style="display:none" alt="" />`;

interface RequestBody {
  email: string;
  name?: string;
  phone?: string;
  hasBoatToRepower?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, phone, hasBoatToRepower }: RequestBody = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`[send-repower-guide-email] Processing request for: ${email}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate lead score
    let leadScore = 30; // Base score for guide download
    if (name) leadScore += 10;
    if (phone) leadScore += 20;
    if (hasBoatToRepower) leadScore += 25;

    // Save lead to customer_quotes
    const { data: leadData, error: leadError } = await supabase
      .from("customer_quotes")
      .insert({
        customer_email: email,
        customer_name: name || null,
        customer_phone: phone || null,
        lead_status: "downloaded",
        lead_source: "repower_guide",
        lead_score: leadScore,
        base_price: 0,
        final_price: 0,
        deposit_amount: 0,
        loan_amount: 0,
        monthly_payment: 0,
        term_months: 60,
        total_cost: 0,
        discount_amount: 0,
        penalty_applied: false,
        notes: JSON.stringify({
          type: "repower_guide_download",
          hasBoatToRepower,
          downloadedAt: new Date().toISOString(),
        }),
      })
      .select()
      .single();

    if (leadError) {
      console.error("[send-repower-guide-email] Error saving lead:", leadError);
      // Continue anyway - still send the email
    }

    console.log(`[send-repower-guide-email] Lead saved with ID: ${leadData?.id}`);

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomUUID();

    // Create email sequence entry for follow-up emails
    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + 3); // Email 2 in 3 days

    const { error: sequenceError } = await supabase
      .from("email_sequence_queue")
      .insert({
        lead_id: leadData?.id || null,
        email,
        customer_name: name || null,
        sequence_type: "repower_guide",
        current_step: 1,
        next_send_at: nextSendAt.toISOString(),
        status: "active",
        emails_sent: 1,
        unsubscribe_token: unsubscribeToken,
        metadata: { hasBoatToRepower },
      });

    if (sequenceError) {
      console.error("[send-repower-guide-email] Error creating sequence:", sequenceError);
    }

    // Build email using shared layout. Tracking pixel and unsubscribe preserved.
    const { buildEmail } = await import("../_shared/email-layout.ts");
    const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
    const downloadUrl = trackClick(PDF_DOWNLOAD_URL, unsubscribeToken, 1);
    const quoteCtaUrl = trackClick(`${APP_URL}/quote/motor-selection`, unsubscribeToken, 1);

    const greeting = name ? `Hi ${name},` : "Hi there,";
    const hotLeadBlock = hasBoatToRepower
      ? `<p style="margin:22px 0 0 0;font-size:14px;">Ready to start sizing options for your boat? <a href="${quoteCtaUrl}" style="color:#0f2a43;font-weight:600;">Build a quote</a> in a few minutes.</p>`
      : "";

    const body = `
      <p style="margin:0 0 14px 0;">${greeting}</p>
      <p style="margin:0 0 14px 0;">Thanks for your interest in repowering. Your guide is ready to download below.</p>
      <p style="margin:18px 0 8px 0;font-weight:600;color:#1f2430;">Inside the guide:</p>
      <ul style="margin:0;padding-left:20px;color:#1f2430;">
        <li style="margin:0 0 6px 0;">When repowering makes financial sense (the 70/30 rule)</li>
        <li style="margin:0 0 6px 0;">Transparent pricing by horsepower</li>
        <li style="margin:0 0 6px 0;">The 4-step Harris repower process</li>
        <li style="margin:0 0 6px 0;">Signs your motor is ready to be replaced</li>
        <li style="margin:0 0 6px 0;">Why winter is the best time to repower</li>
      </ul>
      ${hotLeadBlock}
      <p style="margin:22px 0 0 0;">Questions? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    ` + trackingPixel(unsubscribeToken, 1);

    const emailHtml = buildEmail({
      preheader: "Your Repower Guide is ready to download.",
      heading: "Your Repower Guide is ready",
      bodyHtml: body,
      ctaText: "Download your guide",
      ctaUrl: downloadUrl,
      unsubscribeUrl,
    });

    const emailResponse = await resend.emails.send({
      from: "Harris Boat Works <noreply@mercuryrepower.ca>",
      to: [email],
      reply_to: "info@harrisboatworks.ca",
      subject: "Your Repower Guide is Ready 📘",
      html: emailHtml,
    });

    console.log("[send-repower-guide-email] Email sent:", emailResponse);

    // If phone provided and has boat, send SMS alert to admin
    if (phone && hasBoatToRepower) {
      try {
        await supabase.functions.invoke("send-sms", {
          body: {
            to: Deno.env.get("ADMIN_PHONE"),
            message: `🔥 Hot Repower Lead!\n${name || 'Someone'} just downloaded the repower guide and has a boat to repower.\nPhone: ${phone}\nEmail: ${email}`,
            messageType: "hot_lead",
          },
        });
        console.log("[send-repower-guide-email] Admin SMS sent");
      } catch (smsError) {
        console.error("[send-repower-guide-email] SMS error:", smsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: leadData?.id,
        message: "Guide email sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-repower-guide-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});