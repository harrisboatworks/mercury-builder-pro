import { getReviewsForMotor, getRandomReview, getAllMercuryReviews, type CustomerReview } from './data/mercury-reviews';

interface ReviewRotationOptions {
  motorHP: number;
  motorModel?: string;
  modalOpenCount?: number;
}

/**
 * Smart review rotation system for motor detail modals
 * - 80% chance for exact HP matches, 20% for generic reviews
 * - Reviews with personal mentions appear 10% of the time
 * - Uses date + motorHP as seed for daily consistency
 * - Tracks rotation state in localStorage
 */
export class SmartReviewRotation {
  private static readonly STORAGE_KEY = 'hbw_review_rotation';
  private static readonly PERSONAL_MENTION_CHANCE = 0.1;
  private static readonly EXACT_HP_CHANCE = 0.8;

  /**
   * Get a smart-selected review for a motor
   */
  static getSmartReview({ motorHP, motorModel }: ReviewRotationOptions): CustomerReview | null {
    try {
      // Create daily seed based on date + motor HP for consistency
      const today = new Date().toDateString();
      const seed = this.createSeed(today + motorHP);
      
      // Get rotation state from localStorage
      const rotationState = this.getRotationState();
      const motorKey = `${motorHP}_${motorModel || 'default'}`;
      
      // Check if we need to rotate for this motor today
      const lastViewDate = rotationState[motorKey]?.lastViewDate;
      const shouldRotate = lastViewDate !== today;
      
      if (shouldRotate) {
        // Select new review using smart logic
        const selectedReview = this.selectReviewWithLogic(motorHP, seed, motorModel);
        
        // Update rotation state
        rotationState[motorKey] = {
          lastViewDate: today,
          selectedReview,
          viewCount: (rotationState[motorKey]?.viewCount || 0) + 1
        };
        
        this.saveRotationState(rotationState);
        return selectedReview;
      }
      
      // Return cached review for today
      return rotationState[motorKey]?.selectedReview || this.selectReviewWithLogic(motorHP, seed, motorModel);
      
    } catch (error) {
      console.warn('Smart review rotation failed, falling back to simple selection:', error);
      return getRandomReview(motorHP, motorModel);
    }
  }

  /**
   * Select review using weighted logic
   */
  private static selectReviewWithLogic(motorHP: number, seed: number, motorModel?: string): CustomerReview | null {
    const exactMatches = getReviewsForMotor(motorHP, motorModel);
    const allReviews = getAllMercuryReviews();
    
    // Filter out reviews with personal mentions for separate handling
    const personalMentionReviews = allReviews.filter(review => 
      /\b(mary|jay|jim|george|art foster|bill|betty|ron walsh|walt|bud)\b/i.test(review.comment) ||
      /shop guys|harris team|the guys at harris|shop boys|shop crew|service guys|mechanics/i.test(review.comment)
    );
    
    const regularExactMatches = exactMatches.filter(review => 
      !personalMentionReviews.some(pr => pr === review)
    );
    
    const genericReviews = allReviews.filter(review => 
      review.comment.toLowerCase().includes('harris') && 
      review.comment.toLowerCase().includes('years') &&
      !personalMentionReviews.some(pr => pr === review) &&
      !exactMatches.some(em => em === review)
    );

    // Use seeded random for consistent daily selection
    const random1 = this.seededRandom(seed);
    const random2 = this.seededRandom(seed + 1);
    const random3 = this.seededRandom(seed + 2);

    // 10% chance for personal mention reviews
    if (random1 < this.PERSONAL_MENTION_CHANCE && personalMentionReviews.length > 0) {
      const index = Math.floor(random2 * personalMentionReviews.length);
      return personalMentionReviews[index];
    }

    // 80% chance for exact HP matches (if available)
    if (random2 < this.EXACT_HP_CHANCE && regularExactMatches.length > 0) {
      const index = Math.floor(random3 * regularExactMatches.length);
      return regularExactMatches[index];
    }

    // 20% chance for generic family/tradition reviews
    if (genericReviews.length > 0) {
      const index = Math.floor(random3 * genericReviews.length);
      return genericReviews[index];
    }

    // Fallback to any exact match
    if (exactMatches.length > 0) {
      const index = Math.floor(random3 * exactMatches.length);
      return exactMatches[index];
    }

    return null;
  }

  /**
   * Create a numeric seed from a string
   */
  private static createSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Seeded random number generator (LCG algorithm)
   */
  private static seededRandom(seed: number): number {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    seed = (a * seed + c) % m;
    return seed / m;
  }

  /**
   * Get rotation state from localStorage
   */
  private static getRotationState(): Record<string, {
    lastViewDate: string;
    selectedReview: CustomerReview | null;
    viewCount: number;
  }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save rotation state to localStorage
   */
  private static saveRotationState(state: Record<string, {
    lastViewDate: string;
    selectedReview: CustomerReview | null;
    viewCount: number;
  }>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save review rotation state:', error);
    }
  }

  /**
   * Clear rotation state (for testing/admin purposes)
   */
  static clearRotationState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear review rotation state:', error);
    }
  }
}

/**
 * Hook-like function for React components
 */
export function useSmartReviewRotation(motorHP: number, motorModel?: string): CustomerReview | null {
  return SmartReviewRotation.getSmartReview({ motorHP, motorModel });
}