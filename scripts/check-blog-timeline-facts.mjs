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
