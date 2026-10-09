import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useGoogleReviews } from '@/hooks/useGoogleReviews';
import { GOOGLE_REVIEWS_URL } from '@/config/googleReviews';

export const TestimonialCarousel = () => {
  const { testimonials, loading } = useGoogleReviews();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || testimonials.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, testimonials.length]);

  if (loading || testimonials.length === 0) {
    return null;
  }

  const t = testimonials[current];

  return (
    <section
      aria-label="Google reviews"
      className="rounded-lg my-6 p-4 md:p-6 bg-gradient-to-r from-primary/5 to-muted/40 border border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Star className="w-4 h-4 text-repower-gold0" />
        Google reviews
      </h4>
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8 transition-shadow hover:shadow-md">
          <div key={current} className="animate-fade-in">
            <div className="flex items-center justify-center mb-3" aria-label={`${t.rating} stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                />
              ))}
            </div>

            <blockquote className="text-center text-base md:text-lg mb-4 text-foreground">
              <span aria-hidden="true" className="select-none text-muted-foreground text-3xl mr-1">
                "
              </span>
              {t.text}
              <span aria-hidden="true" className="select-none text-muted-foreground text-3xl ml-1">
                "
              </span>
            </blockquote>

            <div className="text-center">
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Google review • {t.date}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show Google review ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`}
            />
          ))}
        </div>

        <div className="text-center mt-3">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Read all reviews on Google →
          </a>
        </div>
      </div>
    </section>
  );
};
