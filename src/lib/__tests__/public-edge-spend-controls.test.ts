// @vitest-environment node
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const slugs = ['voice-create-quote', 'locally-inventory', 'generate-spec-sheet-insights'] as const;
it('explicitly preserves the verified live public gateway settings', () => {
  const config = readFileSync('supabase/config.toml', 'utf8');
  for (const slug of slugs) {
    expect(config).toContain(`[functions.${slug}]\nverify_jwt = false`);
  }
});
type Slug = typeof slugs[number];
const source = new Map<string, string>();
function compiled(path: string) {
  if (!source.has(path)) source.set(path, ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  return source.get(path)!;
}
const validBodies: Record<Slug, object> = {
  'voice-create-quote': { customer_name: 'Test', customer_email: 'test@example.test', motor_id: 'test-motor' },
  'locally-inventory': { query: 'test part' },
  'generate-spec-sheet-insights': { motor: { hp: 20, model: '20 HP', family: 'FourStroke' } },
};

async function invoke(slug: Slug, options: {
  headers?: Record<string, string>;
  method?: string;
  body?: object;
  env?: Record<string, string | undefined>;
  limit?: 'deny' | 'error' | 'throw' | 'recipient';
} = {}) {
  const env: Record<string, string | undefined> = {
    SUPABASE_URL: 'https://db.example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    AGENT_QUOTE_API_KEY: 'test-agent-key', LOCALLY_API_KEY: 'test-locally-key',
    PERPLEXITY_API_KEY: 'test-perplexity-key', ...options.env,
  };
  const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => {
    if (options.limit === 'throw') throw new Error('test RPC unavailable');
    if (options.limit === 'error') return { data: null, error: { message: 'test unavailable' } };
    return { data: !(options.limit === 'deny' || (options.limit === 'recipient' && args._action === 'voice_create_quote_email')), error: null };
  });
  const createClient = vi.fn(() => ({ rpc }));
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.includes('agent-quote-api')) return Response.json({ quote_id: 'test-quote', pricing: { finalPrice: 100 } });
    if (url.includes('perplexity.ai')) return Response.json({ choices: [{ message: { content: JSON.stringify({ insights: ['a', 'b', 'c'], ideal_uses: ['a', 'b', 'c'], mercury_advantages: ['a', 'b', 'c'] }) } }] });
    return Response.json({ success: true, data: { stores: [] } });
  });
  let handler!: (req: Request) => Promise<Response>;
  const serve = (fn: typeof handler) => { handler = fn; };
  const deno = { env: { get: (key: string) => env[key] }, serve };
  const modules = new Map<string, Record<string, unknown>>();
  function load(path: string): Record<string, unknown> {
    if (modules.has(path)) return modules.get(path)!;
    const exports: Record<string, unknown> = {};
    modules.set(path, exports);
    const require = (name: string): unknown => {
      if (name.startsWith('https://deno.land/std@')) return { serve };
      if (name === 'https://esm.sh/@supabase/supabase-js@2.53.1') return { createClient };
      if (name.startsWith('../_shared/')) return load(`supabase/functions/_shared/${name.slice('../_shared/'.length)}`);
      if (name.startsWith('./')) return load(`${path.slice(0, path.lastIndexOf('/') + 1)}${name.slice(2)}`);
      throw new Error(`Unmocked import ${name}`);
    };
    new Function('require', 'exports', 'Deno', 'fetch', 'crypto', compiled(path))(require, exports, deno, fetchMock, webcrypto);
    return exports;
  }
  load(`supabase/functions/${slug}/index.ts`);
  const method = options.method ?? 'POST';
  const req = new Request(`https://edge.example.test/${slug}`, {
    method, headers: options.headers ?? { origin: 'https://www.mercuryrepower.ca', 'x-forwarded-for': '192.0.2.1' },
    ...(method === 'OPTIONS' ? {} : { body: JSON.stringify(options.body ?? validBodies[slug]) }),
  });
  const json = vi.spyOn(req, 'json');
  const response = await handler(req);
  return { response, rpc, createClient, fetchMock, json };
}

describe('public Edge spend controls', () => {
  it.each(slugs)('preserves unauthenticated OPTIONS for %s without work', async (slug) => {
    const result = await invoke(slug, { method: 'OPTIONS', headers: {} });
    expect(result.response.status).toBe(200);
    expect(result.response.headers.get('access-control-allow-origin')).toBe('*');
    expect(result.rpc).not.toHaveBeenCalled();
    expect(result.fetchMock).not.toHaveBeenCalled();
  });

  for (const headers of [{}, { origin: 'https://attacker.example' }, { origin: 'https://www.mercuryrepower.ca.attacker.example' }, { authorization: 'Bearer public-anon-key' }, { authorization: 'Bearer wrong-service-key' }]) {
    it.each(slugs)(`rejects untrusted headers ${JSON.stringify(headers)} before body or RPC in %s`, async (slug) => {
      const result = await invoke(slug, { headers });
      expect(result.response.status).toBe(403);
      expect(result.json).not.toHaveBeenCalled();
      expect(result.rpc).not.toHaveBeenCalled();
      expect(result.fetchMock).not.toHaveBeenCalled();
    });
  }

  it.each(slugs)('preserves the public browser path through %s', async (slug) => {
    const result = await invoke(slug);
    expect(result.response.status).toBe(200);
    expect(result.fetchMock).toHaveBeenCalledTimes(1);
    expect(result.rpc.mock.calls[0][1]._identifier).toBe('192.0.2.1');
  });

  it.each(slugs)('preserves service-role callers without Origin on %s with a fixed quota key', async (slug) => {
    const result = await invoke(slug, { headers: { authorization: 'Bearer test-service-key', 'x-forwarded-for': '192.0.2.9' } });
    expect(result.response.status).toBe(200);
    expect(result.rpc.mock.calls[0][1]._identifier).toBe('service_role');
    expect(result.fetchMock).toHaveBeenCalledTimes(1);
  });

  for (const limit of ['deny', 'error', 'throw'] as const) {
    it.each(slugs)(`fails closed on ${limit} before body parsing or paid work in %s`, async (slug) => {
      const result = await invoke(slug, { limit });
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get('retry-after')).toBe('60');
      expect(result.json).not.toHaveBeenCalled();
      expect(result.fetchMock).not.toHaveBeenCalled();
    });
  }

  it.each(slugs)('fails closed when limiter credentials are missing in %s', async (slug) => {
    const result = await invoke(slug, { env: { SUPABASE_SERVICE_ROLE_KEY: undefined } });
    expect(result.response.status).toBe(429);
    expect(result.json).not.toHaveBeenCalled();
    expect(result.fetchMock).not.toHaveBeenCalled();
  });

  it('bounds quote email per recipient before invoking the privileged quote API', async () => {
    const result = await invoke('voice-create-quote', { limit: 'recipient' });
    expect(result.response.status).toBe(429);
    expect(result.response.headers.get('retry-after')).toBe('300');
    expect(result.rpc).toHaveBeenCalledTimes(2);
    expect(result.fetchMock).not.toHaveBeenCalled();
    expect(result.rpc.mock.calls[1][1]).toMatchObject({ _action: 'voice_create_quote_email', _max_attempts: 3, _window_minutes: 60 });
  });

  it('uses the same opaque recipient bucket across email casing and caller IPs', async () => {
    const a = await invoke('voice-create-quote');
    const b = await invoke('voice-create-quote', { headers: { origin: 'https://mercuryrepower.ca', 'x-forwarded-for': '192.0.2.2' }, body: { ...validBodies['voice-create-quote'], customer_email: 'TEST@EXAMPLE.TEST' } });
    const key = a.rpc.mock.calls[1][1]._identifier;
    expect(key).toMatch(/^email:[a-f0-9]{64}$/);
    expect(b.rpc.mock.calls[1][1]._identifier).toBe(key);
  });

  it('retains explicit no-email quotes under the request quota only', async () => {
    const result = await invoke('voice-create-quote', { body: { ...validBodies['voice-create-quote'], send_customer_email: false } });
    expect(result.response.status).toBe(200);
    expect(result.rpc).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(result.fetchMock.mock.calls[0][1]?.body)).send_customer_email).toBe(false);
  });

  it('retains required-field validation before recipient or upstream work', async () => {
    const result = await invoke('voice-create-quote', { body: {} });
    expect(result.response.status).toBe(400);
    expect(result.rpc).toHaveBeenCalledTimes(1);
    expect(result.fetchMock).not.toHaveBeenCalled();
  });

  it('retains optional spec-sheet fallback when no provider key is configured', async () => {
    const result = await invoke('generate-spec-sheet-insights', { env: { PERPLEXITY_API_KEY: undefined } });
    expect(result.response.status).toBe(200);
    expect((await result.response.json()).source).toBe('fallback');
    expect(result.rpc).toHaveBeenCalledTimes(1);
    expect(result.fetchMock).not.toHaveBeenCalled();
  });
});
