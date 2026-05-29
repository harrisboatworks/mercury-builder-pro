import { DollarSign, Calendar, Settings, HelpCircle, Phone } from 'lucide-react';

export interface PremiumFaqItem {
  question: string;
  answer: string;
}

export interface PremiumFaqProps {
  faqs: PremiumFaqItem[];
  heading?: string;
}

function pickIcon(question: string, answer: string) {
  const q = question.toLowerCase();
  const a = answer.toLowerCase();
  if (/905-?342-?2153/.test(answer)) return Phone;
  if (/price|cost|financ|payment|\$|cad|deposit|rate|apr/.test(q)) return DollarSign;
  if (/when|timing|season|how long|wait|time|schedule|spring|fall|winter|date/.test(q)) return Calendar;
  if (/service|maintenance|install|rig|repair|warranty|prop|setup|tune/.test(q) || /service|install|maintenance/.test(a)) return Settings;
  return HelpCircle;
}

export function PremiumFaq({ faqs, heading = 'Frequently Asked Questions' }: PremiumFaqProps) {
  if (!faqs?.length) return null;
  return (
    <section
      aria-labelledby="faq-heading"
      className="mt-14 pt-10 border-t border-repower-navy-900/10"
    >
      <header className="mb-8">
        <h2
          id="faq-heading"
          className="font-display font-bold text-repower-navy-900"
          style={{ fontSize: 'clamp(24px, 3vw, 30px)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
        >
          {heading}
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-repower-navy-900/30" />
          <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-navy-900/70">
            Straight answers from the shop floor
          </p>
        </div>
      </header>

      <ul className="flex flex-col gap-5 md:gap-6 list-none p-0 m-0">
        {faqs.map((faq, i) => {
          const Icon = pickIcon(faq.question, faq.answer);
          return (
            <li
              key={i}
              className="group relative rounded-md border border-repower-navy-900/10 bg-repower-cream p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <span aria-hidden="true" className="h-px w-6 bg-repower-mercury-red" />
                <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.22em] text-repower-mercury-red">
                  Asked at our desk
                </p>
              </div>

              <Icon
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="absolute top-6 right-6 md:top-8 md:right-8 text-repower-navy-900/30 group-hover:text-repower-navy-900/50 transition-colors"
              />

              <h3
                className="font-display font-bold text-repower-navy-900 pr-10 m-0"
                style={{ fontSize: 'clamp(18px, 2.2vw, 22px)', letterSpacing: '-0.015em', lineHeight: 1.25 }}
              >
                {faq.question}
              </h3>

              <p className="font-sans text-repower-navy-900/80 text-[16px] leading-relaxed mt-3 mb-0 faq-answer">
                {faq.answer}
              </p>

              <p className="mt-5 pt-4 border-t border-repower-navy-900/10 font-sans italic text-[12px] text-repower-navy-900/55 m-0">
                Jay Harris, Mercury dealer since 1965
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default PremiumFaq;
