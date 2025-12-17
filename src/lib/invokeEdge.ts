// src/lib/invokeEdge.ts
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  'https://eutsoqdpjurknjsshxes.supabase.co';

export const EDGE_URL = `${SUPABASE_URL}/functions/v1/universal-pricing-import`;

async function buildHeaders(json = true): Promise<Record<string, string>> {
  // Get the current user's session token for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in as an admin to import pricing data.');
  }
  
  const h: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'x-client-info': 'admin-ui',
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export async function invokeEdge(payload: any, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    const headers = await buildHeaders(true);
    
    res = await fetch(EDGE_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers,
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    
    // Check if it's an auth error
    if (err?.message?.includes('Not authenticated')) {
      return { ok: false, step: 'auth', status: 401, error: err.message };
    }
    
    return { ok: false, step: 'invoke', status: 0, error: `Network error: ${err?.message || String(err)}` };
  }
  clearTimeout(timer);

  const raw = await res.text();
  let json: any = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
  
  if (!res.ok) {
    return {
      ok: false,
      step: json?.step || 'invoke',
      status: res.status,
      error: json?.error || json?.message || raw || 'Unknown error',
      details: json ?? raw,
    };
  }
  return json ?? { ok: true, step: 'invoke', note: 'No body' };
}

export async function pingEdge() {
  const url = `${EDGE_URL}?ping=1`;
  const headers = await buildHeaders(false);
  
  const res = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
    headers,
  });
  const raw = await res.text();
  let json: any = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
  if (!res.ok) throw new Error(json?.error || raw || `HTTP ${res.status}`);
  return json ?? { ok: true, step: 'ping' };
}

// Legacy function for backward compatibility
export async function invokePricelist(body: any) {
  return invokeEdge(body);
}
