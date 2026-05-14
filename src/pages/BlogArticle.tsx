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
import { slugify, extractHeaders } from '@/utils/slugify';
import { getCleanDescription } from '@/lib/strip-markdown';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
import { DealerConfidenceStrip } from '@/components/blog/DealerConfidenceStrip';
import { LanguageSwitcher } from '@/components/blog/LanguageSwitcher';
import { ShaftLengthPicker } from '@/components/tools/ShaftLengthPicker';
import { TradeInValueEstimator } from '@/components/tools/TradeInValueEstimator';
import { RepowerCostEstimator } from '@/components/tools/RepowerCostEstimator';
import { BoostEligibilityChecker } from '@/components/tools/BoostEligibilityChecker';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
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
            const isInternal = match[2].startsWith('/') || match[2].includes('harrisboatworks');
            if (isInternal) {
              parts.push(
                <Link key={keyIndex++} to={match[2].replace(/https?:\/\/[^/]+/, '')} className="text-primary hover:underline">
                  {match[1]}
                </Link>
              );
            } else {
              parts.push(
                <a key={keyIndex++} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
        title={article.title}
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
                <AuthorByline name={article.author} />
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {parseLocalDate(article.datePublished).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
              </div>
              <BlogShareButtons
                url={articleUrl}
                title={article.title}
                description={cleanDescription}
                image={article.image}
                variant="inline"
                articleSlug={article.slug}
                location="header"
              />
            </div>
          </header>

          {/* Featured Image */}
          <div className="aspect-[16/9] overflow-hidden rounded-lg bg-repower-paper border border-repower-navy-900/10 mb-10">
            {heroImgError ? (
              <div className="w-full h-full flex items-center justify-center bg-repower-navy-900 text-white">
                <div className="text-center px-4">
                  <span className="block text-3xl font-display font-bold tracking-tight">Harris Boat Works</span>
                  <span className="block text-sm mt-1 opacity-80 uppercase tracking-widest">Mercury Authorized Dealer</span>
                </div>
              </div>
            ) : (
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-contain"
                onError={() => setHeroImgError(true)}
              />
            )}
          </div>

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

          {/* Content */}
          <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 blog-article-prose">
            <MarkdownSectionCards
              content={(() => {
                let c = article.content.replace(/^\s*#\s+.+\n+/, '');
                // Suppress inline `## Frequently Asked Questions` (or FAQ/FAQs)
                // section when faqs[] is populated — accordion below replaces it.
                if (article.faqs && article.faqs.length > 0) {
                  c = c.replace(
                    /\n##\s+(?:Frequently Asked Questions|FAQs?|FAQ)\b[^\n]*\n[\s\S]*?(?=\n##\s|\n*$)/i,
                    '\n',
                  );
                }
                return c;
              })()}
              markdownComponents={{
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
                table: ({ node, children }) => <BlogTable>{children}</BlogTable>,
              }}
            />
          </div>

          {/* Interactive tool: Shaft Length Picker (slug-conditional) */}
          {article.slug === 'outboard-shaft-length-guide' && (
            <ShaftLengthPicker />
          )}

          {/* Interactive tool: Trade-In Value Estimator (slug-conditional) */}
          {article.slug === 'outboard-trade-in-value-ontario-hbw' && (
            <TradeInValueEstimator />
          )}

          {/* Interactive tool: Repower Cost Estimator (slug-conditional) */}
          {article.slug === 'mercury-repower-cost-ontario-2026-cad' && (
            <RepowerCostEstimator />
          )}

          {/* Interactive tool: Boost Eligibility Checker (slug-conditional) */}
          {article.slug === 'mercury-boost-upgrade-150hp-pontoon-analysis' && (
            <BoostEligibilityChecker />
          )}

          {/* Author Byline (bottom) */}
          <div className="mt-10 pt-6 border-t border-repower-navy-900/10">
            <AuthorByline title="3rd-Generation Owner, Harris Boat Works · Mercury Platinum Dealer · Rice Lake, Ontario" />
          </div>

          {/* FAQ Section */}
          {article.faqs && article.faqs.length > 0 && (
            <section aria-labelledby="faq-heading" className="mt-14 pt-10 border-t border-repower-navy-900/10">
              <h2 id="faq-heading" className="font-display font-bold text-2xl md:text-[28px] text-repower-navy-900 mb-6" style={{ letterSpacing: '-0.02em' }}>
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="border-t border-repower-navy-900/10">
                {article.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-b border-repower-navy-900/10 group">
                    <AccordionTrigger className="text-left font-sans font-semibold text-[16px] md:text-[17px] text-repower-navy-900 hover:no-underline py-5 px-2 hover:bg-repower-navy-900/[0.04] rounded-sm transition-colors [&>svg]:text-repower-navy-900">
                      <span className="relative inline-block group-data-[state=open]:after:content-[''] group-data-[state=open]:after:absolute group-data-[state=open]:after:left-0 group-data-[state=open]:after:-bottom-1 group-data-[state=open]:after:h-[2px] group-data-[state=open]:after:w-10 group-data-[state=open]:after:bg-repower-gold">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="font-sans text-[15px] text-repower-navy-900/75 pb-5 px-2 leading-relaxed faq-answer">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* Share Section */}
          <div className="mt-14 pt-10 border-t border-repower-navy-900/10">
            <BlogShareButtons
              url={articleUrl}
              title={article.title}
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
