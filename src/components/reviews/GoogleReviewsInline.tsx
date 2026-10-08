import { Star } from 'lucide-react';
import { useGoogleReviewStats } from '@/hooks/useGoogleReviewStats';
import { GOOGLE_REVIEWS, GOOGLE_REVIEWS_URL } from '@/config/googleReviews';

export interface GoogleReviewsInlineProps {
  className?: string;
}

export function GoogleReviewsInline({ className = '' }: GoogleReviewsInlineProps) {
  const { rating, totalReviews, isLoading } = useGoogleReviewStats();

  return (
    <aside
      className={`not-prose my-8 rounded-lg border border-border bg-card p-5 md:p-6 ${className}`}
      aria-label="Google reviews"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-3xl font-bold text-foreground" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
          {isLoading ? '–' : rating.toFixed(1)}
        </span>
        <div className="flex items-center gap-0.5 text-repower-gold" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-5 w-5 fill-repower-gold text-repower-gold"
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {isLoading ? 'Loading reviews…' : `${totalReviews} Google reviews`}
        </span>
      </div>

      <ul className="space-y-5">
        {GOOGLE_REVIEWS.map((review) => (
          <li key={review.authorName}>
            <blockquote className="m-0 p-0 border-l-0 pl-0">
              <p className="text-foreground/90 leading-relaxed italic mb-2">
                &ldquo;{review.text}&rdquo;
              </p>
              <footer className="text-sm text-muted-foreground">
                {review.authorName} · {review.source}
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t border-border">
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Read all reviews on Google
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </aside>
  );
}
