#!/usr/bin/env tsx

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getSitemapEligibleArticles } from '../src/data/blogArticles';
import { frenchBlogArticles } from '../src/data/frenchBlogArticles';
import { koreanBlogArticles } from '../src/data/koreanBlogArticles';
import { mandarinBlogArticles } from '../src/data/mandarinBlogArticles';
import { spanishBlogArticles } from '../src/data/spanishBlogArticles';
import { punjabiBlogArticles } from '../src/data/punjabiBlogArticles';
import { urduBlogArticles } from '../src/data/urduBlogArticles';
import { tagalogBlogArticles } from '../src/data/tagalogBlogArticles';
import { hindiBlogArticles } from '../src/data/hindiBlogArticles';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const GENERATED_SOURCES_FILE = join(ROOT, 'src', 'data', 'blogSocialImageSources.generated.js');
const MANIFEST_FILE = join(ROOT, 'scripts', 'blog-og-images.manifest.json');
const WIDTH = 1200;
const HEIGHT = 630;
const TARGET_BYTES = 250 * 1024;
const MAX_BYTES = 300 * 1024;
const CONCURRENCY = 4;
const CHECK_ONLY = process.argv.includes('--check');

type ArticleLike = { image?: string };
type ManifestEntry = {
  source: string;
  output: string;
  sourceSha256: string;
  bytes: number;
  quality: number;
};

function sha256(file: string) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function toPublicFile(urlPath: string) {
  const pathname = decodeURIComponent(urlPath.split(/[?#]/, 1)[0]);
  const resolved = resolve(PUBLIC_DIR, pathname.replace(/^\/+/, ''));
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(`${PUBLIC_DIR}/`)) {
    throw new Error(`Refusing image path outside public/: ${urlPath}`);
  }
  return resolved;
}

function toOgPath(source: string) {
  const pathname = source.split(/[?#]/, 1)[0];
  return pathname.slice(0, -extname(pathname).length) + '-og.jpg';
}

function loadPreviousManifest() {
  try {
    const parsed = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
    return new Map<string, ManifestEntry>(
      Array.isArray(parsed.images) ? parsed.images.map((entry: ManifestEntry) => [entry.output, entry]) : [],
    );
  } catch {
    return new Map<string, ManifestEntry>();
  }
}

async function isValidOutput(file: string) {
  if (!existsSync(file) || statSync(file).size > MAX_BYTES) return false;
  const metadata = await sharp(file).metadata();
  return metadata.width === WIDTH && metadata.height === HEIGHT && metadata.format === 'jpeg';
}

async function buildOne(source: string, output: string, previous?: ManifestEntry): Promise<ManifestEntry> {
  const sourceFile = toPublicFile(source);
  const outputFile = toPublicFile(output);

  if (!existsSync(sourceFile)) throw new Error(`Blog hero does not exist: ${source}`);

  const sourceSha256 = sha256(sourceFile);
  if (
    previous?.sourceSha256 === sourceSha256 &&
    previous.output === output &&
    await isValidOutput(outputFile)
  ) {
    return { ...previous, bytes: statSync(outputFile).size };
  }

  if (CHECK_ONLY) throw new Error(`Stale or missing blog social image for ${source}`);

  mkdirSync(dirname(outputFile), { recursive: true });
  const base = sharp(sourceFile)
    .rotate()
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
    .flatten({ background: '#f4f4f2' });

  let chosen: Buffer | null = null;
  let chosenQuality = 0;
  for (const quality of [82, 78, 74, 70, 66, 62, 58, 54, 50, 46, 42]) {
    const candidate = await base
      .clone()
      .jpeg({ quality, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    chosen = candidate;
    chosenQuality = quality;
    if (candidate.length <= TARGET_BYTES) break;
  }

  if (!chosen || chosen.length > MAX_BYTES) {
    throw new Error(`Could not compress ${source} below ${MAX_BYTES} bytes`);
  }

  writeFileSync(outputFile, chosen);
  return { source, output, sourceSha256, bytes: chosen.length, quality: chosenQuality };
}

const articles: ArticleLike[] = [
  ...getSitemapEligibleArticles(),
  ...frenchBlogArticles,
  ...koreanBlogArticles,
  ...mandarinBlogArticles,
  ...spanishBlogArticles,
  ...punjabiBlogArticles,
  ...urduBlogArticles,
  ...tagalogBlogArticles,
  ...hindiBlogArticles,
];

const localSources = [...new Set(
  articles
    .map((article) => article.image)
    .filter((image): image is string => Boolean(image) && image!.startsWith('/') && !image!.endsWith('.svg')),
)].sort();

const sourcesByOutput = new Map<string, string[]>();
for (const source of localSources) {
  const output = toOgPath(source);
  const sources = sourcesByOutput.get(output) || [];
  sources.push(source);
  sourcesByOutput.set(output, sources);
}

const sourceRank = (source: string) => {
  const ext = extname(source).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.avif'].indexOf(ext);
};
const jobs = [...sourcesByOutput.entries()].map(([output, sources]) => ({
  output,
  sources,
  source: [...sources].sort((a, b) => sourceRank(a) - sourceRank(b))[0],
}));

const previous = loadPreviousManifest();
const results = new Array<ManifestEntry>(jobs.length);
let cursor = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (cursor < jobs.length) {
    const index = cursor++;
    const job = jobs[index];
    results[index] = await buildOne(job.source, job.output, previous.get(job.output));
  }
}));

const sourceToOutput = Object.fromEntries(
  jobs.flatMap((job) => job.sources.map((source) => [source, job.output])),
);
const sourceModule = `// Generated by scripts/build-blog-og-images.ts. Do not edit by hand.\n` +
  `// Maps every blog hero source to its dedicated 1200x630 social JPG.\n` +
  `export const BLOG_SOCIAL_IMAGE_BY_SOURCE = Object.freeze(${JSON.stringify(sourceToOutput, null, 2)});\n`;

const manifest = {
  version: 1,
  width: WIDTH,
  height: HEIGHT,
  targetBytes: TARGET_BYTES,
  images: results,
};

if (!CHECK_ONLY) {
  writeFileSync(GENERATED_SOURCES_FILE, sourceModule);
  writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
}

const totalBytes = results.reduce((sum, item) => sum + item.bytes, 0);
const largest = Math.max(...results.map((item) => item.bytes));
console.log(
  `[blog-og-images] ${CHECK_ONLY ? 'verified' : 'generated/verified'} ${results.length} unique social images ` +
  `for ${localSources.length} hero source path(s) ` +
  `(${(totalBytes / 1024 / 1024).toFixed(1)} MB total, largest ${(largest / 1024).toFixed(0)} KB)`,
);
