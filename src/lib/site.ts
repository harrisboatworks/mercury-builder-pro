// src/lib/site.ts
// Works in Vite/React. Reads your Vercel env var and falls back to the current origin.
export const SITE_URL =
  (import.meta as any).env?.VITE_SITE_URL || window.location.origin;
