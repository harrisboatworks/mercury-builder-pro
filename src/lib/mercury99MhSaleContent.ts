export const MERCURY_99_MH_PRICE_REVIEW_DATE = 'August 3, 2026';

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

export function buildMercury99MhFaqs(price: number): Mercury99MhFaq[] {
  const priceLabel = formatMercury99MhCAD(price);
  return [
    {
      question: 'What is the Mercury 9.9 MH sale price in Ontario?',
      answer: `${priceLabel} CAD before HST for new Mercury model 1A10201LK. Installation, rigging, and optional accessories are extra. Harris Boat Works confirms the current written quote before purchase.`,
    },
    {
      question: 'Is this the lowest advertised Mercury 9.9 MH price in Ontario?',
      answer: `At ${priceLabel} CAD, this was the lowest advertised new Ontario dealer price we found for exact model 1A10201LK in our ${MERCURY_99_MH_PRICE_REVIEW_DATE} review. Advertised prices and availability change, so confirm the current written quote before travelling.`,
    },
    {
      question: 'What does 9.9 MH mean?',
      answer: 'This is the manual-start, tiller-control Mercury 9.9 FourStroke with a 15-inch short shaft. The exact Mercury model number is 1A10201LK.',
    },
    {
      question: 'What comes with the motor?',
      answer: 'The motor package includes the standard 8.5-pitch propeller, a 12-litre remote fuel tank, and the applicable 3-year Mercury factory warranty. Harris Boat Works completes the warranty registration at pickup.',
    },
    {
      question: 'Is the Mercury 9.9 MH in stock?',
      answer: 'It is available to order. Call or build a quote to confirm the current ETA before travelling to Gores Landing.',
    },
    {
      question: 'Can Harris Boat Works ship this motor?',
      answer: 'No. Mercury outboards are pickup-only at Harris Boat Works in Gores Landing, Ontario. The buyer must pick up the motor in person; we do not ship or release motors to couriers or third parties.',
    },
    {
      question: `Does ${priceLabel} include HST or installation?`,
      answer: 'No. The advertised motor price is in Canadian dollars before HST. Installation, rigging, controls, optional accessories, and any boat-specific work are extra.',
    },
    {
      question: 'How do I buy the Mercury 9.9 MH at this price?',
      answer: 'Start the online quote with this exact motor selected or call Harris Boat Works at 905-342-2153. We will confirm price, ETA, pickup requirements, and any installation needs before you commit.',
    },
  ];
}
