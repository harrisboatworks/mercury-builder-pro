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

    // Send the welcome email with PDF
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">
        Harris Boat Works
      </h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Mercury Dealer Since 1965</p>
    </div>
    
    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
        Your Repower Guide is Ready! 📘
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi there,'}<br><br>
        Thanks for your interest in repowering. Here's your complete guide to making an informed decision about your boat's future.
      </p>
      
      <!-- Download Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${trackClick(PDF_DOWNLOAD_URL, unsubscribeToken, 1)}" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Download Your Guide
        </a>
      </div>
      
      <!-- What's Inside -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #0f172a; font-weight: 600; margin: 0 0 12px 0;">Inside the guide you'll find:</p>
        <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>When repowering makes financial sense (the 70/30 rule)</li>
          <li>Transparent pricing breakdown by horsepower</li>
          <li>The 4-step Harris repower process</li>
          <li>Warning signs your motor needs replacing</li>
          <li>Winter repower advantages</li>
        </ul>
      </div>
      
      ${hasBoatToRepower ? `
      <!-- Hot Lead CTA -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: white; font-size: 16px; margin: 0 0 16px 0;">
          Ready to discuss your boat's repower options?
        </p>
        <a href="${trackClick(`${APP_URL}/quote/motor-selection`, unsubscribeToken, 1)}" style="display: inline-block; background: white; color: #1e40af; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
          Build Your Quote
        </a>
      </div>
      ` : ''}
      
      <!-- Contact Info -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
        <p style="color: #475569; font-size: 14px; margin: 0;">
          Questions? We're here to help:<br>
          📞 <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a><br>
          ✉️ <a href="mailto:info@harrisboatworks.ca" style="color: #1e40af;">info@harrisboatworks.ca</a>
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 12px;">
        Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON<br>
        Family-owned since 1947 • Mercury Dealer since 1965
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 1)}
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Harris Boat Works <noreply@hbwsales.ca>",
      to: [email],
      replyTo: "info@harrisboatworks.ca",
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