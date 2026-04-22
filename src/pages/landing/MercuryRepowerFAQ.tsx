import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { MercuryRepowerFAQSEO } from '@/components/seo/MercuryRepowerFAQSEO';
import { faqCategories } from '@/data/faqData';
import { ChevronRight } from 'lucide-react';

export default function MercuryRepowerFAQ() {
  return (
    <div className="min-h-screen bg-background">
      <MercuryRepowerFAQSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Mercury Repower FAQ</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Mercury Outboard Repower FAQ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every question we get about repowering a boat with a new Mercury outboard — answered by Ontario's Mercury Marine Platinum Dealer since 1965. Family-owned on Rice Lake since 1947.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-to-repower-a-boat">See the Repower Process</Link>
            </Button>
          </div>
        </header>

        {/* FAQ accordion grouped by category */}
        <div className="space-y-12">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <section key={category.id}>
                <div className="flex items-start gap-3 mb-4">
                  <Icon className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{category.title}</h2>
                    <p className="text-muted-foreground mt-1">{category.description}</p>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-2">
                  {category.items.map((item, idx) => (
                    <AccordionItem
                      key={`${category.id}-${idx}`}
                      value={`${category.id}-${idx}`}
                      className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40"
                    >
                      <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        <span dangerouslySetInnerHTML={{ __html: item.answer }} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          })}
        </div>

        {/* CTA footer */}
        <section className="mt-16 text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Ready for a real quote?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a Mercury outboard quote in three minutes — live CAD pricing, financing, trade-in. No forms, no waiting.
          </p>
          <Button asChild size="lg">
            <Link to="/quote/motor-selection">Start Your Mercury Quote</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
