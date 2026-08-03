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
  {
    label: 'unsupported capacity-plate legal or automatic-coverage claim',
    pattern:
      /\b(?:capacity plate|compliance notice)[^\n]{0,240}\b(?:legal ceiling|illegal in Canada|illegal under Canadian regulations|(?:voids|invalidates) (?:your |the )?(?:insurance|warranty))\b/i,
  },
  {
    label: 'incorrect universal capacity-plate claim',
    pattern:
      /\b(?:every|all) (?:powered |recreational |pleasure )?(?:boats?|powerboats?|hulls?)[^\n.]{0,50}\b(?:has|have|carries|carry|must have|is required to have|are required to have)\b[^\n.]{0,30}\b(?:capacity plate|compliance notice)\b/i,
  },
  {
    label: 'unsupported authorized-dealer warranty-validity claim',
    pattern:
      /\b(?:(?:Mercury |the )?(?:requires?|mandates?)[^\n.]{0,80}(?:authorized )?dealer install(?:ation)?[^\n.]{0,80}(?:warranty|coverage)|(?:DIY|self)[- ]install(?:ation|ing)?[^\n.]{0,80}(?:voids|invalidates)[^\n.]{0,30}(?:Mercury )?warranty|(?:dealer|authorized dealer)[^\n.]{0,50}(?:must|required to) install[^\n.]{0,50}(?:warranty|coverage)[^\n.]{0,20}(?:valid|void))\b/i,
  },
  {
    label: 'rejected 4,160-work-order service claim',
    pattern: /\b4,160\s+winterize-and-service work orders\b/i,
  },
  {
    label: 'incorrect HBW winterization or storage reservation pressure',
    pattern:
      /\b(?:book your winterize-and-service in late summer|book (?:now|early) (?:to )?(?:reserve|secure) (?:a )?(?:winterization|storage) (?:slot|space|spot)|(?:winterization|storage) (?:slots|spaces|spots) (?:fill|are limited)|reserve (?:your )?(?:fall )?(?:winterization|storage) (?:slot|space|spot))\b/i,
  },
] as const;

const editorialIntentChecks = [
  { slug: 'best-mercury-outboard-rice-lake-fishing', title: /Outboard Setup/i, description: /main motor and kicker/i },
  { slug: '2026-rice-lake-fishing-season-outlook', title: /Fishing Outlook 2026/i, description: /species outlook/i },
  { slug: 'mercury-smartcraft-connect-eligibility-2026', title: /Work With My Mercury.*Eligibility Check/i, description: /compatibility by Mercury engine family/i },
  { slug: 'mercury-smartcraft-connect-guide-ontario', title: /Features, App & Installation/i, description: /what SmartCraft Connect shows/i },
  { slug: 'best-mercury-outboard-lake-ontario-salmon-trout', title: /Best Mercury Outboard/i, description: /main outboard/i },
  { slug: 'lake-ontario-salmon-mercury-setup-guide-2026', title: /Boat Rigging/i, description: /kicker fit/i },
  { slug: 'boat-hull-replacement-vs-repower-decision', title: /Hull Worth Repowering/i, description: /transom, floor, stringers/i },
  { slug: 'repower-vs-new-boat', title: /Total Cost/i, description: /current quotes/i },
  { slug: 'how-to-read-boat-capacity-plate-ontario', title: /Read a Boat Capacity Plate in Ontario/i, description: /maximum recommended safe horsepower/i },
  { slug: 'repower-horsepower-capacity-plate-guide', title: /Choose Repower Horsepower/i, description: /motor weight/i },
  { slug: 'outdoor-boat-storage-shrinkwrap-rice-lake', title: /HBW Outdoor Winter Boat Storage/i, description: /Harris Boat Works/i },
  { slug: 'boat-storage-kawartha-lakes', title: /What to Compare Before Booking/i, description: /Compare outdoor, indoor/i },
  { slug: 'mercury-100-hour-service-cost-ontario', title: /What's Included/i, description: /when to submit an HBW service request/i },
] as const;

const serviceEvidenceSlugs = [
  // Spring commissioning has its own aggregate methodology note and focused
  // regression test because its 9,540-job snapshot and $99 scope are verified.
  'milky-gearcase-oil-meaning-cost-ontario',
  'mercury-water-pump-replacement-cost-ontario',
  'mercury-100-hour-service-cost-ontario',
  'mercury-impeller-replacement-when-they-fail',
  'trailer-boat-toronto-to-rice-lake-guide',
  'mercury-outboard-wont-start-troubleshooting',
] as const;

const unsupportedServiceEvidencePatterns = [
  {
    label: 'hardcoded customer-facing service price',
    pattern:
      /(?:\b(?:service|repair|diagnostic|labou?r|parts?|startup|winteriz\w*|commission\w*|water pump|impeller|gearcase)\b[^\n.]{0,120}(?:\$\s*\d|\bCAD\s+\d)|(?:\$\s*\d|\bCAD\s+\d)[^\n.]{0,120}\b(?:service|repair|diagnostic|labou?r|parts?|startup|winteriz\w*|commission\w*|water pump|impeller|gearcase)\b|^\|[^\n]*\$\s*\d[^\n]*\$\s*\d)/im,
  },
  {
    label: 'retired unsupported service statistic',
    pattern:
      /(?:by about 40 percent|as little as three weeks|phase separation takes 60(?:\s*(?:-|\u2013)\s*|\s+to\s+)90 days)/i,
  },
  {
    label: 'retired unsupported service-data graphic',
    pattern: /(?:impeller-failures-by-month-hbw|wont-start-causes-hbw)\.png/i,
  },
] as const;

const internalServiceCountPattern =
  /\b\d[\d,]*(?:\.\d+)?(?:[-\s]+[a-z][a-z-]*){0,8}[-\s]+(?:jobs?|work[- ]orders|pressure[- ]tests)\b/gi;
const internalServiceCountContext =
  /(?:\bour(?: own)? (?:service |repair )?(?:records?|history|system|data|work orders?|shop|service bench|completed)\b|\b(?:HBW|Harris Boat Works)(?:'s)? (?:service )?(?:records?|history|system|data)\b|\brecords?\b|\bhistory\b|\bdataset\b|\bin our system\b|\bcompleted work orders?\b|\blast (?:season|year)\b|\bshow(?:s|ed)?\b|\btaught\b|\breal numbers\b|\bmore than any\b)/i;
const verifiedInternalServiceCountExceptions: Record<string, RegExp> = {
  // Aggregate evidence and row grain are documented in
  // docs/blog-data-methodology/spring-commissioning-2026-08-02.md.
  'spring-commissioning-cost-ontario': /^(?:9,540|9,841)\b/,
};

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

  const completeArticleSource = [
    article.title,
    article.description,
    claimSource,
  ].join('\n');
  for (const match of completeArticleSource.matchAll(internalServiceCountPattern)) {
    if (verifiedInternalServiceCountExceptions[article.slug]?.test(match[0])) {
      continue;
    }
    const start = Math.max(0, (match.index || 0) - 180);
    const end = Math.min(
      completeArticleSource.length,
      (match.index || 0) + match[0].length + 180,
    );
    const context = completeArticleSource.slice(start, end);
    if (internalServiceCountContext.test(context)) {
      failures.push(
        `${article.slug}: unsupported internal service-count evidence (${match[0]})`,
      );
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

for (const intent of editorialIntentChecks) {
  const article = blogArticles.find((candidate) => candidate.slug === intent.slug);
  if (!article) {
    failures.push(`${intent.slug}: editorial-intent article is missing`);
    continue;
  }
  if (!intent.title.test(article.title)) {
    failures.push(`${intent.slug}: title no longer preserves the distinct search intent`);
  }
  if (!intent.description.test(article.description)) {
    failures.push(`${intent.slug}: description no longer preserves the distinct search intent`);
  }
}

for (const slug of serviceEvidenceSlugs) {
  const article = blogArticles.find((candidate) => candidate.slug === slug);
  if (!article) {
    failures.push(`${slug}: service-evidence article is missing`);
    continue;
  }

  const evidenceSource = [
    article.title,
    article.description,
    article.content,
    JSON.stringify(article.faqs || []),
  ].join('\n');

  for (const check of unsupportedServiceEvidencePatterns) {
    if (check.pattern.test(evidenceSource)) {
      failures.push(`${slug}: ${check.label}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Blog output hygiene check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Blog output hygiene check passed for ${blogArticles.length} articles, ${diagnosticSlugs.length} diagnostic CTA surfaces, ${unsupportedOperationalClaims.length} unsupported-claim guards, ${editorialIntentChecks.length} editorial-intent checks, and ${serviceEvidenceSlugs.length} service-evidence articles.`,
);
