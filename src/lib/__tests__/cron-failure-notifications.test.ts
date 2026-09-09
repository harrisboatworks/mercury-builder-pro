// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import * as emailLayout from '../../../supabase/functions/_shared/email-layout.ts';

const handlerSource = ts.transpileModule(
  readFileSync('supabase/functions/cron-failure-notifications/index.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const adminAuthSource = ts.transpileModule(
  readFileSync('supabase/functions/_shared/admin-auth.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const FAILURE_BODY = {
  job_name: 'inventory-sync',
  error_message: 'scrape failed',
  started_at: '2026-09-09T12:00:00.000Z',
  motors_found: 0,
  motors_updated: 0,
};

const DEFAULT_ENV: Record<string, string | undefined> = {
  SUPABASE_URL: 'https://db.example.test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  RESEND_API_KEY: 'test-provider-key',
  EDGE_INTERNAL_SECRET: 'test-internal-secret',
};

async function invoke(input: {
  method?: string;
  headers?: Record<string, string>;
  env?: Record<string, string | undefined>;
  body?: unknown;
} = {}) {
  const env = { ...DEFAULT_ENV, ...input.env };
  const deno = { env: { get: (name: string) => env[name] } };
  const insert = vi.fn(async (_row: Record<string, unknown>) => ({ error: null }));
  const sendEmail = vi.fn(async (_payload: Record<string, unknown>) => ({ data: { id: 'email-1' }, error: null }));
  const createClient = vi.fn(() => ({
    from: () => ({ insert }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('unused') }),
    },
  }));
  const Resend = vi.fn(class {
    emails = { send: sendEmail };
  });

  const adminAuth: { requireAdmin?: (req: Request, cors: Record<string, string>) => Promise<unknown> } = {};
  new Function('require', 'exports', 'Deno', adminAuthSource)(
    (specifier: string) => {
      if (specifier === 'npm:@supabase/supabase-js@2.53.1') return { createClient };
      throw new Error(`Unmocked admin-auth import: ${specifier}`);
    },
    adminAuth,
    deno,
  );

  let handler!: (request: Request) => Promise<Response>;
  new Function('require', 'exports', 'Deno', handlerSource)(
    (specifier: string) => {
      const imports: Record<string, unknown> = {
        'https://deno.land/std@0.190.0/http/server.ts': {
          serve: (fn: typeof handler) => { handler = fn; },
        },
        'https://esm.sh/@supabase/supabase-js@2.53.1': { createClient },
        'npm:resend@2.0.0': { Resend },
        '../_shared/email-layout.ts': emailLayout,
        '../_shared/admin-auth.ts': adminAuth,
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
    init.body = JSON.stringify(input.body ?? FAILURE_BODY);
  }

  const response = await handler(
    new Request('https://edge.example.test/cron-failure-notifications', init),
  );
  return { response, insert, sendEmail, createClient, Resend };
}

describe('cron-failure-notifications auth gate', () => {
  it('rejects a request with no secret header and does not log or email', async () => {
    const { response, insert, sendEmail, createClient, Resend } = await invoke();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Missing Authorization header' });
    expect(createClient).not.toHaveBeenCalled();
    expect(Resend).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret the same way and does not log or email', async () => {
    const { response, insert, sendEmail, createClient, Resend } = await invoke({
      headers: { 'x-internal-secret': 'wrong-secret' },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Missing Authorization header' });
    expect(createClient).not.toHaveBeenCalled();
    expect(Resend).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('proceeds, logs, and sends when the internal secret matches', async () => {
    const { response, insert, sendEmail, createClient, Resend } = await invoke({
      headers: { 'x-internal-secret': 'test-internal-secret' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Notification processed successfully',
      logged: true,
      email_sent: true,
    });
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(Resend).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({
      job_name: 'inventory-sync',
      status: 'failed',
      error_message: 'scrape failed',
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      from: 'Mercury Sync <noreply@mercuryrepower.ca>',
      to: ['info@harrisboatworks.ca'],
    });
  });

  it('rejects when EDGE_INTERNAL_SECRET is unset instead of allowing everyone', async () => {
    const { response, insert, sendEmail, createClient, Resend } = await invoke({
      headers: { 'x-internal-secret': 'test-internal-secret' },
      env: { EDGE_INTERNAL_SECRET: undefined },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Missing Authorization header' });
    expect(createClient).not.toHaveBeenCalled();
    expect(Resend).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns the CORS preflight response for OPTIONS', async () => {
    const { response, insert, sendEmail, createClient, Resend } = await invoke({
      method: 'OPTIONS',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('x-internal-secret');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(Resend).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
