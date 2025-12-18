import { useState, useEffect } from 'react';
import { Star, Quote, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface GoogleReview {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  time: number;
  relativeTime: string;
}

interface PlaceData {
  name: string;
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
}

export function GoogleReviewsCarousel() {
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // First, find the place ID for Harris Boat Works
        const { data: findData, error: findError } = await supabase.functions.invoke('google-places', {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        });

        if (findError) throw findError;
        
        // If we got the default placeholder, try to find the real place ID
        if (!findData || findData.error) {
          // Use find place to get the actual place ID
          const searchResponse = await fetch(
            `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places?action=findPlace&query=Harris+Boat+Works+Gores+Landing+Ontario`
          );
          const searchData = await searchResponse.json();
          
          if (searchData.candidates && searchData.candidates.length > 0) {
            const placeId = searchData.candidates[0].place_id;
            
            // Now fetch details with the found place ID
            const detailsResponse = await fetch(
              `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places?placeId=${placeId}`
            );
            const details = await detailsResponse.json();
            setPlaceData(details);
          }
        } else {
          setPlaceData(findData);
        }
      } catch (err) {
        console.error('[GoogleReviews] Error fetching reviews:', err);
        setError('Unable to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
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
    // Fallback to showing nothing or a minimal message
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
