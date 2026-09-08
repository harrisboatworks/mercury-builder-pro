import { cn } from '@/lib/utils';
import {
  optimizeImage,
  buildSrcSet,
  isSvgImageSrc,
  stripForcedImageCropClasses,
} from '@/lib/optimizeImage';
import { getResponsiveWebpSrcSet } from '@/lib/responsiveImageVariants';

interface BlogCardImageProps {
  src?: string;
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
  const isSvg = isSvgImageSrc(image);
  const webpSrcSet = isSvg ? null : getResponsiveWebpSrcSet(image);
  const resolvedClassName = isSvg
    ? cn(stripForcedImageCropClasses(className), 'w-full h-full object-contain')
    : className;

  const img = (
    <img
      src={isSvg ? image : optimizeImage(image, 640, 70)}
      srcSet={isSvg ? undefined : buildSrcSet(image, [320, 480, 640, 768, 1024], 70)}
      sizes={isSvg ? undefined : sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={resolvedClassName}
      onError={onError}
    />
  );

  if (isSvg || !webpSrcSet) return img;

  return (
    <picture>
      <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
      {img}
    </picture>
  );
}
