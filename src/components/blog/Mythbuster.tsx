import { AlertTriangle } from 'lucide-react';

export interface MythbusterItem {
  claim: string;
  rebuttal: string;
}

export interface MythbusterProps {
  items: MythbusterItem[];
  heading?: string;
}

function splitFirstSentence(text: string): { first: string; rest: string } {
  const m = /^(.*?[.!?])(\s+)([\s\S]+)$/.exec(text.trim());
  if (!m) return { first: text.trim(), rest: '' };
  return { first: m[1], rest: m[3] };
}

export function Mythbuster({ items, heading = 'Common mistakes' }: MythbusterProps) {
  if (!items?.length) return null;
  return (
    <section className="my-10">
      <header className="mb-8">
        <h2
          className="font-display font-bold text-repower-navy-900"
          style={{ fontSize: 'clamp(24px, 3vw, 30px)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
        >
          {heading}
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-repower-navy-900/30" />
          <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-navy-900/70">
            What customers get wrong and why
          </p>
        </div>
      </header>

      <ul className="flex flex-col gap-5 md:gap-6 list-none p-0 m-0">
        {items.map((item, i) => {
          const { first, rest } = splitFirstSentence(item.rebuttal);
          return (
            <li
              key={i}
              className="group relative rounded-md border border-repower-navy-900/10 border-l-4 border-l-repower-mercury-red/40 bg-repower-cream p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 md:gap-6">
                <div className="flex md:block">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-repower-mercury-red/10 text-repower-mercury-red"
                  >
                    <AlertTriangle size={22} strokeWidth={2} />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span aria-hidden="true" className="h-px w-6 bg-repower-mercury-red" />
                    <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.22em] text-repower-mercury-red m-0">
                      Myth
                    </p>
                  </div>
                  <p
                    className="font-display italic text-gray-700 m-0"
                    style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', lineHeight: 1.4 }}
                  >
                    &ldquo;{item.claim.replace(/^["']|["']$/g, '')}&rdquo;
                  </p>

                  <div aria-hidden="true" className="my-5 h-px bg-repower-navy-900/10" />

                  <div className="flex items-center gap-3 mb-2">
                    <span aria-hidden="true" className="h-px w-6 bg-repower-navy-900/40" />
                    <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.22em] text-repower-navy-900/70 m-0">
                      What we tell customers
                    </p>
                  </div>
                  <p className="font-sans text-[16px] leading-relaxed m-0">
                    <span className="font-bold text-repower-navy-900">{first}</span>
                    {rest ? (
                      <span className="text-repower-navy-900/85"> {rest}</span>
                    ) : null}
                  </p>

                  <div aria-hidden="true" className="mt-5 pt-4 border-t border-repower-navy-900/10" />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default Mythbuster;
