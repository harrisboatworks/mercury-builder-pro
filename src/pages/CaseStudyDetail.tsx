import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { caseStudies, getCaseStudyBySlug } from '@/data/caseStudies';
import { substituteLiveRateTokens } from '@/lib/finance';

export default function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? getCaseStudyBySlug(slug) : undefined;

  if (!study) return <Navigate to="/case-studies" replace />;

  const url = `${SITE_URL}/case-studies/${study.slug}`;
  const lf = study.longForm;

  // Title: clean title + " | Harris Boat Works", never doubled.
  const cleanTitle = (lf?.cleanTitle ?? study.title).replace(/\s*\|\s*Harris Boat Works\s*$/i, '');
  const pageTitle = `${cleanTitle} | Harris Boat Works`;
  const metaDesc = lf?.metaDescription ?? study.excerpt;
  const canonical = lf?.canonical ?? url;

  // ----- LONG-FORM RENDER -----
  if (lf) {
    const heroImageAbs = study.heroImage.startsWith('/') ? `${SITE_URL}${study.heroImage}` : study.heroImage;
    const lfFaqs = lf.faqs.map((f) => ({
      question: substituteLiveRateTokens(f.question),
      answer: substituteLiveRateTokens(f.answer),
    }));
    const lfSections = lf.sections.map((sec) => ({
      heading: sec.heading,
      paragraphs: sec.paragraphs.map(substituteLiveRateTokens),
    }));
    const lfIntro = substituteLiveRateTokens(lf.intro);
    const lfQuickAnswer = substituteLiveRateTokens(lf.quickAnswer);
    const lfVisit = substituteLiveRateTokens(lf.visit);

    const jsonLdGraph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${url}#article`,
          headline: lf.h1,
          description: lf.metaDescription,
          image: [heroImageAbs],
          author: { '@type': 'Organization', name: 'Harris Boat Works', url: SITE_URL },
          publisher: { '@type': 'Organization', name: 'Harris Boat Works', url: SITE_URL },
          datePublished: lf.lastReviewed,
          dateModified: lf.lastReviewed,
          mainEntityOfPage: url,
          inLanguage: 'en-CA',
        },
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: lfFaqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Case Studies', item: `${SITE_URL}/case-studies` },
            { '@type': 'ListItem', position: 3, name: cleanTitle, item: url },
          ],
        },
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
          {/* HERO IMAGE */}
          <section className="bg-repower-navy-900">
            <div className="container mx-auto px-0 md:px-4 max-w-5xl">
              <img
                src={study.heroImage}
                alt={lf.heroAlt ?? lf.h1}
                className="w-full h-auto aspect-[16/9] object-cover md:rounded-b-xl"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </section>

          {/* H1 + INTRO */}
          <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
            <Link to="/case-studies" className="text-sm text-muted-foreground hover:text-foreground">
              ← All case studies
            </Link>
            <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              {lf.h1}
            </h1>
            <p className="mt-3 text-sm italic text-muted-foreground">
              Last reviewed: {lf.lastReviewed}
            </p>

            <div className="mt-6 rounded-lg border-l-4 border-repower-gold bg-repower-cream/40 px-5 py-4">
              <p className="text-sm font-semibold text-repower-gold uppercase tracking-wider mb-2">
                Quick answer
              </p>
              <p className="text-foreground/85 leading-relaxed">{lfQuickAnswer}</p>
            </div>

            <p className="mt-6 text-lg text-foreground/85 leading-relaxed">{lfIntro}</p>
          </section>

          {/* KEY FACTS */}
          <section className="container mx-auto px-4 pb-6 max-w-3xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
              Key facts
            </h2>
            <ul className="space-y-3">
              {lf.keyFacts.map((k) => (
                <li key={k} className="flex gap-3 text-foreground leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-repower-gold shrink-0" aria-hidden="true" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* BODY SECTIONS */}
          <section className="container mx-auto px-4 py-10 max-w-3xl">
            {lfSections.map((sec) => (
              <div key={sec.heading} className="mb-10">
                <h2 className="text-2xl font-semibold text-foreground mb-4">{sec.heading}</h2>
                {sec.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-foreground/85 leading-relaxed mb-4">{p}</p>
                ))}
              </div>
            ))}
          </section>

          {/* FAQ */}
          <section className="container mx-auto px-4 pb-12 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {lfFaqs.map((f) => (
                <div key={f.question}>
                  <h3 className="font-semibold text-foreground mb-2">{f.question}</h3>
                  <p className="text-foreground/85 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* VISIT */}
          <section className="container mx-auto px-4 pb-12 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Visit Harris Boat Works</h2>
            {lfVisit.split('\n\n').map((p, i) => (
              <p key={i} className="text-foreground/85 leading-relaxed mb-4">{p}</p>
            ))}
          </section>


          {/* RELATED */}
          <section className="container mx-auto px-4 pb-20 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Related</h2>
            <ul className="space-y-2">
              {lf.related.map((r) => (
                <li key={r.href}>
                  {r.external ? (
                    <a href={r.href} className="text-primary hover:underline" rel="noopener noreferrer" target="_blank">
                      {r.label}
                    </a>
                  ) : (
                    <Link to={r.href} className="text-primary hover:underline">{r.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </main>

        <SiteFooter />
      </div>
    );
  }

  // ----- LEGACY RENDER (original 5 case studies) -----
  return (
    <div className="min-h-screen bg-repower-paper">
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

      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

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
            <p className="text-muted-foreground">"{study.customerQuote}"</p>
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
