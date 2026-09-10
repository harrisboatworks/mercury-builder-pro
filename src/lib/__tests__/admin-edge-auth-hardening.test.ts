// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { corsHeaders as sharedCorsHeaders } from '../../../supabase/functions/_shared/cors.ts';

const compilerOptions = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 };

const transpile = (path: string) =>
  ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions }).outputText;

const adminAuthSource = transpile('supabase/functions/_shared/admin-auth.ts');
const config = readFileSync('supabase/config.toml', 'utf8');

const ENTRYPOINTS = [
  {
    slug: 'scrape-mercury-portal',
    later: '= await req.json();',
    blockedBody: { motorIds: ['motor-1'], dryRun: false },
    successBody: { dryRun: true, batchSize: 1 },
    success: { success: true },
  },
  {
    slug: 'scrape-mercury-public',
    later: '= await req.json();',
    blockedBody: { hp: 150, family: 'FourStroke', dryRun: false },
    successBody: { hp: 150, family: 'FourStroke', dryRun: true },
    success: { success: true, dryRun: true },
  },
  {
    slug: 'fetch-part-images',
    later: 'Deno.env.get("FIRECRAWL_API_KEY")',
    blockedBody: { partNumbers: ['8M0094233'] },
    successBody: { partNumbers: [] },
    success: { success: true, found: 0, total: 0 },
  },
  {
    slug: 'mark-out-of-stock',
    later: 'await req.json();',
    blockedBody: { all_brochure_models: true },
    successBody: { all_brochure_models: true },
    success: { success: true, action: 'mark_all_brochure_out_of_stock' },
  },
  {
    slug: 'sync-inventory-api',
    later: 'Starting inventory sync from API',
    blockedBody: {},
    successBody: {},
    success: { success: true, motors_fetched: 0 },
  },
  {
    slug: 'auto-image-enhancer',
    later: "Deno.env.get('SUPABASE_URL')",
    blockedBody: { batchSize: 20, enhanceExisting: true },
    successBody: { batchSize: 1 },
    success: { success: true, processed: 0 },
  },
  {
    slug: 'migrate-motor-images',
    later: "Deno.env.get('SUPABASE_URL')",
    blockedBody: { batchSize: 10, forceRedownload: true },
    successBody: { batchSize: 1 },
    success: { success: true, processed: 0 },
  },
  {
    slug: 'optimize-motor-images',
    later: "Deno.env.get('SUPABASE_URL')",
    blockedBody: { motor_id: 'motor-1' },
    successBody: { motor_id: 'motor-1' },
    success: { success: true, optimized: 0 },
  },
  {
    slug: 'motor-health-monitor',
    later: "Deno.env.get('SUPABASE_URL')",
    blockedBody: { fixIssues: true, notifyAdmin: true },
    successBody: { quickCheck: true, fixIssues: false, notifyAdmin: false },
    success: { success: true },
  },
  {
    slug: 'sync-dropbox-folder',
    later: 'await req.json()',
    blockedBody: { config_id: 'cfg-1' },
    successBody: { config_id: 'cfg-1' },
    success: { success: true, synced_files: 0 },
  },
  {
    slug: 'dropbox-chooser-upload',
    later: 'await req.json()',
    blockedBody: { fileUrl: 'https://dl.dropboxusercontent.com/evil.jpg', fileName: 'evil.jpg', motorId: 'motor-1' },
    successBody: { fileUrl: 'https://dl.dropboxusercontent.com/file.jpg', fileName: 'file.jpg' },
    success: { success: true },
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
  FIRECRAWL_API_KEY: 'test-firecrawl',
  MERCURY_DEALER_EMAIL: 'dealer@example.test',
  MERCURY_DEALER_PASSWORD: 'dealer-password',
  DROPBOX_ACCESS_TOKEN: 'test-dropbox-token',
};

const BLOCKED_ENV: Record<string, string | undefined> = {
  ...DEFAULT_ENV,
  SUPABASE_URL: undefined,
  SUPABASE_ANON_KEY: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  FIRECRAWL_API_KEY: undefined,
  MERCURY_DEALER_EMAIL: undefined,
  MERCURY_DEALER_PASSWORD: undefined,
  DROPBOX_ACCESS_TOKEN: undefined,
};

const PRIVILEGED_TABLES = ['motor_models', 'motor_media', 'dropbox_sync_config', 'notifications'];

function createQuery(table: string, writes: { table: string; op: string }[], admin = true) {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  const listResult = { data: [] as unknown[], error: null };
  const oneResult = (() => {
    if (table === 'user_roles') return { data: admin ? { role: 'admin' } : null, error: null };
    if (table === 'dropbox_sync_config') {
      return {
        data: {
          id: 'cfg-1',
          folder_path: 'https://www.dropbox.com/scl/fo/abc123/folder',
          motor_assignment_rule: null,
        },
        error: null,
      };
    }
    if (table === 'motor_models') {
      return { data: { id: 'motor-1', model: 'Test Motor', images: [] }, error: null };
    }
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
  const from = vi.fn((table: string) => createQuery(table, writes, input.headers?.Authorization !== 'Bearer member-jwt'));
  const upload = vi.fn(async () => ({ data: { path: 'uploaded' }, error: null }));
  const invokeFn = vi.fn(async () => ({ data: { success: true }, error: null }));
  const pingMotorUpdates = vi.fn();
  const createClient = vi.fn((_url?: string, _key?: string) => ({
    from,
    auth: {
      getUser: async (jwt: string) => {
        if (jwt === 'admin-jwt' || jwt === 'member-jwt') return { data: { user: { id: 'admin-user' } }, error: null };
        return { data: { user: null }, error: new Error('invalid') };
      },
    },
    storage: {
      from: () => ({
        upload,
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage.example.test/file.jpg' } }),
      }),
    },
    functions: { invoke: invokeFn },
  }));

  const originalFetch = globalThis.fetch;
  const fetchImpl = vi.fn(async (requestInfo: RequestInfo | URL) => {
    const url = String(requestInfo);
    if (url.includes('harrisboatworks.ca/api/inventory.php')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('api.firecrawl.dev')) {
      return new Response(JSON.stringify({ success: true, data: { markdown: '', html: '', links: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('api.dropboxapi.com')) {
      return new Response(JSON.stringify({ entries: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('file-bytes', { status: 200 });
  });
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
    const adminAuth: { requireAdmin?: (req: Request, cors: Record<string, string>) => Promise<unknown> } = {};
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
          'https://deno.land/x/xhr@0.1.0/mod.ts': {},
          'npm:@supabase/supabase-js@2.53.1': { createClient },
          '../_shared/admin-auth.ts': adminAuth,
          '../_shared/cors.ts': { corsHeaders: sharedCorsHeaders },
          '../_shared/indexnow.ts': { pingMotorUpdates, pingIndexNow: vi.fn() },
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
    return { response, createClient, from, fetchImpl, upload, invokeFn, pingMotorUpdates, writes };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function expectNoSideEffects(result: Awaited<ReturnType<typeof invoke>>) {
  expect(result.fetchImpl).not.toHaveBeenCalled();
  expect(result.upload).not.toHaveBeenCalled();
  expect(result.invokeFn).not.toHaveBeenCalled();
  expect(result.pingMotorUpdates).not.toHaveBeenCalled();
  expect(result.writes.filter((write) => PRIVILEGED_TABLES.includes(write.table))).toEqual([]);
  expect(result.from.mock.calls.map(([table]) => table).filter((table) => PRIVILEGED_TABLES.includes(table))).toEqual([]);
}

describe('admin edge auth hardening', () => {
  it.each(ENTRYPOINTS)('places requireAdmin after OPTIONS and before work in $slug', ({ slug, later }) => {
    const source = readFileSync(`supabase/functions/${slug}/index.ts`, 'utf8');
    expect(source).toContain('import { requireAdmin } from "../_shared/admin-auth.ts";');
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
  });

  it.each(ENTRYPOINTS)('blocks an unauthenticated $slug request before side effects', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      body: entry.blockedBody,
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
      body: entry.blockedBody,
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
      body: entry.blockedBody,
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

  it.each(ENTRYPOINTS)('allows the internal secret through $slug', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      body: entry.successBody,
      headers: { 'x-internal-secret': 'test-internal-secret' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
  });

  it.each(ENTRYPOINTS)('allows the service-role bearer through $slug', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      body: entry.successBody,
      headers: { Authorization: 'Bearer test-service-role' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
  });

  it.each(ENTRYPOINTS)('allows an admin JWT through $slug', async (entry) => {
    const result = await invoke({
      slug: entry.slug,
      body: entry.successBody,
      headers: { Authorization: 'Bearer admin-jwt' },
    });
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toMatchObject(entry.success);
    expect(result.from).toHaveBeenCalledWith('user_roles');
  });

  it('explicitly preserves the verified live gateway settings for the gated slugs', () => {
    expect(config).toMatch(/\[functions\.mark-out-of-stock\]\s*\nverify_jwt = true/);
    expect(config).toMatch(/\[functions\.scrape-mercury-portal\]\s*\nverify_jwt = true/);
    for (const slug of [
      'scrape-mercury-public',
      'fetch-part-images',
      'sync-inventory-api',
      'auto-image-enhancer',
      'migrate-motor-images',
      'optimize-motor-images',
      'motor-health-monitor',
      'sync-dropbox-folder',
      'dropbox-chooser-upload',
    ]) {
      expect(config).toContain(`[functions.${slug}]\nverify_jwt = false`);
    }
  });

});
