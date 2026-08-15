import type { CaseStudyLongForm } from './caseStudiesLongForm';

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  scenario: string;
  boatType: string;
  region: string;
  beforeMotor: string;
  afterMotor: string;
  hpJump: string;
  heroImage: string;
  detailImage?: string;
  customerQuote: string;
  recommendation: string;
  whyItWorked: string[];
  isIllustrative: boolean;
  quoteUrl: string;
  /** Optional long-form (Bucket 2 Batch 2, May 2026). */
  longForm?: CaseStudyLongForm;
  datePublished?: string;
  dateModified?: string;
}

const BASE_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'CS01',
    slug: 'aluminum-fishing-60-to-90-fourstroke',
    title: '18-foot aluminum fishing boat: 60HP to 90HP FourStroke',
    excerpt: 'An illustrative comparison of a 60 HP setup with a Mercury 90 HP FourStroke on a properly rated aluminum fishing boat.',
    scenario: 'Aluminum fishing repower',
    boatType: 'Aluminum fishing boat',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '60HP aging outboard',
    afterMotor: 'Mercury 90HP FourStroke',
    hpJump: '60 → 90',
    heroImage: '/lovable-uploads/aluminum-fishing-hero-real.png',
    detailImage: '/lovable-uploads/aluminum-fishing-detail-real.png',
    customerQuote: 'A 90 HP FourStroke may suit a properly rated aluminum fishing hull after the complete load and current setup are measured.',
    recommendation: 'Consider only after confirming the capacity plate, transom, current motor, full fishing load, propeller, steering, and measured WOT RPM.',
    whyItWorked: [
      'Higher rated horsepower may help a heavier operating load when the hull permits it',
      'Acceleration and speed must be measured on the actual boat',
      'Propeller and engine height are selected against loaded WOT RPM'
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS01'
  },
  {
    id: 'CS02',
    slug: 'pontoon-family-40-to-115-command-thrust',
    title: 'Family pontoon: 40HP to 115HP Command Thrust',
    excerpt: 'An illustrative comparison of an underpowered 40 HP pontoon setup with a properly rated 115 HP Command Thrust package.',
    scenario: 'Pontoon repower',
    boatType: 'Pontoon boat',
    region: 'Ontario cottage lakes',
    beforeMotor: '40HP underpowered setup',
    afterMotor: 'Mercury 115HP Command Thrust',
    hpJump: '40 → 115',
    heroImage: '/lovable-uploads/pontoon-115-ct-detail-real.png',
    customerQuote: 'A larger properly rated motor and Command Thrust gearcase may suit a heavier pontoon load, but the capacity plate and actual setup control.',
    recommendation: 'Consider only after confirming tube count, capacity plate, transom, passenger and gear load, watersports use, steering, and propeller.',
    whyItWorked: [
      'Command Thrust can turn a larger propeller for a heavier load',
      'The final horsepower must stay within the pontoon manufacturer\'s rating',
      'Acceleration and handling are verified on the actual loaded boat'
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS02'
  },
  {
    id: 'CS03',
    slug: 'bass-boat-150-to-150-pro-xs',
    title: 'Bass boat refresh: older 150 to Mercury 150 Pro XS',
    excerpt: 'An illustrative same-horsepower comparison between an older 150-class setup and a current Mercury 150 Pro XS.',
    scenario: 'Bass boat repower',
    boatType: 'Bass boat',
    region: 'Ontario tournament / inland lakes',
    beforeMotor: 'Older 150HP two-stroke class setup',
    afterMotor: 'Mercury 150 Pro XS',
    hpJump: '150 → 150 Pro XS',
    heroImage: '/lovable-uploads/bass-boat-150-proxs-hero-real.png',
    detailImage: '/lovable-uploads/bass-boat-150-proxs-detail-real.png',
    customerQuote: 'A same-horsepower Pro XS repower is a setup decision involving hull rating, engine height, propeller, controls, load, and measured WOT RPM.',
    recommendation: 'Consider for a properly rated bass hull after documenting the old setup, performance goals, controls, steering, transom, and complete operating load.',
    whyItWorked: [
      'Pro XS is Mercury\'s performance-oriented 150 HP family',
      'Current controls and rigging are matched to the selected motor',
      'No acceleration or top-speed result is promised without an actual water test'
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS03'
  },
  {
    id: 'CS04',
    slug: 'cedar-strip-9-9-fourstroke',
    title: 'Cedar-strip utility setup: small 9.9HP FourStroke',
    excerpt: 'A lightweight small-horsepower package for cottage and protected-water use. Real photography still pending.',
    scenario: 'Small utility / cedar-strip setup',
    boatType: 'Small utility / cedar-strip boat',
    region: 'Ontario cottage country',
    beforeMotor: 'Legacy small portable outboard',
    afterMotor: 'Mercury 9.9HP FourStroke',
    hpJump: 'Portable refresh',
    heroImage: '/placeholder.svg',
    customerQuote: 'For this type of boat, simple reliability, quiet running, and manageable weight matter more than headline horsepower.',
    recommendation: 'Best for small-boat owners prioritizing portability, cottage reliability, and protected-water use.',
    whyItWorked: [
      'Right-sized for small transoms and light-duty use',
      'Portable FourStroke practicality',
      'Will stay clearly marked as illustrative until real photos arrive'
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS04'
  },
  {
    id: 'CS05',
    slug: 'walkaround-cuddy-90-to-115-efi',
    title: 'Walkaround cuddy: 90HP to 115HP EFI',
    excerpt: 'An illustrative comparison of an older 90 HP setup with a Mercury 115 HP FourStroke on a properly rated small cuddy or walkaround.',
    scenario: 'Walkaround / cuddy repower',
    boatType: 'Walkaround cuddy',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '90HP older outboard',
    afterMotor: 'Mercury 115HP EFI FourStroke',
    hpJump: '90 → 115',
    heroImage: '/lovable-uploads/cuddy-115-hero-real.png',
    detailImage: '/lovable-uploads/cuddy-115-detail-real.png',
    customerQuote: 'A 115 HP FourStroke may suit a properly rated small cabin boat after its transom, load, balance, steering, controls, and current performance are checked.',
    recommendation: 'Consider only after confirming the capacity plate or manufacturer rating, transom, weight and balance, full operating load, controls, and propeller.',
    whyItWorked: [
      'Higher rated horsepower may help a heavier hull when the manufacturer permits it',
      'Balance, steering, and loaded handling must be evaluated on the actual boat',
      'The complete installed package requires a boat-specific quote'
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS05'
  }
];

import { LONG_FORM_CASE_STUDIES } from './caseStudiesLongForm';

export const caseStudies: CaseStudy[] = [...BASE_CASE_STUDIES, ...LONG_FORM_CASE_STUDIES];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((caseStudy) => caseStudy.slug === slug);
}
