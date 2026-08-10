import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const INLINE_INTERNAL_LINK = /\[([^\]]+)\]\((\/[^)]+)\)/g;

export function stripInlineInternalLinks(text: string) {
  return text.replace(INLINE_INTERNAL_LINK, '$1');
}

export function renderInlineInternalLinks(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\(\/[^)]+\))/g).map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);
    if (!match) return part;

    return (
      <Link
        key={`${match[2]}-${index}`}
        to={match[2]}
        className="font-medium text-repower-navy-900 underline underline-offset-2 hover:text-repower-mercury-red"
      >
        {match[1]}
      </Link>
    );
  });
}
