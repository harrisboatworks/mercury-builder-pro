#!/usr/bin/env node
/**
 * Auto-bump blog `dateModified` to TODAY whenever an article's prose
 * (its `content` template literal) changes versus HEAD. Leaves unchanged
 * articles untouched. Intended to run as a git pre-commit hook via husky.
 *
 * Behavior:
 *   - Inspects every staged blog data file: src/data/blogArticles.ts and
 *     src/data/<lang>BlogArticles.ts variants.
 *   - For each staged file, diffs the slug -> content map vs HEAD.
 *   - For every slug whose content changed (or is new), rewrites the
 *     `dateModified: 'YYYY-MM-DD'` line for THAT article only to today's
 *     local date (America/Toronto), then re-stages the file.
 *   - First-commit / file-not-in-HEAD case: no-op (every slug is "new",
 *     dates already reflect the author's intent).
 *
 * Safe to run repeatedly; idempotent when no content has changed.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

function todayISO() {
  // America/Toronto local date in YYYY-MM-DD.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
}

// Extract { slug -> content } from a file source. Uses the same
// backtick-aware scanner as the validator so we don't depend on tsx.
function extractSlugContent(src) {
  const out = new Map();
  const slugRx = /slug:\s*['"]([^'"]+)['"]/g;
  const positions = [];
  let m;
  while ((m = slugRx.exec(src)) !== null) positions.push({ slug: m[1], start: m.index });
  positions.push({ slug: null, start: src.length });
  for (let i = 0; i < positions.length - 1; i++) {
    const block = src.slice(positions[i].start, positions[i + 1].start);
    out.set(positions[i].slug, readTemplate(block, 'content'));
  }
  return out;
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

// Rewrite the `dateModified` line of a single article (matched by slug) to
// `today`. Returns updated source or null if nothing changed.
function bumpDateModified(src, slug, today) {
  const slugRx = new RegExp(`slug:\\s*['"]${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  const sm = src.match(slugRx);
  if (!sm) return null;
  // Search forward from slug for the next dateModified in the same article.
  // The article block ends at the next `slug:` occurrence.
  const tail = src.slice(sm.index);
  const nextSlug = tail.slice(1).search(/slug:\s*['"]/);
  const blockEnd = nextSlug === -1 ? tail.length : nextSlug + 1;
  const block = tail.slice(0, blockEnd);
  const dmRx = /dateModified:\s*(['"])(\d{4}-\d{2}-\d{2})\1/;
  const dm = block.match(dmRx);
  if (!dm) return null;
  if (dm[2] === today) return null;
  const replaced = block.replace(dmRx, `dateModified: $1${today}$1`);
  return src.slice(0, sm.index) + replaced + src.slice(sm.index + blockEnd);
}

let stagedFiles;
try {
  stagedFiles = sh('git diff --cached --name-only --diff-filter=ACM')
    .split('\n').map((s) => s.trim()).filter(Boolean);
} catch (e) {
  // Not a git repo or git unavailable; silently exit so this never blocks.
  process.exit(0);
}

const BLOG_RX = /^src\/data\/(blogArticles|[a-z]+BlogArticles)\.ts$/;
const targets = stagedFiles.filter((f) => BLOG_RX.test(f));
if (targets.length === 0) process.exit(0);

const today = todayISO();
let totalBumped = 0;
const restage = [];

for (const file of targets) {
  if (!existsSync(file)) continue;
  let headSrc = '';
  try {
    headSrc = sh(`git show HEAD:"${file}"`);
  } catch {
    // File not in HEAD (newly added). No prior content to diff against - skip.
    continue;
  }
  const headMap = extractSlugContent(headSrc);
  let workingSrc = readFileSync(file, 'utf8');
  const workingMap = extractSlugContent(workingSrc);
  const changed = [];
  for (const [slug, content] of workingMap) {
    const prev = headMap.get(slug);
    if (prev !== undefined && prev !== content) changed.push(slug);
  }
  if (changed.length === 0) continue;

  let bumpedCount = 0;
  for (const slug of changed) {
    const next = bumpDateModified(workingSrc, slug, today);
    if (next) { workingSrc = next; bumpedCount++; }
  }
  if (bumpedCount > 0) {
    writeFileSync(file, workingSrc);
    restage.push(file);
    totalBumped += bumpedCount;
    console.log(`[bump-blog-date-modified] ${file}: bumped ${bumpedCount} article(s) -> ${today}`);
    for (const s of changed) console.log(`    - ${s}`);
  }
}

if (restage.length) {
  try {
    sh(`git add ${restage.map((f) => `"${f}"`).join(' ')}`);
  } catch (e) {
    console.error('[bump-blog-date-modified] failed to re-stage files:', e.message);
    process.exit(1);
  }
}

if (totalBumped === 0) console.log('[bump-blog-date-modified] no body changes detected.');
