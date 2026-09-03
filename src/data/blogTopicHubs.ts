// Topic hub pages for the blog: five curated collections that group every
// published English post under exactly one hub. Hubs render at
// /blog/{hub.slug} (see src/pages/BlogTopicHubPage.tsx). Assignment lives in
// HUB_ASSIGNMENTS below; src/data/blogTopicHubs.test.ts enforces that every
// published English post is assigned to exactly one hub and that every anchor
// slug exists and belongs to its own hub.
//
// NOTE: hub routes are client-side. The sitemap generator
// (src/utils/generateSitemap.ts) includes them, but scripts/static-prerender.mjs
// overwrites the sitemap after build, so the five hub paths must also be added
// to staticSitemapEntries there (scripts/ is owner-maintained).

import { BlogArticle, getPublishedArticles, parseLocalDate } from './blogArticles';

export type BlogTopicHubId = 'diagnostics' | 'reviews' | 'repower' | 'rice-lake' | 'pricing';

export interface BlogTopicHub {
  id: BlogTopicHubId;
  /** Path segment under /blog/ */
  slug: string;
  /** Human name used in headings and nav */
  name: string;
  /** Short label for the hub strip on the blog index */
  navLabel: string;
  /** One-line blurb for the hub strip and "More in" blocks */
  blurb: string;
  /** SEO title (kept under 60 characters) */
  title: string;
  /** Meta description (140 to 155 characters) */
  metaDescription: string;
  /** Intro paragraphs rendered under the H1 */
  intro: string[];
  /** Curated posts pinned to the top of the hub, in order */
  anchorSlugs: string[];
}

export const BLOG_TOPIC_HUBS: BlogTopicHub[] = [
  {
    id: 'diagnostics',
    slug: 'diagnostics',
    name: 'Diagnostics & Maintenance',
    navLabel: 'Diagnostics',
    blurb: 'Beep codes, alarms, no-starts and the maintenance that prevents them.',
    title: 'Mercury Outboard Diagnostics & Maintenance | Harris Boat Works',
    metaDescription:
      'Beep codes, overheat alarms, no-start mornings: our Mercury diagnostic and maintenance guides, written from real repair jobs at our Rice Lake shop.',
    intro: [
      "Most \"dead\" outboards we see aren't dead. They're telling you exactly what's wrong, in beeps, codes and warning horns, and nobody handed you the decoder ring.",
      "These guides collect what our techs check first: alarm and beep codes, overheating at idle and at speed, fuel trouble after a winter of sitting, impellers, oil capacities and honest maintenance intervals. If your motor is talking to you, start with the beep code guide. If it's saying nothing at all, start with the won't-start guide.",
      "When a guide points to a repair beyond a driveway fix, book it at hbw.wiki/service and we'll get you on the schedule. One note before you plan: the marina is closed December 1 to April 1, so anything you find over the winter gets booked for a spring slot.",
    ],
    anchorSlugs: [
      'mercury-outboard-beeping-codes-guide',
      'mercury-smartcraft-alarm-codes-encyclopedia',
      'mercury-outboard-wont-start-troubleshooting',
      'how-to-read-mercury-outboard-serial-number',
      'how-to-trim-boat-mercury-outboard',
    ],
  },
  {
    id: 'reviews',
    slug: 'reviews',
    name: 'Reviews & Comparisons',
    navLabel: 'Reviews',
    blurb: 'Head-to-head Mercury comparisons from motors we rig and water-test.',
    title: 'Mercury Outboard Reviews & Comparisons | Harris Boat Works',
    metaDescription:
      'Mercury outboard reviews and head-to-head comparisons from a dealer that water-tests what it rigs: FourStroke vs Pro XS, 90 vs 115, SmartCraft and more.',
    intro: [
      "Spec sheets don't tell you how a motor behaves with four people and a cooler aboard. Lake tests do.",
      "Every review and comparison here comes from motors we rig and run on Rice Lake: FourStroke vs Pro XS, 90 vs 115, VesselView vs SmartCraft, and where Command Thrust actually earns its keep. We're a Mercury dealer, so we won't pretend to be neutral about brands. What we will do is tell you which Mercury not to buy for your boat, because a wrong motor is bad for both of us.",
      "If you're stuck between two motors, start with the head-to-head guides below. When you've picked a winner, you can price it in real Canadian dollars at mercuryrepower.ca, no forms first.",
    ],
    anchorSlugs: [
      'mercury-75-vs-90-vs-115-comparison',
      'fourstroke-vs-pro-xs',
      'mercury-115-hp-fourstroke-review-ontario',
      'mercury-90-hp-fourstroke-review-ontario',
      'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026',
      'mercury-vesselview-smartcraft-plain-english-guide',
      'mercury-smartcraft-connect-guide-ontario',
      'mercury-150-300hp-pro-xs-performance-guide',
    ],
  },
  {
    id: 'repower',
    slug: 'repower',
    name: 'Repower & Buying Guides',
    navLabel: 'Repower',
    blurb: 'Sizing, shaft length, weight and the whole new-motor decision.',
    title: 'Boat Repower & Motor Buying Guides | Harris Boat Works',
    metaDescription:
      'Repower and motor-buying guides for Ontario boaters: hull checks, horsepower sizing, shaft length, motor weight and what install day actually looks like.',
    intro: [
      'A good hull outlives its motor, sometimes two or three of them. That is why repowering, hanging a new outboard on a boat you already love, is most of what we do.',
      'These guides walk the whole decision in order: whether your hull is worth repowering, how to size horsepower from the capacity plate, getting shaft length and motor weight right, when Command Thrust beats a standard gearcase, and what actually happens on install day. The buying guides cover pontoons, bass boats, centre consoles, tillers and kickers, because the right motor depends on the boat behind it.',
      'When you are ready for numbers instead of theory, the configurator at mercuryrepower.ca builds a real CAD quote for your boat in a few minutes.',
    ],
    anchorSlugs: [
      'mercury-command-thrust-complete-guide-2026',
      'mercury-command-thrust-guide-pontoon-boats',
      'outboard-shaft-length-guide',
      'mercury-outboard-weight-chart',
      'breaking-in-new-mercury-motor-guide',
      'best-mercury-outboard-pontoon-boats',
      'pontoon-hp-sizing-decision-tree-ontario',
      'center-console-mercury-motor-guide',
      'legend-boats-mercury-power-package-guide-ontario',
      'why-mercury-dominates-outboard-market',
    ],
  },
  {
    id: 'rice-lake',
    slug: 'rice-lake',
    name: 'Rice Lake & the Kawarthas',
    navLabel: 'Rice Lake',
    blurb: 'Local knowledge: launches, docking, fishing, rentals and storage.',
    title: 'Rice Lake & Kawarthas Boating Guides | Harris Boat Works',
    metaDescription:
      'Boating Rice Lake and the Kawarthas: launch ramps, docking in wind, fishing seasons, rentals, winter storage and trailering up from Toronto, all local.',
    intro: [
      'Rice Lake looks calm from the launch ramp. Then a west wind stacks rollers over the sunken railway causeway and your easy afternoon turns into a boat-handling lesson.',
      'This is our home water. Harris Boat Works has been on the south shore at Gores Landing since 1947, and these guides cover what living here teaches you: where to launch, how to dock when the wind is up, what the fishing seasons look like, pontoon life, the Trent-Severn Waterway, and the trailer trip up from Toronto and the GTA.',
      "Thinking about renting before you buy, or sorting out storage before the snow? Those guides live here too. And if a trip brings you past Gores Landing, the coffee at the marina is usually on.",
    ],
    anchorSlugs: [
      'trent-severn-waterway-boating-guide-2026',
      'trailer-boat-toronto-to-rice-lake-guide',
      'complete-guide-boat-repower-kawarthas',
      'best-pontoon-boats-rice-lake-cottage-use',
      'is-a-pontoon-right-for-your-family-rice-lake',
      'pontoon-vs-v-hull-comparison-ontario',
      'winter-boat-storage-shrinkwrap-vs-indoor-ontario',
      'rice-lake-boat-rental-guide-2026',
      'mercury-dealer-bowmanville-ontario-hbw',
      'mercury-dealer-whitby-ontario-hbw',
    ],
  },
  {
    id: 'pricing',
    slug: 'pricing',
    name: 'Prices & Ownership Costs',
    navLabel: 'Pricing',
    blurb: 'What things really cost: repowers, service, financing and warranty.',
    title: 'Mercury Prices & Boat Ownership Costs | Harris Boat Works',
    metaDescription:
      'What boat ownership really costs in Ontario: repower pricing, service jobs, financing math, trade-in values and warranty answers, with nothing behind forms.',
    intro: [
      'Most dealers make you fill out a form to see a price. We publish ours, and these guides explain the numbers behind them.',
      "What's in here: what repowers, rigging, winterization and common service jobs cost in Ontario, how financing and monthly payments work in Canadian dollars, what your trade-in is actually worth, and how Mercury's warranty behaves after a repower. No teaser rates, no \"call for pricing\", no pretending HST doesn't exist.",
      'Guides give you honest ranges. For a number that belongs to your boat, build a quote at mercuryrepower.ca and you will see live CAD pricing before anyone asks for your phone number.',
    ],
    anchorSlugs: [
      'mercury-outboard-warranty-canada-2026',
      '2026-boating-market-ontario-boat-buyers',
      'mercury-repower-cost-ontario-2026-cad',
      'ontario-mercury-outboard-price-guide',
      'mercury-outboard-financing-ontario-2026',
      'mercury-outboard-fuel-efficiency-guide',
      'ethanol-octane-mercury-outboard-fuel-guide-ontario',
    ],
  },
];

/**
 * Every published English post belongs to exactly one hub.
 * Grouped by hub; order within each group mirrors src/data/blogArticles.ts.
 */
export const HUB_ASSIGNMENTS: Record<string, BlogTopicHubId> = {
  //__ASSIGNMENTS__
};

export function getHubById(id: BlogTopicHubId): BlogTopicHub {
  const hub = BLOG_TOPIC_HUBS.find((h) => h.id === id);
  if (!hub) throw new Error(`Unknown blog topic hub: ${id}`);
  return hub;
}

export function getHubByPathSlug(slug: string): BlogTopicHub | undefined {
  return BLOG_TOPIC_HUBS.find((h) => h.slug === slug);
}

export function getHubForArticleSlug(articleSlug: string): BlogTopicHub | undefined {
  const id = HUB_ASSIGNMENTS[articleSlug];
  return id ? getHubById(id) : undefined;
}

/**
 * All published articles assigned to a hub: anchors first (in curated order),
 * then the rest newest-first.
 */
export function getHubArticles(hub: BlogTopicHub, articles?: BlogArticle[]): BlogArticle[] {
  const pool = articles ?? getPublishedArticles();
  const assigned = pool.filter((a) => HUB_ASSIGNMENTS[a.slug] === hub.id);
  const bySlug = new Map(assigned.map((a) => [a.slug, a]));
  const anchors = hub.anchorSlugs
    .map((s) => bySlug.get(s))
    .filter((a): a is BlogArticle => Boolean(a));
  const anchorSet = new Set(anchors.map((a) => a.slug));
  const rest = assigned
    .filter((a) => !anchorSet.has(a.slug))
    .sort(
      (a, b) => parseLocalDate(b.datePublished).getTime() - parseLocalDate(a.datePublished).getTime(),
    );
  return [...anchors, ...rest];
}

/**
 * Up to `limit` sibling posts from the same hub as `articleSlug`, skipping the
 * article itself and any slugs in `exclude` (e.g. the Related Articles grid).
 */
export function getMoreInHub(
  articleSlug: string,
  exclude: string[] = [],
  limit = 4,
): { hub: BlogTopicHub; articles: BlogArticle[] } | undefined {
  const hub = getHubForArticleSlug(articleSlug);
  if (!hub) return undefined;
  const skip = new Set([articleSlug, ...exclude]);
  const articles = getHubArticles(hub)
    .filter((a) => !skip.has(a.slug))
    .slice(0, limit);
  return { hub, articles };
}
