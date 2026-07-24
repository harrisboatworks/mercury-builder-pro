#!/usr/bin/env node
/**
 * Blog Timeline / Factual Validator
 * ---------------------------------
 * Hard-enforces known timeline facts about Harris Boat Works inside every
 * blog article's prose (content + description). Fails the build if any
 * article disagrees with the source-of-truth values below.
 *
 *   Owner takeover year ........ 2016  (Jay Harris took over)
 *   Founder year ............... 1947  (grandfather George founded)
 *   Current calendar year ...... 2026  (present-tense references)
 *   Dealership age ............. CURRENT_YEAR - 1947
 *
 * Run: `npm run check:blog-timeline-facts` (also wired into prebuild).
 */
import { readFileSync, readdirSync } from 'node:fs';

const OWNER_TAKEOVER_YEAR = 2016;
const FOUNDER_YEAR = 1947;
const CURRENT_YEAR = 2026;
const EXPECTED_AGE = CURRENT_YEAR - FOUNDER_YEAR; // 79

const BLOG_LANG_RX = /^(mandarin|korean|french|spanish|hindi|punjabi|tagalog|urdu|traditionalChinese)BlogArticles\.ts$/;
const BLOG_FILES = readdirSync('src/data')
  .filter((f) => f === 'blogArticles.ts' || BLOG_LANG_RX.test(f))
  .map((f) => `src/data/${f}`);

// Extract every { slug: '...', ..., content: `...`, ..., description: '...' }
// chunk. We keep this regex-based (no TS parse) because the file is a flat
// array literal and the fields use predictable quoting.
function extractArticles(src) {
  const articles = [];
  const slugRx = /slug:\s*['"]([^'"]+)['"]/g;
  let m;
  const positions = [];
  while ((m = slugRx.exec(src)) !== null) positions.push({ slug: m[1], start: m.index });
  positions.push({ slug: null, start: src.length });
  for (let i = 0; i < positions.length - 1; i++) {
    const block = src.slice(positions[i].start, positions[i + 1].start);
    const content = readTemplate(block, 'content');
    const description = readQuoted(block, 'description');
    articles.push({ slug: positions[i].slug, content, description, blockStart: positions[i].start });
  }
  return articles;
}

function readTemplate(block, field) {
  const rx = new RegExp(`${field}:\\s*\``);
  const m = block.match(rx);
  if (!m) return '';
  const start = m.index + m[0].length;
  let i = start;
  while (i < block.length) {
    if (block[i] === '\\') { i += 2; continue; }
    if (block[i] === '`') return block.slice(start, i);
    i++;
  }
  return block.slice(start);
}

function readQuoted(block, field) {
  const rx = new RegExp(`${field}:\\s*(['"])((?:\\\\.|(?!\\1).)*)\\1`, 's');
  const m = block.match(rx);
  return m ? m[2] : '';
}

const errors = [];
const push = (file, slug, rule, snippet) =>
  errors.push({ file, slug, rule, snippet: snippet.trim().slice(0, 160) });

// Sentence-ish window helper for context-sensitive rules.
function* sentences(text) {
  const parts = text.split(/(?<=[.!?])\s+|\n+/);
  for (const p of parts) if (p && p.trim()) yield p;
}

// ----- Rules -----------------------------------------------------------------

// R1: owner takeover year
const TOOK_OVER_RX = /\btook\s+over\b[^.\n]{0,80}?\b(19|20)\d{2}\b/gi;
const TOOK_OVER_YEAR_RX = /\btook\s+over\b[^.\n]{0,80}?\b((?:19|20)\d{2})\b/i;
function checkTakeover(text, push) {
  const matches = text.match(TOOK_OVER_RX) || [];
  for (const m of matches) {
    const y = Number(m.match(TOOK_OVER_YEAR_RX)?.[1]);
    if (y && y !== OWNER_TAKEOVER_YEAR) push('takeover-year', `${m} (expected ${OWNER_TAKEOVER_YEAR})`);
  }
}

// R2: founder year (in same sentence as a founder cue word)
const FOUNDER_CUE_RX = /\b(George|grandfather|founded|founding)\b/i;
const FOUNDED_YEAR_RX = /\b(founded|started|opened|established)\b[^.\n]{0,80}?\b((?:19|20)\d{2})\b/i;
function checkFounder(text, push) {
  for (const s of sentences(text)) {
    if (!FOUNDER_CUE_RX.test(s)) continue;
    const fm = s.match(FOUNDED_YEAR_RX);
    if (fm) {
      const y = Number(fm[2]);
      if (y !== FOUNDER_YEAR) push('founder-year', `${s} (expected ${FOUNDER_YEAR})`);
    }
  }
}

// R3: dealership age
const AGE_RX = /\b(\d{1,3})\s*(?:\+)?\s*[-\u2013]?\s*years?\s+(?:in\s+business|of\s+business|operating|serving|in\s+operation|of\s+service|family[\s-](?:owned|run))/gi;
function checkAge(text, push) {
  const matches = text.match(AGE_RX) || [];
  for (const m of matches) {
    const n = Number(m.match(/\d{1,3}/)[0]);
    // Allow +/- 1 because "almost 80" / "80 years" rounding is fine.
    if (Math.abs(n - EXPECTED_AGE) > 1) push('dealership-age', `${m} (expected ~${EXPECTED_AGE} years since ${FOUNDER_YEAR})`);
  }
  // "since YYYY" only when the surrounding clause ties the year to the
  // FOUNDING / family ownership of the business. "Mercury dealer since 1965"
  // is a separate, legitimate milestone (year HBW became a Mercury dealer)
  // and must not trip this rule.
  const SINCE_RX = /\b(?:family[\s-](?:owned|run|operated)|in\s+business|in\s+operation|business\s+founded|operating|serving\s+Ontario)[^.\n]{0,40}?\bsince\s+((?:19|20)\d{2})\b/gi;
  let sm;
  while ((sm = SINCE_RX.exec(text)) !== null) {
    const y = Number(sm[1]);
    if (y !== FOUNDER_YEAR) {
      push('since-year', `${sm[0]} (family-ownership claim must be since ${FOUNDER_YEAR})`);
    }
  }

}

// R4: present-tense "this year/season" claims must agree with CURRENT_YEAR.
// We intentionally exclude "as of <Month> <day>, YYYY" because that is a
// regulatory effective-date construction (the year is just the date suffix,
// not a "this year" claim).
const PRESENT_RX = /\b(?:this\s+(?:year|season|spring|summer|fall|winter)|currently|right\s+now)\b[^.\n]{0,40}?\b((?:19|20)\d{2})\b/gi;
function checkPresent(text, push) {
  let m;
  while ((m = PRESENT_RX.exec(text)) !== null) {
    const y = Number(m[1]);
    if (y !== CURRENT_YEAR) push('present-year', `${m[0]} (expected ${CURRENT_YEAR})`);
  }
}

// R5: article-specific operating contracts that previously drifted back into
// customer-facing copy. Keep these semantic and narrow: they protect durable
// HBW business rules without turning ordinary wording changes into failures.
const GTA_DRIVE_IN_REQUIRED = [
  {
    rx: /closed December 1 through April 1/i,
    rule: 'winter-closure',
  },
  {
    rx: /does not pick up, deliver, haul, provide mobile service, coordinate transport, (?:or )?recommend transport providers/i,
    rule: 'customer-transport-only',
  },
];

const GTA_DRIVE_IN_FORBIDDEN = [
  {
    rx: /commercial boat transport services|work with several Ontario marine transport services/i,
    rule: 'no-third-party-transport',
  },
  {
    rx: /\$(?:300-\$500|300-\$600) each way/i,
    rule: 'no-third-party-transport-pricing',
  },
  {
    rx: /we can refer|recommend local towing services/i,
    rule: 'no-transport-referrals',
  },
  {
    rx: /maintenance during the off-season|everything happens while the boat is stored/i,
    rule: 'no-winter-shop-work',
  },
  {
    rx: /off-season weekend hours are reduced/i,
    rule: 'winter-closure',
  },
];

const ARTICLE_CONTRACTS = {
  'winter-storage-near-toronto-hbw': {
    required: [
      {
        rx: /outdoor shrinkwrap storage only/i,
        rule: 'storage-outdoor-only',
      },
      {
        rx: /closed December 1 through April 1/i,
        rule: 'winter-closure',
      },
      {
        rx: /does not provide pickup, delivery, hauling, mobile service, or transport referrals/i,
        rule: 'customer-transport-only',
      },
    ],
    forbidden: [
      {
        rx: /indoor unheated \(limited availability/i,
        rule: 'no-indoor-storage',
      },
      {
        rx: /battery removal\s*\+\s*indoor trickle charge/i,
        rule: 'battery-disconnect-not-removal',
      },
      {
        rx: /shop bandwidth November-March/i,
        rule: 'no-winter-shop-work',
      },
      {
        rx: /let you in for inspection/i,
        rule: 'no-winter-customer-access',
      },
      {
        rx: /commercial boat transport \(\$\d/i,
        rule: 'no-third-party-transport-pricing',
      },
      {
        rx: /\$(?:33|35)\/ft/i,
        rule: 'no-stale-fixed-storage-rate',
      },
      {
        rx: /spring commissioning add-on[^\n]*\$300-\$500/i,
        rule: 'commissioning-price-canon',
      },
      {
        rx: /attribution:\s*Ken F\./i,
        rule: 'no-fabricated-testimonial',
      },
      {
        rx: /we periodically inspect storage areas/i,
        rule: 'no-winter-yard-inspections',
      },
    ],
  },
  'winter-boat-storage-shrinkwrap-vs-indoor-ontario': {
    required: [
      {
        rx: /HBW offers outdoor shrinkwrap storage only/i,
        rule: 'storage-outdoor-only',
      },
      {
        rx: /don't offer indoor, heated, climate-controlled, or year-round storage/i,
        rule: 'no-indoor-or-year-round-storage',
      },
      {
        rx: /closed December 1 through April 1/i,
        rule: 'winter-closure',
      },
      {
        rx: /don't provide pickup, delivery, hauling, mobile service, or transport referrals/i,
        rule: 'customer-transport-only',
      },
      {
        rx: /included for HBW winter-storage customers[\s\S]{0,120}\$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
    ],
    forbidden: [
      {
        rx: /we do both/i,
        rule: 'no-indoor-storage',
      },
      {
        rx: /mobile shrinkwrap service/i,
        rule: 'no-mobile-service',
      },
      {
        rx: /HBW pricing 2025-2026/i,
        rule: 'no-stale-storage-pricing',
      },
      {
        rx: /\$(?:33|35)\/ft/i,
        rule: 'no-stale-fixed-storage-rate',
      },
      {
        rx: /we can refer you to dealers/i,
        rule: 'no-unverified-referrals',
      },
      {
        rx: /access the boat through winter/i,
        rule: 'no-winter-customer-access',
      },
      {
        rx: /deliver to your slip/i,
        rule: 'no-delivery',
      },
      {
        rx: /311\+ storage contracts|300-400 boats/i,
        rule: 'no-unverified-storage-volume',
      },
      {
        rx: /spring commissioning add-on/i,
        rule: 'commissioning-price-canon',
      },
    ],
  },
  'outdoor-boat-storage-shrinkwrap-rice-lake': {
    required: [
      {
        rx: /offers outdoor winter boat storage with shrinkwrap/i,
        rule: 'storage-outdoor-only',
      },
      {
        rx: /do not offer indoor, heated, climate-controlled, or year-round storage/i,
        rule: 'no-indoor-or-year-round-storage',
      },
      {
        rx: /closed December 1 through April 1/i,
        rule: 'winter-closure',
      },
      {
        rx: /does not pick up, deliver, haul, provide mobile service, arrange transport, recommend transport providers, or quote transport prices/i,
        rule: 'customer-transport-only',
      },
      {
        rx: /included for HBW winter-storage customers[\s\S]{0,120}\$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
      {
        rx: /battery is healthy, disconnected[\s\S]{0,120}Battery removal is not a universal requirement/i,
        rule: 'battery-disconnect-not-removal',
      },
    ],
    forbidden: [
      {
        rx: /fenced, monitored lot|Fenced, with cameras|on-site daily through the off-season|staffed daily through the off-season/i,
        rule: 'no-winter-staffing-or-security-promise',
      },
      {
        rx: /We patch it|check the lot after big storms/i,
        rule: 'no-winter-yard-inspections',
      },
      {
        rx: /point you to other shops/i,
        rule: 'no-unverified-referrals',
      },
      {
        rx: /2–3× outdoor storage|small discount over booking them separately/i,
        rule: 'no-unsupported-storage-pricing',
      },
      {
        rx: /Spring commissioning \(separate service|Spring commissioning is priced by/i,
        rule: 'commissioning-price-canon',
      },
      {
        rx: /30 feet\. We're not taking|Anything over 28 ft/i,
        rule: 'no-fixed-storage-size-limit',
      },
      {
        rx: /Battery removal \(or trickle-charge setup\)|Fog the engine cylinders|¾ to full tank/i,
        rule: 'no-universal-winterization-shortcuts',
      },
      {
        rx: /we charge for the re-wrap/i,
        rule: 'no-unverified-rewrap-charge',
      },
    ],
  },
  'best-marina-rice-lake-ontario': {
    required: [
      {
        rx: /has operated in Gores Landing since 1947[\s\S]{0,100}Mercury Marine Premier dealer/i,
        rule: 'history-and-dealer-status',
      },
      {
        rx: /engine repairs are limited to Mercury and MerCruiser/i,
        rule: 'mercury-service-only',
      },
      {
        rx: /does not pick up, deliver, haul, provide mobile service, coordinate transport, recommend transport providers, or quote transport prices/i,
        rule: 'customer-transport-only',
      },
      {
        rx: /outdoor winter storage with shrinkwrap[\s\S]{0,180}does not offer indoor, heated, climate-controlled, summer, or year-round storage/i,
        rule: 'storage-outdoor-only',
      },
      {
        rx: /closed December 1 through April 1/i,
        rule: 'winter-closure',
      },
      {
        rx: /included for HBW winter-storage customers[\s\S]{0,120}\$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
      {
        rx: /may remain in place when disconnected[\s\S]{0,160}removal is not a universal requirement/i,
        rule: 'battery-disconnect-not-removal',
      },
      {
        rx: /Plan pickup only after HBW confirms the approved work is complete/i,
        rule: 'no-ready-to-run-promise',
      },
      {
        rx: /Travel time depends on the starting point, traffic, weather, road work, and whether you are towing/i,
        rule: 'no-fixed-drive-time',
      },
    ],
    forbidden: [
      {
        rx: /oldest marina on Rice Lake|oldest continuously operating Mercury dealer|only Premier dealer|closest full-service Mercury marina/i,
        rule: 'no-unsupported-superlative',
      },
      {
        rx: /65 seasonal slips|About 35-90 minutes|Downtown Toronto \| ~90 minutes|Markham \| ~75 minutes|Mississauga \| ~110 minutes/i,
        rule: 'no-unverified-capacity-or-drive-times',
      },
      {
        rx: /available by phone, text, or email anytime|season opens early April|earliest spring install slots/i,
        rule: 'winter-closure',
      },
      {
        rx: /bad coil pack on Friday afternoon doesn't kill your long weekend|Friday-afternoon problem does not eat a long weekend/i,
        rule: 'no-turnaround-promise',
      },
      {
        rx: /Most common service items are in the building|Less common parts ship in one to two business days|source bizarre 1990s Mercruiser parts in a day or two/i,
        rule: 'no-parts-availability-promise',
      },
      {
        rx: /Factory-trained technicians[\s\S]{0,240}Training is renewed annually/i,
        rule: 'no-unsupported-certification-detail',
      },
      {
        rx: /typically bundle winterization[\s\S]{0,180}ready to launch|pick it up ready to run|plan the timeline so you only need to drive out once or twice/i,
        rule: 'no-ready-to-run-or-trip-count-promise',
      },
      {
        rx: /point you to other shops|recommend a qualified mechanic/i,
        rule: 'no-unverified-referrals',
      },
      {
        rx: /every service a Mercury-powered boat needs|nothing gets handed off to a third shop/i,
        rule: 'no-universal-service-scope',
      },
    ],
  },
  'boat-winterization-cost-ontario-2026': {
    required: [
      {
        rx: /does not publish a one-price-fits-all winterization range/i,
        rule: 'no-unapproved-winterization-pricing',
      },
      {
        rx: /spring commissioning is included for HBW winter-storage customers and is \$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
      {
        rx: /closed December 1 through April 1/i,
        rule: 'winter-closure',
      },
      {
        rx: /does not pick up, deliver, haul, provide mobile service, arrange transport, recommend transport providers, or quote transport prices/i,
        rule: 'customer-transport-only',
      },
      {
        rx: /outdoor winter storage with shrinkwrap only[\s\S]{0,180}do not offer indoor, heated, climate-controlled, summer, or year-round storage/i,
        rule: 'storage-outdoor-only',
      },
      {
        rx: /healthy battery may remain in the boat[\s\S]{0,180}Removal is not a universal HBW requirement/i,
        rule: 'battery-disconnect-not-removal',
      },
      {
        rx: /can winterize other engine brands[\s\S]{0,120}Engine repairs are limited to Mercury and MerCruiser/i,
        rule: 'winterization-versus-repair-scope',
      },
      {
        rx: /584 winterizations from August through November 2025/i,
        rule: 'verified-winterization-volume',
      },
      {
        rx: /Plan pickup or launch only after HBW confirms the authorized work is complete/i,
        rule: 'no-ready-to-launch-promise',
      },
    ],
    forbidden: [
      {
        rx: /\$250\s*(?:to|[-–])\s*\$400|\$30\s*(?:to|[-–])\s*\$50|\$50\s*(?:to|[-–])\s*\$80|\$50\s*(?:to|[-–])\s*\$90|\$40\s*(?:to|[-–])\s*\$70|\$25\s*(?:to|[-–])\s*\$50/i,
        rule: 'no-rejected-winterization-ranges',
      },
      {
        rx: /\$549 winterization|\$2,000\s*(?:to|[-–])\s*\$5,000|\$1,500\s*(?:to|[-–])\s*\$4,500/i,
        rule: 'no-unsupported-repair-pricing',
      },
      {
        rx: /9\.9 HP tiller is a 90-minute job|250 HP V8 Verado is a 3-hour job/i,
        rule: 'no-unsupported-labour-times',
      },
      {
        rx: /available by phone, text, or email anytime|pickups resume in early April/i,
        rule: 'winter-closure',
      },
      {
        rx: /point you to the right options|worth the premium at another shop/i,
        rule: 'no-unverified-referrals',
      },
      {
        rx: /In-shop wrap costs less|Outdoor wrap costs slightly more|priced per foot/i,
        rule: 'no-unapproved-shrinkwrap-pricing',
      },
      {
        rx: /your slot is already locked|locks in your spring launch slot|booking early gets you the better slot|smarter and cheaper choice/i,
        rule: 'no-slot-or-savings-promise',
      },
      {
        rx: /under 60 HP|90 HP and up/i,
        rule: 'no-generic-diy-horsepower-threshold',
      },
      {
        rx: /Quickstor added to the fuel and run through the entire fuel system|Water pump inspection[\s\S]{0,100}Impeller condition checked/i,
        rule: 'no-universal-winterization-procedure',
      },
    ],
  },
  'boat-storage-kawartha-lakes': {
    required: [
      {
        rx: /provides outdoor winter storage with shrinkwrap/i,
        rule: 'storage-outdoor-only',
      },
      {
        rx: /do not (?:provide|offer) indoor, heated, climate-controlled, summer, or year-round storage/i,
        rule: 'no-indoor-summer-or-year-round-storage',
      },
      {
        rx: /closed December 1 through April 1/i,
        rule: 'winter-closure',
      },
      {
        rx: /does not pick up, deliver, haul, provide mobile service, arrange transport, recommend transport providers, or quote transport prices/i,
        rule: 'customer-transport-only',
      },
      {
        rx: /included for HBW winter-storage customers[\s\S]{0,120}\$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
      {
        rx: /may remain in place when it is healthy, disconnected[\s\S]{0,160}removal is not a universal requirement/i,
        rule: 'battery-disconnect-not-removal',
      },
      {
        rx: /engine repairs are limited to Mercury and MerCruiser/i,
        rule: 'mercury-service-only',
      },
    ],
    forbidden: [
      {
        rx: /fenced, monitored, staffed daily|staffed daily through the off-season|Secure storage area/i,
        rule: 'no-winter-staffing-or-security-promise',
      },
      {
        rx: /Visual checks through winter after storms/i,
        rule: 'no-winter-yard-inspections',
      },
      {
        rx: /several hundred dollars|roughly a thousand dollars|low-to-mid hundreds/i,
        rule: 'no-unsupported-storage-pricing',
      },
      {
        rx: /About half our storage customers/i,
        rule: 'no-unsupported-customer-volume',
      },
      {
        rx: /bundling saves you money/i,
        rule: 'no-unsupported-bundle-discount',
      },
      {
        rx: /same morning|Saturday morning and be on the water by noon|first nice day in April/i,
        rule: 'no-spring-turnaround-promise',
      },
      {
        rx: /Battery pulled and trickle-charged|Battery removal or trickle-charge setup/i,
        rule: 'battery-disconnect-not-removal',
      },
      {
        rx: /we can still winterize it, store it, and commission it in spring|recommend a qualified mechanic/i,
        rule: 'mercury-service-only',
      },
      {
        rx: /Pigeon Lake \| about 45 min|Sturgeon Lake \| 20–25 min|Buckhorn Lake \| 30–35 min|Stoney Lake \| 25–30 min/i,
        rule: 'no-unverified-drive-times',
      },
    ],
  },
  'mercury-outboard-dealer-toronto-why-drive-to-hbw': {
    required: GTA_DRIVE_IN_REQUIRED,
    forbidden: [
      ...GTA_DRIVE_IN_FORBIDDEN,
      {
        rx: /\$1,500-\$3,000 less/i,
        rule: 'no-unsupported-savings-range',
      },
    ],
  },
  'mercury-repower-gta-toronto-destination': {
    required: GTA_DRIVE_IN_REQUIRED,
    forbidden: [
      ...GTA_DRIVE_IN_FORBIDDEN,
      {
        rx: /GTA boaters drive past three or four|labour rate[^.\n]*\$40-60/i,
        rule: 'no-unsupported-competitor-statistics',
      },
      {
        rx: /Typical ranges:\s*90 HP install|\$15,500-\$18,500|\$23,000-\$30,000|\$28,000-\$35,000/i,
        rule: 'no-stale-repower-price-ranges',
      },
    ],
  },
  'boat-service-near-toronto-hbw-reach': {
    required: [
      ...GTA_DRIVE_IN_REQUIRED,
      {
        rx: /included for HBW winter-storage customers[\s\S]{0,120}\$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
    ],
    forbidden: [
      ...GTA_DRIVE_IN_FORBIDDEN,
      {
        rx: /attribution:\s*Marco S\./i,
        rule: 'no-fabricated-testimonial',
      },
      {
        rx: /Spring commissioning[^\n]*\$300-\$500|Diagnostic fee \$80-\$120|\$200-\$400|\$500-\$700 all-in/i,
        rule: 'no-unsupported-service-price-ranges',
      },
    ],
  },
  'toronto-to-rice-lake-drive-in-process': {
    required: [
      ...GTA_DRIVE_IN_REQUIRED,
      {
        rx: /included for HBW winter-storage customers[\s\S]{0,120}\$99 for non-storage customers/i,
        rule: 'commissioning-price-canon',
      },
    ],
    forbidden: [
      ...GTA_DRIVE_IN_FORBIDDEN,
      {
        rx: /safe limp-home or temporary fix/i,
        rule: 'no-unsafe-generic-recovery',
      },
      {
        rx: /one drive[\s\S]{0,80}(?:pickup|stored|storage)/i,
        rule: 'dropoff-and-pickup-are-two-trips',
      },
    ],
  },
};

function checkArticleContract(slug, text, push) {
  const contract = ARTICLE_CONTRACTS[slug];
  if (!contract) return;
  for (const check of contract.required) {
    if (!check.rx.test(text)) push(check.rule, `Required operating rule is missing from ${slug}`);
  }
  for (const check of contract.forbidden) {
    const match = text.match(check.rx);
    if (match) push(check.rule, match[0]);
  }
}


// ----- Drive ----------------------------------------------------------------

for (const file of BLOG_FILES) {
  const src = readFileSync(file, 'utf8');
  const articles = extractArticles(src);
  for (const a of articles) {
    const text = `${a.description}\n${a.content}`;
    const localPush = (rule, snippet) => push(file, a.slug, rule, snippet);
    checkTakeover(text, localPush);
    checkFounder(text, localPush);
    checkAge(text, localPush);
    checkPresent(text, localPush);
    checkArticleContract(a.slug, text, localPush);
  }
}

if (errors.length) {
  console.error(`\nBlog timeline-fact validation FAILED - ${errors.length} issue(s):\n`);
  const byFile = new Map();
  for (const e of errors) {
    const key = `${e.file} :: ${e.slug}`;
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push(e);
  }
  for (const [k, list] of byFile) {
    console.error(`  [${k}]`);
    for (const e of list) console.error(`    - ${e.rule}: ${e.snippet}`);
  }
  console.error(`\nSource of truth: owner took over ${OWNER_TAKEOVER_YEAR}, founded ${FOUNDER_YEAR}, current year ${CURRENT_YEAR}.\n`);
  process.exit(1);
} else {
  console.log(`Blog timeline-fact validation PASSED - ${BLOG_FILES.length} file(s) checked.`);
}
