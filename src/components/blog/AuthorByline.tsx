import { Link } from 'react-router-dom';

interface AuthorBylineProps {
  name?: string;
  title?: string;
  className?: string;
  byLabel?: string;
  bioLabel?: string;
  /** When true, renders a richer card-style block (suitable for top of article). */
  variant?: 'inline' | 'card';
}

const JAY_CREDENTIALS =
  'Owner, Harris Boat Works · 3rd-generation family marina since 1947 · Mercury Marine Premier Dealer';

/**
 * Standardized author byline for blog articles.
 * Defaults to "Jay Harris". When the author is Jay Harris, renders the
 * full HBW credentials line and links to /about/jay-harris.
 */
export function AuthorByline({
  name = 'Jay Harris',
  title,
  className = '',
  byLabel = 'By',
  bioLabel = 'View author bio',
  variant = 'inline',
}: AuthorBylineProps) {
  const isJay = name === 'Jay Harris';
  const credentials = isJay ? (title || JAY_CREDENTIALS) : title;
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (variant === 'card') {
    return (
      <aside
        className={`flex items-start gap-3 rounded-lg border border-repower-navy-900/10 bg-white p-4 not-prose ${className}`}
        itemScope
        itemType="https://schema.org/Person"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-repower-navy-900 text-white font-semibold text-sm"
        >
          {initials || 'JH'}
        </span>
        <div className="flex flex-col">
          <span className="font-semibold text-repower-navy-900 text-[15px]" itemProp="name">
            {byLabel} {name}
          </span>
          {credentials && (
            <span className="text-[13px] text-repower-navy-900/70 leading-snug" itemProp="description">
              {credentials}
            </span>
          )}
          {isJay && (
            <Link
              to="/about/jay-harris"
              className="mt-1 text-[12px] font-semibold text-repower-mercury-red hover:underline"
            >
              {bioLabel} →
            </Link>
          )}
        </div>
      </aside>
    );
  }

  // Inline variant (used in article header meta row)
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-repower-navy-900/70 ${className}`}
      itemScope
      itemType="https://schema.org/Person"
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-repower-navy-900 text-white text-[10px] font-semibold"
      >
        {initials || 'JH'}
      </span>
      <span>
        {byLabel}{' '}
        {isJay ? (
          <Link to="/about/jay-harris" className="font-semibold text-repower-navy-900 hover:text-repower-mercury-red hover:underline" itemProp="name">
            {name}
          </Link>
        ) : (
          <span className="font-semibold text-repower-navy-900" itemProp="name">{name}</span>
        )}
        {credentials && (
          <>
            {', '}
            <span itemProp="jobTitle">{credentials}</span>
          </>
        )}
      </span>
    </span>
  );
}
