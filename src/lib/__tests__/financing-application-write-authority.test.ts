import { readFileSync, readdirSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migrationPath = 'supabase/migrations/20260830204500_restrict_financing_application_writes.sql';

const sourceFiles = (directory: string): string[] =>
  readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });

const normalizeSql = (sql: string): string =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .replace(/\s+/g, ' ');

const findUnsafePublicWritePolicy = (sql: string): string | undefined =>
  normalizeSql(sql)
    .split(';')
    .map((statement) => statement.trim())
    .find((statement) => {
      const policyAction = statement.match(/\b(CREATE|ALTER)\s+POLICY\b/i)?.[1]
        ?.toUpperCase();
      const tableMatch = statement.match(/\bON\s+public\.financing_applications\b/i);
      if (
        !policyAction ||
        !tableMatch ||
        tableMatch.index === undefined
      ) {
        return false;
      }
      const policyTail = statement.slice(tableMatch.index + tableMatch[0].length);

      const roleMatch = policyTail.match(
        /\bTO\s+(.+?)(?=\bUSING\b|\bWITH\s+CHECK\b|$)/i,
      );
      const roles = (roleMatch?.[1] ?? 'PUBLIC')
        .replace(/["']/g, '')
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((role) => role.toLowerCase());
      const hasPublicClientRole = roles.some(
        (role) => ['public', 'anon', 'authenticated'].includes(role),
      );

      // ALTER POLICY cannot change its command. Without an explicit role, its
      // pre-existing role is also unknown here, so require a deliberate review.
      if (policyAction === 'ALTER') {
        return !roleMatch || hasPublicClientRole;
      }

      // PostgreSQL defaults an omitted CREATE command to ALL and role to PUBLIC.
      const command = policyTail.match(/\bFOR\s+(ALL|SELECT|INSERT|UPDATE|DELETE)\b/i)?.[1]
        ?.toUpperCase() ?? 'ALL';
      if (!['ALL', 'INSERT', 'UPDATE', 'DELETE'].includes(command)) return false;

      return hasPublicClientRole;
    });

describe('financing application write authority', () => {
  it('removes public and customer-side table writes without weakening admin or customer reads', () => {
    const migration = source(migrationPath);

    expect(migration).toContain('DROP POLICY IF EXISTS "Anon can create anonymous applications"');
    expect(migration).toContain('DROP POLICY IF EXISTS "Users can create own applications"');
    expect(migration).toContain('DROP POLICY IF EXISTS "Users can update own draft applications"');
    expect(migration).toContain(
      'REVOKE ALL PRIVILEGES ON TABLE public.financing_applications FROM anon',
    );
    expect(migration).not.toContain('Admins have full access to applications');
    expect(migration).not.toContain('Users can view own applications');
    expect(migration).not.toContain('FROM authenticated');
    expect(migration).not.toContain('REVOKE EXECUTE ON FUNCTION public.encrypt_sin');
  });

  it('does not let a later migration silently restore the removed write policies', () => {
    const migrationName = basename(migrationPath);
    const migrationAndLater = readdirSync(resolve(process.cwd(), 'supabase/migrations'))
      .filter((name) => name >= migrationName && name.endsWith('.sql'))
      .map((name) => ({ name, sql: source(`supabase/migrations/${name}`) }));

    for (const { sql } of migrationAndLater) {
      const normalizedSql = normalizeSql(sql);

      expect(normalizedSql).not.toMatch(
        /CREATE\s+POLICY\s+"?(?:Anon can create anonymous applications|Users can create own applications|Users can update own draft applications)"?/i,
      );
      expect(findUnsafePublicWritePolicy(normalizedSql)).toBeUndefined();
      expect(normalizedSql).not.toMatch(
        /GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|INSERT|UPDATE)[^;]*\bON\s+(?:TABLE\s+)?public\.financing_applications\b[^;]*\bTO\s+anon\b/i,
      );
      expect(normalizedSql).not.toMatch(
        /ALTER\s+TABLE\s+(?:ONLY\s+)?public\.financing_applications\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i,
      );
    }
  });

  it('interprets omitted policy command and role clauses using PostgreSQL defaults', () => {
    expect(findUnsafePublicWritePolicy(`
      CREATE POLICY "open writes" ON public.financing_applications
      USING (true) WITH CHECK (true);
    `)).toBeDefined();
    expect(findUnsafePublicWritePolicy(`
      CREATE POLICY "anonymous inserts" ON public.financing_applications
      FOR INSERT WITH CHECK (true);
    `)).toBeDefined();
    expect(findUnsafePublicWritePolicy(`
      CREATE POLICY "customer updates" ON public.financing_applications
      FOR UPDATE TO PUBLIC USING (true);
    `)).toBeDefined();
    expect(findUnsafePublicWritePolicy(`
      CREATE POLICY "customer deletes" ON public.financing_applications
      FOR DELETE TO authenticated USING (true);
    `)).toBeDefined();
    expect(findUnsafePublicWritePolicy(`
      ALTER POLICY "Admins have full access to applications"
      ON public.financing_applications TO authenticated
      USING (true) WITH CHECK (true);
    `)).toBeDefined();
    expect(findUnsafePublicWritePolicy(`
      ALTER POLICY "Admins have full access to applications"
      ON public.financing_applications USING (true) WITH CHECK (true);
    `)).toBeDefined();
    expect(findUnsafePublicWritePolicy(`
      CREATE POLICY "public reads" ON public.financing_applications
      FOR SELECT USING (true);
    `)).toBeUndefined();
    expect(findUnsafePublicWritePolicy(`
      CREATE POLICY "service writes" ON public.financing_applications
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    `)).toBeUndefined();
    expect(findUnsafePublicWritePolicy(`
      ALTER POLICY "service writes" ON public.financing_applications
      TO service_role USING (true) WITH CHECK (true);
    `)).toBeUndefined();
  });

  it('keeps customer mutations behind the service-role API invariants', () => {
    const api = source('supabase/functions/financing-application-api/index.ts');
    const client = source('src/lib/financingApplicationApi.ts');
    const review = source('src/components/financing/ReviewSubmitStep.tsx');
    const resume = source('src/pages/FinancingResume.tsx');
    const context = source('src/contexts/FinancingContext.tsx');

    expect(api).toContain("const admin = createClient(supabaseUrl, serviceKey");
    expect(api).toContain(".eq('id', applicationId)");
    expect(api).toContain(".eq('resume_token', resumeToken)");
    expect(api.match(/\.eq\('status', 'draft'\)/g)).toHaveLength(2);
    expect(api).toContain("status: 'draft'");
    expect(api).toContain("status: 'pending'");
    expect(client).toContain("supabase.functions.invoke('financing-application-api'");

    for (const publicClient of [client, review, resume, context]) {
      expect(publicClient).not.toContain("from('financing_applications')");
      expect(publicClient).not.toContain('from("financing_applications")');
    }
  });

  it('keeps all browser-side direct table access inside the reviewed admin surface', () => {
    const directClientFiles = sourceFiles('src')
      .filter((path) => /\.[cm]?[jt]sx?$/.test(path))
      .filter((path) => !path.includes('/__tests__/') && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path))
      .filter((path) => {
        const file = source(path);
        return (
          file.includes(".from('financing_applications')") ||
          file.includes('.from("financing_applications")')
        );
      })
      .map((path) => relative(process.cwd(), resolve(process.cwd(), path)));

    const unexpectedFiles = directClientFiles.filter(
      (path) =>
        !path.startsWith('src/components/admin/') &&
        path !== 'src/pages/AdminFinancingApplications.tsx' &&
        path !== 'src/pages/TestFinancingEmails.tsx',
    );

    expect(unexpectedFiles).toEqual([]);
  });

  it('keeps direct financing table tools behind the admin route boundary', () => {
    const app = source('src/App.tsx');

    expect(app).toMatch(
      /path="\/admin\/financing-applications"[\s\S]*?<SecureRoute requireAdmin=\{true\}>[\s\S]*?<AdminFinancingApplications \/>/,
    );
    expect(app).toMatch(
      /path="\/test-financing-emails" element=\{<SecureRoute requireAdmin=\{true\}>/,
    );
  });
});
