import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import { GOOGLE_REVIEWS_URL } from '@/config/googleReviews';
import { formatReviewerName, selectDisplayReviews } from '@/lib/googleReviewsDisplay';

export type GoogleReviewsTestimonialsVariant = 'light-carousel' | 'dark-grid';

interface GoogleReviewsTestimonialsProps {
  variant: GoogleReviewsTestimonialsVariant;
  heading: ReactNode;
  headingId?: string;
  limit?: number;
}

export function GoogleReviewsTestimonials({
  variant,
  heading,
  headingId,
  limit,
}: GoogleReviewsTestimonialsProps) {
  const { data: placeData } = useGooglePlaceData();
  const reviews = useMemo(
    () => selectDisplayReviews(placeData?.reviews, limit ?? (variant === 'dark-grid' ? 3 : 6)),
    [limit, placeData?.reviews, variant],
  );

  if (reviews.length === 0) return null;

  const rating = placeData?.rating;
  const totalReviews = placeData?.totalReviews;
  const summary =
    typeof rating === 'number' && typeof totalReviews === 'number'
      ? `Rated ${rating.toFixed(1)} stars across ${totalReviews} Google reviews from Ontario boaters`
      : 'Recent Google reviews from Ontario boaters';

  if (variant === 'dark-grid') {
    return (
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-navy-900 text-repower-cream">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              Google reviews
            </p>
            <h2
              id={headingId}
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] mb-4"
            >
              {heading}
            </h2>
            <p className="font-sans text-base text-repower-cream/65">{summary}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <article
                key={`${review.authorName}-${review.time}`}
                className="border border-repower-cream/10 bg-repower-cream/[0.03] rounded p-8"
              >
                <div className="flex gap-1 mb-4" aria-label={`${review.rating} stars`}>
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="w-4 h-4 fill-repower-gold text-repower-gold" />
                  ))}
                </div>
                <p className="font-display text-lg text-repower-cream mb-6 leading-relaxed italic tracking-[-0.01em]">
                  “{review.text.trim()}”
                </p>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-repower-cream/55">
                  <span className="text-repower-gold">{formatReviewerName(review.authorName)}</span>
                  {' · '}
                  {review.relativeTime} · Google review
                </p>
              </article>
            ))}
          </div>

          <p className="mt-10">
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-repower-cream/70 underline underline-offset-4 hover:text-repower-cream"
            >
              Read all reviews on Google
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <GoogleReviewsCarouselSection
      heading={heading}
      headingId={headingId}
      summary={summary}
      reviews={reviews}
    />
  );
}

function GoogleReviewsCarouselSection({
  heading,
  headingId,
  summary,
  reviews,
}: {
  heading: ReactNode;
  headingId?: string;
  summary: string;
  reviews: ReturnType<typeof selectDisplayReviews>;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!emblaApi || prefersReducedMotion || isHovered || isFocusWithin) return;
    const interval = window.setInterval(() => emblaApi.scrollNext(), 6000);
    return () => window.clearInterval(interval);
  }, [emblaApi, isFocusWithin, isHovered, prefersReducedMotion]);

  return (
    <section className="bg-white py-20 md:py-24 px-6 md:px-14 border-t border-repower-navy-900/10">
      <div
        className="max-w-[1100px] mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsFocusWithin(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocusWithin(false);
        }}
      >
        <div className="text-center mb-12">
          <h2
            id={headingId}
            className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-3"
            style={{ letterSpacing: '-0.025em' }}
          >
            {heading}
          </h2>
          <p className="font-sans text-repower-navy-900/65">{summary}</p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {reviews.map((review) => (
                <article
                  key={`${review.authorName}-${review.time}`}
                  className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0"
                >
                  <div className="bg-white border border-repower-navy-900/10 rounded-lg p-6 h-full card-hover">
                    <div className="flex gap-1 mb-4" aria-label={`${review.rating} stars`}>
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="w-4 h-4 fill-repower-gold text-repower-gold" />
                      ))}
                    </div>

                    <p className="font-sans text-repower-navy-900 mb-4 italic">
                      “{review.text.trim()}”
                    </p>

                    <div className="text-sm">
                      <span className="font-medium text-repower-navy-900">
                        {formatReviewerName(review.authorName)}
                      </span>
                    </div>

                    <p className="text-xs text-repower-navy-900/60 mt-1 mb-3">{review.relativeTime}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-repower-navy-900/10">
                      <a
                        href={GOOGLE_REVIEWS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-repower-navy-900/60 underline underline-offset-4 hover:text-repower-navy-900"
                      >
                        Google review
                      </a>
                      <div className="flex items-center gap-1 text-repower-navy-900">
                        <BadgeCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="text-xs font-medium">Verified Google review</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            aria-label="Previous Google review"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full border border-repower-navy-900/10 shadow-sm hidden md:flex items-center justify-center hover:border-repower-navy-900/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-repower-navy-900" />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next Google review"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full border border-repower-navy-900/10 shadow-sm hidden md:flex items-center justify-center hover:border-repower-navy-900/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-repower-navy-900" />
          </button>
        </div>

        <div className="flex flex-row keep-flex justify-center gap-2 mt-6">
          {reviews.map((review, index) => (
            <button
              key={`${review.authorName}-${review.time}`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to Google review ${index + 1}`}
              aria-current={selectedIndex === index ? 'true' : undefined}
              className="w-11 h-11 p-0 rounded-full inline-flex items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`w-2 h-2 rounded-full transition-colors ${
                  selectedIndex === index ? 'bg-repower-gold' : 'bg-repower-navy-900/20'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
