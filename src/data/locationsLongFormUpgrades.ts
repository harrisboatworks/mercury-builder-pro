// Standards upgrade for the 4 EXISTING location pages (Bucket 2 Batch 3, May 2026).
// Slugs and URLs are unchanged. Adds the same long-form treatment as the 11 new
// location pages (hero image, Quick answer, Last reviewed, Key facts, body
// sections, FAQs, What we see at HBW, Visit, Related). Copy is verbatim from
// the SEO brief. No em dashes.

import type { LocationLongForm } from './locationsLongForm';

const VISIT =
  "Harris Boat Works · 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0 · Phone (905) 342-2153 · Family-owned since 1947 · Mercury Premier Dealer, selling Mercury since 1965.\n\nWe're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.";

export const LOCATION_LONGFORM_UPGRADES: Record<string, LocationLongForm> = {
  'rice-lake-mercury-repower': {
    h1: 'Harris Boat Works - Mercury Repower Centre',
    lastReviewed: '2026-06-02',
    quickAnswer:
      "Harris Boat Works is the Mercury repower shop on Rice Lake, in Gores Landing on the south shore. We're a Mercury Premier Dealer, family-owned since 1947. Every motor we rig is water-tested on Rice Lake itself before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    intro:
      "Harris Boat Works sits on the south shore of Rice Lake at 5369 Harris Boat Works Rd in Gores Landing, ON. We're the lake's Mercury Premier Dealer, selling Mercury since 1965 and a family-owned repower shop since 1947. If your boat already lives on Rice Lake, your Mercury repower starts and ends on the same water. We quote, rig, install, and water-test every job on Rice Lake before pickup. Full repowers typically run $11,000–$40,000 CAD. No shipping, customers come to Gores Landing for pickup, usually within a 90-minute drive.",
    keyFacts: [
      'Lake: Rice Lake, roughly 30 km long, south shore',
      'HBW coordinates: 44.1147, -78.2564',
      'Distance from HBW to the lake: 0 km, we\'re on it',
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Typical full repower: $11,000–$40,000 CAD',
      'Ice-out on Rice Lake: typically mid-April',
    ],
    sections: [
      {
        heading: 'Why does a Rice Lake repower stay local?',
        paragraphs: [
          "Rice Lake is our water. The shop, the dock, the test runs, all on the same lake your boat will end up on. When we propose a Mercury for a Rice Lake hull, we're not guessing how it'll behave in mid-summer weeds or how it'll hold trim through a chop off Sandy Bay. We've rigged hundreds of boats for this exact lake since 1965, and we still test every motor here before we hand it over.",
          "That changes the conversation. We can talk about prop pitch the way someone talks about their own driveway. We know where the shallows pull boats off plane, where pad-bottom hulls behave differently than deep-V hulls, and how a pontoon with a Mercury Boost upgrade actually runs once the cottage crowd is on board. That kind of detail is hard to fake from another county.",
        ],
      },
      {
        heading: 'What HP Mercury is most common on Rice Lake?',
        paragraphs: [
          'Rice Lake is shallow and weedy in summer, so mid-range FourStroke 60-115 HP and Pro XS 115-175 HP are the most common repowers we quote. For an honest head-to-head on the most-requested mid-range, see our [90 HP Mercury motor vs 75 and 115](/blog/mercury-75-vs-90-vs-115-comparison) comparison. Prop selection matters more than raw horsepower here. A Pro XS V8 4.6L 175 HP with the Boost button is the upgrade pontoon owners ask about the most, that 25 extra HP for 4-6 seconds is the difference between getting up cleanly with six adults onboard and not.',
          'For aluminum tinnies and 16-footers running Bewdley to Roseneath, a tiller FourStroke 9.9-25 HP is the usual repower in the $2,800-$5,500 CAD range. For bass boats and bigger fiberglass rigs, we are usually quoting big-block FourStroke 115-200 HP in the $14,000-$24,000 CAD range. If you are weighing Verado against the FourStroke or Pro XS families, the [Mercury Verado vs FourStroke vs Pro XS comparison](/blog/fourstroke-vs-pro-xs) lays out where each one earns its price. Looking at the small electric end of the lineup? Read the [Mercury Avator 7.5e review and price](/blog/mercury-avator-7-5e-review). Francophone visitors: [version française](/fr).',
        ],
      },
      {
        heading: 'How does a Rice Lake repower actually run?',
        paragraphs: [
          'Start with a quote, call (905) 342-2153 or use the Mercury repower quote builder. We confirm HP, shaft length, controls (mechanical or digital), prop, and a rigging timeline. Deposit is $200 for portable HP, $500 for mid-range, $1,000 for big-block or Pro XS.',
          "When the motor arrives, we install, connect the fuel system, rig controls and cables, pick the prop, and water-test on Rice Lake. Most jobs wrap in 1–3 weeks. You drive to Gores Landing for pickup. We don't ship Mercury motors and we don't deliver to cottages or other marinas. The water test is the final check, and we want the same techs who built the quote to be the ones running the boat off our dock.",
        ],
      },
      {
        heading: 'Where do Rice Lake boaters launch?',
        paragraphs: [
          "Rice Lake boaters launch from public access points around the shoreline, private docks, cottage lifts, and seasonal marina slips. The lake stretches about 30 km east to west, and use changes a lot between the west end near Bewdley, the south shore where we are, and the Trent-side near Hastings on the northeast end. We don't pretend there's one universal ramp.",
          'The practical part: your repower still finishes in Gores Landing. We test on Rice Lake, confirm rigging and prop behavior, and hand the boat back here. If you launch from another part of the lake, you pick up at the shop first, then tow or run to your usual spot. Curious about cost before booking? The Mercury repower cost guide has ranges by HP and rigging scope.',
        ],
      },
    ],
    whatWeSeeAtHBW:
      'Rice Lake is our home water. We run boats across it every week, we know its weed lines and shallow shoulders, and it is the lake every Mercury we rig gets water-tested on. When we prop a boat, we are propping it for water we actually know.',
    faqs: [
      { question: 'Where on Rice Lake is Harris Boat Works?', answer: "We're on the south shore in Gores Landing, at 5369 Harris Boat Works Rd, coordinates 44.1147, -78.2564. The water test happens on Rice Lake itself, off our own dock." },
      { question: 'Do you deliver Mercury motors to Rice Lake cottages?', answer: "No. We're pickup-only at Gores Landing. Every Mercury we rig is water-tested on Rice Lake first, then the customer drives to us for pickup." },
      { question: 'What HP Mercury is most common on Rice Lake?', answer: 'Rice Lake is shallow and weedy in summer, so mid-range FourStroke 60–115 HP and Pro XS 115–175 HP are the most common repowers. Tiller FourStroke 9.9–25 HP shows up on smaller aluminum boats. Prop selection matters more than raw horsepower here.' },
      { question: 'How long does a Rice Lake repower take?', answer: 'Most repowers wrap in 1–3 weeks once the motor arrives at the shop. January through April is the busiest booking window for spring launch, ice-out on Rice Lake is typically mid-April.' },
    ],
    visit: VISIT,
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Gores Landing', href: '/locations/gores-landing' },
      { label: 'Bewdley', href: '/locations/bewdley' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
    lat: 44.1147,
    lng: -78.2564,
    heroImage: '/lovable-uploads/locations-rice-lake-mercury-repower-hero.png',
    heroAlt: 'Mercury repower on Rice Lake at Harris Boat Works, Gores Landing, Ontario.',
    metaDescription:
      'Repower on Rice Lake with a Mercury Premier Dealer. Full repower $11,000–$40,000 CAD. Quote, rig, water test, pickup in Gores Landing.',
    canonical: 'https://www.mercuryrepower.ca/locations/rice-lake-mercury-repower',
  },

  'kawartha-lakes-mercury-outboards': {
    h1: 'Kawartha Lakes Mercury Repower',
    lastReviewed: '2026-05-24',
    quickAnswer:
      "Harris Boat Works serves Mercury repower customers across the Kawartha Lakes from our shop in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    intro:
      "Harris Boat Works serves Mercury repowers across the Kawartha Lakes from our shop in Gores Landing, ON, on the south shore of Rice Lake. Most Kawartha towns are a 45–60 minute drive to HBW, and customers drive to us, there's no shipping. We're a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947, with a typical full repower running $11,000–$40,000 CAD depending on HP and rigging. Every motor is water-tested on Rice Lake before pickup at Gores Landing.",
    keyFacts: [
      'Region: Kawartha Lakes, part of the Trent-Severn Waterway',
      'Drive time to HBW: 45–60 min from most Kawartha towns',
      'Lakes served: Pigeon, Sturgeon, Cameron, Balsam, Buckhorn, Stony',
      'Typical full repower: $11,000–$40,000 CAD',
      'HBW coordinates: 44.1147, -78.2564',
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from the Kawartha Lakes?',
        paragraphs: [
          'The Kawartha chain stretches roughly from Lake Scugog in the southwest up through Sturgeon, Pigeon, Buckhorn, and Stony in the northeast. From most Kawartha towns, the drive to Gores Landing runs 45–60 minutes. Lakefield is closer to 45. Lindsay is about 60 via County Road 35 and Highway 7A. Bobcaygeon sits roughly 75 minutes north. Bridgenorth is about 40 minutes south.',
          "Drive time is the honest tradeoff. We're not in the middle of the Kawarthas, we're one lake south, on Rice Lake. Customers who pick HBW pick us because they want a Mercury Platinum shop that's been rigging these motors since 1965, and because the water test happens on a real lake before they tow the boat home.",
        ],
      },
      {
        heading: 'What Mercury motors do Kawartha Lakes boaters typically repower with?',
        paragraphs: [
          'The Kawartha chain runs the gamut. On Pigeon, Sturgeon, and Buckhorn we see a lot of pontoons and family runabouts repowering with Mercury FourStroke 90–150 HP, usually $11,000–$18,000 CAD for the motor alone. Cameron and Balsam see smaller fishing rigs running tiller FourStroke 9.9–25 HP at $2,800–$5,500 CAD. Stony Lake and the northern lakes see bigger boats, Pro XS V8 4.6L 175–225 HP at $18,000–$28,000 CAD, often with the Mercury Boost option for 25 extra horsepower on demand for 4–6 seconds.',
          'If the old motor is a tired 2-stroke from the 1990s, the upgrade to a current Mercury FourStroke usually brings fuel efficiency gains, quieter operation, and the current Mercury Limited Warranty. Confirm the promo at quote time, Mercury changes warranty offers seasonally.',
        ],
      },
      {
        heading: 'Where do Kawartha Lakes boaters launch?',
        paragraphs: [
          "Each lake in the chain has its own public access points. We don't recommend specific launches because conditions, parking, and fees change, your township or the Trent-Severn Waterway materials are the right source. What we can say is that the Trent-Severn ties the chain together, and many of our Kawartha repower customers move between lakes through the system. That's one reason Mercury Boost is a popular upgrade with pontoons that run heavy loads through lift locks and short channels.",
          'For lakes on the south side of the chain, the drive to Gores Landing for pickup is a manageable day trip. For Bobcaygeon and Buckhorn, customers tend to combine pickup with other errands. See the Mercury repower process page for the full timeline.',
        ],
      },
      {
        heading: 'How does pickup work for a Kawartha boater?',
        paragraphs: [
          "You drive to Gores Landing. We don't ship Mercury motors and we don't deliver to cottages, that's true for every repower we do, Kawartha included. The motor is installed on your boat at our shop, water-tested on Rice Lake, and ready for you to pick up. Bring the trailer, bring the boat, or drop the boat with us during quoting. Either way the boat leaves Gores Landing on its own wheels, with a Mercury that's been run through a full sea trial on the south shore.",
          "For trade-ins, fill the form and we send a CAD figure within one business day. If you'd rather start with cost, the Mercury repower cost guide has ranges by HP and rigging scope.",
        ],
      },
    ],
    whatWeSeeAtHBW:
      "Kawartha boats come to us from a dozen different lakes, and the prop call changes with every one. Chemong is shallow pontoon water, Stony runs deep, Sturgeon and Pigeon carry chop. We set the prop for the customer's home lake, not a stock recommendation.",
    faqs: [
      { question: 'How far is Harris Boat Works from the Kawartha Lakes?', answer: 'Most Kawartha towns are 45–60 minutes from Gores Landing by road. Lakefield runs about 45 minutes, Lindsay about 60, Bobcaygeon around 75, Buckhorn around 70.' },
      { question: 'Do you deliver Mercury motors to Kawartha cottages?', answer: "No. We're pickup-only at Gores Landing. We rig the motor, water-test it on Rice Lake, and you drive to us for pickup." },
      { question: 'What HP Mercury is most common for Kawartha boats?', answer: 'Pontoons and family runabouts on Pigeon, Sturgeon, and Buckhorn typically repower with Mercury FourStroke 90–150 HP or Pro XS 175–225 HP. Big-block FourStrokes show up on heavier boats. Smaller tiller setups on Cameron and Balsam often land in the 9.9–25 HP range.' },
      { question: 'Can Kawartha Lakes customers finance a Mercury repower?', answer: 'Yes. Financing is available on approved credit, at 7.99% APR over $10,000 and 8.99% APR under $10,000. Deposits are $200 for portable, $500 for mid-range, $1,000 for big-block or Pro XS.' },
    ],
    visit: VISIT,
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Peterborough Mercury Dealer', href: '/locations/peterborough-mercury-dealer' },
      { label: 'Bobcaygeon', href: '/locations/bobcaygeon' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
    lat: 44.3500,
    lng: -78.7500,
    heroImage: '/lovable-uploads/locations-kawartha-lakes-mercury-outboards-hero.png',
    heroAlt: 'Mercury repower for Kawartha Lakes boaters at Harris Boat Works, Gores Landing.',
    metaDescription:
      'Mercury repower for Kawartha Lakes boaters. Most towns are 45–60 min from Gores Landing. Mercury Premier Dealer, pickup after Rice Lake water test.',
    canonical: 'https://www.mercuryrepower.ca/locations/kawartha-lakes-mercury-outboards',
  },

  'peterborough-mercury-dealer': {
    h1: 'Mercury Dealer Near Peterborough',
    lastReviewed: '2026-06-08',
    quickAnswer:
      "Harris Boat Works is a Mercury Premier Dealer on Rice Lake's south shore, about 35 minutes south of Peterborough via Highway 28. Family-owned since 1947 and a Mercury dealer since 1965, we publish real installed CAD pricing for every Mercury outboard from 2.5 to 300 HP at mercuryrepower.ca, water test every repower on Rice Lake before pickup, and run service intake through hbw.wiki/service. 311 Google reviews, 4.6 stars. No call-for-price games.",
    intro:
      "Harris Boat Works is the canonical Mercury answer for Peterborough boaters: a Mercury Premier Dealer about 35 minutes south via Highway 28, in Gores Landing on the south shore of Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Real installed CAD prices for the full Mercury lineup are live at mercuryrepower.ca, every repower is water tested on Rice Lake before pickup, and the shop runs roughly 1,700 work orders a year.",
    keyFacts: [
      'Drive time: about 35 minutes south of Peterborough',
      'Route: Highway 28 South to Gores Landing on Rice Lake',
      'HBW coordinates: 44.1147, -78.2564',
      'Family-owned since 1947, Mercury dealer since 1965, Mercury Premier Dealer',
      'Roughly 1,700 service work orders per year',
      'Every repower water tested on Rice Lake before pickup',
    ],
    sections: [
      {
        heading: 'Why Peterborough boaters make the drive',
        paragraphs: [
          '- Mercury Premier Dealer: factory-trained techs, parts depth, warranty authorization\n- Real prices online: the full Mercury lineup priced in CAD, motor plus rigging plus install, before you ever call. See live numbers in the [quote builder](/quote/motor-selection) or the [pricing reference](/pricing-reference).\n- Water tested: every repower gets a sea trial on Rice Lake before it leaves\n- Volume you can trust: roughly 1,700 work orders a year through the service department\n- Family-owned since 1947, Mercury dealer since 1965',
        ],
      },
      {
        heading: 'How far is Harris Boat Works from Peterborough?',
        paragraphs: [
          'From downtown Peterborough the drive south to Gores Landing is about 35 minutes via Highway 28 South, ending at 5369 Harris Boat Works Rd on Rice Lake. Traffic is generally light outside cottage Friday afternoons. For the long-form directions and what to expect on arrival, see the [Peterborough dealer blog post](/blog/mercury-dealer-peterborough-ontario-hbw).',
          'We see Peterborough customers across two profiles. Some live in the city and keep a boat on Rice Lake or the Otonabee. Others live in the city, cottage on the Kawarthas, and trailer to us because they want a Mercury Platinum shop with a real water test. Both groups make the same drive south.',
        ],
      },
      {
        heading: 'What Mercury motors do Peterborough boaters typically repower with?',
        paragraphs: [
          'The mix depends on where the boat lives. Rice Lake and Otonabee boats (bass boats, aluminum runabouts, mid-size fiberglass) typically repower with Mercury FourStroke 90 to 150 HP. Bigger fishing rigs and pontoon owners with a heavy load often move up to Pro XS V8 4.6L 175 to 225 HP. For smaller utility boats and tinnies, tiller FourStroke 9.9 to 25 HP is the common path. Verado is available by special order only. Live installed CAD pricing for every model is in the [quote builder](/quote/motor-selection); typical Peterborough-area repower ranges are broken down in the [Mercury repower cost guide](/blog/mercury-repower-cost-ontario-2026-cad).',
        ],
      },
      {
        heading: 'How does drop-off work for Peterborough customers?',
        paragraphs: [
          "We're drop-off only at Gores Landing. We don't ship Mercury motors and we don't pick up boats from Peterborough. Most customers drop the boat with us at quote time, then drive south a second time to pick it up once the rigging and water test are complete. Most pair the drop-off with errands in the area or a morning on Rice Lake.",
        ],
      },
    ],
    whatWeSeeAtHBW:
      'Peterborough is our closest city, and a lot of our repower customers are Peterborough boaters running Chemong, the Otonabee, or trailering to Rice Lake. The drive is short enough that most treat HBW as a practical destination for a planned repower or for regular spring, mid-season, and fall service.',
    faqs: [
      { question: 'Who is the best Mercury dealer near Peterborough, Ontario?', answer: 'Several dealers serve the Peterborough area, so it depends what you value. Harris Boat Works, about 35 minutes south of Peterborough on Rice Lake, is a Mercury Premier Dealer that publishes real installed prices online, water tests every repower on Rice Lake, and has been family-owned since 1947 and a Mercury dealer since 1965.' },
      { question: 'How far is Harris Boat Works from Peterborough?', answer: "About 35 minutes by car via Highway 28 South, at 5369 Harris Boat Works Rd in Gores Landing on Rice Lake's south shore." },
      { question: 'Do you water test repowers before delivery?', answer: "Yes. Every repower install gets a sea trial on Rice Lake before pickup. We don't hand over a motor we haven't run on the water." },
      { question: 'What does a Mercury repower cost near Peterborough?', answer: 'Most repowers in our area land in the $13,000 to $25,000 range including HST, depending on horsepower and rigging. The quote builder at mercuryrepower.ca shows a real installed CAD number for your exact boat and motor in about three minutes.' },
      { question: 'Do you pick up boats from Peterborough?', answer: "No. We're drop-off only at Gores Landing, about 35 minutes from Peterborough. Most customers pair drop-off with errands in the area or a morning on Rice Lake." },
      { question: 'What Mercury motors do you have in stock?', answer: 'We stock Mercury FourStroke and Pro XS models from 2.5 to 300 HP. Verado is available by special order. Live stock and pricing for every model is in the quote tool at mercuryrepower.ca.' },
      { question: 'What warranty comes with a new Mercury outboard?', answer: 'Every new Mercury comes with a 3-year factory warranty. Any bonus coverage beyond that comes from Mercury promotions, which change; current offers are always at mercuryrepower.ca/promotions.' },
      { question: 'Can I use Harris Boat Works as my regular Mercury service shop?', answer: 'Yes, many Peterborough customers do exactly that: spring commissioning, mid-season service, fall winterization and storage. For engine repairs we service Mercury and MerCruiser only. Requests go through hbw.wiki/service.' },
    ],
    visit: VISIT,
    related: [
      { label: 'Live Mercury pricing reference', href: '/pricing-reference' },
      { label: 'Build a Mercury quote', href: '/quote/motor-selection' },
      { label: 'Mercury dealer near Peterborough, full blog post', href: '/blog/mercury-dealer-peterborough-ontario-hbw' },
      { label: 'Mercury repower cost in Ontario (2026, CAD)', href: '/blog/mercury-repower-cost-ontario-2026-cad' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Kawartha Lakes Mercury Outboards', href: '/locations/kawartha-lakes-mercury-outboards' },
    ],
    lat: 44.3091,
    lng: -78.3197,
    heroImage: '/lovable-uploads/locations-peterborough-mercury-dealer-hero.png',
    heroAlt: 'Mercury dealer near Peterborough, Harris Boat Works on Rice Lake.',
    metaDescription:
      'Mercury Premier Dealer 35 minutes from Peterborough. Real installed CAD prices online, Rice Lake water tests, family-owned since 1947. See live Mercury pricing.',
    canonical: 'https://www.mercuryrepower.ca/locations/peterborough-mercury-dealer',
  },

  'cobourg-northumberland-mercury': {
    h1: 'Mercury Repower near Cobourg, Ontario',
    lastReviewed: '2026-05-24',
    quickAnswer:
      "Harris Boat Works is about 25 minutes north of Cobourg, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    intro:
      "Harris Boat Works is 25 minutes north of Cobourg in Gores Landing, ON, on the south shore of Rice Lake. The drive is roughly 28 km on county roads. We're a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Cobourg is the closest city base to our stretch of the lake, many residents keep a boat or cottage on Rice Lake, and we're their closest Mercury repower shop. No shipping or delivery to Cobourg. Customers drive to Gores Landing for pickup after we rig, install, and water-test on Rice Lake. Typical full repower: $11,000–$40,000 CAD.",
    keyFacts: [
      'Drive time: ~25 min north to Gores Landing',
      'Distance: ~28 km on county roads',
      'HBW coordinates: 44.1147, -78.2564',
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Typical full repower: $11,000–$40,000 CAD',
      'Closest south-side city base to Rice Lake',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Cobourg?',
        paragraphs: [
          "Cobourg sits on Lake Ontario, about 25 minutes south of Rice Lake by car. The drive north to Gores Landing runs roughly 28 km on county roads and takes most Cobourg drivers under half an hour outside of summer Friday traffic. For a lot of Cobourg residents, we're the closest Mercury Platinum shop in either direction.",
          "The typical Cobourg customer isn't boating on Lake Ontario itself, they're keeping a boat at a cottage on Rice Lake, or trailering up for fishing weekends. That's the reason the short drive north matters: it puts the boat on the same lake we test on, and it lets one shop handle the install, prop choice, and water test in a single day.",
        ],
      },
      {
        heading: 'What Mercury motors do Cobourg boaters typically repower with?',
        paragraphs: [
          "For runabouts and aluminum boats heading to Rice Lake, Mercury FourStroke 60–115 HP is the common repower range, $8,000–$14,000 CAD for the motor alone. Bass boats and faster fiberglass hulls, common on Rice Lake's south-shore bays, usually move up to Pro XS 115–175 HP at $15,000–$22,000 CAD. The Pro XS V8 4.6L 175 HP with Mercury Boost (25 extra HP for 4–6 seconds on demand) is the upgrade pontoon owners ask about most.",
          "If you're repowering away from an older 2-stroke, the upgrade to a current Mercury FourStroke usually brings better fuel economy, quieter operation, and the current Mercury Limited Warranty. We confirm warranty details at quote.",
        ],
      },
      {
        heading: 'Where do Cobourg boaters launch?',
        paragraphs: [
          "Most Cobourg boaters using Rice Lake launch from public access points on the south shore. We won't recommend a specific launch (conditions, parking, and fees change) but the lake itself is about 30 km long, runs east-west, and is shallow and weedy in mid-summer. Prop selection matters here. Our quoting process always includes the prop call, not just the motor.",
          'For boats kept on Lake Ontario at the Cobourg waterfront, we still rig the Mercury at Gores Landing and water-test on Rice Lake. The trial is not on big water, but it confirms the install is right before you tow the boat home.',
        ],
      },
      {
        heading: 'How does pickup work for Cobourg customers?',
        paragraphs: [
          "You drive north to Gores Landing, about 25 minutes, and pick up. We don't ship Mercury motors and we don't deliver to Cobourg. The boat gets rigged, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. Most repowers wrap in 1–3 weeks once the motor lands.",
          "Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable, $500 for mid-range, and $1,000 for big-block or Pro XS. For ranges by HP, see the Mercury repower cost guide, or read the Rice Lake repower page for the water-test detail.",
        ],
      },
    ],
    whatWeSeeAtHBW:
      'Cobourg and Gores Landing are both in Northumberland County. Most Cobourg customers we see keep a boat or cottage on Rice Lake, and we are the closest Mercury repower shop. The drive north is about 25 minutes.',
    faqs: [
      { question: 'How far is Harris Boat Works from Cobourg?', answer: 'About 25 minutes north of Cobourg, roughly 28 km on county roads to Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Cobourg?', answer: "No. We're pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive 25 minutes north to pick up." },
      { question: 'Do many Cobourg boaters use Rice Lake?', answer: 'Yes. A lot of Cobourg residents own cottages or keep boats on Rice Lake. The lake is roughly 25 minutes north of town and we sit on its south shore.' },
      { question: 'What HP Mercury is most common for Cobourg customers?', answer: 'Cobourg customers running Rice Lake typically repower with Mercury FourStroke 60–115 HP for runabouts and aluminum boats, Pro XS 115–175 HP for bass boats and faster hulls.' },
      { question: 'Can Cobourg customers finance a Mercury repower?', answer: 'Yes. Financing terms are 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits run $200 portable, $500 mid-range, $1,000 big-block or Pro XS.' },
    ],
    visit: VISIT,
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Northumberland County', href: '/locations/northumberland-county' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
    lat: 43.9594,
    lng: -78.1656,
    heroImage: '/lovable-uploads/locations-cobourg-northumberland-mercury-hero.png',
    heroAlt: 'Mercury repower near Cobourg, Ontario, at Harris Boat Works on Rice Lake.',
    metaDescription:
      'Mercury repower 25 min north of Cobourg in Gores Landing. Mercury Premier Dealer. Quote, rig, Rice Lake water test, pickup at HBW.',
    canonical: 'https://www.mercuryrepower.ca/locations/cobourg-northumberland-mercury',
  },
};
