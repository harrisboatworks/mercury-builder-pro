import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Wrench, RotateCcw, Shield, Phone,
  ChevronRight, Sparkles, Clock, DollarSign,
} from 'lucide-react';

import { HomepageSEO } from '@/components/seo/HomepageSEO';
import { SiteFooter } from '@/components/ui/site-footer';
import { RepowerLayout } from '@/components/repower/RepowerLayout';
import { HeroRepower } from '@/components/repower/HeroRepower';
import { TrustStrip } from '@/components/repower/TrustStrip';
import { RepowerMath } from '@/components/repower/RepowerMath';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { GoogleRatingBadge } from '@/components/business/GoogleRatingBadge';

import heroImage from '@/assets/hero-proxs-sunset.jpg';
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
    <RepowerLayout>
      <HomepageSEO />

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
        <HeroRepower />
        <TrustStrip />
        <RepowerMath />
        {/* HOW IT WORKS */}
        <section className="py-16 md:py-32 px-4 sm:px-6 md:px-14 bg-[#0A1828] text-[#F5F1EA]">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <p className="font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.24em] text-[#C9A24A] mb-4 md:mb-6">
                How It Works
              </p>
              <h2
                className="font-display font-bold text-[clamp(28px,8vw,64px)] tracking-tight leading-[1.1] md:leading-[1.05] mb-4 md:mb-6"
                style={{ letterSpacing: '-0.03em' }}
              >
                Three steps. <em className="not-italic italic text-[#C8102E]">Real prices</em> the whole way through.
              </h2>
              <p className="font-sans font-light text-base md:text-xl text-[#F5F1EA]/70 max-w-2xl mx-auto leading-relaxed px-2">
                No "call for quote." No surprises. Build it, lock it, pick it up.
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-px md:bg-[#F5F1EA]/10 mb-10 md:mb-12">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="relative bg-[#0A1828] flex flex-col group overflow-hidden transition-all duration-500 ring-1 ring-[#F5F1EA]/10 md:ring-transparent rounded md:rounded-none hover:ring-[#C9A24A]/40 hover:shadow-[0_0_40px_-8px_rgba(201,162,74,0.35)] hover:z-10"
                  >
                    {/* Gold glow accent */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,74,0.12),_transparent_60%)]"
                    />
                    <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden border-b border-[#F5F1EA]/10 relative">
                      <img
                        src={step.image}
                        alt={step.title}
                        loading="lazy"
                        width={800}
                        height={600}
                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-[#0A1828]/60 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500"
                      />
                    </div>
                    <div className="p-6 sm:p-8 md:p-10 flex-1 flex flex-col relative">
                      <div className="flex items-center gap-3 mb-4 md:mb-5">
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-[#C9A24A]/40 bg-[#C9A24A]/10 text-[#C9A24A] flex items-center justify-center transition-all duration-500 group-hover:bg-[#C9A24A]/20 group-hover:border-[#C9A24A]/70">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-sans font-semibold text-[11px] md:text-xs uppercase tracking-[0.22em] md:tracking-[0.24em] text-[#C9A24A]">
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-lg sm:text-xl md:text-2xl text-[#F5F1EA] mb-2 md:mb-3 tracking-tight transition-colors duration-500 group-hover:text-white">
                        {step.title}
                      </h3>
                      <p className="font-sans font-light text-sm md:text-base text-[#F5F1EA]/70 md:text-[#F5F1EA]/65 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="text-center">
              <button
                onClick={goBuild}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-[#C8102E] hover:bg-[#A50D26] text-[#F5F1EA] px-8 sm:px-10 py-4 rounded uppercase tracking-wider text-sm font-semibold transition-all duration-300"
              >
                Start Building <ArrowRight className="h-4 w-4" />
              </button>
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
                    'Bonus warranty coverage may be available during current Mercury promotions',
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
                      Build a Mercury outboard quote (Ontario, CAD) <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link to="/locations/rice-lake-mercury-repower">
                      Mercury repower on Rice Lake <ChevronRight className="h-4 w-4" />
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
    </RepowerLayout>
  );
}
