import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  BUILD_CONTENT_KEY_VAR,
  BUILD_CONTENT_URL_VAR,
  FALLBACK_SUPABASE_PUBLISHABLE_KEY,
  GOOGLE_PLACES_CONTENT_OPTIONS,
  MOTOR_MODELS_CONTENT_OPTIONS,
  PRODUCTION_CONTENT_SUPABASE_URL,
  PRODUCTION_SUPABASE_REF,
  STAGING_ISOLATED_SUPABASE_REF,
  resolveBuildContentSupabase,
  supabaseProjectRefFromJwt,
  supabaseProjectRefFromUrl,
} from '../../../scripts/lib/build-content-supabase.mjs';

const STAGING_URL = `https://${STAGING_ISOLATED_SUPABASE_REF}.supabase.co`;
const PRODUCTION_URL = PRODUCTION_CONTENT_SUPABASE_URL;

function fakeAnonJwt(ref: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'supabase',
    ref,
    role: 'anon',
  })).toString('base64url');
  return `${header}.${payload}.testsuffix`;
}

const stagingKey = fakeAnonJwt(STAGING_ISOLATED_SUPABASE_REF);
const productionKey = fakeAnonJwt(PRODUCTION_SUPABASE_REF);

const vercelPreviewRuntime = {
  VITE_SUPABASE_URL: STAGING_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: stagingKey,
};

describe('build-content Supabase pair', () => {
  it('prefers the production BUILD_CONTENT pair over Vercel Preview VITE staging', () => {
    const resolved = resolveBuildContentSupabase({
      ...vercelPreviewRuntime,
      [BUILD_CONTENT_URL_VAR]: PRODUCTION_URL,
      [BUILD_CONTENT_KEY_VAR]: productionKey,
    });

    expect(resolved.source).toBe('build_content');
    expect(resolved.url).toBe(PRODUCTION_URL);
    expect(resolved.key).toBe(productionKey);
    expect(resolved.url).not.toContain(STAGING_ISOLATED_SUPABASE_REF);
    expect(supabaseProjectRefFromUrl(resolved.url)).toBe(PRODUCTION_SUPABASE_REF);
    expect(supabaseProjectRefFromJwt(resolved.key)).toBe(PRODUCTION_SUPABASE_REF);
  });

  it('uses the committed production publishable fallback as a valid BUILD_CONTENT key', () => {
    expect(supabaseProjectRefFromJwt(FALLBACK_SUPABASE_PUBLISHABLE_KEY)).toBe(PRODUCTION_SUPABASE_REF);

    const resolved = resolveBuildContentSupabase({
      ...vercelPreviewRuntime,
      [BUILD_CONTENT_URL_VAR]: `${PRODUCTION_URL}/`,
      [BUILD_CONTENT_KEY_VAR]: FALLBACK_SUPABASE_PUBLISHABLE_KEY,
    });

    expect(resolved.source).toBe('build_content');
    expect(resolved.url).toBe(PRODUCTION_URL);
    expect(resolved.key).toBe(FALLBACK_SUPABASE_PUBLISHABLE_KEY);
  });

  it('fails closed when only one BUILD_CONTENT var is set', () => {
    expect(() => resolveBuildContentSupabase({
      ...vercelPreviewRuntime,
      [BUILD_CONTENT_URL_VAR]: PRODUCTION_URL,
    })).toThrow(/must be set together/);

    expect(() => resolveBuildContentSupabase({
      ...vercelPreviewRuntime,
      [BUILD_CONTENT_KEY_VAR]: productionKey,
    })).toThrow(/must be set together/);

    expect(() => resolveBuildContentSupabase({
      ...vercelPreviewRuntime,
      [BUILD_CONTENT_URL_VAR]: '   ',
      [BUILD_CONTENT_KEY_VAR]: productionKey,
    })).toThrow(/must be set together/);
  });

  it('fails closed on production URL with staging-ref key', () => {
    expect(() => resolveBuildContentSupabase({
      [BUILD_CONTENT_URL_VAR]: PRODUCTION_URL,
      [BUILD_CONTENT_KEY_VAR]: stagingKey,
    })).toThrow(/production URL with staging-ref key/);
  });

  it('fails closed on staging URL with production-ref key', () => {
    expect(() => resolveBuildContentSupabase({
      [BUILD_CONTENT_URL_VAR]: STAGING_URL,
      [BUILD_CONTENT_KEY_VAR]: productionKey,
    })).toThrow(/staging URL with production-ref key/);
  });

  it('keeps existing VITE-first behavior when no BUILD_CONTENT pair is set', () => {
    const resolved = resolveBuildContentSupabase(vercelPreviewRuntime);

    expect(resolved.source).toBe('legacy_fallback');
    expect(resolved.url).toBe(STAGING_URL);
    expect(resolved.key).toBe(stagingKey);
  });

  it('keeps the existing URL-then-key mismatch when no BUILD_CONTENT pair is set', () => {
    const resolved = resolveBuildContentSupabase({
      SUPABASE_URL: PRODUCTION_URL,
      VITE_SUPABASE_URL: STAGING_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: stagingKey,
    });

    expect(resolved.source).toBe('legacy_fallback');
    expect(resolved.url).toBe(PRODUCTION_URL);
    expect(resolved.key).toBe(stagingKey);
  });

  it('falls back to the production public catalog when no env pair is set', () => {
    const resolved = resolveBuildContentSupabase({});

    expect(resolved.source).toBe('legacy_fallback');
    expect(resolved.url).toBe(PRODUCTION_URL);
    expect(resolved.key).toBe(FALLBACK_SUPABASE_PUBLISHABLE_KEY);
  });

  it('keeps google-places VITE-or-cache behavior without inventing a key', () => {
    const withVite = resolveBuildContentSupabase(vercelPreviewRuntime, GOOGLE_PLACES_CONTENT_OPTIONS);
    expect(withVite.source).toBe('legacy_fallback');
    expect(withVite.url).toBe(STAGING_URL);
    expect(withVite.key).toBe(stagingKey);

    const noKey = resolveBuildContentSupabase({
      VITE_SUPABASE_URL: STAGING_URL,
    }, GOOGLE_PLACES_CONTENT_OPTIONS);
    expect(noKey.source).toBe('legacy_fallback');
    expect(noKey.url).toBe(STAGING_URL);
    expect(noKey.key).toBe('');

    const contentPair = resolveBuildContentSupabase({
      ...vercelPreviewRuntime,
      [BUILD_CONTENT_URL_VAR]: PRODUCTION_URL,
      [BUILD_CONTENT_KEY_VAR]: productionKey,
    }, GOOGLE_PLACES_CONTENT_OPTIONS);
    expect(contentPair.source).toBe('build_content');
    expect(contentPair.url).toBe(PRODUCTION_URL);
    expect(contentPair.key).toBe(productionKey);
  });

  it('documents motor_models option keys as the previous twins/prerender precedence', () => {
    expect(MOTOR_MODELS_CONTENT_OPTIONS.legacyUrlKeys).toEqual(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
    expect(MOTOR_MODELS_CONTENT_OPTIONS.legacyKeyKeys).toEqual([
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
    ]);
  });
});

describe('build-content wiring stays build-only', () => {
  const twins = readFileSync('scripts/generate-markdown-twins.mjs', 'utf8');
  const prerender = readFileSync('scripts/static-prerender.mjs', 'utf8');
  const places = readFileSync('scripts/fetch-google-places-data.mjs', 'utf8');
  const runtimeClient = readFileSync('src/integrations/supabase/client.ts', 'utf8');
  const stagingDoc = readFileSync('docs/STAGING_ACCEPTANCE.md', 'utf8');

  it('wires both motor_models loaders and Places through the shared resolver', () => {
    expect(twins).toContain("from './lib/build-content-supabase.mjs'");
    expect(twins).toContain('resolveBuildContentSupabase(process.env)');
    expect(twins).toContain('quote-builder motor_models');
    expect(twins).toContain('motor_models REST fallback');
    expect(twins).not.toContain('process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL');

    expect(prerender).toContain("from './lib/build-content-supabase.mjs'");
    expect(prerender).toContain('resolveBuildContentSupabase(process.env)');
    expect(prerender).not.toContain('process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL');

    expect(places).toContain('GOOGLE_PLACES_CONTENT_OPTIONS');
    expect(places).toContain('resolveBuildContentSupabase');
    expect(places).not.toMatch(/const SUPABASE_URL = process\.env\.VITE_SUPABASE_URL/);
  });

  it('does not teach runtime Vite or Edge to read BUILD_CONTENT or production at preview', () => {
    expect(runtimeClient).toContain('VITE_SUPABASE_URL');
    expect(runtimeClient).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    expect(runtimeClient).not.toContain('BUILD_CONTENT_SUPABASE');
    expect(runtimeClient).not.toContain('build-content-supabase');

    expect(readFileSync('supabase/functions/_shared/deposit-staging-guard.ts', 'utf8'))
      .not.toContain('BUILD_CONTENT_SUPABASE');
    expect(readFileSync('src/lib/deposit-identity.ts', 'utf8'))
      .not.toContain('BUILD_CONTENT_SUPABASE');
  });

  it('records the Preview build/runtime split in the staging runbook', () => {
    expect(stagingDoc).toContain('BUILD_CONTENT_SUPABASE_URL');
    expect(stagingDoc).toContain('BUILD_CONTENT_SUPABASE_PUBLISHABLE_KEY');
    expect(stagingDoc).toContain('Do not point Preview `VITE_*` at `eutsoqdpjurknjsshxes`');
    expect(stagingDoc).toContain('has no `motor_models`');
  });
});
