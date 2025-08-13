import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useGoogleReviews } from '@/hooks/useGoogleReviews';

export const TestimonialCarousel = () => {
  const { testimonials, loading } = useGoogleReviews();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  console.log('TestimonialCarousel: Render - current:', current, 'paused:', paused);

  useEffect(() => {
    console.log('TestimonialCarousel: useEffect triggered, paused:', paused, 'testimonials.length:', testimonials.length);
    if (paused || testimonials.length === 0) return;
    const timer = setInterval(() => {
      console.log('TestimonialCarousel: Timer fired, changing from', current, 'to', (current + 1) % testimonials.length);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    console.log('TestimonialCarousel: Timer set with ID:', timer);
    return () => {
      console.log('TestimonialCarousel: Cleaning up timer:', timer);
      clearInterval(timer);
    };
  }, [paused, testimonials.length]);

  if (loading || testimonials.length === 0) {
    return (
      <section
        aria-label="Loading testimonials"
        className="rounded-lg my-6 p-4 md:p-6 bg-gradient-to-r from-primary/5 to-muted/40 border border-border"
      >
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
            <div className="animate-pulse">
              <div className="flex items-center justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-muted-foreground/30" />
                ))}
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-muted-foreground/20 rounded mx-auto w-3/4"></div>
                <div className="h-4 bg-muted-foreground/20 rounded mx-auto w-1/2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded mx-auto w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const t = testimonials[current];

  return (
    <section
      aria-label="Customer testimonials"
      className="rounded-lg my-6 p-4 md:p-6 bg-gradient-to-r from-primary/5 to-muted/40 border border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8 transition-shadow hover:shadow-md">
          <div key={current} className="animate-fade-in">
            <div className="flex items-center justify-center mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                />
              ))}
            </div>

            <blockquote className="text-center text-base md:text-lg mb-4 text-foreground">
              <span aria-hidden="true" className="select-none text-muted-foreground text-3xl mr-1">"</span>
              {t.text}
              <span aria-hidden="true" className="select-none text-muted-foreground text-3xl ml-1">"</span>
            </blockquote>

            <div className="text-center">
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.location} • {t.motor}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.isGoogleReview ? 'Google Review' : 'Verified Purchase'} • {t.date}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`}
            />
          ))}
        </div>

        <div className="text-center mt-3">
          <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Read All Reviews ({testimonials.length}) →
          </button>
        </div>
      </div>
    </section>
  );
};