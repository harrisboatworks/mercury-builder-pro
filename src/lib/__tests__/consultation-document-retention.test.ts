import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_EXPIRED_PURGE_GRACE_MS,
  CONSULTATION_MINT_GRACE_MS,
  applyConsultationRetention,
  assertRetentionActionSafe,
  isRetainedConsultationStorageKey,
  planConsultationRetention,
  type ConsultationRetentionStore,
} from '../../../supabase/functions/_shared/consultation-document-retention.ts';

const read = (path: string) => readFileSync(path, 'utf8');

const DOCUMENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const JOB_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CAPABILITY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const STORAGE_KEY = `consultation/${DOCUMENT_ID}/quote.pdf`;

function iso(now: Date, offsetMs: number): string {
  return new Date(now.getTime() + offsetMs).toISOString();
}

function memoryRetentionStore() {
  const removed: string[] = [];
  const deleted: string[] = [];
  const revoked: string[] = [];
  const cleaned: string[] = [];
  const store: ConsultationRetentionStore = {
    async removePdf(path) {
      removed.push(path);
    },
    async deleteDocument(id) {
      deleted.push(id);
    },
    async revokeCapability(id) {
      revoked.push(id);
    },
    async markJobCleaned(id) {
      cleaned.push(id);
    },
  };
  return { store, removed, deleted, revoked, cleaned };
}

describe('consultation document retention', () => {
  it('plans cleanup for stale failed jobs and orphan documents after the mint grace', () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    const actions = planConsultationRetention({
      now,
      jobs: [{
        id: JOB_ID,
        status: 'failed',
        documentId: DOCUMENT_ID,
        storageKey: STORAGE_KEY,
        updatedAt: iso(now, -(CONSULTATION_MINT_GRACE_MS + 1)),
      }],
      documents: [{
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        storageKey: 'consultation/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/quote.pdf',
        createdAt: iso(now, -(CONSULTATION_MINT_GRACE_MS + 1)),
        capabilities: [],
      }],
    });

    expect(actions).toEqual([
      {
        type: 'cleanup_failed_job',
        jobId: JOB_ID,
        documentId: DOCUMENT_ID,
        storageKey: STORAGE_KEY,
      },
      {
        type: 'cleanup_orphan_document',
        documentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        storageKey: 'consultation/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/quote.pdf',
      },
    ]);
    for (const action of actions) assertRetentionActionSafe(action);
  });

  it('leaves in-flight persisted jobs and live documents alone', () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    const actions = planConsultationRetention({
      now,
      jobs: [{
        id: JOB_ID,
        status: 'persisted',
        documentId: DOCUMENT_ID,
        storageKey: STORAGE_KEY,
        updatedAt: iso(now, -(CONSULTATION_MINT_GRACE_MS * 4)),
      }],
      documents: [{
        id: DOCUMENT_ID,
        storageKey: STORAGE_KEY,
        createdAt: iso(now, -60_000),
        capabilities: [{
          id: CAPABILITY_ID,
          expiresAt: iso(now, CONSULTATION_MINT_GRACE_MS),
          revokedAt: null,
        }],
      }],
    });
    expect(actions).toEqual([]);
  });

  it('ignores spec-sheets and non-canonical storage keys', () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    expect(isRetainedConsultationStorageKey('spec-sheets/temp/quote.pdf')).toBe(false);
    expect(isRetainedConsultationStorageKey('quotes/saved/quote.pdf')).toBe(false);
    const actions = planConsultationRetention({
      now,
      jobs: [{
        id: JOB_ID,
        status: 'failed',
        documentId: DOCUMENT_ID,
        storageKey: 'spec-sheets/temp/quote.pdf',
        updatedAt: iso(now, -(CONSULTATION_MINT_GRACE_MS + 1)),
      }],
      documents: [{
        id: DOCUMENT_ID,
        storageKey: 'spec-sheets/temp/quote.pdf',
        createdAt: iso(now, -(CONSULTATION_MINT_GRACE_MS + 1)),
        capabilities: [],
      }],
    });
    expect(actions).toEqual([{
      type: 'cleanup_failed_job',
      jobId: JOB_ID,
      documentId: null,
      storageKey: null,
    }]);
  });

  it('revokes expired capabilities and later purges documents past the grace window', () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    const expired = iso(now, -(CONSULTATION_EXPIRED_PURGE_GRACE_MS + 1));
    const actions = planConsultationRetention({
      now,
      jobs: [],
      documents: [{
        id: DOCUMENT_ID,
        storageKey: STORAGE_KEY,
        createdAt: expired,
        capabilities: [{
          id: CAPABILITY_ID,
          expiresAt: expired,
          revokedAt: null,
        }],
      }],
    });
    expect(actions.map((action) => action.type)).toEqual([
      'revoke_expired_capability',
      'purge_expired_document',
    ]);
  });

  it('applies a plan idempotently and never writes tokens or public paths', async () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    const first = memoryRetentionStore();
    const actions = planConsultationRetention({
      now,
      jobs: [{
        id: JOB_ID,
        status: 'started',
        documentId: DOCUMENT_ID,
        storageKey: STORAGE_KEY,
        updatedAt: iso(now, -(CONSULTATION_MINT_GRACE_MS + 1)),
      }],
      documents: [],
    });
    const summary = await applyConsultationRetention(actions, first.store, now);
    expect(summary).toEqual({ cleaned: 1, revoked: 0, purged: 0, failed: 0 });
    expect(first.removed).toEqual([STORAGE_KEY]);
    expect(first.deleted).toEqual([DOCUMENT_ID]);
    expect(first.cleaned).toEqual([JOB_ID]);

    const second = memoryRetentionStore();
    const again = await applyConsultationRetention(actions, second.store, now);
    expect(again.cleaned).toBe(1);
    expect(JSON.stringify(actions)).not.toContain('cd_');
    expect(JSON.stringify(actions)).not.toContain('spec-sheets');
  });

  it('keeps the retention executor internal-only and off the consultation upload API', () => {
    const retention = read('supabase/functions/consultation-document-retention/index.ts');
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const submit = read('supabase/functions/submit-quote-lead/index.ts');
    const migration = read('supabase/migrations/20260825010000_consultation_document_jobs_and_retention.sql');
    const config = read('supabase/config.toml');

    expect(retention).toContain('requireAdmin');
    expect(retention).toContain('failClosed: true');
    expect(retention).toContain('consultation_document_retention_ip');
    expect(retention).toContain('planConsultationRetention');
    expect(retention).not.toContain('Access-Control-Allow-Origin: *');
    expect(retention).not.toContain('cd_');
    expect(api).not.toContain('consultation-document-retention');
    expect(api).not.toContain('consultation_document_jobs');
    expect(submit).toContain('markConsultationDocumentJobEmailed');
    // Internal attachments use a server-minted ID; public callers cannot select or receive it.
    expect(submit).not.toMatch(/(?:p|raw)\.documentId/);
    expect(submit).not.toContain('success: true, documentId');
    expect(migration).toContain('consultation_document_jobs');
    expect(migration).not.toMatch(/bucket_id\s*=\s*'spec-sheets'/);
    expect(migration).not.toMatch(/UPDATE\s+storage\.buckets/i);
    expect(migration).not.toMatch(/DELETE\s+FROM\s+storage\.objects/i);
    expect(migration).not.toContain('cron.schedule');
    expect(config).toContain('[functions.consultation-document-retention]');
  });

  it('schedules the retention worker with the existing service-role cron pattern', () => {
    const scheduler = read('supabase/migrations/20260826010000_schedule_consultation_document_retention.sql');
    const prior = read('supabase/migrations/20260825010000_consultation_document_jobs_and_retention.sql');

    expect(prior).not.toContain('cron.schedule');
    expect(scheduler).toContain("cron.schedule(\n    'consultation-document-retention-daily'");
    expect(scheduler).toContain('/functions/v1/consultation-document-retention');
    expect(scheduler).toContain("jobname = 'mercury-catalog-data-refresh'");
    expect(scheduler).toContain("name = 'service_role_key'");
    expect(scheduler).toContain('vault.decrypted_secrets');
    expect(scheduler).toContain("cron.unschedule('consultation-document-retention-daily')");
    expect(scheduler).toContain('Authorization');
    expect(scheduler).toContain('Bearer %s');
    expect(scheduler).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(scheduler).toContain("WHEN 'consultation_documents' THEN");
    expect(scheduler).toContain("WHEN 'consultation_document_jobs' THEN");
    expect(scheduler).toContain('handled := false');
    expect(scheduler).toContain('after 20260825010000');
    expect(scheduler).toContain("cron.unschedule('consultation-document-retention-daily')");
    expect(scheduler).toContain('REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon, authenticated');
    expect(scheduler).toContain('Keep this cleanup_old_data() replacement');
    expect(scheduler).not.toContain('Restore public.cleanup_old_data() from 20251111000954');
  });
});
