import imageVariantsManifest from '@/data/imageVariantsManifest.json';

interface ImageVariantsManifest {
  bases?: string[];
  widths?: Record<string, number[]>;
}

const manifest = imageVariantsManifest as ImageVariantsManifest;
const variantBaseSet = new Set(manifest.bases ?? []);

/**
 * Return a truthful width-descriptor srcset for pre-generated WebP variants.
 * The manifest records each variant file's real pixel width instead of
 * assuming every master is 1920 pixels wide.
 */
export function getResponsiveWebpSrcSet(image?: string): string | null {
  if (!image) return null;
  const match = /^(\/.+)\.(png|jpe?g)$/i.exec(image);
  const base = match?.[1];
  if (!base || !variantBaseSet.has(base)) return null;

  const widths = manifest.widths?.[base];
  if (!widths || widths.length !== 3 || widths.some((width) => !Number.isFinite(width))) {
    return null;
  }

  const sources = [
    `${base}-640.webp`,
    `${base}-1024.webp`,
    `${base}.webp`,
  ];
  const byWidth = new Map<number, string>();

  widths.forEach((width, index) => {
    if (width > 0) byWidth.set(width, sources[index]);
  });

  return [...byWidth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([width, src]) => `${src} ${width}w`)
    .join(', ');
}
