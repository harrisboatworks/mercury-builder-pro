/** Spanish articles with a verified English equivalent. */
export const ES_TO_EN_SLUG: Record<string, string> = {
  'preparacion-invernal-motor-mercury': 'diy-mercury-outboard-winterization-guide',
  'mercury-115-vs-150-comparacion': 'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026',
  'remotorizacion-vs-bote-nuevo': 'repower-vs-new-boat',
};

export const EN_TO_ES_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(ES_TO_EN_SLUG).map(([es, en]) => [en, es]),
);
