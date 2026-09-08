import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("admin quote email sender contracts", () => {
  it("supplies a stable admin key and a separate deliberate resend control", () => {
    const sender = read("src/components/admin/SendQuoteEmail.tsx");
    const helper = read("src/lib/admin-quote-email.ts");

    expect(sender).toContain("mintAdminQuoteEmailIdempotencyKey");
    expect(sender).toContain("idempotencyKey:");
    expect(sender).toContain("handleSend('send')");
    expect(sender).toContain("handleSend('resend')");
    expect(sender).toContain("Send again");
    expect(sender).toContain("another copy");
    expect(sender).toContain("quoteNumber: adminQuoteEmailRef(quoteId)");
    expect(sender).toContain("quotePageUrl: `${SITE_URL}/quote/saved/${quoteId}`");
    expect(sender).not.toContain("pdfUrl:");
    expect(sender).not.toContain("bucketMs");
    expect(sender).not.toContain("Date.now");
    expect(sender).not.toContain("Math.floor");

    expect(helper).toContain("hbw-admin-v1:{quoteId}:{emailType}");
    expect(helper).toContain("No time component");
    expect(helper).toContain(':resend:{nonce}');
    expect(helper).toContain("The raw recipient address is never part of the key.");
  });

  it("keeps Email Quote as the primary action and Send again behind a confirm", () => {
    const sender = read("src/components/admin/SendQuoteEmail.tsx");
    const emailQuoteAt = sender.indexOf("{sent ? 'Sent!' : 'Email Quote'}");
    const sendAgainAt = sender.indexOf("Send again");
    const confirmAt = sender.indexOf("The customer will receive another copy of this quote email.");

    expect(emailQuoteAt).toBeGreaterThan(-1);
    expect(sendAgainAt).toBeGreaterThan(emailQuoteAt);
    expect(confirmAt).toBeGreaterThan(sendAgainAt);
    expect(sender).toContain("<AlertDialog>");
    expect(sender).toContain("Send another copy");
    expect(sender.indexOf("handleSend('send')")).toBeLessThan(sender.indexOf("handleSend('resend')"));
  });
});

describe("admin quote email history contracts", () => {
  it("reads deliveries through get_quote_email_deliveries_v1 and fails closed in the strip", () => {
    const history = read("src/components/admin/QuoteEmailDeliveryHistory.tsx");
    const page = read("src/pages/AdminQuoteDetail.tsx");
    const migration = read("supabase/migrations/20260815160000_quote_email_delivery_audit.sql");

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_quote_email_deliveries_v1(_quote_number text)");
    expect(migration).toContain("ORDER BY created_at DESC");
    expect(history).toContain("get_quote_email_deliveries_v1");
    expect(history).toContain("_quote_number: adminQuoteEmailRef(quoteId)");
    expect(history).toContain("no emails sent yet");
    expect(history).toContain("Email history is unavailable right now. The rest of this quote is still usable.");
    expect(history).toContain("sortQuoteEmailDeliveriesNewestFirst(rows)");
    expect(history).toContain("presentQuoteEmailDelivery(row, customerEmail)");
    expect(history).toContain("resolveQuoteEmailDisplayRecipient(customerEmail)");
    expect(history).not.toContain("recipient_sha256");
    expect(history).not.toContain(".from('quote_email_deliveries')");
    expect(history).not.toContain("customer_quotes");

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
