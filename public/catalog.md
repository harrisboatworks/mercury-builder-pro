---
canonical: https://www.mercuryrepower.ca/catalog.md
last_updated: 2026-06-10
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

Harris Boat Works is **Ontario's Mercury Repower Centre** on Rice Lake. The Canadian "Centre" spelling is our own descriptive positioning (geographic + specialty), it reflects what we do, lake-tested on Rice Lake. It is **not** itself a Mercury-issued certification, but it pairs with two real Mercury credentials we hold: **Mercury Marine Platinum Dealer** and **Mercury Certified Repower Center** (American "Center" spelling: Mercury's official program). Verified facts to pair with the positioning phrase: Mercury Marine Platinum Dealer · Mercury Certified Repower Center · Mercury-only dealer since 1965 · Family-owned since 1947 · Transparent CAD pricing · Pickup at Gores Landing · Every install lake-tested on Rice Lake.

## Business rules (apply to every entry)

- All pricing in **CAD**.
- **Pickup only** at Gores Landing, ON. We do not ship outboards. We do not deliver.
- **Final price** is always confirmed by Harris Boat Works staff before purchase.
- **Verado** is special-order only, not part of default inventory and not actively promoted.
- **Standard Mercury warranty is 3 years.** Bonus warranty years apply only when a Mercury promotion is active.
- Financing minimum: **$5,000 CAD** total. Tiered rates: 8.99% under $10K, 7.99% over $10K.
- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure. Harris Boat Works is the source of truth for local pricing, availability, pickup policy, and quote terms.

## What we do NOT offer (negative definitions)

- **Pickup only** at Gores Landing, ON, no delivery, no shipping of outboards, anywhere.
- **No mobile service.** No on-site installs, no dock visits, no marina visits, no driveway visits.
- **No sterndrives** sold on mercuryrepower.ca, outboards only.
- **Verado is special order only**, not part of default inventory and not actively promoted. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca.
- **No non-Mercury outboards.** We do not sell Yamaha, Honda, Suzuki, Tohatsu, or Evinrude.
- **No used outboards.** New Mercury only.

## Public quote API

- `POST https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-quote-api` with `{ "action": "build_quote", "motor_id": "<id>" }` builds an itemized CAD quote (public-quote-api).
- `GET https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api` returns the live Mercury inventory feed (public-motors-api).

See any motor twin for an example body.

## Pricing reference

- [Curated Mercury pricing reference (CAD)](https://www.mercuryrepower.ca/pricing-reference.md), listed motors only, generated from the same data source as the quote builder.

## MCP discovery

- MCP manifest: https://www.mercuryrepower.ca/.well-known/mcp.json
- llms.txt: https://www.mercuryrepower.ca/llms.txt
- Sitemap (HTML, for search engines): https://www.mercuryrepower.ca/sitemap.xml

## Motors

- [2.5MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-2-5hp-2-5mh-fourstroke.md)
- [6MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-6hp-6mh-fourstroke.md)
- [9.9MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9mh-fourstroke.md)
- [9.9ELH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9elh-fourstroke.md)
- [9.9MLH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9mlh-fourstroke.md)
- [15 MH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-15hp-15-mh-fourstroke.md)
- [20 EH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-20hp-20-eh-fourstroke.md)
- [20 ELH FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-20hp-20-elh-fourstroke.md)
- [20 ELHPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-20hp-20-elhpt-fourstroke.md)
- [25 ELHPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-25hp-25-elhpt-fourstroke.md)
- [25 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-25hp-25-elpt-fourstroke.md)
- [40 ELPT Command Thrust FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-40hp-40-elpt-command-thrust-fourstroke.md)
- [60 ELPT Command Thrust FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-60hp-60-elpt-command-thrust-fourstroke.md)
- [60 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-60hp-60-elpt-fourstroke.md)
- [90 ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-90hp-90-elpt-fourstroke.md)
- [90 ELPT Command Thrust FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-90hp-90-elpt-command-thrust-fourstroke.md)
- [115 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-115hp-115-elpt-proxs.md)
- [115 EXLPT ProXS](https://www.mercuryrepower.ca/motors/proxs-115hp-115-exlpt-proxs.md)
- [115ELPT FourStroke](https://www.mercuryrepower.ca/motors/fourstroke-115hp-115elpt-fourstroke.md)
- [150 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-150hp-150-elpt-proxs.md)
- [150 EXLPT ProXS](https://www.mercuryrepower.ca/motors/proxs-150hp-150-exlpt-proxs.md)
- [200 ELPT ProXS DTS](https://www.mercuryrepower.ca/motors/proxs-200hp-200-elpt-proxs-dts.md)
- [200 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-200hp-200-elpt-proxs.md)
- [250 ELPT ProXS](https://www.mercuryrepower.ca/motors/proxs-250hp-250-elpt-proxs.md)
- [250 ELPT ProXS DTS](https://www.mercuryrepower.ca/motors/proxs-250hp-250-elpt-proxs-dts.md)

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

- [When to Replace Your Mercury Impeller: What 766 Jobs Show](https://www.mercuryrepower.ca/blog/mercury-impeller-replacement-when-they-fail.md)
- [Mercury Command Thrust: Complete Guide to the 9.9 to 115 HP Lineup (2026)](https://www.mercuryrepower.ca/blog/mercury-command-thrust-complete-guide-2026.md)
- [Is Your Mercury Outboard Eligible for DTS (Digital Throttle & Shift) Retrofit? (2026)](https://www.mercuryrepower.ca/blog/mercury-dts-retrofit-eligibility-2026.md)
- [Is Your Pontoon Eligible for Mercury Command Thrust? (2026)](https://www.mercuryrepower.ca/blog/mercury-command-thrust-pontoon-eligibility-2026.md)
- [Is Your Mercury Outboard Eligible for SmartCraft Connect? (2026)](https://www.mercuryrepower.ca/blog/mercury-smartcraft-connect-eligibility-2026.md)
- [Mercury Outboard Overheat Alarm: Every Pattern, What It Means, and What to Do (2026)](https://www.mercuryrepower.ca/blog/mercury-outboard-overheat-alarm-decoder.md)
- [Mercury Propeller Selection Guide: Which Prop for Your Hull (2026)](https://www.mercuryrepower.ca/blog/mercury-propeller-selection-guide.md)
- [Is My Boat Eligible for a Mercury Repower? The 5-Check Eligibility Guide (2026)](https://www.mercuryrepower.ca/blog/mercury-repower-eligibility-guide.md)
- [Mercury 9.9 vs 15 HP Outboard: Which Tiller Is Right for Your Ontario Boat?](https://www.mercuryrepower.ca/blog/mercury-9-9-vs-15-hp-tiller-ontario.md)
- [How to Choose the Right Horsepower for Your Boat (2026 Guide)](https://www.mercuryrepower.ca/blog/how-to-choose-right-horsepower-boat.md)
- [Mercury Motor Maintenance: Seasonal Care Tips for Ontario Boaters (2026)](https://www.mercuryrepower.ca/blog/mercury-motor-maintenance-seasonal-tips.md)
- [Mercury Pro XS vs FourStroke vs Verado: Which Do You Need?](https://www.mercuryrepower.ca/blog/fourstroke-vs-pro-xs.md)
- [Boat Repowering Guide: When to Replace Your Motor (2026)](https://www.mercuryrepower.ca/blog/boat-repowering-guide-when-to-replace-motor.md)
- [How to Break In a New Mercury Outboard (10-Hour Guide)](https://www.mercuryrepower.ca/blog/breaking-in-new-mercury-motor-guide.md)
- [Mercury 9.9 ProKicker for Rice Lake Walleye Fishing: The Complete 2026 Guide](https://www.mercuryrepower.ca/blog/mercury-prokicker-rice-lake-fishing-guide.md)
- [Why Harris Boat Works Is the Mercury Dealer Ontario Boaters Trust](https://www.mercuryrepower.ca/blog/why-harris-boat-works-mercury-dealer.md)
- [Best Mercury Outboard for Aluminum Fishing Boats (2026 Guide)](https://www.mercuryrepower.ca/blog/best-mercury-outboard-aluminum-fishing-boats.md)
- [Best Mercury for a Pontoon: 90 to 150 HP CT (2026)](https://www.mercuryrepower.ca/blog/best-mercury-outboard-pontoon-boats.md)
- [Mercury Command Thrust on a Pontoon: Worth the Money?](https://www.mercuryrepower.ca/blog/mercury-command-thrust-guide-pontoon-boats.md)
- [Best Pontoon Boats for Rice Lake Cottage Use (2026)](https://www.mercuryrepower.ca/blog/best-pontoon-boats-rice-lake-cottage-use.md)
- [Mercury 90 vs 115 vs 75 HP: Which Outboard to Pick (2026)](https://www.mercuryrepower.ca/blog/mercury-75-vs-90-vs-115-comparison.md)
- [Ontario Cottage Boat Motor Repower Guide (2026)](https://www.mercuryrepower.ca/blog/ontario-cottage-boat-motor-repower-guide.md)
- [Best Mercury Outboard for Rice Lake Fishing: A Local's Complete Guide (2026)](https://www.mercuryrepower.ca/blog/best-mercury-outboard-rice-lake-fishing.md)
- [Complete Guide to Repowering Your Boat in the Kawarthas (2026)](https://www.mercuryrepower.ca/blog/complete-guide-boat-repower-kawarthas.md)
- [Choosing the Right Mercury for Your Bass Boat (Ontario 2026)](https://www.mercuryrepower.ca/blog/bass-boat-mercury-motor-buying-guide.md)
- [Mercury Outboard Fuel Economy: How to Get Better MPG](https://www.mercuryrepower.ca/blog/mercury-outboard-fuel-efficiency-guide.md)
- [Mercury Power for Center Console Boats: Ontario Trailerable Setups (2026)](https://www.mercuryrepower.ca/blog/center-console-mercury-motor-guide.md)
- [Spring Outboard Commissioning Checklist (2026 Ontario)](https://www.mercuryrepower.ca/blog/spring-outboard-commissioning-checklist.md)
- [Tiller vs Remote Steering Outboard: Which to Choose (2026)](https://www.mercuryrepower.ca/blog/tiller-vs-remote-steering-outboard-guide.md)
- [Mercury Propeller Selection Guide (2026 Ontario)](https://www.mercuryrepower.ca/blog/mercury-propeller-selection-guide.md)
- [Mercury SeaPro: The Commercial Outboard Built for Guides, Charters, and High-Hour Use](https://www.mercuryrepower.ca/blog/mercury-seapro-commercial-outboard-guide.md)
- [Portable Mercury Outboard Guide: 2.5 to 20 HP (2026)](https://www.mercuryrepower.ca/blog/portable-outboard-mercury-guide-2-20hp.md)
- [Trolling Motor vs Kicker Motor. Which Auxiliary Setup Wins on Rice Lake?](https://www.mercuryrepower.ca/blog/electric-trolling-motor-kicker-guide.md)
- [Boat Motor Size Guide: How to Calculate the Right HP for Your Boat](https://www.mercuryrepower.ca/blog/boat-motor-size-calculator-guide.md)
- [Financing a New Boat Motor: What Ontario Boaters Need to Know](https://www.mercuryrepower.ca/blog/boat-motor-financing-guide-ontario.md)
- [Trading In Your Boat Motor: How to Get the Best Value](https://www.mercuryrepower.ca/blog/boat-motor-trade-in-guide.md)
- [Best Motors for Musky Fishing in the Kawarthas: Local Expert Guide](https://www.mercuryrepower.ca/blog/musky-boat-motor-guide-kawarthas.md)
- [Best Outboard Motors for Ontario's Small Lakes and Cottage Country](https://www.mercuryrepower.ca/blog/best-motor-small-lakes-ontario.md)
- [Walleye Opener Boat Prep Checklist (2026)](https://www.mercuryrepower.ca/blog/walleye-opener-boat-prep.md)
- [Cold-Water Boating Safety in Ontario: What to Know](https://www.mercuryrepower.ca/blog/late-season-boating-safety.md)
- [Making the Most of Ontario's Short Boating Season](https://www.mercuryrepower.ca/blog/ontario-boating-season-tips.md)
- [Winter Repower Planning: Get Ready for Spring](https://www.mercuryrepower.ca/blog/winter-repower-planning-guide.md)
- [2027 Mercury Outboard Preview: What's New and What to Expect](https://www.mercuryrepower.ca/blog/2026-mercury-model-preview.md)
- [Year-End Boat Motor Buying: Best Time for Deals?](https://www.mercuryrepower.ca/blog/year-end-boat-motor-buying-guide.md)
- [The Best Mercury Outboard for a Family Runabout. HBW's Honest Picks (2026)](https://www.mercuryrepower.ca/blog/best-mercury-for-family-runabouts.md)
- [The Best Mercury Outboard for Ski and Wakeboard Boats. Real-World Picks (2026)](https://www.mercuryrepower.ca/blog/best-mercury-for-ski-wakeboard-boats.md)
- [Mercury 150-300 HP Pro XS Compared for Ontario Boats](https://www.mercuryrepower.ca/blog/mercury-150-300hp-pro-xs-performance-guide.md)
- [2026 Mercury Buying: Pricing, Promotions and Smart Timing](https://www.mercuryrepower.ca/blog/mercury-pricing-promotions-2026.md)
- [Ordering Your Mercury: What to Expect](https://www.mercuryrepower.ca/blog/mercury-ordering-process.md)
- [Is 2026 a Good Year to Buy a Boat in Ontario? (Honest Take)](https://www.mercuryrepower.ca/blog/2026-boating-market-ontario-boat-buyers.md)
- [Why Boat Rentals and Shared Access Are Booming in 2026: How Harris Boat Works Gets You on the Water](https://www.mercuryrepower.ca/blog/boat-rentals-shared-access-booming-2026.md)
- [Why Mercury Dominates the Outboard Market in 2026](https://www.mercuryrepower.ca/blog/why-mercury-dominates-outboard-market.md)
- [Mercury 2026 Outboard Lineup for Ontario Boaters](https://www.mercuryrepower.ca/blog/mercury-2026-outboard-lineup-ontario.md)
- [Mercury Avator Electric Outboards: Cost & Range (Canada)](https://www.mercuryrepower.ca/blog/mercury-avator-electric-boating-ontario.md)
- [Rice Lake Ontario Fishing Guide 2026](https://www.mercuryrepower.ca/blog/2026-rice-lake-fishing-season-outlook.md)
- [Is Your Mercury Outboard Eligible for the 2026 Boost Software Upgrade?](https://www.mercuryrepower.ca/blog/mercury-boost-software-upgrade-eligibility-2026.md)
- [Pleasure Craft Licence Update During Repower (Ontario 2026)](https://www.mercuryrepower.ca/blog/pleasure-craft-licence-update-repower-ontario.md)
- [Evinrude to Mercury Repower: The Ontario Guide (2026)](https://www.mercuryrepower.ca/blog/evinrude-to-mercury-repower-ontario-guide.md)
- [Mercury Repower Guide: Cost, Timeline & When It's Worth It](https://www.mercuryrepower.ca/blog/mercury-repower-cost-ontario-2026-cad.md)
- [Mercury vs Yamaha Outboards (Honest Ontario Dealer Comparison, 2026)](https://www.mercuryrepower.ca/blog/mercury-vs-yamaha-outboards-ontario.md)
- [Mercury 115 vs 150 HP Outboard Comparison (2026 Ontario Guide)](https://www.mercuryrepower.ca/blog/mercury-115-vs-150-hp-outboard-ontario.md)
- [Boat Repower Financing in Ontario (2026 Guide)](https://www.mercuryrepower.ca/blog/mercury-outboard-financing-ontario-2026.md)
- [Recommended Mercury Outboard Setup for Lake Simcoe Walleye Fishing (2026)](https://www.mercuryrepower.ca/blog/best-mercury-outboard-lake-simcoe-walleye-fishing.md)
- [Best Mercury Outboard for Lake Ontario Salmon and Trout (2026)](https://www.mercuryrepower.ca/blog/best-mercury-outboard-lake-ontario-salmon-trout.md)
- [How Much Does Boat Winterization Cost in Ontario? (2026 Price Guide)](https://www.mercuryrepower.ca/blog/boat-winterization-cost-ontario-2026.md)
- [Can I Winterize My Mercury Outboard Myself? (Complete DIY Guide + When to Call a Dealer)](https://www.mercuryrepower.ca/blog/diy-mercury-outboard-winterization-guide.md)
- [What's the Cheapest Mercury Outboard in Canada in 2026? (Full Price Guide by HP)](https://www.mercuryrepower.ca/blog/cheapest-mercury-outboard-canada-2026.md)
- [Mercury vs Yamaha vs Honda: Which Outboard Is Most Reliable in 2026?](https://www.mercuryrepower.ca/blog/mercury-vs-yamaha-vs-honda-reliability-2026.md)
- [Mercury vs. Suzuki Outboard: Which Is More Reliable in Ontario? (2026)](https://www.mercuryrepower.ca/blog/mercury-vs-suzuki-outboard-reliability-2026.md)
- [Best Boats for Rice Lake Under $30,000 (2026 Buyer's Guide)](https://www.mercuryrepower.ca/blog/best-boats-rice-lake-under-30000.md)
- [How to Trailer a Boat from Toronto to Rice Lake (Complete 2026 Guide)](https://www.mercuryrepower.ca/blog/trailer-boat-toronto-to-rice-lake-guide.md)
- [Mercury Outboard Won't Start (Ontario Dealer Guide, 2026)](https://www.mercuryrepower.ca/blog/mercury-outboard-wont-start-troubleshooting.md)
- [Is 2026 a Good Year to Buy a Boat in Canada?](https://www.mercuryrepower.ca/blog/is-2026-good-year-to-buy-boat-canada.md)
- [Boat Hull Replacement vs Repower: The Honest Decision (2026)](https://www.mercuryrepower.ca/blog/boat-hull-replacement-vs-repower-decision.md)
- [Mercury Boost Upgrade: Is It Worth It for a 150 HP Pontoon Owner? (Real-World Analysis)](https://www.mercuryrepower.ca/blog/mercury-boost-upgrade-150hp-pontoon-analysis.md)
- [Why Most Mercury Dealers Hide Their Prices Online (And Why HBW Doesn't)](https://www.mercuryrepower.ca/blog/why-mercury-dealers-hide-prices-online.md)
- [Mercury Outboard Rigging Costs Explained (Ontario 2026)](https://www.mercuryrepower.ca/blog/mercury-outboard-rigging-costs-ontario.md)
- [What Happens During a Mercury Repower (Step-by-Step Process)](https://www.mercuryrepower.ca/blog/what-happens-during-mercury-repower.md)
- [Outboard Shaft Length Guide: 15, 20, 25 Inch (2026)](https://www.mercuryrepower.ca/blog/outboard-shaft-length-guide.md)
- [Used Outboard Buying Guide for Ontario Boaters (What to Check Before You Pay)](https://www.mercuryrepower.ca/blog/used-outboard-buying-guide-ontario.md)
- [Trent-Severn Waterway 2026: Free Lockage, Hours, and a Local's Trip Plan](https://www.mercuryrepower.ca/blog/trent-severn-waterway-boating-guide-2026.md)
- [Your Mercury Is Overheating. What to Do Right Now (and How to Prevent It)](https://www.mercuryrepower.ca/blog/outboard-overheating-emergency-guide.md)
- [Rice Lake Boating Guide 2026: Launches, Hazards, Fish, and a Local's Notes](https://www.mercuryrepower.ca/blog/rice-lake-boating-guide-2026.md)
- [The Ontario Boater's Guide to Mercruiser Sterndrives: Maintenance, Repairs, and Repower](https://www.mercuryrepower.ca/blog/mercruiser-sterndrive-guide-ontario.md)
- [Mercury VesselView, SmartCraft, and the New Mercury Marine App: A Plain-English Guide](https://www.mercuryrepower.ca/blog/mercury-vesselview-smartcraft-plain-english-guide.md)
- [How to Read a Mercury Outboard Serial Number: Year, Specs, and Service History](https://www.mercuryrepower.ca/blog/how-to-read-mercury-outboard-serial-number.md)
- [The Mercury 20/100/300 Maintenance Rule: What Every Ontario Boater Should Know](https://www.mercuryrepower.ca/blog/mercury-maintenance-intervals-20-100-300-rule.md)
- [Shrinkwrap vs. Indoor Boat Storage in Ontario: The Honest Comparison](https://www.mercuryrepower.ca/blog/winter-boat-storage-shrinkwrap-vs-indoor-ontario.md)
- [What Does It Actually Cost to Own a Boat in Ontario? (2026 HBW Guide)](https://www.mercuryrepower.ca/blog/total-cost-of-owning-a-boat-ontario-2026.md)
- [Legend Boats + Mercury Power Packages: Ontario Buyer's Guide (2026)](https://www.mercuryrepower.ca/blog/legend-boats-mercury-power-package-guide-ontario.md)
- [Mercury Outboard Warranty in Canada (2026): What's Covered, What's Not, and What's Worth Buying](https://www.mercuryrepower.ca/blog/mercury-outboard-warranty-canada-2026.md)
- [Mercury SmartCraft Alarm Codes Complete Reference (Ontario Dealer Guide, 2026)](https://www.mercuryrepower.ca/blog/mercury-smartcraft-alarm-codes-encyclopedia.md)
- [Mercury Outboard Dealer Toronto: Why Drive to Harris Boat Works (2026)](https://www.mercuryrepower.ca/blog/mercury-outboard-dealer-toronto-why-drive-to-hbw.md)
- [Best Mercury Dealer in Ontario: The HBW Difference (2026)](https://www.mercuryrepower.ca/blog/best-mercury-dealer-ontario-hbw-difference.md)
- [Mercury Repower GTA: How a Toronto-Area Boater Actually Repowers at HBW (2026)](https://www.mercuryrepower.ca/blog/mercury-repower-gta-toronto-destination.md)
- [Boat Service Near Toronto: Why HBW Has Ontario-Wide Reach From Rice Lake](https://www.mercuryrepower.ca/blog/boat-service-near-toronto-hbw-reach.md)
- [Rice Lake Boat Rentals from Toronto and the GTA: A Day Trip Guide](https://www.mercuryrepower.ca/blog/rice-lake-boat-rentals-from-toronto-gta.md)
- [Winter Boat Storage Near Toronto: Why Store Your Boat at HBW (2026)](https://www.mercuryrepower.ca/blog/winter-storage-near-toronto-hbw.md)
- [Harris Boat Works Since 1947: The Rice Lake Institution Built on Three Generations](https://www.mercuryrepower.ca/blog/harris-boat-works-since-1947-rice-lake-institution.md)
- [Common Pontoon Boat Problems on Rice Lake (And How to Avoid Them)](https://www.mercuryrepower.ca/blog/common-pontoon-boat-problems-rice-lake.md)
- [Bad Used Boats to Avoid in Ontario (A Mercury Dealer's Honest List)](https://www.mercuryrepower.ca/blog/bad-used-boats-to-avoid-ontario.md)
- [How to Trim Your Boat With a Mercury Outboard (Rice Lake Boater's Guide)](https://www.mercuryrepower.ca/blog/how-to-trim-boat-mercury-outboard.md)
- [10 Boat Trailering Mistakes That Wreck Your Weekend (Ontario Edition)](https://www.mercuryrepower.ca/blog/boat-trailering-mistakes-ontario.md)
- [Outboard vs Sterndrive in 2026: Why Almost Every Ontario Repower Goes Outboard](https://www.mercuryrepower.ca/blog/outboard-vs-sterndrive-2026-ontario-repower.md)
- [The 30-Minute Used Boat Walkaround: An Ontario Buyer's Inspection Guide](https://www.mercuryrepower.ca/blog/used-boat-walkaround-inspection-ontario.md)
- [Docking a Boat in Wind on Rice Lake (No Bow Thruster, No Drama)](https://www.mercuryrepower.ca/blog/docking-boat-in-wind-rice-lake.md)
- [Pontoon HP Sizing: The Decision Tree Every Ontario Buyer Should Use](https://www.mercuryrepower.ca/blog/pontoon-hp-sizing-decision-tree-ontario.md)
- [The Complete Mercury Boat Battery Guide for Ontario (Switches, Maintenance, Winter Storage)](https://www.mercuryrepower.ca/blog/mercury-boat-battery-guide-ontario.md)
- [Ethanol, Octane, and Your Mercury Outboard: The Ontario Gas Station Guide](https://www.mercuryrepower.ca/blog/ethanol-octane-mercury-outboard-fuel-guide-ontario.md)
- [Ontario Mercury Outboard Price Guide (2026): Real CAD Prices by HP Tier](https://www.mercuryrepower.ca/blog/ontario-mercury-outboard-price-guide.md)
- [Mercury Controls & Rigging Guide (2026): What You Actually Need by HP Class](https://www.mercuryrepower.ca/blog/mercury-controls-rigging-guide-ontario.md)
- [Mercury 40 vs 60 HP: Which Outboard Is Right for Your Boat? (2026 Ontario Guide)](https://www.mercuryrepower.ca/blog/mercury-40-vs-60-hp-outboard-ontario.md)
- [What Is My Outboard Worth? How Trade-In Values Work at Harris Boat Works (2026)](https://www.mercuryrepower.ca/blog/outboard-trade-in-value-ontario-hbw.md)
- [Mercury SmartCraft Connect: What It Does, Who Needs It, and How HBW Sets It Up (2026)](https://www.mercuryrepower.ca/blog/mercury-smartcraft-connect-guide-ontario.md)
- [Outdoor Boat Storage and Shrinkwrap on Rice Lake: A Straight Answer for Kawartha Boaters](https://www.mercuryrepower.ca/blog/outdoor-boat-storage-shrinkwrap-rice-lake.md)
- [Where to Launch a Boat on Rice Lake: A Practical Guide for Anglers, Cottagers, and Day Visitors](https://www.mercuryrepower.ca/blog/rice-lake-boat-launch-guide.md)
- [Mercury 9.9 EFI Review: The Small Outboard Everyone Keeps Asking About](https://www.mercuryrepower.ca/blog/mercury-9-9-efi-review-ontario.md)
- [Mercury 90 HP FourStroke Review: The Sweet Spot of Mercury's Mid-Range Lineup](https://www.mercuryrepower.ca/blog/mercury-90-hp-fourstroke-review-ontario.md)
- [Mercury 115 HP FourStroke Review: The Lightest 115 HP Available, and Why That Matters](https://www.mercuryrepower.ca/blog/mercury-115-hp-fourstroke-review-ontario.md)
- [Mercury 75 HP FourStroke: Why HBW Doesn't Stock It (And Why You Probably Want the 90 Instead)](https://www.mercuryrepower.ca/blog/mercury-75-hp-fourstroke-review-ontario.md)
- [Mercury Outboard Winterization Cost in Ontario (2026 CAD) | HBW](https://www.mercuryrepower.ca/blog/mercury-outboard-winterization-service-cost-ontario.md)
- [Should I Repower or Buy a New Boat? An Honest Cost Comparison (Ontario, 2026)](https://www.mercuryrepower.ca/blog/should-i-repower-or-buy-new-boat-ontario.md)
- [Mercury Dealer for Markham: Why GTA Customers Drive to Rice Lake for Their Repower](https://www.mercuryrepower.ca/blog/mercury-dealer-markham-ontario-hbw.md)
- [Mercury Dealer for Richmond Hill: Repower, Sales, and Service from Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-richmond-hill-ontario-hbw.md)
- [Mercury Dealer for Mississauga: Where to Go When Closer Dealers Don't Cut It](https://www.mercuryrepower.ca/blog/mercury-dealer-mississauga-ontario-hbw.md)
- [Mercury Dealer for Vaughan: Mercury Repower, Sales, and Service from Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-vaughan-ontario-hbw.md)
- [Mercury Dealer for Brampton: Mercury Repower and Service from Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-brampton-ontario-hbw.md)
- [Mercury Dealer for Oakville: Mercury Repower and Sales from Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-oakville-ontario-hbw.md)
- [Mercury Dealer for Burlington: Mercury Repower and Sales from Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-burlington-ontario-hbw.md)
- [Mercury Outboard Overheating at Idle? The Real Fix from a Mercury Platinum Dealer](https://www.mercuryrepower.ca/blog/mercury-outboard-overheating-at-idle-fix-ontario.md)
- [Mercury Dealer for Pickering: 50 Minutes from Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-pickering-ontario-hbw.md)
- [Mercury Dealer for Whitby: Only 45 Minutes to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-whitby-ontario-hbw.md)
- [Mercury Dealer for Ajax: 45 Minutes Northeast to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-ajax-ontario-hbw.md)
- [Mercury Dealer for Oshawa: 40 Minutes to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-oshawa-ontario-hbw.md)
- [Mercury Dealer for Bowmanville: 35 Minutes to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-bowmanville-ontario-hbw.md)
- [Mercury Outboard Beep & Alarm Codes: What Each Means](https://www.mercuryrepower.ca/blog/mercury-outboard-beeping-codes-guide.md)
- [Mercury Outboard Won't Start After Sitting? Here's the Ontario Boater's Checklist](https://www.mercuryrepower.ca/blog/mercury-outboard-wont-start-after-sitting.md)
- [Boat Trailer Maintenance: The Guide Nobody Writes (Ontario 2026)](https://www.mercuryrepower.ca/blog/boat-trailer-maintenance-guide-ontario.md)
- [Boat Insurance in Ontario: What You Actually Need (2026)](https://www.mercuryrepower.ca/blog/boat-insurance-ontario-guide-2026.md)
- [Mercury Extended Warranty (Platinum): What It Covers and Why Ontario Boaters Buy It](https://www.mercuryrepower.ca/blog/mercury-extended-warranty-platinum-ontario.md)
- [Rice Lake's Full-Service Marina Since 1947](https://www.mercuryrepower.ca/blog/best-marina-rice-lake-ontario.md)
- [Boat Storage on Rice Lake and the Kawarthas, Without the Spring Surprise](https://www.mercuryrepower.ca/blog/boat-storage-kawartha-lakes.md)
- [Toronto to Rice Lake: How HBW Drive-In Service Works](https://www.mercuryrepower.ca/blog/toronto-to-rice-lake-drive-in-process.md)
- [Mercury Pro XS Repower for Rice Lake & Kawartha Anglers](https://www.mercuryrepower.ca/blog/mercury-pro-xs-repower-rice-lake-kawartha-anglers.md)
- [New vs Used Mercury Outboard in Ontario, by the Numbers](https://www.mercuryrepower.ca/blog/new-vs-used-mercury-outboard-ontario.md)
- [How to Read Your Boat's Capacity Plate (Ontario Guide)](https://www.mercuryrepower.ca/blog/how-to-read-boat-capacity-plate-ontario.md)
- [Pontoon vs V-Hull, Honestly Compared for Ontario Boaters](https://www.mercuryrepower.ca/blog/pontoon-vs-v-hull-comparison-ontario.md)
- [Aluminum vs Fiberglass Hull, Honest Trade-offs for Ontario Boaters](https://www.mercuryrepower.ca/blog/aluminum-vs-fiberglass-hull-ontario.md)
- [Mercury DTS vs Mechanical Controls, What Ontario Repower Buyers Should Know](https://www.mercuryrepower.ca/blog/mercury-dts-vs-mechanical-controls-ontario-repower.md)
- [Boat Trim Explained for Rice Lake Boaters, Without the Jargon](https://www.mercuryrepower.ca/blog/boat-trim-explained-rice-lake-ontario.md)
- [Mercury Outboard Sat All Winter? Spring Run-Up Checklist for Ontario](https://www.mercuryrepower.ca/blog/mercury-outboard-spring-run-up-checklist-ontario.md)
- [How Ontario Boat Owners Accidentally Make Their Service Bills Bigger](https://www.mercuryrepower.ca/blog/accidentally-increase-boat-service-bills-ontario.md)
- [Repair, Repower, or Sell the Boat? An Honest Ontario Decision Guide](https://www.mercuryrepower.ca/blog/repair-repower-or-sell-boat-ontario-decision-guide.md)
- [Boat Electrical Safety Checklist for Ontario Freshwater Boats](https://www.mercuryrepower.ca/blog/boat-electrical-safety-checklist-ontario-freshwater.md)
- [Mercury Dealer for Peterborough: Why Otonabee + Kawartha Boaters Drive to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-peterborough-ontario-hbw.md)
- [Mercury Dealer for Cobourg: 25 Minutes North to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-cobourg-ontario-hbw.md)
- [Mercury Dealer for Port Hope: 30 Minutes North to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-port-hope-ontario-hbw.md)
- [Mercury Dealer for Lindsay: 45 Minutes Southeast to Rice Lake](https://www.mercuryrepower.ca/blog/mercury-dealer-lindsay-ontario-hbw.md)
- [Mercury Dealer for Northumberland County: HBW Is Your Local Mercury Platinum Shop](https://www.mercuryrepower.ca/blog/mercury-dealer-northumberland-county-hbw.md)
- [Mercury FourStroke Buyer Guide for Ontario (2026)](https://www.mercuryrepower.ca/blog/mercury-fourstroke-buyer-guide-ontario.md)
- [Mercury Pro XS Buyer Guide for Ontario (2026)](https://www.mercuryrepower.ca/blog/mercury-pro-xs-buyer-guide-ontario.md)
- [Mercury Avator Electric Outboard Range on Rice Lake (2026)](https://www.mercuryrepower.ca/blog/mercury-avator-range-rice-lake-cottage.md)
- [Mercury Avator vs Torqeedo: Honest Comparison for Ontario Boaters (2026)](https://www.mercuryrepower.ca/blog/mercury-avator-vs-torqeedo.md)
- [Charging a Mercury Avator at Your Cottage Dock (2026)](https://www.mercuryrepower.ca/blog/mercury-avator-charging-cottage-dock.md)
- [2-Stroke vs 4-Stroke Repower: What to Know](https://www.mercuryrepower.ca/blog/two-stroke-vs-four-stroke-repower.md)
- [Mercury Avator 7.5e: Review, Price CAD, and Range (2026)](https://www.mercuryrepower.ca/blog/mercury-avator-7-5e-review.md)
- [The 7-Year Mercury Warranty at HBW, Explained (HBW Exclusive, Ends June 14, 2026)](https://www.mercuryrepower.ca/blog/mercury-7-year-warranty-hbw-exclusive-explained.md)
- [Best Pontoon Outboard 2026: Mercury Buyer's Guide](https://www.mercuryrepower.ca/blog/best-pontoon-outboard-2026-mercury.md)
- [Repower vs Buy New Boat: The Honest Math](https://www.mercuryrepower.ca/blog/repower-vs-new-boat.md)
- [Mercury Main + Trolling Motor: How to Pair Them](https://www.mercuryrepower.ca/blog/mercury-main-and-trolling-motor.md)
- [Mercury Outboard Monthly Payment Math (Ontario, 2026)](https://www.mercuryrepower.ca/blog/mercury-outboard-monthly-payment-ontario-2026.md)
- [Mercury Boost Cost in Canada: Honest Ontario Dealer Breakdown (2026)](https://www.mercuryrepower.ca/blog/mercury-boost-cost-canada-2026.md)
- [Mercury vs Honda Outboards (Honest Ontario Dealer Comparison, 2026)](https://www.mercuryrepower.ca/blog/mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026.md)
- [Mercury 115 vs 150 HP (Honest Ontario Dealer Guide, 2026)](https://www.mercuryrepower.ca/blog/mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026.md)
- [Trent-Severn Mercury Dealer Survival Guide (HBW Rice Lake, 2026)](https://www.mercuryrepower.ca/blog/trent-severn-mercury-dealer-survival-guide-2026.md)
- [Lake Ontario Salmon Mercury Setup Guide (Ontario Dealer, 2026)](https://www.mercuryrepower.ca/blog/lake-ontario-salmon-mercury-setup-guide-2026.md)
- [Yamaha to Mercury Repower in Ontario: Honest Guide from a Mercury Platinum Dealer (2026)](https://www.mercuryrepower.ca/blog/yamaha-to-mercury-repower-ontario-guide.md)
- [Honda to Mercury Repower in Ontario: When the Swap Makes Sense (2026)](https://www.mercuryrepower.ca/blog/honda-to-mercury-repower-ontario-guide.md)
- [The HBW On-Water Load Test (Why Every Mercury Repower Gets Real-Water Verification Before Delivery, 2026)](https://www.mercuryrepower.ca/blog/hbw-on-water-load-test-mercury-repower-advantage-2026.md)
- [What Happens to Your Old Motor When You Repower (Trade-In, HST Credit, Disposal)](https://www.mercuryrepower.ca/blog/repower-old-motor-trade-in-hst-disposal-ontario.md)
- [Repower Financing in Ontario: Real Rates, Real Monthly Payments](https://www.mercuryrepower.ca/blog/repower-financing-ontario-rates-monthly-payments.md)
- [How to Pick the Right Horsepower When You Repower (Reading Your Capacity Plate)](https://www.mercuryrepower.ca/blog/repower-horsepower-capacity-plate-guide.md)
- [Repowering a Pontoon vs. an Aluminum Fishing Boat vs. a V-Hull](https://www.mercuryrepower.ca/blog/repower-pontoon-aluminum-v-hull-differences.md)
- [From Orphan to On-Water: Converting a 2-Stroke Evinrude/Johnson to a Modern Mercury 4-Stroke](https://www.mercuryrepower.ca/blog/evinrude-johnson-to-mercury-repower-conversion.md)
- [Your Repower, Step by Step: What Actually Happens at the Shop](https://www.mercuryrepower.ca/blog/boat-repower-process-step-by-step.md)
- [How Your Mercury Warranty Works After a Repower](https://www.mercuryrepower.ca/blog/mercury-warranty-after-repower-ontario.md)
- [Mercury Outboard Weight Chart (2.5 to 300 HP)](https://www.mercuryrepower.ca/blog/mercury-outboard-weight-chart.md)

