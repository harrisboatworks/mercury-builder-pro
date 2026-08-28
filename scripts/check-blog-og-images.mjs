#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import {
  extractBlogImageRefs,
  getGeneratedOgFile,
  isLocalBlogImage,
  OG_HEIGHT,
  OG_MAX_BYTES,
  OG_WIDTH,
} from './lib/blog-og-images.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const CHECK_DIST = process.argv.includes('--dist');
const refs = extractBlogImageRefs(ROOT).filter(isLocalBlogImage);
const failures = [];
let checked = 0;

async function checkImage(output, label) {
  if (!existsSync(output)) {
    failures.push(`${label}: generated social image is missing`);
    return;
  }

  const bytes = statSync(output).size;
  if (bytes > OG_MAX_BYTES) {
    failures.push(`${label}: ${Math.ceil(bytes / 1024)} KB exceeds the 300 KB budget`);
  }

  try {
    const metadata = await sharp(output).metadata();
    if (metadata.format !== 'webp') failures.push(`${label}: expected WebP, got ${metadata.format || 'unknown'}`);
    if (metadata.width !== OG_WIDTH || metadata.height !== OG_HEIGHT) {
      failures.push(`${label}: expected ${OG_WIDTH}x${OG_HEIGHT}, got ${metadata.width}x${metadata.height}`);
    }
  } catch (error) {
    failures.push(`${label}: cannot inspect generated image (${error.message})`);
  }
  checked++;
}

function htmlFiles(dir, output = []) {
  if (!existsSync(dir)) return output;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(file, output);
    else if (entry.name === 'index.html') output.push(file);
  }
  return output;
}

if (CHECK_DIST) {
  const urls = new Set();
  let articleRoutes = 0;
  let generatedRoutes = 0;
  for (const file of htmlFiles(resolve(ROOT, 'dist', 'blog'))) {
    const html = readFileSync(file, 'utf8');
    const metas = new Map();
    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = match[0];
      const key = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
      const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
      if (key && content !== undefined) metas.set(key, content);
    }

    if (metas.get('og:type') !== 'article') continue;
    articleRoutes++;
    const image = metas.get('og:image');
    if (!image) {
      failures.push(`${file}: article route has no og:image`);
      continue;
    }

    const imageUrl = new URL(image, 'https://www.mercuryrepower.ca');
    if (imageUrl.hostname !== 'www.mercuryrepower.ca') continue;
    if (!imageUrl.pathname.startsWith('/generated-og/')) {
      failures.push(`${file}: local article og:image does not use the generated image pipeline`);
      continue;
    }

    generatedRoutes++;
    if (metas.get('og:image:width') !== String(OG_WIDTH)) failures.push(`${file}: og:image:width is missing or wrong`);
    if (metas.get('og:image:height') !== String(OG_HEIGHT)) failures.push(`${file}: og:image:height is missing or wrong`);
    if (metas.get('og:image:type') !== 'image/webp') failures.push(`${file}: og:image:type is missing or wrong`);
    urls.add(imageUrl.pathname);
  }

  if (!articleRoutes) failures.push('dist/blog: no prerendered article routes found');
  if (!generatedRoutes) failures.push('dist/blog: no generated blog social-image URLs found');
  for (const url of urls) {
    await checkImage(resolve(ROOT, 'dist', url.slice(1)), url);
  }
  console.log(`Checked ${articleRoutes} prerendered blog article routes; ${generatedRoutes} use local generated social images.`);
} else {
  if (!refs.length) failures.push('src/data: no local blog image references found');
  for (const ref of refs) {
    const output = getGeneratedOgFile(ROOT, ref);
    if (!output) {
      failures.push(`${ref}: generated social-image path could not be resolved`);
      continue;
    }
    await checkImage(output, ref);
  }
}

if (failures.length) {
  console.error('\nBlog social-image budget check FAILED\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Verified ${checked} ${CHECK_DIST ? 'emitted' : 'source'} blog social images: WebP, ${OG_WIDTH}x${OG_HEIGHT}, no file over 300 KB.`);
