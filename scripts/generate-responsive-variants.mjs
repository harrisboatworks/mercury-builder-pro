#!/usr/bin/env node
/**
 * Auto-generate responsive WebP variants for referenced PNG/JPG uploads that
 * are >= 50KB and missing one or more of:
 *   - <base>.webp       (master, capped at 1920w)
 *   - <base>-1024.webp  (tablet)
 *   - <base>-640.webp   (mobile)
 *
 * Idempotent: existing variants are left alone. Skips small images
 * (the responsive-image check also skips < 50KB sources).
 *
 * Runs in prebuild ahead of check-responsive-images.mjs. It intentionally only
 * covers referenced files/formats required by that check so production builds do
 * not spend minutes converting hundreds of unused uploads or slow AVIF variants.
 * Pass --include-avif or GENERATE_AVIF=1 for a one-off full AVIF backfill.
 */

import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UPLOADS_DIR = join(ROOT, 'public', 'lovable-uploads');
const MIN_BYTES = 50 * 1024;
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 55;
const INCLUDE_AVIF = process.argv.includes('--include-avif') || process.env.GENERATE_AVIF === '1';

const SCAN_DIRS = [
  join(ROOT, 'public', 'blog'),
  join(ROOT, 'public', 'locations'),
  join(ROOT, 'public', 'motors'),
  join(ROOT, 'public', 'case-studies'),
  join(ROOT, 'src', 'data'),
  join(ROOT, 'src', 'pages'),
  join(ROOT, 'src', 'components'),
];

// Capture both root-level uploads and nested folders such as
// /lovable-uploads/blog-heroes-2026-07/batch-c/hero.jpg.
const REF_RE =
  /\/lovable-uploads\/([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\.(?:png|jpg|jpeg))/gi;

// Each format gets the same three widths.
const WEBP_WIDTHS = [
  { suffix: '.webp', ext: '.webp', width: 1920, format: 'webp' },
  { suffix: '-1024.webp', ext: '.webp', width: 1024, format: 'webp' },
  { suffix: '-640.webp', ext: '.webp', width: 640, format: 'webp' },
];

const AVIF_WIDTHS = [
  { suffix: '.avif', ext: '.avif', width: 1920, format: 'avif' },
  { suffix: '-1024.avif', ext: '.avif', width: 1024, format: 'avif' },
  { suffix: '-640.avif', ext: '.avif', width: 640, format: 'avif' },
];

const WIDTHS = INCLUDE_AVIF ? [...WEBP_WIDTHS, ...AVIF_WIDTHS] : WEBP_WIDTHS;

if (!existsSync(UPLOADS_DIR)) {
  console.log('No public/lovable-uploads directory; skipping variant generation.');
  process.exit(0);
}

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

const referenced = new Set();
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const content = readFileSync(file, 'utf8');
    let m;
    while ((m = REF_RE.exec(content)) !== null) referenced.add(m[1]);
  }
}

const sources = [...referenced].filter(
  (f) => /\.(png|jpe?g)$/i.test(f) && existsSync(join(UPLOADS_DIR, f)),
);

let generated = 0;
let skipped = 0;
const failures = [];

for (const file of sources) {
  const full = join(UPLOADS_DIR, file);
  const size = statSync(full).size;
  if (size < MIN_BYTES) {
    skipped++;
    continue;
  }
  // Preserve the upload's relative directory. BlogHeroPicture requests
  // variants beside the original image, not at the uploads root.
  const base = file.slice(0, -extname(file).length);
  const missing = WIDTHS.filter(
    (v) => !existsSync(join(UPLOADS_DIR, base + v.suffix)),
  );
  if (!missing.length) continue;

  for (const v of missing) {
    const out = join(UPLOADS_DIR, base + v.suffix);
    try {
      const img = sharp(full);
      const meta = await img.metadata();
      const targetWidth = meta.width && meta.width > v.width ? v.width : meta.width;
      let pipeline = img.resize({ width: targetWidth, withoutEnlargement: true });
      if (v.format === 'webp') {
        pipeline = pipeline.webp({ quality: WEBP_QUALITY });
      } else {
        pipeline = pipeline.avif({ quality: AVIF_QUALITY, effort: 4 });
      }
      await pipeline.toFile(out);
      generated++;
      console.log(`  + ${base + v.suffix}`);
    } catch (err) {
      failures.push({ file: base + v.suffix, error: err.message });
    }
  }
}

console.log(
  `\nResponsive variant generation: ${generated} created, ${skipped} small source(s) skipped, ${failures.length} failed.`,
);

if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f.file}: ${f.error}`);
  process.exit(1);
}
