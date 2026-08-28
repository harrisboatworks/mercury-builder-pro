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
];
