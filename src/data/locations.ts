export interface LocationPageData {
  slug: string;
  title: string;
  region: string;
  keyword: string;
  driveTime: string;
  intro: string;
  popularBoats: string[];
  recommendedLinks: { label: string; href: string }[];
  faqs: { question: string; answer: string }[];
}

export const locations: LocationPageData[] = [
  {
    slug: 'peterborough-mercury-dealer',
    title: 'Mercury Outboards & Repower in Peterborough, ON',
    region: 'Peterborough',
    keyword: 'mercury dealer peterborough',
    driveTime: 'about 35 minutes from Gores Landing',
    intro: 'For Peterborough-area boaters, Harris Boat Works is the nearest specialist path for Mercury outboard quotes, repower planning, and pickup at Gores Landing.',
    popularBoats: ['Aluminum fishing boats', 'Pontoon boats', 'Small family runabouts'],
    recommendedLinks: [
      { label: 'Start a Mercury quote', href: '/quote/motor-selection' },
      { label: 'See aluminum repower case study', href: '/case-studies/aluminum-fishing-60-to-90-fourstroke' },
    ],
    faqs: [
      { question: 'Do you deliver to Peterborough?', answer: 'No. Pickup is only at our Gores Landing location.' },
      { question: 'Can Peterborough boaters get CAD pricing online?', answer: 'Yes. Our quote builder and public site pricing are in CAD.' },
      { question: 'Do you handle Mercury repowers for older boats?', answer: 'Yes. That is one of our core use cases.' },
    ],
  },
  {
    slug: 'kawartha-lakes-mercury-outboards',
    title: 'Mercury Outboards for the Kawartha Lakes',
    region: 'Kawartha Lakes',
    keyword: 'kawartha lakes outboard motor',
    driveTime: 'within practical pickup range of Gores Landing',
    intro: 'Kawartha Lakes buyers often need practical Mercury recommendations for fishing, family cruising, and cottage use — with transparent CAD pricing and real setup guidance.',
    popularBoats: ['Cottage fishing boats', 'Pontoons', 'Utility boats'],
    recommendedLinks: [
      { label: 'Browse Mercury motors', href: '/quote/motor-selection' },
      { label: 'See pontoon repower case study', href: '/case-studies/pontoon-family-40-to-115-command-thrust' },
    ],
    faqs: [
      { question: 'Are your recommendations local-water appropriate?', answer: 'Yes. We write for real Ontario lake use, not generic brochure use.' },
      { question: 'Do you quote in USD?', answer: 'No. All pricing is CAD only.' },
      { question: 'Can I compare motors before calling?', answer: 'Yes. Start with the quote builder or motor pages.' },
    ],
  },
  {
    slug: 'rice-lake-mercury-repower',
    title: 'Mercury Repower on Rice Lake — Harris Boat Works, Gores Landing, Ontario',
    region: 'Rice Lake',
    keyword: 'mercury repower rice lake',
    driveTime: 'local to Gores Landing on the south shore of Rice Lake',
    intro: 'Harris Boat Works is the Rice Lake Mercury repower specialist — Mercury Marine Platinum Dealer since 1965, family-owned in Gores Landing, Ontario since 1947. Real CAD pricing online, pickup only at Gores Landing, every repower lake-tested on Rice Lake before you take it home.',
    popularBoats: ['Aluminum fishing boats (14–18 ft)', 'Bass boats', 'Walkaround cuddy and small fibreglass'],
    recommendedLinks: [
      { label: 'Build a Mercury outboard quote (Ontario, CAD)', href: '/quote/motor-selection' },
      { label: 'See bass boat repower case study (150 → 150 Pro XS)', href: '/case-studies/bass-boat-150-to-150-pro-xs' },
      { label: 'See cuddy repower case study (90 → 115 EFI)', href: '/case-studies/walkaround-cuddy-90-to-115-efi' },
      { label: 'Mercury repower cost guide for Ontario (2026 CAD)', href: '/blog/mercury-repower-cost-ontario-2026-cad' },
    ],
    faqs: [
      { question: 'Is Harris Boat Works on Rice Lake?', answer: 'Yes. Harris Boat Works is located in Gores Landing on the south shore of Rice Lake, Ontario, at 5369 Harris Boat Works Rd. We are the closest Mercury Marine Platinum Dealer to Rice Lake, family-owned and operated on the lake since 1947, and an authorized Mercury dealer since 1965.' },
      { question: 'Can I get a Mercury repower quote in CAD before driving to Rice Lake?', answer: 'Yes. Build a complete itemized Mercury repower quote online in CAD at mercuryrepower.ca/quote/motor-selection — motor, controls, propeller, install, financing, and trade-in credit. The price you see is the price you pay. No phone call required.' },
      { question: 'Do you ship or deliver Mercury outboards from Rice Lake?', answer: 'No. We are pickup-only at Gores Landing on Rice Lake. All Mercury outboard purchases are picked up in person with photo ID at our shop. We do not ship motors and we do not deliver — it is a strict industry-wide fraud-prevention policy.' },
      { question: 'Do you specialize in Mercury repowers?', answer: 'Yes. Mercury is our only outboard brand and has been since 1965. We are Mercury Platinum-certified for the highest customer satisfaction tier. Every repower at Harris Boat Works is performed by Mercury-certified technicians and lake-tested on Rice Lake before pickup.' },
      { question: 'What does a Mercury repower in Rice Lake typically cost in CAD?', answer: 'A complete installed Mercury repower at Harris Boat Works typically runs $8,000–$18,000 CAD all-in for a 16–18 ft boat with a 60–115 HP outboard, including engine, controls, rigging, propeller, removal, install, and lake test. See the live cost-by-HP table at /repower or build an exact quote at /quote/motor-selection.' },
      { question: 'How long is the drive to Harris Boat Works on Rice Lake?', answer: 'About 90 minutes from downtown Toronto via the 401, 35 minutes south of Peterborough, 20 minutes north of Cobourg, and local to Bewdley, Hastings, and Gores Landing. We serve Mercury buyers from across Ontario — GTA, Durham, the Kawarthas, Northumberland, and the Bay of Quinte.' },
    ],
  },
  {
    slug: 'cobourg-northumberland-mercury',
    title: 'Mercury Sales & Service — Cobourg & Northumberland',
    region: 'Cobourg & Northumberland',
    keyword: 'cobourg outboard motor',
    driveTime: 'about 40 minutes from Gores Landing',
    intro: 'Cobourg and Northumberland customers use mercuryrepower.ca to compare Mercury outboards, build quotes, and confirm pickup details before making the drive inland.',
    popularBoats: ['Pontoons', 'Fishing boats', 'Family outboards'],
    recommendedLinks: [
      { label: 'Start your quote', href: '/quote/motor-selection' },
      { label: 'See pontoon buyer content', href: '/blog/best-mercury-outboard-pontoon-boats' },
    ],
    faqs: [
      { question: 'Do you serve Cobourg buyers?', answer: 'Yes. We regularly serve Northumberland and Cobourg-area customers.' },
      { question: 'Is pickup at the coast?', answer: 'No. Pickup is at Gores Landing.' },
      { question: 'Can I get a quote before visiting?', answer: 'Yes. Use the site quote flow first.' },
    ],
  },
  {
    slug: 'durham-gta-mercury-pickup',
    title: 'Mercury Outboard Pickup for Durham & GTA',
    region: 'Durham & GTA',
    keyword: 'mercury outboard durham',
    driveTime: 'a manageable day-trip pickup from the east GTA',
    intro: 'For Durham and GTA buyers, the value is straightforward: real CAD pricing, Mercury-focused advice, and a clear pickup process instead of vague dealer pages.',
    popularBoats: ['Family runabouts', 'Pontoons', 'Fishing rigs'],
    recommendedLinks: [
      { label: 'Compare 115 vs 150 HP', href: '/blog/mercury-115-vs-150-hp-outboard-ontario' },
      { label: 'Start quote builder', href: '/quote/motor-selection' },
    ],
    faqs: [
      { question: 'Do you offer GTA delivery?', answer: 'No. Pickup only at Gores Landing.' },
      { question: 'Why would GTA buyers use your site?', answer: 'Because the site is built around transparent Mercury quoting and repower guidance.' },
      { question: 'Can I finalize by phone?', answer: 'You can start online and finish with a human confirmation call.' },
    ],
  },
];

export function getLocationBySlug(slug: string) {
  return locations.find((location) => location.slug === slug);
}
