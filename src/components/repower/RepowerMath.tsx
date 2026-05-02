export function RepowerMath() {
  return (
    <section className="bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C8102E] mb-4">
            The Repower Math
          </p>
          <h2
            className="font-display font-bold text-[clamp(40px,5vw,72px)] tracking-tight leading-[1.05] text-[#050E1C]"
            style={{ letterSpacing: '-0.035em' }}
          >
            A nearly-new boat <em className="not-italic text-[#C8102E] italic">experience</em>
            <br />
            at a fraction of the price.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: 70 / 30 card */}
          <div className="relative aspect-square lg:aspect-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#050E1C] via-[#0A1628] to-[#122039] p-10 md:p-14 flex flex-col justify-center text-center">
            <div
              className="font-display font-bold leading-none bg-gradient-to-b from-[#F5F1EA] to-[#C9A24A] bg-clip-text text-transparent"
              style={{ fontSize: 'clamp(120px,18vw,260px)', letterSpacing: '-0.05em' }}
            >
              70%
            </div>
            <div className="font-sans text-xs uppercase tracking-[0.3em] text-[#C9A24A] mt-3">
              of the benefit
            </div>
            <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#F5F1EA]/40 my-6">
              — for —
            </div>
            <div
              className="font-display font-bold leading-none text-[#F5F1EA]"
              style={{ fontSize: 'clamp(64px,10vw,140px)', letterSpacing: '-0.04em' }}
            >
              30%
            </div>
            <div className="font-sans text-xs uppercase tracking-[0.3em] text-[#F5F1EA]/55 mt-3">
              of the cost
            </div>
          </div>

          {/* Right: stat blocks */}
          <div className="flex flex-col justify-center divide-y divide-[#050E1C]/10">
            {[
              {
                n: '30–40%',
                t: 'Better Fuel Economy',
                d: 'Modern Mercury four-strokes sip fuel compared to older two-strokes — and they idle quietly enough to hold a conversation at cruise.',
              },
              {
                n: '$8–18k',
                t: 'Typical Rice Lake Repower',
                d: 'Complete installed package for a 16–18 ft boat with 60–115 HP. Engine, controls, rigging, prop, removal, install, and lake test — all in.',
              },
              {
                n: '1–2 days',
                t: 'In the Shop',
                d: 'Mercury-certified techs install in a day or two, then we lake-test on Rice Lake before you ever see the bill.',
              },
            ].map((s) => (
              <div key={s.t} className="py-8 first:pt-0 last:pb-0">
                <div
                  className="font-display font-bold text-[#C8102E] mb-2"
                  style={{ fontSize: 'clamp(36px,4.5vw,60px)', letterSpacing: '-0.035em' }}
                >
                  {s.n}
                </div>
                <h3 className="font-display font-semibold text-[22px] md:text-[26px] text-[#050E1C] mb-2 tracking-tight">
                  {s.t}
                </h3>
                <p className="font-sans font-light text-base md:text-lg text-[#050E1C]/65 leading-relaxed max-w-xl">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
