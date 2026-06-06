import type { LucideIcon } from 'lucide-react';

export interface HowItWorksCardProps {
  icon: LucideIcon;
  /** PNG/JPG fallback (kept for non-AVIF/WebP UAs). */
  image: string;
  /**
   * Optional basename of the optimized variants in /assets/optimized/
   * (e.g. "landing-step-pick"). When set, the card renders a responsive
   * <picture> with AVIF + WebP at 400/800/1600w.
   */
  imageBase?: string;
  /** Accessible alt text for the image (defaults to title). */
  alt?: string;
  /** Above-the-fold LCP candidate: eager-load with high fetchpriority. */
  priority?: boolean;
  title: string;
  body: string;
  stepNumber: number;
}

/**
 * Premium dark-theme card used in the "How it works" section.
 * Encapsulates hover/active styling, image zoom, gold ring + glow,
 * and consistent spacing across pages.
 */
export function HowItWorksCard({
  icon: Icon,
  image,
  imageBase,
  alt,
  priority = false,
  title,
  body,
  stepNumber,
}: HowItWorksCardProps) {
  const sizes = '(min-width: 768px) 33vw, 100vw';
  const widths = [400, 800, 1600];
  const buildSet = (ext: 'avif' | 'webp') =>
    widths.map((w) => `/assets/optimized/${imageBase}-${w}w.${ext} ${w}w`).join(', ');

  return (
    <li
      className="relative bg-[#0A1828] flex flex-col group overflow-hidden transition-all duration-500 ring-1 ring-[#F5F1EA]/10 md:ring-transparent rounded md:rounded-none hover:ring-[#C9A24A]/40 hover:shadow-[0_0_40px_-8px_rgba(201,162,74,0.35)] hover:z-10 active:ring-[#C9A24A]/50 active:shadow-[0_0_30px_-8px_rgba(201,162,74,0.4)]"
    >
      {/* Gold radial glow accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,74,0.12),_transparent_60%)]"
      />

      <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden border-b border-[#F5F1EA]/10 relative">
        {imageBase ? (
          <picture>
            <source type="image/avif" srcSet={buildSet('avif')} sizes={sizes} />
            <source type="image/webp" srcSet={buildSet('webp')} sizes={sizes} />
            <img
              src={image}
              alt={alt ?? title}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              width={800}
              height={600}
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110 group-active:scale-105"
            />
          </picture>
        ) : (
          <img
            src={image}
            alt={alt ?? title}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            width={800}
            height={600}
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110 group-active:scale-105"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0A1828]/60 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500"
        />
      </div>

      <div className="p-6 sm:p-8 md:p-10 flex-1 flex flex-col relative">
        <div className="flex items-center gap-3 mb-4 md:mb-5">
          <div className="h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-full border border-[#C9A24A]/40 bg-[#C9A24A]/10 text-[#C9A24A] flex items-center justify-center transition-all duration-500 group-hover:bg-[#C9A24A]/20 group-hover:border-[#C9A24A]/70">
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-sans font-semibold text-[11px] md:text-xs uppercase tracking-[0.22em] md:tracking-[0.24em] text-[#C9A24A]">
            Step {stepNumber}
          </span>
        </div>
        <h3 className="font-display font-semibold text-lg sm:text-xl md:text-2xl text-[#F5F1EA] mb-2 md:mb-3 tracking-tight transition-colors duration-500 group-hover:text-white">
          {title}
        </h3>
        <p className="font-sans font-light text-sm md:text-base text-[#F5F1EA]/70 md:text-[#F5F1EA]/65 leading-relaxed">
          {body}
        </p>
      </div>
    </li>
  );
}

/** Shared grid wrapper so spacing/dividers stay consistent across pages. */
export function HowItWorksGrid({ children }: { children: React.ReactNode }) {
  return (
    <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-px md:bg-[#F5F1EA]/10 mb-10 md:mb-12">
      {children}
    </ol>
  );
}
