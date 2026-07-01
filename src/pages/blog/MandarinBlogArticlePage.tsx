import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { optimizeImage, buildSrcSet } from '@/lib/optimizeImage';
import { BlogHeroPicture } from '@/components/blog/BlogHeroPicture';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import {
  getMandarinArticleBySlug,
  mandarinBlogArticles,
} from '@/data/mandarinBlogArticles';
import { ZH_HANT_TO_HANS_SLUG } from '@/data/traditionalChineseBlogArticles';
import { slugify, extractHeaders } from '@/utils/slugify';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { LanguageSwitcher } from '@/components/blog/LanguageSwitcher';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogShareButtons } from '@/components/blog/BlogShareButtons';
import { AuthorByline } from '@/components/blog/AuthorByline';
import { DealerConfidenceStrip } from '@/components/blog/DealerConfidenceStrip';
import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
import { ExpandableImage } from '@/components/ui/expandable-image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function MandarinBlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getMandarinArticleBySlug(slug) : undefined;
  const [heroImgError, setHeroImgError] = useState(false);

  if (!article) {
    return <Navigate to="/zh" replace />;
  }

  const url = `${SITE_URL}/blog/zh/${article.slug}`;
  // If a zh-Hant pilot counterpart exists, expose it via hreflang. Pilot pages
  // are noindex themselves but the bidirectional link still helps Google
  // understand the relationship for any future indexable Traditional version.
  const zhHantSlug = Object.keys(ZH_HANT_TO_HANS_SLUG).find(
    (k) => ZH_HANT_TO_HANS_SLUG[k] === article.slug,
  );
  const zhHantUrl = zhHantSlug ? `${SITE_URL}/blog/zh-hant/${zhHantSlug}` : null;
  const tocItems = extractHeaders(article.content);
  const relatedArticles = mandarinBlogArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": article.seoTitle ?? article.title,
        "description": article.description,
        "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "publisher": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "datePublished": article.datePublished,
        "dateModified": article.dateModified,
        "mainEntityOfPage": url,
        "inLanguage": "zh-Hans",
        "isAccessibleForFree": true
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "inLanguage": "zh-Hans",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "中文", "item": `${SITE_URL}/zh` },
            { "@type": "ListItem", "position": 3, "name": article.title, "item": url }
          ]
        }
      },
      ...(article.faqs ? [{
        "@type": "FAQPage" as const,
        "@id": `${url}#faq`,
        "mainEntity": article.faqs.map(faq => ({
          "@type": "Question" as const,
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer" as const,
            "text": faq.answer
          }
        }))
      }] : [])
    ]
  };

  return (
    <div className="min-h-screen bg-repower-paper" lang="zh-Hans">
      <Helmet>
        <title>{article.seoTitle ?? article.title} | Harris Boat Works</title>
        <meta name="description" content={article.description} />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="zh-Hans" href={url} />
        {zhHantUrl && <link rel="alternate" hrefLang="zh-Hant" href={zhHantUrl} />}
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={url} />
        <meta property="og:title" content={article.seoTitle ?? article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={article.datePublished} />
        <meta property="article:author" content="Harris Boat Works" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="container mx-auto px-6 md:px-14 py-10 md:py-14">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8 max-w-[880px] mx-auto">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="text-repower-navy-900/60 hover:text-repower-mercury-red">首页</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-repower-navy-900/40" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/zh" className="text-repower-navy-900/60 hover:text-repower-mercury-red">博客</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-repower-navy-900/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[200px] text-repower-navy-900">{article.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <article className="max-w-[880px] mx-auto" aria-labelledby="article-title">
          {/* Back Link */}
          <Link
            to="/zh"
            className="inline-flex items-center gap-2 text-sm text-repower-navy-900/60 hover:text-repower-mercury-red transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            返回中文首页
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <span className="font-sans text-[11px] font-semibold text-repower-mercury-red uppercase tracking-[0.24em]">
                {article.category}
              </span>
            </div>
            <h1
              id="article-title"
              className="font-display font-bold text-repower-navy-900 mb-5"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
            >
              {article.title}
            </h1>
            <p className="font-sans text-[18px] text-repower-navy-900/65 mb-6 leading-relaxed">
              {article.description}
            </p>
            <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-repower-navy-900/10">
              <div className="flex items-center gap-4 text-sm text-repower-navy-900/60 flex-wrap">
                <AuthorByline name="Jay Harris" title="1965 年起 Mercury 经销商" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(article.datePublished).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
              </div>
              <BlogShareButtons
                url={url}
                title={article.title}
                description={article.description}
                image={article.image}
                variant="inline"
                articleSlug={article.slug}
                location="header"
              />
            </div>
          </header>

          {/* Featured Image — shared <picture> component */}
          <BlogHeroPicture image={article.image} alt={article.title} />

          {/* Language switcher */}
          <LanguageSwitcher currentLang="zh" currentSlug={article.slug} />

          {/* Dealer credentials strip */}
          <DealerConfidenceStrip />

          {/* Top contextual CTA */}
          <BlogCTA category={article.category} slug={article.slug} variant="inline" />

          {/* Table of Contents */}
          {tocItems.length > 2 && (
            <TableOfContents items={tocItems} />
          )}

          {/* Content */}
          <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-table:w-full prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-repower-navy-900/20 prose-td:border-b prose-td:border-repower-navy-900/10 prose-th:py-2 prose-td:py-2 prose-th:px-3 prose-td:px-3">
            <MarkdownSectionCards
              content={(() => {
                let c = article.content.replace(/^\s*#\s+.+\n+/, '');
                if (article.faqs && article.faqs.length > 0) {
                  c = c.replace(
                    /\n##\s+(?:常见问题|Frequently Asked Questions|FAQs?|FAQ)\b[^\n]*\n[\s\S]*?(?=\n##\s|\n*$)/i,
                    '\n',
                  );
                }
                return c;
              })()}
              markdownComponents={{
                // Demote any in-body h1 to h2 so the page-level title remains
                // the only h1 on the page (matches EN BlogArticle.tsx behavior).
                h1: ({ node, children, ...props }) => {
                  const text = String(children);
                  return <h2 id={slugify(text)} {...props}>{children}</h2>;
                },
                h2: ({ node, children, ...props }) => {
                  const text = String(children);
                  return <h2 id={slugify(text)} {...props}>{children}</h2>;
                },
                h3: ({ node, children, ...props }) => {
                  const text = String(children);
                  return <h3 id={slugify(text)} {...props}>{children}</h3>;
                },
                a: ({ node, href, children, ...props }) => {
                  if (!href) return <a {...props}>{children}</a>;
                  const stripped = href.replace(/^https?:\/\/[^/]+/, '');
                  const isInternal = href.startsWith('/') || href.includes('harrisboatworks') || href.includes('mercuryquote') || href.includes('mercuryrepower');
                  if (isInternal && (stripped.startsWith('/') || href.startsWith('/'))) {
                    return <Link to={stripped.startsWith('/') ? stripped : href} className="text-primary hover:underline">{children}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props}>{children}</a>;
                },
                img: ({ node, src, alt, title }) => (
                  <ExpandableImage
                    src={src || ''}
                    alt={alt || ''}
                    caption={title}
                    className="w-full rounded-lg"
                    containerClassName="my-6"
                  />
                ),
              }}
            />
          </div>

          {/* Author Byline (bottom) */}
          <div className="mt-10 pt-6 border-t border-repower-navy-900/10">
            <AuthorByline title="3rd-Generation Owner, Harris Boat Works · Mercury Premier Dealer · Rice Lake, Ontario" />
          </div>

          {/* FAQ Section */}
          {article.faqs && article.faqs.length > 0 && (
            <section className="mt-14 pt-10 border-t border-repower-navy-900/10">
              <h2 className="text-2xl font-semibold text-repower-navy-900 mb-6">常见问题</h2>
              <Accordion type="single" collapsible className="w-full">
                {article.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* CTA */}
          <div className="mt-12">
            <BlogCTA category={article.category} slug={article.slug} variant="banner" />
          </div>

          {/* Footer share */}
          <div className="mt-10 pt-6 border-t border-repower-navy-900/10">
            <BlogShareButtons
              url={url}
              title={article.title}
              description={article.description}
              image={article.image}
              variant="inline"
              articleSlug={article.slug}
              location="footer"
            />
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section aria-label="相关文章" className="max-w-[1100px] mx-auto mt-16 pt-10 border-t border-repower-navy-900/10">
            <h2 className="font-display font-bold text-repower-navy-900 mb-8 text-center" style={{ fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.025em' }}>
              更多中文文章
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((a) => (
                <BlogCard key={a.slug} article={{ ...a, slug: `zh/${a.slug}` }} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
