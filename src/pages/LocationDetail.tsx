import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { caseStudies } from '@/data/caseStudies';
import { getLocationBySlug } from '@/data/locations';

export default function LocationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = slug ? getLocationBySlug(slug) : undefined;
  if (!location) return <Navigate to="/locations" replace />;

  const relatedCaseStudies = caseStudies.filter((study) => {
    const haystack = `${study.region} ${study.boatType} ${study.scenario}`.toLowerCase();
    return haystack.includes(location.region.toLowerCase().split(' ')[0]) || location.slug.includes('rice-lake');
  }).slice(0, 2);

  const url = `${SITE_URL}/locations/${location.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{location.title} | Harris Boat Works</title>
        <meta name="description" content={location.intro} />
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'LocalBusiness',
              name: COMPANY_INFO.name,
              areaServed: location.region,
              telephone: COMPANY_INFO.contact.phone,
              url,
              address: { '@type': 'PostalAddress', streetAddress: COMPANY_INFO.address.street, addressLocality: COMPANY_INFO.address.city, addressRegion: COMPANY_INFO.address.province, postalCode: COMPANY_INFO.address.postal, addressCountry: 'CA' }
            },
            {
              '@type': 'FAQPage',
              mainEntity: location.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } }))
            }
          ]
        })}</script>
      </Helmet>
      <LuxuryHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/locations" className="text-primary hover:underline">← Back to service areas</Link>
          <header className="mt-6 mb-8">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">{location.title}</h1>
            <p className="text-lg text-muted-foreground mb-4">{location.intro}</p>
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground">
              <strong>Pickup only:</strong> all quotes and purchases are finalized for pickup at {COMPANY_INFO.address.full}. No delivery or shipping.
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2 mb-10">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-3">Why buyers in {location.region} use Harris Boat Works</h2>
              <ul className="space-y-2 text-muted-foreground list-disc ml-5">
                <li>Family-owned since 1947</li>
                <li>Mercury dealer since 1965</li>
                <li>Transparent CAD-first quoting</li>
                <li>Real repower case studies and Ontario-specific advice</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-3">Popular local boat uses</h2>
              <ul className="space-y-2 text-muted-foreground list-disc ml-5">
                {location.popularBoats.map((boat) => <li key={boat}>{boat}</li>)}
              </ul>
              <p className="text-sm text-muted-foreground mt-4">Typical travel: {location.driveTime}.</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Recommended next steps</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {location.recommendedLinks.map((item) => (
                <Link key={item.href} to={item.href} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="font-medium text-foreground">{item.label}</div>
                </Link>
              ))}
            </div>
          </section>

          {relatedCaseStudies.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Related case studies</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedCaseStudies.map((study) => (
                  <Link key={study.id} to={`/case-studies/${study.slug}`} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                    <div className="text-xs uppercase tracking-wide text-primary mb-2">{study.id}</div>
                    <div className="font-medium text-foreground">{study.title}</div>
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
