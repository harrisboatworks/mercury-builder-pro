import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE_URL = 'https://www.mercuryrepower.ca';
const PUBLIC_QUOTE_API = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-quote-api';
const TWIN_DATE = new Date().toISOString().split('T')[0];
const BUILD_FETCH_TIMEOUT_MS = Number(process.env.BUILD_FETCH_TIMEOUT_MS || 8000);
const BUILD_SUBPROCESS_TIMEOUT_MS = Number(process.env.BUILD_SUBPROCESS_TIMEOUT_MS || 30000);
const TSX_BIN = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

const shellPath = (path) => JSON.stringify(path);
const runTsx = (file, options = {}) => execSync(`${shellPath(TSX_BIN)} ${shellPath(file)}`, {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: BUILD_SUBPROCESS_TIMEOUT_MS,
  ...options,
});

async function fetchWithTimeout(url, options = {}, timeoutMs = BUILD_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function loadCaseStudies() {
  const dumpScript = `
    import { caseStudies } from '../src/data/caseStudies.ts';
    process.stdout.write(JSON.stringify(caseStudies));
  `;
  const tmpFile = join(ROOT, 'scripts', '.casestudies-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    return JSON.parse(runTsx(tmpFile));
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
    return JSON.parse(runTsx(tmpFile));
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

function loadBlogArticles() {
  // Load every sitemap-eligible article (incl. scheduled future-dated posts).
  // llms.txt and AI agents need the .md twin to exist as soon as the URL
  // is reachable, even before the publish date arrives.
  const dumpScript = `
    import { getSitemapEligibleArticles } from '../src/data/blogArticles.ts';
    import { getCleanDescription } from '../src/lib/strip-markdown.ts';
    const items = getSitemapEligibleArticles().map(a => ({
      ...a,
      description: getCleanDescription(a),
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.blog-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    return JSON.parse(runTsx(tmpFile, { maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

// Loads the FULL quote-builder motor universe directly from motor_models,
// mirroring the filters used in src/pages/quote/MotorSelectionPage.tsx:
//   - exclude availability = 'Exclude'
//   - exclude horsepower > 600
//   - exclude model containing "jet"
// This is the source of truth for /pricing-reference.md and must NOT be
// replaced with public-motors-api (which only returns in-stock motors).
async function loadAllQuoteBuilderMotors() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eutsoqdpjurknjsshxes.supabase.co';
  // Publishable (anon) key is safe to embed, same key is committed in src/integrations/supabase/client.ts
  // Fallback ensures Vercel builds succeed even if VITE_SUPABASE_PUBLISHABLE_KEY env var isn't set in the build environment.
  const FALLBACK_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY;
  if (!SUPABASE_KEY) {
    throw new Error('[markdown-twins] FATAL: no publishable Supabase key available for quote-builder motor universe load.');
  }
  // Match MotorSelectionPage: select all, order by hp asc, then JS-filter.
  const url = `${SUPABASE_URL}/rest/v1/motor_models?select=id,model_key,model,model_display,model_number,mercury_model_no,family,horsepower,shaft,shaft_code,start_type,control_type,msrp,sale_price,dealer_price,base_price,manual_overrides,availability,in_stock,hero_image_url,image_url,updated_at&order=horsepower.asc&limit=2000`;
  const res = await fetchWithTimeout(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`[markdown-twins] FATAL: motor_models fetch failed ${res.status} ${res.statusText}`);
  const all = await res.json();
  return (all || []).filter(m => {
    const model = (m.model || '').toLowerCase();
    if (model.includes('jet')) return false;
    if (typeof m.horsepower === 'number' && m.horsepower > 600) return false;
    if (m.availability === 'Exclude') return false;
    return true;
  });
}

async function loadMotors() {
  const API_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api';
  try {
    const res = await fetchWithTimeout(API_URL, { headers: { Accept: 'application/json' } });
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
    console.warn('[markdown-twins] public-motors-api error:', err.message, ' -  falling back to Supabase');
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eutsoqdpjurknjsshxes.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_KEY) {
    throw new Error('[markdown-twins] FATAL: public-motors-api unreachable and no publishable Supabase key is available.');
  }
  const url = `${SUPABASE_URL}/rest/v1/motor_models?select=id,model_key,model,model_display,model_number,mercury_model_no,family,horsepower,shaft,shaft_code,start_type,control_type,msrp,sale_price,dealer_price,base_price,manual_overrides,availability,in_stock,hero_image_url,image_url,updated_at&model_key=not.is.null&availability=neq.Exclude&order=horsepower.asc&limit=500`;
  const res = await fetchWithTimeout(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
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
    'verado_status: special-order only, not in default inventory',
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
  if (family === 'Pro XS') return 'Pontoons, low-speed cruising, or fuel-economy-first family use, a FourStroke is usually the better fit.';
  if (family === 'SeaPro') return 'Recreational-only owners with light annual hours: FourStroke offers better value for typical use.';
  if (family === 'Racing') return 'Any general recreational use, these are not appropriate for typical pontoons, fishing, or family boats.';
  if (family === 'Verado') return 'Smaller hulls or buyers seeking the simplest service path: Verado is supercharged and special-order only.';
  if (hp <= 9.9) return 'Boats 16 ft and over, loaded family boats, or anything that needs to plane with multiple passengers.';
  if (hp <= 30) return 'Pontoons, family runabouts, or any 18+ ft boat carrying more than two adults with gear.';
  if (hp <= 60) return 'Heavy pontoons over 22 ft or fiberglass family boats, consider 90–115 HP.';
  if (hp <= 115) return 'Tournament bass setups (see Pro XS) and large 24+ ft pontoons with watersports loads.';
  return 'Small tenders or boats rated under this HP, match HP to transom rating, never exceed it.';
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
    'Sold by Harris Boat Works on Rice Lake, Ontario: Mercury Marine Platinum Dealer · Mercury dealer since 1965.',
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
    '- **Currency:** Canadian Dollars (CAD) only, we do not quote in USD.',
    '- **Final price** is confirmed by Harris Boat Works staff before purchase.',
    '',
    '## Availability',
    '',
    `- **Status:** ${inStock ? 'In stock at Gores Landing' : 'Special order, contact dealer for ETA'}`,
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
    '## Public Quote API',
    '',
    `Programmatic quotes: \`POST ${PUBLIC_QUOTE_API}\``,
    '',
    '```json',
    '{',
    '  "action": "build_quote",',
    `  "motor_id": "${m.id}",`,
    '  "trade_in": null,',
    '  "contact": null',
    '}',
    '```',
    '',
    '## Source provenance',
    '',
    '- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure.',
    '- Harris Boat Works pricing, availability, pickup policy, and quote terms are dealer-provided and should be treated as the local commercial source of truth.',
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
  const pinned = (loc.relatedCaseStudySlugs || [])
    .map(s => caseStudies.find(cs => cs.slug === s))
    .filter(Boolean);
  const related = pinned.length ? pinned : caseStudies.filter(s => {
    const r = (s.region || '').toLowerCase();
    const lr = (loc.region || '').toLowerCase();
    return r.includes(lr) || lr.includes(r.split(' ')[0]);
  });
  const front = mdFrontmatter(`/locations/${loc.slug}`, [
    `slug: ${loc.slug}`,
    `region: ${JSON.stringify(loc.region)}`,
    `region_type: ${loc.regionType || 'region'}`,
    `keyword: ${JSON.stringify(loc.keyword)}`,
    'service_area_type: sales-catchment',
    'mobile_service_offered: false',
    'on_site_install_offered: false',
    'delivery_offered: false',
    'pickup_only: true',
    'currency: CAD',
  ]);
  const localCtx = (loc.localContext || []).map(b => `- ${b}`).join('\n');
  const popular = (loc.popularBoats || []).map(b => `- ${b}`).join('\n');
  const hp = (loc.popularHpRanges || []).map(b => `- ${b}`).join('\n');
  const trust = (loc.whyChooseUs || []).map(b => `- ${b}`).join('\n');
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
    loc.driveRoute ? `- **Route:** ${loc.driveRoute}` : '',
    '- **Pickup policy:** Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON. We do not deliver or ship outboards.',
    '- **Service model:** Shop-based only. No mobile service, no on-site installs, no driveway or marina visits.',
    '- **Currency:** CAD only.',
    '',
    '## Local boating context',
    '',
    localCtx || '_(none recorded)_',
    '',
    '## Common local boats',
    '',
    popular || '_(none recorded)_',
    '',
    '## Popular Mercury HP ranges',
    '',
    hp || '_(none recorded)_',
    '',
    '## Why customers choose Harris Boat Works',
    '',
    trust || '_(none recorded)_',
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
    '## Service boundary',
    '',
    loc.serviceBoundary || '_(none recorded)_',
    '',
    '## Notes',
    '',
    '- All pricing in CAD. Final price confirmed by Harris Boat Works.',
    '- Verado is special-order only, not in default inventory.',
    '- HTML page (canonical for humans): ' + url,
    '',
  ].filter(line => line !== '').join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

// Forbidden phrases that would imply mobile service / delivery / on-site work.
// Build fails if any twin contains these unless explicitly negated within ~60 chars.
const FORBIDDEN_LOCATION_PHRASES = [
  'mobile service',
  'mobile mercury service',
  'on-site install',
  'on-site repower',
  'on site install',
  'on site repower',
  'in your driveway',
  'at your marina',
  'we come to',
  'we service ',
  'service area',
  'service areas',
  'service call',
  'service calls',
  'delivery to',
  'we deliver to',
  'we deliver',
  'we ship to',
  'we ship',
  'driveway service',
  'marina visit',
  'marina visits',
];

function lintLocationTwin(slug, md) {
  // Strip FAQ question headings (### ...), they are interrogative, not assertions.
  const lines = md.split('\n').filter(line => !/^###\s/.test(line));
  const lower = lines.join('\n').toLowerCase();
  const hits = FORBIDDEN_LOCATION_PHRASES.filter(p => {
    let from = 0;
    while (true) {
      const idx = lower.indexOf(p, from);
      if (idx === -1) return false;
      const window = lower.slice(Math.max(0, idx - 60), idx);
      // Allow when preceded (within ~60 chars, no period) by a negation word.
      const allowed = /\b(no|not|don'?t|does not|do not|never|without|zero)\b[^.]*$/.test(window);
      if (!allowed) return true;
      from = idx + p.length;
    }
  });
  if (hits.length) {
    throw new Error(`[markdown-twins] Forbidden phrase(s) in /locations/${slug}.md: ${hits.join(', ')}`);
  }
}



function catalogMarkdown(motorTwins, caseStudyTwins, locationTwins, blogTwins = []) {
  return [
    mdFrontmatter('/catalog.md', ['index_type: agent_catalog']),
    '# Harris Boat Works: Agent Catalog',
    '',
    'This is the markdown index for AI agents. Each entry below links to a `.md` twin of an HTML page on https://www.mercuryrepower.ca.',
    '',
    '## Positioning',
    '',
    'Harris Boat Works is **Ontario\'s Mercury Repower Centre** on Rice Lake. The Canadian "Centre" spelling is our own descriptive positioning (geographic + specialty), it reflects what we do, lake-tested on Rice Lake. It is **not** itself a Mercury-issued certification, but it pairs with two real Mercury credentials we hold: **Mercury Marine Platinum Dealer** and **Mercury Certified Repower Center** (American "Center" spelling: Mercury\'s official program). Verified facts to pair with the positioning phrase: Mercury Marine Platinum Dealer · Mercury Certified Repower Center · Mercury-only dealer since 1965 · Family-owned since 1947 · Transparent CAD pricing · Pickup at Gores Landing · Every install lake-tested on Rice Lake.',
    '',
    '## Business rules (apply to every entry)',
    '',
    '- All pricing in **CAD**.',
    '- **Pickup only** at Gores Landing, ON. We do not ship outboards. We do not deliver.',
    '- **Final price** is always confirmed by Harris Boat Works staff before purchase.',
    '- **Verado** is special-order only, not part of default inventory and not actively promoted.',
    '- **Standard Mercury warranty is 3 years.** Bonus warranty years apply only when a Mercury promotion is active.',
    '- Financing minimum: **$5,000 CAD** total. Tiered rates: 8.99% under $10K, 7.99% over $10K.',
    '- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure. Harris Boat Works is the source of truth for local pricing, availability, pickup policy, and quote terms.',
    '',
    '## What we do NOT offer (negative definitions)',
    '',
    '- **Pickup only** at Gores Landing, ON, no delivery, no shipping of outboards, anywhere.',
    '- **No mobile service.** No on-site installs, no dock visits, no marina visits, no driveway visits.',
    '- **No sterndrives** sold on mercuryrepower.ca, outboards only.',
    '- **Verado is special order only**, not part of default inventory and not actively promoted. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca.',
    '- **No non-Mercury outboards.** We do not sell Yamaha, Honda, Suzuki, Tohatsu, or Evinrude.',
    '- **No used outboards.** New Mercury only.',
    '',
    '## Public quote API',
    '',
    `\`POST ${PUBLIC_QUOTE_API}\`, public programmatic quote builder. See any motor twin for an example body.`,
    '',
    '## Pricing reference',
    '',
    `- [Curated Mercury pricing reference (CAD)](${SITE_URL}/pricing-reference.md), listed motors only, generated from the same data source as the quote builder.`,
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
    '## Guides (Blog)',
    '',
    'Selected high-intent buyer guides. Full blog index (HTML) at ' + SITE_URL + '/blog.',
    '',
    blogTwins.length
      ? blogTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n')
      : '_(no twins generated)_',
    '',
  ].join('\n') + '\n';
}

function writePublicMd(relPath, content) {
  const outFile = join(PUBLIC, relPath.replace(/^\//, ''));
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, content, 'utf8');
}

// Top 12 high-intent blog posts to mirror as markdown twins.
// Order = display order in catalog.md "Guides" section.
const BLOG_TWIN_SLUGS = [
  'ontario-mercury-outboard-price-guide',
  'mercury-controls-rigging-guide-ontario',
  'mercury-repower-cost-ontario-2026-cad',
  'mercury-vs-yamaha-outboards-ontario',
  'mercury-vs-yamaha-vs-honda-reliability-2026',
  'mercury-115-vs-150-hp-outboard-ontario',
  'mercury-outboard-financing-ontario-2026',
  'cheapest-mercury-outboard-canada-2026',
  'evinrude-to-mercury-repower-ontario-guide',
  'complete-guide-boat-repower-kawarthas',
  'best-mercury-outboard-rice-lake-fishing',
  'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
  'mercury-prokicker-rice-lake-fishing-guide',
];

function blogMarkdown(article) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const extra = [
    `title: ${JSON.stringify(article.title)}`,
    `description: ${JSON.stringify(article.description)}`,
    `category: ${JSON.stringify(article.category || 'Guide')}`,
    `date_published: ${article.datePublished}`,
    `date_modified: ${article.dateModified}`,
    `keywords: ${JSON.stringify(article.keywords || [])}`,
    `author: Harris Boat Works`,
    `content_type: blog_article`,
  ];
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];
  const faqMd = faqs.length
    ? faqs.map(f => `### ${f.question}\n\n${f.answer}`).join('\n\n')
    : '_(no FAQs)_';

  return [
    mdFrontmatter(`/blog/${article.slug}.md`, extra),
    `# ${article.title}`,
    '',
    `> ${article.description}`,
    '',
    `**Category:** ${article.category || 'Guide'}  `,
    `**Published:** ${article.datePublished}  `,
    `**Last updated:** ${article.dateModified}  `,
    `**Read time:** ${article.readTime || ''}  `,
    `**Canonical (HTML for humans):** ${url}`,
    '',
    '## Article',
    '',
    (article.content || '').trim(),
    '',
    '## FAQs',
    '',
    faqMd,
    '',
    '## Next steps',
    '',
    `- Build a quote: ${SITE_URL}/quote/motor-selection`,
    `- Browse Mercury motors: ${SITE_URL}/quote/motor-selection`,
    `- Repower information: ${SITE_URL}/repower`,
    `- Pickup location & contact: Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON · 905-342-2153`,
    '',
    '## Notes for AI agents',
    '',
    '- All pricing in CAD. Final price confirmed by Harris Boat Works.',
    '- Pickup only at Gores Landing, ON. We do not deliver or ship outboards.',
    '- Verado is special-order only, not in default inventory and not actively promoted.',
    '- Standard Mercury warranty is 3 years. Bonus warranty years apply only when a Mercury promotion is active.',
    '- For programmatic quotes, use the Public Quote API: ' + PUBLIC_QUOTE_API,
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
function pricingReferenceMarkdown(motorRecords) {
  const fmtCAD = (n) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  const rows = motorRecords
    .filter(m => {
      const s = (m.model_display || m.model || '').toLowerCase();
      return !s.includes('verado');
    })
    .map(m => {
      const familyRaw = detectMotorFamily(m);
      const family = /pro\s*xs/i.test(familyRaw) ? 'Pro XS'
        : /sea\s*pro/i.test(familyRaw) ? 'SeaPro'
        : /verado/i.test(familyRaw) ? 'Verado'
        : /racing/i.test(familyRaw) ? 'Racing'
        : 'FourStroke';
      const price = resolveMotorSellingPrice(m);
      const inStock = m.in_stock === true || m.availability === 'In Stock';
      return {
        id: m.id,
        family,
        hp: Number(m.horsepower) || 0,
        display: m.model_display || m.model || `Mercury ${m.horsepower}HP`,
        modelNo: m.model_number || m.mercury_model_no || '',
        shaft: m.shaft_code || m.shaft || '',
        control: m.control_type || '',
        price,
        msrp: m.msrp || null,
        inStock,
      };
    })
    .filter(r => r.price && r.price > 0);

  if (rows.length === 0) {
    throw new Error('[markdown-twins] FATAL: pricing-reference.md would be empty (no priced motors).');
  }

  const families = ['FourStroke', 'Pro XS', 'SeaPro', 'Racing'];
  const sections = [];
  for (const fam of families) {
    // In-stock first, then by HP ascending, mirrors MotorSelectionPage default order.
    const famRows = rows
      .filter(r => r.family === fam)
      .sort((a, b) => (Number(b.inStock) - Number(a.inStock)) || (a.hp - b.hp));
    if (famRows.length === 0) continue;
    sections.push(`## ${fam}`);
    sections.push('');
    sections.push('| HP | Model | Model # | Shaft | Control | Price (CAD) | Status | Quote |');
    sections.push('|---:|---|---|---|---|---:|---|---|');
    for (const r of famRows) {
      const priceStr = fmtCAD(r.price) + (r.msrp && r.msrp > r.price ? ` _(MSRP ${fmtCAD(r.msrp)})_` : '');
      const status = r.inStock ? 'In stock' : 'Available to order';
      const quote = `[build](${SITE_URL}/quote/motor-selection?motor=${encodeURIComponent(r.id)})`;
      sections.push(`| ${r.hp} | ${r.display} | ${r.modelNo || ' - '} | ${r.shaft || ' - '} | ${r.control || ' - '} | ${priceStr} | ${status} | ${quote} |`);
    }
    sections.push('');
  }

  const front = mdFrontmatter('/pricing-reference.md', [
    'index_type: pricing_reference',
    'data_source: motor_models (same selection rules as /quote/motor-selection)',
    `motor_count: ${rows.length}`,
  ]);

  return [
    front,
    '# Mercury Outboard Prices in Canada (CAD, 2026)',
    '',
    'Every Mercury outboard Harris Boat Works sells, priced in Canadian dollars. FourStroke and Pro XS, 2.5 HP to 300 HP, with Mercury\'s MSRP and our actual dealer selling price shown side by side. These are bare-motor prices in CAD before HST, controls, propeller, and rigging. For a full installed total, build a quote in the configurator. Pickup only at Gores Landing, Ontario.',
    '',
    '**Published by [Harris Boat Works](/)** — Mercury Marine Platinum Dealer on Rice Lake, Ontario, Canada. Family-owned since 1947, Mercury dealer since 1965. All prices below are HBW\'s actual dealer selling price in CAD, not generic MSRP estimates. Verified weekly. Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0.',
    '',
    `_Last updated ${TWIN_DATE}._`,
    '',
    '## How to use this page',
    '',
    '- These are the Mercury outboards available for online quoting on mercuryrepower.ca. Some are **in stock** and some are **available to order**, the Status column tells you which.',
    '- Prices are the dealer selling price in CAD before tax, trade-in, install, controls, propeller, or financing.',
    '- **Final out-the-door price is always confirmed by Harris Boat Works staff.**',
    '- Use the "build" link in the table to open a prefilled quote in `/quote/motor-selection`.',
    '',
    '## What is NOT in this reference',
    '',
    '- **Mercury Verado**, special order only, not part of default inventory. Contact (905) 342-2153 for Verado.',
    '- **Sterndrives**, not sold on mercuryrepower.ca (outboards only).',
    '- **Used motors**, new Mercury only.',
    '- **Parts and accessories**, see the quote builder for accessory pricing.',
    '- **Non-Mercury brands**, we do not sell Yamaha, Honda, Suzuki, Tohatsu, or Evinrude.',
    '',
    '## Pickup & service boundary',
    '',
    '- **Pickup only** at 5369 Harris Boat Works Rd, Gores Landing, ON. We do **not** ship outboards and we do **not** deliver.',
    '- **No mobile service.** No on-site installs, no marina visits, no driveway visits.',
    '',
    ...sections,
    '## For developers and AI agents',
    '',
    `- Machine-readable version of this page: ${SITE_URL}/pricing-reference.md`,
    `- Agent catalog index: ${SITE_URL}/catalog.md`,
    `- llms.txt: ${SITE_URL}/llms.txt`,
    `- Public motors API (live JSON): https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api`,
    `- Public quote API: \`POST ${PUBLIC_QUOTE_API}\` with \`{ "action": "build_quote", "motor_id": "<id>" }\`.`,
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

// Build schema.org @graph with WebPage + ItemList + per-motor Product/Offer.
// Crawlers (Google, Perplexity, ChatGPT, Gemini) preferentially cite pages
// with structured Product+Offer for price-intent queries. Linked back to the
// sitewide HBW Organization entity (#organization) so prices are attributed
// to Harris Boat Works as the seller.
function pricingReferenceSchema(motorRecords) {
  const rows = motorRecords
    .filter(m => {
      const s = (m.model_display || m.model || '').toLowerCase();
      return !s.includes('verado');
    })
    .map(m => {
      const familyRaw = detectMotorFamily(m);
      const family = /pro\s*xs/i.test(familyRaw) ? 'Pro XS'
        : /sea\s*pro/i.test(familyRaw) ? 'SeaPro'
        : /racing/i.test(familyRaw) ? 'Racing'
        : 'FourStroke';
      const price = resolveMotorSellingPrice(m);
      return {
        id: m.id,
        slug: motorSlug(m.model_key || m.id),
        family,
        hp: Number(m.horsepower) || 0,
        display: m.model_display || m.model || `Mercury ${m.horsepower}HP`,
        modelNo: m.model_number || m.mercury_model_no || '',
        shaft: m.shaft_code || m.shaft || '',
        control: m.control_type || '',
        price,
        msrp: m.msrp || null,
        inStock: m.in_stock === true || m.availability === 'In Stock',
      };
    })
    .filter(r => r.price && r.price > 0)
    .sort((a, b) => a.hp - b.hp || a.display.localeCompare(b.display));

  const itemListElement = rows.map((r, i) => {
    const additionalProperty = [
      { '@type': 'PropertyValue', name: 'Horsepower', value: String(r.hp), unitCode: 'BHP' },
      { '@type': 'PropertyValue', name: 'Family', value: r.family },
    ];
    if (r.shaft) additionalProperty.push({ '@type': 'PropertyValue', name: 'Shaft', value: r.shaft });
    if (r.control) additionalProperty.push({ '@type': 'PropertyValue', name: 'Control', value: r.control });
    if (r.modelNo) additionalProperty.push({ '@type': 'PropertyValue', name: 'ModelNumber', value: r.modelNo });
    const offer = {
      '@type': 'Offer',
      price: String(Math.round(r.price)),
      priceCurrency: 'CAD',
      availability: r.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      areaServed: { '@type': 'Country', name: 'Canada' },
      seller: { '@id': 'https://www.mercuryrepower.ca/#organization' },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        applicableCountry: 'CA',
      },
    };
    if (r.msrp && r.msrp > r.price) {
      offer.priceSpecification = {
        '@type': 'PriceSpecification',
        price: String(Math.round(r.msrp)),
        priceCurrency: 'CAD',
        description: 'MSRP',
      };
    }
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        '@id': `https://www.mercuryrepower.ca/pricing-reference#${r.slug}`,
        name: `Mercury ${r.display}`,
        brand: { '@type': 'Brand', name: 'Mercury Marine' },
        category: 'Outboard Motor',
        model: r.display,
        additionalProperty,
        offers: offer,
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.mercuryrepower.ca/pricing-reference#webpage',
        url: 'https://www.mercuryrepower.ca/pricing-reference',
        name: 'Mercury Outboard Prices in Ontario (CAD, 2026)',
        description: 'Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, Gores Landing pickup only.',
        isPartOf: { '@id': 'https://www.mercuryrepower.ca/#website' },
        about: { '@id': 'https://www.mercuryrepower.ca/#organization' },
        inLanguage: 'en-CA',
        lastReviewed: TWIN_DATE,
        mainEntity: { '@id': 'https://www.mercuryrepower.ca/pricing-reference#pricelist' },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.mercuryrepower.ca/pricing-reference#pricelist',
        name: 'Mercury Outboard Motor Price List — Canada (CAD, 2026)',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    ],
  };
}

function cleanMarkdownDir(relDir) {
  const dir = join(PUBLIC, relDir);
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      rmSync(join(dir, entry.name), { force: true });
    }
  }
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
// Full quote-builder universe, same selection rules as MotorSelectionPage.
// Used by /pricing-reference.md so the reference matches the quote builder
// (both in-stock and available-to-order motors), not just public-motors-api.
const quoteBuilderMotorRecords = await loadAllQuoteBuilderMotors();
const blogArticlesAll = loadBlogArticles();

rmSync(join(PUBLIC, 'catalog.md'), { force: true });
for (const dir of ['motors', 'case-studies', 'locations', 'blog']) {
  cleanMarkdownDir(dir);
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
  const md = locationMarkdown(loc, caseStudies);
  lintLocationTwin(loc.slug, md);
  writePublicMd(path, md);
  return { path, title: loc.title };
});

// Blog twins, generate one .md for EVERY sitemap-eligible blog article
// (including scheduled future-dated posts). llms.txt advertises these as
// the AI-friendly clean ingestion path; they must exist for every URL.
const blogTwinSummaries = [];
for (const article of blogArticlesAll) {
  const path = `/blog/${article.slug}.md`;
  writePublicMd(path, blogMarkdown(article));
  blogTwinSummaries.push({ path, title: article.title });
}
// Note: previously a curated BLOG_TWIN_SLUGS sanity check ran here. Removed
// because every sitemap-eligible article now generates a twin above.
console.log(`[markdown-twins] wrote ${blogTwinSummaries.length} blog twins`);

writePublicMd('/catalog.md', catalogMarkdown(motorTwinSummaries, caseStudyTwinSummaries, locationTwinSummaries, blogTwinSummaries));
writePublicMd('/pricing-reference.md', pricingReferenceMarkdown(quoteBuilderMotorRecords));

verifyPublicMd('/catalog.md', 'catalog.md', ['## Motors', '## Case studies', '## Locations', '## Guides (Blog)', 'CAD', 'Pickup only', 'mcp.json', 'What we do NOT offer', 'No sterndrives', 'pricing-reference.md', "Ontario's Mercury Repower Centre"]);
verifyPublicMd('/pricing-reference.md', 'pricing-reference.md', ['currency: CAD', 'pickup_only: true', '## FourStroke', '## Pro XS', 'What is NOT in this reference', 'Verado', 'Sterndrives', 'Available to order', 'same selection rules as /quote/motor-selection']);

// Verify pricing-reference motor count matches the quote-builder selection
// (NOT public-motors-api). Compare the count in frontmatter against the
// expected quote-builder universe (priced, non-Verado).
{
  const expectedCount = quoteBuilderMotorRecords.filter(m => {
    const s = (m.model_display || m.model || '').toLowerCase();
    if (s.includes('verado')) return false;
    return resolveMotorSellingPrice(m) > 0;
  }).length;
  const path = join(PUBLIC, 'pricing-reference.md');
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^motor_count:\s*(\d+)\s*$/m);
  if (!match) throw new Error('[markdown-twins] pricing-reference.md missing motor_count in frontmatter');
  const written = Number(match[1]);
  if (written !== expectedCount) {
    throw new Error(`[markdown-twins] pricing-reference.md motor_count mismatch: frontmatter=${written}, quote-builder selection=${expectedCount}`);
  }
  console.log(`[markdown-twins] ✓ pricing-reference.md motor_count=${written} matches quote-builder selection (${expectedCount})`);
}

if (motorTwinSummaries[0]) verifyPublicMd(motorTwinSummaries[0].path, 'sample motor twin', ['canonical:', 'currency: CAD', 'pickup_only: true', 'Build a quote', 'Public Quote API', 'public-quote-api']);
if (caseStudyTwinSummaries[0]) verifyPublicMd(caseStudyTwinSummaries[0].path, 'sample case study twin', ['canonical:', 'Mercury', '## Customer quote', '## Recommendation']);
if (locationTwinSummaries[0]) verifyPublicMd(locationTwinSummaries[0].path, 'sample location twin', ['canonical:', 'Gores Landing', '## FAQs', '## Popular Mercury HP ranges', 'service_area_type: sales-catchment']);
if (blogTwinSummaries[0]) verifyPublicMd(blogTwinSummaries[0].path, 'sample blog twin', ['canonical:', 'currency: CAD', 'pickup_only: true', 'content_type: blog_article', '## Article', '## FAQs', '## Next steps']);


if (motorTwinSummaries.length === 0 || caseStudyTwinSummaries.length === 0 || locationTwinSummaries.length === 0 || blogTwinSummaries.length === 0) {
  throw new Error(`[markdown-twins] Refusing empty generation: motors=${motorTwinSummaries.length}, caseStudies=${caseStudyTwinSummaries.length}, locations=${locationTwinSummaries.length}, blog=${blogTwinSummaries.length}`);
}

console.log(`[markdown-twins] ✓ public markdown twins written before Vite build: ${motorTwinSummaries.length} motors, ${caseStudyTwinSummaries.length} case studies, ${locationTwinSummaries.length} locations, ${blogTwinSummaries.length} blog guides, 1 catalog, 1 pricing-reference`);

