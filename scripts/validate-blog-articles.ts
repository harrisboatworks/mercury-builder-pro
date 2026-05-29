#!/usr/bin/env node
/**
 * Blog Articles Schema Validator
 * ---------------------------------
 * Loads src/data/blogArticles.ts and validates every entry against the
 * BlogArticle contract (required fields, formats, cross-references).
 *
 * Run: `npm run check:blog-articles`
 * Exits non-zero (fails build / prebuild) if any entry is invalid.
 */
import { blogArticles, type BlogArticle } from '../src/data/blogArticles';

type Issue = { slug: string; field: string; message: string };
const issues: Issue[] = [];
const push = (slug: string, field: string, message: string) =>
  issues.push({ slug, field, message });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Accept "N min read", "~N min read", "N-M min read" — anything containing "min"
// preceded by digits is treated as schema-valid; tighter SEO formatting is enforced elsewhere.
const READ_TIME_RE = /\d+\s*[-\u2013]?\s*\d*\s*min(?:\s*read)?/i;
const ISO_DURATION_RE = /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/;
const IMAGE_RE = /^(?:https?:\/\/|\/)/;
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{6,15}$/;
const EM_DASH = '\u2014';

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const isValidDate = (v: string): boolean => {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
};

const allSlugs = new Set<string>();
const dupSlugs = new Set<string>();
for (const a of blogArticles) {
  if (typeof a.slug === 'string') {
    if (allSlugs.has(a.slug)) dupSlugs.add(a.slug);
    allSlugs.add(a.slug);
  }
}

function checkEmDash(slug: string, field: string, value: string) {
  if (value.includes(EM_DASH)) {
    const idx = value.indexOf(EM_DASH);
    push(
      slug,
      field,
      `Contains em-dash (U+2014) at offset ${idx}: "${value.slice(Math.max(0, idx - 20), idx + 20)}"`,
    );
  }
}

function validate(article: BlogArticle, index: number) {
  const slug = article.slug || `<index ${index}>`;

  // slug
  if (!isNonEmptyString(article.slug)) push(slug, 'slug', 'Missing or empty');
  else if (!SLUG_RE.test(article.slug))
    push(slug, 'slug', `Not kebab-case: "${article.slug}"`);
  if (dupSlugs.has(article.slug))
    push(slug, 'slug', 'Duplicate slug across blogArticles');

  // Required strings
  const requiredStrings: (keyof BlogArticle)[] = [
    'title',
    'description',
    'content',
    'image',
    'author',
    'category',
    'readTime',
  ];
  for (const f of requiredStrings) {
    const v = article[f];
    if (!isNonEmptyString(v)) push(slug, String(f), 'Missing or empty');
    else checkEmDash(slug, String(f), v);
  }

  // seoTitle optional
  if (article.seoTitle !== undefined) {
    if (!isNonEmptyString(article.seoTitle))
      push(slug, 'seoTitle', 'Present but empty');
    else checkEmDash(slug, 'seoTitle', article.seoTitle);
  }


  // image format
  if (isNonEmptyString(article.image) && !IMAGE_RE.test(article.image))
    push(slug, 'image', `Must start with "/" or "http(s)://": "${article.image}"`);

  // Dates
  if (isNonEmptyString(article.datePublished) && !isValidDate(article.datePublished))
    push(slug, 'datePublished', `Invalid date "${article.datePublished}" (expect YYYY-MM-DD)`);
  if (isNonEmptyString(article.dateModified) && !isValidDate(article.dateModified))
    push(slug, 'dateModified', `Invalid date "${article.dateModified}" (expect YYYY-MM-DD)`);
  if (
    isValidDate(article.datePublished) &&
    isValidDate(article.dateModified) &&
    article.dateModified < article.datePublished
  )
    push(
      slug,
      'dateModified',
      `dateModified (${article.dateModified}) precedes datePublished (${article.datePublished})`,
    );
  if (article.publishDate !== undefined) {
    if (!isNonEmptyString(article.publishDate) || !isValidDate(article.publishDate))
      push(slug, 'publishDate', `Invalid date "${article.publishDate}"`);
  }

  // readTime format
  if (isNonEmptyString(article.readTime) && !READ_TIME_RE.test(article.readTime))
    push(slug, 'readTime', `Expected "N min read", got "${article.readTime}"`);

  // keywords
  if (!Array.isArray(article.keywords) || article.keywords.length === 0)
    push(slug, 'keywords', 'Must be a non-empty string array');
  else {
    article.keywords.forEach((k, i) => {
      if (!isNonEmptyString(k))
        push(slug, `keywords[${i}]`, 'Empty or non-string');
    });
  }

  // faqs
  if (article.faqs !== undefined) {
    if (!Array.isArray(article.faqs))
      push(slug, 'faqs', 'Must be an array if present');
    else
      article.faqs.forEach((faq, i) => {
        if (!faq || typeof faq !== 'object')
          push(slug, `faqs[${i}]`, 'Not an object');
        else {
          if (!isNonEmptyString(faq.question))
            push(slug, `faqs[${i}].question`, 'Missing or empty');
          else checkEmDash(slug, `faqs[${i}].question`, faq.question);
          if (!isNonEmptyString(faq.answer))
            push(slug, `faqs[${i}].answer`, 'Missing or empty');
          else {
            checkEmDash(slug, `faqs[${i}].answer`, faq.answer);
            // Detect clearly truncated answers: ending with hyphen, comma, or
            // an opening bracket. Letters/digits/period/quote are OK because
            // some answers end on a model name, stat, or sentence.
            const trimmed = faq.answer.trim();
            const last = trimmed[trimmed.length - 1];
            if (last && /[-,([{]/.test(last))
              push(
                slug,
                `faqs[${i}].answer`,
                `Looks truncated (ends with "${last}")`,
              );
          }
        }
      });
  }

  // relatedSlugs cross-references
  if (article.relatedSlugs !== undefined) {
    if (!Array.isArray(article.relatedSlugs))
      push(slug, 'relatedSlugs', 'Must be array if present');
    else
      article.relatedSlugs.forEach((s, i) => {
        if (!isNonEmptyString(s))
          push(slug, `relatedSlugs[${i}]`, 'Empty value');
        else if (s === article.slug)
          push(slug, `relatedSlugs[${i}]`, 'Self-reference not allowed');
        else if (!allSlugs.has(s))
          push(slug, `relatedSlugs[${i}]`, `Unknown slug "${s}"`);
      });
  }

  // howToSteps
  if (article.howToSteps !== undefined) {
    if (!Array.isArray(article.howToSteps) || article.howToSteps.length === 0)
      push(slug, 'howToSteps', 'Must be non-empty array if present');
    else
      article.howToSteps.forEach((step, i) => {
        if (!step || typeof step !== 'object')
          push(slug, `howToSteps[${i}]`, 'Not an object');
        else {
          if (!isNonEmptyString(step.name))
            push(slug, `howToSteps[${i}].name`, 'Missing or empty');
          if (!isNonEmptyString(step.text))
            push(slug, `howToSteps[${i}].text`, 'Missing or empty');
          if (step.image !== undefined && !isNonEmptyString(step.image))
            push(slug, `howToSteps[${i}].image`, 'Present but empty');
          else if (step.image && !IMAGE_RE.test(step.image))
            push(slug, `howToSteps[${i}].image`, `Bad URL "${step.image}"`);
        }
      });
  }

  if (article.howToTotalTime !== undefined) {
    if (!isNonEmptyString(article.howToTotalTime) || !ISO_DURATION_RE.test(article.howToTotalTime))
      push(
        slug,
        'howToTotalTime',
        `Expected ISO 8601 duration (e.g. "PT60M"), got "${article.howToTotalTime}"`,
      );
  }

  for (const f of ['howToSupplies', 'howToTools'] as const) {
    const v = article[f];
    if (v !== undefined) {
      if (!Array.isArray(v))
        push(slug, f, 'Must be array if present');
      else
        v.forEach((s, i) => {
          if (!isNonEmptyString(s))
            push(slug, `${f}[${i}]`, 'Empty or non-string');
        });
    }
  }

  // YouTube paired fields
  const hasId = article.youtubeVideoId !== undefined;
  const hasTitle = article.youtubeVideoTitle !== undefined;
  if (hasId !== hasTitle)
    push(
      slug,
      'youtubeVideoId/Title',
      'youtubeVideoId and youtubeVideoTitle must both be set or both omitted',
    );
  if (hasId) {
    if (!isNonEmptyString(article.youtubeVideoId) || !YOUTUBE_ID_RE.test(article.youtubeVideoId!))
      push(slug, 'youtubeVideoId', `Invalid id "${article.youtubeVideoId}"`);
    if (!isNonEmptyString(article.youtubeVideoTitle))
      push(slug, 'youtubeVideoTitle', 'Missing or empty');
  }
}

blogArticles.forEach(validate);

if (issues.length) {
  console.error(`\nBlog article schema validation FAILED — ${issues.length} issue(s):\n`);
  const bySlug = new Map<string, Issue[]>();
  for (const i of issues) {
    if (!bySlug.has(i.slug)) bySlug.set(i.slug, []);
    bySlug.get(i.slug)!.push(i);
  }
  for (const [slug, list] of bySlug) {
    console.error(`  [${slug}]`);
    for (const i of list) console.error(`    - ${i.field}: ${i.message}`);
  }
  console.error(`\nTotal: ${issues.length} issue(s) across ${bySlug.size} article(s).\n`);
  process.exit(1);
} else {
  console.log(
    `Blog article schema validation PASSED — ${blogArticles.length} article(s) checked.`,
  );
}
