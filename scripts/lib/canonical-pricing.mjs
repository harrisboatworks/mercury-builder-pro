// Shared Node helper: parses public/pricing-reference.md into a structured
// canonical pricing model. Used by generate / reconcile / drift-check scripts.

import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PRICING_MD = path.join(ROOT, 'public/pricing-reference.md');

const ROW_RX =
  /^\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*([A-Z0-9]+)\s*\|.*?\|\s*\$([\d,]+)\s*_\(MSRP \$([\d,]+)\)_\s*\|\s*([^|]+?)\s*\|/;

function num(s) {
  return Number(String(s).replace(/[,$]/g, ''));
}

export function slugifyModel(model) {
  return String(model)
    .toLowerCase()
    .replace(/\bfourstroke\b/g, 'fourstroke')
    .replace(/\bpro\s*xs\b/g, 'pro-xs')
    .replace(/\bcommand\s*thrust\b/g, 'ct')
    .replace(/\bprokicker\b/g, 'prokicker')
    .replace(/\befi\b/g, 'efi')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\./g, '-');
}

export function loadCanonicalPricing() {
  const raw = readFileSync(PRICING_MD, 'utf8');
  const lines = raw.split('\n');
  let family = '';
  const skus = []; // { partNo, model, family, hp, dealer, msrp, status, slug }

  for (const line of lines) {
    const fam = line.match(/^##\s+(FourStroke|Pro\s*XS|SeaPro|Verado)\b/i);
    if (fam) {
      family = fam[1].replace(/\s+/g, '');
      continue;
    }
    const m = line.match(ROW_RX);
    if (!m) continue;
    const [, hp, model, partNo, dealer, msrp, status] = m;
    skus.push({
      partNo,
      model: model.trim(),
      family,
      hp: Number(hp),
      dealer: num(dealer),
      msrp: num(msrp),
      status: status.trim(),
      slug: slugifyModel(model),
    });
  }

  const byPartNo = new Map(skus.map((s) => [s.partNo, s]));
  const bySlug = new Map(skus.map((s) => [s.slug, s]));

  // Aggregate ranges by HP bracket / category (for cost-stack ranges)
  const ranges = {
    portable_2_5_to_20: bracket(skus, (s) => s.hp >= 2.5 && s.hp <= 20),
    midrange_25_to_60: bracket(skus, (s) => s.hp >= 25 && s.hp <= 60),
    midrange_60_to_115: bracket(skus, (s) => s.hp >= 60 && s.hp <= 115 && s.family !== 'ProXS'),
    fourstroke_75_to_115: bracket(skus, (s) => s.hp >= 75 && s.hp <= 115 && s.family === 'FourStroke'),
    proxs_115: bracket(skus, (s) => s.hp === 115 && s.family === 'ProXS'),
    hp_150_all: bracket(skus, (s) => s.hp === 150),
    v6_175_to_250: bracket(skus, (s) => s.hp >= 175 && s.hp <= 250),
    hp_300: bracket(skus, (s) => s.hp === 300),
    kicker_9_9: bracket(skus, (s) => s.hp === 9.9),
    full_lineup: bracket(skus, () => true),
  };

  return { skus, byPartNo, bySlug, ranges, lastUpdated: extractLastUpdated(raw) };
}

function bracket(skus, pred) {
  const matched = skus.filter(pred);
  if (!matched.length) return null;
  const dealers = matched.map((s) => s.dealer);
  const msrps = matched.map((s) => s.msrp);
  return {
    count: matched.length,
    dealerMin: Math.min(...dealers),
    dealerMax: Math.max(...dealers),
    msrpMin: Math.min(...msrps),
    msrpMax: Math.max(...msrps),
  };
}

function extractLastUpdated(raw) {
  const m = raw.match(/last_updated:\s*([\d-]+)/);
  return m ? m[1] : null;
}

// --- Derived financial helpers (same formula used in src/lib/finance.ts) ---

export function monthlyPayment(principal, aprPct, termMonths) {
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function defaultRate(price) {
  return price < 10000 ? 8.99 : 7.99;
}

// 10-year ownership cost estimate (motor only, before HST/install).
// Returns canonical figure used in ownership comparisons across blog posts.
export function tenYearOwnership(price) {
  // Dealer-side baseline: motor + ~$3k routine service + ~$1.5k consumables
  return price + 3000 + 1500;
}
