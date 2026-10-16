/**
 * Google Ads conversion config. Labels are created in the Ads account; until a
 * label is filled in, the matching Ads conversion call is skipped silently.
 */
export const GOOGLE_ADS_ID = 'AW-881387895';

export const GOOGLE_ADS_CONVERSION_LABELS = {
  quote_review: '',
  quote_saved_email: '',
} as const;

export type LeadConversionType = keyof typeof GOOGLE_ADS_CONVERSION_LABELS;
