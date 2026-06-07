import { Link } from 'react-router-dom';
import { ArrowRight, HelpCircle, DollarSign, Anchor } from 'lucide-react';

interface ObjectionCardData {
  icon: typeof HelpCircle;
  heading: string;
  body: string;
  linkText: string;
  href: string;
}

const CARDS: ObjectionCardData[] = [
  {
    icon: HelpCircle,
    heading: 'Is my boat worth repowering?',
    body: 'If the hull is solid, usually yes. Transom, floor, stringers: we check all three before we quote anything.',
    linkText: 'See how to tell',
    href: '/blog/repair-repower-or-sell-boat-ontario-decision-guide',
  },
  {
    icon: DollarSign,
    heading: 'What will it cost?',
    body: 'Real CAD prices, posted publicly. Motor, rigging, and install in one number. Build yours in about 3 minutes.',
    linkText: 'See every price',
    href: '/pricing-reference',
  },
  {
    icon: Anchor,
    heading: 'Will it be set up right?',
    body: 'Every repower gets an on-water test on Rice Lake before pickup. No exceptions.',
    linkText: 'What happens at the shop',
    href: '/blog/boat-repower-process-step-by-step',
  },
];

/**
 * Three scannable objection-handling cards rendered directly below the hero.
 * Uses the site's paper/navy card grammar to sit between the dark hero and
 * the cream "Pickup at Gores Landing" band cleanly.
 */
export function ObjectionStrip() {
  return (
    <section
      aria-label="Common questions about repowering"
      className="bg-repower-paper border-b border-repower-navy-900/10 py-12 md:py-16 px-4 sm:px-6 md:px-14"
    >
      <div className="max-w-[1200px] mx-auto">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <li
                key={card.heading}
                className="group relative flex flex-col rounded-lg border border-repower-navy-900/15 bg-repower-cream p-6 md:p-7 transition-all duration-300 hover:border-repower-gold/50 hover:shadow-[0_6px_24px_-12px_rgba(10,24,40,0.25)]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 shrink-0 rounded-full border border-repower-gold/40 bg-repower-gold/10 text-repower-gold flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3
                  className="font-display font-semibold text-lg md:text-xl text-repower-navy-900 mb-2 tracking-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {card.heading}
                </h3>
                <p className="font-sans font-light text-sm md:text-base text-repower-navy-900/75 leading-relaxed mb-5 flex-1">
                  {card.body}
                </p>
                <Link
                  to={card.href}
                  className="inline-flex items-center gap-1.5 font-sans font-semibold text-sm text-repower-mercury-red hover:text-repower-navy-900 transition-colors"
                >
                  {card.linkText}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
