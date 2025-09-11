export interface CustomerReview {
  hp: number;
  model?: string;
  comment: string;
  reviewer: string;
  location: string;
  rating: number;
  verified: boolean;
}

// Customer reviews data - please paste your review content here
const customerReviews: CustomerReview[] = [
  // Reviews will be added here
  {
    hp: 15,
    comment: "Pushes my little Princecraft around Rice Lake no problem. Quiet enough that I don't scare the fish.",
    reviewer: "Mike Thompson",
    location: "Rice Lake, ON",
    rating: 5,
    verified: true
  },
  // Add more reviews here...
];

export function getReviewsForMotor(hp: number, model?: string): CustomerReview[] {
  return customerReviews.filter(review => {
    // Match exact HP first
    if (review.hp === hp) return true;
    
    // Match HP range for similar motors
    const hpDiff = Math.abs(review.hp - hp);
    if (hpDiff <= 5) return true;
    
    return false;
  });
}

export function getAverageRating(hp: number, model?: string): number {
  const reviews = getReviewsForMotor(hp, model);
  if (reviews.length === 0) return 5; // Default to 5 stars if no reviews
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round(totalRating / reviews.length);
}

export function getReviewCount(hp: number, model?: string): number {
  return getReviewsForMotor(hp, model).length;
}