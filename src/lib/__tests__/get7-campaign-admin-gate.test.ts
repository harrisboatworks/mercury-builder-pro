import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/send-get7-campaign/index.ts', 'utf8');
const config = readFileSync('supabase/config.toml', 'utf8');

// send-get7-campaign sends marketing email and SMS to the entire customer list
// using the service role key. verify_jwt = true only proves the caller holds a
// valid JWT, and the publishable anon key is one, so the gateway alone is not a
// gate. An in-function admin check is the actual boundary.
describe('send-get7-campaign admin gate', () => {
  it('calls requireAdmin before reading the request body', () => {
    expect(source).toContain('import { requireAdmin } from "../_shared/admin-auth.ts";');

    const optionsBranch = source.indexOf('req.method === "OPTIONS"');
    const gate = source.indexOf('await requireAdmin(req, corsHeaders)');
    const body = source.indexOf('await req.json()');
    // sendSms/sendEmail are helpers declared above the handler, so their file
    // position says nothing about execution order. The body parse is the first
    // thing the handler does with caller input, so gating before it is the
    // meaningful assertion.
    expect(gate).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(optionsBranch);
    expect(gate).toBeLessThan(body);
  });

  it('returns the requireAdmin rejection instead of continuing', () => {
    expect(source).toContain('if (authResult instanceof Response) return authResult;');
  });

  it('keeps the gateway JWT requirement as well', () => {
    expect(config).toMatch(/\[functions\.send-get7-campaign\][\s\S]*?verify_jwt = true/);
  });
});
