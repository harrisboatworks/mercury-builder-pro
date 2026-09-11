/**
 * Name-only Edge secret listing for the resolved Supabase project.
 * Never returns or prints values, digests, or hashes.
 */
import { execFileSync } from 'node:child_process';
import {
  MANAGEMENT_API,
  fetchJson,
  managementApiHeaders,
} from './supabase-management-api.mjs';

export function managementApiSecretsUrl(projectRef) {
  return `${MANAGEMENT_API}/projects/${encodeURIComponent(projectRef)}/secrets`;
}

export function assertProjectRefMatch(projectRef, expectedProjectRef) {
  const ref = String(projectRef || '').trim();
  const expected = String(expectedProjectRef || '').trim();
  if (!ref || !expected || ref !== expected) {
    const error = new Error('secret-name lookup refused: project ref mismatch');
    error.code = 'WRONG_PROJECT';
    throw error;
  }
  return ref;
}

export function pickSecretNames(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.secrets) ? data.secrets : null;
  if (!rows) return null;
  const names = [];
  for (const row of rows) {
    if (typeof row === 'string') {
      const name = row.trim();
      if (name && !/^[a-f0-9]{32,}$/i.test(name)) names.push(name);
      continue;
    }
    if (!row || typeof row !== 'object') continue;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (name) names.push(name);
  }
  return names;
}

export function parseSecretNamesFromCli(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const names = pickSecretNames(parsed);
    if (names) return names;
  } catch {
    // fall through to table parse
  }
  const names = [];
  for (const line of raw.split(/\r?\n/)) {
    const first = String(line || '').trim().split(/\s+/)[0];
    if (!first || /^name$/i.test(first) || /^─/.test(first) || /^│/.test(first)) continue;
    if (/^[a-f0-9]{32,}$/i.test(first)) continue;
    names.push(first);
  }
  return names;
}

export async function listEdgeSecretNamesFromManagementApi({
  token,
  projectRef,
  expectedProjectRef,
  fetchJsonImpl = fetchJson,
  timeoutMs,
  userAgent = 'supabase-functions-deploy',
} = {}) {
  const ref = assertProjectRefMatch(projectRef, expectedProjectRef ?? projectRef);
  const accessToken = String(token || '').trim();
  if (!accessToken) throw new Error('secret-name list unreadable: missing access token');
  const result = await fetchJsonImpl(
    managementApiSecretsUrl(ref),
    managementApiHeaders(accessToken, userAgent),
    timeoutMs,
  );
  if (!result.ok) {
    throw new Error(`secret-name list unreadable (HTTP ${result.status || 'network-error'})`);
  }
  const names = pickSecretNames(result.data);
  if (!names) throw new Error('secret-name list unreadable: unexpected shape');
  return names;
}

export function listEdgeSecretNamesFromCli({
  cli = 'supabase',
  projectRef,
  expectedProjectRef,
  env = process.env,
  execFile = execFileSync,
} = {}) {
  const ref = assertProjectRefMatch(projectRef, expectedProjectRef ?? projectRef);
  const output = execFile(cli, ['secrets', 'list', '--project-ref', ref, '--output', 'json'], {
    encoding: 'utf8',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024,
  });
  const names = pickSecretNames((() => {
    try {
      return JSON.parse(String(output));
    } catch {
      return null;
    }
  })()) || parseSecretNamesFromCli(String(output));
  if (!names) throw new Error('secret-name list unreadable: CLI output');
  return names;
}

export async function listEdgeSecretNamesForProject({
  projectRef,
  expectedProjectRef,
  token,
  cli,
  env,
  listFromApi,
  listFromCli,
} = {}) {
  const ref = assertProjectRefMatch(projectRef, expectedProjectRef);
  if (typeof listFromApi === 'function') {
    const result = await listFromApi({ projectRef: ref, expectedProjectRef: ref });
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      if (result.projectRef) assertProjectRefMatch(result.projectRef, ref);
      if (Array.isArray(result.names)) return result.names;
    }
    if (Array.isArray(result)) return result;
    throw new Error('secret-name list unreadable');
  }
  if (typeof listFromCli === 'function') {
    const result = await listFromCli({ projectRef: ref, expectedProjectRef: ref });
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      if (result.projectRef) assertProjectRefMatch(result.projectRef, ref);
      if (Array.isArray(result.names)) return result.names;
    }
    if (Array.isArray(result)) return result;
    throw new Error('secret-name list unreadable');
  }
  try {
    return await listEdgeSecretNamesFromManagementApi({
      token,
      projectRef: ref,
      expectedProjectRef: ref,
    });
  } catch (apiError) {
    try {
      return listEdgeSecretNamesFromCli({
        cli,
        projectRef: ref,
        expectedProjectRef: ref,
        env,
      });
    } catch {
      throw apiError;
    }
  }
}
