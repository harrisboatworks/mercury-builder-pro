/**
 * Supabase Management API helpers shared by drift-watch and the
 * edge-function deploy gate.
 *
 * GET /v1/projects/{ref}/database/migrations returns {version, name}.
 * GET /v1/projects/{ref}/functions returns deployed function rows.
 * Auth is a bearer SUPABASE_ACCESS_TOKEN only. Never prints response bodies.
 */

export const MANAGEMENT_API = 'https://api.supabase.com/v1';
export const MANAGEMENT_API_TIMEOUT_MS = Number(process.env.SUPABASE_DRIFT_TIMEOUT_MS || 20_000);

export async function fetchJson(url, headers, timeoutMs = MANAGEMENT_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, status: response.status, data: null };
    }
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

export function pickFunctionRows(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.functions) ? data.functions : null;
  if (!rows) return null;
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const slug = typeof row.slug === 'string' && row.slug ? row.slug : typeof row.name === 'string' ? row.name : null;
    if (!slug) continue;
    out.push({
      slug,
      version: row.version ?? null,
      updated_at: row.updated_at ?? row.updatedAt ?? null,
    });
  }
  return out;
}

export function pickMigrationRows(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.migrations) ? data.migrations : null;
  if (!rows) return null;
  const out = [];
  for (const row of rows) {
    if (typeof row === 'string' && row) {
      out.push(row);
      continue;
    }
    if (row && typeof row === 'object' && typeof row.version === 'string' && row.version) {
      out.push({ version: row.version, name: typeof row.name === 'string' ? row.name : undefined });
    }
  }
  return out;
}

export function managementApiHeaders(token, userAgent) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': userAgent,
  };
}

export function managementApiMigrationsUrl(projectRef) {
  return `${MANAGEMENT_API}/projects/${encodeURIComponent(projectRef)}/database/migrations`;
}

export function managementApiFunctionsUrl(projectRef) {
  return `${MANAGEMENT_API}/projects/${encodeURIComponent(projectRef)}/functions`;
}

export async function listAppliedMigrationsFromManagementApi({
  token,
  projectRef,
  fetchJsonImpl = fetchJson,
  timeoutMs = MANAGEMENT_API_TIMEOUT_MS,
  userAgent = 'supabase-functions-deploy',
} = {}) {
  const accessToken = String(token || '').trim();
  const ref = String(projectRef || '').trim();
  if (!accessToken || !ref) {
    throw new Error('Management API applied-migrations read needs an access token and a project ref');
  }
  const result = await fetchJsonImpl(
    managementApiMigrationsUrl(ref),
    managementApiHeaders(accessToken, userAgent),
    timeoutMs,
  );
  if (!result.ok) {
    const status = result.status || 'network-error';
    throw new Error(`Management API migrations request failed (HTTP ${status})`);
  }
  const rows = pickMigrationRows(result.data);
  if (!rows) {
    throw new Error('Management API migrations response had an unexpected shape');
  }
  return rows;
}
