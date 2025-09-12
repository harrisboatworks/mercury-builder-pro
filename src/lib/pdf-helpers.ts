import { mercuryMotorsData, type MercuryMotor } from './data/mercury-motors';
import { mercuryReviewsExpanded, type CustomerReview } from './data/mercury-reviews';
import { calculateMonthlyPayment } from './finance';
import type { PdfQuoteData } from './pdf-generator';

/**
 * Find motor specifications by HP and model
 */
export const findMotorSpecs = (hp: number, model: string): MercuryMotor | null => {
  const allMotors = [
    ...mercuryMotorsData.verado,
    ...mercuryMotorsData.pro_xs,
    ...mercuryMotorsData.fourstroke
  ];
  
  return allMotors.find(motor => 
    motor.hp === hp && motor.model.toLowerCase().includes(model.toLowerCase())
  ) || null;
};

/**
 * Get a relevant customer review for the motor
 */
export const getRelevantReview = (hp: number): CustomerReview | null => {
  // Find reviews for the exact HP
  let relevantReviews = mercuryReviewsExpanded.filter(review => review.motorHP === hp);
  
  // If no exact match, find reviews for similar HP range
  if (relevantReviews.length === 0) {
    const hpRange = 25; // ±25 HP range
    relevantReviews = mercuryReviewsExpanded.filter(review => 
      Math.abs(review.motorHP - hp) <= hpRange
    );
  }
  
  // If still no match, get any high-rated review
  if (relevantReviews.length === 0) {
    relevantReviews = mercuryReviewsExpanded.filter(review => review.rating >= 5);
  }
  
  // Return a random review from the filtered list
  if (relevantReviews.length > 0) {
    const randomIndex = Math.floor(Math.random() * relevantReviews.length);
    return relevantReviews[randomIndex];
  }
  
  return null;
};

/**
 * Generate quote number from timestamp for new quotes
 */
export const generateQuoteNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  // Generate a number like: 240125 + hour + minute = 24012514:30 becomes 2401251430
  const quoteNumber = parseInt(`${year.toString().slice(-2)}${month}${day}${hour}${minute}`);
  
  // Ensure it's at least 6 digits
  return String(Math.max(quoteNumber, 100000));
};

/**
 * Enhanced PDF data builder with all features
 */
export const buildEnhancedPdfData = (
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  motor: any,
  pricing: any,
  quoteNumber?: string | number
): PdfQuoteData => {
  // Generate quote number if not provided
  const finalQuoteNumber = quoteNumber || generateQuoteNumber();
  
  // Find detailed motor specifications
  const motorSpecs = findMotorSpecs(motor.hp, motor.model);
  
  // Get a relevant customer review
  const customerReview = getRelevantReview(motor.hp);
  
  // Calculate financing options
  const financing = calculateMonthlyPayment(pricing.totalCashPrice);
  
  // Build accessories list (placeholder - would need to come from quote data)
  const accessories: Array<{ name: string; price: number }> = [];
  
  // Build the enhanced PDF data
  const pdfData: PdfQuoteData = {
    quoteNumber: finalQuoteNumber,
    customerName,
    customerEmail,
    customerPhone,
    motor: {
      model: motor.model,
      hp: motor.hp,
      year: motor.year,
      sku: motor.sku,
      category: motorSpecs?.category
    },
    motorSpecs: motorSpecs ? {
      cylinders: motorSpecs.cylinders,
      displacement: motorSpecs.displacement,
      weight_kg: motorSpecs.weight_kg,
      fuel_system: motorSpecs.fuel_system,
      starting: motorSpecs.starting,
      alternator: motorSpecs.alternator,
      gear_ratio: motorSpecs.gear_ratio,
      max_rpm: motorSpecs.max_rpm
    } : undefined,
    pricing,
    accessories: accessories.length > 0 ? accessories : undefined,
    financing: {
      monthlyPayment: financing.payment,
      term: financing.termMonths,
      rate: financing.rate
    },
    customerReview: customerReview ? {
      comment: customerReview.comment,
      reviewer: customerReview.reviewer,
      location: customerReview.location,
      rating: customerReview.rating
    } : undefined
  };
  
  return pdfData;
};