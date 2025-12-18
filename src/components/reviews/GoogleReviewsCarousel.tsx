import { Star, Quote, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';

export function GoogleReviewsCarousel() {
  const { data: placeData, isLoading, error } = useGooglePlaceData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-20 w-full mb-3" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !placeData) {
    return null;
  }

  const { rating, totalReviews, reviews } = placeData;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span className="text-xl font-medium text-foreground">{rating?.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{totalReviews} Google Reviews</span>
          <a
            href="https://g.page/r/CXJ0QX5Nq3qqEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
          >
            Write a Review
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.slice(0, 6).map((review, index) => (
          <Card key={index} className="border-0 shadow-sm bg-background hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-3">
                {review.authorPhoto ? (
                  <img
                    src={review.authorPhoto}
                    alt={review.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {review.authorName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{review.authorName}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Quote className="absolute -top-1 -left-1 h-4 w-4 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground line-clamp-4 pl-4">
                  {review.text}
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground/60 mt-3">
                {review.relativeTime}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Reviews Link */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <a
            href="https://www.google.com/maps/place/Harris+Boat+Works/@44.1167,-78.25,15z/data=!4m7!3m6!1s0x0:0x0!8m2!3d44.1167!4d-78.25!9m1!1b1"
            target="_blank"
            rel="noopener noreferrer"
          >
            View All Reviews on Google
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  );
}
