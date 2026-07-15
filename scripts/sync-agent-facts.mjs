#!/usr/bin/env node
/**
 * Synchronize machine-facing business facts from their canonical sources:
 * - Google Business Profile cache: coordinates and public opening hours
 * - finance-policy.json: active headline offer and post-promo standard tiers
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
const places = readJson('src/data/google-places-cache.json');
const finance = readJson('src/data/finance-policy.json');
const latitude = Number(places?.location?.latitude);
const longitude = Number(places?.location?.longitude);
if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
  throw new Error('[sync-agent-facts] Google Places cache is missing a valid location.');
}

const today = new Date().toISOString().slice(0, 10);
const promoEnd = new Date(finance.mercuryPromo.endsAt);
if (Number.isNaN(promoEnd.getTime())) throw new Error('[sync-agent-facts] Invalid promo end date.');
const promoActive = Date.now() <= promoEnd.getTime();
const promoEndLabel = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Toronto',
}).format(promoEnd);
const money = (value) => `$${Number(value).toLocaleString('en-CA')}`;
const standardTiers = `${finance.standardApr.under10000}% APR under $10,000 and ${finance.standardApr.atLeast10000}% APR at $10,000 and above`;
const currentFinancing = promoActive
  ? `${finance.mercuryPromo.apr}% APR (OAC) through ${promoEndLabel}`
  : standardTiers;

function writeJson(relativePath, value) {
  writeFileSync(join(ROOT, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function replaceRequired(text, pattern, replacement, label) {
  if (!pattern.test(text)) throw new Error(`[sync-agent-facts] Could not find ${label}.`);
  return text.replace(pattern, replacement);
}

const brand = readJson('public/.well-known/brand.json');
brand.standards = [
  'Model Context Protocol (MCP) - implemented',
  'Universal Commerce Protocol (UCP) 2026-04-08 - implemented for quote-mode checkout and pickup fulfillment',
];
brand.geography.headquarters.lat = latitude;
brand.geography.headquarters.lng = longitude;
brand.contact.hours.note = 'In-season (April 1 - November 30). Marina closed for winter December 1 - April 1.';
const monday = places.openingHoursSpecification?.find((item) => item.dayOfWeek === 'Monday');
const sunday = places.openingHoursSpecification?.find((item) => item.dayOfWeek === 'Sunday');
if (monday) brand.contact.hours.monSat = `${monday.opens}-${monday.closes}`;
if (sunday) brand.contact.hours.sun = `${sunday.opens}-${sunday.closes}`;
brand.lastUpdated = today;
writeJson('public/.well-known/brand.json', brand);

const mcp = readJson('public/.well-known/mcp.json');
mcp.geography.originLat = latitude;
mcp.geography.originLng = longitude;
mcp.lastUpdated = today;
writeJson('public/.well-known/mcp.json', mcp);

const llmsPath = join(ROOT, 'public/llms.txt');
let llms = readFileSync(llmsPath, 'utf8');
const financingSummary = promoActive
  ? `All motors are sold with full factory warranty. Current headline financing is ${currentFinancing}. Standard tiered rates (${standardTiers}) resume after the promotion ends.`
  : `All motors are sold with full factory warranty. Current financing uses the standard tiers: ${standardTiers} (OAC).`;
llms = replaceRequired(llms, /^All motors are sold with full factory warranty\..*$/m, financingSummary, 'llms.txt financing summary');
llms = replaceRequired(
  llms,
  /^Yes\. Financing is arranged through DealerPlan.*$/m,
  promoActive
    ? `Yes. Financing is arranged through DealerPlan across Canadian lenders, primarily TD Auto Finance. The current headline is ${currentFinancing}; ${standardTiers} resume after the promotion ends. Terms up to 120 months.`
    : `Yes. Financing is arranged through DealerPlan across Canadian lenders, primarily TD Auto Finance, at ${standardTiers} (OAC). Terms up to 120 months.`,
  'llms.txt financing answer',
);
llms = replaceRequired(
  llms,
  /^- Financing minimum:.*$/m,
  `- Financing minimum: ${money(finance.minimumCad)} CAD. Current headline: ${currentFinancing}. ${promoActive ? `Standard tiers (${standardTiers}) resume after the promotion ends.` : ''}`.trim(),
  'llms.txt financing rule',
);
llms = replaceRequired(
  llms,
  /^- \[Finance Calculator\].*$/m,
  `- [Finance Calculator](https://www.mercuryrepower.ca/finance-calculator): Estimate monthly payments using the current ${currentFinancing} headline; standard tiers resume after the promotion ends.`,
  'llms.txt finance calculator description',
);
llms = replaceRequired(
  llms,
  /^- Hours \(in-season,[^\n]*$/m,
  `- Hours (in-season, April 1-November 30): Monday-Saturday ${monday?.opens || '08:00'}-${monday?.closes || '17:00'}, Sunday ${sunday?.opens || '09:00'}-${sunday?.closes || '16:00'}. Closed for winter December 1-April 1.`,
  'llms.txt hours',
);
writeFileSync(llmsPath, llms, 'utf8');

const aiPath = join(ROOT, 'public/.well-known/ai.txt');
let ai = readFileSync(aiPath, 'utf8');
ai = replaceRequired(
  ai,
  /^- In-season hours \([^\n]*$/m,
  '- In-season hours (April 1-November 30): Monday-Saturday 8am-5pm, Sunday 9am-4pm. Marina closed for winter December 1-April 1.',
  'ai.txt hours',
);
writeFileSync(aiPath, ai, 'utf8');

console.log(`[sync-agent-facts] synced geo=${latitude},${longitude} financing=${currentFinancing} updated=${today}`);
