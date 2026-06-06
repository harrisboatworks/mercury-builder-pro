#!/usr/bin/env node
/**
 * Compress LCP-critical hero / landing / badge assets to AVIF + WebP at
 * responsive widths. Outputs to public/assets/optimized/.
 *
 * Originals in src/assets/ are kept as fallback (per audit instructions).
 * Run: node scripts/compress-hero-assets.mjs
 */
import sharp from 'sharp';
import { mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(ROOT, 'src/assets');
const OUT_DIR = path.join(ROOT, 'public/assets/optimized');

// (base name in src/assets, widths, quality)
const TARGETS = [
  { file: 'harris-7-year-warranty.png', widths: [200, 400, 800], quality: 80 },
  { file: 'landing-step-pick.png',      widths: [400, 800, 1600], quality: 80 },
  { file: 'landing-hero-mercury.jpg',   widths: [400, 800, 1600], quality: 80 },
  { file: 'hero-proxs-sunset.jpg',      widths: [800, 1600], quality: 78 },
  { file: 'landing-step-configure.jpg', widths: [400, 800, 1600], quality: 80 },
  { file: 'landing-step-pickup.jpg',    widths: [400, 800, 1600], quality: 80 },
  { file: 'landing-repower-shop.jpg',   widths: [400, 800, 1600], quality: 80 },
  { file: 'landing-cta-lake.jpg',       widths: [400, 800, 1600], quality: 80 },
];

await mkdir(OUT_DIR, { recursive: true });

function fmtKB(bytes) { return `${(bytes / 1024).toFixed(1)} KB`; }

async function processOne({ file, widths, quality }) {
  const inputPath = path.join(SRC_DIR, file);
  if (!existsSync(inputPath)) {
    console.warn(`  ! skip (missing): ${file}`);
    return;
  }
  const base = file.replace(/\.(png|jpe?g)$/i, '');
  const inSize = (await stat(inputPath)).size;
  console.log(`\n${file}  (in: ${fmtKB(inSize)})`);

  for (const w of widths) {
    const webpOut = path.join(OUT_DIR, `${base}-${w}w.webp`);
    const avifOut = path.join(OUT_DIR, `${base}-${w}w.avif`);

    await sharp(inputPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(webpOut);

    await sharp(inputPath)
      .resize({ width: w, withoutEnlargement: true })
      .avif({ quality: Math.max(40, quality - 25), effort: 6 })
      .toFile(avifOut);

    const wSize = (await stat(webpOut)).size;
    const aSize = (await stat(avifOut)).size;
    console.log(`  ${w}w: webp ${fmtKB(wSize)}  |  avif ${fmtKB(aSize)}`);
  }
}

for (const t of TARGETS) await processOne(t);

console.log('\nDone. Outputs in public/assets/optimized/');
