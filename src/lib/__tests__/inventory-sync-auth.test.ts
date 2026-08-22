import { describe, expect, it, vi } from 'vitest';
import {
  authorizeInventorySyncRequest,
  runPrivilegedInventorySync,
  type AdminBearerVerdict,
  type InventorySyncSecrets,
} from '../../../supabase/functions/_shared/inventory-sync-auth.ts';

const INTERNAL = 'cron-secret-for-tests-only';
const SERVICE_ROLE = 'service-role-for-tests-only';
const secrets: InventorySyncSecrets = {
  internalSecret: INTERNAL,
  serviceRoleKey: SERVICE_ROLE,
};

function verifyAdmin(verdict: AdminBearerVerdict) {
  return vi.fn(async () => verdict);
}

async function runPath(
  headers: { xInternalSecret: string | null; authorization: string | null },
  verify: (token: string) => Promise<AdminBearerVerdict>,
) {
  const privilegedSync = vi.fn(async () => 'motor_models_written');
  const decision = await authorizeInventorySyncRequest(headers, secrets, verify);
  const outcome = await runPrivilegedInventorySync(decision, privilegedSync);
  return { decision, outcome, privilegedSync };
}

describe('authorizeInventorySyncRequest privileged-callback contract', () => {
  it('does not reach the privileged callback when credentials are missing', async () => {
    const verify = verifyAdmin('admin');
    const { decision, outcome, privilegedSync } = await runPath(
      { xInternalSecret: null, authorization: null },
      verify,
    );

    expect(decision).toEqual({ ok: false, status: 401, error: 'Unauthorized' });
    expect(outcome.reachedPrivilegedCallback).toBe(false);
    expect(privilegedSync).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  it('does not treat a public anon bearer as authorized', async () => {
    const verify = verifyAdmin('invalid');
    const { decision, outcome, privilegedSync } = await runPath(
      { xInternalSecret: null, authorization: 'Bearer public-anon-jwt' },
      verify,
    );

    expect(decision).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized: Invalid or expired token',
    });
    expect(outcome.reachedPrivilegedCallback).toBe(false);
    expect(privilegedSync).not.toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith('public-anon-jwt');
  });

  it('does not reach the privileged callback for a non-admin user JWT', async () => {
    const verify = verifyAdmin('non-admin');
    const { decision, outcome, privilegedSync } = await runPath(
      { xInternalSecret: null, authorization: 'Bearer user-jwt' },
      verify,
    );

    expect(decision).toEqual({
      ok: false,
      status: 403,
      error: 'Forbidden: Admin access required',
    });
    expect(outcome.reachedPrivilegedCallback).toBe(false);
    expect(privilegedSync).not.toHaveBeenCalled();
  });

  it('reaches the privileged callback for a valid admin JWT', async () => {
    const verify = verifyAdmin('admin');
    const { decision, outcome, privilegedSync } = await runPath(
      { xInternalSecret: null, authorization: 'Bearer admin-jwt' },
      verify,
    );

    expect(decision).toEqual({ ok: true, via: 'admin-jwt' });
    expect(outcome.reachedPrivilegedCallback).toBe(true);
    expect(outcome.result).toBe('motor_models_written');
    expect(privilegedSync).toHaveBeenCalledTimes(1);
  });

  it('reaches the privileged callback for the configured internal scheduler secret', async () => {
    const verify = verifyAdmin('admin');
    const { decision, outcome, privilegedSync } = await runPath(
      { xInternalSecret: INTERNAL, authorization: null },
      verify,
    );

    expect(decision).toEqual({ ok: true, via: 'internal-secret' });
    expect(outcome.reachedPrivilegedCallback).toBe(true);
    expect(privilegedSync).toHaveBeenCalledTimes(1);
    expect(verify).not.toHaveBeenCalled();
  });

  it('reaches the privileged callback for a service-role bearer', async () => {
    const verify = verifyAdmin('admin');
    const { decision, outcome, privilegedSync } = await runPath(
      { xInternalSecret: null, authorization: `Bearer ${SERVICE_ROLE}` },
      verify,
    );

    expect(decision).toEqual({ ok: true, via: 'service-role' });
    expect(outcome.reachedPrivilegedCallback).toBe(true);
    expect(privilegedSync).toHaveBeenCalledTimes(1);
    expect(verify).not.toHaveBeenCalled();
  });
});
