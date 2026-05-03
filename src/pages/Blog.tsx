import { Link } from 'react-router-dom';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { BlogIndexSEO } from '@/components/seo/BlogIndexSEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSubscribeForm } from '@/components/blog/BlogSubscribeForm';
import { getPublishedArticles } from '@/data/blogArticles';

export default function Blog() {
  const publishedArticles = getPublishedArticles();

  return (
    <div className="min-h-screen bg-repower-paper">
      <BlogIndexSEO />
      <RepowerHeader />

      <main className="container mx-auto px-6 md:px-14 py-14 md:py-20 pt-[calc(64px+3.5rem)] lg:pt-[calc(72px+5rem)]">
        {/* Page Header */}
        <header className="max-w-[880px] mx-auto text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
              Harris Boat Works Journal
            </p>
          </div>
          <h1
            id="blog-title"
            className="font-display font-bold text-repower-navy-900 mb-5"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            Boat Motor Guides & Tips
          </h1>
          <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto leading-relaxed">
            Expert advice from Ontario's trusted Mercury dealer since 1965.
            Learn how to choose, maintain, and get the most from your outboard motor.
          </p>
          <div className="mt-10 h-px w-16 bg-repower-navy-900/15 mx-auto" />
        </header>

        <div className="max-w-[1100px] mx-auto">
          {/* Featured Article */}
          {publishedArticles.length > 0 && (
            <section aria-label="Featured Article" className="mb-12">
              <article>
                <BlogCard article={publishedArticles[0]} />
              </article>
            </section>
          )}

          {/* Article Grid */}
          <section aria-label="All Articles">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedArticles.slice(1).map(article => (
                <article key={article.slug}>
                  <BlogCard article={article} />
                </article>
              ))}
            </div>
          </section>

          {/* Subscribe Section */}
          <aside aria-label="Newsletter Subscription" className="mt-16">
            <BlogSubscribeForm />
          </aside>

          {/* CTA Section */}
          <section aria-labelledby="cta-heading" className="mt-16 text-center bg-repower-cream border border-repower-navy-900/10 rounded-lg p-10 md:p-14">
            <div className="h-px w-12 bg-repower-gold mx-auto mb-6" />
            <h2
              id="cta-heading"
              className="font-display font-bold text-[clamp(24px,3vw,32px)] text-repower-navy-900 mb-3"
              style={{ letterSpacing: '-0.025em' }}
            >
              Ready to Find Your Motor?
            </h2>
            <p className="font-sans text-repower-navy-900/70 mb-6 max-w-xl mx-auto">
              Use our online quote builder to explore Mercury motors and get instant pricing.
              No pressure, no hassle.
            </p>
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-6 py-3 bg-repower-mercury-red text-white rounded-lg font-medium hover:bg-repower-mercury-red-deep transition-colors"
            >
              Browse Motors
            </Link>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
