import { readFileSync } from 'node:fs';
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
    expect(summary).not.toContain(".from('quotes')\n          .upload(");
    expect(summary).not.toContain('quotePdfPath');

    expect(myQuotes).toContain("body: { action: 'download', savedQuoteId: quote.id }");
    expect(myQuotes).toContain('buildLegacyQuotePdfSnapshot');
    expect(myQuotes).not.toContain('quote_pdf_path');
    expect(myQuotes).not.toContain('deposit_pdf_path');
    expect(myQuotes).not.toContain("storage.from('quotes').download");

    expect(payment).toContain('quoteDocumentBinding({ row: savedQuote, savedQuoteId: savedQuote.id })');
    expect(payment).toContain('assertQuoteDocumentPaymentAvailable({');
    expect(payment).toContain('email, expires_at, is_soft_lead, deposit_status');
    expect(payment).toContain('await sha256Hex(documentBytes) !== documentBinding.sha256');
    expect(payment).not.toContain('quotePdfPath');
    expect(payment).not.toContain('quote_pdf_path:');

    expect(webhook).toContain('boundSavedQuoteId !== savedQuoteId');
    expect(webhook).not.toContain('quote_pdf_path');

    expect(mailer).toContain('savedQuoteId = typeof quoteData.saved_quote_id === "string"');
    expect(mailer).toContain('requiresSavedQuoteBinding = quoteData.deposit_mode === "motor_reservation"');
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
    expect(edge).toContain('upsert: false');
    expect(edge).toContain('cacheControl: "60"');
    expect(edge).toContain('{ success: true }');
    expect(edge).toContain('expiresIn: QUOTE_DOCUMENT_SIGNED_URL_SECONDS');
    expect(edge).toContain('const reader = req.body.getReader()');
    expect(edge).toContain('if (totalBytes > MAX_QUOTE_DOCUMENT_BYTES)');
    expect(edge).not.toContain('req.formData()');
    expect(edge).not.toContain('getPublicUrl');
    expect(edge).not.toContain('remove([canonicalPath])');
    expect(edge).not.toMatch(/jsonResponse\(req,\s*\{[^}]*canonicalPath/s);
  });

  it('locks storage and saved-quote bindings without deleting legacy objects', () => {
    const migration = read(
      'supabase/migrations/20260809190000_enforce_quote_document_authority.sql',
    );

    expect(migration).toContain('ADD COLUMN IF NOT EXISTS quote_pdf_sha256 text');
    expect(migration).toContain("public = false");
    expect(migration).toContain("allowed_mime_types = ARRAY['application/pdf']::text[]");
    expect(migration).toContain('CREATE POLICY "Service role manages private quote documents"');
    expect(migration).toContain("NEW.quote_pdf_path <> canonical_path");
    expect(migration).toContain("NEW.quote_pdf_sha256 !~ '^[0-9a-f]{64}$'");
    expect(migration).toContain('BEFORE INSERT ON public.saved_quotes');
    expect(migration).toContain('BEFORE UPDATE OF quote_pdf_path, quote_pdf_sha256, deposit_pdf_path');
    expect(migration).not.toMatch(/DELETE\s+FROM\s+storage\.objects/i);
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.saved_quotes/i);
  });
});
