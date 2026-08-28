// Scans public/lovable-uploads/ recursively for responsive WebP variants
// and emits src/data/imageVariantsManifest.json with the set of URL paths
// (without extension) that have ALL THREE variants generated, plus each
// variant's real pixel width:
//   {base}-640.webp, {base}-1024.webp, {base}.webp
//
// Consumed by src/components/ui/expandable-image.tsx so the <picture>
// <source srcSet> is only emitted when the responsive WebPs actually exist.
// Prevents iOS Safari from rendering the broken-image icon when the
// browser fetches a webp source that 404s.

import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCAN_ROOT = join(ROOT, 'public', 'lovable-uploads');
const OUT_FILE = join(ROOT, 'src', 'data', 'imageVariantsManifest.json');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(SCAN_ROOT);
const fileSet = new Set(all.map((p) => relative(SCAN_ROOT, p).replace(/\\/g, '/')));

// Find basenames (relative to lovable-uploads) that have all three variants
const baseRels = new Set();
for (const rel of fileSet) {
  const m = rel.match(/^(.+)\.(png|jpe?g)$/i);
  if (!m) continue;
  const base = m[1];
  if (
    fileSet.has(`${base}-640.webp`) &&
    fileSet.has(`${base}-1024.webp`) &&
    fileSet.has(`${base}.webp`)
  ) {
    baseRels.add(base);
  }
}

const sortedRels = [...baseRels].sort();
const bases = sortedRels.map((base) => `/lovable-uploads/${base}`);
const widths = {};

const METADATA_BATCH_SIZE = 24;
for (let index = 0; index < sortedRels.length; index += METADATA_BATCH_SIZE) {
  const batch = sortedRels.slice(index, index + METADATA_BATCH_SIZE);
  const records = await Promise.all(
    batch.map(async (base) => {
      const variantFiles = [
        join(SCAN_ROOT, `${base}-640.webp`),
        join(SCAN_ROOT, `${base}-1024.webp`),
        join(SCAN_ROOT, `${base}.webp`),
      ];
      // Measure the generated files themselves. Some legacy WebPs were enlarged
      // or otherwise no longer match their original PNG/JPG dimensions, so the
      // variant files are the only truthful source for width descriptors.
      const metadata = await Promise.all(
        variantFiles.map((file) => sharp(file).metadata()),
      );
      return { base, widths: metadata.map((item) => item.width) };
    }),
  );

  for (const { base, widths: actualWidths } of records) {
    if (
      actualWidths.length !== 3 ||
      actualWidths.some((width) => !Number.isFinite(width) || width <= 0)
    ) {
      continue;
    }
    widths[`/lovable-uploads/${base}`] = actualWidths;
  }
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: bases.length,
      bases,
      widths,
    },
    null,
    2,
  ) + '\n',
);
console.log(`[image-variants-manifest] wrote ${bases.length} entries to ${relative(ROOT, OUT_FILE)}`);
