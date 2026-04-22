import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { MercuryDealerCanadaSEO, TRUST_FAQ } from '@/components/seo/MercuryDealerCanadaSEO';
import { ChevronRight, Award, Calendar, MapPin, Shield } from 'lucide-react';

const trustPoints = [
  { icon: Award, label: 'Mercury Marine Platinum Dealer' },
  { icon: Calendar, label: 'Family-owned since 1947' },
  { icon: Shield, label: 'Mercury dealer since 1965' },
  { icon: MapPin, label: 'Rice Lake, Gores Landing, ON' }
];

export default function MercuryDealerCanadaFAQ() {
  return (
    <div className="min-h-screen bg-background">
      <MercuryDealerCanadaSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Mercury Dealer Canada FAQ</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Why Buy from Harris Boat Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            12 trust questions about Harris Boat Works — Mercury Marine Platinum Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.
          </p>

          {/* Trust badges */}
          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Contact the Dealership</Link>
            </Button>
          </div>
        </header>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Trust & Dealer Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {TRUST_FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA footer */}
        <section className="text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Ready to work with a Platinum Dealer?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a Mercury quote with real CAD pricing, or call us at (905) 342-2153.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">About Harris Boat Works</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
