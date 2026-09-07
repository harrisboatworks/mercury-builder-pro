import { Helmet } from '@/lib/helmet';
import { Link, useLocation } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { LOCALE_HUBS, type LocaleHubCode } from '@/data/localeHubs';

function hubFromPath(pathname: string): LocaleHubCode | null {
  const code = pathname.replace(/^\//, '').replace(/\/$/, '');
  return code in LOCALE_HUBS ? (code as LocaleHubCode) : null;
}

export default function LocaleHubLanding() {
  const { pathname } = useLocation();
  const code = hubFromPath(pathname);
  if (!code) return null;

  const hub = LOCALE_HUBS[code];
  const articles = [...hub.getArticles()].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );
  const url = `${SITE_URL}${hub.path}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: hub.heading,
    description: hub.intro,
    inLanguage: hub.lang,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };

  return (
    <div className="min-h-screen bg-background" lang={hub.lang}>
      <Helmet>
        <title>{hub.title}</title>
        <meta name="description" content={hub.intro} />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang={hub.hrefLang} href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/`} />
        <meta property="og:title" content={hub.heading} />
        <meta property="og:description" content={hub.intro} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content={hub.ogLocale} />
        <meta property="og:type" content="website" />
        <html lang={hub.lang} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl" dir={hub.dir}>
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">{hub.heading}</h1>
          <p className="text-muted-foreground font-light">{hub.intro}</p>
        </header>

        <section className="mb-12 bg-muted/30 rounded-2xl p-6 md:p-8">
          <p className="text-foreground text-sm leading-relaxed">{hub.disclaimer}</p>
        </section>

        <nav className="mb-12 text-center space-y-2">
          <p className="text-sm font-medium text-foreground mb-3">
            {hub.postsHeading} ({articles.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {articles.map((article) => (
              <Link
                key={article.slug}
                to={`${hub.blogPrefix}/${article.slug}`}
                className="text-primary hover:underline text-sm"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </nav>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            English
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
