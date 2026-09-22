// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const fakeSecret = 'test-only-mcp-credential';
function run(scenario = 'ok', secret = fakeSecret) {
  const program = `
    const scenario = ${JSON.stringify(scenario)};
    const secret = ${JSON.stringify(fakeSecret)};
    const snapshot = {
      sourceVersion: 'fixture-v1',
      business: { published: true, phone: 'fixture-phone', hours: { Sunday: 'Open' } },
      motors: { count: 1, digest: 'motors' },
      promotions: { count: 1, digest: 'promos', context: '## Fixture offer' },
      financing: { count: 1, digest: 'finance', context: '5.99% APR' },
    };
    let calls = 0;
    let mcpCalls = 0;
    globalThis.fetch = async (url, options = {}) => {
      calls++;
      if (scenario === 'missing') throw new Error('NETWORK_WAS_CALLED');
      const isMcp = url.endsWith('/elevenlabs-mcp-server');
      const header = options.headers?.['x-elevenlabs-mcp-secret'];
      if (isMcp) {
        mcpCalls++;
        if (header !== secret) throw new Error('MISSING_AUTH_HEADER');
        if (options.redirect !== 'error') throw new Error('REDIRECT_NOT_BLOCKED');
        if (scenario === '401') return new Response(secret, { status: 401 });
        if (scenario === 'invalid-json') return new Response(secret);
        if (scenario === 'rpc-error') return Response.json({ error: { message: secret } });
        if (scenario === 'tool-error') return Response.json({ result: { isError: true, content: [{ text: secret }] } });
        const name = JSON.parse(options.body).params.name;
        const texts = {
          check_current_deals: 'Fixture offer',
          check_financing_options: scenario === 'rate-mismatch' ? '7.99% APR' : '5.99% APR',
          get_store_hours: scenario === 'stale' ? 'Sunday: Closed' : 'Sunday open',
        };
        if (!(name in texts)) throw new Error('UNEXPECTED_TOOL');
        return Response.json({ result: { content: [{ text: texts[name] }] } });
      }
      if (header) throw new Error('SECRET_SENT_TO_OTHER_ENDPOINT');
      if (url.endsWith('/.well-known/brand.json')) {
        return Response.json({ contact: snapshot.business });
      }
      if (!JSON.parse(options.body).knowledgeProbe) throw new Error('UNEXPECTED_PROBE');
      if (scenario === 'digest-mismatch' && url.endsWith('/elevenlabs-conversation-token')) {
        return Response.json({ ...snapshot, motors: { count: 1, digest: 'different' } });
      }
      return Response.json(snapshot);
    };
    try {
      await import('./scripts/chat-voice-knowledge-live-check.mjs');
      if (calls !== 6 || mcpCalls !== 3) throw new Error('MISSING_PARITY_CALLS');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  `;
  return spawnSync(process.execPath, ['--input-type=module', '-e', program], {
    cwd: process.cwd(),
    env: { PATH: process.env.PATH, ELEVENLABS_MCP_SECRET: secret },
    encoding: 'utf8',
    timeout: 10_000,
  });
}

describe('live chat/voice knowledge canary authentication', () => {
  it('authenticates all three read-only MCP calls without leaking the secret to public probes', () => {
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).ok).toBe(true);
    expect(result.stdout + result.stderr).not.toContain(fakeSecret);
  });

  it.each(['', '  '])('fails before fetching when the secret is absent or blank', (secret) => {
    const result = run('missing', secret);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ELEVENLABS_MCP_SECRET is required');
    expect(result.stderr).not.toContain('NETWORK_WAS_CALLED');
  });

  it.each(['401', 'invalid-json', 'rpc-error', 'tool-error'])('fails safely for %s without echoing credentials', (scenario) => {
    const result = run(scenario);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/returned 401|returned non-JSON|returned an MCP error/);
    expect(result.stdout + result.stderr).not.toContain(fakeSecret);
  });

  it.each([
    ['digest-mismatch', 'Chat/voice motor facts differ'],
    ['rate-mismatch', 'Voice financing omitted live 5.99% APR option'],
    ['stale', 'Voice tools exposed stale fact: Sunday: Closed'],
  ])('retains the %s parity failure', (scenario, expected) => {
    const result = run(scenario);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expected);
  });

  it('wires the repository secret into the live-check step', () => {
    const workflow = readFileSync('.github/workflows/chat-voice-knowledge.yml', 'utf8');
    expect(workflow).toMatch(/env:\n\s+ELEVENLABS_MCP_SECRET: \$\{\{ secrets\.ELEVENLABS_MCP_SECRET \}\}\n\s+run: npm run check:chat-voice-knowledge-live/);
    expect(workflow).not.toContain('continue-on-error');
  });
});
