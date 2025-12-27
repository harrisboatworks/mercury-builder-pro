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
  MERCURY_FAMILIES,
  MERCURY_TECHNOLOGIES,
  MERCURY_COMPARISONS,
  MOTOR_USE_CASES,
  REPOWER_GUIDE,
  REPOWER_VALUE_PROPS,
  CUSTOMER_STORIES,
  SMARTCRAFT_BENEFITS,
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
  }
};
