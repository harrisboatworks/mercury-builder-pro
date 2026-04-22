import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { MercuryDealerCobourgSEO, COBOURG_FAQ } from '@/components/seo/MercuryDealerCobourgSEO';
import { ChevronRight, MapPin, Clock, Award, Phone } from 'lucide-react';

const facts = [
  { icon: Clock, label: '~20 min north of Cobourg' },
  { icon: MapPin, label: 'Gores Landing, Rice Lake' },
  { icon: Award, label: 'Mercury Platinum Dealer' },
  { icon: Phone, label: '(905) 342-2153' }
];

export default function MercuryDealerCobourg() {
  return (
    <div className="min-h-screen bg-background">
      <MercuryDealerCobourgSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Mercury Dealer Cobourg</li>
          </ol>
        </nav>

        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Mercury Dealer Near Cobourg, Ontario
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Harris Boat Works is the closest Mercury Marine Platinum Dealer to Cobourg — about 20 minutes north on Rice Lake. Family-owned since 1947, Mercury dealer since 1965.
          </p>

          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card">
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Get Directions</Link>
            </Button>
          </div>
        </header>

        <section className="mb-12 prose prose-neutral max-w-none dark:prose-invert">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Serving Cobourg & Northumberland County</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cobourg, Port Hope, Grafton, and Brighton boaters have a Mercury Marine Platinum Dealer 20 minutes up the road. Take County Rd 18 north from Cobourg to the south shore of Rice Lake — easy back-road run with a boat trailer.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Whether you're running Cobourg Harbour on Lake Ontario or fishing Rice Lake from a tin boat, we carry the right Mercury for the job — Pro XS, FourStroke, SeaPro, ProKicker, FourStroke V8. Real CAD pricing online. Pickup only at Gores Landing.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Cobourg Mercury Dealer Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {COBOURG_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40">
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

        <section className="text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Ready to repower from Cobourg?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a Mercury quote with real CAD pricing in 3 minutes — or call us at (905) 342-2153.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/mercury-dealer-peterborough">Peterborough Customers</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/mercury-dealer-gta">GTA Customers</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
