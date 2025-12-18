import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GoogleRatingBadgeProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/place/Harris+Boat+Works/@44.1264476,-78.2111697,17z/data=!4m8!3m7!1s0x89d583f7a1111111:0x1234567890abcdef!8m2!3d44.1264476!4d-78.2111697!9m1!1b1!16s%2Fg%2F1tdqqt8h?entry=ttu';

export function GoogleRatingBadge({ variant = 'compact', className = '' }: GoogleRatingBadgeProps) {
  const { data: placeData, isLoading, error } = useGooglePlaceData();
  
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }
  
  // Gracefully hide if no data
  if (error || !placeData?.rating) {
    return null;
  }
  
  const { rating, totalReviews } = placeData;
  
  if (variant === 'compact') {
    return (
      <a
        href={GOOGLE_REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity ${className}`}
      >
        {/* Google G logo */}
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground">({totalReviews})</span>
      </a>
    );
  }
  
  // Full variant
  return (
    <a
      href={GOOGLE_REVIEWS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors ${className}`}
    >
      {/* Google G logo */}
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">{totalReviews}</span> Google Reviews
      </div>
    </a>
  );
}