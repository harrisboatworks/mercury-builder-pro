#!/usr/bin/env node
// scripts/post-deploy-rich-results.mjs
//
// Post-deploy probe: ask Google's Search Console URL Inspection API to
// re-fetch a curated list of canonical URLs and report each one's rich-result
// verdict. Non-blocking. Intended to run after Vercel finishes a production
// deploy (see .github/workflows/post-deploy-rich-results.yml).
//
// Required env:
//   LOVABLE_API_KEY              — connector gateway auth
//   GOOGLE_SEARCH_CONSOLE_API_KEY — OAuth-backed connection key
//
// Optional env:
//   RICH_RESULTS_SITE  — Search Console property (default sc-domain:mercuryrepower.ca)
//   RICH_RESULTS_OUT   — output JSON path (default /tmp/rich-results-report.json)

import { writeFileSync } from 'node:fs';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';
const SITE = process.env.RICH_RESULTS_SITE || 'sc-domain:mercuryrepower.ca';
const OUT = process.env.RICH_RESULTS_OUT || '/tmp/rich-results-report.json';

const URLS = [
  'https://www.mercuryrepower.ca/',
  'https://www.mercuryrepower.ca/mercury-outboards-ontario',
  'https://www.mercuryrepower.ca/mercury/pro-xs-250',
  'https://www.mercuryrepower.ca/mercury/pro-xs',
  'https://www.mercuryrepower.ca/quote/motor-selection',
  'https://www.mercuryrepower.ca/quote/summary',
  'https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9eh-fourstroke',
  'https://www.mercuryrepower.ca/motors/proxs-250hp-250-elpt-proxs',
  'https://www.mercuryrepower.ca/motors/proxs-150hp-150-elpt-proxs',
  'https://www.mercuryrepower.ca/motors/fourstroke-115hp-115elpt-fourstroke',
];

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const GSC_API_KEY = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;

if (!LOVABLE_API_KEY || !GSC_API_KEY) {
  console.warn('[post-deploy-rich-results] LOVABLE_API_KEY or GOOGLE_SEARCH_CONSOLE_API_KEY missing — skipping.');
  process.exit(0);
}

async function inspect(url) {
  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GSC_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ siteUrl: SITE, inspectionUrl: url, languageCode: 'en-CA' }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const report = { site: SITE, ranAt: new Date().toISOString(), results: [] };

for (const url of URLS) {
  try {
    const { status, data } = await inspect(url);
    const r = data?.inspectionResult || {};
    const verdict = {
      url,
      httpStatus: status,
      indexStatus: r.indexStatusResult?.verdict || null,
      richResultsVerdict: r.richResultsResult?.verdict || null,
      richResultsItems: (r.richResultsResult?.detectedItems || []).map((i) => i.richResultType),
      mobileUsabilityVerdict: r.mobileUsabilityResult?.verdict || null,
    };
    report.results.push(verdict);
    console.log(
      `[rich-results] ${verdict.richResultsVerdict || 'NO_DATA'}  ${verdict.indexStatus || ''}  ${url}` +
        (verdict.richResultsItems.length ? `  → ${verdict.richResultsItems.join(', ')}` : '')
    );
  } catch (err) {
    report.results.push({ url, error: err.message });
    console.warn(`[rich-results] error ${url}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 800)); // gentle pacing
}

writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`[post-deploy-rich-results] report → ${OUT}`);

const fails = report.results.filter((r) => r.richResultsVerdict && !['PASS', 'PARTIAL'].includes(r.richResultsVerdict));
if (fails.length) {
  console.warn(`[post-deploy-rich-results] ${fails.length} URL(s) without PASS verdict. Non-blocking.`);
}
