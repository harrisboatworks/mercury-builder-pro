import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://eutsoqdpjurknjsshxes.lovableproject.com";
const FUNCTIONS_URL = `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1`;

// Helper to wrap URLs with click tracking
const trackClick = (url: string, token: string, step: number) => 
  `${FUNCTIONS_URL}/track-email-event?type=click&token=${token}&step=${step}&url=${encodeURIComponent(url)}`;

// Helper to get tracking pixel
const trackingPixel = (token: string, step: number) => 
  `<img src="${FUNCTIONS_URL}/track-email-event?type=open&token=${token}&step=${step}" width="1" height="1" style="display:none" alt="" />`;

// Email templates for the sequence
const emailTemplates = {
  // Email 2 - Day 3: Winter Repower Benefits
  2: {
    subject: "❄️ Why Smart Boaters Repower in Winter",
    getHtml: (name: string | null, unsubscribeToken: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Mercury Dealer Since 1965</p>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
        The Winter Repower Advantage
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi there,'}<br><br>
        Did you know that winter is actually the best time to repower your boat? Here's why experienced boaters schedule their repowers between November and March:
      </p>
      
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 2;">
          <li><strong>Skip the spring rush</strong> — No waiting when everyone else is scrambling</li>
          <li><strong>More technician attention</strong> — Slower season means more thorough work</li>
          <li><strong>Winter promotions</strong> — Manufacturers often offer the best deals</li>
          <li><strong>Ready for ice-out</strong> — Hit the water day one of the season</li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
          Current Mercury Promotions Available
        </p>
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 16px 0;">
          Extended warranty offers and special financing
        </p>
        <a href="${trackClick(`${APP_URL}/promotions`, unsubscribeToken, 2)}" style="display: inline-block; background: white; color: #1e40af; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
          View Current Deals
        </a>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Want to discuss your options? Give us a call at <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a> or reply to this email.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 12px;">
        Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 2)}
</body>
</html>
    `,
  },
  
  // Email 3 - Day 7: Personal Follow-up
  3: {
    subject: "Quick question about your boat",
    getHtml: (name: string | null, unsubscribeToken: string, hasBoat: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi,'}<br><br>
        ${hasBoat 
          ? `You mentioned you have a boat you're considering repowering. I wanted to personally reach out — do you have any questions about the process or pricing?`
          : `I noticed you downloaded our repower guide last week. Did you find it helpful? Is there anything specific you'd like to know more about?`
        }
      </p>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        A few things I can help with:
      </p>
      
      <ul style="color: #475569; font-size: 16px; line-height: 2; margin: 0 0 24px 20px; padding: 0;">
        <li>Getting a quick ballpark price for your specific boat</li>
        <li>Understanding which HP range makes sense</li>
        <li>Timing — planning for spring or taking advantage of winter pricing</li>
        <li>Trade-in value for your current motor</li>
      </ul>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        No pressure at all — just here to help if you have questions.
      </p>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
        <p style="color: #0f172a; font-weight: 600; margin: 0 0 8px 0;">
          Mike Harris
        </p>
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Harris Boat Works<br>
          📞 <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a><br>
          ✉️ <a href="mailto:info@harrisboatworks.ca" style="color: #1e40af;">info@harrisboatworks.ca</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="${trackClick(`${APP_URL}/quote/motor-selection`, unsubscribeToken, 3)}" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          Build Your Quote Online
        </a>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 11px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 3)}
</body>
</html>
    `,
  },
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[process-email-sequence] Starting sequence processing");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all active sequences that are due
    const now = new Date().toISOString();
    const { data: dueSequences, error: fetchError } = await supabase
      .from("email_sequence_queue")
      .select("*")
      .eq("status", "active")
      .lte("next_send_at", now)
      .order("next_send_at", { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      throw fetchError;
    }

    console.log(`[process-email-sequence] Found ${dueSequences?.length || 0} sequences to process`);

    let processed = 0;
    let errors = 0;

    for (const sequence of dueSequences || []) {
      try {
        const nextStep = sequence.current_step + 1;
        const template = emailTemplates[nextStep as keyof typeof emailTemplates];

        if (!template) {
          // Sequence complete
          await supabase
            .from("email_sequence_queue")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sequence.id);
          
          console.log(`[process-email-sequence] Sequence ${sequence.id} completed`);
          continue;
        }

        // Get hasBoat from metadata
        const hasBoat = sequence.metadata?.hasBoatToRepower || false;
        
        // Generate email HTML
        const html = nextStep === 3 
          ? template.getHtml(sequence.customer_name, sequence.unsubscribe_token, hasBoat)
          : template.getHtml(sequence.customer_name, sequence.unsubscribe_token);

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Harris Boat Works <noreply@hbwsales.ca>",
          to: [sequence.email],
          replyTo: "info@harrisboatworks.ca",
          subject: template.subject,
          html,
        });

        console.log(`[process-email-sequence] Email ${nextStep} sent to ${sequence.email}:`, emailResponse);

        // Calculate next send time
        let nextSendAt: string | null = null;
        if (nextStep === 2) {
          // Email 3 is 4 days after Email 2 (Day 7 total)
          const next = new Date();
          next.setDate(next.getDate() + 4);
          nextSendAt = next.toISOString();
        }
        // If nextStep === 3, no more emails, will be marked complete on next run

        // Update sequence
        await supabase
          .from("email_sequence_queue")
          .update({
            current_step: nextStep,
            emails_sent: sequence.emails_sent + 1,
            last_sent_at: new Date().toISOString(),
            next_send_at: nextSendAt,
            status: nextStep >= 3 ? "completed" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sequence.id);

        processed++;
      } catch (emailError: any) {
        console.error(`[process-email-sequence] Error processing ${sequence.id}:`, emailError);
        
        // Mark as paused if too many errors
        await supabase
          .from("email_sequence_queue")
          .update({
            status: "paused",
            metadata: { 
              ...sequence.metadata, 
              lastError: emailError.message,
              errorAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", sequence.id);
        
        errors++;
      }
    }

    console.log(`[process-email-sequence] Completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: dueSequences?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[process-email-sequence] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});