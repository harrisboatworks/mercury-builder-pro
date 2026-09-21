import { supabase } from '@/integrations/supabase/client';

const CANONICAL_REFERENCE_PATTERN = /^HBW-\d{5}$/;

/** Read the canonical reference created by the existing soft-save flow. */
export async function getSoftLeadReference(sessionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('get_soft_lead_reference', { p_session_id: sessionId })
    .setHeader('x-quote-session-id', sessionId);

  if (error || typeof data !== 'string' || !CANONICAL_REFERENCE_PATTERN.test(data)) {
    return null;
  }

  return data;
}