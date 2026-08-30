import { blogArticles } from '../src/data/blogArticles';
import { detectH2Card } from '../src/lib/blogSectionCardHeadings';

const failures: string[] = [];
let checked = 0;

function expectedCard(heading: string): string | null {
  const normalized = heading
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.startsWith('what we see at hbw') || normalized.startsWith('from the shop')) {
    return 'hbw-note';
  }
  if (normalized.startsWith('official references')) return 'sources';
  if (
    normalized.includes('mistake') &&
    (normalized.startsWith('common ') ||
      normalized.includes('mistakes we see') ||
      /^the \d+ mistakes\b/.test(normalized) ||
      normalized.startsWith('prop mistakes'))
  ) {
    return 'common-mistakes';
  }
  return null;
}

const nearMissFixtures: Array<[string, string]> = [
  ['What We See at HBW: Bilge Pump Brands', 'hbw-note'],
  ['From the Shop: Mercruiser Sterndrives We Still Service', 'hbw-note'],
  ['Common Mistakes When Choosing a Propeller', 'common-mistakes'],
  ['Official References and Source Notes', 'sources'],
];

for (const [heading, expected] of nearMissFixtures) {
  checked++;
  const actual = detectH2Card(heading);
  if (actual !== expected) failures.push(`fixture: ${heading} -> ${actual || 'no card'}`);
}

for (const article of blogArticles) {
  for (const match of (article.content || '').matchAll(/^##\s+(.+?)\s*$/gm)) {
    const heading = match[1];
    const expected = expectedCard(heading);
    if (!expected) continue;
    checked++;
    const actual = detectH2Card(heading);
    if (actual !== expected) failures.push(`${article.slug}: ${heading} -> ${actual || 'no card'}`);
  }
}

if (failures.length) {
  console.error('Blog section-card heading check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Blog section-card heading check passed: ${checked} shop, mistakes, and source headings.`);
