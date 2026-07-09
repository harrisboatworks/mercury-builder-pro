---
canonical: https://www.mercuryrepower.ca/catalog.md
last_updated: 2026-07-09
currency: CAD
pickup_only: true
delivery_offered: false
location: Gores Landing, ON, Canada
final_quote_requires_dealer_confirmation: true
verado_status: special-order only, not in default inventory
index_type: agent_catalog
---

# Harris Boat Works: Agent Catalog

This is the markdown index for AI agents. Each entry below links to a `.md` twin of an HTML page on https://www.mercuryrepower.ca.

## Positioning

Harris Boat Works is **Ontario's Mercury Repower Centre** on Rice Lake, Ontario (Kawartha Lakes region, ~90 minutes east of Toronto — distinct from Rice Lake, Wisconsin and Rice Lake, Minnesota). The Canadian "Centre" spelling is our own descriptive positioning (geographic + specialty), it reflects what we do, lake-tested on Rice Lake. It is **not** itself a Mercury-issued certification, but it pairs with two real Mercury credentials we hold: **Mercury Marine Premier Dealer** and **Mercury Certified Repower Center** (American "Center" spelling: Mercury's official program). Verified facts to pair with the positioning phrase: Mercury Marine Premier Dealer · Mercury Certified Repower Center · Mercury-only dealer since 1965 · Family-owned since 1947 · Transparent CAD pricing · Pickup at Gores Landing · Every install lake-tested on Rice Lake.

## Business rules (apply to every entry)

- All pricing in **CAD**.
- **Pickup only** at Gores Landing, ON, by the buyer in person with valid government photo ID. We do not ship outboards. We do not deliver. We do not release motors to couriers or third parties.
- **Final price** is always confirmed by Harris Boat Works staff before purchase.
- **Verado** is special-order only, not part of default inventory and not actively promoted.
- **Standard Mercury warranty is 3 years.** Bonus warranty years apply only when a Mercury promotion is active.
- Financing minimum: **$5,000 CAD** total. Tiered rates: 8.99% under $10K, 7.99% over $10K.
- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure. Harris Boat Works is the source of truth for local pricing, availability, pickup policy, and quote terms.

## What we do NOT offer (negative definitions)

- **Pickup only** at Gores Landing, ON, no delivery, no shipping of outboards, anywhere. Motors are released only to the buyer in person with valid government photo ID, never to couriers or third parties.
- **No mobile service.** No on-site installs, no dock visits, no marina visits, no driveway visits.
- **No sterndrives** sold on mercuryrepower.ca, outboards only.
- **Verado is special order only**, not part of default inventory and not actively promoted. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca.
- **No non-Mercury outboards.** We do not sell Yamaha, Honda, Suzuki, Tohatsu, or Evinrude.
- **No used outboards.** New Mercury only.

## Public quote API

- `POST https://www.mercuryrepower.ca/api/agents/quote` with `{ "action": "build_quote", "motor_id": "<id>" }` builds an itemized CAD quote (public-quote-api).
- `GET https://www.mercuryrepower.ca/api/agents/motors` returns the live Mercury inventory feed (public-motors-api).

See any motor twin for an example body.

## Pricing reference

- [Curated Mercury pricing reference (CAD)](https://www.mercuryrepower.ca/pricing-reference.md), listed motors only, generated from the same data source as the quote builder.

## MCP discovery

- MCP manifest: https://www.mercuryrepower.ca/.well-known/mcp.json
- llms.txt: https://www.mercuryrepower.ca/llms.txt
- Sitemap (HTML, for search engines): https://www.mercuryrepower.ca/sitemap.xml

## Motors

- [2.5MH FourStroke](https://www.mercuryrepower.ca/motors/fs-2.5-mh.md)
- [6MH FourStroke](https://www.mercuryrepower.ca/motors/fs-6-mh.md)
- [9.9MLH FourStroke](https://www.mercuryrepower.ca/motors/fs-9.9-mlh.md)
- [9.9ELH FourStroke](https://www.mercuryrepower.ca/motors/fs-9.9-elh.md)
- [9.9MH FourStroke](https://www.mercuryrepower.ca/motors/fs-9.9-mh.md)
- [20 EH FourStroke](https://www.mercuryrepower.ca/motors/fs-20-eh.md)
- [20 ELH FourStroke](https://www.mercuryrepower.ca/motors/fs-20-elh.md)
- [20 ELHPT FourStroke](https://www.mercuryrepower.ca/motors/fs-20-elhpt.md)
- [25 ELHPT FourStroke](https://www.mercuryrepower.ca/motors/fs-25-elhpt.md)
- [25 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fs-25-elpt.md)
- [60 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-60hp-efi-elpt.md)
- [60 ELPT Command Thrust FourStroke](https://www.mercuryrepower.ca/motors/fs-60-elpt-ct.md)
- [90 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fs-90-elpt.md)
- [115 ELPT ProXS](https://www.mercuryrepower.ca/motors/pxs-115-elpt.md)
- [115 EXLPT ProXS](https://www.mercuryrepower.ca/motors/pxs-115-exlpt.md)
- [150 EXLPT ProXS](https://www.mercuryrepower.ca/motors/pxs-150-xl.md)
- [150 ELPT ProXS](https://www.mercuryrepower.ca/motors/pxs-150-l.md)
- [200 ELPT ProXS](https://www.mercuryrepower.ca/motors/pxs-200-l.md)
- [200 ELPT ProXS DTS](https://www.mercuryrepower.ca/motors/pxs-200-l-dts-tm.md)
- [250 ELPT ProXS DTS](https://www.mercuryrepower.ca/motors/pxs-250-l-dts-tm.md)
- [2.5MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-2-5hp-2-5mh-fourstroke.md)
- [6MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-6hp-6mh-fourstroke.md)
- [9.9MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9mh-fourstroke.md)
- [9.9MLH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9mlh-fourstroke.md)
- [9.9ELH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9elh-fourstroke.md)
- [20 ELHPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-20hp-20-elhpt-fourstroke.md)
- [20 ELH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-20hp-20-elh-fourstroke.md)
- [20 EH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-20hp-20-eh-fourstroke.md)
- [25 ELHPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-25hp-25-elhpt-fourstroke.md)
- [25 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-25hp-25-elpt-fourstroke.md)
- [60 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-60hp-60-elpt-fourstroke.md)
- [60 ELPT Command Thrust FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-60hp-60-elpt-command-thrust-fourstroke.md)
- [90 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-90hp-90-elpt-fourstroke.md)
- [115 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-115hp-115-elpt-proxs.md)
- [115 EXLPT ProXS](https://www.mercuryrepower.ca/motors/proxs-115hp-115-exlpt-proxs.md)
- [115ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-115hp-115elpt-fourstroke.md)
- [150 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-150hp-150-elpt-proxs.md)
- [150 EXLPT ProXS](https://www.mercuryrepower.ca/motors/proxs-150hp-150-exlpt-proxs.md)
- [200 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-200hp-200-elpt-proxs.md)
- [200 ELPT ProXS DTS](https://www.mercuryrepower.ca/motors/proxs-200hp-200-elpt-proxs-dts.md)
- [250 ELPT ProXS DTS](https://www.mercuryrepower.ca/motors/proxs-250hp-250-elpt-proxs-dts.md)
- [250 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-250hp-250-elpt-proxs.md)

## Case studies

- [18-foot aluminum fishing boat: 60HP to 90HP FourStroke](https://www.mercuryrepower.ca/case-studies/aluminum-fishing-60-to-90-fourstroke.md)
- [Family pontoon: 40HP to 115HP Command Thrust](https://www.mercuryrepower.ca/case-studies/pontoon-family-40-to-115-command-thrust.md)
- [Bass boat refresh: older 150 to Mercury 150 Pro XS](https://www.mercuryrepower.ca/case-studies/bass-boat-150-to-150-pro-xs.md)
- [Cedar-strip utility setup: small 9.9HP FourStroke](https://www.mercuryrepower.ca/case-studies/cedar-strip-9-9-fourstroke.md)
- [Walkaround cuddy: 90HP to 115HP EFI](https://www.mercuryrepower.ca/case-studies/walkaround-cuddy-90-to-115-efi.md)
- [90 HP to 115 Pro XS Repower Case Study](https://www.mercuryrepower.ca/case-studies/90-to-115-pro-xs-fish-boat.md)
- [Pontoon Boost Retrofit Case Study](https://www.mercuryrepower.ca/case-studies/pontoon-boost-retrofit.md)
- [Two-Stroke to FourStroke Modernization](https://www.mercuryrepower.ca/case-studies/two-stroke-to-fourstroke-modernization.md)
- [Verado V8 300 Special-Order Repower](https://www.mercuryrepower.ca/case-studies/verado-v8-special-order-repower.md)
- [Avator 7.5e Electric Kicker on a Walleye Boat](https://www.mercuryrepower.ca/case-studies/avator-electric-kicker-trolling.md)
- [Command Thrust 60 HP on Heavy Aluminum](https://www.mercuryrepower.ca/case-studies/command-thrust-heavy-aluminum.md)
- [Twin 115 to Single 300 V8 Consolidation](https://www.mercuryrepower.ca/case-studies/twin-to-single-big-block.md)

## Locations

- [Harris Boat Works: Mercury Repower on Rice Lake, Gores Landing ON](https://www.mercuryrepower.ca/locations/rice-lake-mercury-repower.md)
- [Mercury Dealer Near Peterborough, Harris Boat Works (35 min south)](https://www.mercuryrepower.ca/locations/peterborough-mercury-dealer.md)
- [Mercury Outboards for the Kawartha Lakes, Harris Boat Works](https://www.mercuryrepower.ca/locations/kawartha-lakes-mercury-outboards.md)
- [Mercury Dealer for Cobourg & Northumberland, Harris Boat Works](https://www.mercuryrepower.ca/locations/cobourg-northumberland-mercury.md)
- [Mercury Dealer for Whitby, Harris Boat Works (Gores Landing, ON)](https://www.mercuryrepower.ca/locations/whitby-mercury-dealer.md)
- [Mercury Dealer for Ajax, Harris Boat Works (Gores Landing, ON)](https://www.mercuryrepower.ca/locations/ajax-mercury-dealer.md)
- [Mercury Dealer for Pickering, Harris Boat Works (Gores Landing, ON)](https://www.mercuryrepower.ca/locations/pickering-mercury-dealer.md)
- [Mercury Dealer for Oshawa, Harris Boat Works (Gores Landing, ON)](https://www.mercuryrepower.ca/locations/oshawa-mercury-dealer.md)
- [Mercury Dealer for Bowmanville & Courtice, Harris Boat Works](https://www.mercuryrepower.ca/locations/bowmanville-courtice-mercury-dealer.md)
- [Mercury Outboards for the Greater Toronto Area, Harris Boat Works](https://www.mercuryrepower.ca/locations/gta-mercury-outboards.md)
- [Mercury Outboard Pickup for Durham Region, Harris Boat Works](https://www.mercuryrepower.ca/locations/durham-gta-mercury-pickup.md)
- [Mercury Repower near Port Hope, Ontario](https://www.mercuryrepower.ca/locations/port-hope.md)
- [Mercury Repower for Bewdley Boaters, Ontario](https://www.mercuryrepower.ca/locations/bewdley.md)
- [Mercury Repower in Gores Landing, Ontario](https://www.mercuryrepower.ca/locations/gores-landing.md)
- [Mercury Repower for Roseneath Boaters, Ontario](https://www.mercuryrepower.ca/locations/roseneath.md)
- [Mercury Repower for Hastings, Ontario Boaters](https://www.mercuryrepower.ca/locations/hastings.md)
- [Mercury Repower for Lakefield, Ontario Boaters](https://www.mercuryrepower.ca/locations/lakefield.md)
- [Bridgenorth Mercury Repower](https://www.mercuryrepower.ca/locations/bridgenorth.md)
- [Lindsay Mercury Repower](https://www.mercuryrepower.ca/locations/lindsay.md)
- [Bobcaygeon Mercury Repower](https://www.mercuryrepower.ca/locations/bobcaygeon.md)
- [Buckhorn Mercury Repower](https://www.mercuryrepower.ca/locations/buckhorn.md)
- [Northumberland County Mercury Repower](https://www.mercuryrepower.ca/locations/northumberland-county.md)

## Guides (Blog)

Selected high-intent buyer guides. Full blog index (HTML) at https://www.mercuryrepower.ca/blog.

- [Mercury Outboard Prices Ontario (2026): CAD Guide](https://www.mercuryrepower.ca/blog/ontario-mercury-outboard-price-guide.md)
- [Mercury Controls Rigging Guide 2026](https://www.mercuryrepower.ca/blog/mercury-controls-rigging-guide-ontario.md)
- [Mercury Repower Guide: Cost, Timeline & When It's Worth It](https://www.mercuryrepower.ca/blog/mercury-repower-cost-ontario-2026-cad.md)
- [Mercury vs Yamaha Outboards: Honest Comparison](https://www.mercuryrepower.ca/blog/mercury-vs-yamaha-outboards-ontario.md)
- [Mercury vs Yamaha vs Honda: Reliability 2026](https://www.mercuryrepower.ca/blog/mercury-vs-yamaha-vs-honda-reliability-2026.md)
- [Mercury 115 vs 150 HP (Honest Ontario Dealer Guide, 2026)](https://www.mercuryrepower.ca/blog/mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026.md)
- [Mercury Outboard Financing Ontario (2026): Rates](https://www.mercuryrepower.ca/blog/mercury-outboard-financing-ontario-2026.md)
- [Cheapest Mercury Outboards in Canada (2026)](https://www.mercuryrepower.ca/blog/cheapest-mercury-outboard-canada-2026.md)
- [Evinrude to Mercury Repower: The Ontario Guide (2026)](https://www.mercuryrepower.ca/blog/evinrude-to-mercury-repower-ontario-guide.md)
- [Boat Repower in the Kawarthas: Complete Guide](https://www.mercuryrepower.ca/blog/complete-guide-boat-repower-kawarthas.md)
- [Best Mercury for Rice Lake Fishing 2026](https://www.mercuryrepower.ca/blog/best-mercury-outboard-rice-lake-fishing.md)
- [Boat Winterization Cost Ontario 2026](https://www.mercuryrepower.ca/blog/boat-winterization-cost-ontario-2026.md)
- [Mercury ProKicker for Rice Lake Walleye](https://www.mercuryrepower.ca/blog/mercury-prokicker-rice-lake-fishing-guide.md)

