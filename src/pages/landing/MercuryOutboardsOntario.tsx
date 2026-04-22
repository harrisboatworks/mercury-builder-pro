import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import {
  MercuryOutboardsOntarioSEO,
  ONTARIO_HUB_FAQ,
} from '@/components/seo/MercuryOutboardsOntarioSEO';
import {
  ChevronRight,
  Anchor,
  Fish,
  Zap,
  Sailboat,
  Wrench,
  Compass,
  Waves,
  MapPin,
  Award,
  Calendar,
} from 'lucide-react';

const LINEUP = [
  {
    icon: Anchor,
    name: 'Portable FourStroke',
    range: '2.5 – 20 HP',
    body: 'Tenders, dinghies, small tillers, cottage runabouts. Lightweight, pull-start or electric, easy to carry.',
    href: '/quote/motor-selection',
  },
  {
    icon: Fish,
    name: 'Mid-Range FourStroke',
    range: '25 – 115 HP',
    body: 'Fishing boats, aluminum hulls, light pontoon, daycruisers. Mercury\'s workhorse line.',
    href: '/quote/motor-selection',
  },
  {
    icon: Zap,
    name: 'Pro XS',
    range: '115 – 250 HP',
    body: 'Performance and tournament use — bass, ski, wake, fast bowriders. Real CAD pricing live.',
    href: '/mercury-pro-xs',
  },
  {
    icon: Sailboat,
    name: 'Command Thrust',
    range: '40 – 150 HP',
    body: 'Pontoons and heavy hulls. Larger gearcase + prop for more push at slower speeds.',
    href: '/quote/motor-selection',
  },
  {
    icon: Wrench,
    name: 'SeaPro Commercial',
    range: 'Commercial duty',
    body: 'Charter, guide, government, and commercial fishing. Built for high duty cycles.',
    href: '/quote/motor-selection',
  },
  {
    icon: Compass,
    name: 'ProKicker',
    range: '9.9 / 15 HP',
    body: 'Trolling and kicker motor specialists. Higher gear ratio (2.42:1) for low-speed control.',
    href: '/quote/motor-selection',
  },
  {
    icon: Waves,
    name: 'FourStroke V8',
    range: '250 – 300 HP',
    body: 'Naturally aspirated V8 for offshore, big bowriders, and large pontoons. Premium tier.',
    href: '/quote/motor-selection',
  },
];

const TRUST = [
  { icon: Award, label: 'Mercury Platinum Dealer' },
  { icon: Calendar, label: 'Family-owned since 1947' },
  { icon: Anchor, label: 'Mercury dealer since 1965' },
  { icon: MapPin, label: 'Rice Lake, Gores Landing' },
];

const SERVICE_AREAS = [
  { name: 'Peterborough', drive: '35 min north' },
  { name: 'Cobourg', drive: '20 min south' },
  { name: 'Port Hope', drive: '25 min south' },
  { name: 'Toronto / GTA', drive: '90 min west' },
  { name: 'Kawartha Lakes', drive: '50 min north' },
  { name: 'Lake Simcoe', drive: '90 min northwest' },
  { name: 'Lake Scugog', drive: '50 min west' },
  { name: 'Bay of Quinte', drive: '60 min east' },
];

export default function MercuryOutboardsOntario() {
  return (
    <div className="min-h-screen bg-background">
      <MercuryOutboardsOntarioSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Mercury Outboards Ontario</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Mercury Outboards in Ontario
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The full Mercury Marine outboard lineup at Harris Boat Works — Platinum Dealer on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965.
          </p>

          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {TRUST.map(({ icon: Icon, label }) => (
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
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </header>

        {/* Lineup grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
            The Full Mercury Lineup
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Click any line to configure a quote with real CAD pricing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LINEUP.map(({ icon: Icon, name, range, body, href }) => (
              <Card key={name} className="p-6 flex flex-col">
                <Icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground">{name}</h3>
                <div className="text-xs text-muted-foreground mb-2">{range}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{body}</p>
                <Button asChild size="sm" variant="outline">
                  <Link to={href}>
                    {href === '/mercury-pro-xs' ? 'See Pro XS pricing' : 'Configure'}
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Service area */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
            Service Area Across Ontario
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Pickup only at our Gores Landing location on Rice Lake. Travel times below.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SERVICE_AREAS.map(({ name, drive }) => (
              <div
                key={name}
                className="p-4 rounded-xl border border-border bg-card text-center"
              >
                <div className="text-sm font-medium text-foreground">{name}</div>
                <div className="text-xs text-muted-foreground">{drive}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/mercury-dealer-peterborough">Peterborough page</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/mercury-dealer-cobourg">Cobourg page</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/mercury-dealer-gta">GTA page</Link>
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Mercury in Ontario — FAQ
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {ONTARIO_HUB_FAQ.map((item, i) => (
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
            Ready to spec your Mercury?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a real CAD quote in 3 minutes — live pricing, financing estimates, trade-in. Or call (905) 342-2153.
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
