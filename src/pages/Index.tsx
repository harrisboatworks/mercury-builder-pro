import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Wrench, RotateCcw, Shield, Phone,
  ChevronRight, Sparkles, Clock, DollarSign,
} from 'lucide-react';

import { HomepageSEO } from '@/components/seo/HomepageSEO';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { GoogleRatingBadge } from '@/components/business/GoogleRatingBadge';

import heroImage from '@/assets/landing-hero-mercury.jpg';
import shopImage from '@/assets/landing-repower-shop.jpg';
import stepPickImage from '@/assets/landing-step-pick.png';
import stepConfigureImage from '@/assets/landing-step-configure.jpg';
import stepPickupImage from '@/assets/landing-step-pickup.jpg';
import ctaLakeImage from '@/assets/landing-cta-lake.jpg';

const HOW_IT_WORKS = [
  {
    icon: Wrench,
    image: stepPickImage,
    title: 'Pick your Mercury',
    body: 'Browse the full lineup from 2.5 to 300 HP with live CAD pricing. No "call for quote."',
  },
  {
    icon: RotateCcw,
    image: stepConfigureImage,
    title: 'Configure trade-in & financing',
    body: 'Get an instant trade-in estimate, choose financing or pay-in-full, and see your real monthly payment.',
  },
  {
    icon: Shield,
    image: stepPickupImage,
    title: 'Lock it with a refundable deposit',
    body: 'Hold your motor and pricing with a small refundable deposit. We confirm install date and walk you through next steps.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Mike R.',
    location: 'Peterborough, ON',
    quote: 'Quoted my repower online in 5 minutes. The price I saw was the price I paid — exactly. Repower was done in two days.',
  },
  {
    name: 'Sandra L.',
    location: 'Toronto, ON',
    quote: 'I had been calling dealers for weeks. Harris was the only one who showed me real prices upfront. Easy decision.',
  },
  {
    name: 'Dave K.',
    location: 'Cobourg, ON',
    quote: 'Family-run, fair prices, and they actually know Mercury motors. Best repower experience I\'ve had in 30 years of boating.',
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { state, getQuoteCompletionStatus } = useQuote();
  const { user } = useAuth();

  const hasInProgressQuote = useMemo(() => {
    if (!state?.motor) return false;
    const status = getQuoteCompletionStatus();
    return status.hasMotor && !status.isComplete;
  }, [state?.motor, getQuoteCompletionStatus]);

  const completionPercent = useMemo(() => {
    if (!hasInProgressQuote) return 0;
    const status = getQuoteCompletionStatus();
    const flags = [
      status.hasMotor,
      status.hasPath,
      status.hasRequiredInfo,
      Boolean(state.hasTradein === true || state.hasTradein === false),
      Boolean(state.selectedPromoOption),
      false, // summary review
    ];
    return Math.round((flags.filter(Boolean).length / flags.length) * 100);
  }, [hasInProgressQuote, getQuoteCompletionStatus, state.hasTradein, state.selectedPromoOption]);

  const goBuild = () => navigate('/quote/motor-selection');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomepageSEO />
      <LuxuryHeader />

      {/* Resume-quote banner */}
      {hasInProgressQuote && (
        <div className="border-b border-border bg-muted/40">
          <div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                Resume your quote — <span className="font-medium">{completionPercent}% complete</span>
              </span>
            </div>
            <Button size="sm" variant="default" onClick={goBuild} className="gap-1.5">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
          <div className="container mx-auto px-4 py-12 md:py-20 relative">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              {/* Copy column */}
              <div className="text-center lg:text-left">
                <Badge variant="secondary" className="mb-5 inline-flex items-center gap-1.5 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mercury Platinum Repower Center · Rice Lake, Ontario
                </Badge>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight">
                  Real Mercury Repower Prices.
                  <br />
                  <span className="text-primary">No Forms. No Games.</span>
                </h1>

                <p className="hero-description text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Build your live Mercury outboard quote in under 3 minutes.
                  Family-owned since 1947. Authorized Mercury dealer since 1965. Serving Toronto,
                  Peterborough &amp; the Kawarthas.
                </p>

                <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-8">
                  <Button
                    size="lg"
                    onClick={goBuild}
                    className="gap-2 text-base px-8 h-12 w-full sm:w-auto"
                  >
                    Build Your Quote <ArrowRight className="h-5 w-5" />
                  </Button>
                  {user && (
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-base px-8 h-12 w-full sm:w-auto"
                    >
                      <Link to="/my-quotes">See Saved Quotes</Link>
                    </Button>
                  )}
                  {!user && (
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-base px-8 h-12 w-full sm:w-auto"
                    >
                      <a href="tel:+19053422153" className="gap-2 inline-flex items-center">
                        <Phone className="h-4 w-4" /> (905) 342-2153
                      </a>
                    </Button>
                  )}
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Mercury Platinum Dealer
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Family-owned since 1947
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> 7-year warranty available
                  </span>
                  <GoogleRatingBadge variant="compact" />
                </div>
              </div>

              {/* Hero image column */}
              <div className="relative order-first lg:order-last">
                <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl aspect-[4/3] lg:aspect-[5/4] bg-muted">
                  <img
                    src={heroImage}
                    alt="Mercury 4-stroke outboard motor at work on an Ontario lake at golden hour"
                    width={1920}
                    height={1280}
                    className="absolute inset-0 w-full h-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                How it works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Three steps. Real prices the whole way through.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="border-border/60 overflow-hidden flex flex-col">
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={step.image}
                        alt={step.title}
                        loading="lazy"
                        width={800}
                        height={600}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-6 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Button size="lg" onClick={goBuild} className="gap-2">
                Start Building <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* WHY REPOWER */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Why repower beats buying a new boat
                </h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  A new Mercury costs a fraction of a new boat — and you keep the hull
                  you already know and love. Most repowers are completed in one to three
                  days at our Gores Landing shop.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Pay only for the motor — not a whole new boat',
                    'Modern Mercury fuel economy &amp; quiet running',
                    'Coverage up to 7 years with current promotions',
                    'Mercury-Certified technicians — we sell what we service',
                  ].map(line => (
                    <li key={line} className="flex items-start gap-2.5 text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: line }} />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="default" className="gap-1.5">
                    <Link to="/quote/motor-selection">
                      See Mercury Pricing <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link to="/faq">
                      Repower FAQ <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-border bg-card shadow-lg">
                <img
                  src={shopImage}
                  alt="Mercury-Certified technician installing a new outboard at the Harris Boat Works repower shop"
                  loading="lazy"
                  width={1600}
                  height={1200}
                  className="w-full h-auto aspect-[4/3] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                What customers say
              </h2>
              <div className="flex items-center justify-center">
                <GoogleRatingBadge variant="full" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {TESTIMONIALS.map(t => (
                <Card key={t.name} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 text-yellow-400 mb-3" aria-label="5 stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <p className="text-foreground leading-relaxed mb-4 italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="text-sm">
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-muted-foreground">{t.location}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA BAND */}
        <section className="relative py-14 md:py-24 text-primary-foreground overflow-hidden">
          <img
            src={ctaLakeImage}
            alt="Boat with Mercury outboard at sunset on Rice Lake, Ontario"
            loading="lazy"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80" />
          <div className="container mx-auto px-4 text-center relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to see your real Mercury price?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-7 max-w-2xl mx-auto">
              Build a live quote in 3 minutes. No commitments, no sales calls until you're ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={goBuild}
                className="gap-2 text-base px-8 h-12 w-full sm:w-auto"
              >
                <DollarSign className="h-5 w-5" /> Build Your Quote
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground hover:text-primary text-base px-8 h-12 w-full sm:w-auto"
              >
                <a href="tel:+19053422153" className="gap-2 inline-flex items-center">
                  <Phone className="h-4 w-4" /> Call (905) 342-2153
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
