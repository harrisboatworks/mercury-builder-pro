import { buildAdminEmail, buildEmail, detailsCard, esc } from "./email-layout.ts";
import { adminDealPacketPath, formatStableDepositEmailDate, formatStableDepositEmailTime } from "./deposit-email-deliveries.ts";
import {
  customerPolicyText,
  fulfilmentText,
  purchasePathLabel,
  remainingBalance,
  stockStatusLabel,
  unavailableField,
  formatDealMoney,
  type DepositPolicySnapshot,
} from "./deposit-policy.ts";

const GROK_SUMMARY_SCHEMA = "deposit-grok-summary/v1";

export type DepositCustomerEmailInput = {
  customerName: string;
  depositAmount: string;
  referenceNumber: string;
  motorLabel: string;
  paidAt: string;
  policy: DepositPolicySnapshot | null;
};

export type DepositInternalEmailInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  depositAmount: string;
  quoteTotal: unknown;
  remainingBalance: unknown;
  referenceNumber: string;
  paymentId: string;
  sessionId: string;
  savedQuoteId: string;
  customerQuoteId: string;
  motorLabel: string;
  paidAt?: string | null;
  policy: DepositPolicySnapshot | null;
  appUrl: string;
};

function formatInternalDealPaidTime(paidAt: unknown): string {
  if (typeof paidAt !== "string" || !paidAt.trim() || !Number.isFinite(Date.parse(paidAt))) {
    return "Not available";
  }
  return `${formatStableDepositEmailTime(paidAt)} ET`;
}

export function customerDepositEmailSubject(motorLabel: string): string {
  return motorLabel
    ? `Deposit received: ${motorLabel} | Harris Boat Works`
    : "Deposit received | Harris Boat Works";
}

export function hbwDepositEmailSubject(customerName: string, motorLabel: string, depositAmount: string): string {
  return `[PAID DEPOSIT] ${customerName} - ${motorLabel || "motor"} - $${depositAmount}`;
}

function policySummary(
  policy: DepositPolicySnapshot | null,
  audience: "customer" | "internal" = "internal",
): { stock: string; policy: string; path: string; next: string } {
  if (!policy) {
    return {
      stock: "Not available",
      policy: "Not available",
      path: "Not available",
      next: audience === "customer"
        ? "HBW will contact you within one business day about next steps. HBW does not pick up or deliver customer boats."
        : "Contact the customer within one business day. Confirm details from the admin deal packet.",
    };
  }
  return {
    stock: stockStatusLabel(policy.stockClassification),
    policy: customerPolicyText(policy.policyCode),
    path: purchasePathLabel(policy.purchasePath),
    next: fulfilmentText(policy.purchasePath),
  };
}

export function createDepositConfirmationEmailHtml(input: DepositCustomerEmailInput): string {
  const dateStr = formatStableDepositEmailDate(input.paidAt);
  const summary = policySummary(input.policy, "customer");
  const rows: Array<{ label: string; value: string }> = [];
  if (input.motorLabel) rows.push({ label: "Motor", value: esc(input.motorLabel) });
  rows.push({ label: "Deposit", value: `$${esc(input.depositAmount)} CAD` });
  rows.push({ label: "Deposit reference", value: esc(input.referenceNumber) });
  rows.push({ label: "Stock", value: esc(summary.stock) });
  rows.push({ label: "Date", value: esc(dateStr) });

  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(input.customerName)},</p>
    <p style="margin:0 0 14px 0;">We received your deposit${input.motorLabel ? ` for your ${esc(input.motorLabel)}` : ""}. HBW will confirm the exact motor, availability and ETA with you before anything is ordered.</p>
    ${detailsCard(rows)}
    <div style="margin:18px 0 0 0;padding:14px 16px;border:1px solid #d7dee8;background:#f7f4ee;border-radius:6px;color:#1f2430;font-size:14px;line-height:1.55;">${esc(summary.policy)}</div>
    <h2 style="margin:28px 0 12px 0;font-size:16px;font-weight:700;color:#1f2430;">What happens next</h2>
    <ol style="margin:0;padding-left:20px;color:#1f2430;">
      <li style="margin:0 0 8px 0;">We call you within one business day to confirm the exact motor, availability, ETA, and any fit questions.</li>
      <li style="margin:0 0 8px 0;">${esc(summary.next)}</li>
    </ol>
    <p style="margin:16px 0 0 0;font-size:14px;color:#6b7280;">Your PDF quote is attached to this email.</p>
    <p style="margin:22px 0 0 0;">Questions? Reply to this email or call us at <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    <p style="margin:16px 0 0 0;">Thanks for choosing Harris Boat Works.</p>
  `;

  return buildEmail({
    preheader: `Deposit received. HBW will confirm ${input.motorLabel || "the motor"} and next steps.`,
    heading: "We received your deposit",
    bodyHtml: body,
    transactionalFooter: true,
  });
}

function dealPacketUrl(appUrl: string, savedQuoteId: string): string {
  const base = appUrl.replace(/\/$/, "") || "https://mercuryrepower.ca";
  return `${base}${adminDealPacketPath(savedQuoteId)}`;
}

export function createInternalDealEmailHtml(input: DepositInternalEmailInput): string {
  const paidTime = formatInternalDealPaidTime(input.paidAt);
  const summary = policySummary(input.policy);
  const packetUrl = input.savedQuoteId ? dealPacketUrl(input.appUrl, input.savedQuoteId) : "";
  const quoteTotal = formatDealMoney(input.quoteTotal);
  const balance = remainingBalance(input.quoteTotal, input.depositAmount);
  const row = (label: string, value: string, extra = "") =>
    `<tr><td style="padding:6px 0;color:#6b7280;width:140px;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#1f2430;${extra}">${value}</td></tr>`;

  const body = `
    <p style="margin:0 0 12px 0;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c8102e;">PAID deposit. PDF attached.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
      ${row("Customer", esc(unavailableField(input.customerName)), "font-weight:600;")}
      ${row("Email", input.customerEmail ? `<a href="mailto:${esc(input.customerEmail)}" style="color:#0f2a43;">${esc(input.customerEmail)}</a>` : "Not available")}
      ${row("Phone", input.customerPhone ? `<a href="tel:${esc(input.customerPhone)}" style="color:#0f2a43;">${esc(input.customerPhone)}</a>` : "Not available")}
      ${row("Address", `<span style="white-space:pre-line;">${esc(unavailableField(input.customerAddress))}</span>`)}
      ${row("Motor", esc(unavailableField(input.motorLabel)), "font-weight:600;")}
      ${row("Stock / policy", esc(`${summary.stock}. ${summary.policy}`))}
      ${row("Purchase path", esc(summary.path))}
      ${row("Quote total", esc(quoteTotal))}
      ${row("Deposit", `$${esc(input.depositAmount)} CAD`, "font-weight:700;")}
      ${row("Remaining", esc(balance))}
      ${row("Deposit reference", esc(unavailableField(input.referenceNumber)))}
      ${row("Stripe PI", `<span style="font-family:monospace;font-size:12px;">${esc(unavailableField(input.paymentId))}</span>`)}
      ${row("Stripe session", `<span style="font-family:monospace;font-size:12px;">${esc(unavailableField(input.sessionId))}</span>`)}
      ${row("Time", esc(paidTime))}
    </table>
    <p style="margin:14px 0 0 0;font-size:13px;color:#1f2430;">Follow up within one business day. The admin deal packet is the source of truth. Do not invent missing totals.</p>
    ${packetUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" style="margin:18px 0 8px 0;">
      <tr><td bgcolor="#0f2a43" style="border-radius:3px;">
        <a href="${esc(packetUrl)}" style="display:inline-block;padding:12px 22px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Open Deal Packet</a>
      </td></tr>
    </table>
    <p style="margin:10px 0 0 0;font-size:12px;color:#6b7280;clear:both;">Or paste this link: <a href="${esc(packetUrl)}" style="color:#0f2a43;">${esc(packetUrl)}</a></p>
    ` : `<p style="margin:14px 0 0 0;font-size:12px;color:#6b7280;">Deal packet URL: Not available</p>`}
  `;

  return buildAdminEmail({
    preheader: `PAID deposit ${input.customerName} ${input.motorLabel} $${input.depositAmount}`,
    heading: `${input.customerName} - ${input.motorLabel || "motor"} - $${input.depositAmount}`,
    bodyHtml: body,
    tag: "PAID DEPOSIT",
  });
}

export function grokDepositStructuredSummary(input: DepositInternalEmailInput): string {
  const summary = policySummary(input.policy);
  const lines = [
    `schema: ${GROK_SUMMARY_SCHEMA}`,
    `saved_quote_id: ${unavailableField(input.savedQuoteId)}`,
    `customer_quote_id: ${unavailableField(input.customerQuoteId)}`,
    `policy_code: ${input.policy?.policyCode || "Not available"}`,
    `stock_classification: ${input.policy?.stockClassification || "Not available"}`,
    `purchase_path: ${input.policy?.purchasePath || "Not available"}`,
    `payment_status: paid`,
    `amount: ${input.depositAmount || "Not available"}`,
    `reference: ${unavailableField(input.referenceNumber)}`,
    `stripe_payment_intent: ${unavailableField(input.paymentId)}`,
    `stripe_checkout_session: ${unavailableField(input.sessionId)}`,
    `customer_name: ${unavailableField(input.customerName)}`,
    `customer_email: ${unavailableField(input.customerEmail)}`,
    `customer_phone: ${unavailableField(input.customerPhone)}`,
    `customer_address: ${unavailableField(input.customerAddress).replace(/\n/g, ", ")}`,
    `motor: ${unavailableField(input.motorLabel)}`,
    `quote_total: ${formatDealMoney(input.quoteTotal)}`,
    `remaining_balance: ${remainingBalance(input.quoteTotal, input.depositAmount)}`,
    `stock_label: ${summary.stock}`,
    `next_action: contact_within_one_business_day`,
    `admin_url: ${input.savedQuoteId ? dealPacketUrl(input.appUrl, input.savedQuoteId) : "Not available"}`,
  ];
  return lines.join("\n");
}

export function createGrokDealEmailHtml(input: DepositInternalEmailInput): string {
  const summary = policySummary(input.policy);
  const structured = grokDepositStructuredSummary(input);
  const body = `
    <p style="margin:0 0 10px 0;font-weight:700;">PAID deposit. Canonical PDF attached.</p>
    <p style="margin:0 0 10px 0;">${esc(input.customerName)} reserved ${esc(unavailableField(input.motorLabel))} with a $${esc(input.depositAmount)} CAD deposit. Stock: ${esc(summary.stock)}. Path: ${esc(summary.path)}.</p>
    <p style="margin:0 0 12px 0;">Next action: contact the customer within one business day. Admin packet is the source of truth.</p>
    <pre style="margin:0;padding:12px;background:#f4f5f7;border:1px solid #e5e0d6;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;white-space:pre-wrap;">${esc(structured)}</pre>
  `;
  return buildAdminEmail({
    preheader: `PAID deposit structured summary ${input.referenceNumber}`,
    heading: `Deposit packet ${input.referenceNumber || input.savedQuoteId}`,
    bodyHtml: body,
    tag: "GROK",
  });
}
