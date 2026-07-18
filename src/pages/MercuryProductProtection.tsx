import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  Gauge,
  Info,
  MapPin,
  Repeat2,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Helmet } from '@/lib/helmet';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import {
  MERCURY_PLATINUM_BASE_COVERAGE_YEARS,
  MERCURY_PLATINUM_MAX_TOTAL_YEARS,
  MERCURY_PLATINUM_RATE_CARD_LAST_VERIFIED,
  MERCURY_PLATINUM_RATES,
  MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL,
  MERCURY_PRODUCT_PROTECTION_OFFICIAL_OVERVIEW_URL,
  getMaximumPlatinumPlanYears,
  type PlatinumPlanYears,
} from '@/data/mercuryProductProtection';
import mercury115Reference from '@/assets/product-protection/mercury-product-protection-platinum-hero.webp';

const SITE_URL = 'https://www.mercuryrepower.ca';
const PAGE_URL = `${SITE_URL}/mercury-product-protection`;
const ALL_PLATINUM_PRICES = MERCURY_PLATINUM_RATES.flatMap((band) => Object.values(band.prices));
const FAQS = [
  {
    question: 'How much does Mercury Product Protection cost in Canada?',
    answer: 'At Harris Boat Works, current Mercury Platinum Product Protection pricing starts at $76 CAD before HST for a one-year plan on a 2.5-14.9 HP outboard. A four-year plan for 75-149.9 HP is $1,748 CAD. Mercury defines Product Protection as an extended service contract, not an extension of the standard product warranty. Final eligibility and price are confirmed by motor serial number.',
  },
  {
    question: 'What is Mercury Product Protection?',
    answer: 'Mercury Product Protection is an extended service contract administered by Mercury Marine. Platinum coverage begins after the applicable Mercury factory limited warranty ends and covers eligible mechanical and electrical failures under the plan terms.',
  },
  {
    question: 'Why does Harris Boat Works sell Platinum coverage?',
    answer: 'Platinum is the highest Mercury Product Protection coverage tier and includes eligible mechanical and electrical failures. It is the plan we quote because it gives customers the broadest protection Mercury offers.',
  },
  {
    question: 'How many years can I add?',
    answer: 'Plans are available in one- through five-year terms, subject to eligibility, with up to eight years of combined factory warranty and Product Protection. HBW confirms how any applicable promotional warranty coverage affects the available term.',
  },
  {
    question: 'Can the plan be transferred to a new owner?',
    answer: 'Yes. Mercury states that Product Protection is transferable to a subsequent recreational-use purchaser, subject to the plan transfer process and timing requirements.',
  },
  {
    question: 'When do I need to buy coverage?',
    answer: 'Mercury requires Product Protection to be purchased before the applicable factory limited warranty expires. We verify the serial number, manufacture date, hours and current coverage before registration.',
  },
  {
    question: 'Is there a deductible?',
    answer: 'Yes. The current Canadian Platinum contract states a $50 deductible per claim, paid directly to the authorized servicing dealer. The complete contract terms govern.',
  },
  {
    question: 'Do promotions change the price shown in a motor quote?',
    answer: 'If an applicable Mercury promotion changes the included warranty period, it can change how many paid Product Protection years are needed. HBW confirms the motor’s current coverage, respects the eight-year combined maximum, and prices the remaining Platinum term. The serial record and current promotion terms govern.',
  },
];

const money = (value: number) => new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
}).format(value);

function ProductProtectionSEO() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: 'Mercury Product Protection Platinum Plans & Prices | Harris Boat Works',
        description: 'Current CAD pricing for Mercury Platinum Product Protection plans, plus eligibility, coverage and a promotion-aware estimator from Harris Boat Works in Ontario.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${PAGE_URL}#service` },
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
        inLanguage: 'en-CA',
      },
      {
        '@type': 'Service',
        '@id': `${PAGE_URL}#service`,
        name: 'Mercury Product Protection Platinum Plan',
        serviceType: 'Extended service contract for eligible Mercury outboards',
        provider: {
          '@type': 'Organization',
          name: 'Mercury Marine Limited',
          url: MERCURY_PRODUCT_PROTECTION_OFFICIAL_OVERVIEW_URL,
        },
        areaServed: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'CAD',
          lowPrice: Math.min(...ALL_PLATINUM_PRICES),
          highPrice: Math.max(...ALL_PLATINUM_PRICES),
          offerCount: ALL_PLATINUM_PRICES.length,
          description: 'One- through five-year Platinum plan rates before HST; final eligibility and price are confirmed by serial number.',
          seller: { '@id': `${SITE_URL}/#organization` },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Mercury Product Protection', item: PAGE_URL },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'Dataset',
        '@id': `${PAGE_URL}#rate-card`,
        name: 'Mercury Platinum Product Protection Canadian Rate Card',
        description: 'Current Canadian-dollar retail pricing by horsepower band and one- through five-year Platinum plan term.',
        url: PAGE_URL,
        dateModified: MERCURY_PLATINUM_RATE_CARD_LAST_VERIFIED,
        creator: { '@id': `${SITE_URL}/#organization` },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'text/markdown', contentUrl: `${SITE_URL}/mercury-product-protection.md` },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE_URL}/mercury-product-protection.json` },
        ],
      },
    ],
  };

  return (
    <Helmet>
      <title>Mercury Product Protection Platinum Plans & Prices | HBW</title>
      <meta name="description" content="See current CAD pricing for Mercury Platinum Product Protection, check eligible plan years and add protection to a Mercury outboard quote in Ontario." />
      <link rel="canonical" href={PAGE_URL} />
      <link rel="alternate" type="text/markdown" href={`${SITE_URL}/mercury-product-protection.md`} title="Mercury Platinum Product Protection rate card in Markdown" />
      <link rel="alternate" type="application/json" href={`${SITE_URL}/mercury-product-protection.json`} title="Mercury Platinum Product Protection rate card in JSON" />
      <meta property="og:title" content="Mercury Platinum Product Protection Plans & Prices" />
      <meta property="og:description" content="Current CAD plan pricing, clear eligibility and a promotion-aware coverage estimator from Harris Boat Works." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={PAGE_URL} />
      <meta property="og:image" content={`${SITE_URL}/images/mercury-product-protection-platinum-hero.webp`} />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default function MercuryProductProtection() {
  const {
    getTotalWarrantyBonusYears,
    getWarrantyPromotions,
    loading: promotionsLoading,
    error: promotionsError,
  } = useActivePromotions();
  const [bandIndex, setBandIndex] = useState(3);
  const [planYears, setPlanYears] = useState<number>(4);

  const promotionsVerified = !promotionsLoading && !promotionsError;
  const promoYears = promotionsVerified
    ? Math.max(0, getTotalWarrantyBonusYears?.() ?? 0)
    : 0;
  const includedCoverageYears = Math.min(
    MERCURY_PLATINUM_BASE_COVERAGE_YEARS + promoYears,
    MERCURY_PLATINUM_MAX_TOTAL_YEARS,
  );
  const maxPlanYears = promotionsVerified
    ? getMaximumPlatinumPlanYears(includedCoverageYears)
    : 5;
  const warrantyPromotions = promotionsVerified ? (getWarrantyPromotions?.() ?? []) : [];

  useEffect(() => {
    if (promotionsVerified && planYears > maxPlanYears) {
      setPlanYears(maxPlanYears);
    }
  }, [maxPlanYears, planYears, promotionsVerified]);

  const selectedBand = MERCURY_PLATINUM_RATES[bandIndex];
  const selectedPrice = planYears > 0
    ? selectedBand.prices[planYears as PlatinumPlanYears]
    : 0;
  const combinedCoverageYears = Math.min(
    includedCoverageYears + planYears,
    MERCURY_PLATINUM_MAX_TOTAL_YEARS,
  );

  const planButtons = useMemo(
    () => Array.from({ length: maxPlanYears }, (_, index) => index + 1),
    [maxPlanYears],
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <ProductProtectionSEO />
      <RepowerHeader solid />
      <div className="h-16 lg:h-[72px]" />

      <main>
        <section className="relative overflow-hidden bg-black text-white">
          <div className="pointer-events-none absolute right-[-12rem] top-[-14rem] h-[36rem] w-[36rem] rounded-full bg-[#003a50]/45 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-[44%] bg-[#ed1c28] opacity-90 [clip-path:polygon(30%_100%,100%_0,100%_100%)]" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-[1400px] gap-12 px-6 py-16 md:px-14 md:py-24 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-28">
            <div className="max-w-3xl">
              <div className="mb-7 flex items-center gap-4">
                <span className="h-12 w-1 bg-[#ed1c28]" aria-hidden="true" />
                <p className="font-sans text-xs font-bold uppercase tracking-[0.28em] text-[#b5b8be]">
                  Mercury Product Protection
                </p>
              </div>
              <h1 className="max-w-4xl font-display text-4xl font-bold uppercase leading-[0.94] tracking-[0.035em] sm:text-5xl md:text-6xl lg:text-7xl">
                Protect more of your time on the water.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
                Platinum is the Mercury Product Protection plan we sell. It is Mercury’s highest coverage tier, with eligible mechanical and electrical protection after the factory limited warranty ends.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#price-your-plan" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#ed1c28] px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c9101c]">
                  Price your plan <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/quote/motor-selection" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/35 px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white/10">
                  Build a motor quote <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-3">
                {[
                  ['Up to 8 years', 'Combined protection'],
                  ['$50', 'Deductible per claim'],
                  ['Transferable', 'To the next owner'],
                ].map(([value, label]) => (
                  <div key={label} className="bg-black/80 px-5 py-4">
                    <p className="font-display text-xl font-bold uppercase tracking-wide">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/55">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:justify-self-end">
              <div className="absolute -left-5 -top-5 h-24 w-1 bg-white" aria-hidden="true" />
              <div className="overflow-hidden border border-white/20 bg-[#0d0d0e] shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={mercury115Reference}
                    alt="Mercury 115 FourStroke outboard installed on a boat"
                    className="h-full w-full object-cover object-center"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/5" aria-hidden="true" />
                  <p className="absolute bottom-4 left-5 border-l-4 border-[#ed1c28] pl-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white sm:text-sm">
                    Mercury 115 FourStroke
                  </p>
                </div>
                <div className="relative border-t border-white/15 px-6 py-6 sm:px-8">
                  <div className="absolute right-0 top-0 h-full w-28 bg-[#ed1c28] [clip-path:polygon(70%_0,100%_0,100%_100%,0_100%)]" aria-hidden="true" />
                  <p className="relative text-xs font-bold uppercase tracking-[0.24em] text-[#b5b8be]">Mercury Product Protection</p>
                  <p className="relative mt-2 font-display text-3xl font-bold uppercase tracking-[0.08em] text-white sm:text-4xl">Platinum</p>
                  <p className="relative mt-2 text-sm font-semibold uppercase tracking-[0.13em] text-white/65">1-5 year plans · Canadian pricing</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/50">Mercury 115 FourStroke shown. Plan pricing below covers every listed horsepower band; final eligibility is confirmed by serial number.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-white px-6 py-12 md:px-14 md:py-16">
          <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#003a50]">Direct Canadian price answer</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-black/60">Rate card verified {MERCURY_PLATINUM_RATE_CARD_LAST_VERIFIED}</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">How much does Mercury Product Protection cost in Canada?</h2>
              <p className="mt-5 text-lg leading-8 text-black/68">
                Mercury Platinum Product Protection at HBW currently starts at <strong className="text-black">$76 CAD</strong> for a one-year plan on a 2.5-14.9 HP outboard. A four-year plan for a 75-149.9 HP outboard is <strong className="text-black">$1,748 CAD</strong>. The full Canadian rate card runs to <strong className="text-black">$22,469 CAD</strong> for five years on a 600 HP outboard. Prices are before HST; final eligibility and price are confirmed by serial number.
              </p>
              <p className="mt-4 text-sm leading-6 text-black/55">
                People often search for this as Mercury extended warranty pricing. Mercury’s Canadian contract defines it as an extended service contract, not an extension of the standard product warranty.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
                <a href="/mercury-product-protection.md" className="inline-flex items-center gap-2 text-[#003a50] underline decoration-[#69a8a6] underline-offset-4 hover:text-black">Markdown rate card <ExternalLink className="h-3.5 w-3.5" /></a>
                <a href="/mercury-product-protection.json" className="inline-flex items-center gap-2 text-[#003a50] underline decoration-[#69a8a6] underline-offset-4 hover:text-black">JSON rate card <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          </div>
        </section>

        <section id="price-your-plan" className="scroll-mt-24 bg-[#e1e3e7] px-6 py-16 md:px-14 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#003a50]">Current HBW rate card</p>
                <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] md:text-5xl">Price your Platinum plan.</h2>
                <div className="mt-5 h-1 w-28 bg-[#ed1c28]" aria-hidden="true" />
                <p className="mt-6 max-w-xl text-base leading-7 text-black/65">
                  Choose the horsepower band and paid plan term. When an applicable Mercury promotion changes the included warranty period, we count that coverage first so the quote never exceeds Mercury’s eight-year combined maximum.
                </p>

                {promoYears > 0 && (
                  <div className="mt-6 border-l-4 border-[#003a50] bg-white px-5 py-4 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.12em]">Applicable warranty promotion detected</p>
                    <p className="mt-2 text-sm leading-6 text-black/65">
                      {promoYears} promotional year{promoYears === 1 ? '' : 's'} counted before Platinum pricing after current coverage is confirmed
                      {warrantyPromotions.length > 0 ? `: ${warrantyPromotions.map((promotion) => promotion.name).join(', ')}` : '.'}
                    </p>
                  </div>
                )}
                {promotionsLoading && (
                  <div className="mt-6 border-l-4 border-[#69a8a6] bg-white px-5 py-4 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.12em]">Checking current promotional coverage</p>
                    <p className="mt-2 text-sm leading-6 text-black/65">The published plan prices remain visible while we verify the included-coverage total.</p>
                  </div>
                )}
                {promotionsError && (
                  <div role="alert" className="mt-6 border-l-4 border-[#ed1c28] bg-white px-5 py-4 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.12em]">Coverage verification unavailable</p>
                    <p className="mt-2 text-sm leading-6 text-black/65">The rate card is still valid, but current promotional coverage could not be verified. HBW will confirm the serial record and available term before quoting a combined total.</p>
                  </div>
                )}
              </div>

              <div className="bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
                <div className="grid gap-7 border-b border-black/10 p-6 sm:p-8 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-black/60">Motor horsepower</span>
                    <select
                      value={bandIndex}
                      onChange={(event) => setBandIndex(Number(event.target.value))}
                      disabled={!promotionsVerified}
                      className="mt-3 h-14 w-full border-2 border-black bg-white px-4 text-base font-semibold outline-none transition-colors focus:border-[#003a50] focus:ring-2 focus:ring-[#003a50]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {MERCURY_PLATINUM_RATES.map((band, index) => (
                        <option value={index} key={band.label}>{band.label}</option>
                      ))}
                    </select>
                  </label>

                  <fieldset>
                    <legend className="text-xs font-bold uppercase tracking-[0.18em] text-black/60">Add Product Protection</legend>
                    {planButtons.length > 0 ? (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {planButtons.map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => setPlanYears(year)}
                            disabled={!promotionsVerified}
                            aria-pressed={planYears === year}
                            className={`h-14 border-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${planYears === year ? 'border-black bg-black text-white' : 'border-black/20 bg-white text-black hover:border-black'}`}
                          >
                            {year} yr
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 border border-black/10 bg-[#e1e3e7]/60 p-4 text-sm">Current coverage is already at the eight-year maximum.</p>
                    )}
                  </fieldset>
                </div>

                <div className="grid bg-black text-white sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b5b8be]">
                      {promotionsVerified ? 'Estimated plan price' : 'Published plan price · verification required'}
                    </p>
                    <p className="mt-2 font-display text-5xl font-bold tracking-tight md:text-6xl">{money(selectedPrice)}</p>
                    <p className="mt-2 text-sm text-white/55">CAD before HST · one-time plan price</p>
                  </div>
                  <div className="border-t border-white/15 p-6 sm:min-w-[220px] sm:border-l sm:border-t-0 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b5b8be]">Coverage picture</p>
                    <p className="mt-2 text-2xl font-bold">
                      {promotionsLoading
                        ? 'Checking current coverage…'
                        : promotionsError
                          ? 'Confirm by serial number'
                          : `${includedCoverageYears} + ${planYears} = ${combinedCoverageYears} years`}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/55">
                      {promotionsVerified ? 'Included coverage + paid Platinum term' : 'Published plan price shown separately'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <p className="max-w-xl text-xs leading-5 text-black/55">
                    Rate-card estimate only. Eligibility, current coverage and final price are confirmed by motor serial number at registration. Taxes and any applicable fees are extra.
                  </p>
                  <Link to="/quote/motor-selection" className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#ed1c28] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#c9101c]">
                    Build a motor quote <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:px-14 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#003a50]">What Platinum adds</p>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] md:text-5xl">Protection built around ownership.</h2>
              <p className="mt-5 text-lg leading-8 text-black/65">The value is not a longer date on paper. It is knowing the plan, parts path and claim administration stay inside the Mercury network.</p>
            </div>

            <div className="mt-12 grid gap-px border border-black/10 bg-black/10 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Wrench, title: 'Mechanical + electrical', body: 'Platinum covers eligible mechanical and electrical failures under the contract terms.' },
                { icon: BadgeCheck, title: 'Genuine parts', body: 'Covered repairs use genuine Mercury or Quicksilver parts through the authorized dealer network.' },
                { icon: Repeat2, title: 'Transferable', body: 'Coverage can follow the motor to a subsequent recreational-use owner when transfer requirements are met.' },
                { icon: CircleDollarSign, title: 'Non-declining', body: 'Mercury describes the plan as non-declining, so covered claim value is not reduced as the engine ages.' },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="bg-white p-7 md:p-8">
                  <Icon className="h-7 w-7 text-[#003a50]" strokeWidth={1.7} />
                  <h3 className="mt-6 font-display text-xl font-bold uppercase tracking-wide">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/60">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#003a50] px-6 py-16 text-white md:px-14 md:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#69a8a6]">Eligibility snapshot</p>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] md:text-5xl">We verify before we promise.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70">A rate is useful only when the motor qualifies. HBW confirms the serial and current Mercury record before registration.</p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:gap-7">
                <a href={MERCURY_PRODUCT_PROTECTION_OFFICIAL_OVERVIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-b border-white/50 pb-1 text-sm font-bold uppercase tracking-[0.12em] text-white hover:border-white">
                  Mercury Canada overview <ExternalLink className="h-4 w-4" />
                </a>
                <a href={MERCURY_PRODUCT_PROTECTION_CANADA_PLAN_TERMS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-b border-white/50 pb-1 text-sm font-bold uppercase tracking-[0.12em] text-white hover:border-white">
                  Canadian Platinum terms <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: FileCheck2, title: 'Before expiry', body: 'Purchase must be completed before the applicable factory limited warranty expires.' },
                { icon: Gauge, title: 'Hours matter', body: 'Mercury lists recreational-use engines under 500 hours, subject to the complete eligibility rules.' },
                { icon: ShieldCheck, title: 'Manufacture date matters', body: 'Mercury lists engines manufactured in the current calendar year and four preceding calendar years, subject to the complete eligibility rules.' },
                { icon: MapPin, title: 'Dealer confirmation', body: 'Bring us the serial number. We confirm eligibility, term and exact price before you buy.' },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="border border-white/15 bg-white/[0.06] p-6">
                  <Icon className="h-6 w-6 text-[#69a8a6]" />
                  <h3 className="mt-5 text-sm font-bold uppercase tracking-[0.15em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:px-14 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#003a50]">Full rate matrix</p>
                <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] md:text-5xl">Platinum pricing by horsepower.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-black/55">CAD before HST. Each column is the purchased Product Protection term—not the combined warranty total.</p>
            </div>

            <div className="mt-10 overflow-x-auto border border-black/15">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">Mercury Platinum Product Protection plan prices in Canadian dollars by horsepower and term</caption>
                <thead className="bg-black text-white">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em]">Horsepower</th>
                    {[1, 2, 3, 4, 5].map((year) => (
                      <th scope="col" key={year} className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em]">{year} year{year > 1 ? 's' : ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MERCURY_PLATINUM_RATES.map((band, index) => (
                    <tr key={band.label} className={index % 2 === 0 ? 'bg-white' : 'bg-[#e1e3e7]/55'}>
                      <th scope="row" className="whitespace-nowrap border-t border-black/10 px-5 py-4 text-sm font-bold">{band.label}</th>
                      {([1, 2, 3, 4, 5] as PlatinumPlanYears[]).map((year) => (
                        <td key={year} className="border-t border-black/10 px-5 py-4 text-right text-sm tabular-nums">{money(band.prices[year])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-start gap-3 border-l-4 border-[#ed1c28] bg-[#e1e3e7]/55 p-5 text-sm leading-6 text-black/65">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#ed1c28]" />
              <p>Pricing is the current HBW retail rate card and may change. Mercury plan eligibility, exclusions, maintenance requirements, transfer rules and the actual contract govern. We confirm the serial number before accepting payment.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#e1e3e7] px-6 py-16 md:px-14 md:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-[#003a50]">Questions before you add it</p>
            <h2 className="mt-4 text-center font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] md:text-5xl">Straight answers.</h2>
            <div className="mt-10 divide-y divide-black/15 border-y border-black/15">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group bg-transparent">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-left font-display text-lg font-bold tracking-wide marker:hidden">
                    {faq.question}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-black transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-3xl pb-6 pr-12 text-base leading-7 text-black/65">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black px-6 py-16 text-white md:px-14 md:py-20">
          <div className="pointer-events-none absolute bottom-0 right-0 h-full w-64 bg-[#ed1c28] [clip-path:polygon(100%_0,100%_100%,0_100%)]" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-[1240px] flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b5b8be]">New motor or motor you already own</p>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] md:text-5xl">Let’s confirm the right Platinum term.</h2>
              <p className="mt-5 text-base leading-7 text-white/65">Build it into a new Mercury quote, or contact HBW with your existing motor serial number.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Link to="/quote/motor-selection" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#ed1c28] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-[#c9101c]">
                Build a quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white hover:border-white hover:bg-white/10">
                Check my serial <Check className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
