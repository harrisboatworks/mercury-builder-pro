#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS_DIR = join(ROOT, 'public', 'lovable-uploads');
const MANIFEST_FILE = join(ROOT, 'scripts', 'oversized-upload-image-compression.manifest.json');
const THRESHOLD_BYTES = 500 * 1024;
const TARGET_BYTES = 235 * 1024;
const MAX_DIRECTORY_BYTES = 250 * 1024 * 1024;
const MAX_WIDTH = 1920;
const CONCURRENCY = 3;
const CHECK_ONLY = process.argv.includes('--check');

const excludedDirectories = new Set(['asset-gap-heroes', 'blog-visuals']);
const supportedExtensions = new Set(['.png', '.jpg', '.jpeg']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(UPLOADS_DIR, full);
    if (entry.isDirectory()) {
      if (!rel.split('/').some((segment) => excludedDirectories.has(segment))) walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function directoryBytes() {
  return walk(UPLOADS_DIR).reduce((sum, file) => sum + statSync(file).size, 0);
}

async function encodeWithinTarget(file, extension) {
  let chosen = null;
  let chosenQuality = null;
  let chosenWidth = MAX_WIDTH;
  let chosenColours = null;
  let chosenDither = null;

  if (extension === '.png') {
    const plans = [
      { width: 1920, colours: 256, quality: 84, dither: 1 },
      { width: 1920, colours: 192, quality: 76, dither: 1 },
      { width: 1920, colours: 128, quality: 68, dither: 1 },
      { width: 1600, colours: 128, quality: 68, dither: 1 },
      { width: 1600, colours: 96, quality: 62, dither: 1 },
      { width: 1440, colours: 96, quality: 60, dither: 1 },
      { width: 1440, colours: 64, quality: 56, dither: 0.9 },
      { width: 1280, colours: 64, quality: 52, dither: 0.8 },
      { width: 1280, colours: 48, quality: 48, dither: 0.7 },
      { width: 1280, colours: 32, quality: 44, dither: 0.6 },
      { width: 1024, colours: 48, quality: 46, dither: 0.6 },
      { width: 1024, colours: 32, quality: 42, dither: 0.5 },
      { width: 960, colours: 32, quality: 40, dither: 0.5 },
      { width: 800, colours: 24, quality: 36, dither: 0.4 },
      { width: 768, colours: 16, quality: 32, dither: 0.3 },
    ];
    for (const plan of plans) {
      const candidate = await sharp(file).rotate().resize({ width: plan.width, withoutEnlargement: true }).png({
        compressionLevel: 9,
        effort: 7,
        palette: true,
        quality: plan.quality,
        colours: plan.colours,
        dither: plan.dither,
      }).toBuffer();
      chosen = candidate;
      chosenQuality = plan.quality;
      chosenWidth = plan.width;
      chosenColours = plan.colours;
      chosenDither = plan.dither;
      if (candidate.length <= TARGET_BYTES) break;
    }
  } else {
    const plans = [
      { width: 1920, quality: 82 },
      { width: 1920, quality: 74 },
      { width: 1600, quality: 72 },
      { width: 1440, quality: 68 },
      { width: 1280, quality: 64 },
    ];
    for (const plan of plans) {
      const candidate = await sharp(file).rotate().resize({ width: plan.width, withoutEnlargement: true }).jpeg({
        quality: plan.quality,
        progressive: true,
        mozjpeg: true,
        chromaSubsampling: '4:2:0',
      }).toBuffer();
      chosen = candidate;
      chosenQuality = plan.quality;
      chosenWidth = plan.width;
      if (candidate.length <= TARGET_BYTES) break;
    }
  }

  if (!chosen) throw new Error(`Could not encode ${file}`);
  if (chosen.length > 240 * 1024) {
    throw new Error(`Could not compress ${relative(ROOT, file)} below 240 KB`);
  }
  return {
    buffer: chosen,
    quality: chosenQuality,
    widthLimit: chosenWidth,
    colours: chosenColours,
    dither: chosenDither,
  };
}

async function compressOne(file) {
  const extension = extname(file).toLowerCase();
  const before = readFileSync(file);
  const beforeMetadata = await sharp(before).metadata();
  const { buffer, quality, widthLimit, colours, dither } = await encodeWithinTarget(file, extension);
  const afterMetadata = await sharp(buffer).metadata();

  if (buffer.length >= before.length) {
    throw new Error(`Compression did not reduce ${relative(ROOT, file)} (${before.length} -> ${buffer.length})`);
  }

  const temp = `${file}.compression-tmp`;
  writeFileSync(temp, buffer);
  renameSync(temp, file);

  return {
    path: relative(ROOT, file).replaceAll('\\', '/'),
    format: afterMetadata.format,
    quality,
    widthLimit,
    colours,
    dither,
    beforeBytes: before.length,
    afterBytes: buffer.length,
    savedBytes: before.length - buffer.length,
    beforeWidth: beforeMetadata.width,
    beforeHeight: beforeMetadata.height,
    afterWidth: afterMetadata.width,
    afterHeight: afterMetadata.height,
    beforeSha256: sha256(before),
    afterSha256: sha256(buffer),
  };
}

if (CHECK_ONLY) {
  const bytes = directoryBytes();
  const oversizedPngs = walk(UPLOADS_DIR).filter(
    (file) => extname(file).toLowerCase() === '.png' && statSync(file).size > 3 * 1024 * 1024,
  );
  const failures = [];
  if (bytes > MAX_DIRECTORY_BYTES) {
    failures.push(`public/lovable-uploads is ${(bytes / 1024 / 1024).toFixed(1)} MB (limit 250 MB)`);
  }
  if (oversizedPngs.length) failures.push(`${oversizedPngs.length} PNG(s) still exceed 3 MB`);
  if (!existsSync(MANIFEST_FILE)) failures.push('compression manifest is missing');

  if (failures.length) {
    console.error(`[upload-image-sizes] ${failures.join('; ')}`);
    process.exit(1);
  }
  console.log(`[upload-image-sizes] ${(bytes / 1024 / 1024).toFixed(1)} MB total; no PNG exceeds 3 MB`);
  process.exit(0);
}

const candidates = walk(UPLOADS_DIR)
  .filter((file) => supportedExtensions.has(extname(file).toLowerCase()))
  .filter((file) => statSync(file).size > THRESHOLD_BYTES)
  .sort();

const beforeDirectoryBytes = directoryBytes();
const results = new Array(candidates.length);
let cursor = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (cursor < candidates.length) {
    const index = cursor++;
    results[index] = await compressOne(candidates[index]);
  }
}));

const afterDirectoryBytes = directoryBytes();
const manifest = {
  version: 1,
  thresholdBytes: THRESHOLD_BYTES,
  targetBytes: TARGET_BYTES,
  maxWidth: MAX_WIDTH,
  excludedDirectories: [...excludedDirectories],
  beforeDirectoryBytes,
  afterDirectoryBytes,
  savedBytes: beforeDirectoryBytes - afterDirectoryBytes,
  files: results,
};
writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `[compress-oversized-images] compressed ${results.length} file(s): ` +
  `${(beforeDirectoryBytes / 1024 / 1024).toFixed(1)} MB -> ${(afterDirectoryBytes / 1024 / 1024).toFixed(1)} MB ` +
  `(saved ${((beforeDirectoryBytes - afterDirectoryBytes) / 1024 / 1024).toFixed(1)} MB)`,
);
