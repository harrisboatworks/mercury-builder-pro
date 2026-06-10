/**
 * Blog Topic Clusters — single source of truth for "Related guides" wiring.
 *
 * Used by:
 *   - Authoring scripts that inject `## Related guides` H2 lists into article markdown
 *   - The opt-in <RelatedGuides /> React component
 *   - Future internal-link audits / sitemap weighting
 *
 * Conventions:
 *   - Every article belongs to exactly one cluster (its "primary" cluster)
 *   - Each cluster has 1 pillar (most authoritative) and N spokes
 *   - `context` is a short clause used after each Related-guides bullet
 *
 * If you add a new article, add its slug to a cluster below AND add a
 * one-line `context` entry. Build will not fail if you forget, but the
 * Related guides bullet will fall back to using just the title.
 */

export type ClusterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface BlogCluster {
  id: ClusterId;
  name: string;
  pillar: string;          // slug
  spokes: string[];        // slugs
}

export const blogClusters: BlogCluster[] = [
  {
    id: 1,
    name: 'Repower & Cost',
    pillar: 'complete-guide-boat-repower-kawarthas',
    spokes: [
      'mercury-repower-cost-ontario-2026-cad',
      'boat-repowering-guide-when-to-replace-motor',
      'ontario-cottage-boat-motor-repower-guide',
      'evinrude-to-mercury-repower-ontario-guide',
      'winter-repower-planning-guide',
      'boat-hull-replacement-vs-repower-decision',
      'pleasure-craft-licence-update-repower-ontario',
      'mercury-ordering-process',
      'year-end-boat-motor-buying-guide',
    ],
  },
  {
    id: 2,
    name: 'Financing & Pricing',
    pillar: 'mercury-outboard-financing-ontario-2026',
    spokes: [
      'boat-motor-financing-guide-ontario',
      'mercury-pricing-promotions-2026',
      'cheapest-mercury-outboard-canada-2026',
      '2026-boating-market-ontario-boat-buyers',
    ],
  },
  {
    id: 3,
    name: 'Buying — Motor Sizing & Selection',
    pillar: 'how-to-choose-right-horsepower-boat',
    spokes: [
      'boat-motor-size-calculator-guide',
      'mercury-75-vs-90-vs-115-comparison',
      'mercury-115-vs-150-hp-outboard-ontario',
      'mercury-150-300hp-pro-xs-performance-guide',
      'mercury-v8-outboard-comparison',
      'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
      'understanding-mercury-model-numbers',
      'portable-outboard-mercury-guide-2-20hp',
      'tiller-vs-remote-steering-outboard-guide',
      'new-vs-used-outboard-motor-guide',
      'pre-owned-mercury-what-to-check',
    ],
  },
  {
    id: 4,
    name: 'Buying — Boat-Type Specific',
    pillar: 'best-mercury-outboard-aluminum-fishing-boats',
    spokes: [
      'best-mercury-outboard-pontoon-boats',
      'bass-boat-mercury-motor-buying-guide',
      'center-console-mercury-motor-guide',
      'best-mercury-for-family-runabouts',
      'best-mercury-for-ski-wakeboard-boats',
      'mercury-seapro-commercial-outboard-guide',
      'electric-trolling-motor-kicker-guide',
      'best-boats-rice-lake-under-30000',
      'is-2026-good-year-to-buy-boat-canada',
      'mercury-avator-electric-boating-ontario',
    ],
  },
  {
    id: 5,
    name: 'Local Knowledge & Fishing',
    pillar: 'best-mercury-outboard-rice-lake-fishing',
    spokes: [
      'best-mercury-outboard-lake-simcoe-walleye-fishing',
      'best-mercury-outboard-lake-ontario-salmon-trout',
      'musky-boat-motor-guide-kawarthas',
      'mercury-prokicker-rice-lake-fishing-guide',
      'best-motor-small-lakes-ontario',
      '2026-rice-lake-fishing-season-outlook',
      'trailer-boat-toronto-to-rice-lake-guide',
    ],
  },
  {
    id: 6,
    name: 'Maintenance, Service & Seasonal',
    pillar: 'mercury-service-schedule-complete-guide',
    spokes: [
      'mercury-motor-maintenance-seasonal-tips',
      'spring-outboard-commissioning-checklist',
      'outboard-motor-storage-tips',
      'fall-winterization-guide-complete',
      'diy-mercury-outboard-winterization-guide',
      'boat-winterization-cost-ontario-2026',
      'breaking-in-new-mercury-motor-guide',
      'walleye-opener-boat-prep',
      'late-season-boating-safety',
      'ontario-boating-season-tips',
    ],
  },
  {
    id: 7,
    name: 'Performance, Tech & Troubleshooting',
    pillar: 'mercury-propeller-selection-guide',
    spokes: [
      'mercury-outboard-fuel-efficiency-guide',
      'mercury-smartcraft-gauges-guide',
      'mercury-digital-throttle-shift-guide',
      'mercury-boost-software-upgrade-eligibility-2026',
      'mercury-boost-upgrade-150hp-pontoon-analysis',
      'mercury-warranty-what-you-need-to-know',
      'boat-motor-trade-in-guide',
      'mercury-outboard-wont-start-troubleshooting',
      'troubleshooting-outboard-overheating',
    ],
  },
  {
    id: 8,
    name: 'Brand Story, Comparisons & Market',
    pillar: 'why-mercury-dominates-outboard-market',
    spokes: [
      'why-harris-boat-works-mercury-dealer',
      'mercury-vs-yamaha-outboards-ontario',
      'mercury-vs-yamaha-vs-honda-reliability-2026',
      '2026-mercury-model-preview',
      'mercury-2026-outboard-lineup-ontario',
      'tariffs-trade-canadian-boating-2026',
      'boat-rentals-shared-access-booming-2026',
    ],
  },
];

/** Short context clause appended to each Related-guides bullet. */
export const blogClusterContexts: Record<string, string> = {
  // Cluster 1
  'complete-guide-boat-repower-kawarthas': 'the full Kawarthas repower playbook',
  'mercury-repower-cost-ontario-2026-cad': 'transparent 2026 CAD repower pricing',
  'boat-repowering-guide-when-to-replace-motor': "how to know it's time to replace your motor",
  'ontario-cottage-boat-motor-repower-guide': 'cottage-specific repower considerations',
  'evinrude-to-mercury-repower-ontario-guide': 'switching from Evinrude to Mercury',
  'winter-repower-planning-guide': 'why winter is the smart time to plan',
  'boat-hull-replacement-vs-repower-decision': 'repower the motor or replace the boat?',
  'pleasure-craft-licence-update-repower-ontario': 'updating your PCL after a repower',
  'mercury-ordering-process': 'how Mercury motors are ordered and delivered',
  'year-end-boat-motor-buying-guide': 'year-end timing and incentives',
  // Cluster 2
  'mercury-outboard-financing-ontario-2026': 'current financing rates and terms',
  'boat-motor-financing-guide-ontario': 'financing basics for Ontario buyers',
  'mercury-pricing-promotions-2026': 'live 2026 promotions and rebates',
  'cheapest-mercury-outboard-canada-2026': 'lowest-cost Mercury models in Canada',
  '2026-boating-market-ontario-boat-buyers': 'what 2026 looks like for Ontario buyers',
  // Cluster 3
  'how-to-choose-right-horsepower-boat': 'matching HP to boat size and use',
  'boat-motor-size-calculator-guide': 'sizing calculator walkthrough',
  'mercury-75-vs-90-vs-115-comparison': 'mid-range Mercury head-to-head',
  'mercury-115-vs-150-hp-outboard-ontario': 'the 115 vs 150 decision',
  'mercury-150-300hp-pro-xs-performance-guide': 'V6 150–200 HP performance',
  'mercury-v8-outboard-comparison': 'V8 Mercury options compared',
  'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado': 'FourStroke vs Pro XS vs Verado families',
  'understanding-mercury-model-numbers': 'decoding Mercury model designations',
  'portable-outboard-mercury-guide-2-20hp': 'portable 2–20 HP options',
  'tiller-vs-remote-steering-outboard-guide': 'tiller vs remote steering',
  'new-vs-used-outboard-motor-guide': 'new vs used outboard tradeoffs',
  'pre-owned-mercury-what-to-check': 'used-Mercury inspection checklist',
  // Cluster 4
  'best-mercury-outboard-aluminum-fishing-boats': 'best Mercury for aluminum fishing boats',
  'best-mercury-outboard-pontoon-boats': 'best Mercury for pontoons',
  'bass-boat-mercury-motor-buying-guide': 'bass-boat motor selection',
  'center-console-mercury-motor-guide': 'center-console power picks',
  'best-mercury-for-family-runabouts': 'family-runabout recommendations',
  'best-mercury-for-ski-wakeboard-boats': 'ski and wakeboard motor picks',
  'mercury-seapro-commercial-outboard-guide': 'SeaPro commercial-duty guide',
  'electric-trolling-motor-kicker-guide': 'electric trolling and kicker setups',
  'best-boats-rice-lake-under-30000': 'top Rice Lake boats under $30K',
  'is-2026-good-year-to-buy-boat-canada': 'is 2026 the right year to buy?',
  'mercury-avator-electric-boating-ontario': 'Mercury Avator electric outboards',
  // Cluster 5
  'best-mercury-outboard-rice-lake-fishing': 'best Mercury for Rice Lake fishing',
  'best-mercury-outboard-lake-simcoe-walleye-fishing': 'Lake Simcoe walleye picks',
  'best-mercury-outboard-lake-ontario-salmon-trout': 'Lake Ontario salmon and trout setups',
  'musky-boat-motor-guide-kawarthas': 'musky-boat motor guide',
  'mercury-prokicker-rice-lake-fishing-guide': 'Pro Kicker on Rice Lake',
  'best-motor-small-lakes-ontario': 'best motor for small Ontario lakes',
  '2026-rice-lake-fishing-season-outlook': '2026 Rice Lake season outlook',
  'trailer-boat-toronto-to-rice-lake-guide': 'trailering from Toronto to Rice Lake',
  // Cluster 6
  'mercury-service-schedule-complete-guide': 'the full Mercury service schedule',
  'mercury-motor-maintenance-seasonal-tips': 'seasonal maintenance tips',
  'spring-outboard-commissioning-checklist': 'spring commissioning checklist',
  'outboard-motor-storage-tips': 'off-season storage tips',
  'fall-winterization-guide-complete': 'complete fall winterization',
  'diy-mercury-outboard-winterization-guide': 'DIY winterization steps',
  'boat-winterization-cost-ontario-2026': 'what winterization costs in Ontario',
  'breaking-in-new-mercury-motor-guide': 'breaking in a new Mercury',
  'walleye-opener-boat-prep': 'walleye-opener boat prep',
  'late-season-boating-safety': 'late-season safety tips',
  'ontario-boating-season-tips': 'Ontario boating-season tips',
  // Cluster 7
  'mercury-propeller-selection-guide': 'choosing the right propeller',
  'mercury-outboard-fuel-efficiency-guide': 'maximizing fuel efficiency',
  'mercury-smartcraft-gauges-guide': 'SmartCraft gauges explained',
  'mercury-digital-throttle-shift-guide': 'Digital Throttle & Shift basics',
  'mercury-boost-software-upgrade-eligibility-2026': 'Boost software upgrade eligibility',
  'mercury-boost-upgrade-150hp-pontoon-analysis': '150 HP Boost upgrade analysis',
  'mercury-warranty-what-you-need-to-know': 'Mercury warranty essentials',
  'boat-motor-trade-in-guide': 'trade-in valuation guide',
  'mercury-outboard-wont-start-troubleshooting': "won't-start troubleshooting",
  'troubleshooting-outboard-overheating': 'overheating troubleshooting',
  // Cluster 8
  'why-mercury-dominates-outboard-market': 'why Mercury leads the market',
  'why-harris-boat-works-mercury-dealer': 'why Harris Boat Works is Mercury',
  'mercury-vs-yamaha-outboards-ontario': 'Mercury vs Yamaha for Ontario',
  'mercury-vs-yamaha-vs-honda-reliability-2026': 'Mercury vs Yamaha vs Honda reliability',
  '2026-mercury-model-preview': 'preview of the 2026 Mercury models',
  'mercury-2026-outboard-lineup-ontario': '2026 Mercury lineup for Ontario',
  'tariffs-trade-canadian-boating-2026': 'tariffs and trade impact on boating',
  'boat-rentals-shared-access-booming-2026': 'rental and shared-access trends',
};

// Reverse lookup: slug -> cluster
const slugToClusterMap: Map<string, BlogCluster> = (() => {
  const m = new Map<string, BlogCluster>();
  for (const c of blogClusters) {
    m.set(c.pillar, c);
    for (const s of c.spokes) if (!m.has(s)) m.set(s, c);
  }
  return m;
})();

export function getClusterForSlug(slug: string): BlogCluster | undefined {
  return slugToClusterMap.get(slug);
}

/** Pick up to N sibling slugs for the given article (pillar always first). */
export function getRelatedSlugs(slug: string, max = 5): string[] {
  const cluster = getClusterForSlug(slug);
  if (!cluster) return [];
  const isPillar = cluster.pillar === slug;
  const out: string[] = [];
  if (!isPillar) out.push(cluster.pillar);
  for (const s of cluster.spokes) {
    if (s === slug) continue;
    if (s === cluster.pillar) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}
