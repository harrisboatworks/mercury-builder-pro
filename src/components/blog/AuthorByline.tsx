import { User } from 'lucide-react';

interface AuthorBylineProps {
  name?: string;
  title?: string;
  className?: string;
}

/**
 * Standardized author byline for blog articles.
 * Defaults to "Jay Harris, 3rd-Generation Owner".
 */
export function AuthorByline({
  name = 'Jay Harris',
  title = '3rd-Generation Owner',
  className = '',
}: AuthorBylineProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm text-repower-navy-900/70 ${className}`}
      itemScope
      itemType="https://schema.org/Person"
    >
      <User className="h-4 w-4" aria-hidden="true" />
      <span>
        By{' '}
        <span className="font-semibold text-repower-navy-900" itemProp="name">
          {name}
        </span>
        {title && (
          <>
            {', '}
            <span itemProp="jobTitle">{title}</span>
          </>
        )}
      </span>
    </div>
  );
}
