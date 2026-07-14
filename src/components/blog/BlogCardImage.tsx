import { optimizeImage, buildSrcSet } from '@/lib/optimizeImage';

interface BlogCardImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  onError?: () => void;
}

const DEFAULT_SIZES = '(min-width: 768px) 33vw, 100vw';

function normalizeImageSrc(src: string) {
  if (!src) return '';
  if (src.startsWith('/') || /^https?:\/\//i.test(src)) return src;
  return `/lovable-uploads/${src}`;
}

export function BlogCardImage({
  src,
  alt,
  className,
  sizes = DEFAULT_SIZES,
  onError,
}: BlogCardImageProps) {
  const image = normalizeImageSrc(src);
  const isLocalRaster = /^\/.+\.(png|jpe?g)$/i.test(image);
  const base = isLocalRaster ? image.replace(/\.(png|jpe?g)$/i, '') : null;
  const webpSrcSet = base
    ? `${base}-640.webp 640w, ${base}-1024.webp 1024w, ${base}.webp 1920w`
    : null;

  const img = (
    <img
      src={optimizeImage(image, 640, 70)}
      srcSet={buildSrcSet(image, [320, 480, 640, 768, 1024], 70)}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={className}
      onError={onError}
    />
  );

  if (!webpSrcSet) return img;

  return (
    <picture>
      <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
      {img}
    </picture>
  );
}
