import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

describe('expired GET7 campaign', () => {
  it.each([
    { sendEmail: true, sendSms: true },
    { testMode: true, sendEmail: true, sendSms: true },
    { targetType: 'all' },
  ])('blocks all send paths before reading recipients or request input (%j)', async (body) => {
    const source = readFileSync('supabase/functions/send-get7-campaign/index.ts', 'utf8');
    const start = source.indexOf('const handler = async');
    const stop = source.indexOf('\n  try {', start);
    const prefix = source.slice(start, stop)
      .replace('const handler = async (req: Request): Promise<Response> => {', 'const handler = async (req) => {');
    const auth = vi.fn().mockResolvedValue({ user: { id: 'admin' } });
    const handler = new Function('requireAdmin', 'corsHeaders', `${prefix}\n}; return handler;`)(auth, {});
    const request = new Request('http://localhost/campaign', { method: 'POST', body: JSON.stringify(body) });
    const json = vi.spyOn(request, 'json');
    const response = await handler(request);
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: 'campaign_expired', emailsSent: 0, smsSent: 0 });
    expect(auth).toHaveBeenCalledOnce();
    expect(json).not.toHaveBeenCalled();
  });
});