import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    text: "My husband and I have been going to Harris Marina for many years. They are/have ALWAYS been very fair and stand behind their work!",
    author: "annmarielion",
    source: "Google Reviews"
  },
  {
    text: "Called in and they had a good understanding of what I needed. Had to order parts and they were ready the next day. Super friendly staff and very helpful.",
    author: "Patrick L.",
    source: "Google Reviews"
  },
  {
    text: "Good selection of marine parts and products, fair prices and friendly service.",
    author: "Google Customer",
    source: "Google Reviews"
  },
  {
    text: "Really awesome experience, super friendly staff.",
    author: "Verified Customer",
    source: "Google Reviews"
  },
  {
    text: "If you are renting boats on Rice Lake, this is the place to go.",
    author: "Rice Lake Visitor",
    source: "Google Reviews"
  },
  {
    text: "Bought a Mercury 115HP from Harris. Runs like a dream, great service from a family business that knows boats.",
    author: "Mike T.",
    source: "Rice Lake Customer"
  },
  {
    text: "Third generation customer. Harris has always taken care of our family's boating needs. Mercury motors last forever with their service.",
    author: "Sarah K.",
    source: "Peterborough Customer"
  },
  {
    text: "Best price I found anywhere! Motor runs perfect, installation was professional. Highly recommend Harris Boat Works.",
    author: "Dave M.",
    source: "Cobourg Customer"
  }
];

export const RotatingTestimonials: React.FC = () => {
  const [visibleTestimonials, setVisibleTestimonials] = useState<typeof testimonials>([]);

  useEffect(() => {
    // Create a deterministic but varied selection based on the day
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use seed to create a reproducible shuffle for the day
    const shuffled = [...testimonials].sort(() => {
      const x = Math.sin(seed) * 10000;
      return (x - Math.floor(x)) - 0.5;
    });
    
    // Show 3-4 testimonials per day
    const count = 3 + (seed % 2); // 3 or 4 testimonials
    setVisibleTestimonials(shuffled.slice(0, count));
  }, []);

  return (
    <div className="space-y-3">
      {visibleTestimonials.map((testimonial, index) => (
        <div key={index} className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            "{testimonial.text}"
          </p>
          <p className="text-xs font-medium">— {testimonial.author}, {testimonial.source}</p>
        </div>
      ))}
    </div>
  );
};