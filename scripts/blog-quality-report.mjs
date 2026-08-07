#!/usr/bin/env node
/**
 * Blog Quality / Freshness Report (read-only)
 * --------------------------------------------
 * Walks src/data/blogArticles.ts (EN) and src/data/frenchBlogArticles.ts (FR)
 * and reports per-article freshness/quality issues. Does NOT modify content.
 *
 * Architecture truths this report must respect (Codex work order 2026-07-29):
 *  - Structured `faqs[]` is the canonical FAQ source. A Markdown FAQ section is
 *    NOT required when `faqs[]` is populated.
 *  - Quick Answers exist in two supported renderer forms: the canonical
 *    `> **Quick answer:**` blockquote, and heading-driven short-answer cards
 *    (see detectH2Card in src/components/blog/MarkdownSectionCards.tsx).
 *    A heading-based answer is NOT "missing".
 *  - Related guides are cluster-driven via src/data/blogClusters.ts. An inline
 *    `## Related guides` H2 is a legacy/optional form, not the requirement.
 *
 * Checks per article:
 *  - stale-date       : "Last reviewed:" (EN) / "Dernière révision" (FR) > 90 days
 *                       OR missing entirely; also flags if dateModified > 90 days
 *                       and no review line.
 *  - no-faq           : structured `faqs[]` empty AND no Markdown FAQ H2.
 *  - quick-answer     : reported as blockquote | heading | missing.
 *  - no-shop-card     : content lacks an HBW shop/operations H2 pattern.
 *  - no-related       : no cluster, no legacy relatedSlugs, no inline section.
 *  - words:NNN        : body word count < 800 or > 4000.
 *
 * Always exits 0. Report tool, not a build gate.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const EN_PATH = resolve(repoRoot, 'src/data/blogArticles.ts');
const FR_PATH = resolve(repoRoot, 'src/data/frenchBlogArticles.ts');
const CLUSTERS_PATH = resolve(repoRoot, 'src/data/blogClusters.ts');

// ---- TS loader (lightweight) -------------------------------------------------
async function loadArticles(absPath) {
  const require_ = createRequire(import.meta.url);
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

// Canonical Quick Answer blockquote, as rendered by MarkdownSectionCards.
const QUICK_ANSWER_BLOCKQUOTE_RE = /^>\s*\*\*\s*(Quick answer|R[ée]ponse rapide|L'essentiel)\s*:?\s*\*\*/im;

// Heading-driven short-answer cards. Mirrors detectH2Card() exactly.
const QUICK_ANSWER_HEADINGS = new Set([
  'quick recommendation',
  'quick answer',
  'short answer',
  'direct answer',
  'tldr',
  'tl dr',
  'bottom line',
  'quick verdict',
  'quick take',
  'quick fix',
  // French equivalents (reported under the FR language bucket only)
  'reponse rapide',
  'reponse courte',
  'lessentiel',
  'en bref',
  'a retenir',
  'reponse directe',
]);

const normHeading = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();


const FAQ_H2_RE = /^##\s+(Frequently Asked Questions?|FAQs?|Questions fr[ée]quentes|FAQ)\b/m;
const RELATED_H2_RE = /^##\s+(Related guides|Related posts|Related at HBW|Guides connexes)\b/mi;
const SHOP_CARD_RE = /^##\s+(What we see at HBW|What We See at HBW|Related at HBW|The HBW [A-Za-z]|What we do at Harris Boat Works|From the Shop|Au magasin|Chez HBW)\b/mi;

// How far into the body a Quick Answer still counts as "near the top".
const TOP_WINDOW = 2000;

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

/** 'blockquote' | 'heading' | 'missing' */
function classifyQuickAnswer(content) {
  const top = (content || '').slice(0, TOP_WINDOW);
  if (QUICK_ANSWER_BLOCKQUOTE_RE.test(top)) return 'blockquote';
  const headings = [...top.matchAll(/^#{2,4}\s+(.+)$/gm)].map((m) => normHeading(m[1]));
  if (headings.some((h) => QUICK_ANSWER_HEADINGS.has(h))) return 'heading';
  return 'missing';
}

function evaluate(article, lang, relatedState) {
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

  // 2. FAQ — structured faqs[] is canonical.
  const hasFaqsArr = Array.isArray(article.faqs) && article.faqs.length > 0;
  if (!hasFaqsArr && !FAQ_H2_RE.test(content)) issues.push('no-faq');

  // 3. Quick answer
  const qa = classifyQuickAnswer(content);
  if (qa === 'missing') issues.push('quick-answer:missing');
  else if (qa === 'heading') issues.push('quick-answer:noncanonical-heading');

  // 4. Shop card
  if (!SHOP_CARD_RE.test(content)) issues.push('no-shop-card');

  // 5. Related guides — cluster-driven is canonical.
  if (relatedState === 'missing') issues.push('no-related');
  else if (relatedState === 'legacy-relatedSlugs') issues.push('related:legacy-fallback');
  else if (relatedState === 'inline') issues.push('related:inline-only');

  // 6. Word count outliers
  const wc = wordCount(content);
  if (wc < 800 || wc > 4000) issues.push(`words:${wc}`);

  return { issues, qa };
}

// ---- Main --------------------------------------------------------------------
async function main() {
  const enMod = await loadArticles(EN_PATH);
  const frMod = await loadArticles(FR_PATH);
  const clusters = await loadArticles(CLUSTERS_PATH);

  const getClusterForSlug = clusters.getClusterForSlug || (() => undefined);
  const overrides = clusters.relatedSlugsOverrides || {};

  const allEn = enMod.blogArticles || [];
  const isPublished = enMod.isArticlePublished || (() => true);
  const en = allEn.filter(isPublished);
  const fr = frMod.frenchBlogArticles || [];

  function relatedCoverage(article, lang) {
    if (lang !== 'en') {
      return RELATED_H2_RE.test(article.content || '') ? 'inline' : 'n/a';
    }
    if (overrides[article.slug]) return 'cluster';
    if (getClusterForSlug(article.slug)) return 'cluster';
    if (Array.isArray(article.relatedSlugs) && article.relatedSlugs.length > 0) {
      return 'legacy-relatedSlugs';
    }
    if (RELATED_H2_RE.test(article.content || '')) return 'inline';
    return 'missing';
  }

  const rows = [];
  const summary = {
    'stale-date': 0,
    'no-faq': 0,
    'quick-answer:missing': 0,
    'quick-answer:noncanonical-heading': 0,
    'no-shop-card': 0,
    'no-related': 0,
    'related:legacy-fallback': 0,
    'related:inline-only': 0,
    'words-outlier': 0,
  };

  const byLang = {
    en: { total: 0, qa: { blockquote: 0, heading: 0, missing: 0 }, faqs: 0, related: {} },
    fr: { total: 0, qa: { blockquote: 0, heading: 0, missing: 0 }, faqs: 0, related: {} },
  };

  function walk(list, lang) {
    for (const a of list) {
      const rel = relatedCoverage(a, lang);
      const { issues, qa } = evaluate(a, lang, rel);

      byLang[lang].total++;
      byLang[lang].qa[qa]++;
      if (Array.isArray(a.faqs) && a.faqs.length > 0) byLang[lang].faqs++;
      byLang[lang].related[rel] = (byLang[lang].related[rel] || 0) + 1;

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
  out.push(
    `Articles scanned: ${en.length + fr.length} (EN published: ${en.length}, FR: ${fr.length})`,
  );
  out.push(`Articles flagged: ${rows.length}`);
  out.push('');

  out.push(`## Quick Answer coverage (by language)`);
  out.push('');
  out.push('| Language | Total | Blockquote | Heading | Missing |');
  out.push('|---|---|---|---|---|');
  for (const lang of ['en', 'fr']) {
    const b = byLang[lang];
    out.push(`| ${lang} | ${b.total} | ${b.qa.blockquote} | ${b.qa.heading} | ${b.qa.missing} |`);
  }
  out.push('');

  out.push(`## Structured FAQ coverage (by language)`);
  out.push('');
  out.push('| Language | Total | Populated faqs[] | Missing structured FAQs |');
  out.push('|---|---|---|---|');
  for (const lang of ['en', 'fr']) {
    const b = byLang[lang];
    out.push(`| ${lang} | ${b.total} | ${b.faqs} | ${b.total - b.faqs} |`);
  }
  out.push('');

  out.push(`## Related-guide coverage (English, cluster-driven)`);
  out.push('');
  out.push('| State | Count |');
  out.push('|---|---|');
  for (const [k, v] of Object.entries(byLang.en.related)) {
    out.push(`| ${k} | ${v} |`);
  }
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
