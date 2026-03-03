import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DepositConfirmationRequest {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  depositAmount: string;
  paymentId?: string;
  motorInfo?: {
    model?: string;
    hp?: number;
    year?: number;
  };
  sendAdminNotification?: boolean;
  adminOnly?: boolean;
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

// ── PDF Generation ──────────────────────────────────────────────────────────

async function generateDepositPdf(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  depositAmount: string,
  referenceNumber: string,
  paymentId: string,
  motorInfo?: { model?: string; hp?: number; year?: number },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter size
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  const blue = rgb(0, 0.49, 0.77);   // #007DC5
  const darkGray = rgb(0.15, 0.15, 0.15);
  const gray = rgb(0.4, 0.4, 0.4);
  const green = rgb(0.02, 0.59, 0.41);
  const white = rgb(1, 1, 1);
  const lightBg = rgb(0.96, 0.97, 0.98);

  let y = height - 50;

  // ── Header band ──
  page.drawRectangle({ x: 0, y: y - 10, width: 612, height: 60, color: blue });
  page.drawText("HARRIS BOAT WORKS", { x: 40, y: y + 12, size: 20, font: helveticaBold, color: white });
  page.drawText("Authorized Mercury Marine Dealer", { x: 40, y: y - 6, size: 10, font: helvetica, color: rgb(0.85, 0.92, 1) });
  y -= 90;

  // ── Title ──
  page.drawText("DEPOSIT RECEIPT", { x: 40, y, size: 22, font: helveticaBold, color: darkGray });
  y -= 18;
  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "long", day: "numeric" });
  page.drawText(dateStr, { x: 40, y, size: 10, font: helvetica, color: gray });
  y -= 10;

  // ── Reference + Amount banner ──
  y -= 10;
  page.drawRectangle({ x: 40, y: y - 50, width: 532, height: 55, color: lightBg });
  page.drawText(`Reference: ${referenceNumber}`, { x: 55, y: y - 18, size: 14, font: helveticaBold, color: blue });
  page.drawText(`Amount Paid: $${depositAmount} CAD`, { x: 55, y: y - 38, size: 14, font: helveticaBold, color: green });
  y -= 75;

  // ── Customer Details section ──
  const drawSectionHeader = (label: string) => {
    page.drawRectangle({ x: 40, y: y - 4, width: 532, height: 22, color: blue });
    page.drawText(label, { x: 50, y: y, size: 11, font: helveticaBold, color: white });
    y -= 28;
  };

  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: 55, y, size: 10, font: helveticaBold, color: gray });
    page.drawText(value || "Not provided", { x: 200, y, size: 10, font: helvetica, color: darkGray });
    y -= 18;
  };

  drawSectionHeader("CUSTOMER INFORMATION");
  drawRow("Name", customerName);
  drawRow("Email", customerEmail || "Not provided");
  drawRow("Phone", customerPhone || "Not provided");
  y -= 10;

  // ── Motor Details ──
  drawSectionHeader("MOTOR DETAILS");
  const motorLine = motorInfo?.model
    ? `${motorInfo.year || 2025} ${motorInfo.model}`
    : "Not specified";
  drawRow("Motor", motorLine);
  if (motorInfo?.hp) drawRow("Horsepower", `${motorInfo.hp} HP`);
  y -= 10;

  // ── Payment Details ──
  drawSectionHeader("PAYMENT DETAILS");
  drawRow("Deposit Amount", `$${depositAmount} CAD`);
  drawRow("Payment Status", "Confirmed");
  drawRow("Payment ID", paymentId || "N/A");
  drawRow("Payment Date", dateStr);
  y -= 20;

  // ── Next Steps box ──
  page.drawRectangle({ x: 40, y: y - 80, width: 532, height: 85, color: rgb(0.94, 0.97, 1) });
  page.drawText("NEXT STEPS", { x: 55, y: y - 8, size: 11, font: helveticaBold, color: blue });
  page.drawText("• Contact customer within 24-48 hours to discuss delivery options.", { x: 55, y: y - 26, size: 9, font: helvetica, color: darkGray });
  page.drawText("• Schedule rigging appointment if applicable.", { x: 55, y: y - 40, size: 9, font: helvetica, color: darkGray });
  page.drawText("• Remaining balance due upon delivery or pickup.", { x: 55, y: y - 54, size: 9, font: helvetica, color: darkGray });
  page.drawText("• Deposit is fully refundable before delivery.", { x: 55, y: y - 68, size: 9, font: helvetica, color: darkGray });
  y -= 110;

  // ── Footer ──
  page.drawText("Harris Boat Works  •  5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0  •  (905) 342-2153", {
    x: 40, y: 40, size: 8, font: helvetica, color: gray,
  });
  page.drawText("info@harrisboatworks.ca  •  mercuryrepower.ca", {
    x: 40, y: 28, size: 8, font: helvetica, color: gray,
  });

  return await doc.save();
}

// ── Email HTML Templates ────────────────────────────────────────────────────

function createDepositConfirmationEmail(
  customerName: string,
  depositAmount: string,
  referenceNumber: string,
  motorInfo?: { model?: string; hp?: number; year?: number }
): string {
  const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
  const motorDetails = motorInfo?.model
    ? `<div style="background-color:#f9fafb;border-left:4px solid #007DC5;padding:16px 20px;margin:24px 0;border-radius:8px;">
        <h3 style="margin:0 0 8px 0;color:#374151;font-size:14px;font-weight:600;">Motor Being Reserved:</h3>
        <p style="margin:4px 0;color:#1f2937;"><strong>${motorInfo.year || 2025} ${motorInfo.model}</strong></p>
        ${motorInfo.hp ? `<p style="margin:4px 0;color:#1f2937;">${motorInfo.hp} Horsepower</p>` : ""}
       </div>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Deposit Confirmation</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
  <div style="background:linear-gradient(135deg,#007DC5 0%,#1e40af 100%);padding:24px 20px;text-align:center;">
    <div style="display:flex;align-items:center;justify-content:center;gap:30px;max-width:600px;margin:0 auto;">
      <img src="${appUrl}/email-assets/harris-logo.png" alt="Harris Boat Works" style="height:50px;width:auto;" />
      <img src="${appUrl}/email-assets/mercury-logo.png" alt="Mercury Marine" style="height:50px;width:auto;" />
    </div>
    <div style="color:#ffffff;font-size:14px;margin-top:12px;font-weight:500;letter-spacing:0.5px;">Authorized Mercury Marine Dealer • Go Boldly</div>
  </div>
  <div style="padding:40px 32px;color:#374151;line-height:1.6;">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">✓</div>
      <h2 style="margin:0;font-size:24px;">Deposit Confirmed!</h2>
    </div>
    <p>Hi ${customerName},</p>
    <p>Great news! Your deposit has been successfully processed. Your motor is now reserved and we're excited to help you get on the water!</p>
    <div style="font-size:28px;font-weight:700;color:#007DC5;font-family:'Courier New',monospace;text-align:center;padding:20px;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border-radius:12px;margin:24px 0;border:2px solid #007DC5;">Reference: ${referenceNumber}</div>
    <div style="font-size:36px;font-weight:700;color:#10b981;text-align:center;margin:16px 0;">$${depositAmount} CAD</div>
    ${motorDetails}
    <div style="background-color:#eff6ff;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e40af;margin:0 0 16px 0;font-size:18px;">📋 What Happens Next</h3>
      <ul style="margin:0;padding-left:20px;">
        <li style="margin:8px 0;color:#374151;"><strong>Within 24-48 hours:</strong> A member of our team will contact you to discuss delivery options and finalize your order.</li>
        <li style="margin:8px 0;color:#374151;"><strong>Rigging appointment:</strong> We'll schedule a time to discuss installation details if applicable.</li>
        <li style="margin:8px 0;color:#374151;"><strong>Balance payment:</strong> The remaining balance will be due upon delivery or pickup.</li>
      </ul>
    </div>
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:8px;">
      <h4 style="margin:0 0 8px 0;color:#92400e;font-size:14px;">💰 Refund Policy</h4>
      <p style="margin:0;color:#78350f;font-size:14px;">Your deposit is fully refundable if you change your mind before delivery. Just give us a call and we'll process your refund promptly.</p>
    </div>
    <p style="text-align:center;"><a href="tel:905-342-2153" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#007DC5 0%,#1e40af 100%);color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:600;margin:24px 0;text-align:center;">Call Us: (905) 342-2153</a></p>
    <p>Thank you for choosing Harris Boat Works. We look forward to serving you!</p>
    <p>Best regards,<br><strong>The Harris Boat Works Team</strong></p>
  </div>
  <div style="background-color:#f9fafb;padding:32px 20px;text-align:center;border-top:1px solid #e5e7eb;">
    <div style="color:#6b7280;font-size:14px;line-height:1.8;">
      <strong>Harris Boat Works</strong><br>
      5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0<br>
      Phone: <a href="tel:905-342-2153" style="color:#007DC5;text-decoration:none;">(905) 342-2153</a><br>
      Email: <a href="mailto:info@harrisboatworks.ca" style="color:#007DC5;text-decoration:none;">info@harrisboatworks.ca</a>
    </div>
    <div style="height:1px;background-color:#e5e7eb;margin:24px 0;"></div>
    <p style="font-size:12px;color:#9ca3af;margin-top:16px;">You received this email because you made a deposit payment at Harris Boat Works. Keep this email as your receipt.</p>
  </div>
</div></body></html>`;
}

function createAdminNotificationEmail(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  depositAmount: string,
  referenceNumber: string,
  paymentId: string,
  motorInfo?: { model?: string; hp?: number; year?: number },
): string {
  const appUrl = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";
  const adminUrl = `${appUrl}/admin/quotes`;
  const now = new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" });
  const motorLine = motorInfo?.model
    ? `${motorInfo.year || 2025} ${motorInfo.model}${motorInfo.hp ? ` (${motorInfo.hp}HP)` : ""}`
    : "Not specified";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Deposit Received</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#ffffff;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1e293b;color:white;padding:20px 24px;">
    <h1 style="margin:0;font-size:20px;">🚨 New Motor Deposit Received</h1>
    <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${now} ET</div>
  </div>
  <div style="padding:24px;">
    <div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:14px;color:#6b7280;">DEPOSIT AMOUNT</div>
      <p style="font-size:42px;font-weight:800;color:#059669;margin:0;">$${depositAmount}</p>
      <div style="font-size:14px;color:#6b7280;">CAD • Payment Confirmed</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#64748b;width:140px;">Customer</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;"><strong>${customerName}</strong></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#64748b;width:140px;">Email</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;"><a href="mailto:${customerEmail}" style="color:#007DC5;text-decoration:none;">${customerEmail || "Not provided"}</a></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#64748b;width:140px;">Phone</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${customerPhone ? `<a href="tel:${customerPhone}" style="color:#007DC5;text-decoration:none;">${customerPhone}</a>` : "<em>Not provided</em>"}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#64748b;width:140px;">Motor Interest</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${motorLine}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#64748b;width:140px;">Reference #</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;"><strong>${referenceNumber}</strong></td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#64748b;width:140px;">Stripe Payment</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;font-family:monospace;font-size:12px;">${paymentId || "N/A"}</td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${adminUrl}" style="display:inline-block;padding:14px 32px;background:#007DC5;color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View in Admin Dashboard →</a>
    </div>
    <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-top:16px;">
      <strong style="color:#92400e;">⚡ Action Required</strong>
      <p style="margin:8px 0 0;font-size:14px;color:#78350f;">Contact this customer within 24-48 hours to discuss their motor selection, delivery options, and remaining balance.</p>
    </div>
    <p style="margin-top:16px;font-size:13px;color:#94a3b8;">📎 A PDF deposit receipt is attached to this email.</p>
  </div>
  <div style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
    This is an automated notification from Harris Boat Works deposit system.
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
      paymentId, motorInfo, sendAdminNotification, adminOnly,
    }: DepositConfirmationRequest = await req.json();

    logStep("Processing deposit emails", {
      customerEmail, customerName, customerPhone, depositAmount, paymentId, motorInfo,
      sendAdminNotification, adminOnly,
    });

    const referenceNumber = generateReferenceNumber(paymentId);

    // Send customer confirmation email (unless admin-only)
    if (!adminOnly && customerEmail) {
      const emailHtml = createDepositConfirmationEmail(customerName, depositAmount, referenceNumber, motorInfo);
      const emailResponse = await resend.emails.send({
        from: "Harris Boat Works <deposits@hbwsales.ca>",
        to: [customerEmail],
        subject: `Deposit Confirmed - Ref ${referenceNumber}`,
        html: emailHtml,
        bcc: ["info@harrisboatworks.ca"],
      });
      logStep("Customer email sent", { emailResponse });
    }

    // Send admin notification email with PDF attachment
    if (sendAdminNotification || adminOnly) {
      const adminHtml = createAdminNotificationEmail(
        customerName, customerEmail || "", customerPhone || "",
        depositAmount, referenceNumber, paymentId || "", motorInfo,
      );

      // Generate PDF receipt
      let pdfAttachment: { filename: string; content: string } | undefined;
      try {
        const pdfBytes = await generateDepositPdf(
          customerName, customerEmail || "", customerPhone || "",
          depositAmount, referenceNumber, paymentId || "", motorInfo,
        );
        // Resend expects base64 content for attachments
        const base64 = btoa(String.fromCharCode(...pdfBytes));
        pdfAttachment = {
          filename: `Deposit-Receipt-${referenceNumber}.pdf`,
          content: base64,
        };
        logStep("PDF generated successfully", { size: pdfBytes.length });
      } catch (pdfErr: any) {
        logStep("WARNING: PDF generation failed, sending without attachment", { error: pdfErr.message });
      }

      const adminResponse = await resend.emails.send({
        from: "Harris Boat Works System <deposits@hbwsales.ca>",
        to: ADMIN_EMAILS,
        subject: `🚨 NEW DEPOSIT $${depositAmount} — ${customerName}`,
        html: adminHtml,
        ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
      });
      logStep("Admin notification sent", { adminResponse });
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
