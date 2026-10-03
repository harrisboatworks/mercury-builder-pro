/**
 * Build-only public catalog credentials.
 *
 * Vercel Preview keeps VITE_SUPABASE_* on the isolated staging project at
 * runtime. Build scripts that need production public motor_models / Places
 * must select BUILD_CONTENT_SUPABASE_URL + BUILD_CONTENT_SUPABASE_PUBLISHABLE_KEY
 * as a pair first. Runtime Vite / Edge code must not import this module.
 *
 * Production is a read-only public content source (anon/publishable only).
 */

export const BUILD_CONTENT_URL_VAR = 'BUILD_CONTENT_SUPABASE_URL';
export const BUILD_CONTENT_KEY_VAR = 'BUILD_CONTENT_SUPABASE_PUBLISHABLE_KEY';

export const PRODUCTION_SUPABASE_REF = 'eutsoqdpjurknjsshxes';
export const STAGING_ISOLATED_SUPABASE_REF = 'ccozickwrpautlxknsjk';
export const PRODUCTION_CONTENT_SUPABASE_URL = `https://${PRODUCTION_SUPABASE_REF}.supabase.co`;

// Publishable (anon) key already committed for browser/build fallbacks.
// Read-only public catalog. Not a service-role key.
export const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU';

export const MOTOR_MODELS_CONTENT_OPTIONS = {
  legacyUrlKeys: ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
  legacyKeyKeys: ['VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY'],
  fallbackUrl: PRODUCTION_CONTENT_SUPABASE_URL,
  fallbackKey: FALLBACK_SUPABASE_PUBLISHABLE_KEY,
};

export const GOOGLE_PLACES_CONTENT_OPTIONS = {
  legacyUrlKeys: ['VITE_SUPABASE_URL'],
  legacyKeyKeys: ['VITE_SUPABASE_PUBLISHABLE_KEY'],
  fallbackUrl: PRODUCTION_CONTENT_SUPABASE_URL,
  fallbackKey: '',
};

function readEnv(env, name) {
  const value = env?.[name];
  if (value == null) return '';
  return String(value).trim();
}

function firstEnv(env, names) {
  for (const name of names) {
    const value = readEnv(env, name);
    if (value) return value;
  }
  return '';
}

export function normalizeSupabaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function supabaseProjectRefFromUrl(url) {
  const normalized = normalizeSupabaseUrl(url);
  if (!normalized) return null;
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

export function supabaseProjectRefFromJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
  try {
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof payload.ref === 'string' && payload.ref
      ? payload.ref.toLowerCase()
      : null;
  } catch {
    return null;
  }
}

export function assertMatchingBuildContentPair(url, key) {
  const urlRef = supabaseProjectRefFromUrl(url);
  const keyRef = supabaseProjectRefFromJwt(key);
  if (!urlRef || !keyRef) return;
  if (urlRef === keyRef) return;

  const productionWithStaging =
    urlRef === PRODUCTION_SUPABASE_REF && keyRef === STAGING_ISOLATED_SUPABASE_REF;
  const stagingWithProduction =
    urlRef === STAGING_ISOLATED_SUPABASE_REF && keyRef === PRODUCTION_SUPABASE_REF;

  throw new Error(
    `${BUILD_CONTENT_URL_VAR} and ${BUILD_CONTENT_KEY_VAR} must be a matching pair`
    + ` (url ref=${urlRef}, key ref=${keyRef}`
    + `${productionWithStaging ? '; production URL with staging-ref key' : ''}`
    + `${stagingWithProduction ? '; staging URL with production-ref key' : ''}).`,
  );
}

export function resolveBuildContentSupabase(env = process.env, options = {}) {
  const {
    legacyUrlKeys = MOTOR_MODELS_CONTENT_OPTIONS.legacyUrlKeys,
    legacyKeyKeys = MOTOR_MODELS_CONTENT_OPTIONS.legacyKeyKeys,
    fallbackUrl = MOTOR_MODELS_CONTENT_OPTIONS.fallbackUrl,
    fallbackKey = MOTOR_MODELS_CONTENT_OPTIONS.fallbackKey,
  } = options;

  const buildUrl = readEnv(env, BUILD_CONTENT_URL_VAR);
  const buildKey = readEnv(env, BUILD_CONTENT_KEY_VAR);

  if (buildUrl || buildKey) {
    if (!buildUrl || !buildKey) {
      throw new Error(
        `${BUILD_CONTENT_URL_VAR} and ${BUILD_CONTENT_KEY_VAR} must be set together as a matching pair.`,
      );
    }
    assertMatchingBuildContentPair(buildUrl, buildKey);
    return {
      url: normalizeSupabaseUrl(buildUrl),
      key: buildKey,
      source: 'build_content',
    };
  }

  const url = firstEnv(env, legacyUrlKeys) || fallbackUrl;
  const key = firstEnv(env, legacyKeyKeys) || fallbackKey;
  return {
    url: normalizeSupabaseUrl(url),
    key,
    source: 'legacy_fallback',
  };
}
