/**
 * Manual mapping between French blog post slugs and their nearest English
 * equivalent slug. Only includes pairs where an English article actually
 * exists in `blogArticles.ts`. French posts without an entry here have no
 * English equivalent — hreflang must not fake an alternate.
 */
export const FR_TO_EN_SLUG: Record<string, string> = {
  'prix-remotorisation-mercury-ontario': 'mercury-repower-cost-ontario-2026-cad',
  'mercury-115-vs-150-hp-comparaison': 'mercury-115-vs-150-hp-outboard-ontario',
  'hivernisation-moteur-mercury-ontario': 'diy-mercury-outboard-winterization-guide',
  'remotorisation-vs-bateau-neuf': 'boat-repowering-guide-when-to-replace-motor',
  'mercury-hors-bord-ne-demarre-pas-depannage': 'mercury-outboard-wont-start-troubleshooting-ontario',
  'surchauffe-moteur-mercury-guide-urgence': 'mercury-outboard-overheating-at-idle-fix-ontario',
  'entretien-remorque-bateau-ontario': 'boat-trailer-maintenance-guide-ontario',
  'guide-assurance-bateau-ontario-2026': 'boat-insurance-ontario-guide-2026',
  'garantie-prolongee-mercury-platinum-ontario': 'mercury-extended-warranty-platinum-ontario',
  'gamme-mercury-hors-bord-2026-ontario': 'mercury-2026-outboard-lineup-ontario',
};

export const EN_TO_FR_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(FR_TO_EN_SLUG).map(([fr, en]) => [en, fr]),
);
