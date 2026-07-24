#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

function walk(dir, predicate) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

const staticRenderer = readFileSync('scripts/static-prerender.mjs', 'utf8');
const runtimeRenderer = readFileSync('src/components/blog/MarkdownSectionCards.tsx', 'utf8');
const twinGenerator = readFileSync('scripts/generate-markdown-twins.mjs', 'utf8');

const FAQ_HEADING_LABELS = [
  'Frequently Asked Questions', 'FAQs', 'FAQ', 'Common Questions',
  'Common questions about HBW', 'Questions fréquentes', '자주 묻는 질문',
  '常见问题', '常見問題', 'Preguntas frecuentes', 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
  'ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ', 'Aksar puchhe jaande sawaal',
  'اکثر پوچھے جانے والے سوالات', 'اکثر پوچھے گئے سوالات',
  'کشتی کی ونٹرائزیشن اور اسٹوریج کے بارے میں عام سوالات', 'Mga madalas itanong',
  'Mga karaniwang tanong', 'अक्सर पूछे जाने वाले प्रश्न',
];
const FAQ_LABEL_PATTERN = FAQ_HEADING_LABELS
  .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const FAQ_TRAILER_PATTERN = String.raw`(?:\s*(?:\||:|,|\(|（|—|-)\s*[^\n<]*)?`;
const AUTHORING_HEADING_LABELS = [
  'Full Article', 'Article complet', 'Artículo completo', '전체 기사',
  '다음 단계 / CTA', '行动呼吁（CTA）',
  '行動呼籲（CTA）',
];
const AUTHORING_HEADING_PATTERN = [
  ...AUTHORING_HEADING_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  String.raw`CTA(?:\s*[,/|:：—-]\s*[^\n<]*)?`,
].join('|');

if (!/::bilingual-trust\(\?:-card\)\?/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must render the bilingual-trust-card alias');
}
if (!/::cta\\s\*\\n/.test(staticRenderer) || !/renderCtaHtml/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must expand CTA directives for no-JS readers');
}
if (!/renderCtaFooterHtml\(flat\.footer\)/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must render supported inline links in CTA footers');
}
if (!/hasFaqs:\s*Boolean\(article\.faqs\?\.length\)/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must suppress inline FAQ copy when structured FAQs are appended');
}
if (!/::bilingual-trust\(\?:-card\)\?/.test(runtimeRenderer)) {
  fail('src/components/blog/MarkdownSectionCards.tsx', 'must render the bilingual-trust-card alias');
}
if (!/directiveToMarkdown/.test(twinGenerator)) {
  fail('scripts/generate-markdown-twins.mjs', 'must convert visual directives into readable Markdown');
}

const localizedArticlePages = [
  'FrenchBlogArticlePage.tsx', 'KoreanBlogArticlePage.tsx', 'MandarinBlogArticlePage.tsx',
  'SpanishBlogArticlePage.tsx', 'PunjabiBlogArticlePage.tsx', 'UrduBlogArticlePage.tsx',
  'TagalogBlogArticlePage.tsx', 'HindiBlogArticlePage.tsx', 'TraditionalChineseBlogArticlePage.tsx',
];
for (const page of localizedArticlePages) {
  const file = join('src/pages/blog', page);
  const source = readFileSync(file, 'utf8');
  if (!/const cleanedContent\s*=\s*cleanLocalizedBlogContent\(/.test(source)) {
    fail(file, 'must derive localized reader content from the shared cleaner');
  }
  if (!/const tocItems\s*=\s*extractHeaders\(cleanedContent\)/.test(source)) {
    fail(file, 'must derive the localized TOC from cleaned reader content');
  }
}

const htmlLeakPatterns = [
  [/::(?:cta|bilingual-trust(?:-card)?|decision-card|diagnostic-flow|cost-stack)\b/i, 'raw visual directive'],
  [/(?:<|&lt;)div\s+class=(?:"|&quot;)hbw-language-note(?:"|&quot;)/i, 'raw language-note HTML'],
  [/\{\{LIVE_[A-Z_]+\}\}/, 'unresolved live token'],
  [new RegExp(`<h[23][^>]*>\\s*(?:Internal Links|${AUTHORING_HEADING_PATTERN})\\s*<\\/h[23]>`, 'i'), 'authoring-only heading'],
  [/(?:^|>)\s*Language:\s*English\s*(?:<|$)/im, 'Language scaffold'],
  [/(?:^|>)\s*Canonical URL:\s*https?:\/\//im, 'Canonical URL scaffold'],
];

const htmlFiles = walk('dist/blog', (path) => path.endsWith('/index.html'));
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const [pattern, label] of htmlLeakPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(html)) fail(file, label);
  }
  const faqHeadingPattern = new RegExp(
    `<h2[^>]*>\\s*(?:${FAQ_LABEL_PATTERN})${FAQ_TRAILER_PATTERN}\\s*<\\/h2>`,
    'gi',
  );
  const faqHeadings = html.match(faqHeadingPattern) || [];
  if (faqHeadings.length > 1) fail(file, `${faqHeadings.length} FAQ section headings`);
  const ctaBlocks = html.match(/<aside class="blog-inline-cta[\s\S]*?<\/aside>/gi) || [];
  for (const ctaBlock of ctaBlocks) {
    if (/\[[^\]]+\]\((?:\/|https?:\/\/)[^)]+\)/i.test(ctaBlock)) {
      fail(file, 'literal Markdown link in prerendered CTA');
    }
  }
  const relatedGuides = html.match(/<aside aria-labelledby="related-guides-heading-ssg">[\s\S]*?<\/aside>/i)?.[0] || '';
  if (/<\/a>\s+—\s+/.test(relatedGuides)) fail(file, 'em-dash related-guide separator');
  if (/\/blog\/(?:fr|ko|zh|es|pa|ur|tl|hi)\//.test(file.replace(/\\/g, '/')) && /class="author-byline"[^>]*>[\s\S]{0,120}<span>By\s/.test(html)) {
    fail(file, 'English static byline on a translated article');
  }
}

const ctaFooterGuard = 'dist/blog/fourstroke-vs-pro-xs/index.html';
if (!existsSync(ctaFooterGuard)) {
  fail(ctaFooterGuard, 'missing CTA footer regression artifact');
} else {
  const html = readFileSync(ctaFooterGuard, 'utf8');
  if (!/<a href="\/repower"[^>]*>repower basics<\/a>/.test(html)) {
    fail(ctaFooterGuard, 'missing rendered repower-basics CTA footer link');
  }
}

const twinFiles = walk('public/blog', (path) => path.endsWith('.md'));
const twinLeakPatterns = [
  [/^::(?:[a-z][a-z-]*)(?:\s|$)/m, 'raw visual directive'],
  [/<div\s+class="hbw-language-note"/i, 'raw language-note HTML'],
  [/\{\{LIVE_[A-Z_]+\}\}/, 'unresolved live token'],
  [new RegExp(`^#{2,3}\\s+(?:Internal Links|${AUTHORING_HEADING_PATTERN})\\s*$`, 'im'), 'authoring-only heading'],
  [/^\s*Language:\s*English\s*$/im, 'Language scaffold'],
  [/^[*_\s]*Canonical URL\s*:[*_\s]*https?:\/\//im, 'Canonical URL scaffold'],
];
for (const file of twinFiles) {
  const markdown = readFileSync(file, 'utf8');
  for (const [pattern, label] of twinLeakPatterns) {
    if (pattern.test(markdown)) fail(file, label);
  }
  const faqHeadingPattern = new RegExp(
    `^##\\s+(?:${FAQ_LABEL_PATTERN})${FAQ_TRAILER_PATTERN}\\s*$`,
    'gim',
  );
  const faqHeadings = markdown.match(faqHeadingPattern) || [];
  if (faqHeadings.length > 1) fail(file, `${faqHeadings.length} FAQ section headings`);
}

const whyHbwQuestionGuards = [
  'Are Harris Boat Works prices competitive with other Mercury dealers?',
  'Can a multi-brand dealer offer a better Mercury price?',
];
const whyHbwArtifacts = [
  'dist/blog/why-harris-boat-works-mercury-dealer/index.html',
  'public/blog/why-harris-boat-works-mercury-dealer.md',
];
for (const file of whyHbwArtifacts) {
  if (!existsSync(file)) {
    fail(file, 'missing why-HBW parity artifact');
    continue;
  }
  const content = readFileSync(file, 'utf8');
  for (const question of whyHbwQuestionGuards) {
    if (!content.includes(question)) fail(file, `missing recovered pricing question: ${question}`);
  }
}

if (failures.length) {
  console.error(`\nBlog renderer parity check failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures.slice(0, 80)) console.error(`  - ${failure}`);
  if (failures.length > 80) console.error(`  - ...and ${failures.length - 80} more`);
  process.exit(1);
}

console.log(`✓ Blog renderer parity: source guards passed; checked ${htmlFiles.length} prerendered article pages and ${twinFiles.length} Markdown twins`);
