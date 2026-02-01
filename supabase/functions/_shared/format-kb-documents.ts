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
- **Discount:** ${HARRIS_PARTNERS.boat_license.discount_amount} with code ${HARRIS_PARTNERS.boat_license.discount_code}
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

### Verado vs FourStroke
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
- **First 20 hours:** Vary RPM, avoid sustained full throttle
- **20-hour service:** Change oil and filter, inspection (usually included with purchase)

### 100-Hour Service
- Oil and filter change
- Gearcase oil change
- Inspect and replace spark plugs if needed
- Fuel filter replacement
- Inspect water pump
- Check and adjust valves (if applicable)
- Full systems inspection

### Annual Service (Even if under 100 hours)
- Same as 100-hour service
- Recommended even with low hours due to time-based wear
- Schedule before the boating season begins

### Water Pump Replacement
- **Every 300 hours or 3 years** (whichever comes first)
- Critical for cooling system health
- Don't skip this - overheating damage is expensive

### Gearcase Service
- Change gearcase oil every **100 hours or annually**
- Inspect for water intrusion (milky oil = problem)
- Replace seals as needed

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
- Every **100 hours** or **annually** (whichever comes first)
- More frequently for commercial use
- Always use Mercury-approved marine oil

### What oil should I use?
- Mercury 4-Stroke Marine Oil (10W-30 for most applications)
- Mercury Full Synthetic for high-performance or Verado
- Never use automotive oil

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
- Every **100 hours** or as part of annual service
- Sooner if experiencing starting issues or rough running
- Use only Mercury-approved plugs

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

### Mercury Verado
- **HP Range:** ${MOTOR_FAMILIES_QUICK.verado.hpRange}
- **Best For:** ${MOTOR_FAMILIES_QUICK.verado.bestFor}
- **Key Benefits:** ${MOTOR_FAMILIES_QUICK.verado.keyBenefits}

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

Secure your motor with a refundable deposit based on horsepower:

| Motor Size | HP Range | Deposit Amount |
|------------|----------|----------------|
| Portable | 0-25 HP | $200 |
| Mid-Range | 30-115 HP | $500 |
| High-Power | 150+ HP | $1,000 |

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
- Deposits are **fully refundable** if you change your mind
- No restocking fees or penalties
- Refund processed within 5-7 business days

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
- "A $[X] deposit locks it in, and it's fully refundable"
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
Contains everything for the 100-hour service interval:
- Engine oil and filter
- Gearcase oil
- Spark plugs
- Fuel filter

Available for: Under 25HP, 40-60HP, 75-115HP, 150HP, 175-300HP

### 300-Hour Service Kits ($150-350)
Same as 100-hour PLUS water pump impeller and gaskets.
Recommended every 300 hours or 3 years.

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

// Export all document generators
export const KB_DOCUMENTS = {
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
  }
};
