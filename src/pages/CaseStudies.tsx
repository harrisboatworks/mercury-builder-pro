import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { caseStudies } from '@/data/caseStudies';

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-repower-paper">
      <Helmet>
        <title>Mercury Repower Case Studies | Harris Boat Works</title>
        <meta
          name="description"
          content="Mercury repower examples and clearly labelled planning scenarios for aluminum fishing boats, pontoons, bass boats, and walkaround cuddy setups."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Mercury Repower Case Studies',
          url: `${SITE_URL}/case-studies`,
          description: 'Mercury repower examples and clearly labelled illustrative planning scenarios from Harris Boat Works.',
        })}</script>
      </Helmet>

      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="container mx-auto px-4 py-10 md:py-14">
        <header className="max-w-3xl mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">Mercury repower case studies</h1>
          <p className="text-lg text-muted-foreground">
            Ontario repower examples and planning scenarios showing where specific Mercury outboard recommendations may make sense. Illustrative entries are clearly labelled and are not customer testimonials or fixed-price quotes.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {caseStudies.map((study) => (
            <article key={study.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <Link to={`/case-studies/${study.slug}`}>
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  <img src={study.heroImage} alt={study.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              </Link>
              <div className="p-5">
                <div className="mb-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-primary">
                  <span>{study.id}</span>
                  <span>{study.boatType}</span>
                  {study.isIllustrative && <span>Illustrative</span>}
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  <Link to={`/case-studies/${study.slug}`}>{study.title}</Link>
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{study.excerpt}</p>
                <div className="text-sm text-foreground mb-4">
                  <strong>{study.beforeMotor}</strong> to <strong>{study.afterMotor}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Link to={`/case-studies/${study.slug}`} className="text-primary hover:underline">
                    Read case study
                  </Link>
                  <Link to={study.quoteUrl} className="text-primary hover:underline">
                    Get a quote
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
