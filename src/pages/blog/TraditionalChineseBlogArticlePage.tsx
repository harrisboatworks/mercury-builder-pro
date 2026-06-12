/**
 * Traditional Chinese (zh-Hant) blog article page — pilot, NOINDEX,
 * companion to MandarinBlogArticlePage.
 *
 * - Renders /blog/zh-hant/:slug from traditionalChineseBlogArticles.
 * - <meta name="robots" content="noindex,follow"> until native review approves.
 * - hreflang ties: zh-Hant (self) ↔ zh-Hans (Simplified counterpart) ↔ en (blog index).
 * - Kept out of sitemap (generator imports only mandarin/french/korean/spanish).
 */
import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { BlogHeroPicture } from '@/components/blog/BlogHeroPicture';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import {
  getTraditionalChineseArticleBySlug,
  traditionalChineseBlogArticles,
  ZH_HANT_TO_HANS_SLUG,
} from '@/data/traditionalChineseBlogArticles';
import { slugify, extractHeaders } from '@/utils/slugify';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { BlogShareButtons } from '@/components/blog/BlogShareButtons';
import { AuthorByline } from '@/components/blog/AuthorByline';
import { DealerConfidenceStrip } from '@/components/blog/DealerConfidenceStrip';
import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
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

export default function TraditionalChineseBlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getTraditionalChineseArticleBySlug(slug) : undefined;

  if (!article) {
    return <Navigate to="/zh" replace />;
  }

  const url = `${SITE_URL}/blog/zh-hant/${article.slug}`;
  const hansSlug = ZH_HANT_TO_HANS_SLUG[article.slug];
  const hansUrl = hansSlug ? `${SITE_URL}/blog/zh/${hansSlug}` : null;
  const tocItems = extractHeaders(article.content);
  const relatedArticles = traditionalChineseBlogArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-repower-paper" lang="zh-Hant">
      <Helmet>
        <title>{article.seoTitle ?? article.title} | Harris Boat Works</title>
        <meta name="description" content={article.description} />
        {/* Pilot — kept out of the index until native-speaker review approves */}
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="zh-Hant" href={url} />
        {hansUrl && <link rel="alternate" hrefLang="zh-Hans" href={hansUrl} />}
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content={article.seoTitle ?? article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="zh_TW" />
        <meta property="og:type" content="article" />
      </Helmet>
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="container mx-auto px-6 md:px-14 py-10 md:py-14">
        <Breadcrumb className="mb-8 max-w-[880px] mx-auto">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="text-repower-navy-900/60 hover:text-repower-mercury-red">首頁</Link>
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
          <Link
            to="/zh"
            className="inline-flex items-center gap-2 text-sm text-repower-navy-900/60 hover:text-repower-mercury-red transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            返回中文首頁
          </Link>

          {hansUrl && (
            <div className="mb-6 rounded-md border border-repower-navy-900/15 bg-repower-paper/60 px-4 py-3 text-sm text-repower-navy-900/75">
              <strong>繁體中文試行版本（native-review: pending）。</strong>{' '}
              如需完整內容請參閱 <a href={hansUrl} className="text-primary hover:underline">简体中文版</a>。
            </div>
          )}

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <span className="font-sans text-[11px] font-semibold text-repower-mercury-red uppercase tracking-[0.24em]">
                {article.category} · 繁體
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
                <AuthorByline name="Jay Harris" title="1965 年起 Mercury 經銷商" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(article.datePublished).toLocaleDateString('zh-Hant', { year: 'numeric', month: 'long', day: 'numeric' })}
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

          <BlogHeroPicture image={article.image} alt={article.title} />
          <DealerConfidenceStrip />
          <BlogCTA category={article.category} slug={article.slug} variant="inline" />

          {tocItems.length > 2 && <TableOfContents items={tocItems} />}

          <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-table:w-full prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-repower-navy-900/20 prose-td:border-b prose-td:border-repower-navy-900/10 prose-th:py-2 prose-td:py-2 prose-th:px-3 prose-td:px-3">
            <MarkdownSectionCards
              content={(() => {
                let c = article.content.replace(/^\s*#\s+.+\n+/, '');
                if (article.faqs && article.faqs.length > 0) {
                  c = c.replace(
                    /\n##\s+(?:常見問題|常见问题|FAQs?|FAQ)\b[^\n]*\n[\s\S]*?(?=\n##\s|\n*$)/i,
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
                  const isInternal =
                    href.startsWith('/') ||
                    href.includes('harrisboatworks') ||
                    href.includes('mercuryquote') ||
                    href.includes('mercuryrepower');
                  if (isInternal && (stripped.startsWith('/') || href.startsWith('/'))) {
                    return (
                      <Link to={stripped.startsWith('/') ? stripped : href} className="text-primary hover:underline">
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            />
          </div>

          {article.faqs && article.faqs.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display font-bold text-repower-navy-900 mb-6" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>
                常見問題
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {article.faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left font-sans font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-sans text-repower-navy-900/75 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section className="mt-16 pt-10 border-t border-repower-navy-900/10">
              <h2 className="font-display font-bold text-repower-navy-900 mb-6" style={{ fontSize: 'clamp(22px, 2.5vw, 28px)' }}>
                繁體中文試行系列
              </h2>
              <ul className="space-y-3">
                {relatedArticles.map((a) => (
                  <li key={a.slug}>
                    <Link
                      to={`/blog/zh-hant/${a.slug}`}
                      className="text-primary hover:underline font-sans font-semibold"
                    >
                      {a.title}
                    </Link>
                    <span className="block text-sm text-repower-navy-900/60 mt-0.5">{a.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
