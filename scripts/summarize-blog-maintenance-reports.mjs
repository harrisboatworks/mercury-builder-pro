#!/usr/bin/env node
/**
 * Consumes the two warn-only date-maintenance reports and renders a PASS/WARN/FAIL
 * table into GITHUB_STEP_SUMMARY (and stdout).
 *
 *   reports/blog-price-hygiene.json      (scripts/check-blog-price-hygiene.mjs)
 *   reports/blog-regulatory-review.json  (scripts/check-publishing-integrity.mjs)
 *
 * Exit codes:
 *   0  everything PASS, or WARN in advisory mode (default, used on pull requests)
 *   1  any FAIL, or any WARN when --strict is passed (scheduled / manual runs)
 *
 * A missing report is always a FAIL: the generating checker did not run.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const strict = process.argv.includes('--strict');

const readJson = (path) => {
  if (!existsSync(path)) return { missing: true };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { unreadable: error instanceof Error ? error.message : String(error) };
  }
};

const rows = [];

const priceReport = readJson('reports/blog-price-hygiene.json');
if (priceReport.missing) {
  rows.push({ report: 'blog-price-hygiene', status: 'FAIL', detail: 'reports/blog-price-hygiene.json was not generated' });
} else if (priceReport.unreadable) {
  rows.push({ report: 'blog-price-hygiene', status: 'FAIL', detail: `unreadable report: ${priceReport.unreadable}` });
} else {
  if (priceReport.ok === false) {
    rows.push({
      report: 'blog-price-hygiene',
      status: 'FAIL',
      detail: `${(priceReport.errors || []).length} content-contract error(s): ${(priceReport.errors || []).slice(0, 3).join('; ') || 'see artifact'}`,
    });
  } else {
    rows.push({ report: 'blog-price-hygiene', status: 'PASS', detail: 'all price content contracts hold' });
  }
  rows.push({
    report: 'blog-price-hygiene review age',
    status: priceReport.stale ? 'WARN' : 'PASS',
    detail: `reviewed ${priceReport.reviewedAt} · ${priceReport.ageDays} of max ${priceReport.maxAgeDays} days`,
  });
  for (const warning of priceReport.warnings || []) {
    if (/review is \d+ days old/.test(String(warning))) continue;
    rows.push({ report: 'blog-price-hygiene warning', status: 'WARN', detail: String(warning) });
  }
}

const regulatoryReport = readJson('reports/blog-regulatory-review.json');
if (regulatoryReport.missing) {
  rows.push({ report: 'blog-regulatory-review', status: 'FAIL', detail: 'reports/blog-regulatory-review.json was not generated' });
} else if (regulatoryReport.unreadable) {
  rows.push({ report: 'blog-regulatory-review', status: 'FAIL', detail: `unreadable report: ${regulatoryReport.unreadable}` });
} else {
  rows.push({
    report: 'blog-regulatory-review',
    status: (regulatoryReport.hardFailureCount || 0) > 0 ? 'FAIL' : 'PASS',
    detail: `${regulatoryReport.hardFailureCount || 0} hard failure(s) · PCL fee reviewed ${regulatoryReport.pclFeeReviewedOn} · latest April review ${regulatoryReport.latestAprilReview}`,
  });
  rows.push({
    report: 'blog-regulatory-review staleness',
    status: regulatoryReport.stale ? 'WARN' : 'PASS',
    detail: regulatoryReport.stale
      ? 'PCL fee review is overdue against the latest April 1 indexation'
      : 'PCL fee review is current',
  });
  for (const warning of regulatoryReport.warnings || []) {
    rows.push({ report: 'blog-regulatory-review warning', status: 'WARN', detail: String(warning) });
  }
}

const icon = { PASS: '✅ PASS', WARN: '⚠️ WARN', FAIL: '❌ FAIL' };
const failCount = rows.filter((row) => row.status === 'FAIL').length;
const warnCount = rows.filter((row) => row.status === 'WARN').length;
const overall = failCount ? 'FAIL' : warnCount ? 'WARN' : 'PASS';

const summary = [
  '## Blog date-maintenance reports',
  '',
  `Overall: **${overall}** · ${failCount} fail · ${warnCount} warn · mode: ${strict ? 'strict (warnings fail the check)' : 'advisory (warnings reported, not fatal)'}`,
  '',
  '| Status | Report | Detail |',
  '| --- | --- | --- |',
  ...rows.map((row) => `| ${icon[row.status]} | ${row.report} | ${row.detail.replaceAll('|', '\\|')} |`),
];

console.log(summary.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.join('\n')}\n\n`, { flag: 'a' });
}

if (failCount || (strict && warnCount)) process.exit(1);
