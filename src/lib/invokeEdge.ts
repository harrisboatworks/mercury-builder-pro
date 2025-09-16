// src/lib/invokeEdge.ts
const SUPABASE_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_URL ||
  'https://eutsoqdpjurknjsshxes.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU';

export const EDGE_URL = `${SUPABASE_URL}/functions/v1/seed-from-pricelist`;

function buildHeaders(json = true) {
  const h: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
    res = await fetch(EDGE_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: buildHeaders(true),
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
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
  const res = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
    headers: buildHeaders(false),
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