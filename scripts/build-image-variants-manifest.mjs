// Scans public/lovable-uploads/ and public/images/shop/ for responsive WebP
// variants and emits src/data/imageVariantsManifest.json with the set of URL
// paths (without extension) that have ALL THREE variants generated, plus each
// variant's real pixel width:
//   {base}-640.webp, {base}-1024.webp, {base}.webp
//
// Consumed by src/lib/responsiveImageVariants.ts so <picture> <source srcSet>
// is only emitted when the responsive WebPs actually exist.
// Prevents iOS Safari from rendering the broken-image icon when the
// browser fetches a webp source that 404s.

import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = join(ROOT, 'src', 'data', 'imageVariantsManifest.json');

const SCAN_ROOTS = [
  {
    dir: join(ROOT, 'public', 'lovable-uploads'),
    urlPrefix: '/lovable-uploads',
    masterPattern: /^(.+)\.(png|jpe?g)$/i,
  },
  {
    dir: join(ROOT, 'public', 'images', 'shop'),
    urlPrefix: '/images/shop',
    masterPattern: /^(.+)\.webp$/i,
    skipVariantMasters: true,
  },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const discovered = [];

for (const root of SCAN_ROOTS) {
  const all = walk(root.dir);
  const fileSet = new Set(all.map((p) => relative(root.dir, p).replace(/\\/g, '/')));
  for (const rel of fileSet) {
    const match = rel.match(root.masterPattern);
    if (!match) continue;
    const base = match[1];
    if (root.skipVariantMasters && /-(?:640|1024)$/i.test(base)) continue;
    if (
      fileSet.has(`${base}-640.webp`) &&
      fileSet.has(`${base}-1024.webp`) &&
      fileSet.has(`${base}.webp`)
    ) {
      discovered.push({
        relBase: base,
        urlBase: `${root.urlPrefix}/${base}`,
        dir: root.dir,
      });
    }
  }
}

discovered.sort((a, b) => a.urlBase.localeCompare(b.urlBase));
const bases = discovered.map((entry) => entry.urlBase);
const widths = {};

const METADATA_BATCH_SIZE = 24;
for (let index = 0; index < discovered.length; index += METADATA_BATCH_SIZE) {
  const batch = discovered.slice(index, index + METADATA_BATCH_SIZE);
  const records = await Promise.all(
    batch.map(async (entry) => {
      const variantFiles = [
        join(entry.dir, `${entry.relBase}-640.webp`),
        join(entry.dir, `${entry.relBase}-1024.webp`),
        join(entry.dir, `${entry.relBase}.webp`),
      ];
      // Measure the generated files themselves. Some legacy WebPs were enlarged
      // or otherwise no longer match their original PNG/JPG dimensions, so the
      // variant files are the only truthful source for width descriptors.
      const metadata = await Promise.all(
        variantFiles.map((file) => sharp(file).metadata()),
      );
      return { urlBase: entry.urlBase, widths: metadata.map((item) => item.width) };
    }),
  );

  for (const { urlBase, widths: actualWidths } of records) {
    if (
      actualWidths.length !== 3 ||
      actualWidths.some((width) => !Number.isFinite(width) || width <= 0)
    ) {
      continue;
    }
    widths[urlBase] = actualWidths;
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
