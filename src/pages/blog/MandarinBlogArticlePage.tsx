import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, Calendar, Clock, Phone, MapPin } from 'lucide-react';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { getMandarinArticleBySlug } from '@/data/mandarinBlogArticles';
import { BlogArticle as BlogArticleType } from '@/data/blogArticles';
import { slugify, extractHeaders } from '@/utils/slugify';
import { TableOfContents } from '@/components/blog/TableOfContents';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function renderMarkdownContent(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let inTable = false;

  const processInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      let earliestIdx = remaining.length;
      let matchType = '';
      let match: RegExpMatchArray | null = null;

      if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestIdx) {
        earliestIdx = boldMatch.index;
        matchType = 'bold';
        match = boldMatch;
      }
      if (linkMatch && linkMatch.index !== undefined && linkMatch.index < earliestIdx) {
        earliestIdx = linkMatch.index;
        matchType = 'link';
        match = linkMatch;
      }

      if (!match) {
        parts.push(remaining);
        break;
      }

      if (earliestIdx > 0) {
        parts.push(remaining.substring(0, earliestIdx));
      }

      if (matchType === 'bold') {
        parts.push(<strong key={key++}>{match![1]}</strong>);
        remaining = remaining.substring(earliestIdx + match![0].length);
      } else if (matchType === 'link') {
        const isExternal = match![2].startsWith('http');
        parts.push(
          <a
            key={key++}
            href={match![2]}
            className="text-primary hover:underline"
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {match![1]}
          </a>
        );
        remaining = remaining.substring(earliestIdx + match![0].length);
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const flushTable = () => {
    if (tableHeaders.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="text-left p-3 font-medium text-foreground bg-muted/30">
                    {processInline(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-3 text-muted-foreground">
                      {processInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableHeaders = [];
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (!inTable) {
        tableHeaders = cells;
        inTable = true;
        i++;
        continue;
      }
      if (cells.every(c => /^[\s-:]+$/.test(c))) {
        i++;
        continue;
      }
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('### ')) {
      const text = line.replace('### ', '');
      const id = slugify(text);
      elements.push(<h3 key={i} id={id} className="text-xl font-semibold text-foreground mt-8 mb-3">{processInline(text)}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      const text = line.replace('## ', '');
      const id = slugify(text);
      elements.push(<h2 key={i} id={id} className="text-2xl font-semibold text-foreground mt-10 mb-4">{processInline(text)}</h2>);
      i++;
      continue;
    }

    if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-6 border-border/40" />);
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].replace(/^> /, ''));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="border-l-4 border-primary/30 pl-4 py-2 my-6 text-muted-foreground italic bg-primary/5 rounded-r-lg">
          {quoteLines.map((ql, qi) => <p key={qi} className="mb-1">{processInline(ql)}</p>)}
        </blockquote>
      );
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].replace(/^- /, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-4 space-y-2 text-muted-foreground">
          {items.map((item, idx) => <li key={idx}>{processInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal pl-6 my-4 space-y-2 text-muted-foreground">
          {items.map((item, idx) => <li key={idx}>{processInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      elements.push(
        <p key={i} className="text-muted-foreground leading-relaxed my-4 italic text-sm">
          {processInline(line.slice(1, -1))}
        </p>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="text-muted-foreground leading-relaxed my-4">
        {processInline(line)}
      </p>
    );
    i++;
  }

  if (inTable) flushTable();

  return elements;
}

export default function MandarinBlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getMandarinArticleBySlug(slug) : undefined;
  const [heroImgError, setHeroImgError] = useState(false);

  if (!article) {
    return <Navigate to="/zh" replace />;
  }

  const url = `${SITE_URL}/blog/zh/${article.slug}`;
  const tocItems = extractHeaders(article.content);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": article.title,
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
    <div className="min-h-screen bg-background" lang="zh-Hans">
      <Helmet>
        <title>{article.title} | Harris Boat Works</title>
        <meta name="description" content={article.description} />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="zh-Hans" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={article.datePublished} />
        <meta property="article:author" content="Harris Boat Works" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Back nav */}
        <nav className="mb-8">
          <Link to="/zh" className="text-primary hover:underline text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            ← 返回中文首页
          </Link>
        </nav>

        {/* Hero image */}
        {article.image && !heroImgError && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-64 md:h-80 object-cover"
              onError={() => setHeroImgError(true)}
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(article.datePublished).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {article.readTime}
          </span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
            {article.category}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-light text-foreground mb-8">
          {article.title}
        </h1>

        {/* Table of Contents */}
        {tocItems.length > 2 && (
          <div className="mb-8">
            <TableOfContents items={tocItems} />
          </div>
        )}

        {/* Article content */}
        <article className="prose prose-lg max-w-none">
          {renderMarkdownContent(article.content)}
        </article>

        {/* FAQ Section */}
        {article.faqs && article.faqs.length > 0 && (
          <section className="mt-12 mb-12">
            <h2 className="text-2xl font-light text-foreground mb-6">常见问题</h2>
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
        <section className="text-center bg-primary/5 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-light text-foreground mb-3">现在就行动</h2>
          <p className="text-muted-foreground text-sm mb-6">花五分钟在线配置您的报价</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              在线获取报价
            </Link>
            <a
              href="tel:905-342-2153"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              905-342-2153
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
