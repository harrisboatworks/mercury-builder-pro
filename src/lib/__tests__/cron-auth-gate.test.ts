// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const compilerOptions = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 };

const transpile = (path: string) =>
  ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions }).outputText;

const adminAuthSource = transpile('supabase/functions/_shared/admin-auth.ts');
const config = readFileSync('supabase/config.toml', 'utf8');

const ENTRYPOINTS = [
  {
    slug: 'check-expiring-promotions',
    later: "Deno.env.get('SUPABASE_URL')",
    success: { success: true, alerted: 0 },
  },
  {
    slug: 'sync-lightspeed-inventory',
    later: 'const startedAt = new Date().toISOString()',
    success: { success: true, source: 'lightspeed' },
  },
] as const;

const handlerSource = Object.fromEntries(
  ENTRYPOINTS.map((entry) => [entry.slug, transpile(`supabase/functions/${entry.slug}/index.ts`)]),
);

const DEFAULT_ENV: Record<string, string | undefined> = {
  SUPABASE_URL: 'https://db.example.test',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  EDGE_INTERNAL_SECRET: 'test-internal-secret',
  CRON_SECRET: 'test-cron-secret',
  RESEND_API_KEY: 'test-resend',
  ADMIN_EMAIL: 'admin@example.test',
  APP_URL: 'https://example.test',
};

const BLOCKED_ENV: Record<string, string | undefined> = {
  ...DEFAULT_ENV,
  SUPABASE_URL: undefined,
  SUPABASE_ANON_KEY: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  RESEND_API_KEY: undefined,
};

const PRIVILEGED_TABLES = [
  'promotions',
  'cron_job_logs',
  'mercury_motor_inventory',
  'motor_models',
  'sync_logs',
  'admin_sources',
];

function createQuery(table: string, writes: { table: string; op: string }[], admin = true) {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  const listResult = { data: [] as unknown[], error: null };
  const oneResult = (() => {
    if (table === 'user_roles') return { data: admin ? { role: 'admin' } : null, error: null };
    return { data: null, error: null };
  })();

  Object.assign(query, {
    select: chain,
    insert: (row: unknown) => {
      writes.push({ table, op: 'insert' });
      void row;
      return query;
    },
    update: (row: unknown) => {
      writes.push({ table, op: 'update' });
      void row;
      return query;
    },
    upsert: (row: unknown) => {
      writes.push({ table, op: 'upsert' });
      void row;
      return query;
    },
    delete: () => {
      writes.push({ table, op: 'delete' });
      return query;
    },
    eq: chain,
    in: chain,
    not: chain,
    or: chain,
    ilike: chain,
    is: chain,
    neq: chain,
    gte: chain,
    lte: chain,
    order: chain,
    limit: chain,
    maybeSingle: async () => {
      const data = Array.isArray(oneResult.data) ? oneResult.data[0] ?? null : oneResult.data;
      return { data, error: oneResult.error };
    },
    single: async () => oneResult,
    then(
      onFulfilled?: (value: { data: unknown; error: unknown }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(listResult).then(onFulfilled, onRejected);
    },
  });
  return query;
}

async function invoke(input: {
  slug: (typeof ENTRYPOINTS)[number]['slug'];
  method?: string;
  headers?: Record<string, string>;
  env?: Record<string, string | undefined>;
  body?: unknown;
}) {
  const env = { ...DEFAULT_ENV, ...input.env };
  const writes: { table: string; op: string }[] = [];
  const from = vi.fn((table: string) =>
    createQuery(table, writes, input.headers?.Authorization !== 'Bearer member-jwt'),
  );
  const invokeFn = vi.fn(async () => ({ data: { success: true }, error: null }));
  const pingMotorUpdates = vi.fn();
  const resendSend = vi.fn(async () => ({ data: { id: 'email-1' }, error: null }));
  const createClient = vi.fn((_url?: string, _key?: string) => ({
    from,
    auth: {
      getUser: async (jwt: string) => {
        if (jwt === 'admin-jwt' || jwt === 'member-jwt') {
          return { data: { user: { id: 'admin-user' } }, error: null };
        }
        return { data: { user: null }, error: new Error('invalid') };
      },
    },
    functions: { invoke: invokeFn },
  }));

  const originalFetch = globalThis.fetch;
  const fetchImpl = vi.fn(async () => new Response('ok', { status: 200 }));
  globalThis.fetch = fetchImpl as typeof fetch;

  const captureServe = (fn: (request: Request) => Promise<Response>) => {
    handler = fn;
  };
  let handler!: (request: Request) => Promise<Response>;
  const deno = {
    env: { get: (name: string) => env[name] },
    serve: captureServe,
  };

  try {
    const adminAuth: { requireAdmin?: (req: Request, cors: Record<string, string>) => Promise<unknown> } =
      {};
    new Function('require', 'exports', 'Deno', adminAuthSource)(
      (specifier: string) => {
        if (specifier === 'npm:@supabase/supabase-js@2.53.1') return { createClient };
        throw new Error(`Unmocked admin-auth import: ${specifier}`);
      },
      adminAuth,
      deno,
    );

    new Function('require', 'exports', 'Deno', handlerSource[input.slug])(
      (specifier: string) => {
        const imports: Record<string, unknown> = {
          'https://deno.land/std@0.190.0/http/server.ts': { serve: captureServe },
          'npm:@supabase/supabase-js@2.53.1': { createClient },
          'npm:resend@2.0.0': {
            Resend: class Resend {
              emails = { send: resendSend };
            },
          },
          '../_shared/admin-auth.ts': adminAuth,
          '../_shared/indexnow.ts': { pingMotorUpdates, pingIndexNow: vi.fn() },
          '../_shared/email-template.ts': {
            createBrandedEmailTemplate: () => '<html></html>',
            createButtonHtml: () => '<a></a>',
          },
          '../_shared/promo-dates.ts': {
            dealerToday: () => '2026-09-10',
            addDealerCalendarDays: () => '2026-09-17',
            daysUntil: () => 3,
            formatPromoCalendarDate: () => 'Sep 13, 2026',
          },
        };
        if (!(specifier in imports)) throw new Error(`Unmocked import: ${specifier}`);
        return imports[specifier];
      },
      {},
      deno,
    );

    const method = input.method ?? 'POST';
    const headers = { ...input.headers };
    const init: RequestInit = { method, headers };
    if (method !== 'OPTIONS') {
      headers['content-type'] = headers['content-type'] ?? 'application/json';
      init.headers = headers;
      init.body = JSON.stringify(input.body ?? {});
    }

    const response = await handler(new Request(`https://edge.example.test/${input.slug}`, init));
    return { response, createClient, from, fetchImpl, invokeFn, pingMotorUpdates, resendSend, writes };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function expectNoSideEffects(result: Awaited<ReturnType<typeof invoke>>) {
  expect(result.fetchImpl).not.toHaveBeenCalled();
  expect(result.invokeFn).not.toHaveBeenCalled();
  expect(result.pingMotorUpdates).not.toHaveBeenCalled();
  expect(result.resendSend).not.toHaveBeenCalled();
  expect(result.writes.filter((write) => PRIVILEGED_TABLES.includes(write.table))).toEqual([]);
  expect(
    result.from.mock.calls.map(([table]) => table).filter((table) => PRIVILEGED_TABLES.includes(table)),
  ).toEqual([]);
}

describe('cron auth gates', () => {
  it.each(ENTRYPOINTS)('places requireAdmin after OPTIONS and before work in $slug', ({ slug, later }) => {
    const source = readFileSync(`supabase/functions/${slug}/index.ts`, 'utf8');
    expect(source).toMatch(/import \{ requireAdmin \} from ['"]\.\.\/_shared\/admin-auth\.ts['"];/);
    expect(source).toContain('if (authResult instanceof Response) return authResult;');

    const options = Math.min(
      ...["req.method === 'OPTIONS'", 'req.method === "OPTIONS"']
        .map((needle) => source.indexOf(needle))
        .filter((index) => index >= 0),
    );
    const gate = source.indexOf('await requireAdmin(req, corsHeaders)');
    const work = source.indexOf(later);
    expect(options).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(options);
    expect(work).toBeGreaterThan(gate);
    expect(source.indexOf('const supabase = createClient')).toBeGreaterThan(gate);
  });

  it.each(ENTRYPOINTS)('blocks an unauthenticated $slug request before side effects', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      env: BLOCKED_ENV,
    });
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: 'Missing Authorization header' });
    expect(result.createClient).not.toHaveBeenCalled();
    expectNoSideEffects(result);
  });

  it.each(ENTRYPOINTS)('blocks the public anon bearer on $slug before side effects', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      headers: { Authorization: 'Bearer test-anon-key' },
      env: { ...BLOCKED_ENV, SUPABASE_ANON_KEY: 'test-anon-key' },
    });
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: 'Unauthorized: Invalid or expired token' });
    expectNoSideEffects(result);
  });

  it.each(ENTRYPOINTS)('rejects a signed-in non-admin on $slug before side effects', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      headers: { Authorization: 'Bearer member-jwt' },
    });
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toEqual({ error: 'Forbidden: Admin access required' });
    expectNoSideEffects(result);
  });

  it.each(ENTRYPOINTS)('returns the existing CORS preflight for $slug without auth', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      method: 'OPTIONS',
      env: BLOCKED_ENV,
    });
    expect(result.response.status).toBe(200);
    expect(result.response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(result.createClient).not.toHaveBeenCalled();
    expectNoSideEffects(result);
  });

  it.each(ENTRYPOINTS)('allows the selected internal secret through $slug', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      headers: { 'x-internal-secret': 'test-internal-secret' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
  });

  it.each(ENTRYPOINTS)('allows the service-role bearer through $slug', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      headers: { Authorization: 'Bearer test-service-role' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
  });

  it.each(ENTRYPOINTS)('allows an admin JWT through $slug', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      headers: { Authorization: 'Bearer admin-jwt' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
    expect(result.from).toHaveBeenCalledWith('user_roles');
  });

  it.each(ENTRYPOINTS)('uses EDGE_INTERNAL_SECRET over CRON_SECRET on $slug', async (entry) => {
    const rejected = await invoke({
      slug: entry.slug,
      headers: { 'x-internal-secret': 'test-cron-secret' },
      env: BLOCKED_ENV,
    });
    expect(rejected.response.status).toBe(401);
    expect(await rejected.response.json()).toEqual({ error: 'Missing Authorization header' });
    expectNoSideEffects(rejected);

    const accepted = await invoke({
      slug: entry.slug,
      headers: { 'x-internal-secret': 'test-internal-secret' },
    });
    expect(accepted.response.status).toBe(200);
    expect(await accepted.response.json()).toMatchObject(entry.success);
  });

  it.each(ENTRYPOINTS)('accepts CRON_SECRET on $slug only when it is the selected secret', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      headers: { 'x-internal-secret': 'test-cron-secret' },
      env: { EDGE_INTERNAL_SECRET: undefined, CRON_SECRET: 'test-cron-secret' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
  });

  it('explicitly sets verify_jwt = false for the two gated cron slugs', () => {
    expect(config).toContain('[functions.check-expiring-promotions]\nverify_jwt = false');
    expect(config).toContain('[functions.sync-lightspeed-inventory]\nverify_jwt = false');
  });
});
