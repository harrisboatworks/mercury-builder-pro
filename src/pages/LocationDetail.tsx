import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { caseStudies } from '@/data/caseStudies';
import { getLocationBySlug } from '@/data/locations';
import { Anchor, MapPin, Clock, Award, Wrench, Phone, AlertCircle } from 'lucide-react';

export default function LocationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = slug ? getLocationBySlug(slug) : undefined;
  if (!location) return <Navigate to="/locations" replace />;

  const url = `${SITE_URL}/locations/${location.slug}`;

  const relatedCaseStudies = (location.relatedCaseStudySlugs ?? [])
    .map((s) => caseStudies.find((cs) => cs.slug === s))
    .filter(Boolean)
    .slice(0, 3) as typeof caseStudies;

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: location.title,
        description: location.metaDescription,
        inLanguage: 'en-CA',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Pickup Areas', item: `${SITE_URL}/locations` },
          { '@type': 'ListItem', position: 3, name: location.title, item: url },
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
        // Sales catchment / buyer catchment ONLY — represents where customers travel from to pick up at Gores Landing.
        // This is NOT mobile service coverage. Harris Boat Works performs all work on-site at Gores Landing.
        areaServed: {
          '@type': 'AdministrativeArea',
          name: location.region,
          description: 'Sales catchment — customers from this area travel to Gores Landing for pickup. Not a mobile service area.',
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
        mainEntity: location.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{location.title}</title>
        <meta name="description" content={location.metaDescription} />
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify(jsonLdGraph)}</script>
      </Helmet>
      <LuxuryHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/locations" className="text-primary hover:underline text-sm">← Back to pickup areas</Link>

          <header className="mt-6 mb-8">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">{location.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{location.intro}</p>

            {/* Factbox */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-start gap-1">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Drive time</div>
                <div className="text-sm font-medium text-foreground">{location.driveTime}</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-start gap-1">
                <MapPin className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Pickup</div>
                <div className="text-sm font-medium text-foreground">Gores Landing, ON</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-start gap-1">
                <Award className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-medium text-foreground">Mercury Platinum</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 flex flex-col items-start gap-1">
                <Phone className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Call</div>
                <div className="text-sm font-medium text-foreground">{COMPANY_INFO.contact.phone}</div>
              </div>
            </div>

            {/* Pickup policy banner */}
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground mb-3 flex gap-3">
              <Anchor className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div><strong>Pickup policy.</strong> {location.pickupPolicy}</div>
            </div>

            {/* Service boundary banner — explicit "we don't come to you" */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-sm text-foreground flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div><strong>Shop-based service only.</strong> {location.serviceBoundary}</div>
            </div>

            {location.driveRoute && (
              <p className="text-sm text-muted-foreground mt-3"><strong>Route:</strong> {location.driveRoute}</p>
            )}
          </header>

          <section className="grid gap-6 md:grid-cols-2 mb-10">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-3">Local boating context</h2>
              <ul className="space-y-2 text-muted-foreground list-disc ml-5">
                {location.localContext.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-3">Why customers from {location.region} choose us</h2>
              <ul className="space-y-2 text-muted-foreground list-disc ml-5">
                {location.whyChooseUs.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 mb-10">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-3">Common local boats</h2>
              <ul className="space-y-2 text-muted-foreground list-disc ml-5">
                {location.popularBoats.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-3">Popular Mercury HP ranges</h2>
              <ul className="space-y-2 text-muted-foreground list-disc ml-5">
                {location.popularHpRanges.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Recommended next steps</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {location.recommendedLinks.map((item) => (
                <Link key={item.href + item.label} to={item.href} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-primary shrink-0" />
                  <div className="font-medium text-foreground">{item.label}</div>
                </Link>
              ))}
            </div>
          </section>

          {relatedCaseStudies.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Related repower case studies</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedCaseStudies.map((study) => (
                  <Link key={study.id} to={`/case-studies/${study.slug}`} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                    <div className="text-xs uppercase tracking-wide text-primary mb-2">{study.id}</div>
                    <div className="font-medium text-foreground mb-2">{study.title}</div>
                    <div className="text-sm text-muted-foreground">{study.excerpt}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">FAQ</h2>
            <div className="space-y-4">
              {location.faqs.map((faq) => (
                <div key={faq.question} className="rounded-lg border border-border bg-card p-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
