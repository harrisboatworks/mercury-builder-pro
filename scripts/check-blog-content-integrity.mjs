#!/usr/bin/env node
/**
 * Structural and policy integrity checks for the blog corpus.
 *
 * This catches the append-instead-of-replace failure pattern that previously
 * duplicated headings and paragraphs or placed one article inside another.
 * A small set of topic sentinels also protects high-risk pricing and policy
 * pages from being overwritten with unrelated copy.
 */

import { readFileSync, readdirSync } from 'node:fs';

const BLOG_FILES = readdirSync('src/data')
  .filter((file) => file === 'blogArticles.ts' || (file.endsWith('BlogArticles.ts') && file !== 'archivedBlogArticles.ts'))
  .map((file) => `src/data/${file}`);

const CRITICAL_ARTICLES = [
  {
    file: 'src/data/blogArticles.ts',
    slug: 'ontario-mercury-outboard-price-guide',
    required: [/pricing-reference/i, /Mercury/i, /Ontario/i],
  },
  {
    file: 'src/data/blogArticles.ts',
    slug: 'accidentally-increase-boat-service-bills-ontario',
    required: [/service/i, /repair/i, /Ontario/i],
  },
  {
    file: 'src/data/blogArticles.ts',
    slug: 'repower-old-motor-trade-in-hst-disposal-ontario',
    required: [/trade-in/i, /HST/i, /disposal/i],
  },
  {
    file: 'src/data/blogArticles.ts',
    slug: 'legend-boats-mercury-power-package-guide-ontario',
    required: [/Legend Boats/i, /Mercury/i, /Ontario/i],
  },
  {
    file: 'src/data/frenchBlogArticles.ts',
    slug: 'guide-assurance-bateau-ontario-2026',
    required: [/assurance/i, /Ontario/i],
    forbidden: [/rabais pour (?:l['’]entreposage|entreposage) int[ée]rieur/i],
  },
  {
    file: 'src/data/frenchBlogArticles.ts',
    slug: 'hivernisation-moteur-mercury-ontario',
    required: [/hbw\.wiki\/service/i, /entreposage ext[ée]rieur/i, /30 pieds/i],
    forbidden: [/entreposage.*int[ée]rieur et ext[ée]rieur/i],
  },
  {
    file: 'src/data/frenchBlogArticles.ts',
    slug: 'revue-mercury-75-hp-fourstroke-ontario',
    required: [/hbw\.wiki\/service/i, /75 HP/i],
    forbidden: [/Command Thrust.*Oui/i],
  },
  {
    file: 'src/data/koreanBlogArticles.ts',
    slug: 'ontario-boating-licence-regulations',
    required: [/온타리오/, /면허|자격증/, /PCOC/],
  },
  {
    file: 'src/data/koreanBlogArticles.ts',
    slug: 'mercury-outboard-winterization-guide',
    required: [/hbw\.wiki\/service/i],
  },
  {
    file: 'src/data/blogArticles.ts',
    slug: 'mercury-outboard-beeping-codes-guide',
    required: [/hbw\.wiki\/service/i, /Three beeps every 4 minutes/i, /Six beeps/i, /mercury-alarm-beep-codes-quick-reference\.pdf/i],
    forbidden: [/diagnose by phone in under 5 minutes/i],
  },
  {
    file: 'src/data/blogArticles.ts',
    slug: 'winter-boat-storage-shrinkwrap-vs-indoor-ontario',
    required: [/outdoor/i, /shrinkwrap/i],
    forbidden: [/we do both/i, /can be done at HBW or at your house/i, /offer mobile shrinkwrap service/i],
  },
  {
    file: 'src/data/blogArticles.ts',
    slug: 'mercury-command-thrust-pontoon-eligibility-2026',
    required: [/40/, /50/, /60/, /90/, /115/],
    forbidden: [/25 to 115 HP range/i],
  },
  {
    file: 'src/data/mandarinBlogArticles.ts',
    slug: 'first-boat-rental-rice-lake-chinese-guide',
    required: [/HBW/, /PCOC/],
    forbidden: [/短期租船通常不需要\s*PCOC/],
  },
  {
    file: 'src/data/traditionalChineseBlogArticles.ts',
    slug: 'first-boat-rental-rice-lake-chinese-guide',
    required: [/HBW/, /實體 PCOC/],
    forbidden: [/短期租船通常不需要\s*PCOC/, /租賃船隻通常不要求\s*PCOC/],
  },
  {
    file: 'src/data/traditionalChineseBlogArticles.ts',
    slug: 'pcoc-pcl-fishing-licence-difference-ontario',
    required: [/5 年/, /實體 PCOC/, /申請費/],
    forbidden: [/PCL.{0,20}免費/, /10 年（到期續期）/],
  },
];

function lineNumberFor(source, index) {
  return source.slice(0, index).split('\n').length;
}

function findTemplateEnd(source, start) {
  let interpolationDepth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '\\') {
      i += 1;
      continue;
    }
    if (source[i] === '$' && source[i + 1] === '{') {
      interpolationDepth += 1;
      i += 1;
      continue;
    }
    if (source[i] === '}' && interpolationDepth > 0) {
      interpolationDepth -= 1;
      continue;
    }
    if (source[i] === '`' && interpolationDepth === 0) return i;
  }
  return -1;
}

function extractArticles(file) {
  const source = readFileSync(file, 'utf8');
  const slugMatches = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
  const articles = new Map();

  for (let i = 0; i < slugMatches.length; i++) {
    const match = slugMatches[i];
    const blockEnd = slugMatches[i + 1]?.index ?? source.length;
    const block = source.slice(match.index, blockEnd);
    const contentMatch = /content:\s*`/.exec(block);
    if (!contentMatch) continue;

    const contentStart = match.index + contentMatch.index + contentMatch[0].length;
    const contentEnd = findTemplateEnd(source, contentStart);
    if (contentEnd < 0 || contentEnd > blockEnd) {
      throw new Error(`${file}:${lineNumberFor(source, contentStart)} unterminated or cross-article content for "${match[1]}"`);
    }

    if (articles.has(match[1])) {
      throw new Error(`${file}:${lineNumberFor(source, match.index)} duplicate slug "${match[1]}"`);
    }

    articles.set(match[1], {
      content: source.slice(contentStart, contentEnd),
      raw: block,
      line: lineNumberFor(source, contentStart),
    });
  }

  return articles;
}

function normalizeHeading(value) {
  return value
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function normalizeParagraph(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function repeatedValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1);
}

const corpus = new Map();
const errors = [];

for (const file of BLOG_FILES) {
  let articles;
  try {
    articles = extractArticles(file);
  } catch (error) {
    errors.push(error.message);
    continue;
  }
  corpus.set(file, articles);

  for (const [slug, article] of articles) {
    if (/\b584\b/.test(article.raw)) {
      errors.push(`${file}:${article.line} "${slug}" contains the unverified rolling claim "584"`);
    }
    if (file === 'src/data/frenchBlogArticles.ts' && /concessionnaire\s+(?:Mercury\s+)?Platine/i.test(article.raw)) {
      errors.push(`${file}:${article.line} "${slug}" incorrectly calls the dealership Platinum instead of Premier`);
    }

    const headings = [...article.content.matchAll(/^#{2,3}\s+(.+)$/gm)]
      .map((match) => normalizeHeading(match[1]))
      .filter(Boolean);
    for (const [heading, count] of repeatedValues(headings)) {
      errors.push(`${file}:${article.line} "${slug}" repeats section heading "${heading}" ${count} times`);
    }

    const paragraphs = article.content
      .split(/\n\s*\n/)
      .map(normalizeParagraph)
      .filter((paragraph) => paragraph.length >= 180)
      .filter((paragraph) => !/^(?:#|\||[-*+]\s|>|<)/.test(paragraph));
    for (const [paragraph, count] of repeatedValues(paragraphs)) {
      errors.push(`${file}:${article.line} "${slug}" repeats a ${paragraph.length}-character paragraph ${count} times: "${paragraph.slice(0, 90)}..."`);
    }
  }
}

for (const sentinel of CRITICAL_ARTICLES) {
  const article = corpus.get(sentinel.file)?.get(sentinel.slug);
  if (!article) {
    errors.push(`${sentinel.file}: missing critical article "${sentinel.slug}"`);
    continue;
  }
  for (const pattern of sentinel.required ?? []) {
    if (!pattern.test(article.raw)) {
      errors.push(`${sentinel.file}:${article.line} "${sentinel.slug}" is missing required topic sentinel ${pattern}`);
    }
  }
  for (const pattern of sentinel.forbidden ?? []) {
    if (pattern.test(article.raw)) {
      errors.push(`${sentinel.file}:${article.line} "${sentinel.slug}" contains forbidden regression sentinel ${pattern}`);
    }
  }
}

if (errors.length) {
  console.error('\nBlog content integrity check failed:\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} issue(s) found across ${BLOG_FILES.length} blog data files.\n`);
  process.exit(1);
}

const articleCount = [...corpus.values()].reduce((sum, articles) => sum + articles.size, 0);
console.log(`Blog content integrity check passed for ${articleCount} articles across ${BLOG_FILES.length} files.`);
