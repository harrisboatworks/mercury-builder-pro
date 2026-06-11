import { Link } from 'react-router-dom';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { BlogIndexSEO } from '@/components/seo/BlogIndexSEO';
import { BlogMasthead } from '@/components/blog/BlogMasthead';
import { StartHereSection } from '@/components/blog/StartHereSection';
import { BlogIndexExplorer } from '@/components/blog/BlogIndexExplorer';
import { BlogSubscribeForm } from '@/components/blog/BlogSubscribeForm';
import { MultilingualHub } from '@/components/blog/MultilingualHub';
import { getPublishedArticles } from '@/data/blogArticles';

export default function Blog() {
  const publishedArticles = getPublishedArticles();

  return (
    <div className="min-h-screen bg-repower-paper">
      <BlogIndexSEO />
      <RepowerHeader />

      <main className="container mx-auto px-6 md:px-14 py-14 md:py-20 pt-[calc(64px+3.5rem)] lg:pt-[calc(72px+5rem)]">
        <BlogMasthead />

        {/* Renders a prominent banner only for detected non-English visitors;
            language links for everyone else live in the masthead. */}
        <MultilingualHub />

        <div className="max-w-[1100px] mx-auto">
          <StartHereSection />

          <BlogIndexExplorer articles={publishedArticles} />

          {/* Subscribe Section */}
          <aside aria-label="Newsletter Subscription" className="mt-16">
            <BlogSubscribeForm />
          </aside>

          {/* CTA Section */}
          <section aria-labelledby="cta-heading" className="mt-16 text-center border-t border-b border-repower-navy-900/10 py-12 md:py-16">
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
              className="inline-flex items-center justify-center px-6 py-3 bg-repower-mercury-red text-white rounded-lg font-medium hover:bg-repower-mercury-red-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60"
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
