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

export type ClusterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface BlogCluster {
  id: ClusterId;
  name: string;
  pillar: string;          // slug
  spokes: string[];        // slugs
}

export const blogClusters: BlogCluster[] = [
  {
    id: 1,
    name: "Repower & Cost",
    pillar: "complete-guide-boat-repower-kawarthas",
    spokes: [
      "mercury-repower-cost-ontario-2026-cad",
      "repair-repower-or-sell-boat-ontario-decision-guide",
      "repower-vs-new-boat",
      "boat-repowering-guide-when-to-replace-motor",
      "mercury-repower-eligibility-guide",
      "what-happens-during-mercury-repower",
      "hbw-on-water-load-test-mercury-repower-advantage-2026",
      "evinrude-to-mercury-repower-ontario-guide",
      "yamaha-to-mercury-repower-ontario-guide",
      "honda-to-mercury-repower-ontario-guide",
      "two-stroke-vs-four-stroke-repower",
      "outboard-vs-sterndrive-2026-ontario-repower",
      "mercruiser-sterndrive-guide-ontario",
      "repower-old-motor-trade-in-hst-disposal-ontario",
      "repower-pontoon-aluminum-v-hull-differences",
      "mercury-pro-xs-repower-rice-lake-kawartha-anglers",
      "mercury-dts-vs-mechanical-controls-ontario-repower",
      "ontario-cottage-boat-motor-repower-guide",
      "boat-hull-replacement-vs-repower-decision",
      "winter-repower-planning-guide",
      "pleasure-craft-licence-update-repower-ontario",
      "mercury-ordering-process",
      "year-end-boat-motor-buying-guide",
    ],
  },
  {
    id: 2,
    name: "Financing & Pricing",
    pillar: "ontario-mercury-outboard-price-guide",
    spokes: [
      "mercury-outboard-financing-ontario-2026",
      "mercury-outboard-monthly-payment-ontario-2026",
      "mercury-pricing-promotions-2026",
      "cheapest-mercury-outboard-canada-2026",
      "mercury-boost-cost-canada-2026",
      "total-cost-of-owning-a-boat-ontario-2026",
      "why-mercury-dealers-hide-prices-online",
      "boat-insurance-ontario-guide-2026",
      "mercury-outboard-rigging-costs-ontario",
      "is-2026-good-year-to-buy-boat-canada",
      "2026-boating-market-ontario-boat-buyers",
    ],
  },
  {
    id: 3,
    name: "Buying — Motor Sizing & Selection",
    pillar: "how-to-choose-right-horsepower-boat",
    spokes: [
      "boat-motor-size-calculator-guide",
      "mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026",
      "mercury-75-vs-90-vs-115-comparison",
      "mercury-40-vs-60-hp-outboard-ontario",
      "mercury-9-9-vs-15-hp-tiller-ontario",
      "mercury-150-300hp-pro-xs-performance-guide",
      "pontoon-hp-sizing-decision-tree-ontario",
      "outboard-shaft-length-guide",
      "how-to-read-boat-capacity-plate-ontario",
      "repower-horsepower-capacity-plate-guide",
      "mercury-main-and-trolling-motor",
      "portable-outboard-mercury-guide-2-20hp",
      "tiller-vs-remote-steering-outboard-guide",
    ],
  },
  {
    id: 4,
    name: "Buying — Boat-Type Specific",
    pillar: "best-mercury-outboard-aluminum-fishing-boats",
    spokes: [
      "best-mercury-outboard-pontoon-boats",
      "best-pontoon-outboard-2026-mercury",
      "bass-boat-mercury-motor-buying-guide",
      "center-console-mercury-motor-guide",
      "best-mercury-for-family-runabouts",
      "best-mercury-for-ski-wakeboard-boats",
      "electric-trolling-motor-kicker-guide",
      "used-outboard-buying-guide-ontario",
      "new-vs-used-mercury-outboard-ontario",
      "bad-used-boats-to-avoid-ontario",
      "used-boat-walkaround-inspection-ontario",
      "pontoon-vs-v-hull-comparison-ontario",
      "aluminum-vs-fiberglass-hull-ontario",
      "best-boats-rice-lake-under-30000",
      "best-pontoon-boats-rice-lake-cottage-use",
      "common-pontoon-boat-problems-rice-lake",
      "mercury-command-thrust-guide-pontoon-boats",
      "mercury-command-thrust-pontoon-eligibility-2026",
      "legend-boats-mercury-power-package-guide-ontario",
    ],
  },
  {
    id: 5,
    name: "Local Knowledge & Fishing",
    pillar: "best-mercury-outboard-rice-lake-fishing",
    spokes: [
      "best-mercury-outboard-lake-simcoe-walleye-fishing",
      "best-mercury-outboard-lake-ontario-salmon-trout",
      "lake-ontario-salmon-mercury-setup-guide-2026",
      "musky-boat-motor-guide-kawarthas",
      "mercury-prokicker-rice-lake-fishing-guide",
      "best-motor-small-lakes-ontario",
      "2026-rice-lake-fishing-season-outlook",
      "trailer-boat-toronto-to-rice-lake-guide",
    ],
  },
  {
    id: 6,
    name: "Maintenance, Service & Seasonal",
    pillar: "mercury-maintenance-intervals-20-100-300-rule",
    spokes: [
      "mercury-motor-maintenance-seasonal-tips",
      "mercury-outboard-winterization-service-cost-ontario",
      "diy-mercury-outboard-winterization-guide",
      "boat-winterization-cost-ontario-2026",
      "winter-boat-storage-shrinkwrap-vs-indoor-ontario",
      "outdoor-boat-storage-shrinkwrap-rice-lake",
      "winter-storage-near-toronto-hbw",
      "boat-storage-kawartha-lakes",
      "spring-outboard-commissioning-checklist",
      "mercury-outboard-spring-run-up-checklist-ontario",
      "breaking-in-new-mercury-motor-guide",
      "boat-trailer-maintenance-guide-ontario",
      "boat-trailering-mistakes-ontario",
      "accidentally-increase-boat-service-bills-ontario",
      "walleye-opener-boat-prep",
      "late-season-boating-safety",
      "ontario-boating-season-tips",
    ],
  },
  {
    id: 7,
    name: "Performance, Tech & Troubleshooting",
    pillar: "mercury-propeller-selection-guide",
    spokes: [
      "mercury-outboard-fuel-efficiency-guide",
      "ethanol-octane-mercury-outboard-fuel-guide-ontario",
      "mercury-boost-software-upgrade-eligibility-2026",
      "mercury-boost-upgrade-150hp-pontoon-analysis",
      "mercury-dts-retrofit-eligibility-2026",
      "mercury-controls-rigging-guide-ontario",
      "mercury-smartcraft-connect-guide-ontario",
      "mercury-smartcraft-connect-eligibility-2026",
      "mercury-vesselview-smartcraft-plain-english-guide",
      "mercury-smartcraft-alarm-codes-encyclopedia",
      "mercury-outboard-beeping-codes-guide",
      "mercury-outboard-wont-start-troubleshooting",
      "mercury-outboard-wont-start-after-sitting",
      "mercury-outboard-overheat-alarm-decoder",
      "mercury-outboard-overheat-high-speed",
      "mercury-outboard-overheating-at-idle-fix-ontario",
      "outboard-overheating-emergency-guide",
      "mercury-impeller-replacement-when-they-fail",
      "mercury-boat-battery-guide-ontario",
      "boat-electrical-safety-checklist-ontario-freshwater",
      "how-to-trim-boat-mercury-outboard",
      "how-to-read-mercury-outboard-serial-number",
      "boat-motor-trade-in-guide",
      "outboard-trade-in-value-ontario-hbw",
    ],
  },
  {
    id: 8,
    name: "Brand Story, Comparisons & Market",
    pillar: "why-mercury-dominates-outboard-market",
    spokes: [
      "mercury-vs-yamaha-outboards-ontario",
      "mercury-vs-yamaha-vs-honda-reliability-2026",
      "mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026",
      "mercury-vs-suzuki-outboard-reliability-2026",
      "why-harris-boat-works-mercury-dealer",
      "harris-boat-works-since-1947-rice-lake-institution",
      "first-marine-dealer-ucp-agentic-commerce",
      "boat-rentals-shared-access-booming-2026",
    ],
  },
  {
    id: 9,
    name: "Mercury Model Families & Reviews",
    pillar: "fourstroke-vs-pro-xs",
    spokes: [
      "mercury-fourstroke-buyer-guide-ontario",
      "mercury-pro-xs-buyer-guide-ontario",
      "mercury-command-thrust-complete-guide-2026",
      "mercury-115-hp-fourstroke-review-ontario",
      "mercury-90-hp-fourstroke-review-ontario",
      "mercury-75-hp-fourstroke-review-ontario",
      "mercury-9-9-efi-review-ontario",
      "mercury-outboard-weight-chart",
      "mercury-2026-outboard-lineup-ontario",
      "2026-mercury-model-preview",
      "mercury-seapro-commercial-outboard-guide",
      "mercury-avator-electric-boating-ontario",
      "mercury-avator-7-5e-review",
      "mercury-avator-vs-torqeedo",
      "mercury-avator-charging-cottage-dock",
      "mercury-avator-range-rice-lake-cottage",
    ],
  },
  {
    id: 10,
    name: "Warranty & Protection",
    pillar: "mercury-outboard-warranty-canada-2026",
    spokes: [
      "mercury-warranty-after-repower-ontario",
      "mercury-7-year-warranty-hbw-exclusive-explained",
      "mercury-extended-warranty-platinum-ontario",
    ],
  },
  {
    id: 11,
    name: "Dealer & Destination",
    pillar: "best-mercury-dealer-ontario-hbw-difference",
    spokes: [
      "mercury-outboard-dealer-toronto-why-drive-to-hbw",
      "toronto-to-rice-lake-drive-in-process",
      "mercury-repower-gta-toronto-destination",
      "boat-service-near-toronto-hbw-reach",
      "mercury-dealer-peterborough-ontario-hbw",
      "mercury-dealer-cobourg-ontario-hbw",
      "mercury-dealer-port-hope-ontario-hbw",
      "mercury-dealer-lindsay-ontario-hbw",
      "mercury-dealer-northumberland-county-hbw",
      "mercury-dealer-ajax-ontario-hbw",
      "mercury-dealer-bowmanville-ontario-hbw",
      "mercury-dealer-brampton-ontario-hbw",
      "mercury-dealer-burlington-ontario-hbw",
      "mercury-dealer-markham-ontario-hbw",
      "mercury-dealer-mississauga-ontario-hbw",
      "mercury-dealer-oakville-ontario-hbw",
      "mercury-dealer-oshawa-ontario-hbw",
      "mercury-dealer-pickering-ontario-hbw",
      "mercury-dealer-richmond-hill-ontario-hbw",
      "mercury-dealer-vaughan-ontario-hbw",
      "mercury-dealer-whitby-ontario-hbw",
    ],
  },
  {
    id: 12,
    name: "Rice Lake & Cottage Life",
    pillar: "rice-lake-boating-guide-2026",
    spokes: [
      "rice-lake-boat-launch-guide",
      "rice-lake-boat-rentals-from-toronto-gta",
      "canada-day-on-rice-lake-a-locals-guide-to-boating-the-long-weekend",
      "is-a-pontoon-right-for-your-family-rice-lake",
      "best-marina-rice-lake-ontario",
      "docking-boat-in-wind-rice-lake",
      "boat-trim-explained-rice-lake-ontario",
      "trent-severn-waterway-boating-guide-2026",
      "trent-severn-mercury-dealer-survival-guide-2026",
    ],
  },
];

/** Short context clause appended to each Related-guides bullet. */
export const blogClusterContexts: Record<string, string> = {
  // Cluster 1 — Repower & Cost
  "complete-guide-boat-repower-kawarthas": "the full Kawarthas repower playbook",
  "mercury-repower-cost-ontario-2026-cad": "transparent 2026 CAD repower pricing",
  "repair-repower-or-sell-boat-ontario-decision-guide": "repair, repower, or sell decision framework",
  "repower-vs-new-boat": "repower vs buying a new boat",
  "boat-repowering-guide-when-to-replace-motor": "how to know it's time to replace your motor",
  "mercury-repower-eligibility-guide": "checking whether your boat is repower-eligible",
  "what-happens-during-mercury-repower": "what actually happens during the repower",
  "hbw-on-water-load-test-mercury-repower-advantage-2026": "the on-water load test after repower",
  "evinrude-to-mercury-repower-ontario-guide": "switching from Evinrude to Mercury",
  "yamaha-to-mercury-repower-ontario-guide": "switching from Yamaha to Mercury",
  "honda-to-mercury-repower-ontario-guide": "switching from Honda to Mercury",
  "two-stroke-vs-four-stroke-repower": "two-stroke to four-stroke repower notes",
  "outboard-vs-sterndrive-2026-ontario-repower": "outboard vs sterndrive when repowering",
  "mercruiser-sterndrive-guide-ontario": "MerCruiser sterndrive service and repower notes",
  "repower-old-motor-trade-in-hst-disposal-ontario": "trade-in, HST and disposal on repowers",
  "repower-pontoon-aluminum-v-hull-differences": "repower differences by hull type",
  "mercury-pro-xs-repower-rice-lake-kawartha-anglers": "Pro XS repower for Kawartha anglers",
  "mercury-dts-vs-mechanical-controls-ontario-repower": "DTS vs mechanical controls on a repower",
  "ontario-cottage-boat-motor-repower-guide": "cottage-specific repower considerations",
  "boat-hull-replacement-vs-repower-decision": "repower the motor or replace the boat?",
  "winter-repower-planning-guide": "why winter is the smart time to plan",
  "pleasure-craft-licence-update-repower-ontario": "updating your PCL after a repower",
  "mercury-ordering-process": "how Mercury motors are ordered and delivered",
  "year-end-boat-motor-buying-guide": "year-end timing and incentives",
  // Cluster 2 — Financing & Pricing
  "ontario-mercury-outboard-price-guide": "Ontario Mercury outboard price guide",
  "mercury-outboard-financing-ontario-2026": "current Mercury financing rates and terms",
  "mercury-outboard-monthly-payment-ontario-2026": "monthly payment ranges by HP",
  "mercury-pricing-promotions-2026": "live 2026 promotions and rebates",
  "cheapest-mercury-outboard-canada-2026": "lowest-cost Mercury models in Canada",
  "mercury-boost-cost-canada-2026": "what a Mercury Boost upgrade costs",
  "total-cost-of-owning-a-boat-ontario-2026": "total cost of owning a boat in Ontario",
  "why-mercury-dealers-hide-prices-online": "why most Mercury dealers hide prices online",
  "boat-insurance-ontario-guide-2026": "boat insurance basics for Ontario owners",
  "mercury-outboard-rigging-costs-ontario": "rigging and install cost breakdown",
  "is-2026-good-year-to-buy-boat-canada": "is 2026 the right year to buy?",
  "2026-boating-market-ontario-boat-buyers": "what 2026 looks like for Ontario buyers",
  // Cluster 3 — Buying — Motor Sizing & Selection
  "how-to-choose-right-horsepower-boat": "matching HP to boat size and use",
  "boat-motor-size-calculator-guide": "sizing calculator walkthrough",
  "mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026": "the 115 vs 150 decision, dealer take",
  "mercury-75-vs-90-vs-115-comparison": "mid-range Mercury head-to-head",
  "mercury-40-vs-60-hp-outboard-ontario": "40 vs 60 HP for Ontario boats",
  "mercury-9-9-vs-15-hp-tiller-ontario": "9.9 vs 15 HP tiller comparison",
  "mercury-150-300hp-pro-xs-performance-guide": "150–300 HP Pro XS performance",
  "pontoon-hp-sizing-decision-tree-ontario": "pontoon HP sizing decision tree",
  "outboard-shaft-length-guide": "shaft length by transom height",
  "how-to-read-boat-capacity-plate-ontario": "how to read the capacity plate",
  "repower-horsepower-capacity-plate-guide": "HP limits on the capacity plate for repowers",
  "mercury-main-and-trolling-motor": "main outboard plus trolling motor setups",
  "portable-outboard-mercury-guide-2-20hp": "portable 2–20 HP options",
  "tiller-vs-remote-steering-outboard-guide": "tiller vs remote steering",
  // Cluster 4 — Buying — Boat-Type Specific
  "best-mercury-outboard-aluminum-fishing-boats": "best Mercury for aluminum fishing boats",
  "best-mercury-outboard-pontoon-boats": "best Mercury for pontoons",
  "best-pontoon-outboard-2026-mercury": "top 2026 Mercury picks for pontoons",
  "bass-boat-mercury-motor-buying-guide": "bass-boat motor selection",
  "center-console-mercury-motor-guide": "center-console power picks",
  "best-mercury-for-family-runabouts": "family-runabout recommendations",
  "best-mercury-for-ski-wakeboard-boats": "ski and wakeboard motor picks",
  "electric-trolling-motor-kicker-guide": "electric trolling and kicker setups",
  "used-outboard-buying-guide-ontario": "buying a used outboard in Ontario",
  "new-vs-used-mercury-outboard-ontario": "new vs used Mercury tradeoffs",
  "bad-used-boats-to-avoid-ontario": "used boats to avoid in Ontario",
  "used-boat-walkaround-inspection-ontario": "used-boat walkaround inspection",
  "pontoon-vs-v-hull-comparison-ontario": "pontoon vs V-hull comparison",
  "aluminum-vs-fiberglass-hull-ontario": "aluminum vs fibreglass hulls",
  "best-boats-rice-lake-under-30000": "Rice Lake boats under $30K",
  "best-pontoon-boats-rice-lake-cottage-use": "pontoons suited to Rice Lake cottage use",
  "common-pontoon-boat-problems-rice-lake": "common pontoon issues on Rice Lake",
  "mercury-command-thrust-guide-pontoon-boats": "Command Thrust on pontoon boats",
  "mercury-command-thrust-pontoon-eligibility-2026": "Command Thrust pontoon eligibility",
  "legend-boats-mercury-power-package-guide-ontario": "Legend Boats Mercury power packages",
  // Cluster 5 — Local Knowledge & Fishing
  "best-mercury-outboard-rice-lake-fishing": "best Mercury for Rice Lake fishing",
  "best-mercury-outboard-lake-simcoe-walleye-fishing": "Lake Simcoe walleye picks",
  "best-mercury-outboard-lake-ontario-salmon-trout": "Lake Ontario salmon and trout setups",
  "lake-ontario-salmon-mercury-setup-guide-2026": "Lake Ontario salmon rigging setup",
  "musky-boat-motor-guide-kawarthas": "musky-boat motor guide",
  "mercury-prokicker-rice-lake-fishing-guide": "Pro Kicker on Rice Lake",
  "best-motor-small-lakes-ontario": "best motor for small Ontario lakes",
  "2026-rice-lake-fishing-season-outlook": "2026 Rice Lake season outlook",
  "trailer-boat-toronto-to-rice-lake-guide": "trailering from Toronto to Rice Lake",
  // Cluster 6 — Maintenance, Service & Seasonal
  "mercury-maintenance-intervals-20-100-300-rule": "the 20/100/300 maintenance rule",
  "mercury-motor-maintenance-seasonal-tips": "seasonal maintenance tips",
  "mercury-outboard-winterization-service-cost-ontario": "what winterization service costs",
  "diy-mercury-outboard-winterization-guide": "DIY winterization steps",
  "boat-winterization-cost-ontario-2026": "boat winterization cost in Ontario",
  "winter-boat-storage-shrinkwrap-vs-indoor-ontario": "shrink-wrap vs indoor winter storage",
  "outdoor-boat-storage-shrinkwrap-rice-lake": "outdoor shrink-wrap storage on Rice Lake",
  "winter-storage-near-toronto-hbw": "winter storage options near Toronto",
  "boat-storage-kawartha-lakes": "boat storage in the Kawarthas",
  "spring-outboard-commissioning-checklist": "spring commissioning checklist",
  "mercury-outboard-spring-run-up-checklist-ontario": "spring run-up checklist",
  "breaking-in-new-mercury-motor-guide": "breaking in a new Mercury",
  "boat-trailer-maintenance-guide-ontario": "boat trailer maintenance guide",
  "boat-trailering-mistakes-ontario": "common trailering mistakes",
  "accidentally-increase-boat-service-bills-ontario": "habits that inflate your service bill",
  "walleye-opener-boat-prep": "walleye-opener boat prep",
  "late-season-boating-safety": "late-season safety tips",
  "ontario-boating-season-tips": "Ontario boating-season tips",
  // Cluster 7 — Performance, Tech & Troubleshooting
  "mercury-propeller-selection-guide": "choosing the right propeller",
  "mercury-outboard-fuel-efficiency-guide": "maximizing fuel efficiency",
  "ethanol-octane-mercury-outboard-fuel-guide-ontario": "ethanol, octane and Mercury fuel",
  "mercury-boost-software-upgrade-eligibility-2026": "Boost software upgrade eligibility",
  "mercury-boost-upgrade-150hp-pontoon-analysis": "150 HP Boost upgrade analysis",
  "mercury-dts-retrofit-eligibility-2026": "DTS retrofit eligibility",
  "mercury-controls-rigging-guide-ontario": "controls and rigging basics",
  "mercury-smartcraft-connect-guide-ontario": "SmartCraft Connect walkthrough",
  "mercury-smartcraft-connect-eligibility-2026": "SmartCraft Connect eligibility",
  "mercury-vesselview-smartcraft-plain-english-guide": "VesselView and SmartCraft explained",
  "mercury-smartcraft-alarm-codes-encyclopedia": "SmartCraft alarm code reference",
  "mercury-outboard-beeping-codes-guide": "beeping code guide",
  "mercury-outboard-wont-start-troubleshooting": "won't-start troubleshooting",
  "mercury-outboard-wont-start-after-sitting": "won't-start after sitting fixes",
  "mercury-outboard-overheat-alarm-decoder": "overheat alarm decoder",
  "mercury-outboard-overheat-high-speed": "overheating at high speed",
  "mercury-outboard-overheating-at-idle-fix-ontario": "overheating at idle fixes",
  "outboard-overheating-emergency-guide": "on-water overheating emergency guide",
  "mercury-impeller-replacement-when-they-fail": "when impellers fail and how to replace",
  "mercury-boat-battery-guide-ontario": "boat battery selection and care",
  "boat-electrical-safety-checklist-ontario-freshwater": "freshwater electrical safety checklist",
  "how-to-trim-boat-mercury-outboard": "how to trim your Mercury outboard",
  "how-to-read-mercury-outboard-serial-number": "decoding the Mercury serial number",
  "boat-motor-trade-in-guide": "trade-in valuation guide",
  "outboard-trade-in-value-ontario-hbw": "what your outboard is worth on trade",
  // Cluster 8 — Brand Story, Comparisons & Market
  "why-mercury-dominates-outboard-market": "why Mercury leads the outboard market",
  "mercury-vs-yamaha-outboards-ontario": "Mercury vs Yamaha for Ontario",
  "mercury-vs-yamaha-vs-honda-reliability-2026": "Mercury vs Yamaha vs Honda reliability",
  "mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026": "Mercury vs Honda dealer comparison",
  "mercury-vs-suzuki-outboard-reliability-2026": "Mercury vs Suzuki reliability",
  "why-harris-boat-works-mercury-dealer": "why Harris Boat Works chose Mercury",
  "harris-boat-works-since-1947-rice-lake-institution": "the Harris Boat Works story since 1947",
  "first-marine-dealer-ucp-agentic-commerce": "first marine dealer live on UCP",
  "boat-rentals-shared-access-booming-2026": "rental and shared-access trends",
  // Cluster 9 — Mercury Model Families & Reviews
  "fourstroke-vs-pro-xs": "FourStroke vs Pro XS side-by-side",
  "mercury-fourstroke-buyer-guide-ontario": "FourStroke buyer guide for Ontario",
  "mercury-pro-xs-buyer-guide-ontario": "Pro XS buyer guide for Ontario",
  "mercury-command-thrust-complete-guide-2026": "complete Command Thrust guide",
  "mercury-115-hp-fourstroke-review-ontario": "115 HP FourStroke review",
  "mercury-90-hp-fourstroke-review-ontario": "90 HP FourStroke review",
  "mercury-75-hp-fourstroke-review-ontario": "75 HP FourStroke review",
  "mercury-9-9-efi-review-ontario": "9.9 EFI review for Ontario",
  "mercury-outboard-weight-chart": "Mercury outboard weight chart",
  "mercury-2026-outboard-lineup-ontario": "2026 Mercury lineup for Ontario",
  "2026-mercury-model-preview": "preview of the 2026 Mercury models",
  "mercury-seapro-commercial-outboard-guide": "SeaPro commercial-duty guide",
  "mercury-avator-electric-boating-ontario": "Mercury Avator electric outboards",
  "mercury-avator-7-5e-review": "Avator 7.5e review",
  "mercury-avator-vs-torqeedo": "Avator vs Torqeedo",
  "mercury-avator-charging-cottage-dock": "charging the Avator at a cottage dock",
  "mercury-avator-range-rice-lake-cottage": "Avator range on Rice Lake",
  // Cluster 10 — Warranty & Protection
  "mercury-outboard-warranty-canada-2026": "Mercury warranty terms in Canada",
  "mercury-warranty-after-repower-ontario": "how warranty works after a repower",
  "mercury-7-year-warranty-hbw-exclusive-explained": "the 7-year warranty explained",
  "mercury-extended-warranty-platinum-ontario": "Product Protection Platinum extended coverage",
  // Cluster 11 — Dealer & Destination
  "best-mercury-dealer-ontario-hbw-difference": "what makes HBW different",
  "mercury-outboard-dealer-toronto-why-drive-to-hbw": "why Toronto buyers drive to HBW",
  "toronto-to-rice-lake-drive-in-process": "the Toronto to Rice Lake drive-in process",
  "mercury-repower-gta-toronto-destination": "GTA and Toronto repower destination guide",
  "boat-service-near-toronto-hbw-reach": "boat service reach from Toronto",
  "mercury-dealer-peterborough-ontario-hbw": "Mercury dealer for Peterborough",
  "mercury-dealer-cobourg-ontario-hbw": "Mercury dealer for Cobourg",
  "mercury-dealer-port-hope-ontario-hbw": "Mercury dealer for Port Hope",
  "mercury-dealer-lindsay-ontario-hbw": "Mercury dealer for Lindsay",
  "mercury-dealer-northumberland-county-hbw": "Mercury dealer for Northumberland County",
  "mercury-dealer-ajax-ontario-hbw": "Mercury dealer for Ajax",
  "mercury-dealer-bowmanville-ontario-hbw": "Mercury dealer for Bowmanville",
  "mercury-dealer-brampton-ontario-hbw": "Mercury dealer for Brampton",
  "mercury-dealer-burlington-ontario-hbw": "Mercury dealer for Burlington",
  "mercury-dealer-markham-ontario-hbw": "Mercury dealer for Markham",
  "mercury-dealer-mississauga-ontario-hbw": "Mercury dealer for Mississauga",
  "mercury-dealer-oakville-ontario-hbw": "Mercury dealer for Oakville",
  "mercury-dealer-oshawa-ontario-hbw": "Mercury dealer for Oshawa",
  "mercury-dealer-pickering-ontario-hbw": "Mercury dealer for Pickering",
  "mercury-dealer-richmond-hill-ontario-hbw": "Mercury dealer for Richmond Hill",
  "mercury-dealer-vaughan-ontario-hbw": "Mercury dealer for Vaughan",
  "mercury-dealer-whitby-ontario-hbw": "Mercury dealer for Whitby",
  // Cluster 12 — Rice Lake & Cottage Life
  "rice-lake-boating-guide-2026": "the 2026 Rice Lake boating guide",
  "rice-lake-boat-launch-guide": "Rice Lake boat launch guide",
  "rice-lake-boat-rentals-from-toronto-gta": "boat rentals from the GTA to Rice Lake",
  "canada-day-on-rice-lake-a-locals-guide-to-boating-the-long-weekend": "a local's Canada Day guide",
  "is-a-pontoon-right-for-your-family-rice-lake": "is a pontoon right for your family?",
  "best-marina-rice-lake-ontario": "marina options on Rice Lake",
  "docking-boat-in-wind-rice-lake": "docking in the wind on Rice Lake",
  "boat-trim-explained-rice-lake-ontario": "boat trim explained",
  "trent-severn-waterway-boating-guide-2026": "boating the Trent-Severn Waterway",
  "trent-severn-mercury-dealer-survival-guide-2026": "Trent-Severn Mercury survival guide",
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

/**
 * Slugs that belong to the /repower hub cluster (broader than cluster id 1).
 * Used by BlogArticle to render the RepowerHubBanner. Keep in sync with the
 * directory in src/pages/RepowerHub.tsx.
 */
export const REPOWER_HUB_SLUGS: ReadonlySet<string> = new Set([
  // Deciding
  'boat-repowering-guide-when-to-replace-motor',
  'repower-vs-new-boat',
  'boat-hull-replacement-vs-repower-decision',
  'repair-repower-or-sell-boat-ontario-decision-guide',
  'mercury-repower-eligibility-guide',
  // Cost & Financing
  'mercury-repower-cost-ontario-2026-cad',
  'mercury-outboard-financing-ontario-2026',
  'repower-old-motor-trade-in-hst-disposal-ontario',
  // Process & What to Expect
  'what-happens-during-mercury-repower',
  'hbw-on-water-load-test-mercury-repower-advantage-2026',
  'mercury-warranty-after-repower-ontario',
  'pleasure-craft-licence-update-repower-ontario',
  'winter-repower-planning-guide',
  // Brand & Engine-Type Conversions
  'evinrude-to-mercury-repower-ontario-guide',
  'yamaha-to-mercury-repower-ontario-guide',
  'honda-to-mercury-repower-ontario-guide',
  'two-stroke-vs-four-stroke-repower',
  'outboard-vs-sterndrive-2026-ontario-repower',
  // Rigging, Controls & Fit
  'mercury-dts-vs-mechanical-controls-ontario-repower',
  'repower-horsepower-capacity-plate-guide',
  'repower-pontoon-aluminum-v-hull-differences',
  // Local Guides
  'complete-guide-boat-repower-kawarthas',
  'ontario-cottage-boat-motor-repower-guide',
  'mercury-repower-gta-toronto-destination',
  'mercury-pro-xs-repower-rice-lake-kawartha-anglers',
]);

export function isRepowerHubSlug(slug: string): boolean {
  return REPOWER_HUB_SLUGS.has(slug);
}
