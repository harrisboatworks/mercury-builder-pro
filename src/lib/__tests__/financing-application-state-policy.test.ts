import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isMatchingSubmittedApplication,
  preserveFinancingOwner,
  requiresUnownedOwnerGuard,
  type ExistingFinancingApplication,
} from '../../../supabase/functions/financing-application-api/state-policy';

const migrationPath =
  'supabase/migrations/20260830212000_add_financing_submission_idempotency.sql';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('financing application state policy', () => {
  it('preserves an existing owner and only claims an anonymous draft', () => {
    expect(preserveFinancingOwner('existing-user', null)).toBe('existing-user');
    expect(preserveFinancingOwner('existing-user', 'different-user')).toBe('existing-user');
    expect(preserveFinancingOwner(null, 'signed-in-user')).toBe('signed-in-user');
    expect(preserveFinancingOwner(null, null)).toBeNull();
  });

  it('guards every row observed as unowned, including an anonymous retry', () => {
    expect(requiresUnownedOwnerGuard(null)).toBe(true);
    expect(requiresUnownedOwnerGuard('existing-user')).toBe(false);

    const api = source('supabase/functions/financing-application-api/index.ts');
    expect(api.match(/requiresUnownedOwnerGuard\(/g)).toHaveLength(2);
    expect(api).toContain('requiresUnownedOwnerGuard(existingDraft.user_id)');
    expect(api).toContain('requiresUnownedOwnerGuard(existingState.user_id)');
  });

  it('recognizes only the same completed submission as an idempotent retry', () => {
    const pending: ExistingFinancingApplication = {
      id: 'application-id',
      user_id: null,
      status: 'pending',
      submission_id: 'submission-id',
    };

    expect(isMatchingSubmittedApplication(pending, 'submission-id')).toBe(true);
    expect(isMatchingSubmittedApplication(pending, 'different-id')).toBe(false);
    expect(isMatchingSubmittedApplication({ ...pending, status: 'draft' }, 'submission-id')).toBe(false);
    expect(isMatchingSubmittedApplication(pending)).toBe(false);
  });

  it('persists a stable client key and enforces it with a unique database index', () => {
    const component = source('src/components/financing/ReviewSubmitStep.tsx');
    const client = source('src/lib/financingApplicationApi.ts');
    const api = source('supabase/functions/financing-application-api/index.ts');
    const migration = source(migrationPath);

    expect(component).toContain('const submissionIdRef = useRef(crypto.randomUUID())');
    expect(component).toContain('submissionId: submissionIdRef.current');
    expect(client).toContain('submissionId: params.submissionId');
    expect(api).toContain("onConflict: 'submission_id'");
    expect(api).toContain('ignoreDuplicates: true');
    expect(api).toContain(".eq('submission_id', input.submissionId)");
    expect(api.match(/\.is\('deleted_at', null\)/g)?.length).toBeGreaterThanOrEqual(7);
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS financing_applications_submission_id_key',
    );
    expect(migration).not.toContain('WHERE submission_id IS NOT NULL');
  });

  it('orders the schema migration after current main and PR #288', () => {
    const migrationName = basename(migrationPath);

    expect(migrationName > '20260826010000_schedule_consultation_document_retention.sql')
      .toBe(true);
    expect(migrationName > '20260830204500_restrict_financing_application_writes.sql')
      .toBe(true);
  });
});
