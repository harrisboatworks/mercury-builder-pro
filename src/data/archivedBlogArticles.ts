import type { BlogArticle } from './blogArticles';

/**
 * Archived (unpublished) blog articles.
 *
 * These entries are intentionally NOT included in the live `blogArticles`
 * export. They stay in the repo so we can restore them later without
 * rewriting the content. To reactivate an article, move its object back
 * into `src/data/blogArticles.ts` (and re-add its slug to any relevant
 * cluster in `src/data/blogClusters.ts`).
 *
 * Log:
 *  - 2026-07-09: unpublished "mercury-2026-outboard-lineup-ontario" and
 *    "2026-mercury-model-preview" and merged them into a new canonical post
 *    "mercury-outboard-lineup-ontario". Restore either if we need per-model-year
 *    posts again.
 *  - 2026-07-09: unpublished "mercury-7-year-warranty-hbw-exclusive-explained"
 *    because the Mercury Get-7 (3+4) promo ended. Restore when the promo
 *    reactivates.
 *  - 2026-09-03: unpublished 5 posts in the blog consolidation audit (Phase 1B):
 *    "mercury-command-thrust-real-talk-bigfoot-pontoon-v-hull" (lake-test story
 *    merged into mercury-command-thrust-complete-guide-2026),
 *    "mercury-command-thrust-pontoon-eligibility-2026" (eligibility checklist
 *    merged into mercury-command-thrust-guide-pontoon-boats),
 *    "mercury-outboard-wont-start-after-sitting" (steps merged into
 *    mercury-outboard-wont-start-troubleshooting),
 *    "rice-lake-boat-rentals-from-toronto-gta" (itinerary + hazards merged into
 *    rice-lake-boat-rental-guide-2026), and
 *    "is-2026-good-year-to-buy-boat-canada" (301 to
 *    2026-boating-market-ontario-boat-buyers, no merge). All five slugs 301 in
 *    vercel.json.
 *  - 2026-09-03: unpublished 15 of the 17 city dealer landing posts (Phase 1C
 *    of the blog consolidation audit; kept Bowmanville and Whitby). Durham,
 *    York, Peel and Halton cities (markham, richmond-hill, mississauga,
 *    vaughan, brampton, oakville, burlington, pickering, ajax, oshawa) 301 to
 *    trailer-boat-toronto-to-rice-lake-guide. Peterborough, Kawartha Lakes and
 *    Northumberland cities (peterborough, cobourg, port-hope, lindsay,
 *    northumberland-county) 301 to complete-guide-boat-repower-kawarthas.
 *    All 15 slugs 301 in vercel.json.
 */
export const archivedBlogArticles: BlogArticle[] = [
  {
    slug: 'mercury-7-year-warranty-hbw-exclusive-explained',
    seoTitle: 'Mercury Outboard Warranty at HBW, Explained (Standard 3-Year Factory Coverage) | Mercuryrepower.ca',
    title: 'Mercury 7-Year Warranty Offer, Explained',
    description: 'Mercury factory warranty from HBW explained: 3 years standard, and the 7-year HBW Exclusive offer (3+4) that\'s active through December 31, 2026.',
    image: '/lovable-uploads/hero-mercury-warranty-shop-2026.png',
    author: 'Harris Boat Works',
    datePublished: '2026-05-25',
    dateModified: '2026-07-02',
    publishDate: '2026-05-25',
    category: 'Buying Guide',
    readTime: '9 min read',
    keywords: ['mercury 7 year warranty', 'mercury warranty promo', 'hbw exclusive warranty', 'mercury warranty ontario', 'mercury limited warranty canada', 'mercury warranty explained'],
    relatedSlugs: ['mercury-outboard-warranty-canada-2026', 'mercury-extended-warranty-platinum-ontario', 'mercury-repower-cost-ontario-2026-cad'],
    faqs: [
      { question: 'Is the 7-year HBW Exclusive promotion still available?', answer: 'Yes. As of July 2026 the 7-year HBW Exclusive is active and runs through December 31, 2026. Every eligible new Mercury outboard purchased through HBW carries 3 years of standard Mercury factory warranty plus a 4-year free extension, for 7 years of total factory-backed coverage. Confirm current terms at [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions).' },
      { question: 'How long is the Mercury warranty at HBW right now?', answer: "As of July 2026, every eligible new Mercury outboard from Harris Boat Works carries 7 years of total factory-backed coverage: Mercury's 3-year limited warranty plus a 4-year free extension under the HBW Exclusive promotion, running through December 31, 2026. Corrosion coverage runs concurrently with the base 3 years. Extended coverage beyond 7 years is available through Mercury Product Protection. Confirm current terms at [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions) when we quote." },
      { question: 'Is the 7 years from Mercury or from HBW?', answer: "The coverage is factory-backed Mercury warranty work, handled by Mercury and its authorized dealer network. The 4 bonus years are a promotion HBW runs on every eligible new Mercury we sell through December 31, 2026 (as of July 2026), not a third-party service contract and not an aftermarket add-on. See [current promotions](https://www.mercuryrepower.ca/promotions)." },
      { question: 'What does the Mercury factory warranty cover?', answer: 'Manufacturing defects in the powerhead, lower unit, mid-section, electronics, cooling, and starting and charging systems. Parts and labour are both covered at any authorized Mercury dealer in Canada, including HBW. Coverage is non-declining.' },
      { question: 'What is not covered?', answer: 'Routine maintenance (oil, filters, plugs), wear items (impellers, anodes, props), damage from misuse, neglect, improper fuel, freeze damage from skipped winterization, running aground, non-Mercury parts, or unauthorized modifications.' },
      { question: 'Do I need to service the motor at HBW to keep it valid?', answer: 'No. You can service the motor at any authorized Mercury dealer in Canada. Keep service records to support any warranty claim. We service customers who bought elsewhere too.' },
      { question: 'Does the warranty transfer if I sell the boat?', answer: 'The Mercury Limited Warranty has provisions for transfer to a second owner. Promotional bonus-year transfer terms depend on the specific motor and offer at purchase. We confirm transfer terms at quote.' },
      { question: 'How is this different from Mercury Product Protection (MPP)?', answer: "MPP is Mercury's paid extended service program, sold through dealers and quoted at time of sale. It picks up after factory-backed coverage ends. The 7-year HBW Exclusive promotion (active through December 31, 2026 as of July 2026) is included in the purchase price; MPP is an optional add-on you buy on top of that." },
      { question: 'Does TD financing at {{LIVE_RATE_PCT}} still apply?', answer: 'Yes. TD "Always On" financing at {{LIVE_RATE_PCT}} APR (OAC) runs through December 31, 2026 on qualifying Mercury outboards purchased through HBW (as of July 2026), and stacks with the 7-year warranty promotion. Confirm current terms at [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions).' },
    ],
    content: `<!-- PROMO-STATUS: HBW Exclusive 7-yr promo was extended past the original 2026-06-14 end date and is ACTIVE through 2026-12-31 as of 2026-07-02. -->

*Last reviewed: 2026-07-02*

> **Quick answer:** The 7-year HBW Exclusive promotion is active as of July 2026 and runs through December 31, 2026. Every eligible new Mercury outboard from Harris Boat Works comes with 3 years of standard Mercury factory warranty plus a 4-year free extension, for 7 years of total factory-backed coverage. Corrosion coverage runs concurrently with the base 3 years (not stacked). Coverage beyond 7 years is available separately through Mercury Product Protection. For the latest offers, check [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions), and build a quote any time at [mercuryrepower.ca](https://www.mercuryrepower.ca).

When customers ask about Mercury's warranty, the question they usually mean is: "If something goes wrong, am I going to pay for it?" The honest answer has two parts: what Mercury covers contractually (the base), and what HBW or Mercury may be offering on top of that at any given time (a promotion). This post separates the two so you know what is locked in for the life of the motor versus what is tied to a promotional window.

## The 7-year promotion (active through December 31, 2026)

As of July 2026, Harris Boat Works is running an HBW Exclusive promotion that adds 4 promotional bonus years on top of Mercury's 3-year factory base, for 7 years of total factory-backed coverage on every eligible new Mercury we sell. The offer was previously scheduled to end June 14, 2026 and has been extended through December 31, 2026. After that date, coverage reverts to the standard Mercury 3-year factory warranty unless a further promotion is announced.

- **Coverage today:** every eligible new Mercury outboard purchased through HBW carries 7 years of total factory-backed coverage (Mercury's 3-year limited warranty plus a 4-year free extension).
- **Same factory terms.** The bonus years cover the same parts and systems described below, honoured across Mercury's authorized-dealer network, parts and labour both covered, non-declining.
- **Extended coverage is separate.** Mercury Product Protection (MPP) is a paid extended program you can add on top for coverage beyond 7 years. Ask us to quote it with your motor.
- **TD "Always On" financing at {{LIVE_RATE_PCT}} APR (OAC) stacks.** That program runs through December 31, 2026 on qualifying motors (as of July 2026).

For current promotions, the source of truth is [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions). Build a quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) or call **(905) 342-2153**.

Everything below is the evergreen Mercury factory warranty content: what's covered, what voids it, and how registration, claims, transfer, and MPP work. It applies to every new Mercury, promotion or not.

## What Mercury's factory warranty covers

Mercury's contractual Canadian warranty is **3 years limited + 3 years corrosion running concurrently** (not stacked, not additive). It covers manufacturing defects in materials and workmanship on new outboards purchased through authorized Mercury dealers, from the date of delivery to the original purchaser. Coverage is non-declining: a covered failure in year three is treated the same as month one. Parts and labour are both covered, no deductible.

Covered systems:

- **The powerhead** - block, head, internal components, fuel injection
- **The lower unit** - gearcase, shaft, prop bearings
- **The mid-section** - driveshaft, exhaust housing
- **Electronics** - ECU, charging system, ignition, sensors
- **Cooling system** - water pump housing, thermostat, sensors
- **Starting and charging** - starter motor, alternator, regulator

When a warranty claim is approved, Mercury covers parts and labour at the dealer's rate. You do not pay out of pocket on covered work.

## What is not covered

The exclusions matter, so we explain them plainly to every customer.

| Category | Covered? | Notes |
|---|---|---|
| Manufacturing defects | Yes | Core of the warranty |
| Powerhead failure (non-abuse) | Yes | Block, head, internals |
| Lower unit failure (non-impact) | Yes | Gearcase, shafts, seals |
| Electronics defects | Yes | ECU, sensors, harnesses |
| Parts and labour at authorized dealer | Yes | Both covered |
| Routine maintenance (oil, filters, plugs) | No | Owner responsibility |
| Water pump impeller | No | Wear item, replace annually |
| Anodes (zincs) | No | Wear item, inspect each season |
| Propeller damage | No | Impact or wear |
| Damage from running aground | No | Misuse |
| Damage from wrong fuel or oil | No | Misuse |
| Damage from non-Mercury parts | No | Unauthorized modification |
| Freeze damage from skipped winterization | No | Owner responsibility |
| Saltwater corrosion (if unprotected) | Limited | Depends on care |
| Storage neglect | No | Owner responsibility |

The pattern is clear. Mercury covers the engine itself against defects in how it was built. Mercury does not cover the consequences of how you use or maintain the engine.

## Why factory warranty matters for a repower decision

Three real reasons.

**First, peace of mind on a $15,000 to $30,000 CAD purchase.** A new motor is a major investment. Factory coverage means that if something goes wrong with the powerhead, lower unit, or electronics, you are not paying for it. That is substantial on a big-block or Pro XS where parts and labour for a major repair can run thousands.

**Second, the way Ontario seasons compress the calendar.** A factory warranty year is one boating season of about five months, May long weekend to Canadian Thanksgiving. The calendar time lines up with the moments you actually care about being on the water.

**Third, resale value.** A boat with significant warranty time remaining is worth more on the used market. If you sell the boat partway through coverage, the buyer inherits the remaining warranty (subject to Mercury's transfer terms) and that adds value.

Combined, these reasons help close the gap between "repair the old motor again" and "repower now." Our [repower cost guide](/blog/mercury-repower-cost-ontario-2026-cad) covers the math.

## How the warranty compares across Mercury families

The same Mercury Limited Warranty applies across FourStroke, Pro XS, Verado, and Avator. There is no warranty difference by family. A 9.9 HP portable, a 90 HP FourStroke, a Pro XS V8 200, and an Avator 7.5e all carry the same 3-year contractual base.

What does vary is the cost of a major repair if you ever had one outside warranty. A FourStroke 90 HP powerhead replacement is a few thousand dollars in parts and labour. A Pro XS V8 250 powerhead replacement is many thousands more. The warranty value scales with the motor's price, which is part of why the same coverage gets relatively more meaningful as you go up in HP.

## What you need to do to keep the warranty valid

Three things.

**First, follow the maintenance schedule.** Mercury specifies oil change intervals, plug intervals, and annual service requirements in the owner's manual. Skipping required maintenance can void warranty claims related to neglected systems.

**Second, keep records.** Save your service invoices, including the work we do at Harris Boat Works each year. If you need a warranty claim, the records show the motor was properly maintained.

**Third, use authorized dealers for service.** You do not need to service exclusively at HBW (though we would appreciate it), but service should happen at an authorized Mercury dealer in Canada. Unauthorized work, especially anything touching the powerhead or ECU, can void coverage.

## How to register and claim

We register every Mercury at delivery, on the spot. You do not need to file anything yourself. If something goes wrong later:

1. **Call us at (905) 342-2153** or any authorized Mercury dealer in Canada.
2. **Bring the boat and motor in for diagnosis.** Mercury requires the dealer to confirm the failure mode before approving the claim.
3. **We submit the claim directly to Mercury.** Because we are a Mercury Premier Dealer, we handle the entire process in-house: parts, labour, claim paperwork. You do not pay out of pocket and wait for reimbursement.

## How does it transfer if I sell the boat?

The Mercury Limited Warranty includes transfer provisions for second owners. Transfer terms depend on the specific motor and any promotion at time of purchase, so we confirm transfer rules at quote time. Keep your bill of sale and Mercury registration receipt with the boat; both help the new owner activate transferred coverage cleanly.

## What about Mercury Product Protection (MPP)?

MPP is Mercury's separate paid extended service program. It is the factory-backed extended contract that picks up after factory coverage ends. We quote MPP at time of sale if you want coverage beyond the factory period. It is administered 100% by Mercury Marine, using genuine Mercury and Quicksilver parts, performed by authorized Mercury dealers, same factory standards as your original warranty. See our [Mercury extended warranty guide](/blog/mercury-extended-warranty-platinum-ontario) for tier and pricing detail.

## Should the warranty change which Mercury I buy?

Not by itself. A promotional bonus can close the gap between "repair again" and "repower now," but it should not talk you into the wrong horsepower or the wrong family. Pick the right motor for your boat first. Then let the warranty be the reason you can sleep at night with the purchase. Our [repower vs new boat post](/blog/repair-repower-or-sell-boat-ontario-decision-guide) covers how to think about the bigger decision.

- [Mercury Outboard Warranty in Canada (2026): What's Covered, What's Not, and What's Worth Buying](/blog/mercury-outboard-warranty-canada-2026)
- [Mercury Extended Warranty (Platinum) Ontario](/blog/mercury-extended-warranty-platinum-ontario)
- [Mercury Repower Cost Ontario 2026](/blog/mercury-repower-cost-ontario-2026-cad)
- [Repair, Repower, or Sell? The Honest Decision](/blog/repair-repower-or-sell-boat-ontario-decision-guide)

## Frequently Asked Questions

**Is the 7-year HBW Exclusive promotion still available?**
Yes. As of July 2026, the 7-year HBW Exclusive is active and runs through December 31, 2026. Every eligible new Mercury outboard purchased through HBW carries 3 years of standard Mercury factory warranty plus a 4-year free extension. For current offers, see [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions).

**How long is the Mercury warranty at HBW right now?**
As of July 2026, every eligible new Mercury outboard from Harris Boat Works carries 7 years of total factory-backed coverage: Mercury's 3-year limited warranty plus a 4-year free extension under the HBW Exclusive promotion, running through December 31, 2026. Extended coverage beyond 7 years is available through Mercury Product Protection.

**Is the 7 years from Mercury or from HBW?**
The coverage is factory-backed Mercury warranty work, handled by Mercury and its authorized dealer network. The 4 bonus years are a promotion HBW runs on every eligible new Mercury we sell through December 31, 2026 (as of July 2026). See [current promotions](https://www.mercuryrepower.ca/promotions).

**What does the Mercury factory warranty cover?**
Manufacturing defects in the powerhead, lower unit, electronics, and major components, including both parts and labour at authorized Mercury dealers like HBW. Coverage is non-declining.

**What is not covered?**
Routine maintenance (oil, filters, plugs), wear items (impellers, anodes, props), damage from misuse, neglect, improper fuel, freeze damage from skipped winterization, running aground, non-Mercury parts, or unauthorized modifications.

**How is this different from MPP?**
MPP is Mercury's paid extended service program, sold through dealers and quoted at time of sale. It picks up after factory-backed coverage ends. The 7-year HBW Exclusive promotion (active through December 31, 2026 as of July 2026) is included in the purchase price; MPP is optional and stacks on top for coverage beyond 7 years.

**Does TD financing at {{LIVE_RATE_PCT}} still apply?**
Yes. TD "Always On" financing at {{LIVE_RATE_PCT}} APR (OAC) runs through December 31, 2026 on qualifying Mercury outboards purchased through HBW (as of July 2026), and stacks with the 7-year warranty promotion. Confirm current terms at [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions).

---

## Sources

- [Mercury Marine - Warranty](https://www.mercurymarine.com/canada/en/owners/warranty/) - Mercury's standard 3-year limited warranty (the base layer for HBW's 7-year stack).
- [Mercury Marine Canada](https://www.mercurymarine.com/canada/en/) - Authorized Mercury Premier dealer network.

## Ready to repower with a new Mercury?

As of July 2026, every eligible new Mercury purchased through HBW comes with 7 years of total factory-backed coverage (3 standard + 4 free) through December 31, 2026, with extended coverage available through Mercury Product Protection. For current promotions, see [mercuryrepower.ca/promotions](https://www.mercuryrepower.ca/promotions), build a quote at [mercuryrepower.ca](https://www.mercuryrepower.ca), or call **(905) 342-2153**.

**Phone:** (905) 342-2153
**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON
**Service:** [hbw.wiki/service](https://hbw.wiki/service)

Family-owned since 1947. Mercury dealer since 1965.

---
`,
  },
  {
    slug: 'mercury-2026-outboard-lineup-ontario',
    title: 'Mercury 2026 Outboard Lineup for Ontario Boaters',
    description: 'Mercury 2026 lineup: FourStroke 2.5-300 hp, Pro XS 115-300 hp, SeaPro 25-300 hp, Verado 250-600+ hp, Avator electric. Ontario dealer overview.',
    image: '/lovable-uploads/Inside_Mercury_s_2026_Outboard_Lineup_Blog_Post_Hero_Image.png',
    author: 'Harris Boat Works',
    datePublished: '2026-02-06',
    dateModified: '2026-05-04',
    publishDate: '2026-02-06',
    category: 'Buying Guide',
    readTime: '10 min read',
    keywords: ['mercury 2026 lineup', 'mercury outboard models', 'mercury fourstroke 2026', 'mercury verado v10', 'avator electric outboard', 'mercury outboard ontario', 'rice lake outboard motor', 'mercury dealer ontario'],
    content: `
# Mercury 2026 Outboard Lineup: What Ontario Boaters Actually Need to Know

## Quick answer
Mercury 2026 lineup covers four main families: FourStroke (2.5 to 300 HP) for everyday Ontario use, Pro XS for performance fishing, SeaPro for commercial duty, and Verado for high-end offshore applications. For most Rice Lake and Kawarthas boats, the answer lands somewhere in the FourStroke 40 to 150 HP range. Build a live CAD quote at [mercuryrepower.ca](https://www.mercuryrepower.ca).

## Why we are writing this
We are a Mercury dealer. We have been since 1965. This is a dealer honest breakdown of the Mercury lineup, not a spec-sheet dump, but the practical answer to "which Mercury is right for my boat?"

We sell every family in the lineup below (Verado is special-order only).

## The Mercury family breakdown

### FourStroke, the everyday Ontario motor

HP range: 2.5 to 300 HP

Who it is for: Recreational boaters. Fishing boats, family pontoons, runabouts, cottage boats.

The FourStroke line is Mercury volume seller in Ontario because it covers the full range of recreational use. A 2.5 HP tiller for a car-topper. A 9.9 for a kicker. A 25 for a light aluminum boat. A 40, 60, or 75 for mid-range fishing rigs. A 90, 115, or 150 for larger aluminum or fibreglass boats. A 200 or 250 for centre consoles. Up to 300 HP for big-water applications.

**FourStroke Command Thrust** deserves a specific mention for Ontario boaters. Available on the 115 HP and up FourStroke, designed for the higher torque loads that pontoons and heavier hulls put on the gearcase. If you are repowering a pontoon, ask specifically about Command Thrust.

What FourStroke does well: fuel efficiency at cruise, smooth idle, quiet operation, easy cold-start, long service intervals.

What FourStroke is not: fast out of the hole.

::decision-card
eyebrow: FourStroke vs Pro XS
heading: How are you actually using the motor?
subhead: Most Ontario boaters do not need a Pro XS. A correctly propped FourStroke handles the lake just fine. Pro XS earns its keep in specific use cases.
leftLabel: Mercury FourStroke is the right call
leftCriteria:
  - Fishing, cruising, family pontoon
  - Predictable load, predictable speeds
  - Fuel economy matters more than hole shot
  - Want the longest service intervals and quietest ride
leftOutcome: FourStroke 90 to 200 HP
leftVariant: recommended
rightLabel: Mercury Pro XS earns the upgrade
rightCriteria:
  - Tournament bass or walleye fishing
  - Wakeboarding, skiing, towing heavy loads
  - You routinely run at the top of your motor's range
  - Top-end speed and hole shot matter
rightOutcome: Pro XS 115 to 250 HP
rightVariant: alternative
whenInDoubt: Buyers who pick Pro XS for the badge usually find a FourStroke would have done the job for less money and less fuel. Pick by use case, not by name.
::

### Pro XS, performance fishing and speed applications

Who it is for: bass anglers, walleye tournament competitors, anyone who wants to get to the other end of the lake as fast as possible.

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection). For current CAD pricing on every Mercury we stock, see the [Mercury pricing reference](/pricing-reference).

Pro XS is tuned for performance. Faster hole shot, higher top-end RPM, stronger acceleration than the equivalent FourStroke HP. In the Ontario tournament fishing world, Pro XS is the standard.

### SeaPro, commercial duty

Who it is for: commercial operators. Fishing guides, water taxis, bait boats, municipal watercraft, rental fleets.

The SeaPro is calibrated for sustained heavy-duty use: maximum torque at lower RPM, heavy-duty gearcases, and components built for long hours under load.

### Verado, premium high-horsepower offshore

Who it is for: large offshore centre consoles. Twin/triple installations on bigger boats. Buyers who want maximum refinement, noise isolation, and power for open water or Great Lakes conditions.

Almost no Ontario freshwater boater on a typical inland lake needs a Verado. If you are running a 20-foot fishing boat on Rice Lake, a FourStroke 150 or 200 is the better call. We offer Verado as special order.

### Avator, electric (emerging)
Mercury Avator electric line covers smaller portable and mid-range electric applications. For most Ontario fishing and family boating, a gas FourStroke is still the practical choice. Battery range and charge infrastructure are not there yet for full-replacement use.

## Matching the motor to the Ontario use case

| Use case | Motor family | HP guidance |
|---|---|---|
| Light aluminum fishing boat, 14 to 16 ft | FourStroke | 25 to 60 HP |
| Mid-range fishing/family boat, 16 to 18 ft | FourStroke | 60 to 115 HP |
| Larger fishing or family boat, 18 to 20 ft | FourStroke | 115 to 150 HP |
| Pontoon, 22 to 24 ft | FourStroke Command Thrust | 115 to 150 HP |
| Tournament bass boat | Pro XS | 200 to 250 HP |
| Centre console, Ontario big water | FourStroke or Verado | 200 to 300+ HP |
| Commercial guide or rental | SeaPro | Match to hull rating |
| Car-topper kicker | FourStroke | 9.9 to 15 HP |
| Dedicated trolling kicker | FourStroke ProKicker | 9.9 HP |

This table is a starting point, not a prescription. The right HP for your specific hull depends on capacity plate, total load, and intended use.

## How to build your quote

Live CAD pricing on every Mercury family (except Verado, which is quoted individually) is at [mercuryrepower.ca](https://www.mercuryrepower.ca). The quote builder includes motor, rigging, controls, prop, and install, the full number, not just the motor sticker.

If you are comparing FourStroke vs Pro XS for a specific hull, or you need help with pontoon sizing and Command Thrust configuration, call 905-342-2153.

*Last reviewed: 2026-05-11.*

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---

`,
    faqs: [
    { question: 'What is the best Mercury motor for a fishing boat on Rice Lake?', answer: 'For most 14 to 18 ft fishing boats on Rice Lake, a Mercury FourStroke in the 40 to 115 HP range is the right fit. Adding a 9.9 HP ProKicker for dedicated trolling is a popular setup.' },
    { question: 'What is the difference between Mercury FourStroke and Mercury Pro XS?', answer: 'FourStroke is tuned for efficiency, smooth cruise, and versatility. Pro XS is tuned for performance: faster hole shot, higher top-end RPM, stronger acceleration. For most Ontario cottage and casual fishing use, FourStroke is the better all-around fit.' },
    { question: 'Is the Mercury Verado relevant for Ontario inland boating?', answer: 'For most Ontario inland lakes (Rice Lake, Kawarthas, Lake Simcoe), no. Verado is engineered for offshore applications. For typical inland fishing and family boats, a FourStroke up to 300 HP handles the job.' },
    { question: 'What Mercury motors does Harris Boat Works stock for 2026?', answer: 'We stock and order the full FourStroke range, Pro XS performance motors, and SeaPro commercial motors. Verado is special-order only, and Avator electric outboards are build-to-order from the brochure rather than stocked on the floor.' },
    { question: 'What is the best Mercury outboard for trolling walleye on Rice Lake?', answer: 'A main motor in the 60 to 115 HP FourStroke range paired with a dedicated Mercury ProKicker 9.9 HP. The ProKicker is purpose-built for low-RPM trolling.' },
    { question: 'How do I choose the right Mercury for my Ontario boat?', answer: 'Start with your hull capacity plate maximum HP. Then consider your primary use. For most Ontario fishing and family boats, the answer lands in the 60 to 115 HP FourStroke range.' },
  ],
  },
  {
    slug: '2026-mercury-model-preview',
    title: 'Mercury 2027 Outboard Preview Guide',
    seoTitle: 'Mercury 2027 Outboard Preview: What is New',
    description: 'Mercury\'s 2027 model year is here as of July 1, 2026. What we know is changing, what isn\'t, and how to decide between remaining 2026 stock or the new 2027 lineup.',
    image: '/lovable-uploads/2027_Mercury_Preview.png',
    imageAlt: 'Black Mercury outboard on a Harris pontoon boat on an Ontario lake for the 2027 model year preview.',
    author: 'Harris Boat Works',
    datePublished: '2026-05-13',
    dateModified: '2026-05-13',
    publishDate: '2026-05-13',
    category: 'Buying Guide',
    readTime: '~9 min read',
    keywords: ['2027 mercury outboard', 'mercury model year change', 'buy 2026 or wait 2027 mercury', 'mercury preview ontario', 'mercury repower 2027'],
    content: `
# Mercury 2027 Outboard Preview: What's Changing, What's Not, and How to Decide

*Last reviewed: 2026-05-13*

> **Quick answer:** Mercury's model year flips to 2027 on July 1, 2026. The motor sitting on the dealer floor on June 30 becomes "previous gen" on July 1, even if the spec sheet is identical. For most repower customers, the decision isn't 2026 vs 2027, it's "lock in current pricing and a slot in our spring install schedule now" or "wait to see what the official 2027 announcements bring." Build your quote at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection) to see your number on either path.

If you're shopping for a new Mercury this summer, the calendar is doing something to the conversation. July 1 is Mercury's model year flip. On that date the current 2026 lineup becomes "previous gen" and 2027 specs start trickling out from Mercury Marine.

The question we're getting at the shop: do I lock in a 2026 now, or wait?

Honest answer, before we get into the details: for most repower customers, the model year flip matters less than they think. Here's what actually changes, what doesn't, and how to make the call.

## Quick recommendation

If you need the motor on the water this summer or next spring, build a quote on the current 2027 lineup and lock it in. Pricing is set, inventory is real, and our 7-year warranty bonus (HBW-exclusive) is active on every new Mercury. Spring 2027 install slots fill before Christmas. If you're 12+ months out and the 2027 spec sheet might change your decision, watch the announcements and revisit. Get your starting number at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection).

## What Actually Changes at the Model Year Flip

The Mercury model year date is a calendar event, not a redesign event. Most years, the difference between a 2026 and a 2027 motor of the same family is incremental: refined controls, a software revision, an updated cowl colour, a couple of new SKUs in the lineup.

What typically changes year-to-year:

- **Software and connectivity.** SmartCraft Connect features expand most years. Mobile app integration, gauge software, alarm libraries.
- **Cosmetic refinements.** Cowl graphics, colour options, decals. Aesthetic, not mechanical.
- **Lineup additions or retirements.** A new HP variant appears, or a low-volume SKU goes away. Avator electric has been the most active part of the lineup, adding new models year over year.
- **Pricing.** Mercury's dealer pricing updates with each model year. Sometimes flat, sometimes a modest increase. We post current pricing at [mercuryrepower.ca/pricing-reference](/pricing-reference).

What typically does NOT change in a single model year:

- **Powerhead architecture.** The FourStroke 115 is the same 2.1L inline-4 it was in 2026, and it'll be the same in 2027. The 150 V6 3.0L stays a V6 3.0L. Verado V8/V10/V12 (250-600 HP) remain naturally aspirated, not supercharged.
- **Gearcase options.** Command Thrust gearcases stay where they are. Pro XS sport gearcase stays where it is.
- **Mounting patterns and rigging.** A 2027 motor of the same HP rigs to the same transom as a 2026.
- **Service intervals and parts.** Mercury maintains long parts continuity, your local dealer can service either model year.

The model year flip is a marketing event with real implications for resale and warranty timing, but it's not a redesign of the motors you're shopping.

## What We Expect for 2027 (Honest, Not Speculative)

Mercury hasn't released the full 2027 spec sheet as of this writing. What we expect, based on the direction Mercury has been moving:

- **Continued Avator expansion.** The 7.5e and 20e are out. Larger Avator models are in development. Whether they ship for the 2027 model year depends on Mercury's announcement timing. We're a Mercury Premier dealer and we don't have firm 2027 Avator availability dates yet.
- **SmartCraft Connect getting deeper.** Mercury's app-and-gauge ecosystem expands with each model year. Expect more remote diagnostics, fuel-flow logging, and integration with chartplotters.
- **Software-defined performance.** Mercury Boost is the model for what's coming, a software upgrade that takes a Pro XS 150 to 175 HP without hardware changes. Expect more of this approach for 2027. We covered it in [Mercury Boost: Software Upgrade Eligibility for 2026 Models](/blog/mercury-boost-software-upgrade-eligibility-2026).
- **Pro XS architecture stays put.** The current Pro XS lineup is the Inline-4 150, V6 175-250, V8 300. We don't see Mercury changing that architecture for 2027. The Pro XS V6 powerhead family is current.
- **No "new flagship V12 V14 surprise."** Verado V12 is the flagship. There's no public roadmap pointing to a larger architecture for the 2027 model year.

If Mercury announces something that changes this picture between now and July 1, we'll update this post and call out the change.

## Buy a 2026 Now vs Wait for 2027: The Honest Framework

Most repower decisions don't actually hinge on the model year. They hinge on three other things.

| Factor | Buy 2026 now | Wait for 2027 |
|--------|--------------|---------------|
| Install timing | You want it on the water this summer or next spring | You're flexible on when |
| Pricing certainty | You want a locked dealer quote today | You're willing to wait for Mercury's 2027 pricing release |
| Warranty | HBW's 7-year warranty bonus is active now (3-year Mercury + 4 years from HBW) | The bonus may or may not carry into 2027, watch announcements |
| Tech you want | The 2026 spec sheet meets your needs | You're waiting for a specific feature you've seen previewed (e.g., a new Avator model) |
| Resale outlook | You plan to keep the boat 5+ years (resale gap closes) | You plan to sell within 2 years (resale gap matters) |

**Buy 2026 if:** You're repowering for use, not for resale. You want to lock the current quote, the current 7-year warranty bonus, and a spring install slot. The 2026 spec sheet meets your needs. Spring 2027 install bookings start in earnest by October, and the popular SKUs fill first.

**Wait for 2027 if:** You're specifically chasing a 2027-announced feature (a new Avator, a new HP variant). You're outside the install booking pressure window (12+ months out from needing the motor). You're willing to revisit the decision in August when the 2027 spec sheet is public.

For the vast majority of HBW repower customers, the answer is "buy current 2026 now, lock the spring install slot." The flip-date math doesn't change enough to justify a wait.

## The 7-Year Warranty Window (HBW-Exclusive)

This is the angle most dealers don't have. Every new Mercury comes with a standard 3-year factory warranty. HBW stacks an additional 4 years of bonus coverage on top, exclusive to HBW customers. That's 7 years total on a new repower, not stacked years of marketing language, real bumper-to-bumper coverage we administer at the shop.

This matters specifically right now because:

1. The 7-year program is active and applies to every new Mercury we sell, 2026 or otherwise.
2. We don't know whether Mercury's 2027 program will offer the same standard 3-year base, or whether there'll be a 2027 promotional adder. Locking in 2026 + HBW's 7 years removes that variable.
3. The math on a 7-year cover-everything window is significant if you're keeping the boat long-term. The cost of one big-ticket service event after year 3 is more than most owners realize until they're staring at the quote.

Full details on the program: [Mercury Outboard Warranty in Canada](/blog/mercury-outboard-warranty-canada-2026).

## Pricing and Trade-In Through the Flip

If you're repowering, the trade-in tool already accounts for the model year transition. Old Mercurys retain trade value through the flip because the same boats want the same motors. A clean documented Mercury 90 EFI from 2018 is worth what it's worth whether the new model year is 2026 or 2027.

Two tools to run your own numbers:

- **Instant trade estimate:** [mercuryrepower.ca/trade-in-value](/trade-in-value). Brand, year, model, condition, current value in seconds.
- **Repower quote builder:** [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection). Stack the trade against a 2026 quote, see the HST-adjusted total, lock it in.

If you'd rather see Mercury's current 2026 dealer pricing in one view before building a quote, the full reference is at [mercuryrepower.ca/pricing-reference](/pricing-reference). We update it when Mercury updates dealer pricing.

## What HBW Sees on Model Year Transitions

We've seen 60+ Mercury model year flips at HBW since we became a Mercury dealer in 1965. The pattern is consistent.

- **Pre-flip surge (June).** Customers who wanted "this year's motor" rush to lock orders before July 1. Inventory tightens on popular HP classes (90, 115, 150) toward the back of the month.
- **Quiet transition (July).** Mercury issues the official 2027 announcements, dealer training rolls out, the new lineup specs go live. New SKUs typically don't physically ship until August at the earliest.
- **Fall booking pressure (September-November).** Spring 2027 install slots get booked. Customers who waited for the 2027 announcement now lock orders. The mix of "buying 2027 now" vs "buying current at a model year flip discount" depends on what Mercury announced.
- **Winter ordering (December-March).** Our shop is closed roughly December 1 to April 1, but we are on phone and email all winter taking orders, locking pricing, and reserving spring install slots. Motors ordered now are on hand for an early-April install when we reopen.

If you're in the GTA or east Toronto and thinking about a repower, the call we'd make in late June is straightforward: get the quote built now, decide whether the 2027 unknowns are worth the wait, and lock the spring install slot either way.

## Common Mistakes Around Model Year Transitions

- **Waiting "to see" without a specific feature in mind.** If you can't name the 2027 feature you're chasing, you're not waiting for anything. Build the quote.
- **Assuming a major redesign.** Mercury doesn't usually redesign powerhead architecture between model years. The 2027 FourStroke 150 is the 2026 FourStroke 150 with a different decal until proven otherwise.
- **Skipping the trade-in math.** Your old motor doesn't lose value at the flip. The HST savings on the trade still work the same way. Don't leave that money on the table because you're focused on the new motor side of the deal.
- **Waiting until April to book the install.** If you need the boat for opener, get your order in over winter so the install can start as soon as we reopen in early April. Spring slots fill fast. Quote and book early.
- **Confusing the model year flip with a price drop.** Sometimes there's a closeout discount on remaining 2026 inventory, sometimes there isn't, depends on Mercury's program. Don't bank on it.

## Frequently Asked Questions

**When does Mercury officially release the 2027 lineup?**
Mercury's model year flips July 1, 2026. Official 2027 announcements and dealer-facing spec sheets typically follow over the summer. Physical 2027 inventory usually ships starting late summer or early fall, depending on the model. For HBW customers, the practical date is when we can place a 2027 order with confirmed pricing and ETA, which is typically mid-to-late summer.

**Will Mercury 2026 motors go on closeout when 2027 arrives?**
Sometimes. Mercury's promotional calendar varies year to year. There may be a 2026 closeout incentive in late summer, there may not. We'll quote what's available at the time. If a closeout is active, we apply it transparently in the quote. Don't pre-bet on a closeout, build your quote on current pricing and let any incentive come off the top.

**Is a 2026 Mercury still "current" after July 1?**
Mechanically and warranty-wise, yes. A new Mercury 2026 sold after July 1 still carries the standard 3-year factory warranty starting from your purchase date, plus HBW's 4 years of bonus coverage. The 2026 designation matters for resale framing (it'll show as "previous gen" on used listings 5 years from now) but does not affect the motor's quality, parts continuity, or service eligibility.

**Will the HBW 7-year warranty bonus carry into 2027 model year motors?**
We'd expect so, the program is HBW's bonus, not Mercury's, and it applies to every new Mercury we sell. We'll confirm formally when 2027 pricing rolls out. If you want certainty on the warranty side, locking a 2026 quote now removes the variable.

**Should I wait for a new Avator model?**
Depends on what you're shopping. The Avator 7.5e and 20e are the current production models. Larger Avators (like a 35e or 50e) have been previewed but aren't yet shipping at the dealer level as of June 2026. If you're considering an Avator-class repower, talk to us, we'll let you know what's actually available and what's still on the announcement track. Our [Avator vs Torqeedo comparison](/blog/mercury-avator-vs-torqeedo) covers the current Avator lineup in detail.

**Does the model year flip affect my old motor's trade value?**
Not meaningfully. Used outboard trade values move with the motor's brand, age, hours, and condition, not with the new motor's model year. A clean Mercury 115 EFI from 2018 trades for what it trades for regardless of whether the new lineup is 2026 or 2027. Run the [trade-in estimator](/trade-in-value) for your specific motor.

**Can I order a 2027 Mercury now and have it installed in spring?**
Yes, once Mercury releases 2027 pricing and order books open (typically late summer). We can take pre-orders against the 2027 lineup with a deposit, lock in spring install slots, and confirm pricing when the dealer pricelist drops. If you want to be at the front of the line for a specific 2027 model, the order conversation can start now.

**Should I trade in my old motor before July 1?**
The HST math is the same on either side of the flip. The slight argument for trading before July 1 is that your old motor goes onto our reconditioning bench while the 2026 vs 2027 talk is still active, which sometimes means a stronger resale margin on our end and a slightly better offer to you. Marginal effect, not a deal-breaker. Most customers trade when the new motor is being installed, not in anticipation of the flip.

## Ready to See Your Number?

The model year flip doesn't change the basic question: what motor do you want, what does the install cost, what's your trade worth, and when do you want to be on the water.

**Build your repower quote (current 2026 lineup):** [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection)
**Instant trade-in estimate:** [mercuryrepower.ca/trade-in-value](/trade-in-value)
**Current Mercury dealer pricing reference:** [mercuryrepower.ca/pricing-reference](/pricing-reference)
**Call us for a 2027 pre-order conversation:** 905-342-2153

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON
    `,
    faqs: [
      {
        question: 'When does Mercury officially release the 2027 lineup?',
        answer: 'Mercury\'s model year flips July 1, 2026. Official 2027 announcements and dealer-facing spec sheets typically follow over the summer. Physical 2027 inventory usually ships starting late summer or early fall, depending on the model. For HBW customers, the practical date is when we can place a 2027 order with confirmed pricing and ETA, which is typically mid-to-late summer.'
      },
      {
        question: 'Will Mercury 2026 motors go on closeout when 2027 arrives?',
        answer: 'Sometimes. Mercury\'s promotional calendar varies year to year. There may be a 2026 closeout incentive in late summer, there may not. We\'ll quote what\'s available at the time. If a closeout is active, we apply it transparently in the quote. Don\'t pre-bet on a closeout, build your quote on current pricing and let any incentive come off the top.'
      },
      {
        question: 'Is a 2026 Mercury still "current" after July 1?',
        answer: 'Mechanically and warranty-wise, yes. A new Mercury 2026 sold after July 1 still carries the standard 3-year factory warranty starting from your purchase date, plus HBW\'s 4 years of bonus coverage. The 2026 designation matters for resale framing (it\'ll show as "previous gen" on used listings 5 years from now) but does not affect the motor\'s quality, parts continuity, or service eligibility.'
      },
      {
        question: 'Will the HBW 7-year warranty bonus carry into 2027 model year motors?',
        answer: 'We\'d expect so, the program is HBW\'s bonus, not Mercury\'s, and it applies to every new Mercury we sell. We\'ll confirm formally when 2027 pricing rolls out. If you want certainty on the warranty side, locking a 2026 quote now removes the variable.'
      },
      {
        question: 'Should I wait for a new Avator model?',
        answer: 'Depends on what you\'re shopping. The Avator 7.5e and 20e are the current production models. Larger Avators (like a 35e or 50e) have been previewed but aren\'t yet shipping at the dealer level as of June 2026. If you\'re considering an Avator-class repower, talk to us, we\'ll let you know what\'s actually available and what\'s still on the announcement track. Our Avator vs Torqeedo comparison covers the current Avator lineup in detail.'
      },
      {
        question: 'Does the model year flip affect my old motor\'s trade value?',
        answer: 'Not meaningfully. Used outboard trade values move with the motor\'s brand, age, hours, and condition, not with the new motor\'s model year. A clean Mercury 115 EFI from 2018 trades for what it trades for regardless of whether the new lineup is 2026 or 2027. Run the trade-in estimator for your specific motor.'
      },
      {
        question: 'Can I order a 2027 Mercury now and have it installed in spring?',
        answer: 'Yes, once Mercury releases 2027 pricing and order books open (typically late summer). We can take pre-orders against the 2027 lineup with a deposit, lock in spring install slots, and confirm pricing when the dealer pricelist drops. If you want to be at the front of the line for a specific 2027 model, the order conversation can start now.'
      },
      {
        question: 'Should I trade in my old motor before July 1?',
        answer: 'The HST math is the same on either side of the flip. The slight argument for trading before July 1 is that your old motor goes onto our reconditioning bench while the 2026 vs 2027 talk is still active, which sometimes means a stronger resale margin on our end and a slightly better offer to you. Marginal effect, not a deal-breaker. Most customers trade when the new motor is being installed, not in anticipation of the flip.'
      }
    ]
  },
  {

    slug: "mercury-command-thrust-real-talk-bigfoot-pontoon-v-hull",
    title: "Mercury Command Thrust: The Real Talk Guide (BigFoot History, Pontoons vs V-Hulls)",
    description: "Command Thrust started as BigFoot in the 90s, built for pontoons. Our back-to-back lake test showed 6 mph lost on a V-hull. The honest guide to who actually needs CT.",
    image: "/lovable-uploads/hero-ct-vs-standard-gearcase-hbw-bench.jpg",
    author: "Jay Harris",
    datePublished: "2026-07-12",
    dateModified: "2026-08-02",
    publishDate: "2026-07-12",
    category: "Mercury Outboards",
    readTime: "~10 min read",
    keywords: ["mercury command thrust vs standard", "mercury bigfoot outboard", "command thrust pontoon", "command thrust on v hull", "mercury command thrust gear ratio"],
    faqs: [
      { question: "Is Command Thrust the same thing as BigFoot?", answer: "Yes. BigFoot was the 1990s name for Mercury's big-gearcase pontoon and workboat option. Mercury renamed it Command Thrust around 2014. Same concept: bigger gearcase, taller gear ratio, bigger prop, more push power at low speed." },
      { question: "Does Command Thrust make the same horsepower?", answer: "Yes. A 60 CT and a standard 60 have identical powerheads. CT changes the gearcase, gear ratio, and prop, which changes how the power reaches the water, not how much power there is." },
      { question: "Should I get Command Thrust on my pontoon?", answer: "Almost certainly yes if you're 90 HP and up on a 20+ ft pontoon, and it's worth a conversation on smaller setups. CT is the standard pontoon choice at HBW. See the pontoon eligibility guide for size-by-size calls." },
      { question: "Should I get Command Thrust on my fishing boat?", answer: "Almost certainly no. On a planing aluminum or fibreglass V-hull, CT adds drag and costs top speed with no meaningful benefit. Standard gearcase with the right prop is the better setup. The exception is workboat duty or a ProKicker for trolling." },
      { question: "How much top speed does CT cost on a V-hull?", answer: "In our own back-to-back Rice Lake test, a 16-foot Legend with a Command Thrust 60 ran 6 mph slower than the same hull with a standard-gearcase 60. Lighter, faster hulls take the biggest hit; on bigger V-hulls the penalty is typically 2-5 mph. On a pontoon running 20-ish mph, the penalty barely exists, which is why the trade works there." },
      { question: "Why do some dealers push CT on V-hulls then?", answer: "It costs more, it's often what's in stock, and \"the upgrade model\" is an easy line. Sometimes it's honest ignorance about what the gearcase is for. Ask what your top speed will be versus the standard case and you'll find out quickly which kind of conversation you're in." },
      { question: "Which Mercury motors offer Command Thrust?", answer: "In our current lineup: 9.9 (including ProKicker), 40, 50, 60, 90, and 115 FourStroke, plus the 115 Pro XS CT. Availability shifts by model year; the pricing reference shows what's quotable right now." }
    ],
    content: `# Mercury Command Thrust: The Real Talk Guide (BigFoot History, Pontoons vs V-Hulls)

*Last reviewed: 2026-07-12*

> **Quick answer:** Command Thrust is Mercury's big-gearcase option, born as BigFoot in the 1990s to push pontoons and workboats. Bigger gearcase, taller gear ratio, bigger prop, more push. On a pontoon it's the standard choice. On a planing V-hull it costs real speed: our own back-to-back test on a 16 ft hull measured 6 mph gone. Call 905-342-2153 if you're not sure which gearcase your boat wants.

Somewhere right now, a boater with a 16-foot aluminum fishing boat is being told the Command Thrust model is "the upgrade." Costs a few hundred more, must be better, right?

We've tested exactly that setup. Two 16-foot Legends on Rice Lake, one rigged with a standard-gearcase Mercury 60, the other with the Command Thrust 60. The "upgrade" ran 6 mph slower.

We've been watching that sales pitch since the motor was called BigFoot. It was misleading then and it's misleading now. Command Thrust is a genuinely great piece of engineering that we sell and recommend constantly. For the boats it was designed for.

Here's the whole story: where it came from, what's actually different inside that gearcase, why pontoons love it, and why your V-hull almost certainly doesn't want it.

## Quick recommendation

Pontoon or workboat: take Command Thrust. Planing V-hull (aluminum fishing boat, runabout, bass boat): take the standard gearcase. Not sure which one your boat is: call 905-342-2153 and we'll sort it in two minutes.

## The BigFoot Story

Back in the 1990s, pontoon boats were taking off, and they created a problem the outboard industry hadn't fully solved. A pontoon sits high on the water, doesn't plane like a V-hull, and carries big loads at modest speeds. A standard mid-range gearcase spinning a small prop just wasn't moving that kind of boat well.

Mercury's answer was BigFoot. Take a 40-60 HP powerhead and hang it over a much bigger gearcase, with a larger-diameter driveshaft and propshaft closer to what a 90 HP class motor carries. The bigger case swings a bigger, deeper prop through a taller gear ratio (2.33:1 vs 1.83:1 on the 60). The result is push power: the ability to move a heavy, high-sitting boat with authority at the speeds it actually runs.

Mercury's own literature at the time called BigFoot "the industry's only outboard engine made specifically for pontoons." That's the origin, from the horse's mouth: a pontoon and workboat motor. Around 2014, Mercury quietly renamed BigFoot to Command Thrust. New name, same idea.

## What's Actually Different Inside

![Mercury Command Thrust gearcase next to a standard gearcase on the Harris Boat Works service bench, showing the size difference in the torpedo housing and skeg](/lovable-uploads/hero-ct-vs-standard-gearcase-hbw-bench.jpg)

*The two gearcases side by side on our bench. Same powerhead family, very different tools.*

This isn't a trim package or a sticker. The CT gearcase changes the physics of what the motor can push:

| Spec | 60 HP standard | 60 HP Command Thrust |
| --- | --- | --- |
| Gear ratio | 1.83:1 | 2.33:1 |
| Gearcase | Standard case | Larger case, heavier-duty shafts |
| Prop | Standard wheel | Roughly 3 inches more blade diameter |
| Gearcase depth | Shallower | Several inches deeper, prop runs in cleaner water |

| Spec | 90/115 standard | 90/115 Command Thrust |
| --- | --- | --- |
| Gear ratio | 2.07:1 | 2.38:1 |
| Gearcase diameter | ~4.2 in | ~4.9 in (the same gearcase the 150 FourStroke runs) |
| Prop | Standard wheel | Bigger blade, more disc area |

The taller ratio spins the prop slower for the same engine RPM, and the bigger case lets it swing a much bigger blade. Slower shaft speed plus more blade area equals torque at the water, which is exactly what a heavy, slow-hulled boat needs to get moving and hold speed into wind and chop.

Nothing about the powerhead changes. A 60 CT makes the same horsepower as a standard 60. What changes is how that power reaches the water.

## Why Pontoons Love It

A 22-foot pontoon with a family, a cooler, and a dog aboard can be pushing well over 1,361 kg (3,000 lb) of boat and cargo, sitting high with tubes that shove water instead of slicing it. That boat doesn't need shaft speed; it needs a paddle wheel's worth of grip.

Command Thrust gives it exactly that. Better hole-shot with a full deck, better control docking in wind, less strain holding cruise into a headwind. Mercury's own R&D backs the engineering: in their testing, a 60 CT out-accelerated a Yamaha 70 under both light and heavy loads. Great gearcase. Right application.

This is why CT is the default answer on pontoons at HBW: the 60 CT is the hero motor for 18-20 ft two-log pontoons, and from 90 HP up on bigger pontoons and tritoons we spec CT almost every time. [Our pontoon CT eligibility guide](/blog/mercury-command-thrust-pontoon-eligibility-2026) covers the size-by-size calls.

Same logic applies to true workboats: barges, water taxis, heavy displacement utility hulls that push weight all day. That's the duty the bigger shafts and case were built for.

## Why Your V-Hull Doesn't Want It: The 6 MPH Nobody Mentions

A planing V-hull plays a completely different game. It climbs on top of the water and slices; past hole-shot, what it wants is low drag and efficient shaft speed.

Put a CT gearcase on that boat and you're dragging a case nearly three-quarters of an inch fatter and several inches deeper through the water at 30+ mph, swinging a prop tuned for push instead of speed. The sales pitch writes itself: it costs more, so it must be better. What the pitch never includes is a number.

We will, because we tested it. Two 16-foot Legend hulls on Rice Lake, one with a standard-gearcase Mercury 60, one with a Command Thrust 60. The CT boat gave up 6 mph on top speed.

Same hull. Same HP. Six miles an hour gone. The only difference in the water was the gearcase.

On a 16-footer that tops out in the mid-30s, that's roughly a sixth of your top speed handed over to a gearcase your boat never asked for. And you paid about \$300 extra for it. That's not an upgrade; that's a downgrade with a markup.

The honest engineering summary: CT trades top-end efficiency for low-speed push. Pontoons live where the push matters. V-hulls live where the efficiency matters. That's the whole decision, and the GPS doesn't care what the brochure said.

## The "Upgrade Model" Problem

Here's the part most dealer content won't say out loud.

Because CT costs a few hundred dollars more, it's easy to sell as "the upgrade model" or "the better gearcase" to V-hull buyers. We've seen it for decades: boaters with 16-foot tinnies being steered into BigFoot and CT motors that make their boats slower, because that's what was on the floor or because "bigger is better" is an easy pitch. Boating forums have carried threads about exactly this since the 2000s, usually ending with someone's V-hull pointing at the sky trying to get on plane.

Here's the thing: even Mercury doesn't call it an upgrade. When the 75-115 FourStroke family launched, Mercury's own category manager described Command Thrust as "basically a bigger rudder in the water" and aimed it at heavier 18-plus-foot boats and pontoons, while crediting the slim standard gearcase with a 15% cut in hydrodynamic drag. Two tools, two jobs, straight from the factory. "The upgrade model" is a sales-floor invention.

To be fair to the other side of the argument: some brands ship taller gear ratios as their standard case, the bigger CT case is genuinely tougher, and there are boaters who like a deeper prop in rough water. Those points are real. They still don't make CT the right call on a recreational planing hull, because the drag penalty and the prop mismatch come with every one of those trade-offs.

At HBW we're on the water. [Our standard repower handoff includes an on-water test on Rice Lake before pickup when safe seasonal conditions allow.](/blog/hbw-on-water-load-test-mercury-repower-advantage-2026) That lets us see what a gearcase choice does to the actual boat and load.

## The Few V-Hull Exceptions

"Almost never" isn't "never." The legitimate V-hull cases we see:

- **True workboats.** A heavy steel or aluminum work hull that pushes loads at displacement speeds all day is a CT application no matter the hull shape. Same for barges and camp boats hauling material up the lake.
- **Kickers and trolling.** The 9.9 and 15 ProKicker line runs a CT-style deep gearcase, and it's brilliant at what it does: slow, precise trolling control. That's a purpose-built configuration, not an upsell.
- **Heavy-duty duty cycles.** A hull that spends its life towing, pushing, or loaded to the plate at low speed is worth a conversation. That conversation should end with a lake test, not a brochure.

If a dealer recommends CT on your V-hull and none of the above applies, ask them one question: "What will my top speed be compared to the standard gearcase?" We can answer that with a GPS log. See if they can answer it at all.

## What HBW checks before speccing a gearcase

Boat type and how it actually gets used, first. Then the load reality (a pontoon with 10-passenger summers is a different boat than the same pontoon with two retirees aboard), the transom and mounting height, and the prop plan, because the gearcase and the prop are one decision, not two ([prop selection guide here](/blog/mercury-propeller-selection-guide)). If the answer isn't obvious, we put the boat in the water and test it. That's the advantage of buying a motor from a marina instead of a showroom.

## Common mistakes

- **Buying CT on a V-hull because it was called "the upgrade."** It's not an upgrade; it's a different tool.
- **Buying standard gearcase on a big pontoon to save a few hundred dollars.** That's the mirror-image mistake, and it costs you every single time you leave the dock loaded.
- **Ignoring the prop half of the decision.** A CT motor with the wrong wheel wastes everything the gearcase offers.
- **Assuming the gear ratio tells the whole story.** Ratios only mean something in context of case size, prop, and hull. Comparing bare numbers across brands is how forum arguments start.

## What Command Thrust Costs

As of July 2026, from our live pricing: the 60 ELPT FourStroke is \$12,040 and the 60 CT is \$12,342, about a \$300 difference. The 90 ELPT is \$14,960 vs \$15,428 for CT. The 115 ELPT is \$17,083 vs \$17,540 for CT. On the right boat, that few hundred dollars is the best money on the invoice. On the wrong boat, it's paying extra to go slower.

_Prices here are planning figures as of {{PRICING_ASOF}}. For live Mercury motor pricing, see the [Mercury pricing reference](/pricing-reference)._

## Frequently Asked Questions

**Is Command Thrust the same thing as BigFoot?**
Yes. BigFoot was the 1990s name for Mercury's big-gearcase pontoon and workboat option. Mercury renamed it Command Thrust around 2014. Same concept: bigger gearcase, taller gear ratio, bigger prop, more push power at low speed.

**Does Command Thrust make the same horsepower?**
Yes. A 60 CT and a standard 60 have identical powerheads. CT changes the gearcase, gear ratio, and prop, which changes how the power reaches the water, not how much power there is.

**Should I get Command Thrust on my pontoon?**
Almost certainly yes if you're 90 HP and up on a 20+ ft pontoon, and it's worth a conversation on smaller setups. CT is the standard pontoon choice at HBW. See the [pontoon eligibility guide](/blog/mercury-command-thrust-pontoon-eligibility-2026) for size-by-size calls.

**Should I get Command Thrust on my fishing boat?**
Almost certainly no. On a planing aluminum or fibreglass V-hull, CT adds drag and costs top speed with no meaningful benefit. Standard gearcase with the right prop is the better setup. The exception is workboat duty or a ProKicker for trolling.

**How much top speed does CT cost on a V-hull?**
In our own back-to-back Rice Lake test, a 16-foot Legend with a Command Thrust 60 ran 6 mph slower than the same hull with a standard-gearcase 60. Lighter, faster hulls take the biggest hit; on bigger V-hulls the penalty is typically 2-5 mph. On a pontoon running 20-ish mph, the penalty barely exists, which is why the trade works there.

**Why do some dealers push CT on V-hulls then?**
It costs more, it's often what's in stock, and "the upgrade model" is an easy line. Sometimes it's honest ignorance about what the gearcase is for. Ask what your top speed will be versus the standard case and you'll find out quickly which kind of conversation you're in.

**Which Mercury motors offer Command Thrust?**
In our current lineup: 9.9 (including ProKicker), 40, 50, 60, 90, and 115 FourStroke, plus the 115 Pro XS CT. Availability shifts by model year; the [pricing reference](/pricing-reference) shows what's quotable right now.

## When to call HBW

If you're not sure whether your boat is a push boat or a plane boat, send the hull, capacity plate, current motor, and use case before choosing the gearcase. Build the starting quote at mercuryrepower.ca. HBW's standard repower handoff includes an on-water test on Rice Lake before pickup when safe seasonal conditions allow.

**Phone:** 905-342-2153
**Configurator:** [mercuryrepower.ca](https://mercuryrepower.ca)
**Service:** [hbw.wiki/service](https://hbw.wiki/service)

## Sources

- Mercury Marine 75-115 HP FourStroke brochure (Command Thrust gearcase, 2.38:1 ratio)
- Boats.com, "Mercury Debuts All-New 75/90/115 FourStroke Outboards" (4.2 in standard vs 4.9 in CT gearcase)
- Mercury Marine launch video for the 75-115 FourStroke family: standard gearcase 15% drag reduction; CT positioned for heavier 18 ft+ boats and pontoons ("basically a bigger rudder in the water")
- Mercury R&D comparison testing, 60 CT vs Yamaha 70 acceleration
- HBW on-water testing, Rice Lake, 16 ft Legend hulls, standard 60 vs Command Thrust 60

**Related guides:**
- [Mercury Command Thrust Complete Guide](/blog/mercury-command-thrust-complete-guide-2026)
- [Mercury Command Thrust Pontoon Eligibility](/blog/mercury-command-thrust-pontoon-eligibility-2026)
- [Command Thrust Guide for Pontoon Boats](/blog/mercury-command-thrust-guide-pontoon-boats)
- [Best Mercury Outboard for Pontoon Boats](/blog/best-mercury-outboard-pontoon-boats)
- [Mercury Propeller Selection Guide](/blog/mercury-propeller-selection-guide)
`,
  },
  {
    slug: 'mercury-command-thrust-pontoon-eligibility-2026',
    title: 'Is Your Pontoon Eligible for Mercury Command Thrust? (2026)',
    seoTitle: 'Mercury Command Thrust Pontoon Eligibility 2026 | HBW Guide',
    description: 'Find if your pontoon needs Mercury Command Thrust. Covers hull weight, transom height, tube count, prop diameter, and HP class checks.',
    image: '/lovable-uploads/command-thrust-pontoon-eligibility-hero.png',
    imageAlt: 'Mercury FourStroke outboard with Command Thrust gearcase on a pontoon boat to illustrate eligibility requirements.',
    author: 'Jay Harris',
    datePublished: '2026-05-28',
    dateModified: '2026-08-08',
    publishDate: '2026-05-28',
    category: 'Mercury Technology',
    readTime: '11 min',
    keywords: ["mercury command thrust pontoon eligibility", "command thrust for pontoon", "is command thrust worth it pontoon", "mercury command thrust compatibility", "tritoon command thrust eligibility", "command thrust gearcase pontoon"],
    relatedSlugs: ["mercury-command-thrust-guide-pontoon-boats", "best-pontoon-outboard-2026-mercury", "mercury-boost-software-upgrade-eligibility-2026", "how-to-read-mercury-outboard-serial-number"],
    faqs: [
      { question: "Is Command Thrust worth it on a 22-foot pontoon?", answer: "For a 22 ft pontoon, almost always yes, especially if you regularly carry 6+ people, do water sports, or use the boat at full load. On a tritoon of any size, Command Thrust is recommended unless you have a specific reason to skip it. We see the strongest customer satisfaction in the 20-24 ft tritoon range." },
      { question: "Will Command Thrust make my pontoon faster?", answer: "No, usually slightly slower at top end. You typically lose 2 to 4 MPH off top speed because the bigger prop is geared for thrust, not speed. What you gain is faster acceleration, faster time-to-cruise, stronger reverse, and the ability to perform under load. If top speed is your priority, standard gearcase is the right call." },
      { question: "Can I add Command Thrust to my existing standard gearcase motor?", answer: "Technically yes, practically rarely worth it. The cost of swapping the lower unit (parts plus labor) is usually within striking distance of the trade-in toward a new Command Thrust motor. Get both quoted before committing. We do both at HBW depending on the customer's situation." },
      { question: "Does Command Thrust burn more fuel?", answer: "At cruising RPM, fuel burn is comparable to standard gearcase, sometimes slightly higher because the bigger prop is moving more water. At trolling speeds, CT can burn slightly more. At full load coming up to cruise, CT can actually burn less because you get up on cruise faster and spend less time at the high-fuel-burn pre-cruise RPM." },
      { question: "Will Command Thrust work on my older pontoon?", answer: "The motor side is straightforward: Mercury offers CT on a range of FourStroke HP classes. The boat side: most pontoons built in the last 15 years handle a CT gearcase without trouble. Older or unusual transom configurations should be checked first. Email us a photo of the transom and we'll confirm." },
      { question: "Is Command Thrust the same as Pro XS?", answer: "No. Pro XS is a separate Mercury performance motor family (different powerhead, different tuning, marketed toward bass boats and aggressive runabouts). Command Thrust is a gearcase option on the FourStroke and Pro XS lines, not a separate motor. You can have a Pro XS with Command Thrust, a FourStroke with Command Thrust, or either without it." },
      { question: "Does Command Thrust affect my motor warranty?", answer: "No. CT is a Mercury factory option installed at build time. Mercury's standard warranty applies to CT motors the same way as standard motors. Repower into a new CT motor at HBW and the standard Mercury Marine factory warranty applies." },
      { question: "Do I need a special prop for Command Thrust?", answer: "Yes. Command Thrust uses a different prop shaft and a larger prop diameter than standard gearcase. The prop you have on a standard gearcase will not fit a CT gearcase, and vice versa. Prop selection for CT is part of the install conversation at HBW." }
    ],
    content: `*Last reviewed: 2026-08-08*

> **Quick answer:** Mercury Command Thrust fits most pontoons over 20 feet, all tritoons, and any pontoon regularly run at heavy loads (8+ people, water sports, cottage hauling). It's overkill on light 16-18 ft two-tube pontoons used for casual cruising. Email your boat photo and current motor serial number to info@harrisboatworks.ca for a fit check.

Most pontoon owners ask the same question every spring: do I really need Command Thrust, or is the standard gearcase fine. The short version is above. The full version, including the cases where it makes a huge difference and the cases where it's wasted money, is below. We do Command Thrust repowers at HBW every spring on Rice Lake and the Kawarthas, and the eligibility patterns are clearer than most online forums make it sound.

If your pontoon turns out to be a good fit, you're looking at noticeably better hole shot, the ability to get up on cruise with the load you actually carry, and stronger reverse for getting off shallow shorelines. If your pontoon isn't a fit, you're paying for a heavier gearcase and a bigger prop that you won't use. Both answers matter, and we cover both honestly.

## Quick eligibility check

The fastest path: email a photo of your pontoon plus current motor specs to info@harrisboatworks.ca and we'll tell you yes or no in one reply. The framework below covers the decision logic.

| Pontoon category | Command Thrust eligible? | Notes |
|---|---|---|
| 20+ foot pontoon, twin tube (heavy load use) | **Yes, strong fit** | Heavy boats benefit most from CT thrust |
| Tritoon (any size, 17 ft and up) | **Yes, almost always** | Tritoons carry more weight and want CT |
| 18 to 20 foot twin tube, moderate use | **Yes, recommended** | The classic Command Thrust sweet spot |
| 16 to 18 foot twin tube, cruising only | **Probably overkill** | Standard gearcase usually fine for light loads |
| Heavy work pontoon (cottage hauling) | **Yes** | Load capacity matters more than length here |
| Water-sports pontoon (skiing, tubing) | **Yes** | Pulling power is the whole reason CT exists |
| Pontoon used for trolling fishing only | **No, save the money** | Trolling speeds don't need CT thrust |
| Aluminum V-hull boat | **N/A** | Command Thrust is a pontoon gearcase decision |

If your boat doesn't fit one of these neatly, send us details and we'll work through it.

![Side-by-side comparison: Mercury standard gearcase vs Command Thrust gearcase on a workshop bench](/lovable-uploads/command-thrust-gearcase-comparison-inline.png)
*Standard gearcase (left) vs Mercury Command Thrust (right). The bigger housing and larger prop diameter converts horsepower into pushing force instead of top-end speed.*

## What Command Thrust actually does (and what it doesn't)

Before checking eligibility it helps to know what you're buying. [Command Thrust is a Mercury gearcase option, not a separate motor](/blog/mercury-command-thrust-real-talk-bigfoot-pontoon-v-hull). The same Mercury FourStroke powerhead bolts on top, but the lower unit is taller, the gears are heavier, and the prop diameter is roughly one inch bigger.

The bigger prop and lower gear ratio convert horsepower into pushing force rather than top-end speed. On a heavy pontoon, this means:

- Better hole shot (faster to come up on cruise with a full load)
- Stronger reverse and slow-speed control
- Less prop slip in turns and at low RPMs
- More confident performance with the family, coolers, and water toys on board

What Command Thrust does NOT do:

- It does not add horsepower. A 90 HP Command Thrust makes the same peak power as a 90 HP standard.
- It does not increase top speed. Usually top speed drops 2 to 4 MPH on a typical pontoon because the bigger prop is geared for thrust.
- It does not help small light boats. On a 16 foot aluminum V-hull or a light pontoon under 680 kg (1,500 lb) loaded, the standard gearcase usually outperforms Command Thrust on both speed and fuel.
- It does not retrofit easily onto a non-CT motor. Converting an existing standard gearcase to Command Thrust means swapping the entire lower unit, which is usually only economical when buying a new motor.

That last point is the most common confusion at the shop. People with an existing motor often ask if we can "add Command Thrust." The honest answer is rarely yes.

## Which pontoons are eligible

The simplest rule: if your loaded pontoon weight (boat + people + gear + fuel) is over about 1,361 kg (3,000 lb), Command Thrust earns its keep. If it's under 907 kg (2,000 lb) loaded, save the money. The middle is where the use case decides.

The four eligibility scenarios worth knowing.

### Tritoons of any length

A tritoon adds a third center tube. That third tube means more carrying capacity, more freeboard, and more displacement when loaded. Tritoons almost always benefit from Command Thrust, even on smaller 18 or 20 foot models. The third tube creates more drag at displacement speeds, and CT's stronger low-end thrust overcomes that drag much more cleanly.

If you have or are buying a tritoon, plan for Command Thrust unless your dealer talks you out of it for a specific reason.

### 20-foot and larger twin tube pontoons

Once a twin tube pontoon hits 20 feet, the loaded weight is typically 1,134 kg (2,500 lb) or more. At those weights, Command Thrust noticeably reduces time-to-cruise and lets you carry a full load without feeling underpowered. The 20-22 foot twin tube pontoon is the classic Command Thrust application.

### Pontoons used for water sports

Water sports (tubing, light skiing, wakeboarding on bigger pontoons) demand torque at low speeds, exactly what Command Thrust delivers. A pontoon that struggles to come up on cruise with a tube behind it is almost always a hole-shot problem, not a horsepower problem. CT fixes hole shot directly.

### Cottage-country work pontoons

If you use the pontoon to haul building materials, cottage supplies, or do anything that puts heavy weight on the boat regularly, Command Thrust is the right call. The reverse thrust is also useful in getting off shallow shorelines and around docks.

## Which pontoons are NOT eligible (or shouldn't bother)

Just as important: when standard gearcase is the right answer.

### 16 to 18 foot light cruising pontoons

A two-tube 16 or 18 footer used for casual cruising at moderate loads doesn't gain much from Command Thrust. The standard gearcase will come up on cruise easily, give you 2 to 4 MPH more top speed, and burn slightly less fuel. Unless you're hauling 8 people regularly on a small pontoon, save the money.

### Trolling-only fishing pontoons

If you trolling motor fish at 3 to 5 MPH all day, you're never using the thrust Command Thrust is engineered for. Standard gearcase is the right call. The bigger CT prop drags more at displacement speeds and slightly hurts fuel economy at trolling speeds.

### Light loads / small families

Two people, lightweight gear, mostly day cruising at 25 MPH. Standard gearcase. Save the money for upgraded seating or a better stereo.

### Already over-powered

Some pontoons are [already running close to capacity-plate maximum HP](/blog/pontoon-hp-sizing-decision-tree-ontario). Adding Command Thrust to a motor that's already pushing your hull near its limit doesn't get you more performance; you're just changing the gearing. Talk to us before changing motors if you're near capacity.

## How to check your specific eligibility

Five things to confirm before you commit.

1. **Pontoon length.** Measured at the deck, not the tube ends. Round to the nearest foot.
2. **Tube count.** Two tubes or three (tritoon). The third tube is a major eligibility factor.
3. **Loaded weight estimate.** Boat dry weight (in your owner's manual or on the capacity plate) plus typical people and gear. Be honest about what you actually carry.
4. **Transom height.** Command Thrust gearcases run a few inches taller than standard. Most modern pontoons handle this fine but it's worth measuring.
5. **Current motor HP and serial number.** This tells us which Command Thrust options are available at that HP class and if you're at capacity-plate maximum.

Email a photo of the capacity plate, the current motor cowl plate, and your loaded weight estimate to info@harrisboatworks.ca. We'll review the fit and reply with a recommendation or any information still needed.

For the long version of motor serial number decoding, our [Mercury Outboard Serial Number Guide](/blog/how-to-read-mercury-outboard-serial-number) walks through year and model decoding.

## HP class availability

As of August 8, 2026, current Canadian listings include 9.9 HP Command Thrust and ProKicker configurations, plus select 40, 50, 60, 90 and 115 HP FourStroke models. Shaft length, controls and gearcase availability vary by exact model. Check the live [Mercury pricing reference](/pricing-reference) before choosing a configuration.

Rather than list every model and year here (Mercury changes things), we recommend the same path: email us your current motor details, what HP you're targeting, and we'll tell you exactly which Command Thrust configurations are available for your boat right now. Mercury's official Command Thrust overview is at [mercurymarine.com/en/us/outboards/fourstroke/command-thrust](https://www.mercurymarine.com/en/us/outboards/fourstroke/command-thrust).

## Can you retrofit Command Thrust to an existing motor?

This is the most common question we get at the shop. The honest answer: technically yes, practically no.

The Command Thrust gearcase, driveshaft, water pump, and prop are all different from the standard parts. Converting a non-CT motor to CT means buying all those parts and the labor to swap them. Once you add up the parts cost and labor, you're usually within striking distance of [trading the entire motor in toward a new Command Thrust model](/blog/mercury-repower-cost-ontario-2026-cad).

When a retrofit MIGHT make sense:
- Your existing motor is fairly new (last 2 to 3 years), low hours, otherwise excellent condition
- You bought used and are stuck with a standard gearcase on a heavy pontoon
- You're comparing the retrofit to selling/replacing the entire motor and you've done the math

When a retrofit does NOT make sense:
- The motor is older or has high hours (the retrofit money is better applied to a new motor)
- You're trying to "upgrade" for marginal benefit on a light pontoon
- You haven't quoted both paths (retrofit vs new motor) side by side

We'll quote both at HBW. Sometimes the new motor wins, sometimes the retrofit does, but never assume one or the other without checking both.

## What we see at HBW

We've done a fair share of Command Thrust pontoon repowers since 2020, and a few patterns hold up.

The first pattern: customers who try Command Thrust after running a standard gearcase on the same pontoon almost never go back. The hole shot improvement on a loaded pontoon is something you feel immediately, not something you have to convince yourself you notice. If you took two pontoons out side by side, you would pick the CT every time.

The second pattern: the customers who regret Command Thrust are almost always on light pontoons where they wanted more top end and got less. We push back at the shop when somebody insists on CT for a light cruising boat. The honest answer is "you'll lose 3 MPH and pay more, what are you actually solving?" Sometimes they push back and we order it anyway, but the pattern is consistent.

Third pattern, specific to Rice Lake and the Kawarthas: water levels can drop in late summer, especially in the back bays of Rice Lake and around Bobcaygeon. Pontoons that float fine in June can be touching bottom in September. Command Thrust's stronger reverse thrust pays off here. Customers who learned the hard way (after dragging tubes through soft mud) are some of our most loyal CT advocates.

Fourth pattern: tritoons with standard gearcase almost always disappoint. The third tube is the dead giveaway that the boat is going to want more thrust. If somebody calls us about a tritoon that "feels underpowered," 9 times out of 10 they're on a standard gearcase. Repowering with CT solves it without bumping HP.

::pull-quote
quote: Hole shot was night and day. We were running 6 adults plus gear on a 22-footer with the old standard gearcase, took forever to lift the nose and come up to cruise. New CT motor, on cruise in seconds. Should have done it three years ago.
attribution: Common shop-floor pattern after a Command Thrust repower at HBW
::

::decision-card
eyebrow: Command Thrust decision
heading: Is Command Thrust right for your pontoon?
leftLabel: Skip it
leftCriteria:
  - 16 to 18 ft light cruising pontoon
  - Trolling-only fishing use
  - Light loads (2 to 4 people)
  - Already at capacity-plate maximum HP
leftOutcome: Standard gearcase is the right call
leftVariant: alternative
rightLabel: Yes, strong fit
rightCriteria:
  - Tritoon of any size
  - 20+ ft twin tube pontoon
  - Heavy loads (8+ people) or water sports
  - Cottage hauling or regular full-load use
rightOutcome: Order Command Thrust with the repower
rightVariant: recommended
whenInDoubt: Probably yes if you have an 18 to 20 ft twin tube with moderate loads, occasional water sports, or mixed use. The middle case is where the load decides.
::

## Why this matters for Ontario pontoon boaters

A few things that make Command Thrust hit different in Ontario than in other markets.

**Pontoon population is high.** Rice Lake, the Kawarthas, Lake Simcoe, and Lake Scugog all have [heavy pontoon traffic](/blog/best-mercury-outboard-pontoon-boats). The use case skews toward loaded family days, fishing parties, and shoreline navigation rather than open-water cruising. That use case favours Command Thrust.

**Cottage hauling.** Many Ontario pontoon owners use the boat to move building materials, propane tanks, generators, and supplies to cottage properties. CT's pushing power matters here more than top speed.

**Tritoons becoming standard.** Most new pontoons in the 20 ft+ class sold in Ontario in the last 5 years are tritoons. That's good news for Command Thrust eligibility because tritoons benefit from CT almost universally.

**Late-season shoreline access.** Ontario water levels drop late in the season. Stronger reverse and slow-speed control matter for navigating shallow shorelines, docks, and ramps in October.

## Ready to confirm Command Thrust eligibility?

**Phone:** 905-342-2153
**Email:** info@harrisboatworks.ca (send pontoon length, tube count, and current motor cowl plate photo for a fit check)
**Quote a repower:** [mercuryrepower.ca](https://mercuryrepower.ca)

Harris Boat Works · 5369 Harris Boat Works Rd, Gores Landing, ON · Mercury Marine dealer since 1965, current Premier Dealer.

## Sources

- Mercury Marine official Command Thrust gearcase demo (YouTube): [Watch the Mercury demo](https://www.youtube.com/watch?v=pZFDAetHRIQ)

`
  },

  {
    slug: 'is-2026-good-year-to-buy-boat-canada',
    title: 'Is 2026 a Good Year to Buy a Boat in Canada?',
    description: 'Is 2026 a good year to buy a boat in Canada? Honest dealer perspective on the market, tariffs, financing, and the repower alternative.',
    image: '/lovable-uploads/hero-proxs-outside-hbw-shop.jpg',
    imageAlt: 'Mercury Pro XS outboard on a boat outside the Harris Boat Works shop in Gores Landing, Ontario',
    author: 'Harris Boat Works',
    datePublished: '2026-04-28',
    dateModified: '2026-08-08',
    publishDate: '2026-04-28',
    category: 'Buying Guide',
    readTime: '12 min read',
    keywords: ['buy boat canada 2026', 'boat market canada', 'best time to buy boat'],
    content: `*Last reviewed: 2026-08-08*

> **Quick answer:** 2026 is a functional year to buy a boat in Canada, not a deal year. Inventory has recovered, lead times are normal, and prices sit above 2019 levels with little sign of dropping. If your hull is sound, a Mercury repower is often better value than buying new. Build a repower quote at mercuryrepower.ca.

### Quick Answer

2026 is a functional year to buy a boat in Canada, not a deal year, but not a bad year either. Inventory has recovered from the pandemic shortage. Lead times are normal. Prices are higher than 2019 and are not likely to drop meaningfully. If you have a sound hull, a Mercury repower may be the better value than buying new. Build a configured repower quote at [mercuryrepower.ca](https://www.mercuryrepower.ca).

---

### Full Article

Every January through April, we hear the same question: should I buy now, or wait? This year it comes with more weight than usual. Tariffs, an uncertain dollar, interest rates that moved fast in both directions, 2026 is a more variable market than anything most Ontario boaters have dealt with in the last decade.

Here is an honest read on the market from a third-generation family marina founded on Rice Lake in 1947 and a Mercury dealer since 1965. We are not going to tell you it is a great time to buy if we do not believe that.

---

## What the 2026 Boat Market Actually Looks Like

**Inventory:** Significantly better than 2021, 2023. During the pandemic boom, buyers waited 18 months or more for popular models. That situation is largely resolved. Dealers have boats. Lead times are back to something normal. You can comparison shop again.

**New boat prices:** Up compared to 2019. Not dropping significantly in 2026. Supply chain disruptions, currency movement, and material cost increases created a new pricing floor over the past four years. If you are expecting 2019 prices, they are not coming back.

**Used boat market:** More inventory than 2022, 2023, but prices remain elevated relative to pre-pandemic levels. Used boats are not being discounted aggressively. Buyers who purchased at the 2021, 2022 peak are still holding asset value.

**Short version:** You will not get a pandemic deal. You also will not face pandemic-era wait times or limited selection. It is a functional market.

---

## The Tariff and Exchange Rate Reality

This is the factor most buyers underestimate. Most major outboard manufacturers, Mercury, Yamaha, Suzuki, assemble or source components in the United States. Most aluminum fishing boat brands have North American manufacturing with significant U.S. content. Even boats assembled in Canada use U.S.-sourced components.

When the Canadian dollar weakens against the U.S. dollar, boat prices in Canada rise, not immediately, but within one to two model cycles. The 2024-2025 dollar movements have already been reflected in 2026 pricing for most dealers.

Trade tariff changes between Canada and the U.S. add another variable. The details of what applies to marine goods in 2026 are evolving. The practical takeaway: if tariff exposure increases further, 2026 prices are a floor, not a peak. Waiting for prices to drop on the assumption of tariff resolution assumes a political outcome that is not certain.

---

## Financing in 2026

Interest rates in Canada have moderated from the 2023 peak. The Bank of Canada has made multiple cuts. Marine lending has followed partially, boat financing typically tracks prime with a premium.

Rates in 2026 are better than 2023. They are not as low as the 2020, 2021 environment. Monthly payments on a typical boat purchase are lower than they were at peak, but the boat itself costs more than it did in 2020.

**What to factor into total cost:** financing, insurance, storage, maintenance, and fuel, not just the purchase price.

---

## Who Should Buy in 2026, and Who Should Wait

### Buy now if:

**You are replacing a motor, not buying a whole new boat.** A Mercury repower on a sound hull is often meaningfully better value than a new boat purchase at 2026 prices. You get upgraded technology, improved fuel economy, warranty coverage, and you are not paying for a new hull you do not need. HBW currently has Mercury motors in stock. Build a transparent, no-games quote at [mercuryrepower.ca](https://www.mercuryrepower.ca).

**You have been in the market for 12 to 18 months and the boat you want is available.** Waiting for a correction that may not come costs you a season.

**Your current boat is costing more in repairs than it is worth.** If you are spending heavily on repairs to a boat worth $8,000, the math is a warning.

**You are a first-time buyer with a clear, modest budget.** The entry-level aluminum fishing boat and small pontoon market is reasonable in 2026. Real inventory, real prices. Check [harrisboatworks.ca](https://harrisboatworks.ca) for what is on the lot.

### Consider waiting if:

**You are buying out of fear, not need.** "Prices might go up" is not a purchasing strategy on its own. If you are not ready, do not know exactly what you want, and have not done the research, buying in a hurry causes regret.

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**You want a premium or specialty boat.** The higher the price point, the more price discovery questions exist in 2026. A $35,000 aluminum boat is a different market than a $150,000+ cabin cruiser.

**The repower math is better for you.** For many Ontario boaters with a sound hull and a worn motor, the repower is the better move. Build a quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) before going to a showroom.

---

::decision-card
eyebrow: 2026 timing decision
heading: Buy this season, or wait for fall pricing?
subhead: The 2026 market is not collapsing and not booming. Your timing depends on whether you can wait.
leftLabel: You need a boat for this season
leftCriteria:
  - You sold or lost your previous boat and want water time in 2026
  - You have a family vacation or cottage booked that needs the boat
  - Current inventory has something close to what you want
  - You can pay or finance now without stretching
leftOutcome: Buy now, the market is what it is. Lose a season chasing a discount.
leftVariant: recommended
rightLabel: You can wait until late fall
rightCriteria:
  - You have a working boat that will get through 2026
  - You want a specific model or HP not currently in stock
  - You want to negotiate from a position of patience
  - October to December dealer flexibility matters to you
rightOutcome: Wait. Off-season pricing and trade-in flexibility are real.
rightVariant: alternative
whenInDoubt: A season on the water is worth more than 5 percent off a motor. If a missed summer hurts more than the discount helps, buy now.
::

---

## The Repower Option: Better Value in 2026 Than It's Been in Years

This deserves its own section. The economics of repowering a sound used hull instead of buying new have shifted meaningfully in 2026.

New boat prices are elevated. Mercury's current FourStroke lineup is genuinely excellent. The repower cost is predictable. A new boat carries financing costs, depreciation on a new hull, and a motor you may not need.

For a hull that is structurally sound, under 25 years old, with an aging or unreliable motor, [a repower is worth pricing out](/blog/mercury-repower-cost-ontario-2026-cad) before setting foot in a showroom. Build a specific, configured quote at [mercuryrepower.ca](https://www.mercuryrepower.ca). No phone calls, no games, no "we'll give you a price when you come in."

For engine repairs, we only service Mercury and Mercruiser.

---

## HBW's Honest Advice

We sell boats and motors. We are transparent about that.

We have also been doing this for three generations. A customer who makes a decision they are comfortable with comes back. One who felt pressured does not.

Our 2026 advice: do the full math before deciding. If you are replacing a motor on a good hull, price out the repower at [mercuryrepower.ca](https://www.mercuryrepower.ca) first. If you are in the market for a new boat, bring a clear budget that includes all carrying costs, not just the purchase price. If you are not sure whether ownership is right for you, [rent first](/blog/renting-vs-owning-boat-ontario-math); HBW's current pontoon and fishing-boat lineup is listed at harrisboatworks.ca/rentals.

---

## What we see at HBW

First weekend in May, the shop fills up with no-starts. Nine out of ten are the same three things. The battery is dead because the charger was not plugged in over winter. Fuel went stale because no stabilizer was added before storage. Or the kill-switch lanyard got bumped during winterization and the helm does not realize it.

The fourth most common: corroded battery terminals from a boat that sat outside in salt-spray weather. Cleaning the terminals plus a fresh battery solves more spring no-starts than any other repair.

---

## FAQs

**Is 2026 a good year to buy a boat in Canada?** 
It is a functional but not exceptional year. Inventory is normalized. Prices are higher than 2019 and are unlikely to drop meaningfully. For ready buyers with clear goals and financing in place, 2026 offers reasonable selection. For those hoping for a price correction, limited evidence one is coming.

**Are boat prices going down in Canada in 2026?** 
Prices are largely holding or seeing minor softening at the new-end compared to the 2021, 2022 peak. They have not returned to pre-pandemic levels.

**Is it better to buy a new boat or repower in 2026?** 
For many Ontario boaters with a sound hull, repowering is better value. A Mercury repower delivers upgraded technology, warranty coverage, and improved fuel economy at a fraction of a new-boat cost. Use [mercuryrepower.ca](https://www.mercuryrepower.ca) to compare.

**What is the best time of year to buy a boat in Canada?** 
Fall (September, November) for new boats, dealers are clearing model-year inventory. Winter boat shows (January, February) for promotional financing programs. Spring offers the widest selection but also peak demand and less dealer motivation to negotiate.

**Should I buy or rent in 2026?** 
There is no universal day-count threshold. Compare the live rental rate for the boat you would use across your realistic number of days with your own annual ownership costs. Renting before purchasing can help you evaluate layout and use without promising a financial outcome.

---

## Internal Links
- Mercury Repower Cost Ontario (CAD)
- [Best Mercury Outboard for Aluminum Fishing Boats](/blog/best-mercury-outboard-aluminum-fishing-boats)
- [Mercury Outboard Financing Ontario](/blog/mercury-outboard-financing-ontario-2026)
- [Boat Rentals on Rice Lake](/blog/rice-lake-boat-rental-guide-2026)

## CTA

**See real prices. No games.** 
Build your Mercury repower quote at [mercuryrepower.ca](https://www.mercuryrepower.ca), live CAD pricing, full configuration, no phone calls required.
Or call 905-342-2153. Harris Boat Works, Gores Landing, ON. Est. 1947.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).
---

---
`,
    faqs: [
      {
        question: 'Is 2026 a good year to buy a boat in Canada?',
        answer: '2026 is a functional but not exceptional year to buy a boat in Canada. Inventory has normalized after the post-pandemic shortage, and lead times are back to reasonable levels. However, prices are significantly higher than 2019 levels and are not expected to drop meaningfully in the near term, currency pressures and potential tariff impacts create more upside price risk than downside. For buyers who are ready, have their financing in order, and know what they want, 2026 offers reasonable selection. For buyers hoping for a price correction, there\'s limited evidence that one is coming.'
      },
      {
        question: 'Are boat prices going down in Canada in 2026?',
        answer: 'Boat prices in Canada are largely holding steady or have minor softening at the new-end in 2026, compared to the peak of 2021-2022, but they haven\'t returned to pre-pandemic levels. Used boat prices have slightly more flexibility as inventory increases, but the elevation from the pandemic price floor has been mostly maintained. Canadian buyers face the additional pressure of USD/CAD exchange rate dynamics, as most major outboard and boat brands are priced in or relative to U.S. dollars. A significant price drop in 2026 would require a combination of weak demand and strong Canadian dollar, neither is reliably expected.'
      },
      {
        question: 'How do tariffs affect boat prices in Canada in 2026?',
        answer: 'Most major outboard motors and many boat brands sold in Canada have significant U.S.-manufactured content. When tariffs are applied to U.S.-origin goods entering Canada, those costs are typically passed through to consumers via dealer pricing adjustments within one to two model cycles. The specific tariff situation for marine goods in 2026 is evolving, buyers should assume that any escalation in Canada-U.S. trade tensions will increase, not decrease, boat prices over the following 12-24 months. Waiting for tariff resolution as a price-drop strategy assumes a political outcome that is uncertain.'
      },
      {
        question: 'Is it better to buy a new boat or repower an old one in 2026?',
        answer: 'For many Ontario boaters in 2026, repowering a sound hull is better value than buying a new boat. New boat prices are elevated relative to historical norms, which means you\'re paying a premium for a new hull whether or not you need one. A Mercury repower on a structurally sound hull gives you upgraded technology, manufacturer warranty, and improved fuel economy at a fraction of the cost of a new rig. As of August 8, 2026, the [live pricing reference](/pricing-reference) lists the 115 ELPT FourStroke at a $17,083 HBW selling price and $19,030 MSRP, motor only. The repower math is most compelling when your hull is in good structural condition, under 25 years old, and your main issue is an aging or unreliable motor. Use mercuryrepower.ca for a configured quote.'
      },
      {
        question: 'What is a realistic budget for a boat in Canada in 2026?',
        answer: 'Based on what\'s actually on HBW\'s lot right now: entry-level new aluminum boats with small motors start at $6,999 (2024 Legend 14 Widebody). A more capable 16-foot package with a 25 HP runs $24,499. Mid-range family boats in the 17-19 foot range start around $39,999. The 2025 Legend HALO 21 is $47,999. Premium fiberglass tops out at $79,999. These are real published prices, the full range of used boats we have in stock averages about $25,549. Industry-wide, expect to add 13% HST, plus rigging, prop, and controls for any motor purchase.'
      },
      {
        question: 'Should I buy a boat or just rent in 2026?',
        answer: 'If you\'re uncertain whether you\'ll use a boat enough to justify ownership costs, renting first is a practical way to test the type of boat and access pattern that fit you. There is no universal day-count threshold: compare the live rental rate for your realistic number of days against your own storage, maintenance, insurance, winterizing, depreciation, and financing costs.'
      },
      {
        question: 'How do boat financing rates in Canada compare in 2026 vs recent years?',
        answer: 'Boat financing rates in Canada have improved from the peak of 2023 as the Bank of Canada has cut its policy rate. However, recreational marine lending carries a premium over prime, so rates for boat loans in 2026 are meaningfully higher than the near-zero rate environment of 2020-2021 that fuelled the pandemic buying boom. A buyer who bought a similarly-priced boat in 2020 would have had a lower monthly payment despite lower prices today. Factor total carrying cost, principal, interest, insurance, storage, maintenance, and fuel, not just purchase price when evaluating affordability.'
      },
      {
        question: 'What\'s the best time of year to buy a boat in Canada?',
        answer: 'Fall (September-November) typically offers the best new boat purchase opportunities in Canada. Dealers are clearing model-year inventory and are more willing to negotiate on leftover stock. Winter boat shows (January-February) can offer promotional pricing with manufacturer incentive programs. Spring (March-May) offers the widest selection but also peak demand, dealers are less motivated to discount. If you\'re buying used, fall sellers are motivated (they don\'t want to pay for winter storage. HBW\'s published storage rates start at $33/ft for a trailered boat up to 21 ft) but selection is higher in spring when people list before the season starts.'
      },
      {
        question: 'Does it make sense to buy a boat if I only use it 10-15 days per year?',
        answer: 'At 10-15 days of use per year, the per-use cost of ownership is high. For a $40,000 rig, factor in: annual winterization ($425.71 published rate for a 75-115 HP 4-stroke), storage ($627 for a typical 19-footer on a trailer), insurance, and financing. That adds up to meaningful per-day cost at low usage. That doesn\'t mean ownership is wrong at that usage level, but buyers should go in with clear eyes about the economics. If the boat enables more consistent family time or access to specific water you\'d otherwise miss, the value calculation has dimensions beyond pure cost-per-day.'
      },
      {
        question: 'Is buying a used boat in 2026 a better deal than buying new?',
        answer: 'Used boats offer a price break in 2026, but the gap has narrowed compared to pre-pandemic norms. Used prices remain elevated because buyers who purchased at peak values aren\'t selling at a loss, and general boat demand in Ontario stays strong. The best used boat deals are typically 5-10 year old boats with a recent motor replacement or repower, you get a hull that\'s depreciated but mechanically current. A used boat with an old, high-hour motor requires careful assessment: the motor\'s remaining life and replacement cost need to factor into your offer price. We currently have 13 used boats on the lot at harrisboatworks.ca if you want a real-market reference point.'
      }
    ]
  },
  {
    slug: "rice-lake-boat-rentals-from-toronto-gta",
    title: 'Rice Lake Boat Rentals from Toronto',
    seoTitle: "Rice Lake Boat Rentals from Toronto and the GTA",
    description: "A Rice Lake rental day from the GTA: drive time, what's included, what to bring, and how to book online with Harris Boat Works.",
    image: '/lovable-uploads/pontoon-family-rice-lake-hero.png',
    author: 'Jay Harris',
    datePublished: "2026-05-16",
    dateModified: '2026-08-02',
    publishDate: "2026-05-16",
    category: "Boating Lifestyle",
    readTime: '12 min read',
    keywords: ["Rice Lake boat rentals", "boat rentals near Toronto", "Kawarthas pontoon rentals", "family boat rental Ontario", "day trip boat rental GTA", "pontoon rental Toronto"],
    content: `# Rice Lake, Ontario Boat Rentals from Toronto and the GTA: A Day Trip Guide

*Last reviewed: 2026-08-02*

> **Quick answer:** A Toronto-to-Rice Lake rental day trip works: plan roughly 1 hour 45 minutes from central Toronto in light traffic to Harris Boat Works in Gores Landing, and allow more time during GTA or summer-weekend traffic. Check the live listings, rates, and availability at harrisboatworks.ca/rentals before planning the rest of the day.

You're in Toronto, you don't own a boat, but you'd like to have one for a day. Harris Boat Works operates a current online rental lineup from its Gores Landing dock on Rice Lake. HBW has served boaters here since 1947; current rentals and their availability are listed online.

This guide covers the route, the verified rental process, what to bring, and the Rice Lake safety briefing.

---

## The Quick Answer

**Drive time from central Toronto:** roughly 1 hour 45 minutes in light traffic (401 east, exit Cobourg, County Rd 18 north).
**Drive time from elsewhere in the GTA:** varies by origin and traffic; check the live route before choosing a rental start time and allow two hours or more when conditions warrant.

**Current rental lineup:**
- **23 Cruise and Halo pontoons**
- **20-ft and 24-ft Transporter pontoons**
- **16-ft ProSport fishing boats**

The booking system shows the live boat, capacity, equipment, rental period, rate, and availability for each date. Life jackets and legally required safety gear are included, and the driver receives a Rice Lake orientation before departure.

**Booking:** [harrisboatworks.ca/rentals](https://harrisboatworks.ca/rentals).

The rest of this post is the detail you'd want before booking.

---

## Why Rice Lake Works for a GTA Day Trip

Rice Lake is freshwater on the Trent-Severn Waterway, and HBW's dock is in Gores Landing on the south shore. The drive from central Toronto is roughly 1 hour 45 minutes in light traffic, but traffic varies; check your route before choosing a rental start time. On the water, follow the map and orientation because the old railway causeway remains a serious navigation hazard.

---

## What You Get When You Rent at HBW

Each rental includes:
- **Life jackets** for everyone (kids and adults, bring sizes if you have specific kids)
- **Pre-departure briefing**. Rice Lake hazards (the sunken railway, weed beds, shoals), how to handle the boat, where to fish or cruise
- **Lake map** showing the Rice Lake railway hazard and buoyed crossings
- **Public washrooms** during rental hours; the office provides the key

What you bring:
- **Valid PCOC and photo ID for every person who may drive.** HBW accepts a valid temporary or permanent Pleasure Craft Operator Card at check-in. The rental safety checklist is still part of the briefing but does not replace HBW's driver-card requirement. Passengers do not need a PCOC. See the [current rental policy](https://www.harrisboatworks.ca/boat-rentals) before booking.
- **Sunscreen, hats, water, snacks**
- **Fishing gear and licence if fishing.** [Ontario fishing licence](https://www.ontario.ca/page/fishing-licence) fees depend on residency, licence type, and duration. As a planning reference, Ontario lists a 1-day resident sport fishing licence at $12.21 + HST and a 1-year resident sport fishing licence at $26.57 + HST. Check ontario.ca before your trip because licence rules and fees can change.
- **Cooler and refreshments** for the day

What's NOT included:
- **Fuel used**, which staff calculate when the boat returns
- **Damage terms.** HBW processes a $1,000 credit-card authorization, and the current rental agreement governs responsibility for damage, including amounts above the hold
- **Fishing licence**, get yours from [ontario.ca](https://ontario.ca) or any HBW staff can help

---

## Boat Type Selection. Match the Boat to the Day

**You want a relaxed cruising or swimming day.**
→ Start with the **23 Cruise or Halo pontoon** listings and verify capacity and equipment for your group.

**You want to mix fishing and cruising.**
→ Compare the **20-ft and 24-ft Transporter** listings; both are presented as fishing pontoons in the live booking system.

**You're a small fishing group.**
→ Review the **16-ft ProSport** listing and its posted capacity and equipment.

**You're a couple on a date / scouting visit / first-time-on-water.**
→ Compare the currently available pontoons and choose one whose posted capacity and equipment fit your group. Staff review the selected boat's controls during orientation.

**You're considering buying a boat someday** and want to test the waters.
→ Rent the closest available style to the boat you are considering and use the day to test layout, passenger space, and how you actually spend time on the water.

---

## Check the Current Rental Period

The live booking system shows the rental period offered for each boat and date. Confirm the selected period and any multi-day terms in the current listing and rental agreement before booking.

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---

## A Sample GTA Day-Trip Itinerary

**7:45 AM**. Leave central Toronto. Stop for coffee on the 401 east.
**9:30 AM**. Arrive at HBW (5369 Harris Boat Works Rd, Gores Landing). Park, bathroom, snacks at the office.
**9:45 AM**. Boat briefing + safety walkthrough.
**10:00 AM**. On the water. Run east toward Hiawatha or west toward Bewdley.
**11:30 AM**. First swim stop or fishing session.
**12:30 PM**. Cruise to Bewdley shoreline. Lunch on board or anchor in a bay.
**1:30 PM**. More fishing, swimming, or cruising.
**2:30 PM**. Head back toward the marina.
**3:00 PM**. Dock back at HBW.
**3:30 PM**. Quick lunch at Lakeview Restaurant in Bewdley (5 min drive, on the lake).
**4:30 PM**. Drive home.
**6:00 PM**. Back in Toronto.

Use the live rental rate and add the fuel you actually use. Include your travel, food, fishing-licence, and bait costs rather than relying on a generic family-day estimate.

---

## Things to Know About Rice Lake (the Hazards)

Rice Lake is not flat-empty water. Two specific things to know:

**1. The sunken railway.** A 19th-century railway line is submerged about 4 feet below surface across the middle of the lake (between Hiawatha and Harwood). It's claimed many propellers over the decades. **The pre-departure briefing covers this**, we'll show you exactly where on the chartplotter and how to navigate around it. Newer boaters: stay on the south shore until you've crossed it once with us briefing.

**2. Weed beds.** Mid-summer, weed beds get thick in the bays. Avoid running through them at speed, they'll wrap your prop. Easy to navigate around once you see them; the briefing covers this.

**3. Wind from the west.** Rice Lake's east-west orientation means a stiff west wind builds chop quickly across the open water. Check the morning forecast; if it's blowing 15+ knots from the west, plan a sheltered cove day rather than open-lake cruising.

Outside the mapped hazards, continue to follow Ontario speed, wake, shoreline-distance, and safe-operation rules.

---

## Booking. When and How

Use **[harrisboatworks.ca/rentals](https://harrisboatworks.ca/rentals)** for the current fleet calendar and online booking. Availability changes by boat and date.

**Cancellation:** HBW's current policy allows cancellation at least 7 days before the rental date with the deposit refunded. Cancellations within 24 hours or on the rental date are charged the full rental amount. Harsh-weather cancellations or rescheduling carry no penalty and applied deposits and payments are refunded. Review the current agreement before booking.

---

## Beyond the Day-Rental. What Comes Next

If you have a great rental day and start thinking about ownership, talk to us before searching used Mercurys on Marketplace:

- We sell new Mercury motors + Legend Boats (Canadian-designed aluminum and pontoon, sold exclusively in Canada)
- We do pre-purchase inspections on used boats and motors
- We offer a **trade quote** through our [configurator](https://www.mercuryrepower.ca) that's based on actual Ontario service-data, not Florida blue-book guesswork

A rental can be a useful gut-check on what kind of boat owner you'd be. Use the day to evaluate passenger space, fishing room, storage, and cruising comfort before you choose a boat to buy.

---

## What the Whole Day Actually Costs

The itinerary above is the fun math. Here's the money math, all in, so nobody's surprised at the dock:

| Line item | What to budget | Notes |
|---|---|---|
| Boat rental | Live rates at [harrisboatworks.ca/rentals](https://harrisboatworks.ca/rentals) | Varies by boat and day; check the current calendar |
| Fuel (paid at return) | Varies with use | You pay for what you burn; boat, load, wind, distance, and throttle all matter |
| Damage deposit | $1,000 hold, refunded | Credit card authorization, not a charge |
| Boating licence | Complete an accredited course before rental day | HBW links to [myboatcard.com/card/harrisboat](https://myboatcard.com/card/harrisboat); the PCOC itself does not expire |
| Bait | Check current availability | Bring tackle and any bait you need if it is not available on site |
| Lunch and treats | Your call | Gores Landing and Bewdley both have options; ice cream stops are mandatory with kids aboard |

Use the live boat rate plus your own fuel, travel, food, and fishing costs. The Pleasure Craft Operator Card is a one-time credential that does not expire.

Fuel use varies with the selected boat, load, wind, distance, and throttle. Plan a route that fits the time and conditions rather than relying on a fixed fuel estimate.

---

## Frequently Asked Questions

**How long does it take to drive from Toronto to Rice Lake?**
Roughly 1 hour 45 minutes to Gores Landing from central Toronto in light traffic. From elsewhere in the GTA, allow more time; summer weekends can push the trip past two hours. Check current routing before departure.

**Do I need a boating licence to rent at HBW?**
Every person who may drive must bring a valid temporary or permanent Pleasure Craft Operator Card plus photo ID. Passengers do not need one. HBW does not substitute the rental checklist for the card, including for non-Canadian visitors.

**What does a rental cost?**
Rates and rental periods vary by boat and date. Check [harrisboatworks.ca/rentals](https://harrisboatworks.ca/rentals) for the current price before booking.

**Can we fish from rental boats?**
Yes. The 16-ft ProSport boats are designed for fishing and include a fishfinder. Pontoons can fish too, but they are set up more for cruising and comfort. You need a valid Ontario fishing licence if you are fishing. Fees depend on licence type and residency, so check ontario.ca before you come. As a planning reference, Ontario lists a 1-day resident sport fishing licence at $12.21 + HST and a 1-year resident sport fishing licence at $26.57 + HST.

**What if it rains the day of our rental?**
HBW's current policy allows cancellation or rescheduling without penalty for harsh weather, with applied deposits and payments refunded. Review the forecast and current agreement rather than assuming a specific type of rain guarantees either departure or cancellation.

**Are kids and pets allowed on rentals?**
Kids are welcome within the selected boat's posted capacity, and staff fit life jackets at check-in. Ask HBW before booking with a pet because the current terms and suitable boat can vary.

**Where do we eat during a rental day?**
On the boat (bring a picnic) or at lakeshore restaurants. Lakeview Restaurant in Bewdley (west end of Rice Lake, 5 min from HBW) is the local pick. Many anchorages near restaurants.

**Can we swim from the rental boats?**
Check the live equipment listing for the selected boat and ask during orientation. Swim only when the boat is securely anchored in suitable conditions, with the motor off and the driver following the rental agreement.

**Do you offer multi-day rentals?**
Yes. HBW's current policy allows multi-day rentals to remain at a suitable cottage dock or at HBW while they are in the renter's care. Check the live booking terms for current availability and rates.

---

**Booking:** [harrisboatworks.ca/rentals](https://harrisboatworks.ca/rentals)
**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).
`,
    faqs: [
      { question: "How long does it take to drive from Toronto to Rice Lake?", answer: "Roughly 1 hour 45 minutes to Gores Landing from central Toronto in light traffic. From elsewhere in the GTA, allow more time; summer weekends can push the trip past two hours. Check current routing before departure." },
      { question: "Do I need a boating licence to rent at HBW?", answer: "Every person who may drive must bring a valid temporary or permanent Pleasure Craft Operator Card plus photo ID. Passengers do not need one. HBW does not substitute the rental checklist for the card, including for non-Canadian visitors." },
      { question: "What does a rental cost?", answer: "Rates and rental periods vary by boat and date. Check [harrisboatworks.ca/rentals](https://harrisboatworks.ca/rentals) for the current price before booking." },
      { question: "Can we fish from rental boats?", answer: "Yes. The 16-ft ProSport boats are designed for fishing and include a fishfinder. Pontoons can fish too, but they are set up more for cruising and comfort. You need a valid Ontario fishing licence if you are fishing. Fees depend on licence type and residency, so check ontario.ca before you come. As a planning reference, Ontario lists a 1-day resident sport fishing licence at $12.21 + HST and a 1-year resident sport fishing licence at $26.57 + HST." },
      { question: "What if it rains the day of our rental?", answer: "HBW's current policy allows cancellation or rescheduling without penalty for harsh weather, with applied deposits and payments refunded. Review the forecast and current agreement rather than assuming a specific type of rain guarantees either departure or cancellation." },
      { question: "Are kids and pets allowed on rentals?", answer: "Kids are welcome within the selected boat's posted capacity, and staff fit life jackets at check-in. Ask HBW before booking with a pet because the current terms and suitable boat can vary." },
      { question: "Where do we eat during a rental day?", answer: "On the boat (bring a picnic) or at lakeshore restaurants. Lakeview Restaurant in Bewdley (west end of Rice Lake, 5 min from HBW) is the local pick. Many anchorages near restaurants." },
      { question: "Can we swim from the rental boats?", answer: "Check the live equipment listing for the selected boat and ask during orientation. Swim only when the boat is securely anchored in suitable conditions, with the motor off and the driver following the rental agreement." },
      { question: "Do you offer multi-day rentals?", answer: "Yes. HBW's current policy allows multi-day rentals to remain at a suitable cottage dock or at HBW while they are in the renter's care. Check the live booking terms for current availability and rates." },
    ],
  },
  {
    slug: 'mercury-outboard-wont-start-after-sitting',
    title: 'Mercury Won\'t Start After Sitting: Fixes',
    seoTitle: 'Mercury Outboard Won\'t Start After Sitting? Checklist',
    description: 'Mercury outboard will not start after sitting or winter storage? Check battery, fuel, primer bulb, tank vent, kill switch, neutral.',
    image: '/lovable-uploads/hero-mercury-wont-start-after-sitting.png',
    imageAlt: 'Technician carrying fuel and tools to a winterized aluminum boat with a Mercury outboard in an Ontario boat yard.',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-07-24',
    publishDate: '2026-05-11',
    category: 'Service & Troubleshooting',
    readTime: '6 min',
    keywords: ['mercury outboard wont start after sitting', 'mercury outboard stale fuel', 'mercury outboard spring no start', 'outboard wont start after winter storage'],
    content: `**Language:** English 

---

## Quick Answer

A Mercury that ran fine in October and won't start in May didn't randomly break. Something changed over the off-season. In Ontario, the most common causes are: battery discharge and sulfation from cold [winter storage](/blog/boat-storage-kawartha-lakes), stale or contaminated fuel, corroded electrical connections, and fuel system issues from sitting. Start with the battery, then fuel, those two causes account for the majority of spring no-starts. The safety lanyard check comes first because it's fastest.

For engine repairs, we only service Mercury and Mercruiser. Book at [hbw.wiki/service](https://hbw.wiki/service).

---

::diagnostic-flow
heading: Won't start after sitting? Work through these five
eyebrow: Post-storage diagnostic
subhead: Long storage is the #1 cause of spring and post-vacation no-starts. Run these in order.
step1Label: How long has it sat?
step1Question: Has the boat been stored more than 4 weeks without running?
step1Tip: 4 weeks is the rough threshold where fuel starts to break down and batteries lose enough charge to affect starting. Anything over 3 months, treat it as a full spring commission.
step2Label: Battery first
step2Question: Does the battery read 12.4V or higher at rest, with clean terminals?
step2Tip: If the boat was on a charger, you are fine. If it sat in storage without a maintainer, the battery is the #1 suspect. Charge fully before further testing.
step3Label: Fuel age
step3Question: Is the fuel less than 6 months old, and does the primer bulb firm up?
step3Tip: Old E10 phase-separates. If the boat is sitting on last season's fuel, drain and refill before troubleshooting further. A soft primer bulb usually means an air leak or empty line.
step4Label: Carb or EFI clog
step4Question: Did the engine run well before storage?
step4Tip: If yes, and fuel + battery check out, suspect varnish buildup in the carb or injector. Carbureted motors are more sensitive to old fuel than EFI. EFI Mercurys usually start once fresh fuel reaches the injectors.
step5Label: Engine cutoff and spark
step5Question: Is the lanyard attached, and does the engine crank without firing?
step5Tip: Cranking but no fire usually points to spark or fuel delivery. Pull a plug to check spark, confirm fuel reaches the rail. If both are present and it still will not fire, that is our cue to step in.
escalationLabel: Tried everything?
escalationBody: After storage, the most common no-start fixes we see are carb cleaning ($200 to $400), fuel system flush ($150 to $300), and battery replacement ($120 to $250). Book at hbw.wiki/service.
::

---

## Mercury Outboard Won't Start After Sitting: Ontario Boater's Spring Checklist

A motor that sat for five or six months through an Ontario winter and won't start in spring isn't being difficult. It's showing you exactly what sitting did to it. The good news: most of the causes are predictable, diagnosable by an owner, and fixable without a service call, if you work through them in order.

Boats are remarkably good at turning six months of storage into an educational Saturday. This is the checklist that shortens that Saturday considerably.

---

## Before You Start: Safety Checks

Before cranking the motor at all:

- **Kill switch lanyard is attached** to the switch on the dash or tiller handle
- **Motor is in neutral**, most Mercurys won't crank out of gear
- **Battery switch is ON**, easy to forget if it was turned off for storage
- **No fuel leaks**, before starting, smell around the motor and fuel connections

The lanyard is the single most common cause of "won't crank" calls. It takes five seconds to check and it's found to be the problem often enough to always check it first.

---

## Step 1: The Battery, Cold Storage Takes a Toll

This is where most Ontario spring no-starts start and end.

An Ontario winter is genuinely hard on lead-acid marine batteries. The combination of cold temperatures, self-discharge over 5-6 months, and lack of maintenance charging means a battery that was at 100% in October may be at 50% or less in May, and a deeply discharged battery sulfates, which permanently reduces its capacity. It may show voltage on a basic multimeter but collapse under cranking load.

What to check:
- **Resting voltage:** 12.6V = fully charged. 12.4V = acceptable, charge before using. Below 12.2V = seriously compromised.
- **Cranking test:** With a load tester (or by watching voltage during crank): should hold above 9.5-10V while the starter runs. Drop below this and the battery can't do the job.
- **Terminal condition:** White or green deposits on terminals = corrosion = resistance. Clean with a wire brush and baking soda solution, dry, reconnect, then retest.
- **Cable connections:** All tight? A cable that loosened over the winter creates intermittent no-start symptoms.

**If you put the battery on a tender over winter:** You're in much better shape. A properly maintained battery typically comes out of storage near full charge.

**If you didn't:** Charge it fully first. If it won't take a charge or drops quickly under load, replace it. A new battery is a much less expensive fix than the frustration of diagnosing everything else while the battery is marginal.

---

## Step 2: Fuel, Old Gas Is Genuinely a Problem

E10 fuel (standard Ontario pump gas with 10% ethanol) starts degrading in 30-60 days. Fuel that's been sitting in the tank from last October without stabilizer, or with incorrectly applied stabilizer, may be the issue.

Stale ethanol-blend fuel can:
- Develop sour-smelling, lacquer-like oxidation byproducts that gum up injectors and carburettors
- Phase-separate as the ethanol absorbs water, leaving a water-alcohol layer at the tank bottom
- Cause hard start, rough idle, and poor performance even if the motor eventually runs

What to check:
- **Smell the fuel.** Fresh gas smells like fuel. Stale gas smells sour or like nail polish remover. If it smells off, it is.
- **Check the fuel tank for water.** Water is heavier than fuel and sinks. If there's a drain or sump on the tank, check it.
- **Drain the fuel filter/water separator.** Mercury FourStrokes have one inline. Drain the bowl and look for water droplets or discolouration.
- **Check the primer bulb.** Should pump firm in 6-8 squeezes and hold pressure. Stays soft = air leak in the fuel line connections or a deteriorated bulb.
- **Check fuel lines.** Old rubber fuel lines harden and crack. A cracked line lets air in, causing lean running or no-start. Inspect visually and by feel.
- **Tank vent open?** An unvented tank creates vacuum as fuel draws out. The motor starves.

**If the fuel is suspect:** The cleanest fix is to drain the tank and refill with fresh fuel. On smaller tanks, this is easy. On larger tanks, a quality fuel stabilizer added to the old fuel and running the motor through a flush cycle can help, but fresh fuel is better.

We sell ethanol-free fuel on-site at HBW. For a motor going into storage, finishing the season with ethanol-free is one of the best things you can do for next year's start.

---

## Step 3: Spark Plugs and Ignition

If battery and fuel are confirmed good, spark is next.

After sitting, spark plugs can be fouled (oil or carbon deposits from the last season), gapped incorrectly, or just at end of service life. A plug that looks physically fine can still have an internal failure.

- Remove the plugs and inspect for fouling (oily black = oil/rich fouling; white/chalky = lean/overheating; normal = light tan to grey)
- Confirm the electrode gap matches your motor's spec (in the owner's manual)
- Replace any that look doubtful

**Flooding:** If you cranked the motor multiple times trying to start it before reading this, the cylinders may be flooded with fuel. Remove the plugs, crank briefly to clear the cylinders, let it sit 15-20 minutes with plugs out, then reinstall fresh plugs and try again.

---

## Step 4: Check for Display Messages or Fault Codes

If your boat has a SmartCraft display, VesselView, or any Mercury gauge display, check it before and after attempting to start. Mercury's ECM logs fault codes and displays active alarms.

Take a photo of any message displayed. Include this when booking service, it saves diagnostic time.

---

## The Winterization Connection

If the motor wasn't properly winterized last fall, some of the causes above are more likely and some additional ones are possible:

- **Unstabilized fuel** in the system gummed up injectors or carburettor passages
- **The wrong internal-protection procedure** can leave corrosion or fuel-system storage problems
- **Cooling system water not fully drained**, if it froze, there may be physical damage
- **Battery not tendered or removed**, compromised battery from winter discharge

If you're not sure the motor was properly winterized, tell the dealer. It's relevant to the diagnostic.

---

## When to Stop and Book Service

DIY troubleshooting makes sense when you can identify and fix the problem. It stops making sense when:
- You've worked through all the above and still can't identify the cause
- The motor cranks but won't run, or runs briefly and dies
- There are active fault codes you can't interpret
- You suspect a fuel system issue beyond stale gas (carburettor or injector blockage that needs cleaning)
- The motor makes unusual noises during cranking

For engine repairs, we only service Mercury and Mercruiser.

Book at [hbw.wiki/service](https://hbw.wiki/service). Our shop handles a consistent volume of spring diagnostic work every May, the sooner you book, the sooner you're on the water.

---

## Frequently Asked Questions

**How long can a Mercury sit before fuel becomes a problem?** 
With E10 pump gas and no stabilizer, 30-60 days is where degradation begins to cause problems. Over an Ontario winter (5-6 months), unstabilized fuel is almost certainly degraded. With proper stabilizer applied and circulated through the full system, protection extends significantly, but fuel quality always degrades over time.

**I added stabilizer last fall but didn't run the motor afterward. Did it help?** 
Partially. If the stabilizer was added to the tank but not circulated through the injectors or carburettor by running the motor, those components may still have seen degraded fuel at the end of the season. Running the motor for 10+ minutes after adding stabilizer is necessary for full protection.

**The motor starts but dies as soon as I put it in gear. What does that mean?** 
Often a fuel delivery issue, the motor can idle on whatever fuel is in the system but can't maintain flow under load. Could also be a clutch or shift linkage issue. This is a dealer diagnostic.

**Should I be concerned about damage from the cold if the motor wasn't properly stored?** 
If water was left in the cooling system and temperatures were cold enough for it to freeze, cracking is possible. Inspect for cracked housings before running, look at the lower unit and powerhead for any hairline cracks. If in doubt, have a dealer inspect before running.

**My motor ran fine briefly and then died. Is that a fuel issue?** 
Often yes, the motor started on fuel already in the system but couldn't maintain supply. A partially clogged filter, a weak primer bulb, or a tank that's struggling to deliver fuel under demand. Start with the primer bulb and fuel filter.

---

## Internal Links

- [Mercury Outboard Won't Start Troubleshooting](/blog/mercury-outboard-wont-start-troubleshooting)
- [Mercury Outboard Won't Start, Ontario Diagnostic Flow](/blog/mercury-outboard-wont-start-troubleshooting)
- [DIY Mercury Outboard Winterization Guide](/blog/diy-mercury-outboard-winterization-guide)

---

## CTA

**Can't find the problem?** 
Book a spring diagnostic at [hbw.wiki/service](https://hbw.wiki/service). Harris Boat Works, Gores Landing, Mercury Premier dealer. Mercury dealer since 1965, family marina on Rice Lake since 1947. For engine repairs, we only service Mercury and Mercruiser.

Phone: 905-342-2153

`,
    faqs: [
      { question: 'Why will my Mercury outboard not start after winter?', answer: 'Common causes include weak battery, loose/corroded terminals, stale fuel, closed tank vent, primer bulb issues, kill switch, neutral safety switch, or fuel system problems.' },
      { question: 'Can old gas stop an outboard from starting?', answer: 'Yes. Stale or contaminated fuel can cause hard starting, no-start, rough running, or stalling after storage.' },
      { question: 'Should I keep cranking it?', answer: 'No. Repeated cranking can drain the battery and make diagnosis harder. Check basics, then stop and book service if it does not start.' },
    ],
  },
  {
    slug: 'mercury-dealer-markham-ontario-hbw',
    title: 'Mercury Dealer Markham Ontario HBW',
    seoTitle: 'Mercury Dealer for Markham, Rice Lake Repower',
    description: 'Mercury Premier dealer near Markham: Harris Boat Works on Rice Lake, 70 minutes north. Repower, sales, service and parts for the Markham area.',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
    imageAlt: 'Aerial view of Harris Boat Works and its Rice Lake marina in Gores Landing, Ontario',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-07-24',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '5 min',
    keywords: ['mercury dealer markham', 'mercury repower markham', 'mercury outboard markham ontario', 'boat motor dealer markham', 'harris boat works markham customers'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 70 minutes north of Markham via Highway 404 and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. Installed pricing is available in minutes at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Markham boaters drive to Harris Boat Works: about 70 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-markham-worth-the-drive.png)

# Why Markham Customers Make the Drive to Rice Lake

Markham has Mercury dealers closer to home. We know that. We're not pretending distance doesn't exist.

So the honest question is: what would make a 70-minute drive worth it for you?

Here's what Markham customers actually tell us when they show up.

## The Call-For-Quote Game Is Exhausting

You've been there. You find a motor online, you like what you see, and then there's no price, just a form or a phone number. You call. You leave your number. Someone calls back, asks what boat you have, what you're using it for, and eventually offers to "work something up." Three calls later, you still don't have a number.

That's not an accident. The call-for-quote system exists to put a salesperson in the conversation before you've decided what you want. Once you're talking, they can shape what you're considering.

We don't do that. Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows you real installed pricing in Canadian dollars in about three minutes. No account required, no callback, no negotiation opener. You see the motor, the installation, the rigging, what it actually costs to have a Mercury running on your boat. If you would rather skim [current Mercury prices in CAD](/pricing-reference) before building anything, the full motor price list is published too.

If you build a quote and decide to buy somewhere else, that's fine. The point is that you made an informed decision, not one that was managed by a sales process.

## What Mercury Premier Actually Means

Mercury has a dealer tier program. Premier is the top level. It's not a marketing badge, it reflects depth of inventory, technical training, warranty authorization, and parts access.

In practical terms: if you have a warranty issue or a complex repower with an unusual rigging setup, a Premier dealer has faster resolution paths than a lower-tier dealer. There aren't many Premier dealers in Ontario. That matters more after the sale than it does at the time of purchase.

## Why the Reputation Matters

This shop runs on repeat customers and referrals. The recommendation has to make sense after the invoice is paid and the boat is back on the water.

We're not running a sales floor with monthly quotas. We're running a family marina where the next customer is often the neighbour of the last one. The conversation is different.

## Markham Has a Large Boating Community, You Probably Know the Lake

Markham sits at the edge of cottage country. A lot of Markham residents have connections to Rice Lake, Lake Scugog, or the Trent-Severn system. If you're already boating up here, we might already be your closest real dealer. And if you're buying a motor for a boat that lives near us, having a dealer nearby is a practical advantage, not just a preference.

---

## What Harris Boat Works Handles for Markham Customers

**Mercury outboard sales**
Full Mercury lineup: 2.5 HP kickers through 600 HP Verado. FourStroke, Pro XS, Verado, SeaPro. Verado models are special order rather than stocked inventory; we quote them with current factory lead times. We'll talk through what actually makes sense for your hull and how you use it, not push you toward the highest margin option.

**Repower service**
Most of what we do is repower, replacing an older motor on a hull you want to keep. We handle the full job: motor, rigging, controls, throttle and shift cables, prop selection, and sea trial. A repower done right means the new motor performs the way Mercury designed it to, not just "runs."

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. We don't run indoor storage. If you need climate-controlled indoor, that's not us.

**Installed pricing online**
Build your quote at [mercuryrepower.ca](https://www.mercuryrepower.ca), real CAD pricing, no games.

---

## Getting to Harris Boat Works from Markham

**Route:** Highway 404 north to Highway 115 east, then County Road 28 north into Gores Landing.

**Approximate drive time:** Around 70 minutes in normal traffic. The last 30 minutes is rural, county roads through farmland and then cottage country. Most Markham customers say the shift from 404 to cottage roads is part of the appeal.

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0  
**Phone:** 905-342-2153  
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)  
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  

---

## How to Make the Drive Worth It

Do the work before you leave Markham. You can settle 90% of the decision from your kitchen:

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Takes about three minutes. You'll see real installed pricing for the motor and rigging options you're considering.
2. **Think about the rigging conversation.** Single motor vs. twin, tiller vs. remote, what throttle and shift setup you want. These are things we can talk through before you arrive.
3. **Text or call us** with specific questions: 905-342-2153. If you've already built a quote, reference it, we can pull it up.
4. **Drive up when you're decided**, not before. We'd rather have an informed customer than a browsing visit that doesn't go anywhere for either of us.

---

## A Note for Chinese-Canadian Customers in Markham

Markham has one of the largest Chinese-Canadian communities in the country, and we have many customers from that community. If you'd prefer to start in Mandarin or Traditional Chinese, reach out directly, we can accommodate. Some of our supporting materials are available in Chinese as well.

---

## Frequently Asked Questions, Markham

**Do you need to make an appointment to come in?**
For service and repowers, yes, submit a request at [hbw.wiki/service](https://hbw.wiki/service) before showing up. For a motor purchase conversation, call ahead so we know you're coming and we can give you the full attention the trip deserves.

**Can I get a price without calling?**
Yes. That's the whole point of the quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca). Real installed pricing, no phone call required.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. If you have a Yamaha, Honda, or Suzuki motor, we're not your shop for service, but if you're considering a repower to Mercury, that's a conversation we can have.

**What's included in a repower?**
The full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, and sea trial. Not just the motor dropped on the transom.

**Do you have winter storage for boats coming from Markham?**
Yes. Outdoor storage with shrinkwrap. No indoor. Some Markham customers store with us and make one trip in fall and one in spring.

**What if I'm not sure whether to repower or buy new?**
That's a real conversation. Build a quote for the repower at [mercuryrepower.ca](https://www.mercuryrepower.ca), then call us. We'll tell you honestly if repowering makes sense for your hull and what you'd spend on a comparable new setup.

---

## The HBW Promise

No quote fog machine. No "call us and we'll work something up." No bait pricing.

You see the installed price. We talk through the rigging. We do the job properly. You get back on the water.

That's the model. It still works.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)  
**Call or text:** 905-342-2153  
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer.

---

## Where Markham Boaters Launch and Why HBW Serves the GTA Chinese-Canadian Community

Markham is inland with no nearby public launch, local boaters trailer either north to **Lake Simcoe** (about 40 minutes via Highway 404) or east to **Rice Lake** (about 70 minutes via 404 → 407 east → 115 north). Lake Simcoe is the natural default for fishing and recreation; Rice Lake offers quieter water and an easier launch scene.

The drive to Rice Lake is 70 minutes via Highway 404 → 407 east → Highway 115 north. Skipping the 407 to avoid tolls adds 15-20 minutes via the 401. Midweek mornings are calmest.

Markham repower customers often:

- **Read our [Mandarin-language guides](https://www.mercuryrepower.ca/blog/zh)** for technical detail before deciding. We have a growing 中文 collection covering pricing, winterization, and repower decisions for GTA Chinese-Canadian boaters.
- **Justify the drive for Mercury Premier-level service.** Closer dealers often lack the rigging depth for a clean repower install.
- **Trust transparent CAD pricing.** Our online quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) works without a phone call, you can build the quote in any language, in your own time, before deciding to make the trip.

Markham customers often combine their trip with a service drop, see our [drive-in service walkthrough](/blog/toronto-to-rice-lake-drive-in-process).

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).
`,
    faqs: [
      { question: 'Is there a Mercury dealer in Markham?', answer: "There are Mercury dealers in the broader GTA, but Harris Boat Works on Rice Lake is the closest Premier-tier Mercury dealer to Markham - about 70 minutes north. Premier is the top tier in Mercury's dealer program." },
      { question: 'How far is Harris Boat Works from Markham?', answer: 'Approximately 70 minutes via Highway 404 north and County Road 28. Distance is about 110 km depending on your part of Markham.' },
      { question: 'Why drive to Rice Lake instead of a closer GTA dealer?', answer: 'Markham customers tell us they make the drive for three reasons: transparent CAD pricing through our online quote builder, Mercury Premier-tier technical depth, and a no-hard-sell family-marina culture.' },
      { question: 'Does HBW serve Unionville and Stouffville too?', answer: 'Yes. We serve a broad Markham-area customer base including Unionville, Stouffville, and the surrounding York Region communities.' },
    ],
  },
  {
    slug: 'mercury-dealer-richmond-hill-ontario-hbw',
    title: 'Mercury Dealer Richmond Hill HBW',
    seoTitle: 'Mercury Dealer for Richmond Hill, Rice Lake Repower',
    description: 'Mercury dealer near Richmond Hill: Harris Boat Works on Rice Lake, 75 minutes north. Repower, sales, parts, winter storage for Richmond Hill, Aurora.',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-mercury-75-90-115-official-freshwater-2026-07.webp',
    imageAlt: 'Official Mercury freshwater photography showing 75, 90 and 115 HP FourStroke outboards',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-07-24',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '5 min',
    keywords: ['mercury dealer richmond hill', 'mercury repower richmond hill', 'mercury outboard richmond hill ontario', 'boat motor dealer aurora newmarket', 'harris boat works richmond hill customers'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 75 minutes north of Richmond Hill via Highway 404 and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Richmond Hill boaters drive to Harris Boat Works: about 75 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-richmond-hill-worth-the-drive.png)

# Why Richmond Hill Customers Drive to Rice Lake for Their Mercury

There are Mercury dealers closer to Richmond Hill. We know the map. We're not trying to pretend otherwise.

What we're offering is a different kind of buying experience, and [whether it's worth a 75-minute drive](/blog/mercury-outboard-dealer-toronto-why-drive-to-hbw) depends on what's been frustrating you about the closer options.

## The Problem With "Call For a Quote"

If you've tried to price a Mercury outboard lately, you've likely hit the wall: a dealer website that lists motors without prices, a form that promises a callback, or a phone number that leads to a conversation where someone asks a dozen questions before telling you what anything costs.

This isn't incompetence. It's a sales strategy. [Getting you on the phone before you have a price](/blog/why-mercury-dealers-hide-prices-online) lets the dealer control the comparison. Once you're talking, the assumption is that personal rapport and anchoring will do the work that transparency would short-circuit.

We just put the price online. Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows real installed pricing in Canadian dollars, motor, rigging, and installation, before you've talked to anyone. You can compare, think it over, and call us when you've decided what you want. For [Mercury outboard pricing, every model](/pricing-reference) on one page, see our price reference.

If you use that and then buy from a closer dealer, fine. You'll buy with your eyes open.

## Why Premier Status Matters More Than Location

Richmond Hill has Mercury dealers. Not all of them are Premier. [Mercury's Premier tier is the top level of their dealer program](/blog/best-mercury-dealer-ontario-hbw-difference), it reflects parts depth, technical training, and warranty authorization. Lower-tier dealers can sell Mercury motors. They can't always support the harder jobs as quickly.

On a straightforward motor purchase, tier may not matter much. On a complex repower, unusual hull, twin-engine setup, non-standard rigging, or warranty diagnosis on a new motor, technical depth starts to matter. Premier status does not change the warranty terms or guarantee priority approval; HBW's practical advantage is Mercury-specific training, tooling, parts depth, and familiarity with complex installations.

## Third-Generation Means Something Different

We've been at this since 1947. Jay Harris's grandfather started the business. Jay's father ran it. Jay runs it now.

When you've been on the same lake for three generations, your reputation isn't something you manage, it's something you inherited. The neighbours of your customers are your potential customers. That changes what it means to cut a corner or oversell someone.

We're a small shop. We're not anonymous. We'd rather do right by someone and have them come back in five years than close a sale and never hear from them again.

## Richmond Hill Buyers Tend to Know What They Want

Richmond Hill has a sophisticated boating community, a lot of buyers who've done the research, know the motor families, and are price-sensitive enough to know when they're being managed. Our transparent pricing model tends to appeal to exactly that buyer. You've already decided roughly what you want. You just want a shop that'll give you a straight number and do the job properly.

---

## What Harris Boat Works Handles for Richmond Hill Customers

**Mercury outboard sales**
Full lineup from 2.5 HP through 600 HP. Our standard repower lineup is FourStroke and Pro XS. Verado is available on special order, and SeaPro is a commercial-duty option we bring in to order. We'll have an honest conversation about what makes sense for your specific hull, how you use it, and what you're willing to spend, not just push the highest-margin option.

**Repower service**
[We replace old motors on hulls you want to keep](/blog/mercury-repower-cost-ontario-2026-cad). Full job: motor, rigging, controls, throttle and shift, prop selection, installation, sea trial. The rigging conversation matters as much as the motor choice, a motor improperly rigged to a hull will underperform and can shorten the motor's life.

**Mercury parts and service**
Premier-tier warranty authorization and parts access. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. No indoor option. If climate-controlled indoor storage is essential, that's not us.

**Transparent installed pricing**
[mercuryrepower.ca](https://www.mercuryrepower.ca), real CAD pricing before you make any commitments.

---

## Getting to Harris Boat Works from Richmond Hill

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Route:** Highway 404 north to Highway 115 east, then exit to County Road 28 north into Gores Landing.

**Approximate drive time:** Around 75 minutes in normal traffic. The route on 404 north is familiar to any Richmond Hill resident who's driven to cottage country. The last 30 minutes is rural, county roads, farmland, and then Rice Lake in the distance.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0  
**Phone:** 905-342-2153  
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)  
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  

---

## How to Make the Drive Efficient

Most Richmond Hill customers who drive up have done the homework first:

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Three minutes. Real numbers.
2. **Think through the rigging.** Tiller or remote? What controls? Any unusual hull considerations? The more specific you can be, the more useful the conversation when you arrive.
3. **Call or text ahead:** 905-342-2153. Mention you've built a quote and are planning to drive up, we'll make sure someone has time for you.
4. **Drive up when you're decided.** 75 minutes each way is a real investment. Come when you're ready to close the conversation, not to browse.

---

## Frequently Asked Questions, Richmond Hill

**Is there a way to get pricing without coming in or calling?**
Yes, that's the whole point of [mercuryrepower.ca](https://www.mercuryrepower.ca). Real installed pricing, no form submission, no callback required.

**What motors do you carry?**
Full Mercury lineup: 2.5 HP through 600 HP. Our standard repower lineup is FourStroke and Pro XS. Verado is available on special order, and SeaPro is a commercial-duty option we bring in to order, whatever makes sense for your application.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. We won't touch a Yamaha, Honda, or Suzuki for service work.

**What does a repower include?**
Full installation: motor, rigging, controls, throttle and shift cables, prop selection, sea trial. We don't just bolt a motor on and call it done.

**Can I store my boat with you even if I'm buying the motor elsewhere?**
Storage is available for existing HBW service customers. If you're a first-time customer, start with a service request at [hbw.wiki/service](https://hbw.wiki/service) so we can understand what you need.

**What if the closer dealers have the same motor in stock?**
Genuine answer: if a local dealer has it in stock, is a Premier dealer, and will give you an honest installed price, go there. We're not going to tell you we're worth driving 75 minutes to when the answer is genuinely that straightforward. Call us if you're not sure.

---

## The HBW Promise

Straight pricing. Proper rigging conversation. No fog machine.

You see the number before you leave Richmond Hill. You come up when you're decided. We do the job right. You get back on the water knowing the motor was installed the way Mercury intended it to be installed.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)  
**Call or text:** 905-342-2153  
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer. Mercury dealer since 1965, family marina on Rice Lake since 1947.

---

## Where Richmond Hill Boaters Launch and Why HBW Competes on Mercury Premier Depth

Richmond Hill is inland, with no major public launch in the city, **Lake Wilcox** is small and urban with limited recreational boating. Serious Richmond Hill boaters trailer either north to **Lake Simcoe** (about 50 minutes via Highway 404) or east to **Rice Lake** (about 75 minutes via 404/407/115). Lake Simcoe is the default for most local boaters; many have cottage relationships there.

The drive to Rice Lake is 75 minutes via Highway 404 → 407 east → Highway 115 north. Avoiding the 407 tolls via the 401 adds 15-20 minutes but saves money, most customers run the toll route for service trips and skip it for casual visits.

Why Richmond Hill boaters drive to HBW vs Simcoe-area dealers:

- **Mercury Premier-level expertise.** For repower work, dealer depth matters more than 20 minutes of drive time. HBW competes on rigging quality, not proximity.
- **Transparent CAD pricing.** Build the quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) before deciding, no phone calls, no negotiation games, real dealer pricing.
- **One-stop service + storage.** Many Richmond Hill customers store at HBW over winter, get spring commissioning, and trailer back to Simcoe or Rice Lake for the season.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'Is there a Mercury Premier dealer near Richmond Hill?', answer: 'Harris Boat Works on Rice Lake is the closest Premier-tier Mercury dealer to Richmond Hill - about 75 minutes north via Highway 404 and County Road 28.' },
      { question: 'How far is Harris Boat Works from Richmond Hill?', answer: 'Approximately 75 minutes / 115 km depending on which part of Richmond Hill you start from.' },
      { question: 'Does HBW also serve Aurora and Newmarket?', answer: 'Yes. Aurora and Newmarket are slightly closer than Richmond Hill - typically 60 to 70 minute drives. We have a regular customer base across all three communities.' },
      { question: 'Can I get a Mercury quote without driving up first?', answer: 'Yes. Build a quote at mercuryrepower.ca/quote in about three minutes. Real CAD pricing, no phone call required.' },
    ],
  },
  {
    slug: 'mercury-dealer-mississauga-ontario-hbw',
    title: 'Mercury Dealer Mississauga HBW',
    seoTitle: 'Mercury Repower Cost in Mississauga',
    description: 'What does a Mercury repower cost in Mississauga? See real 2026 motor prices from Harris Boat Works, a Premier dealer on Rice Lake.',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
    imageAlt: 'Aerial view of Harris Boat Works and its Rice Lake marina in Gores Landing, Ontario',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-07-24',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '5 min',
    keywords: ['mercury dealer mississauga', 'mercury repower mississauga', 'mercury outboard mississauga ontario', 'boat motor dealer mississauga', 'harris boat works mississauga customers'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 90 minutes northeast of Mississauga via Highway 401 east and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Mississauga boaters drive to Harris Boat Works: about 90 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-mississauga-worth-the-drive.png)

# Mercury Dealer for Mississauga: When the Drive Is the Point

Mississauga is not a short drive from Rice Lake. Let's be direct about that. Ninety minutes northeast on the 401 is a real commitment, and we'd rather acknowledge it upfront than pretend you wouldn't notice.

So here's the honest case for why some Mississauga customers make it anyway.

## What You're Usually Dealing With Closer to Home

Mississauga has marine dealers. Some carry Mercury. The experience at a lot of GTA-area dealers tends to follow a recognizable pattern: you find a motor online, you can't find the price, you fill out a contact form, someone calls you back in a day or two, the conversation starts with "what are you planning to use it for?" and eventually arrives at a number that may or may not include installation.

By this point you've spent an hour or two on the phone and still don't know what the motor costs to actually put on your boat.

Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows you installed pricing, motor plus rigging, in Canadian dollars, in about three minutes. No account, no callback, no opener for a negotiation. The number you see is real. To see [what a Mercury outboard costs](/pricing-reference) without building a quote, check our published price reference.

If you price it here and decide a local dealer is the better call, that's fine. You're making an informed comparison now, not a managed one.

## The Repower Conversation Is Different Here

Most of what we do is repower, replacing an aging motor on a hull someone wants to keep running. That's not a simple transaction. It's a conversation about your hull, how you use the boat, what rigging setup makes sense, what prop works for your load, and if you're better off repowering or putting that money toward a new setup.

We have that conversation honestly. Our repower decision guide on mercuryrepower.ca explicitly covers when a repower doesn't make sense. We'd rather give someone a straight answer than book a job we shouldn't have taken.

A Mississauga customer who's seriously considering a repower and can't get a straight answer closer to home, that's the customer who tends to make the drive.

## Premier Tier on the Harder Jobs

Mercury Premier is the top tier in their dealer program. It means deeper parts inventory, higher levels of technical training, and full warranty authorization. For a standard motor sale, tier may not matter much. For a complex repower, a warranty issue, or a technical diagnostic on an unusual setup, it matters. There aren't many Premier dealers in Ontario, and most of them aren't in the GTA.

## A Business Built on Repeat, Not Volume

We're not a high-volume sales floor. We're a family marina where the next customer is often a referral from the last one. That dynamic makes us careful. We're not trying to maximize what we extract from a single transaction. We're trying to be the shop someone calls first for the next twenty years.

---

## What Harris Boat Works Handles for Mississauga Customers

**Mercury outboard sales**
2.5 HP through 600 HP. Our standard repower lineup is FourStroke and Pro XS. Verado is available on special order, and SeaPro is a commercial-duty option we bring in to order. We'll have an honest conversation about what makes sense for your boat and use case.

**Repower service**
Full repower: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. The rigging isn't an afterthought, it's half the job.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. No indoor. If you store your boat in Mississauga and only use it on inland lakes, storage here may not make sense unless you're planning an extended service visit.

**Installed pricing online**
[mercuryrepower.ca](https://www.mercuryrepower.ca), the number you see is real.

---

## Getting to Harris Boat Works from Mississauga

**Route:** Highway 401 east through Toronto, then Highway 115 east, then County Road 28 north into Gores Landing.

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Approximate drive time:** Around 90 minutes outside rush hour. On a weekday morning or Saturday before 9 a.m., the 401 through Toronto can be manageable. Midday Saturday or Sunday afternoon, plan for more. The last 30 minutes from 115 to Gores Landing is rural, genuinely pleasant drive once you're off the highway.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0  
**Phone:** 905-342-2153  
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)  
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  

---

## Making the Drive Worth It

90 minutes each way is a full morning. Here's how Mississauga customers make it count:

1. **Build your quote first** at [mercuryrepower.ca](https://www.mercuryrepower.ca). See the real installed price. Know what you're comparing before you commit to the drive.
2. **Get specific about the rigging.** What throttle and shift setup? Any electronics to integrate? Single or twin? Knowing what questions you have makes the in-person time much more efficient.
3. **Call us ahead of time:** 905-342-2153. If you're driving 90 minutes, we want to make sure we have time for you.
4. **Come up early on a Saturday** or mid-week. Avoid the 401 in both directions during peak hours if you can help it.
5. **Drive up when you've decided.** Not to browse, to confirm. We respect the time that trip represents.

---

## Frequently Asked Questions, Mississauga

**Is 90 minutes actually worth the drive?**
For a quick question, probably not, call or text us instead. For a serious repower or a motor purchase where you want to talk through rigging, installation, and the full job: yes. Come when you're ready to make a decision.

**Can I see pricing without calling?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca) has real installed pricing. No form, no callback, no opener.

**Do you service boats at our location or do we have to come to you?**
We're a fixed shop. The boat comes to us. For major work like repowers, customers typically haul or trailer the boat up to Gores Landing.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. Yamaha, Honda, and Suzuki are outside our scope.

**What if I just need a part?**
Parts can be ordered through [marinecatalogue.ca](https://www.marinecatalogue.ca) or by calling us. You don't need to drive up for a part.

**My boat is on Lake Ontario / Niagara. Does a repower still make sense?**
Totally depends on the motor and hull. Call us: 905-342-2153. We'll give you a straight answer.

---

## The HBW Promise

We're not going to make you spend an afternoon on the phone to find out what a Mercury motor costs. The price is at [mercuryrepower.ca](https://www.mercuryrepower.ca).

We're not going to tell you to repower when you shouldn't. If the hull isn't worth it, we'll say so.

We're going to rig the motor the right way, not the fast way.

That's the deal.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)  
**Call or text:** 905-342-2153  
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer.

---

## Where Mississauga Boaters Launch and Why HBW Handles Their Repowers

Mississauga sits on Lake Ontario's west shore. The main local hub is **Port Credit Harbour Marina**, the largest in the city, with public access and an active recreational scene. Smaller launches are scattered along Lakeshore Road, and the **Credit River mouth** is a popular smaller-boat area. The Lakefront Promenade runs from Port Credit east into Etobicoke.

The drive to Rice Lake is 90 minutes via the 401 east and Highway 115 north, basically a half-day round-trip. Mississauga's 401 access is consistently slow east of the 427, even weekday mornings build. Plan for the extra time or stage your trip outside rush periods.

Why Mississauga boaters trailer to HBW:

- **Annual repower trips.** Many Mississauga customers make the drive once for the repower itself, then run service work closer to home between visits.
- **Drop-and-pick logistics.** Trailer up midweek, leave the boat for service or storage, pick up when ready.
- **Mercury Premier depth.** A clean 115-150 HP repower install needs the rigging hours we put in daily, not every closer dealer has that bench.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'Is there a Mercury dealer near Mississauga?', answer: 'Mississauga has several Mercury dealers in the broader GTA. Harris Boat Works on Rice Lake is the closest Premier-tier dealer for west-GTA customers willing to make the 90-minute drive northeast.' },
      { question: 'How long is the drive from Mississauga to Harris Boat Works?', answer: 'About 90 minutes outside rush hour, longer in traffic. The route is Highway 401 east to Highway 115 east, then County Road 28 north into Gores Landing.' },
      { question: 'Why drive that far for a Mercury dealer?', answer: 'Mississauga customers cite three reasons: transparent online CAD pricing (no call-for-quote), Mercury Premier-tier technical depth, and a family-marina no-pressure conversation instead of the high-volume GTA dealer experience.' },
      { question: 'Can I get a quote and place a Mercury order without visiting?', answer: 'Yes. Build a quote at mercuryrepower.ca/quote and confirm by phone or text. Service is drop-off at Gores Landing (we do not pick up, deliver, or arrange hauling), so you trailer the boat to us for install and sea-trial, then trailer it home.' },
    ],
  },

  {
    slug: 'mercury-dealer-vaughan-ontario-hbw',
    title: 'Mercury Dealer Vaughan Ontario HBW',
    seoTitle: 'Mercury Dealer for Vaughan, Repower from Rice Lake',
    description: 'Mercury Premier dealer near Vaughan: Harris Boat Works on Rice Lake, 80 minutes north. Repower, sales, parts, winter storage for Vaughan, Woodbridge, Maple area.',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-d/hero-mercury-vaughan-hbw-service-real-2026-07.webp',
    imageAlt: 'Exposed Mercury outboard powerhead during a real Harris Boat Works repower installation',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-07-24',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer vaughan', 'mercury repower vaughan', 'mercury outboard vaughan ontario', 'boat motor dealer vaughan woodbridge maple'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 80 minutes north of Vaughan via Highway 400 and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Vaughan boaters drive to Harris Boat Works: about 80 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-vaughan-worth-the-drive.png)

# Mercury Dealer for Vaughan: Why the Drive North Makes Sense

Vaughan is deep GTA. Woodbridge, Maple, Thornhill, Concord, the whole corridor is close to Highway 400, which means Barrie is easy but Rice Lake isn't. About 80 minutes when traffic cooperates.

We're not going to pretend that's nothing. Here's why some Vaughan customers make it anyway.

## You Can Already Price This Before You Leave

The number one reason Vaughan customers tell us they drove up: they built a quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) and the pricing was cleaner than anything they'd gotten closer to home.

Our quote builder shows installed pricing, motor, rigging, installation, in Canadian dollars, in about three minutes. Not a "starting at" figure. Not a range. A number you can actually compare against. To [see Mercury prices before you drive out](/pricing-reference), our full motor price list is published in CAD.

For anyone who's played the call-for-quote game with a GTA dealer, having a real price visible before any conversation starts is a different experience. You come in with the information, not looking for it.

## Vaughan Buyers Who Boat in the Kawarthas

A lot of Vaughan residents with boats aren't boating in Lake Ontario, they're on Rice Lake, Lake Scugog, Simcoe, or the Trent-Severn. If your boat is at a marina up here already, we may genuinely be your closest real dealer. The drive from Vaughan to Gores Landing and the drive from Vaughan to Lake Simcoe or Rice Lake are not far off from each other.

If that's your situation, it's worth knowing we're here.

## Premier Dealer, Third Generation

Mercury Premier is the top tier in Mercury's dealer program, parts depth, warranty authorization, technical training. Harris Boat Works has been on Rice Lake since 1947, third generation. The business model here isn't about closing as many transactions as possible. It's about being the shop someone comes back to.

That means the conversation about which motor to buy, and whether to repower at all, is honest. If repowering doesn't make sense for your hull, we'll say so.

---

## What Harris Boat Works Handles for Vaughan Customers

**Mercury outboard sales**
2.5 HP through 600 HP. Our standard repower lineup is FourStroke and Pro XS. Verado is available on special order, and SeaPro is a commercial-duty option we bring in to order. We'll have a straight conversation about what works for your specific hull and use case.

**Repower service**
Full repower: motor, rigging, controls, throttle and shift, prop selection, installation, sea trial. Rigging matters as much as the motor, a poorly rigged motor underperforms and can cause problems down the road.

**Mercury parts and service**
Premier-tier parts and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
[Outdoor with shrinkwrap](/blog/winter-storage-near-toronto-hbw). No indoor. If your boat is already in the Kawarthas area, this may make more sense than you'd think.

**Transparent installed pricing**
[mercuryrepower.ca](https://www.mercuryrepower.ca), real numbers before any conversation starts.

---

## Getting to Harris Boat Works from Vaughan

**Route:** Highway 400 south to connect to 401 east (or take 400 to 407 east to 115), then Highway 115 east, then County Road 28 north into Gores Landing. The 407 to 115 route avoids the 401 through Toronto and may be faster depending on time of day.

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Approximate drive time:** Around 80 minutes in normal traffic.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0  
**Phone:** 905-342-2153  
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)  
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  

---

## Before You Make the Drive

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Know the real installed price.
2. **Think about the rigging.** Tiller or remote, single or twin, what controls and electronics you're running. The more you've thought through, the more useful the visit.
3. **Call or text us ahead of time:** 905-342-2153. Let us know you're coming, we'll have someone ready for the conversation.
4. **Come up when you're decided.** 80 minutes each way is a half-day. Make it count.

---

## Frequently Asked Questions, Vaughan

**Is there a way to get a real price without driving up or calling?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca), installed pricing in about three minutes. No login, no callback.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. We can't help with Yamaha, Honda, or Suzuki service.

**My boat is at a marina near Rice Lake already. Can you do service there?**
We're a fixed shop, work happens here. The boat needs to come to us. If you're already storing near Rice Lake, that's actually a convenient arrangement.

**What if I want to repower but I'm not sure it's worth it?**
Build a quote for the repower at [mercuryrepower.ca](https://www.mercuryrepower.ca), then call us. We'll have an honest conversation about whether it pencils out for your hull and situation.

**What's the best time to drive up from Vaughan?**
Early Saturday morning tends to work well, traffic on 400 south and then east is lighter before 9 a.m., and you can be here before noon. Weekday afternoons can be rough on the way back.

---

## The HBW Promise

Price is on the site. Rigging conversation happens before we order. Job gets done properly. You don't spend weeks chasing callbacks.

That's the deal.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)  
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)  
**Call or text:** 905-342-2153  
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer. Mercury dealer since 1965, family marina on Rice Lake since 1947.

---

## Where Vaughan Boaters Launch and Why HBW Handles Their Repowers

Vaughan is inland with no nearby public launch. Local boaters trailer either north to **Lake Simcoe** via Highway 400 (Innisfil, Keswick) or east to **Rice Lake** via 407/115. Concord, Maple, and Woodbridge boaters tend to default to Simcoe; some venture east for the Kawarthas.

The drive to Rice Lake is 80 minutes via Highway 400 south → 401 east → Highway 115 north, or via the 407 to skip city traffic. The 400 northbound on Friday afternoons in summer is brutal; reverse it for midweek HBW trips and you get the calmest 80 minutes you'll spend that week.

Why [Vaughan boaters drive to HBW](/blog/mercury-repower-gta-toronto-destination) for repower:

- **Mercury Premier-level service.** Closer Simcoe-area dealers handle the volume but not always the rigging depth. For [a $15,000-$25,000 repower](/blog/mercury-repower-cost-ontario-2026-cad), the drive is justified.
- **Once-a-year trip works.** Trailer up for the repower itself, then run service work closer to home.
- **Transparent CAD pricing.** Build the quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) before the trip, the configurator works without a phone call and shows real pricing.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Vaughan?', answer: 'About 80 minutes via Highway 400 / 404 and Highway 115. Roughly 120 km depending on your part of Vaughan.' },
      { question: 'Does HBW serve Woodbridge and Maple too?', answer: 'Yes. Woodbridge and Maple are within the same drive time. We have customers across all three communities.' },
      { question: 'Can I get a Mercury quote without driving up?', answer: 'Yes. Build a quote at mercuryrepower.ca/quote in three minutes. Real CAD pricing, no phone required.' },
    ],
  },
  {
    slug: 'mercury-dealer-brampton-ontario-hbw',
    title: 'Mercury Dealer Brampton Ontario HBW',
    seoTitle: 'Mercury Dealer for Brampton: Repower from Rice Lake',
    description: 'Mercury Premier dealer near Brampton: Harris Boat Works on Rice Lake, 95 minutes northeast. Repower, sales, parts, winter storage for Brampton, Caledon.',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
    imageAlt: 'Aerial view of Harris Boat Works and its Rice Lake marina in Gores Landing, Ontario',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-08-08',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer brampton', 'mercury repower brampton', 'mercury outboard brampton ontario', 'boat motor dealer brampton caledon'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 95 minutes northeast of Brampton via Highway 410 to Highway 401 east and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Brampton boaters drive to Harris Boat Works: about 95 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-brampton-worth-the-drive.png)

# Mercury Dealer for Brampton: What Makes the Drive Northeast Worth It

Brampton to Rice Lake is a real drive, roughly 95 minutes when the 401 cooperates, longer when it doesn't. We're not going to dress that up.

What we are going to tell you is why some Brampton customers make it anyway, and how to know if you're one of them.

## The 401 Issue, and How to Deal With It

Most Brampton routes to Rice Lake go through Toronto on the 401. That's the pain point. Early Saturday morning, ahead of most cottage traffic, it's manageable. Midday on a long weekend, it's a different story.

If you're the kind of buyer who researches carefully, decides once, and executes on a weekend morning, the drive is workable. If you're still browsing and comparing, use the quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) from your couch first. That way the drive, when you make it, is to confirm and order, not to start the conversation.

## Why Brampton Customers Call Us First

The issue most Brampton-area buyers describe is the same one we hear from across the GTA: no pricing online, or pricing that requires a call to get. They've already researched the motor. They know what they want. They just can't get a number without engaging a salesperson first.

Our quote builder fixes that. Real installed pricing, motor, rigging, and installation, in Canadian dollars, in about three minutes. See the price, think it over, call us if you have questions, drive up when you're ready. Or skim [our published Mercury price list](/pricing-reference) first if you just want a feel for what motors cost.

## What a Repower Really Involves

A repower isn't a parts swap. It's a rigging job. The motor, the controls, the throttle and shift cables, the prop selection, the integration with your existing electronics, all of it has to be right for the motor to perform the way Mercury designed it. A repower done hastily or without the right rigging conversation is a repower you'll notice on the water.

HBW has served Rice Lake boaters since 1947 and sold Mercury since 1965. The rigging conversation is as important to us as the motor sale.

## Mercury Premier, What It Means in Practice

Premier is Mercury's top dealer tier. It means we carry deeper parts inventory, have more advanced technical training, and hold full warranty authorization. For most standard motor sales, the tier difference won't be visible. For complex repowers, unusual rigs, warranty claims, or technical issues after the sale, it's the difference between a quick resolution and a waiting game.

---

## What Harris Boat Works Handles for Brampton Customers

**Mercury outboard sales**
FourStroke and Pro XS. Verado and SeaPro available by special order. We'll have a real conversation about what fits your hull and your use case, not just push what's in stock.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. Nothing gets skipped.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. No indoor. For most Brampton customers, local storage probably makes more logistical sense unless you're planning to use the boat regularly on Rice Lake or the Kawarthas.

**Installed pricing online**
[mercuryrepower.ca](https://www.mercuryrepower.ca), real CAD pricing, no games.

---

## Getting to Harris Boat Works from Brampton

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Route:** Highway 410 south to Highway 401 east (or take Highway 427 east to 401), then Highway 401 east through Toronto, exit Highway 115 east, then County Road 28 north into Gores Landing.

**Approximate drive time:** Around 95 minutes outside rush hour. The 401 through Toronto is the wild card. Saturday mornings early or weekday mornings before 7 a.m. are the most reliable windows.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
**Phone:** 905-342-2153
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)

---

## Making the Drive Count

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). See the real installed price before you commit to the drive.
2. **Think through the rigging conversation.** What controls? Any electronics integration? Single or twin? Prop preference or open to recommendation?
3. **Call ahead:** 905-342-2153. Confirm someone will have time for you. We'd rather know you're coming.
4. **Go early on a Saturday.** You'll beat cottage traffic both ways.
5. **Come when you're decided.** Not when you're still browsing. 95 minutes each way deserves a productive visit.

---

## Frequently Asked Questions, Brampton

**Can I see real pricing without calling or driving up?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca). Installed pricing in about three minutes.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. If you're running a Yamaha, Honda, or Suzuki, we can't help on the service side.

**Is 95 minutes worth it for a motor purchase?**
Depends on what you're getting out of the trip. If you've already priced it online and want to talk through the full rigging conversation before committing, yes. If you're still deciding what motor to get, do that research first from home, then decide if the drive makes sense.

**What's the rigging conversation you keep mentioning?**
It's the part of the repower that most dealers skip. What throttle and shift setup makes sense for your hull? How does the motor height need to be set? What prop works for your load and use case? These decisions affect performance significantly. We have this conversation before we order anything.

**Do you have boats to look at if we make the trip?**
We carry Legend Boats and have used inventory. But if your primary purpose is a motor purchase or repower, focus on that, don't make the trip longer trying to accomplish too many things at once.

---

## The HBW Promise

You see the price before you make the drive. We have the rigging conversation before we order anything. We do the job right. You get on the water with a motor that performs the way it's supposed to.

No fog machine. No runaround. Since 1947.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)
**Call or text:** 905-342-2153
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer. Mercury dealer since 1965, family marina on Rice Lake since 1947.

---

## Where Brampton Boaters Launch and Why HBW Is Worth the Trailer Trip

Brampton is inland, no public launch in the city itself. Local boaters either drive south to Lake Ontario (Mississauga's **Port Credit Harbour** or Oakville's **Bronte Harbour**), north to **Lake Simcoe** via the 410/400 corridor, or east to **Rice Lake** via the 401/115. **Heart Lake Conservation Area** in Brampton is electric-motor only, not relevant for outboard owners.

The drive to Rice Lake is 95 minutes via the 410 south, 401 east, and Highway 115 north. Weekend 401 traffic east of the 404 adds 20-30 minutes; midweek mornings are the only stress-free time.

Why Brampton boaters still trailer to HBW:

- **Once-a-year trip pays off.** A proper Mercury repower takes hours of dealer-portal work and shop time. Trailering to HBW for the repower itself, then storing locally for the season, is the pattern many Brampton customers run.
- **Transparent CAD pricing.** [mercuryrepower.ca](https://www.mercuryrepower.ca) lets you build the quote at home before deciding to make the trip.
- **Mercury Premier-level work.** Closer dealers may lack the rigging depth for a clean install.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Brampton?', answer: 'About 95 minutes via Highway 410 / 401 and Highway 115. Roughly 140 km depending on your part of Brampton.' },
      { question: 'Does HBW serve Caledon?', answer: 'Yes. Caledon is within the same drive time as Brampton. We have customers across the area.' },
      { question: 'Why drive 95 minutes for a Mercury dealer?', answer: 'Brampton customers cite transparent online CAD pricing, Mercury Premier-tier technical depth, and a no-pressure family-marina conversation.' },
    ],
  },
  {
    slug: 'mercury-dealer-oakville-ontario-hbw',
    title: 'Mercury Dealer Oakville Ontario HBW',
    seoTitle: 'Mercury Dealer for Oakville: Repower from Rice Lake',
    description: 'Mercury Premier dealer near Oakville: Harris Boat Works on Rice Lake, 110 minutes northeast. Repower, sales, parts, winter storage for Oakville, Burlington-edge.',
    image: '/lovable-uploads/hero-gta-oakville-sea-trial.png',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-05-11',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer oakville', 'mercury repower oakville', 'mercury outboard oakville ontario', 'boat motor service oakville'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 110 minutes northeast of Oakville via the QEW east, Highway 401, and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Oakville boaters drive to Harris Boat Works: about 110 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-oakville-worth-the-drive.png)

# Mercury Dealer for Oakville: The Drive That Makes Sense When the Answers Get Clearer

Oakville is at the western end of the GTA, which means Rice Lake is one of the longer drives in this group, roughly 110 minutes northeast. That's a significant trip. We're not going to underplay it.

The question isn't whether the drive is short. The question is whether the experience at the destination is different enough from what you'd get closer to home to justify the time.

Here's the honest case.

## Oakville Buyers Know the Difference Between a Good Dealer and a Sales Floor

Oakville has a high concentration of experienced boat buyers, people who've owned boats for years, done multiple purchases, and have a clear sense of what the relationship with a dealer should feel like. They tend to have patience for a longer drive when it means working with a shop that gives them straight answers, rather than a closer option that manages the process.

If you've bought a motor before and the experience left you feeling like you were navigated toward a decision rather than informed for one, that's the difference we're describing.

## Pricing That Doesn't Require a Conversation to Get

Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows installed pricing, motor, rigging, and installation, in Canadian dollars, in about three minutes. Before you talk to anyone. Before you're a "prospect." For [Mercury outboard prices by horsepower](/pricing-reference) on one page, see our published price reference.

If you build a quote, look at the number, and decide to buy from a closer Oakville-area dealer, good. You'll make that choice with real information. That's the point.

## The Repower Question Specific to Oakville

A lot of Oakville-area boaters are on Lake Ontario, Burlington Bay, or the Hamilton waterfront. Big water, larger boats, often larger motors. If you're considering a repower on a bigger hull, a significant horsepower upgrade, twin-engine setup, or a complex rigging job, Mercury Premier certification matters more than on a simple single-motor swap.

The technical depth on harder jobs is where Premier certification shows up. And the rigging conversation on a bigger, heavier hull has more variables than a standard 60 HP swap on a 16-foot aluminum. We're experienced with both.

## A Shop Built on Repeat Customers

The business runs on repeat customers and referrals. The model depends on doing right by people, not on a quarterly sales number.

---

## What Harris Boat Works Handles for Oakville Customers

**Mercury outboard sales**
2.5 HP through 600 HP. FourStroke, Pro XS, Verado, SeaPro. We'll have a straight conversation about what fits your specific hull and how you use it.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. For larger and more complex setups, the rigging conversation is especially important, don't skip it.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. No indoor. For most Oakville customers, local storage will make more logistical sense unless you're regularly on inland lakes or the Kawarthas.

**Transparent installed pricing**
[mercuryrepower.ca](https://www.mercuryrepower.ca), see it before you drive.

---

## Getting to Harris Boat Works from Oakville

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Route:** QEW east to Highway 401 east through Toronto, then exit Highway 115 east (Peterborough direction), then County Road 28 north into Gores Landing.

**Approximate drive time:** Around 110 minutes outside rush hour. The 401 through Toronto is variable. Saturday mornings early, before the cottage crowds, are the best window from Oakville. Come back before 3 p.m. or wait for late evening; the 401 west into Toronto on a summer Saturday afternoon is not forgiving.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
**Phone:** 905-342-2153
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)

---

## Making 110 Minutes Count

This is the trip that most rewards preparation:

1. **Build your quote first** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Know the installed price before you even consider the drive.
2. **Have the rigging conversation questions ready.** For Oakville-area buyers on bigger water, the questions around HP, prop, trim, and rigging height tend to be more complex. Write them down.
3. **Call ahead:** 905-342-2153. Let us know you're coming from Oakville and what you're working through. We'll make sure the right person has time for you.
4. **Go on a Saturday morning, before 8 a.m. departure.** Best traffic window in both directions.
5. **Come to confirm, not to browse.** 110 minutes each way deserves a resolved conversation.

---

## Frequently Asked Questions, Oakville

**Is it really worth driving 110 minutes for a motor?**
For a standard over-the-counter motor purchase, probably not, do more of that work by phone and online first. For a complex repower or a purchase where the rigging conversation matters, some Oakville customers say the trip is worth it specifically because they left with answers, not more questions.

**Can I see real pricing before driving up?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca). Installed pricing, no login, no callback.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. Yamaha, Honda, and Suzuki are outside our scope.

**My boat is on Lake Ontario. Can you handle repowers for bigger lake boats?**
Yes. Larger HP motors, twin-engine setups, more complex rigging, these are jobs we take on. The conversation gets more detailed, but that's appropriate given what's involved.

**What if I want to talk through the decision before committing to the drive?**
Call us at 905-342-2153 or text. We can have a real conversation about whether the trip makes sense for your situation. If it doesn't, we'll tell you.

---

## The HBW Promise

You see the installed price before you commit to anything, including the drive. The rigging conversation happens before we order a motor, not after. The job gets done properly. You leave with a motor that's set up for your hull, not just mounted.

That's the deal.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)
**Call or text:** 905-342-2153
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer.

---

## Where Oakville Boaters Launch and Why HBW Handles Their Mercury Work

Oakville is one of the GTA's stronger marina towns. **Bronte Harbour** and **Oakville Harbour** are both city-owned with public launches; **Bronte Outer Harbour Marina** handles larger boats. The **Sixteen Mile Creek** mouth at Oakville Harbour is a popular sheltered area for smaller-boat owners.

The drive to Rice Lake is 110 minutes via the QEW east through Toronto, 401 east, and Highway 115 north. Similar to Burlington, weekend QEW through Toronto is slow, midweek mornings are the only sane window for service trips.

Why Oakville boaters drive to HBW for repower:

- **Mercury Premier-level rigging.** For a $15,000-$25,000 repower investment, the drive is justified when local dealers can't match the install depth.
- **One-time annual trip.** Many Oakville customers trailer up once for repower or major service, then run lighter maintenance closer to home.
- **Transparent CAD pricing.** Build your quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) before deciding, the configurator works without a phone call and shows real dealer pricing, not MSRP.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Oakville?', answer: 'About 110 minutes via QEW / 401 and Highway 115. Roughly 160 km depending on your part of Oakville.' },
      { question: 'Is the drive worth it for a Mercury dealer?', answer: 'Oakville customers cite three reasons: transparent online CAD pricing, Mercury Premier-tier technical depth, and the no-pressure family-marina conversation. Whether the drive is worth it depends on your priorities.' },
      { question: 'Can I do most of the buying process remotely?', answer: 'Yes. Quote online, confirm by phone or text, then trailer the boat to us for install and sea-trial. Service is drop-off at Gores Landing (we do not pick up, deliver, or arrange hauling). Most Oakville customers do 90% remotely.' },
    ],
  },
  {
    slug: 'mercury-dealer-burlington-ontario-hbw',
    title: 'Mercury Dealer Burlington Ontario HBW',
    seoTitle: 'Mercury Dealer for Burlington: Repower from Rice Lake',
    description: 'Mercury Premier dealer near Burlington: Harris Boat Works on Rice Lake, 110 minutes northeast. Repower, sales, parts, winter storage for Burlington.',
    image: '/lovable-uploads/hero-gta-burlington-aerial-marina.png',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-08-02',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer burlington', 'mercury repower burlington', 'mercury outboard burlington ontario', 'boat motor service burlington hamilton'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 110 minutes northeast of Burlington via the QEW east, Highway 401, and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Burlington boaters drive to Harris Boat Works: about 110 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-burlington-worth-the-drive.png)

# Mercury Dealer for Burlington: Why Some Customers Drive Past Hamilton to Come to Rice Lake

Burlington has marine options closer to home. There are dealers in the Hamilton area, including one that carries Mercury. So why do some Burlington customers make the longer drive to Gores Landing?

We'll be straight about it.

## The Pricing Transparency Gap

Most marine dealers in the greater Hamilton-Burlington corridor don't publish installed pricing online. They want you to call, and with good reason from their perspective. Once you're in a conversation, they can manage the comparison. They can anchor, pitch, and build rapport before you've made up your mind.

Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows installed pricing, motor, rigging, and installation, in Canadian dollars, in about three minutes. No call, no form, no process. You see the number, think it over, and engage us when you're ready. If you just want to see [every Mercury model priced in CAD](/pricing-reference), that list is published too.

The customers who find this meaningful are the ones who've already done the research and just want a fair, transparent number. They're not looking to be sold. They're looking to buy.

## Mercury Premier, Not All Dealers Are the Same

Mercury authorizes dealers at different tiers. Premier is the top level. It's not just a sign on the wall, it reflects ongoing training requirements, parts depth, and full warranty authorization. When the job gets complicated, a technical diagnostic, a warranty claim on a newer motor, a complex twin-engine rig, the difference between a Premier dealer and a lower-tier dealer can show up in resolution time and technical depth.

Burlington has Mercury dealers. Not all of them are Premier. That's worth knowing.

## Burlington Buyers on Inland Lakes

Not all Burlington boaters are on Lake Ontario. A lot of Burlington residents have properties or memberships at inland lakes, the Kawarthas, Simcoe, Rice Lake itself. If your boat is already stationed closer to us than to Burlington, the distance equation changes. Some Burlington customers are effectively driving 30 minutes to get their boat and another 20 minutes to get to us, which makes the drive feel like 20 minutes, not 110.

If that's your situation, it's worth thinking about us as a primary dealer rather than an exception.

## Third Generation on Rice Lake Since 1947

Harris Boat Works isn't trying to be a high-volume GTA dealer. We're a third-generation family marina, on Rice Lake since 1947, built on the premise that repeat customers and referrals are the most durable business model in this industry. The conversation here is different from a sales-quota-driven floor.

---

## What Harris Boat Works Handles for Burlington Customers

**Mercury outboard sales**
FourStroke and Pro XS. Verado and SeaPro available by special order. We'll have a straight conversation about what makes sense for your application, not just what's in stock.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. The rigging isn't an afterthought, it's the part that determines how the motor performs on your specific hull.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. No indoor. For Burlington customers with boats on Lake Ontario or Burlington Bay, local storage will likely make more geographic sense unless you're running inland.

**Installed pricing online**
[mercuryrepower.ca](https://www.mercuryrepower.ca), the number is there before any conversation starts.

---

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

## Getting to Harris Boat Works from Burlington

**Route:** QEW east to Highway 401 east through Toronto, then Highway 115 east (Peterborough direction), then County Road 28 north into Gores Landing.

**Approximate drive time:** Around 110 minutes outside rush hour. The 401 through Toronto is the variable. Early Saturday morning is reliably manageable from Burlington; midday or late afternoon on a long weekend is not.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
**Phone:** 905-342-2153
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)

---

## How to Make the Trip Worth the Distance

1. **Start with the quote builder** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Know the real installed price before you consider the drive.
2. **Call or text ahead:** 905-342-2153. Let us know what you're working on, we'll make sure the right conversation is ready when you arrive.
3. **Prepare your rigging questions.** What controls? Any electronics? Single or twin? What's your hull and how are you using it? These questions shape what we order.
4. **Time the trip for a Saturday morning.** Earliest window in both directions is the most reliable.
5. **Come when you're decided.** This is not a browsing trip. Make the time count.

---

## Frequently Asked Questions, Burlington

**Why would I drive past a closer Mercury dealer to get to you?**
Fair question. If the closer option is a Premier dealer with transparent pricing and a willingness to have a real rigging conversation, you might not need to. Call us first. Tell us what you're weighing. We'll give you an honest take on whether the trip makes sense for your situation.

**Can I see installed pricing without calling?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca). Three minutes. Real numbers.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. Yamaha, Honda, and Suzuki are outside our scope.

**My boat is on Lake Ontario. Is a repower from you realistic?**
Yes. The boat would need to come to us, either trailered up or, if it's a smaller hull, towed. Call us at 905-342-2153 and we'll talk through the logistics.

**What's the difference between Premier and regular Mercury certification?**
Parts inventory depth, technical training requirements, and warranty authorization. Premier status does not change the written warranty terms or guarantee claim speed; the practical value is a dealer equipped to diagnose, document, and submit the work through Mercury's authorized network.

---

## The HBW Promise

The price is at [mercuryrepower.ca](https://www.mercuryrepower.ca) before any conversation starts. The rigging gets done right, not fast. The job is finished the way Mercury intended it to be done.

That's been true since 1947. It's still true.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)
**Call or text:** 905-342-2153
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer. Mercury dealer since 1965, family marina on Rice Lake since 1947.

---

## Where Burlington Boaters Launch and Why HBW Handles Their Repowers

Burlington sits on Lake Ontario's west shore, with significant marina presence. The main local launches are **LaSalle Park Marina** (city-run with public ramp), **Bronte Harbour** just east in Oakville, and various private slips along Burlington Bay. The bay itself is sheltered but largely industrial; most recreational boating happens on open Lake Ontario.

The drive to Rice Lake is roughly 110 minutes via the QEW east through Toronto, then 401 east and Highway 115 north, call it a 2-hour round-trip on a good day. Weekend QEW traffic through Toronto adds 20-40 minutes. Midweek mornings are the only sane option.

Why Burlington boaters still drive to HBW:

- **Plan drop-off and pickup as separate trips.** HBW confirms completion timing after the boat and work scope are reviewed.
- **Annual repower or winterization trip.** Burlington owners can trailer their boat to HBW for booked repower work or winterization and storage, then return it to their local marina for the season.
- **Mercury Premier-level support.** The practical reasons to make the drive are Mercury-specific diagnostics, a documented rigging scope, current pricing, and one shop accountable for the installation and future service history.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Burlington?', answer: 'About 110 minutes via QEW / 401 and Highway 115. Roughly 160 km depending on your part of Burlington.' },
      { question: 'Is there a closer Mercury dealer to Burlington?', answer: "Yes. Burlington-area boaters have closer authorized Mercury options in the Hamilton area. HBW is the Rice Lake option for customers who value Premier-tier Mercury support, an accountable repower process, and transparent online CAD pricing." },
      { question: 'Can I quote and order remotely?', answer: 'Yes. Build the quote at mercuryrepower.ca/quote, confirm by phone or text, then trailer the boat to us at Gores Landing for install and sea-trial. Service is drop-off, we do not pick up, deliver, or arrange hauling.' },
    ],
  },

  {
    slug: 'mercury-dealer-pickering-ontario-hbw',
    title: 'Mercury Dealer for Pickering: 50 Minutes from Rice Lake',
    description: 'Mercury Premier dealer for Pickering: Harris Boat Works on Rice Lake, 50 minutes via 401 and 115. Repower, sales, service, storage for east GTA boat owners.',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp',
    imageAlt: 'Aerial view of Harris Boat Works and its Rice Lake marina in Gores Landing, Ontario',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: "2026-08-08",
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer pickering', 'mercury repower pickering', 'mercury outboard pickering ontario', 'boat motor dealer pickering'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 50 minutes northeast of Pickering via Highway 401 east and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Pickering boaters drive to Harris Boat Works: about 50 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-pickering-worth-the-drive.png)

# Mercury Dealer for Pickering: You're Closer Than You Think

Pickering is where the GTA starts to thin out. You're already east of the Don Valley, already past most of the traffic that makes the rest of the GTA's relationship with cottage country complicated.

From most of Pickering, Harris Boat Works is approximately 50 minutes northeast. That's not a day trip. That's a reasonable Saturday-morning errand, with coffee on the way.

## Pickering Is Practically in Our Neighbourhood

The 401 east from Pickering runs clear most mornings. Highway 115 north from there is pleasant driving, past farmland, then into cottage country. The last stretch into Gores Landing on County Road 28 feels like arriving somewhere, not just passing through.

A lot of our Durham Region customers, Pickering, Ajax, the eastern edge of Scarborough, come up multiple times a season. Spring commissioning, mid-season service issue, fall winterization. The drive isn't a special occasion for them. It's part of owning a boat.

At 50 minutes, we're effectively a local dealer for eastern Pickering customers, especially those who are already boating in the Kawarthas or on Rice Lake itself.

## The Problem With Pricing in the GTA

You can find Mercury dealers closer to Pickering. What you'll likely find when you try to price a motor is the standard GTA experience: no price visible online, a form to fill out, a callback from a sales rep who wants to understand your "situation" before sharing a number.

This isn't accidental. It's a process designed to put a salesperson in the conversation before you've made up your mind. Once you're talking, they can shape what you're considering.

Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) does the opposite. Real installed pricing in Canadian dollars, in about three minutes, before any conversation starts. You see the number. You think it over. You engage us when you're ready. Prefer to scan the list first? [What each Mercury motor costs](/pricing-reference) is published on our price reference.

## What Mercury Premier Means on a Repower

Mercury Premier is the top tier in their dealer program. Harris Boat Works has held it for years. The business here runs on repeat customers and referrals, not a sales-floor quota. The conversation is different.

---

## What Harris Boat Works Handles for Pickering Customers

**Mercury outboard sales**
Full lineup: 2.5 HP through 600 HP. Our standard repower lineup is FourStroke and Pro XS. Verado is available on special order, and SeaPro is a commercial-duty option we bring in to order. We'll talk through what makes sense for your specific hull and use case.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. For Pickering customers close enough to make multiple trips, we can also handle mid-season service and annual maintenance.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor with shrinkwrap. No indoor. At 50 minutes, some Pickering customers find it more convenient to store with us than to search for storage locally, especially if the boat is already being serviced here.

**Installed pricing online**
[mercuryrepower.ca](https://www.mercuryrepower.ca), real numbers before any conversation.

---

## Getting to Harris Boat Works from Pickering

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Route:** Highway 401 east to Highway 115 north, then County Road 28 north to Gores Landing. Mostly highway until the last 15 minutes, which is rural county road.

**Approximate drive time:** Around 50 minutes outside rush hour. From eastern Pickering, this is one of the shorter GTA drives in our coverage area.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
**Phone:** 905-342-2153
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)

---

## Before You Come Up

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Know the installed price. The conversation when you arrive will be more useful.
2. **Think about the service relationship, not just the purchase.** At 50 minutes, you're close enough to make us a real ongoing dealer, commissioning, service, winterization, storage.
3. **Text or call us:** 905-342-2153. Let us know you're coming. We'll have someone ready.
4. **Come when you're decided.** Even at 50 minutes, make the trip count.

---

## Frequently Asked Questions, Pickering

**At 50 minutes, can we realistically use you for regular service, not just a one-time purchase?**
Yes, and that's how a lot of our Durham Region customers use us. They're here for spring commissioning, one or two service visits during the season, and fall winterization. The drive is part of their boat-ownership routine.

**Can I see pricing without calling?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca). Installed pricing. Three minutes. No callback.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. Yamaha, Honda, and Suzuki are outside our scope.

**What if I want to store my boat with you but keep it close to home in winter?**
We do outdoor storage with shrinkwrap on-site. Some Pickering customers store here year-round, boat comes up in fall, stays through winter, we commission in spring, done. One drop-off, one pickup, everything happens here.

**I'm between two motor options, can I talk it through before coming up?**
Absolutely. Call or text: 905-342-2153. Or build both quotes at [mercuryrepower.ca](https://www.mercuryrepower.ca) and compare side by side. That's what the tool is for.

---

## The HBW Promise

Transparent pricing before you leave Pickering. The rigging conversation before anything gets ordered. The job done properly when you arrive. A shop that calls you back when you leave a message.

50 minutes. Worth it.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)
**Call or text:** 905-342-2153
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer.

---

## Where Pickering Boaters Launch and Why HBW Is Their Mercury Premier Option

Pickering's signature waterway is **Frenchmans Bay**, a sheltered shallow bay on Lake Ontario, home to **Pickering Harbour Marina** and **East Shore Marina**. Many Pickering boaters never leave the bay's protected waters; others use it as a launch point for open-water Lake Ontario fishing and recreation.

The drive to Rice Lake is 50 minutes via the 401 east and Highway 115 north. The 401 east of the 407 is clear midweek; expect 20 extra minutes on Saturday cottage mornings. Tuesday-Thursday mornings are ideal for service trips.

Why Pickering boaters choose HBW for repower:

- **Drive time math.** 50 minutes to HBW is the same as driving back into central Toronto for a downtown dealer, and you get Mercury Premier-level service.
- **Frenchmans Bay-friendly motors.** The bay's shallow depths and sheltered conditions favour different motor setups than open-water boating. We've rigged plenty of Pickering boats.
- **One-trip annual service.** Trailer up midweek, leave the boat for winterization or repower, pick up when ready. No 401 stress between Pickering and downtown.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Pickering?', answer: 'About 50 minutes via Highway 401 east and Highway 115 north. Roughly 75 km. Closer than most of the GTA - almost a non-decision drive for repower service.' },
      { question: 'Why drive 50 minutes for a Mercury dealer?', answer: 'Closer than you might think (similar to a typical Toronto commute), Mercury Premier tier (top dealer level), transparent CAD pricing online, no high-pressure dealer culture.' },
      { question: 'Can I quote and order remotely?', answer: 'Yes. Build a quote at mercuryrepower.ca/quote, confirm by phone or text, coordinate install/delivery from there.' },
    ],
  },
  {
    slug: 'mercury-dealer-ajax-ontario-hbw',
    title: 'Mercury Dealer for Ajax: 45 Minutes Northeast to Rice Lake',
    description: 'Mercury Premier dealer for Ajax: Harris Boat Works on Rice Lake, 45 minutes via 401 and 115. Repower, sales, parts, winter storage for Durham Region boat owners.',
    image: '/lovable-uploads/hero-mercury-dealer-ajax.png',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-08-08',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer ajax', 'mercury repower ajax', 'mercury outboard ajax ontario', 'boat motor service durham region ajax'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 45 minutes northeast of Ajax via Highway 401 east and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Ajax boaters drive to Harris Boat Works: about 45 minutes to Gores Landing on Rice Lake for Mercury repower, real pricing, and service](/blog-visuals/mercury-dealer-ajax-worth-the-drive.png)

# Mercury Dealer for Ajax: 45 Minutes and Worth Every One

Ajax is well-positioned for Rice Lake. You're already east of the worst GTA traffic, already close to the 401 corridor that runs you straight to Highway 115. At approximately 45 minutes, we're not asking you to rearrange your day.

Here's what that proximity makes possible.

## The Ongoing Relationship, Not the One-Time Purchase

A lot of boaters in the GTA treat their dealer like a hardware store, you go when you need something, you leave when you have it, and the relationship ends there.

At 45 minutes, the math is different. Ajax customers who use us regularly aren't making a special trip for a major purchase. They're building a service routine:

- **Spring:** Commissioning, motor inspection, launch check
- **Mid-season:** Whatever comes up, an impeller, a fuel issue, a lower unit question
- **Fall:** Winterization, shrinkwrap, storage drop-off
- **Winter:** Boat sits. We keep an eye on it.

That kind of relationship works when the drive is 45 minutes. It works well when the shop gives you straight answers and doesn't make you chase callbacks.

## Ajax Buyers Often Know Exactly What They're After

Durham Region buyers tend to be experienced boaters. They've owned boats, dealt with dealers, and they know when they're being managed versus when someone's actually being helpful. The call-for-quote process frustrates this buyer the most, because they've already done the research, they just can't get a number.

Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows installed pricing, motor, rigging, installation, in Canadian dollars, in about three minutes. No form, no callback, no process to get through. You see what it costs. You make a decision. For [the full Mercury price list](/pricing-reference) without building a quote, see our published price reference.

## Why Ajax Boaters Make the Drive

The model here runs on repeat customers and referrals, not a sales floor quota. Ajax is close enough that a bad experience would find its way back to us quickly. That keeps the conversation honest.

---

## What Harris Boat Works Handles for Ajax Customers

**Mercury outboard sales**
Full lineup: 2.5 HP through 600 HP. FourStroke, Pro XS, Verado, SeaPro. Honest conversation about what fits your hull and your use case.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. The rigging conversation shapes how the motor performs, we don't skip it.

**Mercury parts and service**
HBW probably carries the largest Mercury parts inventory in Ontario, but the exact part still depends on the engine serial number and current stock. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor winter storage with shrinkwrap. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. For Ajax customers who boat on Rice Lake or the Kawarthas, keeping the boat at HBW through winter makes logistical sense. The boat stays close to the water, and physical service resumes when we reopen in early April.

**Installed pricing online**
[mercuryrepower.ca](https://www.mercuryrepower.ca), see it before you leave Ajax.

---

## Getting to Harris Boat Works from Ajax

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

**Route:** Highway 401 east to Highway 115 north, then County Road 28 north to Gores Landing. Clean highway run for most of it, the last 15 minutes is rural county road once you're off 115.

**Approximate drive time:** Around 45 minutes outside rush hour. Ajax's position east of the main GTA traffic clusters makes this a particularly clean run on most mornings.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
**Phone:** 905-342-2153
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)

---

## What to Do First

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Know the installed price before you leave Ajax.
2. **Think about the service relationship.** At 45 minutes, commissioning and winterization here makes sense. Think through whether you want to build that into your routine.
3. **Submit a service request** at [hbw.wiki/service](https://hbw.wiki/service) if service is the starting point.
4. **Call or text us:** 905-342-2153. We'll make sure the right conversation is ready.

---

## Frequently Asked Questions, Ajax

**Can I use you as a regular service dealer, not just for purchases?**
Yes. Ajax is close enough that commissioning, seasonal service, and winterization all work. A lot of our Durham Region regulars have made this their annual routine.

**Can I see pricing without calling?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca). Installed pricing. No process to go through.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. We can't help with Yamaha, Honda, or Suzuki service.

**I have a service issue right now, what do I do?**
Submit a request at [hbw.wiki/service](https://hbw.wiki/service). That's how 90% of our service intake works. Faster than calling, and it means the right person sees the details right away.

**What if I'm not sure whether to repower or buy new?**
Build a repower quote at [mercuryrepower.ca](https://www.mercuryrepower.ca) and call us: 905-342-2153. We'll talk through the decision honestly, including cases where repowering doesn't make sense.

---

## The HBW Promise

You see the price before you leave Ajax. The rigging gets discussed before we order anything. The job gets done right. You're back on the water with a motor that performs the way it was designed to.

About 45 minutes from Ajax. Straight pricing before you leave home.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)
**Call or text:** 905-342-2153
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer.

---

## Where Ajax Boaters Launch and Why Many Repower at HBW

Ajax sits on Lake Ontario's north shore. Most local boating runs out of **Rotary Park boat launch** on the Ajax waterfront or **Frenchmans Bay** on the Pickering border. Frenchmans Bay is the more sheltered option for smaller boats and weekend launches; Rotary Park gives faster access to open water for bigger rigs.

The drive to Rice Lake is 45 minutes via the 401 east and Highway 115 north. It's a clear shot midweek. Saturday mornings in summer add 15-20 minutes as cottage traffic stacks east of Toronto until about 10 AM. For service appointments, midweek mornings give you the road and the shop to yourself.

Why Ajax boaters choose HBW for repower:

- **Mercury Premier-level rigging depth.** A 115 HP repower involves controls, harness, gauge, and prop matching. Smaller dealers do this work but slower; we do it daily.
- **One-trip storage + service.** Many Ajax customers store at HBW over winter, get spring commissioning, and trailer back to Lake Ontario for the season. One drive, one trusted shop, no May scheduling friction.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Ajax?', answer: 'About 45 minutes via Highway 401 east and Highway 115 north. Roughly 70 km. One of the closer GTA cities to Rice Lake.' },
      { question: 'Why drive to Rice Lake from Ajax?', answer: 'Mercury Premier tier, transparent CAD pricing online, and no high-pressure dealer culture.' },
      { question: 'Can I use HBW as my primary Mercury dealer?', answer: 'Yes. Many Durham Region customers do - spring commissioning, mid-season service, fall winterization. 45 minutes is short enough to make it practical.' },
    ],
  },
  {
    slug: 'mercury-dealer-oshawa-ontario-hbw',
    title: 'Mercury Dealer for Oshawa: 40 Minutes to Rice Lake',
    description: 'Mercury Premier dealer for Oshawa: Harris Boat Works on Rice Lake, 40 minutes via 401 and 115. Repower, sales, parts and winter storage for Durham Region.',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-pontoon-outboard-115-freshwater-2026-07.webp',
    imageAlt: 'Official Mercury freshwater photography of a 115 HP FourStroke on a family pontoon',
    author: 'Jay Harris',
    datePublished: '2026-05-11',
    dateModified: '2026-08-08',
    publishDate: '2026-05-11',
    category: 'Dealer Locations',
    readTime: '4 min',
    keywords: ['mercury dealer oshawa', 'mercury repower oshawa', 'mercury outboard oshawa ontario', 'boat motor service durham region oshawa'],
    content: `> **Quick answer:** Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 40 minutes northeast of Oshawa via Highway 401 east and Highway 115. We handle Mercury outboard sales, repowers, parts, and service. See installed pricing at mercuryrepower.ca. For engine repairs, we only service Mercury and Mercruiser.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

---

![Why Oshawa boaters drive to Harris Boat Works: about 40 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-oshawa-worth-the-drive.png)

# Mercury Dealer for Oshawa: We're Basically Durham Region

Oshawa is one of the closest major cities to Rice Lake on the 401 corridor. At approximately 40 minutes northeast via 401 east and Highway 115, you're effectively in our service area, not reaching across it.

This isn't a case of asking you to make a meaningful sacrifice for a better dealer. It's acknowledging that Gores Landing is closer than it sounds.

## Oshawa's Unique Position

Oshawa is the eastern edge of the GTA and the beginning of cottage country. A lot of Oshawa residents already drive north regularly, to cabins, to family, to the Kawarthas. Rice Lake is not an unfamiliar destination for this customer base.

If you're already boating on Rice Lake, Lake Scugog, or anywhere in the Trent-Severn system, you probably already know where we are. For those customers, "we're 40 minutes away" isn't a selling point, it's just the reality of where we sit relative to where they already spend time.

## What Changes at 40 Minutes

At 40 minutes, the whole service relationship becomes practical, not just the one-time purchase:

**Spring commissioning:** Drop the boat off on your way past, you're practically going by anyway if you're headed to the lake.

**In-season service:** A mid-week run to sort out a motor issue. You're there and back before lunch.

**Winterization:** October drop-off, November shrinkwrap, spring pickup. The whole fall routine makes sense at this distance.

**Storage:** Outdoor winter storage with shrinkwrap. For Oshawa customers whose boats are already at the lake, keeping them here through winter is more convenient than hauling them back for the season.

## The Pricing Conversation Starts Before You Arrive

Our quote builder at [mercuryrepower.ca](https://www.mercuryrepower.ca) shows installed pricing, motor, rigging, installation, in Canadian dollars, in about three minutes. Real numbers, no callback, no process to navigate. For [Mercury MSRP and dealer prices](/pricing-reference) side by side, see our published price list.

For Oshawa buyers who know what they want and just need a clean number, that's the difference. The pricing question is answered before you make the drive.

## Why Oshawa Boaters Make the Drive

Premier is the top tier in Mercury's dealer program, parts depth, warranty authorization, advanced technical training. The business runs on repeat customers and referrals. Oshawa is close enough that anything short of a straight answer would come back to us fast.

---

## What Harris Boat Works Handles for Oshawa Customers

**Mercury outboard sales**
2.5 HP through 600 HP. Our standard repower lineup is FourStroke and Pro XS. Verado is available on special order, and SeaPro is a commercial-duty option we bring in to order. We'll have an honest conversation about what fits your hull and application.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, sea trial. For Oshawa customers, we can realistically handle your complete annual service cycle.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor winter storage with shrinkwrap. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. At 40 minutes, keeping the boat at HBW through winter makes solid logistical sense for many Oshawa boaters. Physical service resumes when we reopen in early April.

**Installed pricing online**
[mercuryrepower.ca](https://www.mercuryrepower.ca), the number is there before you even pick up the phone.

---

You can build a live CAD quote for your repower online at [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

## Getting to Harris Boat Works from Oshawa

**Route:** Highway 401 east to Highway 115 north, then County Road 28 north to Gores Landing. Clean run, you're off the worst of the GTA traffic the moment you leave Oshawa east.

**Approximate drive time:** Around 40 minutes outside rush hour. The drive becomes distinctly rural about 20 minutes in, it's a noticeably different experience from most GTA commuting.

**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
**Phone:** 905-342-2153
**Service requests:** [hbw.wiki/service](https://hbw.wiki/service)
**Motor pricing:** [mercuryrepower.ca](https://www.mercuryrepower.ca)

---

## What to Do First

1. **Build your quote** at [mercuryrepower.ca](https://www.mercuryrepower.ca). Know the real installed price, it takes three minutes.
2. **Think about the full service relationship.** At 40 minutes, you're close enough for commissioning, mid-season service, and winterization to all happen here. That simplifies your life.
3. **Submit service requests** at [hbw.wiki/service](https://hbw.wiki/service), faster than calling, right format, routes to the right person.
4. **Call or text:** 905-342-2153 for questions about a specific job or purchase.

---

## Frequently Asked Questions, Oshawa

**Is 40 minutes really what makes this worth it?**
The drive is part of it, you're close enough that we're a practical option for ongoing service, not just a one-time trip. But the pricing transparency and the Premier technical depth are what makes the relationship worth having. Both matter.

**Can I see pricing without calling?**
Yes. [mercuryrepower.ca](https://www.mercuryrepower.ca). Installed pricing. Three minutes.

**Do you service non-Mercury motors?**
No. For engine repairs, we only service Mercury and Mercruiser. Yamaha, Honda, and Suzuki are outside our scope.

**I want to winterize and store my boat here, how do I get started?**
Submit a request at [hbw.wiki/service](https://hbw.wiki/service) in September or early October. We'll get you scheduled. Storage with shrinkwrap is outdoor; no indoor option.

**What if I'm in a hurry and need a part quickly?**
Parts can be ordered through [marinecatalogue.ca](https://www.marinecatalogue.ca) or by calling us at 905-342-2153. If you need something urgently, call, we'll tell you what we have in stock and what the timeline looks like.

**Can I talk through a repower vs. new boat decision before I commit to anything?**
Yes. That's exactly the kind of conversation we want to have before you've committed. Call us: 905-342-2153. We'll be honest about what the numbers look like on both sides.

---

## The HBW Promise

You're 40 minutes away. The price is already online. The rigging conversation happens before we order. The job gets done right.

You're practically in our neighbourhood. Let's work together.

**Build your quote:** [mercuryrepower.ca](https://www.mercuryrepower.ca)
**Request service:** [hbw.wiki/service](https://hbw.wiki/service)
**Call or text:** 905-342-2153
**Harris Boat Works**, Gores Landing on Rice Lake. Mercury Marine Premier dealer.

---

## Where Oshawa Boaters Launch and When Repower Is Worth Assessing

Oshawa is a strong east-GTA boating town. **Oshawa Harbour Marina** is the main local hub, city-owned, large facility with public launch and a long recreational history. Lake Ontario shoreline here has a serious boating community with manufacturing-town roots.

The drive to Rice Lake is just 40 minutes via the 401 east and Highway 115 north, easy midweek, weekend cottage traffic the only friction. For service trips, Tuesday-Thursday mornings are ideal.

Why some Oshawa boaters consider HBW:

- **Older hulls can be worth assessing.** A 1990s or 2000s fiberglass hull may be a repower candidate if its transom and other systems are sound. The hull inspection and written scope determine whether repowering makes sense.
- **Proximity makes it practical.** 40 minutes is a reasonable drive for a multi-thousand-dollar repower investment, closer than driving back into central Toronto.
- **Mercury Premier-level support.** HBW offers Mercury-specific diagnostics, a documented rigging scope, current pricing, and continuity between installation and future service history. The motor, hull, maintenance, use, and conditions determine service life.

Ready to price it out? Build a live CAD quote for your repower online at the [Mercury Repower Centre](https://www.mercuryrepower.ca/quote/motor-selection).

---
`,
    faqs: [
      { question: 'How far is HBW from Oshawa?', answer: 'About 40 minutes via Highway 401 east and Highway 115 north. Roughly 65 km. One of the closest GTA cities to Rice Lake.' },
      { question: 'Can HBW be my primary Mercury dealer in Oshawa?', answer: 'Yes. Oshawa owners can book eligible Mercury and MerCruiser work at HBW in Gores Landing. Confirm the appointment and completion plan before trailering the boat; HBW is pickup-only and does not provide hauling or delivery.' },
      { question: 'Do you serve north Oshawa and Courtice?', answer: 'Yes. Boat owners from Courtice and north Oshawa can book eligible work at HBW in Gores Landing. Drive time varies by the starting point and traffic.' },
    ],
  },
  {
    slug: 'mercury-dealer-peterborough-ontario-hbw',
    title: 'Mercury Dealer Peterborough HBW',
    seoTitle: 'Mercury Dealer Peterborough | Repower & Service from Rice Lake',
    description: 'Harris Boat Works is the closest Mercury Premier dealer for Peterborough, ~35 minutes south via Highway 28.',
    image: '/lovable-uploads/hero-mercury-dealer-peterborough.png',
    imageAlt: "Man steering a Mercury outboard on a calm Ontario lake during fall, highlighting Harris Boat Works' local service area.",
    author: 'Harris Boat Works',
    datePublished: '2026-05-17',
    dateModified: '2026-08-08',
    publishDate: '2026-05-17',
    category: 'Dealer Locations',
    readTime: '6 min read',
    keywords: ['mercury dealer peterborough', 'peterborough mercury outboard', 'mercury premier dealer ontario', 'kawartha mercury repower'],
    content: `## Quick Answer

Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, about 35 minutes south of Peterborough via Highway 28. We handle Mercury outboard sales, repowers, parts, and service. Installed pricing is published online at mercuryrepower.ca, so you can build a quote before you make the drive.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

![Why Peterborough boaters drive to Harris Boat Works: about 35 minutes to Gores Landing on Rice Lake, real pricing, repower specialists](/blog-visuals/peterborough-worth-the-drive-hbw.png)

## The short answer for Peterborough boaters

If you're searching for the best Mercury dealer near Peterborough, here's the honest version: there are several dealers in the area, and "best" depends on what you need. What Harris Boat Works offers that's hard to find elsewhere: [Mercury Premier Dealer status](/blog/best-mercury-dealer-ontario-hbw-difference), real prices published online in our quote configurator (no "call for price"), and water testing on Rice Lake before you take delivery. We're about 35 minutes south of Peterborough via Highway 28 in Gores Landing, on Rice Lake's south shore. Plenty of Peterborough boaters drive past closer options for those things.

## Peterborough boaters don't need to commute to the GTA for a Mercury dealer

Most Peterborough boating questions get answered with a drive south through Lakefield or a drive west into the Kawarthas. The Mercury dealer math is a third option that a lot of Peterborough customers don't think about until they need a real conversation about a repower: HBW is 35 minutes south on Highway 28, and the route avoids any of the GTA congestion that makes a Mississauga or Burlington dealer a four-hour round trip.

For Peterborough customers, the conversation we have most often is "I've been driving to Toronto for warranty work and it's becoming impractical." Same warranty network. Closer dealer. Easier scheduling.

## What Peterborough boaters typically use HBW for

The pattern we see from Peterborough regulars looks like this:

- **Spring commissioning**, they drop off in April, pick up in May with the motor commissioned, tested, and ready for the Otonabee
- **Mid-season service**, an impeller, a fuel issue, a SmartCraft fault that needs a Mercury Premier diagnostic
- **Repower decisions**, [when the old motor is past mid-life and the math starts looking ugly](/blog/mercury-repower-cost-ontario-2026-cad), we walk through repower vs new boat vs sell with real numbers
- **Fall winterization + storage**, boat stays with us through the off-season, gets full winterization, picks back up at spring launch
- **Trade-in conversations**, the Trade-In Value Guide at mercuryrepower.ca gives a starting number; we close the actual valuation in person

The Peterborough boaters who use us most don't come for the sale. They come because once you have a service relationship with a Mercury Premier shop on Rice Lake, the rest of the year gets simpler.

## Why Peterborough customers drive past closer shops

Peterborough has marinas. Peterborough has general boat shops. What it has less of is Mercury Premier dealer depth with full repower capacity.

Premier is Mercury's top dealer tier, it reflects parts inventory depth, technical training hours, warranty authorization, and SmartCraft diagnostic equipment. For routine work (oil changes, props, basic seasonal service) any qualified Mercury dealer is fine. For a full repower or a hard warranty case, Premier-tier resolution paths matter.

The other reason: live online pricing. Most Mercury dealers, including most in the Peterborough area, require a phone call to get a quote. Our quote builder at mercuryrepower.ca shows real installed CAD pricing, motor, rigging, controls, prop, install labour, HST, in about three minutes. You see the number before you make the call. That alone is worth a 35-minute drive for most informed buyers. For [Mercury prices from 2.5 to 300 HP](/pricing-reference) on one page, see our published price reference.

## Getting to Harris Boat Works from Peterborough

Route: Highway 28 South through Lakefield, then County Road 9 east toward Gores Landing, then County Road 18 into the marina. Mostly highway and rural county road. Last 10 minutes is scenic Rice Lake country.

Approximate drive time: 35 minutes outside rush hour. From east Peterborough (around Trent University), shave 5 minutes. From west Peterborough (toward Lakefield), the drive is slightly longer but still under 40 minutes.

Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
Phone: 905-342-2153
Service requests: hbw.wiki/service
Motor pricing: mercuryrepower.ca

## What HBW handles for Peterborough customers

**Mercury outboard sales**
Full Mercury lineup: 2.5 HP portables through 600 HP Verado (Verado is special-order, most Peterborough/Kawartha boats need FourStroke or Pro XS). Honest conversation about what fits your boat and your use case on [the Otonabee, Trent system, or Kawartha lakes](/blog/trent-severn-mercury-dealer-survival-guide-2026).

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, installation, and documented acceptance checks before pickup. When safe seasonal conditions allow, the work order can include an on-water check on Rice Lake; otherwise, HBW documents the alternate acceptance plan with the customer. HBW is pickup-only and does not deliver boats or motors.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. SmartCraft diagnostics, full service for current and recent Mercury outboards. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor winter storage with shrinkwrap. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. For Peterborough customers who boat on Rice Lake, the Otonabee, or anywhere in the Trent-Severn system, keeping the boat at HBW through winter leaves it close to Rice Lake when we reopen in early April.

**Live installed pricing online**
mercuryrepower.ca, real Canadian dollars, full configuration. Build a quote before you leave Peterborough.

## The Peterborough customer profile we see most often

Peterborough boaters tend to know boats. The city has a deep boating culture, Trent University boaters, Otonabee day-cruisers, Kawartha cottagers, and a strong fishing community on the Kawartha chain. The call-for-quote runaround frustrates Peterborough buyers more than most because they've usually already done their research before they make the call.

Our quote builder skips the call-for-a-starting-price step and shows the current configuration in Canadian dollars. The boat-specific written quote controls the final motor, rigging, labour, tax, trade-in, and financing figures. HBW has built this business on returning customers and referrals, not quota-driven sales tactics.

## What we see at HBW

The most common Peterborough question we get isn't about a specific motor, it's "is repower worth it on my hull?" The honest answer depends on three things: the age of the hull, the cost of the motor proposed, and how many seasons you want out of the package. Our [Repower vs Buy New decision guide](/blog/repower-vs-new-boat) covers the math; the short answer is that for hulls under 15 years old in good structural shape, repower beats new-boat economics in most cases.

For Peterborough customers, continuity can be useful: the installing dealer can retain the rigging and service history if the owner returns for booked maintenance. Mercury controls warranty coverage and claim decisions, so no article should promise a faster approval or outcome.

## How to make the drive worth it

Build your quote at mercuryrepower.ca first. Takes about three minutes. You'll see real installed pricing for the motor and rigging options you're considering.

If you have a specific service issue, submit a request at hbw.wiki/service. That's how 90% of our service intake starts, faster than a phone call, and it routes directly to the right person.

For a motor purchase conversation, call ahead: 905-342-2153. We'll have someone ready when you arrive.

**Start from home:** build your itemized Mercury quote at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection), then pick up at Gores Landing.

## Frequently Asked Questions, Peterborough

**Can I use HBW as my regular Mercury service shop, not just for a repower?**
Yes. A 35-minute drive each way works for spring commissioning, mid-season service, and fall winterization. Many of our Peterborough regulars have made this their annual routine.

**Do you service the Trent-Severn or just Rice Lake boats?**
We service Mercury and Mercruiser outboards regardless of where the boat lives. Trent-Severn, Kawarthas, Lake Ontario, Otonabee, same shop, same diagnostics. For engine repairs, we only service Mercury and Mercruiser.

**Is HBW closer than a Toronto dealer?**
For most Peterborough addresses, yes, Toronto is roughly 90-120 minutes through GTA traffic; HBW is 35 minutes via Highway 28. The drive is also more pleasant.

**What do you charge for a Mercury repower?**
Depends on horsepower and existing rigging. The quote builder at mercuryrepower.ca gives a real CAD installed number based on your boat and the motor you're considering. Most repowers in our area land in the $13,000-$25,000 range including HST.

**Can I store my boat with you through the winter?**
Yes. HBW offers outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. Physical service and customer access resume when we reopen in early April.

**Do you sell new boats too?**
Yes. We're also a Legend Boats dealer. Aluminum fishing boats and pontoons primarily, all Mercury-rigged. Worth a conversation if you're in the new-boat market.

Harris Boat Works · Mercury Marine Premier Dealer · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153

*Last reviewed: 2026-07-18.*
`,
    faqs: [
      { question: "Who is the best Mercury dealer near Peterborough, Ontario?", answer: "Several dealers serve the Peterborough area, so it depends what you value. Harris Boat Works in Gores Landing, about 35 minutes south of Peterborough via Highway 28, is a Mercury Premier Dealer that publishes real motor prices online and water tests repowers on Rice Lake." },
      { question: "How far is Harris Boat Works from Peterborough?", answer: "About 35 minutes by car, roughly 30 km south of Peterborough via Highway 28, at 5369 Harris Boat Works Rd in Gores Landing on Rice Lake's south shore." },
      { question: "Is Harris Boat Works a Mercury Premier dealer?", answer: "Yes. Harris Boat Works holds Mercury's Premier dealer status and provides authorized Mercury sales and service on Rice Lake." },
    ],
  },
  {
    slug: 'mercury-dealer-cobourg-ontario-hbw',
    title: 'Mercury Dealer for Cobourg: 25 Minutes North to Rice Lake',
    seoTitle: 'Mercury Dealer Cobourg | Repower & Service from Rice Lake',
    description: 'Harris Boat Works is the closest Mercury Premier dealer for Cobourg, ~25 minutes north via County Road 18.',
    image: '/lovable-uploads/hero-mercury-dealer-cobourg.png',
    author: 'Harris Boat Works',
    datePublished: '2026-05-17',
    dateModified: '2026-08-08',
    publishDate: '2026-05-17',
    category: 'Dealer Locations',
    readTime: '6 min read',
    keywords: ['mercury dealer cobourg', 'cobourg mercury outboard', 'northumberland mercury dealer', 'rice lake mercury dealer'],
    faqs: [
      { question: 'Is there a Mercury dealer in Cobourg?', answer: 'Not within town limits at the Premier tier. Harris Boat Works in Gores Landing is the Mercury Premier Dealer for Cobourg, approximately 25 minutes north via County Road 18. For most Cobourg addresses we are the nearest Mercury Premier dealer in any direction. Family-owned since 1947, Mercury dealer since 1965.' },
      { question: 'How long is the drive from Cobourg to HBW?', answer: 'About 25 minutes outside rush hour, straight up County Road 18 into Gores Landing. From the Cobourg harbour or downtown, allow 25 to 30 minutes. From north Cobourg it is closer to 20 minutes. About as simple a route as gets, one road for most of the trip.' },
      { question: 'Does HBW service boats that live on Lake Ontario, not Rice Lake?', answer: 'Yes. The boat doesn\'t need to live on Rice Lake for us to service it. Cobourg customers trailer in for service all season. Routine work still requires an appointment, and completion timing is confirmed after the job is reviewed. For engine repairs we only service Mercury and Mercruiser.' },
      { question: 'Does HBW offer pickup or delivery for Cobourg customers?', answer: 'No. HBW does not offer pickup or delivery. Customers bring the boat to us. We have trailer parking on site for drop-offs.' },
      { question: 'Will HBW honour my Mercury warranty if I bought the motor elsewhere?', answer: 'Yes. The Mercury Canada warranty network honours coverage at any authorized Mercury dealer regardless of where the motor was originally purchased. Bring the purchase paperwork and we register the work in Mercury\'s central system.' },
    ],
    content: `## Quick Answer

Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 25 minutes north of Cobourg via County Road 18. We handle Mercury outboard sales, repowers, parts, and service. Cobourg is one of the closer markets to HBW, for many Cobourg addresses we're the nearest Mercury Premier dealer in any direction. Installed pricing is published online at mercuryrepower.ca. Family-owned since 1947, Mercury dealer since 1965.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

![Why Cobourg boaters drive to Harris Boat Works: about 25 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-cobourg-worth-the-drive.png)

## Cobourg has Lake Ontario shoreline, but most local boating happens north

The Cobourg waterfront has a real boating community, the harbour, the sailing club, the day-cruisers and small powerboats running out of the inner harbour. What it doesn't have, geographically, is a deep inland boating market within town limits. Most of Cobourg's serious recreational boating happens north, on Rice Lake and the Kawartha system, where the cottage country actually starts.

That's why Cobourg customers end up driving 25 minutes north to HBW more often than they end up driving 90 minutes west to a Toronto-area dealer. The boat is going to live north anyway. The dealer being north makes the logistics work.

## What Cobourg boaters typically use HBW for

The Cobourg customer pattern splits into two groups:

**The cottage owner**, has a place on Rice Lake or in the Kawarthas, keeps a boat there, drives up from Cobourg most weekends. Wants a dealer that knows the lake and isn't 90 minutes back into the GTA.

**The town-based boater**, keeps the boat in Cobourg or trailers from Cobourg, uses Lake Ontario or makes regular trips to the Kawartha system. Wants quality Mercury service that doesn't involve a road trip.

For both groups, the pattern is:

- Spring commissioning and launch prep
- Mid-season service (impellers, fuel system, SmartCraft diagnostics)
- [Repower decisions when the old motor is past mid-life](/blog/mercury-repower-cost-ontario-2026-cad)
- Fall winterization and storage
- Trade-in evaluations when upgrading

## The Mercury Premier factor

Cobourg has marinas. What it has less of is Mercury Premier dealer depth.

[Premier is Mercury's top dealer tier](/blog/best-mercury-dealer-ontario-hbw-difference). It reflects parts inventory depth, technical training, warranty authorization, and full SmartCraft diagnostic capability. For routine service, any qualified Mercury dealer can handle it. For a real repower or a complex warranty case, Premier-tier resolution paths matter.

The closer Cobourg dealers tend to be in lower Mercury tiers, or are non-Mercury shops. For warranty work on a newer Mercury, the dealer tier shows up in resolution speed.

## Getting to Harris Boat Works from Cobourg

Route: County Road 18 north from Cobourg, straight into Gores Landing. About as simple as a route gets, one road for most of the trip.

Approximate drive time: 25 minutes outside rush hour. From the Cobourg harbour or downtown, allow 25-30 minutes. From north Cobourg, it's closer to 20 minutes.

Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
Phone: 905-342-2153
Service requests: hbw.wiki/service
Motor pricing: mercuryrepower.ca

## What HBW handles for Cobourg customers

**Mercury outboard sales**
Full Mercury lineup: 2.5 HP through 600 HP Verado. FourStroke for most Cobourg boats (cruising, fishing, family use). Pro XS for performance applications. Verado is special-order territory and rarely the right answer for a Lake Ontario or Rice Lake boat under 21 feet.

**Repower service**
Full job: motor, rigging, controls, prop selection, installation, sea trial on Rice Lake. For Cobourg customers, the convenience of having the install done where the boat will spend most of its season is meaningful.

**Mercury parts and service**
Premier-tier parts depth and warranty authorization. SmartCraft diagnostics, complete service for current and recent Mercury outboards. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor winter storage with shrinkwrap. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. For Cobourg customers whose boat lives on Rice Lake during the season, keeping the boat at HBW through winter leaves it close to Rice Lake when we reopen in early April.

**Trailer-in service for Lake Ontario boats**
Cobourg customers whose boat lives on Lake Ontario can trailer up for major service. The route makes drop-off practical, but routine work still requires an appointment and a confirmed completion plan.

## What Cobourg buyers tell us most often

The most common Cobourg feedback we hear is about [the call-for-quote frustration at other dealers](/blog/why-mercury-dealers-hide-prices-online). Cobourg has a high concentration of informed buyers, people who've researched the motor they want, know the specifications, and just need a real number to compare. The phone-call-required pricing model frustrates this group the most.

Our quote builder at mercuryrepower.ca shows the selected configuration and current Canadian pricing without requiring a callback. The boat-specific written quote controls the final motor, rigging, labour, tax, trade-in, and financing figures. For [current Mercury outboard prices](/pricing-reference) across the lineup, see our published price list.

## What we see at HBW

An ongoing service relationship can be useful for Cobourg owners because the installing dealer can retain the rigging and service history. If the boat later needs a serial-specific part, confirm current inventory and the appointment before trailering it to Gores Landing.

The other thing we see specifically with Cobourg customers: many of them have already moved boat storage to the Rice Lake area because the Cobourg waterfront storage market is tight. Once the boat is already up here, HBW is the logical service shop.

## How to start

Build a starting quote at mercuryrepower.ca with current Canadian pricing. The written boat-specific quote controls the final scope and total.

If you have a service issue, submit a request at hbw.wiki/service. That routes directly to the right tech.

For a motor purchase conversation, call: 905-342-2153.

**Start from home:** build your itemized Mercury quote at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection), then pick up at Gores Landing.

## Frequently Asked Questions, Cobourg

**Is HBW the closest Mercury dealer to Cobourg?**
For most Cobourg addresses, yes, we're 25 minutes north via County Road 18. Closer dealers may exist for specific motor brands or general boat service, but for Mercury Premier-tier work, HBW is the nearest option.

**Do you service boats that live on Lake Ontario, not Rice Lake?**
Yes. The boat doesn't need to live on Rice Lake for us to service it. Cobourg customers trailer-in for service all season. For engine repairs, we only service Mercury and Mercruiser.

**Can I get the boat picked up and dropped off?**
HBW does NOT offer pickup or delivery, customers bring the boat to us. We have trailer parking on site for drop-offs.

**What's the typical repower cost from a Cobourg perspective?**
Depends on horsepower and current rigging. The quote builder at mercuryrepower.ca gives a real CAD installed number. Most repowers in the typical Cobourg boat range ($10,000-$25,000 hull value) land in the $13,000-$22,000 installed range.

**Can I store my boat with you through the winter?**
Yes. HBW offers outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. Physical service and customer access resume when we reopen in early April.

**Do you do warranty work on a Mercury I bought elsewhere?**
Yes. The Mercury Canada warranty network honours coverage at any authorized Mercury dealer regardless of where the motor was originally purchased. Bring the purchase paperwork; we register the work in Mercury's central system.

Harris Boat Works · Mercury Marine Premier Dealer · Mercury dealer since 1965 · Family-owned on Rice Lake since 1947 · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153

*Last reviewed: 2026-05-17.*

---
`,
  },
  {
    slug: 'mercury-dealer-port-hope-ontario-hbw',
    title: 'Mercury Dealer for Port Hope: 30 Minutes North to Rice Lake',
    seoTitle: 'Mercury Dealer Port Hope | Repower & Service from Rice Lake',
    description: 'Harris Boat Works is the closest Mercury Premier dealer for Port Hope, ~30 minutes north via County Road 18.',
    image: '/lovable-uploads/hero-mercury-dealer-port-hope.png',
    imageAlt: 'Man fly-fishing from a boat with a vintage Mercury outboard on a river, highlighting local service for Port Hope anglers.',
    author: 'Harris Boat Works',
    datePublished: '2026-05-17',
    dateModified: '2026-08-08',
    publishDate: '2026-05-17',
    category: 'Dealer Locations',
    readTime: '6 min read',
    keywords: ['mercury dealer port hope', 'port hope mercury outboard', 'ganaraska mercury dealer', 'northumberland mercury premier'],
    faqs: [
      { question: 'Is there a Mercury Premier dealer in Port Hope?', answer: 'Not within town limits. Harris Boat Works in Gores Landing is the closest Mercury Premier Dealer for Port Hope, approximately 30 minutes north via County Road 28 to County Road 18 east. For most Port Hope addresses we are the nearest Premier dealer in any direction.' },
      { question: 'How long is the drive from Port Hope to HBW?', answer: 'About 30 minutes outside rush hour. County Road 28 north from Port Hope through Garden Hill, then County Road 18 east into Gores Landing. Mostly rural county road, with the last 15 minutes through Rice Lake country. From the Port Hope waterfront, allow the full 30 minutes; from the Highway 401 area, slightly shorter.' },
      { question: 'Does HBW install Mercury 9.9 ProKickers for Port Hope salmon boats?', answer: 'Yes, we install a lot of them, especially for Port Hope and Cobourg anglers running a primary motor with a ProKicker for trolling control. A full install includes mounting, linkage to the primary throttle, electrical, and a steering tie-bar setup.' },
      { question: 'Will HBW service my Lake Ontario boat without me storing it on Rice Lake?', answer: 'Yes. The boat doesn\'t need to live on Rice Lake for us to service it. Many Port Hope customers trailer in for major service. For engine repairs we only service Mercury and Mercruiser.' },
      { question: 'Does HBW offer pickup or delivery for Port Hope boats?', answer: 'No. HBW does not offer pickup or delivery. Customers bring the boat to us. We have trailer parking on site for drop-offs.' },
    ],
    content: `## Quick Answer

Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 30 minutes north of Port Hope via County Road 28 north, then County Road 18 east to Gores Landing. We handle Mercury outboard sales, repowers, parts, and service. Port Hope is one of the closer markets to HBW, for most Port Hope addresses we're the nearest Mercury Premier dealer in any direction. Installed pricing is published online at mercuryrepower.ca.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

![Why Port Hope boaters drive to Harris Boat Works: about 30 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-port-hope-worth-the-drive.png)

## Port Hope has the Ganaraska River and Lake Ontario, but most local boating happens inland

Port Hope's waterfront is a working harbour with a smaller recreational boating community than Cobourg next door. The Ganaraska is a fishing destination (the salmon run is legendary) but it's not a powerboat river. Lake Ontario sailing and small powerboats use the harbour, but the deeper recreational boating market in this area runs north, Rice Lake, the Trent system, the Kawarthas.

That's why Port Hope Mercury customers tend to end up at HBW. The boat is going north anyway, and the Mercury dealer being north makes the math work.

## What Port Hope boaters typically use HBW for

The Port Hope customer pattern looks like Cobourg's, with more weight toward the cottage owner profile:

**The cottage owner**, has a property somewhere on Rice Lake or in the Kawarthas, keeps the boat at the cottage, drives up from Port Hope on weekends. Wants a dealer that knows the lake and is closer than the GTA.

**The salmon fisherman**, Ganaraska River runs serious salmon traffic in fall. Port Hope anglers who own a boat often have a second boat or trailer-portable rig for Lake Ontario or Rice Lake. [Mercury 9.9 ProKickers are common in this crowd](/blog/mercury-prokicker-rice-lake-fishing-guide).

**The town-based boater**, keeps the boat in Port Hope or trailers from town, mixes Lake Ontario and inland trips. Wants Mercury service that doesn't require a road trip into the GTA.

For all three groups, the pattern is:
- Spring commissioning
- Mid-season service (impellers, fuel system, SmartCraft work)
- [Repower decisions when the old motor is past mid-life](/blog/mercury-repower-cost-ontario-2026-cad)
- Fall winterization + storage
- Trade-in valuations when upgrading

## The Mercury Premier factor

Port Hope has a few general boat shops. What it doesn't have within town limits is a Mercury Premier dealer.

[Premier is Mercury's top dealer tier](/blog/best-mercury-dealer-ontario-hbw-difference), parts inventory depth, technical training, warranty authorization, full SmartCraft diagnostic equipment. For routine service (oil changes, props, basic seasonal work) any qualified Mercury dealer can handle it. For a real repower or a complex warranty case, the dealer tier shows up in resolution speed and parts availability.

For Port Hope customers with newer Mercury outboards under warranty, the closer Premier dealer typically wins the long-term service relationship.

## Getting to Harris Boat Works from Port Hope

Route: County Road 28 north from Port Hope through Garden Hill, then County Road 18 east to Gores Landing. Mostly rural county road. Last 15 minutes is scenic Rice Lake country.

Approximate drive time: 30 minutes outside rush hour. From the Port Hope waterfront, allow 30 minutes. From the Highway 401 area of Port Hope, slightly shorter.

Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
Phone: 905-342-2153
Service requests: hbw.wiki/service
Motor pricing: mercuryrepower.ca

## What HBW handles for Port Hope customers

**Mercury outboard sales**
Full Mercury lineup: 2.5 HP through 600 HP. For Port Hope customers, FourStroke covers most use cases (cruising, family fishing, pontoons, cottage boats). Pro XS for performance fishing or fast-running tournament setups. The Mercury 9.9 ProKicker is a Port Hope angler favourite, common on Lake Ontario salmon rigs and on Kawartha bass boats.

**Repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, install, lake test on Rice Lake. Every install gets water-tested before pickup.

**Mercury parts and service**
Premier-tier parts depth, warranty authorization, SmartCraft diagnostics. For engine repairs, we only service Mercury and Mercruiser.

**Winter storage**
Outdoor winter storage with shrinkwrap. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. For Port Hope customers whose boat already lives on Rice Lake or in the Kawarthas during the season, keeping the boat at HBW through winter leaves it close to Rice Lake when we reopen in early April.

**Trailer-in for Lake Ontario boats**
Port Hope customers with Lake Ontario boats can trailer up for major service. Half-hour drive each way works fine for routine maintenance.

## What Port Hope buyers typically ask first

The most common Port Hope question is about the difference between a "fast price quote" and a real installed cost. Other dealers will give a verbal motor-only number over the phone. We give the full installed cost, motor, rigging, controls, prop, install labour, HST, at mercuryrepower.ca. Real Canadian dollars. No phone tag required.

That transparency is what most Port Hope informed buyers respond to. The drive becomes worth it when the dealer treats the buyer like an adult who can read a number.

## What we see at HBW

The single most underrated benefit for Port Hope customers is the small-shop accountability. We're a 3-generation family marina on Rice Lake, when a Port Hope customer has a bad experience, word gets around fast. The Port Hope-to-Rice Lake recreational boating community is tight. Most of our Port Hope customers came in via referral from another Port Hope or Cobourg-area customer.

The other thing we see consistently: the Mercury 9.9 ProKicker installs are disproportionate from Port Hope addresses. Salmon fishermen and Kawartha anglers in Port Hope tend to know exactly what they want and just need a dealer that can install it cleanly.

## How to start

Build your quote at mercuryrepower.ca. Real installed CAD pricing in three minutes. For [real Mercury prices in Canadian dollars](/pricing-reference) on every model, see our published price list.

If you have a service issue, submit a request at hbw.wiki/service.

For a motor purchase conversation, call: 905-342-2153.

**Start from home:** build your itemized Mercury quote at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection), then pick up at Gores Landing.

## Frequently Asked Questions, Port Hope

**Is HBW the closest Mercury Premier dealer to Port Hope?**
For most Port Hope addresses, yes. We're 30 minutes north via County Road 28 and County Road 18. Closer non-Premier Mercury shops may exist; for Premier-tier service, HBW is the nearest option.

**Do you service Lake Ontario salmon boats, not just inland?**
Yes. The boat doesn't need to live on Rice Lake for us to service it. Many Port Hope customers trailer in for major service. For engine repairs, we only service Mercury and Mercruiser.

**Do you install Mercury 9.9 ProKickers?**
Yes, we install a lot of them, especially for Port Hope and Cobourg anglers running primary motors with a ProKicker for trolling control. Full install includes mounting, linkage to the primary throttle, electrical, and steering tie-bar setup.

**What's the typical Port Hope repower cost?**
Depends on horsepower and existing rigging. The quote builder at mercuryrepower.ca gives a real CAD installed number. Most repowers in our region land in the $13,000-$25,000 installed range including HST.

**Can I store my boat with you through the winter?**
Yes. HBW offers outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. Physical service and customer access resume when we reopen in early April.

**Do you offer pickup/delivery?**
No. HBW does NOT offer pickup or delivery. Customers bring their boat to us. We have trailer parking on site for drop-offs.

**Can I trade in my current boat or motor?**
Yes. Trade-in valuations are done in person at HBW. The Trade-In Value Guide at mercuryrepower.ca gives a starting estimate; the actual valuation happens when we see the boat.

Harris Boat Works · Mercury Marine Premier Dealer · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153

*Last reviewed: 2026-05-17.*

---
`,
  },
  {
    slug: 'mercury-dealer-lindsay-ontario-hbw',
    title: 'Mercury Dealer Lindsay Ontario HBW',
    seoTitle: 'Mercury Dealer Lindsay | Repower & Service from Rice Lake',
    description: 'Harris Boat Works is a Mercury Premier dealer 45 minutes southeast of Lindsay via Highway 35.',
    image: '/lovable-uploads/hero-mercury-dealer-lindsay.png',
    author: 'Harris Boat Works',
    datePublished: '2026-05-17',
    dateModified: '2026-08-08',
    publishDate: '2026-05-17',
    category: 'Dealer Locations',
    readTime: '6 min read',
    keywords: ['mercury dealer lindsay', 'kawartha lakes mercury', 'lindsay mercury premier', 'sturgeon lake mercury dealer'],
    faqs: [
      { question: 'Is there a Mercury Premier dealer in Lindsay?', answer: 'Not at full repower capacity within town. Harris Boat Works is a Mercury Marine Premier Dealer approximately 45 minutes southeast of Lindsay via Highway 35 south to Highway 7A east, then County Road 28 south to Gores Landing on Rice Lake. For Kawartha Lakes boaters wanting Premier-tier service, HBW is the closest option. Family-owned since 1947, Mercury dealer since 1965.' },
      { question: 'Is HBW worth the 45-minute drive for routine service?', answer: 'For routine oil changes and basic seasonal work, maybe not. For a major repower, a complex warranty case, or full SmartCraft Premier-tier diagnostics, the dealer tier matters more than the drive time. Many Lindsay customers also drop the boat off before a Trent-Severn cruise so it starts the trip in known-good condition.' },
      { question: 'Does HBW service MerCruiser sterndrives on Trent-Severn cruisers?', answer: 'Yes. We handle Mercury outboards and MerCruiser sterndrives, including full service, repair, and repower. For engine repairs we only service Mercury and Mercruiser; for other brands we will point you to the right specialist.' },
      { question: 'Can I store my boat at HBW through the winter if I am based in Lindsay?', answer: "Yes. HBW offers outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. Physical service and customer access resume when we reopen in early April." },
      { question: 'Does HBW install ProKickers on Sturgeon Lake fishing boats?', answer: 'Yes, the Mercury 9.9 ProKicker is common spec on Kawartha-area aluminum fishing boats. A full install includes mounting, throttle linkage, electrical, and tie-bar steering setup.' },
    ],
    content: `## Quick Answer

Harris Boat Works is a Mercury Marine Premier Dealer in Gores Landing on Rice Lake, approximately 45 minutes southeast of Lindsay via Highway 35 south to Highway 7A east, then County Road 28 south. We handle Mercury outboard sales, repowers, parts, and service. For Kawartha Lakes boaters, Lindsay is the regional hub, and HBW is the closest Mercury Premier dealer with full repower capacity. Installed pricing is published online at mercuryrepower.ca. Family-owned since 1947, Mercury dealer since 1965.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

![Why Lindsay boaters drive to Harris Boat Works: about 45 minutes to Gores Landing on Rice Lake for Mercury repower and service](/blog-visuals/mercury-dealer-lindsay-worth-the-drive.png)

## Lindsay is the Kawartha Lakes hub

Lindsay sits at the centre of the Kawartha Lakes region, with Sturgeon Lake to the north, the Scugog River running through town, and the Trent-Severn Waterway connecting it all. The local boating community is significant, fishing, cruising, cottagers, water sports, the full mix. Boats in this region tend to spend more days on the water per year than anywhere else in southern Ontario.

What Lindsay has less of is [Mercury Premier dealer depth with full repower capacity](/blog/best-mercury-dealer-ontario-hbw-difference). The closer dealers tend to be in lower Mercury tiers or are non-Mercury shops. For a major repower or a complex warranty case, the dealer tier matters.

## What Lindsay boaters typically use HBW for

The Lindsay customer pattern centers on serious cottage and fishing use:

**The Kawartha cottager**, has property on Sturgeon, Pigeon, or Buckhorn Lake, runs a 16-20 foot aluminum or pontoon. Wants a Mercury Premier shop that can handle the seasonal service routine without disrupting the cottage time.

**The serious angler**, Sturgeon Lake walleye and muskie fishing is legitimate. [Anglers running Pro XS or FourStroke setups](/blog/mercury-pro-xs-repower-rice-lake-kawartha-anglers) for tournament-grade work need dealer-tier diagnostics and parts depth that smaller shops don't carry.

**The cruise-boat owner**, Trent-Severn cruisers running 24-foot inboard/outboard or larger need a Mercury MerCruiser shop. HBW handles MerCruiser sterndrives as well as outboards.

For all three, the pattern is:
- Spring commissioning before opening day
- Mid-season service (impellers, fuel issues, SmartCraft diagnostics)
- Repower decisions when the old motor hits mid-life
- Fall winterization timed to lock-up
- Winter storage with spring launch already organized

## The Trent-Severn factor

[Many Lindsay boaters cruise the Trent-Severn](/blog/trent-severn-mercury-dealer-survival-guide-2026), through Bobcaygeon, Burleigh Falls, the Buckhorn locks, and down into Rice Lake. The lower Trent connects Rice Lake to the Kawartha system through the Hastings lock. That means a Lindsay-area boat that cruises the full Trent system is going to pass right by HBW anyway.

For Lindsay customers planning a major Trent-Severn cruise, dropping the boat at HBW for service before the trip means the boat starts the cruise in known-good condition and the dealer is in the network if anything comes up mid-trip.

## Getting to Harris Boat Works from Lindsay

Route: Highway 35 south through Pontypool, then Highway 7A east to Highway 115 south, then County Road 28 south to Gores Landing. Mostly two-lane highway with some county road for the last 15 minutes.

Approximate drive time: 45 minutes outside peak summer traffic. From east Lindsay or Bobcaygeon-area routes, allow closer to 50-55 minutes.

Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
Phone: 905-342-2153
Service requests: hbw.wiki/service
Motor pricing: mercuryrepower.ca

## What HBW handles for Lindsay customers

**Mercury outboard sales**
Full lineup: 2.5 HP through 600 HP. For Kawartha cottagers, FourStroke 90/115/150 covers most setups. For Sturgeon Lake muskie/walleye anglers, Pro XS 115-200 is the common spec. ProKicker 9.9 trolling motors install on most Lindsay-area fishing rigs.

**Repower service**
[Full repower including motor, rigging, controls](/blog/mercury-repower-cost-ontario-2026-cad), throttle and shift cables, prop matching, install, sea trial on Rice Lake. Lindsay customers can drop off, get the work done, and pick up commissioned and water-tested.

**MerCruiser sterndrive service**
For Trent-Severn cruisers with MerCruiser sterndrives, we handle full service, repair, and repower. For engine repairs, we only service Mercury and Mercruiser.

**Mercury parts and service**
Premier-tier parts depth, warranty authorization, SmartCraft diagnostics.

**Winter storage**
Outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. For Lindsay customers whose boat will launch on Rice Lake or cruise the lower Trent, keeping the boat at HBW through winter leaves it close to Rice Lake when we reopen in early April.

## What Lindsay buyers tell us most often

Lindsay-area boaters tend to be experienced. The Kawartha Lakes region has a higher concentration of multi-boat households and serious cottagers than most parts of southern Ontario. They've owned several boats, dealt with several dealers, and they know the call-for-quote pricing model when they see it.

Our installed pricing online at mercuryrepower.ca is what informed Lindsay buyers respond to. Real Canadian dollars, full configuration, three minutes to a complete quote. The 45-minute drive becomes worth it when the dealer respects your time. To [browse Mercury outboard prices](/pricing-reference) before you commit to building a quote, check our published price reference.

## What we see at HBW

The most underrated benefit for Lindsay customers is the seasonal storage relationship. A lot of cottagers run into the same problem in October: where to store the boat. The Kawartha-region storage market gets tight. HBW offers outdoor shrinkwrap storage with full winterization done by the same shop that knows the motor. Lindsay customers who set up that routine end up doing it for 5-10 years running.

The other observation: Lindsay-area cottagers often have older Mercury outboards (10-15 years) that are still running fine but starting to need attention. Repower vs continued service decisions are common conversations. The honest answer depends on the hull condition, but for a sound hull under 15 years old, a properly executed repower is usually the dollar-per-year winner.

## How to start

Build your quote at mercuryrepower.ca. Real installed CAD pricing in three minutes.

If you have a service issue, submit a request at hbw.wiki/service.

For a motor purchase or repower conversation, call: 905-342-2153.

**Start from home:** build your itemized Mercury quote at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection), then pick up at Gores Landing.

## Frequently Asked Questions, Lindsay

**Is HBW worth the 45-minute drive vs a closer Lindsay-area shop?**
For routine service (oil change, basic seasonal work), maybe not. For a major repower, complex warranty issue, or Premier-tier diagnostics, the dealer tier matters more than the drive time. The drive is also part of a nicer day out than most service trips.

**Do you service Trent-Severn cruisers and MerCruiser sterndrives?**
Yes. We service Mercury outboards and MerCruiser sterndrives. For engine repairs, we only service Mercury and Mercruiser.

**Do you install ProKickers on Sturgeon Lake fishing boats?**
Yes, common spec on Kawartha-area aluminum fishing boats. Full install includes mounting, throttle linkage, electrical, and tie-bar steering setup.

**What's a typical Kawartha-area repower cost?**
Depends on horsepower. Most repowers on 16-20 foot aluminum or pontoon hulls land in the $13,000-$25,000 installed range including HST. The quote builder at mercuryrepower.ca gives a real CAD number based on your boat.

**Can I drop off at HBW before a Trent-Severn cruise?**
Yes, many Lindsay customers do exactly that. Spring service before the cruising season, motor in known-good condition before a long trip, network coverage if anything comes up mid-trip.

**Can I store my boat with you through the winter?**
Yes. HBW offers outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. Physical service and customer access resume when we reopen in early April.

**Do you offer pickup/delivery?**
No. HBW does NOT offer pickup or delivery. Customers bring the boat to us. We have trailer parking on site.

Harris Boat Works · Mercury Marine Premier Dealer · Mercury dealer since 1965 · Family-owned on Rice Lake since 1947 · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153

*Last reviewed: 2026-05-17.*

---
`,
  },
  {
    slug: 'mercury-dealer-northumberland-county-hbw',
    title: 'Mercury Dealer Northumberland HBW',
    seoTitle: 'Mercury Dealer Northumberland County | HBW Rice Lake',
    description: 'Harris Boat Works is the Mercury Premier dealer in Northumberland County. Serving Rice Lake, Cobourg, Port Hope, Hastings, Brighton, and the Trent system.',
    image: '/lovable-uploads/blog-heroes-2026-07/hero-mercury-spring-run-up-hbw-service-2026-07.webp',
    imageAlt: 'Harris Boat Works technician installing and inspecting a Mercury outboard in the Gores Landing service shop',
    author: 'Harris Boat Works',
    datePublished: '2026-05-17',
    dateModified: '2026-08-08',
    publishDate: '2026-05-17',
    category: 'Dealer Locations',
    readTime: '5 min read',
    keywords: ['mercury dealer northumberland county', 'northumberland mercury premier', 'rice lake mercury dealer', 'trent system mercury'],
    faqs: [
      { question: 'Who is the Mercury dealer for Northumberland County?', answer: 'Harris Boat Works in Gores Landing is the Mercury Marine Premier Dealer serving Northumberland County. We are located on Rice Lake within the county itself, which means for residents of Cobourg, Port Hope, Hastings, Brighton, Colborne, Campbellford, and Trent Hills, we are not the closer option, we are the local Mercury dealer.' },
      { question: 'How far is HBW from each Northumberland community?', answer: 'Cobourg is about 25 minutes via County Road 18 south. Port Hope is 30 minutes via County Roads 18 and 28. Hastings is 25 minutes via County Road 9 east across the Trent. Campbellford is 35 minutes. Colborne is 35 minutes via Highway 401. Trent Hills is 30 minutes. Brighton is the furthest at about 50 minutes via the 401 east to County Road 64.' },
      { question: 'Does HBW service Bay of Quinte boats from Brighton?', answer: 'Yes. The 50-minute drive from Brighton works for major service and repowers. For routine work, the trip may be more than it is worth, and that is an honest call to make. For engine repairs we only service Mercury and Mercruiser.' },
      { question: 'Does HBW sell new boats in addition to Mercury motors?', answer: 'Yes. We are also a Legend Boats dealer, aluminum fishing boats and pontoons, all Mercury-rigged. Worth a conversation if you are in the new-boat market.' },
      { question: 'Will HBW handle warranty work on a Mercury bought elsewhere?', answer: 'Yes. The Mercury Canada warranty network honours coverage at any authorized Mercury dealer regardless of where the motor was originally purchased. Bring the purchase paperwork.' },
    ],
    content: `## Quick Answer

Harris Boat Works in Gores Landing is the Mercury Marine Premier Dealer serving Northumberland County. We're located on Rice Lake within Northumberland County, which means for residents of Cobourg, Port Hope, Hastings, Brighton, Colborne, Campbellford, and Trent Hills, we're not "the closer option", we ARE the local Mercury dealer. Installed pricing is published online at mercuryrepower.ca.


See [why boaters across Ontario choose Harris Boat Works](/blog/best-mercury-dealer-ontario-hbw-difference) for the full breakdown of our approach.

## What "local" means in Northumberland County

Northumberland County stretches from the Lake Ontario shore north to the Trent system, and includes a wide range of waterfront communities, Cobourg's harbour, Port Hope's Ganaraska, the Hastings lock at the bottom of Rice Lake, Brighton on Presqu'ile Bay, the Trent River through Campbellford. The county is one of the most water-connected regions in southern Ontario.

For Mercury outboard service, the county has historically been served by a mix of small general boat shops and dealers that focus on other brands. HBW provides Mercury sales and service right on Rice Lake at Gores Landing.

If you live anywhere in Northumberland County, HBW is your [local Mercury Premier dealer](/blog/best-mercury-dealer-ontario-hbw-difference).

## Coverage across the county

Drive time from HBW (Gores Landing) to each major Northumberland community:

| Community | Drive time | Route |
|---|---|---|
| Cobourg | 25 min | County Road 18 south |
| Port Hope | 30 min | County Road 18 + County Road 28 south |
| Hastings | 25 min | County Road 9 east + bridge over Trent |
| Brighton | 50 min | Highway 401 east to County Road 64 |
| Campbellford | 35 min | County Road 35 east |
| Colborne | 35 min | Highway 401 east |
| Trent Hills | 30 min | County Road 35 east |

Most of the county is within 30 minutes of HBW. None of it is more than an hour.

## What HBW handles for Northumberland customers

**Mercury outboard sales**
Full Mercury lineup: 2.5 HP portables through 600 HP Verado. For Northumberland's mixed boating profile (Lake Ontario harbour boats, Rice Lake fishing rigs, Trent system cruisers, cottage pontoons), FourStroke covers most use cases. Pro XS for performance fishing. ProKicker 9.9 for trolling.

**Mercury repower service**
Full job: motor, rigging, controls, throttle and shift cables, prop selection, install, lake test on Rice Lake. Northumberland customers can drop off, get the work done, and pick up commissioned.

**MerCruiser sterndrive service**
For Trent River and Lake Ontario cruisers with MerCruiser sterndrives, we handle full service, repair, and repower. For engine repairs, we only service Mercury and Mercruiser.

**Mercury parts and service**
Premier-tier parts depth, warranty authorization, SmartCraft diagnostics.

**Winter storage**
Outdoor winter storage with shrinkwrap. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. For Northumberland boaters who already boat on Rice Lake, [keeping the boat at HBW through winter](/blog/boat-storage-kawartha-lakes) leaves it close to Rice Lake when we reopen in early April.

**Legend Boats**
Aluminum fishing boats and pontoons. All Mercury-rigged. Worth a conversation if you're in the new-boat market.

## The Northumberland boating profile

Northumberland County has a wider range of boating than most Ontario counties:

**Lake Ontario harbour boats**, Cobourg, Port Hope, Brighton harbours. Smaller powerboats, sailing, day-cruising. Mercury 50-150 HP common.

**Rice Lake fishing and cottage boats**, the heart of recreational boating in the county. 14-18 foot aluminum, pontoons, Mercury 40-115 HP. Walleye, bass, muskie fishing.

**[Trent River and Trent-Severn cruisers](/blog/trent-severn-waterway-boating-guide-2026)**, larger boats running the lock system, often MerCruiser sterndrives or Mercury Verado-sized power.

**Bay of Quinte access from the east of the county**, Brighton-area boats accessing Bay of Quinte muskie fishing. Larger aluminum or fiberglass, Mercury Pro XS or FourStroke 150-250 HP.

This range is why HBW carries the full Mercury lineup and full SmartCraft diagnostic capability. The Northumberland service mix isn't dominated by one boat type.

## Why local matters more than dealer distance

In some markets, "local" is just a 5-kilometer marketing claim. In Northumberland, "local" is functional. The Northumberland boating community is small enough that a bad service experience travels by word of mouth fast. HBW is the dealer that picks up the phone when a Cobourg customer's neighbour calls because the original customer recommended us.

HBW is on Rice Lake inside Northumberland County. The shop's reputation depends on returning customers and referrals from local boaters.

## What we see at HBW

The Northumberland customer mix is more diverse than any other regional market we serve. A typical service week might include a Cobourg sailboat owner picking up parts, a Rice Lake cottager dropping off for fall winterization, a Brighton Bay of Quinte angler bringing a Pro XS in for an impeller, and a Trent River cruiser scheduling MerCruiser service. That mix is what makes Northumberland different from a more homogeneous GTA service market.

For repower decisions specifically, the most common Northumberland scenario we see: a 15-20 year old Mercury (often a 90 or 115 HP) on a 16-18 foot aluminum fishing boat. The motor still runs but is starting to need more attention. The owner asks "is repower worth it on this hull?" Our [Repower vs Buy New decision guide](/blog/repower-vs-new-boat) walks through the math. For Northumberland-area sound hulls under 15 years old, the answer is almost always "yes, repower wins."

## How to start

Build your quote at mercuryrepower.ca. Real installed CAD pricing. For [Mercury pricing without a quote](/pricing-reference), see our published price list.

If you have a service issue, submit a request at hbw.wiki/service.

For a motor purchase or [repower conversation](/blog/mercury-repower-cost-ontario-2026-cad), call: 905-342-2153.

**Start from home:** build your itemized Mercury quote at [mercuryrepower.ca/quote/motor-selection](/quote/motor-selection), then pick up at Gores Landing.

## Frequently Asked Questions, Northumberland County

**Is HBW the only Mercury Premier dealer in Northumberland County?**
Yes. For Mercury Premier-tier service within Northumberland County, HBW is the option. There may be lower-tier Mercury dealers or non-Mercury shops closer to specific addresses; for Premier-tier work, HBW is the local choice.

**Do you handle warranty work on a Mercury bought elsewhere?**
Yes. The Mercury Canada warranty network honours coverage at any authorized Mercury dealer regardless of where the motor was originally purchased. Bring the purchase paperwork.

**Do you service Bay of Quinte fishing boats from Brighton?**
Yes. The 50-minute drive from Brighton works for major service and repowers. For routine work, the trip may be more than it's worth, that's an honest call.

**Do you service Trent River cruisers in the Campbellford / Trent Hills area?**
Yes. We handle both Mercury outboards and MerCruiser sterndrives. For engine repairs, we only service Mercury and Mercruiser.

**What's the typical repower cost in Northumberland?**
Depends on horsepower and current rigging. The quote builder at mercuryrepower.ca gives a real CAD number. Most repowers in the typical Northumberland boat range land in the $13,000-$25,000 installed range including HST.

**Can I store my boat with you through the winter?**
Yes. HBW offers outdoor winter storage with shrinkwrap only. We don't offer indoor, heated, climate-controlled, summer, or year-round storage. Physical service and customer access resume when we reopen in early April.

**Do you offer pickup/delivery?**
No. HBW does NOT offer pickup or delivery. Customers bring their boat to us.

**Do you sell new boats?**
Yes. We're also a Legend Boats dealer, aluminum fishing boats and pontoons, all Mercury-rigged.

Harris Boat Works · Mercury Marine Premier Dealer · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153

*Last reviewed: 2026-05-17.*
`,
  },
];
