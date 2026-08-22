/**
 * Authorization for sync-lightspeed-inventory.
 *
 * The public anon JWT cannot distinguish a quote-builder browser from the
 * current pg_cron job (both send Authorization: Bearer <anon>). Approved
 * callers after this gate are:
 *   - x-internal-secret matching EDGE_INTERNAL_SECRET or CRON_SECRET
 *   - Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *   - a real user JWT that verifyAdminBearer confirms is an admin
 *
 * BLOCKED: do not deploy until lightspeed-motor-models-sync-daily is
 * rewritten off the public anon JWT. This helper does not create or
 * rotate secrets and does not rewrite cron.
 */

export type InventorySyncCaller =
  | 'internal-secret'
  | 'service-role'
  | 'bearer-present'
  | 'unauthenticated';

export type InventorySyncHeaders = {
  xInternalSecret: string | null;
  authorization: string | null;
};

export type InventorySyncSecrets = {
  internalSecret: string | null;
  serviceRoleKey: string | null;
};

export type AdminBearerVerdict = 'admin' | 'non-admin' | 'invalid';

export type InventorySyncAuthDecision =
  | { ok: true; via: 'internal-secret' | 'service-role' | 'admin-jwt' }
  | { ok: false; status: 401 | 403; error: string };

export function classifyInventorySyncCaller(
  headers: InventorySyncHeaders,
  secrets: InventorySyncSecrets,
): InventorySyncCaller {
  const providedSecret = headers.xInternalSecret?.trim() || null;
  const configuredSecret = secrets.internalSecret?.trim() || null;

  if (configuredSecret && providedSecret && providedSecret === configuredSecret) {
    return 'internal-secret';
  }

  const token = bearerToken(headers.authorization);

  if (secrets.serviceRoleKey && token && token === secrets.serviceRoleKey) {
    return 'service-role';
  }

  if (token) {
    return 'bearer-present';
  }

  return 'unauthenticated';
}

export function bearerToken(authorization: string | null): string {
  const value = authorization?.trim() || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return value.slice(7).trim();
}

export async function authorizeInventorySyncRequest(
  headers: InventorySyncHeaders,
  secrets: InventorySyncSecrets,
  verifyAdminBearer: (token: string) => Promise<AdminBearerVerdict>,
): Promise<InventorySyncAuthDecision> {
  const caller = classifyInventorySyncCaller(headers, secrets);

  if (caller === 'internal-secret') {
    return { ok: true, via: 'internal-secret' };
  }
  if (caller === 'service-role') {
    return { ok: true, via: 'service-role' };
  }
  if (caller === 'unauthenticated') {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const verdict = await verifyAdminBearer(bearerToken(headers.authorization));
  if (verdict === 'admin') {
    return { ok: true, via: 'admin-jwt' };
  }
  if (verdict === 'non-admin') {
    return { ok: false, status: 403, error: 'Forbidden: Admin access required' };
  }
  return { ok: false, status: 401, error: 'Unauthorized: Invalid or expired token' };
}

export async function runPrivilegedInventorySync<T>(
  decision: InventorySyncAuthDecision,
  privilegedSync: () => Promise<T> | T,
): Promise<{
  reachedPrivilegedCallback: boolean;
  result?: T;
  status?: number;
  error?: string;
}> {
  if (decision.ok === false) {
    return {
      reachedPrivilegedCallback: false,
      status: decision.status,
      error: decision.error,
    };
  }

  const result = await privilegedSync();
  return { reachedPrivilegedCallback: true, result };
}
