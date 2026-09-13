#!/usr/bin/env node
/**
 * Verifies that every /lovable-uploads/*.{png,jpg,jpeg} and
 * /images/shop/*.{webp} image referenced from blog markdown, blog data, or
 * motor/location/case-study markdown has the responsive WebP variants the
 * runtime <picture>/srcSet pipeline expects:
 *   - <base>.webp       (master)
 *   - <base>-1024.webp  (tablet)
 *   - <base>-640.webp   (mobile)
 *
 * Exits non-zero (CI failure) when any variant is missing so the build blocks
 * regressions before they reach production.
 *
 * Usage:
 *   node scripts/check-responsive-images.mjs           # fail on missing
 *   node scripts/check-responsive-images.mjs --warn    # log only
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UPLOADS_DIR = join(ROOT, 'public', 'lovable-uploads');
const SHOP_DIR = join(ROOT, 'public', 'images', 'shop');
const WARN_ONLY = process.argv.includes('--warn');

// Directories to scan for image references.
const SCAN_DIRS = [
  join(ROOT, 'public', 'blog'),
  join(ROOT, 'public', 'locations'),
  join(ROOT, 'public', 'motors'),
  join(ROOT, 'public', 'case-studies'),
  join(ROOT, 'src', 'data'),
  join(ROOT, 'src', 'pages'),
  join(ROOT, 'src', 'components'),
];

// Capture both root-level uploads and nested folders so the production check
// cannot silently skip responsive variants for organized hero directories.
const REF_PATTERNS = [
  {
    re: /\/lovable-uploads\/([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\.(?:png|jpg|jpeg))/gi,
    dir: UPLOADS_DIR,
  },
  {
    re: /\/images\/shop\/([A-Za-z0-9_.-]+\.webp)/gi,
    dir: SHOP_DIR,
  },
];
const REQUIRED_SUFFIXES = ['.webp', '-1024.webp', '-640.webp'];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(md|mdx|ts|tsx|js|jsx|json)$/i.test(entry)) out.push(p);
  }
  return out;
}

const referenced = new Map(); // key -> { fname, dir, sources }
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of REF_PATTERNS) {
      pattern.re.lastIndex = 0;
      let m;
      while ((m = pattern.re.exec(content)) !== null) {
        const fname = m[1];
        if (/-(?:640|1024)\.webp$/i.test(fname)) continue;
        const key = `${pattern.dir}::${fname}`;
        if (!referenced.has(key)) referenced.set(key, { fname, dir: pattern.dir, sources: new Set() });
        referenced.get(key).sources.add(file.replace(ROOT + '/', ''));
      }
    }
  }
}

const variantProblems = []; // hard fail: source exists but variants missing
const brokenRefs = []; // soft warn: source file itself doesn't exist
let okCount = 0;
let skippedCount = 0;

for (const { fname, dir: imageDir, sources } of referenced.values()) {
  // Variants live beside their source, including for nested upload folders.
  const base = fname.slice(0, -extname(fname).length);
  const masterPath = join(imageDir, fname);

  if (!existsSync(masterPath)) {
    brokenRefs.push({ file: fname, sources: [...sources].slice(0, 3) });
    continue;
  }

  // Skip tiny images (< 50KB) — too small to benefit from responsive variants.
  const sizeKB = statSync(masterPath).size / 1024;
  if (sizeKB < 50) {
    skippedCount++;
    continue;
  }

  const missing = REQUIRED_SUFFIXES.filter(
    (suf) => !existsSync(join(imageDir, base + suf)),
  );
  if (missing.length) {
    variantProblems.push({
      file: fname,
      missing,
      sources: [...sources].slice(0, 3),
    });
  } else {
    okCount++;
  }
}

console.log(`\nResponsive WebP variant check`);
console.log(`  Scanned ${referenced.size} referenced image(s)`);
console.log(`  OK:       ${okCount}`);
console.log(`  Skipped:  ${skippedCount}  (< 50KB, variants not required)`);
console.log(`  Missing variants: ${variantProblems.length}  (hard fail)`);
console.log(`  Broken refs:      ${brokenRefs.length}  (warn only)\n`);

if (brokenRefs.length) {
  console.warn('Broken image references (source file missing):');
  for (const p of brokenRefs) {
    console.warn(`  ! ${p.file}  — ref by: ${p.sources.join(', ')}`);
  }
  console.log('');
}

if (variantProblems.length) {
  console.error('Missing responsive WebP variants:');
  for (const p of variantProblems) {
    console.error(`  ✗ ${p.file}`);
    console.error(`      missing: ${p.missing.join(', ')}`);
    console.error(`      ref by:  ${p.sources.join(', ')}`);
  }
  console.log('');
  if (!WARN_ONLY) {
    console.error(
      `FAIL: ${variantProblems.length} image(s) missing responsive WebP variants.\n` +
        `Regenerate with cwebp (-resize 640/1024/1920), or pass --warn to soft-fail.\n`,
    );
    process.exit(1);
  }
  console.warn('WARN: variant gaps reported above (soft-fail).\n');
} else {
  console.log('All referenced images have full responsive WebP coverage.\n');
}
