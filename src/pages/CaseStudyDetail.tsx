import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { caseStudies, getCaseStudyBySlug } from '@/data/caseStudies';

export default function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? getCaseStudyBySlug(slug) : undefined;

  if (!study) return <Navigate to="/case-studies" replace />;

  const url = `${SITE_URL}/case-studies/${study.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{study.title} | Harris Boat Works</title>
        <meta name="description" content={study.excerpt} />
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline: study.title,
              description: study.excerpt,
              image: [`${SITE_URL}${study.heroImage}`],
              author: { '@type': 'Organization', name: 'Harris Boat Works' },
              publisher: { '@type': 'Organization', name: 'Harris Boat Works', url: SITE_URL },
              mainEntityOfPage: url,
            },
            {
              '@type': 'CreativeWork',
              name: study.title,
              description: study.excerpt,
              url,
              about: study.afterMotor,
            }
          ]
        })}</script>
      </Helmet>

      <LuxuryHeader />

      <main className="container mx-auto px-4 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          <Link to="/case-studies" className="text-primary hover:underline">← Back to case studies</Link>

          <header className="mt-6 mb-8">
            <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-primary">
              <span>{study.id}</span>
              <span>{study.scenario}</span>
              <span>{study.region}</span>
              {study.isIllustrative && <span>Illustrative</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">{study.title}</h1>
            <p className="text-lg text-muted-foreground">{study.excerpt}</p>
          </header>

          <div className="aspect-[16/9] overflow-hidden rounded-lg border border-border bg-muted mb-8">
            <img src={study.heroImage} alt={study.title} className="h-full w-full object-cover" />
          </div>

          <section className="grid gap-6 md:grid-cols-3 mb-10">
            <div className="rounded-lg border border-border p-4 bg-card">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Before</div>
              <div className="font-medium text-foreground">{study.beforeMotor}</div>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">After</div>
              <div className="font-medium text-foreground">{study.afterMotor}</div>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Change</div>
              <div className="font-medium text-foreground">{study.hpJump}</div>
            </div>
          </section>

          <section className="grid gap-8 md:grid-cols-[1.4fr,0.9fr] mb-10">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Why this recommendation made sense</h2>
              <p className="text-muted-foreground mb-4">{study.recommendation}</p>
              <ul className="space-y-3 text-muted-foreground">
                {study.whyItWorked.map((item) => (
                  <li key={item} className="list-disc ml-5">{item}</li>
                ))}
              </ul>
            </div>
            <aside className="rounded-lg border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Boat type</div>
              <div className="font-medium text-foreground mb-4">{study.boatType}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Scenario</div>
              <div className="font-medium text-foreground mb-4">{study.scenario}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Region</div>
              <div className="font-medium text-foreground">{study.region}</div>
            </aside>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-3">HBW note</h2>
            <p className="text-muted-foreground">“{study.customerQuote}”</p>
          </section>

          {study.detailImage && (
            <section className="mb-10">
              <div className="aspect-[16/10] overflow-hidden rounded-lg border border-border bg-muted">
                <img src={study.detailImage} alt={`${study.title} detail`} className="h-full w-full object-cover" loading="lazy" />
              </div>
            </section>
          )}

          <section className="rounded-lg border border-border bg-muted/30 p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3">Get a quote like this</h2>
            <p className="text-muted-foreground mb-5">
              Start in the Mercury quote builder and size a package for a similar boat, use case, and horsepower range.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={study.quoteUrl} className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-primary-foreground">
                Start quote
              </Link>
              <Link to="/agents" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-foreground">
                Agent docs
              </Link>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">More case studies</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {caseStudies.filter((item) => item.slug !== study.slug).slice(0, 4).map((item) => (
                <Link key={item.id} to={`/case-studies/${item.slug}`} className="rounded-lg border border-border p-4 bg-card hover:border-primary/30 transition-colors">
                  <div className="text-xs uppercase tracking-wide text-primary mb-2">{item.id}</div>
                  <div className="font-medium text-foreground">{item.title}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
