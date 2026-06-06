#!/usr/bin/env node
/**
 * Inject `## Related guides` (EN) / `## Guides connexes` (FR) blocks into
 * every blog post that lacks one, using deterministic same-category /
 * keyword-overlap / title-token-overlap ranking. No new prose: link
 * descriptions are derived from each target article's existing meta
 * description, trimmed to ~110 chars at a word boundary, em-dashes
 * stripped.
 *
 * Idempotent: posts that already have the H2 are skipped.
 *
 * Validates every injected slug exists; throws otherwise.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const EN_PATH = resolve(repoRoot, 'src/data/blogArticles.ts');
const FR_PATH = resolve(repoRoot, 'src/data/frenchBlogArticles.ts');

const HAS_REL_EN = /^##\s+(Related guides|Related posts|Related at HBW)\b/m;
const HAS_REL_FR = /^##\s+Guides connexes\b/m;

const FAQ_H2_RE = /^##\s+(Frequently Asked Questions?|FAQs?|Questions fr[ée]quentes|FAQ|Foire aux questions)\b.*$/m;

const STOPWORDS = new Set([
  'the','a','an','and','or','of','to','for','on','in','is','your','you',
  'with','at','by','from','my','i','it','this','that','best','guide',
  '2026','2025','vs','ontario','mercury','hp','outboard','outboards','le',
  'la','les','un','une','des','de','du','et','en','pour','sur','dans','au',
  'aux','vs.','est','sont','votre','vos','mes','mon','ma','ce','cette','ces',
  'guide','meilleur','mercury'
]);

function tokenize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && t.length > 2);
}

function stripEmDash(s) {
  return (s || '').replace(/\u2014/g, ',').replace(/\s+,\s+/g, ', ').trim();
}

function trimToWordBoundary(s, max = 110) {
  s = (s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:!?]+$/, '');
}

function makeDescription(a) {
  const raw = a.description || a.excerpt || a.seoDescription || a.title || '';
  let d = stripEmDash(raw);
  d = trimToWordBoundary(d, 110);
  // ensure single sentence, end with period
  d = d.replace(/[.!?]+$/, '');
  return d + '.';
}

// score candidate b against current a
function score(a, b) {
  let s = 0;
  if (a.category && b.category && a.category === b.category) s += 6;
  const ak = new Set((a.keywords || []).map((x) => x.toLowerCase()));
  const bk = new Set((b.keywords || []).map((x) => x.toLowerCase()));
  for (const k of bk) if (ak.has(k)) s += 2;
  const at = new Set(tokenize(a.title));
  const bt = new Set(tokenize(b.title));
  for (const t of bt) if (at.has(t)) s += 1;
  return s;
}

function pickRelated(a, pool, count = 4) {
  const scored = pool
    .filter((b) => b.slug !== a.slug)
    .map((b) => ({ b, s: score(a, b) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || x.b.slug.localeCompare(y.b.slug));
  return scored.slice(0, count).map((x) => x.b);
}

function buildBlock(heading, related) {
  const lines = [];
  lines.push('');
  lines.push(`## ${heading}`);
  lines.push('');
  for (const r of related) {
    const title = stripEmDash(r.title);
    const desc = makeDescription(r);
    lines.push(`- [${title}](/blog/${r.slug}): ${desc}`);
  }
  lines.push('');
  return lines.join('\n');
}

// safe content swap (mirrors scripts/safe-blog-edit.mjs)
function swapContent(source, slug, newContent) {
  const re = new RegExp(`slug:\\s*['"]${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  const m = re.exec(source);
  if (!m) throw new Error(`slug not found in source: ${slug}`);
  const slugIdx = m.index;
  const ckRe = /content\s*:\s*`/g;
  ckRe.lastIndex = slugIdx;
  const ck = ckRe.exec(source);
  if (!ck) throw new Error(`content backtick not found for ${slug}`);
  const bodyStart = ck.index + ck[0].length;
  let i = bodyStart;
  let depth = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '$' && source[i + 1] === '{') { depth++; i += 2; continue; }
    if (c === '}' && depth > 0) { depth--; i++; continue; }
    if (c === '`' && depth === 0) break;
    i++;
  }
  if (i >= source.length) throw new Error(`unterminated content literal for ${slug}`);
  const bodyEnd = i;
  const escaped = newContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return source.slice(0, bodyStart) + escaped + source.slice(bodyEnd);
}

function injectIntoContent(content, block) {
  // Insert just before FAQ H2, else append at end.
  const faqMatch = FAQ_H2_RE.exec(content);
  if (faqMatch) {
    const idx = faqMatch.index;
    // ensure trailing newline before
    const before = content.slice(0, idx).replace(/\s+$/, '\n\n');
    return before + block.trimStart() + '\n' + content.slice(idx);
  }
  return content.replace(/\s+$/, '\n') + block + '\n';
}

async function loadMod(path) {
  // tsx esm loader
  try {
    const req = createRequire(import.meta.url);
    req.resolve('tsx');
    await import('tsx/esm');
  } catch {}
  return import(pathToFileURL(path).href);
}

async function main() {
  const enMod = await loadMod(EN_PATH);
  const frMod = await loadMod(FR_PATH);
  const en = enMod.blogArticles || [];
  const fr = frMod.frenchBlogArticles || [];

  const enSlugs = new Set(en.map((a) => a.slug));
  const frSlugs = new Set(fr.map((a) => a.slug));

  let enSource = await readFile(EN_PATH, 'utf8');
  let frSource = await readFile(FR_PATH, 'utf8');

  const samples = [];
  const stats = { en: 0, fr: 0, links: 0, skipped: 0 };

  function processList(list, source, hasReRe, heading, validSlugs, lang) {
    let src = source;
    for (const a of list) {
      const content = a.content || '';
      if (hasReRe.test(content)) { stats.skipped++; continue; }
      const pool = list.filter((b) => b.slug !== a.slug);
      let related = pickRelated(a, pool, 4);
      if (related.length < 3 && lang === 'fr') {
        // pad with EN counterparts if possible — but the user said this is
        // optional; since FR corpus is small (~15) we just take what we have.
      }
      if (related.length === 0) {
        // fallback: top-scored 3 by any score, allowing zero-score links from
        // same-category pool. If still none, skip.
        related = pool.slice(0, 3);
      }
      related = related.slice(0, 4);
      // assert all targets exist
      for (const r of related) {
        if (!validSlugs.has(r.slug)) {
          throw new Error(`Computed related slug not in ${lang} corpus: ${r.slug}`);
        }
      }
      const block = buildBlock(heading, related);
      const newContent = injectIntoContent(content, block);
      src = swapContent(src, a.slug, newContent);
      stats[lang]++;
      stats.links += related.length;
      if (samples.length < 3 && (samples.length < 2 ? lang === 'en' : lang === 'fr')) {
        samples.push({ slug: a.slug, lang, block: block.trim() });
      }
    }
    return src;
  }

  enSource = processList(en, enSource, HAS_REL_EN, 'Related guides', enSlugs, 'en');
  frSource = processList(fr, frSource, HAS_REL_FR, 'Guides connexes', frSlugs, 'fr');

  await writeFile(EN_PATH, enSource);
  await writeFile(FR_PATH, frSource);

  console.log('--- inject-related-guides summary ---');
  console.log(`EN posts modified: ${stats.en}`);
  console.log(`FR posts modified: ${stats.fr}`);
  console.log(`Links injected total: ${stats.links}`);
  console.log(`Skipped (already had block): ${stats.skipped}`);
  console.log('\n--- sample blocks ---');
  for (const s of samples) {
    console.log(`\n[${s.lang}] ${s.slug}`);
    console.log(s.block);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
