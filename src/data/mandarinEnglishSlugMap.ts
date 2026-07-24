/**
 * Mandarin articles with a genuine English equivalent. Topic-adjacent pages
 * are intentionally omitted: hreflang is for translations/equivalents, not
 * general related reading.
 */
export const ZH_TO_EN_SLUG: Record<string, string> = {
  'mercury-115-vs-150-comparison-zh': 'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026',
  'mercury-fourstroke-pro-xs-verado-chinese-comparison': 'fourstroke-vs-pro-xs',
};

export const EN_TO_ZH_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(ZH_TO_EN_SLUG).map(([zh, en]) => [en, zh]),
);
