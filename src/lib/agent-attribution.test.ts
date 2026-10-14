import { beforeEach, describe, expect, it } from 'vitest';
import { captureAgentAttribution, resolveAgentAttribution, AGENT_SOURCE_STORAGE_KEY } from './agent-attribution';
beforeEach(() => { sessionStorage.clear(); window.history.replaceState({}, '', '/quote/motor-selection'); });
describe('agent attribution', () => {
  it.each([
    ['Meta Muse', 'meta_muse'], ['muse_code', 'meta_muse'], ['Meta AI', 'meta_ai'],
    ['meta.ai', 'meta_ai'], ['OpenAI', 'chatgpt'], ['Claude', 'claude'], ['Gemini', 'google'],
    ['perplexity.ai', 'perplexity'], ['ai', 'ai'],
  ])('recognizes the exact provider alias %s', (ref, source) => {
    expect(resolveAgentAttribution(new URLSearchParams({ ref })).source).toBe(source);
  });
  it.each(['email', 'gmail', 'mail', 'chair', 'paid_social', 'constructor', '__proto__', 'toString', 'valueOf', 'meta', 'facebook', 'google', 'claude-unrelated', 'ai'.repeat(40)])('does not infer an AI provider from %s', ref => {
    expect(resolveAgentAttribution(new URLSearchParams({ ref })).source).toBe('direct');
  });
  it('stores only bounded labels through navigation and reload, and replaces them on a new handoff', () => {
    window.history.replaceState({}, '', '/quote/motor-selection?src=agent_rest&utm_source=meta_muse&boat_make=Lund');
    expect(captureAgentAttribution()).toEqual({ source: 'meta_muse', surface: 'agent_rest' });
    window.history.replaceState({}, '', '/quote/summary');
    expect(captureAgentAttribution()).toEqual({ source: 'meta_muse', surface: 'agent_rest' });
    expect(sessionStorage.getItem(AGENT_SOURCE_STORAGE_KEY)).not.toContain('Lund');
    window.history.replaceState({}, '', '/quote/motor-selection?src=agent_mcp');
    expect(captureAgentAttribution()).toEqual({ source: 'agent_mcp', surface: 'agent_mcp' });
    window.history.replaceState({}, '', '/quote/motor-selection?ref=email');
    expect(captureAgentAttribution().source).toBe('direct');
  });
  it('ignores malformed stored values and never retains extra fields', () => {
    expect(resolveAgentAttribution(new URLSearchParams(), '', { source: 'arbitrary' } as any)).toEqual({ source: 'direct' });
    expect(resolveAgentAttribution(new URLSearchParams(), '', { source: 'meta_ai', email: 'synthetic@example.invalid' } as any)).toEqual({ source: 'meta_ai' });
    sessionStorage.setItem(AGENT_SOURCE_STORAGE_KEY, 'invalid');
    expect(captureAgentAttribution()).toEqual({ source: 'direct' });
  });
  it('recognizes legacy UCP links without treating arbitrary references as sources', () => {
    expect(resolveAgentAttribution(new URLSearchParams('ucp=chk_synthetic'))).toEqual({ source: 'agent_ucp', surface: 'agent_ucp' });
    expect(resolveAgentAttribution(new URLSearchParams('ucp=bad%20reference')).source).toBe('direct');
  });
});
