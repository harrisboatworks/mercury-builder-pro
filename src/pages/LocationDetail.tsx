import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { getLocationBySlug } from '@/data/locations';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Anchor, Phone, Award, MapPin, Calendar, Wrench } from 'lucide-react';

const TRUST_ROW = [
  { icon: Award, label: 'Mercury Platinum Dealer' },
  { icon: Calendar, label: 'Family-owned since 1947' },
  { icon: Wrench, label: 'Mercury dealer since 1965' },
  { icon: MapPin, label: 'Pickup in Gores Landing' },
];

type UseCase = { title: string; body: string; href: string };

const DEFAULT_USE_CASES: UseCase[] = [
  {
    title: 'Small & kicker motors',
    body: '2.5–25 HP for tenders, sailboat auxiliaries, and trolling kickers.',
    href: '/quote/motor-selection',
  },
  {
    title: '60–115 HP fishing & pontoon',
    body: 'The most common Mercury repower for Ontario aluminum boats and pontoons.',
    href: '/quote/motor-selection',
  },
  {
    title: '150+ Pro XS & performance',
    body: 'Mercury Pro XS for bass and high-performance fibreglass.',
    href: '/mercury-pro-xs',
  },
];

const USE_CASES_BY_SLUG: Record<string, UseCase[]> = {
  'rice-lake-mercury-repower': [
    { title: '9.9–25 HP kickers & tillers', body: 'Trolling kickers and tiller fishing rigs for Rice Lake walleye and bass.', href: '/quote/motor-selection' },
    { title: '40–115 HP fishing & pontoon', body: 'The most common Rice Lake repower, aluminum fishing boats and family pontoons, lake-tested before pickup.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS bass', body: 'Mercury Pro XS for Rice Lake and Trent, Severn bass tournaments.', href: '/mercury-pro-xs' },
  ],
  'peterborough-mercury-dealer': [
    { title: '9.9–25 HP kickers', body: 'Trolling kickers for Kawartha and Trent, Severn fishing rigs.', href: '/quote/motor-selection' },
    { title: '60–115 HP pontoon & cottage', body: 'Pontoon and cottage-boat repowers sized for Stoney, Buckhorn, and Chemong.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS performance', body: 'Mercury Pro XS for Kawartha bass and performance fibreglass.', href: '/mercury-pro-xs' },
  ],
  'kawartha-lakes-mercury-outboards': [
    { title: '9.9–25 HP kickers', body: 'Tiller and kicker setups for Kawartha cottage boats and trolling.', href: '/quote/motor-selection' },
    { title: '60–115 HP pontoon repowers', body: 'Pontoon and family-boat repowers, the most common Mercury choice across the Kawarthas.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS', body: 'Mercury Pro XS for Sturgeon, Pigeon, and Trent, Severn bass.', href: '/mercury-pro-xs' },
  ],
  'cobourg-northumberland-mercury': [
    { title: 'Small & kicker motors', body: '2.5–25 HP for sailboat auxiliaries out of Cobourg Marina and Lake Ontario tenders.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'Inland-lake pontoons and aluminum fishing boats, short trailer up Hwy 45 to Gores Landing.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS', body: 'Mercury Pro XS for Lake Ontario and Trent, Severn performance boats.', href: '/mercury-pro-xs' },
  ],
  'whitby-mercury-dealer': [
    { title: 'Small & kicker motors', body: '2.5–25 HP kickers and tenders for Whitby Harbour and Lake Scugog fishing rigs.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'The common Durham repower, Lake Scugog and Lake Ontario aluminum boats and pontoons.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS bass', body: 'Mercury Pro XS for Lake Scugog and Kawartha bass anglers trailering from Whitby.', href: '/mercury-pro-xs' },
  ],
  'ajax-mercury-dealer': [
    { title: 'Small & kicker motors', body: '2.5–25 HP kickers and tenders for Lake Ontario and inland fishing rigs.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'Lake Scugog and Kawartha-bound aluminum boats and pontoons, easy 401 trailer to Gores Landing.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS bass', body: 'Mercury Pro XS for Ajax-area anglers fishing Scugog and the Trent system.', href: '/mercury-pro-xs' },
  ],
  'pickering-mercury-dealer': [
    { title: 'Sailboat auxiliaries & kickers', body: '2.5–15 HP Mercury auxiliaries for Frenchman’s Bay sailboats and Lake Ontario tenders.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'Inland-lake pontoons and Scugog/Kawartha fishing boats trailered from Pickering.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS', body: 'Mercury Pro XS for performance fibreglass and bass anglers.', href: '/mercury-pro-xs' },
  ],
  'oshawa-mercury-dealer': [
    { title: 'Small & kicker motors', body: '2.5–25 HP kickers and tenders for Oshawa Harbour and Scugog fishing.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'The common Durham repower, Lake Scugog and inland-lake aluminum boats and pontoons.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS bass', body: 'Mercury Pro XS for Lake Scugog and Kawartha bass anglers.', href: '/mercury-pro-xs' },
  ],
  'bowmanville-courtice-mercury-dealer': [
    { title: 'Small & kicker motors', body: '2.5–25 HP kickers for cottage tenders and trolling rigs.', href: '/quote/motor-selection' },
    { title: '60–115 HP cottage & pontoon', body: 'Cottage boats and pontoons, the closest Durham drive to Gores Landing, straight up 115/35.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS', body: 'Mercury Pro XS for Kawartha bass anglers and performance fibreglass.', href: '/mercury-pro-xs' },
  ],
  'gta-mercury-outboards': [
    { title: 'Small & kicker motors', body: '2.5–25 HP for sailboat auxiliaries, tenders, and trolling kickers across the GTA.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'The most common GTA repower, inland-lake aluminum boats and family pontoons.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS performance', body: 'Mercury Pro XS for bass and performance fibreglass owners trailering east.', href: '/mercury-pro-xs' },
  ],
  'durham-gta-mercury-pickup': [
    { title: 'Small & kicker motors', body: '2.5–25 HP kickers and tenders for Durham-area boats and Scugog fishing rigs.', href: '/quote/motor-selection' },
    { title: '60–115 HP fishing & pontoon', body: 'The common Durham repower, Scugog and inland-lake aluminum boats and pontoons.', href: '/quote/motor-selection' },
    { title: '150+ Pro XS bass', body: 'Mercury Pro XS for Lake Scugog and Kawartha bass anglers.', href: '/mercury-pro-xs' },
  ],
};

export default function LocationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = slug ? getLocationBySlug(slug) : undefined;
  if (!location) return <Navigate to="/locations" replace />;

  const url = `${SITE_URL}/locations/${location.slug}`;
  const lf = location.longForm;
  const h1 = lf?.h1 ?? `Mercury Outboards for ${location.region} Buyers`;
  const pageTitle = lf ? `${lf.h1} | Harris Boat Works` : location.title;
  const metaDesc = lf?.metaDescription ?? location.metaDescription;
  const canonical = lf?.canonical ?? url;
  const contextBullets = (lf?.keyFacts ?? location.localContext).slice(0, 6);
  const faqs = (lf?.faqs ?? location.faqs).slice(0, lf ? 8 : 4);
  const useCases = USE_CASES_BY_SLUG[location.slug] ?? DEFAULT_USE_CASES;
  const telHref = `tel:${COMPANY_INFO.contact.phone.replace(/[^0-9+]/g, '')}`;

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: pageTitle,
        description: metaDesc,
        inLanguage: 'en-CA',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Pickup Areas', item: `${SITE_URL}/locations` },
          { '@type': 'ListItem', position: 3, name: pageTitle, item: url },
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${url}#localbusiness`,
        name: COMPANY_INFO.name,
        url,
        telephone: COMPANY_INFO.contact.phone,
        email: COMPANY_INFO.contact.email,
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: COMPANY_INFO.address.street,
          addressLocality: COMPANY_INFO.address.city,
          addressRegion: COMPANY_INFO.address.province,
          postalCode: COMPANY_INFO.address.postal,
          addressCountry: 'CA',
        },
        // Sales catchment only, represents where customers travel from to pick up at Gores Landing.
        // Sales catchment only. All work happens at Gores Landing.
        areaServed: {
          '@type': 'AdministrativeArea',
          name: location.region,
          description:
            'Sales catchment only, customers from this area travel to Gores Landing for pickup. No mobile service, no delivery.',
        },
      },
      {
        '@type': 'Place',
        '@id': `${url}#place`,
        name: location.region,
        containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      ...(lf
        ? [{
            '@type': 'Article',
            '@id': `${url}#article`,
            headline: lf.h1,
            description: metaDesc,
            mainEntityOfPage: url,
            datePublished: lf.lastReviewed,
            dateModified: lf.lastReviewed,
            image: lf.heroImage ? `${SITE_URL}${lf.heroImage}` : undefined,
            author: { '@type': 'Organization', name: COMPANY_INFO.name },
            publisher: { '@type': 'Organization', name: COMPANY_INFO.name },
          }]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-repower-paper">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLdGraph)}</script>
      </Helmet>
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />
      <main>
        {/* HERO IMAGE (long-form only) */}
        {lf?.heroImage && (
          <section className="bg-repower-navy-900">
            <div className="container mx-auto px-0 md:px-4 max-w-5xl">
              <img
                src={lf.heroImage}
                alt={lf.heroAlt ?? lf.h1}
                className="w-full h-auto aspect-[16/9] object-cover md:rounded-b-xl"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </section>
        )}

        {/* HERO */}
        <section className="bg-repower-navy-900 text-repower-cream">
          <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
            <Link to="/locations" className="text-sm text-repower-cream/60 hover:text-repower-cream">
              ← Pickup areas
            </Link>
            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
              {h1}
            </h1>
            {lf?.lastReviewed && (
              <p className="mt-3 text-sm italic text-repower-cream/60">
                Last reviewed: {lf.lastReviewed}
              </p>
            )}
            <div className="mt-5 h-px w-16 bg-repower-gold" aria-hidden="true" />

            {lf?.quickAnswer && (
              <div className="mt-6 rounded-lg border-l-4 border-repower-gold bg-repower-cream/5 px-5 py-4">
                <p className="text-sm font-semibold text-repower-gold uppercase tracking-wider mb-2">
                  Quick answer
                </p>
                <p className="text-repower-cream/90 leading-relaxed">{lf.quickAnswer}</p>
              </div>
            )}

            <p className="mt-6 text-lg text-repower-cream/80 leading-relaxed">
              {location.intro}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-repower-mercury-red hover:bg-repower-mercury-red-deep text-white font-semibold">
                <Link to="/quote/motor-selection">Build Your Quote</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-transparent border border-repower-cream/40 text-repower-cream hover:bg-repower-cream/10"
              >
                <a href={telHref}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Harris Boat Works
                </a>
              </Button>
            </div>

            <ul className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
              {TRUST_ROW.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-xs text-repower-cream/70">
                  <Icon className="h-3.5 w-3.5 text-repower-gold shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* LOCAL CONTEXT */}
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
            Local context
          </h2>
          <ul className="space-y-3">
            {contextBullets.map((c) => (
              <li key={c} className="flex gap-3 text-foreground leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-repower-gold shrink-0" aria-hidden="true" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* USE CASES */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-16 max-w-5xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-8 text-center">
              Common Mercury choices for {location.region}
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {useCases.map((u) => (
                <Link
                  key={u.title}
                  to={u.href}
                  className="group rounded-lg border border-border bg-card p-6 hover:border-repower-gold/60 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{u.body}</p>
                  <span className="text-sm font-medium text-repower-navy-900 group-hover:text-repower-mercury-red">
                    Build a quote →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* LONG-FORM BODY SECTIONS */}
        {lf?.sections && lf.sections.length > 0 && (
          <section className="container mx-auto px-4 py-16 max-w-3xl">
            <div className="prose prose-lg max-w-none">
              {lf.sections.map((sec) => (
                <div key={sec.heading} className="mb-10">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">{sec.heading}</h2>
                  {sec.paragraphs.map((p, idx) =>
                    p.startsWith('- ') ? (
                      <ul key={idx} className="list-disc pl-6 space-y-1 text-foreground/85">
                        {p.split('\n').map((line, j) => (
                          <li key={j}>{line.replace(/^-\s*/, '')}</li>
                        ))}
                      </ul>
                    ) : (
                      <p key={idx} className="text-foreground/85 leading-relaxed mb-4">{p}</p>
                    )
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WHAT WE SEE AT HBW — From the Shop card */}
        {lf?.whatWeSeeAtHBW && (
          <section className="container mx-auto px-4 pb-4 max-w-3xl">
            <div className="rounded-xl border-l-4 border-repower-gold bg-repower-cream/40 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                What we see at HBW
              </h2>
              <p className="text-foreground/85 leading-relaxed">{lf.whatWeSeeAtHBW}</p>
            </div>
          </section>
        )}

        {/* PICKUP BOUNDARY, single polished box */}
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Anchor className="h-6 w-6 text-repower-gold shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Pickup at Gores Landing
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Customers from {location.region} bring the boat to our shop at{' '}
                  {COMPANY_INFO.address.street}, {COMPANY_INFO.address.city}, ON for installation,
                  or pick up a loose Mercury motor for self-install. We do not offer mobile
                  service, delivery, driveway installs, or marina visits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="container mx-auto px-4 pb-20 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${i}`}
                  className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* FOOTER CTA */}
        <section className="bg-repower-navy-900 text-repower-cream">
          <div className="container mx-auto px-4 py-14 max-w-3xl text-center">
            <p className="text-lg text-repower-cream/80 mb-6">
              Build a Mercury quote with real CAD pricing, or call {COMPANY_INFO.contact.phone}.
            </p>
            <Button asChild size="lg" className="bg-repower-mercury-red hover:bg-repower-mercury-red-deep text-white font-semibold">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
