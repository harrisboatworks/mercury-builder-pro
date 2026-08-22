import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('private quote document storage contract', () => {
  it('keeps the browser outside private storage and caller paths outside payment authority', () => {
    const summary = read('src/pages/quote/QuoteSummaryPage.tsx');
    const myQuotes = read('src/pages/account/MyQuotesPage.tsx');
    const payment = read('supabase/functions/create-payment/index.ts');
    const webhook = read('supabase/functions/stripe-webhook/index.ts');
    const mailer = read('supabase/functions/send-deposit-confirmation-email/index.ts');

    expect(summary).toContain("'Content-Type': 'application/pdf'");
    expect(summary).toContain("'x-saved-quote-id': savedQuoteId");
    expect(summary).toContain("'x-resume-token': resumeToken");
    expect(summary).toContain("supabase.functions.invoke(\n        'quote-document-api'");
    expect(summary).toContain('quoteDocument?.success !== true');
    expect(summary).not.toContain(".from('quotes')");
    expect(summary).not.toContain('quotePdfPath');

    const documentUpload = summary.indexOf("invoke(\n        'quote-document-api'");
    const paymentInvoke = summary.indexOf("invoke('create-payment'");
    expect(documentUpload).toBeGreaterThan(-1);
    expect(paymentInvoke).toBeGreaterThan(documentUpload);
    expect(summary.indexOf('quoteDocument?.success !== true')).toBeGreaterThan(documentUpload);
    expect(summary.indexOf('quoteDocument?.success !== true')).toBeLessThan(paymentInvoke);

    expect(myQuotes).toContain("body: { action: 'download', savedQuoteId: quote.id }");
    expect(myQuotes).toContain('buildLegacyQuotePdfSnapshot');
    expect(myQuotes).toContain('This is not a stored reservation document.');
    expect(myQuotes).toContain('.from("saved_quotes")');
    expect(myQuotes).toContain('.select("*")');
    expect(myQuotes).not.toMatch(/\.eq\(\s*["']user_id["']/);
    expect(myQuotes).not.toContain('quote_pdf_path');
    expect(myQuotes).not.toContain('deposit_pdf_path');
    expect(myQuotes).not.toContain("storage.from('quotes')");

    const depositGuard = payment.indexOf('assertDepositRequestHasSavedQuoteId');
    const stripeConstruct = payment.indexOf('new Stripe(');
    const documentCheck = payment.indexOf('assertCanonicalQuoteDocumentReady({');
    const stripeCreate = payment.indexOf('stripe.checkout.sessions.create(sessionData)');
    expect(payment).toContain('assertDepositRequestHasSavedQuoteId(validationResult.data)');
    expect(payment).toContain('if (!depositSavedQuoteId)');
    expect(payment).toContain('assertCanonicalQuoteDocumentReady({');
    expect(payment).toContain('canonicalQuoteDocumentPath(savedQuote.id)');
    expect(payment).toContain('email, expires_at, is_soft_lead, deposit_status');
    expect(depositGuard).toBeGreaterThan(-1);
    expect(stripeConstruct).toBeGreaterThan(depositGuard);
    expect(payment.indexOf('new Stripe(', stripeConstruct + 1)).toBe(-1);
    expect(documentCheck).toBeGreaterThan(-1);
    expect(stripeCreate).toBeGreaterThan(documentCheck);
    expect(payment).not.toContain('quotePdfPath');
    expect(payment).not.toContain('quote_pdf_path:');
    expect(payment).not.toMatch(/metadata:[\s\S]*quote_pdf_path/);

    expect(webhook).toContain('boundSavedQuoteId !== savedQuoteId');
    expect(webhook).toContain('body: { stripeSessionId: session.id }');
    expect(webhook).not.toContain('session.metadata.quote_pdf_path');
    expect(webhook).not.toContain('quotePdfPath');
    expect(webhook).not.toContain('quote_pdf_path:');

    expect(mailer).toContain('"quotePdfPath" in requestBody');
    expect(mailer).toContain('"quote_pdf_path" in requestBody');
    expect(mailer).toContain('This email does not attach a quote PDF.');
    expect(mailer).not.toContain('quoteData.quote_pdf_path');
    expect(mailer).not.toContain('storage.from("quotes").download');
    expect(mailer).not.toContain('attachments');
    expect(mailer).not.toContain('attached to this email');
  });

  it('serves only canonical immutable PDFs through the private edge boundary', () => {
    const edge = read('supabase/functions/quote-document-api/index.ts');
    const config = read('supabase/config.toml');

    expect(config).toContain('[functions.quote-document-api]\nverify_jwt = true');
    expect(edge).toContain('authorizeQuoteDocumentUpload({ row, savedQuoteId, resumeToken, user })');
    expect(edge).toContain('authorizeQuoteDocumentDownload({ row, savedQuoteId, user })');
    expect(edge).toContain('storedQuoteDocumentHash(service, canonicalPath)');
    expect(edge).toContain('readLimitedStream(req.body, MAX_QUOTE_DOCUMENT_BYTES)');
    expect(edge).toContain('upsert: false');
    expect(edge).toContain('cacheControl: "60"');
    expect(edge).toContain('{ success: true }');
    expect(edge).toContain('expiresIn: QUOTE_DOCUMENT_SIGNED_URL_SECONDS');
    expect(edge).not.toContain('req.formData()');
    expect(edge).not.toContain('getPublicUrl');
    expect(edge).not.toContain('remove([canonicalPath])');
    expect(edge).not.toMatch(/jsonResponse\(req,\s*\{[^}]*canonicalPath/s);
  });

  it('locks saved-quote storage without deleting legacy objects or privatizing spec-sheets', () => {
    const quotesMigration = read(
      'supabase/migrations/20260822184600_enforce_quote_document_authority.sql',
    );
    const consultation = read('src/components/quote-builder/ScheduleConsultation.tsx');

    expect(existsSync(
      'supabase/migrations/20260822184500_make_customer_quote_documents_private.sql',
    )).toBe(false);

    expect(quotesMigration).toContain('ADD COLUMN IF NOT EXISTS quote_pdf_sha256 text');
    expect(quotesMigration).toContain('public = false');
    expect(quotesMigration).toContain("allowed_mime_types = ARRAY['application/pdf']::text[]");
    expect(quotesMigration).toContain('CREATE POLICY "Service role manages private quote documents"');
    expect(quotesMigration).toContain('DROP POLICY IF EXISTS "Users can read own quote PDFs"');
    expect(quotesMigration).toContain('DROP POLICY IF EXISTS "Anon can upload quotes PDFs"');
    expect(quotesMigration).toContain("NEW.quote_pdf_path <> canonical_path");
    expect(quotesMigration).toContain("NEW.quote_pdf_sha256 !~ '^[0-9a-f]{64}$'");
    expect(quotesMigration).toContain('BEFORE INSERT ON public.saved_quotes');
    expect(quotesMigration).toContain('BEFORE UPDATE OF quote_pdf_path, quote_pdf_sha256, deposit_pdf_path');
    expect(quotesMigration).not.toMatch(/DELETE\s+FROM\s+storage\.objects/i);
    expect(quotesMigration).not.toMatch(/DELETE\s+FROM\s+public\.saved_quotes/i);
    expect(quotesMigration).not.toContain('spec-sheets');

    expect(consultation).toContain("storage.from('spec-sheets')");
    expect(consultation).toContain('getPublicUrl');
  });
});
