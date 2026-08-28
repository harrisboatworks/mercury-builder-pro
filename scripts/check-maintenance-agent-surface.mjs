import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function requireText(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`[maintenance-surface] ${label} is missing: ${expected}`);
  }
}

function forbidText(text, forbidden, label) {
  if (text.includes(forbidden)) {
    throw new Error(`[maintenance-surface] ${label} still contains unsupported guidance: ${forbidden}`);
  }
}

const hub = read('src/pages/MaintenanceHub.tsx');
const prerender = read('scripts/static-prerender.mjs');
const maintenance = read('public/maintenance.md');
const catalog = read('public/catalog.md');
const llms = read('public/llms.txt');
const catalogGenerator = read('scripts/generate-markdown-twins.mjs');
const motorMarkdownGenerator = read('scripts/generate-motor-markdown.mjs');
const motorPage = read('src/pages/MotorPage.tsx');
const locationPage = read('src/pages/LocationDetail.tsx');
const vercel = JSON.parse(read('vercel.json'));

for (const [label, text] of [
  ['hydrated maintenance hub', hub],
  ['static maintenance hub', prerender],
]) {
  forbidText(text, '1,500 to 2,000+ engine hours', label);
  forbidText(text, 'full-synthetic Mercury 25W-50', label);
  forbidText(text, 'battery (40%)', label);
  forbidText(text, 'fog engine, drain gearcase', label);
  requireText(text, 'exact engine model and serial number', label);
  requireText(text, 'no responsible universal hour or year estimate', label);
  requireText(text, 'model-specific storage procedure', label);
  requireText(text, 'drop the boat off anytime, including after hours', label);
  forbidText(text, 'Service slots fill', label);
  forbidText(text, 'Book early', label);
}

for (const required of [
  'content_type: service_index',
  'boat_pickup_available: generally',
  'delivery_offered: false',
  'mobile_service: false',
  'Engine repairs are limited to Mercury and MerCruiser',
  'Outdoor storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service',
  'We can generally arrange boat pickup. Ask us about availability for your boat and location.',
  'effective September 2026',
  'reopens in early April',
  'https://hbw.wiki/service',
  'https://www.harrisboatworks.ca/winter-storage',
  'Mercury Canada service and support',
]) {
  requireText(maintenance, required, 'public/maintenance.md');
}

forbidText(maintenance, '2025 rate card while the 2026 revision is being reviewed', 'public/maintenance.md');
forbidText(maintenance, 'Outdoor storage with shrinkwrap only', 'public/maintenance.md');
forbidText(maintenance, 'does not pick up, transport, ship, or deliver boats or motors', 'public/maintenance.md');

requireText(llms, 'https://www.mercuryrepower.ca/maintenance.md', 'public/llms.txt');
requireText(llms, 'Current September 2026 winter storage and winterization rates', 'public/llms.txt');
requireText(llms, 'We can generally arrange boat pickup. Ask us about availability for your boat and location.', 'public/llms.txt');
requireText(llms, 'outdoor uncovered storage, and shrink-wrap-only service', 'public/llms.txt');
forbidText(llms, 'Outdoor shrinkwrap only', 'public/llms.txt');
forbidText(llms, 'batteries stay in the boat, disconnected', 'public/llms.txt');
forbidText(llms, 'fuel stabilization, fogging, gearcase service, cooling drain', 'public/llms.txt');
requireText(llms, 'model-specific fuel, cooling, internal-corrosion, and gearcase preparation', 'public/llms.txt');
requireText(catalog, '## Service and maintenance', 'public/catalog.md');
requireText(catalog, 'https://www.mercuryrepower.ca/maintenance.md', 'public/catalog.md');
requireText(catalogGenerator, '## Service and maintenance', 'catalog generator');
requireText(motorMarkdownGenerator, 'https://www.mercuryrepower.ca/maintenance.md', 'motor markdown generator');
requireText(motorPage, 'to="/maintenance"', 'motor-page customer link');
requireText(locationPage, 'to="/maintenance"', 'location-page customer link');
requireText(prerender, 'href="/maintenance"', 'static motor-page link');

const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
const headers = Array.isArray(vercel.headers) ? vercel.headers : [];
if (!rewrites.some((entry) => entry.source === '/maintenance.md' && entry.destination === '/maintenance.md')) {
  throw new Error('[maintenance-surface] vercel.json is missing the /maintenance.md rewrite');
}
if (!headers.some((entry) =>
  entry.source === '/maintenance.md' &&
  entry.headers?.some((header) => header.key === 'Content-Type' && header.value.includes('text/markdown'))
)) {
  throw new Error('[maintenance-surface] vercel.json is missing markdown headers for /maintenance.md');
}
if (!headers.some((entry) =>
  entry.source === '/maintenance.md' &&
  entry.headers?.some((header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, follow')
)) {
  throw new Error('[maintenance-surface] vercel.json is missing noindex/follow protection for /maintenance.md');
}

console.log('[maintenance-surface] verified factual guidance, discovery links, and markdown delivery');
