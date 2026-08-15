import { readdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_MAX_BYTES = 300 * 1024;
export const OG_TARGET_BYTES = 285 * 1024;
export const OG_PUBLIC_PREFIX = '/generated-og/';

const BLOG_DATA_RE = /^(?:blogArticles|(?:french|hindi|korean|mandarin|punjabi|spanish|tagalog|traditionalChinese|urdu)BlogArticles)\.ts$/;
const IMAGE_FIELD_RE = /(?:socialImage|image):\s*['"]([^'"]+)['"]/g;
const IMPORTED_IMAGE_RE = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]@\/assets\/([^'"]+\.(?:png|jpe?g|webp|svg))['"]/gi;
const IMAGE_IDENTIFIER_RE = /(?:socialImage|image):\s*([A-Za-z_$][\w$]*)\s*[,}]/g;
const LOCAL_IMAGE_RE = /^\/(?!\/)(.+\.(?:png|jpe?g|webp|svg))$/i;

export function blogDataFiles(root) {
  const dataDir = resolve(root, 'src', 'data');
  return readdirSync(dataDir)
    .filter((file) => BLOG_DATA_RE.test(file))
    .sort()
    .map((file) => resolve(dataDir, file));
}

export function extractBlogImageRefs(root) {
  const refs = new Set();
  for (const file of blogDataFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(IMAGE_FIELD_RE)) refs.add(match[1]);
    const importedImages = new Map(
      [...source.matchAll(IMPORTED_IMAGE_RE)].map((match) => [match[1], `/src/assets/${match[2]}`]),
    );
    for (const match of source.matchAll(IMAGE_IDENTIFIER_RE)) {
      const importedPath = importedImages.get(match[1]);
      if (importedPath) refs.add(importedPath);
    }
  }
  return [...refs].sort();
}

export function getGeneratedOgPublicPath(imagePath) {
  const match = imagePath?.match(LOCAL_IMAGE_RE);
  if (!match) return imagePath;
  return `${OG_PUBLIC_PREFIX}${match[1]}.webp`;
}

export function getSourceFile(root, imagePath) {
  if (!imagePath.startsWith('/') || imagePath.includes('..')) return null;
  if (imagePath.startsWith('/src/')) return resolve(root, imagePath.slice(1));
  return resolve(root, 'public', imagePath.slice(1));
}

export function getGeneratedOgFile(root, imagePath) {
  const publicPath = getGeneratedOgPublicPath(imagePath);
  if (!publicPath?.startsWith(OG_PUBLIC_PREFIX)) return null;
  return resolve(root, 'public', publicPath.slice(1));
}

export function isLocalBlogImage(imagePath) {
  return LOCAL_IMAGE_RE.test(imagePath || '');
}

export function sourceExtension(imagePath) {
  return extname(imagePath).toLowerCase();
}
