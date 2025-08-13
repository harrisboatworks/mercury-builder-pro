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
  },
  {
    text: "Just picked up my new Mercury 60HP 4-stroke. Installation was flawless and the team walked me through everything. Ready for fishing season on Scugog!",
    author: "Tom R.",
    source: "Port Perry Customer"
  },
  {
    text: "Shopped around for months for a Mercury 25HP tiller. Harris had the best price and their knowledge about which model would work best for my jon boat was spot on.",
    author: "Jennifer M.",
    source: "Lindsay Customer"
  },
  {
    text: "Mercury 150HP ProXS installed last spring. Incredible power and fuel efficiency. Harris knows Mercury motors inside and out.",
    author: "Craig S.",
    source: "Kawartha Lakes Customer"
  },
  {
    text: "Family business that actually cares. They helped me choose between the Mercury 40HP and 60HP for my pontoon. Made the right call - couldn't be happier.",
    author: "Lisa W.",
    source: "Google Reviews"
  },
  {
    text: "Mercury 90HP 4-stroke has been running perfect for 3 seasons now. Harris's installation and annual service keeps it purring like new.",
    author: "Robert K.",
    source: "Fenelon Falls Customer"
  },
  {
    text: "Great experience upgrading from my old 2-stroke to a new Mercury 75HP. Night and day difference in performance and fuel economy.",
    author: "Mark D.",
    source: "Buckhorn Customer"
  },
  {
    text: "Been coming to Harris for 20+ years. Just bought my second Mercury from them - a 200HP Verado for my new bass boat. Installation was perfect as always.",
    author: "Steve L.",
    source: "Omemee Customer"
  },
  {
    text: "Called 4 different dealers about Mercury 9.9HP kicker motors. Harris was the only one who had it in stock and ready to install same week.",
    author: "Angela P.",
    source: "Google Reviews"
  },
  {
    text: "Mercury 20HP tiller for my aluminum fishing boat. Harris helped me get the right shaft length and prop. Starts first pull every time.",
    author: "Brian H.",
    source: "Lakefield Customer"
  },
  {
    text: "Outstanding service on my Mercury 250HP Verado installation. These guys know their stuff and the motor runs like a Swiss watch.",
    author: "Derek T.",
    source: "Peterborough Customer"
  },
  {
    text: "Third Mercury I've bought from Harris over the years. 40HP, 60HP, and now 115HP. Each one has been reliable and well-serviced.",
    author: "Nancy F.",
    source: "Google Reviews"
  },
  {
    text: "Mercury 8HP for my dinghy. Small motor but Harris treated it with the same care as the big ones. Great people to deal with.",
    author: "John P.",
    source: "Rice Lake Customer"
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