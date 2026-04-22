import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { HowToRepowerSEO, HOWTO_FAQ } from '@/components/seo/HowToRepowerSEO';
import { ChevronRight, FileText, Ruler, CreditCard, CalendarDays, Wrench, Waves, Key } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Build Your Quote Online',
    body: "Use the configurator at mercuryrepower.ca to choose your Mercury motor (FourStroke, Pro XS, SeaPro, or ProKicker), shaft length, and controls. You'll see live CAD pricing, financing estimates, and any active promotions instantly — no forms, no waiting.",
    cta: { label: 'Open the quote builder', to: '/quote/motor-selection' }
  },
  {
    icon: Ruler,
    title: 'Confirm Motor & Shaft Fit',
    body: "Tell us your boat's make, model, transom height, and capacity plate HP rating. We'll confirm the right Mercury HP, shaft length (15\", 20\", or 25\"), and whether you need Command Thrust for a pontoon or heavy hull."
  },
  {
    icon: CreditCard,
    title: 'Place Your Deposit',
    body: 'Secure your motor with a refundable deposit ($200–$1,000 depending on HP) paid online. This locks in the price, holds your spot in the install queue, and starts the order if the motor isn\'t already in stock.'
  },
  {
    icon: CalendarDays,
    title: 'Schedule the Install',
    body: 'Book your drop-off date at Harris Boat Works in Gores Landing on Rice Lake. Most installs are 1–3 days. Submit a service request at hbw.wiki/service or call (905) 342-2153.'
  },
  {
    icon: Wrench,
    title: 'Professional Install & Rigging',
    body: 'Our Mercury-certified technicians remove your old motor, install the new Mercury, and replace throttle, shift, steering, fuel lines, and gauges as needed. Full rigging is included in every repower package — no surprise add-ons.'
  },
  {
    icon: Waves,
    title: 'Lake Test on Rice Lake',
    body: 'Every repower is lake-tested on Rice Lake before pickup. We confirm WOT RPM, prop pitch, idle, shifting, and trim. If anything\'s off, we adjust before you ever see the bill.'
  },
  {
    icon: Key,
    title: 'Pickup & Walk-Through',
    body: 'Pickup is by appointment at Gores Landing — about 20–30 minutes. Bring photo ID and your purchase order. We register the warranty, walk you through controls and break-in, and you\'re on the water. Pickup only — no shipping.'
  }
];

export default function HowToRepower() {
  return (
    <div className="min-h-screen bg-background">
      <HowToRepowerSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">How to Repower a Boat</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            How to Repower a Boat
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The seven-step Mercury repower process at Harris Boat Works — from online quote to lake-tested pickup at Gores Landing on Rice Lake. Family-owned since 1947, Mercury Platinum Dealer since 1965.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Start at Step 1 — Build Your Quote</Link>
            </Button>
          </div>
        </header>

        {/* Steps */}
        <ol className="space-y-6 mb-16">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={i}
                className="flex gap-4 p-6 rounded-2xl border border-border bg-card"
              >
                <div className="shrink-0 flex flex-col items-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-semibold">
                    {i + 1}
                  </div>
                  <Icon className="h-5 w-5 text-muted-foreground mt-3" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                  {step.cta && (
                    <Button asChild size="sm" variant="outline" className="mt-4">
                      <Link to={step.cta.to}>{step.cta.label}</Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Process Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {HOWTO_FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40"
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
        </section>

        {/* CTA footer */}
        <section className="text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Ready to start step 1?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a real Mercury outboard quote in three minutes. Live CAD pricing, financing, trade-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/mercury-repower-faq">Read the Full FAQ</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
