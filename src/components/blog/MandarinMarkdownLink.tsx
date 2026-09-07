import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const INTERNAL_MARKDOWN_ORIGIN_RE =
  /^https?:\/\/([^/]*\.)?(mercuryrepower\.ca|mercuryquote\.ca|mercury-quote-tool\.lovable\.app)(\/|$)/i;

function isAllowedAbsoluteHref(href: string): boolean {
  try {
    const protocol = new URL(href).protocol;
    return protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

/**
 * Shared Mandarin Markdown `<a>` renderer.
 * Internal paths, hashes, and mercuryrepower/mercuryquote origins stay in-app.
 * harrisboatworks.ca and other absolute URLs keep their original href.
 */
export function MandarinMarkdownLink({
  href,
  children,
  className,
}: {
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!href) {
    return <span>{children}</span>;
  }

  const isInternalPath = href.startsWith('/') && !href.startsWith('//');
  const isHash = href.startsWith('#');
  const isAllowlistedOrigin = INTERNAL_MARKDOWN_ORIGIN_RE.test(href);

  if (isInternalPath || isHash || isAllowlistedOrigin) {
    const to = isHash ? href : href.replace(/^https?:\/\/[^/]+/, '') || '/';
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  if (!isAllowedAbsoluteHref(href)) {
    return <span>{children}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
