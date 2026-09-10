/**
 * Explicit release-prerequisite mapping for the two cron-auth functions.
 *
 * This is not inferred from SQL. A cron.alter_job caller rewrite does not
 * create tables/RPCs, so the existing matcher cannot see it. Protected slugs
 * fail closed until this manifest names a real applied caller migration.
 *
 * Unresolved entries must not invent a migration path or version. When a
 * caller migration later exists, set status=resolved with that path/version;
 * deploy then uses the ordinary applied-migration checks.
 */

export const CRON_AUTH_RELEASE_PROTECTED_SLUGS = Object.freeze([
  'check-expiring-promotions',
  'sync-lightspeed-inventory',
]);

export const CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH =
  'scripts/lib/cron-auth-release-prerequisites.json';

export const EXPLICIT_PREREQUISITE_VIA = 'explicit caller-migration prerequisite';

const MIGRATION_PATH_RE = /^supabase\/migrations\/[A-Za-z0-9._-]+\.sql$/;
const VERSION_PREFIX_RE = /^(\d{14})/;
const VERSION_EXACT_RE = /^\d{14}$/;

export function isCronAuthProtectedSlug(slug) {
  return CRON_AUTH_RELEASE_PROTECTED_SLUGS.includes(slug);
}

export function migrationVersionFromPath(filePath) {
  const base = String(filePath || '').split('/').pop() || '';
  const match = base.match(VERSION_PREFIX_RE);
  return match ? match[1] : null;
}

export function isSafeResolvedMigrationPath(filePath) {
  const path = String(filePath || '');
  return MIGRATION_PATH_RE.test(path) && !path.includes('..');
}

function sameProtectedSet(listed) {
  if (!Array.isArray(listed)) return false;
  const expected = [...CRON_AUTH_RELEASE_PROTECTED_SLUGS].sort();
  const received = listed.map((item) => String(item)).sort();
  return expected.length === received.length && expected.every((item, index) => item === received[index]);
}

export function parseReleasePrerequisiteManifest(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'is unreadable' };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'is malformed' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'is malformed' };
  }
  if (parsed.version !== 1) {
    return { ok: false, error: 'is malformed' };
  }
  if (!sameProtectedSet(parsed.protectedSlugs)) {
    return { ok: false, error: 'is malformed' };
  }
  if (!parsed.slugs || typeof parsed.slugs !== 'object' || Array.isArray(parsed.slugs)) {
    return { ok: false, error: 'is malformed' };
  }
  return { ok: true, value: parsed };
}

export function readReleasePrerequisiteManifest(files) {
  if (!files || !Object.prototype.hasOwnProperty.call(files, CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH)) {
    return { ok: false, error: 'is missing' };
  }
  return parseReleasePrerequisiteManifest(files[CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH]);
}

export function withReleasePrerequisiteManifest(files, readText) {
  const next = { ...(files || {}) };
  if (typeof readText !== 'function') return next;
  try {
    const text = readText(CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH);
    if (typeof text === 'string') next[CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH] = text;
  } catch {
    // Leave the key absent so protected slugs fail closed.
  }
  return next;
}

export function resolveCronAuthReleasePrerequisite(slug, files) {
  if (!isCronAuthProtectedSlug(slug)) {
    return { blockReason: null, requiredMigrations: [] };
  }

  const manifest = readReleasePrerequisiteManifest(files);
  if (!manifest.ok) {
    return {
      blockReason: `explicit release-prerequisite manifest ${manifest.error} for protected function \`${slug}\`.`,
      requiredMigrations: [],
    };
  }

  const entry = manifest.value.slugs[slug];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return {
      blockReason: `protected function \`${slug}\` has no explicit release-prerequisite manifest entry.`,
      requiredMigrations: [],
    };
  }

  if (entry.status === 'unresolved') {
    if (entry.path != null || entry.version != null) {
      return {
        blockReason: `protected function \`${slug}\` has a malformed unresolved prerequisite (must not name a migration path or version).`,
        requiredMigrations: [],
      };
    }
    const blocker =
      typeof entry.blocker === 'string' && entry.blocker.trim()
        ? entry.blocker.trim()
        : 'caller-migration prerequisite is unresolved';
    return {
      blockReason: `unresolved release prerequisite for \`${slug}\`: ${blocker}`,
      requiredMigrations: [],
    };
  }

  if (entry.status === 'resolved') {
    const path = typeof entry.path === 'string' ? entry.path.trim() : '';
    const version = typeof entry.version === 'string' ? entry.version.trim() : '';
    if (!isSafeResolvedMigrationPath(path) || !VERSION_EXACT_RE.test(version)) {
      return {
        blockReason: `protected function \`${slug}\` has a malformed resolved prerequisite (path/version).`,
        requiredMigrations: [],
      };
    }
    if (migrationVersionFromPath(path) !== version) {
      return {
        blockReason: `protected function \`${slug}\` resolved prerequisite version does not match the migration filename.`,
        requiredMigrations: [],
      };
    }
    if (!files || !Object.prototype.hasOwnProperty.call(files, path)) {
      return {
        blockReason: `protected function \`${slug}\` referenced caller migration is absent.`,
        requiredMigrations: [],
      };
    }
    const source = files[path];
    if (typeof source !== 'string' || !source.trim()) {
      return {
        blockReason: `protected function \`${slug}\` referenced caller migration is unreadable.`,
        requiredMigrations: [],
      };
    }
    return {
      blockReason: null,
      requiredMigrations: [
        {
          path,
          version,
          via: [EXPLICIT_PREREQUISITE_VIA],
        },
      ],
    };
  }

  return {
    blockReason: `protected function \`${slug}\` has a malformed release-prerequisite status.`,
    requiredMigrations: [],
  };
}

export function mergeReleasePrerequisites(slug, inferredRequired, files) {
  const explicit = resolveCronAuthReleasePrerequisite(slug, files);
  const inferred = Array.isArray(inferredRequired) ? inferredRequired : [];
  const seen = new Set(inferred.map((item) => item.path));
  const requiredMigrations = [...inferred];
  for (const item of explicit.requiredMigrations) {
    if (!seen.has(item.path)) {
      requiredMigrations.push(item);
      seen.add(item.path);
    }
  }
  return {
    requiredMigrations,
    explicitDeployBlock: explicit.blockReason,
  };
}
