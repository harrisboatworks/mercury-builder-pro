import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
    <section className="bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1100px] px-6 md:px-14 py-20 md:py-[140px]">
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C8102E] mb-4">
            Frequently Asked
          </p>
          <h2
            className="font-display font-bold text-[clamp(40px,5vw,72px)] tracking-tight leading-[1.05] text-[#050E1C]"
            style={{ letterSpacing: '-0.035em' }}
          >
            Everything you need
            <br />
            to know about <em className="not-italic italic text-[#C8102E]">repowering.</em>
          </h2>
        </div>

        <Accordion type="single" collapsible className="border-t border-[#050E1C]/10">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={item.question}
              value={`faq-${i}`}
              className="border-b border-[#050E1C]/10"
            >
              <AccordionTrigger className="font-display font-semibold text-lg md:text-xl text-[#050E1C] hover:text-[#C8102E] hover:no-underline tracking-tight py-6 md:py-7 text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-sans font-light text-base md:text-lg text-[#050E1C]/65 leading-relaxed pb-6 md:pb-8 max-w-3xl">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
