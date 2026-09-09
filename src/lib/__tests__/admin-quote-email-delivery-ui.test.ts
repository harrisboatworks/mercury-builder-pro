import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
    expect(sender).toContain("adminConsultationDocument(quoteId, 'admin-email', intent)");
    expect(sender).not.toContain("pdfUrl:");
    expect(sender).not.toContain("bucketMs");
    expect(sender).not.toContain("Date.now");
    expect(sender).not.toContain("Math.floor");
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
  it("reads deliveries by full quote_id and fails closed in the strip", () => {
    const history = read("src/components/admin/QuoteEmailDeliveryHistory.tsx");
    const page = read("src/pages/AdminQuoteDetail.tsx");
    const migration = read("supabase/migrations/20260815160000_quote_email_delivery_audit.sql");
    const helper = read("src/lib/admin-quote-email.ts");
    const delivery = read("supabase/functions/_shared/quote-email-delivery.ts");

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_quote_email_deliveries_v1(_quote_id uuid)");
    expect(migration).toContain("WHERE quote_id = _quote_id");
    expect(migration).toContain("ORDER BY created_at DESC");
    expect(migration).not.toContain("WHERE quote_number = _quote_number");
    expect(migration).not.toContain("get_quote_email_deliveries_v1(_quote_number text)");

    expect(history).toContain("get_quote_email_deliveries_v1");
    expect(history).toContain("_quote_id: quoteId");
    expect(history).not.toContain("adminQuoteEmailRef(quoteId)");
    expect(history).not.toContain("_quote_number");
    expect(history).toContain("no emails sent yet");
    expect(history).toContain("Email history is unavailable right now. The rest of this quote is still usable.");
    expect(history).toContain("sortQuoteEmailDeliveriesNewestFirst(rows)");
    expect(history).toContain("presentQuoteEmailDelivery(row, customerEmail)");
    expect(history).toContain("resolveQuoteEmailDisplayRecipient(customerEmail)");
    expect(history).not.toContain("recipient_sha256");
    expect(history).not.toContain(".from('quote_email_deliveries')");
    expect(history).not.toContain("customer_quotes");

    expect(helper).toContain("return quoteId.slice(0, 8).toUpperCase()");
    expect(delivery).toContain("`${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${quoteId}:${emailType}`");
    expect(delivery).toContain("`${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${quoteId}:${emailType}:resend:");

    expect(page).toContain("<QuoteEmailDeliveryHistory");
    expect(page).toContain("customerEmail={q.customer_email}");
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
