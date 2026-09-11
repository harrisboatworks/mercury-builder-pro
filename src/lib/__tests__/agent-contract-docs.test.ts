import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { readUcpToolNames, synchronizeAgentContractDocs } from '../../../scripts/lib/agent-contract-docs.mjs';

describe('agent contract documentation generation', () => {
  it('uses actual declared tool names and fails closed on an unknown catalog shape', () => {
    const source = readFileSync('supabase/functions/ucp-checkout/index.ts', 'utf8');
    const names = readUcpToolNames(source);
    const output = synchronizeAgentContractDocs('Checkout tool surface (old): wrong_tool.\n', source);
    expect(names).toContain('create_checkout');
    expect(names).toContain('cancel_checkout');
    expect(output).toContain(names.join(', '));
    expect(output).not.toContain('wrong_tool');
    expect(() => readUcpToolNames('const MCP_TOOLS = getDynamicTools();')).toThrow();
  });
  it('removes stale terms from every checked-in offer reference', () => {
    const output = synchronizeAgentContractDocs(readFileSync('public/llms.txt', 'utf8'), readFileSync('supabase/functions/ucp-checkout/index.ts', 'utf8'));
    expect(output).not.toMatch(/Terms up to (120|144) months/);
  });
  it('updates changed tool names instead of retaining a hardcoded catalog', () => {
    const source = 'const MCP_TOOLS = [{name:"new_create"},{name:"new_cancel"}] as const;';
    expect(synchronizeAgentContractDocs('Checkout tool surface (old): old.\n', source)).toBe('Checkout tool surface (2 tools): new_create, new_cancel.\n');
  });
  it('makes repeated generation stable and removes misleading finance and UCP claims', () => {
    const source = 'const MCP_TOOLS = [{name:"create_checkout"}];';
    const input = 'Checkout tool surface (old): old.\nYes. Financing is arranged through DealerPlan at 99% for 144 months.\nQuote mode means: trade-in context and automatic registration.\n';
    const output = synchronizeAgentContractDocs(input, source);
    expect(synchronizeAgentContractDocs(output, source)).toBe(output);
    expect(output).not.toContain('99%');
    expect(output).not.toContain('144 months');
    expect(output).toContain('trade-in credits are excluded');
    expect(output).toContain('check the returned lead-capture status');
  });
});
