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
      const normalizedSql = sql
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/--.*$/gm, ' ')
        .replace(/\s+/g, ' ');

      expect(normalizedSql).not.toMatch(
        /CREATE\s+POLICY\s+"?(?:Anon can create anonymous applications|Users can create own applications|Users can update own draft applications)"?/i,
      );
      expect(normalizedSql).not.toMatch(
        /CREATE\s+POLICY\b[^;]*\bON\s+public\.financing_applications\b[^;]*\bFOR\s+(?:ALL|INSERT|UPDATE)\b[^;]*\bTO\s+anon\b/i,
      );
      expect(normalizedSql).not.toMatch(
        /CREATE\s+POLICY\b[^;]*\bON\s+public\.financing_applications\b[^;]*\bFOR\s+(?:ALL|INSERT|UPDATE)\b[^;]*\bTO\s+authenticated\b/i,
      );
      expect(normalizedSql).not.toMatch(
        /GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|INSERT|UPDATE)[^;]*\bON\s+(?:TABLE\s+)?public\.financing_applications\b[^;]*\bTO\s+anon\b/i,
      );
      expect(normalizedSql).not.toMatch(
        /ALTER\s+TABLE\s+(?:ONLY\s+)?public\.financing_applications\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i,
      );
    }
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
