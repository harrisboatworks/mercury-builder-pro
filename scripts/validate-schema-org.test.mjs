import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const validatorScript = fileURLToPath(new URL('./validate-schema-org.mjs', import.meta.url));
const fixtureHtml = `<!doctype html><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Harris Boat Works"}</script>`;

function runGit(fixtureRoot, args) {
  const result = spawnSync('git', args, {
    cwd: fixtureRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

async function createChangedSourceCommit(fixtureRoot, changedFile) {
  runGit(fixtureRoot, ['init', '--quiet']);
  runGit(fixtureRoot, ['config', 'user.name', 'Schema Validator Test']);
  runGit(fixtureRoot, ['config', 'user.email', 'schema-validator@example.test']);
  runGit(fixtureRoot, ['config', 'commit.gpgsign', 'false']);
  await writeFile(join(fixtureRoot, 'baseline.txt'), 'baseline\n');
  runGit(fixtureRoot, ['add', 'baseline.txt']);
  runGit(fixtureRoot, ['commit', '--quiet', '-m', 'baseline']);
  runGit(fixtureRoot, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);

  const changedPath = join(fixtureRoot, changedFile);
  await mkdir(dirname(changedPath), { recursive: true });
  await writeFile(changedPath, 'export const changed = true;\n');
  runGit(fixtureRoot, ['add', changedFile]);
  runGit(fixtureRoot, ['commit', '--quiet', '-m', 'change source']);
}

async function runWithFetchStub(
  stubSource,
  { html = fixtureHtml, env = {}, changedFile = null } = {},
) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'schema-validator-test-'));
  try {
    const distDir = join(fixtureRoot, 'dist');
    const preload = join(fixtureRoot, 'fetch-stub.mjs');
    await mkdir(distDir);
    if (html !== null) {
      await writeFile(join(distDir, 'index.html'), html);
    }
    await writeFile(preload, stubSource);
    if (changedFile) {
      await createChangedSourceCommit(fixtureRoot, changedFile);
    }

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

test('falls back to the full dist set when a changed SEO source has no direct HTML path', async () => {
  const result = await runWithFetchStub(
    `globalThis.fetch = async () => new Response(JSON.stringify({ errors: [] }), { status: 200 });`,
    {
      changedFile: 'src/components/seo/HomepageSEO.tsx',
      env: { LOCAL_DIFF: '1' },
    },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /validating the full dist set/);
  assert.match(result.stdout, /1 JSON-LD block\(s\).*validated by schema\.org/);
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
