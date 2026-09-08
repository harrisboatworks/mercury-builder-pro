import type { Key, ReactNode } from 'react';
import { ExpandableImage } from '@/components/ui/expandable-image';

const IMAGE_MARKDOWN_RE = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/;
const BOLD_MARKDOWN_RE = /\*\*(.+?)\*\*/;
const LINK_MARKDOWN_RE = /\[([^\]]+)\]\(([^)]+)\)/;
const SAFE_BLOG_IMAGE_EXT_RE = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

/**
 * Same-origin static image paths only. Rejects schemes, protocol-relative
 * URLs, traversal, and anything that is not a known image extension.
 */
export function getSafeBlogImageSrc(src: string | undefined | null): string | null {
  if (!src) return null;

  const trimmed = src.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (/\\|\.\./.test(trimmed)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  if (!SAFE_BLOG_IMAGE_EXT_RE.test(trimmed)) return null;

  return trimmed;
}

export function parseLocaleMarkdownImage(
  text: string,
): { alt: string; src: string; caption?: string } | null {
  const match = text.trim().match(new RegExp(`^${IMAGE_MARKDOWN_RE.source}$`));
  if (!match) return null;
  return {
    alt: match[1],
    src: match[2],
    caption: match[3],
  };
}

function renderSafeExpandableImage(
  key: Key,
  alt: string,
  src: string,
  caption?: string,
): ReactNode {
  return (
    <ExpandableImage
      key={key}
      src={src}
      alt={alt}
      caption={caption || alt || undefined}
      className="w-full rounded-lg"
      containerClassName="my-6"
    />
  );
}

/** Standalone `![alt](src)` / `![alt](src "caption")` line → image, never a text link. */
export function renderStandaloneLocaleMarkdownImage(
  line: string,
  key: Key,
): ReactNode | null {
  const parsed = parseLocaleMarkdownImage(line);
  if (!parsed) return null;

  const safeSrc = getSafeBlogImageSrc(parsed.src);
  if (!safeSrc) {
    const fallback = parsed.alt || parsed.caption;
    if (!fallback) return <p key={key} className="text-muted-foreground leading-relaxed my-4" />;
    return (
      <p key={key} className="text-muted-foreground leading-relaxed my-4">
        {fallback}
      </p>
    );
  }

  return renderSafeExpandableImage(key, parsed.alt, safeSrc, parsed.caption);
}

/**
 * Locale-page inline Markdown: images first, then bold, then links.
 * Preserves the existing bold/link behavior while stopping `![alt](src)`
 * from rendering as a leftover `!` plus an `<a>`.
 */
export function processLocaleInlineMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const imageMatch = remaining.match(IMAGE_MARKDOWN_RE);
    const boldMatch = remaining.match(BOLD_MARKDOWN_RE);
    const linkMatch = remaining.match(LINK_MARKDOWN_RE);

    let earliestIdx = remaining.length;
    let matchType = '';
    let match: RegExpMatchArray | null = null;

    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestIdx) {
      earliestIdx = boldMatch.index;
      matchType = 'bold';
      match = boldMatch;
    }
    if (imageMatch && imageMatch.index !== undefined && imageMatch.index < earliestIdx) {
      earliestIdx = imageMatch.index;
      matchType = 'image';
      match = imageMatch;
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
      parts.push(<strong key={key++}>{match[1]}</strong>);
      remaining = remaining.substring(earliestIdx + match[0].length);
    } else if (matchType === 'image') {
      const alt = match[1];
      const safeSrc = getSafeBlogImageSrc(match[2]);
      if (safeSrc) {
        parts.push(<img key={key++} src={safeSrc} alt={alt} title={match[3]} loading="lazy" decoding="async" className="inline-block max-w-full h-auto rounded-lg" />);
      } else if (alt) {
        parts.push(alt);
      }
      remaining = remaining.substring(earliestIdx + match[0].length);
    } else if (matchType === 'link') {
      const isExternal = match[2].startsWith('http');
      parts.push(
        <a
          key={key++}
          href={match[2]}
          className="text-primary hover:underline"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {match[1]}
        </a>,
      );
      remaining = remaining.substring(earliestIdx + match[0].length);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
