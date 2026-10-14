export const AGENT_SOURCE_STORAGE_KEY = 'mercury_agent_attribution';
const SURFACES = ['agent_rest', 'agent_mcp', 'agent_ucp'] as const;
export type AgentSurface = typeof SURFACES[number];
export type AgentSource = AgentSurface | 'chatgpt' | 'perplexity' | 'claude' | 'google' | 'meta_muse' | 'meta_ai' | 'ai' | 'referral' | 'direct';
export interface AgentAttribution { source: AgentSource; surface?: AgentSurface }
const ALIASES: Record<string, AgentSource> = {
  chatgpt: 'chatgpt', openai: 'chatgpt', 'chatgpt.com': 'chatgpt',
  perplexity: 'perplexity', 'perplexity.ai': 'perplexity',
  claude: 'claude', anthropic: 'claude', 'claude.ai': 'claude',
  gemini: 'google', google: 'google', 'gemini.google.com': 'google',
  muse: 'meta_muse', meta_muse: 'meta_muse', muse_code: 'meta_muse', meta_muse_code: 'meta_muse', 'muse.ai': 'meta_muse',
  meta: 'meta_ai', meta_ai: 'meta_ai', 'meta.ai': 'meta_ai',
  ai: 'ai', agent: 'ai', agent_rest: 'agent_rest', agent_mcp: 'agent_mcp', agent_ucp: 'agent_ucp',
};
const SOURCES = new Set<AgentSource>([...Object.values(ALIASES), 'referral', 'direct']);
function normalize(raw: string): string {
  return raw.length <= 64 ? raw.trim().toLowerCase().replace(/[ -]+/g, '_') : '';
}
export function resolveAgentAttribution(
  params: URLSearchParams, referrer = '', stored?: AgentAttribution,
): AgentAttribution {
  const rawSurface = params.get('src');
  const surface = SURFACES.find(value => value === rawSurface);
  const explicit = params.get('ref') || params.get('utm_source');
  if (explicit) return { source: ALIASES[normalize(explicit)] ?? (referrer ? 'referral' : 'direct'), ...(surface ? { surface } : {}) };
  if (surface) return { source: surface, surface };
  // Workflow references identify a UCP journey, not a wallet authorization.
  if (/^chk_[A-Za-z0-9._-]{1,124}$/.test(params.get('ucp') ?? '')) return { source: 'agent_ucp', surface: 'agent_ucp' };
  if (stored && SOURCES.has(stored.source) && (!stored.surface || SURFACES.includes(stored.surface))) return { source: stored.source, ...(stored.surface ? { surface: stored.surface } : {}) };
  return { source: referrer ? 'referral' : 'direct' };
}
export function captureAgentAttribution(): AgentAttribution {
  if (typeof window === 'undefined') return { source: 'direct' };
  let stored: AgentAttribution | undefined;
  try { stored = JSON.parse(sessionStorage.getItem(AGENT_SOURCE_STORAGE_KEY) || 'null') ?? undefined; } catch { /* storage optional */ }
  const attribution = resolveAgentAttribution(new URLSearchParams(window.location.search), document.referrer, stored);
  try { sessionStorage.setItem(AGENT_SOURCE_STORAGE_KEY, JSON.stringify(attribution)); } catch { /* analytics never blocks the quote */ }
  return attribution;
}
