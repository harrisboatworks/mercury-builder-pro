import { Snowflake, Check } from 'lucide-react';

const benefits = [
  { t: 'Best Availability', d: 'First pick of every motor in the lineup before the spring rush.' },
  { t: 'No Wait', d: 'Quietest shop time of the year means the fastest possible turnaround.' },
  { t: 'Ready for Launch Day', d: "When the ice comes off Rice Lake, you're already on the water." },
];

export function WinterPro() {
  return (
    <section className="bg-repower-navy-900 text-repower-cream">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <Snowflake className="w-10 h-10 text-repower-gold mb-8" strokeWidth={1.5} />
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-repower-gold mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-gold/60" />
              Pro Tip
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-tight leading-[1.05] text-repower-cream"
              style={{ letterSpacing: '-0.035em' }}
            >
              Repower in
              <br />
              <em className="not-italic italic text-repower-mercury-red">winter.</em>
            </h2>
            <p className="font-sans font-light text-base md:text-lg text-repower-cream/65 leading-relaxed mt-6 max-w-md">
              The smartest boaters book between November and March. Here's why it pays.
            </p>
          </div>

          <ul className="lg:col-span-7 space-y-6">
            {benefits.map((b) => (
              <li key={b.t} className="flex flex-row items-start gap-4 border-b border-repower-cream/10 pb-6 last:border-b-0">
                <Check className="w-5 h-5 text-repower-gold flex-shrink-0 mt-1" strokeWidth={2} />
                <div>
                  <h3 className="font-display font-semibold text-xl md:text-2xl text-repower-cream tracking-tight mb-1">
                    {b.t}
                  </h3>
                  <p className="font-sans font-light text-base md:text-lg text-repower-cream/65 leading-relaxed">
                    {b.d}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
