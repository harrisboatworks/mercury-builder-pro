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
    title: 'Mercury Diagnostics & Maintenance | Harris Boat Works',
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
      'What boat ownership really costs in Ontario: repower pricing, service jobs, financing math, trade-in values and warranty answers. No forms, no teasers.',
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
  // --- diagnostics ---
  'mercury-outboard-repair-guide': 'diagnostics',
  'mercury-outboard-oil-capacity-chart': 'diagnostics',
  'mercury-outboard-fault-codes-lookup': 'diagnostics',
  'mercury-impeller-replacement-when-they-fail': 'diagnostics',
  'mercury-outboard-overheat-alarm-decoder': 'diagnostics',
  'mercury-motor-maintenance-seasonal-tips': 'diagnostics',
  'spring-outboard-commissioning-checklist': 'diagnostics',
  'diy-mercury-outboard-winterization-guide': 'diagnostics',
  'mercury-outboard-wont-start-troubleshooting': 'diagnostics',
  'outboard-overheating-emergency-guide': 'diagnostics',
  'how-to-read-mercury-outboard-serial-number': 'diagnostics',
  'mercury-maintenance-intervals-20-100-300-rule': 'diagnostics',
  'mercury-smartcraft-alarm-codes-encyclopedia': 'diagnostics',
  'how-to-trim-boat-mercury-outboard': 'diagnostics',
  'mercury-boat-battery-guide-ontario': 'diagnostics',
  'mercury-outboard-overheating-at-idle-fix-ontario': 'diagnostics',
  'mercury-outboard-beeping-codes-guide': 'diagnostics',
  'boat-trailer-maintenance-guide-ontario': 'diagnostics',
  'mercury-outboard-spring-run-up-checklist-ontario': 'diagnostics',
  'accidentally-increase-boat-service-bills-ontario': 'diagnostics',
  'boat-electrical-safety-checklist-ontario-freshwater': 'diagnostics',
  'mercury-outboard-overheat-high-speed': 'diagnostics',
  'bilge-pump-troubleshooting-guide': 'diagnostics',
  'mercury-outboard-maintenance-parts-list': 'diagnostics',
  // --- reviews ---
  'new-vs-used-pontoon-boats-ontario': 'reviews',
  'mercury-outboard-reliability-2026': 'reviews',
  'mercury-9-9-vs-15-hp-tiller-ontario': 'reviews',
  'fourstroke-vs-pro-xs': 'reviews',
  'mercury-75-vs-90-vs-115-comparison': 'reviews',
  'tiller-vs-remote-steering-outboard-guide': 'reviews',
  'electric-trolling-motor-kicker-guide': 'reviews',
  'mercury-150-300hp-pro-xs-performance-guide': 'reviews',
  'mercury-vs-yamaha-outboards-ontario': 'reviews',
  'mercury-vs-yamaha-vs-honda-reliability-2026': 'reviews',
  'mercury-vs-suzuki-outboard-reliability-2026': 'reviews',
  'mercury-vesselview-smartcraft-plain-english-guide': 'reviews',
  'outboard-vs-sterndrive-2026-ontario-repower': 'reviews',
  'mercury-40-vs-60-hp-outboard-ontario': 'reviews',
  'mercury-smartcraft-connect-guide-ontario': 'reviews',
  'mercury-9-9-efi-review-ontario': 'reviews',
  'mercury-90-hp-fourstroke-review-ontario': 'reviews',
  'mercury-115-hp-fourstroke-review-ontario': 'reviews',
  'mercury-60-hp-fourstroke-review-ontario': 'reviews',
  'mercury-150-hp-fourstroke-pro-xs-review-ontario': 'reviews',
  'mercury-200-hp-fourstroke-pro-xs-review-ontario': 'reviews',
  'mercury-250-hp-fourstroke-pro-xs-review-ontario': 'reviews',
  'mercury-75-hp-fourstroke-review-ontario': 'reviews',
  'new-vs-used-mercury-outboard-ontario': 'reviews',
  'aluminum-vs-fiberglass-hull-ontario': 'reviews',
  'mercury-dts-vs-mechanical-controls-ontario-repower': 'reviews',
  'mercury-avator-vs-torqeedo': 'reviews',
  'two-stroke-vs-four-stroke-repower': 'reviews',
  'mercury-avator-7-5e-review': 'reviews',
  'mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026': 'reviews',
  'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026': 'reviews',
  // --- repower ---
  'mercury-command-thrust-complete-guide-2026': 'repower',
  'mercury-dts-retrofit-eligibility-2026': 'repower',
  'mercury-propeller-selection-guide': 'repower',
  'mercury-repower-eligibility-guide': 'repower',
  'how-to-choose-right-horsepower-boat': 'repower',
  'boat-repowering-guide-when-to-replace-motor': 'repower',
  'breaking-in-new-mercury-motor-guide': 'repower',
  'best-mercury-outboard-aluminum-fishing-boats': 'repower',
  'best-mercury-outboard-pontoon-boats': 'repower',
  'bass-boat-mercury-motor-buying-guide': 'repower',
  'center-console-mercury-motor-guide': 'repower',
  'mercury-seapro-commercial-outboard-guide': 'repower',
  'portable-outboard-mercury-guide-2-20hp': 'repower',
  'boat-motor-size-calculator-guide': 'repower',
  'best-motor-small-lakes-ontario': 'repower',
  'winter-repower-planning-guide': 'repower',
  'year-end-boat-motor-buying-guide': 'repower',
  'best-mercury-for-family-runabouts': 'repower',
  'best-mercury-for-ski-wakeboard-boats': 'repower',
  'mercury-ordering-process': 'repower',
  'why-mercury-dominates-outboard-market': 'repower',
  'mercury-outboard-lineup-ontario': 'repower',
  'mercury-boost-software-upgrade-eligibility-2026': 'repower',
  'pleasure-craft-licence-update-repower-ontario': 'repower',
  'evinrude-to-mercury-repower-ontario-guide': 'repower',
  'boat-hull-replacement-vs-repower-decision': 'repower',
  'mercury-boost-upgrade-150hp-pontoon-analysis': 'repower',
  'what-happens-during-mercury-repower': 'repower',
  'outboard-shaft-length-guide': 'repower',
  'used-outboard-buying-guide-ontario': 'repower',
  'mercruiser-sterndrive-guide-ontario': 'repower',
  'legend-boats-mercury-power-package-guide-ontario': 'repower',
  'bad-used-boats-to-avoid-ontario': 'repower',
  'used-boat-walkaround-inspection-ontario': 'repower',
  'pontoon-hp-sizing-decision-tree-ontario': 'repower',
  'mercury-controls-rigging-guide-ontario': 'repower',
  'how-to-read-boat-capacity-plate-ontario': 'repower',
  'repair-repower-or-sell-boat-ontario-decision-guide': 'repower',
  'mercury-fourstroke-buyer-guide-ontario': 'repower',
  'mercury-pro-xs-buyer-guide-ontario': 'repower',
  'best-pontoon-outboard-2026-mercury': 'repower',
  'mercury-main-and-trolling-motor': 'repower',
  'yamaha-to-mercury-repower-ontario-guide': 'repower',
  'honda-to-mercury-repower-ontario-guide': 'repower',
  'hbw-on-water-load-test-mercury-repower-advantage-2026': 'repower',
  'repower-horsepower-capacity-plate-guide': 'repower',
  'repower-pontoon-aluminum-v-hull-differences': 'repower',
  'mercury-outboard-weight-chart': 'repower',
  'new-mercury-outboard-first-season-guide-ontario': 'repower',
  // --- rice-lake ---
  'electric-vs-gas-repower-guide-rice-lake': 'rice-lake',
  'renting-vs-owning-boat-ontario-math': 'rice-lake',
  'group-boat-rentals-rice-lake': 'rice-lake',
  'first-time-boat-rental-rice-lake-guide': 'rice-lake',
  'rice-lake-boat-rental-guide-2026': 'rice-lake',
  'boat-rental-licence-ontario-guide': 'rice-lake',
  'mercury-prokicker-rice-lake-fishing-guide': 'rice-lake',
  'why-harris-boat-works-mercury-dealer': 'rice-lake',
  'best-pontoon-boats-rice-lake-cottage-use': 'rice-lake',
  'ontario-cottage-boat-motor-repower-guide': 'rice-lake',
  'best-mercury-outboard-rice-lake-fishing': 'rice-lake',
  'complete-guide-boat-repower-kawarthas': 'rice-lake',
  'musky-boat-motor-guide-kawarthas': 'rice-lake',
  'walleye-opener-boat-prep': 'rice-lake',
  'late-season-boating-safety': 'rice-lake',
  'ontario-boating-season-tips': 'rice-lake',
  '2026-rice-lake-fishing-season-outlook': 'rice-lake',
  'best-mercury-outboard-lake-simcoe-walleye-fishing': 'rice-lake',
  'best-mercury-outboard-lake-ontario-salmon-trout': 'rice-lake',
  'best-boats-rice-lake-under-30000': 'rice-lake',
  'trailer-boat-toronto-to-rice-lake-guide': 'rice-lake',
  'trent-severn-waterway-boating-guide-2026': 'rice-lake',
  'rice-lake-boating-guide-2026': 'rice-lake',
  'winter-boat-storage-shrinkwrap-vs-indoor-ontario': 'rice-lake',
  'mercury-outboard-dealer-toronto-why-drive-to-hbw': 'rice-lake',
  'best-mercury-dealer-ontario-hbw-difference': 'rice-lake',
  'mercury-repower-gta-toronto-destination': 'rice-lake',
  'boat-service-near-toronto-hbw-reach': 'rice-lake',
  'winter-storage-near-toronto-hbw': 'rice-lake',
  'harris-boat-works-since-1947-rice-lake-institution': 'rice-lake',
  'common-pontoon-boat-problems-rice-lake': 'rice-lake',
  'boat-trailering-mistakes-ontario': 'rice-lake',
  'docking-boat-in-wind-rice-lake': 'rice-lake',
  'outdoor-boat-storage-shrinkwrap-rice-lake': 'rice-lake',
  'rice-lake-boat-launch-guide': 'rice-lake',
  'mercury-dealer-whitby-ontario-hbw': 'rice-lake',
  'mercury-dealer-bowmanville-ontario-hbw': 'rice-lake',
  'best-marina-rice-lake-ontario': 'rice-lake',
  'toronto-to-rice-lake-drive-in-process': 'rice-lake',
  'mercury-pro-xs-repower-rice-lake-kawartha-anglers': 'rice-lake',
  'pontoon-vs-v-hull-comparison-ontario': 'rice-lake',
  'mercury-avator-range-rice-lake-cottage': 'rice-lake',
  'mercury-avator-charging-cottage-dock': 'rice-lake',
  'trent-severn-mercury-dealer-survival-guide-2026': 'rice-lake',
  'lake-ontario-salmon-mercury-setup-guide-2026': 'rice-lake',
  'is-a-pontoon-right-for-your-family-rice-lake': 'rice-lake',
  'canada-day-on-rice-lake-a-locals-guide-to-boating-the-long-weekend': 'rice-lake',
  // --- pricing ---
  'milky-gearcase-oil-meaning-cost-ontario': 'pricing',
  'mercury-water-pump-replacement-cost-ontario': 'pricing',
  'mercury-100-hour-service-cost-ontario': 'pricing',
  'spring-commissioning-cost-ontario': 'pricing',
  'first-marine-dealer-ucp-agentic-commerce': 'pricing',
  'mercury-outboard-fuel-efficiency-guide': 'pricing',
  'mercury-pricing-promotions-2026': 'pricing',
  '2026-boating-market-ontario-boat-buyers': 'pricing',
  'mercury-avator-electric-boating-ontario': 'pricing',
  'mercury-repower-cost-ontario-2026-cad': 'pricing',
  'mercury-outboard-financing-ontario-2026': 'pricing',
  'boat-winterization-cost-ontario-2026': 'pricing',
  'cheapest-mercury-outboard-canada-2026': 'pricing',
  'why-mercury-dealers-hide-prices-online': 'pricing',
  'mercury-outboard-rigging-costs-ontario': 'pricing',
  'total-cost-of-owning-a-boat-ontario-2026': 'pricing',
  'mercury-outboard-warranty-canada-2026': 'pricing',
  'ethanol-octane-mercury-outboard-fuel-guide-ontario': 'pricing',
  'ontario-mercury-outboard-price-guide': 'pricing',
  'outboard-trade-in-value-ontario-hbw': 'pricing',
  'boat-insurance-ontario-guide-2026': 'pricing',
  'mercury-extended-warranty-platinum-ontario': 'pricing',
  'repower-vs-new-boat': 'pricing',
  'mercury-outboard-monthly-payment-ontario-2026': 'pricing',
  'mercury-boost-cost-canada-2026': 'pricing',
  'repower-old-motor-trade-in-hst-disposal-ontario': 'pricing',
  'mercury-warranty-after-repower-ontario': 'pricing',
  'legend-boats-warranty-canada-wowranty-guide-2026': 'pricing',
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
