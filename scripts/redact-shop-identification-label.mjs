#!/usr/bin/env node
/**
 * Pixelates the identification-label region on the shop transom-bracket hero
 * and its committed -1024/-640 variants. Coordinates are relative to the
 * 1600x900 master. Does not print or persist any label text.
 *
 * Usage: node scripts/redact-shop-identification-label.mjs
 */

import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MASTER_BOX = { left: 590, top: 300, width: 240, height: 250 };
const MASTER_WIDTH = 1600;
const FILES = [
  { file: new URL('../public/images/shop/mercury-115-serial-model-label-transom.webp', import.meta.url), width: 1600 },
  { file: new URL('../public/images/shop/mercury-115-serial-model-label-transom-1024.webp', import.meta.url), width: 1024 },
  { file: new URL('../public/images/shop/mercury-115-serial-model-label-transom-640.webp', import.meta.url), width: 640 },
];

function scaledBox(targetWidth) {
  const scale = targetWidth / MASTER_WIDTH;
  return {
    left: Math.round(MASTER_BOX.left * scale),
    top: Math.round(MASTER_BOX.top * scale),
    width: Math.max(8, Math.round(MASTER_BOX.width * scale)),
    height: Math.max(8, Math.round(MASTER_BOX.height * scale)),
  };
}

for (const { file, width: expectedWidth } of FILES) {
  const path = fileURLToPath(file);
  const image = sharp(path);
  const metadata = await image.metadata();
  if (metadata.width !== expectedWidth) {
    throw new Error(`${basename(path)} width ${metadata.width} !== ${expectedWidth}`);
  }
  const box = scaledBox(expectedWidth);
  const pixelated = await sharp(path)
    .extract(box)
    .resize(8, 6, { kernel: 'nearest', fit: 'fill' })
    .resize(box.width, box.height, { kernel: 'nearest', fit: 'fill' })
    .blur(6)
    .toBuffer();
  await sharp(path)
    .composite([{ input: pixelated, left: box.left, top: box.top }])
    .webp({ quality: 82 })
    .toFile(`${path}.redacted`);
  await sharp(`${path}.redacted`).toFile(path);
  await sharp.cache(false);
  const { unlinkSync } = await import('node:fs');
  unlinkSync(`${path}.redacted`);
  console.log(`redacted ${basename(path)} box=${box.left},${box.top} ${box.width}x${box.height}`);
}
