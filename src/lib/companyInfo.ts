/**
 * Company Information Constants
 * Centralized contact information for Harris Boat Works
 */

import googlePlaces from '@/data/google-places-cache.json';

const placesLatitude = Number(googlePlaces.location?.latitude);
const placesLongitude = Number(googlePlaces.location?.longitude);

/** Canonical local-search pin, refreshed from the Google Business Profile at build time. */
export const BUSINESS_GEO = {
  latitude: Number.isFinite(placesLatitude) ? placesLatitude : 44.121684,
  longitude: Number.isFinite(placesLongitude) ? placesLongitude : -78.241502,
} as const;

export const BUSINESS_COORDINATES_TEXT = `${BUSINESS_GEO.latitude}, ${BUSINESS_GEO.longitude}`;

export const COMPANY_INFO = {
  name: "Harris Boat Works",
  tagline: "Go Boldly - Authorized Mercury Marine Dealer",
  address: {
    street: "5369 Harris Boat Works Rd",
    city: "Gores Landing", 
    province: "ON",
    postal: "K0K 2E0",
    full: "5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0",
    geo: BUSINESS_GEO,
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
