// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('soft-lead idempotency contract', () => {
  it('uses a stable snapshot and the atomic RPC instead of anonymous select-then-insert', () => {
    const summary = read('src/pages/quote/QuoteSummaryPage.tsx');
    const section = summary.slice(
      summary.indexOf('// Silent soft-lead save'),
      summary.indexOf('// Listen for quote-saved-via-auth event'),
    );

    expect(section).toContain('isQuotePdfSnapshot(state.pdfSnapshot)');
    expect(section).toContain('persistSoftLeadQuote');
    expect(section).toContain('softLeadSaveQueueRef.current = softLeadSaveQueueRef.current');
    expect(section).not.toContain(".from('saved_quotes')");
    expect(section).not.toContain('snapshot-pending');
    expect(section.indexOf('softLeadSnapshotRef.current = snapshotKey')).toBeGreaterThan(
      section.indexOf('persistSoftLeadQuote'),
    );
  });

  it('serializes each session and exposes only the narrow write-only RPC', () => {
    const migration = read('supabase/migrations/20260809145000_upsert_soft_lead_quote.sql');
    const client = read('src/integrations/supabase/client.ts');
    const quoteSession = read('src/lib/quote-session-id.ts');

    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("'saved_quotes:soft:' || p_session_id");
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain("request_headers ->> 'x-quote-session-id'");
    expect(migration).toContain("p_session_id !~ '^qa_[0-9a-f]{24}$'");
    expect(migration).toContain('COALESCE(is_soft_lead, false) IS FALSE');
    expect(migration).toContain('FOR insert_attempt IN 1..3 LOOP');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.upsert_soft_lead_quote');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.upsert_soft_lead_quote');
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.saved_quotes/i);
    expect(client).toContain("'x-quote-session-id': getOrCreateQuoteSessionId()");
    expect(quoteSession).toContain("const QUOTE_SESSION_KEY = 'quote_activity_session_id'");
  });
});
