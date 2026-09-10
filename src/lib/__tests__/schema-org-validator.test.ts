// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyResponse, runValidator, selectFiles, validateBlock } from '../../../scripts/validate-schema-org.mjs';

const dirs: string[] = [];
const logger = () => ({ log: vi.fn(), warn: vi.fn(), error: vi.fn() });
function output() {
  const dir = mkdtempSync(join(tmpdir(), 'schema-validator-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'index.html'), '<script type="application/ld+json">{"@type":"Organization"}</script>');
  return dir;
}
const reply = (value: unknown) => vi.fn(async () => new Response(JSON.stringify(value)));
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe('schema.org remote status contract', () => {
  it('blocks explicit error severity even alongside an unknown issue', async () => {
    const result = await runValidator({ dist: output(), env: {}, logger: logger(), throttleMs: 0,
      fetchImpl: reply({ errors: [{ severity: 'ERROR', description: 'bad property' }, { description: 'unknown' }] }) });
    expect(result.exitCode).toBe(1);
    expect(result.status).toBe('ERROR');
    expect(result.errors).toHaveLength(1);
    expect(result.unverified).toHaveLength(1);
  });
  it.each([{}, [], null, { errors: null }, { errors: [{ severity: 'unrecognized' }] }])(
    'does not interpret unknown response %j as an empty error list', (value) => {
      expect(classifyResponse(value).unverified.length).toBeGreaterThan(0);
    });
  it('retains warning/info without claiming they are errors', () => {
    expect(classifyResponse({ errors: [{ severity: 'warning' }, { severity: 'info' }] })).toMatchObject({ errors: [], unverified: [] });
  });
  it('supports the existing anti-XSSI prefix and reports only no reported errors', async () => {
    const log = logger();
    const result = await runValidator({ dist: output(), env: {}, logger: log, throttleMs: 0,
      fetchImpl: vi.fn(async () => new Response(")]}'\n" + JSON.stringify({ errors: [] }))) });
    expect(result.status).toBe('NO_REPORTED_ERRORS');
    expect(result.exitCode).toBe(0);
    expect(log.log.mock.calls.flat().join(' ')).not.toContain('validated by schema.org');
  });
  it.each([400, 429, 500])('marks HTTP %s unverified even with an errors-array body', async (status) => {
    const result = await validateBlock('{}', { fetchImpl: vi.fn(async () => new Response('{"errors":[]}', { status })) });
    expect(result.unverified).toEqual([`validator HTTP ${status}`]);
  });
  it('marks non-JSON and network failures unverified without including response bodies', async () => {
    const nonJson = await validateBlock('{}', { fetchImpl: vi.fn(async () => new Response('private upstream detail')) });
    const network = await validateBlock('{}', { fetchImpl: vi.fn(async () => { throw new Error('private request detail'); }) });
    expect(nonJson.unverified).toEqual(['validator returned non-JSON response']);
    expect(network.unverified).toEqual(['validator network failure']);
  });
  it('aborts a hanging remote request within a finite timeout', async () => {
    const result = await validateBlock('{}', { timeoutMs: 5, fetchImpl: vi.fn((_url, options) =>
      new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted'))))) });
    expect(result.unverified).toEqual(['validator timeout']);
  });
  it('keeps an external outage nonblocking but explicitly UNVERIFIED in summary and counters', async () => {
    const log = logger();
    const result = await runValidator({ dist: output(), env: {}, logger: log, throttleMs: 0, fetchImpl: reply({ unexpected: true }) });
    expect(result.exitCode).toBe(0);
    expect(result.status).toBe('UNVERIFIED');
    expect(result.unverified).toHaveLength(1);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('UNVERIFIED'));
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('1 unverified result(s)'));
  });
});

describe('schema.org local coverage and bypass', () => {
  it('blocks absent HTML instead of silently skipping', async () => {
    const dist = output();
    rmSync(join(dist, 'index.html'));
    const fetchImpl = reply({ errors: [] });
    expect(await runValidator({ dist, env: {}, logger: logger(), fetchImpl })).toMatchObject({ status: 'LOCAL_COVERAGE_FAILURE', exitCode: 1 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('blocks an invalid zero sampling cap', async () => {
    expect(await runValidator({ dist: output(), env: { SCHEMA_VALIDATOR_MAX_FILES: '0' }, logger: logger() })).toMatchObject({ exitCode: 1 });
  });
  it('falls back to all output if any relevant changed source cannot be mapped', () => {
    const files = ['dist/index.html', 'dist/blog/index.html'];
    expect(selectFiles(files, ['src/lib/seo.ts'])).toEqual(files);
    expect(selectFiles(files, ['index.html', 'scripts/static-prerender.mjs'])).toEqual(files);
    expect(selectFiles(files, ['blog/index.html'])).toEqual(['dist/blog/index.html']);
    expect(selectFiles(files, ['README.md'])).toEqual(files);
  });
  it('LOCAL_DIFF with unmapped schema source still checks HTML', async () => {
    const fetchImpl = reply({ errors: [] });
    const result = await runValidator({ dist: output(), env: { LOCAL_DIFF: '1' }, readChanged: () => ['src/lib/seo.ts'], logger: logger(), throttleMs: 0, fetchImpl });
    expect(result.blocksChecked).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('does not narrow coverage on CI', async () => {
    const readChanged = vi.fn(() => ['index.html']);
    await runValidator({ dist: output(), env: { LOCAL_DIFF: '1', CI: 'true' }, readChanged, logger: logger(), throttleMs: 0, fetchImpl: reply({ errors: [] }) });
    expect(readChanged).not.toHaveBeenCalled();
  });
  it('keeps the existing explicit bypass visibly skipped without making a request', async () => {
    const fetchImpl = reply({ errors: [] });
    expect(await runValidator({ env: { SKIP_SCHEMA_ORG_VALIDATOR: '1' }, logger: logger(), fetchImpl })).toMatchObject({ exitCode: 0, status: 'SKIPPED' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('does not claim success when HTML has no JSON-LD', async () => {
    const dist = output();
    writeFileSync(join(dist, 'index.html'), '<html></html>');
    expect(await runValidator({ dist, env: {}, logger: logger() })).toMatchObject({ status: 'UNVERIFIED', blocksChecked: 0 });
  });
});
