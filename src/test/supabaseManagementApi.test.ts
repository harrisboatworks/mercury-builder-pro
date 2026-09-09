import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MANAGEMENT_API,
  fetchJson,
  pickFunctionRows,
  pickMigrationRows,
} from '../../scripts/lib/supabase-management-api.mjs';
import { buildDriftReport, formatDriftMarkdown } from '../../scripts/lib/supabase-deploy-required.mjs';

const GOLDEN_DRIFT_WATCH_MARKDOWN = `## Supabase drift watch

Compares \`main\` to deployed edge functions and applied migrations. This job does not deploy or apply anything.

### Edge functions

- \`ai-chatbot\` — main commit 2026-09-08T19:13:09-04:00 is newer than deployed 2026-08-26T13:06:56.915Z (13 days behind, 3 commits behind, version 737)

### Migrations

None unapplied.

### Migration matching rule

A file counts as applied when its 14-digit version, full stem, or name suffix matches an applied \`version\` or \`name\`. The name suffix is the filename after \`YYYYMMDDHHMMSS_\`, so an apply tool that records a different timestamp still matches names such as \`upsert_soft_lead_quote\` and \`atomic_saved_quote_access\`.

Only filename versions \`20260731000000\` or later are reported as unapplied. Older files were applied through a path that recorded different versions; that historical set will not be reconciled retroactively.

This run checked 2 in-scope migration files for absence and did not report 0 older files.
`;

describe('Management API row pickers', () => {
  it('picks function rows from a top-level array or a functions wrapper', () => {
    const row = { slug: 'ai-chatbot', version: 737, updated_at: 1787749616915 };
    expect(pickFunctionRows([row])).toEqual([
      { slug: 'ai-chatbot', version: 737, updated_at: 1787749616915 },
    ]);
    expect(pickFunctionRows({ functions: [{ name: 'send-sms', updatedAt: '2026-09-08T12:00:00Z' }] })).toEqual([
      { slug: 'send-sms', version: null, updated_at: '2026-09-08T12:00:00Z' },
    ]);
    expect(pickFunctionRows({ ok: true })).toBeNull();
  });

  it('picks migration versions and names from the published Management API shape', () => {
    const payload = [
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
      { version: '20260909164256', name: 'quote_email_delivery_audit' },
    ];
    expect(pickMigrationRows(payload)).toEqual([
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
      { version: '20260909164256', name: 'quote_email_delivery_audit' },
    ]);
    expect(pickMigrationRows({ migrations: payload })).toEqual(pickMigrationRows(payload));
    expect(pickMigrationRows([{ version: '20260909194905' }])).toEqual([
      { version: '20260909194905', name: undefined },
    ]);
    expect(pickMigrationRows(['20260909194905'])).toEqual(['20260909194905']);
    expect(pickMigrationRows({ ok: true })).toBeNull();
  });
});

describe('fetchJson', () => {
  it('returns parsed JSON on 200 and fails closed on HTTP, invalid JSON, or network errors', async () => {
    const original = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response(JSON.stringify({ versions: ['1'] }), { status: 200 });
      expect(await fetchJson('https://example.test/ok', {})).toEqual({
        ok: true,
        status: 200,
        data: { versions: ['1'] },
      });

      globalThis.fetch = async () => new Response('nope', { status: 401 });
      expect(await fetchJson('https://example.test/401', {})).toEqual({
        ok: false,
        status: 401,
        data: null,
      });

      globalThis.fetch = async () => new Response('not-json', { status: 200 });
      expect(await fetchJson('https://example.test/bad-json', {})).toEqual({
        ok: false,
        status: 200,
        data: null,
      });

      globalThis.fetch = async () => {
        throw new Error('network down');
      };
      expect(await fetchJson('https://example.test/down', {})).toEqual({
        ok: false,
        status: 0,
        data: null,
      });
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('drift-watch output after helper lift', () => {
  it('keeps drift-watch report output byte-identical when using the shared pickers', () => {
    const functionsPayload = [{ slug: 'ai-chatbot', version: 737, updated_at: 1787749616915 }];
    const migrationsPayload = [
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
      { version: '20260909164256', name: 'quote_email_delivery_audit' },
    ];
    const report = buildDriftReport({
      localFunctions: [{ slug: 'ai-chatbot', latestCommitAt: '2026-09-08T19:13:09-04:00' }],
      deployedFunctions: pickFunctionRows(functionsPayload),
      localMigrations: [
        'supabase/migrations/20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql',
        'supabase/migrations/20260815160000_quote_email_delivery_audit.sql',
      ],
      appliedVersions: pickMigrationRows(migrationsPayload),
    });
    report.staleFunctions[0].commitsBehind = 3;
    expect(formatDriftMarkdown(report)).toBe(GOLDEN_DRIFT_WATCH_MARKDOWN);
  });

  it('keeps the drift-watch script on the shared helpers and the same endpoints', () => {
    const script = readFileSync('scripts/supabase-drift-watch.mjs', 'utf8');
    expect(script).toContain("from './lib/supabase-management-api.mjs'");
    expect(script).toContain('fetchJson');
    expect(script).toContain('pickFunctionRows');
    expect(script).toContain('pickMigrationRows');
    expect(script).toContain('${MANAGEMENT_API}/projects/${encodeURIComponent(ref)}/functions');
    expect(script).toContain('${MANAGEMENT_API}/projects/${encodeURIComponent(ref)}/database/migrations');
    expect(script).toContain('formatDriftMarkdown(report)');
    expect(script).toContain(
      'Management API request failed. No function slugs, versions, or migration versions were compared.',
    );
    expect(script).toContain('Management API returned an unexpected shape. Response bodies were not printed.');
    expect(script).toContain('This job does not fail the build.');
    expect(script).toContain('process.exit(0)');
    expect(MANAGEMENT_API).toBe('https://api.supabase.com/v1');
  });
});
