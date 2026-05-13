/**
 * Integration test: verifies that an authenticated user can execute the
 * `encrypt_sin` RPC and INSERT a financing submission log.
 *
 * Regression guard for the May 2026 incident where a security migration
 * accidentally revoked EXECUTE on encrypt_sin from `authenticated`, which
 * caused every financing submission to fail with permission denied.
 *
 * Skipped if no test credentials are provided. To enable locally, set:
 *   FINANCING_TEST_EMAIL=...    (an existing confirmed test user)
 *   FINANCING_TEST_PASSWORD=...
 *
 * In CI, populate those secrets to run end-to-end.
 */
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const TEST_EMAIL = (import.meta.env.FINANCING_TEST_EMAIL as string) || process.env.FINANCING_TEST_EMAIL;
const TEST_PASSWORD =
  (import.meta.env.FINANCING_TEST_PASSWORD as string) || process.env.FINANCING_TEST_PASSWORD;

const enabled = Boolean(SUPABASE_URL && SUPABASE_ANON && TEST_EMAIL && TEST_PASSWORD);

describe.skipIf(!enabled)('financing submission permissions (integration)', () => {
  it('authenticated users can execute encrypt_sin and write a submission log', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL!,
      password: TEST_PASSWORD!,
    });
    expect(signInError, `sign-in failed: ${signInError?.message}`).toBeNull();
    expect(signIn.session?.access_token).toBeTruthy();

    // 1. encrypt_sin must be callable by authenticated users
    const { data: encrypted, error: rpcError } = await supabase.rpc('encrypt_sin', {
      sin_plaintext: '046454286', // valid SIN format (Luhn-valid test number)
    });
    expect(
      rpcError,
      `encrypt_sin RPC failed for authenticated user. ` +
        `If this is "permission denied", restore EXECUTE on public.encrypt_sin to authenticated. ` +
        `Error: ${rpcError?.message}`,
    ).toBeNull();
    expect(typeof encrypted).toBe('string');
    expect((encrypted as string).length).toBeGreaterThan(0);

    // 2. authenticated users (and anon) can insert into the log table
    const { error: logError } = await supabase.from('financing_submission_logs').insert({
      stage: 'encrypt_applicant_sin',
      outcome: 'success',
      metadata: { source: 'vitest-integration' },
    });
    expect(logError, `log insert failed: ${logError?.message}`).toBeNull();

    await supabase.auth.signOut();
  }, 30_000);
});
