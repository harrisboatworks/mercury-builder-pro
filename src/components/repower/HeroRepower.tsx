import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Phone, ChevronDown } from 'lucide-react';
import { RepowerCta } from './RepowerCta';
import { HERO_VARIATIONS } from './heroVariations';

const ease = [0.2, 0.8, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease },
});

// Hero stat row styling, tweak here to adjust all three stats together
// Mobile (<700px): vertical stacked list with gold left-border on each item.
// >=sm: horizontal row with hairline top/bottom border.
const statRowClass =
  'flex flex-col sm:flex-row sm:flex-nowrap items-stretch sm:items-baseline gap-3 sm:gap-10 md:gap-14 max-w-2xl mb-8 sm:border-y sm:border-[#F5F1EA]/15 sm:py-4 hidden min-[380px]:flex';
const statItemClass =
  'min-w-0 flex-1 pl-3 sm:pl-0 border-l-2 sm:border-l-0 border-[#C9A24A]';
const statNumberClass =
  'font-display font-bold text-[clamp(22px,3.6vw,42px)] text-[#F5F1EA] tabular-nums';
const statNumberStyle = {
  letterSpacing: '-0.035em',
  lineHeight: 1,
} as const;
const statLabelClass =
  'font-sans text-[10px] md:text-[11px] uppercase text-[#F5F1EA]/55 mt-1 sm:mt-2 leading-tight whitespace-nowrap overflow-hidden text-ellipsis';
const statLabelStyle = {
  letterSpacing: '0.16em',
} as const;

const STORAGE_KEY = 'hero-variant';
const DEFAULT_EYEBROW = 'Mercury Repower · Rice Lake · Since 1947';

/**
 * Pick a hero variation index, with priority:
 *  1. ?v=N query string (clamped to valid range, persisted)
 *  2. sessionStorage (stable per tab)
 *  3. Random (uniform), then persisted
 * Returns 0 (baseline) on the server / before hydration to avoid mismatch.
 */
function pickVariationIndex(): number {
  if (typeof window === 'undefined') return 0;
  const max = HERO_VARIATIONS.length;
  try {
    const params = new URLSearchParams(window.location.search);
    const qv = params.get('v');
    if (qv !== null) {
      const idx = parseInt(qv, 10);
      if (Number.isInteger(idx) && idx >= 0 && idx < max) {
        sessionStorage.setItem(STORAGE_KEY, String(idx));
        return idx;
      }
    }
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const idx = parseInt(stored, 10);
      if (Number.isInteger(idx) && idx >= 0 && idx < max) return idx;
    }
    const idx = Math.floor(Math.random() * max);
    sessionStorage.setItem(STORAGE_KEY, String(idx));
    return idx;
  } catch {
    return 0;
  }
}

export function HeroRepower() {
  // SSR/prerender renders baseline (0); hydration picks the real variation.
  const [variantIndex, setVariantIndex] = useState(0);
  // Defer mounting the <video> until after first paint / LCP. Until then the
  // <img> poster is the LCP element — it's preloaded in index.html with
  // fetchpriority=high so it can paint without competing with video metadata.
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const idx = pickVariationIndex();
    setVariantIndex(idx);

    // Fire a single hero_impression event per session, GA4 via window.gtag.
    // Deduped by sessionStorage so a route-back / re-mount doesn't double-count.
    try {
      const variant = HERO_VARIATIONS[idx] ?? HERO_VARIATIONS[0];
      const dedupeKey = `hero-impression-${variant.id}`;
      if (sessionStorage.getItem(dedupeKey) !== '1') {
        sessionStorage.setItem(dedupeKey, '1');
        const gtag = (window as any).gtag;
        if (typeof gtag === 'function') {
          gtag('event', 'hero_impression', {
            hero_variant_id: variant.id,
            hero_variant_index: idx,
            page_path: window.location.pathname,
          });
        }
      }
    } catch {
      // Swallow analytics errors - never break the hero on telemetry failure.
    }
  }, []);

  // Defer video to after LCP. Skip entirely on reduced-motion or Save-Data.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as any)?.connection?.saveData === true;
    if (reduceMotion || saveData) return;

    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    let handle: number | undefined;
    let timer: number | undefined;
    if (idle) {
      handle = idle(() => setShowVideo(true), { timeout: 2500 });
    } else {
      timer = window.setTimeout(() => setShowVideo(true), 1500);
    }
    return () => {
      if (handle && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(handle);
      }
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const variation = HERO_VARIATIONS[variantIndex] ?? HERO_VARIATIONS[0];

  return (
    <section
      data-hero-variant={variation.id}
      className="relative min-h-screen w-full overflow-hidden bg-[#050E1C] text-[#F5F1EA] flex items-center"
    >
      {/* LCP element: static poster image. Preloaded in index.html with
          fetchpriority=high; rendered eagerly so it paints before any video
          bytes arrive. */}
      <img
        src="/hero/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
        decoding="async"
        loading="eager"
        draggable={false}
      />
      {/* Background hero video loop — mounted after first paint / LCP. Skipped
          entirely on prefers-reduced-motion or Save-Data, and HIDDEN on mobile
          viewports (≤768px) where a 3.6 MB autoplay video kills LCP and burns
          mobile data. Mobile sees only the optimized static poster above. */}
      {showVideo && (
        <video
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/hero/hero-poster.jpg"
          aria-hidden="true"
        >
          <source src="/hero/hero-loop.webm" type="video/webm" />
          <source src="/hero/hero-loop.mp4" type="video/mp4" />
        </video>
      )}
      {/* Gradient overlay, softened so the video reads more clearly while keeping bottom legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,14,28,0.10) 0%, rgba(5,14,28,0.0) 30%, rgba(5,14,28,0.25) 60%, rgba(5,14,28,0.85) 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050E1C]/70 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-6 md:px-14 py-24 sm:py-20 md:py-28">
        <motion.p
          {...fadeUp(0)}
          className="font-sans font-semibold uppercase text-[#C9A24A] mb-6 whitespace-nowrap"
          style={{
            fontSize: 'clamp(9px, 2.6vw, 12px)',
            letterSpacing: 'clamp(0.08em, 0.4vw, 0.24em)',
          }}
        >
          {variation.eyebrow ?? DEFAULT_EYEBROW}
        </motion.p>

        <motion.h1
          {...fadeUp(0.2)}
          className="font-display font-bold tracking-tight leading-[1.05] sm:leading-[1.02] mb-8"
          style={{
            letterSpacing: '-0.035em',
            fontSize: 'clamp(36px, 9vw, 104px)',
            textWrap: 'balance',
          }}
        >
          {variation.heading}
        </motion.h1>

        <motion.p
          {...fadeUp(0.4)}
          className="font-sans font-light text-xl md:text-2xl text-[#F5F1EA]/85 max-w-2xl leading-relaxed mb-8"
        >
          {variation.subheading}
        </motion.p>

        {/* Stat row */}
        <motion.div {...fadeUp(0.6)} className={statRowClass}>
          {variation.stats.map((s) => (
            <div key={s.l} className={statItemClass}>
              <div className={statNumberClass} style={statNumberStyle}>
                {s.n}
              </div>
              <div className={statLabelClass} style={statLabelStyle}>{s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div {...fadeUp(0.8)} className="flex flex-col sm:flex-row gap-4">
          <RepowerCta to="/quote/motor-selection" variant="primary" size="lg">
            {variation.ctaLabel}
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </RepowerCta>
          <RepowerCta href="tel:9053422153" variant="secondary" size="lg">
            <Phone className="w-4 h-4" />
            (905) 342-2153
          </RepowerCta>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6, y: [0, 8, 0] }}
        transition={{ delay: 1.6, duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-[#F5F1EA]/60"
      >
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] mb-2">Scroll</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}
