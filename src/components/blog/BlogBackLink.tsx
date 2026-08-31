import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared back link for every language blog article page.
 *
 * Guarantees exactly one decorative arrow: the lucide <ArrowLeft /> icon,
 * hidden from assistive tech. Labels must never contain a literal arrow
 * glyph, which previously produced two visible arrows.
 */
export interface BlogBackLinkProps {
  to: string;
  label: string;
  className?: string;
  iconClassName?: string;
  /** Wrap in a <nav> element (default true). */
  withNav?: boolean;
  navClassName?: string;
}

export function BlogBackLink({
  to,
  label,
  className,
  iconClassName,
  withNav = true,
  navClassName = 'mb-8',
}: BlogBackLinkProps) {
  const link = (
    <Link
      to={to}
      className={cn('text-primary hover:underline text-sm flex items-center gap-1', className)}
    >
      <ArrowLeft className={cn('w-4 h-4', iconClassName)} aria-hidden="true" />
      {label.replace(/[\u2190\u21E6\u2B05]\uFE0F?\s*/g, '')}
    </Link>
  );

  if (!withNav) return link;
  return <nav className={navClassName}>{link}</nav>;
}

export default BlogBackLink;
