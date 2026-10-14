// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import * as contract from '../../../supabase/functions/_shared/public-agent-mcp.ts';

const compiled = ts.transpileModule(readFileSync('supabase/functions/agent-mcp-server/index.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function server() {
  let handler!: (req: Request) => Promise<Response>;
  const createClient = vi.fn(() => ({}));
  const tool = vi.fn();
  const modules: Record<string, unknown> = {
    'https://esm.sh/@supabase/supabase-js@2.45.0': { createClient },
    '../_shared/rate-limit.ts': { checkRateLimit: async () => true },
    '../_shared/public-motor-contract.ts': { PUBLIC_SITE_URL: 'https://www.mercuryrepower.ca' },
    '../_shared/public-mcp-motors.ts': { getMcpMotor: tool, searchMcpMotors: tool },
    '../_shared/customer-knowledge-context.ts': {},
    '../_shared/public-agent-mcp.ts': { ...contract, runPublicQuoteTool: tool },
    '../_shared/mcp-tool-annotations.ts': { mcpToolAnnotations: () => ({}) },
    '../_shared/public-blog-mcp.ts': { runPublicArticleTool: tool },
  };
  new Function('require', 'exports', 'Deno', compiled)((name: string) => {
    if (!(name in modules)) throw new Error(`Unmocked ${name}`);
    return modules[name];
  }, {}, { env: { get: () => 'synthetic' }, serve: (fn: typeof handler) => { handler = fn; } });
  return { handler, createClient, tool };
}
const request = (body: object) => new Request('https://example.test/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('MCP lifecycle transport', () => {
  it.each(['notifications/initialized', 'notifications/cancelled', 'tools/call'])('accepts no-id %s without dispatching a tool or responding', async (method) => {
    const s = server();
    const response = await s.handler(request({ jsonrpc: '2.0', method, params: { name: 'submit_quote_lead', arguments: { consent: true } } }));
    expect(response.status).toBe(202);
    expect(await response.text()).toBe('');
    expect(s.createClient).not.toHaveBeenCalled();
    expect(s.tool).not.toHaveBeenCalled();
  });
  it('retains explicit request ids, initializes and answers ping', async () => {
    const s = server();
    const result = await (await s.handler(request({ jsonrpc: '2.0', id: 0, method: 'initialize' }))).json();
    expect(result).toMatchObject({ id: 0, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} } } });
    expect(await (await s.handler(request({ jsonrpc: '2.0', id: 'ping', method: 'ping' }))).json()).toEqual({ jsonrpc: '2.0', id: 'ping', result: {} });
    expect((await (await s.handler(request({ jsonrpc: '2.0', id: null, method: 'missing' }))).json()).error.code).toBe(-32601);
  });
  it('rejects malformed notifications and declines an unsolicited SSE stream', async () => {
    const s = server();
    expect((await s.handler(request({ jsonrpc: '1.0', method: 'notifications/initialized' }))).status).toBe(400);
    const response = await s.handler(new Request('https://example.test/mcp', { headers: { Accept: 'text/event-stream' } }));
    expect(response.status).toBe(405);
    expect(await response.text()).toBe('');
    expect((await s.handler(new Request('https://example.test/mcp'))).status).toBe(200);
  });
});
