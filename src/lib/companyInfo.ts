/**
 * Company Information Constants
 * Centralized contact information for Harris Boat Works
 */

export const COMPANY_INFO = {
  name: "Harris Boat Works",
  tagline: "Go Boldly - Authorized Mercury Marine Dealer",
  address: {
    street: "5369 Harris Boat Works Rd",
    city: "Gores Landing", 
    province: "ON",
    postal: "K0K 2E0",
    full: "5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0"
  },
  contact: {
    phone: "(905) 342-2153",
    sms: "(647) 952-2153",
    email: "info@harrisboatworks.ca",
    website: "quote.harrisboatworks.ca"
  },
  branding: {
    primaryColor: "#007DC5", // Mercury Blue
    secondaryColor: "#1e40af" // Navy Blue
  }
} as const;

export type CompanyInfo = typeof COMPANY_INFO;