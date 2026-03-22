import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getAllFAQItems } from "@/data/faqData";

// Curated subset of questions most relevant to the repower landing page
const REPOWER_FAQ_QUESTIONS = [
  'What does it mean to repower a boat?',
  'Is it worth repowering my boat or should I buy a new boat?',
  'How much does a Mercury repower cost?',
  'Can I repower a pontoon boat?',
  'How long does a Mercury repower take?',
  'What\'s included in a repower package?',
  'Can I trade in my old motor?',
  'What boat brands can you repower?',
  'What is Mercury\'s warranty on new outboards?',
  'Do you offer winterization and storage?',
];

export function RepowerFAQ() {
  const allItems = getAllFAQItems();
  const faqItems = REPOWER_FAQ_QUESTIONS
    .map(q => allItems.find(item => item.question === q))
    .filter(Boolean);

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about repowering your boat with Mercury
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-2">
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-border rounded-lg px-4 data-[state=open]:bg-stone-50"
            >
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                {item!.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                <span dangerouslySetInnerHTML={{ __html: item!.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
