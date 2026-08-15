/**
 * Caller classification for sync-lightspeed-inventory.
 *
 * The public anon JWT cannot distinguish a quote-builder browser from the
 * current pg_cron job (both send Authorization: Bearer <anon>). Approved
 * callers after this gate are:
 *   - x-internal-secret matching EDGE_INTERNAL_SECRET or CRON_SECRET
 *   - Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *   - a real user JWT that requireAdmin later confirms is an admin
 *
 * Missing/invalid credentials are unauthenticated. A non-service-role bearer
 * is "bearer-present" so the function can run requireAdmin without treating
 * anon as authorized.
 */
export type InventorySyncCaller =
  | 'internal-secret'
  | 'service-role'
  | 'bearer-present'
  | 'unauthenticated';

export function classifyInventorySyncCaller(
  headers: {
    xInternalSecret: string | null;
    authorization: string | null;
  },
  secrets: {
    internalSecret: string | null;
    serviceRoleKey: string | null;
  },
): InventorySyncCaller {
  const providedSecret = headers.xInternalSecret?.trim() || null;
  const configuredSecret = secrets.internalSecret?.trim() || null;

  if (configuredSecret && providedSecret && providedSecret === configuredSecret) {
    return 'internal-secret';
  }

  const authorization = headers.authorization?.trim() || '';
  const token = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (secrets.serviceRoleKey && token && token === secrets.serviceRoleKey) {
    return 'service-role';
  }

  if (token) {
    return 'bearer-present';
  }

  return 'unauthenticated';
}
