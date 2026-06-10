#!/usr/bin/env node
/**
 * Blog Quality / Freshness Report (read-only)
 * --------------------------------------------
 * Walks src/data/blogArticles.ts (EN) and src/data/frenchBlogArticles.ts (FR)
 * and reports per-article freshness/quality issues. Does NOT modify content.
 *
 * Checks per article:
 *  - stale-date    : "Last reviewed:" (EN) / "Dernière révision" (FR) > 90 days
 *                    OR missing entirely; also flags if dateModified > 90 days
 *                    and no review line.
 *  - no-faq        : empty/missing `faqs` array AND no "## Frequently Asked"
 *                    / "## FAQ" / "## FAQs" H2 in content.
 *  - no-quick-answer : no "Quick answer" / "Quick Answer" / "Réponse rapide" near top.
 *  - no-shop-card  : content lacks an HBW shop/operations H2 pattern
 *                    (e.g. "## What we see at HBW", "## Related at HBW",
 *                    "## The HBW ...", "## What we do at Harris Boat Works").
 *  - no-related    : no "## Related guides" / "## Related posts" / "## Related at HBW"
 *                    / "Guides connexes" H2.
 *  - words:NNN     : body word count < 800 or > 4000.
 *
 * Always exits 0. Report tool, not a build gate.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const EN_PATH = resolve(repoRoot, 'src/data/blogArticles.ts');
const FR_PATH = resolve(repoRoot, 'src/data/frenchBlogArticles.ts');

// ---- TS loader (lightweight) -------------------------------------------------
// We reuse the trick from other check scripts: load via tsx if available,
// otherwise hand-extract the export array. Simplest robust path is tsx.
async function loadArticles(absPath) {
  const require_ = createRequire(import.meta.url);
  // Try tsx register
  try {
    require_.resolve('tsx');
    await import('tsx/esm');
  } catch {
    // fallthrough
  }
  const mod = await import(pathToFileURL(absPath).href);
  return mod;
}

// ---- Helpers -----------------------------------------------------------------
const NOW = new Date();
const DAY_MS = 86400000;
const STALE_DAYS = 90;

const STALE_DATE_RE_EN = /Last reviewed:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i;
const STALE_DATE_RE_FR = /Derni[èe]re r[ée]vision\s*[:\-]?\s*([A-Za-z\u00C0-\u017F]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z\u00C0-\u017F]+\s+\d{4})/i;

const QUICK_ANSWER_RE = /(Quick answer|Quick Answer|R[ée]ponse rapide)/;
const FAQ_H2_RE = /^##\s+(Frequently Asked Questions?|FAQs?|Questions fr[ée]quentes|FAQ)\b/m;
const RELATED_H2_RE = /^##\s+(Related guides|Related posts|Related at HBW|Guides connexes)\b/mi;
const SHOP_CARD_RE = /^##\s+(What we see at HBW|What We See at HBW|Related at HBW|The HBW [A-Za-z]|What we do at Harris Boat Works|From the Shop|Au magasin|Chez HBW)\b/mi;

function wordCount(s) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}

function parseReviewedDate(content, lang) {
  const re = lang === 'fr' ? STALE_DATE_RE_FR : STALE_DATE_RE_EN;
  const m = content.match(re);
  if (!m) return null;
  const d = new Date(m[1]);
  return isNaN(d.getTime()) ? null : d;
}

function daysAgo(d) {
  return Math.floor((NOW.getTime() - d.getTime()) / DAY_MS);
}

function evaluate(article, lang) {
  const issues = [];
  const content = article.content || '';

  // 1. Stale date
  const reviewed = parseReviewedDate(content, lang);
  if (!reviewed) {
    const dm = article.dateModified ? new Date(article.dateModified) : null;
    if (!dm || isNaN(dm.getTime()) || daysAgo(dm) > STALE_DAYS) {
      issues.push('stale-date');
    }
  } else if (daysAgo(reviewed) > STALE_DAYS) {
    issues.push('stale-date');
  }

  // 2. FAQ
  const hasFaqsArr = Array.isArray(article.faqs) && article.faqs.length > 0;
  const hasFaqH2 = FAQ_H2_RE.test(content);
  if (!hasFaqsArr && !hasFaqH2) issues.push('no-faq');

  // 3. Quick answer (check top 1500 chars to enforce "near the top")
  const top = content.slice(0, 1500);
  if (!QUICK_ANSWER_RE.test(top)) issues.push('no-quick-answer');

  // 4. Shop card
  if (!SHOP_CARD_RE.test(content)) issues.push('no-shop-card');

  // 5. Related guides
  if (!RELATED_H2_RE.test(content)) issues.push('no-related');

  // 6. Word count outliers
  const wc = wordCount(content);
  if (wc < 800 || wc > 4000) issues.push(`words:${wc}`);

  return issues;
}

// ---- Main --------------------------------------------------------------------
async function main() {
  const enMod = await loadArticles(EN_PATH);
  const frMod = await loadArticles(FR_PATH);
  const en = enMod.blogArticles || [];
  const fr = frMod.frenchBlogArticles || [];

  const rows = [];
  const summary = {
    'stale-date': 0,
    'no-faq': 0,
    'no-quick-answer': 0,
    'no-shop-card': 0,
    'no-related': 0,
    'words-outlier': 0,
  };

  function walk(list, lang) {
    for (const a of list) {
      const issues = evaluate(a, lang);
      if (issues.length === 0) continue;
      for (const i of issues) {
        if (i.startsWith('words:')) summary['words-outlier']++;
        else if (summary[i] !== undefined) summary[i]++;
      }
      rows.push({ slug: a.slug, lang, issues });
    }
  }

  walk(en, 'en');
  walk(fr, 'fr');

  rows.sort((a, b) => b.issues.length - a.issues.length || a.slug.localeCompare(b.slug));

  const out = [];
  out.push(`# Blog Quality Report`);
  out.push('');
  out.push(`Run: ${NOW.toISOString()}`);
  out.push(`Articles scanned: ${en.length + fr.length} (EN: ${en.length}, FR: ${fr.length})`);
  out.push(`Articles flagged: ${rows.length}`);
  out.push('');
  out.push(`## Summary`);
  out.push('');
  out.push('| Check | Count |');
  out.push('|---|---|');
  for (const [k, v] of Object.entries(summary)) {
    out.push(`| ${k} | ${v} |`);
  }
  out.push('');
  out.push(`## Flagged articles`);
  out.push('');
  if (rows.length === 0) {
    out.push('_No issues found._');
  } else {
    out.push('| slug | lang | issues |');
    out.push('|---|---|---|');
    for (const r of rows) {
      out.push(`| ${r.slug} | ${r.lang} | ${r.issues.join(', ')} |`);
    }
  }
  out.push('');

  console.log(out.join('\n'));
}

main().catch((e) => {
  console.error('blog-quality-report failed:', e);
  process.exit(0); // never gate the build
});
