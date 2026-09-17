import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, ChevronDown } from 'lucide-react';
import { RepowerCta } from './RepowerCta';
import { HERO_VARIATIONS } from './heroVariations';
import seoPageMetadata from '@/data/seoPageMetadata.json';

const ease = [0.2, 0.8, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease },
});

const statRowClass =
  'flex flex-col sm:flex-row sm:flex-nowrap items-stretch sm:items-baseline gap-3 sm:gap-10 md:gap-14 max-w-2xl mb-8 sm:border-y sm:border-[#F5F1EA]/15 sm:py-4 hidden min-[380px]:flex';
const statItemClass =
  'min-w-0 flex-1 pl-3 sm:pl-0 border-l-2 sm:border-l-0 border-[#C9A24A]';
const statNumberClass =
  'font-display font-bold text-[clamp(22px,3.6vw,42px)] text-[#F5F1EA] tabular-nums';
const statNumberStyle = { letterSpacing: '-0.035em', lineHeight: 1 } as const;
const statLabelClass =
  'font-sans text-[10px] md:text-[11px] uppercase text-[#F5F1EA]/70 max-md:text-[#F5F1EA]/95 mt-1 sm:mt-2 leading-tight sm:max-w-[18ch]';
const statLabelStyle = { letterSpacing: '0.16em' } as const;

const DEFAULT_EYEBROW = 'Mercury Repower · Rice Lake · Since 1947';
const ACCENT = 'text-[#C8102E]';

// Single source of truth for the homepage H1. The prerenderer reads the same
// value from src/data/seoPageMetadata.json, so prerendered and hydrated markup
// carry an identical heading string.
const HOME_H1_LINES = seoPageMetadata.home.h1.split('. ').map((part, i, all) =>
  i === all.length - 1 ? part : `${part}.`,
);

export function HeroRepower() {
  // Lock to baseline variation (stable subhead/stats/CTAs per brief).
  const variation = HERO_VARIATIONS[0];

  const [showVideo, setShowVideo] = useState(false);

  // Fade the trust line out early on scroll so it never visually collides with the sticky nav.
  const { scrollY } = useScroll();
  const trustLineOpacity = useTransform(scrollY, [120, 380], [1, 0]);

  // Defer video to after LCP. Skip on reduced-motion / Save-Data.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as any)?.connection?.saveData === true;
    if (rm || saveData) return;
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    let handle: number | undefined;
    let timer: number | undefined;
    if (idle) handle = idle(() => setShowVideo(true), { timeout: 2500 });
    else timer = window.setTimeout(() => setShowVideo(true), 1500);
    return () => {
      if (handle && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      if (timer) window.clearTimeout(timer);
    };
  }, []);


  return (
    <section
      data-hero-variant={variation.id}
      className="relative min-h-screen w-full overflow-hidden bg-[#050E1C] text-[#F5F1EA] flex items-center"
    >
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
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,14,28,0.10) 0%, rgba(5,14,28,0.0) 30%, rgba(5,14,28,0.25) 60%, rgba(5,14,28,0.85) 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050E1C]/70 via-transparent to-transparent" />
      {/* Top scrim: keeps the gold eyebrow legible over bright sky frames and separates the hero from the sticky nav */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 md:h-48"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,14,28,0.72) 0%, rgba(5,14,28,0.38) 55%, rgba(5,14,28,0) 100%)',
        }}
      />
      {/* Mobile-only tint: sits behind the text container (z-10) so the subhead, stats and trust line read over bright photo frames. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,14,28,.35) 0%, rgba(5,14,28,.62) 30%, rgba(5,14,28,.62) 70%, rgba(5,14,28,.45) 100%)',
        }}
      />

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
          {/* Static H1. Must stay byte-identical to seoPageMetadata.home.h1 so the
              prerendered heading and the hydrated heading are the same string. */}
          <span className="block">{HOME_H1_LINES[0]}</span>
          <span className={`block ${ACCENT}`}>{HOME_H1_LINES[1]}</span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.4)}
          className="font-sans font-normal md:font-light text-xl md:text-2xl text-white md:text-[#F5F1EA]/85 max-w-2xl leading-relaxed mb-8"
        >
          {variation.subheading}
        </motion.p>

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

        <motion.div {...fadeUp(0.8)} className="flex flex-col sm:flex-row gap-4">
          <RepowerCta
            to="/quote/motor-selection"
            variant="primary"
            size="lg"
            data-cta="quote-start"
            data-cta-location="home_hero"
          >
            {variation.ctaLabel}
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </RepowerCta>
          <RepowerCta href="tel:9053422153" variant="secondary" size="lg" data-cta-location="home_hero_phone">
            <Phone className="w-4 h-4" />
            (905) 342-2153
          </RepowerCta>
        </motion.div>

        {/* Quiet secondary text-link CTA */}
        <motion.div {...fadeUp(0.95)} className="mt-5">
          <Link
            to="/blog/repair-repower-or-sell-boat-ontario-decision-guide"
            className="inline-flex items-center gap-1.5 font-sans text-sm text-[#F5F1EA]/75 underline underline-offset-4 decoration-[#F5F1EA]/30 hover:text-[#F5F1EA] hover:decoration-[#C9A24A] transition-colors"
          >
            Check if my boat is worth repowering
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Persistent trust line, fades out on scroll before it can collide with the sticky nav */}
        <motion.div style={{ opacity: trustLineOpacity }}>
          <motion.p
            {...fadeUp(1.05)}
            className="mt-4 font-sans text-[12px] md:text-[13px] text-[#F5F1EA]/95 md:text-[#F5F1EA]/65 max-w-2xl leading-relaxed"
          >
            We'll tell you no if a repower isn't right. Mercury dealer since 1965, and we plan to keep it that way.
          </motion.p>
        </motion.div>
      </div>

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
