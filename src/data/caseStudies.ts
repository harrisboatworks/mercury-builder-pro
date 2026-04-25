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
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'CS01',
    slug: 'aluminum-fishing-60-to-90-fourstroke',
    title: '18-foot aluminum fishing boat: 60HP to 90HP FourStroke',
    excerpt: 'A practical power jump for inland-lake anglers who needed better holeshot, load carrying, and open-water confidence.',
    scenario: 'Aluminum fishing repower',
    boatType: 'Aluminum fishing boat',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '60HP aging outboard',
    afterMotor: 'Mercury 90HP FourStroke',
    hpJump: '60 → 90',
    heroImage: '/lovable-uploads/aluminum-fishing-hero-real.png',
    detailImage: '/lovable-uploads/aluminum-fishing-detail-real.png',
    customerQuote: 'The boat feels more usable with a full fishing load and still stays easy to live with on smaller lakes.',
    recommendation: 'Best for owners who fish with two to three people, carry gear, and want stronger mid-range without overbuilding the package.',
    whyItWorked: [
      'Improved load-carrying confidence in wind and chop',
      'Better holeshot for getting on plane with gear aboard',
      'Strong fit for 18–20 foot aluminum fishing layouts'
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS01'
  },
  {
    id: 'CS02',
    slug: 'pontoon-family-40-to-115-command-thrust',
    title: 'Family pontoon: 40HP to 115HP Command Thrust',
    excerpt: 'A meaningful pontoon upgrade focused on full-load performance, better tube pulling, and less regret from underpowering.',
    scenario: 'Pontoon repower',
    boatType: 'Pontoon boat',
    region: 'Ontario cottage lakes',
    beforeMotor: '40HP underpowered setup',
    afterMotor: 'Mercury 115HP Command Thrust',
    hpJump: '40 → 115',
    heroImage: '/lovable-uploads/pontoon-115-ct-detail-real.png',
    customerQuote: 'This is the kind of upgrade that turns a sluggish family pontoon into something people actually want to use all summer.',
    recommendation: 'Best for 21–24 foot pontoons carrying family, coolers, and watersports loads where a small motor feels strained.',
    whyItWorked: [
      'Command Thrust suits heavier pontoon loads',
      'Much better acceleration with passengers aboard',
      'A more realistic horsepower match for modern family pontoons'
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS02'
  },
  {
    id: 'CS03',
    slug: 'bass-boat-150-to-150-pro-xs',
    title: 'Bass boat refresh: older 150 to Mercury 150 Pro XS',
    excerpt: 'A performance-focused replacement for anglers who care about response, tournament-style running, and Mercury-specific setup confidence.',
    scenario: 'Bass boat repower',
    boatType: 'Bass boat',
    region: 'Ontario tournament / inland lakes',
    beforeMotor: 'Older 150HP two-stroke class setup',
    afterMotor: 'Mercury 150 Pro XS',
    hpJump: '150 → 150 Pro XS',
    heroImage: '/lovable-uploads/bass-boat-150-proxs-hero-real.png',
    detailImage: '/lovable-uploads/bass-boat-150-proxs-detail-real.png',
    customerQuote: 'The right bass-boat repower is not just about peak speed — it is about repeatable performance, setup confidence, and running hard all day.',
    recommendation: 'Best for bass-boat owners who already know they want Mercury Pro XS character and cleaner modern rigging.',
    whyItWorked: [
      'Performance-oriented Mercury Pro XS fit for bass hulls',
      'Modern rigging and cleaner replacement package',
      'Strong visual proof for bass-boat buying content'
    ],
    isIllustrative: false,
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
    excerpt: 'A smart mid-range upgrade for heavier small boats that need more confidence leaving the dock fully loaded.',
    scenario: 'Walkaround / cuddy repower',
    boatType: 'Walkaround cuddy',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '90HP older outboard',
    afterMotor: 'Mercury 115HP EFI FourStroke',
    hpJump: '90 → 115',
    heroImage: '/lovable-uploads/cuddy-115-hero-real.png',
    detailImage: '/lovable-uploads/cuddy-115-detail-real.png',
    customerQuote: 'The 115 class is often the sweet spot when a small cabin boat needs more push without jumping into a much heavier package.',
    recommendation: 'Best for small cuddy and walkaround owners wanting a stronger all-around match for real Ontario use.',
    whyItWorked: [
      'Better fit for a heavier hull than a lower-output setup',
      'Improved confidence with passengers and gear',
      'Useful real-photo proof for 115-class buying decisions'
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS05'
  }
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((caseStudy) => caseStudy.slug === slug);
}
