import { useState, useEffect } from 'react';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

interface Testimonial {
  name: string;
  location: string;
  motor: string;
  rating: number;
  text: string;
  date: string;
  isGoogleReview?: boolean;
}

const mockTestimonials: Testimonial[] = [
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

// Sample Google reviews (these would normally come from Google Places API)
const sampleGoogleReviews: GoogleReview[] = [
  {
    author_name: 'John Davis',
    rating: 5,
    text: 'Exceptional service and expertise. The team at Harris Marine really knows their stuff. Got exactly what I needed for my pontoon boat.',
    time: Date.now() - 86400000 * 14,
    relative_time_description: '2 weeks ago'
  },
  {
    author_name: 'Lisa Chen',
    rating: 5,
    text: 'Outstanding customer service! They helped me find the perfect motor for my fishing boat. Very knowledgeable staff.',
    time: Date.now() - 86400000 * 21,
    relative_time_description: '3 weeks ago'
  },
  {
    author_name: 'Mark Rodriguez',
    rating: 4,
    text: 'Great selection of motors and very competitive pricing. Installation was done professionally and on time.',
    time: Date.now() - 86400000 * 35,
    relative_time_description: '5 weeks ago'
  },
  {
    author_name: 'Emma Thompson',
    rating: 5,
    text: 'Highly recommend! The quote process was smooth and transparent. No hidden fees, just honest pricing.',
    time: Date.now() - 86400000 * 42,
    relative_time_description: '6 weeks ago'
  },
  {
    author_name: 'Robert Kim',
    rating: 5,
    text: 'Best marine dealer in the area. Professional installation and great follow-up service. My boat runs better than ever.',
    time: Date.now() - 86400000 * 28,
    relative_time_description: '4 weeks ago'
  },
  {
    author_name: 'Nancy Williams',
    rating: 5,
    text: 'Excellent experience from start to finish. The team was patient with all my questions and delivered exactly what they promised.',
    time: Date.now() - 86400000 * 49,
    relative_time_description: '7 weeks ago'
  },
  {
    author_name: 'Steve Johnson',
    rating: 4,
    text: 'Very satisfied with the service. Good communication throughout the process and fair pricing.',
    time: Date.now() - 86400000 * 56,
    relative_time_description: '8 weeks ago'
  },
  {
    author_name: 'Karen Lee',
    rating: 5,
    text: 'Professional service and high-quality work. They really care about customer satisfaction.',
    time: Date.now() - 86400000 * 63,
    relative_time_description: '9 weeks ago'
  },
  {
    author_name: 'Tom Brown',
    rating: 5,
    text: 'Great experience! Fast service, competitive prices, and excellent customer support.',
    time: Date.now() - 86400000 * 70,
    relative_time_description: '10 weeks ago'
  },
  {
    author_name: 'Michelle Garcia',
    rating: 4,
    text: 'Very knowledgeable staff who helped me choose the right motor for my needs. Installation was perfect.',
    time: Date.now() - 86400000 * 77,
    relative_time_description: '11 weeks ago'
  },
  {
    author_name: 'Chris Wilson',
    rating: 5,
    text: 'Top-notch service! They went above and beyond to ensure I was completely satisfied with my purchase.',
    time: Date.now() - 86400000 * 84,
    relative_time_description: '12 weeks ago'
  },
  {
    author_name: 'Amanda Taylor',
    rating: 5,
    text: 'Fantastic customer service and quality work. Highly recommend for anyone needing marine services.',
    time: Date.now() - 86400000 * 91,
    relative_time_description: '13 weeks ago'
  }
];

const motorTypes = [
  'Mercury 25HP', 'Mercury 50HP', 'Mercury 75HP', 'Mercury 115HP', 'Mercury 150HP',
  'Mercury 200HP', 'Mercury 9.9HP', 'Mercury 15HP', 'Mercury Pro XS', 'Verado 250HP'
];

const ontarioLocations = [
  'Peterborough, ON', 'Rice Lake, ON', 'Kawartha Lakes, ON', 'Cobourg, ON',
  'Port Hope, ON', 'Lindsay, ON', 'Bobcaygeon, ON', 'Fenelon Falls, ON',
  'Campbellford, ON', 'Hastings, ON', 'Gores Landing, ON'
];

const convertGoogleReviewToTestimonial = (review: GoogleReview): Testimonial => {
  const randomMotor = motorTypes[Math.floor(Math.random() * motorTypes.length)];
  const randomLocation = ontarioLocations[Math.floor(Math.random() * ontarioLocations.length)];
  
  return {
    name: review.author_name,
    location: randomLocation,
    motor: randomMotor,
    rating: review.rating,
    text: review.text,
    date: review.relative_time_description,
    isGoogleReview: true
  };
};

export const useGoogleReviews = () => {
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Convert Google reviews to testimonial format
      const googleTestimonials = sampleGoogleReviews.map(convertGoogleReviewToTestimonial);
      
      // Mix Google reviews with mock testimonials
      const mixed = [...mockTestimonials, ...googleTestimonials];
      
      // Shuffle the array to randomize order
      const shuffled = mixed.sort(() => Math.random() - 0.5);
      
      setAllTestimonials(shuffled);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { testimonials: allTestimonials, loading };
};