import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  location: string;
  motor: string;
  rating: number;
  text: string;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Mike Thompson',
    location: 'Rice Lake, ON',
    motor: 'Mercury 115HP',
    rating: 5,
    text: 'Best price I found anywhere! Motor runs like a dream. The water testing really dialed in the perfect prop.',
    date: '2 weeks ago',
  },
  {
    name: 'Sarah Mitchell',
    location: 'Peterborough, ON',
    motor: 'Mercury 9.9HP',
    rating: 5,
    text: 'They made the trade-in so easy. Got way more than expected for my old Yamaha. Installation was perfect!',
    date: '1 month ago',
  },
  {
    name: 'Dave Wilson',
    location: 'Kawartha Lakes, ON',
    motor: 'Mercury 50HP',
    rating: 5,
    text: 'The control adapter saved me $1,000! Didn\'t know my old controls would work. These guys know their stuff.',
    date: '3 weeks ago',
  },
  {
    name: 'Jennifer Cole',
    location: 'Cobourg, ON',
    motor: 'Mercury 150HP Pro XS',
    rating: 5,
    text: 'CSI award is well deserved. Service team went above and beyond. My bass boat has never run better!',
    date: '2 months ago',
  },
  {
    name: 'Rob Anderson',
    location: 'Gores Landing, ON',
    motor: 'Mercury 25HP',
    rating: 5,
    text: 'Online quote tool made it so easy. Knew exactly what I\'d pay. No surprises, just great service.',
    date: '1 month ago',
  },
];

export const TestimonialCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  console.log('TestimonialCarousel: Render - current:', current, 'paused:', paused);

  useEffect(() => {
    console.log('TestimonialCarousel: useEffect triggered, paused:', paused);
    if (paused) return;
    const timer = setInterval(() => {
      console.log('TestimonialCarousel: Timer fired, changing from', current, 'to', (current + 1) % testimonials.length);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    console.log('TestimonialCarousel: Timer set with ID:', timer);
    return () => {
      console.log('TestimonialCarousel: Cleaning up timer:', timer);
      clearInterval(timer);
    };
  }, [paused]);

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
              <p className="text-xs text-muted-foreground mt-1">Verified Purchase • {t.date}</p>
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
            Read All Reviews →
          </button>
        </div>
      </div>
    </section>
  );
};