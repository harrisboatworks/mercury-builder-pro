import type { LocationLongForm } from './locationsLongForm';
import { longFormLocations, longFormLocationSlugs } from './locationsLongForm';
import { LOCATION_LONGFORM_UPGRADES } from './locationsLongFormUpgrades';

export interface LocationLink {
  label: string;
  href: string;
}

export interface LocationFAQ {
  question: string;
  answer: string;
}

export interface LocationPageData {
  slug: string;
  title: string;
  metaDescription: string;
  region: string;
  regionType: 'city' | 'region';
  keyword: string;
  driveTime: string;
  driveRoute?: string;
  intro: string;
  /** Bullet facts about local boating context, lakes/marinas customers boat from. NOT services we deliver there. */
  localContext: string[];
  popularBoats: string[];
  /** Mercury HP ranges typical for this market, e.g. "9.9–25 HP kicker". */
  popularHpRanges: string[];
  whyChooseUs: string[];
  recommendedLinks: LocationLink[];
  /** Pinned, not fuzzy-matched. */
  relatedCaseStudySlugs?: string[];
  faqs: LocationFAQ[];
  /** Canonical pickup-only sentence. */
  pickupPolicy: string;
  /** Canonical "we don't travel to {city}" disclaimer. */
  serviceBoundary: string;
  /** Optional rich body for long-form location pages (Bucket 2). */
  longForm?: LocationLongForm;
}

const PICKUP_POLICY =
  'Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON. We do not deliver or ship outboards.';

const boundary = (city: string) =>
  `Harris Boat Works does not perform mobile service, on-site installs, or driveway/marina visits in ${city}. Customers from ${city} bring their boat to our Gores Landing shop, or pick up a loose Mercury motor for self-install.`;

const TRUST_FACTS = [
  'Family-owned in Gores Landing since 1947',
  'Mercury Marine Platinum Dealer (top customer-satisfaction tier)',
  'Authorized Mercury dealer since 1965, Mercury is our only outboard brand',
  'Live CAD pricing online, no "call for price"',
  'Every installed repower is lake-tested on Rice Lake before pickup',
];

const QUOTE_LINK: LocationLink = { label: 'Build a Mercury quote (CAD, itemized)', href: '/quote/motor-selection' };
const REPOWER_LINK: LocationLink = { label: 'Mercury repower cost guide (Ontario, CAD)', href: '/blog/mercury-repower-cost-ontario-2026-cad' };
const COMPARE_LINK: LocationLink = { label: 'Compare 115 vs 150 HP for Ontario boats', href: '/blog/mercury-115-vs-150-hp-outboard-ontario' };
const PONTOON_LINK: LocationLink = { label: 'Best Mercury outboards for pontoons', href: '/blog/best-mercury-outboard-pontoon-boats' };
const HOWTO_LINK: LocationLink = { label: 'How to repower your boat, step by step', href: '/how-to-repower-a-boat' };
const PROXS_LINK: LocationLink = { label: 'Mercury Pro XS lineup', href: '/mercury-pro-xs' };
const CONTACT_LINK: LocationLink = { label: 'Directions to Gores Landing', href: '/contact' };

export const locations: LocationPageData[] = [
  // ============ NORTHUMBERLAND / KAWARTHAS ============
  {
    slug: 'rice-lake-mercury-repower',
    title: 'Mercury Repower on Rice Lake, Harris Boat Works, Gores Landing, Ontario',
    metaDescription:
      'Rice Lake Mercury repower specialist. Mercury dealer since 1965, family-owned in Gores Landing since 1947. Live CAD pricing, pickup only, lake-tested.',
    region: 'Rice Lake',
    regionType: 'region',
    keyword: 'mercury repower rice lake',
    driveTime: 'local, south shore of Rice Lake',
    driveRoute: 'Harris Boat Works Rd, Gores Landing',
    intro:
      'Harris Boat Works has been Rice Lake’s Mercury repower specialist for three generations. Family-owned in Gores Landing since 1947, Mercury dealer since 1965, with every installed repower lake-tested on Rice Lake before you take it home.',
    localContext: [
      'On the south shore of Rice Lake, local launches at Gores Landing, Bewdley, Hastings, and Harwood',
      'Trent, Severn Waterway access for cottage-to-cottage cruising',
      'Mixed walleye, bass, and muskie fishery shapes most repower decisions',
    ],
    popularBoats: ['Aluminum fishing boats (14–18 ft)', 'Bass boats', 'Walkaround cuddy and small fibreglass', 'Pontoons'],
    popularHpRanges: ['9.9–25 HP kicker / tiller', '40–90 HP fishing repowers', '115–150 HP family and pontoon', '150–200 HP Pro XS bass'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      { label: 'Bass boat repower case study (150 → 150 Pro XS)', href: '/case-studies/bass-boat-150-to-150-pro-xs' },
      { label: 'Walkaround cuddy repower (90 → 115 EFI)', href: '/case-studies/walkaround-cuddy-90-to-115-efi' },
      REPOWER_LINK,
    ],
    relatedCaseStudySlugs: ['bass-boat-150-to-150-pro-xs', 'walkaround-cuddy-90-to-115-efi', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'Is Harris Boat Works on Rice Lake?', answer: 'Yes. We are at 5369 Harris Boat Works Rd, Gores Landing, ON, on the south shore of Rice Lake, the closest Mercury Marine Platinum Dealer to the lake, family-owned since 1947 and an authorized Mercury dealer since 1965.' },
      { question: 'Can I get a Mercury repower quote in CAD before driving here?', answer: 'Yes. Build a complete itemized Mercury repower quote at /quote/motor-selection, motor, controls, propeller, install, financing, and trade-in credit. The price you see is the price you pay.' },
      { question: 'Do you ship or deliver outboards?', answer: 'No. Pickup only at Gores Landing with photo ID. We do not ship motors and we do not deliver, strict industry-wide fraud-prevention policy.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Rice Lake area'),
  },
  {
    slug: 'peterborough-mercury-dealer',
    title: 'Mercury Dealer Near Peterborough, Harris Boat Works (35 min south)',
    metaDescription:
      'Peterborough customers’ closest Mercury Platinum Dealer. About 35 minutes south on Rice Lake. Live CAD pricing online, pickup at Gores Landing.',
    region: 'Peterborough',
    regionType: 'city',
    keyword: 'mercury dealer peterborough',
    driveTime: 'about 35 minutes south of Peterborough',
    driveRoute: 'County Rd 28 South → Bewdley → Gores Landing',
    intro:
      'Harris Boat Works is the closest Mercury Marine Platinum Dealer to Peterborough, about 35 minutes south on the shore of Rice Lake. Peterborough boaters have been buying Mercury outboards from us for over 60 years.',
    localContext: [
      'Easy access for Lakefield, Bridgenorth, Buckhorn, and the wider Kawartha Lakes',
      'Customers commonly trailer down from Stoney, Chemong, Buckhorn, and Pigeon Lake',
      'Trent, Severn Waterway boaters use us for repowers and kicker upgrades',
    ],
    popularBoats: ['Aluminum fishing boats', 'Pontoons', 'Family runabouts', 'Cottage utility boats'],
    popularHpRanges: ['9.9–25 HP kicker', '40–90 HP fishing', '115–150 HP family and pontoon'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      { label: 'Aluminum fishing repower case study (60 → 90)', href: '/case-studies/aluminum-fishing-60-to-90-fourstroke' },
      PONTOON_LINK,
      REPOWER_LINK,
    ],
    relatedCaseStudySlugs: ['aluminum-fishing-60-to-90-fourstroke', 'pontoon-family-40-to-115-command-thrust'],
    faqs: [
      { question: 'How far is Harris Boat Works from Peterborough?', answer: 'About 35 minutes south via County Rd 28 to Bewdley, then Gores Landing on Rice Lake.' },
      { question: 'Can Peterborough customers get a Mercury quote without calling?', answer: 'Yes. Build a complete itemized CAD quote at /quote/motor-selection in about 3 minutes.' },
      { question: 'Do you deliver to Peterborough?', answer: 'No. Pickup only at Gores Landing. Bring the boat down for installation, or pick up a loose Mercury motor for self-install.' },
      { question: 'Do you handle Mercury repowers for older Kawartha boats?', answer: 'Yes, that is one of our core use cases. We are Mercury-only and have been since 1965.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Peterborough'),
  },
  {
    slug: 'kawartha-lakes-mercury-outboards',
    title: 'Mercury Outboards for the Kawartha Lakes, Harris Boat Works',
    metaDescription:
      'Mercury outboards and repowers for Kawartha Lakes boaters. Live CAD pricing, Mercury Platinum Dealer, pickup at Gores Landing on Rice Lake.',
    region: 'Kawartha Lakes',
    regionType: 'region',
    keyword: 'kawartha lakes outboard motor',
    driveTime: 'within practical pickup range of Gores Landing (45–75 min)',
    driveRoute: 'Hwy 7 / County Rd 28 to the south end of Rice Lake',
    intro:
      'Kawartha Lakes boaters use Harris Boat Works for practical Mercury recommendations grounded in real Ontario lake use, fishing, family cruising, and cottage utility, with transparent CAD pricing and no "call for price" runaround.',
    localContext: [
      'Customers commonly boat on Sturgeon, Pigeon, Buckhorn, Stoney, Balsam, and Cameron Lakes',
      'Many cottage boats are repower candidates, older 2-stroke 50–90 HP outboards moving to modern Mercury FourStroke',
      'Pontoon population is growing; Command Thrust is a frequent recommendation',
    ],
    popularBoats: ['Cottage fishing boats', 'Pontoons', 'Utility boats', 'Family runabouts'],
    popularHpRanges: ['9.9–25 HP kicker', '40–115 HP cottage fishing', '90–150 HP pontoon and family'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      { label: 'Pontoon family repower (40 → 115 Command Thrust)', href: '/case-studies/pontoon-family-40-to-115-command-thrust' },
      PONTOON_LINK,
      HOWTO_LINK,
    ],
    relatedCaseStudySlugs: ['pontoon-family-40-to-115-command-thrust', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'Are your recommendations appropriate for Kawartha lake conditions?', answer: 'Yes. We write for real Ontario lake use, Sturgeon, Pigeon, Buckhorn, Balsam, not generic brochure use.' },
      { question: 'Do you quote in USD?', answer: 'No. All pricing is CAD only.' },
      { question: 'Can Kawartha Lakes customers compare motors before driving down?', answer: 'Yes. Use the quote builder or the motor pages, both show live CAD pricing.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('the Kawartha Lakes region'),
  },
  {
    slug: 'cobourg-northumberland-mercury',
    title: 'Mercury Dealer for Cobourg & Northumberland, Harris Boat Works',
    metaDescription:
      'Cobourg, Port Hope, and Northumberland Mercury dealer. About 20–25 minutes north of Cobourg. Live CAD pricing, pickup at Gores Landing.',
    region: 'Cobourg & Northumberland',
    regionType: 'region',
    keyword: 'cobourg outboard motor',
    driveTime: 'about 20–25 minutes north of Cobourg',
    driveRoute: 'Hwy 401 → County Rd 18 North → Gores Landing',
    intro:
      'Cobourg, Port Hope, and Northumberland buyers use Harris Boat Works as their Mercury dealer for the same reason locals do: a real CAD quote in 3 minutes, Mercury-only expertise since 1965, and a clear pickup process at Gores Landing.',
    localContext: [
      'About 20–25 minutes inland from the Cobourg waterfront',
      'Customers boat on Lake Ontario, Rice Lake, and the Trent, Severn',
      'Common repower path: replacing tired 50–90 HP cottage outboards with modern FourStroke',
    ],
    popularBoats: ['Pontoons', 'Aluminum and fibreglass fishing boats', 'Family runabouts'],
    popularHpRanges: ['9.9–25 HP kicker', '40–90 HP fishing', '115–150 HP family and pontoon'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      PONTOON_LINK,
      REPOWER_LINK,
      CONTACT_LINK,
    ],
    relatedCaseStudySlugs: ['pontoon-family-40-to-115-command-thrust', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'How far is Harris Boat Works from Cobourg?', answer: 'About 20–25 minutes north via County Rd 18 from Hwy 401.' },
      { question: 'Where is pickup?', answer: 'Pickup is at our shop in Gores Landing on Rice Lake, not at the Cobourg waterfront.' },
      { question: 'Can I get a quote before driving up?', answer: 'Yes. Build a complete itemized CAD quote online at /quote/motor-selection first.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Cobourg, Port Hope, and Northumberland'),
  },

  // ============ DURHAM CITIES ============
  {
    slug: 'whitby-mercury-dealer',
    title: 'Mercury Dealer for Whitby, Harris Boat Works (Gores Landing, ON)',
    metaDescription:
      'Whitby buyers’ Mercury Platinum Dealer. About 70 minutes east via 401. Live CAD pricing online, pickup at Gores Landing on Rice Lake.',
    region: 'Whitby',
    regionType: 'city',
    keyword: 'mercury dealer whitby',
    driveTime: 'about 70 minutes east of Whitby via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'Harris Boat Works is the Mercury Platinum Dealer most Whitby boaters drive to, about 70 minutes east on the 401. Live CAD pricing online, full Mercury lineup, and a clean pickup process at our Gores Landing shop.',
    localContext: [
      'Whitby boaters commonly launch on Lake Ontario, Lake Scugog, and Lake Simcoe',
      'Many trailer cottage boats up to Rice Lake or the Kawarthas, short trip to our shop on the way',
      'Repowers are a common reason Whitby customers find us, older 50–115 HP outboards moving to modern FourStroke',
    ],
    popularBoats: ['Lake Ontario fishing and runabouts', 'Scugog bass and walleye boats', 'Cottage pontoons trailered north'],
    popularHpRanges: ['9.9–25 HP kicker / sailboat auxiliary', '60–115 HP fishing repower', '150–200 HP Pro XS bass'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      COMPARE_LINK,
      PROXS_LINK,
      HOWTO_LINK,
    ],
    relatedCaseStudySlugs: ['bass-boat-150-to-150-pro-xs', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'How far is Harris Boat Works from Whitby?', answer: 'About 70 minutes east via Hwy 401, exit at Cobourg, then County Rd 18 north to Gores Landing.' },
      { question: 'Do you deliver Mercury outboards to Whitby?', answer: 'No. Pickup only at Gores Landing. Bring the boat for installation, or pick up a loose Mercury motor for self-install.' },
      { question: 'Can I finalize a Whitby Mercury quote online?', answer: 'You can build a complete itemized CAD quote online and we confirm the build by phone before pickup.' },
      { question: 'Do you do mobile service in Whitby?', answer: 'No. Harris Boat Works is a shop-based Mercury dealer in Gores Landing, no mobile service, no on-site installs in Whitby.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Whitby'),
  },
  {
    slug: 'ajax-mercury-dealer',
    title: 'Mercury Dealer for Ajax, Harris Boat Works (Gores Landing, ON)',
    metaDescription:
      'Ajax buyers’ Mercury Platinum Dealer. About 75 minutes east via 401. Live CAD pricing online, pickup at Gores Landing on Rice Lake.',
    region: 'Ajax',
    regionType: 'city',
    keyword: 'mercury dealer ajax',
    driveTime: 'about 75 minutes east of Ajax via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'For Ajax boaters, Harris Boat Works is the closest Mercury Platinum Dealer with live CAD pricing and a transparent build process, about 75 minutes east on the 401, family-owned since 1947.',
    localContext: [
      'Ajax boaters commonly fish Lake Ontario and trailer to Lake Scugog or Rice Lake',
      'Cottage owners north of the city often handle repowers through Harris Boat Works on the way to camp',
      'A clean east-bound 401 trip, no GTA backtracking required',
    ],
    popularBoats: ['Lake Ontario runabouts', 'Aluminum fishing boats', 'Cottage pontoons'],
    popularHpRanges: ['9.9–25 HP kicker', '60–115 HP fishing and pontoon', '150 HP family'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      COMPARE_LINK,
      PONTOON_LINK,
      HOWTO_LINK,
    ],
    relatedCaseStudySlugs: ['aluminum-fishing-60-to-90-fourstroke', 'pontoon-family-40-to-115-command-thrust'],
    faqs: [
      { question: 'How far is Harris Boat Works from Ajax?', answer: 'About 75 minutes east via Hwy 401, exit at Cobourg, then north to Gores Landing on Rice Lake.' },
      { question: 'Do you come to Ajax for service or installs?', answer: 'No. We are a shop-based Mercury dealer, no mobile service, no driveway or marina visits. All work is done at Gores Landing.' },
      { question: 'Can Ajax customers get a quote without calling?', answer: 'Yes. Build a complete CAD quote at /quote/motor-selection first, then we confirm by phone.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Ajax'),
  },
  {
    slug: 'pickering-mercury-dealer',
    title: 'Mercury Dealer for Pickering, Harris Boat Works (Gores Landing, ON)',
    metaDescription:
      'Pickering buyers’ Mercury Platinum Dealer. About 80 minutes east via 401. Live CAD pricing online, pickup at Gores Landing on Rice Lake.',
    region: 'Pickering',
    regionType: 'city',
    keyword: 'mercury dealer pickering',
    driveTime: 'about 80 minutes east of Pickering via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'Pickering boaters use Harris Boat Works for the same reason buyers across Durham do, Mercury-only expertise, live CAD pricing, and an itemized quote you can read before driving to the shop.',
    localContext: [
      'Frenchman’s Bay sailors and Lake Ontario boaters often need kicker outboards or sailboat auxiliaries',
      'Cottage owners trailering north to the Kawarthas pick up motors on the way through Cobourg',
      'Repower work for older 50–115 HP outboards is the most common conversation',
    ],
    popularBoats: ['Sailboat auxiliaries', 'Lake Ontario runabouts', 'Cottage utility boats'],
    popularHpRanges: ['5–9.9 HP sailboat auxiliary', '9.9–25 HP kicker', '60–115 HP cottage repower'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      COMPARE_LINK,
      HOWTO_LINK,
      REPOWER_LINK,
    ],
    relatedCaseStudySlugs: ['cedar-strip-9-9-fourstroke', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'How far is Harris Boat Works from Pickering?', answer: 'About 80 minutes east on the 401, exiting at Cobourg.' },
      { question: 'Do you do mobile Mercury service in Pickering?', answer: 'No. Harris Boat Works is a shop-based Mercury dealer in Gores Landing, no mobile service in Pickering. Customers from Pickering bring the boat to our Gores Landing shop.' },
      { question: 'Do you sell small kicker and sailboat outboards?', answer: 'Yes. We carry the full Mercury FourStroke lineup from 2.5 HP up.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Pickering'),
  },
  {
    slug: 'oshawa-mercury-dealer',
    title: 'Mercury Dealer for Oshawa, Harris Boat Works (Gores Landing, ON)',
    metaDescription:
      'Oshawa buyers’ Mercury Platinum Dealer. About 60 minutes east via 401. Live CAD pricing online, pickup at Gores Landing on Rice Lake.',
    region: 'Oshawa',
    regionType: 'city',
    keyword: 'mercury dealer oshawa',
    driveTime: 'about 60 minutes east of Oshawa via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'For Oshawa boaters, Harris Boat Works is roughly an hour east on the 401, Mercury Platinum Dealer, live CAD pricing online, and an itemized quote you can sanity-check before driving up.',
    localContext: [
      'Oshawa boaters commonly fish Lake Ontario and Lake Scugog',
      'Many own cottages on Rice Lake, Scugog, or in the Kawarthas, pickup en route',
      'Repower of 60–115 HP outboards is the most common service driver',
    ],
    popularBoats: ['Lake Ontario fishing rigs', 'Scugog bass boats', 'Cottage pontoons'],
    popularHpRanges: ['9.9–25 HP kicker', '60–115 HP fishing and pontoon', '150–200 HP Pro XS'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      PROXS_LINK,
      COMPARE_LINK,
      HOWTO_LINK,
    ],
    relatedCaseStudySlugs: ['bass-boat-150-to-150-pro-xs', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'How far is Harris Boat Works from Oshawa?', answer: 'About 60 minutes east via Hwy 401 to Cobourg, then north to Gores Landing.' },
      { question: 'Do you deliver Mercury outboards to Oshawa?', answer: 'No. Pickup only at our Gores Landing shop on Rice Lake.' },
      { question: 'Can Oshawa customers handle a Mercury repower with you?', answer: 'Yes. Bring the boat down for installation, or pick up a loose Mercury motor for self-install.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Oshawa'),
  },
  {
    slug: 'bowmanville-courtice-mercury-dealer',
    title: 'Mercury Dealer for Bowmanville & Courtice, Harris Boat Works',
    metaDescription:
      'Bowmanville and Courtice buyers’ Mercury Platinum Dealer. About 50 minutes east via 401. Live CAD pricing, pickup at Gores Landing on Rice Lake.',
    region: 'Bowmanville & Courtice',
    regionType: 'city',
    keyword: 'mercury dealer bowmanville',
    driveTime: 'about 50 minutes east of Bowmanville / Courtice via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'Bowmanville and Courtice are the closest Durham communities to Harris Boat Works, about 50 minutes east on the 401. Mercury Platinum Dealer, family-owned since 1947, live CAD pricing online.',
    localContext: [
      'Convenient cottage-country access via Rice Lake, Scugog, and the Kawarthas',
      'Lake Ontario boaters in Newcastle and Bowmanville commonly fish out of Port Darlington',
      'Many customers pick up loose Mercury motors here for self-install on cottage boats',
    ],
    popularBoats: ['Aluminum fishing boats', 'Pontoons', 'Lake Ontario runabouts'],
    popularHpRanges: ['9.9–25 HP kicker', '40–115 HP fishing and pontoon', '150 HP family'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      PONTOON_LINK,
      COMPARE_LINK,
      HOWTO_LINK,
    ],
    relatedCaseStudySlugs: ['pontoon-family-40-to-115-command-thrust', 'aluminum-fishing-60-to-90-fourstroke'],
    faqs: [
      { question: 'How far is Harris Boat Works from Bowmanville?', answer: 'About 50 minutes east on Hwy 401, the closest GTA-edge community to our shop.' },
      { question: 'Do you do mobile service in Bowmanville or Courtice?', answer: 'No. Harris Boat Works is a shop-based Mercury dealer in Gores Landing. Customers from Bowmanville and Courtice bring the boat to us.' },
      { question: 'Can I pick up just the motor for self-install?', answer: 'Yes. Loose-motor pickups are a common path for Bowmanville and Courtice customers.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Bowmanville and Courtice'),
  },

  // ============ GTA UMBRELLA ============
  {
    slug: 'gta-mercury-outboards',
    title: 'Mercury Outboards for the Greater Toronto Area, Harris Boat Works',
    metaDescription:
      'GTA Mercury outboard sales and repower. About 90 minutes east of Toronto via 401. Live CAD pricing, pickup at Gores Landing on Rice Lake.',
    region: 'Greater Toronto Area',
    regionType: 'region',
    keyword: 'mercury outboard gta',
    driveTime: 'about 90 minutes east of downtown Toronto via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'For Greater Toronto Area boaters, Harris Boat Works is the Mercury Platinum Dealer worth the drive, about 90 minutes east on the 401, with live CAD pricing online and an itemized quote you can read before you leave the city.',
    localContext: [
      'GTA boaters use Lake Ontario, Lake Simcoe, Lake Scugog, and the Kawarthas',
      'Many GTA cottagers pick up motors on the way to Rice Lake, the Kawarthas, or the Trent, Severn',
      'Common scenario: replacing a 1990s, 2000s 50–115 HP outboard with a modern Mercury FourStroke',
    ],
    popularBoats: ['Cottage fishing boats', 'Pontoons', 'Family runabouts', 'Sailboat auxiliaries'],
    popularHpRanges: ['5–9.9 HP sailboat auxiliary', '9.9–25 HP kicker', '60–115 HP fishing and pontoon', '150–200 HP Pro XS'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      { label: 'Whitby customers', href: '/locations/whitby-mercury-dealer' },
      { label: 'Ajax customers', href: '/locations/ajax-mercury-dealer' },
      { label: 'Pickering customers', href: '/locations/pickering-mercury-dealer' },
      { label: 'Oshawa customers', href: '/locations/oshawa-mercury-dealer' },
      { label: 'Bowmanville & Courtice customers', href: '/locations/bowmanville-courtice-mercury-dealer' },
      COMPARE_LINK,
    ],
    relatedCaseStudySlugs: ['aluminum-fishing-60-to-90-fourstroke', 'pontoon-family-40-to-115-command-thrust', 'bass-boat-150-to-150-pro-xs'],
    faqs: [
      { question: 'How far is Harris Boat Works from Toronto?', answer: 'About 90 minutes east of downtown via Hwy 401, exit at Cobourg, then County Rd 18 north to Gores Landing on Rice Lake.' },
      { question: 'Do you deliver Mercury outboards to the GTA?', answer: 'No. Pickup only at Gores Landing with photo ID. We do not ship motors and we do not deliver, strict industry-wide fraud-prevention policy.' },
      { question: 'Do you do mobile service in the GTA?', answer: 'No. Harris Boat Works is a shop-based Mercury dealer in Gores Landing. We do not perform on-site installs, driveway service, or marina visits in any GTA city.' },
      { question: 'Why would a GTA buyer drive to Rice Lake?', answer: 'For real CAD pricing online, Mercury-only expertise since 1965, Platinum-tier customer-satisfaction status, and a clean pickup walk-through that protects your warranty registration.' },
      { question: 'Can I finance a Mercury motor as a GTA customer?', answer: 'Yes, financing is available on outboards $5,000+ in CAD. Build a quote and finance options appear with the price.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('any GTA city'),
  },

  // ============ DURHAM REGIONAL HUB (existing slug kept for redirects/legacy) ============
  {
    slug: 'durham-gta-mercury-pickup',
    title: 'Mercury Outboard Pickup for Durham Region, Harris Boat Works',
    metaDescription:
      'Durham Region Mercury outboard pickup. About 50–80 minutes east via 401. Live CAD pricing online, pickup at Gores Landing on Rice Lake.',
    region: 'Durham Region',
    regionType: 'region',
    keyword: 'mercury outboard durham',
    driveTime: 'about 50–80 minutes east of Durham communities via Hwy 401',
    driveRoute: 'Hwy 401 East → Cobourg → County Rd 18 North → Gores Landing',
    intro:
      'Durham Region boaters, Whitby, Ajax, Pickering, Oshawa, Bowmanville, Courtice, use Harris Boat Works as their Mercury Platinum Dealer. Real CAD pricing online, pickup at Gores Landing, no mobile service or delivery.',
    localContext: [
      'Customers boat on Lake Ontario, Lake Scugog, Rice Lake, and the Kawarthas',
      'Closest Durham community is Bowmanville (~50 min); furthest is Pickering (~80 min)',
      'Common path: build CAD quote online, confirm by phone, drive up for pickup or install',
    ],
    popularBoats: ['Aluminum and fibreglass fishing boats', 'Pontoons', 'Family runabouts'],
    popularHpRanges: ['9.9–25 HP kicker', '60–115 HP fishing and pontoon', '150–200 HP Pro XS'],
    whyChooseUs: TRUST_FACTS,
    recommendedLinks: [
      QUOTE_LINK,
      { label: 'Whitby', href: '/locations/whitby-mercury-dealer' },
      { label: 'Ajax', href: '/locations/ajax-mercury-dealer' },
      { label: 'Pickering', href: '/locations/pickering-mercury-dealer' },
      { label: 'Oshawa', href: '/locations/oshawa-mercury-dealer' },
      { label: 'Bowmanville & Courtice', href: '/locations/bowmanville-courtice-mercury-dealer' },
    ],
    relatedCaseStudySlugs: ['aluminum-fishing-60-to-90-fourstroke', 'bass-boat-150-to-150-pro-xs'],
    faqs: [
      { question: 'Do you offer Durham delivery?', answer: 'No. Pickup only at Gores Landing on Rice Lake.' },
      { question: 'Do you do mobile service in Durham?', answer: 'No. Harris Boat Works is shop-based at Gores Landing, no on-site installs, no driveway service, no marina visits.' },
      { question: 'Can Durham customers finalize a Mercury order online?', answer: 'You build the quote online and we confirm the build by phone before pickup.' },
    ],
    pickupPolicy: PICKUP_POLICY,
    serviceBoundary: boundary('Durham Region'),
  },
];

// Append long-form location pages (Bucket 2 Batch 1, May 2026).
locations.push(...longFormLocations);

// Attach long-form upgrades to 4 EXISTING location pages (Bucket 2 Batch 3, May 2026).
// Slugs and URLs are unchanged; this only enriches the rendered content.
for (const loc of locations) {
  const upgrade = LOCATION_LONGFORM_UPGRADES[loc.slug];
  if (upgrade && !loc.longForm) {
    loc.longForm = upgrade;
  }
}

export function getLocationBySlug(slug: string) {
  return locations.find((location) => location.slug === slug);
}

/** Group locations for the hub index page. */
export function getGroupedLocations() {
  return [
    {
      heading: 'Northumberland & the Kawarthas',
      slugs: ['rice-lake-mercury-repower', 'peterborough-mercury-dealer', 'kawartha-lakes-mercury-outboards', 'cobourg-northumberland-mercury'],
    },
    {
      heading: 'Rice Lake towns & Northumberland County',
      slugs: ['gores-landing', 'bewdley', 'roseneath', 'hastings', 'port-hope', 'northumberland-county'],
    },
    {
      heading: 'Peterborough & the wider Kawarthas',
      slugs: ['bridgenorth', 'lakefield', 'buckhorn', 'bobcaygeon', 'lindsay'],
    },
    {
      heading: 'Durham Region',
      slugs: ['bowmanville-courtice-mercury-dealer', 'oshawa-mercury-dealer', 'whitby-mercury-dealer', 'ajax-mercury-dealer', 'pickering-mercury-dealer', 'durham-gta-mercury-pickup'],
    },
    {
      heading: 'Greater Toronto Area',
      slugs: ['gta-mercury-outboards'],
    },
  ].map((group) => ({
    heading: group.heading,
    items: group.slugs.map((s) => locations.find((l) => l.slug === s)).filter(Boolean) as LocationPageData[],
  }));
}

export { longFormLocationSlugs };
