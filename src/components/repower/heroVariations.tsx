import type { ReactNode } from 'react';
import { GOOGLE_REVIEWS_FALLBACK } from '@/config/googleReviews';

export interface HeroStat {
  n: string;
  l: string;
}

export interface HeroVariation {
  id: string;
  /** Optional eyebrow override; falls back to the default brand line */
  eyebrow?: string;
  /** Heading JSX — supports the red-accent <span> for emphasis words */
  heading: ReactNode;
  subheading: string;
  stats: HeroStat[];
  ctaLabel: string;
}

const ACCENT = 'text-[#C8102E]';

// Cohesive bundles: heading + sub + stats + CTA.
// Order matters — index 0 is the safe default rendered before hydration.
export const HERO_VARIATIONS: HeroVariation[] = [
  {
    id: 'baseline',
    heading: (
      <>
        Keep your boat.
        <br />
        Get your <span className={ACCENT}>weekends</span> back.
      </>
    ),
    subheading: 'New motor. Same boat. Way better mornings.',
    stats: [
      { n: '70%', l: 'of the benefit' },
      { n: '30%', l: 'of the cost' },
      { n: '79', l: 'years on the water' },
    ],
    ctaLabel: 'Build My Quote',
  },
  {
    id: 'math',
    heading: (
      <>
        Your boat isn't the problem.
        <br />
        Your <span className={ACCENT}>motor</span> is.
      </>
    ),
    subheading:
      'A new Mercury costs a fraction of a new boat — and you keep the hull you already love.',
    stats: [
      { n: 'Save 70%', l: 'vs. buying new' },
      { n: '3 min', l: 'to a real quote' },
      { n: 'CAD', l: 'no runaround' },
    ],
    ctaLabel: "See How Much I'd Save",
  },
  {
    id: 'season',
    heading: (
      <>
        This season deserves a motor
        <br />
        that <span className={ACCENT}>keeps up</span>.
      </>
    ),
    subheading:
      'Stop nursing an old engine through every launch. Get a real Mercury quote in three minutes.',
    stats: [
      { n: '1–3', l: 'day install' },
      { n: '7-yr', l: 'warranty available' },
      { n: '1947', l: 'on Rice Lake since' },
    ],
    ctaLabel: 'Get My Quote Before the Season Starts',
  },
  {
    id: 'frustration',
    heading: (
      <>
        Tired of watching other boats
        <br />
        <span className={ACCENT}>pull away</span>?
      </>
    ),
    subheading:
      'Modern Mercury power, fitted to the hull you already own. No sales pressure. Real prices upfront.',
    stats: [
      { n: String(GOOGLE_REVIEWS_FALLBACK.totalReviews), l: 'Google reviews' },
      { n: GOOGLE_REVIEWS_FALLBACK.rating.toFixed(1), l: 'star rating' },
      { n: 'Premier', l: 'Mercury dealer' },
    ],
    ctaLabel: 'See My Mercury Price',
  },
  {
    id: 'legacy',
    heading: (
      <>
        Three generations.
        <br />
        <span className={ACCENT}>One</span> Mercury dealer.
      </>
    ),
    subheading:
      "George Harris started rigging Mercurys on Rice Lake in 1965. Three generations later, we've never stopped. Same family. Same handshake.",
    stats: [
      { n: '1947', l: 'family-owned since' },
      { n: 'Mercury', l: 'certified' },
      { n: 'CSI', l: 'award winner' },
    ],
    ctaLabel: 'Get a Quote — No Obligation',
  },
  {
    id: 'no-bs',
    heading: (
      <>
        See your real Mercury price
        <br />
        before you <span className={ACCENT}>call anyone</span>.
      </>
    ),
    subheading:
      'Live CAD pricing. No "call for a quote." No surprises at the counter.',
    stats: [
      { n: 'Price you see', l: '= price you pay' },
      { n: 'Trade-in', l: 'estimate included' },
      { n: 'Financing', l: 'in minutes' },
    ],
    ctaLabel: 'Show Me Real Prices',
  },
  {
    id: 'emotional',
    heading: (
      <>
        You've had good years on that boat.
        <br />
        <span className={ACCENT}>Have more.</span>
      </>
    ),
    subheading:
      'A repower gives you a nearly new experience on the hull that already fits your life.',
    stats: [
      { n: '70%', l: 'of the benefit' },
      { n: '30%', l: 'of the cost' },
      { n: '1–3 days', l: 'and you’re back out' },
    ],
    ctaLabel: 'Repower My Boat',
  },
];
