// build-sync 2026-06-10: re-push after GitHub reconnect
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
import { ObjectionStrip } from '@/components/repower/ObjectionStrip';
import { RepowerCta } from '@/components/repower/RepowerCta';
import { TrustStrip } from '@/components/repower/TrustStrip';

import { HowItWorksCard, HowItWorksGrid } from '@/components/repower/HowItWorksCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { GoogleRatingBadge } from '@/components/business/GoogleRatingBadge';

import heroImage from '@/assets/hero-proxs-sunset.jpg';
import jimHarrisHeritage from '@/assets/heritage/jim-harris-mercury-1960s.jpg';
import ctaLakeImage from '@/assets/landing-cta-lake.jpg';
import { useGooglePlaceData, type GoogleReview } from '@/hooks/useGooglePlaceData';

const HOW_IT_WORKS = [
  {
    icon: Wrench,
    image: '/lovable-uploads/home-step1-mercury-proxs-lineup.jpg',
    alt: 'Row of new Mercury Pro XS outboards on display',
    priority: true, // confirmed mobile LCP element
    title: 'Pick your Mercury',
    body: 'Browse the full lineup from 2.5 to 300 HP with live CAD pricing. No "call for quote."',
  },
  {
    icon: RotateCcw,
    image: '/lovable-uploads/home-step2-real-quote-builder.jpg',
    alt: 'The mercuryrepower.ca quote builder showing live Mercury prices in CAD',
    framed: true, // raw screenshot, render inside a browser-window frame
    title: 'Configure trade-in & financing',
    body: 'Get an instant trade-in estimate, choose financing or pay-in-full, and see your real monthly payment.',
  },
  {
    icon: Shield,
    image: '/lovable-uploads/home-step3-rice-lake-water-test.jpg',
    alt: 'Aluminum fishing boat with Mercury outboard on a water test at sunset on Rice Lake',
    title: 'Water-tested on Rice Lake before pickup',
    body: 'Every Mercury we install gets a real water test on Rice Lake before you pick it up. You drive home with a motor that has been run, tuned, and verified, not a dyno number on a spec sheet.',
  },
];

// Live Google review selection: 5-star only, substantial text, prefer repower/Mercury/motor/service mentions.
const REVIEW_KEYWORDS = /repower|mercury|motor|service/i;

function formatReviewerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Google user';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function selectFeaturedReviews(reviews: GoogleReview[] | undefined): GoogleReview[] {
  if (!reviews || reviews.length === 0) return [];
  const eligible = reviews.filter(
    r => r.rating === 5 && (r.text?.trim().length ?? 0) >= 100
  );
  const preferred = eligible.filter(r => REVIEW_KEYWORDS.test(r.text));
  const rest = eligible.filter(r => !REVIEW_KEYWORDS.test(r.text));
  return [...preferred, ...rest].slice(0, 3);
}

export default function Index() {
  const navigate = useNavigate();
  const { state, getQuoteCompletionStatus } = useQuote();
  const { user } = useAuth();

  // Live Google reviews (24h-cached via the google-places edge function).
  const { data: placeData } = useGooglePlaceData();
  const liveReviews = useMemo(
    () => selectFeaturedReviews(placeData?.reviews),
    [placeData?.reviews]
  );

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
                Resume your quote, <span className="font-medium">{completionPercent}% complete</span>
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

        {/* OBJECTION STRIP: three scannable cards directly below hero */}
        <ObjectionStrip />



        {/* PICKUP-BY-DESIGN BAND */}
        <section className="bg-repower-cream border-y border-repower-navy-900/10">
          <div className="container mx-auto px-4 py-4 md:py-5 text-center">
            <p className="font-sans text-sm md:text-base text-repower-navy-900/85 leading-relaxed max-w-3xl mx-auto">
              <span className="font-semibold text-repower-navy-900">Pickup at Gores Landing, by design.</span>{' '}
              Every motor we install gets water-tested on Rice Lake first, so you drive home with a Mercury that has been run, not just bolted on. About 90 minutes from Toronto. Worth the drive.
            </p>
          </div>
        </section>

        <TrustStrip />

        {/* HERITAGE BAND */}
        <section className="py-16 md:py-28 px-4 sm:px-6 md:px-14 bg-repower-cream">
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <figure className="m-0">
              <div className="rounded-md overflow-hidden border border-repower-navy-900/15 shadow-xl bg-white">
                <img
                  src={jimHarrisHeritage}
                  alt="Jim Harris working on a Mercury outboard at Harris Boat Works, mid-1960s"
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </div>
              <figcaption className="mt-3 text-xs italic text-repower-navy-900/60 text-center md:text-left">
                Jim Harris, Gores Landing, c.1965
              </figcaption>
            </figure>
            <div>
              <p className="font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-4">
                Since 1947
              </p>
              <h2
                className="font-display font-bold text-[clamp(28px,6vw,52px)] tracking-tight leading-[1.05] text-repower-navy-900 mb-5"
                style={{ letterSpacing: '-0.03em' }}
              >
                Three generations. <em className="not-italic italic text-[#C8102E]">One</em> Mercury dealer.
              </h2>
              <p className="font-sans font-light text-base md:text-lg text-repower-navy-900/75 leading-relaxed mb-6">
                Jim Harris started rigging Mercurys in Gores Landing in the mid-1960s.
                We've been a Mercury dealer ever since, same family, same lake, same
                handshake. The motors got faster. The promise didn't.
              </p>
              <RepowerCta to="/about" variant="outline" size="md">
                Read our story <ArrowRight className="h-4 w-4" />
              </RepowerCta>
            </div>
          </div>
        </section>

        
        {/* HOW IT WORKS */}
        <section className="py-16 md:py-32 px-4 sm:px-6 md:px-14 bg-[#0A1828] text-[#F5F1EA]">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <p className="font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.24em] text-[#C9A24A] mb-4 md:mb-6">
                The Process
              </p>
              <h2
                className="font-display font-bold text-[clamp(28px,8vw,64px)] tracking-tight leading-[1.1] md:leading-[1.05] mb-4 md:mb-6"
                style={{ letterSpacing: '-0.03em', textWrap: 'balance' }}
              >
                See your real price. <em className="not-italic italic text-[#C8102E]">Lock it.</em> Pick it up.
              </h2>
              <p className="font-sans font-light text-base md:text-xl text-[#F5F1EA]/70 max-w-2xl mx-auto leading-relaxed px-2">
                No phone tag. No fine print. No surprises.
              </p>
            </div>

            <HowItWorksGrid>
              {HOW_IT_WORKS.map((step, i) => (
                <HowItWorksCard
                  key={step.title}
                  icon={step.icon}
                  image={step.image}
                  alt={step.alt}
                  priority={step.priority}
                  framed={step.framed}
                  title={step.title}
                  body={step.body}
                  stepNumber={i + 1}
                />
              ))}
            </HowItWorksGrid>

            <div className="text-center">
              <RepowerCta as="button" onClick={goBuild} variant="primary" size="lg">
                Build Your Quote <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </RepowerCta>
            </div>
          </div>
        </section>

        {/* WHY REPOWER */}
        <section className="py-10 md:py-24 bg-repower-navy-900 text-repower-cream">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center max-w-6xl mx-auto">
              <div>
                <p className="font-sans font-semibold text-[11px] md:text-xs uppercase tracking-[0.24em] text-repower-gold mb-2 md:mb-4">
                  Why repower
                </p>
                <h2 className="font-display font-bold tracking-tight text-2xl md:text-5xl text-repower-cream mb-3 md:mb-5 leading-[1.1]" style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}>
                  Why repower beats buying a new boat
                </h2>
                <p className="font-sans font-light text-repower-cream/75 text-sm md:text-lg mb-4 md:mb-7 leading-relaxed">
                  A new Mercury costs a fraction of a new boat, and you keep the hull
                  you already know and love. Most repowers are completed in one to three
                  days at our Gores Landing shop.
                </p>
                <ul className="flex flex-col gap-4 mb-5 md:mb-8">
                  {[
                    'Pay only for the motor, not a whole new boat.',
                    'Modern Mercury fuel economy and quiet running.',
                    'Every new Mercury includes 3 years of factory-backed warranty, with extended coverage available. Current promotions at mercuryrepower.ca/promotions.',
                    'Mercury-Certified technicians who sell what they service.',
                  ].map(line => (
                    <li key={line} className="flex flex-row items-start gap-3 text-repower-cream/90 text-sm md:text-base leading-snug md:leading-relaxed">
                      <CheckCircle2 className="w-5 h-5 text-repower-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="flex-1 min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-repower-cream/85 text-sm md:text-base leading-relaxed mb-3 max-w-[65ch]">
                  Get an <Link to="/quote/motor-selection" className="underline hover:text-repower-gold">online Mercury outboard quote</Link> for your boat. We provide live CAD pricing on motors and installation at our Gores Landing marina. No obligation.
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <RepowerCta to="/quote/motor-selection" variant="primary" size="md">
                    Build a Mercury outboard quote <ChevronRight className="h-4 w-4" />
                  </RepowerCta>
                  <RepowerCta to="/locations/rice-lake-mercury-repower" variant="outline" size="md">
                    Mercury repower on Rice Lake <ChevronRight className="h-4 w-4" />
                  </RepowerCta>
                  <RepowerCta to="/faq" variant="outline" size="md">
                    Repower FAQ <ChevronRight className="h-4 w-4" />
                  </RepowerCta>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-repower-cream/10 bg-repower-navy-900/40 shadow-2xl">
                <img
                  src="/lovable-uploads/hero-mercury-90-shop-shot.png"
                  data-photo-slot="hbw-real-shop-photo"
                  alt="A new Mercury 90 FourStroke on the floor of the Harris Boat Works repower shop in Gores Landing"
                  loading="lazy"
                  width={1600}
                  height={1200}
                  className="w-full h-auto aspect-[4/3] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS, live Google reviews. Hidden entirely if the API has no usable reviews. */}
        {liveReviews.length > 0 && (
          <section className="py-12 md:py-20 bg-repower-navy-800 border-t border-repower-cream/10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <p className="font-sans font-semibold text-[11px] md:text-xs uppercase tracking-[0.24em] text-repower-gold mb-2 md:mb-4">
                  Customers
                </p>
                <h2
                  className="font-display font-bold tracking-tight text-3xl md:text-5xl text-repower-cream mb-4 leading-[1.1]"
                  style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}
                >
                  What customers say
                </h2>
                <div className="flex items-center justify-center">
                  <GoogleRatingBadge variant="full" tone="dark" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {liveReviews.map(review => (
                  <div
                    key={`${review.authorName}-${review.time}`}
                    className="rounded-xl bg-repower-navy-900/60 border border-repower-cream/10 backdrop-blur-sm p-6 flex flex-col"
                  >
                    <div className="flex gap-0.5 text-repower-gold mb-3" aria-label="5 stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <p className="text-repower-cream/90 leading-relaxed mb-4 italic line-clamp-6">
                      &ldquo;{review.text.trim()}&rdquo;
                    </p>
                    <div className="text-sm mt-auto">
                      <div className="font-medium text-repower-cream">{formatReviewerName(review.authorName)}</div>
                      <div className="text-repower-cream/60">{review.relativeTime} · Google review</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
              <RepowerCta as="button" onClick={goBuild} variant="primary" size="lg" className="w-full sm:w-auto">
                <DollarSign className="h-5 w-5" /> Build Your Quote
              </RepowerCta>
              <RepowerCta href="tel:+19053422153" variant="secondary" size="lg" className="w-full sm:w-auto">
                <Phone className="h-4 w-4" /> Call (905) 342-2153
              </RepowerCta>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RepowerLayout>
  );
}
