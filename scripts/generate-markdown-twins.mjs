import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE_URL = 'https://www.mercuryrepower.ca';
const AGENT_API = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-quote-api';
const TWIN_DATE = new Date().toISOString().split('T')[0];

function loadCaseStudies() {
  const dumpScript = `
    import { caseStudies } from '../src/data/caseStudies.ts';
    process.stdout.write(JSON.stringify(caseStudies));
  `;
  const tmpFile = join(ROOT, 'scripts', '.casestudies-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    return JSON.parse(execSync(`npx tsx ${tmpFile}`, { cwd: ROOT, encoding: 'utf8' }));
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

function loadLocations() {
  const dumpScript = `
    import { locations } from '../src/data/locations.ts';
    process.stdout.write(JSON.stringify(locations));
  `;
  const tmpFile = join(ROOT, 'scripts', '.locations-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    return JSON.parse(execSync(`npx tsx ${tmpFile}`, { cwd: ROOT, encoding: 'utf8' }));
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

async function loadMotors() {
  const API_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api';
  try {
    const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      const motors = Array.isArray(json?.motors) ? json.motors : [];
      if (motors.length > 0) {
        return motors.map(m => ({
          id: m.id,
          model_key: m.slug,
          model: 'Outboard',
          model_display: m.modelDisplay,
          model_number: m.modelNumber,
          mercury_model_no: m.modelNumber,
          family: m.family,
          horsepower: m.horsepower,
          shaft: m.shaftLength,
          shaft_code: m.shaftLength,
          start_type: null,
          control_type: m.controlType,
          msrp: m.msrp,
          sale_price: m.salePrice,
          dealer_price: m.dealerPrice,
          base_price: null,
          manual_overrides: {},
          _resolvedSellingPrice: m.sellingPrice,
          availability: m.availability,
          in_stock: !!m.inStock,
          hero_image_url: m.imageUrl,
          image_url: m.imageUrl,
          updated_at: json.lastUpdated || new Date().toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn('[markdown-twins] public-motors-api error:', err.message, '— falling back to Supabase');
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eutsoqdpjurknjsshxes.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_KEY) {
    throw new Error('[markdown-twins] FATAL: public-motors-api unreachable and no publishable Supabase key is available.');
  }
  const url = `${SUPABASE_URL}/rest/v1/motor_models?select=id,model_key,model,model_display,model_number,mercury_model_no,family,horsepower,shaft,shaft_code,start_type,control_type,msrp,sale_price,dealer_price,base_price,manual_overrides,availability,in_stock,hero_image_url,image_url,updated_at&model_key=not.is.null&availability=neq.Exclude&order=horsepower.asc&limit=500`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`[markdown-twins] FATAL: Supabase fallback failed ${res.status} ${res.statusText}`);
  return res.json();
}

function motorSlug(modelKey) {
  return String(modelKey).toLowerCase().replace(/_/g, '-');
}

function resolveMotorSellingPrice(m) {
  if (typeof m._resolvedSellingPrice === 'number' && m._resolvedSellingPrice > 0) return m._resolvedSellingPrice;
  const overrides = m.manual_overrides || {};
  const candidates = [overrides.sale_price, overrides.base_price, m.sale_price, m.dealer_price, m.msrp, m.base_price];
  for (const v of candidates) {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n === 'number' && !isNaN(n) && n > 0) return n;
  }
  return null;
}

function detectMotorFamily(m) {
  if (m.family) return m.family;
  const s = (m.model_display || m.model || '').toLowerCase();
  if (s.includes('proxs') || s.includes('pro xs')) return 'Pro XS';
  if (s.includes('seapro') || s.includes('sea pro')) return 'SeaPro';
  if (s.includes('racing')) return 'Racing';
  if (s.includes('verado')) return 'Verado';
  return 'FourStroke';
}

function mdFrontmatter(canonicalPath, extraLines = []) {
  return [
    '---',
    `canonical: ${SITE_URL}${canonicalPath}`,
    `last_updated: ${TWIN_DATE}`,
    'currency: CAD',
    'pickup_only: true',
    'delivery_offered: false',
    'location: Gores Landing, ON, Canada',
    'final_quote_requires_dealer_confirmation: true',
    'verado_status: special-order only — not in default inventory',
    ...extraLines,
    '---',
    '',
  ].join('\n');
}

function motorBestFit(family, hp) {
  if (family === 'Pro XS') return 'Tournament bass anglers, performance bay boats, and high-output fishing rigs that prioritize hole-shot and top speed.';
  if (family === 'SeaPro') return 'Commercial users, guides, and high-hour applications where a heavier-duty drivetrain matters.';
  if (family === 'Racing') return 'Specialty performance and competition use only. Confirm rigging compatibility with dealer.';
  if (family === 'Verado') return 'Larger center-consoles and powerboats where supercharged smoothness is preferred. Special-order only.';
  if (hp <= 9.9) return 'Small tenders, canoes, sailboat kickers, and very light fishing setups.';
  if (hp <= 30) return 'Small aluminum fishing boats, jon boats, and light tiller setups.';
  if (hp <= 60) return 'Mid-size aluminum fishing boats 14–18 ft and small pontoons.';
  if (hp <= 115) return 'Aluminum fishing boats 16–20 ft, pontoons up to ~22 ft, and family runabouts.';
  if (hp <= 200) return 'Larger pontoons, fiberglass runabouts, and walkaround/cuddy boats 20–24 ft.';
  return 'Larger offshore and high-performance hulls. Confirm transom rating and rigging with dealer.';
}

function motorNotIdeal(family, hp) {
  if (family === 'Pro XS') return 'Pontoons, low-speed cruising, or fuel-economy-first family use — a FourStroke is usually the better fit.';
  if (family === 'SeaPro') return 'Recreational-only owners with light annual hours — FourStroke offers better value for typical use.';
  if (family === 'Racing') return 'Any general recreational use — these are not appropriate for typical pontoons, fishing, or family boats.';
  if (family === 'Verado') return 'Smaller hulls or buyers seeking the simplest service path — Verado is supercharged and special-order only.';
  if (hp <= 9.9) return 'Boats 16 ft and over, loaded family boats, or anything that needs to plane with multiple passengers.';
  if (hp <= 30) return 'Pontoons, family runabouts, or any 18+ ft boat carrying more than two adults with gear.';
  if (hp <= 60) return 'Heavy pontoons over 22 ft or fiberglass family boats — consider 90–115 HP.';
  if (hp <= 115) return 'Tournament bass setups (see Pro XS) and large 24+ ft pontoons with watersports loads.';
  return 'Small tenders or boats rated under this HP — match HP to transom rating, never exceed it.';
}

function motorMarkdown(m) {
  const slug = motorSlug(m.model_key);
  const url = `${SITE_URL}/motors/${slug}`;
  const display = m.model_display || m.model || `Mercury ${m.horsepower}HP`;
  const family = detectMotorFamily(m);
  const price = resolveMotorSellingPrice(m);
  const inStock = m.in_stock || m.availability === 'In Stock';
  const modelNo = m.model_number || m.mercury_model_no || '';
  const shaft = m.shaft_code || m.shaft || '';
  const priceStr = price ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price) : 'Contact for pricing';
  const isVerado = family === 'Verado';
  const front = mdFrontmatter(`/motors/${slug}`, [
    `motor_id: ${m.id}`,
    `slug: ${slug}`,
    `family: ${family}`,
    `horsepower: ${m.horsepower}`,
    modelNo ? `model_number: ${modelNo}` : null,
    `availability: ${inStock ? 'in_stock' : 'special_order'}`,
    `price_cad: ${price ?? 'null'}`,
  ].filter(Boolean));

  return [
    front,
    `# ${display}`,
    '',
    `Mercury ${family} ${m.horsepower} HP outboard motor${modelNo ? ` (model ${modelNo})` : ''}.`,
    'Sold by Harris Boat Works on Rice Lake, Ontario — Mercury Marine Platinum Dealer since 1965.',
    '',
    '## Quick facts',
    '',
    `- **Model:** ${display}`,
    `- **Family:** Mercury ${family}`,
    `- **Horsepower:** ${m.horsepower} HP`,
    modelNo ? `- **Model number:** ${modelNo}` : null,
    shaft ? `- **Shaft:** ${shaft}` : null,
    m.start_type ? `- **Start type:** ${m.start_type}` : null,
    m.control_type ? `- **Control type:** ${m.control_type}` : null,
    '',
    '## Pricing (CAD)',
    '',
    `- **Selling price:** ${priceStr}`,
    m.msrp && price && m.msrp > price ? `- **MSRP:** ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(m.msrp)}` : null,
    '- **Currency:** Canadian Dollars (CAD) only — we do not quote in USD.',
    '- **Final price** is confirmed by Harris Boat Works staff before purchase.',
    '',
    '## Availability',
    '',
    `- **Status:** ${inStock ? 'In stock at Gores Landing' : 'Special order — contact dealer for ETA'}`,
    '- **Pickup:** Required at Gores Landing, ON. We do not ship and we do not deliver.',
    '',
    '## Best fit for',
    '',
    motorBestFit(family, m.horsepower),
    '',
    '## Not ideal for',
    '',
    motorNotIdeal(family, m.horsepower),
    '',
    '## Build a quote',
    '',
    `- HTML page (canonical for humans): ${url}`,
    `- Quote builder deep link: ${SITE_URL}/quote/motor-selection?motor=${encodeURIComponent(m.id)}`,
    '',
    '## Agent API',
    '',
    `Programmatic quotes: \`POST ${AGENT_API}\``,
    '',
    '```json',
    '{',
    `  "motor_id": "${m.id}",`,
    '  "trade_in": null,',
    '  "contact": null',
    '}',
    '```',
    '',
    '## Notes',
    '',
    isVerado ? '- Verado is special-order only and not part of default inventory. Contact Harris Boat Works directly for Verado availability and lead time.' : null,
    '- Financing available on totals over $5,000 CAD (tiered: 8.99% under $10K, 7.99% over $10K).',
    '- Standard 3-year Mercury factory warranty; up to 7 years available on select promotions.',
    '- We are pickup-only at Gores Landing, ON. Final price confirmed by dealer.',
  ].filter(l => l !== null).join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function caseStudyMarkdown(s) {
  const url = `${SITE_URL}/case-studies/${s.slug}`;
  const front = mdFrontmatter(`/case-studies/${s.slug}`, [
    `case_study_id: ${s.id}`,
    `slug: ${s.slug}`,
    `boat_type: ${JSON.stringify(s.boatType)}`,
    `region: ${JSON.stringify(s.region)}`,
  ]);
  const why = (s.whyItWorked || []).map(w => `- ${w}`).join('\n');
  return [
    front,
    `# ${s.title}`,
    '',
    s.excerpt,
    '',
    '## Factbox',
    '',
    `- **Boat type:** ${s.boatType}`,
    `- **Region:** ${s.region}`,
    `- **Scenario:** ${s.scenario}`,
    `- **HP jump:** ${s.hpJump}`,
    '',
    '## Before → After',
    '',
    `- **Before:** ${s.beforeMotor}`,
    `- **After:** ${s.afterMotor}`,
    '',
    '## Recommendation',
    '',
    s.recommendation,
    '',
    '## Why it worked',
    '',
    why || '_(no notes recorded)_',
    '',
    '## Customer quote',
    '',
    `> ${s.customerQuote}`,
    '',
    '## Quote a similar repower',
    '',
    `- HTML page (canonical for humans): ${url}`,
    `- Start a Mercury quote: ${SITE_URL}/quote/motor-selection`,
    '',
    '## Notes',
    '',
    '- All pricing in CAD. Pickup only at Gores Landing, ON.',
    '- Final motor recommendation confirmed by Harris Boat Works staff.',
    '- Verado not used in default repower recommendations (special-order only).',
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function locationMarkdown(loc, caseStudies) {
  const url = `${SITE_URL}/locations/${loc.slug}`;
  const related = caseStudies.filter(s => {
    const r = (s.region || '').toLowerCase();
    const lr = (loc.region || '').toLowerCase();
    return r.includes(lr) || lr.includes(r.split(' ')[0]);
  });
  const front = mdFrontmatter(`/locations/${loc.slug}`, [
    `slug: ${loc.slug}`,
    `region: ${JSON.stringify(loc.region)}`,
    `keyword: ${JSON.stringify(loc.keyword)}`,
  ]);
  const popular = (loc.popularBoats || []).map(b => `- ${b}`).join('\n');
  const links = (loc.recommendedLinks || []).map(l => `- [${l.label}](${SITE_URL}${l.href})`).join('\n');
  const faqs = (loc.faqs || []).map(f => `### ${f.question}\n\n${f.answer}\n`).join('\n');
  const relatedMd = related.length ? related.map(s => `- [${s.title}](${SITE_URL}/case-studies/${s.slug}.md)`).join('\n') : '_No matching case studies recorded for this region yet._';

  return [
    front,
    `# ${loc.title}`,
    '',
    loc.intro,
    '',
    '## Factbox',
    '',
    `- **Region:** ${loc.region}`,
    `- **Drive time:** ${loc.driveTime}`,
    '- **Pickup policy:** Pickup only at Gores Landing, ON. We do not deliver.',
    '- **Currency:** CAD only.',
    '',
    '## Common boat types',
    '',
    popular || '_(none recorded)_',
    '',
    '## Recommended links',
    '',
    links || '_(none)_',
    '',
    '## Related case studies',
    '',
    relatedMd,
    '',
    '## FAQs',
    '',
    faqs || '_(none recorded)_',
    '',
    '## Notes',
    '',
    '- All pricing in CAD. Final price confirmed by Harris Boat Works.',
    '- Verado is special-order only — not in default inventory.',
    '- HTML page (canonical for humans): ' + url,
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function catalogMarkdown(motorTwins, caseStudyTwins, locationTwins) {
  return [
    mdFrontmatter('/catalog.md', ['index_type: agent_catalog']),
    '# Harris Boat Works — Agent Catalog',
    '',
    'This is the markdown index for AI agents. Each entry below links to a `.md` twin of an HTML page on https://www.mercuryrepower.ca.',
    '',
    '## Business rules (apply to every entry)',
    '',
    '- All pricing in **CAD**.',
    '- **Pickup only** at Gores Landing, ON. We do not ship outboards. We do not deliver.',
    '- **Final price** is always confirmed by Harris Boat Works staff before purchase.',
    '- **Verado** is special-order only — not part of default inventory and not actively promoted.',
    '- Financing minimum: **$5,000 CAD** total. Tiered rates: 8.99% under $10K, 7.99% over $10K.',
    '',
    '## Agent quote API',
    '',
    `\`POST ${AGENT_API}\` — programmatic quote builder. See any motor twin for an example body.`,
    '',
    '## MCP discovery',
    '',
    `- MCP manifest: ${SITE_URL}/.well-known/mcp.json`,
    `- llms.txt: ${SITE_URL}/llms.txt`,
    `- Sitemap (HTML, for search engines): ${SITE_URL}/sitemap.xml`,
    '',
    '## Motors',
    '',
    motorTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n'),
    '',
    '## Case studies',
    '',
    caseStudyTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n'),
    '',
    '## Locations',
    '',
    locationTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n'),
    '',
  ].join('\n') + '\n';
}

function writePublicMd(relPath, content) {
  const outFile = join(PUBLIC, relPath.replace(/^\//, ''));
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, content, 'utf8');
}

function verifyPublicMd(relPath, label, required = []) {
  const path = join(PUBLIC, relPath.replace(/^\//, ''));
  if (!existsSync(path)) throw new Error(`[markdown-twins] ${label} missing at ${path}`);
  const text = String(execSync(`node -e "process.stdout.write(require('fs').readFileSync(process.argv[1], 'utf8'))" ${JSON.stringify(path)}`, { encoding: 'utf8' }));
  if (!text.startsWith('---\n')) throw new Error(`[markdown-twins] ${label} does not start with YAML frontmatter`);
  if (/<html[\s>]/i.test(text) || /<!doctype html/i.test(text)) throw new Error(`[markdown-twins] ${label} contains HTML`);
  for (const item of required) {
    if (!text.includes(item)) throw new Error(`[markdown-twins] ${label} missing required text: ${item}`);
  }
}

const caseStudies = loadCaseStudies();
const locations = loadLocations();
const motorRecords = await loadMotors();

rmSync(join(PUBLIC, 'catalog.md'), { force: true });
for (const dir of ['motors', 'case-studies', 'locations']) {
  rmSync(join(PUBLIC, dir), { recursive: true, force: true });
}

const motorTwinSummaries = [];
for (const m of motorRecords) {
  if (!m.model_key) continue;
  const s = (m.model_display || m.model || '').toLowerCase();
  if (s.includes('verado')) continue;
  const slug = motorSlug(m.model_key);
  const path = `/motors/${slug}.md`;
  writePublicMd(path, motorMarkdown(m));
  motorTwinSummaries.push({ path, title: m.model_display || m.model || `Mercury ${m.horsepower}HP` });
}

const caseStudyTwinSummaries = caseStudies.map(s => {
  const path = `/case-studies/${s.slug}.md`;
  writePublicMd(path, caseStudyMarkdown(s));
  return { path, title: s.title };
});

const locationTwinSummaries = locations.map(loc => {
  const path = `/locations/${loc.slug}.md`;
  writePublicMd(path, locationMarkdown(loc, caseStudies));
  return { path, title: loc.title };
});

writePublicMd('/catalog.md', catalogMarkdown(motorTwinSummaries, caseStudyTwinSummaries, locationTwinSummaries));

verifyPublicMd('/catalog.md', 'catalog.md', ['## Motors', '## Case studies', '## Locations', 'CAD', 'Pickup only', 'mcp.json']);
if (motorTwinSummaries[0]) verifyPublicMd(motorTwinSummaries[0].path, 'sample motor twin', ['canonical:', 'currency: CAD', 'pickup_only: true', 'Build a quote', 'Agent API', 'agent-quote-api']);
if (caseStudyTwinSummaries[0]) verifyPublicMd(caseStudyTwinSummaries[0].path, 'sample case study twin', ['canonical:', 'Mercury', '## Customer quote', '## Recommendation']);
if (locationTwinSummaries[0]) verifyPublicMd(locationTwinSummaries[0].path, 'sample location twin', ['canonical:', 'Gores Landing', '## FAQs', '## Common boat types']);

if (motorTwinSummaries.length === 0 || caseStudyTwinSummaries.length === 0 || locationTwinSummaries.length === 0) {
  throw new Error(`[markdown-twins] Refusing empty generation: motors=${motorTwinSummaries.length}, caseStudies=${caseStudyTwinSummaries.length}, locations=${locationTwinSummaries.length}`);
}

console.log(`[markdown-twins] ✓ public markdown twins written before Vite build: ${motorTwinSummaries.length} motors, ${caseStudyTwinSummaries.length} case studies, ${locationTwinSummaries.length} locations, 1 catalog`);
