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
      'node scripts/run-financing-integration.mjs',
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
  });
});
