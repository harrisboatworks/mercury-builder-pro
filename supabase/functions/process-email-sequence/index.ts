import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { buildEmail, detailsCard, ctaButton, esc } from "../_shared/email-layout.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://www.mercuryrepower.ca";
const FUNCTIONS_URL = `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1`;

// Wrap URLs with click tracking
const trackClick = (url: string, token: string, step: number) =>
  `${FUNCTIONS_URL}/track-email-event?type=click&token=${token}&step=${step}&url=${encodeURIComponent(url)}`;

// Open-tracking pixel (returned as raw HTML appended at end of bodyHtml)
const trackingPixel = (token: string, step: number) =>
  `<img src="${FUNCTIONS_URL}/track-email-event?type=open&token=${token}&step=${step}" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />`;

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "soon";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const daysUntil = (dateStr: string | null): number => {
  if (!dateStr) return 30;
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
};

const greeting = (name: string | null) => (name ? `Hi ${esc(name)},` : "Hi there,");

// ============ TEMPLATE BUILDERS ============

// Step 2 (repower_guide): Day 3 - Winter Repower Benefits
function buildWinterRepower(name: string | null, token: string): { subject: string; html: string } {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`;
  const promosUrl = trackClick(`${APP_URL}/promotions`, token, 2);

  const body = `
    <p style="margin:0 0 14px 0;">${greeting(name)}</p>
    <p style="margin:0 0 18px 0;">Winter is the smartest time of year to repower. Here is why experienced boaters schedule their repowers between November and March.</p>

    <h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">The winter repower advantage</h2>
    <div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 18px 0;">&nbsp;</div>
    <ul style="margin:0 0 22px 0;padding-left:20px;line-height:1.8;">
      <li style="margin:0 0 8px 0;"><strong>Skip the spring rush.</strong> No waiting when everyone else is scrambling to get on the water.</li>
      <li style="margin:0 0 8px 0;"><strong>More technician attention.</strong> A slower season means more careful, thorough work on your boat.</li>
      <li style="margin:0 0 8px 0;"><strong>Best of the year promotions.</strong> Mercury runs its strongest offers in the off season.</li>
      <li style="margin:0 0 8px 0;"><strong>Ready for ice-out.</strong> Hit the water on day one of the season, fully rigged and tested.</li>
    </ul>

    <h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">Current Mercury promotions</h2>
    <div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 18px 0;">&nbsp;</div>
    <p style="margin:0 0 14px 0;">Extended warranty offers and special financing are live right now. We can apply whatever offer fits your motor when you are ready.</p>

    <p style="margin:22px 0 0 0;">Want to talk through your options? Call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a> or reply to this email.</p>
  `;

  const html = buildEmail({
    preheader: "Why smart boaters repower in winter, and what is on right now.",
    eyebrow: "Repower planning",
    heading: "Why smart boaters repower in winter",
    bodyHtml: body + trackingPixel(token, 2),
    ctaText: "See current deals",
    ctaUrl: promosUrl,
    unsubscribeUrl,
  });

  return { subject: "Why smart boaters repower in winter", html };
}

// Step 3 (repower_guide): Day 7 - Personal follow-up
function buildPersonalFollowUp(name: string | null, token: string, hasBoat: boolean): { subject: string; html: string } {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`;
  const ctaUrl = trackClick(`${APP_URL}/quote/motor-selection`, token, 3);

  const opener = hasBoat
    ? `You mentioned you have a boat you are considering repowering. I wanted to reach out personally. Do you have any questions about the process, pricing, or timing?`
    : `I noticed you downloaded our repower guide last week. Did you find it helpful? Is there anything specific you would like to dig into?`;

  const body = `
    <p style="margin:0 0 14px 0;">${greeting(name)}</p>
    <p style="margin:0 0 18px 0;">${opener}</p>

    <h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">A few things I can help with</h2>
    <div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 18px 0;">&nbsp;</div>
    <ul style="margin:0 0 22px 0;padding-left:20px;line-height:1.8;">
      <li style="margin:0 0 8px 0;">A quick ballpark price for your specific boat.</li>
      <li style="margin:0 0 8px 0;">Which HP range actually makes sense for the way you use it.</li>
      <li style="margin:0 0 8px 0;">Timing your repower for spring readiness or winter pricing.</li>
      <li style="margin:0 0 8px 0;">A trade-in value for your current motor.</li>
    </ul>

    <p style="margin:0 0 22px 0;">No pressure at all. Just here when you have questions.</p>

    <p style="margin:0 0 4px 0;font-weight:600;color:#0f2a43;">Jay Harris</p>
    <p style="margin:0 0 4px 0;font-size:14px;color:#6b7280;">Harris Boat Works</p>
    <p style="margin:0 0 22px 0;font-size:14px;color:#6b7280;">
      <a href="tel:9053422153" style="color:#0f2a43;text-decoration:none;">(905) 342-2153</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:info@harrisboatworks.ca" style="color:#0f2a43;text-decoration:none;">info@harrisboatworks.ca</a>
    </p>
  `;

  const html = buildEmail({
    preheader: "Quick question about your boat.",
    eyebrow: "From Jay at Harris",
    heading: "A quick question about your boat",
    bodyHtml: body + trackingPixel(token, 3),
    ctaText: "Build your quote online",
    ctaUrl,
    unsubscribeUrl,
  });

  return { subject: "Quick question about your boat", html };
}

// Step 4 (abandoned_quote, Day 1): Quote reminder
function buildQuoteReminder(name: string | null, token: string, metadata: any): { subject: string; html: string } {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`;
  const ctaUrl = trackClick(`${APP_URL}/quote/saved/${metadata?.quoteId || ""}`, token, 4);
  const motor = esc(metadata?.motorModel || "Mercury motor");

  let bonusLabel = "";
  if (metadata?.selectedPromoOption === "no_payments") bonusLabel = "6 months no payments";
  else if (metadata?.selectedPromoOption === "special_financing") bonusLabel = `Special financing at ${metadata.promoDisplayValue || "2.99% APR"}`;
  else if (metadata?.selectedPromoOption === "cash_rebate") bonusLabel = `Factory cash rebate: ${metadata.promoDisplayValue || "up to $750"}`;

  const rows = [
    { label: "Motor", value: motor },
    { label: "Warranty", value: "3-Year Factory Warranty (standard on every new Mercury)" },
  ];
  if (bonusLabel) rows.push({ label: "Your bonus", value: esc(bonusLabel) });
  if (metadata?.motorPrice) {
    rows.push({
      label: "Motor price",
      value: `$${Number(metadata.motorPrice).toLocaleString()} CAD`,
    });
  }

  const expiry = metadata?.promoEndDate
    ? `<p style="margin:18px 0 0 0;color:#c8102e;font-weight:600;text-align:center;">This offer ends ${esc(formatDate(metadata.promoEndDate))}.</p>`
    : "";

  const body = `
    <p style="margin:0 0 14px 0;">${greeting(name)}</p>
    <p style="margin:0 0 14px 0;">You started building a quote for a <strong>${motor}</strong>. Great choice. We saved everything exactly where you left it.</p>

    <h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">Your saved quote</h2>
    <div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 6px 0;">&nbsp;</div>
    ${detailsCard(rows)}
    ${expiry}
    <p style="margin:22px 0 0 0;">Questions? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
  `;

  const html = buildEmail({
    preheader: `Your Mercury ${metadata?.motorModel || "motor"} quote is saved and ready to finish.`,
    eyebrow: "Saved quote",
    heading: "Your quote is saved and ready",
    bodyHtml: body + trackingPixel(token, 4),
    ctaText: "Resume your quote",
    ctaUrl,
    unsubscribeUrl,
  });

  return { subject: "Your Mercury quote is saved and ready", html };
}

// Step 5 (abandoned_quote, Day 3): Focus on selected bonus
function buildBonusFocus(name: string | null, token: string, metadata: any): { subject: string; html: string } {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`;
  const ctaUrl = trackClick(`${APP_URL}/quote/saved/${metadata?.quoteId || ""}`, token, 5);
  const option = metadata?.selectedPromoOption;
  const motor = esc(metadata?.motorModel || "Mercury motor");

  let subject = "Do not miss your Mercury bonus offer";
  let eyebrow = "Mercury bonus offer";
  let heading = "Complete your quote and save";
  let lead = `Your <strong>${motor}</strong> quote is still waiting. Current promotions are still live.`;
  let highlightLabel = "Selected bonus";
  let highlightValue = "Mercury bonus offer";

  if (option === "cash_rebate") {
    const amt = esc(metadata?.promoDisplayValue || "$500");
    subject = `Your ${amt} Mercury rebate is reserved`;
    eyebrow = "Cash rebate";
    heading = `Your ${amt} rebate is reserved`;
    lead = `Quick reminder. Your ${esc(String(metadata?.motorHP || ""))}HP motor qualifies for a <strong>${amt} factory cash rebate</strong> as part of Mercury's ${esc(metadata?.promoName || "current")} promotion.`;
    highlightLabel = "Cash rebate";
    highlightValue = `${amt} applied directly to your purchase`;
  } else if (option === "no_payments") {
    subject = "On the water now, pay later";
    eyebrow = "No payments";
    heading = "On the water now, pay later";
    lead = `You chose the <strong>6 months no payments</strong> option. That means you can be on the water all season before making a single payment.`;
    highlightLabel = "Bonus";
    highlightValue = "6 months no payments";
  } else if (option === "special_financing") {
    const rate = esc(metadata?.promoDisplayValue || "2.99%");
    subject = `Lock in ${rate} financing before it expires`;
    eyebrow = "Special financing";
    heading = `Special financing will not last forever`;
    lead = `Your quote includes Mercury's limited-time <strong>${rate} APR financing</strong>. One of the lowest rates of the year.`;
    highlightLabel = "Rate";
    highlightValue = `${rate} APR promotional rate`;
  }

  const rows = [
    { label: "Motor", value: motor },
    { label: highlightLabel, value: highlightValue },
  ];

  const body = `
    <p style="margin:0 0 14px 0;">${greeting(name)}</p>
    <p style="margin:0 0 14px 0;">${lead}</p>
    ${detailsCard(rows)}
    <p style="margin:22px 0 0 0;">Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a> if you want help finalizing.</p>
  `;

  const html = buildEmail({
    preheader: subject,
    eyebrow,
    heading,
    bodyHtml: body + trackingPixel(token, 5),
    ctaText: "Resume your quote",
    ctaUrl,
    unsubscribeUrl,
  });

  return { subject, html };
}

// Step 6 (abandoned_quote, Day 7): Urgency / last chance
function buildLastChance(name: string | null, token: string, metadata: any): { subject: string; html: string } {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${token}`;
  const ctaUrl = trackClick(`${APP_URL}/quote/saved/${metadata?.quoteId || ""}`, token, 6);
  const days = daysUntil(metadata?.promoEndDate);
  const promoName = esc(metadata?.promoName || "Current Mercury Promotion");
  const endStr = esc(formatDate(metadata?.promoEndDate));
  const motor = esc(metadata?.motorModel || "Mercury motor");

  let bonusLabel = "";
  if (metadata?.selectedPromoOption === "no_payments") bonusLabel = "6 months no payments";
  else if (metadata?.selectedPromoOption === "special_financing") bonusLabel = `${esc(metadata.promoDisplayValue || "2.99%")} APR financing`;
  else if (metadata?.selectedPromoOption === "cash_rebate") bonusLabel = `${esc(metadata.promoDisplayValue || "$500")} factory rebate`;

  const rows = [
    { label: "Motor", value: motor },
    { label: "Warranty", value: "3-Year Factory Warranty (standard on every new Mercury)" },
  ];
  if (bonusLabel) rows.push({ label: "Your bonus", value: bonusLabel });
  rows.push({ label: "Promotion ends", value: endStr });

  const body = `
    <p style="margin:0 0 14px 0;">${greeting(name)}</p>
    <p style="margin:0 0 14px 0;">The ${promoName} promotion ends <strong>${endStr}</strong>. That is just ${days} day${days === 1 ? "" : "s"} away.</p>

    <h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">Last chance: ${promoName}</h2>
    <div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 6px 0;">&nbsp;</div>
    ${detailsCard(rows)}
    <p style="margin:18px 0 0 0;color:#c8102e;font-weight:600;text-align:center;">After ${endStr}, these offers expire.</p>
    <p style="margin:22px 0 0 0;">Questions? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
  `;

  const html = buildEmail({
    preheader: `Only ${days} day${days === 1 ? "" : "s"} left on ${metadata?.promoName || "the current Mercury promotion"}.`,
    eyebrow: `${days} day${days === 1 ? "" : "s"} left`,
    heading: `Last chance on ${metadata?.promoName || "the current Mercury promotion"}`,
    bodyHtml: body + trackingPixel(token, 6),
    ctaText: "Complete your quote",
    ctaUrl,
    unsubscribeUrl,
  });

  const subject = `Only ${days} days left: ${promoName.replace(/&amp;/g, "&")} ends ${endStr.replace(/&amp;/g, "&")}`;
  return { subject, html };
}

// ============ DISPATCH ============

function renderTemplate(
  step: number,
  isAbandonedQuote: boolean,
  name: string | null,
  token: string,
  metadata: any,
  hasBoat: boolean,
): { subject: string; html: string } | null {
  if (isAbandonedQuote) {
    if (step === 4) return buildQuoteReminder(name, token, metadata);
    if (step === 5) return buildBonusFocus(name, token, metadata);
    if (step === 6) return buildLastChance(name, token, metadata);
    return null;
  }
  if (step === 2) return buildWinterRepower(name, token);
  if (step === 3) return buildPersonalFollowUp(name, token, hasBoat);
  return null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    const { data: dueSequences, error: fetchError } = await supabase
      .from("email_sequence_queue")
      .select("*")
      .eq("status", "active")
      .lte("next_send_at", now)
      .order("next_send_at", { ascending: true })
      .limit(50);
    if (fetchError) throw fetchError;

    console.log(`[process-email-sequence] Found ${dueSequences?.length || 0} sequences to process`);

    let processed = 0;
    let errors = 0;

    for (const sequence of dueSequences || []) {
      try {
        const isAbandonedQuote = sequence.sequence_type === "abandoned_quote";
        const nextStep = isAbandonedQuote
          ? (sequence.current_step === 0 ? 4 : sequence.current_step + 1)
          : sequence.current_step + 1;
        const maxStep = isAbandonedQuote ? 6 : 3;

        const metadata = sequence.metadata || {};
        const hasBoat = !!metadata.hasBoatToRepower;

        const rendered = renderTemplate(
          nextStep,
          isAbandonedQuote,
          sequence.customer_name,
          sequence.unsubscribe_token,
          metadata,
          hasBoat,
        );

        if (!rendered || nextStep > maxStep) {
          await supabase
            .from("email_sequence_queue")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", sequence.id);
          continue;
        }

        const emailResponse = await resend.emails.send({
          from: "Harris Boat Works <noreply@mercuryrepower.ca>",
          to: [sequence.email],
          replyTo: "info@harrisboatworks.ca",
          subject: rendered.subject,
          html: rendered.html,
        });

        console.log(`[process-email-sequence] Email step ${nextStep} sent to ${sequence.email}`, emailResponse);

        let nextSendAt: string | null = null;
        if (isAbandonedQuote) {
          if (nextStep === 4) {
            const n = new Date(); n.setDate(n.getDate() + 2); nextSendAt = n.toISOString();
          } else if (nextStep === 5) {
            const n = new Date(); n.setDate(n.getDate() + 4); nextSendAt = n.toISOString();
          }
        } else if (nextStep === 2) {
          const n = new Date(); n.setDate(n.getDate() + 4); nextSendAt = n.toISOString();
        }

        await supabase
          .from("email_sequence_queue")
          .update({
            current_step: nextStep,
            emails_sent: (sequence.emails_sent || 0) + 1,
            last_sent_at: new Date().toISOString(),
            next_send_at: nextSendAt,
            status: nextStep >= maxStep ? "completed" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sequence.id);

        processed++;
      } catch (emailError: any) {
        console.error(`[process-email-sequence] Error on ${sequence.id}:`, emailError);
        await supabase
          .from("email_sequence_queue")
          .update({
            status: "paused",
            metadata: { ...sequence.metadata, lastError: emailError.message, errorAt: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq("id", sequence.id);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, errors, total: dueSequences?.length || 0 }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("[process-email-sequence] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
