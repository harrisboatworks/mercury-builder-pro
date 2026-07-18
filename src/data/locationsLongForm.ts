// Long-form location pages for mercuryrepower.ca (Bucket 2 Batch 1, May 2026).
// Each page renders ~700 words: H1, intro, key facts, H2 sections,
// FAQ, Visit, and Related. Copy is verbatim from the SEO brief — do not
// rewrite. No em dashes. En dashes only inside number ranges.

import type { LocationPageData, LocationLink, LocationFAQ } from './locations';
import { LOCATION_LONGFORM_EXTRAS } from './locationsLongFormExtras';
import { BUSINESS_COORDINATES_TEXT, BUSINESS_GEO } from '../lib/companyInfo';

export interface LocationSection {
  heading: string;
  paragraphs: string[];
}

export interface LocationLongForm {
  h1: string;
  intro: string;
  keyFacts: string[];
  sections: LocationSection[];
  faqs: LocationFAQ[];
  visit: string;
  related: LocationLink[];
  lat?: number;
  lng?: number;
  /** Standards-upgrade fields (Bucket 2 Batch 1, May 2026). */
  quickAnswer?: string;
  lastReviewed?: string;
  whatWeSeeAtHBW?: string;
  heroImage?: string;
  heroAlt?: string;
  metaDescription?: string;
  canonical?: string;
}

const PICKUP_POLICY =
  'Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON, by the buyer in person with valid government photo ID. We do not deliver, ship, or release motors to couriers or third parties.';
const boundary = (city: string) =>
  `Harris Boat Works does not perform mobile service, on-site installs, or driveway/marina visits in ${city}. Customers from ${city} bring their boat to our Gores Landing shop, or pick up a loose Mercury motor for self-install.`;
const VISIT =
  "Harris Boat Works · 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0 · Phone (905) 342-2153 · Family-owned since 1947 · Mercury Premier Dealer, selling Mercury since 1965.";

interface SpecInput {
  slug: string;
  title: string;
  metaDescription: string;
  region: string;
  driveTime: string;
  lat: number;
  lng: number;
  h1: string;
  intro: string;
  keyFacts: string[];
  sections: LocationSection[];
  faqs: LocationFAQ[];
  visitExtra?: string;
  related: LocationLink[];
}

function toLocation(s: SpecInput): LocationPageData {
  const visit = s.visitExtra ? `${VISIT}\n\n${s.visitExtra}` : VISIT;
  const extras = LOCATION_LONGFORM_EXTRAS[s.slug];
  const canonical = `https://www.mercuryrepower.ca/locations/${s.slug}`;
  return {
    slug: s.slug,
    title: s.title,
    metaDescription: s.metaDescription,
    region: s.region,
    regionType: 'city',
    keyword: `mercury repower ${s.region.toLowerCase()}`,
    driveTime: s.driveTime,
    intro: s.intro,
    localContext: s.keyFacts.slice(0, 3),
    popularBoats: ['Aluminum fishing boats', 'Pontoons', 'Family runabouts'],
    popularHpRanges: ['9.9–25 HP tiller', '60–115 HP family and pontoon', '150–225 HP Pro XS'],
    whyChooseUs: [
      'Family-owned in Gores Landing since 1947',
      'Mercury Marine Premier Dealer',
      'Authorized Mercury dealer since 1965',
      'Every installed repower is lake-tested on Rice Lake before pickup',
    ],
    recommendedLinks: s.related,
    faqs: s.faqs,
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary(s.region),
    longForm: {
      h1: s.h1,
      intro: s.intro,
      keyFacts: s.keyFacts,
      sections: s.sections,
      faqs: s.faqs,
      visit,
      related: s.related,
      lat: s.lat,
      lng: s.lng,
      quickAnswer: extras?.quickAnswer,
      lastReviewed: extras?.lastReviewed,
      whatWeSeeAtHBW: extras?.whatWeSeeAtHBW,
      heroImage: extras?.heroImage,
      heroAlt: extras?.heroAlt,
      metaDescription: s.metaDescription,
      canonical,
    },
  };
}

const SPECS: SpecInput[] = [
  // 1. Port Hope
  {
    slug: 'port-hope',
    title: 'Mercury Repower near Port Hope, Ontario',
    metaDescription:
      'Mercury repower 30 min north of Port Hope in Gores Landing. Mercury Premier Dealer. Quote, rig, Rice Lake water test, pickup at HBW.',
    region: 'Port Hope',
    driveTime: 'about 30 minutes north of Port Hope',
    lat: 43.9498,
    lng: -78.2920,
    h1: 'Mercury Repower near Port Hope, Ontario',
    intro:
      "Harris Boat Works is 30 minutes north of Port Hope in Gores Landing, ON, on the south shore of Rice Lake. The drive is roughly 32 km on county roads. We're a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Like Cobourg, Port Hope has many residents who keep boats or cottages on Rice Lake, and we're their closest Mercury repower shop. No shipping or delivery. Customers drive to Gores Landing for pickup after we rig, install, and water-test on Rice Lake. Typical full repower: $11,000–$40,000 CAD.",
    keyFacts: [
      'Drive time: ~30 min north to Gores Landing',
      'Distance: ~32 km on county roads',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Typical full repower: $11,000–$40,000 CAD',
      'County tie: Port Hope and Gores Landing are both in Northumberland County',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Port Hope?',
        paragraphs: [
          'Port Hope sits on Lake Ontario, just west of Cobourg. The drive north to Gores Landing runs roughly 32 km and takes about 30 minutes on county roads. For Port Hope residents with a boat on Rice Lake, and there are a lot of them, the trip to our shop is shorter than most options to the east or west.',
          "The Port Hope customer profile we see most often is the cottage owner: house in town, boat at a Rice Lake cottage, looking to repower a hull they've owned for years. We treat repower customers as adults who know their boats. The quote starts with what the boat is and what you actually use it for, not a sales pitch.",
        ],
      },
      {
        heading: 'What Mercury motors do Port Hope boaters typically repower with?',
        paragraphs: [
          "For aluminum runabouts and small fishing boats heading to Rice Lake, Mercury FourStroke 25–60 HP is common. Mid-size fiberglass runabouts often move to FourStroke 90–115 HP. Bass boat and pontoon owners may consider Pro XS 175–225 HP where the hull is properly rated. On eligible motors, Mercury Boost is an automatic software calibration that improves mid-range acceleration; it does not add horsepower or top speed.",
          "If you're repowering away from a 1990s or early-2000s motor, the upgrade is more than horsepower. Current Mercury FourStrokes are quieter, more fuel-efficient, and come with the current Mercury Limited Warranty. We confirm the warranty at quote time.",
        ],
      },
      {
        heading: 'Where do Port Hope boaters launch?',
        paragraphs: [
          "Port Hope boaters using Rice Lake typically launch from public access points on the south shore. We won't name a specific ramp (conditions, parking, and fees change) but Rice Lake is a 30 km long, shallow, weedy lake with strong bass, walleye, and muskie fisheries. Prop selection is part of the quote, not an afterthought.",
          'For boats kept on the Lake Ontario waterfront, we still rig and water-test at Gores Landing. The test is on Rice Lake, but it confirms the install is dialed in before you tow the boat home to Port Hope.',
        ],
      },
      {
        heading: 'How does pickup work for Port Hope customers?',
        paragraphs: [
          "You drive north, about 30 minutes, and pick up at Gores Landing. We don't ship Mercury motors and we don't deliver to Port Hope. The boat gets rigged, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. Your boat is with us 2 to 5 days, drop-off to pickup; if the motor has to be ordered, that wait depends on the model and Mercury's current availability, and we give you a real date at order time.",
          'Financing terms are 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits run $200 for portable, $500 for mid-range, $1,000 for big-block or Pro XS. For ranges by HP, see the Mercury repower cost guide. If your route is really Port Hope vs Cobourg, our Cobourg page is the closest comparison. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Port Hope?', answer: 'About 30 minutes north of Port Hope, roughly 32 km on county roads to Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Port Hope?', answer: "No. We're pickup-only at Gores Landing. The motor is water-tested on Rice Lake first, then you drive 30 minutes north to pick up." },
      { question: 'Do many Port Hope boaters cottage on Rice Lake?', answer: 'Yes. Port Hope has a strong cottage-on-Rice-Lake crowd. The lake is around 30 minutes north of town and we sit on its south shore.' },
      { question: 'Can I get a trade-in valuation from Port Hope?', answer: 'Yes. Fill out the trade-in form and we usually email a CAD figure within one business day. We take Mercury outboards directly and review other brands case by case for resale or wholesale.' },
      { question: 'Can I finance a Mercury repower from Port Hope?', answer: 'Yes. Financing is 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. We finalize numbers at quote. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).' },
    ],
    visitExtra:
      'If financing is part of the plan, review Harris Boat Works financing terms. The repower itself is still installed, tested, and picked up in Gores Landing.',
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Cobourg Northumberland Mercury', href: '/locations/cobourg-northumberland-mercury' },
      { label: 'Harris Boat Works financing terms', href: 'https://www.harrisboatworks.ca/financing' },
    ],
  },

  // 2. Bewdley
  {
    slug: 'bewdley',
    title: 'Mercury Repower for Bewdley Boaters, Ontario',
    metaDescription:
      'Mercury repower 15 min east of Bewdley along Rice Lake. Mercury Premier Dealer, same-lake water test, pickup in Gores Landing.',
    region: 'Bewdley',
    driveTime: 'about 15 minutes east of Bewdley along Rice Lake',
    lat: 44.0833,
    lng: -78.3500,
    h1: 'Mercury Repower for Bewdley Boaters, Ontario',
    intro:
      'Harris Boat Works is 15 minutes east of Bewdley along the south shore of Rice Lake. Bewdley sits at the west end of the lake, and HBW sits in Gores Landing, mid-south shore, roughly 15 km by road. We\'re a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. We share your lake. Every Mercury we rig gets water-tested on Rice Lake before pickup at Gores Landing. No shipping or delivery to Bewdley. Typical full repower: $11,000–$40,000 CAD depending on HP.',
    keyFacts: [
      'Drive time: ~15 min east along Rice Lake shore',
      'Distance: ~15 km by road on County Road 9',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Same lake: Rice Lake, ~30 km long, south shore',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Bewdley?',
        paragraphs: [
          "Bewdley is the west-end town on Rice Lake. We're the mid-south-shore village. Door-to-door is roughly 15 km, about 15 minutes by road depending on the season. For Bewdley boaters, this is one of the shortest drives to a Mercury Premier repower shop anywhere, and we're on the same lake your boat already runs on.",
          "That shared geography is the whole point. We've rigged a lot of boats for Bewdley customers since 1965. The west end of Rice Lake has its own chop pattern, its own weed lines, its own shallow shoulders. We know that water because we run boats across it.",
        ],
      },
      {
        heading: 'What Mercury motors do Bewdley boaters typically repower with?',
        paragraphs: [
          'The mix on Rice Lake skews to mid-range. The most common repower we write for Bewdley customers is Mercury FourStroke 60–115 HP on a runabout or aluminum hull, $8,000–$14,000 CAD for the motor alone. Tiller boats run FourStroke 9.9–25 HP in the $2,800–$5,500 CAD range. Bassboats and faster fiberglass move to Pro XS 115–175 HP, $15,000–$22,000 CAD.',
          'Pontoon owners carrying heavy loads often ask about Pro XS and Mercury Boost. The 175 HP Pro XS is a 3.4L V6, not a 4.6L V8. On an eligible motor, Boost activates automatically during full-throttle mid-range acceleration and improves response; it does not add horsepower, top speed, or maximum RPM. Price and eligibility are confirmed by serial number.',
        ],
      },
      {
        heading: 'Where do Bewdley boaters launch?',
        paragraphs: [
          "Bewdley is on the west end of Rice Lake with public lake access in the area. We won't recommend a specific ramp, conditions and parking change, but the lake itself is the constant. Rice Lake is roughly 30 km long, shallow, weedy in mid-summer, and produces strong bass, walleye, and muskie fisheries. The west end where Bewdley sits has its own water character, and a Mercury propped right for that end of the lake will perform better.",
          "That prop call happens during the repower quote. We're not picking a stock prop and moving on, we're pairing the motor to the hull and the lake.",
        ],
      },
      {
        heading: 'How does pickup work for a Bewdley customer?',
        paragraphs: [
          "You drive 15 minutes east to Gores Landing and pick up. If your current motor still runs, you can also come by water, same lake, no trailer involved. We don't ship Mercury motors and we don't deliver to Bewdley, even though it's right next door. The motor is rigged, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. Your boat is with us 2 to 5 days, drop-off to pickup; if the motor has to be ordered, that wait depends on the model and Mercury's current availability, and we give you a real date at order time.",
          'For ranges by HP, see the Mercury repower cost guide. For the lake-wide picture, the Rice Lake page covers same-lake water-test detail. Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Bewdley?', answer: 'About 15 minutes east along the south shore of Rice Lake, roughly 15 km by road into Gores Landing.' },
      { question: 'Can I bring my boat to you by water from Bewdley?', answer: "Yes. If your current motor still runs, you can come down Rice Lake to our docks in Gores Landing for the repower drop-off. Otherwise it's a 15-minute tow east on County Road 9." },
      { question: 'Do you deliver Mercury motors to Bewdley?', answer: "No. We're pickup-only at Gores Landing. We rig, water-test on Rice Lake, and you drive 15 minutes east to pick up." },
      { question: 'We share Rice Lake, does that change anything?', answer: "It changes the water test. We're not testing on a strange lake. The Mercury runs on the same Rice Lake you boat on every weekend, same weeds, same wind direction, same chop patterns." },
      { question: 'What HP Mercury is most common for Bewdley boats?', answer: 'Bewdley boats on Rice Lake range from tiller FourStroke 9.9–25 HP on tinnies through Pro XS 175 HP on bass and pontoon rigs. Mid-range FourStroke 60–115 HP is the most common repower we write.' },
    ],
    visitExtra:
      "We're the repower side of the Harris Boat Works service team on Rice Lake. The same techs who write your quote are the ones who rig and water-test the motor on the lake we both run.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Gores Landing', href: '/locations/gores-landing' },
      { label: 'the Harris Boat Works service team on Rice Lake', href: 'https://www.harrisboatworks.ca/services' },
    ],
  },

  // 3. Gores Landing
  {
    slug: 'gores-landing',
    title: 'Mercury Repower in Gores Landing, Ontario',
    metaDescription:
      'Mercury Premier Dealer in Gores Landing on Rice Lake. The village marina, family-owned since 1947. Pickup at the shop after the lake test.',
    region: 'Gores Landing',
    driveTime: 'local to Gores Landing, under 5 minutes or walking',
    lat: BUSINESS_GEO.latitude,
    lng: BUSINESS_GEO.longitude,
    h1: 'Mercury Repower in Gores Landing, Ontario',
    intro:
      `Harris Boat Works is in Gores Landing, ON, at 5369 Harris Boat Works Rd on the south shore of Rice Lake, coordinates ${BUSINESS_COORDINATES_TEXT}. We're the village marina, family-owned since 1947 and a Mercury Premier Dealer, selling Mercury since 1965. For most Gores Landing customers the trip is a walk, a five-minute truck ride, or no drive at all if the boat is already at our dock. Every Mercury we rig is water-tested on Rice Lake before pickup. No shipping. Typical full repower: $11,000–$40,000 CAD.`,
    keyFacts: [
      'Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0',
      `Coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Drive time within Gores Landing: under 5 min, or walk',
      'Family-owned since 1947 (three generations)',
      'Mercury Premier Dealer, selling Mercury since 1965',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'What does Harris Boat Works mean to Gores Landing?',
        paragraphs: [
          "Gores Landing is a village of a few hundred people on the south shore of Rice Lake. We're not the new shop in town, we're the shop that has been here since 1947. Three generations of the same family have rigged motors out of this address. We have been a Mercury dealer since 1965, and today we hold Mercury's Premier Dealer tier.",
          "For locals, the repower conversation is short. You know where the shop is. You know who works the bench. We know what your boat is and probably the last motor we put on it. We treat repower customers as adults, that's the only way to run a shop in a village this small for three generations.",
        ],
      },
      {
        heading: 'How long has Harris Boat Works been in Gores Landing?',
        paragraphs: [
          'Family-owned since 1947. A Mercury dealer since 1965. Three generations have run the marina out of 5369 Harris Boat Works Rd, on the same south-shore patch of Rice Lake.',
          'The combination matters. Mercury Premier Dealer status is the top dealer tier, re-earned every year on training, sales, service, and customer satisfaction. Selling and servicing Mercury since 1965 means generations of techs here have stayed current with each new Mercury platform, from carbureted two-strokes through current FourStroke V8, Pro XS V8 4.6L, and Verado V10 architecture.',
        ],
      },
      {
        heading: 'What HP Mercury do Gores Landing boats run?',
        paragraphs: [
          'Locals run the full range. A lot of Rice Lake hulls in the village are 16- to 20-foot runabouts, tinnies, and pontoons. The common repower spread:',
          '- Tiller FourStroke 9.9–25 HP on tinnies: ~$2,800–$5,500 CAD\n- Mid-range FourStroke 60–115 HP on runabouts: ~$8,000–$14,000 CAD\n- Pro XS 115–175 HP on bass boats and faster pontoons: ~$15,000–$22,000 CAD\n- Big-block FourStroke 150–200 HP on heavier fiberglass: ~$14,000–$24,000 CAD',
          'For pontoon owners running heavy weekend loads, the first checks are hull rating, propeller, setup, and whether the boat is genuinely underpowered. Mercury Boost may improve mid-range acceleration on an eligible motor, but it does not add horsepower and cannot replace the correct motor-to-hull match.',
        ],
      },
      {
        heading: 'How does pickup work for a local customer?',
        paragraphs: [
          "Same as everyone else: pickup-only at the dock. We don't ship motors and we don't deliver, not even within the village. The motor is installed on your boat, propped, fuel-connected, controls run, and water-tested on Rice Lake before you take it back. Locals usually drop the boat with us during quoting and pick it up after the water test.",
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. Trade-ins: fill the form, we usually email a CAD figure within one business day. For HP-by-HP ranges, see the Mercury repower cost guide. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'Where exactly is Harris Boat Works in Gores Landing?', answer: `5369 Harris Boat Works Rd, on the south shore of Rice Lake, coordinates ${BUSINESS_COORDINATES_TEXT}. We're the village marina.` },
      { question: 'Do you deliver Mercury motors inside Gores Landing?', answer: "No. We're pickup-only at the shop, even for local customers. The motor is rigged, propped, and water-tested on Rice Lake before you pick up at our dock." },
      { question: 'How long has Harris Boat Works been in Gores Landing?', answer: "The shop has been family-owned since 1947, three generations. We have sold Mercury since 1965 and hold Mercury's Premier Dealer tier today." },
      { question: 'Can I bring my boat to you by water from somewhere else in the village?', answer: "Yes. If your current motor still runs, you can bring the boat to our docks under its own power for the repower drop-off. Otherwise it's a short tow." },
      { question: 'What HP Mercury do Gores Landing boats run?', answer: 'Locals run the full range. Tiller FourStroke 9.9–25 HP on tinnies, mid-range FourStroke 60–115 HP on runabouts, Pro XS 175 HP on bass boats and pontoons. Big-block FourStroke 150–200 HP on heavier fiberglass.' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Bewdley', href: '/locations/bewdley' },
      { label: 'Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965', href: 'https://www.harrisboatworks.ca' },
    ],
  },

  // 4. Roseneath
  {
    slug: 'roseneath',
    title: 'Mercury Repower for Roseneath Boaters, Ontario',
    metaDescription:
      'Mercury repower 15 min west of Roseneath along Rice Lake. Mercury Premier Dealer, same-lake water test, pickup in Gores Landing.',
    region: 'Roseneath',
    driveTime: 'about 15 minutes west of Roseneath along Rice Lake',
    lat: 44.1167,
    lng: -78.0833,
    h1: 'Mercury Repower for Roseneath Boaters, Ontario',
    intro:
      "Harris Boat Works is 15 minutes west of Roseneath along the south shore of Rice Lake. Roseneath sits near the east end of the lake; HBW sits in Gores Landing, mid-south shore, roughly 15 km by road. We're a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. We share Rice Lake. Every Mercury we rig is water-tested on the same lake you boat on, then picked up at Gores Landing. No shipping. Typical full repower: $11,000–$40,000 CAD depending on HP.",
    keyFacts: [
      'Drive time: ~15 min west along Rice Lake shore',
      'Distance: ~15 km by road on County Road 9',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Same lake: Rice Lake, ~30 km long, south shore',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Roseneath?',
        paragraphs: [
          "Roseneath is the east-end community on Rice Lake. We're mid-south-shore. Door-to-door is roughly 15 km, about 15 minutes by road. For Roseneath boaters this is one of the shortest drives to a Mercury Premier repower shop in the area, and the water test happens on the lake your boat already lives on.",
          "The east end of Rice Lake has its own character. Different chop direction, different weed lines, different fishing patterns running toward the Trent system. We've rigged boats for east-end customers since 1965, and that local knowledge shows up most clearly in the prop call. The same motor with a different prop runs noticeably better on a boat that lives on the east end versus one based further west.",
        ],
      },
      {
        heading: 'What Mercury motors do Roseneath boaters typically repower with?',
        paragraphs: [
          'Most Roseneath repowers we see land in the Mercury FourStroke 60–115 HP range, common on runabouts and aluminum boats. Tiller boats often run FourStroke 9.9–25 HP. Bass boats and heavier pontoons may move to Pro XS 175 HP, which uses a 3.4L V6. Boost can improve acceleration on an eligible motor but does not add horsepower.',
          'If your boat is running a 2-stroke from the 1990s, the upgrade to a current Mercury FourStroke usually brings better fuel economy, quieter operation, and the current Mercury Limited Warranty. We confirm the active warranty offer at quote.',
        ],
      },
      {
        heading: 'Where do Roseneath boaters launch?',
        paragraphs: [
          "The east end of Rice Lake has public access points serving Roseneath and the surrounding south-shore communities. We won't recommend a specific ramp (fees, conditions, and parking change) but the lake itself is the constant. Rice Lake is roughly 30 km long, shallow, weedy in mid-summer, and produces strong bass, walleye, and muskie fisheries. The east end runs out toward Hastings and the Trent system, so a lot of Roseneath boaters use that direction more than the west.",
          "That east-end use pattern shapes prop selection. A boat that mostly runs east toward Hastings behaves differently than one mostly running west, different fetch, different cruising RPM target. We pair the prop to the actual use, not a stock recommendation.",
        ],
      },
      {
        heading: 'How does pickup work for Roseneath customers?',
        paragraphs: [
          "You drive 15 minutes west to Gores Landing and pick up. If the old motor still runs, you can also come by water, same lake, no trailer involved. We don't ship Mercury motors and we don't deliver, not to Roseneath, not anywhere. The motor is rigged, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. Your boat is with us 2 to 5 days, drop-off to pickup; if the motor has to be ordered, that wait depends on the model and Mercury's current availability, and we give you a real date at order time.",
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable, $500 for mid-range, $1,000 for big-block or Pro XS. For ranges by HP, see the Mercury repower cost guide. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Roseneath?', answer: 'About 15 minutes west along the south shore of Rice Lake, roughly 15 km by road into Gores Landing.' },
      { question: 'Can I bring my boat to you by water from Roseneath?', answer: "Yes. If your current motor still runs, you can come west down Rice Lake to our docks in Gores Landing for the repower drop-off. Otherwise it's a 15-minute tow on County Road 9." },
      { question: 'Do you deliver Mercury motors to Roseneath?', answer: "No. We're pickup-only at Gores Landing. We rig, water-test on Rice Lake, and you drive 15 minutes west to pick up." },
      { question: 'Do Roseneath boaters share Rice Lake with HBW?', answer: 'Yes. Roseneath is at the east end of Rice Lake, and HBW is mid-south-shore. Same lake, different end. The water test happens on the lake you already run.' },
      { question: 'What HP Mercury is most common for east-end Rice Lake boats?', answer: 'Most Roseneath repowers we see fall in the FourStroke 60–115 HP range for runabouts and aluminum boats. Pro XS 115–175 HP shows up on bass boats and heavier pontoons. Smaller tiller setups land in the 9.9–25 HP range.' },
    ],
    visitExtra:
      "We're the repower side of the Harris Boat Works service team on Rice Lake. The same techs who write your quote are the ones who rig and water-test the motor on the lake we both run.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Hastings', href: '/locations/hastings' },
      { label: 'the Harris Boat Works service team on Rice Lake', href: 'https://www.harrisboatworks.ca/services' },
    ],
  },

  // 5. Hastings
  {
    slug: 'hastings',
    title: 'Mercury Repower for Hastings, Ontario Boaters',
    metaDescription:
      'Mercury repower 25–30 min from Hastings around Rice Lake. Mercury Premier Dealer. Trent-system boaters welcome. Pickup at Gores Landing.',
    region: 'Hastings',
    driveTime: 'about 25–30 minutes around Rice Lake from Hastings',
    lat: 44.3033,
    lng: -77.9483,
    h1: 'Mercury Repower for Hastings, Ontario Boaters',
    intro:
      "Harris Boat Works is 25–30 minutes from Hastings, around the Rice Lake shoreline to Gores Landing, ON. Distance is roughly 30 km by road. We're a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Hastings sits at the northeast end of Rice Lake, where the Trent-Severn Waterway runs north, many Hastings boaters run the Trent system. We rig, install, and water-test on Rice Lake before pickup at Gores Landing. No shipping. Typical full repower: $11,000–$40,000 CAD depending on HP.",
    keyFacts: [
      'Drive time: ~25–30 min around Rice Lake',
      'Distance: ~30 km by road',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Typical full repower: $11,000–$40,000 CAD',
      'Waterway: Trent-Severn runs north out of Hastings',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Hastings?',
        paragraphs: [
          'Hastings sits at the northeast end of Rice Lake, where the Trent-Severn Waterway leaves the lake and runs north. The drive from Hastings around to Gores Landing on the south shore is roughly 30 km and takes 25–30 minutes. By water it\'s a different story, boaters running south across Rice Lake reach our dock in much less time, but the road route is the one most repower customers use when the boat is on a trailer.',
          'The Hastings customer profile leans toward Trent-system boaters. People who run the lift locks, who move between Rice Lake and the lakes north of it, who put serious annual hours on a motor. That use pattern shapes the repower conversation, durability, fuel range, and torque profile matter more than top-end numbers.',
        ],
      },
      {
        heading: 'What Mercury motors do Hastings boaters typically repower with?',
        paragraphs: [
          'Hastings boats running the Trent often repower with Mercury FourStroke 115–150 HP. Heavier hulls and pontoons may move to Pro XS 175–225 HP after the capacity plate and setup are confirmed. Mercury Boost can improve mid-range acceleration on eligible motors, but it does not increase horsepower, top speed, or maximum RPM.',
          'For smaller utility boats and tinnies, tiller FourStroke 9.9–25 HP at $2,800–$5,500 CAD is the typical repower. For boats that put long hours on the water (Trent system, lakes north of it) current Mercury FourStrokes are quieter, more fuel-efficient, and come with the current Mercury Limited Warranty. We confirm the warranty offer at quote.',
        ],
      },
      {
        heading: 'Where do Hastings boaters launch?',
        paragraphs: [
          "Hastings sits right on the Trent-Severn Waterway at the northeast tip of Rice Lake. Public access in the area lets boaters drop into either Rice Lake itself or run north into the Trent system. We won't recommend a specific ramp, conditions and fees change, and the Trent-Severn Waterway is the right source for lock schedules and waterway updates.",
          "What matters for the repower is that we water-test on Rice Lake before you take the motor home. That's the same body of water Hastings boaters launch into when they want lake fishing rather than Trent runs, so the trial conditions are realistic, busy summer water, weed pockets, mid-lake chop.",
        ],
      },
      {
        heading: 'How does pickup work for Hastings customers?',
        paragraphs: [
          "You drive around to Gores Landing, 25–30 minutes, and pick up. We don't ship Mercury motors and we don't deliver to Hastings or to cottages along the Trent. The motor is rigged, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. Your boat is with us 2 to 5 days, drop-off to pickup; if the motor has to be ordered, that wait depends on the model and Mercury's current availability, and we give you a real date at order time.",
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For ranges by HP, see the Mercury repower cost guide. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Hastings?', answer: 'About 25–30 minutes by road around Rice Lake, roughly 30 km, to Gores Landing on the south shore.' },
      { question: 'Can I bring my boat to you by water from Hastings?', answer: 'Yes. If the old motor still runs, you can come down the Trent-Severn into Rice Lake and run to our docks in Gores Landing, typically much faster than the road route.' },
      { question: 'Do you deliver Mercury motors to Hastings?', answer: "No. We're pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive around to pick up." },
      { question: 'Do you serve Trent-Severn Waterway boaters from Hastings?', answer: 'Yes. The Trent runs north out of Hastings, and many of our Hastings customers use the Trent system regularly. The repower process is the same, install, water test on Rice Lake, pickup at Gores Landing.' },
      { question: 'What HP Mercury is common for Hastings and Trent-system boats?', answer: 'Hastings boats running the Trent often repower with Mercury FourStroke 115–150 HP or Pro XS 175–225 HP. The exact motor and gearcase depend on the hull rating, load, and setup.' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
      { label: 'Roseneath', href: '/locations/roseneath' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
  },

  // 6. Lakefield
  {
    slug: 'lakefield',
    title: 'Mercury Repower for Lakefield, Ontario Boaters',
    metaDescription:
      'Mercury repower 45 min south of Lakefield in Gores Landing. Mercury Premier Dealer. Stony Lake boats welcome. Pickup after Rice Lake water test.',
    region: 'Lakefield',
    driveTime: 'about 45 minutes south of Lakefield',
    lat: 44.4283,
    lng: -78.2667,
    h1: 'Mercury Repower for Lakefield, Ontario Boaters',
    intro:
      "Harris Boat Works is 45 minutes south of Lakefield in Gores Landing, ON, on the south shore of Rice Lake. The drive is roughly 45 km through Peterborough. We're a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Lakefield sits in the northern Kawarthas near Stony Lake, big-water territory with bigger boats and heavier repowers. We rig, install, and water-test on Rice Lake before pickup at Gores Landing. No shipping. Typical full repower: $11,000–$40,000 CAD, often at the higher end for Stony Lake hulls.",
    keyFacts: [
      'Drive time: ~45 min south to Gores Landing',
      'Distance: ~45 km via Peterborough',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Typical full repower: $11,000–$40,000 CAD',
      'Common segment: Stony Lake big-block and Pro XS V8 4.6L hulls',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Lakefield?',
        paragraphs: [
          'Lakefield sits north of Peterborough, on the Otonabee at the gateway to Stony Lake and the northern Kawarthas. The drive south to Gores Landing runs roughly 45 km, about 45 minutes through Peterborough on Highway 28 and out County Road 9.',
          "The drive is honest. We're not pretending it's a quick trip. Lakefield customers pick HBW because they want a Mercury Premier Dealer that's been rigging motors since 1965, a shop where the same techs who write the quote are the ones who do the water test, and a place that treats a Stony Lake hull seriously.",
        ],
      },
      {
        heading: 'What Mercury motors do Lakefield boaters typically repower with?',
        paragraphs: [
          'The mix runs heavier in this part of the Kawarthas. Stony Lake hulls, including bigger fiberglass runabouts, larger pontoons, and bowriders, may repower with Pro XS 200–300 HP or FourStroke 150–250 HP after the hull rating and setup are confirmed. Boost is available only on eligible motors and improves acceleration without adding horsepower or top speed.',
          "For pontoons and family runabouts on the smaller northern lakes, FourStroke 90–150 HP is the common repower at $11,000–$18,000 CAD. Some Lakefield customers ask about Verado V8 or V10 in the 250–400 HP range, that's special-order from us, starting around $25,000 for the motor alone, and we set expectations carefully on lead time.",
        ],
      },
      {
        heading: 'Where do Lakefield boaters launch?',
        paragraphs: [
          'Lakefield sits at the start of the northern Kawartha chain, Clear Lake, Stony Lake, the upper Otonabee. Public access points in the area serve a mix of cottage and resident boaters. We won\'t recommend specific launches because conditions and fees change. What we can say is that Stony Lake fishes differently than Rice Lake, deeper water, bigger waves on a windy day, different prop pitch profile.',
          "We don't water-test on Stony Lake. The trial is on Rice Lake. But the rigging conversation accounts for where the boat actually runs. Prop selection is part of the quote, not an afterthought, and we're setting it for your lake, not ours.",
        ],
      },
      {
        heading: 'How does pickup work for Lakefield customers?',
        paragraphs: [
          "You drive south to Gores Landing, 45 minutes, and pick up. We don't ship Mercury motors and we don't deliver to Lakefield or to Stony Lake cottages. Many Lakefield customers drop the boat with us during the quoting visit and pick it up after the rigging and water test. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup. Special-order motors can take longer to arrive; we give you a real date at order time.",
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable HP, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For ranges by HP, see the Mercury repower cost guide. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Lakefield?', answer: 'About 45 minutes south, roughly 45 km via Peterborough on Highway 28 and out County Road 9 into Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Lakefield or Stony Lake cottages?', answer: "No. We're pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive south to pick up." },
      { question: 'What HP Mercury is common for Stony Lake and northern Kawartha boats?', answer: 'Stony Lake boats often run bigger. Pro XS V8 4.6L 200–300 HP and FourStroke big-block 150–250 HP are common repowers in this segment, sometimes Verado V8/V10 250–400 HP on special order.' },
      { question: 'Can I drop my boat at HBW and pick it up later?', answer: 'Yes. Many Lakefield customers drop the boat with us during the quoting visit and pick it up after the rigging and water test. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup.' },
      { question: 'Can Lakefield customers finance a Mercury repower?', answer: 'Yes. Financing is 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 portable, $500 mid-range, $1,000 big-block, Pro XS, or special-order Verado. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Peterborough Mercury Dealer', href: '/locations/peterborough-mercury-dealer' },
      { label: 'Buckhorn', href: '/locations/buckhorn' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
  },

  // 7. Bridgenorth
  {
    slug: 'bridgenorth',
    title: 'Bridgenorth Mercury Repower',
    metaDescription:
      'Mercury Premier Dealer, 40 min south of Bridgenorth. Chemong Lake pontoon repowers, water-tested on Rice Lake, pickup at Gores Landing.',
    region: 'Bridgenorth',
    driveTime: 'about 40 minutes south of Bridgenorth',
    lat: 44.3833,
    lng: -78.3833,
    h1: 'Bridgenorth Mercury Repower',
    intro:
      'Harris Boat Works is 40 minutes south of Bridgenorth in Gores Landing, ON, on the south shore of Rice Lake. The drive is roughly 40 km through Peterborough. We are a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Bridgenorth sits on Chemong Lake, a strong pontoon and family-boat lake, a natural fit for Mercury FourStroke and Pro XS repowers. We rig, install, and water-test every Mercury on Rice Lake before pickup at Gores Landing. There is no shipping. Typical full repower: $11,000–$40,000 CAD.',
    keyFacts: [
      'Drive time: ~40 min south to Gores Landing',
      'Distance: ~40 km via Peterborough',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Common Chemong fit: FourStroke 90–150 HP and Pro XS 175 HP',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Bridgenorth?',
        paragraphs: [
          'Bridgenorth sits on the east shore of Chemong Lake, just north of Peterborough. The drive south to Gores Landing runs through Peterborough on Highway 28, then out County Road 9 to the south shore of Rice Lake, roughly 40 km, about 40 minutes. Manageable for a planned repower; not close enough to wing it, but close enough to treat HBW as a practical destination for an important job.',
          'Bridgenorth customers are usually Chemong Lake regulars. Chemong is a different body of water than Rice, shallower in spots, with its own weed patterns and a strong pontoon and family-boat scene. That community comes with a recognizable repower profile, and we have written a lot of those quotes since 1965.',
        ],
      },
      {
        heading: 'What Mercury motors do Bridgenorth boaters typically repower with?',
        paragraphs: [
          'Chemong Lake pontoons are the heart of this customer base. Mercury FourStroke 90–150 HP is common for cruising pontoons. Performance-leaning pontoons and tritoons may move to Pro XS 175 HP, a 3.4L V6, after the hull rating and load are confirmed. On eligible motors, Boost improves mid-range acceleration without adding horsepower or top speed.',
          'Bowriders and family runabouts on Chemong typically repower in the FourStroke 115–150 HP range. Smaller fishing boats and tinnies run tiller FourStroke 9.9–25 HP at $2,800–$5,500 CAD. Aluminum runabouts often land at FourStroke 60–90 HP, $8,000–$12,000 CAD. Chemong use tends to reward easy manners, clean starting, smooth cruising, good docking behavior, and enough torque when the boat is loaded with people, and we prop accordingly.',
        ],
      },
      {
        heading: 'Where do Bridgenorth boaters launch?',
        paragraphs: [
          'Chemong Lake has public access points serving Bridgenorth and the surrounding north-Peterborough belt. We do not single out a specific ramp here, fees and conditions change. Chemong is part of the broader Kawartha chain and connects through the Trent-Severn system, so Bridgenorth boaters who want to run the chain do that regularly.',
          'For the repower side, none of that changes how we rig the motor. The water test happens on Rice Lake, not Chemong, but the prop is picked for your hull, your load, and your home lake. Different lake, same Mercury Premier process.',
        ],
      },
      {
        heading: 'How does pickup work for Bridgenorth customers?',
        paragraphs: [
          'You drive south to Gores Landing, 40 minutes, and pick up. We do not ship Mercury motors and we do not deliver to Bridgenorth or to Chemong Lake cottages. The motor is installed, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup.',
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable HP, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For trade-ins, we usually email a CAD figure within one business day. For ranges by HP, see our Mercury repower cost guide. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Bridgenorth?', answer: 'About 40 minutes south, roughly 40 km via Peterborough to Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Bridgenorth or Chemong Lake?', answer: 'No. We are pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive south to pick up.' },
      { question: 'What HP Mercury is common for Chemong Lake pontoons?', answer: 'Chemong pontoons typically repower with Mercury FourStroke 90–150 HP. Some properly rated performance pontoons use a 175 HP Pro XS 3.4L V6; the correct choice depends on the hull, load, gearcase, and propeller.' },
      { question: 'Do you take trade-ins from Bridgenorth boaters?', answer: 'Yes. We take Mercury outboard trade-ins directly and other-brand trade-ins case by case for resale or wholesale. Fill the form and we usually email a CAD figure within one business day.' },
      { question: 'Is Bridgenorth a good fit for a full repower instead of patching an old motor?', answer: 'Often yes. Most Chemong boats are core summer-use boats with a 5-month season, a complete Mercury repower usually beats stacking repairs on an aging powerhead.' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Peterborough Mercury Dealer', href: '/locations/peterborough-mercury-dealer' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
  },

  // 8. Lindsay
  {
    slug: 'lindsay',
    title: 'Lindsay Mercury Repower',
    metaDescription:
      'Mercury Premier Dealer, ~60 min east of Lindsay. Sturgeon, Scugog, Cameron repowers welcome. Pickup at Gores Landing.',
    region: 'Lindsay',
    driveTime: 'about 60 minutes east of Lindsay',
    lat: 44.3550,
    lng: -78.7414,
    h1: 'Lindsay Mercury Repower',
    intro:
      'Harris Boat Works is roughly 60 minutes east of Lindsay in Gores Landing, ON, on the south shore of Rice Lake. The drive is around 70 km via Highway 7A and County Road 9. We are a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Lindsay is the largest town in Kawartha Lakes municipality, serving boaters on Sturgeon, Scugog, Cameron, and Balsam. We rig, install, and water-test every Mercury on Rice Lake before pickup at Gores Landing. There is no shipping. Typical full repower: $11,000–$40,000 CAD.',
    keyFacts: [
      'Drive time: ~60 min east to Gores Landing',
      'Distance: ~70 km via Highway 7A and County Road 9',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Lindsay is the largest town in Kawartha Lakes municipality',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Lindsay?',
        paragraphs: [
          'Lindsay sits on the Scugog River, in the heart of Kawartha Lakes municipality. The drive east to Gores Landing runs roughly 70 km, about 60 minutes via Highway 7A and County Road 9, and brings you to our shop on the south shore of Rice Lake.',
          'This is one of the longer drives in our regular service area, and we are direct about that. Lindsay customers pick us because they want a Mercury Premier Dealer with a real water test and a shop that has been rigging motors since 1965. An hour each way is reasonable when one team handles the whole job (motor, controls, cables, prop setup, and a verified on-water run) and there is no third party in the middle.',
        ],
      },
      {
        heading: 'What Mercury motors do Lindsay boaters typically repower with?',
        paragraphs: [
          'Lindsay-area customers run a wide spread across the Kawartha chain. On Sturgeon, Scugog, and Cameron, cruising pontoons and runabouts often repower with Mercury FourStroke 90–150 HP. Bigger fiberglass and performance pontoons may step up to Pro XS 175–225 HP. Boost can improve acceleration on an eligible motor, but it does not add horsepower or replace correct sizing and propping.',
          'On Balsam and Cameron, deeper-water boats sometimes look at FourStroke big-block 150–200 HP at $14,000–$24,000 CAD. Aluminum fishing boats and tiller setups continue to land at FourStroke 9.9–60 HP, $2,800–$10,000 CAD. We are not pushing Verado V8/V10, those are special-order from us and we are honest about lead time before we quote one.',
        ],
      },
      {
        heading: 'Where do Lindsay boaters launch?',
        paragraphs: [
          'Lindsay sits at the western edge of the Kawartha chain. Public access points serve Sturgeon, Scugog, Cameron, and the Trent-Severn Waterway connections that tie the chain together. We do not recommend specific ramps here, fees and conditions change, and your municipality and the Trent-Severn materials are the right sources.',
          'For repowers, none of that affects the rigging. The water test happens on Rice Lake, an hour east of your home lake, but the prop call is for your hull and your water. Mercury Boost capability, big-block torque profile, and prop pitch all get set for the actual lake the boat will live on.',
        ],
      },
      {
        heading: 'How does pickup work for Lindsay customers?',
        paragraphs: [
          'You drive east to Gores Landing, about an hour, and pick up. We do not ship Mercury motors and we do not deliver to Lindsay or to surrounding lakes. Most Lindsay customers drop the boat with us during quoting and pick it up after the rigging and water test. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup.',
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable HP, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For ranges by HP, see our Mercury repower cost guide. For the broader regional picture, our Kawartha Lakes page shows how we serve the whole chain. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Lindsay?', answer: 'About 60 minutes east, roughly 70 km via Highway 7A and County Road 9, to Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Lindsay or surrounding lakes?', answer: 'No. We are pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive east to pick up.' },
      { question: 'What HP Mercury is common for Sturgeon, Scugog, and Cameron Lake boats?', answer: 'Mid-range Mercury FourStroke 90–150 HP is common on cruising pontoons and runabouts. Pro XS 175–225 HP appears on properly rated bigger fiberglass and performance pontoons.' },
      { question: 'Can I finance a Mercury repower if I live in Lindsay?', answer: 'Yes. Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. We finalize numbers at quote. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).' },
      { question: 'Do Lindsay customers usually boat on more than one lake?', answer: 'Often, yes. Lindsay sits inside a broader Kawartha network, Sturgeon, Scugog, Cameron, and Balsam all see Lindsay traffic, and the Trent-Severn ties the chain together.' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works in Gores Landing. Full numbers on rates and terms are on the Harris Boat Works financing terms page. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Kawartha Lakes Mercury Outboards', href: '/locations/kawartha-lakes-mercury-outboards' },
      { label: 'Harris Boat Works financing terms', href: 'https://www.harrisboatworks.ca/financing' },
    ],
  },

  // 9. Bobcaygeon
  {
    slug: 'bobcaygeon',
    title: 'Bobcaygeon Mercury Repower',
    metaDescription:
      'Mercury Premier Dealer, ~75 min south of Bobcaygeon. Pigeon, Sturgeon, Buckhorn repowers welcome. Pickup at Gores Landing.',
    region: 'Bobcaygeon',
    driveTime: 'about 75 minutes south of Bobcaygeon',
    lat: 44.5400,
    lng: -78.5483,
    h1: 'Bobcaygeon Mercury Repower',
    intro:
      'Harris Boat Works is roughly 75 minutes south of Bobcaygeon in Gores Landing, ON, on the south shore of Rice Lake. The drive is around 80 km. We are a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Bobcaygeon sits between Pigeon and Sturgeon Lakes in the central Kawarthas, major boating country. Customers drive to us for pickup; we do not ship or deliver. Every Mercury we rig is water-tested on Rice Lake before pickup at Gores Landing. Typical full repower: $11,000–$40,000 CAD.',
    keyFacts: [
      'Drive time: ~75 min south to Gores Landing',
      'Distance: ~80 km',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Boating anchor: Pigeon, Sturgeon, Buckhorn corridor on the Trent-Severn',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Bobcaygeon?',
        paragraphs: [
          'Bobcaygeon sits between Pigeon Lake to the south and Sturgeon Lake to the north, on the lift lock that connects the two. The drive south to Gores Landing runs roughly 80 km and takes around 75 minutes, depending on the season and the route.',
          'That is a real drive, and we are not going to dress it up. Bobcaygeon customers come to us because they want a Mercury Premier Dealer, a water test on a real lake, and a shop where the same techs who built the quote are the ones who rig and run the boat off the dock. Bobcaygeon is destination boating country, the boat is central to the cottage week, and that usually makes the trip easier to justify.',
        ],
      },
      {
        heading: 'What Mercury motors do Bobcaygeon boaters typically repower with?',
        paragraphs: [
          'The Pigeon-Sturgeon-Buckhorn corridor sees a lot of mid-to-large repowers. Cruising pontoons and family runabouts often land at Mercury FourStroke 90–150 HP. Performance pontoons and bigger fiberglass may move to Pro XS 175–250 HP. Boost is a software calibration for eligible motors that improves acceleration; it does not add horsepower or top speed.',
          'Bigger bowriders and runabouts that live on Sturgeon sometimes look at FourStroke big-block 200 HP at $20,000–$24,000 CAD. Verado V8/V10 250–400 HP is special-order from us and we are honest about lead time before quoting one. For fishing boats and tinnies, tiller FourStroke 9.9–25 HP at $2,800–$5,500 CAD remains the common repower.',
        ],
      },
      {
        heading: 'Where do Bobcaygeon boaters launch?',
        paragraphs: [
          'Bobcaygeon connects directly to the Trent-Severn Waterway and sits on the lift lock between Pigeon and Sturgeon. Public access points across both lakes serve local and visiting boaters. We do not single out a specific ramp here, fees and conditions change, and the Trent-Severn Waterway is the right source for waterway updates.',
          'For the repower itself, the water test happens on Rice Lake. That is a different lake than Pigeon or Sturgeon, but the prop call is made for your hull and your home water. We are not stock-propping the boat. The choice accounts for where you actually run.',
        ],
      },
      {
        heading: 'How does pickup work for Bobcaygeon customers?',
        paragraphs: [
          'You drive south to Gores Landing, about 75 minutes, and pick up. We do not ship Mercury motors and we do not deliver to Bobcaygeon or to cottages on Pigeon, Sturgeon, or Buckhorn. Many Bobcaygeon customers drop the boat with us at the quote visit and pick it up after the rigging and water test are complete. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup.',
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable HP, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For ranges by HP, see our Mercury repower cost guide. For the closest companion read, our Buckhorn page covers the northern Kawartha side of the same corridor. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Bobcaygeon?', answer: 'About 75 minutes south, roughly 80 km, to Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Bobcaygeon or Pigeon Lake cottages?', answer: 'No. We are pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive south to pick up.' },
      { question: 'What HP Mercury is common for Pigeon and Sturgeon Lake boats?', answer: 'Cruising boats often run mid-range FourStroke 90–150 HP. Properly rated performance pontoons and bigger fiberglass boats may run Pro XS 175–250 HP.' },
      { question: 'Why drive 75 minutes for a repower?', answer: 'Because we are a Mercury Premier Dealer, selling Mercury since 1965, every motor gets water-tested on Rice Lake before pickup, and the same techs who write your quote are the ones who do the install.' },
      { question: 'Is Bobcaygeon far enough away that I should book early?', answer: 'Yes. If you want the boat ready for spring, January to April is the best booking window. Ice-out on Rice Lake is usually mid-April.' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Buckhorn', href: '/locations/buckhorn' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
  },

  // 10. Buckhorn
  {
    slug: 'buckhorn',
    title: 'Buckhorn Mercury Repower',
    metaDescription:
      'Mercury Premier Dealer, ~70 min south of Buckhorn. Northern Kawartha cottage repowers. Pickup at Gores Landing on Rice Lake.',
    region: 'Buckhorn',
    driveTime: 'about 70 minutes south of Buckhorn',
    lat: 44.5500,
    lng: -78.3333,
    h1: 'Buckhorn Mercury Repower',
    intro:
      'Harris Boat Works is roughly 70 minutes south of Buckhorn in Gores Landing, ON, on the south shore of Rice Lake. The drive is around 70 km via Highway 28 and County Road 9. We are a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Buckhorn sits in the northern Kawarthas on Lower Buckhorn Lake, cottage country with a strong mix of pontoon and runabout repowers. Customers drive to Gores Landing for pickup. There is no shipping. Typical full repower: $11,000–$40,000 CAD.',
    keyFacts: [
      'Drive time: ~70 min south to Gores Landing',
      'Distance: ~70 km via Highway 28 and County Road 9',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Water anchor: Lower Buckhorn Lake on the Trent-Severn',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'How far is Harris Boat Works from Buckhorn?',
        paragraphs: [
          'Buckhorn sits on Lower Buckhorn Lake in the northern Kawarthas, on the Trent-Severn Waterway between Lovesick Lake and Buckhorn Lake. The drive south to Gores Landing runs around 70 km, about 70 minutes, via Highway 28 through Peterborough and out County Road 9 to the south shore of Rice Lake.',
          'This is cottage country. A lot of our Buckhorn customers are second- or third-generation cottagers repowering boats they have owned for years. Many of these boats live on-site at the cottage, not on city trailers, and that changes the decision-making. Reliability and season-long confidence matter a lot because the boat is part of the place, not just a weekend toy. The drive is honest, the quote is honest, the timeline is honest.',
        ],
      },
      {
        heading: 'What Mercury motors do Buckhorn boaters typically repower with?',
        paragraphs: [
          'The northern Kawartha mix skews toward family boats and cottage pontoons. Mercury FourStroke 90–150 HP is common for cruising pontoons and runabouts. Properly rated performance pontoons and bigger fiberglass boats may move to Pro XS 175–225 HP. Boost can improve acceleration on an eligible motor but does not add horsepower or top speed.',
          'Bowriders and bigger runabouts on the larger lakes sometimes look at FourStroke big-block 200 HP at $20,000–$24,000 CAD. For aluminum fishing boats, tiller FourStroke 9.9–25 HP at $2,800–$5,500 CAD is the common path. Verado V8/V10 in the 250–400 HP range is special-order from us, starting around $25,000, and we set lead-time expectations before quoting.',
        ],
      },
      {
        heading: 'Where do Buckhorn boaters launch?',
        paragraphs: [
          'Buckhorn is part of the Trent-Severn corridor, with public access on Lower Buckhorn Lake and adjoining lakes. We are not singling out a specific ramp here, fees and conditions change, and the Trent-Severn Waterway is the right source for waterway and lock information.',
          'The water test for every Mercury we rig happens on Rice Lake, an hour south of Buckhorn. Different lake, same Mercury Premier process. The prop call gets made for your hull and your home water, not ours.',
        ],
      },
      {
        heading: 'How does pickup work for Buckhorn customers?',
        paragraphs: [
          'You drive south to Gores Landing, about 70 minutes, and pick up. We do not ship Mercury motors and we do not deliver to Buckhorn or to cottages on Lower Buckhorn Lake. Many Buckhorn customers drop the boat with us at the quote visit and return for pickup after the rigging and water test. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup. Winter bookings for spring launch, January through April, are the busiest window.',
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable HP, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For ranges by HP, see our Mercury repower cost guide. For the nearest companion read, our Bobcaygeon page covers the same northern Kawartha corridor from a different angle. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'How far is Harris Boat Works from Buckhorn?', answer: 'About 70 minutes south, roughly 70 km via Highway 28 and County Road 9, to Gores Landing on the south shore of Rice Lake.' },
      { question: 'Do you deliver Mercury motors to Buckhorn cottages?', answer: 'No. We are pickup-only at Gores Landing. We rig and water-test on Rice Lake, then you drive south to pick up.' },
      { question: 'What HP Mercury is common for Buckhorn Lake boats?', answer: 'Pontoons and family runabouts typically repower with Mercury FourStroke 90–150 HP. Properly rated performance pontoons and bigger fiberglass boats may run Pro XS 175–225 HP.' },
      { question: 'How long is the wait for a Mercury repower from Buckhorn?', answer: 'Your boat is with us 2 to 5 days once the motor arrives, drop-off to pickup. Winter bookings for spring launch are the busiest window, most Buckhorn customers book January through April.' },
      { question: 'Should Buckhorn cottagers plan repowers before spring?', answer: 'Yes. Ice-out on Rice Lake is usually mid-April. January to April is the right window if you want the boat tested and back up north for the first long weekend.' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Bobcaygeon', href: '/locations/bobcaygeon' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
  },

  // 11. Northumberland County
  {
    slug: 'northumberland-county',
    title: 'Northumberland County Mercury Repower',
    metaDescription:
      'Mercury Premier Dealer, based in Gores Landing on Rice Lake. All of Northumberland County within ~30 min. Pickup at our dock.',
    region: 'Northumberland County',
    driveTime: 'all county residents within ~30 minutes of Gores Landing',
    lat: 44.0000,
    lng: -78.1000,
    h1: 'Northumberland County Mercury Repower',
    intro:
      'Harris Boat Works is the Mercury Premier repower shop we run in Northumberland County. We sit in Gores Landing, ON, on the south shore of Rice Lake, at 5369 Harris Boat Works Rd. Every Northumberland resident (Cobourg, Port Hope, Hastings, Brighton, Bewdley, Gores Landing) is within a 30-minute drive. We are a Mercury Premier Dealer, selling Mercury since 1965 and family-owned since 1947. Customers drive to us for pickup; we do not ship or deliver. Every Mercury we rig is water-tested on Rice Lake. Typical full repower: $11,000–$40,000 CAD.',
    keyFacts: [
      'County: Northumberland, Ontario',
      `HBW coordinates: ${BUSINESS_COORDINATES_TEXT}`,
      'All county residents within ~30 min of Gores Landing',
      'Family-owned since 1947, Mercury Premier Dealer, selling Mercury since 1965',
      'Primary lake anchor: Rice Lake',
      'Typical full repower: $11,000–$40,000 CAD',
    ],
    sections: [
      {
        heading: 'Is Harris Boat Works in Northumberland County?',
        paragraphs: [
          'Yes. Gores Landing is in Northumberland County, on the south shore of Rice Lake, and we are the village marina. The county wraps from Lake Ontario in the south (Cobourg, Port Hope, Brighton) up to Rice Lake in the north (Bewdley, Gores Landing, Roseneath, Hastings on the county line). Most of it is within 30 minutes of our dock.',
          "For in-county residents, we are usually the closest Mercury Premier repower option. Three generations of the same family have rigged motors out of this address since 1947. We have been a Mercury dealer since 1965, and today we hold Mercury's Premier Dealer tier.",
        ],
      },
      {
        heading: 'How far is HBW from each major Northumberland town?',
        paragraphs: [
          'Honest drive times to Gores Landing:',
          '- Bewdley: ~15 minutes west along the Rice Lake shore\n- Roseneath: ~15 minutes east along the Rice Lake shore\n- Cobourg: ~25 minutes south\n- Hastings: ~25–30 minutes around Rice Lake (Hastings sits at the county line)\n- Port Hope: ~30 minutes south\n- Brighton: ~40 minutes southeast',
          'All inside our regular service window. Each of these towns has its own location page on this site, see Cobourg for one of the most common in-county routes.',
        ],
      },
      {
        heading: 'What Mercury motors do Northumberland boaters typically repower with?',
        paragraphs: [
          "Most Northumberland repowers are for Rice Lake boats. Rice Lake is the county's main inland lake and our home water. The common mix:",
          '- Tiller FourStroke 9.9–25 HP on tinnies: $2,800–$5,500 CAD\n- FourStroke 60–115 HP on runabouts and aluminum: $8,000–$14,000 CAD\n- Pro XS 115–175 HP on bass boats and faster pontoons: $15,000–$22,000 CAD\n- Big-block FourStroke 150–200 HP on heavier fiberglass: $14,000–$24,000 CAD',
          'For pontoon owners running loaded weekends, the first checks are hull rating, propeller, and setup. The 175 HP Pro XS is a 3.4L V6. Boost can improve acceleration on an eligible motor, but it does not add horsepower or top speed. Rice Lake can be shallow, weedy, and busy in summer, so we prop for the actual boat and load.',
        ],
      },
      {
        heading: 'Where do Northumberland County boaters launch?',
        paragraphs: [
          'County boaters launch from all around Rice Lake and from private waterfront across the region. Cobourg and Port Hope owners often head inland to Rice Lake. Bewdley, Gores Landing, Roseneath, and Hastings owners are already tied directly to it. We do not single out specific ramps, fees and conditions change, but the launching pattern is what makes this a regional page rather than a single-town page.',
          'The important constant is still Gores Landing. No matter where in the county you boat, the repower itself is installed, tested, and handed off here. One clear destination instead of a scattered service process.',
        ],
      },
      {
        heading: 'How does pickup work for Northumberland County customers?',
        paragraphs: [
          'Same for everyone, in-county or out. We do not ship Mercury motors and we do not deliver, not within Cobourg, not to a Port Hope address, not even within Gores Landing. The motor is rigged, propped, fuel-connected, controls run, and water-tested on Rice Lake before you arrive. You drive to Gores Landing and pick up. Your boat is with us 2 to 5 days once the motor lands, drop-off to pickup.',
          'Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. Deposits are $200 for portable HP, $500 for mid-range, $1,000 for big-block, Pro XS, or special-order Verado. For trade-ins, fill the form and we usually email a CAD figure within one business day. For full HP ranges, see our Mercury repower cost guide. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).',
        ],
      },
    ],
    faqs: [
      { question: 'Is Harris Boat Works in Northumberland County?', answer: 'Yes. We are in Gores Landing, on the south shore of Rice Lake, inside Northumberland County. Address: 5369 Harris Boat Works Rd, K0K 2E0.' },
      { question: 'How far is HBW from Cobourg, Port Hope, or Brighton?', answer: 'Cobourg is ~25 minutes, Port Hope ~30 minutes, Brighton ~40 minutes. Most Northumberland residents are within 30 minutes of Gores Landing.' },
      { question: 'Do you deliver Mercury motors within Northumberland County?', answer: 'No. We are pickup-only at Gores Landing, even for in-county customers. We rig, water-test on Rice Lake, and you drive to us.' },
      { question: 'What HP Mercury do Northumberland boaters typically repower with?', answer: 'Most Northumberland repowers are for Rice Lake boats: FourStroke 60–115 HP for runabouts and aluminum, Pro XS 115–175 HP for bass boats and faster fiberglass.' },
      { question: 'Can Northumberland County customers finance a repower?', answer: 'Yes. Financing runs 7.99% APR over $10,000 and 8.99% APR under $10,000, OAC. We finalize numbers at quote. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD Always On program (OAC).' },
    ],
    visitExtra:
      "We're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. The same techs who write your quote are the ones who rig and water-test the motor on Rice Lake.",
    related: [
      { label: 'Pricing Reference', href: '/pricing-reference' },
      { label: 'Cobourg Northumberland Mercury', href: '/locations/cobourg-northumberland-mercury' },
      { label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947', href: 'https://www.harrisboatworks.ca/aboutus' },
    ],
  },
];

export const longFormLocations: LocationPageData[] = SPECS.map(toLocation);
export const longFormLocationSlugs = SPECS.map((s) => s.slug);
