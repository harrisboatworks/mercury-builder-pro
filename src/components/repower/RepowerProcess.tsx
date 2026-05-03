const steps = [
  { n: '01', t: 'Consultation & Quote', d: 'We assess your boat and recommend the right Mercury, sized to your hull, your water, and your weekends.' },
  { n: '02', t: 'Scheduling', d: 'Book your installation with the shortest wait times in the region. Winter slots fill first.' },
  { n: '03', t: 'Professional Installation', d: 'Mercury-certified techs install in 1–2 days. Rigging, controls, and propeller dialled in.' },
  { n: '04', t: 'Lake Test', d: 'We test on Rice Lake and walk you through every feature before you take her home.' },
];

export function RepowerProcess() {
  return (
    <section className="bg-[#050E1C] text-[#F5F1EA]">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-4">
            The Harris Repower Process
          </p>
          <h2
            className="font-display font-bold text-[clamp(40px,5vw,72px)] tracking-tight leading-[1.05]"
            style={{ letterSpacing: '-0.035em' }}
          >
            Simple. Transparent.
            <br />
            <em className="not-italic italic text-[#C8102E]">Done right.</em>
          </h2>
        </div>

        <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#F5F1EA]/10">
          {steps.map((s) => (
            <li
              key={s.n}
              className="bg-[#050E1C] p-8 md:p-10 flex flex-col group relative overflow-hidden"
            >
              <div
                className="font-display font-bold text-[#C9A24A]/20 leading-none mb-6 group-hover:text-[#C9A24A]/40 transition-colors duration-500"
                style={{ fontSize: 'clamp(56px,5vw,80px)', letterSpacing: '-0.04em' }}
              >
                {s.n}
              </div>
              <h3 className="font-display font-semibold text-xl md:text-2xl text-[#F5F1EA] mb-3 tracking-tight">
                {s.t}
              </h3>
              <p className="font-sans font-light text-sm md:text-base text-[#F5F1EA]/65 leading-relaxed">
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
