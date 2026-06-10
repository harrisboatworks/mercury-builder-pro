#!/usr/bin/env node
// Build-time guard: every blog hero/inline image must resolve to a real file
// in public/ (or its variants directories), and no article may use a known
// STUB_FALLBACK_HEROES image. Wired via prebuild alongside check:blog-leaks.
//
// Companion to scripts/check-blog-leaks.mjs. Runs in <1s on the current corpus.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = resolve(ROOT, 'public');
const SEARCH_DIRS = [
  PUBLIC_DIR,
  resolve(PUBLIC_DIR, 'lovable-uploads'),
  resolve(PUBLIC_DIR, 'assets', 'optimized'),
  resolve(PUBLIC_DIR, 'assets'),
];

const BLOG_FILES = readdirSync('src/data')
  .filter((f) => f === 'blogArticles.ts' || /^(mandarin|korean|french|spanish|hindi|punjabi)BlogArticles\.ts$/.test(f))
  .map((f) => `src/data/${f}`);

// Pull STUB_FALLBACK_HEROES from blogArticles.ts source.
function loadStubFallbackHeroes() {
  const src = readFileSync('src/data/blogArticles.ts', 'utf8');
  const m = src.match(/const STUB_FALLBACK_HEROES = new Set<string>\(\[([\s\S]*?)\]\)/);
  if (!m) return new Set();
  const items = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  return new Set(items);
}

const STUBS = loadStubFallbackHeroes();

// Match each article object: capture slug + image + content.
// blogArticles uses `slug: '...'`, `image: '...'`, `content: \`...\`` (template literal).
function* iterateArticles(fileText, file) {
  // Split on `slug:` occurrences inside object literals.
  const slugRe = /slug:\s*['"]([^'"]+)['"]/g;
  const matches = [...fileText.matchAll(slugRe)];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : fileText.length;
    const block = fileText.slice(start, end);
    const slug = matches[i][1];
    const imageMatch = block.match(/image:\s*['"]([^'"]+)['"]/);
    const image = imageMatch ? imageMatch[1] : null;
    // Content can be backtick template literal or string.
    const contentMatch =
      block.match(/content:\s*`([\s\S]*?)`\s*,\s*\n/) ||
      block.match(/content:\s*"((?:\\.|[^"\\])*)"\s*,/) ||
      block.match(/content:\s*'((?:\\.|[^'\\])*)'\s*,/);
    const content = contentMatch ? contentMatch[1] : '';
    yield { file, slug, image, content };
  }
}

function extractInlineImageRefs(content) {
  const refs = [];
  const mdRe = /!\[[^\]]*\]\(([^)\s]+)/g;
  const htmlRe = /<img[^>]+src=["']([^"']+)["']/gi;
  for (const m of content.matchAll(mdRe)) refs.push(m[1]);
  for (const m of content.matchAll(htmlRe)) refs.push(m[1]);
  return refs;
}

function isExternal(path) {
  return /^https?:\/\//i.test(path) || path.startsWith('//') || path.startsWith('data:');
}

function resolveAssetPath(path) {
  if (path.startsWith('/')) {
    const p = join(PUBLIC_DIR, path);
    if (existsSync(p)) return p;
    return null;
  }
  for (const dir of SEARCH_DIRS) {
    const p = join(dir, path);
    if (existsSync(p)) return p;
  }
  return null;
}

const missing = [];
const blocked = [];
let articleCount = 0;
let assetCount = 0;

for (const file of BLOG_FILES) {
  const text = readFileSync(file, 'utf8');
  for (const article of iterateArticles(text, file)) {
    articleCount++;
    const refs = [];
    if (article.image) refs.push({ kind: 'hero', path: article.image });
    for (const p of extractInlineImageRefs(article.content)) {
      refs.push({ kind: 'inline', path: p });
    }
    for (const { kind, path } of refs) {
      assetCount++;
      if (isExternal(path)) continue;
      if (kind === 'hero' && STUBS.has(path)) {
        blocked.push({ file, slug: article.slug, path });
        continue;
      }
      if (!resolveAssetPath(path)) {
        missing.push({ file, slug: article.slug, kind, path });
      }
    }
  }
}

if (missing.length || blocked.length) {
  console.error('\nBlog asset existence check FAILED\n');
  if (missing.length) {
    console.error(`Missing assets (${missing.length}):`);
    for (const m of missing) {
      console.error(`  ${m.file}  [${m.slug}]  ${m.kind}: ${m.path}`);
    }
  }
  if (blocked.length) {
    console.error(`\nBlocklisted stub-fallback heroes (${blocked.length}):`);
    for (const b of blocked) {
      console.error(`  ${b.file}  [${b.slug}]  hero: ${b.path}`);
    }
  }
  console.error(`\nScanned ${articleCount} article(s), ${assetCount} asset reference(s) across ${BLOG_FILES.length} data file(s).\n`);
  process.exit(1);
}

console.log(`All ${assetCount} blog asset reference(s) resolved across ${articleCount} article(s) in ${BLOG_FILES.length} data file(s).`);
