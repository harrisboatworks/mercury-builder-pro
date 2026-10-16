import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/send-get7-campaign/index.ts', 'utf8');
const config = readFileSync('supabase/config.toml', 'utf8');

// send-get7-campaign used to email and text the entire customer list with a
// hard-coded, long-expired Mercury "Get 7" offer. It was retired on Oct 16 2026
// and must stay an inert stub that cannot contact anyone.
describe('send-get7-campaign is retired', () => {
  it('answers every non-preflight request with 410 Gone', () => {
    expect(source).toContain('status: 410');
    expect(source).toContain('has been retired');
  });

  it('cannot send email or SMS, read secrets or parse caller input', () => {
    for (const forbidden of [
      'RESEND_API_KEY',
      'TWILIO',
      'api.resend.com',
      'api.twilio.com',
      'createClient',
      'SUPABASE_SERVICE_ROLE_KEY',
      'Deno.env.get',
      'req.json()',
      '2.99%',
      'Mar 31',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it('keeps the gateway JWT requirement as a second lock', () => {
    expect(config).toMatch(/\[functions\.send-get7-campaign\][\s\S]*?verify_jwt = true/);
  });
});
