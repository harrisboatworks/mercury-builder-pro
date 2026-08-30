// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATION_PATH = 'supabase/migrations/20260830214400_upsert_soft_lead_quote.sql';
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const ownedHttpsOrigins = [
  'https://www.mercuryrepower.ca',
  'https://mercuryrepower.ca',
  'https://quote.harrisboatworks.ca',
  'https://www.mercuryquote.ca',
  'https://mercuryquote.ca',
  'https://mercury-builder-pro.vercel.app',
  'https://mercury-builder-pro-hbw.vercel.app',
  'https://mercury-builder-pro-git-main-hbw.vercel.app',
];

describe('soft-lead idempotency contract', () => {
  it('persists synchronized quote state through the coordinator instead of an anonymous read/write race', () => {
    const summary = read('src/pages/quote/QuoteSummaryPage.tsx');
    const saveSectionStart = summary.indexOf(
      '// Persist only the synchronized anonymous quote state through the atomic RPC.',
    );
    const saveSection = summary.slice(saveSectionStart, summary.indexOf('// CTA handlers'));

    expect(saveSectionStart).toBeGreaterThan(summary.indexOf("dispatch({ type: 'SET_PDF_SNAPSHOT'"));
    expect(saveSection).toContain('isQuotePdfSnapshot(state.pdfSnapshot)');
    expect(saveSection).toContain('buildSoftLeadSnapshotKey(state.pdfSnapshot)');
    expect(saveSection).toContain('buildSoftLeadSnapshotKey(quoteStateSnapshot)');
    expect(saveSection).toContain('softLeadSaveCoordinator.enqueue');
    expect(summary).not.toContain('createSoftLeadSaveCoordinator');
    expect(saveSection).not.toContain(".from('saved_quotes')");
    expect(saveSection).not.toContain('snapshot-pending');
    expect(saveSection).not.toContain('state.pdfSnapshot?.createdAt');
  });

  it('serializes each session and exposes only the validated write-only RPC', () => {
    const migration = read(MIGRATION_PATH);
    const softLeadSave = read('src/lib/soft-lead-save.ts');
    const client = read('src/integrations/supabase/client.ts');
    const quoteSession = read('src/lib/quote-session-id.ts');
    const types = read('src/integrations/supabase/types.ts');

    expect(Number(MIGRATION_PATH.match(/migrations\/(\d+)_/)?.[1])).toBeGreaterThan(20260830212000);
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("'saved_quotes:soft:' || p_session_id");
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain("request_headers ->> 'x-quote-session-id'");
    expect(migration).toContain("p_session_id !~ '^qa_[0-9a-f]{24}$'");
    expect(migration).toContain('COALESCE(is_soft_lead, false) IS FALSE');
    expect(migration).toContain('pg_catalog.pg_column_size(p_quote_state) > 524288');
    expect(migration).toContain('FOR insert_attempt IN 1..3 LOOP');
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.upsert_soft_lead_quote\(text, jsonb\)\s+FROM PUBLIC, anon, authenticated;/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.upsert_soft_lead_quote\(text, jsonb\)\s+TO anon, authenticated;/,
    );
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.saved_quotes/i);
    expect(softLeadSave).toContain(".setHeader('x-quote-session-id', sessionId)");
    expect(softLeadSave).toContain('export const softLeadSaveCoordinator =');
    expect(softLeadSave).toContain('JSON.stringify([sessionId, snapshotKey])');
    expect(client).not.toContain("'x-quote-session-id'");
    expect(quoteSession).toContain("const QUOTE_SESSION_KEY = 'quote_activity_session_id'");
    expect(types).toContain('upsert_soft_lead_quote: {');
  });

  it('keeps the RPC origin boundary aligned with the exact shared HBW allowlist', () => {
    const migration = read(MIGRATION_PATH);
    const browserOrigin = read('supabase/functions/_shared/browser-origin.ts');

    for (const origin of ownedHttpsOrigins) {
      expect(browserOrigin).toContain(`"${origin}"`);
      expect(migration).toContain(`request_origin = '${origin}'`);
    }

    expect(migration).toContain("^http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?(/|$)");
    expect(migration).not.toMatch(/lovable[.]app|lovable[.]dev/);
    expect(migration).not.toMatch(/\[a-z0-9-\]\+.*vercel/);
  });
});
