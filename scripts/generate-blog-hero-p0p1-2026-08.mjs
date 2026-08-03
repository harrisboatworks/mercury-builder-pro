#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = join(
  ROOT,
  'public',
  'lovable-uploads',
  'blog-heroes-2026-08',
  'p0p1',
);

const canonicalBlackCrest = join(ROOT, 'src', 'assets', 'harris-logo.png');
const canonicalWhiteCrest = join(ROOT, 'src', 'assets', 'harris-logo-white.png');

await mkdir(OUTPUT_DIR, { recursive: true });

async function writeAssetSet(masterBuffer, baseName) {
  const jpgPath = join(OUTPUT_DIR, `${baseName}.jpg`);
  await sharp(masterBuffer)
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toFile(jpgPath);

  for (const { suffix, width } of [
    { suffix: '.webp', width: 1600 },
    { suffix: '-1024.webp', width: 1024 },
    { suffix: '-640.webp', width: 640 },
  ]) {
    await sharp(masterBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5, smartSubsample: true })
      .toFile(join(OUTPUT_DIR, `${baseName}${suffix}`));
  }

  await sharp(masterBuffer)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(join(OUTPUT_DIR, `${baseName}-social.jpg`));
}

const bramptonMaster = await sharp(
  join(
    ROOT,
    'public',
    'lovable-uploads',
    'blog-heroes-2026-07',
    'hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
  ),
)
  .resize(1600, 900, { fit: 'cover', position: 'centre' })
  .toBuffer();

await writeAssetSet(
  bramptonMaster,
  'hero-brampton-hbw-rice-lake-marina-authentic-2026-08',
);

function panelSvg({ width, height, fill, stroke = 'none', radius = 0 }) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect x="2" y="2" width="${width - 4}" height="${height - 4}" ` +
      `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>` +
    '</svg>',
  );
}

const orderingLeftCrest = await sharp(canonicalWhiteCrest)
  .resize({ width: 330 })
  .png()
  .toBuffer();
const orderingRightCrest = await sharp(canonicalBlackCrest)
  .resize({ width: 365 })
  .png()
  .toBuffer();
const orderingBase = await sharp(
  join(
    ROOT,
    'public',
    'lovable-uploads',
    'Ordering_Your_Mercury_What_to_Expect_Hero.png',
  ),
)
  .resize(1600, 900, { fit: 'cover', position: 'centre' })
  .toBuffer();
const orderingMaster = await sharp(orderingBase)
  .composite([
    {
      input: panelSvg({ width: 345, height: 255, fill: '#111315' }),
      left: 198,
      top: 5,
    },
    { input: orderingLeftCrest, left: 205, top: 13 },
    {
      input: panelSvg({
        width: 415,
        height: 270,
        fill: '#f1f3f2',
        stroke: '#202326',
        radius: 18,
      }),
      left: 1145,
      top: 3,
    },
    { input: orderingRightCrest, left: 1170, top: 10 },
  ])
  .toBuffer();

await writeAssetSet(
  orderingMaster,
  'hero-mercury-ordering-hbw-crest-corrected-2026-08',
);

const portableCrest = await sharp(canonicalBlackCrest)
  .resize({ width: 385 })
  .png()
  .toBuffer();
const portableBase = await sharp(
  join(ROOT, 'public', 'lovable-uploads', 'Mercury_Portable_Outboards.png'),
)
  .resize(1600, 900, { fit: 'cover', position: 'centre' })
  .toBuffer();
const portableMaster = await sharp(portableBase)
  .composite([
    {
      input: panelSvg({
        width: 410,
        height: 285,
        fill: '#ffffff',
        stroke: '#17191b',
        radius: 22,
      }),
      left: 55,
      top: 35,
    },
    { input: portableCrest, left: 68, top: 45 },
  ])
  .toBuffer();

await writeAssetSet(
  portableMaster,
  'hero-mercury-portable-hbw-crest-corrected-2026-08',
);

const familyRunaboutMaster = await sharp(
  join(ROOT, 'public', 'lovable-uploads', 'cuddy-115-hero-real.png'),
)
  .resize(1600, 900, { fit: 'cover', position: 'centre' })
  .toBuffer();

await writeAssetSet(
  familyRunaboutMaster,
  'hero-family-runabout-mercury-115-real-2026-08',
);

console.log(`Generated four responsive hero sets in ${OUTPUT_DIR}`);
