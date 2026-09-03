#!/usr/bin/env node

import fs from 'node:fs';

const checks = [
  {
    file: 'public/blog/es/guia-comprar-bote-ontario.md',
    expected: ['$40–$50 CAD', '14–18 pies', '25–90 HP', '$800–$2,500 CAD', '$1,000–$3,000+ CAD'],
  },
  {
    file: 'public/blog/es/guia-pesca-rice-lake-ontario.md',
    expected: ['3–8 metros', '8–15 pies', '1.3–1.8 mph', '$9–$11 CAD', '7:30–11:00 AM'],
  },
  {
    file: 'public/blog/es/mercury-115-vs-150-comparacion.md',
    expected: ['5,000–6,000 RPM', '16–19 pies', '2–3 personas', '60–70%', '$2,000–$5,000+ CAD'],
  },
  {
    file: 'public/blog/fr/mercury-115-vs-150-hp-comparaison.md',
    expected: ['5 000–6 000 tr/min', '16–19 pieds', '60–70 %', '3–4 personnes'],
  },
  {
    file: 'public/blog/best-mercury-outboard-lake-ontario-salmon-trout.md',
    expected: ['300 HP Pro XS V8 or 300–350 HP SeaPro', 'plus 15 HP ProKicker'],
  },
  {
    file: 'public/blog/best-mercury-for-family-runabouts.md',
    expected: ['Mercury FourStroke in the 90–150 HP range'],
  },
  {
    file: 'public/blog/mercury-40-vs-60-hp-outboard-ontario.md',
    expected: ['5,500–6,000'],
  },
  {
    file: 'public/blog/mercury-9-9-efi-review-ontario.md',
    expected: ['5,000–6,000'],
  },
  {
    file: 'public/blog/mercury-75-hp-fourstroke-review-ontario.md',
    expected: ['4,500–5,500', '5,000–6,000'],
  },
  {
    file: 'public/blog/ko/mercury-115-vs-150-comparison.md',
    expected: ['5,000–6,000', '5,000–5,800', '16–19피트', '19–22피트'],
  },
  {
    file: 'public/blog/zh/mercury-115-vs-150-comparison-zh.md',
    expected: ['16–19英尺', '18–22英尺'],
  },
  {
    file: 'public/blog/mercury-dts-vs-mechanical-controls-ontario-repower.md',
    expected: [
      'FourStroke V6 (3.4L) | 175–225 HP',
      'FourStroke V8 (4.6L) | 250–300 HP',
    ],
  },
];

const forbidden = [
  '5,000, 6,000 RPM',
  '5,000, 5,800 RPM',
  '5 000, 6 000 tr/min',
  '5 000, 5 800 tr/min',
  '16, 19 pies',
  '19, 22 pies',
  '16, 19 pieds',
  '19, 22 pieds',
  '$2,000, $5,000+ CAD',
  'Mercury 90, 150 FourStroke',
  '300–400 HP 300-350 HP',
  'plus 9.9 ProKicker',
  '5,500, 6,000',
  '4,500, 5,500',
  '16, 19피트',
  '19, 22피트',
  '16, 19英尺',
  '18, 22英尺',
  'FourStroke V8 (4.6L) | 175-250 HP',
];

const sourceSurface = [
  'src/data/blogArticles.ts',
  'src/data/spanishBlogArticles.ts',
  'src/data/frenchBlogArticles.ts',
  'src/data/koreanBlogArticles.ts',
  'src/data/mandarinBlogArticles.ts',
].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

const failures = [];

for (const token of forbidden) {
  if (sourceSurface.includes(token)) failures.push(`source data: corrupt range remains "${token}"`);
}

for (const check of checks) {
  for (const token of check.expected) {
    if (!sourceSurface.includes(token)) failures.push(`source data: missing restored range "${token}"`);
  }
}

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing Markdown twin`);
    continue;
  }

  const markdown = fs.readFileSync(check.file, 'utf8');
  for (const token of check.expected) {
    if (!markdown.includes(token)) failures.push(`${check.file}: missing restored range "${token}"`);
  }
  for (const token of forbidden) {
    if (markdown.includes(token)) failures.push(`${check.file}: corrupt range remains "${token}"`);
  }

  const corruptTableRows = markdown
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .filter((line) => /(?:\$?\d[\d,.]*),\s+(?:\$?\d[\d,.]*)\s*(?:HP|RPM|tr\/min|pies|pieds|피트|英尺|CAD|%)/.test(line));
  if (corruptTableRows.length) {
    failures.push(`${check.file}: comma-separated numeric range remains in table: ${corruptTableRows[0]}`);
  }
}

if (failures.length) {
  console.error('Blog range-integrity check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Blog range-integrity check passed for ${checks.length} routes.`);
