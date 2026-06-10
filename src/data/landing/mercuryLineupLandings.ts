// Shared data for /mercury/* lineup landing pages built off the Pro XS 250 pattern.
// Each config drives both the React page (src/pages/landing/MercuryLineupLanding.tsx)
// and the static-prerender noscript/JSON-LD output (scripts/static-prerender.mjs).

export interface LandingVariant {
  name: string;
  hp: string;
  config: string; // shaft / start / gearcase column
  msrp: number;
  hbwPrice: number;
  availability: 'InStock' | 'BackOrder';
  availabilityLabel: string;
  sku?: string;
}

export interface LandingFAQ {
  question: string;
  answer: string;
}

export interface LandingConfig {
  slug: string; // route path, e.g. "/mercury/portable-9-20hp"
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  ogImage: string;

  h1: string;
  heroLead: string;
  heroEyebrow: string;

  productName: string;
  productDescription: string;

  tableTitle: string;
  tableNote: string;
  modelColLabel: string; // "Model" or "Configuration"
  configColLabel: string; // "Start and shaft" / "Shaft and gearcase" / "Controls"
  variants: LandingVariant[];

  includedTitle: string;
  includedItems: string[];
  notIncludedItems: string[];

  whichOneTitle: string;
  whichOneParagraphs: string[];

  faq: LandingFAQ[];

  finalCtaHeading: string;
  finalCtaBody: string;
}

// ============================================================================
// Page 1: Portable 9.9 – 20 HP
// ============================================================================
export const PORTABLE_9_20HP: LandingConfig = {
  slug: '/mercury/portable-9-20hp',
  metaTitle: 'Mercury 9.9, 15 & 20 HP Portable Outboard Price Canada | Harris Boat Works',
  metaDescription:
    'Mercury 9.9, 15, and 20 HP portable and kicker outboard prices from $3,553 CAD at Harris Boat Works, a Mercury Platinum Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/portable-9-20hp',
  ogImage:
    'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/uploads/2025-09-22T00-14-12-050Z-Mercury-Marine-9-9HP-Rear-3-4-Port-Short-TillerUp-1718214770881%20(1).jpg',

  h1: 'Mercury 9.9 to 20 HP Portable Outboard Prices in Canada',
  heroLead:
    'The small Mercury that does the big jobs: trolling kicker, dinghy power, the main motor on a 12 or 14-foot tinnie. Portable Mercury FourStrokes from $3,553 CAD at Harris Boat Works, real prices listed, stock on the floor.',
  heroEyebrow: 'Mercury Platinum Dealer, Rice Lake',

  productName: 'Mercury 9.9 to 20 HP Portable Outboards',
  productDescription:
    'Mercury 9.9, 15, and 20 HP portable and kicker FourStroke outboards for kickers, tenders, and small fishing boats. Sold by Mercury Platinum Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 9.9 to 20 HP prices: portable and kicker FourStrokes',
  tableNote:
    'Prices in CAD, current as of May 2026, confirm in the quote builder. Several models in stock at Gores Landing; the ProKicker variants we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, and a starting battery on electric-start models are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Start and shaft',
  variants: [
    { name: '9.9 MH FourStroke', hp: '9.9', config: 'Manual start, 15-inch tiller', msrp: 3875, hbwPrice: 3553, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '9.9 ELH FourStroke', hp: '9.9', config: 'Electric start, 20-inch tiller', msrp: 4435, hbwPrice: 4065, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '9.9 ELHPT Command Thrust ProKicker', hp: '9.9', config: 'Electric, power trim, 20-inch tiller', msrp: 5455, hbwPrice: 5000, availability: 'BackOrder', availabilityLabel: 'To order' },
    { name: '15 MH FourStroke', hp: '15', config: 'Manual start, 15-inch tiller', msrp: 4225, hbwPrice: 3872, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '15 ELPT ProKicker FourStroke', hp: '15', config: 'Electric, power trim, 20-inch remote', msrp: 5855, hbwPrice: 5368, availability: 'BackOrder', availabilityLabel: 'To order' },
    { name: '20 EH FourStroke', hp: '20', config: 'Electric start, 15-inch tiller', msrp: 5110, hbwPrice: 4686, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '20 ELH FourStroke', hp: '20', config: 'Electric start, 20-inch tiller', msrp: 5185, hbwPrice: 4752, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '20 ELHPT FourStroke', hp: '20', config: 'Electric, power trim, 20-inch remote', msrp: 5880, hbwPrice: 5390, availability: 'InStock', availabilityLabel: 'In stock' },
  ],

  includedTitle: 'What is included in the price',
  includedItems: [
    'A complete portable Mercury FourStroke with the listed start type and shaft length',
    'Manual or electric start as specified, factory rigging',
    'Command Thrust gearcase and power trim on the ProKicker variants, with main-motor control wiring',
    'The same price our sales desk sees, no inflate-to-negotiate',
  ],
  notIncludedItems: [
    '13% HST',
    'Rigging or installation labour',
    'A starting battery on electric-start models',
  ],

  whichOneTitle: 'Which one for which boat?',
  whichOneParagraphs: [
    'The 9.9 HP is the classic kicker and small-boat motor. As a trolling kicker on a bigger fishing boat, or the main on a 12-foot aluminum, it is hard to beat. Manual-start tiller (MH) is the lightest and simplest. Electric start (ELH) saves your shoulder on cold mornings.',
    'The ProKicker variants are purpose-built kickers. They add a Command Thrust gearcase for real bite at trolling speed, power trim to fine-tune, and they wire into the main motor\u2019s controls. If the 9.9 is going on a serious fishing boat as a trolling motor, the ProKicker is the one to buy.',
    'The 15 HP has the same footprint as the 9.9 with a bit more push, good for a slightly heavier 14-footer. The 20 HP is the top of the portable range, the most main-motor of the three, right for a 14-foot tinnie that carries gear and two or three people.',
    'Shaft length: a 15-inch (short) shaft suits low transoms, a 20-inch (long) shaft suits standard transoms. Match your transom, or match the motor you are replacing.',
  ],

  faq: [
    { question: 'What does a Mercury 9.9 HP outboard cost in Canada?', answer: 'At Harris Boat Works, a 9.9 HP FourStroke starts at $3,553 CAD for the manual-start 9.9 MH and runs to about $5,000 for the 9.9 Command Thrust ProKicker with electric start and power trim. Prices are CAD, as of May 2026.' },
    { question: 'What is a Mercury ProKicker?', answer: 'A ProKicker is a kicker motor purpose-built for trolling: a Command Thrust gearcase for low-speed thrust, power trim, and wiring that ties into the main motor\u2019s controls. It costs more than a plain portable but it is the right tool when the small motor\u2019s job is trolling a heavier boat.' },
    { question: 'Should I get a 9.9 or a 15 HP kicker?', answer: 'For most trolling use the 9.9 is plenty and is the lighter, simpler choice. Step to the 15 if you are pushing a heavier boat or want a bit more reserve. Tell us your boat and how you fish and we will point you straight.' },
    { question: 'Manual or electric start?', answer: 'Manual start is lighter, simpler, and cheaper. Electric start is worth it if you start the motor often, fish in the cold, or just want the convenience. Both are reliable.' },
    { question: 'Are these portables in stock?', answer: 'Several of the 9.9, 15, and 20 HP FourStrokes are in stock at Gores Landing, and the ProKicker variants we bring in to order. Confirm current availability in the quote builder.' },
  ],

  finalCtaHeading: 'Build your portable Mercury quote in two minutes',
  finalCtaBody: 'Real price, in writing. Pickup at Gores Landing.',
};

// ============================================================================
// Page 2: Mid-range 40 – 60 HP
// ============================================================================
export const MID_RANGE_40_60HP: LandingConfig = {
  slug: '/mercury/mid-range-40-60hp',
  metaTitle: 'Mercury 40, 50 & 60 HP Outboard Price Canada | Harris Boat Works',
  metaDescription:
    'Mercury 40, 50, and 60 HP FourStroke outboard prices from $9,532 CAD at Harris Boat Works, a Mercury Platinum Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/mid-range-40-60hp',
  ogImage: 'https://mercuryrepower.ca/asset-gap-heroes/60-elpt-fourstroke.jpg',

  h1: 'Mercury 40 to 60 HP Outboard Prices in Canada',
  heroLead:
    'The mid-range FourStroke is the Rice Lake workhorse: enough power for a real fishing boat or a small bowrider, light enough to be easy on the transom and the fuel bill. Mercury 40 to 60 HP from $9,532 CAD at Harris Boat Works.',
  heroEyebrow: 'Mercury Platinum Dealer, Rice Lake',

  productName: 'Mercury 40 to 60 HP FourStroke Outboards',
  productDescription:
    'Mercury 40, 50, and 60 HP electric-start, power-trim FourStroke outboards in standard and Command Thrust gearcases. Sold by Mercury Platinum Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 40 to 60 HP prices: standard and Command Thrust FourStrokes',
  tableNote:
    'Prices in CAD, current as of May 2026, confirm in the quote builder. Several models in stock at Gores Landing; the 50 HP and 25-inch 60 we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, installation labour, and a starting battery are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Shaft and gearcase',
  variants: [
    { name: '40 ELPT FourStroke', hp: '40', config: '20-inch remote', msrp: 10830, hbwPrice: 9532, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '40 ELPT Command Thrust FourStroke', hp: '40', config: '20-inch remote, Command Thrust', msrp: 11250, hbwPrice: 9900, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '50 ELPT FourStroke', hp: '50', config: '20-inch remote', msrp: 12165, hbwPrice: 10703, availability: 'BackOrder', availabilityLabel: 'To order' },
    { name: '50 ELPT Command Thrust FourStroke', hp: '50', config: '20-inch remote, Command Thrust', msrp: 12645, hbwPrice: 11127, availability: 'BackOrder', availabilityLabel: 'To order' },
    { name: '60 ELPT FourStroke', hp: '60', config: '20-inch remote', msrp: 13820, hbwPrice: 12161, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '60 ELPT Command Thrust FourStroke', hp: '60', config: '20-inch remote, Command Thrust', msrp: 14170, hbwPrice: 12469, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '60 EXLPT FourStroke', hp: '60', config: '25-inch remote', msrp: 14565, hbwPrice: 12815, availability: 'BackOrder', availabilityLabel: 'To order' },
  ],

  includedTitle: 'What is included in the price',
  includedItems: [
    'A complete electric-start, power-trim FourStroke',
    'Mechanical remote controls and factory-set shaft length',
    'Command Thrust gearcase and larger prop on the CT variants',
    'The same price our sales desk sees, no inflate-to-negotiate',
  ],
  notIncludedItems: [
    '13% HST',
    'Rigging and installation labour',
    'Controls and cables if your old ones do not transfer',
    'Gauges and a starting battery',
  ],

  whichOneTitle: 'Which one for which boat?',
  whichOneParagraphs: [
    'The 40 to 60 HP band fits 16 to 18-foot aluminum fishing boats, tiller or console, small fibreglass bowriders, and lighter pontoons. For most customers the choice is HP and whether to add Command Thrust.',
    'Standard gearcase or Command Thrust? Command Thrust runs a larger gearcase and a bigger prop, which means more grip and better load-carrying at low speed. On a pontoon or a heavy, gear-loaded aluminum boat it is worth the small premium. On a light fishing boat the standard gearcase is the right call.',
    'Shaft length: 20-inch suits most transoms; choose the 25-inch (EXLPT) if your transom measures tall or your old motor was a 25-inch.',
  ],

  faq: [
    { question: 'What does a Mercury 60 HP outboard cost in Canada?', answer: 'At Harris Boat Works, a 60 ELPT FourStroke is $12,161 CAD, and the 60 Command Thrust is $12,469 CAD. The 40 HP starts at $9,532 and the 50 HP at $10,703. Prices are CAD, as of May 2026.' },
    { question: 'Do I need Command Thrust on a 40 to 60 HP motor?', answer: 'You need it if the boat is heavy or carries a lot, especially a pontoon. Command Thrust adds a bigger gearcase and prop for better low-speed grip. On a light fishing boat, the standard gearcase is fine and saves you money.' },
    { question: 'Will a 40 to 60 HP Mercury fit my boat?', answer: 'It fits most 16 to 18-foot fishing boats, small bowriders, and lighter pontoons, but the right HP depends on hull weight and your boat\u2019s capacity plate. Send us the boat details and we will size it properly.' },
    { question: 'Are these in stock?', answer: 'Several 40 and 60 HP FourStrokes are in stock at Gores Landing; 50 HP and the 25-inch 60 we bring in to order. Confirm current availability in the quote builder.' },
    { question: 'How long does a repower take?', answer: 'Most repowers run 2 to 3 weeks from confirmed order to water-ready. Spring books up fast, so plan ahead.' },
  ],

  finalCtaHeading: 'Build your 40 to 60 HP Mercury quote in two minutes',
  finalCtaBody: 'Real price, in writing. Pickup at Gores Landing.',
};

// ============================================================================
// Page 3: Mid-power 90 – 115 HP
// ============================================================================
export const MID_POWER_90_115HP: LandingConfig = {
  slug: '/mercury/mid-power-90-115hp',
  metaTitle: 'Mercury 90 & 115 HP Outboard Price Canada | Harris Boat Works',
  metaDescription:
    'Mercury 90 and 115 HP FourStroke and Pro XS outboard prices from $14,812 CAD at Harris Boat Works, a Mercury Platinum Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/mid-power-90-115hp',
  ogImage:
    'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/1769026949011-Mercury-MM-115PRO-XS-FS-SideProf-STBD-1555756206491.jpg',

  h1: 'Mercury 90 to 115 HP Outboard Prices in Canada',
  heroLead:
    'The 90 to 115 HP band is where most Rice Lake repowers land: enough motor for a bowrider, a fish-and-ski, or a loaded pontoon, without stepping up to V6 money. Mercury 90 to 115 HP from $14,812 CAD at Harris Boat Works.',
  heroEyebrow: 'Mercury Platinum Dealer, Rice Lake',

  productName: 'Mercury 90 to 115 HP FourStroke and Pro XS Outboards',
  productDescription:
    'Mercury 90 and 115 HP electric-start, power-trim outboards in FourStroke, Pro XS, and Command Thrust configurations. Sold by Mercury Platinum Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 90 to 115 HP prices: FourStroke and Pro XS',
  tableNote:
    'Prices in CAD, current as of May 2026, confirm in the quote builder. Several models in stock at Gores Landing; Command Thrust and 25-inch variants we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, installation labour, and a starting battery are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Shaft and gearcase',
  variants: [
    { name: '90 ELPT FourStroke', hp: '90', config: '20-inch remote', msrp: 16830, hbwPrice: 14812, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '90 ELPT Command Thrust FourStroke', hp: '90', config: '20-inch remote, Command Thrust', msrp: 17355, hbwPrice: 15274, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '90 EXLPT FourStroke', hp: '90', config: '25-inch remote', msrp: 17415, hbwPrice: 15323, availability: 'BackOrder', availabilityLabel: 'To order' },
    { name: '115 ELPT Pro XS', hp: '115', config: '20-inch remote', msrp: 19680, hbwPrice: 17320, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '115 EXLPT Pro XS', hp: '115', config: '25-inch remote', msrp: 20075, hbwPrice: 17666, availability: 'InStock', availabilityLabel: 'In stock' },
    { name: '115 ELPT Command Thrust FourStroke', hp: '115', config: '20-inch remote, Command Thrust', msrp: 19730, hbwPrice: 17364, availability: 'BackOrder', availabilityLabel: 'To order' },
    { name: '115 ELPT Pro XS Command Thrust', hp: '115', config: '20-inch remote, Command Thrust', msrp: 20190, hbwPrice: 17765, availability: 'BackOrder', availabilityLabel: 'To order' },
  ],

  includedTitle: 'What is included in the price',
  includedItems: [
    'A complete electric-start, power-trim motor',
    'Mechanical remote controls and factory-set shaft length',
    'Pro XS performance tuning on the Pro XS variants',
    'Command Thrust gearcase and larger prop on the CT variants',
    'The same price our sales desk sees, no inflate-to-negotiate',
  ],
  notIncludedItems: [
    '13% HST',
    'Rigging and installation labour',
    'Controls and cables if your old ones do not transfer',
    'Gauges and a starting battery',
  ],

  whichOneTitle: 'Which one for which boat?',
  whichOneParagraphs: [
    'The 90 HP FourStroke is the smooth all-rounder for bowriders and mid-size aluminum. The 115 steps up for heavier rigs, fish-and-ski boats, and pontoons.',
    'FourStroke 115 or Pro XS 115? The Pro XS is the lighter, sportier 115: quicker to rev, stronger hole shot and top end, the pick for a performance-minded rig. The standard FourStroke 115 is the quiet, smooth all-rounder. Both are four-stroke and both are reliable.',
    'Command Thrust matters most on pontoons and heavy, loaded boats, where the bigger gearcase and prop earn their keep at low speed. Shaft length: 20-inch suits most transoms, 25-inch for taller ones.',
  ],

  faq: [
    { question: 'What does a Mercury 115 HP outboard cost in Canada?', answer: 'At Harris Boat Works, the 115 Pro XS is $17,320 CAD (20-inch) and the 115 FourStroke Command Thrust is $17,364 CAD. The 90 HP FourStroke starts at $14,812. Prices are CAD, as of May 2026.' },
    { question: 'Should I get the FourStroke 115 or the Pro XS 115?', answer: 'Choose the Pro XS for a lighter, sportier motor with a stronger hole shot and top end, good on performance rigs. Choose the FourStroke 115 for a smooth, quiet all-rounder. They are priced close together; the right one depends on how you run the boat.' },
    { question: 'Do I need Command Thrust on a 90 or 115 HP motor?', answer: 'It is worth it on pontoons and heavy, loaded boats, where the bigger gearcase and prop improve low-speed grip and load carrying. On a lighter bowrider the standard gearcase is fine.' },
    { question: 'Will a 90 to 115 HP Mercury fit my boat?', answer: 'It suits most bowriders, fish-and-ski boats, mid-size aluminum, and pontoons, but the right HP depends on hull and your capacity plate. Send us the boat details and we will size it.' },
    { question: 'Are these in stock?', answer: 'Several 90 HP FourStrokes and 115 Pro XS motors are in stock at Gores Landing; the Command Thrust and 25-inch variants we bring in to order. Confirm current availability in the quote builder.' },
  ],

  finalCtaHeading: 'Build your 90 to 115 HP Mercury quote in two minutes',
  finalCtaBody: 'Real price, in writing. Pickup at Gores Landing.',
};

export const ALL_LINEUP_LANDINGS: LandingConfig[] = [
  PORTABLE_9_20HP,
  MID_RANGE_40_60HP,
  MID_POWER_90_115HP,
];

export interface SegmentLink {
  path: string;
  name: string;
  price: string;
}

export const ALL_SEGMENTS: SegmentLink[] = [
  { path: '/mercury/pro-xs-250', name: 'Mercury Pro XS 250', price: '$34,502' },
  { path: '/mercury/portable-9-20hp', name: 'Mercury 9.9 to 20 HP Portable', price: '$3,553' },
  { path: '/mercury/mid-range-40-60hp', name: 'Mercury 40 to 60 HP Mid-Range', price: '$9,532' },
  { path: '/mercury/mid-power-90-115hp', name: 'Mercury 90 to 115 HP', price: '$14,812' },
];
