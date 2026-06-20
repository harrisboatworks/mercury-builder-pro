import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SITE_URL } from '@/lib/site';
import { ExpandableImage } from '@/components/ui/expandable-image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { BlogSEO } from '@/components/seo/BlogSEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogShareButtons } from '@/components/blog/BlogShareButtons';
import { AuthorByline } from '@/components/blog/AuthorByline';
import { FloatingShareBar } from '@/components/blog/FloatingShareBar';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { getArticleBySlug, getRelatedArticles, parseLocalDate } from '@/data/blogArticles';
import { isRepowerHubSlug } from '@/data/blogClusters';
import { RepowerHubBanner } from '@/components/repower/RepowerHubBanner';
import { slugify, extractHeaders } from '@/utils/slugify';
import { getCleanDescription } from '@/lib/strip-markdown';
import { formatFinancingRate, substituteLiveRateTokens } from '@/lib/finance';

import { optimizeImage, buildSrcSet } from '@/lib/optimizeImage';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
import { BlogTable } from '@/components/blog/BlogTable';
import { DealerConfidenceStrip } from '@/components/blog/DealerConfidenceStrip';
import { LanguageSwitcher } from '@/components/blog/LanguageSwitcher';
import { BlogHeroPicture } from '@/components/blog/BlogHeroPicture';
import { MercuryVideo } from '@/components/blog/MercuryVideo';
import { MercuryVideoFile } from '@/components/blog/MercuryVideoFile';
import { PremiumFaq } from '@/components/blog/PremiumFaq';


import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;
  const [heroImgError, setHeroImgError] = useState(false);
  
  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const relatedArticles = getRelatedArticles(article.slug, 3);
  const tocItems = extractHeaders(article.content);
  const cleanDescription = getCleanDescription(article);

  // Process inline markdown formatting (bold, italic, links, code)
  const processInlineFormatting = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Find the earliest match
      const patterns = [
        { regex: /\*\*(.+?)\*\*/, type: 'bold' },
        { regex: /\*([^*]+)\*/, type: 'italic' },
        { regex: /_([^_]+)_/, type: 'italic' },
        { regex: /`([^`]+)`/, type: 'code' },
        { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: 'link' },
      ];

      let earliestMatch: { index: number; match: RegExpMatchArray; type: string } | null = null;

      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex);
        if (match && match.index !== undefined) {
          if (!earliestMatch || match.index < earliestMatch.index) {
            earliestMatch = { index: match.index, match, type: pattern.type };
          }
        }
      }

      if (earliestMatch) {
        // Add text before match
        if (earliestMatch.index > 0) {
          parts.push(remaining.slice(0, earliestMatch.index));
        }

        const { match, type } = earliestMatch;

        switch (type) {
          case 'bold':
            parts.push(<strong key={keyIndex++} className="font-semibold text-foreground">{match[1]}</strong>);
            break;
          case 'italic':
            parts.push(<em key={keyIndex++} className="italic">{match[1]}</em>);
            break;
          case 'code':
            parts.push(<code key={keyIndex++} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">{match[1]}</code>);
            break;
          case 'link':
            const linkHref = match[2];
            const linkIsInternal = linkHref.startsWith('/') || /^https?:\/\/([^/]*\.)?(mercuryrepower\.ca|mercuryquote\.ca|mercury-quote-tool\.lovable\.app)(\/|$)/i.test(linkHref);
            if (linkIsInternal) {
              parts.push(
                <Link key={keyIndex++} to={linkHref.replace(/^https?:\/\/[^/]+/, '') || '/'} className="text-primary hover:underline">
                  {match[1]}
                </Link>
              );
            } else {
              parts.push(
                <a key={keyIndex++} href={linkHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {match[1]}
                </a>
              );
            }
            break;
        }

        remaining = remaining.slice(earliestMatch.index + match[0].length);
      } else {
        // No more matches, add remaining text
        parts.push(remaining);
        break;
      }
    }

    return parts;
  };

  // Convert markdown-style content to HTML with anchor IDs
  const renderContent = (content: string) => {
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    return content
      .split('\n')
      .map((line, index) => {
        // Code block handling
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockLang = line.slice(3).trim();
            codeBlockContent = [];
            return null;
          } else {
            inCodeBlock = false;
            const code = codeBlockContent.join('\n');
            return (
              <pre key={index} className="bg-muted/50 border border-border rounded-lg p-4 my-4 overflow-x-auto">
                <code className="text-sm font-mono text-foreground">{code}</code>
              </pre>
            );
          }
        }

        if (inCodeBlock) {
          codeBlockContent.push(line);
          return null;
        }

        // Markdown images ![alt](url) or ![alt](url "caption") - use expandable image for lightbox/zoom
        if (line.match(/^!\[.*?\]\(.*?\)$/)) {
          const imageMatch = line.match(/!\[(.*?)\]\((\S+?)(?:\s+"([^"]*)")?\)/);
          if (imageMatch) {
            return (
              <ExpandableImage 
                key={index}
                src={imageMatch[2]}
                alt={imageMatch[1]}
                caption={imageMatch[3]}
                className="w-full rounded-lg"
                containerClassName="my-6"
              />
            );
          }
        }

        // Headers with anchor IDs
        if (line.startsWith('## ')) {
          const text = line.slice(3);
          const id = slugify(text);
          return (
            <h2 
              key={index} 
              id={id}
              className="text-2xl font-semibold text-foreground mt-8 mb-4 scroll-mt-24"
            >
              {processInlineFormatting(text)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          const text = line.slice(4);
          const id = slugify(text);
          return (
            <h3 
              key={index} 
              id={id}
              className="text-xl font-medium text-foreground mt-6 mb-3 scroll-mt-24"
            >
              {processInlineFormatting(text)}
            </h3>
          );
        }
        // Bold text lines (standalone)
        if (line.startsWith('**') && line.endsWith('**:')) {
          return <p key={index} className="font-semibold text-foreground mt-4 mb-2">{line.slice(2, -3)}:</p>;
        }
        // List items
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-6 text-muted-foreground mb-1">{processInlineFormatting(line.slice(2))}</li>;
        }
        if (line.match(/^\d+\. /)) {
          const numMatch = line.match(/^(\d+)\. /);
          const numLen = numMatch ? numMatch[0].length : 3;
          return <li key={index} className="ml-6 text-muted-foreground mb-1 list-decimal">{processInlineFormatting(line.slice(numLen))}</li>;
        }
        // Emoji indicators
        if (line.startsWith('❌')) {
          return <p key={index} className="text-destructive ml-4 mb-1">{processInlineFormatting(line)}</p>;
        }
        // Tables (simplified)
        if (line.startsWith('|')) {
          return null;
        }
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        // Regular paragraphs with inline formatting
        return <p key={index} className="text-muted-foreground mb-3 leading-relaxed">{processInlineFormatting(line)}</p>;
      });
  };

  const articleUrl = `${SITE_URL}/blog/${article.slug}`;

  return (
    <div className="min-h-screen bg-repower-paper">
      <BlogSEO article={article} />
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      {/* Floating Share Bar */}
      <FloatingShareBar
        url={articleUrl}
        title={article.seoTitle ?? article.title}
        description={cleanDescription}
        articleSlug={article.slug}
      />

      <main className="container mx-auto px-6 md:px-14 py-10 md:py-14">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8 max-w-[880px] mx-auto">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="text-repower-navy-900/60 hover:text-repower-mercury-red">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-repower-navy-900/40" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/blog" className="text-repower-navy-900/60 hover:text-repower-mercury-red">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-repower-navy-900/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[200px] text-repower-navy-900">{article.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isRepowerHubSlug(article.slug) && <RepowerHubBanner />}



        <article className="max-w-[880px] mx-auto" aria-labelledby="article-title">
          {/* Back Link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-repower-navy-900/60 hover:text-repower-mercury-red transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
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
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              {article.title}
            </h1>
            <p className="font-sans text-[18px] text-repower-navy-900/65 mb-6 leading-relaxed">
              {cleanDescription}
            </p>
            <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-repower-navy-900/10">
              <div className="flex items-center gap-4 text-sm text-repower-navy-900/60 flex-wrap">
                <AuthorByline name="Jay Harris" title="Mercury dealer since 1965" />
                {(() => {
                  const published = parseLocalDate(article.datePublished);
                  const modified = article.dateModified ? parseLocalDate(article.dateModified) : null;
                  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  const showUpdated = modified && modified.getTime() > published.getTime();
                  return (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {showUpdated ? `Updated ${fmt(modified!)}` : fmt(published)}
                    </span>
                  );
                })()}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
              </div>
              <BlogShareButtons
                url={articleUrl}
                title={article.seoTitle ?? article.title}
                description={cleanDescription}
                image={article.image}
                variant="inline"
                articleSlug={article.slug}
                location="header"
              />
            </div>
            <p className="mt-3 text-xs text-repower-navy-900/50">
              Last updated: {parseLocalDate(article.dateModified || article.datePublished).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </header>

          {/* Featured Image — shared <picture> component (see BlogHeroPicture) */}
          <BlogHeroPicture image={article.image} alt={article.title} photoSlot={article.photoSlot} />

          {/* Language switcher */}
          <LanguageSwitcher currentLang="en" currentSlug={article.slug} />

          {/* Dealer credentials strip */}
          <DealerConfidenceStrip />

          {/* Top contextual CTA */}
          <BlogCTA category={article.category} slug={article.slug} variant="inline" />

          {/* Table of Contents */}
          {tocItems.length > 0 && (
            <TableOfContents items={tocItems} />
          )}

          {/* Optional Mercury Marine YouTube video reference */}
          {article.youtubeVideoId && (
            <MercuryVideo
              videoId={article.youtubeVideoId}
              title={article.youtubeVideoTitle || 'Mercury Marine video'}
            />
          )}

          {/* Optional self-hosted Mercury video (Lovable Assets CDN) */}
          {article.videoAssetUrl && (
            <MercuryVideoFile
              src={article.videoAssetUrl}
              title={article.videoAssetTitle || 'Mercury Marine video'}
              caption={article.videoAssetCaption}
            />
          )}

          {/* Content */}
          <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 blog-article-prose">
            <MarkdownSectionCards
              content={(() => {
                let c = article.content.replace(/^\s*#\s+.+\n+/, '');
                // Live token substitution: {{LIVE_RATE}} -> e.g. "5.48% APR",
                // sourced from the same finance helper that drives the
                // quote builder's monthly-payment math. Change the rate in
                // src/lib/finance.ts (MERCURY_PROMO_APR) to update everywhere.
                c = c.replace(/\{\{LIVE_RATE\}\}/g, formatFinancingRate());
                // Strip standalone scaffold lines: "*Last updated: ...*",
                // "_Last updated: ..._", "**Last updated:** ...", "*Last reviewed: ...*".
                // These conflict with the dateModified field shown in the byline.
                c = c.replace(
                  /^[*_\s]*\**\s*Last\s+(?:updated|reviewed)\b[^\n]*$/gim,
                  '',
                );
                // Strip standalone "Language: English" lines.
                c = c.replace(
                  /^[*_\s]*Language[*_\s:：]+English[*_\s]*$/gim,
                  '',
                );
                // Drop a literal "## CTA" heading line; keep its body content.
                c = c.replace(/^##\s+CTA\s*$/gim, '');
                // Rename "## Internal Links" → "## Related reading" (keep list).
                c = c.replace(/^(##\s+)Internal Links\s*$/gim, '$1Related reading');
                // Suppress inline `## Frequently Asked Questions` (or FAQ/FAQs)
                // section when faqs[] is populated — accordion below replaces it.
                if (article.faqs && article.faqs.length > 0) {
                  c = c.replace(
                    /\n##\s+(?:Frequently Asked Questions|FAQs?|FAQ)\b[^\n]*\n[\s\S]*?(?=\n##\s|\n*$)/i,
                    '\n',
                  );
                }
                // Collapse 3+ blank lines left by the strips above.
                c = c.replace(/\n{3,}/g, '\n\n');
                return c;
              })()}
              markdownComponents={{
                // SEO: demote any in-body H1 to H2 so the page-level title
                // remains the only H1 on the page. Catches stray H1s inside
                // ~19 article bodies without editing each source file.
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
                a: ({ node, href, children, title, ...props }) => {
                  if (!href) return <a {...props}>{children}</a>;
                  const isInternal =
                    href.startsWith('/') ||
                    href.startsWith('#') ||
                    /^https?:\/\/([^/]*\.)?(mercuryrepower\.ca|mercuryquote\.ca|mercury-quote-tool\.lovable\.app)(\/|$)/i.test(href);
                  const isCta = title === 'cta';
                  const ctaClass = 'inline-block bg-repower-mercury-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-repower-mercury-red-deep transition no-underline my-4';
                  const linkClass = isCta ? ctaClass : 'text-primary hover:underline';
                  if (isInternal) {
                    const to = href.startsWith('#') ? href : (href.replace(/^https?:\/\/[^/]+/, '') || '/');
                    return <Link to={to} className={linkClass}>{children}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass} {...props}>{children}</a>;
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
                table: ({ node, children }) => <BlogTable>{children}</BlogTable>,
                hr: () => <hr className="my-8 border-t border-repower-navy-900/15" />,
                ul: ({ node, children, ...props }) => (
                  <ul className="list-disc pl-6 my-4 space-y-2 text-repower-navy-900/85" {...props}>{children}</ul>
                ),
                ol: ({ node, children, start, ...props }) => (
                  // Drop `start` — directive splitting can leave list halves with stale start values (e.g. "13.").
                  <ol className="list-decimal pl-6 my-4 space-y-2 text-repower-navy-900/85" {...props}>{children}</ol>
                ),
                li: ({ node, children, ...props }) => (
                  <li className="leading-relaxed" {...props}>{children}</li>
                ),
              }}
            />
          </div>




          {/* Author Byline (bottom) */}
          <div className="mt-10 pt-6 border-t border-repower-navy-900/10">
            <AuthorByline title="3rd-Generation Owner, Harris Boat Works · Mercury Platinum Dealer · Rice Lake, Ontario" />
          </div>

          {/* FAQ Section */}
          {article.faqs && article.faqs.length > 0 && (
            <PremiumFaq faqs={article.faqs} />
          )}

          {/* Share Section */}
          <div className="mt-14 pt-10 border-t border-repower-navy-900/10">
            <BlogShareButtons
              url={articleUrl}
              title={article.seoTitle ?? article.title}
              description={cleanDescription}
              image={article.image}
              variant="full"
              articleSlug={article.slug}
              location="footer"
            />
          </div>

          {/* Bottom contextual CTA */}
          <BlogCTA category={article.category} slug={article.slug} variant="banner" />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <nav aria-label="Related Articles" className="mt-20 max-w-[1100px] mx-auto">
            <h2 className="font-display font-bold text-2xl md:text-[28px] text-repower-navy-900 mb-8 text-center" style={{ letterSpacing: '-0.02em' }}>
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map(related => (
                <article key={related.slug}>
                  <BlogCard article={related} />
                </article>
              ))}
            </div>
          </nav>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
