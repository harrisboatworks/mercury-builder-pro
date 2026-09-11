import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  QUOTE_EMAIL_DELIVERY_READ_RPC,
} from "../admin-quote-email";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("admin quote email sender contracts", () => {
  it("supplies a stable admin key and a separate deliberate resend control", () => {
    const sender = read("src/components/admin/SendQuoteEmail.tsx");

    expect(sender).toContain("mintAdminQuoteEmailIdempotencyKey");
    expect(sender).toContain("idempotencyKey:");
    expect(sender).toContain("handleSend('send')");
    expect(sender).toContain("handleSend('resend')");
    expect(sender).toContain("Send again");
    expect(sender).toContain("another copy");
    expect(sender).toContain("quoteNumber: adminQuoteEmailRef(quoteId)");
    expect(sender).toContain("quotePageUrl: `${SITE_URL}/quote/saved/${quoteId}`");
    expect(sender).toContain("interpretAdminQuoteEmailSendResult(invokeResult)");
    expect(sender).toContain("describeAdminQuoteEmailSendVerdict(verdict, intent)");
    expect(sender).toContain("functions.invoke('admin-consultation-document'");
    expect(sender).toContain("emailIntent: intent");
    expect(sender).not.toContain("pdfUrl:");
    expect(sender).not.toContain("bucketMs");
    expect(sender).not.toContain("Date.now");
    expect(sender).not.toContain("Math.floor");
    expect(sender).not.toContain("result?.success === false");
    expect(sender).not.toContain("result?.duplicate");
  });

  it("keeps Email Quote as the primary action and Send again behind a confirm", () => {
    const sender = read("src/components/admin/SendQuoteEmail.tsx");
    const emailQuoteAt = sender.indexOf("{sent ? 'Sent!' : 'Email Quote'}");
    const sendAgainCopyAt = sender.indexOf("Send again emails the customer");
    const confirmAt = sender.indexOf("The customer will receive another copy of this quote email.");

    expect(emailQuoteAt).toBeGreaterThan(-1);
    expect(sendAgainCopyAt).toBeGreaterThan(emailQuoteAt);
    expect(confirmAt).toBeGreaterThan(sendAgainCopyAt);
    expect(sender).toContain("<AlertDialog>");
    expect(sender).toContain("Send another copy");
    expect(sender.indexOf("handleSend('send')")).toBeLessThan(sender.indexOf("handleSend('resend')"));
  });
});

describe("admin quote email history contracts", () => {
  it("reads deliveries by full quote_id through the admin RPC and fails closed in the strip", () => {
    const history = read("src/components/admin/QuoteEmailDeliveryHistory.tsx");
    const page = read("src/pages/AdminQuoteDetail.tsx");
    const migration = read("supabase/migrations/20260815160000_quote_email_delivery_audit.sql");
    const helper = read("src/lib/admin-quote-email.ts");
    const delivery = read("supabase/functions/_shared/quote-email-delivery.ts");

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_quote_email_deliveries_v1(_quote_id uuid)");
    expect(migration).toContain("WHERE quote_id = _quote_id");
    expect(migration).toContain("AND public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(migration).toContain("REVOKE ALL ON TABLE public.quote_email_deliveries FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("ORDER BY created_at DESC");
    expect(migration).not.toContain("WHERE quote_number = _quote_number");
    expect(migration).not.toContain("get_quote_email_deliveries_v1(_quote_number text)");

    expect(history).toContain("fetchAdminQuoteEmailDeliveries");
    expect(history).toContain("ADMIN_QUOTE_EMAIL_HISTORY_SCOPE");
    expect(history).toContain("ADMIN_QUOTE_EMAIL_HISTORY_EMPTY");
    expect(history).toContain("ADMIN_QUOTE_EMAIL_HISTORY_UNAVAILABLE");
    expect(history).toContain("sortQuoteEmailDeliveriesNewestFirst(rows)");
    expect(history).toContain("presentQuoteEmailDelivery");
    expect(history).not.toContain("customerEmail");
    expect(history).not.toContain("To:");
    expect(history).not.toContain("no emails sent yet");
    expect(history).not.toContain("recipient_sha256");
    expect(history).not.toContain(".from('quote_email_deliveries')");
    expect(history).not.toContain("customer_quotes");
    expect(history).not.toContain("resolveQuoteEmailDisplayRecipient");

    expect(helper).toContain("return quoteId.slice(0, 8).toUpperCase()");
    expect(helper).toContain(`export const QUOTE_EMAIL_DELIVERY_READ_RPC = "${QUOTE_EMAIL_DELIVERY_READ_RPC}"`);
    expect(helper).toContain("Do not select the table.");
    expect(delivery).toContain("`${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${quoteId}:${emailType}`");
    expect(delivery).toContain("`${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${quoteId}:${emailType}:resend:");

    expect(page).toContain("<QuoteEmailDeliveryHistory");
    expect(page).toContain("quoteId={q.id}");
    expect(page).toContain("onDeliverySettled");
    expect(page).not.toContain("notes: `Email sent:");
  });

  it("leaves the 10-minute derived-key fallback in the delivery module for callers that omit a key", () => {
    const delivery = read("supabase/functions/_shared/quote-email-delivery.ts");
    const mailer = read("supabase/functions/send-quote-email/index.ts");

    expect(delivery).toContain("const bucketMs = input.bucketMs ?? 10 * 60 * 1000");
    expect(delivery).toContain("Math.floor((input.now ?? Date.now()) / bucketMs)");
    expect(mailer).toContain("suppliedKey: emailData.idempotencyKey");
    expect(mailer).toContain("idempotencyKey: z.string().trim().min(8).max(200).optional()");
  });
});
