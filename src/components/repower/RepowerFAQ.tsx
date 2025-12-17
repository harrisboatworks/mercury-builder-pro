import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is boat repowering?",
    answer: "Repowering means replacing your old outboard motor with a new one while keeping your existing boat. It's a cost-effective way to get modern technology, better fuel economy, and reliable performance without buying a whole new boat."
  },
  {
    question: "What does '70% of the benefit for 30% of the cost' mean?",
    answer: "This means you get most of the experience of owning a new boat—modern technology, reliability, better fuel economy, quieter operation—for a fraction of what a new boat would cost. Your hull is likely fine; it's usually the motor that needs upgrading."
  },
  {
    question: "How much does a Mercury repower cost?",
    answer: "For a typical Rice Lake cottage boat (16-18ft with 60-115 HP), expect to invest $8,000-$18,000 all-in. This includes the motor, rigging/controls if needed, and professional installation. Smaller motors (2.5-30 HP) start around $1,500-$8,000."
  },
  {
    question: "What's included in the repower price?",
    answer: "A complete repower includes three components: (1) The motor itself, priced by HP, (2) Rigging & controls—$1,500-$4,000 depending on what your boat needs, and (3) Professional installation—$800-$1,500 including lake testing on Rice Lake."
  },
  {
    question: "What are signs my outboard motor needs replacing?",
    answer: "Watch for these four warning signs: Hard starting or stalling, excessive smoke from the exhaust, noticeable loss of power, and frequent repairs that keep adding up. If you're seeing multiple signs, it's time to consider a repower."
  },
  {
    question: "What is the 'one more season' trap?",
    answer: "The 'one more season' trap is when you keep nursing an old motor, paying for repairs, dealing with unreliable starts, and worrying on every trip. A new motor isn't just about reliability—it's about using your boat instead of worrying about it."
  },
  {
    question: "Should I repower or buy a new boat?",
    answer: "Repowering makes sense if: your hull is solid (aluminum and fiberglass last decades), you like your boat's layout and size, and the numbers work in your favor. A new boat makes sense if your hull is damaged, you've outgrown your boat, or you want different features."
  },
  {
    question: "How do I know if my hull is worth repowering?",
    answer: "Most aluminum and fiberglass hulls last 30+ years with basic care. Look for structural damage, significant corrosion, or hull flex. If your boat floats well and the hull is sound, it's likely a candidate for repowering."
  },
  {
    question: "What are the advantages of modern four-stroke motors?",
    answer: "Modern four-strokes offer 30-40% better fuel economy, quiet operation (hold a conversation at cruise speed), no oil mixing, instant reliable EFI starting every time, and Mercury SmartCraft® technology for digital monitoring."
  },
  {
    question: "How much fuel will I save with a new Mercury?",
    answer: "Modern Mercury four-strokes are typically 30-40% more fuel efficient than older two-strokes. This means significant savings over a season, plus you'll enjoy quieter, cleaner operation with no more mixing gas and oil."
  },
  {
    question: "What is Mercury SmartCraft technology?",
    answer: "SmartCraft® is Mercury's digital networking system that provides real-time engine diagnostics, fuel economy data, and maintenance reminders. With the SmartCraft Connect app, you can monitor your engine from your phone."
  },
  {
    question: "How long does a boat repower take?",
    answer: "Professional installation typically takes 1-2 days depending on complexity. At Harris Boat Works, every repower includes a lake test on Rice Lake where we walk you through every feature and ensure everything is dialed in perfectly."
  },
  {
    question: "Why should I repower in winter?",
    answer: "Winter is the best time to repower for three reasons: Best availability—get first pick before the spring rush, no wait for installation during our quietest shop time, and you'll be ready for launch day when the ice comes off Rice Lake."
  },
  {
    question: "What happens during professional installation?",
    answer: "Our Mercury-certified technicians handle everything: removing the old motor, installing and rigging the new one, connecting controls and gauges, and conducting a thorough lake test on Rice Lake. You'll get a full walkthrough of your new motor's features."
  },
  {
    question: "Does a new Mercury come with warranty?",
    answer: "Yes! New Mercury motors come with a 3-year factory warranty, extendable up to 8 years with Mercury Platinum coverage. As a Mercury Platinum Dealer, we can register your extended warranty and handle any warranty service right here."
  },
  {
    question: "What does Mercury Platinum Dealer mean?",
    answer: "Mercury Platinum Dealer status means our technicians have achieved Mercury's highest certification level. We have priority parts access, factory-trained expertise, and can service any Mercury motor—new or old."
  },
  {
    question: "Do you offer financing for repowers?",
    answer: "Yes! We offer flexible marine financing with $0 down payment options available. Financing a repower is often simpler than a new boat because there's no retitling involved. Visit our finance calculator or call for details."
  },
  {
    question: "Who does boat repowers near Rice Lake?",
    answer: "Harris Boat Works in Gores Landing has been doing professional Mercury repowers on Rice Lake since 1965. We're about 10 minutes from the Gores Landing boat launch—your neighbours on the water."
  },
  {
    question: "What areas do you serve for repower?",
    answer: "We serve boaters throughout the Kawarthas, Peterborough, Northumberland, Durham, and the GTA. Customers regularly drive from Toronto, Oshawa, and beyond because we do it right. Worth the drive!"
  },
  {
    question: "Can you repower any boat brand?",
    answer: "Yes! We repower all boat brands—Lund, Tracker, Princecraft, Legend, Crestliner, Starcraft, Alumacraft, and more. Mercury motors are designed to fit standard transom configurations, and we handle any custom mounting needs."
  },
  {
    question: "Why choose Harris Boat Works for my repower?",
    answer: "We're a Mercury Certified Repower Center and CSI Award Winner—Mercury's highest honor for customer satisfaction. Family-owned since 1947, Mercury dealer since 1965. Every motor is lake tested on Rice Lake and backed by our service team."
  }
];

export function RepowerFAQ() {
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
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
