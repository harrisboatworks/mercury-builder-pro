import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * Visible FAQ block rendered at the bottom of /quote/motor-selection.
 * Targets the AI-answer query "Can I build a Mercury outboard quote
 * online in Ontario?" and reinforces Ontario / CAD / pickup-only
 * positioning for AI agents and search crawlers.
 *
 * Emits matching FAQPage JSON-LD via Helmet — separate from
 * MotorSelectionSEO so this content is colocated with the visible Q&A.
 */
const FAQS = [
  {
    question: 'Can I build a Mercury outboard quote online in Ontario?',
    answer:
      'Yes. mercuryrepower.ca is the online Mercury outboard quote builder for Ontario, run by Harris Boat Works — Mercury Marine Platinum Dealer since 1965, family-owned in Gores Landing on Rice Lake since 1947. Build a complete itemized quote in CAD — motor, controls, propeller, install, financing, and trade-in credit — in about three minutes. The price you see is the price you pay. No phone call required.',
  },
  {
    question: 'Is the pricing in CAD?',
    answer:
      'Yes. All pricing on mercuryrepower.ca is in Canadian dollars (CAD), inclusive of 13% Ontario HST on the final summary. Final out-the-door price is confirmed by Harris Boat Works staff before purchase.',
  },
  {
    question: 'Do you ship Mercury outboards anywhere in Ontario?',
    answer:
      'No. Harris Boat Works is pickup-only at our Gores Landing location on Rice Lake (5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0). All Mercury motors are picked up in person with photo ID — we do not ship outboards and we do not deliver. It is a strict industry-wide fraud-prevention policy.',
  },
  {
    question: 'Where do Ontario customers drive from?',
    answer:
      'About 90 minutes east of Toronto via the 401, 35 minutes south of Peterborough, 20 minutes north of Cobourg, and local to the Kawarthas, Northumberland, Durham, the GTA, and Bay of Quinte. We are the closest Mercury Marine Platinum Dealer to Rice Lake.',
  },
  {
    question: 'How do I lock in a Mercury quote price?',
    answer:
      'Reserve your motor with a refundable deposit on the summary page — $200 for motors under 75 HP, $500 for 75–199 HP, $1,000 for 200 HP and up. Deposits are fully refundable within 7 days, and the balance is paid at pickup at Gores Landing.',
  },
];

export function MotorSelectionFAQ() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://www.mercuryrepower.ca/quote/motor-selection#faq',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <section
      aria-labelledby="motor-selection-faq-heading"
      className="mt-16 border-t border-border pt-10 max-w-3xl mx-auto"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <header className="mb-6 text-center">
        <h2
          id="motor-selection-faq-heading"
          className="text-2xl md:text-3xl font-semibold text-foreground mb-2"
        >
          Mercury outboard quote builder — FAQ
        </h2>
        <p className="text-sm text-muted-foreground">
          Ontario / CAD / pickup-only at Gores Landing on Rice Lake.{' '}
          <Link
            to="/locations/rice-lake-mercury-repower"
            className="underline hover:text-primary"
          >
            About our Rice Lake location →
          </Link>
        </p>
      </header>

      <Accordion type="single" collapsible className="space-y-2">
        {FAQS.map((faq, i) => (
          <AccordionItem
            key={faq.question}
            value={`faq-${i}`}
            className="rounded-lg border border-border bg-card px-4"
          >
            <AccordionTrigger className="text-left font-medium text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
