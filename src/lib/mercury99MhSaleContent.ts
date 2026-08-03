import type { ResolvedMotorAvailability } from '@/lib/motorAvailability';

export const MERCURY_99_MH_ALTERNATE_NAMES = [
  'Mercury 9.9',
  'Mercury 9.9 outboard',
  'Mercury 9.9 FourStroke',
  'Mercury 9.9 EFI',
  'Mercury 9.9 short shaft tiller',
  'Mercury 9.9 MH model 1A10201LK',
];

export type Mercury99MhFaq = {
  question: string;
  answer: string;
};

export function formatMercury99MhCAD(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildMercury99MhFaqs(
  price: number,
  availability: ResolvedMotorAvailability,
): Mercury99MhFaq[] {
  const priceLabel = formatMercury99MhCAD(price);
  return [
    {
      question: 'How much is a new Mercury 9.9 outboard in Ontario?',
      answer: `${priceLabel} CAD before HST for new Mercury model 1A10201LK. Installation, rigging, and optional accessories are extra. Harris Boat Works confirms the current written quote before purchase.`,
    },
    {
      question: 'Why is this Mercury 9.9 MH a special Ontario sale price?',
      answer: `The exact model is ${priceLabel} CAD before HST, which is $861 below the $3,860 Mercury MSRP. Advertised prices and availability change, so confirm the current written quote before travelling.`,
    },
    {
      question: 'Where can I buy a new Mercury 9.9 outboard for sale in Ontario?',
      answer: `Harris Boat Works sells this new Mercury 9.9 MH for ${priceLabel} CAD before HST from its Gores Landing, Ontario location. Start the online quote with model 1A10201LK selected or call 905-342-2153 to confirm price and ETA. Buyer pickup is required; the motor is not shipped.`,
    },
    {
      question: 'What does 9.9 MH mean?',
      answer: 'This is the manual-start, tiller-control Mercury 9.9 FourStroke with a 15-inch short shaft. The exact Mercury model number is 1A10201LK.',
    },
    {
      question: 'Does the Mercury 9.9 MH have EFI, and what does it weigh?',
      answer: 'Yes. Model 1A10201LK has battery-free electronic fuel injection (EFI) and a dry weight of 88 lb for this manual-start, short-shaft tiller configuration.',
    },
    {
      question: 'What comes with the motor?',
      answer: 'The motor package includes a standard 3-blade aluminum propeller, a 12-litre remote fuel tank, and the applicable Mercury limited warranty, including 3 years for eligible pleasure use. Harris Boat Works completes the warranty registration at pickup.',
    },
    {
      question: 'Is the $100 reservation deposit refundable?',
      answer: 'Yes. The $100 deposit is fully refundable until Harris Boat Works confirms the exact motor, price, availability and ETA, and you approve the order in writing. After written approval, the deposit becomes non-refundable and is credited to your final invoice.',
    },
    {
      question: 'Is the Mercury 9.9 MH in stock?',
      answer: availability.faqAnswer,
    },
    {
      question: 'Can Harris Boat Works ship this motor?',
      answer: 'No. Mercury outboards are pickup-only at Harris Boat Works in Gores Landing, Ontario. The buyer must pick up the motor in person; we do not ship or release motors to couriers or third parties.',
    },
    {
      question: `Does ${priceLabel} include HST or installation?`,
      answer: 'No. The advertised motor price is in Canadian dollars before HST. Installation, rigging, controls, optional accessories, and any boat-specific work are extra.',
    },
  ];
}
