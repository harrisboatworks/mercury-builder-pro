#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.join('src', 'data', 'mandarinBlogArticles.ts');
const routes = [
  'toronto-fishing-rice-lake-vs-lake-simcoe-kawarthas',
  'mercury-outboard-horsepower-guide-toronto-chinese',
  'mercury-outboard-price-dealer-guide-toronto-chinese',
  'ontario-spring-boat-checklist-chinese',
  'used-boat-buying-checklist-toronto-chinese',
  'boat-ownership-cost-ontario-chinese',
  'gta-chinese-rent-to-buy-boat-roadmap',
];

if (routes.length !== 7 || new Set(routes).size !== 7) {
  throw new Error(`F-008 route contract must contain exactly seven unique routes; found ${routes.length}`);
}

const approvedTerms = [
  'Harris Boat Works',
  'Mercury Marine Premier dealer',
  'Mercury FourStroke',
  'Mercury Outboards',
  'Mercury Pro XS',
  'Mercury Canada',
  'Pleasure Craft Licence',
  'Rental Boat Safety Checklist',
  'Safe Boating Guide',
  'Transport Canada',
  'Trent Canal System',
  'Lake Couchiching',
  'Lake Simcoe',
  'Green River',
  'Gores Landing',
  'Legend Boats',
  'MercuryRepower.ca',
  'Command Thrust',
  'Idle Charge',
  'FourStroke',
  'SmartCraft',
  'MerCruiser',
  'Kawarthas',
  'Simcoe',
  'Ontario',
  'Mercury',
  'Costco',
  'Toronto',
  'Peterborough',
  'Markham',
  'Richmond Hill',
  'Scarborough',
  'GTA',
  'HBW',
  'PCOC',
  'PCL',
  'PFD',
  'FMZ',
  'Pro XS',
  'V6',
  'V8',
  'EFI',
  'CAD',
  'HP',
  'kW',
  'RPM',
];

const citationLabels = new Set([
  'HBW Mercury Outboards',
  'HBW Rice Lake Boat Rentals',
  'Harris Boat Works',
  'Harris Boat Works Mercury Outboards',
  'Harris Boat Works Mercury Outboards, Mercury FourStroke 2.5-20hp, Mercury FourStroke 75-150hp, Mercury Pro XS',
  'Harris Boat Works Mercury Outboards, Mercury FourStroke 25-30hp',
  'Mercury FourStroke 2.5-20hp',
  'Mercury FourStroke 75-150hp',
  'Mercury Pro XS',
  'Mercury Pro XS, Mercury FourStroke 75-150hp',
  'Ontario FMZ 16',
  'Ontario FMZ 17',
  'Ontario Fishing Regulations Traditional Chinese',
  'Ontario Traditional Chinese fishing regulations',
  'Ontario Traditional Chinese fishing regulations, Ontario FMZ 16, Ontario FMZ 17',
  'Ontario free family fishing, Transport Canada PCOC',
  'Transport Canada PCL',
  'Transport Canada PCOC',
  'Transport Canada PCOC, Harris Boat Works',
  'Transport Canada Safe Boating Guide',
]);

const avoidableEnglish = [
  /\bpurchase price\b/i,
  /\bboat ownership\b/i,
  /\bboating\s*\/\s*fishing\b/i,
  /\bservice\s*\/\s*(?:storage|winterization)\b/i,
  /\brental page\b/i,
  /\bpaper or electronic cop(?:y|ies)\b/i,
  /\bvalid for life\b/i,
  /\bif applicable\b/i,
  /\bwithout buying\b/i,
  /\bcan improve\b/i,
  /\bincludes? (?:removal|installation)\b/i,
  /\bthe driver of the boat\b/i,
  /\bmust have a boat operator'?s licen[cs]e\b/i,
  /\bis in good condition\b/i,
];

const source = fs.readFileSync(sourcePath, 'utf8');
const failures = [];
const sourceOnly = process.argv.includes('--source-only');

function extractSourceArticle(slug) {
  const slugMarker = `slug: '${slug}'`;
  const slugStart = source.indexOf(slugMarker);
  if (slugStart === -1) return null;
  const nextSlug = source.indexOf("\n    slug: '", slugStart + slugMarker.length);
  const articleEnd = nextSlug === -1 ? source.length : nextSlug;
  const article = source.slice(slugStart, articleEnd);

  const field = (name) => article.match(new RegExp(`(?:^|\\n)\\s*${name}:\\s*'((?:\\\\.|[^'])*)'`))?.[1] || '';
  const contentStart = article.indexOf('content: `');
  const bodyStart = contentStart + 'content: `'.length;
  const bodyEnd = article.indexOf('\n`,', bodyStart);
  if (contentStart === -1 || bodyEnd === -1) return null;

  return {
    title: field('title'),
    seoTitle: field('seoTitle'),
    description: field('description'),
    content: article.slice(bodyStart, bodyEnd),
  };
}

function extractTwinArticle(slug) {
  const file = path.join('public', 'blog', 'zh', `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const markdown = fs.readFileSync(file, 'utf8');
  const title = markdown.match(/^title:\s*"([^"]*)"$/m)?.[1] || '';
  const description = markdown.match(/^description:\s*"([^"]*)"$/m)?.[1] || '';
  const generatedBody = markdown.match(/\*\*Canonical \(HTML for humans\):\*\*[^\n]*\n\n([\s\S]*)$/)?.[1] || '';
  const body = generatedBody.split('\n## Next steps\n')[0].trim();
  if (!title || !description || !body) return null;
  return { title, description, content: body };
}

function countLetters(text) {
  return {
    latin: (text.match(/[A-Za-z]/g) || []).length,
    han: (text.match(/\p{Script=Han}/gu) || []).length,
  };
}

function latinShare(text) {
  const { latin, han } = countLetters(text);
  return { latin, han, share: latin + han === 0 ? 0 : latin / (latin + han) };
}

function stripCitationLabels(text) {
  return text.replace(/\(([^()\n]+)\)/g, (match, label) => (
    citationLabels.has(label.trim()) ? ' ' : match
  ));
}

function stripAllowedNonProse(text) {
  return stripCitationLabels(text)
    .replace(/https?:\/\/[^\s)]+/g, ' ')
    .replace(/\]\([^)]*\)/g, ']');
}

function normalizeForProseMetric(text) {
  let normalized = stripAllowedNonProse(text)
    .replace(/\b\d+(?:\.\d+)?\s*(?:HP|kW|RPM|V|ft|km|mph|CAD)\b/gi, ' ');

  for (const term of approvedTerms.sort((a, b) => b.length - a.length)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized.replace(new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'gi'), ' ');
  }

  return normalized;
}

function validateSurface(slug, label, article) {
  const surface = [article.title, article.seoTitle, article.description, article.content].filter(Boolean).join('\n');
  const allowedStripped = stripAllowedNonProse(surface);
  const raw = latinShare(surface);
  const prose = latinShare(normalizeForProseMetric(surface));

  for (const pattern of avoidableEnglish) {
    if (pattern.test(allowedStripped)) failures.push(`${slug} ${label}: avoidable English prose matches ${pattern}`);
  }
  if (/\bRice Lake\b/.test(allowedStripped)) {
    failures.push(`${slug} ${label}: customer prose must use 莱斯湖, not bare Rice Lake`);
  }
  if (raw.share > 0.5) {
    failures.push(`${slug} ${label}: raw Latin share ${(raw.share * 100).toFixed(1)}% exceeds 50.0%`);
  }
  if (prose.share > 0.15) {
    failures.push(`${slug} ${label}: prose Latin share ${(prose.share * 100).toFixed(1)}% exceeds 15.0%`);
  }

  console.log(
    `${slug} ${label}: raw Latin ${(raw.share * 100).toFixed(1)}% (${raw.latin}/${raw.han}), prose Latin ${(prose.share * 100).toFixed(1)}% (${prose.latin}/${prose.han})`,
  );
}

for (const slug of routes) {
  const article = extractSourceArticle(slug);
  if (!article) {
    failures.push(`${slug}: source article not found`);
    continue;
  }

  const h2Count = (article.content.match(/^## /gm) || []).length;
  const tableCount = (article.content.match(/^\|(?:[^\n]*\|){2,}\n\|(?:\s*:?-{3,}:?\s*\|){2,}/gm) || []).length;
  if (h2Count < 8) failures.push(`${slug}: expected at least eight source H2 sections, found ${h2Count}`);
  if (tableCount < 1) failures.push(`${slug}: expected at least one source Markdown table`);
  validateSurface(slug, 'source', article);

  if (!sourceOnly) {
    const twin = extractTwinArticle(slug);
    if (!twin) failures.push(`${slug}: generated Markdown twin surface not found`);
    else validateSurface(slug, 'twin', twin);
  }
}

if (failures.length) {
  console.error('Mandarin code-mix check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Mandarin code-mix check passed for exactly ${routes.length} F-008 source${sourceOnly ? '' : ' and twin'} routes.`);
