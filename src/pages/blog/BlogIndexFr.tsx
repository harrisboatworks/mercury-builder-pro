import { Helmet } from '@/lib/helmet';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { getPublishedFrenchArticles } from '@/data/frenchBlogArticles';

export default function BlogIndexFr() {
  const articles = getPublishedFrenchArticles().slice().sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );
  const url = `${SITE_URL}/blog/fr`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'fr-CA',
    name: 'Guides Mercury en français — Harris Boat Works',
    description:
      "Guides Mercury, remotorisation, entretien et sécurité nautique en français pour les plaisanciers de l'Ontario.",
    hasPart: articles.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/fr/${a.slug}`,
      inLanguage: 'fr-CA',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div className="min-h-screen bg-background" lang="fr">
      <Helmet>
        <title>Guides Mercury en français | Harris Boat Works</title>
        <meta
          name="description"
          content="Guides Mercury et conseils nautiques en français pour l'Ontario : moteurs, remotorisation, entretien, sécurité et pêche sur le lac Rice."
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="fr-CA" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Guides Mercury en français — Harris Boat Works" />
        <meta property="og:description" content="Guides Mercury et conseils nautiques en français pour l'Ontario." />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="fr_CA" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <nav className="mb-8">
          <Link to="/blog" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            English blog
          </Link>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
            Guides Mercury et conseils nautiques en français pour l'Ontario
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl">
            Des réponses simples sur les moteurs Mercury, la remotorisation, l'entretien, la sécurité
            nautique et la pêche sur le lac Rice. Harris Boat Works est une marina familiale à Gores
            Landing depuis 1947 et un concessionnaire Mercury Marine Platinum. On garde ça clair,
            pratique, et sans jargon inutile.
          </p>
        </header>

        <section aria-label="Articles en français" className="grid gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/fr/${a.slug}`}
              className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(a.datePublished).toLocaleDateString('fr-CA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {a.readTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {a.readTime}
                  </span>
                )}
                {a.category && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium">
                    {a.category}
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-medium text-foreground group-hover:text-primary transition-colors mb-2">
                {a.title}
              </h2>
              {a.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {a.description}
                </p>
              )}
            </Link>
          ))}
        </section>

        <section className="mt-16 text-center bg-primary/5 rounded-2xl p-8">
          <h2 className="text-xl font-light text-foreground mb-3">Bâtissez votre soumission</h2>
          <p className="text-muted-foreground text-sm mb-5 max-w-xl mx-auto">
            Prix transparents en CAD, sans appel obligatoire. Configurez votre Mercury en ligne.
          </p>
          <Link
            to="/quote/motor-selection"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Bâtir ma soumission
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
