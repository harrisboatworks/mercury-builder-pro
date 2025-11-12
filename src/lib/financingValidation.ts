import { z } from 'zod';
import { formatPhoneNumber } from './validation';

// Helper to validate Canadian SIN format (XXX-XXX-XXX)
export const sinSchema = z.string()
  .regex(/^\d{3}-?\d{3}-?\d{3}$/, 'Please enter a valid 9-digit SIN')
  .transform(val => val.replace(/\D/g, '')) // Strip formatting
  .refine(val => val.length === 9, 'SIN must be 9 digits');

// Helper to validate Canadian postal code (A1A 1A1)
export const postalCodeSchema = z.string()
  .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Please enter a valid postal code (e.g., A1A 1A1)')
  .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, ''));

// Helper for phone numbers
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[\+]?[1-9][\d]{9,14}$/, 'Please enter a valid phone number')
  .transform(formatPhoneNumber);

// Step 1: Purchase Details
export const purchaseDetailsSchema = z.object({
  motorModel: z.string().min(1, 'Motor model is required'),
  motorPrice: z.number().min(0, 'Motor price must be positive'),
  downPayment: z.number().min(0, 'Down payment cannot be negative'),
  tradeInValue: z.number().min(0, 'Trade-in value cannot be negative').optional(),
  amountToFinance: z.number().min(1, 'Amount to finance must be at least $1'),
  preferredTerm: z.enum(['36', '48', '60', '72', '84', '120', '180']).optional(),
});

// Step 2: Primary Applicant
export const applicantSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  suffix: z.enum(['Jr.', 'Sr.', 'II', 'III', 'IV', '']).optional(),
  dateOfBirth: z.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .refine(date => {
      const age = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return age >= 18;
    }, 'You must be at least 18 years old'),
  sin: sinSchema,
  email: z.string().email('Please enter a valid email').max(255),
  primaryPhone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  currentAddress: z.object({
    street: z.string().min(5, 'Street address is required').max(200),
    city: z.string().min(2, 'City is required').max(100),
    province: z.string().min(2, 'Province is required'),
    postalCode: postalCodeSchema,
    timeAtAddress: z.enum(['<1', '1-2', '2-3', '3-5', '5+']),
  }),
  previousAddress: z.object({
    street: z.string().max(200),
    city: z.string().max(100),
    province: z.string(),
    postalCode: postalCodeSchema,
    timeAtAddress: z.enum(['<1', '1-2', '2-3', '3-5', '5+']),
  }).optional(),
  housingStatus: z.enum(['own', 'rent', 'family', 'other']),
  monthlyHousingPayment: z.number().min(0, 'Housing payment cannot be negative'),
});

// Step 3: Employment
export const employmentSchema = z.object({
  status: z.enum(['employed', 'self_employed', 'retired', 'other']),
  employerName: z.string().min(2, 'Employer name is required').max(100).optional(),
  employerPhone: phoneSchema.optional(),
  jobTitle: z.string().min(2, 'Job title is required').max(100).optional(),
  timeAtJob: z.enum(['<1', '1-2', '2-3', '3-5', '5+']).optional(),
  annualIncome: z.number().min(0, 'Annual income cannot be negative'),
  previousEmployer: z.object({
    name: z.string().max(100),
    timeAtJob: z.enum(['<1', '1-2', '2-3', '3-5', '5+']),
  }).optional(),
  additionalIncome: z.array(z.object({
    source: z.string().max(100),
    monthlyAmount: z.number().min(0),
  })).optional(),
}).refine(data => {
  // If employed or self-employed, employer details are required
  if (data.status === 'employed' || data.status === 'self_employed') {
    return data.employerName && data.employerPhone && data.jobTitle && data.timeAtJob;
  }
  return true;
}, {
  message: 'Employer details are required for employed/self-employed applicants',
});

// Step 4: Financial Information
export const financialSchema = z.object({
  creditScoreEstimate: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']),
  monthlyHousingPayment: z.number().min(0),
  monthlyCarPayment: z.number().min(0).optional(),
  monthlyCreditCardPayments: z.number().min(0).optional(),
  otherMonthlyDebt: z.number().min(0).optional(),
  bankName: z.string().min(2, 'Bank name is required').max(100),
  accountType: z.enum(['chequing', 'savings']),
  timeWithBank: z.enum(['<1', '1-3', '3-5', '5+']),
  hasBankruptcy: z.boolean(),
  bankruptcyDetails: z.object({
    date: z.date(),
    status: z.enum(['discharged', 'active']),
  }).optional(),
}).refine(data => {
  // If bankruptcy declared, details are required
  if (data.hasBankruptcy) {
    return data.bankruptcyDetails !== undefined;
  }
  return true;
}, {
  message: 'Bankruptcy details are required if bankruptcy is declared',
});

// Step 5: Co-Applicant (all fields optional as entire step is optional)
// We create a combined schema without the refinements to avoid ZodEffects issues
const coApplicantBaseSchema = z.object({
  // Applicant fields
  firstName: z.string().min(2).max(50).optional(),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  suffix: z.enum(['Jr.', 'Sr.', 'II', 'III', 'IV', '']).optional(),
  dateOfBirth: z.date().optional(),
  sin: z.string().optional(),
  email: z.string().email().max(255).optional(),
  primaryPhone: z.string().optional(),
  alternatePhone: z.string().optional(),
  currentAddress: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    timeAtAddress: z.enum(['<1', '1-2', '2-3', '3-5', '5+']).optional(),
  }).optional(),
  previousAddress: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    timeAtAddress: z.enum(['<1', '1-2', '2-3', '3-5', '5+']).optional(),
  }).optional(),
  housingStatus: z.enum(['own', 'rent', 'family', 'other']).optional(),
  monthlyHousingPayment: z.number().min(0).optional(),
  // Employment fields
  status: z.enum(['employed', 'self_employed', 'retired', 'other']).optional(),
  employerName: z.string().min(2).max(100).optional(),
  employerPhone: z.string().optional(),
  jobTitle: z.string().min(2).max(100).optional(),
  timeAtJob: z.enum(['<1', '1-2', '2-3', '3-5', '5+']).optional(),
  annualIncome: z.number().min(0).optional(),
  previousEmployer: z.object({
    name: z.string().max(100).optional(),
    timeAtJob: z.enum(['<1', '1-2', '2-3', '3-5', '5+']).optional(),
  }).optional(),
  additionalIncome: z.array(z.object({
    source: z.string().max(100).optional(),
    monthlyAmount: z.number().min(0).optional(),
  })).optional(),
  // Financial fields
  creditScoreEstimate: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),
  monthlyCarPayment: z.number().min(0).optional(),
  monthlyCreditCardPayments: z.number().min(0).optional(),
  otherMonthlyDebt: z.number().min(0).optional(),
  bankName: z.string().min(2).max(100).optional(),
  accountType: z.enum(['chequing', 'savings']).optional(),
  timeWithBank: z.enum(['<1', '1-3', '3-5', '5+']).optional(),
  hasBankruptcy: z.boolean().optional(),
  bankruptcyDetails: z.object({
    date: z.date().optional(),
    status: z.enum(['discharged', 'active']).optional(),
  }).optional(),
});

export const coApplicantSchema = coApplicantBaseSchema;

// Step 6: References
export const referenceSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  relationship: z.string().min(2, 'Relationship is required'),
  phone: phoneSchema,
  howLongKnown: z.enum(['<1', '1-3', '3-5', '5-10', '10+']),
});

export const referencesSchema = z.object({
  reference1: referenceSchema,
  reference2: referenceSchema,
}).refine(data => {
  // Ensure references are different people (basic check)
  return data.reference1.phone !== data.reference2.phone;
}, {
  message: 'References must be different people',
});

// Step 7: Review & Consent
export const consentSchema = z.object({
  creditCheckConsent: z.boolean().refine(val => val === true, 'You must authorize credit check'),
  accuracyConfirmation: z.boolean().refine(val => val === true, 'You must confirm information accuracy'),
  termsAgreement: z.boolean().refine(val => val === true, 'You must agree to terms and privacy policy'),
  signature: z.string().min(2, 'Please type your full name to sign'),
  signatureDate: z.date(),
});

// Complete application schema (for final submission)
export const completeApplicationSchema = z.object({
  purchaseDetails: purchaseDetailsSchema,
  applicant: applicantSchema,
  employment: employmentSchema,
  financial: financialSchema,
  coApplicant: coApplicantSchema.optional(),
  references: referencesSchema,
  consent: consentSchema,
});

export type PurchaseDetails = z.infer<typeof purchaseDetailsSchema>;
export type Applicant = z.infer<typeof applicantSchema>;
export type Employment = z.infer<typeof employmentSchema>;
export type Financial = z.infer<typeof financialSchema>;
export type CoApplicant = z.infer<typeof coApplicantSchema>;
export type References = z.infer<typeof referencesSchema>;
export type Consent = z.infer<typeof consentSchema>;
export type CompleteApplication = z.infer<typeof completeApplicationSchema>;
