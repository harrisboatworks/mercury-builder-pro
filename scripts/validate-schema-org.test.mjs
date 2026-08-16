import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const validatorScript = fileURLToPath(new URL('./validate-schema-org.mjs', import.meta.url));
const fixtureHtml = `<!doctype html><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Harris Boat Works"}</script>`;

async function runWithFetchStub(stubSource) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'schema-validator-test-'));
  try {
    const distDir = join(fixtureRoot, 'dist');
    const preload = join(fixtureRoot, 'fetch-stub.mjs');
    await mkdir(distDir);
    await writeFile(join(distDir, 'index.html'), fixtureHtml);
    await writeFile(preload, stubSource);

    return spawnSync(process.execPath, ['--import', preload, validatorScript], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SCHEMA_VALIDATOR_MAX_FILES: '1',
      },
    });
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

test('fails closed when the remote validator cannot be reached', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => { throw new Error('forced validator outage'); };`,
  );

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /validation was incomplete/);
  assert.doesNotMatch(result.stdout, /validated by schema\.org/);
});

test('reports success only after a JSON-LD block is remotely verified', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => new Response(JSON.stringify({ errors: [] }), { status: 200 });`,
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 JSON-LD block\(s\).*validated by schema\.org/);
});
