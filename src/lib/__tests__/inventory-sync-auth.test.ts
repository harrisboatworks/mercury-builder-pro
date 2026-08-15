import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyInventorySyncCaller } from '../../../supabase/functions/_shared/inventory-sync-auth.ts';

const INTERNAL = 'cron-secret-for-tests-only';
const SERVICE_ROLE = 'service-role-for-tests-only';

describe('classifyInventorySyncCaller', () => {
  it('rejects missing credentials before any inventory write', () => {
    expect(
      classifyInventorySyncCaller(
        { xInternalSecret: null, authorization: null },
        { internalSecret: INTERNAL, serviceRoleKey: SERVICE_ROLE },
      ),
    ).toBe('unauthenticated');
  });

  it('rejects an invalid internal secret without a bearer', () => {
    expect(
      classifyInventorySyncCaller(
        { xInternalSecret: 'wrong-secret', authorization: null },
        { internalSecret: INTERNAL, serviceRoleKey: SERVICE_ROLE },
      ),
    ).toBe('unauthenticated');
  });

  it('does not treat the public anon JWT as an approved scheduler', () => {
    expect(
      classifyInventorySyncCaller(
        { xInternalSecret: null, authorization: 'Bearer public-anon-jwt' },
        { internalSecret: INTERNAL, serviceRoleKey: SERVICE_ROLE },
      ),
    ).toBe('bearer-present');
  });

  it('accepts the configured internal scheduler secret', () => {
    expect(
      classifyInventorySyncCaller(
        { xInternalSecret: INTERNAL, authorization: null },
        { internalSecret: INTERNAL, serviceRoleKey: SERVICE_ROLE },
      ),
    ).toBe('internal-secret');
  });

  it('accepts a service-role bearer as an approved admin/scheduler path', () => {
    expect(
      classifyInventorySyncCaller(
        { xInternalSecret: null, authorization: `Bearer ${SERVICE_ROLE}` },
        { internalSecret: INTERNAL, serviceRoleKey: SERVICE_ROLE },
      ),
    ).toBe('service-role');
  });
});

describe('sync-lightspeed-inventory authorization contract', () => {
  const source = readFileSync('supabase/functions/sync-lightspeed-inventory/index.ts', 'utf8');

  it('classifies the caller and runs requireAdmin before creating the service-role client', () => {
    const classifyAt = source.indexOf('classifyInventorySyncCaller');
    const requireAdminAt = source.indexOf('requireAdmin(req, corsHeaders)');
    const serviceClientAt = source.indexOf('createClient(supabaseUrl, supabaseKey)');

    expect(classifyAt).toBeGreaterThan(-1);
    expect(requireAdminAt).toBeGreaterThan(classifyAt);
    expect(serviceClientAt).toBeGreaterThan(requireAdminAt);
    expect(source).toContain("if (caller === 'unauthenticated')");
    expect(source).toContain("if (caller === 'bearer-present')");
    expect(source).toContain('x-internal-secret');
  });

  it('does not execute a real Lightspeed inventory sync from tests', () => {
    expect(source).not.toContain('https://api.lightspeed');
    expect(readFileSync('src/lib/__tests__/inventory-sync-auth.test.ts', 'utf8')).not.toContain(
      "functions.invoke('sync-lightspeed-inventory')",
    );
  });
});
