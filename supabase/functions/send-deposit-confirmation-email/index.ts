import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { buildEmail, buildAdminEmail, detailsCard, esc } from "../_shared/email-layout.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DepositConfirmationRequest {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: Record<string, unknown>;
  depositAmount: string;
  paymentId?: string;
  motorInfo?: { model?: string; hp?: number; year?: number };
  sendAdminNotification?: boolean;
  adminOnly?: boolean;
  quotePdfPath?: string;
  pricingData?: any;
  quoteUrl?: string;
}

const ADMIN_EMAILS = ["jayharris97@gmail.com", "harrisboatworks@hotmail.com"];

function logStep(step: string, data?: Record<string, unknown>) {
  console.log(`[DEPOSIT-EMAIL] ${step}`, data ? JSON.stringify(data) : "");
}

function generateReferenceNumber(paymentId?: string): string {
  if (paymentId) return `HBW-${paymentId.slice(-8).toUpperCase()}`;
  return `HBW-${Date.now().toString(36).toUpperCase()}`;
}

function getMotorLabel(motorInfo?: { model?: string; hp?: number; year?: number }): string {
  if (!motorInfo?.model) return "";
  return `${motorInfo.year || 2026} ${motorInfo.model}${motorInfo.hp ? ` ${motorInfo.hp}HP` : ""}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function downloadQuotePdf(path: string): Promise<Uint8Array | null> {
  try {
    const { data, error } = await supabase.storage.from("quotes").download(path);
    if (error || !data) {
      logStep("WARNING: Could not download PDF", { error: error?.message });
      return null;
    }
    return new Uint8Array(await data.arrayBuffer());
  } catch (err: any) {
    logStep("WARNING: Exception downloading PDF", { error: err.message });
    return null;
  }
}

function createDepositConfirmationEmail(
  customerName: string,
  depositAmount: string,
  referenceNumber: string,
  motorLabel: string,
  paymentId: string,
  hasPdf: boolean,
  quoteUrl?: string,
): string {
  const dateStr = new Date().toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Toronto",
  });

  const rows: Array<{ label: string; value: string }> = [];
  if (motorLabel) rows.push({ label: "Motor", value: esc(motorLabel) });
  rows.push({ label: "Deposit", value: `$${esc(depositAmount)} CAD` });
  rows.push({ label: "Reference", value: esc(referenceNumber) });
  if (paymentId && paymentId !== "TEMPLATE-PREVIEW") {
    rows.push({ label: "Payment ID", value: `<span style="font-family:monospace;font-size:12px;font-weight:500;">${esc(paymentId)}</span>` });
  }
  rows.push({ label: "Date", value: esc(dateStr) });

  const motorPhrase = motorLabel ? ` for your ${esc(motorLabel)}` : "";
  const pdfNote = hasPdf
    ? `<p style="margin:16px 0 0 0;font-size:14px;color:#6b7280;">A copy of your quote with the deposit applied is attached to this email.</p>`
    : "";

  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(customerName)},</p>
    <p style="margin:0 0 14px 0;">We received your deposit${motorPhrase}. Your motor is now reserved.</p>
    ${detailsCard(rows)}
    <h2 style="margin:28px 0 12px 0;font-size:16px;font-weight:700;color:#1f2430;">What happens next</h2>
    <ol style="margin:0;padding-left:20px;color:#1f2430;">
      <li style="margin:0 0 8px 0;">We call you within one business day to confirm details and any rigging or fit questions.</li>
      <li style="margin:0 0 8px 0;">We schedule your install or pickup date with you.</li>
      <li style="margin:0 0 8px 0;">Pickup is at our shop in Gores Landing. Please come in person and bring valid government-issued photo ID.</li>
    </ol>
    ${pdfNote}
    <p style="margin:22px 0 0 0;">Questions? Reply to this email or call us at <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    <p style="margin:16px 0 0 0;">Thanks for choosing Harris Boat Works.</p>
  `;

  return buildEmail({
    preheader: `Deposit received. Your ${motorLabel || "motor"} is reserved.`,
    heading: "Your deposit is confirmed",
    bodyHtml: body,
    ctaText: quoteUrl ? "View your quote" : undefined,
    ctaUrl: quoteUrl,
    footerNote: "Pickup is in person at our Gores Landing shop. Please bring valid photo ID.",
  });
}

function createAdminNotificationEmail(
  customerName: string, customerEmail: string, customerPhone: string,
  depositAmount: string, referenceNumber: string, paymentId: string,
  motorInfo?: { model?: string; hp?: number; year?: number },
): string {
  const now = new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" });
  const motorLine = getMotorLabel(motorInfo) || "Not specified";
  const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Customer</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(customerName)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(customerEmail)}" style="color:#0f2a43;">${esc(customerEmail || "Not provided")}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;">${customerPhone ? `<a href="tel:${esc(customerPhone)}" style="color:#0f2a43;">${esc(customerPhone)}</a>` : "Not provided"}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Motor</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${esc(motorLine)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Deposit</td><td style="padding:6px 0;color:#1f2430;font-weight:700;">$${esc(depositAmount)} CAD</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Reference</td><td style="padding:6px 0;color:#1f2430;">${esc(referenceNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Stripe</td><td style="padding:6px 0;font-family:monospace;font-size:12px;color:#1f2430;">${esc(paymentId || "N/A")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Time</td><td style="padding:6px 0;color:#1f2430;">${esc(now)} ET</td></tr>
    </table>
    <p style="margin:14px 0 0 0;font-size:13px;color:#1f2430;">Action: contact customer within 24 hours to confirm rigging and schedule pickup or install.</p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#6b7280;">Open in admin: <a href="${appUrl}/admin/quotes" style="color:#0f2a43;">${appUrl}/admin/quotes</a></p>
  `;

  return buildAdminEmail({
    preheader: `${customerName} - ${motorLine} - $${depositAmount}`,
    heading: `${customerName} - ${motorLine} - $${depositAmount}`,
    bodyHtml: body,
    tag: "Deposit",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail, customerName, customerPhone, depositAmount,
      paymentId, motorInfo, sendAdminNotification, adminOnly, quotePdfPath, quoteUrl,
    }: DepositConfirmationRequest = await req.json();

    logStep("Processing deposit emails", { customerEmail, customerName, depositAmount, paymentId });

    const referenceNumber = generateReferenceNumber(paymentId);
    const motorLabel = getMotorLabel(motorInfo);

    let finalPdf: { content: string; filename: string } | null = null;
    if (quotePdfPath) {
      const pdfBytes = await downloadQuotePdf(quotePdfPath);
      if (pdfBytes) {
        finalPdf = { content: toBase64(pdfBytes), filename: `Quote-${referenceNumber}.pdf` };
      }
    }

    if (!adminOnly && customerEmail) {
      const emailHtml = createDepositConfirmationEmail(
        customerName, depositAmount, referenceNumber, motorLabel,
        paymentId || "", !!finalPdf, quoteUrl,
      );
      const customerSubject = motorLabel
        ? `Deposit received: your ${motorLabel} is reserved | Harris Boat Works`
        : `Deposit received: your motor is reserved | Harris Boat Works`;

      const attachments: Array<{ filename: string; content: string }> = [];
      if (finalPdf) attachments.push(finalPdf);

      const emailResponse = await resend.emails.send({
        from: "Harris Boat Works <deposits@mercuryrepower.ca>",
        replyTo: "info@harrisboatworks.ca",
        to: [customerEmail],
        subject: customerSubject,
        html: emailHtml,
        bcc: ["info@harrisboatworks.ca"],
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      logStep("Customer email sent", { id: emailResponse?.data?.id, attachments: attachments.length });
    }

    if (sendAdminNotification || adminOnly) {
      const adminHtml = createAdminNotificationEmail(
        customerName, customerEmail || "", customerPhone || "",
        depositAmount, referenceNumber, paymentId || "", motorInfo,
      );
      const attachments: Array<{ filename: string; content: string }> = [];
      if (finalPdf) attachments.push(finalPdf);

      const adminSubject = `[DEPOSIT] ${customerName} - ${motorLabel || "motor"} - $${depositAmount}`;

      const adminResponse = await resend.emails.send({
        from: "Harris Boat Works System <deposits@mercuryrepower.ca>",
        to: ADMIN_EMAILS,
        subject: adminSubject,
        html: adminHtml,
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      logStep("Admin notification sent", { id: adminResponse?.data?.id });
    }

    return new Response(JSON.stringify({ success: true, referenceNumber }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
