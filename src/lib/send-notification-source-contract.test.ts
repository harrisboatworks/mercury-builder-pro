import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('send-notification source contract', () => {
  it('requires both gateway JWT verification and the exact service-role boundary', () => {
    const config = source('supabase/config.toml');
    const runtime = source('supabase/functions/send-notification/index.ts');
    const policy = source('supabase/functions/_shared/send-notification-policy.ts');

    expect(config).toMatch(
      /\[functions\.send-notification\]\s*verify_jwt\s*=\s*true/,
    );
    expect(runtime).toContain('handleServiceRoleRequest(');
    expect(runtime).toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    expect(policy).toContain("crypto.subtle.digest('SHA-256'");
    expect(policy).toContain('return supplied.length > 0 && expected.length > 0 && matches');
  });

  it('keeps parsing, service-role database access, and Twilio inside the authorized callback', () => {
    const runtime = source('supabase/functions/send-notification/index.ts');
    const handlerStart = runtime.indexOf('const processNotification');
    const bodyParse = runtime.indexOf('rawPayload = await req.json()', handlerStart);
    const clientCreation = runtime.indexOf('const supabaseClient = createClient(', handlerStart);
    const twilioFetch = runtime.indexOf('await fetch(twilioUrl', handlerStart);
    const authorizationWrapper = runtime.indexOf('serve((req) => handleServiceRoleRequest(');

    expect(handlerStart).toBeGreaterThan(-1);
    expect(bodyParse).toBeGreaterThan(handlerStart);
    expect(clientCreation).toBeGreaterThan(bodyParse);
    expect(twilioFetch).toBeGreaterThan(clientCreation);
    expect(authorizationWrapper).toBeGreaterThan(clientCreation);
    expect(authorizationWrapper).toBeGreaterThan(twilioFetch);
    expect(runtime.slice(authorizationWrapper)).toContain('async () => {');
    expect(runtime.slice(authorizationWrapper)).toContain('return await processNotification(req)');
  });

  it('does not expose a browser invocation or hook method', () => {
    const hook = source('src/hooks/useNotifications.ts');

    expect(hook).not.toContain("functions.invoke('send-notification'");
    expect(hook).not.toMatch(/\bsendNotification\b/);
  });

  it('validates the trusted caller payload before constructing the database client', () => {
    const runtime = source('supabase/functions/send-notification/index.ts');
    const validation = runtime.indexOf('validateNotificationPayload(rawPayload)');
    const clientCreation = runtime.indexOf('const supabaseClient = createClient(');

    expect(validation).toBeGreaterThan(-1);
    expect(clientCreation).toBeGreaterThan(validation);
  });
});
