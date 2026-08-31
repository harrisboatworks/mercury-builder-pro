import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const validatorScript = fileURLToPath(new URL('./validate-schema-org.mjs', import.meta.url));
const fixtureHtml = `<!doctype html><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Harris Boat Works"}</script>`;

async function runWithFetchStub(stubSource, { html = fixtureHtml, env = {} } = {}) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'schema-validator-test-'));
  try {
    const distDir = join(fixtureRoot, 'dist');
    const preload = join(fixtureRoot, 'fetch-stub.mjs');
    await mkdir(distDir);
    if (html !== null) {
      await writeFile(join(distDir, 'index.html'), html);
    }
    await writeFile(preload, stubSource);

    return spawnSync(process.execPath, ['--import', preload, validatorScript], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SKIP_SCHEMA_ORG_VALIDATOR: '',
        SCHEMA_VALIDATOR_MAX_FILES: '1',
        ...env,
      },
    });
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

test('fails closed when dist contains no HTML input', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => { throw new Error('fetch should not be called'); };`,
    { html: null },
  );

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /No HTML files were available/);
  assert.doesNotMatch(result.stdout, /validated by schema\.org/);
});

test('fails closed when the remote validator cannot be reached', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => { throw new Error('forced validator outage'); };`,
  );

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /validation was incomplete/);
  assert.doesNotMatch(result.stdout, /validated by schema\.org/);
});

test('fails closed when HTML contains no JSON-LD blocks', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => { throw new Error('fetch should not be called'); };`,
    { html: '<!doctype html><title>No structured data</title>' },
  );

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /No JSON-LD blocks were available/);
  assert.doesNotMatch(result.stdout, /validated by schema\.org/);
});

test('fails closed on a non-success HTTP response even when its body is JSON', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => new Response(JSON.stringify({ errors: [] }), { status: 503 });`,
  );

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /validator returned HTTP 503/);
  assert.doesNotMatch(result.stdout, /validated by schema\.org/);
});

test('fails closed when JSON omits the validator errors contract', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => new Response(JSON.stringify({ isRendered: false }), { status: 200 });`,
  );

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /did not include an errors array/);
  assert.doesNotMatch(result.stdout, /validated by schema\.org/);
});

test('reports success only after a JSON-LD block is remotely verified', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => new Response(JSON.stringify({ errors: [] }), { status: 200 });`,
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 JSON-LD block\(s\).*validated by schema\.org/);
});

test('retains the explicit outage bypass', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => { throw new Error('fetch should not be called'); };`,
    { html: null, env: { SKIP_SCHEMA_ORG_VALIDATOR: '1' } },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /SKIP_SCHEMA_ORG_VALIDATOR=1.*skipping/i);
});
