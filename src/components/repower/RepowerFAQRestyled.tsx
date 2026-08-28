import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { getAllFAQItems } from '@/data/faqData';

const REPOWER_FAQ_QUESTIONS = [
  'What does it mean to repower a boat?',
  'Is it worth repowering my boat or should I buy a new boat?',
  'How much does a Mercury repower cost?',
  'Can I repower a pontoon boat?',
  'How long does a Mercury repower take?',
  "What's included in a repower package?",
  'Can I trade in my old motor?',
  'What boat brands can you repower?',
  "What is Mercury's warranty on new outboards?",
  'Do you offer winterization and storage?',
];

export function RepowerFAQRestyled() {
  const allItems = getAllFAQItems();
  const faqItems = REPOWER_FAQ_QUESTIONS
    .map((q) => allItems.find((item) => item.question === q))
    .filter(Boolean) as { question: string; answer: string }[];

  return (
    <section className="bg-repower-paper">
      <div className="mx-auto max-w-[1100px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
            Frequently Asked
          </p>
          <h2
            className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] text-repower-navy-900"
          >
            Everything you need to know about <em className="not-italic italic text-repower-mercury-red">repowering.</em>
          </h2>
        </div>

        <AccordionPrimitive.Root
          type="single"
          collapsible
          className="border-t border-repower-navy-900/10"
        >
          {faqItems.map((item, i) => (
            <AccordionPrimitive.Item
              key={item.question}
              value={`faq-${i}`}
              className="border-b border-repower-navy-900/10 group"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  className="flex flex-1 items-center justify-between gap-6 py-5 md:py-6 px-4 md:px-6 -mx-4 md:-mx-6 text-left font-sans font-semibold text-[16px] md:text-[17px] text-repower-navy-900 leading-snug transition-colors hover:bg-repower-navy-900/[0.04] focus:outline-none focus-visible:bg-repower-navy-900/[0.04] [&[data-state=open]>span:last-child>svg]:rotate-180"
                >
                  <span className="flex-1 relative inline-block group-data-[state=open]:after:content-[''] group-data-[state=open]:after:absolute group-data-[state=open]:after:left-0 group-data-[state=open]:after:-bottom-1 group-data-[state=open]:after:h-[2px] group-data-[state=open]:after:w-10 group-data-[state=open]:after:bg-repower-gold">
                    {item.question}
                  </span>
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 text-repower-navy-900/55">
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" strokeWidth={2} />
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="font-sans font-normal text-[15px] text-repower-navy-900/75 leading-relaxed pb-6 md:pb-8 pt-2 max-w-3xl">
                  {item.answer}
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </div>
    </section>
  );
}
