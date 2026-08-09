#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import {
  extractBlogImageRefs,
  getGeneratedOgFile,
  getSourceFile,
  isLocalBlogImage,
  OG_HEIGHT,
  OG_TARGET_BYTES,
  OG_WIDTH,
} from './lib/blog-og-images.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'public', 'generated-og');
const BACKGROUND = { r: 8, g: 21, b: 34, alpha: 1 };
const QUALITY_STEPS = [78, 70, 62, 54, 46, 38];

rmSync(OUTPUT_DIR, { recursive: true, force: true });

const refs = extractBlogImageRefs(ROOT).filter(isLocalBlogImage);
const failures = [];
let generated = 0;

for (const ref of refs) {
  const source = getSourceFile(ROOT, ref);
  const output = getGeneratedOgFile(ROOT, ref);
  if (!source || !output || !existsSync(source)) {
    failures.push(`${ref}: source asset is missing`);
    continue;
  }

  mkdirSync(dirname(output), { recursive: true });
  let accepted = false;
  for (const quality of QUALITY_STEPS) {
    try {
      await sharp(source, { failOn: 'error' })
        .rotate()
        .resize(OG_WIDTH, OG_HEIGHT, {
          fit: 'contain',
          position: 'centre',
          background: BACKGROUND,
        })
        .flatten({ background: BACKGROUND })
        .webp({ quality, effort: 4 })
        .toFile(output);

      if (statSync(output).size <= OG_TARGET_BYTES) {
        accepted = true;
        break;
      }
    } catch (error) {
      failures.push(`${ref}: ${error.message}`);
      break;
    }
  }

  if (!accepted && existsSync(output)) {
    failures.push(`${ref}: could not reach the ${Math.round(OG_TARGET_BYTES / 1024)} KB target`);
  } else if (accepted) {
    generated++;
  }
}

if (failures.length) {
  console.error('\nBlog social-image generation FAILED\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Generated ${generated} blog social images at ${OG_WIDTH}x${OG_HEIGHT}, each at or below ${Math.round(OG_TARGET_BYTES / 1024)} KB.`);
