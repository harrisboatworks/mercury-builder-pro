import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

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
  customerAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  depositAmount: string;
  paymentId?: string;
  motorInfo?: {
    model?: string;
    hp?: number;
    year?: number;
  };
  sendAdminNotification?: boolean;
  adminOnly?: boolean;
  quotePdfPath?: string;
  pricingData?: any;
}

const ADMIN_EMAILS = ["jayharris97@gmail.com", "harrisboatworks@hotmail.com"];

function logStep(step: string, data?: Record<string, unknown>) {
  console.log(`[DEPOSIT-EMAIL] ${step}`, data ? JSON.stringify(data) : "");
}

function generateReferenceNumber(paymentId?: string): string {
  if (paymentId) {
    return `HBW-${paymentId.slice(-8).toUpperCase()}`;
  }
  return `HBW-${Date.now().toString(36).toUpperCase()}`;
}

function getMotorLabel(motorInfo?: { model?: string; hp?: number; year?: number }): string {
  if (!motorInfo?.model) return "";
  return `${motorInfo.year || 2025} ${motorInfo.model}${motorInfo.hp ? ` ${motorInfo.hp}HP` : ""}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

// ── Download pre-generated deposit PDF from storage ────────────────────────

async function downloadQuotePdf(path: string): Promise<Uint8Array | null> {
  try {
    logStep("Downloading deposit PDF from storage", { path });
    const { data, error } = await supabase.storage.from("quotes").download(path);
    if (error || !data) {
      logStep("WARNING: Could not download PDF", { error: error?.message });
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err: any) {
    logStep("WARNING: Exception downloading PDF", { error: err.message });
    return null;
  }
}

// ── Email HTML Templates ────────────────────────────────────────────────────

function createDepositConfirmationEmail(
  customerName: string, depositAmount: string, referenceNumber: string,
  motorInfo?: { model?: string; hp?: number; year?: number }
): string {
  const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
  const motorDetails = motorInfo?.model
    ? `<div style="background-color:#f9fafb;border-left:4px solid #007DC5;padding:16px 20px;margin:24px 0;border-radius:8px;">
        <h3 style="margin:0 0 8px 0;color:#374151;font-size:14px;font-weight:600;">Motor Being Reserved:</h3>
        <p style="margin:4px 0;color:#1f2937;"><strong>${motorInfo.year || 2025} ${motorInfo.model}</strong></p>
        ${motorInfo.hp ? `<p style="margin:4px 0;color:#1f2937;">${motorInfo.hp} Horsepower</p>` : ""}
       </div>` : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
  <div style="background:linear-gradient(135deg,#007DC5 0%,#1e40af 100%);padding:24px 20px;text-align:center;">
    <div style="display:flex;align-items:center;justify-content:center;gap:30px;max-width:600px;margin:0 auto;">
      <img src="${appUrl}/email-assets/harris-logo.png" alt="Harris Boat Works" style="height:50px;width:auto;" />
      <img src="${appUrl}/email-assets/mercury-logo.png" alt="Mercury Marine" style="height:50px;width:auto;" />
    </div>
    <div style="color:#ffffff;font-size:14px;margin-top:12px;font-weight:500;">Authorized Mercury Marine Dealer • Go Boldly</div>
  </div>
  <div style="padding:40px 32px;color:#374151;line-height:1.6;">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">✓</div>
      <h2 style="margin:0;font-size:24px;">Deposit Confirmed!</h2>
    </div>
    <p>Hi ${customerName},</p>
    <p>Great news! Your deposit has been successfully processed. Your motor is now reserved!</p>
    <div style="font-size:28px;font-weight:700;color:#007DC5;font-family:'Courier New',monospace;text-align:center;padding:20px;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border-radius:12px;margin:24px 0;border:2px solid #007DC5;">Reference: ${referenceNumber}</div>
    <div style="font-size:36px;font-weight:700;color:#10b981;text-align:center;margin:16px 0;">$${depositAmount} CAD</div>
    ${motorDetails}
    <p style="text-align:center;margin-top:16px;font-size:14px;color:#6b7280;">Your professional quote with deposit confirmation is attached.</p>
    <div style="background-color:#eff6ff;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e40af;margin:0 0 16px 0;font-size:18px;">What Happens Next</h3>
      <ul style="margin:0;padding-left:20px;">
        <li style="margin:8px 0;"><strong>Within 24-48 hours:</strong> We'll contact you to discuss delivery options.</li>
        <li style="margin:8px 0;"><strong>Rigging appointment:</strong> We'll schedule installation details if applicable.</li>
        <li style="margin:8px 0;"><strong>Balance payment:</strong> Remaining balance due upon delivery or pickup.</li>
      </ul>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/my-quotes" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#007DC5 0%,#1e40af 100%);color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:600;">View My Quotes</a>
    </div>
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:8px;">
      <h4 style="margin:0 0 8px 0;color:#92400e;font-size:14px;">Refund Policy</h4>
      <p style="margin:0;color:#78350f;font-size:14px;">Fully refundable before delivery. Just give us a call.</p>
    </div>
    <p style="text-align:center;"><a href="tel:905-342-2153" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#007DC5 0%,#1e40af 100%);color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:600;">Call Us: (905) 342-2153</a></p>
    <p>Thank you for choosing Harris Boat Works!</p>
    <p>Best regards,<br><strong>The Harris Boat Works Team</strong></p>
  </div>
  <div style="background-color:#f9fafb;padding:32px 20px;text-align:center;border-top:1px solid #e5e7eb;">
    <div style="color:#6b7280;font-size:14px;line-height:1.8;">
      <strong>Harris Boat Works</strong><br>5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0<br>
      Phone: <a href="tel:905-342-2153" style="color:#007DC5;">(905) 342-2153</a> • Email: <a href="mailto:info@harrisboatworks.ca" style="color:#007DC5;">info@harrisboatworks.ca</a>
    </div>
  </div>
</div></body></html>`;
}

function createAdminNotificationEmail(
  customerName: string, customerEmail: string, customerPhone: string,
  depositAmount: string, referenceNumber: string, paymentId: string,
  motorInfo?: { model?: string; hp?: number; year?: number },
): string {
  const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
  const adminUrl = `${appUrl}/admin/quotes`;
  const now = new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" });
  const motorLine = getMotorLabel(motorInfo) || "Not specified";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#ffffff;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1e293b;color:white;padding:20px 24px;">
    <h1 style="margin:0;font-size:20px;">New Motor Deposit - ${motorLine}</h1>
    <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${now} ET</div>
  </div>
  <div style="padding:24px;">
    <div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:14px;color:#6b7280;">DEPOSIT AMOUNT</div>
      <p style="font-size:42px;font-weight:800;color:#059669;margin:0;">$${depositAmount}</p>
      <div style="font-size:14px;color:#6b7280;">CAD - Payment Confirmed</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;width:140px;">Customer</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;"><strong>${customerName}</strong></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;">Email</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;"><a href="mailto:${customerEmail}" style="color:#007DC5;">${customerEmail || "Not provided"}</a></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;">Phone</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">${customerPhone ? `<a href="tel:${customerPhone}" style="color:#007DC5;">${customerPhone}</a>` : "<em>Not provided</em>"}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;">Motor</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;"><strong>${motorLine}</strong></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;">Reference #</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;"><strong>${referenceNumber}</strong></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;">Stripe Payment</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-size:12px;">${paymentId || "N/A"}</td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${adminUrl}" style="display:inline-block;padding:14px 32px;background:#007DC5;color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:600;">View in Admin Dashboard</a>
    </div>
    <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-top:16px;">
      <strong style="color:#92400e;">Action Required</strong>
      <p style="margin:8px 0 0;font-size:14px;color:#78350f;">Contact this customer within 24-48 hours to discuss delivery options and remaining balance.</p>
    </div>
    <p style="margin-top:16px;font-size:13px;color:#94a3b8;">The professional quote PDF with deposit confirmation is attached.</p>
  </div>
  <div style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
    Automated notification from Harris Boat Works deposit system.
  </div>
</div></body></html>`;
}

// ── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail, customerName, customerPhone, depositAmount,
      paymentId, motorInfo, sendAdminNotification, adminOnly, quotePdfPath,
    }: DepositConfirmationRequest = await req.json();

    logStep("Processing deposit emails", {
      customerEmail, customerName, depositAmount, paymentId, motorInfo,
      sendAdminNotification, adminOnly, quotePdfPath,
    });

    const referenceNumber = generateReferenceNumber(paymentId);
    const motorLabel = getMotorLabel(motorInfo);

    // Simply download the pre-generated professional PDF from storage
    // No more pdf-lib stamping or fallback invoice generation
    let finalPdf: { content: string; filename: string } | null = null;

    if (quotePdfPath) {
      const pdfBytes = await downloadQuotePdf(quotePdfPath);
      if (pdfBytes) {
        finalPdf = {
          content: toBase64(pdfBytes),
          filename: `Quote-${referenceNumber}.pdf`,
        };
        logStep("Professional deposit PDF loaded from storage", { size: pdfBytes.length });
      }
    }

    if (!finalPdf) {
      logStep("WARNING: No deposit PDF available - email will be sent without attachment");
    }

    // Send customer confirmation email (unless admin-only)
    if (!adminOnly && customerEmail) {
      const emailHtml = createDepositConfirmationEmail(customerName, depositAmount, referenceNumber, motorInfo);
      const customerSubject = motorLabel
        ? `Deposit Confirmed - ${motorLabel} - Ref ${referenceNumber}`
        : `Deposit Confirmed - Ref ${referenceNumber}`;
      const customerAttachments: Array<{ filename: string; content: string }> = [];
      if (finalPdf) customerAttachments.push(finalPdf);

      const emailResponse = await resend.emails.send({
        from: "Harris Boat Works <deposits@hbwsales.ca>",
        to: [customerEmail],
        subject: customerSubject,
        html: emailHtml,
        bcc: ["info@harrisboatworks.ca"],
        ...(customerAttachments.length > 0 ? { attachments: customerAttachments } : {}),
      });
      logStep("Customer email sent", { emailResponse, attachments: customerAttachments.length });
    }

    // Send admin notification email
    if (sendAdminNotification || adminOnly) {
      const adminHtml = createAdminNotificationEmail(
        customerName, customerEmail || "", customerPhone || "",
        depositAmount, referenceNumber, paymentId || "", motorInfo,
      );

      const attachments: Array<{ filename: string; content: string }> = [];
      if (finalPdf) attachments.push(finalPdf);

      const adminSubject = motorLabel
        ? `NEW DEPOSIT $${depositAmount} - ${motorLabel} - ${customerName}`
        : `NEW DEPOSIT $${depositAmount} - ${customerName}`;

      const adminResponse = await resend.emails.send({
        from: "Harris Boat Works System <deposits@hbwsales.ca>",
        to: ADMIN_EMAILS,
        subject: adminSubject,
        html: adminHtml,
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      logStep("Admin notification sent", { adminResponse, attachmentCount: attachments.length });
    }

    return new Response(JSON.stringify({ success: true, referenceNumber }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR: Failed to send email", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
