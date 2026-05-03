import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Phone, ChevronDown } from 'lucide-react';
import { repowerImages } from './repowerImages';

const ease = [0.2, 0.8, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease },
});

// Hero stat row styling — tweak here to adjust all three stats together
const statRowClass =
  'flex flex-row flex-nowrap items-baseline gap-6 sm:gap-10 md:gap-14 max-w-2xl mb-8 border-y border-[#F5F1EA]/15 py-4';
const statItemClass = 'min-w-0 flex-1';
const statNumberClass =
  'font-display font-bold text-[clamp(24px,3.6vw,42px)] text-[#F5F1EA] tabular-nums';
const statNumberStyle = {
  letterSpacing: '-0.035em',
  lineHeight: 1,
} as const;
const statLabelClass =
  'font-sans text-[10px] md:text-[11px] uppercase text-[#F5F1EA]/55 mt-2 leading-tight whitespace-nowrap overflow-hidden text-ellipsis';
const statLabelStyle = {
  letterSpacing: '0.16em',
} as const;

const heroStats = [
  { n: '70%', l: 'of the benefit' },
  { n: '30%', l: 'of the cost' },
  { n: '79', l: 'years on the water' },
] as const;

export function HeroRepower() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#050E1C] text-[#F5F1EA] flex items-center">
      {/* Background hero video loop */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/hero/hero-poster.jpg"
        aria-hidden="true"
      >
        <source src="/hero/hero-loop.webm" type="video/webm" />
        <source src="/hero/hero-loop.mp4" type="video/mp4" />
      </video>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050E1C]/85 via-[#050E1C]/55 to-[#050E1C]/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050E1C]/80 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 md:px-14 py-20 md:py-28">
        <motion.p
          {...fadeUp(0)}
          className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6"
        >
          Ontario's Mercury Repower Centre · Rice Lake
        </motion.p>

        <motion.h1
          {...fadeUp(0.2)}
          className="font-display font-bold tracking-tight leading-[1.02] text-[clamp(48px,7vw,104px)] mb-8"
          style={{ letterSpacing: '-0.035em' }}
        >
          Keep your boat.
          <br />
          Get your <span className="text-[#C8102E]">weekends</span> back.
        </motion.h1>

        <motion.p
          {...fadeUp(0.4)}
          className="font-sans font-light text-base md:text-xl text-[#F5F1EA]/85 max-w-2xl leading-relaxed mb-8"
        >
          A nearly-new boat experience — at a fraction of the price. Mercury Marine Platinum Dealer, family-owned on Rice Lake since 1947.
        </motion.p>

        {/* Stat row */}
        <motion.div {...fadeUp(0.6)} className={statRowClass}>
          {heroStats.map((s) => (
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
          <Link
            to="/quote/motor-selection"
            className="group inline-flex items-center justify-center gap-2 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold shadow-lg shadow-[#C8102E]/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            Build Your Quote
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="tel:9053422153"
            className="inline-flex items-center justify-center gap-2 border border-[#F5F1EA]/30 text-[#F5F1EA] px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold hover:bg-[#F5F1EA]/5 transition-all duration-300"
          >
            <Phone className="w-4 h-4" />
            (905) 342-2153
          </a>
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
