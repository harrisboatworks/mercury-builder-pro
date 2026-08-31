import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('agent validation safety', () => {
  it('keeps routine tests separate from the financing write integration', () => {
    const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));

    expect(packageJson.scripts.test).toBe('npm run test:unit');
    expect(packageJson.scripts['test:unit']).toContain(
      "--exclude '**/financing-submission-permissions.test.ts'",
    );
    expect(packageJson.scripts['test:integration:financing']).toBe(
      'node --env-file-if-exists=.env.local scripts/run-financing-integration.mjs',
    );

    const integrationTest = readFileSync(
      resolve(repoRoot, 'src/lib/__tests__/financing-submission-permissions.test.ts'),
      'utf8',
    );
    const dedicatedRunner = readFileSync(
      resolve(repoRoot, 'scripts/run-financing-integration.mjs'),
      'utf8',
    );
    const marker = 'dedicated-financing-integration-runner';

    expect(integrationTest).toContain(marker);
    expect(dedicatedRunner).toContain(marker);
    expect(dedicatedRunner.indexOf('missingCredentials')).toBeLessThan(
      dedicatedRunner.indexOf('const result = spawnSync('),
    );
    expect(dedicatedRunner).not.toContain('process.env.HBW_FINANCING_TEST_RUNNER =');
  });

  it('fails the dedicated financing runner before Vitest when credentials are missing', () => {
    const runner = resolve(repoRoot, 'scripts/run-financing-integration.mjs');
    const env = { ...process.env };
    delete env.FINANCING_TEST_EMAIL;
    delete env.FINANCING_TEST_PASSWORD;

    const result = spawnSync(process.execPath, [runner], {
      cwd: repoRoot,
      encoding: 'utf8',
      env,
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain(
      'Missing required financing integration credentials: FINANCING_TEST_EMAIL, FINANCING_TEST_PASSWORD',
    );
  });

  it('loads ignored local financing credentials before the runner preflight', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'mercury-financing-env-'));
    temporaryDirectories.push(fixtureRoot);
    writeFileSync(
      join(fixtureRoot, '.env.local'),
      'FINANCING_TEST_EMAIL=fixture@example.invalid\nFINANCING_TEST_PASSWORD=fixture-only\n',
    );
    const env = { ...process.env };
    delete env.FINANCING_TEST_EMAIL;
    delete env.FINANCING_TEST_PASSWORD;

    const result = spawnSync(
      process.execPath,
      [
        '--env-file-if-exists=.env.local',
        '-e',
        'process.stdout.write(`${process.env.FINANCING_TEST_EMAIL}|${process.env.FINANCING_TEST_PASSWORD}`)',
      ],
      { cwd: fixtureRoot, encoding: 'utf8', env },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('fixture@example.invalid|fixture-only');
  });

  it('fails the API syntax gate when any JavaScript entry is invalid', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'mercury-agent-validation-'));
    temporaryDirectories.push(fixtureRoot);
    mkdirSync(join(fixtureRoot, 'api'));
    writeFileSync(join(fixtureRoot, 'api', 'invalid.js'), 'export const broken = ;\n');

    const result = spawnSync(
      process.execPath,
      [resolve(repoRoot, 'scripts/check-api-files.mjs')],
      { cwd: fixtureRoot, encoding: 'utf8' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Syntax check failed for api/invalid.js');
  });

  it('strictly includes every TypeScript API entry', () => {
    const apiConfig = JSON.parse(readFileSync(resolve(repoRoot, 'tsconfig.api.json'), 'utf8'));

    expect(apiConfig.compilerOptions.strict).toBe(true);
    expect(apiConfig.compilerOptions.noEmit).toBe(true);
    expect(apiConfig.include).toEqual(['api/**/*.ts']);
  });

  it('rejects empty and out-of-tree Edge checker targets before invoking Deno', () => {
    const checker = resolve(repoRoot, 'scripts/check-edge-functions.mjs');
    const empty = spawnSync(process.execPath, [checker], { cwd: repoRoot, encoding: 'utf8' });
    const outside = spawnSync(process.execPath, [checker, 'api/test-endpoint.ts'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(empty.status).toBe(2);
    expect(empty.stderr).toContain('Pass every changed Edge entry point');
    expect(outside.status).toBe(2);
    expect(outside.stderr).toContain('Invalid Edge TypeScript path');

    const checkerSource = readFileSync(checker, 'utf8');
    expect(checkerSource).toContain("'--node-modules-dir=none'");
    expect(checkerSource).toContain("'--lock=supabase/functions/deno.lock'");
    expect(checkerSource).toContain("'--frozen'");
    expect(checkerSource).not.toContain("'--no-lock'");
    expect(checkerSource.indexOf("'--config'")).toBeLessThan(
      checkerSource.indexOf("'--node-modules-dir=none'"),
    );

    const edgeLock = JSON.parse(
      readFileSync(resolve(repoRoot, 'supabase/functions/deno.lock'), 'utf8'),
    );
    expect(edgeLock.version).toBe('5');
    expect(edgeLock.specifiers['npm:@supabase/supabase-js@2.53.1']).toBe('2.53.1');

    for (const dependency of edgeLock.workspace.dependencies) {
      const packageAndVersion = dependency.slice('npm:'.length);
      const separator = packageAndVersion.lastIndexOf('@');
      const packageName = packageAndVersion.slice(0, separator);
      const resolvedVersion = edgeLock.specifiers[dependency];

      expect(resolvedVersion).toBeTruthy();
      expect(edgeLock.npm[`${packageName}@${resolvedVersion}`]).toBeTruthy();
    }
  });

  it('fails the Edge checker preflight when configured or direct npm imports are not locked', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'mercury-edge-lock-'));
    temporaryDirectories.push(fixtureRoot);
    const functionsDirectory = join(fixtureRoot, 'supabase', 'functions');
    mkdirSync(functionsDirectory, { recursive: true });
    writeFileSync(
      join(functionsDirectory, 'deno.json'),
      JSON.stringify({ imports: { resend: 'npm:resend@2.0.0' } }),
    );
    writeFileSync(
      join(functionsDirectory, 'deno.lock'),
      JSON.stringify({ version: '5', specifiers: {}, npm: {} }),
    );

    const checker = resolve(repoRoot, 'scripts/check-edge-functions.mjs');
    const incomplete = spawnSync(process.execPath, [checker, '--check-lock-only'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    });

    expect(incomplete.status).toBe(2);
    expect(incomplete.stderr).toContain(
      'Edge lockfile is incomplete for configured or direct import: npm:resend@2.0.0',
    );

    writeFileSync(
      join(functionsDirectory, 'deno.lock'),
      JSON.stringify({
        version: '5',
        specifiers: { 'npm:resend@2.0.0': '2.0.0' },
        npm: { 'resend@2.0.0': { integrity: 'fixture-only' } },
      }),
    );
    writeFileSync(
      join(functionsDirectory, 'index.ts'),
      'import md5 from "npm:blueimp-md5";\nvoid md5;\n',
    );
    const missingDirectImport = spawnSync(
      process.execPath,
      [checker, '--check-lock-only'],
      { cwd: fixtureRoot, encoding: 'utf8' },
    );

    expect(missingDirectImport.status).toBe(2);
    expect(missingDirectImport.stderr).toContain(
      'Edge lockfile is incomplete for configured or direct import: npm:blueimp-md5',
    );

    writeFileSync(
      join(functionsDirectory, 'deno.lock'),
      JSON.stringify({
        version: '5',
        specifiers: {
          'npm:blueimp-md5@*': '2.19.0',
          'npm:resend@2.0.0': '2.0.0',
        },
        npm: {
          'blueimp-md5@2.19.0': { integrity: 'fixture-only' },
          'resend@2.0.0': { integrity: 'fixture-only' },
        },
      }),
    );
    const complete = spawnSync(process.execPath, [checker, '--check-lock-only'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    });

    expect(complete.status).toBe(0);
  });
});
