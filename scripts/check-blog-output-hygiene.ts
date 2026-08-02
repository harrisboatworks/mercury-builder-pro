import { blogArticles } from '../src/data/blogArticles';
import { cleanBlogContent } from '../src/lib/cleanBlogContent.js';

const diagnosticSlugs = [
  'mercury-outboard-wont-start-troubleshooting',
  'outboard-overheating-emergency-guide',
  'mercury-outboard-overheating-at-idle-fix-ontario',
  'mercury-outboard-beeping-codes-guide',
  'boat-electrical-safety-checklist-ontario-freshwater',
  'mercury-impeller-replacement-when-they-fail',
  'milky-gearcase-oil-meaning-cost-ontario',
];

const failures: string[] = [];

const unsupportedOperationalClaims = [
  {
    label: 'blanket same-day response or fit promise',
    pattern:
      /\b(?:same-day (?:fit check|yes\/no|reply|response|quote|installation|repair)|reply same-day)\b/i,
  },
  {
    label: 'fixed HBW repower turnaround promise',
    pattern:
      /\b(?:(?:boat is with us|repower is normally|repower is usually completed)[^\n.]{0,80}\b2\s*(?:to|-)\s*5 days|(?:clean install|clean repower)[^\n.]{0,80}\b(?:1|one)\s*(?:to|-)\s*(?:2|two) days)\b/i,
  },
  {
    label: 'one-business-day HBW trade appraisal promise',
    pattern:
      /\b(?:trade|CAD figure|trade value)[^\n.]{0,120}\bwithin one business day\b/i,
  },
  {
    label: 'unconditional water-test promise',
    pattern:
      /\b(?:(?:every|each) (?:single )?(?:HBW |Mercury |full )?repower[^\n.]{0,240}(?:water[- ]test|on-water|tested on Rice Lake)|(?:sea[- ]trial|on-water test)[^\n.]{0,80}(?:always included|before delivery)|boat does not leave[^\n.]{0,80}sea[- ]trial|we (?:test props|sea[- ]trial|run)[^\n.]{0,120}\bevery\b[^\n.]{0,60}(?:repower|install|sea[- ]trial)|every (?:install|repower)[^\n.]{0,80}(?:water[- ]test|sea[- ]trial))\b/i,
  },
  {
    label: 'unsupported on-water towing promise',
    pattern: /\b(?:provide on-water towing assistance|call [^\n.]{0,40} for tow dispatch)\b/i,
  },
  {
    label: 'unsupported Ontario parts-inventory superlative',
    pattern: /largest Mercury and MerCruiser parts inventory in Ontario/i,
  },
  {
    label: 'unsupported only-brand service superlative',
    pattern: /only brand-name outboard service/i,
  },
  {
    label: 'stale 120-month financing term',
    pattern: /\bterms? up to 120 months\b/i,
  },
  {
    label: 'stale under-24-hour financing approval promise',
    pattern: /\b(?:approval|answer)[^\n.]{0,80}\bunder 24 hours?\b/i,
  },
  {
    label: 'unsupported immediate motor-shipping promise',
    pattern: /\bin-stock (?:motors?|Pro XS)[^\n.]{0,40}\bship immediately\b/i,
  },
  {
    label: 'incorrect Mercury Canada financing-provider attribution',
    pattern: /Mercury Canada(?:'s)? financing partner/i,
  },
  {
    label: 'unconditional quote-price promise',
    pattern: /\bthe price you see is the price(?: you pay)?\b/i,
  },
] as const;

for (const article of blogArticles) {
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];
  const cleaned = cleanBlogContent(article.content, {
    hasStructuredFaqs: faqs.length > 0,
  });

  const forbiddenOutputPatterns = [
    /\*\*Language:\*\*\s*English/i,
    /^##\s+Internal Links\s*$/im,
    /^##\s+CTA\s*$/im,
    /^##\s+(?:Related Guides?|Related Posts?|Related Articles?|Related at HBW)\s*$/im,
  ];

  for (const pattern of forbiddenOutputPatterns) {
    if (pattern.test(cleaned)) {
      failures.push(`${article.slug}: output still matches ${pattern}`);
    }
  }

  if (
    faqs.length > 0 &&
    /^##\s+(?:Frequently Asked Questions|FAQs?|Common Questions)\b/im.test(
      cleaned,
    )
  ) {
    failures.push(`${article.slug}: inline FAQ remains beside structured faqs[]`);
  }

  const claimSource = `${article.content}\n${JSON.stringify(faqs)}`;
  for (const claim of unsupportedOperationalClaims) {
    if (claim.pattern.test(claimSource)) {
      failures.push(`${article.slug}: ${claim.label}`);
    }
  }
}

for (const slug of diagnosticSlugs) {
  const article = blogArticles.find((candidate) => candidate.slug === slug);
  if (!article) {
    failures.push(`${slug}: diagnostic article is missing`);
    continue;
  }

  const diagnosticSource = `${article.content}\n${JSON.stringify(article.faqs || [])}`;
  if (/(?:\+?1[-.\s]?)?\(?905\)?[-.\s]?342[-.\s]?2153/.test(diagnosticSource)) {
    failures.push(`${slug}: diagnostic content contains the public phone number`);
  }
}

if (failures.length > 0) {
  console.error('Blog output hygiene check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Blog output hygiene check passed for ${blogArticles.length} articles, ${diagnosticSlugs.length} diagnostic CTA surfaces, and ${unsupportedOperationalClaims.length} unsupported-claim guards.`,
);
