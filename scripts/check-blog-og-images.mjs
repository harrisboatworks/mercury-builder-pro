#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_BLOG = join(ROOT, 'dist', 'blog');
const SITE_ORIGIN = 'https://www.mercuryrepower.ca';
const MAX_BYTES = 300 * 1024;
const WIDTH = 1200;
const HEIGHT = 630;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

function meta(html, key, attr = 'property') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1];
}

const failures = [];
let checked = 0;
for (const htmlFile of walk(DIST_BLOG)) {
  const html = readFileSync(htmlFile, 'utf8');
  if (meta(html, 'og:type') !== 'article') continue;

  checked++;
  const ogImage = meta(html, 'og:image');
  const twitterImage = meta(html, 'twitter:image', 'name');
  const width = meta(html, 'og:image:width');
  const height = meta(html, 'og:image:height');

  if (!ogImage) {
    failures.push(`${htmlFile}: missing og:image`);
    continue;
  }
  if (twitterImage !== ogImage) failures.push(`${htmlFile}: twitter:image differs from og:image`);
  if (width !== String(WIDTH) || height !== String(HEIGHT)) {
    failures.push(`${htmlFile}: expected og:image dimensions ${WIDTH}x${HEIGHT}`);
  }

  const url = new URL(ogImage);
  if (url.origin !== SITE_ORIGIN) {
    failures.push(`${htmlFile}: external blog og:image is not locally verifiable (${ogImage})`);
    continue;
  }

  const imageFile = join(ROOT, 'dist', decodeURIComponent(url.pathname).replace(/^\/+/, ''));
  if (!existsSync(imageFile)) {
    failures.push(`${htmlFile}: og:image file missing (${url.pathname})`);
    continue;
  }

  const bytes = statSync(imageFile).size;
  const metadata = await sharp(imageFile).metadata();
  if (bytes > MAX_BYTES) failures.push(`${htmlFile}: og:image is ${(bytes / 1024).toFixed(0)} KB`);
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT || metadata.format !== 'jpeg') {
    failures.push(`${htmlFile}: og:image file is ${metadata.width}x${metadata.height} ${metadata.format}`);
  }
}

if (checked === 0) failures.push('No prerendered blog article pages were found');

if (failures.length) {
  console.error(`[check-blog-og-images] ${failures.length} failure(s):\n${failures.map((item) => `  - ${item}`).join('\n')}`);
  process.exit(1);
}

console.log(`[check-blog-og-images] verified ${checked} prerendered article pages at ${WIDTH}x${HEIGHT}, each <=300 KB`);
