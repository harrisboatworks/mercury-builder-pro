export interface CustomerReview {
  motorHP: number;
  motorModel?: string;
  comment: string;
  reviewer: string;
  location: string;
  rating: number;
  verified: boolean;
  date?: string;
}

// Original reviews
const mercuryReviews: CustomerReview[] = [
  {
    motorHP: 15,
    comment: "Pushes my little Princecraft around Rice Lake no problem. Quiet enough that I don't scare the fish.",
    reviewer: "Mike Thompson",
    location: "Rice Lake, ON",
    rating: 5,
    verified: true
  }
];

// Expanded customer reviews
export const mercuryReviewsExpanded: CustomerReview[] = [
  {
    motorHP: 115,
    rating: 5,
    reviewer: "Tony Russo",
    location: "Oshawa, ON",
    date: "2024-08-12",
    comment: "My dad bought his first Merc from Harris in 1971. Still go there. This 115 is solid, runs all day on Lake Ontario no issues",
    verified: true
  },
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Karen Mitchell",
    location: "Oshawa",
    date: "2024-07-20",
    comment: "harris always treats us good. third motor from them. this 50 is perfect for our pontoon",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Jim Crawford",
    location: "Peterborough, ON",
    date: "2024-09-05",
    comment: "Been dealing with Harris since the 80s. They know their stuff. Motor runs like a top on Little Lake.",
    verified: true
  },
  {
    motorHP: 150,
    rating: 5,
    reviewer: "Derek Thompson",
    location: "Whitby, ON",
    date: "2024-08-28",
    comment: "Drive past 3 dealers to get to Harris. Worth it. The 150 Pro XS is a beast. they set it up perfect",
    verified: true
  }
];

const gtaChineseReviews: CustomerReview[] = [
  {
    motorHP: 150,
    rating: 5,
    reviewer: "Kevin Zhang",
    location: "Markham, ON",
    date: "2024-08-15",
    comment: "Drove from Markham to Harris because they have the best service. Worth the drive. 150hp perfect for Lake Simcoe fishing",
    verified: true
  }
];

const americanFishingReviews: CustomerReview[] = [
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Bill Kowalski",
    location: "Grayling, Michigan",
    date: "2024-08-20",
    comment: "Been coming up to Rice Lake since 1978. Jim treated us great for years, now Jay does. 50hp runs perfect",
    verified: true
  }
];

// Combine all reviews
const allMercuryReviews: CustomerReview[] = [...mercuryReviews, ...mercuryReviewsExpanded, ...gtaChineseReviews, ...americanFishingReviews];

// Export functions
export { mercuryReviews, gtaChineseReviews, americanFishingReviews };
export const getAllMercuryReviews = (): CustomerReview[] => allMercuryReviews;

export function getReviewsForMotor(hp: number, model?: string): CustomerReview[] {
  return allMercuryReviews.filter(review => {
    if (review.motorHP !== hp) return false;
    if (model && review.motorModel && !model.includes(review.motorModel)) return false;
    return true;
  });
}

export function getRandomReview(hp: number, model?: string): CustomerReview | undefined {
  const reviews = getReviewsForMotor(hp, model);
  if (reviews.length === 0) {
    const genericReviews = allMercuryReviews.filter(r => 
      r.comment.toLowerCase().includes('harris') && 
      r.comment.toLowerCase().includes('years')
    );
    return genericReviews[Math.floor(Math.random() * genericReviews.length)];
  }
  return reviews[Math.floor(Math.random() * reviews.length)];
}

export function getAverageRating(hp: number, model?: string): number {
  const reviews = getReviewsForMotor(hp, model);
  if (reviews.length === 0) return 5;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round(totalRating / reviews.length);
}

export function getReviewCount(hp: number, model?: string): number {
  return getReviewsForMotor(hp, model).length;
}