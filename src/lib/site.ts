// src/lib/site.ts
// Production URL for QR codes and public links
// Prioritizes: VITE_SITE_URL env var → hardcoded production domain → window.location.origin
export const SITE_URL =
  (import.meta as any).env?.VITE_SITE_URL || 
  'https://mercuryrepower.ca';
