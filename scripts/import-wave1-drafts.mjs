// One-shot converter: reads /mnt/user-uploads/0N-LL-*.md drafts and writes
// src/data/{punjabi,urdu,tagalog,hindi}BlogArticles.ts for Wave 1 launch.
// Run via: node scripts/import-wave1-drafts.mjs
import fs from 'node:fs';
import path from 'node:path';
// Custom permissive frontmatter parser (the drafts contain unquoted ":" inside
// FAQ answers which strict YAML rejects).

const UPLOAD_DIR = '/mnt/user-uploads';
const OUT_DIR = path.resolve('src/data');

const FILES = [
  { n: '01', lang: 'pa', file: '01-pa-ontario-fishing-licence-punjabi-guide.md',          hero: 'hero-01-pa-fishing-licence' },
  { n: '02', lang: 'pa', file: '02-pa-boat-licence-rental-ontario-punjabi-pcoc-faq.md',   hero: 'hero-02-pa-pcoc-rental' },
  { n: '03', lang: 'pa', file: '03-pa-mercury-outboard-prices-ontario-punjabi.md',        hero: 'hero-03-pa-mercury-prices' },
  { n: '04', lang: 'ur', file: '04-ur-ontario-fishing-licence-rice-lake-urdu.md',         hero: 'hero-04-ur-fishing-licence' },
  { n: '05', lang: 'ur', file: '05-ur-used-boat-buying-checklist-urdu.md',                hero: 'hero-05-ur-used-boat' },
  { n: '06', lang: 'ur', file: '06-ur-boat-winterization-storage-toronto-urdu.md',        hero: 'hero-06-ur-winterization' },
  { n: '07', lang: 'tl', file: '07-tl-first-time-fishing-rice-lake-tagalog-family-guide.md', hero: 'hero-07-tl-family-fishing' },
  { n: '08', lang: 'tl', file: '08-tl-ontario-boat-rental-rules-tagalog-pcoc.md',         hero: 'hero-08-tl-rental-rules' },
  { n: '09', lang: 'tl', file: '09-tl-outboard-service-winterization-tagalog.md',         hero: 'hero-09-tl-service' },
  { n: '10', lang: 'hi', file: '10-hi-ontario-boat-licence-fishing-licence-hindi.md',     hero: 'hero-10-hi-licences' },
];

const LANG_META = {
  pa: { varName: 'punjabiBlogArticles', getter: 'getPunjabiArticleBySlug', outFile: 'punjabiBlogArticles.ts', constName: 'PA_LANGUAGE_NOTE', category: 'ਪੰਜਾਬੀ ਗਾਈਡ', readTimeFallback: '8 ਮਿੰਟ' },
  ur: { varName: 'urduBlogArticles',     getter: 'getUrduArticleBySlug',    outFile: 'urduBlogArticles.ts',    constName: 'UR_LANGUAGE_NOTE', category: 'اردو گائیڈ',    readTimeFallback: '8 منٹ' },
  tl: { varName: 'tagalogBlogArticles',  getter: 'getTagalogArticleBySlug', outFile: 'tagalogBlogArticles.ts', constName: 'TL_LANGUAGE_NOTE', category: 'Tagalog Guide', readTimeFallback: '8 min basa' },
  hi: { varName: 'hindiBlogArticles',    getter: 'getHindiArticleBySlug',   outFile: 'hindiBlogArticles.ts',   constName: 'HI_LANGUAGE_NOTE', category: 'हिन्दी गाइड',    readTimeFallback: '8 मिनट' },
};

// Language-support FAQ markers (substring match, case-insensitive) used to
// pick the canonical "service in {language}?" answer as the LANGUAGE_NOTE.
const LANG_NOTE_QUESTION_HINTS = {
  pa: ['punjabi vich service', 'ਪੰਜਾਬੀ ਵਿੱਚ service', 'ਪੰਜਾਬੀ ਵਿੱਚ ਸੇਵਾ', 'punjabi vich'],
  ur: ['اردو میں سروس', 'urdu mein service', 'urdu me service'],
  tl: ['tagalog sa harris', 'sa tagalog', 'serbisyo ba kayo sa tagalog'],
  hi: ['hindi में सेवा', 'hindi mein service', 'हिन्दी में सेवा', 'hindi me service'],
};

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('No YAML frontmatter');
  const fm = YAML.parse(m[1]);
  const body = m[2].trim();
  return { fm, body };
}

function splitTitle(title) {
  // Drafts have "English | Native" titles; use full as title, full as seoTitle.
  return { title: title.trim(), seoTitle: title.trim() };
}

function stripLeadingH1(body) {
  // Drop the first "# ..." line in the body so the page H1 (from `title`) isn't doubled.
  const lines = body.split('\n');
  const idx = lines.findIndex((l) => l.trim().length > 0);
  if (idx >= 0 && lines[idx].startsWith('# ')) {
    lines.splice(idx, 1);
    // also drop a single blank line following the removed H1
    if (lines[idx] && lines[idx].trim() === '') lines.splice(idx, 1);
  }
  return lines.join('\n').trim();
}

function firstParagraph(body) {
  const blocks = body.split(/\n\s*\n/);
  for (const b of blocks) {
    const t = b.trim();
    if (!t || t.startsWith('#') || t.startsWith('>') || t.startsWith('-') || t.startsWith('|')) continue;
    return t.replace(/\s+/g, ' ');
  }
  return '';
}

function pickLanguageNote(faqs, lang) {
  const hints = LANG_NOTE_QUESTION_HINTS[lang] || [];
  for (const faq of faqs || []) {
    const q = String(faq.q || '').toLowerCase();
    for (const h of hints) {
      if (q.includes(h.toLowerCase())) return String(faq.a);
    }
  }
  return null;
}

// TypeScript string-literal encoder using a template literal with escapes.
function tsBacktick(s) {
  return '`' + String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
}
function tsSingle(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n') + "'";
}

function todayIso() { return '2026-06-12'; }

const grouped = { pa: [], ur: [], tl: [], hi: [] };
const allLanguageNotes = {};

for (const entry of FILES) {
  const raw = fs.readFileSync(path.join(UPLOAD_DIR, entry.file), 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  const cleanedBody = stripLeadingH1(body);
  const { title, seoTitle } = splitTitle(fm.title);
  const slugOnly = String(fm.slug).replace(/^[a-z]{2}\//, '');
  const description = String(fm.metaDescription || '').trim();
  const faqs = Array.isArray(fm.faqs) ? fm.faqs.map((f) => ({ question: String(f.q), answer: String(f.a) })) : [];
  const keywords = Array.isArray(fm.targetQueries) ? fm.targetQueries.map((q) => String(q)) : [];
  const internalLinks = Array.isArray(fm.internalLinks) ? fm.internalLinks.map(String) : [];
  const officialSources = Array.isArray(fm.officialSources) ? fm.officialSources.map(String) : [];
  const heroImport = entry.hero;
  const datePublished = todayIso();
  const dateModified = todayIso();
  const category = LANG_META[entry.lang].category;
  const readTime = LANG_META[entry.lang].readTimeFallback;
  const langNote = pickLanguageNote(fm.faqs, entry.lang);
  if (langNote && !allLanguageNotes[entry.lang]) allLanguageNotes[entry.lang] = langNote;

  grouped[entry.lang].push({
    n: entry.n,
    slug: slugOnly,
    title,
    seoTitle,
    description,
    body: cleanedBody,
    heroImport,
    datePublished,
    dateModified,
    category,
    readTime,
    faqs,
    keywords,
    internalLinks,
    officialSources,
    nativeReview: String(fm.nativeReview || 'pending'),
  });
}

// Guardrail: no em-dashes or dollar-digit patterns in any draft body or description.
const EM = String.fromCharCode(0x2014);
for (const [lang, arts] of Object.entries(grouped)) {
  for (const a of arts) {
    for (const [field, val] of Object.entries({ title: a.title, description: a.description, body: a.body })) {
      if (String(val).includes(EM)) throw new Error(`Em-dash in ${lang}/${a.slug} ${field}`);
      if (/\$\d/.test(String(val))) throw new Error(`Dollar-digit pattern in ${lang}/${a.slug} ${field}`);
    }
  }
}

function emitFile(lang) {
  const meta = LANG_META[lang];
  const arts = grouped[lang];
  const note = allLanguageNotes[lang] || '';
  const imports = arts.map((a) => `import ${heroVar(a.heroImport)} from '@/assets/blog/${a.heroImport}.png';`).join('\n');
  const items = arts.map((a) => emitArticle(a)).join(',\n');
  return `// AUTO-GENERATED by scripts/import-wave1-drafts.mjs (Wave 1 launch 2026-06-12).
// Edit drafts in /mnt/user-uploads and re-run the script rather than editing
// this file by hand. Native review status carried via the \`nativeReview\` field.
import type { BlogArticle } from './blogArticles';
${imports}

/** Language-support FAQ answer reused wherever the "service in this language?" note appears. */
export const ${meta.constName} = ${tsBacktick(note)};

interface Wave1Article extends BlogArticle {
  /** Wave 1 native-review status. 'pending' until a native speaker signs off. */
  nativeReview?: 'pending' | 'reviewed';
  /** Original draft frontmatter internalLinks for audit. */
  internalLinks?: string[];
  /** Original draft frontmatter officialSources for audit. */
  officialSources?: string[];
}

export const ${meta.varName}: Wave1Article[] = [
${items}
];

export function ${meta.getter}(slug: string): Wave1Article | undefined {
  return ${meta.varName}.find((a) => a.slug === slug);
}
`;
}

function heroVar(name) {
  return 'hero_' + name.replace(/[^a-zA-Z0-9]+/g, '_');
}

function emitArticle(a) {
  const faqs = a.faqs.length
    ? '[\n' + a.faqs.map((f) => `      { question: ${tsSingle(f.question)}, answer: ${tsSingle(f.answer)} }`).join(',\n') + '\n    ]'
    : '[]';
  const keywords = '[' + a.keywords.map(tsSingle).join(', ') + ']';
  const internalLinks = '[' + a.internalLinks.map(tsSingle).join(', ') + ']';
  const officialSources = '[' + a.officialSources.map(tsSingle).join(', ') + ']';
  return `  {
    slug: ${tsSingle(a.slug)},
    title: ${tsSingle(a.title)},
    seoTitle: ${tsSingle(a.seoTitle)},
    description: ${tsSingle(a.description)},
    image: ${heroVar(a.heroImport)},
    author: 'Harris Boat Works',
    datePublished: ${tsSingle(a.datePublished)},
    dateModified: ${tsSingle(a.dateModified)},
    category: ${tsSingle(a.category)},
    readTime: ${tsSingle(a.readTime)},
    keywords: ${keywords},
    faqs: ${faqs},
    nativeReview: 'pending',
    internalLinks: ${internalLinks},
    officialSources: ${officialSources},
    content: ${tsBacktick(a.body)}
  }`;
}

for (const lang of ['pa', 'ur', 'tl', 'hi']) {
  const out = path.join(OUT_DIR, LANG_META[lang].outFile);
  fs.writeFileSync(out, emitFile(lang), 'utf8');
  console.log(`wrote ${out} (${grouped[lang].length} articles)`);
}

console.log('LANGUAGE_NOTE preview (first 80 chars per language):');
for (const [l, n] of Object.entries(allLanguageNotes)) {
  console.log(`  ${l}: ${String(n).slice(0, 80)}`);
}
