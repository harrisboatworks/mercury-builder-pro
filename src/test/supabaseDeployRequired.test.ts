import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  appliedVersionSet,
  blockedDeployReason,
  buildDeployRequiredReport,
  buildDriftReport,
  deployTargetsFromDiff,
  extractFunctionRefs,
  functionSlugFromPath,
  extractMigrationObjects,
  extractRelativeImports,
  formatDeployedTimestamp,
  formatDeployRequiredMarkdown,
  formatDriftMarkdown,
  formatSecretsMissingNotice,
  formatTimeBehind,
  isCommitNewerThanDeploy,
  isMigrationApplied,
  mergeTreatAppliedRows,
  MIGRATION_WATCH_MIN_VERSION,
  migrationNameFromFilename,
  ORDERING_UNKNOWN,
  parseTreatAppliedMigrations,
  parseNameStatusZ,
  requiredMigrationsForSlug,
  resolveImportPath,
  secretsConfigured,
  sourceFilesForFunction,
} from '../../scripts/lib/supabase-deploy-required.mjs';

const files = (entries: Record<string, string>) => entries;

const A_FN = 'supabase/functions/capture-chat-lead/index.ts';
const B_FN = 'supabase/functions/public-quote-api/index.ts';
const C_FN = 'supabase/functions/unrelated/index.ts';
const SHARED_CORS = 'supabase/functions/_shared/cors.ts';
const SHARED_RATE = 'supabase/functions/_shared/rate-limit.ts';
const SHARED_KB = 'supabase/functions/_shared/format-kb-documents.ts';
const SHARED_BLOG = 'supabase/functions/_shared/blog-knowledge.ts';
const MIG_RPC = 'supabase/migrations/20260101000000_create_lead_rpc.sql';
const MIG_TABLE = 'supabase/migrations/20260101000001_create_leads.sql';
const MIG_DO = 'supabase/migrations/20260101000002_dynamic.sql';

describe('git name-status parser', () => {
  it('parses added, modified, and renamed paths from -z output', () => {
    const raw = ['A', MIG_RPC, 'M', A_FN, 'R100', 'supabase/functions/old/index.ts', B_FN, ''].join('\0');
    expect(parseNameStatusZ(raw)).toEqual([
      { status: 'A', path: MIG_RPC },
      { status: 'M', path: A_FN },
      { status: 'R', path: B_FN, fromPath: 'supabase/functions/old/index.ts' },
    ]);
  });
});

describe('import resolution', () => {
  it('extracts relative from / import() / side-effect imports and ignores remote specifiers', () => {
    const source = `
      import { corsHeaders } from "../_shared/cors.ts";
      import type { Foo } from "../_shared/rate-limit.ts";
      import "./local.ts";
      export { x } from "../_shared/cors.ts";
      const mod = await import("../_shared/blog-knowledge.ts");
      import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
      import { z } from "npm:zod@3.22.4";
    `;
    expect(extractRelativeImports(source)).toEqual([
      '../_shared/cors.ts',
      '../_shared/rate-limit.ts',
      '../_shared/cors.ts',
      './local.ts',
      '../_shared/blog-knowledge.ts',
    ]);
  });

  it('resolves ../_shared against the importing function file', () => {
    const tree = files({ [SHARED_CORS]: 'export const corsHeaders = {};' });
    expect(resolveImportPath(A_FN, '../_shared/cors.ts', tree)).toBe(SHARED_CORS);
    expect(resolveImportPath(A_FN, 'https://esm.sh/x', tree)).toBeNull();
  });

  it('does not treat commented-out imports as importers', () => {
    expect(extractRelativeImports('// import { corsHeaders } from "../_shared/cors.ts";')).toEqual([]);
  });
});

describe('git-diff-to-report: functions and _shared', () => {
  const tree = files({
    [SHARED_CORS]: 'export const corsHeaders = {};',
    [SHARED_RATE]: `
      import { corsHeaders } from "./cors.ts";
      export async function checkRateLimit(client) {
        return client.rpc("check_rate_limit", {});
      }
    `,
    [SHARED_BLOG]: 'export const BLOG = [];',
    [SHARED_KB]: `
      import { BLOG } from "./blog-knowledge.ts";
      export function formatKb() { return BLOG; }
    `,
    [A_FN]: `
      import { corsHeaders } from "../_shared/cors.ts";
      import { checkRateLimit } from "../_shared/rate-limit.ts";
      await supabase.from("chat_leads").insert({});
    `,
    [B_FN]: `
      import { formatKb } from "../_shared/format-kb-documents.ts";
      await supabase.rpc("public_quote_stats", {});
    `,
    [C_FN]: `
      Deno.serve(() => new Response("ok"));
    `,
  });

  it('lists a function whose own file changed', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [{ status: 'M', path: A_FN }],
      files: tree,
    });
    expect(report.functions.map((fn) => fn.slug)).toEqual(['capture-chat-lead']);
    expect(report.functions[0].reasons.some((reason) => reason.includes('direct file change'))).toBe(true);
  });

  it('marks every function that imports a changed _shared file, and no others', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [{ status: 'M', path: SHARED_CORS }],
      files: tree,
    });
    const slugs = report.functions.map((fn) => fn.slug).sort();
    // capture-chat-lead imports cors directly; rate-limit also imports cors, so
    // capture-chat-lead is reachable. public-quote-api and unrelated do not import cors.
    expect(slugs).toEqual(['capture-chat-lead']);
    expect(report.functions[0].reasons.join(' ')).toMatch(/imports changed _shared/);
  });

  it('follows transitive _shared imports instead of guessing the whole set', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [{ status: 'M', path: SHARED_BLOG }],
      files: tree,
    });
    expect(report.functions.map((fn) => fn.slug)).toEqual(['public-quote-api']);
  });

  it('does not treat _shared itself as a deployable function', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [{ status: 'M', path: SHARED_CORS }],
      files: tree,
    });
    expect(report.functions.every((fn) => fn.slug !== '_shared')).toBe(true);
  });

  it('does not mark a function that does not import the changed _shared file', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [{ status: 'M', path: SHARED_RATE }],
      files: tree,
    });
    expect(report.functions.map((fn) => fn.slug)).toEqual(['capture-chat-lead']);
    expect(report.functions.find((fn) => fn.slug === 'unrelated')).toBeUndefined();
    expect(report.functions.find((fn) => fn.slug === 'public-quote-api')).toBeUndefined();
  });

  it('sourceFilesForFunction includes imported _shared files only', () => {
    const reachable = sourceFilesForFunction('public-quote-api', tree);
    expect(reachable).toContain(B_FN);
    expect(reachable).toContain(SHARED_KB);
    expect(reachable).toContain(SHARED_BLOG);
    expect(reachable).not.toContain(SHARED_CORS);
  });
});

describe('deploy targets from changed paths', () => {
  const tree = files({
    [SHARED_CORS]: 'export const corsHeaders = {};',
    [SHARED_RATE]: `
      import { corsHeaders } from "./cors.ts";
      export async function checkRateLimit(client) {
        return client.rpc("check_rate_limit", {});
      }
    `,
    [SHARED_BLOG]: 'export const BLOG = [];',
    [SHARED_KB]: `
      import { BLOG } from "./blog-knowledge.ts";
      export function formatKb() { return BLOG; }
    `,
    [A_FN]: `
      import { corsHeaders } from "../_shared/cors.ts";
      import { checkRateLimit } from "../_shared/rate-limit.ts";
      await supabase.from("chat_leads").insert({});
    `,
    [B_FN]: `
      import { formatKb } from "../_shared/format-kb-documents.ts";
      await supabase.rpc("public_quote_stats", {});
    `,
    [C_FN]: `
      Deno.serve(() => new Response("ok"));
    `,
    'supabase/functions/also-cors/index.ts': `
      import { corsHeaders } from "../_shared/cors.ts";
    `,
  });

  it('maps a function file path to that function name only', () => {
    expect(functionSlugFromPath(A_FN)).toBe('capture-chat-lead');
    const targets = deployTargetsFromDiff({
      diffEntries: [{ status: 'M', path: A_FN }],
      files: tree,
    });
    expect(targets.functions.map((fn) => fn.slug)).toEqual(['capture-chat-lead']);
    expect(targets.removed).toEqual([]);
  });

  it('fans a _shared change out to every importer and not to _shared itself', () => {
    expect(functionSlugFromPath(SHARED_CORS)).toBe('_shared');
    const targets = deployTargetsFromDiff({
      diffEntries: [{ status: 'M', path: SHARED_CORS }],
      files: tree,
    });
    expect(targets.functions.map((fn) => fn.slug).sort()).toEqual(['also-cors', 'capture-chat-lead']);
    expect(targets.functions.every((fn) => fn.slug !== '_shared')).toBe(true);
    expect(targets.functions.every((fn) => fn.reasons.some((reason) => reason.includes('imports changed _shared')))).toBe(
      true,
    );
  });

  it('maps a config.toml-only change to no deploy targets', () => {
    expect(functionSlugFromPath('supabase/config.toml')).toBeNull();
    const targets = deployTargetsFromDiff({
      diffEntries: [{ status: 'M', path: 'supabase/config.toml' }],
      files: tree,
    });
    expect(targets.functions).toEqual([]);
    expect(targets.removed).toEqual([]);
    expect(targets.migrations).toEqual([]);
  });

  it('does not treat an added migration as a function to deploy', () => {
    const targets = deployTargetsFromDiff({
      diffEntries: [{ status: 'A', path: MIG_RPC }],
      files: { ...tree, [MIG_RPC]: 'SELECT 1;' },
    });
    expect(targets.functions).toEqual([]);
    expect(targets.migrations).toEqual([MIG_RPC]);
  });

  it('passes through the report\'s per-function required migrations', () => {
    const filesWithMigrations = {
      ...tree,
      [MIG_RPC]: `
        CREATE OR REPLACE FUNCTION public.insert_chat_lead()
        RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END; $$;
      `,
      [MIG_TABLE]: `
        CREATE TABLE public.chat_leads (
          id uuid PRIMARY KEY
        );
      `,
    };
    const diffEntries = [
      { status: 'M' as const, path: A_FN },
      { status: 'A' as const, path: MIG_RPC },
      { status: 'A' as const, path: MIG_TABLE },
    ];
    const report = buildDeployRequiredReport({ diffEntries, files: filesWithMigrations });
    const targets = deployTargetsFromDiff({ diffEntries, files: filesWithMigrations });
    const reportFn = report.functions.find((item) => item.slug === 'capture-chat-lead');
    const targetFn = targets.functions.find((item) => item.slug === 'capture-chat-lead');
    expect(targetFn?.requiredMigrations).toEqual(reportFn?.requiredMigrations);
    expect(requiredMigrationsForSlug('capture-chat-lead', filesWithMigrations, [MIG_RPC, MIG_TABLE])).toEqual(
      reportFn?.requiredMigrations,
    );
  });

  it('lists a removed function as removed instead of deploying it', () => {
    const targets = deployTargetsFromDiff({
      diffEntries: [{ status: 'D', path: C_FN }],
      files: tree,
    });
    expect(targets.functions.map((fn) => fn.slug)).not.toContain('unrelated');
    expect(targets.removed).toEqual(['unrelated']);
  });
});

describe('git-diff-to-report: migrations and RPC/table matching', () => {
  const tree = files({
    [A_FN]: `
      import { checkRateLimit } from "../_shared/rate-limit.ts";
      await supabase.from("chat_leads").insert({});
      await supabase.rpc("insert_chat_lead", {});
    `,
    [B_FN]: `
      await supabase.rpc("check_rate_limit", {});
    `,
    [C_FN]: `
      const name = "insert_chat_lead";
      await supabase.rpc(name);
    `,
    'supabase/functions/_shared/rate-limit.ts': `await client.rpc("check_rate_limit", {});`,
    [MIG_RPC]: `
      CREATE OR REPLACE FUNCTION public.insert_chat_lead()
      RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END; $$;
    `,
    [MIG_TABLE]: `
      CREATE TABLE public.chat_leads (
        id uuid PRIMARY KEY
      );
    `,
    [MIG_DO]: `
      DO $$ BEGIN EXECUTE format('create table %I (id int)', 'mystery'); END $$;
    `,
    'supabase/migrations/20251201000000_already_there.sql': 'ALTER TABLE public.other ADD COLUMN x int;',
  });

  it('reports only added migrations, in filename order, before functions', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: A_FN },
        { status: 'A', path: MIG_TABLE },
        { status: 'A', path: MIG_RPC },
        { status: 'M', path: 'supabase/migrations/20251201000000_already_there.sql' },
      ],
      files: tree,
    });
    expect(report.migrations.map((migration) => migration.path)).toEqual([MIG_RPC, MIG_TABLE]);
    const markdown = formatDeployRequiredMarkdown(report);
    const migHeading = markdown.indexOf('### 1. Migrations to apply');
    const fnHeading = markdown.indexOf('### 2. Edge functions to redeploy');
    const rpcPos = markdown.indexOf(MIG_RPC);
    const tablePos = markdown.indexOf(MIG_TABLE);
    expect(migHeading).toBeGreaterThan(-1);
    expect(fnHeading).toBeGreaterThan(migHeading);
    expect(rpcPos).toBeGreaterThan(migHeading);
    expect(tablePos).toBeGreaterThan(rpcPos);
    expect(tablePos).toBeLessThan(fnHeading);
  });

  it('matches .rpc("...") and .from("...") to objects created by added migrations', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: A_FN },
        { status: 'A', path: MIG_RPC },
        { status: 'A', path: MIG_TABLE },
      ],
      files: tree,
    });
    const fn = report.functions.find((item) => item.slug === 'capture-chat-lead');
    expect(fn?.orderingUnknown).toBe(false);
    expect(fn?.requiredMigrations.map((item) => item.path)).toEqual([MIG_RPC, MIG_TABLE]);
    expect(fn?.requiredMigrations[0].via).toContain('rpc insert_chat_lead');
    expect(fn?.requiredMigrations[1].via).toContain('table chat_leads');
  });

  it('follows RPCs declared in imported _shared files', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: A_FN },
        { status: 'A', path: 'supabase/migrations/20260101000003_rate.sql' },
      ],
      files: {
        ...tree,
        'supabase/migrations/20260101000003_rate.sql':
          'CREATE OR REPLACE FUNCTION public.check_rate_limit()\nRETURNS boolean AS $$ SELECT true; $$ LANGUAGE sql;',
      },
    });
    const fn = report.functions.find((item) => item.slug === 'capture-chat-lead');
    expect(fn?.requiredMigrations[0].via).toContain('rpc check_rate_limit');
  });

  it('says none detected when refs and created objects do not overlap', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: B_FN },
        { status: 'A', path: MIG_TABLE },
      ],
      files: tree,
    });
    const fn = report.functions.find((item) => item.slug === 'public-quote-api');
    expect(fn?.orderingUnknown).toBe(false);
    expect(fn?.requiredMigrations).toEqual([]);
    expect(formatDeployRequiredMarkdown(report)).toContain('newly required migrations: none detected');
  });

  it('gives up with ordering unknown on non-literal .rpc() rather than inventing a match', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: C_FN },
        { status: 'A', path: MIG_RPC },
      ],
      files: tree,
    });
    const fn = report.functions.find((item) => item.slug === 'unrelated');
    expect(fn?.orderingUnknown).toBe(true);
    expect(formatDeployRequiredMarkdown(report)).toContain(ORDERING_UNKNOWN);
  });

  it('gives up when a migration is a DO/EXECUTE block and the function has DB refs', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: A_FN },
        { status: 'A', path: MIG_DO },
      ],
      files: tree,
    });
    const fn = report.functions.find((item) => item.slug === 'capture-chat-lead');
    expect(fn?.orderingUnknown).toBe(true);
    expect(formatDeployRequiredMarkdown(report)).toContain(ORDERING_UNKNOWN);
  });
});

describe('function ref extraction', () => {
  it('reads quoted .rpc and .from, skips storage.from and Array.from', () => {
    const refs = extractFunctionRefs(`
      await supabase.rpc("insert_chat_lead", {});
      await supabase.rpc('other_rpc');
      await supabase.from("chat_leads").select("*");
      await supabase.storage.from("hero-images").upload("x", blob);
      const xs = Array.from(items);
      const buf = Buffer.from("abc");
    `);
    expect(refs.rpcs).toEqual(['insert_chat_lead', 'other_rpc']);
    expect(refs.tables).toEqual(['chat_leads']);
    expect(refs.unknownRefs).toBe(false);
  });

  it('flags dynamic .rpc as unknown', () => {
    expect(extractFunctionRefs('await supabase.rpc(actionName)').unknownRefs).toBe(true);
  });
});

describe('migration object extraction', () => {
  it('captures CREATE FUNCTION / TABLE names including schema', () => {
    const objects = extractMigrationObjects(`
      CREATE OR REPLACE FUNCTION public.insert_chat_lead(p jsonb)
      RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END; $$;
      CREATE TABLE IF NOT EXISTS public.chat_leads (id uuid);
    `);
    expect(objects.functions).toContain('insert_chat_lead');
    expect(objects.tables).toContain('chat_leads');
    expect(objects.unknown).toBe(false);
  });

  it('marks DO $$ / EXECUTE format as unknown', () => {
    expect(extractMigrationObjects("DO $$ BEGIN EXECUTE format('create table %I (id int)', 'x'); END $$;").unknown).toBe(
      true,
    );
  });
});

describe('markdown report contract', () => {
  it('states that it does not deploy and stays empty-safe', () => {
    const markdown = formatDeployRequiredMarkdown({
      from: 'aaa',
      to: 'bbb',
      migrations: [],
      functions: [],
      notes: [],
      empty: true,
    });
    expect(markdown).toContain('does not deploy');
    expect(markdown).toContain('No added migrations and no stale edge functions');
  });

  it('notes deno.json changes without inventing function stale-ness', () => {
    const report = buildDeployRequiredReport({
      diffEntries: [{ status: 'M', path: 'supabase/functions/deno.json' }],
      files: files({
        'supabase/functions/deno.json': '{}',
        [C_FN]: 'export {}',
      }),
    });
    expect(report.functions).toEqual([]);
    expect(report.notes.join(' ')).toMatch(/deno\.json/);
  });
});

describe('drift comparison helpers', () => {
  it('treats a newer main commit as stale and equal timestamps as current', () => {
    expect(isCommitNewerThanDeploy('2026-09-08T12:00:01Z', '2026-09-08T12:00:00Z')).toEqual({
      stale: true,
      unknown: false,
    });
    expect(isCommitNewerThanDeploy('2026-09-08T12:00:00Z', '2026-09-08T12:00:00Z')).toEqual({
      stale: false,
      unknown: false,
    });
    expect(isCommitNewerThanDeploy('not-a-date', '2026-09-08T12:00:00Z').unknown).toBe(true);
  });

  it('matches applied migration versions by 14-digit prefix or full stem', () => {
    const applied = appliedVersionSet([{ version: '20260101000000' }, { version: '20260101000001_create_leads' }]);
    expect(isMigrationApplied(MIG_RPC, applied)).toBe(true);
    expect(isMigrationApplied(MIG_TABLE, applied)).toBe(true);
    expect(isMigrationApplied('supabase/migrations/20260101000099_missing.sql', applied)).toBe(false);
  });

  it('reports undeployed functions and unapplied migrations without inventing order', () => {
    const report = buildDriftReport({
      localFunctions: [
        { slug: 'public-quote-api', latestCommitAt: '2026-09-08T15:00:00Z' },
        { slug: 'capture-chat-lead', latestCommitAt: '2026-09-01T00:00:00Z' },
        { slug: 'brand-new', latestCommitAt: '2026-09-08T15:00:00Z' },
      ],
      deployedFunctions: [
        { slug: 'public-quote-api', version: 12, updated_at: '2026-09-08T12:00:00Z' },
        { slug: 'capture-chat-lead', version: 4, updated_at: '2026-09-07T00:00:00Z' },
      ],
      localMigrations: [
        'supabase/migrations/20260901000000_create_lead_rpc.sql',
        'supabase/migrations/20260901000001_create_leads.sql',
      ],
      appliedVersions: [{ version: '20260901000000' }],
    });
    expect(report.empty).toBe(false);
    expect(report.staleFunctions.map((fn) => fn.slug)).toEqual(['brand-new', 'public-quote-api']);
    expect(report.staleFunctions.find((fn) => fn.slug === 'brand-new')?.status).toBe('not_deployed');
    expect(report.staleFunctions.find((fn) => fn.slug === 'public-quote-api')?.status).toBe('stale');
    expect(report.unappliedMigrations.map((item) => item.version)).toEqual(['20260901000001']);
  });
});

describe('drift migration matching rule', () => {
  const appliedYesterday = [
    { version: '20260908201000', name: 'upsert_soft_lead_quote' },
    { version: '20260908201100', name: 'atomic_saved_quote_access' },
  ];
  const localRecent = [
    'supabase/migrations/20250807132831_3c625049-13f9-4186-b88f-43cefc41c4db.sql',
    'supabase/migrations/20250807231346_ea06f993-2f10-46fb-936a-30becf67e630.sql',
    'supabase/migrations/20260830211200_atomic_saved_quote_access.sql',
    'supabase/migrations/20260830214400_upsert_soft_lead_quote.sql',
    'supabase/migrations/20260909000000_brand_new_unapplied.sql',
  ];

  it('reads the filename suffix after the 14-digit version', () => {
    expect(migrationNameFromFilename('supabase/migrations/20260830214400_upsert_soft_lead_quote.sql')).toBe(
      'upsert_soft_lead_quote',
    );
    expect(migrationNameFromFilename('supabase/migrations/20260830211200_atomic_saved_quote_access.sql')).toBe(
      'atomic_saved_quote_access',
    );
  });

  it('treats a migration as applied when the recorded name matches the filename suffix', () => {
    const applied = appliedVersionSet(appliedYesterday);
    expect(isMigrationApplied('supabase/migrations/20260830214400_upsert_soft_lead_quote.sql', applied)).toBe(true);
    expect(isMigrationApplied('supabase/migrations/20260830211200_atomic_saved_quote_access.sql', applied)).toBe(true);
    expect(isMigrationApplied('supabase/migrations/20260909000000_brand_new_unapplied.sql', applied)).toBe(false);
  });

  it('matches production MCP-stamped rows by name when the ledger version differs', () => {
    const applied = appliedVersionSet([
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
      { version: '20260909164256', name: 'quote_email_delivery_audit' },
    ]);
    expect(
      isMigrationApplied(
        'supabase/migrations/20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql',
        applied,
      ),
    ).toBe(true);
    expect(
      isMigrationApplied('supabase/migrations/20260815160000_quote_email_delivery_audit.sql', applied),
    ).toBe(true);
    expect(isMigrationApplied('supabase/migrations/20260909199999_absent_from_ledger.sql', applied)).toBe(
      false,
    );
  });

  it('parses treat-applied override tokens without treating a newer latest version as applied', () => {
    expect(parseTreatAppliedMigrations('serialize_quote_email_delivery_failed_retry_claim')).toEqual([
      'serialize_quote_email_delivery_failed_retry_claim',
    ]);
    const versionsOnly = appliedVersionSet(['20260909164256', '20260909194905']);
    expect(
      isMigrationApplied(
        'supabase/migrations/20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql',
        versionsOnly,
      ),
    ).toBe(false);
    const withOverride = appliedVersionSet(
      mergeTreatAppliedRows(
        ['20260909164256', '20260909194905'],
        'serialize_quote_email_delivery_failed_retry_claim',
      ),
    );
    expect(
      isMigrationApplied(
        'supabase/migrations/20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql',
        withOverride,
      ),
    ).toBe(true);
  });

  it('does not report name-matched files or historical versions below the baseline', () => {
    const report = buildDriftReport({
      localMigrations: localRecent,
      appliedVersions: appliedYesterday,
    });
    expect(report.migrationWatchMinVersion).toBe(MIGRATION_WATCH_MIN_VERSION);
    expect(report.migrationSkippedHistoricalCount).toBe(2);
    expect(report.migrationInScopeCount).toBe(3);
    expect(report.unappliedMigrations.map((item) => item.path)).toEqual([
      'supabase/migrations/20260909000000_brand_new_unapplied.sql',
    ]);
    expect(report.unappliedMigrations.some((item) => item.path.includes('upsert_soft_lead_quote'))).toBe(false);
    expect(report.unappliedMigrations.some((item) => item.path.includes('atomic_saved_quote_access'))).toBe(false);
    expect(report.unappliedMigrations.some((item) => item.version === '20250807132831')).toBe(false);
    expect(report.unappliedMigrations.some((item) => item.version === '20250807231346')).toBe(false);
  });

  it('reports a genuinely new in-scope file that matches neither version nor name', () => {
    const report = buildDriftReport({
      localMigrations: ['supabase/migrations/20260909000000_brand_new_unapplied.sql'],
      appliedVersions: appliedYesterday,
    });
    expect(report.empty).toBe(false);
    expect(report.unappliedMigrations).toEqual([
      {
        path: 'supabase/migrations/20260909000000_brand_new_unapplied.sql',
        version: '20260909000000',
        status: 'unapplied',
      },
    ]);
  });

  it('states the matching rule and the historical cutoff in the job output', () => {
    const report = buildDriftReport({
      localMigrations: localRecent,
      appliedVersions: appliedYesterday,
    });
    const markdown = formatDriftMarkdown(report);
    expect(markdown).toContain('### Migration matching rule');
    expect(markdown).toContain(MIGRATION_WATCH_MIN_VERSION);
    expect(markdown).toContain('name suffix');
    expect(markdown).toContain('will not be reconciled retroactively');
    expect(markdown).toContain('This run checked 3 in-scope migration files for absence and did not report 2 older files.');
    expect(markdown).toContain('20260909000000_brand_new_unapplied.sql');
    expect(markdown).toContain('has no matching applied version or name');
    expect(markdown).not.toContain('upsert_soft_lead_quote.sql');
    expect(markdown).not.toContain('atomic_saved_quote_access.sql');
    expect(markdown).not.toContain('20250807132831');
  });

  it('states the matching rule even when there is no drift', () => {
    const report = buildDriftReport({
      localMigrations: ['supabase/migrations/20260830214400_upsert_soft_lead_quote.sql'],
      appliedVersions: [{ version: '20260908201000', name: 'upsert_soft_lead_quote' }],
    });
    expect(report.empty).toBe(true);
    const markdown = formatDriftMarkdown(report);
    expect(markdown).toContain('No stale functions or unapplied migrations relative to `main`.');
    expect(markdown).toContain('### Migration matching rule');
    expect(markdown).toContain(MIGRATION_WATCH_MIN_VERSION);
    expect(markdown).toContain('This run checked 1 in-scope migration file for absence and did not report 0 older files.');
  });
});

describe('drift timestamp rendering', () => {
  it('renders epoch-millisecond deployed times as ISO and states how far behind', () => {
    expect(formatDeployedTimestamp(1787749616915)).toBe('2026-08-26T13:06:56.915Z');
    expect(formatDeployedTimestamp('1787749616915')).toBe('2026-08-26T13:06:56.915Z');
    expect(formatTimeBehind('2026-09-08T19:13:09-04:00', 1787749616915)).toBe('13 days behind');
  });

  it('prints ISO deployed time, day lag, and commit lag on stale function lines', () => {
    const report = buildDriftReport({
      localFunctions: [{ slug: 'ai-chatbot', latestCommitAt: '2026-09-08T19:13:09-04:00' }],
      deployedFunctions: [{ slug: 'ai-chatbot', version: 737, updated_at: 1787749616915 }],
      localMigrations: [],
      appliedVersions: [],
    });
    report.staleFunctions[0].commitsBehind = 3;
    const markdown = formatDriftMarkdown(report);
    expect(markdown).toContain(
      '`ai-chatbot` — main commit 2026-09-08T19:13:09-04:00 is newer than deployed 2026-08-26T13:06:56.915Z (13 days behind, 3 commits behind, version 737)',
    );
    expect(markdown).not.toContain('1787749616915');
  });
});

describe('secrets no-op notice', () => {
  it('does not distinguish which secret is missing', () => {
    expect(secretsConfigured({ SUPABASE_ACCESS_TOKEN: 'x', SUPABASE_PROJECT_REF: '' })).toBe(false);
    expect(secretsConfigured({ SUPABASE_ACCESS_TOKEN: '', SUPABASE_PROJECT_REF: 'ref' })).toBe(false);
    expect(secretsConfigured({ SUPABASE_ACCESS_TOKEN: 'x', SUPABASE_PROJECT_REF: 'ref' })).toBe(true);
    const notice = formatSecretsMissingNotice();
    expect(notice).toContain('SUPABASE_ACCESS_TOKEN');
    expect(notice).toContain('SUPABASE_PROJECT_REF');
    expect(notice).toContain('no-op');
    expect(notice).not.toMatch(/token is missing|ref is missing/i);
  });
});

describe('report script output contract', () => {
  const GOLDEN_DEPLOY_REQUIRED_MARKDOWN = `## Supabase deploy-required report

Push range: \`aaa111\` → \`bbb222\`

This job only reports. It does not deploy edge functions, apply migrations, or call the Supabase API.

Release order below: **migrations first**, then the functions that may depend on them.

### 1. Migrations to apply (filename order)

- \`supabase/migrations/20260101000000_create_lead_rpc.sql\` — version \`20260101000000\`; creates function \`insert_chat_lead\`
- \`supabase/migrations/20260101000001_create_leads.sql\` — version \`20260101000001\`; creates table \`chat_leads\`
- \`supabase/migrations/20260101000002_dynamic.sql\` — version \`20260101000002\`; ordering unknown, check manually

### 2. Edge functions to redeploy

- \`capture-chat-lead\`
  - why: direct file change (index.ts)
  - newly required migrations: \`20260101000000_create_lead_rpc.sql\` (rpc insert_chat_lead); \`20260101000001_create_leads.sql\` (table chat_leads); ordering unknown, check manually (20260101000002_dynamic.sql created objects not fully parsed)
- \`public-quote-api\`
  - why: direct file change (index.ts)
  - newly required migrations: ordering unknown, check manually (20260101000002_dynamic.sql created objects not fully parsed)
- \`unrelated\` (removed on main — confirm it is disabled remotely)
  - why: direct file change (index.ts)
  - newly required migrations: n/a

### Notes

- supabase/functions/deno.json changed; import-map effects are not inferred
`;

  it('keeps the report script output byte-identical after the deploy-gate refactor', () => {
    const files = {
      [A_FN]: `
      import { checkRateLimit } from "../_shared/rate-limit.ts";
      await supabase.from("chat_leads").insert({});
      await supabase.rpc("insert_chat_lead", {});
    `,
      [B_FN]: `
      await supabase.rpc("check_rate_limit", {});
    `,
      [C_FN]: `
      const name = "insert_chat_lead";
      await supabase.rpc(name);
    `,
      'supabase/functions/_shared/rate-limit.ts': `await client.rpc("check_rate_limit", {});`,
      'supabase/functions/deno.json': '{}',
      [MIG_RPC]: `
      CREATE OR REPLACE FUNCTION public.insert_chat_lead()
      RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END; $$;
    `,
      [MIG_TABLE]: `
      CREATE TABLE public.chat_leads (
        id uuid PRIMARY KEY
      );
    `,
      [MIG_DO]: `
      DO $$ BEGIN EXECUTE format('create table %I (id int)', 'mystery'); END $$;
    `,
    };
    const report = buildDeployRequiredReport({
      diffEntries: [
        { status: 'M', path: A_FN },
        { status: 'M', path: B_FN },
        { status: 'D', path: C_FN },
        { status: 'A', path: MIG_RPC },
        { status: 'A', path: MIG_TABLE },
        { status: 'A', path: MIG_DO },
        { status: 'M', path: 'supabase/functions/deno.json' },
      ],
      files,
      from: 'aaa111',
      to: 'bbb222',
    });
    expect(formatDeployRequiredMarkdown(report)).toBe(GOLDEN_DEPLOY_REQUIRED_MARKDOWN);

    const script = readFileSync('scripts/report-supabase-deploy-required.mjs', 'utf8');
    expect(script).toContain('buildDeployRequiredReport');
    expect(script).toContain('formatDeployRequiredMarkdown(report)');
  });

  it('blocks only when a required migration is missing from the applied set', () => {
    const required = [{ path: MIG_RPC, version: '20260101000000' }];
    const applied = appliedVersionSet([{ version: '20260101000000' }]);
    const missing = appliedVersionSet([{ version: '20251201000000' }]);
    expect(blockedDeployReason('capture-chat-lead', required, applied)).toBeNull();
    expect(blockedDeployReason('capture-chat-lead', [], missing)).toBeNull();
    expect(blockedDeployReason('capture-chat-lead', required, missing)).toContain(
      '20260101000000_create_lead_rpc.sql',
    );
  });
});
