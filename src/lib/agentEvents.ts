import { supabase } from '@/integrations/supabase/client';

type AgentEventInput = {
  event_type: string;
  source?: string | null;
  motor_id?: string | null;
  motor_hp?: number | null;
  motor_model?: string | null;
  quote_value?: number | null;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = 'quote_activity_session_id';

function getSessionId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || null;
}

function detectSource() {
  if (typeof window === 'undefined') return 'direct';
  const params = new URLSearchParams(window.location.search);
  const ref = (params.get('ref') || params.get('utm_source') || '').toLowerCase();
  if (ref.includes('chatgpt') || ref.includes('openai')) return 'chatgpt';
  if (ref.includes('perplexity')) return 'perplexity';
  if (ref.includes('claude') || ref.includes('anthropic')) return 'claude';
  if (ref.includes('gemini') || ref.includes('google')) return 'google';
  if (ref.includes('ai')) return 'ai';
  return document.referrer ? 'referral' : 'direct';
}

export async function trackAgentEvent(input: AgentEventInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('agent_events').insert({
      event_type: input.event_type,
      session_id: getSessionId(),
      user_id: user?.id ?? null,
      page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      source: input.source ?? detectSource(),
      motor_id: input.motor_id ?? null,
      motor_hp: input.motor_hp ?? null,
      motor_model: input.motor_model ?? null,
      quote_value: input.quote_value ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // never break UX for analytics
  }
}
