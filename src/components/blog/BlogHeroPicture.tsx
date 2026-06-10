import { useState } from 'react';
import { optimizeImage, buildSrcSet } from '@/lib/optimizeImage';

interface BlogHeroPictureProps {
  image: string;
  alt: string;
  /** Tailwind classes applied to the inner <img>. */
  className?: string;
  /** Override the default responsive sizes attribute. */
  sizes?: string;
  /** Optional error fallback (defaults to HBW Mercury Dealer block). */
  fallback?: React.ReactNode;
  /** Wrapper classes (defaults to aspect-[16/9] rounded card). */
  wrapperClassName?: string;
  /** Emits data-photo-slot on the hero <img> so a real photo can be swapped in later. */
  photoSlot?: string;
}

const DEFAULT_SIZES = '(min-width: 1280px) 1024px, (min-width: 768px) 80vw, 100vw';

/**
 * Shared hero <picture> for blog articles (English + all translated variants).
 * Emits pre-generated responsive WebP variants (-640, -1024, full) when the
 * source is a same-origin PNG/JPG, with a graceful <img srcSet> fallback.
 *
 * Keeping this in one place prevents drift across the 9 blog article
 * components — any future hero pipeline change happens here only.
 */
export function BlogHeroPicture({
  image,
  alt,
  className = 'w-full h-full object-contain',
  sizes = DEFAULT_SIZES,
  fallback,
  wrapperClassName = 'aspect-[16/9] overflow-hidden rounded-lg bg-repower-paper border border-repower-navy-900/10 mb-10',
  photoSlot,
}: BlogHeroPictureProps) {
  const [errored, setErrored] = useState(false);

  const defaultFallback = (
    <div className="w-full h-full flex items-center justify-center bg-repower-navy-900 text-white">
      <div className="text-center px-4">
        <span className="block text-3xl font-display font-bold tracking-tight">Harris Boat Works</span>
        <span className="block text-sm mt-1 opacity-80 uppercase tracking-widest">Mercury Authorized Dealer</span>
      </div>
    </div>
  );

  const isLocalRaster = /^\/.+\.(png|jpe?g)$/i.test(image);
  const base = isLocalRaster ? image.replace(/\.(png|jpe?g)$/i, '') : null;
  const webpSrcSet = base
    ? `${base}-640.webp 640w, ${base}-1024.webp 1024w, ${base}.webp 1920w`
    : null;

  return (
    <div className={wrapperClassName} {...(photoSlot ? { 'data-photo-slot': photoSlot } : {})}>
      {errored ? (
        fallback ?? defaultFallback
      ) : (
        <picture>
          {webpSrcSet && (
            <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
          )}
          <img
            src={optimizeImage(image, 1280)}
            srcSet={buildSrcSet(image)}
            sizes={sizes}
            alt={alt}
            className={className}
            loading="eager"
            fetchPriority="high"
            onError={() => setErrored(true)}
          />
        </picture>
      )}
    </div>
  );
}
