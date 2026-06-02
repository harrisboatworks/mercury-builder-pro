// Scans public/lovable-uploads/ recursively for responsive WebP variants
// and emits src/data/imageVariantsManifest.json with the set of URL paths
// (without extension) that have ALL THREE variants generated:
//   {base}-640.webp, {base}-1024.webp, {base}.webp
//
// Consumed by src/components/ui/expandable-image.tsx so the <picture>
// <source srcSet> is only emitted when the responsive WebPs actually exist.
// Prevents iOS Safari from rendering the broken-image icon when the
// browser fetches a webp source that 404s.

import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCAN_ROOT = join(ROOT, 'public', 'lovable-uploads');
const OUT_FILE = join(ROOT, 'src', 'data', 'imageVariantsManifest.json');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(SCAN_ROOT);
const fileSet = new Set(all.map((p) => relative(SCAN_ROOT, p).replace(/\\/g, '/')));

// Find basenames (relative to lovable-uploads) that have all three variants
const bases = new Set();
for (const rel of fileSet) {
  const m = rel.match(/^(.+)\.(png|jpe?g)$/i);
  if (!m) continue;
  const base = m[1];
  if (
    fileSet.has(`${base}-640.webp`) &&
    fileSet.has(`${base}-1024.webp`) &&
    fileSet.has(`${base}.webp`)
  ) {
    // Store URL path (root-absolute) without extension
    bases.add(`/lovable-uploads/${base}`);
  }
}

const sorted = [...bases].sort();
mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: sorted.length,
      bases: sorted,
    },
    null,
    2,
  ) + '\n',
);
console.log(`[image-variants-manifest] wrote ${sorted.length} entries to ${relative(ROOT, OUT_FILE)}`);
