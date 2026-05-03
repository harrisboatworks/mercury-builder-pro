import { RepowerROICalculator } from './RepowerROICalculator';

/**
 * The Repower Math section.
 *
 * The 70/30 positioning is claimed once on the home hero. On /repower we
 * prove the same math interactively via the cost calculator instead of
 * restating it as a static stat card.
 */
export function RepowerMath() {
  return (
    <section className="bg-repower-paper">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-20 md:py-[120px]">
        <div className="max-w-3xl mb-10 md:mb-14">
          <p
            className="font-sans font-semibold text-[11px] md:text-xs uppercase text-repower-mercury-red mb-4 flex items-center gap-3"
            style={{ letterSpacing: '0.22em' }}
          >
            <span className="inline-block h-px w-8 bg-repower-mercury-red/60" aria-hidden="true" />
            The Repower Math
          </p>
          <h2
            className="font-display font-bold text-repower-navy-900 leading-[1.05] mb-6"
            style={{
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              letterSpacing: '-0.03em',
            }}
          >
            A nearly-new boat experience at a fraction of the price.
          </h2>
          <p className="font-sans text-[17px] md:text-[18px] leading-relaxed text-repower-navy-900/65 max-w-[60ch]">
            Run your own numbers below. Every input reflects current Mercury pricing for our shop.
          </p>
        </div>

        <div className="h-px w-full bg-repower-navy-900/10 mb-10 md:mb-14" aria-hidden="true" />

        <RepowerROICalculator />
      </div>
    </section>
  );
}
