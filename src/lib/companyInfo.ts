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
    website: "mercuryrepower.ca"
  },
  branding: {
    primaryColor: "#007DC5", // Mercury Blue
    secondaryColor: "#1e40af" // Navy Blue
  }
} as const;

export type CompanyInfo = typeof COMPANY_INFO;

/**
 * Verified external profiles for the Harris Boat Works LocalBusiness entity.
 * Used in every LocalBusiness JSON-LD sameAs block across the site so search
 * engines can reconcile the business identity. Keep HTTPS, no trailing commas,
 * no duplicates.
 */
export const BUSINESS_SAME_AS = [
  "https://www.harrisboatworks.ca/",
  "https://www.facebook.com/harrisboatworks",
  "https://www.instagram.com/harrisboatworks",
  "https://www.youtube.com/@HarrisBoatWorks",
  "https://g.page/harrisboatworks",
  "https://www.wikidata.org/wiki/Q139910292",
  "https://x.com/HarrisBoatWorks",
  "https://www.yelp.ca/biz/harris-boat-works-gores-landing",
  "https://www.tripadvisor.ca/Attraction_Review-g670874-d15017131-Reviews-Harris_Boat_Works-Gores_Landing_Ontario.html",
  "https://directory.northumberlandtourism.com/Home/View/harris-boat-works-ltd"
] as const;