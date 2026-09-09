/**
 * Git-diff → undeployed Supabase report.
 *
 * Pure functions only: callers pass a name-status diff and a path→source map.
 * No git, no network, no secrets. Used by the main-push reporter and by tests.
 */

import path from 'node:path';

const posix = path.posix;

export const FUNCTIONS_PREFIX = 'supabase/functions/';
export const MIGRATIONS_PREFIX = 'supabase/migrations/';
export const SHARED_SLUG = '_shared';
export const ORDERING_UNKNOWN = 'ordering unknown, check manually';

const SOURCE_EXT = new Set(['.ts', '.js', '.tsx', '.jsx', '.mjs']);
const NOT_TABLE_FROM = new Set([
  'Array',
  'Buffer',
  'Uint8Array',
  'Uint16Array',
  'Uint32Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
]);

export function isZeroSha(sha) {
  return !sha || /^0+$/.test(String(sha));
}

export function parseNameStatusZ(raw) {
  if (!raw) return [];
  const parts = String(raw).split('\0').filter((part) => part.length > 0);
  const entries = [];
  for (let i = 0; i < parts.length; ) {
    const code = parts[i];
    const letter = code[0];
    if (letter === 'R' || letter === 'C') {
      const fromPath = parts[i + 1];
      const toPath = parts[i + 2];
      if (!fromPath || !toPath) break;
      entries.push({ status: letter, path: toPosix(toPath), fromPath: toPosix(fromPath) });
      i += 3;
    } else {
      const filePath = parts[i + 1];
      if (!filePath) break;
      entries.push({ status: letter, path: toPosix(filePath) });
      i += 2;
    }
  }
  return entries;
}

export function toPosix(filePath) {
  return String(filePath).replaceAll('\\', '/');
}

export function stripJsComments(source) {
  return String(source)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

export function stripSqlComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ');
}

export function extractRelativeImports(source) {
  const text = stripJsComments(source);
  const specs = [];
  const fromRx = /\bfrom\s*['"](\.[^'"]+)['"]/g;
  const sideRx = /\bimport\s*['"](\.[^'"]+)['"]/g;
  const dynRx = /\bimport\s*\(\s*['"](\.[^'"]+)['"]/g;
  for (const rx of [fromRx, sideRx, dynRx]) {
    let match;
    while ((match = rx.exec(text))) specs.push(match[1]);
  }
  return specs;
}

export function resolveImportPath(fromFile, spec, files) {
  if (!spec || !spec.startsWith('.')) return null;
  const resolved = posix.normalize(posix.join(posix.dirname(toPosix(fromFile)), spec));
  if (!resolved.startsWith(FUNCTIONS_PREFIX)) return null;
  const candidates = [resolved];
  if (!posix.extname(resolved)) {
    candidates.push(`${resolved}.ts`, `${resolved}.js`, `${resolved}.mjs`);
  }
  for (const candidate of candidates) {
    if (files[candidate] != null) return candidate;
  }
  return candidates[0];
}

export function isSourceFile(filePath) {
  return SOURCE_EXT.has(posix.extname(toPosix(filePath)));
}

export function functionSlugFromPath(filePath) {
  const match = toPosix(filePath).match(/^supabase\/functions\/([^/]+)\//);
  return match ? match[1] : null;
}

export function filesByFunctionSlug(files) {
  const bySlug = new Map();
  for (const filePath of Object.keys(files)) {
    const slug = functionSlugFromPath(filePath);
    if (!slug || slug === SHARED_SLUG) continue;
    const list = bySlug.get(slug) || [];
    list.push(filePath);
    bySlug.set(slug, list);
  }
  return bySlug;
}

export function buildImportGraph(files) {
  const graph = new Map();
  for (const [filePath, source] of Object.entries(files)) {
    if (!isSourceFile(filePath)) continue;
    const deps = [];
    for (const spec of extractRelativeImports(source)) {
      const resolved = resolveImportPath(filePath, spec, files);
      if (resolved) deps.push(resolved);
    }
    graph.set(filePath, deps);
  }
  return graph;
}

export function reachablePaths(startPaths, graph) {
  const seen = new Set();
  const stack = [...startPaths];
  while (stack.length) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    const deps = graph.get(current) || [];
    for (const dep of deps) stack.push(dep);
  }
  return seen;
}

function receiverName(text, index) {
  const before = text.slice(Math.max(0, index - 48), index);
  const match = before.match(/([A-Za-z_][\w]*)\s*$/);
  return match ? match[1] : '';
}

export function extractFunctionRefs(source) {
  const text = stripJsComments(source);
  const rpcs = new Set();
  const tables = new Set();
  let unknownRefs = false;

  const rpcLit = /\.rpc\s*\(\s*(['"])([^'"\n]+)\1/g;
  let match;
  while ((match = rpcLit.exec(text))) rpcs.add(match[2]);

  const rpcTick = /\.rpc\s*\(\s*`([^`$\\]+)`/g;
  while ((match = rpcTick.exec(text))) rpcs.add(match[1]);

  if (/\.rpc\s*\(\s*(?![`'"])/.test(text) || /\.rpc\s*\(\s*`[^`]*\$\{/.test(text)) {
    unknownRefs = true;
  }

  const fromLit = /\.from\s*\(\s*(['"])([^'"\n]+)\1/g;
  while ((match = fromLit.exec(text))) {
    const name = receiverName(text, match.index);
    if (name === 'storage' || NOT_TABLE_FROM.has(name)) continue;
    tables.add(match[2]);
  }

  const fromAny = /\.from\s*\(/g;
  while ((match = fromAny.exec(text))) {
    const name = receiverName(text, match.index);
    if (name === 'storage' || NOT_TABLE_FROM.has(name)) continue;
    const rest = text.slice(match.index + match[0].length);
    if (!/^[`'"]/.test(rest) || /^`[^`]*\$\{/.test(rest)) unknownRefs = true;
  }

  return { rpcs: [...rpcs], tables: [...tables], unknownRefs };
}

export function normalizeIdent(name) {
  if (!name) return '';
  return String(name).replaceAll('"', '').split('.').pop().toLowerCase();
}

function pushIdent(set, raw) {
  const ident = normalizeIdent(raw);
  if (ident) set.add(ident);
}

export function extractMigrationObjects(sql) {
  const stripped = stripSqlComments(sql);
  const functions = new Set();
  const tables = new Set();
  let unknown = false;

  if (/\bDO\s+\$\$/i.test(stripped) || /\bEXECUTE\s+(format\s*\(|['"])/i.test(stripped)) {
    unknown = true;
  }

  const fnRx =
    /^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|[\w]+)(?:\s*\.\s*(?:"[^"]+"|[\w]+))?)/gim;
  const alterFnRx =
    /^\s*ALTER\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?((?:"[^"]+"|[\w]+)(?:\s*\.\s*(?:"[^"]+"|[\w]+))?)/gim;
  const tableRx =
    /^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|[\w]+)(?:\s*\.\s*(?:"[^"]+"|[\w]+))?)/gim;
  const viewRx =
    /^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|[\w]+)(?:\s*\.\s*(?:"[^"]+"|[\w]+))?)/gim;
  const alterTableRx =
    /^\s*ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?((?:"[^"]+"|[\w]+)(?:\s*\.\s*(?:"[^"]+"|[\w]+))?)/gim;

  let match;
  while ((match = fnRx.exec(stripped))) pushIdent(functions, match[1]);
  while ((match = alterFnRx.exec(stripped))) pushIdent(functions, match[1]);
  while ((match = tableRx.exec(stripped))) pushIdent(tables, match[1]);
  while ((match = viewRx.exec(stripped))) pushIdent(tables, match[1]);
  while ((match = alterTableRx.exec(stripped))) pushIdent(tables, match[1]);

  const recognized =
    /^\s*(CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT|NOTIFY|SELECT|INSERT|UPDATE|DELETE|TRUNCATE|SECURITY|ANALYZE|VACUUM|SET|RESET|BEGIN|COMMIT|CALL)\b/im;
  const hasSql = recognized.test(stripped);
  if (hasSql && functions.size === 0 && tables.size === 0 && !unknown) {
    const createOrAlter = /^\s*(CREATE|ALTER)\b/im.test(stripped);
    if (createOrAlter && !/^\s*(CREATE|ALTER)\s+(POLICY|INDEX|TRIGGER|EXTENSION|SCHEMA|TYPE|SEQUENCE|ROLE|USER|PUBLICATION|SUBSCRIPTION|STATISTICS)\b/im.test(stripped)) {
      unknown = true;
    }
  }

  return {
    functions: [...functions],
    tables: [...tables],
    unknown,
  };
}

export function migrationVersionFromFilename(filePath) {
  const base = posix.basename(toPosix(filePath));
  const match = base.match(/^(\d{14})/);
  return match ? match[1] : null;
}

export function migrationStem(filePath) {
  const base = posix.basename(toPosix(filePath));
  return base.replace(/\.sql$/i, '');
}

export function migrationNameFromFilename(filePath) {
  const stem = migrationStem(filePath);
  const match = stem.match(/^\d{14}_(.+)$/);
  return match ? match[1] : null;
}

/**
 * Inclusive minimum filename version reported as unapplied.
 *
 * Local files through 20260730161823 are UUID-suffixed Studio/Lovable
 * migrations whose recorded versions do not match those prefixes (earliest
 * applied versions look like 20250807012826). That historical set will not
 * be reconciled. The cutoff is the first filename version after that last
 * UUID file, so later descriptive-name migrations stay in scope and can
 * still match by name when an apply tool records a different timestamp.
 */
export const MIGRATION_WATCH_MIN_VERSION = '20260731000000';

function classifyDiff(diffEntries) {
  const changedFunctionFiles = [];
  const removedFunctionSlugs = new Set();
  const changedSharedFiles = [];
  const addedMigrations = [];
  const otherNotes = [];

  for (const entry of diffEntries) {
    const filePath = toPosix(entry.path);
    const fromPath = entry.fromPath ? toPosix(entry.fromPath) : null;
    const status = entry.status || '';

    if (filePath === 'supabase/functions/deno.json' || fromPath === 'supabase/functions/deno.json') {
      otherNotes.push('supabase/functions/deno.json changed; import-map effects are not inferred');
    }

    if (filePath.startsWith(MIGRATIONS_PREFIX) || (fromPath && fromPath.startsWith(MIGRATIONS_PREFIX))) {
      if (status === 'A' || status === 'C' || status === 'R') {
        if (filePath.startsWith(MIGRATIONS_PREFIX)) addedMigrations.push(filePath);
      }
      continue;
    }

    const paths = [filePath];
    if (fromPath) paths.push(fromPath);
    for (const candidate of paths) {
      if (!candidate.startsWith(FUNCTIONS_PREFIX)) continue;
      const slug = functionSlugFromPath(candidate);
      if (!slug) continue;
      if (slug === SHARED_SLUG) {
        changedSharedFiles.push(candidate);
        continue;
      }
      if (candidate === filePath) changedFunctionFiles.push(candidate);
      if (status === 'D' && candidate === filePath) removedFunctionSlugs.add(slug);
      if (status === 'R' && candidate === fromPath) removedFunctionSlugs.add(slug);
    }
  }

  return {
    changedFunctionFiles: unique(changedFunctionFiles),
    removedFunctionSlugs,
    changedSharedFiles: unique(changedSharedFiles),
    addedMigrations: unique(addedMigrations).sort(),
    otherNotes,
  };
}

function unique(list) {
  return [...new Set(list)];
}

function refsForFunction(slug, ownFiles, graph, files) {
  const reachable = reachablePaths(ownFiles, graph);
  const rpcs = new Set();
  const tables = new Set();
  let unknownRefs = false;
  for (const filePath of reachable) {
    if (!isSourceFile(filePath)) continue;
    const source = files[filePath];
    if (source == null) continue;
    const refs = extractFunctionRefs(source);
    for (const rpc of refs.rpcs) rpcs.add(rpc);
    for (const table of refs.tables) tables.add(table);
    if (refs.unknownRefs) unknownRefs = true;
  }
  return { slug, rpcs: [...rpcs], tables: [...tables], unknownRefs };
}

function matchRequiredMigrations(refs, migrations) {
  const required = [];
  if (!migrations.length) {
    return { required, orderingUnknown: false, unknownReason: null };
  }

  const hasDbRefs = refs.rpcs.length > 0 || refs.tables.length > 0 || refs.unknownRefs;
  let orderingUnknown = Boolean(refs.unknownRefs);
  const unknownReasons = [];
  if (refs.unknownRefs) unknownReasons.push('non-literal .rpc() / .from()');

  const rpcSet = new Set(refs.rpcs.map(normalizeIdent));
  const tableSet = new Set(refs.tables.map(normalizeIdent));

  for (const migration of migrations) {
    if (migration.objects.unknown && hasDbRefs) {
      orderingUnknown = true;
      unknownReasons.push(`${posix.basename(migration.path)} created objects not fully parsed`);
    }
    const matched = [];
    for (const fn of migration.objects.functions) {
      if (rpcSet.has(fn)) matched.push(`rpc ${fn}`);
    }
    for (const table of migration.objects.tables) {
      if (tableSet.has(table)) matched.push(`table ${table}`);
    }
    if (matched.length) {
      required.push({ path: migration.path, version: migration.version, via: unique(matched) });
    }
  }

  return {
    required,
    orderingUnknown,
    unknownReason: unknownReasons.length ? unique(unknownReasons).join('; ') : null,
  };
}

/**
 * @param {{ diffEntries: {status: string, path: string, fromPath?: string}[], files: Record<string, string>, from?: string, to?: string }} input
 */
export function buildDeployRequiredReport({ diffEntries, files, from = '', to = '' }) {
  const classified = classifyDiff(diffEntries || []);
  const graph = buildImportGraph(files);
  const bySlug = filesByFunctionSlug(files);

  const stale = new Map();
  const addReason = (slug, reason) => {
    const current = stale.get(slug) || { slug, reasons: [], removed: false };
    current.reasons.push(reason);
    stale.set(slug, current);
  };

  for (const filePath of classified.changedFunctionFiles) {
    const slug = functionSlugFromPath(filePath);
    if (!slug || slug === SHARED_SLUG) continue;
    addReason(slug, `direct file change (${posix.relative(FUNCTIONS_PREFIX + slug, filePath) || posix.basename(filePath)})`);
  }

  for (const slug of classified.removedFunctionSlugs) {
    const current = stale.get(slug) || { slug, reasons: [], removed: false };
    current.removed = true;
    if (!current.reasons.length) current.reasons.push('removed from tree');
    stale.set(slug, current);
  }

  if (classified.changedSharedFiles.length) {
    const changedShared = new Set(classified.changedSharedFiles);
    for (const [slug, ownFiles] of bySlug) {
      const reachable = reachablePaths(ownFiles, graph);
      const hits = [...reachable].filter((filePath) => changedShared.has(filePath));
      if (!hits.length) continue;
      addReason(
        slug,
        `imports changed ${SHARED_SLUG} (${hits.map((filePath) => posix.basename(filePath)).join(', ')})`,
      );
    }
  }

  const migrations = classified.addedMigrations.map((filePath) => ({
    path: filePath,
    version: migrationVersionFromFilename(filePath),
    objects: extractMigrationObjects(files[filePath] || ''),
  }));

  const functions = [...stale.values()]
    .map((entry) => {
      const ownFiles = bySlug.get(entry.slug) || [];
      const refs = refsForFunction(entry.slug, ownFiles, graph, files);
      const matched = entry.removed
        ? { required: [], orderingUnknown: false, unknownReason: null }
        : matchRequiredMigrations(refs, migrations);
      return {
        slug: entry.slug,
        reasons: unique(entry.reasons),
        removed: entry.removed,
        requiredMigrations: matched.required,
        orderingUnknown: matched.orderingUnknown,
        unknownReason: matched.unknownReason,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    from,
    to,
    migrations,
    functions,
    notes: unique(classified.otherNotes),
    empty: migrations.length === 0 && functions.length === 0,
  };
}

export function formatDeployRequiredMarkdown(report) {
  const lines = [
    '## Supabase deploy-required report',
    '',
    `Push range: \`${report.from || '?'}\` → \`${report.to || '?'}\``,
    '',
    'This job only reports. It does not deploy edge functions, apply migrations, or call the Supabase API.',
    '',
  ];

  if (report.empty) {
    lines.push('No added migrations and no stale edge functions in this push range.');
    if (report.notes?.length) {
      lines.push('', '### Notes', '', ...report.notes.map((note) => `- ${note}`));
    }
    return `${lines.join('\n')}\n`;
  }

  lines.push('Release order below: **migrations first**, then the functions that may depend on them.', '');
  lines.push('### 1. Migrations to apply (filename order)', '');
  if (!report.migrations.length) {
    lines.push('None added in this push range.');
  } else {
    for (const migration of report.migrations) {
      const created = [];
      for (const fn of migration.objects.functions) created.push(`function \`${fn}\``);
      for (const table of migration.objects.tables) created.push(`table \`${table}\``);
      const bits = [];
      if (created.length) bits.push(`creates ${created.join(', ')}`);
      if (migration.objects.unknown) bits.push(ORDERING_UNKNOWN);
      if (!bits.length) bits.push('no CREATE/ALTER function or table parsed');
      const version = migration.version ? `version \`${migration.version}\`` : 'version prefix not parsed';
      lines.push(`- \`${migration.path}\` — ${version}; ${bits.join('; ')}`);
    }
  }

  lines.push('', '### 2. Edge functions to redeploy', '');
  if (!report.functions.length) {
    lines.push('None.');
  } else {
    for (const fn of report.functions) {
      lines.push(`- \`${fn.slug}\`${fn.removed ? ' (removed on main — confirm it is disabled remotely)' : ''}`);
      lines.push(`  - why: ${fn.reasons.join('; ')}`);
      if (fn.removed) {
        lines.push('  - newly required migrations: n/a');
        continue;
      }
      if (fn.requiredMigrations.length) {
        const listed = fn.requiredMigrations
          .map((item) => `\`${posix.basename(item.path)}\` (${item.via.join(', ')})`)
          .join('; ');
        const extra = fn.orderingUnknown ? `; ${ORDERING_UNKNOWN}${fn.unknownReason ? ` (${fn.unknownReason})` : ''}` : '';
        lines.push(`  - newly required migrations: ${listed}${extra}`);
      } else if (fn.orderingUnknown) {
        lines.push(`  - newly required migrations: ${ORDERING_UNKNOWN}${fn.unknownReason ? ` (${fn.unknownReason})` : ''}`);
      } else {
        lines.push('  - newly required migrations: none detected');
      }
    }
  }

  if (report.notes?.length) {
    lines.push('', '### Notes', '', ...report.notes.map((note) => `- ${note}`));
  }

  return `${lines.join('\n')}\n`;
}

export function parseUpdatedAt(value) {
  if (value == null || value === '') return Number.NaN;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const numeric = Number(text);
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  return Date.parse(text);
}

export function isCommitNewerThanDeploy(commitIso, updatedAt) {
  const commitMs = Date.parse(commitIso);
  const deployedMs = parseUpdatedAt(updatedAt);
  if (!Number.isFinite(commitMs) || !Number.isFinite(deployedMs)) {
    return { stale: false, unknown: true };
  }
  return { stale: commitMs > deployedMs, unknown: false };
}

function addAppliedToken(set, value) {
  if (typeof value !== 'string') return;
  const trimmed = value.trim();
  if (!trimmed) return;
  const withoutSql = trimmed.replace(/\.sql$/i, '');
  set.add(withoutSql);
  const base = posix.basename(toPosix(withoutSql));
  if (base !== withoutSql) set.add(base);
  const version = migrationVersionFromFilename(base);
  const name = migrationNameFromFilename(base);
  if (version) set.add(version);
  if (name) set.add(name);
}

export function appliedVersionSet(applied) {
  const set = new Set();
  for (const row of applied || []) {
    if (typeof row === 'string') {
      addAppliedToken(set, row);
      continue;
    }
    if (row && typeof row === 'object') {
      addAppliedToken(set, row.version);
      addAppliedToken(set, row.name);
    }
  }
  return set;
}

/**
 * Comma/whitespace-separated migration names, stems, or versions that
 * count as applied. Used when the CLI list has versions only: MCP apply
 * stamps a different ledger version than the filename, so a versions-only
 * match stays false after a successful apply.
 */
export function parseTreatAppliedMigrations(raw) {
  if (raw == null) return [];
  return String(raw)
    .split(/[,|\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function appliedRowsHaveNames(appliedRows) {
  return (Array.isArray(appliedRows) ? appliedRows : []).some(
    (row) => row && typeof row === 'object' && String(row.name || '').trim(),
  );
}

export function mergeTreatAppliedRows(appliedRows, treatAppliedRaw) {
  const extra = parseTreatAppliedMigrations(treatAppliedRaw);
  if (!extra.length) return Array.isArray(appliedRows) ? appliedRows : [];
  return [...(Array.isArray(appliedRows) ? appliedRows : []), ...extra];
}

export function isMigrationApplied(filePath, appliedSet) {
  const version = migrationVersionFromFilename(filePath);
  const stem = migrationStem(filePath);
  const name = migrationNameFromFilename(filePath);
  if (version && appliedSet.has(version)) return true;
  if (stem && appliedSet.has(stem)) return true;
  if (name && appliedSet.has(name)) return true;
  return false;
}

/**
 * Newly required migrations for one function, using the same RPC/table
 * matcher as buildDeployRequiredReport.
 */
export function requiredMigrationsForSlug(slug, files, addedMigrationPaths) {
  const graph = buildImportGraph(files);
  const bySlug = filesByFunctionSlug(files);
  const refs = refsForFunction(slug, bySlug.get(slug) || [], graph, files);
  const migrations = (addedMigrationPaths || []).map((filePath) => ({
    path: filePath,
    version: migrationVersionFromFilename(filePath),
    objects: extractMigrationObjects(files[filePath] || ''),
  }));
  return matchRequiredMigrations(refs, migrations).required;
}

export function unappliedRequiredMigrations(requiredMigrations, appliedSet) {
  return (requiredMigrations || []).filter((item) => !isMigrationApplied(item.path, appliedSet));
}

export function blockedDeployReason(slug, requiredMigrations, appliedSet, options = {}) {
  const missing = unappliedRequiredMigrations(requiredMigrations, appliedSet);
  if (!missing.length) return null;
  const listed = missing.map((item) => `\`${posix.basename(item.path)}\``).join(', ');
  const noun = missing.length === 1 ? 'migration' : 'migrations';
  const verb = missing.length === 1 ? 'is' : 'are';
  let reason = `skipped: newly required ${noun} ${listed} ${verb} not applied in production. This job never applies migrations. Deploying \`${slug}\` would call schema that does not exist yet.`;
  if (options.versionsOnly) {
    const names = missing.map((item) => migrationNameFromFilename(item.path)).filter(Boolean);
    const named = names.length ? names.map((name) => `\`${name}\``).join(', ') : 'the filename stem after the timestamp';
    reason += ` The applied list has versions only (no names). MCP apply stamps its own ledger version, so a versions-only match can stay false after apply. After you apply the migration, re-run with \`DEPLOY_TREAT_APPLIED\` set to ${named}.`;
  }
  return reason;
}

export function formatDeployedTimestamp(updatedAt) {
  const ms = parseUpdatedAt(updatedAt);
  if (!Number.isFinite(ms)) {
    return updatedAt == null || updatedAt === '' ? 'unknown' : String(updatedAt);
  }
  return new Date(ms).toISOString();
}

export function formatTimeBehind(commitIso, updatedAt) {
  const commitMs = Date.parse(commitIso);
  const deployedMs = parseUpdatedAt(updatedAt);
  if (!Number.isFinite(commitMs) || !Number.isFinite(deployedMs) || commitMs <= deployedMs) {
    return null;
  }
  const deltaMs = commitMs - deployedMs;
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (deltaMs < 90 * minute) {
    const minutes = Math.max(1, Math.round(deltaMs / minute));
    return `${minutes} minute${minutes === 1 ? '' : 's'} behind`;
  }
  if (deltaMs < 36 * hour) {
    const hours = Math.max(1, Math.round(deltaMs / hour));
    return `${hours} hour${hours === 1 ? '' : 's'} behind`;
  }
  const days = Math.max(1, Math.round(deltaMs / day));
  return `${days} day${days === 1 ? '' : 's'} behind`;
}

export function buildDriftReport({
  localFunctions = [],
  deployedFunctions = [],
  localMigrations = [],
  appliedVersions = [],
  migrationWatchMinVersion = MIGRATION_WATCH_MIN_VERSION,
}) {
  const deployedBySlug = new Map();
  for (const row of deployedFunctions) {
    const slug = row?.slug || row?.name;
    if (!slug) continue;
    deployedBySlug.set(slug, {
      slug,
      version: row.version ?? null,
      updated_at: row.updated_at ?? row.updatedAt ?? null,
    });
  }

  const staleFunctions = [];
  for (const local of localFunctions) {
    const deployed = deployedBySlug.get(local.slug);
    if (!deployed) {
      staleFunctions.push({
        slug: local.slug,
        status: 'not_deployed',
        latestCommitAt: local.latestCommitAt || null,
        deployedUpdatedAt: null,
        deployedVersion: null,
      });
      continue;
    }
    if (!local.latestCommitAt) {
      staleFunctions.push({
        slug: local.slug,
        status: 'unknown',
        latestCommitAt: null,
        deployedUpdatedAt: deployed.updated_at,
        deployedVersion: deployed.version,
        detail: ORDERING_UNKNOWN,
      });
      continue;
    }
    const cmp = isCommitNewerThanDeploy(local.latestCommitAt, deployed.updated_at);
    if (cmp.unknown) {
      staleFunctions.push({
        slug: local.slug,
        status: 'unknown',
        latestCommitAt: local.latestCommitAt,
        deployedUpdatedAt: deployed.updated_at,
        deployedVersion: deployed.version,
        detail: ORDERING_UNKNOWN,
      });
      continue;
    }
    if (cmp.stale) {
      staleFunctions.push({
        slug: local.slug,
        status: 'stale',
        latestCommitAt: local.latestCommitAt,
        deployedUpdatedAt: deployed.updated_at,
        deployedVersion: deployed.version,
      });
    }
  }

  const applied = appliedVersionSet(appliedVersions);
  const minVersion = migrationWatchMinVersion || MIGRATION_WATCH_MIN_VERSION;
  const unapplied = [];
  let migrationInScopeCount = 0;
  let migrationSkippedHistoricalCount = 0;
  for (const migration of localMigrations) {
    const filePath = typeof migration === 'string' ? migration : migration.path;
    const version = migrationVersionFromFilename(filePath);
    if (!version) {
      unapplied.push({ path: filePath, version: null, status: 'unknown', detail: ORDERING_UNKNOWN });
      continue;
    }
    if (version < minVersion) {
      migrationSkippedHistoricalCount += 1;
      continue;
    }
    migrationInScopeCount += 1;
    if (!isMigrationApplied(filePath, applied)) {
      unapplied.push({ path: filePath, version, status: 'unapplied' });
    }
  }

  staleFunctions.sort((a, b) => a.slug.localeCompare(b.slug));
  unapplied.sort((a, b) => (a.version || a.path).localeCompare(b.version || b.path));

  return {
    staleFunctions,
    unappliedMigrations: unapplied,
    empty: staleFunctions.length === 0 && unapplied.length === 0,
    migrationWatchMinVersion: minVersion,
    migrationInScopeCount,
    migrationSkippedHistoricalCount,
  };
}

function formatStaleFunctionLine(fn) {
  if (fn.status === 'not_deployed') {
    return `- \`${fn.slug}\` — on main, not in deployed function list`;
  }
  if (fn.status !== 'stale') {
    return `- \`${fn.slug}\` — ${ORDERING_UNKNOWN}`;
  }
  const deployed = formatDeployedTimestamp(fn.deployedUpdatedAt);
  const behind = [];
  const timeBehind = formatTimeBehind(fn.latestCommitAt, fn.deployedUpdatedAt);
  if (timeBehind) behind.push(timeBehind);
  if (Number.isInteger(fn.commitsBehind) && fn.commitsBehind > 0) {
    behind.push(`${fn.commitsBehind} commit${fn.commitsBehind === 1 ? '' : 's'} behind`);
  }
  if (fn.deployedVersion != null) behind.push(`version ${fn.deployedVersion}`);
  const extra = behind.length ? ` (${behind.join(', ')})` : '';
  return `- \`${fn.slug}\` — main commit ${fn.latestCommitAt} is newer than deployed ${deployed}${extra}`;
}

function appendMigrationWatchRule(lines, report) {
  const minVersion = report.migrationWatchMinVersion || MIGRATION_WATCH_MIN_VERSION;
  const inScope = report.migrationInScopeCount;
  const skipped = report.migrationSkippedHistoricalCount;
  lines.push(
    '### Migration matching rule',
    '',
    'A file counts as applied when its 14-digit version, full stem, or name suffix matches an applied `version` or `name`. The name suffix is the filename after `YYYYMMDDHHMMSS_`, so an apply tool that records a different timestamp still matches names such as `upsert_soft_lead_quote` and `atomic_saved_quote_access`.',
    '',
    `Only filename versions \`${minVersion}\` or later are reported as unapplied. Older files were applied through a path that recorded different versions; that historical set will not be reconciled retroactively.`,
  );
  if (Number.isInteger(inScope) && Number.isInteger(skipped)) {
    lines.push(
      '',
      `This run checked ${inScope} in-scope migration file${inScope === 1 ? '' : 's'} for absence and did not report ${skipped} older file${skipped === 1 ? '' : 's'}.`,
    );
  }
}

export function formatDriftMarkdown(report) {
  const lines = [
    '## Supabase drift watch',
    '',
    'Compares `main` to deployed edge functions and applied migrations. This job does not deploy or apply anything.',
    '',
  ];
  if (report.empty) {
    lines.push('No stale functions or unapplied migrations relative to `main`.', '');
    appendMigrationWatchRule(lines, report);
    return `${lines.join('\n')}\n`;
  }

  lines.push('### Edge functions', '');
  if (!report.staleFunctions.length) {
    lines.push('None stale or missing.');
  } else {
    for (const fn of report.staleFunctions) {
      lines.push(formatStaleFunctionLine(fn));
    }
  }

  lines.push('', '### Migrations', '');
  if (!report.unappliedMigrations.length) {
    lines.push('None unapplied.');
  } else {
    for (const migration of report.unappliedMigrations) {
      if (migration.status === 'unknown') {
        lines.push(`- \`${migration.path}\` — ${ORDERING_UNKNOWN} (no 14-digit version prefix)`);
      } else {
        lines.push(
          `- \`${migration.path}\` — version \`${migration.version}\` has no matching applied version or name`,
        );
      }
    }
  }

  lines.push('');
  appendMigrationWatchRule(lines, report);

  return `${lines.join('\n')}\n`;
}

export function formatSecretsMissingNotice() {
  return [
    '## Supabase drift watch',
    '',
    'Skipped: repository secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are not both configured.',
    'This job is a no-op until those secrets exist. It never deploys or applies migrations.',
    '',
  ].join('\n');
}

export function secretsConfigured(env = process.env) {
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = env.SUPABASE_PROJECT_REF;
  return Boolean(token && String(token).trim() && ref && String(ref).trim());
}

export function sourceFilesForFunction(slug, files) {
  const graph = buildImportGraph(files);
  const bySlug = filesByFunctionSlug(files);
  const own = bySlug.get(slug) || [];
  return [...reachablePaths(own, graph)];
}

/**
 * Deployable edge-function slugs for a git name-status diff.
 *
 * Reuses buildDeployRequiredReport: direct supabase/functions/<slug>/ changes
 * plus every function whose import graph reaches a changed _shared file.
 * _shared itself is never a target. Removed slugs are listed separately and
 * are not deployed. Migrations are listed only so callers can refuse to apply
 * them — they are never deploy targets.
 *
 * ORDERING_UNKNOWN is a migration/RPC matching hint on the report; it does
 * not affect this slug list. Import-graph fan-out is deterministic for
 * static relative imports.
 */
export function deployTargetsFromDiff({ diffEntries, files, from = '', to = '' }) {
  const report = buildDeployRequiredReport({ diffEntries, files, from, to });
  const functions = [];
  const removed = [];
  for (const fn of report.functions) {
    if (fn.removed) {
      removed.push(fn.slug);
      continue;
    }
    functions.push({
      slug: fn.slug,
      reasons: fn.reasons,
      requiredMigrations: fn.requiredMigrations || [],
    });
  }
  return {
    from: report.from,
    to: report.to,
    functions,
    removed,
    migrations: (report.migrations || []).map((migration) => migration.path),
    notes: report.notes || [],
  };
}
