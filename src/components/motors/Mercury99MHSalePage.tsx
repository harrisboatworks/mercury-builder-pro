import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BadgeDollarSign,
  Check,
  CircleGauge,
  Fuel,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DealerTrustStrip } from '@/components/trust/DealerTrustStrip';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import {
  buildMercury99MhFaqs,
  formatMercury99MhCAD,
} from '@/lib/mercury99MhSaleContent';
import type { ResolvedMotorAvailability } from '@/lib/motorAvailability';

const PHONE_DISPLAY = '905-342-2153';
const PHONE_HREF = 'tel:+19053422153';

interface Mercury99MHSalePageProps {
  display: string;
  price: number;
  msrp: number | null;
  image: string;
  modelId: string;
  availability: ResolvedMotorAvailability;
}

const INCLUDED = [
  'Mercury 9.9 MH FourStroke, model 1A10201LK',
  'Standard 3-blade aluminum propeller',
  '12-litre remote fuel tank',
  'Applicable Mercury limited warranty (3 years for eligible pleasure use)',
  'Dealer pickup walkthrough and warranty registration',
];

const FEATURE_CARDS = [
  {
    icon: Fuel,
    title: 'Battery-free EFI',
    body: 'Electronic fuel injection with manual starting, so this model can run without a starting battery.',
  },
  {
    icon: Wrench,
    title: 'Simple manual-start setup',
    body: 'The tiller and manual-start configuration keeps the package straightforward for small boats and cottage use.',
  },
  {
    icon: CircleGauge,
    title: 'Two-cylinder 209cc power',
    body: 'Smooth Mercury FourStroke power in an 88 lb dry-weight platform for this exact configuration.',
  },
  {
    icon: PackageCheck,
    title: 'Ready for a short transom',
    body: 'The 15-inch shaft is the common fit for many small aluminum boats, tenders, and utility hulls.',
  },
];

const OFFICIAL_MERCURY_VIEWS = [
  {
    src: '/assets/mercury-9-9-mh/official-front-three-quarter.jpg',
    alt: 'Official Mercury Marine front three-quarter studio view of the 9.9 FourStroke short-tiller outboard',
    label: 'Front three-quarter',
  },
  {
    src: '/assets/mercury-9-9-mh/official-port-profile.jpg',
    alt: 'Official Mercury Marine port-profile studio view of the 9.9 FourStroke short-tiller outboard',
    label: 'Port profile',
  },
  {
    src: '/assets/mercury-9-9-mh/official-rear-three-quarter.jpg',
    alt: 'Official Mercury Marine rear three-quarter studio view of the 9.9 FourStroke short-tiller outboard',
    label: 'Rear three-quarter',
  },
];

export function Mercury99MHSalePage({
  display,
  price,
  msrp,
  image,
  modelId,
  availability,
}: Mercury99MHSalePageProps) {
  const priceLabel = formatMercury99MhCAD(price);
  const savings = msrp && msrp > price ? msrp - price : null;
  const quoteUrl = `/quote/motor-selection?motor=${encodeURIComponent(modelId)}`;
  const faqs = buildMercury99MhFaqs(price, availability);
  const availabilityPillClass = availability.inStock
    ? 'border-emerald-600/20 bg-emerald-50 text-emerald-800'
    : 'border-amber-500/25 bg-amber-50 text-amber-900';
  const beforeYouBuy = [
    'Price is in Canadian dollars before HST',
    'Installation, rigging, controls, and optional accessories are extra',
    availability.detail,
    'Pickup only in Gores Landing, Ontario; no shipping or courier release',
  ];

  return (
    <>
      <article className="min-h-screen bg-repower-paper pb-[76px] text-repower-navy-900 lg:pb-0">
        <RepowerHeader />
        <div className="pt-[64px] lg:pt-[72px]" />

        <section className="relative isolate overflow-hidden bg-repower-navy-900 text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(circle at 82% 18%, rgba(200,16,46,0.28), transparent 32%), radial-gradient(circle at 16% 88%, rgba(201,162,74,0.15), transparent 30%)',
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div className="relative mx-auto max-w-[1180px] px-5 py-7 md:px-10 md:py-11 lg:px-12 lg:py-14">
            <nav aria-label="Breadcrumb" className="mb-6 text-xs font-medium text-white/55 md:text-sm">
              <Link to="/" className="hover:text-white hover:underline">Home</Link>
              {' / '}
              <Link to="/mercury-outboards-ontario" className="hover:text-white hover:underline">Mercury Outboards</Link>
              {' / '}
              <span aria-current="page" className="text-white/85">9.9 MH Sale</span>
            </nav>

            <div className="grid items-center gap-9 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12">
              <div>
                <img
                  src="/assets/mercury-logo-white.png"
                  alt="Mercury Marine"
                  className="mb-5 h-auto w-[200px] sm:w-[230px]"
                  loading="eager"
                />
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-repower-gold/45 bg-repower-gold/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-repower-gold md:text-xs">
                  <Sparkles className="h-4 w-4" />
                  Special Ontario Sale
                </div>

                <h1 className="max-w-2xl font-display text-[42px] font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl lg:text-[62px]">
                  Mercury 9.9 MH FourStroke Outboard for Sale
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/72 md:text-lg">
                  A new manual-start, 15-inch short-shaft tiller model with battery-free EFI and a clearly published Ontario sale price.
                </p>

                <div className="mt-5 lg:grid lg:grid-cols-[auto_1fr] lg:items-end lg:gap-5">
                  <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Special sale price</div>
                      <div className="mt-1 font-display text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl">
                        {priceLabel}
                      </div>
                    </div>
                    <div className="pb-1">
                      <div className="text-sm font-bold uppercase tracking-[0.16em] text-repower-gold">CAD</div>
                      {msrp && msrp > price ? (
                        <div className="mt-1 text-sm text-white/55">
                          MSRP <span className="line-through">{formatMercury99MhCAD(msrp)}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0">
                    {savings ? (
                      <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white">
                        <BadgeDollarSign className="h-5 w-5 text-repower-gold" />
                        Save {formatMercury99MhCAD(savings)}
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="lg"
                        className="h-13 min-h-[52px] flex-1 bg-repower-mercury-red px-5 text-sm font-bold text-white shadow-[0_14px_36px_rgba(200,16,46,0.32)] hover:bg-repower-mercury-red-deep"
                      >
                        <Link
                          to={quoteUrl}
                          data-cta="quote-start"
                          data-cta-location="mercury_9_9_mh_sale_hero"
                        >
                          Get My {priceLabel} Quote
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="h-13 min-h-[52px] border-white/35 bg-transparent px-4 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                      >
                        <a
                          href={PHONE_HREF}
                          aria-label={`Call Harris Boat Works at ${PHONE_DISPLAY}`}
                          data-cta="phone"
                          data-cta-location="mercury_9_9_mh_sale_hero"
                        >
                          <Phone className="h-5 w-5" />
                          <span className="hidden xl:inline">Call</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/85 sm:text-sm">
                  {['Manual start', '15-inch shaft', 'Tiller control', availability.label].map((item) => (
                    <span key={item} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[570px]">
                <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-white/15 via-white/[0.03] to-repower-mercury-red/20 blur-xl" />
                <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-white via-[#edf2f7] to-[#d7dee8] p-5 shadow-2xl md:p-8">
                  <div className={`absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ${availabilityPillClass}`}>
                    <span className={`h-2 w-2 rounded-full ${availability.inStock ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                    {availability.label}
                  </div>
                  <div className="absolute right-4 top-4 z-10 rounded-full bg-repower-mercury-red px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg">
                    {savings ? `Save ${formatMercury99MhCAD(savings)}` : 'Special sale'}
                  </div>
                  <img
                    src={image}
                    alt={`${display}, manual-start tiller outboard with 15-inch shaft`}
                    className="aspect-square h-auto w-full object-contain drop-shadow-[0_24px_24px_rgba(5,14,28,0.28)]"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-3 border-t border-repower-navy-900/10 pt-4 text-repower-navy-900">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-repower-navy-900/45">Exact model</div>
                      <div className="mt-1 text-sm font-bold">1A10201LK</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-repower-navy-900/45">Pickup</div>
                      <div className="mt-1 text-sm font-bold">Gores Landing, ON</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-9 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [ShieldCheck, 'Mercury Certified', 'Repower Center'],
                [Award, 'Dealer since 1965', 'Family-owned since 1947'],
                [BadgeDollarSign, 'Published CAD price', 'Written quote confirmed'],
                [MapPin, 'Ontario pickup', 'Gores Landing'],
              ].map(([Icon, title, detail]) => (
                <div key={String(title)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3">
                  <Icon className="h-5 w-5 shrink-0 text-repower-gold" />
                  <div>
                    <div className="text-xs font-bold text-white sm:text-sm">{title}</div>
                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">{detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-4xl text-xs leading-relaxed text-white/50 md:text-sm">
              Exact model 1A10201LK is {priceLabel} CAD before HST{savings ? `, saving ${formatMercury99MhCAD(savings)} from the current Mercury MSRP` : ''}. Confirm the current written quote and ETA before travelling.
            </p>
          </div>
        </section>

        <section className="border-b border-repower-navy-900/10 bg-white">
          <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-px bg-repower-navy-900/10 md:grid-cols-4">
            {[
              ['9.9 HP', 'Mercury FourStroke'],
              ['Manual', 'Battery-free start'],
              ['15 inch', 'Short-shaft model'],
              ['88 lb', 'Dry weight'],
            ].map(([value, label]) => (
              <div key={label} className="bg-white px-5 py-6 text-center">
                <div className="font-display text-2xl font-bold text-repower-navy-900 md:text-3xl">{value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.13em] text-repower-navy-900/45">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24 lg:px-12">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-repower-mercury-red">Mercury 9.9 price in Ontario</div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.025em] text-repower-navy-900 md:text-5xl">
              New Mercury 9.9 MH: {priceLabel} CAD
            </h2>
            <p className="mt-4 text-base leading-relaxed text-repower-navy-900/62 md:text-lg">
              For Ontario buyers comparing the price of a new Mercury 9.9 outboard, this is the exact MH model 1A10201LK. It is the manual-start, short-shaft tiller, not the long-shaft MLH or the dedicated ProKicker. Boat-specific installation and optional equipment stay separate until we know what your setup needs.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-700/15 bg-emerald-50/70 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-bold text-repower-navy-900">Included at {priceLabel}</h3>
              </div>
              <ul className="space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-repower-navy-900/78 md:text-base">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-repower-navy-900/10 bg-repower-navy-900/[0.035] p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-repower-navy-900 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-bold text-repower-navy-900">Before you buy</h3>
              </div>
              <ul className="space-y-3">
                {beforeYouBuy.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-repower-navy-900/70 md:text-base">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-repower-mercury-red" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="official-mercury-gallery" className="relative scroll-mt-20 overflow-hidden border-y border-repower-navy-900/10 bg-[#eef1f4] px-5 py-16 md:px-10 md:py-24 lg:px-12">
          <div aria-hidden="true" className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-repower-mercury-red/[0.07] blur-3xl" />
          <div className="relative mx-auto max-w-[1180px]">
            <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-repower-mercury-red">
                  <span className="h-[3px] w-10 bg-repower-mercury-red" />
                  Official Mercury product gallery
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.025em] text-repower-navy-900 md:text-5xl">
                  The 9.9 FourStroke, from every angle
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-repower-navy-900/62 md:text-lg">
                  Mercury-supplied studio photography of the standard short-tiller 9.9 FourStroke family shown on this sale page.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-repower-navy-900/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-repower-navy-900/65 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-repower-mercury-red" />
                Official Mercury imagery
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-5">
              {OFFICIAL_MERCURY_VIEWS.map((view, index) => (
                <figure
                  key={view.src}
                  className={`group relative overflow-hidden rounded-2xl border border-repower-navy-900/10 bg-white shadow-[0_16px_50px_rgba(5,14,28,0.08)] ${
                    index === 0 ? 'md:row-span-2' : ''
                  }`}
                >
                  <div className={`flex items-center justify-center p-6 md:p-8 ${index === 0 ? 'h-[460px] md:h-[620px]' : 'h-[310px] md:h-[300px]'}`}>
                    <img
                      src={view.src}
                      alt={view.alt}
                      className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.025] ${
                        index === 0 ? 'max-w-[430px]' : 'max-w-[255px]'
                      }`}
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="absolute bottom-4 left-4 rounded-full bg-repower-navy-900/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm md:text-xs">
                    {view.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-repower-navy-900 px-5 py-16 text-white md:px-10 md:py-24 lg:px-12">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-10 max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-repower-gold">Why the MH gets the attention</div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.025em] md:text-5xl">
                The popular 9.9 setup, without paying for electric start
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/65 md:text-lg">
                For the right boat, the 9.9 MH balances modern fuel delivery with a simple manual-start tiller package.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_CARDS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-repower-mercury-red text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-repower-mercury-red">Match the motor to the boat</div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.025em] text-repower-navy-900 md:text-5xl">
                Is the 9.9 MH right for you?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-repower-navy-900/62 md:text-lg">
                Shaft length and boat rating matter more than the sale price. We will help confirm fit before you commit.
              </p>
              <Button asChild className="mt-7 min-h-[48px] bg-repower-mercury-red px-6 text-white hover:bg-repower-mercury-red-deep">
                <Link to={quoteUrl} data-cta="quote-start" data-cta-location="mercury_9_9_mh_sale_fit">
                  Check My Setup and Build a Quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-repower-navy-900/10 bg-white p-6 shadow-sm">
                <h3 className="font-display text-xl font-bold text-repower-navy-900">A strong fit for</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-repower-navy-900/68">
                  {[
                    'Many small aluminum fishing and utility boats with a 15-inch transom',
                    'Cottage tenders where manual-start simplicity is preferred',
                    'Buyers who want EFI without adding an electric-start system',
                    'Kicker applications only after shaft length and controls are confirmed',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-repower-navy-900/10 bg-repower-navy-900/[0.035] p-6">
                <h3 className="font-display text-xl font-bold text-repower-navy-900">Choose another setup if</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-repower-navy-900/68">
                  {[
                    'Your transom requires a 20-inch long shaft',
                    'You want push-button electric start or remote steering',
                    'Your boat needs more than 9.9 HP to perform safely when loaded',
                    'You need delivery or shipping instead of in-person pickup',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-repower-mercury-red" />{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1180px] px-5 md:px-10 lg:px-12">
          <DealerTrustStrip variant="full" />
        </div>

        <section className="mx-auto max-w-[900px] px-5 py-16 md:px-10 md:py-24">
          <div className="mb-9 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-repower-mercury-red">Straight answers before you call</div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.025em] text-repower-navy-900 md:text-5xl">
              Mercury 9.9 price and sale FAQs
            </h2>
          </div>
          <Accordion type="single" collapsible className="rounded-2xl border border-repower-navy-900/10 bg-white px-5 shadow-sm md:px-7">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="border-repower-navy-900/10 last:border-0">
                <AccordionTrigger className="py-5 text-left font-display text-base font-bold text-repower-navy-900 hover:no-underline md:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 pr-7 text-sm leading-relaxed text-repower-navy-900/65 md:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="bg-repower-mercury-red px-5 py-14 text-white md:px-10 md:py-20 lg:px-12">
          <div className="mx-auto grid max-w-[1040px] items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/65">
                <MapPin className="h-4 w-4" /> Gores Landing, Ontario
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.025em] md:text-5xl">
                Put the {priceLabel} 9.9 MH on your quote
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/78 md:text-lg">
                Select this exact model online, or call us to confirm ETA and make sure the 15-inch shaft is right for your boat.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild size="lg" className="min-h-[52px] bg-white px-7 font-bold text-repower-mercury-red hover:bg-white/90">
                <Link to={quoteUrl} data-cta="quote-start" data-cta-location="mercury_9_9_mh_sale_bottom">
                  Build My Quote <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <a
                href={PHONE_HREF}
                data-cta="phone"
                data-cta-location="mercury_9_9_mh_sale_bottom"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-white/35 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </article>
      <SiteFooter />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-repower-navy-900/10 bg-white/95 px-3 py-2 shadow-[0_-12px_30px_rgba(5,14,28,0.13)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <div className="min-w-0 flex-1 pl-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/45">Mercury 9.9 MH</div>
            <div className="font-display text-xl font-bold tracking-[-0.02em] text-repower-navy-900">{priceLabel} <span className="text-[10px] font-sans tracking-normal text-repower-navy-900/45">CAD</span></div>
          </div>
          <Button asChild size="sm" className="min-h-[44px] bg-repower-mercury-red px-4 font-bold text-white hover:bg-repower-mercury-red-deep">
            <Link to={quoteUrl} data-cta="quote-start" data-cta-location="mercury_9_9_mh_sale_mobile_sticky">
              Build Quote <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <a
            href={PHONE_HREF}
            aria-label={`Call Harris Boat Works at ${PHONE_DISPLAY}`}
            data-cta="phone"
            data-cta-location="mercury_9_9_mh_sale_mobile_sticky"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-repower-navy-900/15 text-repower-navy-900 transition-colors hover:bg-repower-navy-900/5"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      </div>
    </>
  );
}
