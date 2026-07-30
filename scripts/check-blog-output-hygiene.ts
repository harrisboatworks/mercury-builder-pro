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
  `Blog output hygiene check passed for ${blogArticles.length} articles and ${diagnosticSlugs.length} diagnostic CTA surfaces.`,
);
