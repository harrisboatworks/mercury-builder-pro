// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import * as delivery from '../../../supabase/functions/_shared/quote-email-delivery.ts';
import * as templates from '../../../supabase/functions/send-quote-email/template-policy.ts';
import * as destinations from '../../../supabase/functions/_shared/consultation-quote-email.ts';

// Execute the actual Edge handler with only its runtime/external boundaries
// substituted. No Supabase/Resend request or environment credential is used.
const compiled = ts.transpileModule(
  readFileSync('supabase/functions/send-quote-email/index.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const quoteId = '11111111-1111-4111-8111-111111111111';

async function send(input: { admin?: boolean; headers?: Record<string, string>; body?: Record<string, unknown> } = {}) {
  let handler!: (request: Request) => Promise<Response>;
  const rpc = vi.fn(async (name: string, _params?: Record<string, unknown>) => ({
    data: name === 'claim_quote_email_delivery_v1'
      ? { status: 'claimed', delivery_id: 'test-delivery' } : null,
    error: null,
  }));
  const sendEmail = vi.fn(async () => ({ data: { id: 'test-provider-id' }, error: null }));
  const query = {
    select: () => query, eq: () => query,
    single: async () => ({ data: { subject: 'Quote', html_content: 'Your quote' }, error: null }),
  };
  const imports: Record<string, unknown> = {
    '../_shared/quote-email-delivery.ts': delivery,
    '../_shared/admin-auth.ts': {
      requireAdmin: async () => input.admin ? { userId: 'test-admin' } : new Response('Unauthorized', { status: 401 }),
    },
    'https://deno.land/std@0.190.0/http/server.ts': { serve: (fn: typeof handler) => { handler = fn; } },
    'npm:@supabase/supabase-js@2.53.1': { createClient: () => ({ rpc, from: () => query }) },
    'npm:resend@2.0.0': { Resend: class { emails = { send: sendEmail }; } },
    'https://deno.land/x/zod@v3.22.4/mod.ts': { z },
    '../_shared/rate-limit.ts': { checkRateLimit: async () => true },
    '../_shared/origin-check.ts': { isAllowedOrigin: () => true },
    '../_shared/grok-email-routing.ts': { GROK_BOT_AGENTMAIL: 'audit@example.test' },
    '../_shared/consultation-admin-attachment.ts': {},
    '../_shared/consultation-document-policy.ts': {},
    '../_shared/consultation-quote-email.ts': destinations,
    './attachment-policy.ts': { normalizeQuoteUrls: () => ({}) },
    './template-policy.ts': templates,
    '../_shared/email-layout.ts': {},
  };
  new Function('require', 'exports', 'Deno', compiled)(
    (specifier: string) => {
      if (!(specifier in imports)) throw new Error(`Unmocked import: ${specifier}`);
      return imports[specifier];
    }, {}, { env: { get: (name: string) => ({
      SUPABASE_URL: 'https://db.example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
      EDGE_INTERNAL_SECRET: 'test-internal-secret', RESEND_API_KEY: 'test-provider-key',
    })[name] } },
  );
  const response = await handler(new Request('https://edge.example.test/send-quote-email', {
    method: 'POST', headers: { 'content-type': 'application/json', ...input.headers },
    body: JSON.stringify({
      customerName: 'Test Buyer', customerEmail: 'buyer@example.test',
      quoteNumber: 'Q1', motorModel: 'Test Motor', totalPrice: 100,
      emailType: 'quote_delivery', leadData: { quoteId },
      idempotencyKey: `hbw-admin-v1:${quoteId}:quote_delivery`, ...input.body,
    }),
  }));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, messageId: 'test-provider-id' });
  expect(sendEmail).toHaveBeenCalledTimes(1);
  const claim = rpc.mock.calls.find(([name]) => name === 'claim_quote_email_delivery_v1');
  return claim![1] as Record<string, unknown>;
}

describe('quote-email audit trust at the actual handler boundary', () => {
  it('does not attach an anonymous send to a caller-selected quote', async () => {
    const claim = await send();
    expect(claim._quote_id).toBeNull();
    expect(claim._initiator).toBe('customer');
  });

  it('ignores forged body trust fields and invalid credentials', async () => {
    const claim = await send({
      headers: { authorization: 'Bearer invalid', 'x-internal-secret': 'invalid' },
      body: { initiator: 'admin', internalRequest: true, authenticatedAdmin: true },
    });
    expect(claim._quote_id).toBeNull();
    expect(claim._initiator).toBe('customer');
  });

  it.each([
    { admin: true },
    { headers: { 'x-internal-secret': 'test-internal-secret' } },
    { headers: { authorization: 'Bearer test-service-role' } },
  ])('retains server-authenticated quote association: %j', async (input) => {
    const claim = await send(input);
    expect(claim._quote_id).toBe(quoteId);
  });

  it('uses the same trusted identity in idempotency and the audit claim', async () => {
    const anonymous = await send();
    const admin = await send({ admin: true });
    expect(anonymous._idempotency_key).not.toBe(admin._idempotency_key);
    expect(admin._idempotency_key).toBe((await send({ admin: true }))._idempotency_key);
    expect(anonymous._idempotency_key).toBe(await delivery.deriveIdempotencyKey({
      suppliedKey: `hbw-admin-v1:${quoteId}:quote_delivery`, emailType: 'quote_delivery',
      quoteNumber: 'Q1', quoteId: null, recipient: 'buyer@example.test',
    }));
  });
});

describe('stored consultation quote identity', () => {
  const storedQuoteId = '22222222-2222-4222-8222-222222222222';
  it('prefers the stored document quote for trusted delivery', () => {
    expect(delivery.resolveTrustedQuoteEmailQuoteId({
      internalRequest: true, adminAuthenticated: false,
      callerQuoteId: quoteId, storedQuoteId,
    })).toBe(storedQuoteId);
  });
  it('cannot gain trust from a stored ID argument alone', () => {
    expect(delivery.resolveTrustedQuoteEmailQuoteId({
      internalRequest: false, adminAuthenticated: false,
      callerQuoteId: quoteId, storedQuoteId,
    })).toBeNull();
  });
});
