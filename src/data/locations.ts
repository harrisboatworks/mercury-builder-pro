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
    title: 'Rice Lake Mercury Repower Specialists',
    region: 'Rice Lake',
    keyword: 'rice lake outboard repower',
    driveTime: 'local to Gores Landing',
    intro: 'Rice Lake is our backyard. This is the strongest match for local anglers and families who want a Mercury repower plan grounded in actual regional boating conditions.',
    popularBoats: ['Aluminum fishing boats', 'Bass boats', 'Walkaround cuddy boats'],
    recommendedLinks: [
      { label: 'See bass boat case study', href: '/case-studies/bass-boat-150-to-150-pro-xs' },
      { label: 'See cuddy case study', href: '/case-studies/walkaround-cuddy-90-to-115-efi' },
    ],
    faqs: [
      { question: 'Is Harris Boat Works on Rice Lake?', answer: 'Yes. We are located in Gores Landing on Rice Lake.' },
      { question: 'Can you ship my outboard?', answer: 'No. We are pickup-only.' },
      { question: 'Do you specialize in Mercury?', answer: 'Yes. Mercury is our core outboard line.' },
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
