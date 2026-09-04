import {
  evaluateHbwStoragePolicy,
  HBW_STORAGE_POLICY_URL,
} from './lib/hbw-storage-policy.mjs';
import { readFile } from 'node:fs/promises';

const REPOSITORY_POLICY_SURFACES = [
  'public/maintenance.md',
  'public/.well-known/brand.json',
  'src/data/faqData.ts',
  'src/data/harrisBoatWorksBrandPage.js',
];

const GTM_CONTAINER_ID = process.env.HBW_GTM_CONTAINER_ID || 'GTM-5TTNCRJ';
const GTM_URL = new URL('https://www.googletagmanager.com/gtm.js');
GTM_URL.searchParams.set('id', GTM_CONTAINER_ID);
GTM_URL.searchParams.set('hbw_storage_policy_check', String(Date.now()));

let response;
try {
  response = await fetch(GTM_URL, {
    headers: {
      'User-Agent': 'HBW-storage-policy-check/1.0 (+https://www.mercuryrepower.ca)',
    },
    signal: AbortSignal.timeout(20_000),
  });
} catch (error) {
  console.error(`HBW storage policy check could not fetch ${GTM_URL.origin}: ${error.message}`);
  process.exit(1);
}

const source = await response.text();
const result = evaluateHbwStoragePolicy(source);
const resourceVersion = source.match(/"version":"(\d+)"/)?.[1] ?? null;
const repositoryChecks = await Promise.all(
  REPOSITORY_POLICY_SURFACES.map(async (path) => ({
    path,
    result: evaluateHbwStoragePolicy(await readFile(path, 'utf8')),
  })),
);
const repositoryFailures = repositoryChecks.flatMap(({ path, result: check }) =>
  check.failures.map((failure) => `${path}: ${failure}`),
);

const output = {
  checkedAt: new Date().toISOString(),
  containerId: GTM_CONTAINER_ID,
  resourceVersion,
  sourceUrl: GTM_URL.origin + GTM_URL.pathname,
  canonicalPolicyUrl: HBW_STORAGE_POLICY_URL,
  httpStatus: response.status,
  storageFaqDetected: result.storageFaqDetected,
  repositorySurfaces: REPOSITORY_POLICY_SURFACES,
  ok: response.ok && result.ok && result.storageFaqDetected && repositoryFailures.length === 0,
  failures: [
    ...(response.ok ? [] : [`GTM returned HTTP ${response.status}.`]),
    ...(result.storageFaqDetected
      ? []
      : [`Public GTM is missing the expected "Do you offer boat storage?" FAQ.`]),
    ...result.failures,
    ...repositoryFailures,
  ],
};

console.log(JSON.stringify(output, null, 2));
process.exit(output.ok ? 0 : 1);
