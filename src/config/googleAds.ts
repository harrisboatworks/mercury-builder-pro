/**
 * Google Ads conversion config. Labels are created in the Ads account; until a
 * label is filled in, the matching Ads conversion call is skipped silently.
 */
export const GOOGLE_ADS_ID = 'AW-881387895';

// Preview builds also use production mode. Match the exact live origins so
// local and preview quote tests cannot enter the production Ads actions.
export function isGoogleAdsProductionOrigin(
  origin = typeof window === 'undefined' ? '' : window.location.origin,
): boolean {
  return origin === 'https://www.mercuryrepower.ca' || origin === 'https://mercuryrepower.ca';
}

export const GOOGLE_ADS_CONVERSION_LABELS = {
  quote_review: 'iKP2CM_U5Z4dEPfSo6QD',
  quote_saved_email: 'cSAFCMrV5Z4dEPfSo6QD',
} as const;

export type LeadConversionType = keyof typeof GOOGLE_ADS_CONVERSION_LABELS;
