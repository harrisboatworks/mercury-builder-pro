import { Award, Calendar, BadgeCheck, Wrench } from 'lucide-react';

const pillars = [
  { icon: Award, n: 'CSI', t: 'Award Winner', d: "Mercury's highest honor for customer satisfaction, earned year after year." },
  { icon: Calendar, n: '1947', t: 'Family Owned', d: '78 years on the same shoreline. Three generations of marine expertise.' },
  { icon: BadgeCheck, n: '1965', t: 'Mercury Dealer', d: '60 years as an authorized Mercury dealer. Mercury-only since day one.' },
  { icon: Wrench, n: 'Certified', t: 'Repower Centre', d: "Mercury's top-tier repower certification. Specialised tooling, training, and parts." },
];

export function WhyHarrisRepower() {
  return (
    <section className="bg-repower-paper">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C8102E] mb-4">
            Why Harris Boat Works
          </p>
          <h2
            className="font-display font-bold text-[clamp(40px,5vw,72px)] tracking-tight leading-[1.05] text-[#050E1C]"
            style={{ letterSpacing: '-0.035em' }}
          >
            Your neighbours on the
            <br />
            <em className="not-italic italic text-[#C8102E]">water since 1947.</em>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#050E1C]/10 border border-[#050E1C]/10 rounded-2xl overflow-hidden">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.t}
                className="bg-repower-paper p-8 md:p-10 flex flex-col group hover:bg-white transition-colors duration-500"
              >
                <Icon className="w-7 h-7 text-[#C9A24A] mb-6" strokeWidth={1.5} />
                <div
                  className="font-display font-bold text-[#050E1C] leading-none mb-3"
                  style={{ fontSize: 'clamp(32px,3.5vw,48px)', letterSpacing: '-0.03em' }}
                >
                  {p.n}
                </div>
                <h3 className="font-display font-semibold text-lg text-[#050E1C] mb-3 tracking-tight">
                  {p.t}
                </h3>
                <p className="font-sans font-light text-sm text-[#050E1C]/65 leading-relaxed">
                  {p.d}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
