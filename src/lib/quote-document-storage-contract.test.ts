// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = 'supabase/migrations/20260809184500_make_customer_quote_documents_private.sql';
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('customer quote document storage contract', () => {
  it('makes the legacy quote-document bucket private without deleting objects', () => {
    const migration = read(migrationPath);

    expect(migration).toContain('DROP POLICY IF EXISTS "Spec sheets are publicly accessible" ON storage.objects');
    expect(migration).toContain('DROP POLICY IF EXISTS "Public can view spec sheets" ON storage.objects');
    expect(migration).toMatch(/UPDATE\s+storage\.buckets/i);
    expect(migration).toMatch(/SET\s+public\s*=\s*false/i);
    expect(migration).toMatch(/WHERE\s+id\s*=\s*'spec-sheets'/i);
    expect(migration).not.toMatch(/DELETE\s+FROM\s+storage\.(objects|buckets)/i);
  });
});
