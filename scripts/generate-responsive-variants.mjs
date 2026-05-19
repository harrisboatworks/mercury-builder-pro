#!/usr/bin/env node
/**
 * Auto-generate responsive WebP + AVIF variants for every PNG/JPG in
 * public/lovable-uploads that is >= 50KB and missing one or more of:
 *   - <base>.webp / .avif       (master, capped at 1920w)
 *   - <base>-1024.webp / .avif  (tablet)
 *   - <base>-640.webp / .avif   (mobile)
 *
 * Idempotent: existing variants are left alone. Skips small images
 * (the responsive-image check also skips < 50KB sources).
 *
 * Runs in prebuild ahead of check-responsive-images.mjs so new hero
 * PNGs dropped into public/lovable-uploads automatically get covered.
 */

import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'public', 'lovable-uploads');
const MIN_BYTES = 50 * 1024;
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 55;

// Each format gets the same three widths.
const WIDTHS = [
  { suffix: '.webp', ext: '.webp', width: 1920, format: 'webp' },
  { suffix: '-1024.webp', ext: '.webp', width: 1024, format: 'webp' },
  { suffix: '-640.webp', ext: '.webp', width: 640, format: 'webp' },
  { suffix: '.avif', ext: '.avif', width: 1920, format: 'avif' },
  { suffix: '-1024.avif', ext: '.avif', width: 1024, format: 'avif' },
  { suffix: '-640.avif', ext: '.avif', width: 640, format: 'avif' },
];

if (!existsSync(UPLOADS_DIR)) {
  console.log('No public/lovable-uploads directory; skipping variant generation.');
  process.exit(0);
}

const sources = readdirSync(UPLOADS_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));

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
  const base = basename(file, extname(file));
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
