// Shared data for /mercury/* lineup landing pages built off the Pro XS 250 pattern.
// Each config drives both the React page (src/pages/landing/MercuryLineupLanding.tsx)
// and the static-prerender noscript/JSON-LD output (scripts/static-prerender.mjs).

import { CANONICAL_SKUS } from '../canonical-pricing.generated';

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

  /** Optional cross-links rendered as a small "Related" row under the Which-One section. */
  crossLinks?: { label: string; to: string }[];

  /** Optional override for the primary CTA used by both hero and final CTA. */
  primaryCta?: { label: string; to: string };

  /** Optional per-page intro paragraph rendered above the pricing table. */
  pricingIntro?: string;
}


// ============================================================================
// Page 1: Portable 9.9 – 20 HP
// ============================================================================
export const PORTABLE_9_20HP: LandingConfig = {
  slug: '/mercury/portable-9-20hp',
  metaTitle: 'Mercury 9.9, 15 & 20 HP Portable Outboard Price Canada | Harris Boat Works',
  metaDescription:
    'Mercury 9.9, 15, and 20 HP portable and kicker outboard prices from $2,999 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/portable-9-20hp',
  ogImage:
    'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/uploads/2025-09-22T00-14-12-050Z-Mercury-Marine-9-9HP-Rear-3-4-Port-Short-TillerUp-1718214770881%20(1).jpg',

  h1: 'Mercury 9.9 to 20 HP Portable Outboard Prices in Canada',
  heroLead:
    'The small Mercury that does the big jobs: trolling kicker, dinghy power, the main motor on a 12 or 14-foot tinnie. Portable Mercury FourStrokes from $2,999 CAD at Harris Boat Works, real prices listed, stock on the floor.',
  heroEyebrow: 'Mercury Premier Dealer, Rice Lake',

  productName: 'Mercury 9.9 to 20 HP Portable Outboards',
  productDescription:
    'Mercury 9.9, 15, and 20 HP portable and kicker FourStroke outboards for kickers, tenders, and small fishing boats. Sold by Mercury Premier Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 9.9 to 20 HP prices: portable and kicker FourStrokes',
  tableNote:
    'Prices in CAD, current pricing, confirm in the quote builder. Several models in stock at Gores Landing; the ProKicker variants we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, and a starting battery on electric-start models are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Start and shaft',
  variants: [
    { name: '9.9 MH FourStroke', hp: '9.9', config: 'Manual start, 15-inch tiller', msrp: 3860, hbwPrice: 2999, availability: 'InStock', availabilityLabel: 'In stock', sku: '1A10201LK' },
    { name: '9.9 ELH FourStroke', hp: '9.9', config: 'Electric start, 20-inch tiller', msrp: 4420, hbwPrice: 3399, availability: 'InStock', availabilityLabel: 'In stock', sku: '1A10311LK' },
    { name: '9.9 ELHPT Command Thrust ProKicker', hp: '9.9', config: 'Electric, power trim, 20-inch tiller', msrp: 5430, hbwPrice: 5099, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1A10451LK' },
    { name: '15 MH FourStroke', hp: '15', config: 'Manual start, 15-inch tiller', msrp: 4230, hbwPrice: 3971, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1A15201LK' },
    { name: '15 ELPT ProKicker FourStroke', hp: '15', config: 'Electric, power trim, 20-inch remote', msrp: 5860, hbwPrice: 5500, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1A15452BK' },
    { name: '20 EH FourStroke', hp: '20', config: 'Electric start, 15-inch tiller', msrp: 5115, hbwPrice: 4802, availability: 'InStock', availabilityLabel: 'In stock', sku: '1A20301LK' },
    { name: '20 ELH FourStroke', hp: '20', config: 'Electric start, 20-inch tiller', msrp: 5190, hbwPrice: 4873, availability: 'InStock', availabilityLabel: 'In stock', sku: '1A20311LK' },
    { name: '20 ELHPT FourStroke', hp: '20', config: 'Electric, power trim, 20-inch remote', msrp: 5890, hbwPrice: 5528, availability: 'InStock', availabilityLabel: 'In stock', sku: '1A20411LK' },
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
    { question: 'What does a Mercury 9.9 HP outboard cost in Canada?', answer: 'At Harris Boat Works, a 9.9 HP FourStroke starts at $2,999 CAD for the manual-start 9.9 MH and runs to about $5,099 for the 9.9 Command Thrust ProKicker with electric start and power trim. Prices are CAD, current pricing, confirm in the quote builder.' },
    { question: 'What is a Mercury ProKicker?', answer: 'A ProKicker is a kicker motor purpose-built for trolling: a Command Thrust gearcase for low-speed thrust, power trim, and wiring that ties into the main motor\u2019s controls. It costs more than a plain portable but it is the right tool when the small motor\u2019s job is trolling a heavier boat.' },
    { question: 'Should I get a 9.9 or a 15 HP kicker?', answer: 'For most trolling use the 9.9 is plenty and is the lighter, simpler choice. Step to the 15 if you are pushing a heavier boat or want a bit more reserve. Tell us your boat and how you fish and we will point you straight.' },
    { question: 'Manual or electric start?', answer: 'Manual start is lighter, simpler, and cheaper. Electric start is worth it if you start the motor often, fish in the cold, or just want the convenience. Both are reliable.' },
    { question: 'Are these portables in stock?', answer: 'Several of the 9.9 and 20 HP FourStrokes are in stock at Gores Landing; the 15 HP and ProKicker variants we bring in to order. Confirm current availability in the quote builder.' },
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
    'Mercury 40, 50, and 60 HP FourStroke outboard prices from $9,438 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/mid-range-40-60hp',
  ogImage: 'https://mercuryrepower.ca/asset-gap-heroes/60-elpt-fourstroke.jpg',

  h1: 'Mercury 40 to 60 HP Outboard Prices in Canada',
  heroLead:
    'The mid-range FourStroke is the Rice Lake workhorse: enough power for a real fishing boat or a small bowrider, light enough to be easy on the transom and the fuel bill. Mercury 40 to 60 HP from $9,438 CAD at Harris Boat Works.',
  heroEyebrow: 'Mercury Premier Dealer, Rice Lake',

  productName: 'Mercury 40 to 60 HP FourStroke Outboards',
  productDescription:
    'Mercury 40, 50, and 60 HP electric-start, power-trim FourStroke outboards in standard and Command Thrust gearcases. Sold by Mercury Premier Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 40 to 60 HP prices: standard and Command Thrust FourStrokes',
  tableNote:
    'Prices in CAD, current pricing, confirm in the quote builder. 60 HP FourStrokes in stock at Gores Landing; the 40 HP, 50 HP, and 25-inch 60 we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, installation labour, and a starting battery are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Shaft and gearcase',
  variants: [
    { name: '40 ELPT FourStroke', hp: '40', config: '20-inch remote', msrp: 10515, hbwPrice: 9438, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F40413GZ' },
    { name: '40 ELPT Command Thrust FourStroke', hp: '40', config: '20-inch remote, Command Thrust', msrp: 10920, hbwPrice: 9801, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F41453GZ' },
    { name: '50 ELPT FourStroke', hp: '50', config: '20-inch remote', msrp: 11805, hbwPrice: 10599, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F51413GZ' },
    { name: '50 ELPT Command Thrust FourStroke', hp: '50', config: '20-inch remote, Command Thrust', msrp: 12275, hbwPrice: 11017, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F51453GZ' },
    { name: '60 ELPT FourStroke', hp: '60', config: '20-inch remote', msrp: 13415, hbwPrice: 12040, availability: 'InStock', availabilityLabel: 'In stock', sku: '1F60413GZ' },
    { name: '60 ELPT Command Thrust FourStroke', hp: '60', config: '20-inch remote, Command Thrust', msrp: 13750, hbwPrice: 12342, availability: 'InStock', availabilityLabel: 'In stock', sku: '1F60453GZ' },
    { name: '60 EXLPT FourStroke', hp: '60', config: '25-inch remote', msrp: 14135, hbwPrice: 12689, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F60463GZ' },
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
    { question: 'What does a Mercury 60 HP outboard cost in Canada?', answer: 'At Harris Boat Works, a 60 ELPT FourStroke is $12,040 CAD, and the 60 Command Thrust is $12,342 CAD. The 40 HP starts at $9,438 and the 50 HP at $10,599. Prices are CAD, current pricing, confirm in the quote builder.' },
    { question: 'Do I need Command Thrust on a 40 to 60 HP motor?', answer: 'You need it if the boat is heavy or carries a lot, especially a pontoon. Command Thrust adds a bigger gearcase and prop for better low-speed grip. On a light fishing boat, the standard gearcase is fine and saves you money.' },
    { question: 'Will a 40 to 60 HP Mercury fit my boat?', answer: 'It fits most 16 to 18-foot fishing boats, small bowriders, and lighter pontoons, but the right HP depends on hull weight and your boat\u2019s capacity plate. Send us the boat details and we will size it properly.' },
    { question: 'Are these in stock?', answer: '60 HP FourStrokes are in stock at Gores Landing; 40 HP, 50 HP, and the 25-inch 60 we bring in to order. Confirm current availability in the quote builder.' },
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
    'Mercury 90 and 115 HP FourStroke and Pro XS outboard prices from $14,960 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/mid-power-90-115hp',
  ogImage:
    'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/1769026949011-Mercury-MM-115PRO-XS-FS-SideProf-STBD-1555756206491.jpg',

  h1: 'Mercury 90 to 115 HP Outboard Prices in Canada',
  heroLead:
    'The 90 to 115 HP band is where most Rice Lake repowers land: enough motor for a bowrider, a fish-and-ski, or a loaded pontoon, without stepping up to V6 money. Mercury 90 to 115 HP from $14,960 CAD at Harris Boat Works.',
  heroEyebrow: 'Mercury Premier Dealer, Rice Lake',

  productName: 'Mercury 90 to 115 HP FourStroke and Pro XS Outboards',
  productDescription:
    'Mercury 90 and 115 HP electric-start, power-trim outboards in FourStroke, Pro XS, and Command Thrust configurations. Sold by Mercury Premier Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 90 to 115 HP prices: FourStroke and Pro XS',
  tableNote:
    'Prices in CAD, current pricing, confirm in the quote builder. Several models in stock at Gores Landing; Command Thrust and 25-inch variants we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, installation labour, and a starting battery are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Shaft and gearcase',
  variants: [
    { name: '90 ELPT FourStroke', hp: '90', config: '20-inch remote', msrp: 16665, hbwPrice: 14960, availability: 'InStock', availabilityLabel: 'In stock', sku: '1F904132D' },
    { name: '90 ELPT Command Thrust FourStroke', hp: '90', config: '20-inch remote, Command Thrust', msrp: 17185, hbwPrice: 15428, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F904532D' },
    { name: '90 EXLPT FourStroke', hp: '90', config: '25-inch remote', msrp: 17240, hbwPrice: 15477, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1F904632D' },
    { name: '115 ELPT Pro XS', hp: '115', config: '20-inch remote', msrp: 19485, hbwPrice: 17490, availability: 'InStock', availabilityLabel: 'In stock', sku: '1117F131D' },
    { name: '115 EXLPT Pro XS', hp: '115', config: '25-inch remote', msrp: 19875, hbwPrice: 17842, availability: 'InStock', availabilityLabel: 'In stock', sku: '1117F231D' },
    { name: '115 ELPT Command Thrust FourStroke', hp: '115', config: '20-inch remote, Command Thrust', msrp: 19540, hbwPrice: 17540, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1115F532D' },
    { name: '115 ELPT Pro XS Command Thrust', hp: '115', config: '20-inch remote, Command Thrust', msrp: 19985, hbwPrice: 17941, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1117F531D' },
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
    { question: 'What does a Mercury 115 HP outboard cost in Canada?', answer: 'At Harris Boat Works, the 115 Pro XS is $17,490 CAD (20-inch) and the 115 FourStroke Command Thrust is $17,540 CAD. The 90 HP FourStroke starts at $14,960. Prices are CAD, current pricing, confirm in the quote builder.' },
    { question: 'Should I get the FourStroke 115 or the Pro XS 115?', answer: 'Choose the Pro XS for a lighter, sportier motor with a stronger hole shot and top end, good on performance rigs. Choose the FourStroke 115 for a smooth, quiet all-rounder. They are priced close together; the right one depends on how you run the boat.' },
    { question: 'Do I need Command Thrust on a 90 or 115 HP motor?', answer: 'It is worth it on pontoons and heavy, loaded boats, where the bigger gearcase and prop improve low-speed grip and load carrying. On a lighter bowrider the standard gearcase is fine.' },
    { question: 'Will a 90 to 115 HP Mercury fit my boat?', answer: 'It suits most bowriders, fish-and-ski boats, mid-size aluminum, and pontoons, but the right HP depends on hull and your capacity plate. Send us the boat details and we will size it.' },
    { question: 'Are these in stock?', answer: 'Several 90 HP FourStrokes and 115 Pro XS motors are in stock at Gores Landing; the Command Thrust and 25-inch variants we bring in to order. Confirm current availability in the quote builder.' },
  ],

  finalCtaHeading: 'Build your 90 to 115 HP Mercury quote in two minutes',
  finalCtaBody: 'Real price, in writing. Pickup at Gores Landing.',

  crossLinks: [
    {
      label: 'Just looking at the 115 Pro XS? See the dedicated 115 Pro XS price page.',
      to: '/mercury/115-pro-xs',
    },
  ],
};

// ============================================================================
// Page 4: Mercury 150 HP (FourStroke + Pro XS)
// ============================================================================
export const HP_150: LandingConfig = {
  slug: '/mercury/150-hp',
  metaTitle: 'Mercury 150 HP Outboard Price in Ontario | Harris Boat Works',
  metaDescription:
    'Mercury 150 HP FourStroke and Pro XS outboard prices from $22,242 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, in stock.',
  canonical: 'https://www.mercuryrepower.ca/mercury/150-hp',
  ogImage:
    'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/1769026949011-Mercury-MM-115PRO-XS-FS-SideProf-STBD-1555756206491.jpg',

  h1: 'Mercury 150 HP Outboard Price in Ontario',
  heroLead:
    'The 150 FourStroke is the workhorse, the sweet spot for 17 to 19 ft fibreglass and aluminum boats: bowriders, fish-and-ski, deep-V aluminum. Smooth 3.0L inline-4, real fuel numbers, real-world reliability. Mercury 150 HP from $22,242 CAD at Harris Boat Works.',
  heroEyebrow: 'Mercury Premier Dealer, Rice Lake',

  productName: 'Mercury 150 HP FourStroke and Pro XS Outboards',
  productDescription:
    'Mercury 150 HP FourStroke (3.0L inline-4) and 150 Pro XS outboards for repowers and new-boat installs. Sold by Mercury Premier Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 150 HP prices: FourStroke and Pro XS',
  tableNote:
    'Prices in CAD, current pricing, confirm in the quote builder. 150 Pro XS variants are in stock at Gores Landing; the 150 FourStroke we bring in to order. Pickup at Gores Landing, Ontario. Customers arrange their own boat transport to and from the shop. Taxes, rigging, installation labour, and a starting battery are not included.',
  modelColLabel: 'Model',
  configColLabel: 'Shaft and tuning',
  variants: [
    { name: '150L FourStroke', hp: '150', config: '20-inch (Long) shaft, mechanical remote', msrp: 24780, hbwPrice: 22242, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1150F13ED' },
    { name: '150XL FourStroke', hp: '150', config: '25-inch (XL) shaft, mechanical remote', msrp: 24915, hbwPrice: 22363, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1150F23ED' },
    { name: '150 ELPT Pro XS', hp: '150', config: '20-inch (Long) shaft, Pro XS tune', msrp: 27125, hbwPrice: 24349, availability: 'InStock', availabilityLabel: 'In stock', sku: '1152F131D' },
    { name: '150 EXLPT Pro XS', hp: '150', config: '25-inch (XL) shaft, Pro XS tune', msrp: 27265, hbwPrice: 24475, availability: 'InStock', availabilityLabel: 'In stock', sku: '1152F231D' },
  ],

  includedTitle: 'What is included in the price',
  includedItems: [
    'A complete electric-start, power-trim Mercury 150',
    'Mechanical remote controls and factory-set shaft length',
    'Pro XS performance tuning on the Pro XS variants',
    'The same price our sales desk sees, no inflate-to-negotiate',
  ],
  notIncludedItems: [
    '13% HST',
    'Rigging and installation labour',
    'Controls and cables if your old ones do not transfer',
    'Gauges, propeller upgrades, and a starting battery',
  ],

  whichOneTitle: '150 FourStroke or 150 Pro XS?',
  whichOneParagraphs: [
    'The 150 FourStroke is a 3.0L inline-4, smooth and quiet, very good on fuel, and famously durable. It is the all-rounder: bowriders, runabouts, deep-V aluminum, lighter pontoons. If the boat is family and cottage first and you want the engine to disappear, the FourStroke is the right call.',
    'The 150 Pro XS is the performance-tuned 150: stronger hole shot, faster top end, the pick for performance-minded rigs and bass boats. Same 3.0L block, sharper attitude.',
    'Fit: most 17 to 19 ft fibreglass bowriders, aluminum deep-Vs, and Kawarthas/Rice Lake repowers from older two-stroke 150s. Shaft length: 20-inch (L) for standard transoms, 25-inch (XL) for taller transoms. If you are repowering and the old motor fit right, match the same shaft.',
  ],

  faq: [
    { question: 'What does a Mercury 150 HP cost in Canada?', answer: 'At Harris Boat Works, the 150L FourStroke is $22,242 CAD and the 150 ELPT Pro XS is $24,349 CAD. The 25-inch XL versions are slightly more. Prices are CAD, current at time of listing, confirm in the quote builder.' },
    { question: 'Will a 150 HP Mercury fit my boat?', answer: 'It fits most 17 to 19 ft fibreglass bowriders, runabouts, aluminum deep-Vs, and lighter pontoons. Check your boat capacity plate for max HP, and match the shaft length (20 or 25 inch) to your transom. Send us the boat details and we will size it properly.' },
    { question: 'Should I get the FourStroke 150 or the Pro XS 150?', answer: 'Choose the FourStroke 150 for a smooth, quiet, fuel-efficient family motor. Choose the Pro XS 150 for stronger hole shot and top end on a performance rig or bass boat. Same 3.0L block, different tune.' },
    { question: 'How long does a 150 HP repower take?', answer: 'Most 150 HP repowers run 2 to 3 weeks from confirmed order to water-ready. Spring (April and May) books up fast because every shop in Ontario is busy. Plan ahead.' },
    { question: 'Do you deliver the motor or pick up my boat?', answer: 'No. Pickup is at Gores Landing, and customers arrange their own boat transport to and from the shop. We rig, install, and water-test on our dock.' },
  ],

  finalCtaHeading: 'Build your 150 HP Mercury quote in two minutes',
  finalCtaBody: 'Real price, in writing. Pickup at Gores Landing.',

  primaryCta: { label: 'Build My 150 HP Quote', to: '/quote?model=150-hp' },
};

// ============================================================================
// Page 5: Mercury 115 Pro XS (dedicated model page)
// ============================================================================
export const PRO_XS_115: LandingConfig = {
  slug: '/mercury/115-pro-xs',
  metaTitle: 'Mercury 115 Pro XS Price in Ontario | Harris Boat Works',
  metaDescription:
    'Mercury 115 Pro XS prices from $17,490 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake, Ontario. Real prices, in stock, with Command Thrust option.',
  canonical: 'https://www.mercuryrepower.ca/mercury/115-pro-xs',
  ogImage:
    'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/1769026949011-Mercury-MM-115PRO-XS-FS-SideProf-STBD-1555756206491.jpg',

  h1: 'Mercury 115 Pro XS Price in Ontario',
  heroLead:
    'The 115 Pro XS is the hot-rod 115: same 2.1L block as the FourStroke 115, tuned for hole shot, top end, and bass-boat handling. From $17,490 CAD at Harris Boat Works, a Mercury Premier Dealer on Rice Lake.',
  heroEyebrow: 'Mercury Premier Dealer, Rice Lake',

  productName: 'Mercury 115 Pro XS Outboards',
  productDescription:
    'Mercury 115 Pro XS outboards, 20 and 25-inch shaft, with optional Command Thrust gearcase. Sold by Mercury Premier Dealer Harris Boat Works on Rice Lake, Ontario.',

  tableTitle: 'Mercury 115 Pro XS prices: every configuration',
  tableNote:
    'Prices in CAD, current pricing, confirm in the quote builder. Both standard 115 Pro XS variants are in stock at Gores Landing; the Command Thrust variants we bring in to order. Pickup at Gores Landing, Ontario. Customers arrange their own boat transport to and from the shop. Taxes, rigging, installation labour, and a starting battery are not included.',
  modelColLabel: 'Configuration',
  configColLabel: 'Shaft and gearcase',
  variants: [
    { name: '115 ELPT Pro XS', hp: '115', config: '20-inch (Long), standard gearcase', msrp: 19485, hbwPrice: 17490, availability: 'InStock', availabilityLabel: 'In stock', sku: '1117F131D' },
    { name: '115 EXLPT Pro XS', hp: '115', config: '25-inch (XL), standard gearcase', msrp: 19875, hbwPrice: 17842, availability: 'InStock', availabilityLabel: 'In stock', sku: '1117F231D' },
    { name: '115 ELPT Pro XS Command Thrust', hp: '115', config: '20-inch (Long), Command Thrust', msrp: 19985, hbwPrice: 17941, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1117F531D' },
    { name: '115 EXLPT Pro XS Command Thrust', hp: '115', config: '25-inch (XL), Command Thrust', msrp: 20385, hbwPrice: 18299, availability: 'BackOrder', availabilityLabel: 'To order', sku: '1117F631D' },
  ],

  includedTitle: 'What is included in the price',
  includedItems: [
    'A complete electric-start, power-trim 115 Pro XS',
    'Mercury Pro XS performance tuning, mechanical remote, factory shaft length',
    'Command Thrust gearcase and larger prop on the CT variants',
    'The same price our sales desk sees, no inflate-to-negotiate',
  ],
  notIncludedItems: [
    '13% HST',
    'Rigging and installation labour',
    'Controls and cables if your old ones do not transfer',
    'Gauges, propeller upgrades, and a starting battery',
  ],

  whichOneTitle: '115 Pro XS or 115 FourStroke?',
  whichOneParagraphs: [
    'The 115 Pro XS and the 115 FourStroke share the same 2.1L four-stroke block. The Pro XS is the performance tune: sharper throttle response, stronger hole shot, more top-end. The FourStroke 115 is the smooth, quiet all-rounder. If you fish tournaments, run an aluminum bass boat, or want the boat to feel quick, the Pro XS is the call.',
    'Fit: aluminum bass boats, tiller-to-console conversions on heavier fishing boats, 16 to 18 ft fibreglass runabouts. Bolt pattern is the same as the 115 FourStroke, so most direct repowers are straightforward.',
    'Command Thrust on a 115 Pro XS? Add it when the boat is heavy, loaded, or a pontoon. The bigger gearcase and prop give better low-speed grip. On a light bass boat the standard gearcase is the right call.',
  ],

  faq: [
    { question: 'What does a Mercury 115 Pro XS cost in Canada?', answer: 'At Harris Boat Works, the 115 ELPT Pro XS is $17,490 CAD (20-inch shaft, standard gearcase). The 25-inch XL is $17,842. Command Thrust variants run from $17,941 to $18,299. Prices are CAD, confirm in the quote builder.' },
    { question: 'How long does a 115 Pro XS repower take?', answer: 'Most 115 Pro XS repowers run 2 to 3 weeks from confirmed order to water-ready. Spring (April and May) books up fast because every shop in Ontario is busy. Plan ahead.' },
    { question: 'Will a 115 Pro XS fit if I have a 115 FourStroke now?', answer: 'Yes, in most cases. The 115 Pro XS uses the same 2.1L block and the same transom bolt pattern as the 115 FourStroke. Match your shaft length (20 or 25 inch) and most direct repowers are straightforward. Send us your old motor model and we will confirm.' },
    { question: 'Pro XS vs FourStroke, what is the real difference?', answer: 'Same block, different tune and gearcase options. The Pro XS revs harder, has a stronger hole shot, and a higher top end. The FourStroke is smoother and quieter at cruise. Both are four-stroke, both are reliable. Pick by how you run the boat.' },
  ],

  finalCtaHeading: 'Build your 115 Pro XS quote in two minutes',
  finalCtaBody: 'Real price, in writing. Pickup at Gores Landing.',

  crossLinks: [
    {
      label: 'Comparing the 90, 115 FourStroke and 115 Pro XS? See the full 90 to 115 HP lineup.',
      to: '/mercury/mid-power-90-115hp',
    },
  ],

  primaryCta: { label: 'Build My 115 Pro XS Quote', to: '/quote?model=115-pro-xs' },
};

export const ALL_LINEUP_LANDINGS: LandingConfig[] = [
  PORTABLE_9_20HP,
  MID_RANGE_40_60HP,
  MID_POWER_90_115HP,
  PRO_XS_115,
  HP_150,
];

export interface SegmentLink {
  path: string;
  name: string;
  price: string;
}

// Segment "from" prices derive from the same canonical pricing data as the
// /pricing-reference tables (src/data/canonical-pricing.generated.ts, itself
// regenerated from public/pricing-reference.md each build) so they can never
// drift from the table prices.
function segmentFromPrice(pred: (sku: { hp: number; family: string; dealer: number }) => boolean): string {
  const prices = CANONICAL_SKUS.filter(pred).map((s) => s.dealer);
  if (!prices.length) return '';
  return '$' + Math.min(...prices).toLocaleString('en-CA', { maximumFractionDigits: 0 });
}

export const ALL_SEGMENTS: SegmentLink[] = [
  { path: '/mercury/pro-xs-250', name: 'Mercury Pro XS 250', price: segmentFromPrice((s) => s.family === 'ProXS' && s.hp === 250) },
  { path: '/mercury/portable-9-20hp', name: 'Mercury 9.9 to 20 HP Portable', price: segmentFromPrice((s) => s.hp >= 9.9 && s.hp <= 20) },
  { path: '/mercury/mid-range-40-60hp', name: 'Mercury 40 to 60 HP Mid-Range', price: segmentFromPrice((s) => s.hp >= 40 && s.hp <= 60) },
  { path: '/mercury/mid-power-90-115hp', name: 'Mercury 90 to 115 HP', price: segmentFromPrice((s) => s.hp >= 90 && s.hp <= 115) },
  { path: '/mercury/115-pro-xs', name: 'Mercury 115 Pro XS', price: segmentFromPrice((s) => s.family === 'ProXS' && s.hp === 115) },
  { path: '/mercury/150-hp', name: 'Mercury 150 HP', price: segmentFromPrice((s) => s.hp === 150) },
];
