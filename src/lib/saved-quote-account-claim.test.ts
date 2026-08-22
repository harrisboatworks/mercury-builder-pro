// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  calls: [] as string[],
  eqFilters: [] as Array<[string, unknown]>,
  orFilters: [] as string[],
  rpc: vi.fn(),
  order: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mocks.rpc,
    from: vi.fn(() => {
      const query = {
        eq: vi.fn((column: string, value: unknown) => {
          mocks.eqFilters.push([column, value]);
          return query;
        }),
        or: vi.fn((filter: string) => {
          mocks.orFilters.push(filter);
          return query;
        }),
        order: mocks.order,
      };
      return { select: vi.fn(() => query) };
    }),
  },
}));

import { loadOwnedSavedQuotes } from './saved-quote-account';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('saved quote account claim contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calls.length = 0;
    mocks.eqFilters.length = 0;
    mocks.orFilters.length = 0;
    mocks.rpc.mockImplementation(async () => {
      mocks.calls.push('claim');
      return { data: 0, error: new Error('claim unavailable') };
    });
    mocks.order.mockImplementation(async () => {
      mocks.calls.push('list');
      return { data: [{ id: 'owned-quote' }], error: null };
    });
  });

  it('claims guest saves before My Quotes filters by ownership and soft-lead status', () => {
    const loader = read('src/lib/saved-quote-account.ts');
    const claimAt = loader.indexOf(".rpc('claim_saved_quotes_for_current_user')");
    const listAt = loader.indexOf(".from('saved_quotes')");

    expect(claimAt).toBeGreaterThan(0);
    expect(listAt).toBeGreaterThan(claimAt);
    expect(loader).toContain(".eq('user_id', userId)");
    expect(loader).toContain(".or('is_soft_lead.is.null,is_soft_lead.eq.false')");
  });

  it('still lists already-owned quotes when claim reconciliation fails', async () => {
    await expect(loadOwnedSavedQuotes('user-1')).resolves.toEqual({
      data: [{ id: 'owned-quote' }],
      error: null,
    });
    expect(mocks.calls).toEqual(['claim', 'list']);
    expect(mocks.eqFilters).toEqual([['user_id', 'user-1']]);
    expect(mocks.orFilters).toEqual(['is_soft_lead.is.null,is_soft_lead.eq.false']);
  });

  it('still lists already-owned quotes when the claim request rejects', async () => {
    mocks.rpc.mockImplementation(async () => {
      mocks.calls.push('claim');
      throw new Error('network unavailable');
    });

    await expect(loadOwnedSavedQuotes('user-1')).resolves.toEqual({
      data: [{ id: 'owned-quote' }],
      error: null,
    });
    expect(mocks.calls).toEqual(['claim', 'list']);
    expect(mocks.eqFilters).toEqual([['user_id', 'user-1']]);
    expect(mocks.orFilters).toEqual(['is_soft_lead.is.null,is_soft_lead.eq.false']);
  });

  it('uses a least-privilege confirmed-email claim and user-id-only RLS', () => {
    const migration = read('supabase/migrations/20260809183000_claim_saved_quotes_for_user.sql');

    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain('FROM auth.users AS user_record');
    expect(migration).toContain('user_record.email_confirmed_at IS NOT NULL');
    expect(migration).toContain('WHERE user_id IS NULL');
    expect(migration).toContain('COALESCE(is_soft_lead, false) IS FALSE');
    expect(migration).toContain('pg_catalog.lower(email) = requester_email');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.claim_saved_quotes_for_current_user() FROM PUBLIC');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.claim_saved_quotes_for_current_user() TO authenticated');
    expect(migration).toContain('CREATE POLICY "Saved quote inserts cannot assign another user"');
    expect(migration).toContain('AS RESTRICTIVE');
    expect(migration).toContain('WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()))');
    expect(migration).toContain('USING (user_id = (SELECT auth.uid()))');
    expect(migration).toContain('WITH CHECK (user_id = (SELECT auth.uid()))');
    expect(migration).not.toContain("auth.jwt() ->> 'email_verified'");
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.saved_quotes/i);
  });
});
