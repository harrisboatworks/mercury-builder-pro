import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface DepositConfirmationRequest {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: CustomerAddress;
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
  pricingData?: {
    basePrice?: number;
    finalPrice?: number;
    totalCost?: number;
    discountAmount?: number;
    quoteData?: any;
  };
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

function fmt(n: number): string {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Stamp deposit info onto existing quote PDF ──────────────────────────────

async function stampDepositOnQuotePdf(
  existingPdfBytes: Uint8Array,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerAddress: CustomerAddress | null,
  depositAmount: string,
  referenceNumber: string,
  paymentId: string,
  totalCashPrice: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(existingPdfBytes);
  const pages = doc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();
  
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const depositNum = parseFloat(depositAmount) || 0;
  const balanceDue = totalCashPrice > 0 ? totalCashPrice - depositNum : 0;
  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "long", day: "numeric" });

  // Colors matching the quote's navy theme
  const navy = rgb(0.118, 0.251, 0.686);    // #1e40af
  const green = rgb(0.02, 0.59, 0.41);
  const white = rgb(1, 1, 1);
  const darkGray = rgb(0.12, 0.16, 0.21);
  const gray = rgb(0.42, 0.44, 0.49);

  // Format address
  const addressParts: string[] = [];
  if (customerAddress?.line1) addressParts.push(customerAddress.line1);
  if (customerAddress?.line2) addressParts.push(customerAddress.line2);
  const cityLine: string[] = [];
  if (customerAddress?.city) cityLine.push(customerAddress.city);
  if (customerAddress?.state) cityLine.push(customerAddress.state);
  if (customerAddress?.postalCode) cityLine.push(customerAddress.postalCode);
  if (cityLine.length > 0) addressParts.push(cityLine.join(", "));

  // Determine banner height based on content
  const hasAddress = addressParts.length > 0;
  const bannerHeight = hasAddress ? 105 : 85;
  const bannerY = 50; // Just above the footer

  // Background
  page.drawRectangle({
    x: 0, y: bannerY, width, height: bannerHeight,
    color: rgb(0.96, 0.99, 0.96),
  });

  // Top accent line
  page.drawRectangle({
    x: 0, y: bannerY + bannerHeight - 3, width, height: 3, color: green,
  });

  // ── LEFT SIDE: Customer Info ──
  let leftY = bannerY + bannerHeight - 18;

  page.drawText("CUSTOMER", { x: 40, y: leftY, size: 8, font: helveticaBold, color: gray });
  leftY -= 13;
  page.drawText(customerName, { x: 40, y: leftY, size: 10, font: helveticaBold, color: darkGray });
  leftY -= 12;
  if (customerEmail) {
    page.drawText(customerEmail, { x: 40, y: leftY, size: 8, font: helvetica, color: darkGray });
    leftY -= 11;
  }
  if (customerPhone) {
    page.drawText(customerPhone, { x: 40, y: leftY, size: 8, font: helvetica, color: darkGray });
    leftY -= 11;
  }
  if (hasAddress) {
    for (const line of addressParts) {
      page.drawText(line, { x: 40, y: leftY, size: 8, font: helvetica, color: darkGray });
      leftY -= 11;
    }
  }

  // ── RIGHT SIDE: Deposit & Balance ──
  const rightX = width - 215;
  let rightY = bannerY + bannerHeight - 18;

  page.drawText("DEPOSIT CONFIRMED", { x: rightX, y: rightY, size: 10, font: helveticaBold, color: green });
  rightY -= 14;
  page.drawText(`Ref: ${referenceNumber}`, { x: rightX, y: rightY, size: 8, font: helvetica, color: darkGray });
  rightY -= 11;
  page.drawText(`Paid: ${dateStr}`, { x: rightX, y: rightY, size: 8, font: helvetica, color: darkGray });
  rightY -= 14;

  // Deposit paid row
  page.drawText("Deposit Paid:", { x: rightX, y: rightY, size: 9, font: helveticaBold, color: green });
  page.drawText(`-$${fmt(depositNum)}`, { x: rightX + 110, y: rightY, size: 9, font: helveticaBold, color: green });
  rightY -= 16;

  // Balance due box
  page.drawRectangle({ x: rightX - 5, y: rightY - 5, width: 210, height: 20, color: navy });
  page.drawText("BALANCE DUE:", { x: rightX, y: rightY, size: 9, font: helveticaBold, color: white });
  page.drawText(balanceDue > 0 ? `$${fmt(balanceDue)} CAD` : "PAID IN FULL", {
    x: rightX + 110, y: rightY, size: 9, font: helveticaBold, color: white,
  });

  // Small payment ID at very bottom of banner
  if (paymentId) {
    page.drawText(`Payment: ${paymentId}`, {
      x: 40, y: bannerY + 5, size: 6, font: helvetica, color: rgb(0.6, 0.6, 0.6),
    });
  }

  return await doc.save();
}

// ── Fallback: Generate standalone invoice if no quote PDF exists ─────────────

async function generateFallbackInvoicePdf(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  depositAmount: string,
  referenceNumber: string,
  paymentId: string,
  motorInfo?: { model?: string; hp?: number; year?: number },
  pricingData?: { basePrice?: number; finalPrice?: number; totalCost?: number; discountAmount?: number; quoteData?: any },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const navy = rgb(0.118, 0.251, 0.686);
  const blue = rgb(0, 0.49, 0.77);
  const darkGray = rgb(0.07, 0.09, 0.15);
  const gray = rgb(0.42, 0.44, 0.49);
  const green = rgb(0.02, 0.59, 0.41);
  const white = rgb(1, 1, 1);
  const lightBg = rgb(0.96, 0.97, 0.98);

  const depositNum = parseFloat(depositAmount) || 0;
  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "long", day: "numeric" });

  const qd = pricingData?.quoteData || {};
  const msrp = qd.pricing?.msrp || pricingData?.basePrice || 0;
  const discount = qd.pricing?.discount || pricingData?.discountAmount || 0;
  const adminDiscount = qd.pricing?.adminDiscount || 0;
  const promoValue = qd.pricing?.promoValue || 0;
  const subtotal = qd.pricing?.subtotal || 0;
  const hst = qd.pricing?.hst || 0;
  const totalCashPrice = qd.pricing?.totalCashPrice || pricingData?.totalCost || pricingData?.finalPrice || 0;
  const tradeInValue = qd.tradeInValue || 0;
  const balanceDue = totalCashPrice > 0 ? totalCashPrice - depositNum : 0;

  let y = height - 40;

  // Header
  page.drawRectangle({ x: 0, y: y - 15, width, height: 65, color: navy });
  page.drawText("HARRIS BOAT WORKS", { x: 40, y: y + 14, size: 22, font: helveticaBold, color: white });
  page.drawText("Authorized Mercury Marine Dealer", { x: 40, y: y - 4, size: 10, font: helvetica, color: rgb(0.63, 0.70, 0.80) });
  page.drawText("INVOICE", { x: width - 120, y: y + 14, size: 22, font: helveticaBold, color: white });
  y -= 90;

  page.drawText(`Reference: ${referenceNumber}`, { x: 40, y, size: 12, font: helveticaBold, color: blue });
  page.drawText(`Date: ${dateStr}`, { x: width - 220, y, size: 10, font: helvetica, color: gray });
  y -= 25;

  const drawSectionHeader = (label: string) => {
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: navy });
    page.drawText(label, { x: 50, y, size: 10, font: helveticaBold, color: white });
    y -= 28;
  };

  const drawRow = (label: string, value: string, opts?: { bold?: boolean; color?: any }) => {
    page.drawText(label, { x: 55, y, size: 9, font: helveticaBold, color: gray });
    page.drawText(value || "—", { x: 180, y, size: 9, font: opts?.bold ? helveticaBold : helvetica, color: opts?.color || darkGray });
    y -= 16;
  };

  drawSectionHeader("CUSTOMER INFORMATION");
  drawRow("Name", customerName, { bold: true });
  drawRow("Email", customerEmail);
  drawRow("Phone", customerPhone || "Not provided");
  y -= 6;

  drawSectionHeader("MOTOR DETAILS");
  const motorLine = motorInfo?.model ? `${motorInfo.year || 2025} Mercury ${motorInfo.model}` : "Motor — see quote";
  drawRow("Motor", motorLine, { bold: true });
  if (motorInfo?.hp) drawRow("Horsepower", `${motorInfo.hp} HP`);
  y -= 6;

  drawSectionHeader("PRICING BREAKDOWN");
  const drawPricingRow = (label: string, amount: number, opts?: { negative?: boolean; bold?: boolean; bg?: any }) => {
    if (opts?.bg) page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: opts.bg });
    page.drawText(label, { x: 55, y, size: 9, font: opts?.bold ? helveticaBold : helvetica, color: opts?.bold ? darkGray : gray });
    const prefix = opts?.negative ? "-$" : "$";
    const color = opts?.negative ? green : darkGray;
    page.drawText(`${prefix}${fmt(Math.abs(amount))}`, { x: width - 160, y, size: 9, font: opts?.bold ? helveticaBold : helvetica, color });
    y -= 18;
  };

  if (msrp > 0) drawPricingRow("MSRP", msrp);
  if (discount > 0) drawPricingRow("Dealer Discount", discount, { negative: true });
  if (adminDiscount > 0) drawPricingRow("Special Discount", adminDiscount, { negative: true });
  if (promoValue > 0) drawPricingRow("Promotional Savings", promoValue, { negative: true });
  if (tradeInValue > 0) drawPricingRow("Estimated Trade Value", tradeInValue, { negative: true });
  if (subtotal > 0) drawPricingRow("Subtotal", subtotal, { bold: true, bg: lightBg });
  if (hst > 0) drawPricingRow("HST (13%)", hst);

  if (totalCashPrice > 0) {
    page.drawRectangle({ x: 40, y: y - 5, width: width - 80, height: 22, color: navy });
    page.drawText("TOTAL PRICE", { x: 55, y: y - 1, size: 10, font: helveticaBold, color: white });
    page.drawText(`$${fmt(totalCashPrice)}`, { x: width - 160, y: y - 1, size: 10, font: helveticaBold, color: white });
    y -= 28;
  }
  y -= 6;

  drawSectionHeader("PAYMENT APPLIED");
  page.drawRectangle({ x: 40, y: y - 5, width: width - 80, height: 22, borderColor: green, borderWidth: 1.5, color: rgb(0.93, 0.99, 0.95) });
  page.drawText("[PAID] Deposit", { x: 55, y: y - 1, size: 10, font: helveticaBold, color: green });
  page.drawText(`-$${fmt(depositNum)}`, { x: width - 160, y: y - 1, size: 10, font: helveticaBold, color: green });
  y -= 28;

  drawRow("Payment ID", paymentId || "N/A");
  drawRow("Payment Date", dateStr);
  drawRow("Status", "Confirmed", { bold: true, color: green });
  y -= 6;

  page.drawRectangle({ x: 40, y: y - 6, width: width - 80, height: 26, color: navy });
  page.drawText("BALANCE DUE", { x: 55, y: y, size: 12, font: helveticaBold, color: white });
  page.drawText(balanceDue > 0 ? `$${fmt(balanceDue)} CAD` : "Paid in Full", { x: width - 200, y: y, size: 12, font: helveticaBold, color: white });
  y -= 38;

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 45, color: navy });
  page.drawText("Harris Boat Works  |  5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0  |  (905) 342-2153", {
    x: 40, y: 24, size: 8, font: helvetica, color: rgb(0.63, 0.70, 0.80),
  });
  page.drawText("info@harrisboatworks.ca  |  mercuryrepower.ca", {
    x: 40, y: 12, size: 8, font: helvetica, color: rgb(0.63, 0.70, 0.80),
  });

  return await doc.save();
}

// ── Download existing quote PDF from storage ────────────────────────────────

async function downloadQuotePdf(path: string): Promise<Uint8Array | null> {
  try {
    logStep("Downloading quote PDF from storage", { path });
    const { data, error } = await supabase.storage.from("quotes").download(path);
    if (error || !data) {
      logStep("WARNING: Could not download quote PDF", { error: error?.message });
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err: any) {
    logStep("WARNING: Exception downloading quote PDF", { error: err.message });
    return null;
  }
}

// ── Re-upload stamped PDF back to storage ───────────────────────────────────

async function uploadStampedPdf(path: string, pdfBytes: Uint8Array): Promise<boolean> {
  try {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const { error } = await supabase.storage.from("quotes").upload(path, blob, {
      upsert: true,
      contentType: "application/pdf",
    });
    if (error) {
      logStep("WARNING: Could not re-upload stamped PDF", { error: error.message });
      return false;
    }
    logStep("Stamped PDF re-uploaded to storage", { path });
    return true;
  } catch (err: any) {
    logStep("WARNING: Exception re-uploading stamped PDF", { error: err.message });
    return false;
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
    <p style="text-align:center;margin-top:16px;font-size:14px;color:#6b7280;">Your updated quote with deposit applied is attached.</p>
    <div style="background-color:#eff6ff;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e40af;margin:0 0 16px 0;font-size:18px;">What Happens Next</h3>
      <ul style="margin:0;padding-left:20px;">
        <li style="margin:8px 0;"><strong>Within 24-48 hours:</strong> We'll contact you to discuss delivery options.</li>
        <li style="margin:8px 0;"><strong>Rigging appointment:</strong> We'll schedule installation details if applicable.</li>
        <li style="margin:8px 0;"><strong>Balance payment:</strong> Remaining balance due upon delivery or pickup.</li>
      </ul>
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
    <p style="margin-top:16px;font-size:13px;color:#94a3b8;">The stamped quote PDF with deposit applied is attached.</p>
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
      customerEmail, customerName, customerPhone, customerAddress, depositAmount,
      paymentId, motorInfo, sendAdminNotification, adminOnly, quotePdfPath,
      pricingData,
    }: DepositConfirmationRequest = await req.json();

    logStep("Processing deposit emails", {
      customerEmail, customerName, customerPhone, customerAddress, depositAmount, paymentId, motorInfo,
      sendAdminNotification, adminOnly, quotePdfPath, hasPricingData: !!pricingData,
    });

    const referenceNumber = generateReferenceNumber(paymentId);
    const motorLabel = getMotorLabel(motorInfo);

    // Extract total for balance calculation
    const qd = pricingData?.quoteData || {};
    const totalCashPrice = qd.pricing?.totalCashPrice || pricingData?.totalCost || pricingData?.finalPrice || 0;

    // Strategy: Download existing quote PDF → stamp deposit info → re-upload → send
    let finalPdf: { content: string; filename: string } | null = null;

    if (quotePdfPath) {
      const existingPdfBytes = await downloadQuotePdf(quotePdfPath);
      if (existingPdfBytes) {
        try {
          logStep("Stamping deposit info onto existing quote PDF");
          const stampedBytes = await stampDepositOnQuotePdf(
            existingPdfBytes, customerName, customerEmail || "", customerPhone || "",
            customerAddress || null, depositAmount, referenceNumber, paymentId || "", totalCashPrice,
          );
          
          // Re-upload the stamped version to storage (overwrites original)
          await uploadStampedPdf(quotePdfPath, stampedBytes);
          
          finalPdf = {
            content: toBase64(stampedBytes),
            filename: `Invoice-${referenceNumber}.pdf`,
          };
          logStep("Quote PDF stamped with deposit info", { size: stampedBytes.length });
        } catch (stampErr: any) {
          logStep("WARNING: Stamping failed, falling back to standalone invoice", { error: stampErr.message });
        }
      }
    }

    // Fallback: generate a standalone invoice if no quote PDF was available or stamping failed
    if (!finalPdf) {
      logStep("No quote PDF available, generating standalone invoice");
      try {
        const fallbackBytes = await generateFallbackInvoicePdf(
          customerName, customerEmail || "", customerPhone || "",
          depositAmount, referenceNumber, paymentId || "", motorInfo, pricingData,
        );
        finalPdf = {
          content: toBase64(fallbackBytes),
          filename: `Invoice-${referenceNumber}.pdf`,
        };
        logStep("Fallback invoice PDF generated", { size: fallbackBytes.length });
      } catch (pdfErr: any) {
        logStep("WARNING: Fallback invoice generation also failed", { error: pdfErr.message });
      }
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
