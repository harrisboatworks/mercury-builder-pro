import { captureAgentAttribution } from './agent-attribution';
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

export async function trackAgentEvent(input: AgentEventInput) {
  try {
    const attribution = captureAgentAttribution();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('agent_events').insert({
      event_type: input.event_type,
      session_id: getSessionId(),
      user_id: user?.id ?? null,
      page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      source: input.source ?? attribution.source,
      motor_id: input.motor_id ?? null,
      motor_hp: input.motor_hp ?? null,
      motor_model: input.motor_model ?? null,
      quote_value: input.quote_value ?? null,
      metadata: { ...input.metadata, ...(attribution.surface ? { agent_surface: attribution.surface } : {}) },
    });
  } catch {
    // never break UX for analytics
  }
}
