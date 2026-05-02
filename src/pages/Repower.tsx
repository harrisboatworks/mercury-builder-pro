import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { RepowerFAQ } from '@/components/repower/RepowerFAQ';
import { RepowerPageSEO } from '@/components/seo/RepowerPageSEO';
import { Button } from '@/components/ui/button';
import {
  Zap, Volume2, Gauge, Wrench, Award, Calendar,
  MapPin, Phone, ChevronRight, BadgeCheck, Anchor, ShieldCheck,
} from 'lucide-react';

const whenItMakesSense = [
  'Your hull is solid — aluminum and fiberglass last decades.',
  'Your current motor is aging, unreliable, or expensive to keep running.',
  'The boat still fits how you use it — size, layout, and capacity.',
  'You want modern Mercury reliability: EFI starting, quieter cruising, better day-to-day usability.',
];

const modernBenefits = [
  {
    icon: Zap,
    title: 'Reliable EFI Starting',
    description: 'Turn the key, it starts. Cold mornings, hot afternoons, end of the season — same result.',
  },
  {
    icon: Volume2,
    title: 'Quieter Running',
    description: 'Modern four-strokes are calm enough to hold a conversation at cruise.',
  },
  {
    icon: Gauge,
    title: 'Modern Controls & SmartCraft',
    description: 'Smooth digital throttle and shift on supported models, with SmartCraft monitoring where applicable.',
  },
];

const processSteps = [
  { step: 1, title: 'Choose Your Motor', description: 'Build a real CAD quote in the configurator. Live pricing, financing, trade-in.' },
  { step: 2, title: 'Confirm Rigging & Install', description: 'We confirm shaft length, controls, and what your boat needs to run the new Mercury cleanly.' },
  { step: 3, title: 'Installation at Gores Landing', description: 'Mercury-certified install at our Rice Lake shop — typically 1–3 days in the bay.' },
  { step: 4, title: 'Lake Test & Pickup Walkthrough', description: 'Tested on Rice Lake. We walk you through controls, break-in, and warranty at pickup.' },
];

const whyHarris = [
  { icon: BadgeCheck, title: 'Mercury Dealer Since 1965', description: '60 years as an authorized Mercury Marine dealer.' },
  { icon: Calendar, title: 'Family-Owned Since 1947', description: 'Three generations on Rice Lake, Ontario.' },
  { icon: Award, title: 'Mercury Platinum / CSI', description: 'Recognized for customer satisfaction by Mercury Marine.' },
  { icon: Anchor, title: 'Rice Lake Shop — Pickup Only', description: 'Gores Landing location with our own launch. No shipping, no mobile service.' },
];

export default function Repower() {
  return (
    <div className="min-h-screen bg-background">
      <RepowerPageSEO />
      <LuxuryHeader />

      {/* Premium Hero */}
      <section className="bg-gradient-to-b from-stone-100 to-white py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-4">
            Mercury Outboard Repower
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-6">
            Keep your boat. Upgrade your Mercury power.
          </p>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Real CAD pricing, Mercury-only expertise, and full installation at our Gores Landing
            shop on Rice Lake. Pickup only — no shipping, no mobile service.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/quote/motor-selection">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Build Your Mercury Quote
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:9053422153">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 bg-transparent">
                <Phone className="w-4 h-4" />
                (905) 342-2153
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* When repowering makes sense */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">
            When repowering makes sense
          </h2>
          <ul className="space-y-4">
            {whenItMakesSense.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-primary mt-1 shrink-0" />
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What changes with a modern Mercury */}
      <section className="py-16 md:py-20 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            What changes with a modern Mercury
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {modernBenefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white border border-border rounded-xl p-6">
                <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            The Harris repower process
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {processSteps.map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-semibold">
                  {step}
                </div>
                <h3 className="font-medium text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Harris */}
      <section className="py-16 md:py-20 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            Why Harris Boat Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyHarris.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white border border-border rounded-xl p-6 text-center">
                <Icon className="w-7 h-7 text-primary mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — capped to 5 by RepowerFAQ component (already curated) */}
      <RepowerFAQ />

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Ready for a real Mercury quote?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto leading-relaxed">
            Live CAD pricing, financing, and trade-in — built in about three minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/quote/motor-selection">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                Build Your Quote
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:9053422153">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Phone className="w-4 h-4" />
                (905) 342-2153
              </Button>
            </a>
          </div>

          <p className="text-sm text-primary-foreground/70 mt-8 flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            5369 Harris Boat Works Rd, Gores Landing, ON
          </p>
        </div>
      </section>
    </div>
  );
}
