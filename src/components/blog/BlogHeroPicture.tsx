import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  optimizeImage,
  buildSrcSet,
  isSvgImageSrc,
  stripForcedImageCropClasses,
} from '@/lib/optimizeImage';
import { getResponsiveWebpSrcSet } from '@/lib/responsiveImageVariants';

interface BlogHeroPictureProps {
  /** Hero source. When omitted, the component renders nothing (article displays with no hero). */
  image?: string;
  alt: string;
  /** Tailwind classes applied to the inner <img>. */
  className?: string;
  /** Override the default responsive sizes attribute. */
  sizes?: string;
  /** Optional error fallback (defaults to HBW Mercury Dealer block). */
  fallback?: React.ReactNode;
  /** Wrapper classes (photos default to 16:9; SVG diagrams keep their intrinsic ratio). */
  wrapperClassName?: string;
  /** Emits data-photo-slot on the hero <img> so a real photo can be swapped in later. */
  photoSlot?: string;
}

const DEFAULT_SIZES = '(min-width: 1280px) 1024px, (min-width: 768px) 80vw, 100vw';

/**
 * Shared hero <picture> for blog articles (English + all translated variants).
 * Emits pre-generated responsive WebP variants (-640, -1024, full) when the
 * source is a same-origin PNG/JPG/WebP listed in the variants manifest, with
 * a graceful <img srcSet> fallback.
 *
 * Keeping this in one place prevents drift across the 9 blog article
 * components — any future hero pipeline change happens here only.
 */
const DEFAULT_RASTER_WRAPPER =
  'aspect-[16/9] overflow-hidden rounded-lg bg-repower-paper border border-repower-navy-900/10 mb-10';
const DEFAULT_SVG_WRAPPER =
  'overflow-hidden rounded-lg bg-repower-paper border border-repower-navy-900/10 mb-10';

export function BlogHeroPicture({
  image,
  alt,
  className,
  sizes = DEFAULT_SIZES,
  fallback,
  wrapperClassName,
  photoSlot,
}: BlogHeroPictureProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!image) return null;

  const isSvg = isSvgImageSrc(image);
  const resolvedClassName = isSvg
    ? cn(stripForcedImageCropClasses(className), 'w-full h-auto')
    : (className ?? 'w-full h-full object-contain');
  const resolvedWrapperClassName = isSvg
    ? stripForcedImageCropClasses(wrapperClassName ?? DEFAULT_SVG_WRAPPER)
    : (wrapperClassName ?? DEFAULT_RASTER_WRAPPER);

  const defaultFallback = (
    <div className="w-full h-full flex items-center justify-center bg-repower-navy-900 text-white">
      <div className="text-center px-4">
        <span className="block text-3xl font-display font-bold tracking-tight">Harris Boat Works</span>
        <span className="block text-sm mt-1 opacity-80 uppercase tracking-widest">Mercury Authorized Dealer</span>
      </div>
    </div>
  );

  const webpSrcSet = getResponsiveWebpSrcSet(image);

  return (
    <div className={resolvedWrapperClassName} {...(photoSlot ? { 'data-photo-slot': photoSlot } : {})}>
      {errored ? (
        fallback ?? defaultFallback
      ) : (
        <picture>
          {!isSvg && !useOriginal && webpSrcSet && (
            <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
          )}
          <img
            src={isSvg || useOriginal ? image : optimizeImage(image, 1280)}
            srcSet={isSvg || useOriginal ? undefined : buildSrcSet(image)}
            sizes={isSvg ? undefined : sizes}
            alt={alt}
            className={resolvedClassName}
            loading="eager"
            fetchPriority="high"
            onError={() => {
              if (!useOriginal && optimizeImage(image, 1280) !== image) {
                setUseOriginal(true);
                return;
              }

              setErrored(true);
            }}
          />
        </picture>
      )}
    </div>
  );
}
