import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { BlogCard } from '@/components/blog/BlogCard';
import {
  BLOG_TOPIC_HUBS,
  getHubById,
  getHubArticles,
  type BlogTopicHubId,
} from '@/data/blogTopicHubs';

interface BlogTopicHubPageProps {
  hubId: BlogTopicHubId;
}

export default function BlogTopicHubPage({ hubId }: BlogTopicHubPageProps) {
  const hub = getHubById(hubId);
  const articles = getHubArticles(hub);
  const anchorCount = hub.anchorSlugs.filter((s) => articles.some((a) => a.slug === s)).length;
  const anchors = articles.slice(0, anchorCount);
  const rest = articles.slice(anchorCount);
  const otherHubs = BLOG_TOPIC_HUBS.filter((h) => h.id !== hub.id);
  const hubUrl = `${SITE_URL}/blog/${hub.slug}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${hubUrl}#webpage`,
        name: hub.title,
        description: hub.metaDescription,
        url: hubUrl,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: hub.name, item: hubUrl },
          ],
        },
      },
      {
        '@type': 'ItemList',
        itemListElement: articles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/blog/${article.slug}`,
          name: article.title,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-repower-paper">
      <Helmet>
        <title>{hub.title}</title>
        <meta name="description" content={hub.metaDescription} />
        <link rel="canonical" href={hubUrl} />
        <meta property="og:title" content={hub.title} />
        <meta property="og:description" content={hub.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={hubUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={hub.title} />
        <meta name="twitter:description" content={hub.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <RepowerHeader />

      {/* Header band */}
      <section className="bg-repower-navy-900">
        <div className="container mx-auto px-6 md:px-14 max-w-[1200px] pt-[calc(64px+2.5rem)] lg:pt-[calc(72px+3.5rem)] pb-12 md:pb-16">
          <nav aria-label="Breadcrumb" className="font-sans text-[13px] text-white/60">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-white/85">
                {hub.name}
              </li>
            </ol>
          </nav>

          <h1
            className="mt-5 font-display font-bold text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.02em] text-white"
          >
            {hub.name}
          </h1>

          <div className="mt-5 max-w-3xl space-y-4">
            {hub.intro.map((paragraph, i) => (
              <p key={i} className="font-sans text-base md:text-lg text-white/75 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <p className="mt-6 font-sans text-[13px] uppercase tracking-[0.2em] text-white/50">
            {articles.length} guides in this collection
          </p>
        </div>
      </section>

      <main className="container mx-auto px-6 md:px-14 max-w-[1200px] py-14 md:py-20">
        {/* Curated anchors */}
        {anchors.length > 0 && (
          <section aria-labelledby="hub-start-here" className="mb-16 md:mb-20">
            <h2
              id="hub-start-here"
              className="font-display font-bold text-2xl md:text-[28px] text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              Start here
            </h2>
            <p className="mt-2 font-sans text-sm text-repower-navy-900/65">
              The guides we hand people first, in the order we'd read them.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {anchors.map((article) => (
                <article key={article.slug}>
                  <BlogCard article={article} />
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Everything else in the hub */}
        {rest.length > 0 && (
          <section aria-labelledby="hub-all-guides" className="mb-16 md:mb-20">
            <h2
              id="hub-all-guides"
              className="font-display font-bold text-2xl md:text-[28px] text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              All {hub.name} guides
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((article) => (
                <article key={article.slug}>
                  <BlogCard article={article} />
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Hub switcher */}
        <section aria-labelledby="hub-more-topics" className="mb-16 md:mb-20">
          <h2
            id="hub-more-topics"
            className="font-display font-bold text-xl md:text-2xl text-repower-navy-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            More topics
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherHubs.map((h) => (
              <Link
                key={h.id}
                to={`/blog/${h.slug}`}
                className="group flex flex-col p-5 bg-white rounded-md border border-repower-navy-900/10 hover:border-repower-navy-900/30 transition-all"
              >
                <span
                  className="font-display text-base font-semibold text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors"
                  style={{ letterSpacing: '-0.015em' }}
                >
                  {h.name}
                </span>
                <span className="mt-2 font-sans text-sm text-repower-navy-900/65 leading-relaxed">
                  {h.blurb}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 font-sans text-sm font-semibold text-repower-mercury-red">
                  Browse <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-md bg-repower-navy-900 px-6 py-10 md:px-12 md:py-12 text-center">
          <h2
            className="font-display font-bold text-2xl md:text-[28px] text-white"
            style={{ letterSpacing: '-0.02em' }}
          >
            Ready to price your repower?
          </h2>
          <p className="mt-3 font-sans text-white/75">
            Build a real quote in minutes. Pickup only, no pressure.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/quote/motor-selection"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-md bg-repower-mercury-red px-6 py-3 font-sans text-sm font-semibold text-white transition-colors hover:bg-repower-mercury-red-deep"
            >
              Build My Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:9053422153"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-md border border-white/35 px-6 py-3 font-sans text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="h-4 w-4" /> (905) 342-2153
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
