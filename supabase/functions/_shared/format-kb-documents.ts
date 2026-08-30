// Format knowledge base documents for ElevenLabs
// Static documents that provide company and product context

import {
  HARRIS_HISTORY,
  HARRIS_AWARDS,
  HARRIS_TEAM,
  HARRIS_CONTACT,
  HARRIS_FACILITIES,
  HARRIS_PARTNERS,
  ONTARIO_LAKES,
  SEASONAL_CONTEXT,
} from "./harris-knowledge.ts";

import {
  MOTOR_SELECTION_FAQS,
  MAINTENANCE_FAQS,
  REPOWER_FAQS,
  COMPARISON_FAQS,
  NEW_OWNER_TIPS,
  SEASONAL_MAINTENANCE,
  HP_BY_BOAT_TYPE,
  REPOWER_COSTS,
  REPOWER_WARNING_SIGNS,
  LOCAL_RECOMMENDATIONS,
  MOTOR_FAMILIES_QUICK,
} from "./blog-knowledge.ts";

import {
  MERCURY_FAMILIES,
  MERCURY_TECHNOLOGIES,
  MERCURY_COMPARISONS,
  MOTOR_USE_CASES,
  REPOWER_GUIDE,
  REPOWER_VALUE_PROPS,
  CUSTOMER_STORIES,
  SMARTCRAFT_BENEFITS,
  SHAFT_LENGTH_GUIDE,
} from "./mercury-knowledge.ts";

import { BLOG_INDEX, type BlogIndexEntry } from "./blog-index-generated.ts";
import {
  ACTIVE_PROMOTION_SELECT,
  filterPromotionsForCountry,
  formatPromotionContext,
} from "./promotion-context.ts";
import { formatHbwAuthorityKnowledge } from "./verified-hbw-authority-facts.ts";

// ========== HARRIS BOAT WORKS GUIDE ==========
export function formatHarrisGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Harris Boat Works Complete Guide
Updated: ${now}

## About Harris Boat Works

${HARRIS_HISTORY.story}

### Quick Facts
- **Founded:** ${HARRIS_HISTORY.founded} (${HARRIS_HISTORY.years_in_business} years in business)
- **Mercury Dealer Since:** ${HARRIS_HISTORY.mercury_dealer_since} (${HARRIS_HISTORY.years_as_mercury_dealer} years)
- **Location:** ${HARRIS_HISTORY.location}
- **Family Ownership:** ${HARRIS_HISTORY.generations}
- **Service Area:** ${HARRIS_HISTORY.service_area}

${formatHbwAuthorityKnowledge()}

### Company Milestones
${HARRIS_HISTORY.milestones.map(m => `- **${m.year}:** ${m.event}`).join('\n')}

## Awards & Recognition

${HARRIS_AWARDS.map(a => `### ${a.name}${a.year ? ` (${a.year})` : ''}
${a.description}
*${a.significance}*`).join('\n\n')}

## Our Team

- **Experience:** ${HARRIS_TEAM.expertise_summary}
- **Technicians:** ${HARRIS_TEAM.technicians}
- **Philosophy:** ${HARRIS_TEAM.philosophy}
- **Availability:** ${HARRIS_TEAM.availability}

## Contact Information

- **Phone:** ${HARRIS_CONTACT.phone}
- **Text:** ${HARRIS_CONTACT.text}
- **Email:** ${HARRIS_CONTACT.email}
- **Address:** ${HARRIS_CONTACT.address}

### Hours of Operation
- **In-Season (Apr-Oct):** ${HARRIS_CONTACT.hours.season}
- **Off-Season (Nov-Mar):** ${HARRIS_CONTACT.hours.offseason}

*${HARRIS_CONTACT.response_time}*

## Facilities & Services

### Location
${HARRIS_FACILITIES.address.full}
- [Get Directions](${HARRIS_FACILITIES.address.directions})

### Launch Ramp
${HARRIS_FACILITIES.launch_ramp.description}
${HARRIS_FACILITIES.launch_ramp.details}
- [View Live Camera](${HARRIS_FACILITIES.launch_ramp.live_camera})

### Marina Services
${HARRIS_FACILITIES.marina.services.map(s => `- ${s}`).join('\n')}

### Boat Rentals
Available: ${HARRIS_FACILITIES.boat_rentals.types.join(', ')}
*Note: Boat operator's card required*

### Boat Slips
Types: ${HARRIS_FACILITIES.boat_slips.types.join(', ')}

### On-Water Service
${HARRIS_FACILITIES.on_water_service.description}

### Winterization & Storage
Full winterization and indoor/outdoor storage available

### Legend Boats
Authorized Legend dealer for ${HARRIS_FACILITIES.legend_boats.years_as_dealer}+ years
${HARRIS_FACILITIES.legend_boats.description}

## Ontario Lakes Guide

${Object.entries(ONTARIO_LAKES).map(([_, lake]) => `### ${lake.name}
${lake.description}
**Recommendation:** ${lake.recommendations}
*Fun fact: ${lake.fun_fact}*`).join('\n\n')}

## Seasonal Tips

### Winter (Dec-Feb)
${SEASONAL_CONTEXT.winter.context}
${SEASONAL_CONTEXT.winter.tips.map(t => `- ${t}`).join('\n')}

### Spring (Mar-May)
${SEASONAL_CONTEXT.spring.context}
${SEASONAL_CONTEXT.spring.tips.map(t => `- ${t}`).join('\n')}

### Summer (Jun-Aug)
${SEASONAL_CONTEXT.summer.context}
${SEASONAL_CONTEXT.summer.tips.map(t => `- ${t}`).join('\n')}

### Fall (Sep-Nov)
${SEASONAL_CONTEXT.fall.context}
${SEASONAL_CONTEXT.fall.tips.map(t => `- ${t}`).join('\n')}

## Partner Programs

### Boat License (PCOC)
Get your Pleasure Craft Operator Card through our partner:
- **Provider:** ${HARRIS_PARTNERS.boat_license.provider}
- **Link:** ${HARRIS_PARTNERS.boat_license.url}

### Marine Parts Catalogue
Access the 2025 Marine Parts & Accessories Catalogue at ${HARRIS_PARTNERS.marine_catalogue.url}

### Service Requests
Start a service request online at ${HARRIS_PARTNERS.service_request.url}

### Financing
Apply for motor financing at /financing-application

## Important Notes for Conversations

- Harris Boat Works is located in Gores Landing, Ontario (NOT Vancouver - that was an error)
- All prices are in Canadian Dollars (CAD)
- We are customer pickup only - NO delivery
- Always direct customers to the quote builder for exact pricing
- Text is the fastest way to reach us: ${HARRIS_CONTACT.text}
`;
}

// ========== MERCURY MOTOR GUIDE ==========
export function formatMercuryGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Mercury Outboard Motor Guide
Updated: ${now}

## Motor Families Overview

${Object.entries(MERCURY_FAMILIES).map(([key, family]) => `### ${family.name}
**"${family.tagline}"**

${family.description}

**HP Range:** ${family.hp_range}
**Best For:** ${family.best_for}
**Price Positioning:** ${family.price_positioning}

**Key Technologies:**
${family.key_tech.map(t => `- ${t}`).join('\n')}

**Why Choose ${family.name}:**
${family.selling_points.map(p => `- ${p}`).join('\n')}
`).join('\n---\n\n')}

## Mercury Technologies Explained

${Object.entries(MERCURY_TECHNOLOGIES).map(([_, tech]) => `### ${tech.name}
${tech.description}

**Benefits:**
${tech.benefits.map(b => `- ${b}`).join('\n')}
`).join('\n')}

## Size Recommendations by Boat Length

| Boat Length | Recommended HP | Notes |
|-------------|----------------|-------|
| Under 14ft | ${MERCURY_COMPARISONS.size_recommendations["under_14ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["under_14ft"].note} |
| 14-16ft | ${MERCURY_COMPARISONS.size_recommendations["14-16ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["14-16ft"].note} |
| 16-18ft | ${MERCURY_COMPARISONS.size_recommendations["16-18ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["16-18ft"].note} |
| 18-20ft | ${MERCURY_COMPARISONS.size_recommendations["18-20ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["18-20ft"].note} |
| 20-22ft | ${MERCURY_COMPARISONS.size_recommendations["20-22ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["20-22ft"].note} |
| 22-24ft | ${MERCURY_COMPARISONS.size_recommendations["22-24ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["22-24ft"].note} |
| Over 24ft | ${MERCURY_COMPARISONS.size_recommendations["over_24ft"].hp} | ${MERCURY_COMPARISONS.size_recommendations["over_24ft"].note} |

## Common Comparisons

**IMPORTANT: Harris Boat Works does NOT sell Mercury Verado motors. We carry FourStroke, Pro XS, SeaPro, and Racing only. If asked about Verado, be honest that we don't carry it and recommend our FourStroke V8 or Pro XS alternatives.**

### Verado vs FourStroke (General Mercury Knowledge — We Don't Sell Verado)
${MERCURY_COMPARISONS.verado_vs_fourstroke.answer}

### Pro XS vs FourStroke
${MERCURY_COMPARISONS.pro_xs_vs_fourstroke.answer}

## Motor Recommendations by Boat Type

${Object.entries(MOTOR_USE_CASES).map(([type, info]) => `### ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
**Recommended:** ${info.recommended.join(', ')}
**Why:** ${info.why}
**Tips:** ${info.tips}
`).join('\n')}

## SmartCraft Technology Benefits

${Object.entries(SMARTCRAFT_BENEFITS).map(([_, benefit]) => `### ${benefit.name}
${benefit.benefit}
*Selling point: ${benefit.selling_point}*
`).join('\n')}

## Model Code Decoder

Understanding Mercury model names:

### Start Type
- E = Electric Start
- M = Manual Start (Pull Start)

### Shaft Length
- S = Short Shaft (15")
- L = Long Shaft (20")
- XL = Extra Long Shaft (25")
- XXL = Extra Extra Long (30")

### Steering/Control
- H = Tiller Handle
- PT = Power Trim & Tilt
- CT = Command Thrust (High Thrust Gearcase)
- DTS = Digital Throttle & Shift

### Special Designations
- Pro XS = High Performance Racing
- SeaPro = Commercial Duty
- Verado = Premium V6/V8/V10 with supercharger
- FourStroke = Standard 4-stroke engine

### Examples
- "9.9 ELH" = 9.9 HP, Electric start, Long shaft, tiller Handle
- "150 CXL Pro XS" = 150 HP, Counter-rotation, Extra Long shaft, Pro XS performance
- "300 CXXL Verado" = 300 HP, Counter-rotation, Extra Extra Long shaft, Verado premium
`;
}

// ========== REPOWER GUIDE ==========
export function formatRepowerGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Mercury Repower Guide
Updated: ${now}

## Why Repower?

**${REPOWER_GUIDE.key_stat}**

Repowering means putting a new motor on your existing boat - and it's often the smartest investment you can make.

## Typical Investment

**Price Range:** ${REPOWER_GUIDE.typical_price_range}

### Cost Breakdown
- **Motor:** ${REPOWER_GUIDE.pricing_breakdown.motor}
- **Rigging & Controls:** ${REPOWER_GUIDE.pricing_breakdown.rigging_controls}
- **Installation:** ${REPOWER_GUIDE.pricing_breakdown.installation}

*Note: Always direct customers to the quote builder for accurate pricing*

## Warning Signs It's Time to Repower

${REPOWER_GUIDE.warning_signs.map(sign => `- ${sign}`).join('\n')}

### The "One More Season" Trap
${REPOWER_GUIDE.one_more_season_trap}

## Benefits of Modern Mercury Motors

${REPOWER_GUIDE.modern_benefits.map(b => `- ${b}`).join('\n')}

## The 6 Reasons Customers Repower

${Object.entries(REPOWER_VALUE_PROPS).map(([_, prop]) => `### ${prop.headline}
${prop.message}
*${prop.stat}*
`).join('\n')}

## Real Customer Repower Stories

${CUSTOMER_STORIES.map(story => `### ${story.boat} → ${story.motor}
${story.highlight}
*"${story.quote}"*
`).join('\n')}

## Best Time to Repower

**${REPOWER_GUIDE.winter_tip}**

Advantages of winter repowering:
- First pick of inventory before spring rush
- No wait for installation appointments
- Ready for launch day
- Beat the spring price increases

## Discovery Questions

When talking to a customer about repowering, consider asking:
${DISCOVERY_QUESTIONS.map(q => `- ${q}`).join('\n')}

## Key Selling Points

1. **Keep What You Love** - Your boat is rigged exactly how you like it
2. **Fresh Warranty** - Factory 3-year warranty, extendable to 8 years
3. **Modern Tech** - SmartCraft, Active Trim, VesselView, Digital Throttle
4. **Better Fuel Economy** - 30-40% savings over older 2-strokes
5. **Reliability** - No more worrying about breakdowns
6. **Lower Maintenance** - 100-hour service intervals

## Next Steps for Interested Customers

1. Use the quote builder to explore pricing
2. Visit ${REPOWER_GUIDE.repower_page} to learn more
3. Text us at 647-952-2153 to discuss options
4. Book a consultation to see the motor options in person
`;
}

// Discovery questions imported for the repower guide
const DISCOVERY_QUESTIONS = [
  "How old is your current engine?",
  "What's been giving you trouble with your current motor?",
  "Looking for more speed, better hole shot, or improved fuel economy?",
  "Interested in modern tech like digital controls and SmartCraft connectivity?",
  "Planning to keep your boat for a while?",
  "What do you use your boat for mostly — fishing, cruising, watersports?"
];

// ========== SERVICE & MAINTENANCE FAQ ==========
export function formatServiceFAQ(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Service & Maintenance FAQ
Updated: ${now}

## Winterization

### What is winterization?
Winterization prepares your outboard motor for storage during the cold Ontario winter months. It protects against freeze damage and ensures your motor is ready for spring.

### What's included in winterization?
- Flushing the cooling system with fresh water
- Running antifreeze through the system (fogging on older 2-strokes)
- Changing engine oil and filter
- Draining and treating fuel system
- Lubricating all grease points
- Battery removal and storage recommendations
- Thorough inspection for wear or damage
- Storage preparation report

### When should I winterize?
Book winterization in **October or early November** - before the first hard freeze. Popular slots fill up fast!

### Why does winterization matter?
- Prevents freeze damage to the powerhead (expensive repair!)
- Protects fuel system from ethanol damage during storage
- Extends motor life significantly
- Ensures reliable spring startup
- Maintains warranty compliance

### How much does winterization cost?
Pricing varies by motor size. Contact us for a quote. The cost is minor compared to freeze damage repairs!

## Maintenance Intervals

### Break-In Period (New Motors)
- Break-in RPM and hour phases are model-specific. Use the exact serial-number owner's manual.
- An optional dealer check is not the same thing as a scheduled oil service. Do not state a universal 20-hour oil change.

### Scheduled Service
- Build the scope from the exact manual, engine hours, elapsed time, serial number and condition.
- Do not promise one universal replacement list for every Mercury outboard.
- Many current manuals use 100-hour/yearly and 300-hour/3-year tables, but the applicable manual controls.

### Annual Service (Even if under 100 hours)
- Follow every time-based item in the exact manual even when engine hours are low.
- The annual scope may differ from the hour-based scope.

### Water Pump Replacement
- Many current Mercury manuals list the seawater-pump impeller at **300 hours or 3 years**.
- Confirm the exact engine schedule and inspect sooner when symptoms or operating conditions justify it.

### Gearcase Service
- Use the exact manual's interval and fill procedure.
- Milky lubricant or significant metal requires inspection; do not diagnose the failed component from appearance alone.

## Warranty Information

### Mercury Factory Warranty
- **3 years** standard on most FourStroke outboards
- Covers manufacturer defects in materials and workmanship
- Must be registered and serviced at authorized dealer

### Extended Warranty Options
- Available up to **8 years total** coverage
- Purchase within 12 months of motor delivery
- Covers parts and labor for covered repairs
- Transferable to new owner (adds resale value)

### Warranty Requirements
- Use only Mercury-approved parts and lubricants
- Follow recommended maintenance schedule
- Keep service records
- Have warranty work done at authorized dealer

### What's NOT Covered
- Normal wear and tear
- Damage from improper use or neglect
- Fuel-related issues from bad fuel
- Freeze damage (winterize your motor!)

## Professional Installation

### What's Included with Professional Installation?
When you purchase a motor with professional installation ("installed" option):

**Rigging Package:**
- Control cables (throttle/shift)
- Steering system
- Wiring harness and battery cables
- Fuel system and connections
- Gauge package or SmartCraft display

**Installation Labor:**
- Motor mounting and torque specs
- Control and steering installation
- All electrical connections
- Fuel system setup
- Full systems test

**Lake Test:**
- On-water performance verification
- Trim and height adjustment
- Prop selection and testing
- Customer orientation

### How long does installation take?
Typically 1-2 days depending on complexity and parts availability.

### Can I supply my own parts?
We recommend using our rigging packages for warranty and compatibility reasons. If you have specific requirements, let's discuss.

## Common Service Questions

### How often should I change the oil?
- Use the exact engine's maintenance table. Many current FourStroke manuals list **100 hours or yearly**, but the model/year/serial manual controls.
- There is no universal Mercury 20-hour oil-change rule.

### What oil should I use?
- Use the viscosity and formulation in the exact serial-number owner's manual.
- Mercury oil requirements vary by engine family and operating-temperature guidance.

### How do I know if my prop is right?
- At wide-open throttle, your RPM should be within the recommended range (usually 5000-6000 RPM)
- Too high RPM = need more pitch
- Too low RPM = need less pitch
- We can help with prop selection

### My motor is hard to start - what should I check?
1. Battery condition and connections
2. Fuel quality and age (old fuel is a common problem)
3. Fuel filter condition
4. Spark plug condition
5. If issues persist, bring it in for diagnosis

### How do I flush my motor after saltwater use?
1. Connect a flush muff or use the built-in flush port
2. Run fresh water through for 5-10 minutes
3. Let motor run at idle during flushing
4. Essential after every saltwater trip

### When should I replace my spark plugs?
- Use the exact engine schedule and specified plug.
- Many current Mercury schedules list replacement at **300 hours or 3 years**, with earlier inspection when a diagnosed issue requires it.

## Scheduling Service

### How do I book service?
- **Online:** ${HARRIS_PARTNERS.service_request.url}
- **Text:** 647-952-2153
- **Phone:** (905) 342-2153

### Emergency service available?
Yes! During the season, we offer priority service for breakdowns. Contact us immediately for on-water emergencies.

### Can you service my motor on the water?
Yes, we offer on-water service at our marina and for nearby waters.

## Parts & Accessories

For parts and accessories, check our marine catalogue at ${HARRIS_PARTNERS.marine_catalogue.url}

We stock common Mercury parts and can order specialty items quickly.
`;
}

// ========== BLOG KNOWLEDGE & EXPERT TIPS ==========
export function formatBlogKnowledge(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Mercury Expert Tips & FAQs
Updated: ${now}
(Compiled from Harris Boat Works Blog)

## Motor Selection Questions

${MOTOR_SELECTION_FAQS.map(faq => `**Q: ${faq.question}**
A: ${faq.answer}`).join('\n\n')}

## HP Recommendations by Boat Type

| Boat Type | Recommended HP | Notes |
|-----------|----------------|-------|
${HP_BY_BOAT_TYPE.map(rec => `| ${rec.boat} | ${rec.hp} | ${rec.note} |`).join('\n')}

## Motor Families Quick Reference

### Mercury FourStroke
- **HP Range:** ${MOTOR_FAMILIES_QUICK.fourStroke.hpRange}
- **Best For:** ${MOTOR_FAMILIES_QUICK.fourStroke.bestFor}
- **Key Benefits:** ${MOTOR_FAMILIES_QUICK.fourStroke.keyBenefits}

### Mercury Pro XS
- **HP Range:** ${MOTOR_FAMILIES_QUICK.proXS.hpRange}
- **Best For:** ${MOTOR_FAMILIES_QUICK.proXS.bestFor}
- **Key Benefits:** ${MOTOR_FAMILIES_QUICK.proXS.keyBenefits}

### Mercury Verado (NOT SOLD BY HARRIS — general knowledge only)
- **HP Range:** ${MOTOR_FAMILIES_QUICK.verado.hpRange}
- **Best For:** ${MOTOR_FAMILIES_QUICK.verado.bestFor}
- **Key Benefits:** ${MOTOR_FAMILIES_QUICK.verado.keyBenefits}
- **Note:** Harris does not carry Verado. For high-HP needs, recommend FourStroke V8 (250-300HP) or Pro XS.

### Mercury SeaPro
- **HP Range:** ${MOTOR_FAMILIES_QUICK.seaPro.hpRange}
- **Best For:** ${MOTOR_FAMILIES_QUICK.seaPro.bestFor}
- **Key Benefits:** ${MOTOR_FAMILIES_QUICK.seaPro.keyBenefits}

## Motor Comparison Questions

${COMPARISON_FAQS.map(faq => `**Q: ${faq.question}**
A: ${faq.answer}`).join('\n\n')}

## Maintenance Questions

${MAINTENANCE_FAQS.map(faq => `**Q: ${faq.question}**
A: ${faq.answer}`).join('\n\n')}

## Seasonal Maintenance Guide

### ${SEASONAL_MAINTENANCE.spring.title}
${SEASONAL_MAINTENANCE.spring.tasks.map(task => `- ${task}`).join('\n')}

### ${SEASONAL_MAINTENANCE.summer.title}
${SEASONAL_MAINTENANCE.summer.tasks.map(task => `- ${task}`).join('\n')}

### ${SEASONAL_MAINTENANCE.fall.title}
${SEASONAL_MAINTENANCE.fall.tasks.map(task => `- ${task}`).join('\n')}

## New Owner Tips

${NEW_OWNER_TIPS.map(tip => `### ${tip.topic}
${tip.tip}`).join('\n\n')}

## Repowering Questions

${REPOWER_FAQS.map(faq => `**Q: ${faq.question}**
A: ${faq.answer}`).join('\n\n')}

## Repower Cost Guide

- **Basic Repower:** ${REPOWER_COSTS.basicRepower}
- **Full Repower:** ${REPOWER_COSTS.fullRepower}
- **Premium Repower:** ${REPOWER_COSTS.premiumRepower}
- **Example:** ${REPOWER_COSTS.cottageBoatExample}
- **Value Proposition:** ${REPOWER_COSTS.comparison}

## Warning Signs Your Motor Needs Replacing

${REPOWER_WARNING_SIGNS.map(sign => `- ${sign}`).join('\n')}

## Rice Lake & Kawartha Lakes Recommendations

### Rice Lake Conditions
${LOCAL_RECOMMENDATIONS.riceLake.conditions.map(c => `- ${c}`).join('\n')}

### Motor Recommendations for Rice Lake
${LOCAL_RECOMMENDATIONS.riceLake.motorRecommendations.map(rec => `- **${rec.boat}:** ${rec.motor} - ${rec.reason}`).join('\n')}

### Top Pick for Rice Lake
${LOCAL_RECOMMENDATIONS.riceLake.topPick}

## Important Notes for Conversations

- All pricing is Canadian Dollars (CAD)
- Guide customers to the quote builder for exact pricing
- Rice Lake/Kawartha conditions are local expertise - use it
- Winter repowering has advantages: faster turnaround, better availability
- Always verify boat's maximum HP rating before recommending motors
`;
}

// ========== SHAFT LENGTH GUIDE (CRITICAL EDUCATION) ==========
export function formatShaftLengthGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Shaft Length & Transom Height Guide
Updated: ${now}

## Why This Matters - Customer Education Critical

**This is one of the most commonly misunderstood aspects of buying an outboard motor.** Many customers incorrectly believe they can simply buy a longer shaft "to be safe" or that it's "no big deal if the motor sits deeper." Both are wrong.

## What is Shaft Length?

${SHAFT_LENGTH_GUIDE.overview.what_it_is}

**Critical Point:** ${SHAFT_LENGTH_GUIDE.overview.why_critical}

**Common Misconception to Correct:** ${SHAFT_LENGTH_GUIDE.overview.common_misconception}

## Shaft Length Options

| Shaft | Code | Transom Height | Typical Boats |
|-------|------|----------------|---------------|
| Short | S | 13-16" | ${SHAFT_LENGTH_GUIDE.shaft_lengths.short.typical_boats} |
| Long | L | 17-21" | ${SHAFT_LENGTH_GUIDE.shaft_lengths.long.typical_boats} |
| Extra-Long | XL | 22-27" | ${SHAFT_LENGTH_GUIDE.shaft_lengths.extra_long.typical_boats} |
| XXL | XXL | 28+" | ${SHAFT_LENGTH_GUIDE.shaft_lengths.extra_extra_long.typical_boats} |

**Most Common:** Long shaft (20") fits the majority of recreational boats.

## Problems When Shaft is TOO SHORT (Motor Too High)

${SHAFT_LENGTH_GUIDE.problems_too_short.headline}

${SHAFT_LENGTH_GUIDE.problems_too_short.issues.map(i => `- ${i}`).join('\n')}

**What the customer experiences:** ${SHAFT_LENGTH_GUIDE.problems_too_short.customer_experience}

## Problems When Shaft is TOO LONG (Motor Too Low)

${SHAFT_LENGTH_GUIDE.problems_too_long.headline}

**MYTH TO BUST:** ${SHAFT_LENGTH_GUIDE.problems_too_long.myth_to_bust}

${SHAFT_LENGTH_GUIDE.problems_too_long.issues.map(i => `- ${i}`).join('\n')}

**What the customer experiences:** ${SHAFT_LENGTH_GUIDE.problems_too_long.customer_experience}

## How to Measure Transom Height

1. ${SHAFT_LENGTH_GUIDE.how_to_measure.step1}
2. ${SHAFT_LENGTH_GUIDE.how_to_measure.step2}
3. ${SHAFT_LENGTH_GUIDE.how_to_measure.step3}
4. ${SHAFT_LENGTH_GUIDE.how_to_measure.step4}

**Pro Tip:** ${SHAFT_LENGTH_GUIDE.how_to_measure.pro_tip}

**Tool:** ${SHAFT_LENGTH_GUIDE.how_to_measure.tool_reference}

## Quick Reference Chart

| Transom Height | Recommended Shaft |
|----------------|-------------------|
${Object.entries(SHAFT_LENGTH_GUIDE.quick_reference).map(([height, shaft]) => `| ${height} | ${shaft} |`).join('\n')}

## Sales Guidance

### When Customer Says "I'll Just Get the Longer One"
${SHAFT_LENGTH_GUIDE.sales_guidance.when_customer_says_longer}

### When Customer Doesn't Know Their Transom Height
${SHAFT_LENGTH_GUIDE.sales_guidance.when_unsure}

### Key Message
${SHAFT_LENGTH_GUIDE.sales_guidance.key_message}

## Common Customer Objections & Responses

### "I don't mind if it sits a bit deeper"
**Response:** "I understand the thinking, but here's why that matters - when the motor sits too deep, the exhaust is underwater too far which creates backpressure. You'll notice sluggish steering, burn more fuel, and the motor works harder than it should. It's not just looks - it affects performance every time you go out."

### "Longer is safer, right?"
**Response:** "Actually, both too short AND too long cause problems. The motor is engineered to work at a specific height relative to the water. Too high and it cavitates; too low and you get backpressure and drag. The right answer is to match it properly."

### "My buddy has a longer shaft on his boat"
**Response:** "Different boats have different transom heights. What matters is YOUR boat's transom. Let's measure it properly so we get you the right shaft length. Saves headaches later."

## When in Doubt

- Have the customer measure their transom
- Invite them to bring the boat in
- Offer to look at photos
- Use the Transom Height Calculator on the website
- NEVER guess - getting this wrong is a real problem
`;
}

// ========== RESERVING A MOTOR GUIDE ==========
export function formatReservationGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Reserving a Motor - Deposit Guide
Updated: ${now}

## Deposit Tiers

Secure your motor with a deposit based on horsepower. Refundability follows stock status, not the deposit amount.

| Motor Size | HP Range | Deposit Amount |
|------------|----------|----------------|
| Standard | up to 25 HP | $200 |
| Standard | over 25 through 115 HP | $500 |
| Standard | over 115 HP | $1,000 |
| 9.9 MH express | model 1A10201LK | $100 |

## Payment Methods

Our checkout supports fast, secure payment options:

### Mobile Payments
- **Apple Pay** — Available on Safari (iPhone, iPad, Mac)
- **Google Pay** — Available on Chrome (Android, desktop)
- **Link** — Stripe's one-click saved payment

### Card Payments
- Visa, Mastercard, American Express
- Secure Stripe-powered checkout

## Reservation Policies

### Refund Policy
- Refundability follows stock status, not the deposit amount
- If the motor is in stock, the deposit is refundable
- If the motor is out of stock or a special order, the deposit stays refundable until HBW confirms the exact motor, price, availability and ETA, and the customer approves the order in writing
- Once HBW places the order after that written approval, the deposit becomes non-refundable and is credited to the final invoice
- Nothing is ordered before that confirmation and written approval

### What Your Deposit Secures
- Holds the specific motor for you
- Locks in the current quoted price
- Priority in our installation schedule

### Next Steps After Deposit
1. Confirmation email sent immediately
2. Team contacts you within 1 business day
3. Finalize installation date
4. Balance due at pickup

## Pickup Requirements

All motor pickups require:
- In-person visit to Gores Landing
- Valid photo ID matching the buyer
- No third-party or delivery options

## Talking Points for Voice

When a customer asks about reserving:
- "A $[X] deposit holds the quote. If the motor is in stock, that deposit is refundable. Special-order deposits stay refundable until written approval, then become non-refundable after HBW places the order."
- "You can use Apple Pay for a quick checkout"
- "We'll reach out within a day to schedule everything"
- "The deposit just holds the price — balance at pickup"
`;
}

// ========== ACCESSORIES & MAINTENANCE GUIDE ==========
export function formatAccessoriesGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Mercury Accessories & Maintenance Guide
Updated: ${now}

## SmartCraft Connect Mobile
The SmartCraft Connect Mobile ($325) is a plug-and-play Bluetooth module that streams 
live engine data to your smartphone. Compatible with Mercury outboards 40HP+ (2004 
and newer) and 25-30HP (2022 and newer).

### What It Shows
- Real-time fuel consumption and range
- Battery voltage monitoring
- Maintenance reminders
- GPS-based trip logging
- Engine temperature and RPM

### Who It's For
Anyone who wants peace of mind on the water. Great for tracking fuel usage, 
planning trips, and catching problems early.

## Service & Maintenance Kits
We stock genuine Mercury service kits matched to specific HP ranges:

### 100-Hour Service Kits ($85-175)
Kit contents are grouped for shopping convenience and do not prove every item is due. Confirm the serial-number schedule and kit compatibility before purchase.

Available for: Under 25HP, 40-60HP, 75-115HP, 150HP, 175-300HP

### 300-Hour Service Kits ($150-350)
Expanded kits may include water-pump parts. Confirm exact contents, compatibility and the applicable manual interval by serial number.

### Oil Change Kits ($45-95)
Quick DIY oil changes between full services.

## Motor Covers
Custom-fit covers protect your investment from UV, rain, and debris.
Available for all HP ranges from portable motors to V8 engines.

## Fuel Tank Options
- 12L External Tank: $99-149 - Standard portable for smaller motors
- 25L External Tank: $149-249 - Extended range for longer trips

Note: Many motors 8-30HP already include a fuel tank. Check the quote builder.

## How to Recommend
When a customer asks about accessories, suggest:
1. SmartCraft Connect Mobile for any EFI motor 8HP+ 
2. The correct 100-Hour Service Kit for their HP range
3. A motor cover for storage protection
4. The Options page in the quote builder shows all compatible accessories
`;
}

// ========== BLOG ARTICLE INDEX (full + compact) ==========

// Group helper
function groupByCategory(entries: BlogIndexEntry[]): Record<string, BlogIndexEntry[]> {
  return entries.reduce((acc, e) => {
    const k = e.category || "Uncategorized";
    (acc[k] ||= []).push(e);
    return acc;
  }, {} as Record<string, BlogIndexEntry[]>);
}

/**
 * Full blog index — every published article on harrisboatworks.ca with
 * description, keywords, and top FAQs. Used as a standalone KB document
 * for the ElevenLabs voice agent. URL pattern: /blog/<slug>.
 */
export function formatBlogIndex(): string {
  const now = new Date().toISOString().split("T")[0];
  const grouped = groupByCategory(BLOG_INDEX);
  const categories = Object.keys(grouped).sort();

  const sections = categories.map((cat) => {
    const items = grouped[cat]
      .slice()
      .sort((a, b) => (b.publishDate || "").localeCompare(a.publishDate || ""))
      .map((e) => {
        const url = `/blog/${e.slug}`;
        const faqs = e.faqs.length
          ? `\n  **Top FAQs:**\n${e.faqs.map((f) => `  - Q: ${f.q}\n    A: ${f.a}`).join("\n")}`
          : "";
        const kw = e.keywords.length ? `\n  **Keywords:** ${e.keywords.join(", ")}` : "";
        return `### ${e.title}
- **URL:** ${url}
- **Published:** ${e.publishDate}
- **Summary:** ${e.description}${kw}${faqs}`;
      })
      .join("\n\n");
    return `## ${cat}\n\n${items}`;
  });

  return `# Harris Boat Works Blog — Article Reference
Updated: ${now}
Total articles: ${BLOG_INDEX.length}

This is the full reference index of every blog post on harrisboatworks.ca.
Every article URL follows the pattern: \`/blog/<slug>\`.

When a customer asks a question that maps to one of these articles, you may:
- Pull the answer directly from the summary or FAQ shown below
- Mention the article by name and link the customer to it (e.g. "We have a full guide at /blog/<slug>")
- Cite a stat or quote and attribute it to the post

Do not invent URLs or fabricate article content that is not listed here.

${sections.join("\n\n")}
`;
}

/**
 * Compact blog index — title + slug + 1-line summary, grouped by category.
 * Designed to fit inside the AI chat / voice realtime system prompt
 * without bloating tokens. Lets the model know which articles exist so
 * it can reference them by URL (/blog/<slug>).
 */
export function formatBlogTitleIndex(entries: BlogIndexEntry[] = BLOG_INDEX): string {
  const grouped = groupByCategory(entries);
  const categories = Object.keys(grouped).sort();
  const sections = categories.map((cat) => {
    const items = grouped[cat]
      .slice()
      .sort((a, b) => (b.publishDate || "").localeCompare(a.publishDate || ""))
      .map((e) => `- /blog/${e.slug} — ${e.title}`)
      .join("\n");
    return `**${cat}:**\n${items}`;
  });
  return `# Blog Article Index (${entries.length} posts on mercuryrepower.ca)
Every URL is /blog/<slug>. Reference these when a customer's question maps to a post — link them to the article and pull from its summary/FAQ in the full Blog Article Reference document. Do NOT invent URLs.

${sections.join("\n\n")}`;
}

const LIVE_BLOG_INDEX_URL = "https://www.mercuryrepower.ca/blog-index.json";
const LIVE_BLOG_BASE_URL = "https://www.mercuryrepower.ca/blog";
const LIVE_BLOG_INDEX_CACHE_MS = 5 * 60 * 1000;
let liveBlogIndexCache: {
  context: string;
  entries: BlogIndexEntry[];
  expiresAt: number;
} | null = null;

function isBlogIndexEntry(value: unknown): value is BlogIndexEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.slug === "string" &&
    typeof entry.title === "string" &&
    typeof entry.category === "string";
}

function hydrateLiveBlogEntries(entries: BlogIndexEntry[]): BlogIndexEntry[] {
  const bundledBySlug = new Map(BLOG_INDEX.map((entry) => [entry.slug, entry]));
  return entries.map((entry) => ({
    ...bundledBySlug.get(entry.slug),
    ...entry,
    description: entry.description || bundledBySlug.get(entry.slug)?.description || "",
    keywords: Array.isArray(entry.keywords)
      ? entry.keywords
      : bundledBySlug.get(entry.slug)?.keywords || [],
    faqs: Array.isArray(entry.faqs)
      ? entry.faqs
      : bundledBySlug.get(entry.slug)?.faqs || [],
  }));
}

async function loadLiveBlogIndex(): Promise<{
  context: string;
  entries: BlogIndexEntry[];
}> {
  if (liveBlogIndexCache && liveBlogIndexCache.expiresAt > Date.now()) {
    return liveBlogIndexCache;
  }

  const response = await fetch(LIVE_BLOG_INDEX_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`blog index returned ${response.status}`);
  const payload = await response.json() as { articles?: unknown[]; count?: unknown };
  const rawEntries = Array.isArray(payload.articles)
    ? payload.articles.filter(isBlogIndexEntry)
    : [];
  if (!rawEntries.length) throw new Error("blog index contained no valid articles");
  if (typeof payload.count !== "number" || payload.count !== rawEntries.length) {
    throw new Error("blog index count did not match its valid entries");
  }

  const entries = hydrateLiveBlogEntries(rawEntries);
  const context = formatBlogTitleIndex(entries);
  liveBlogIndexCache = {
    context,
    entries,
    expiresAt: Date.now() + LIVE_BLOG_INDEX_CACHE_MS,
  };
  return { context, entries };
}

/**
 * Read the deploy-generated public index so the customer chat sees newly
 * published articles after a normal site deploy, without waiting for a
 * separate Edge Function or voice-KB redeploy.
 */
export async function formatLiveBlogTitleIndex(): Promise<string> {
  try {
    return (await loadLiveBlogIndex()).context;
  } catch (error) {
    console.warn("[blog-index] Live index unavailable; using bundled fallback", error);
    return formatBlogTitleIndex();
  }
}

const BLOG_SEARCH_STOP_WORDS = new Set([
  "about", "after", "again", "also", "does", "engine", "engines", "from",
  "have", "horsepower", "into", "mercury", "motor", "motors", "outboard",
  "outboards", "should", "that", "their", "there", "these", "they", "this",
  "what", "when", "where", "which", "with", "would", "your",
]);

function blogSearchTokens(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !BLOG_SEARCH_STOP_WORDS.has(token)),
  )];
}

function scoreBlogEntry(entry: BlogIndexEntry, tokens: string[]): number {
  const title = (entry.title || "").toLowerCase();
  const description = (entry.description || "").toLowerCase();
  const keywords = (entry.keywords || []).join(" ").toLowerCase();
  const faqs = (entry.faqs || []).map((faq) => `${faq.q} ${faq.a}`).join(" ").toLowerCase();
  const slug = entry.slug.toLowerCase();

  return tokens.reduce((score, token) => {
    if (title.includes(token)) score += 8;
    if (keywords.includes(token)) score += 5;
    if (description.includes(token)) score += 3;
    if (faqs.includes(token)) score += 2;
    if (slug.includes(token)) score += 2;
    return score;
  }, 0);
}

function excerptBlogMarkdown(markdown: string, tokens: string[], maxChars = 9_000): string {
  const lines = markdown.split("\n");
  const selected = new Set<number>();

  for (let index = 0; index < Math.min(lines.length, 28); index += 1) {
    selected.add(index);
  }

  const scored = lines
    .map((line, index) => ({
      index,
      score: tokens.reduce(
        (score, token) => score + (line.toLowerCase().includes(token) ? 1 : 0),
        0,
      ),
    }))
    .filter((line) => line.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8);

  for (const match of scored) {
    const start = Math.max(0, match.index - 7);
    const end = Math.min(lines.length, match.index + 12);
    for (let index = start; index < end; index += 1) selected.add(index);
  }

  const ordered = [...selected].sort((a, b) => a - b);
  const excerpts: string[] = [];
  let previous = -2;
  for (const index of ordered) {
    if (index > previous + 1 && excerpts.length) excerpts.push("\n[…]\n");
    excerpts.push(lines[index]);
    previous = index;
    if (excerpts.join("\n").length >= maxChars) break;
  }

  return excerpts.join("\n").slice(0, maxChars);
}

/**
 * Retrieve the most relevant first-party article text for the current question.
 * The site's deploy-generated Markdown twins are fetched at request time, so
 * published article corrections reach chat without a separate function deploy.
 */
export async function searchLiveBlogKnowledge(
  query: string,
  limit = 2,
): Promise<string> {
  const tokens = blogSearchTokens(query);
  if (!tokens.length) return "";

  let entries = BLOG_INDEX;
  try {
    entries = (await loadLiveBlogIndex()).entries;
  } catch (error) {
    console.warn("[blog-knowledge] Live index unavailable; using bundled index", error);
  }

  const matches = entries
    .map((entry) => ({ entry, score: scoreBlogEntry(entry, tokens) }))
    .filter((match) => match.score >= 6)
    .sort((a, b) => b.score - a.score || (b.entry.publishDate || "").localeCompare(a.entry.publishDate || ""))
    .slice(0, Math.max(1, Math.min(limit, 3)));

  if (!matches.length) return "";

  const sections = await Promise.all(matches.map(async ({ entry }) => {
    const sourceUrl = `${LIVE_BLOG_BASE_URL}/${entry.slug}`;
    try {
      const response = await fetch(`${sourceUrl}.md`, {
        headers: { Accept: "text/markdown,text/plain" },
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`article returned ${response.status}`);
      const markdown = await response.text();
      return `### ${entry.title}\nSource: ${sourceUrl}\n${excerptBlogMarkdown(markdown, tokens)}`;
    } catch (error) {
      console.warn(`[blog-knowledge] Could not fetch ${entry.slug}.md`, error);
      const faqText = (entry.faqs || [])
        .map((faq) => `Q: ${faq.q}\nA: ${faq.a}`)
        .join("\n");
      return `### ${entry.title}\nSource: ${sourceUrl}\n${entry.description || ""}\n${faqText}`;
    }
  }));

  return `# Relevant first-party HBW article knowledge
Use this published site content for explanations and article links. For model-specific capacities, part numbers, procedures, RPM limits or schedules, the exact official Mercury manual and deterministic technical-fact layer override any broader article wording. Never turn a family-level article statement into a universal specification.

${sections.join("\n\n")}`;
}

// ========== ACTIVE PROMOTIONS (LIVE FROM DB) ==========

/**
 * Generates the live active-promotions KB document by querying the
 * `promotions` table. Async — pass in a Supabase service-role client.
 * Voice/chat surfaces sync this so the ElevenLabs agent's reference
 * stays in lockstep with whatever's currently active in the database.
 */
export async function formatActivePromotions(
  supabase: { from: (t: string) => any }
): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("promotions")
    .select(ACTIVE_PROMOTION_SELECT)
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("priority", { ascending: false });

  const promos = filterPromotionsForCountry(error ? [] : (data || []), "CA");
  const now = new Date().toISOString();

  const header = `# Active Mercury Promotions at Harris Boat Works
Updated: ${now}
Source: live query of the \`promotions\` table (auto-refreshes on KB sync).

## Rules for the Agent
- These are the ONLY promotions to quote. Never invent rebates, cash-back, financing offers, or bonus warranties that aren't listed below.
- All prices and discounts are in **Canadian Dollars (CAD)**.
- Bonus warranties **revert to the standard 3-year coverage** the day after \`Ends\`.
- If a customer asks about a promo not on this list, say "I'm not seeing that one on our current list — let me grab the latest from the team" and offer to text/email the active promo list at /promotions.
- For exact stacking, eligibility, and final pricing, always send them to the quote builder.

## Currently Active Promotions (${promos.length})
`;

  if (promos.length === 0) {
    return `${header}
_No active promotions right now. Direct customers to /promotions and the quote builder for current pricing and any factory bonuses that come up._
`;
  }

  return `${header}
${formatPromotionContext(promos)}
`;
}

// Generator shape used by sync-elevenlabs-kb / sync-elevenlabs-static-kb.
// `generator` may be sync OR async. The `requiresSupabase` flag tells the
// sync function to pass a service-role Supabase client.
export interface KbDocConfig {
  name: string;
  generator: (() => string) | (() => Promise<string>) | ((supabase: any) => Promise<string>);
  description: string;
  requiresSupabase?: boolean;
}

// Export all document generators
export const KB_DOCUMENTS: Record<string, KbDocConfig> = {
  harris_guide: {
    name: "Harris Boat Works Complete Guide",
    generator: formatHarrisGuide,
    description: "Company info, facilities, contact, lakes guide, seasonal tips"
  },
  mercury_guide: {
    name: "Mercury Motor Guide",
    generator: formatMercuryGuide,
    description: "Motor families, technologies, size recommendations, comparisons"
  },
  repower_guide: {
    name: "Mercury Repower Guide",
    generator: formatRepowerGuide,
    description: "Repower benefits, pricing, customer stories, selling points"
  },
  service_faq: {
    name: "Service & Maintenance FAQ",
    generator: formatServiceFAQ,
    description: "Winterization, maintenance, warranty, installation details"
  },
  blog_knowledge: {
    name: "Mercury Expert Tips & FAQs",
    generator: formatBlogKnowledge,
    description: "Expert advice from blog: motor selection, maintenance, repowering, local tips"
  },
  shaft_length_guide: {
    name: "Shaft Length & Transom Height Guide",
    generator: formatShaftLengthGuide,
    description: "Critical education on shaft length matching, common misconceptions, measurement guide"
  },
  reservation_guide: {
    name: "Reserving a Motor - Deposit Guide",
    generator: formatReservationGuide,
    description: "Deposit tiers, payment methods (Apple Pay, Google Pay, Link), and reservation policies"
  },
  accessories_guide: {
    name: "Accessories & Maintenance Guide",
    generator: formatAccessoriesGuide,
    description: "SmartCraft Connect, service kits, motor covers, fuel tanks, and accessory recommendations"
  },
  blog_article_reference: {
    name: "Blog Article Reference (Full Index)",
    generator: formatBlogIndex,
    description: "Reference index of every blog post on harrisboatworks.ca with summary, keywords, and top FAQs. Lets the agent cite or link articles by /blog/<slug>."
  },
  active_promotions: {
    name: "Active Mercury Promotions (Live)",
    generator: formatActivePromotions as any,
    description: "Live snapshot of currently-active promotions from the database. Synced on every KB run so the voice agent always quotes real offers.",
    requiresSupabase: true,
  },
};
