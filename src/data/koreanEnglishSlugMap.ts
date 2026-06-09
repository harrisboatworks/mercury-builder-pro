/**
 * Manual mapping between Korean blog post slugs and their nearest English
 * equivalent slug. Only includes pairs where an English article actually
 * exists in `blogArticles.ts`. Korean posts without an entry here have no
 * English equivalent and hreflang must not fake an alternate.
 */
export const KO_TO_EN_SLUG: Record<string, string> = {
  'mercury-avator-jeondong-seonoegi': 'mercury-avator-electric-boating-ontario',
  'mercury-pro-xs-fourstroke-verado': 'fourstroke-vs-pro-xs',
  'mercury-seonoegi-muge': 'mercury-outboard-weight-chart',
};

export const EN_TO_KO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(KO_TO_EN_SLUG).map(([ko, en]) => [en, ko]),
);
