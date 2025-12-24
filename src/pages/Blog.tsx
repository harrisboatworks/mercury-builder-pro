import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { BlogIndexSEO } from '@/components/seo/BlogIndexSEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSubscribeForm } from '@/components/blog/BlogSubscribeForm';
import { getPublishedArticles } from '@/data/blogArticles';

export default function Blog() {
  const publishedArticles = getPublishedArticles();
  
  return (
    <div className="min-h-screen bg-background">
      <BlogIndexSEO />
      <LuxuryHeader />
      
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
            Boat Motor Guides & Tips
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Expert advice from Ontario's trusted Mercury dealer since 1965. 
            Learn how to choose, maintain, and get the most from your outboard motor.
          </p>
        </div>

        {/* Featured Article */}
        {publishedArticles.length > 0 && (
          <div className="mb-12">
            <BlogCard article={publishedArticles[0]} />
          </div>
        )}

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedArticles.slice(1).map(article => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>

        {/* Subscribe Section */}
        <div className="mt-16">
          <BlogSubscribeForm />
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-muted/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-light text-foreground mb-3">
            Ready to Find Your Motor?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Use our online quote builder to explore Mercury motors and get instant pricing. 
            No pressure, no hassle.
          </p>
          <Link 
            to="/quote/motor-selection"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Browse Motors
          </Link>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}