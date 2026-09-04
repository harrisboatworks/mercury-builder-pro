import {
  evaluateHbwStoragePolicy,
  HBW_STORAGE_POLICY_URL,
} from './lib/hbw-storage-policy.mjs';
import { readFile } from 'node:fs/promises';

const REPOSITORY_POLICY_SURFACES = {
  'public/maintenance.md': [
    /indoor_storage:\s*false/i,
    /outdoor storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service/i,
    /no indoor or heated boat storage/i,
  ],
  'public/.well-known/brand.json': [
    /Outdoor winter boat storage \(shrink wrap, uncovered, or wrap-only\)/,
    /no indoor or heated storage/i,
  ],
  'src/data/faqData.ts': [
    /offer outdoor storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service/i,
    /do not offer indoor or heated boat storage/i,
  ],
  'src/data/harrisBoatWorksBrandPage.js': [
    /outdoor storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service/i,
    /Outdoor winter storage \(shrink wrap, uncovered, or wrap-only\)/,
  ],
};

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
  Object.entries(REPOSITORY_POLICY_SURFACES).map(async ([path, requiredPatterns]) => {
    const contents = await readFile(path, 'utf8');
    return {
      path,
      result: evaluateHbwStoragePolicy(contents),
      missingRequiredSignals: requiredPatterns
        .filter((pattern) => !pattern.test(contents))
        .map((pattern) => pattern.toString()),
    };
  }),
);
const repositoryFailures = repositoryChecks.flatMap(({ path, result: check, missingRequiredSignals }) => [
  ...check.failures.map((failure) => `${path}: ${failure}`),
  ...missingRequiredSignals.map((signal) => `${path}: missing required policy signal ${signal}`),
]);

const output = {
  checkedAt: new Date().toISOString(),
  containerId: GTM_CONTAINER_ID,
  resourceVersion,
  requestedSourceUrl: GTM_URL.toString(),
  responseUrl: response.url,
  canonicalPolicyUrl: HBW_STORAGE_POLICY_URL,
  httpStatus: response.status,
  storageFaqDetected: result.storageFaqDetected,
  repositorySurfaces: Object.keys(REPOSITORY_POLICY_SURFACES),
  ok: response.ok && resourceVersion !== null && result.ok && result.storageFaqDetected && repositoryFailures.length === 0,
  failures: [
    ...(response.ok ? [] : [`GTM returned HTTP ${response.status}.`]),
    ...(resourceVersion === null ? ['Public GTM source did not expose a resource version.'] : []),
    ...(result.storageFaqDetected
      ? []
      : [`Public GTM is missing the expected "Do you offer boat storage?" FAQ.`]),
    ...result.failures,
    ...repositoryFailures,
  ],
};

console.log(JSON.stringify(output, null, 2));
process.exit(output.ok ? 0 : 1);
