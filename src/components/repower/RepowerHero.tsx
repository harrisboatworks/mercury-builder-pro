import { Phone, ChevronRight } from 'lucide-react';
import { RepowerCta } from './RepowerCta';

/**
 * Compact, content-page hero for /repower.
 * Distinct from the home page video hero. Paper background, navy type,
 * red eyebrow, gold hairline divider, and the 70/30 positioning as a
 * small inline pill rather than a full stat row.
 */
export function RepowerHero() {
  return (
    <section className="relative bg-repower-paper pt-28 md:pt-32 pb-20 md:pb-28 px-6 md:px-14 border-b border-repower-navy-900/10">
      <div className="max-w-[1400px] mx-auto">
        <p
          className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-5 flex items-center gap-3"
        >
          <span className="inline-block h-px w-8 bg-repower-mercury-red/60" aria-hidden="true" />
          Mercury Outboard Repower · Ontario
        </p>

        <h1
          className="font-display font-bold text-repower-navy-900 leading-[1.05] mb-6 max-w-[18ch]"
          style={{
            fontSize: 'clamp(40px, 5vw, 72px)',
            letterSpacing: '-0.025em',
          }}
        >
          Keep your boat. Upgrade your engine.
        </h1>

        <p className="font-sans text-[17px] md:text-[18px] leading-relaxed text-repower-navy-900/65 max-w-[60ch] mb-8">
          A new Mercury costs a fraction of a new boat, and you keep the hull you already know. Your boat is with us for 2 to 5 days, drop-off to pickup, at our Gores Landing shop on Rice Lake.
        </p>

        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <div className="h-px w-12 bg-repower-gold" aria-hidden="true" />
          <div className="inline-flex flex-col items-center gap-2 rounded-2xl border border-repower-gold/40 bg-repower-cream px-6 py-4">
            <div className="inline-flex items-baseline gap-2">
              <span
                className="font-display font-bold text-repower-navy-900 text-[20px] md:text-[22px] tabular-nums"
                style={{ letterSpacing: '-0.03em' }}
              >
                70%
              </span>
              <span className="font-sans text-[12px] uppercase tracking-[0.18em] text-repower-navy-900/60">
                of the benefit
              </span>
            </div>
            <div className="inline-flex items-baseline gap-2">
              <span
                className="font-display font-bold text-repower-navy-900 text-[20px] md:text-[22px] tabular-nums"
                style={{ letterSpacing: '-0.03em' }}
              >
                30%
              </span>
              <span className="font-sans text-[12px] uppercase tracking-[0.18em] text-repower-navy-900/60">
                of the cost
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <RepowerCta to="/quote/motor-selection" variant="primary" size="lg">
            Build Your Quote
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </RepowerCta>
          <a
            href="tel:+19053422153"
            className="group inline-flex items-center justify-center gap-2 rounded border border-repower-navy-900/25 text-repower-navy-900 px-8 py-4 font-sans font-semibold uppercase tracking-wider text-sm transition-all duration-300 hover:border-repower-navy-900/60 hover:bg-repower-navy-900/[0.03]"
          >
            <Phone className="w-4 h-4" />
            (905) 342-2153
          </a>
        </div>
      </div>
    </section>
  );
}
