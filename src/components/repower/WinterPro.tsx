import { Snowflake } from 'lucide-react';

const benefits = [
  { t: 'Best Availability', d: 'First pick of every motor in the lineup before the spring rush.' },
  { t: 'No Wait', d: 'Quietest shop time of the year means the fastest possible turnaround.' },
  { t: 'Ready for Launch Day', d: "When the ice comes off Rice Lake, you're already on the water." },
];

export function WinterPro() {
  return (
    <section className="bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#050E1C] text-[#C9A24A] mb-8">
              <Snowflake className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C8102E] mb-4">
              Pro Tip
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-tight leading-[1.05] text-[#050E1C]"
              style={{ letterSpacing: '-0.035em' }}
            >
              Repower in
              <br />
              <em className="not-italic italic text-[#C8102E]">winter.</em>
            </h2>
            <p className="font-sans font-light text-base md:text-lg text-[#050E1C]/65 leading-relaxed mt-6 max-w-md">
              The smartest boaters book between November and March. Here's why it pays.
            </p>
          </div>

          <ul className="lg:col-span-7 divide-y divide-[#050E1C]/10 border-y border-[#050E1C]/10">
            {benefits.map((b) => (
              <li key={b.t} className="py-8 md:py-10 grid md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                <h3 className="md:col-span-4 font-display font-semibold text-xl md:text-2xl text-[#050E1C] tracking-tight">
                  {b.t}
                </h3>
                <p className="md:col-span-8 font-sans font-light text-base md:text-lg text-[#050E1C]/65 leading-relaxed">
                  {b.d}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
