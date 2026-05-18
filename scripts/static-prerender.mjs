// Last rebuild trigger: 2026-05-12T15:00:00Z (force prerender against current blogArticles.ts)
/**
 * Static HTML stamping for crawler-friendly per-route HTML.
 *
 * Reads dist/index.html (the SPA shell Vite produces), then for each
 * configured route writes dist/{route}/index.html with:
 *   - per-route <title>
 *   - per-route <meta name="description">
 *   - per-route JSON-LD <script> blocks injected before </head>
 *   - per-route <noscript> semantic fallback inside <div id="root">
 *
 * Real users still get the React SPA, it hydrates over the stamped shell.
 * Crawlers (Googlebot, Meta-ExternalAgent, Perplexity, ChatGPT) get real
 * page-specific content with no browser dependency.
 *
 * Replaces the puppeteer-based prerender pipeline, which couldn't run on
 * Vercel's build container (missing Chromium shared libs).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { marked } from 'marked';

// Configure marked: GFM tables/strike, no auto line-break paragraphs.
marked.setOptions({ gfm: true, breaks: false });

// HTML-escape a string for safe insertion into prerendered markup.
function escHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Parse a YAML-ish directive body into { flat, lists, items }.
// Mirrors the parsers in src/components/blog/MarkdownSectionCards.tsx so
// prerendered HTML matches what React renders client-side.
function parseDirectiveBody(body) {
  const flat = {};
  const lists = {};
  let currentList = null;
  for (const raw of String(body).split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { currentList = null; continue; }
    const listItem = /^\s+-\s+(.*)$/.exec(line);
    if (listItem && currentList) {
      lists[currentList].push(listItem[1].trim());
      continue;
    }
    const kv = /^([a-zA-Z0-9]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) { currentList = null; continue; }
    const key = kv[1];
    const val = kv[2];
    if (val === '') {
      lists[key] = [];
      currentList = key;
    } else {
      flat[key] = val;
      currentList = null;
    }
  }
  return { flat, lists };
}

function renderDecisionCardHtml(body) {
  const { flat, lists } = parseDirectiveBody(body);
  if (!flat.heading) return '';
  const eyebrow = flat.eyebrow
    ? `<div class="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">${escHtml(flat.eyebrow)}</div>`
    : '';
  const subhead = flat.subhead
    ? `<p class="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">${escHtml(flat.subhead)}</p>`
    : '';
  const col = (label, criteria, outcome, variant, defaultVariant) => {
    const v = (variant === 'recommended' || variant === 'alternative') ? variant : defaultVariant;
    const isRec = v === 'recommended';
    const edgeClass = isRec
      ? 'border-l-[3px] border-l-mercury-red bg-mercury-red/5'
      : 'border-l-[3px] border-l-repower-navy-900 bg-white';
    const outcomeClass = isRec
      ? 'bg-repower-navy-900 text-white'
      : 'bg-repower-paper text-repower-navy-900 border border-repower-navy-900/15';
    const items = (criteria || []).map(c =>
      `<li class="flex items-start gap-2 text-sm text-repower-navy-900 leading-snug"><span aria-hidden="true" class="h-4 w-4 mt-0.5 flex-shrink-0 text-repower-navy-900">&#10003;</span><span>${escHtml(c)}</span></li>`
    ).join('');
    return `<div class="flex flex-col gap-4 p-6 md:p-8 flex-1 ${edgeClass}"><div class="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground">${escHtml(label || '')}</div><ul class="flex flex-col gap-2.5 list-none pl-0 m-0">${items}</ul><div class="mt-auto rounded-full px-4 py-2 text-center text-sm font-display font-semibold ${outcomeClass}">${escHtml(outcome || '')}</div></div>`;
  };
  const left = col(flat.leftLabel, lists.leftCriteria, flat.leftOutcome, flat.leftVariant, 'recommended');
  const right = col(flat.rightLabel, lists.rightCriteria, flat.rightOutcome, flat.rightVariant, 'alternative');
  const whenInDoubt = flat.whenInDoubt
    ? `<div class="border-t border-repower-navy-900/15 px-6 py-4 md:px-8 text-sm italic text-repower-navy-900/80 text-center"><span class="font-semibold not-italic mr-1">When in doubt:</span>${escHtml(flat.whenInDoubt)}</div>`
    : '';
  return `<div class="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden"><div class="px-6 pt-6 md:px-8 md:pt-8">${eyebrow}<h3 class="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">${escHtml(flat.heading)}</h3>${subhead}</div><div class="flex flex-col md:flex-row mt-2 divide-y md:divide-y-0 md:divide-x divide-repower-navy-900/15">${left}${right}</div>${whenInDoubt}</div>`;
}

function renderDiagnosticFlowHtml(body) {
  const flat = {};
  const stepsMap = {};
  for (const raw of String(body).split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([a-zA-Z0-9]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1]; const val = kv[2];
    const sl = /^step(\d+)Label$/.exec(key);
    const sq = /^step(\d+)Question$/.exec(key);
    const st = /^step(\d+)Tip$/.exec(key);
    if (sl) { const i = +sl[1]; stepsMap[i] = stepsMap[i] || {}; stepsMap[i].label = val; }
    else if (sq) { const i = +sq[1]; stepsMap[i] = stepsMap[i] || {}; stepsMap[i].question = val; }
    else if (st) { const i = +st[1]; stepsMap[i] = stepsMap[i] || {}; stepsMap[i].tip = val; }
    else flat[key] = val;
  }
  if (!flat.heading) return '';
  const indices = Object.keys(stepsMap).map(Number).sort((a, b) => a - b);
  const stepRows = indices.map((idx, i) => {
    const s = stepsMap[idx];
    if (!s.label || !s.question) return '';
    const isLast = i === indices.length - 1;
    const connector = isLast ? '' : '<div class="flex-1 border-l-2 border-l-repower-navy-900/30 mt-2 mb-0 min-h-[2rem]"></div>';
    const tip = s.tip
      ? `<div class="mt-2 flex items-start gap-2 bg-yellow-50 border-l-2 border-l-yellow-400 rounded-r-md px-3 py-2"><span aria-hidden="true" class="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600">&#128161;</span><p class="text-sm text-repower-navy-900/80 leading-relaxed m-0">${escHtml(s.tip)}</p></div>`
      : '';
    return `<div class="flex gap-4 md:gap-6"><div class="flex flex-col items-center"><div class="flex items-center justify-center h-10 w-10 rounded-full bg-mercury-red text-white font-display font-semibold text-base tabular-nums shadow-sm">${i + 1}</div>${connector}</div><div class="flex-1 pb-6 md:pb-8"><div class="font-display font-bold text-base text-repower-navy-900 tracking-tight text-balance">${escHtml(s.label)}</div><div class="mt-1.5 flex items-start gap-2 text-sm text-repower-navy-900"><span aria-hidden="true" class="h-4 w-4 mt-0.5 flex-shrink-0 text-repower-navy-900/60">?</span><span class="leading-snug">${escHtml(s.question)}</span></div>${tip}</div></div>`;
  }).join('');
  const eyebrow = flat.eyebrow ? `<div class="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">${escHtml(flat.eyebrow)}</div>` : '';
  const subhead = flat.subhead ? `<p class="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">${escHtml(flat.subhead)}</p>` : '';
  let escalation = '';
  if (flat.escalationBody) {
    const phoneMatch = flat.escalationBody.match(/(\+?\d[\d\s().-]{8,}\d)/);
    let bodyHtml;
    if (phoneMatch) {
      const raw = phoneMatch[1];
      const tel = raw.replace(/[^\d+]/g, '');
      const [before, after] = flat.escalationBody.split(raw);
      bodyHtml = `${escHtml(before)}<a href="tel:${escHtml(tel)}" class="font-display font-semibold text-base underline decoration-white/40 underline-offset-2 hover:decoration-white">${escHtml(raw)}</a>${escHtml(after || '')}`;
    } else {
      bodyHtml = escHtml(flat.escalationBody);
    }
    escalation = `<div class="bg-repower-navy-900 text-white border-t border-repower-navy-900/15 px-6 py-5 md:px-8"><div class="flex items-start gap-3"><span aria-label="Wrench" class="h-5 w-5 mt-0.5 flex-shrink-0 text-white">&#x1F527;</span><div>${flat.escalationLabel ? `<div class="font-display font-semibold text-sm text-white">${escHtml(flat.escalationLabel)}</div>` : ''}<p class="text-sm text-white/90 leading-relaxed mt-0.5">${bodyHtml}</p></div></div></div>`;
  }
  return `<div class="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden"><div class="px-6 pt-6 md:px-8 md:pt-8">${eyebrow}<h3 class="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">${escHtml(flat.heading)}</h3>${subhead}</div><div class="px-6 pt-4 pb-2 md:px-8 md:pt-6">${stepRows}</div>${escalation}</div>`;
}

function renderCostStackHtml(body) {
  const flat = {};
  const itemMap = {};
  for (const raw of String(body).split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([a-zA-Z0-9]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1]; const val = kv[2];
    const m = /^item(\d+)(Label|Value|Note|Accent)$/.exec(key);
    if (m) {
      const i = +m[1]; itemMap[i] = itemMap[i] || {};
      const f = m[2];
      if (f === 'Label') itemMap[i].label = val;
      else if (f === 'Value') itemMap[i].value = val;
      else if (f === 'Note') itemMap[i].note = val;
      else if (f === 'Accent') itemMap[i].accent = /^(true|yes|1)$/i.test(val);
    } else flat[key] = val;
  }
  if (!flat.heading) return '';
  const items = Object.keys(itemMap).map(Number).sort((a, b) => a - b)
    .map(i => itemMap[i]).filter(it => it.label && it.value);
  const eyebrow = flat.eyebrow ? `<div class="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">${escHtml(flat.eyebrow)}</div>` : '';
  const subhead = flat.subhead ? `<p class="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">${escHtml(flat.subhead)}</p>` : '';
  const rows = items.map((it, i) => {
    const dividerClass = i > 0 ? 'border-t border-border/40 pt-3 mt-3' : '';
    const rowAccent = it.accent ? 'bg-mercury-red/5 border-l-2 border-l-mercury-red' : '';
    const valueClass = it.accent ? 'text-mercury-red' : 'text-repower-navy-900';
    const note = it.note ? `<p class="italic text-muted-foreground text-xs px-1 m-0">${escHtml(it.note)}</p>` : '';
    return `<div class="flex flex-col gap-1 ${dividerClass}"><div class="flex items-center justify-between gap-4 rounded-md px-4 py-3 ${rowAccent}"><span class="font-display font-semibold text-repower-navy-900 text-sm md:text-base">${escHtml(it.label)}</span><span class="font-display font-bold text-sm md:text-base text-right tabular-nums ${valueClass}">${escHtml(it.value)}</span></div>${note}</div>`;
  }).join('');
  const total = (flat.totalLabel && flat.totalValue)
    ? `<div class="bg-repower-paper border-t-2 border-repower-navy-900/30 text-repower-navy-900 px-6 py-4 md:px-8 flex items-center justify-between gap-4"><span class="font-display font-bold text-lg tracking-tight">${escHtml(flat.totalLabel)}</span><span class="font-display font-bold text-xl text-right tabular-nums">${escHtml(flat.totalValue)}</span></div>`
    : '';
  const caveat = flat.caveat ? `<div class="border-t border-repower-navy-900/15 px-6 py-3 md:px-8 text-center italic text-muted-foreground text-xs">${escHtml(flat.caveat)}</div>` : '';
  return `<div class="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden"><div class="px-6 pt-6 md:px-8 md:pt-8">${eyebrow}<h3 class="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">${escHtml(flat.heading)}</h3>${subhead}</div><div class="px-6 py-6 md:px-8 md:py-8 flex flex-col">${rows}</div>${total}${caveat}</div>`;
}

function renderBilingualTrustHtml(body) {
  const flat = {};
  const itemMap = {};
  for (const raw of String(body).split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([a-zA-Z0-9]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1]; const val = kv[2];
    const m = /^item(\d+)(En|Zh)$/.exec(key);
    if (m) {
      const i = +m[1]; itemMap[i] = itemMap[i] || {};
      if (m[2] === 'En') itemMap[i].en = val; else itemMap[i].zh = val;
    } else flat[key] = val;
  }
  if (!flat.heading || !flat.headingTranslated) return '';
  const items = Object.keys(itemMap).map(Number).sort((a, b) => a - b)
    .map(i => itemMap[i]).filter(it => it.en && it.zh);
  const eyebrow = flat.eyebrow ? `<div class="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">${escHtml(flat.eyebrow)}</div>` : '';
  const tiles = items.map(it =>
    `<div class="rounded-lg bg-repower-navy-900/5 p-4 flex flex-col gap-1"><span class="font-display font-semibold text-repower-navy-900 text-sm">${escHtml(it.en)}</span><span class="font-sans text-repower-navy-900/70 text-sm" lang="zh-Hans">${escHtml(it.zh)}</span></div>`
  ).join('');
  const cta = (flat.ctaEn && flat.ctaZh && flat.ctaHref)
    ? `<a href="${escHtml(flat.ctaHref)}" class="block bg-repower-mercury-red text-white text-center px-6 py-4 md:px-8 hover:opacity-90 transition-opacity"><span class="block font-display font-bold text-base">${escHtml(flat.ctaEn)}</span><span class="block font-sans text-sm opacity-90 mt-0.5" lang="zh-Hans">${escHtml(flat.ctaZh)}</span></a>`
    : '';
  return `<div class="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden"><div class="px-6 pt-6 md:px-8 md:pt-8">${eyebrow}<h3 class="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">${escHtml(flat.heading)}</h3><p class="font-sans text-base text-muted-foreground leading-relaxed mt-1 mb-0" lang="zh-Hans">${escHtml(flat.headingTranslated)}</p></div><div class="px-6 py-6 md:px-8 md:py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">${tiles}</div>${cta}</div>`;
}

function renderPullQuoteHtml(body) {
  const lines = String(body).split('\n');
  const flat = {};
  let lastKey = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { lastKey = null; continue; }
    const kv = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(line);
    if (kv) { flat[kv[1]] = kv[2]; lastKey = kv[1]; }
    else if (lastKey && /^\s+/.test(raw)) {
      flat[lastKey] = (flat[lastKey] ? flat[lastKey] + ' ' : '') + line.trim();
    } else { lastKey = null; }
  }
  if (!flat.quote) return '';
  // Render inline **bold** as Mercury-red accent spans, escape the rest.
  const parts = flat.quote.split(/(\*\*[^*]+\*\*)/g);
  const quoteHtml = parts.map(p => {
    const m = /^\*\*([^*]+)\*\*$/.exec(p);
    if (m) return `<span class="text-mercury-red font-semibold">${escHtml(m[1])}</span>`;
    return escHtml(p);
  }).join('');
  const hasFooter = Boolean(flat.attribution || flat.source);
  const footer = hasFooter
    ? `<div class="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-repower-paper/70 font-medium"><span aria-hidden="true">&ndash;</span>${flat.attribution ? `<span>${escHtml(flat.attribution)}</span>` : ''}${flat.attribution && flat.source ? '<span aria-hidden="true">&ndash;</span>' : ''}${flat.source ? `<span>${escHtml(flat.source)}</span>` : ''}</div>`
    : '';
  return `<div class="my-8 w-full bg-repower-paper p-4 rounded-2xl shadow-sm border border-border/30"><div class="bg-repower-navy-900 text-repower-paper rounded-xl p-8 md:p-10 relative overflow-hidden"><span aria-hidden="true" class="absolute top-2 left-4 md:top-3 md:left-6 font-display text-mercury-red leading-none select-none pointer-events-none" style="font-size:6rem">&ldquo;</span><blockquote class="relative font-display text-2xl md:text-3xl leading-tight font-semibold text-balance text-repower-paper m-0 pt-8 md:pt-6">${quoteHtml}</blockquote>${footer}</div></div>`;
}

// Replace authoring directives (`::name ... ::`) with prerendered HTML
// matching the React component output, so crawlers see real markup.
function expandVisualDirectives(md) {
  // Use a placeholder marker so marked does not mangle the HTML afterward.
  // We will swap markers back to HTML after marked.parse runs.
  const slots = [];
  const sub = (re, renderer) =>
    md.replace(re, (_m, body) => {
      const html = renderer(body);
      if (!html) return '';
      slots.push(html);
      return `\n\n<!--PRERENDER_DIRECTIVE_${slots.length - 1}-->\n\n`;
    });
  md = sub(/^::decision-card\s*\n([\s\S]*?)\n::\s*$/gm, renderDecisionCardHtml);
  md = sub(/^::diagnostic-flow\s*\n([\s\S]*?)\n::\s*$/gm, renderDiagnosticFlowHtml);
  md = sub(/^::cost-stack\s*\n([\s\S]*?)\n::\s*$/gm, renderCostStackHtml);
  md = sub(/^::bilingual-trust\s*\n([\s\S]*?)\n::\s*$/gm, renderBilingualTrustHtml);
  md = sub(/^::pull-quote\s*\n([\s\S]*?)\n::\s*$/gm, renderPullQuoteHtml);
  // Bodiless directive: a single line `::walkaround-lead-capture`.
  md = sub(/^(::walkaround-lead-capture)\s*$/gm, renderWalkaroundLeadCaptureHtml);
  return { md, slots };
}

// Render an article's markdown body to HTML for the <noscript> fallback.
// Strips the leading H1 (the page already renders one), the author footer,
// and any custom :::directive::: blocks our renderer handles separately.
function renderArticleBodyHtml(content) {
  if (!content) return '';
  let s = String(content);
  // Drop leading H1, it duplicates the route H1 we inject in noscript.
  s = s.replace(/^\s*#\s+.+(?:\r?\n|$)/, '');
  // Strip author footer signature (handled by AuthorByline component in SPA).
  s = s.replace(/\n?-{3,}\s*\n+\s*\*?\*?By Jay Harris[\s\S]*$/i, '');
  s = s.replace(/\n+\s*\*\*By Jay Harris\*\*[\s\S]*$/i, '');
  s = s.replace(/\n+\s*By Jay Harris[\s\S]*$/i, '');
  // Expand visual directives (decision-card, diagnostic-flow, cost-stack,
  // bilingual-trust) into HTML matching the React components. Other
  // `:::name ... :::` directive blocks (image-placeholder, motor-pricing,
  // related-posts) are still stripped, the SPA renders them after hydration.
  const { md: expanded, slots } = expandVisualDirectives(s);
  s = expanded;
  s = s.replace(/^:::[a-zA-Z0-9_-]+[\s\S]*?^:::\s*$/gm, ' ');
  try {
    let html = marked.parse(s);
    // Restore prerendered directive HTML after marked runs.
    html = html.replace(/<!--PRERENDER_DIRECTIVE_(\d+)-->/g, (_m, i) => slots[Number(i)] || '');
    return html;
  } catch (err) {
    console.warn('[static-prerender] marked render failed:', err?.message);
    return '';
  }
}

function renderWalkaroundLeadCaptureHtml() {
  // Crawler-friendly fallback: simple heading + direct PDF download link.
  // The live React component progressively enhances over this after hydration.
  return `<div class="my-6 rounded-lg border border-repower-navy-900/15 bg-repower-paper p-6"><h3 class="m-0 mb-1 font-display text-xl font-bold text-repower-navy-900">Get the printable PDF</h3><p class="m-0 mb-4 font-sans text-sm text-repower-navy-900/75">Free 13-page inspection guide.</p><a href="/lovable-uploads/HBW-Used-Boat-Walkaround-Guide.pdf" download class="inline-block rounded bg-repower-navy-900 px-6 py-3 font-sans text-sm font-semibold text-white no-underline">Download the PDF</a></div>`;
}


const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');
const SHELL_PATH = join(DIST, 'index.html');
const SITE_URL = 'https://www.mercuryrepower.ca';
const MIN_BYTES = 4 * 1024;

const shellPath = (path) => JSON.stringify(path);

if (!existsSync(SHELL_PATH)) {
  console.error(`[static-prerender] FATAL: ${SHELL_PATH} not found, run vite build first`);
  process.exit(1);
}

const shell = readFileSync(SHELL_PATH, 'utf8');

// Load FAQ items via tsx subprocess (faqData.ts uses TS + lucide imports).
// We only need question/answer strings, stripped of HTML tags.
function loadFaqItems() {
  const dumpScript = `
    import { getAllFAQItems } from '../src/data/faqData.ts';
    const items = getAllFAQItems().map(i => ({
      question: i.question,
      answer: i.answer.replace(/<[^>]*>/g, '')
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.faq-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${shellPath(tmpFile)}`, { cwd: ROOT, encoding: 'utf8' });
    return JSON.parse(out);
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

// Load case studies (src/data/caseStudies.ts).
function loadCaseStudies() {
  const dumpScript = `
    import { caseStudies } from '../src/data/caseStudies.ts';
    process.stdout.write(JSON.stringify(caseStudies));
  `;
  const tmpFile = join(ROOT, 'scripts', '.casestudies-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${shellPath(tmpFile)}`, { cwd: ROOT, encoding: 'utf8' });
    return JSON.parse(out);
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

// Load location hub data (src/data/locations.ts).
function loadLocations() {
  const dumpScript = `
    import { locations } from '../src/data/locations.ts';
    process.stdout.write(JSON.stringify(locations));
  `;
  const tmpFile = join(ROOT, 'scripts', '.locations-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${shellPath(tmpFile)}`, { cwd: ROOT, encoding: 'utf8' });
    return JSON.parse(out);
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

// Load ALL blog articles (including future-dated/scheduled) for sitemap.
// Returns a minimal shape: slug, publishDate, datePublished, dateModified, image, title.
function loadAllBlogArticlesForSitemap() {
  const dumpScript = `
    import { getSitemapEligibleArticles } from '../src/data/blogArticles.ts';
    const items = getSitemapEligibleArticles().map(a => ({
      slug: a.slug,
      title: a.title,
      seoTitle: a.seoTitle,
      image: a.image,
      publishDate: a.publishDate || null,
      datePublished: a.datePublished || null,
      dateModified: a.dateModified || null,
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.blog-dump-all.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${shellPath(tmpFile)}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    return JSON.parse(out);
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

// Load ALL renderable blog articles for SSG.
//
// IMPORTANT: We pre-render every sitemap-eligible article: INCLUDING posts
// whose publishDate is in the future ("scheduled"). Returning 404 for
// scheduled posts hurts SEO (Google de-prioritizes the URL and may not
// re-crawl when the date arrives). The mental model: scheduled posts are
// "live but not yet promoted", they exist at their URL and can be cited
// by AI engines. The /blog index still uses getPublishedArticles() to hide
// them from listings until their publish date.
function loadBlogArticles() {
  const dumpScript = `
    import { getSitemapEligibleArticles, isArticlePublished } from '../src/data/blogArticles.ts';
    import { getCleanDescription, sanitizeForSchema, markdownToNoscriptHtml } from '../src/lib/strip-markdown.ts';
    const items = getSitemapEligibleArticles().map(a => ({
      slug: a.slug,
      title: a.title,
      seoTitle: a.seoTitle,
      description: getCleanDescription(a),
      image: a.image,
      datePublished: a.datePublished,
      dateModified: a.dateModified,
      publishDate: a.publishDate || a.datePublished || null,
      isPublished: isArticlePublished(a),
      keywords: a.keywords || [],
      readTime: a.readTime || '5 min read',
      content: a.content || '',
      faqs: (a.faqs || [])
        .map(f => ({
          question: sanitizeForSchema(f.question),
          answer: sanitizeForSchema(f.answer),
          questionHtml: markdownToNoscriptHtml(f.question),
          answerHtml: markdownToNoscriptHtml(f.answer),
        }))
        .filter(f => f.question && f.answer && !/^by jay harris/i.test(f.question)),
      howToSteps: (a.howToSteps || []).map(s => ({
        name: sanitizeForSchema(s.name),
        text: sanitizeForSchema(s.text),
        image: s.image || null,
      }))
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.blog-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${shellPath(tmpFile)}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(out);
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}


// Load active motor catalog. Primary source: public motors API (no auth, CORS-open,
// matches what AI agents see). Fallback: Supabase REST with publishable key.
// Returns records normalized to the same shape downstream code uses
// (model_key, model_display, model_number, family, horsepower, shaft_code,
//  start_type, control_type, msrp, sale_price, dealer_price, base_price,
//  manual_overrides, availability, in_stock, hero_image_url, image_url, updated_at).
async function loadMotors() {
  const API_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api';
  // 1) Try the public API first.
  try {
    const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      const motors = Array.isArray(json?.motors) ? json.motors : [];
      if (motors.length > 0) {
        console.log(`[static-prerender] loadMotors via public-motors-api → ${motors.length} motors`);
        // Normalize API records to the internal shape. The API already filters
        // out Verado, applies the price hierarchy, and provides slug.
        return motors.map(m => ({
          id: m.id,
          model_key: m.slug,                  // we use slug as the URL key
          model: 'Outboard',
          model_display: m.modelDisplay,
          model_number: m.modelNumber,
          mercury_model_no: m.modelNumber,
          family: m.family,
          horsepower: m.horsepower,
          shaft: m.shaftLength,
          shaft_code: m.shaftLength,
          start_type: null,
          control_type: m.controlType,
          msrp: m.msrp,
          sale_price: m.salePrice,
          dealer_price: m.dealerPrice,
          base_price: null,
          manual_overrides: {},
          // sellingPrice is already resolved by the API, preserve it via overrides
          // so resolveMotorSellingPrice picks it up first.
          _resolvedSellingPrice: m.sellingPrice,
          availability: m.availability,
          in_stock: !!m.inStock,
          hero_image_url: m.imageUrl,
          image_url: m.imageUrl,
          updated_at: json.lastUpdated || new Date().toISOString(),
        }));
      }
      console.warn('[static-prerender] public-motors-api returned 0 motors, falling back to Supabase');
    } else {
      console.warn(`[static-prerender] public-motors-api ${res.status} ${res.statusText}, falling back to Supabase`);
    }
  } catch (err) {
    console.warn('[static-prerender] public-motors-api error:', err.message, ' -  falling back to Supabase');
  }

  // 2) Fallback: Supabase REST. REQUIRE the publishable key here, fail loudly.
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eutsoqdpjurknjsshxes.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_KEY) {
    throw new Error(
      '[static-prerender] FATAL: public-motors-api unreachable AND no VITE_SUPABASE_PUBLISHABLE_KEY in build env. ' +
      'Refusing to ship a build with 0 /motors/{slug} pages. ' +
      'Add VITE_SUPABASE_PUBLISHABLE_KEY to Vercel env vars or fix the public-motors-api edge function.'
    );
  }
  const url = `${SUPABASE_URL}/rest/v1/motor_models?select=id,model_key,model,model_display,model_number,mercury_model_no,family,horsepower,shaft,shaft_code,start_type,control_type,msrp,sale_price,dealer_price,base_price,manual_overrides,availability,in_stock,hero_image_url,image_url,updated_at&model_key=not.is.null&availability=neq.Exclude&order=horsepower.asc&limit=500`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) {
    throw new Error(`[static-prerender] FATAL: Supabase fallback failed ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  console.log(`[static-prerender] loadMotors via Supabase fallback → ${data.length} motors`);
  return data;
}

const faqItems = loadFaqItems();
console.log(`[static-prerender] loaded ${faqItems.length} FAQ items`);

const blogArticles = loadBlogArticles();
console.log(`[static-prerender] loaded ${blogArticles.length} published blog articles`);

// Load translated blog article arrays. These files just export a plain
// `BlogArticle[]`, so we dump a minimal shape per article. Empty arrays are fine.
function loadTranslatedBlogArticles(modulePath, exportName) {
  const dumpScript = `
    import { ${exportName} } from '${modulePath}';
    import { getCleanDescription, sanitizeForSchema, markdownToNoscriptHtml } from '../src/lib/strip-markdown.ts';
    const items = (${exportName} || []).map(a => ({
      slug: a.slug,
      title: a.title,
      seoTitle: a.seoTitle,
      description: getCleanDescription(a),
      image: a.image,
      datePublished: a.datePublished,
      dateModified: a.dateModified,
      publishDate: a.publishDate || a.datePublished || null,
      keywords: a.keywords || [],
      readTime: a.readTime || '5 min read',
      content: a.content || '',
      faqs: (a.faqs || [])
        .map(f => ({
          question: sanitizeForSchema(f.question),
          answer: sanitizeForSchema(f.answer),
          questionHtml: markdownToNoscriptHtml(f.question),
          answerHtml: markdownToNoscriptHtml(f.answer),
        }))
        .filter(f => f.question && f.answer),
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', `.blog-dump-${exportName}.ts`);
  writeFileSync(tmpFile, dumpScript);
  // FAIL-LOUD: do NOT swallow errors. A silent return [] previously caused
  // the entire zh-CN sitemap to silently empty out without anyone noticing.
  // We'd rather a red Vercel deploy than a silent multilingual SEO blackout.
  try {
    const out = execSync(`npx vite-node ${shellPath(tmpFile)}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const parsed = JSON.parse(out);
    if (!Array.isArray(parsed)) {
      throw new Error(`[static-prerender] ${exportName} loader did not return an array`);
    }
    return parsed;
  } finally {
    try { rmSync(tmpFile); } catch {}
  }
}

// Sanity-check: if the source file on disk has any `slug:` entries but the
// loader returned 0, abort the build instead of silently emitting an empty
// translated sitemap section.
function assertLoaderNonEmpty(loaded, sourceRelativePath, exportName, langLabel) {
  const sourcePath = join(ROOT, sourceRelativePath.replace(/^\.\.\//, ''));
  let sourceHasEntries = false;
  try {
    const src = readFileSync(sourcePath, 'utf8');
    sourceHasEntries = /\bslug\s*:/.test(src);
  } catch {
    sourceHasEntries = false;
  }
  if (sourceHasEntries && loaded.length === 0) {
    throw new Error(
      `${langLabel} blog articles loader returned empty array but source file is non-empty — aborting prerender (${exportName} @ ${sourceRelativePath})`
    );
  }
}

const frenchBlogArticles = loadTranslatedBlogArticles('../src/data/frenchBlogArticles.ts', 'frenchBlogArticles');
const koreanBlogArticles = loadTranslatedBlogArticles('../src/data/koreanBlogArticles.ts', 'koreanBlogArticles');
const mandarinBlogArticles = loadTranslatedBlogArticles('../src/data/mandarinBlogArticles.ts', 'mandarinBlogArticles');
const spanishBlogArticles = loadTranslatedBlogArticles('../src/data/spanishBlogArticles.ts', 'spanishBlogArticles');

assertLoaderNonEmpty(frenchBlogArticles, '../src/data/frenchBlogArticles.ts', 'frenchBlogArticles', 'French');
assertLoaderNonEmpty(koreanBlogArticles, '../src/data/koreanBlogArticles.ts', 'koreanBlogArticles', 'Korean');
assertLoaderNonEmpty(mandarinBlogArticles, '../src/data/mandarinBlogArticles.ts', 'mandarinBlogArticles', 'Mandarin');
assertLoaderNonEmpty(spanishBlogArticles, '../src/data/spanishBlogArticles.ts', 'spanishBlogArticles', 'Spanish');

console.log(`[static-prerender] loaded ${frenchBlogArticles.length} fr-CA articles`);
console.log(`[static-prerender] loaded ${koreanBlogArticles.length} ko-KR articles`);
console.log(`[static-prerender] loaded ${mandarinBlogArticles.length} zh-CN articles`);
console.log(`[static-prerender] loaded ${spanishBlogArticles.length} es-ES articles`);


const caseStudies = loadCaseStudies();
console.log(`[static-prerender] loaded ${caseStudies.length} case studies`);

const locations = loadLocations();
console.log(`[static-prerender] loaded ${locations.length} location hubs`);

const motorRecords = await loadMotors();
console.log(`[static-prerender] loaded ${motorRecords.length} motor records for /motors/{slug}`);

// ============================================================
// Schema definitions, kept in sync with src/components/seo/*SEO.tsx
// ============================================================

function homepageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.mercuryrepower.ca/#website",
        "url": "https://www.mercuryrepower.ca/",
        "name": "Mercury Repower Quote Builder",
        "publisher": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "WebPage",
        "@id": "https://www.mercuryrepower.ca/#webpage",
        "url": "https://www.mercuryrepower.ca/",
        "name": "Mercury Repower Quotes Online: Real Prices, No Forms | Harris Boat Works",
        "description": "Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "primaryImageOfPage": { "@id": "https://www.mercuryrepower.ca/#logo" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://www.mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "legalName": "Harris Boat Works",
        "url": "https://www.harrisboatworks.ca/",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.mercuryrepower.ca/#logo",
          "url": "https://www.harrisboatworks.ca/logo.png",
          "caption": "Harris Boat Works"
        },
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina on Rice Lake, Ontario. Mercury Marine Platinum Dealer (since 1965) and Legend Boats dealer.",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://www.mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "priceRange": "$$",
        "parentOrganization": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 44.1147,
          "longitude": -78.2564
        },
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Rice Lake" },
          { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "makesOffer": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mercury outboard repower" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mercury & MerCruiser marine repair" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Winterization and spring launch" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Outdoor boat storage with professional shrinkwrap" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "New Legend boat sales" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Boat rentals" } }
        ],
        "brand": [
          { "@type": "Brand", "name": "Mercury Marine" },
          { "@type": "Brand", "name": "Legend Boats" }
        ],
        "award": "Mercury Marine Platinum Dealer"
      },
      {
        "@type": "Service",
        "@id": "https://www.mercuryrepower.ca/#quote-service",
        "name": "Mercury Outboard Online Quote Builder",
        "serviceType": "Online Motor Quote",
        "provider": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ]
      }
    ]
  };
}

function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://www.mercuryrepower.ca/about#webpage",
        "url": "https://www.mercuryrepower.ca/about",
        "name": "About Harris Boat Works",
        "description": "Family-owned Mercury dealer on Rice Lake, Ontario since 1947.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://www.mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.harrisboatworks.ca/logo.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Platinum Dealer. Authorized Legend Boats dealer.",
        "slogan": "Real prices. Family-owned. Since 1947.",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "award": [
          "Mercury Marine Platinum Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury outboard motors",
          "MerCruiser sterndrives",
          "Marine repower",
          "Boat winterization",
          "Boat storage",
          "Legend Boats"
        ],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      }
    ]
  };
}

function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://www.mercuryrepower.ca/contact#webpage",
        "url": "https://www.mercuryrepower.ca/contact",
        "name": "Contact Harris Boat Works",
        "description": "Mercury dealer on Rice Lake, phone (905) 342-2153, text (647) 952-2153, email info@harrisboatworks.ca.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA"
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://www.mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "priceRange": "$$",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 44.1147,
          "longitude": -78.2564
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "sales",
            "telephone": "+1-905-342-2153",
            "email": "info@harrisboatworks.ca",
            "areaServed": "CA",
            "availableLanguage": "English"
          },
          {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "telephone": "+1-647-952-2153",
            "contactOption": "TollFree",
            "areaServed": "CA",
            "availableLanguage": "English"
          }
        ],
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Rice Lake" },
          { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      }
    ]
  };
}

function repowerSchema() {
  const repowerQuestions = [
    'What does it mean to repower a boat?',
    'How much does a Mercury repower cost?',
    'How long does a Mercury repower take?',
    'Can I repower a pontoon boat?',
    'Is it worth repowering my boat or should I buy a new boat?',
  ];
  const items = repowerQuestions
    .map(q => faqItems.find(i => i.question === q))
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#business`,
        "name": "Harris Boat Works",
        "description": "Mercury Certified Repower Center serving Ontario boaters since 1947. Pickup only at Gores Landing.",
        "url": SITE_URL,
        "telephone": "(905) 342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 44.1147, "longitude": -78.2564 },
        "foundingDate": "1947",
        "priceRange": "$$"
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/repower#service`,
        "name": "Mercury Outboard Repower Service",
        "serviceType": "Boat Motor Replacement",
        "provider": { "@id": `${SITE_URL}/#business` },
        "areaServed": ["Rice Lake", "Kawarthas", "Peterborough", "GTA", "Toronto", "Ontario"],
        "description": "Professional Mercury outboard motor repower service. 70% of the benefit of a new boat for 30% of the cost.",
        "offers": {
          "@type": "Offer",
          "priceRange": "$8,000 - $18,000",
          "priceCurrency": "CAD"
        }
      },
      {
        "@type": "HowTo",
        "name": "The Harris Boat Works Repower Process",
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Consultation & Quote", "text": "We assess your boat and recommend the right Mercury motor" },
          { "@type": "HowToStep", "position": 2, "name": "Scheduling", "text": "Book your installation with the shortest wait times in the area" },
          { "@type": "HowToStep", "position": 3, "name": "Professional Installation", "text": "Mercury-certified technicians install your new motor in 1-2 days" },
          { "@type": "HowToStep", "position": 4, "name": "Lake Test", "text": "We lake test on Rice Lake and walk you through every feature" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": items.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/faq#faqpage`,
        "name": "Mercury Outboard Repower FAQ: Harris Boat Works",
        "url": `${SITE_URL}/faq`,
        "mainEntity": faqItems.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/faq#webpage`,
        "url": `${SITE_URL}/faq`,
        "name": "Mercury Outboard Repower FAQ | Harris Boat Works"
      }
    ]
  };
}

function motorSelectionPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/motor-selection#webpage`,
        "url": `${SITE_URL}/quote/motor-selection`,
        "name": "Mercury Outboard Motors for Sale Ontario | Build Your Quote | Harris Boat Works",
        "description": "Browse Mercury outboard motors from 2.5HP to 600HP. Configure your motor, compare options, and get instant CAD pricing online.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/motor-selection#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/quote/motor-selection#itemlist` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/motor-selection#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Quote Builder", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` }
        ]
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/quote/motor-selection#itemlist`,
        "name": "Mercury Outboard Motor Inventory",
        "description": "Complete selection of Mercury Marine outboard motors available at Harris Boat Works",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "Product",
              "name": "Mercury FourStroke Outboards",
              "description": "Fuel-efficient four-stroke outboard motors. Available from 2.5HP to 400HP.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 1500,
                "highPrice": 45000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "Product",
              "name": "Mercury Pro XS Outboards",
              "description": "High-performance outboard motors designed for bass boats and tournament fishing.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Performance Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 8000,
                "highPrice": 35000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@type": "Product",
              "name": "Mercury SeaPro Outboards",
              "description": "Commercial-grade outboard motors built for heavy-duty use and reliability.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Commercial Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 3500,
                "highPrice": 30000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@type": "Product",
              "name": "Mercury ProKicker Outboards",
              "description": "Dedicated trolling and kicker motors for fishing boats with high-thrust gearcase.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Kicker / Trolling Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 4500,
                "highPrice": 6500,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
              }
            }
          }
        ]
      }
    ]
  };
}

function boatInfoPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/boat-info#webpage`,
        "url": `${SITE_URL}/quote/boat-info`,
        "name": "Boat Information: Mercury Quote Builder | Harris Boat Works",
        "description": "Tell us about your boat so we can confirm motor compatibility, shaft length, controls, and rigging requirements for your Mercury outboard quote.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/boat-info#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/boat-info#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Boat Information", "item": `${SITE_URL}/quote/boat-info` }
        ]
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/quote/boat-info#howto`,
        "name": "Build a Mercury Outboard Quote at Harris Boat Works",
        "description": "Three-step online configurator for a real Mercury outboard quote with live CAD pricing.",
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Select your Mercury motor", "text": "Choose horsepower, shaft length, start type, and controls.", "url": `${SITE_URL}/quote/motor-selection` },
          { "@type": "HowToStep", "position": 2, "name": "Tell us about your boat", "text": "Provide boat make, model, length, current motor, and rigging details so we can confirm compatibility.", "url": `${SITE_URL}/quote/boat-info` },
          { "@type": "HowToStep", "position": 3, "name": "Review your quote", "text": "Get itemized CAD pricing, financing estimates, trade-in value, and active promotions.", "url": `${SITE_URL}/quote/summary` }
        ]
      }
    ]
  };
}

function quoteSummaryPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/summary#webpage`,
        "url": `${SITE_URL}/quote/summary`,
        "name": "Your Mercury Outboard Quote Estimate | Harris Boat Works",
        "description": "Itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and current promotional savings.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/summary#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/summary#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Boat Information", "item": `${SITE_URL}/quote/boat-info` },
          { "@type": "ListItem", "position": 4, "name": "Quote Summary", "item": `${SITE_URL}/quote/summary` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/quote/summary#estimate-service`,
        "name": "Mercury Outboard Quote Estimate",
        "serviceType": "Online Motor Quote Estimate",
        "provider": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "offers": {
          "@type": "Offer",
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
        }
      }
    ]
  };
}

function genericPageSchema(path, name, description) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    "url": `${SITE_URL}${path}`,
    "name": name,
    "description": description
  };
}

function agentsPageSchema() {
  const agentFaqs = [
    {
      q: "How do I query Harris Boat Works inventory as an AI agent?",
      a: "Use the MCP server at https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-mcp-server (JSON-RPC 2.0) and call the search_motors tool, or GET the public REST endpoint https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api for current Mercury inventory as JSON. Both return live CAD pricing and availability."
    },
    {
      q: "What MCP tools does Harris Boat Works expose?",
      a: "search_motors, get_motor, estimate_trade_in, build_quote, and get_brand_rules. The full manifest is at /.well-known/mcp.json."
    },
    {
      q: "What deep-link parameters does the quote form accept?",
      a: "Send users to https://www.mercuryrepower.ca/quote/motor-selection with optional query parameters motor, boat_make, boat_model, trade_brand, trade_year, and trade_hp. Example: /quote/motor-selection?motor={MOTOR_ID}&boat_make=Legend&boat_model=Pontoon&trade_hp=90. The configurator prefills whatever is supplied."
    },
    {
      q: "How does Harris Boat Works handle Mercury Verado inquiries?",
      a: "Mercury Verado is available by special order only and is not part of default listed inventory. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca rather than recommending Verado in standard quotes."
    },
    {
      q: "Where should agents pull hours, location, and contact information?",
      a: "Use the LocalBusiness JSON-LD on the homepage or /.well-known/brand.json. Do not guess, these are the source of truth."
    },
    {
      q: "Can agents quote non-Mercury outboards?",
      a: "No. Harris Boat Works is a Mercury Marine Platinum Dealer. Defer non-Mercury questions to the manufacturer."
    },
    {
      q: "Are there rate limits or required headers for agent traffic?",
      a: "No rate limits currently. Please identify your agent in the User-Agent header. All major LLM crawlers (GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Anthropic-AI, Applebot-Extended, Meta-ExternalAgent, Google-Extended, cohere-ai, Amazonbot) are allowed in /robots.txt."
    }
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/agents#webpage`,
        "url": `${SITE_URL}/agents`,
        "name": "AI Agent Integration: Harris Boat Works Mercury Dealer",
        "description": "Agent-friendly endpoints for AI assistants (ChatGPT, Claude, Perplexity, Gemini). MCP server, REST APIs, deep-link quote URLs, and source-of-truth rules for Harris Boat Works.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#localbusiness` },
        "publisher": { "@id": `${SITE_URL}/#organization` }
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/agents#faqpage`,
        "url": `${SITE_URL}/agents`,
        "mainEntity": agentFaqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      }
    ]
  };
}

// ============================================================
// Pilot SEO landing pages: Batch 1
// ============================================================

function mercuryRepowerFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-repower-faq#webpage`,
        "url": `${SITE_URL}/mercury-repower-faq`,
        "name": "Mercury Outboard Repower FAQ: Every Question Answered | Harris Boat Works",
        "description": "Comprehensive Mercury repower FAQ covering 20+ buying, financing, installation, and warranty questions. Mercury Marine Platinum Dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-repower-faq#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-repower-faq#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-repower-faq#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Repower FAQ", "item": `${SITE_URL}/mercury-repower-faq` }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-repower-faq#faqpage`,
        "name": "Mercury Outboard Repower FAQ",
        "url": `${SITE_URL}/mercury-repower-faq`,
        "mainEntity": faqItems.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

const HOWTO_FAQ_PRERENDER = [
  {
    question: "How long does the full repower process take?",
    answer: "From quote to keys-in-hand, most repowers take two to four weeks. The actual install is one to three days once your boat is on site. Spring (March–May) is busiest, book in fall or winter for priority scheduling."
  },
  {
    question: "Do I need to bring my boat for the consultation?",
    answer: "No. Start by building a real quote at mercuryrepower.ca, or call us at (905) 342-2153. We can confirm motor fit from your boat's make, model, year, transom height, and capacity plate. The boat only needs to come in for the actual install."
  },
  {
    question: "Can I supply my own motor for installation?",
    answer: "We install motors purchased from Harris Boat Works only. This protects your warranty (we register it directly with Mercury) and lets us guarantee the rigging, controls, and lake-test as one complete package."
  },
  {
    question: "What if my old motor is not a Mercury?",
    answer: "We repower all brands to Mercury: Yamaha, Honda, Suzuki, Johnson, Evinrude, Tohatsu. Full controls, rigging, and gauge changeover is included so the new Mercury runs correctly. Your old motor can be traded in or disposed of through us."
  },
  {
    question: "How do I pay the deposit and final balance?",
    answer: "Deposit is paid online when you build the quote, between $200 and $1,000 depending on motor HP, fully refundable on stock motors. Final balance is due at pickup. We accept e-transfer, debit, credit card, certified cheque, and dealer financing."
  }
];

function howToRepowerSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/how-to-repower-a-boat#webpage`,
        "url": `${SITE_URL}/how-to-repower-a-boat`,
        "name": "How to Repower a Boat, 7-Step Mercury Repower Process | Harris Boat Works",
        "description": "Step-by-step guide to repowering a boat with a new Mercury outboard: quote, sizing, deposit, scheduling, install, lake-test, and pickup.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/how-to-repower-a-boat#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/how-to-repower-a-boat#howto` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/how-to-repower-a-boat#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "How to Repower a Boat", "item": `${SITE_URL}/how-to-repower-a-boat` }
        ]
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/how-to-repower-a-boat#howto`,
        "name": "How to Repower a Boat with a New Mercury Outboard",
        "description": "The seven-step Harris Boat Works Mercury repower process, from online quote to lake-tested pickup at Gores Landing on Rice Lake.",
        "totalTime": "P21D",
        "estimatedCost": { "@type": "MonetaryAmount", "currency": "CAD", "value": "12000" },
        "supply": [
          { "@type": "HowToSupply", "name": "Boat capacity plate (transom HP rating)" },
          { "@type": "HowToSupply", "name": "Boat make, model, and year" },
          { "@type": "HowToSupply", "name": "Transom height measurement" },
          { "@type": "HowToSupply", "name": "Photo ID for motor pickup" }
        ],
        "tool": [
          { "@type": "HowToTool", "name": "Online quote builder at mercuryrepower.ca" }
        ],
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Build Your Quote Online", "text": "Use the configurator at mercuryrepower.ca to choose your Mercury motor (FourStroke, Pro XS, SeaPro, or ProKicker), shaft length, and controls. You'll see live CAD pricing, financing estimates, and any active promotions instantly, no forms, no waiting.", "url": `${SITE_URL}/quote/motor-selection` },
          { "@type": "HowToStep", "position": 2, "name": "Confirm Motor & Shaft Fit", "text": "Tell us your boat's make, model, transom height, and capacity plate HP rating. We'll confirm the right Mercury HP, shaft length (15\", 20\", or 25\"), and whether you need Command Thrust for a pontoon or heavy hull." },
          { "@type": "HowToStep", "position": 3, "name": "Place Your Deposit", "text": "Secure your motor with a refundable deposit ($200–$1,000 depending on HP) paid online. This locks in the price, holds your spot in the install queue, and starts the order if the motor isn't already in stock." },
          { "@type": "HowToStep", "position": 4, "name": "Schedule the Install", "text": "Book your drop-off date at Harris Boat Works in Gores Landing on Rice Lake. Most installs are 1–3 days. Submit a service request at hbw.wiki/service or call (905) 342-2153." },
          { "@type": "HowToStep", "position": 5, "name": "Professional Install & Rigging", "text": "Our Mercury-certified technicians remove your old motor, install the new Mercury, and replace throttle, shift, steering, fuel lines, and gauges as needed. Full rigging is included in every repower package, no surprise add-ons." },
          { "@type": "HowToStep", "position": 6, "name": "Lake Test on Rice Lake", "text": "Every repower is lake-tested on Rice Lake before pickup. We confirm WOT RPM, prop pitch, idle, shifting, and trim. If anything's off, we adjust before you ever see the bill." },
          { "@type": "HowToStep", "position": 7, "name": "Pickup & Walk-Through", "text": "Pickup is by appointment at Gores Landing, about 20–30 minutes. Bring photo ID and your purchase order. We register the warranty, walk you through controls and break-in, and you're on the water. Pickup only, no shipping." }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/how-to-repower-a-boat#faqpage`,
        "mainEntity": HOWTO_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

const TRUST_FAQ_PRERENDER = [
  { question: "Is Harris Boat Works an authorized Mercury Marine dealer?", answer: "Yes. Harris Boat Works has been an authorized Mercury Marine dealer since 1965, over 60 years. We currently hold Mercury Marine Platinum Dealer status, the highest tier in Mercury's North American dealer program, awarded for sales volume, technician certification, and customer service." },
  { question: "What does Mercury Platinum Dealer status mean?", answer: "Platinum is Mercury Marine's top dealer rating in North America. It requires Mercury-certified technicians, a minimum sales and service volume, full warranty registration capability, and consistently high CSI (Customer Satisfaction Index) scores. Only a small percentage of Mercury dealers reach Platinum, and re-qualification is required every year." },
  { question: "How long has Harris Boat Works been in business?", answer: "The Harris family founded the boat works in 1947 on Rice Lake in Gores Landing, Ontario. We're now a third-generation, family-owned marina with 79 years of continuous operation. Mercury dealer since 1965." },
  { question: "Where is Harris Boat Works located?", answer: "5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0, on the south shore of Rice Lake. About 35 minutes from Peterborough, 20 minutes from Cobourg, 90 minutes from Toronto, and within 200 km of the entire GTA, Kawarthas, and Northumberland County." },
  { question: "Do you sell motors to customers across Canada?", answer: "Yes, we sell to customers across Ontario and beyond. However, all motors are pickup only at our Gores Landing location. We do not ship outboards. This is intentional: every motor includes a personal walk-through covering controls, break-in procedure, and warranty registration. That hand-off is part of why we hold Platinum Dealer status." },
  { question: "What Mercury motor lines do you carry?", answer: "We carry the full Mercury outboard lineup: portable FourStroke (2.5–20hp), mid-range FourStroke (25–115hp), Command Thrust (40–150hp for pontoons and heavy hulls), Pro XS performance (115–300hp), SeaPro commercial-duty, ProKicker trolling motors (9.9hp/15hp), and FourStroke V8 (250–300hp). We also stock genuine Mercury parts, oils, and accessories." },
  { question: "Are your prices in Canadian dollars?", answer: "Yes, all pricing on mercuryrepower.ca is in Canadian dollars (CAD), all-in. The price you see is the price you pay (plus HST). No US-dollar conversions, no hidden fees, no \"call for price\" games." },
  { question: "Do you offer Mercury financing?", answer: "Yes, financing is available on Mercury motor purchases through DealerPlan and other lenders. The configurator at mercuryrepower.ca shows monthly payment estimates (8.99% under $10K total / 7.99% over $10K total) alongside the purchase price. Minimum financed amount is $5,000." },
  { question: "What warranty comes with a new Mercury outboard?", answer: "Every new Mercury outboard comes with a 3-year limited factory warranty as standard. Right now, when you buy from Harris Boat Works, you get 7 years of full Mercury factory-backed coverage, no third-party insurance, just straight Mercury protection. We register the warranty directly with Mercury Marine at the time of pickup." },
  { question: "Are Mercury motors made in Canada?", answer: "Mercury Marine is headquartered in Fond du Lac, Wisconsin, USA, where most outboard motors are manufactured. Mercury has been building outboards since 1939 and is one of the largest marine engine manufacturers in the world. Harris Boat Works has been the authorized Canadian Mercury dealer for the Rice Lake / Kawartha region since 1965." },
  { question: "Do you service motors purchased elsewhere?", answer: "Yes, our Mercury-certified service department works on Mercury and MerCruiser motors regardless of where they were purchased. We handle warranty work, repower, winterization, spring launch, and routine maintenance. Submit a service request at hbw.wiki/service or call (905) 342-2153." },
  { question: "Why buy from Harris Boat Works instead of a big-box marine retailer?", answer: "Three reasons: (1) Platinum Dealer status means our technicians, parts inventory, and warranty access are at the highest Mercury tier. (2) Family-owned since 1947, we answer the phone, we know our customers, and the same people sell, install, and service the motor. (3) Real online pricing with live CAD quotes, no \"call for price\" runaround. What you see at mercuryrepower.ca is what you pay." }
];

function mercuryDealerCanadaSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#webpage`,
        "url": `${SITE_URL}/mercury-dealer-canada-faq`,
        "name": "Why Buy from Harris Boat Works: Mercury Dealer Canada FAQ | Family-Owned Since 1947",
        "description": "Trust questions about Harris Boat Works: Mercury Platinum Dealer status, family ownership since 1947, dealer since 1965, warranty, financing, Canadian pricing, full Mercury lineup.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-canada-faq#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-canada-faq#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer Canada FAQ", "item": `${SITE_URL}/mercury-dealer-canada-faq` }
        ]
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.harrisboatworks.ca/logo.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Platinum Dealer.",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "award": ["Mercury Marine Platinum Dealer", "Authorized Legend Boats Dealer"],
        "knowsAbout": ["Mercury outboard motors", "MerCruiser sterndrives", "Marine repower", "Boat winterization", "Boat storage"],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#faqpage`,
        "mainEntity": TRUST_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Batch 2: Geo landing pages (Peterborough, Cobourg, GTA)
// ============================================================

const PETERBOROUGH_FAQ_PRERENDER = [
  { question: "Is there a Mercury dealer near Peterborough, Ontario?", answer: "Yes: Harris Boat Works is the closest Mercury Marine Platinum Dealer to Peterborough, located about 35 minutes south on Rice Lake at 5369 Harris Boat Works Rd, Gores Landing, ON. Mercury dealer since 1965, family-owned since 1947." },
  { question: "Do you serve Peterborough customers for Mercury repower and service?", answer: "Yes. We regularly repower boats from Peterborough, Lakefield, Bridgenorth, Buckhorn, and the wider Kawartha Lakes region. Customers tow boats down to Gores Landing, or pick up loose motors for self-installation. Pickup only, no delivery or shipping." },
  { question: "How far is Harris Boat Works from downtown Peterborough?", answer: "About 35 minutes (45 km) via County Rd 28 south to Gores Landing on the south shore of Rice Lake. Easy run for Peterborough, Trent University, and Lakefield-area boaters." },
  { question: "Can I get Mercury financing as a Peterborough customer?", answer: "Yes: Mercury financing through DealerPlan is available to all Ontario residents. Build a quote at mercuryrepower.ca to see live monthly payment estimates (8.99% under $10K total / 7.99% over $10K), then complete the financing application online. Minimum financed amount $5,000." },
  { question: "What Mercury motors do you stock for Peterborough-area boaters?", answer: "The full Mercury outboard lineup: portable FourStroke (2.5–20hp), mid-range FourStroke (25–115hp), Command Thrust (40–150hp for pontoons), Pro XS performance (115–300hp), SeaPro commercial, ProKicker trolling motors (9.9hp/15hp), and FourStroke V8 (250–300hp). Live inventory and CAD pricing at mercuryrepower.ca." }
];

const COBOURG_FAQ_PRERENDER = [
  { question: "Where can I buy a Mercury outboard near Cobourg, Ontario?", answer: "Harris Boat Works in Gores Landing, about 20 minutes north of Cobourg on Rice Lake, is the closest Mercury Marine Platinum Dealer. Mercury dealer since 1965, family-owned since 1947. Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0." },
  { question: "How far is Harris Boat Works from Cobourg?", answer: "About 20 minutes (25 km) north via County Rd 18 to Gores Landing on the south shore of Rice Lake. Convenient for Cobourg, Port Hope, Grafton, and Northumberland County boaters." },
  { question: "Do you serve Northumberland County for Mercury repower?", answer: "Yes, we regularly repower boats from Cobourg, Port Hope, Grafton, Brighton, and the wider Northumberland region. Bring your boat down for full installation, or pick up a loose Mercury for self-install. Pickup only at Gores Landing." },
  { question: "Can I get a Mercury quote online from Cobourg?", answer: "Yes, build a real Mercury outboard quote in three minutes at mercuryrepower.ca. Live CAD pricing, financing estimates, and trade-in valuations. No phone calls or forms needed to see the price." },
  { question: "What about Lake Ontario boaters out of Cobourg Harbour?", answer: "We work with Cobourg Harbour and Port Hope Harbour boaters on Mercury repowers and service for Lake Ontario use. Mercury Pro XS, FourStroke V8, and SeaPro models are common for the bigger water, talk to us about HP and shaft length for your specific hull." }
];

const GTA_FAQ_PRERENDER = [
  { question: "Is there a Mercury dealer that serves the GTA?", answer: "Harris Boat Works on Rice Lake serves GTA boaters from across the Greater Toronto Area. We're 90 minutes east of Toronto via Highway 401, closer than most GTA boaters realize for a Mercury Marine Platinum Dealer. Family-owned since 1947, Mercury dealer since 1965." },
  { question: "How do GTA customers handle pickup?", answer: "Two ways: bring your boat down to Gores Landing for full installation, or pick up a loose Mercury motor and install it yourself (or with your local mechanic). We do not ship motors and we do not deliver, pickup only at our Rice Lake location, which keeps pricing transparent and warranty registration clean." },
  { question: "Is it worth driving from Toronto for a Mercury outboard?", answer: "GTA boaters tell us yes, for three reasons. (1) Real CAD pricing online with no \"call for price\" runaround. (2) Mercury Platinum Dealer status (top tier in North America). (3) Family-owned, so the same people quote, install, and service the motor. Combined with a one-hour easy run on the 401, the math usually works out better than buying in the GTA." },
  { question: "Do you handle Lake Simcoe and Lake Scugog Mercury repowers?", answer: "Yes: Lake Simcoe (Barrie, Orillia, Innisfil), Lake Scugog (Port Perry), and the Trent-Severn Waterway are core Mercury repower markets for us. Common configurations: Pro XS 150–250 for performance hulls, FourStroke 90–150 with Command Thrust for pontoons, FourStroke V8 250–300 for larger Lake Simcoe boats." },
  { question: "How long does a GTA Mercury repower take?", answer: "Typical timeline once you've picked the motor: 1–3 weeks for in-stock motors (longer for special orders), about 1 day in the shop for the install, then a lake-test before pickup. Plan one trip down for drop-off and one for pickup, or one trip total if you're picking up a loose motor for self-install." }
];

function geoServicePageSchema({ slug, name, description, areaName, areaLocality, faqArr }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}${slug}#webpage`,
        "url": `${SITE_URL}${slug}`,
        "name": name,
        "description": description,
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}${slug}#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}${slug}#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}${slug}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": areaName, "item": `${SITE_URL}${slug}` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}${slug}#service`,
        "name": `Mercury Outboard Sales & Repower - ${areaName}`,
        "description": description,
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": {
          "@type": "Place",
          "name": areaName,
          "address": { "@type": "PostalAddress", "addressLocality": areaLocality, "addressRegion": "ON", "addressCountry": "CA" }
        },
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}${slug}`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}${slug}#faqpage`,
        "mainEntity": faqArr.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

function mercuryDealerPeterboroughSchema() {
  return geoServicePageSchema({
    slug: '/mercury-dealer-peterborough',
    name: 'Mercury Dealer Peterborough Ontario | Harris Boat Works, 35 Min South',
    description: 'Mercury Marine Platinum Dealer 35 minutes from Peterborough on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Repower, sales, parts, service for Peterborough and Kawartha Lakes boaters.',
    areaName: 'Peterborough, Ontario',
    areaLocality: 'Peterborough',
    faqArr: PETERBOROUGH_FAQ_PRERENDER
  });
}

function mercuryDealerCobourgSchema() {
  return geoServicePageSchema({
    slug: '/mercury-dealer-cobourg',
    name: 'Mercury Dealer Cobourg Ontario | Harris Boat Works, 20 Min North',
    description: 'Mercury Marine Platinum Dealer 20 minutes north of Cobourg on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Sales, repower, and service for Cobourg, Port Hope, and Northumberland County.',
    areaName: 'Cobourg, Ontario',
    areaLocality: 'Cobourg',
    faqArr: COBOURG_FAQ_PRERENDER
  });
}

function mercuryDealerGTASchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-gta#webpage`,
        "url": `${SITE_URL}/mercury-dealer-gta`,
        "name": "Mercury Dealer for the GTA | Harris Boat Works, 90 Min East of Toronto",
        "description": "Mercury Marine Platinum Dealer 90 minutes east of Toronto on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving GTA, Lake Simcoe, and Lake Scugog Mercury repowers.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-gta#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-gta#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-gta#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer GTA", "item": `${SITE_URL}/mercury-dealer-gta` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-dealer-gta#service`,
        "name": "Mercury Outboard Sales & Repower: GTA",
        "description": "Mercury outboard sales, repower, and service for the Greater Toronto Area, Lake Simcoe, Lake Scugog, and the Trent-Severn Waterway. Bring boat for install or pick up loose motor for self-install. Pickup only at Gores Landing.",
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": [
          { "@type": "Place", "name": "Greater Toronto Area", "address": { "@type": "PostalAddress", "addressLocality": "Toronto", "addressRegion": "ON", "addressCountry": "CA" } },
          { "@type": "Place", "name": "Lake Simcoe", "address": { "@type": "PostalAddress", "addressLocality": "Barrie", "addressRegion": "ON", "addressCountry": "CA" } },
          { "@type": "Place", "name": "Lake Scugog", "address": { "@type": "PostalAddress", "addressLocality": "Port Perry", "addressRegion": "ON", "addressCountry": "CA" } }
        ],
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}/mercury-dealer-gta`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-gta#faqpage`,
        "mainEntity": GTA_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Batch 3: Product hub + Ontario lineup
// ============================================================

const PRO_XS_STATIC_OFFERS_PRERENDER = [
  { hp: 115, name: 'Mercury 115 Pro XS', startingAt: 14450, image: `${SITE_URL}/images/seo/proxs-115.webp` },
  { hp: 150, name: 'Mercury 150 Pro XS', startingAt: 18300, image: `${SITE_URL}/images/seo/proxs-150.jpg` },
  { hp: 200, name: 'Mercury 200 Pro XS', startingAt: 23800, image: `${SITE_URL}/images/seo/proxs-200.jpg` },
  { hp: 250, name: 'Mercury 250 Pro XS', startingAt: 29300, image: `${SITE_URL}/images/seo/proxs-250.jpeg` },
];

const PRO_XS_FAQ_PRERENDER = [
  { question: "What is a Mercury Pro XS outboard?", answer: "Pro XS is Mercury Marine's high-performance FourStroke outboard line, engineered for tournament-grade acceleration, top speed, and hole-shot. Pro XS models are tuned more aggressively than standard FourStroke motors and ship with performance prop pitches, premium gearcases, and enhanced engine calibration. Available 115 to 300 HP." },
  { question: "What HP Pro XS models does Harris Boat Works carry?", answer: "We stock the full Pro XS lineup in CAD pricing: 115 HP (ELPT and EXLPT), 150 HP (ELPT and EXLPT), 200 HP (ELPT), and 250 HP (ELPT). All in stock, real prices online. Mercury Platinum Dealer, full warranty registration at pickup." },
  { question: "Pro XS vs FourStroke, which should I buy?", answer: "Pro XS for performance: tournament bass, fast bowriders, ski/wake boats, and anyone chasing top-end speed and hole-shot. Standard FourStroke for cruising, fishing, pontoons, and fuel economy. Same Mercury reliability, different tuning. We can walk you through the right choice for your hull at (905) 342-2153 or via the configurator." },
  { question: "Are Pro XS prices in Canadian dollars?", answer: "Yes, every price on mercuryrepower.ca is in CAD, all-in (plus HST). No US conversions, no \"call for price\" games. The configurator shows real out-the-door pricing including standard rigging." },
  { question: "What's the warranty on a new Pro XS?", answer: "Standard Mercury warranty is 3 years. Right now Harris Boat Works includes 7 years of full Mercury factory-backed coverage on new Pro XS purchases, straight from Mercury Marine, not third-party insurance. We register the warranty at pickup." },
  { question: "Can I finance a Pro XS purchase?", answer: "Yes, financing is available through DealerPlan and other lenders. Estimated monthly payments are shown alongside each motor at mercuryrepower.ca (8.99% under $10K total / 7.99% over $10K total). Minimum financed amount is $5,000." },
  { question: "How do I take delivery of a Pro XS from Harris Boat Works?", answer: "Pickup only at our Gores Landing location on Rice Lake. Two paths: (1) bring your boat for full installation including controls, prop, and lake test, or (2) pick up the loose motor for self-install. We do not ship motors. Pickup ensures every customer gets a personal walk-through and clean Mercury warranty registration." },
  { question: "Where can I see current Pro XS inventory and pricing?", answer: "Build a quote at mercuryrepower.ca/quote/motor-selection, filter by Pro XS family. Live CAD pricing, in-stock indicators, and monthly payment estimates update directly from our inventory." }
];

const ONTARIO_HUB_FAQ_PRERENDER = [
  { question: "Where can I buy Mercury outboards in Ontario?", answer: "Harris Boat Works is a Mercury Marine Platinum Dealer on Rice Lake in Gores Landing, Ontario, family-owned since 1947, Mercury dealer since 1965. We carry the full Mercury outboard lineup with real CAD pricing online: portable FourStroke 2.5–20 HP, mid-range FourStroke 25–115 HP, Pro XS 115–250 HP, Command Thrust, SeaPro commercial, ProKicker trolling motors, and FourStroke V8 250–300 HP. Build a quote at mercuryrepower.ca/quote/motor-selection." },
  { question: "What Mercury motor lines are sold at Harris Boat Works?", answer: "Full lineup: portable FourStroke (2.5–20 HP) for tenders and small tillers, mid-range FourStroke (25–115 HP) for fishing and pontoon, Pro XS (115–250 HP) for performance and tournament use, Command Thrust (40–150 HP) for heavy hulls and pontoons, SeaPro for commercial duty, ProKicker (9.9 / 15 HP) for trolling, and FourStroke V8 (250–300 HP) for offshore and bowriders. Mercury Verado is available by special order only, contact us directly for a Verado quote." },
  { question: "Is Harris Boat Works a Mercury Platinum dealer?", answer: "Yes. Mercury Marine Platinum Dealer status: Mercury's top dealer tier in North America. Awarded for sales volume, technician certification, warranty CSI scores, and parts availability. Re-qualified annually." },
  { question: "What areas of Ontario does Harris Boat Works serve?", answer: "Our location at Gores Landing on Rice Lake (Northumberland County) puts us within easy reach of Peterborough (35 min), Cobourg (20 min), Port Hope, the Kawartha Lakes, the Trent-Severn Waterway, and the Greater Toronto Area (90 min via 401). Customers come from across Ontario including Lake Simcoe, Lake Scugog, Bay of Quinte, and the GTA. Pickup only at our Gores Landing location." },
  { question: "Are Mercury outboard prices in Canadian dollars?", answer: "Yes, every price on mercuryrepower.ca is in CAD, all-in (plus HST). No US conversions, no hidden fees, no \"call for price\" games. The configurator shows live pricing direct from inventory plus financing payment estimates." },
  { question: "Can I finance a Mercury outboard purchase?", answer: "Yes. Financing is available through DealerPlan and other lenders on purchases of $5,000 or more. Monthly payment estimates appear next to every qualifying motor (8.99% under $10K total / 7.99% over $10K total). Apply online at mercuryrepower.ca/financing-application." },
  { question: "What warranty comes with a new Mercury motor?", answer: "Standard Mercury Marine factory warranty is 3 years. Right now, Harris Boat Works includes 7 years of full Mercury factory-backed coverage on new outboard purchases, direct from Mercury, not third-party insurance. We register every warranty at pickup." },
  { question: "Do you ship Mercury motors across Ontario?", answer: "No, pickup only at our Gores Landing location on Rice Lake. This is intentional. Every motor includes a personal walk-through (controls, break-in, warranty registration) and we hold Platinum status partly because of that hand-off. Bring your boat for install, or pick up a loose motor for self-install." },
  { question: "Do you take trade-ins on Mercury outboard purchases?", answer: "Yes. We accept trade-ins on Mercury and most other outboard brands. Get an instant trade-in estimate at mercuryrepower.ca/trade-in-value, values are anchored to our actual selling prices, not blue-book guesses. Trade credit applies directly to the new motor quote." },
  { question: "Is Harris Boat Works near me?", answer: "If you're in Ontario, probably yes. Travel times: Peterborough 35 min, Cobourg 20 min, Port Hope 25 min, Lindsay 50 min, Bowmanville 45 min, Oshawa 55 min, Port Perry 50 min, downtown Toronto 90 min via 401. We also serve Northumberland County, Hastings County, the Kawarthas, and the GTA. Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0." }
];

function mercuryProXSSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-pro-xs#webpage`,
        "url": `${SITE_URL}/mercury-pro-xs`,
        "name": "Mercury Pro XS Outboards in Ontario | 115–250 HP, Real CAD Pricing | Harris Boat Works",
        "description": "Mercury Pro XS performance outboards 115–250 HP in stock at Harris Boat Works. Real CAD pricing, 7-year warranty, financing. Mercury Platinum Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-pro-xs#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-pro-xs#productgroup` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-pro-xs#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Pro XS", "item": `${SITE_URL}/mercury-pro-xs` }
        ]
      },
      {
        "@type": "ProductGroup",
        "@id": `${SITE_URL}/mercury-pro-xs#productgroup`,
        "name": "Mercury Pro XS Outboard Series",
        "description": "Mercury Pro XS high-performance FourStroke outboard motors, 115–250 HP, available at Harris Boat Works (Mercury Platinum Dealer, Ontario).",
        "brand": { "@type": "Brand", "name": "Mercury Marine" },
        "url": `${SITE_URL}/mercury-pro-xs`,
        "variesBy": ["horsepower"],
        "hasVariant": PRO_XS_STATIC_OFFERS_PRERENDER.map(v => ({
          "@type": "Product",
          "name": v.name,
          "image": v.image,
          "brand": { "@type": "Brand", "name": "Mercury Marine" },
          "category": "Outboard Motor",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "CAD",
            "price": v.startingAt,
            "availability": "https://schema.org/InStock",
            "seller": { "@id": `${SITE_URL}/#organization` },
            "url": `${SITE_URL}/quote/motor-selection`
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-pro-xs#faqpage`,
        "mainEntity": PRO_XS_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

function mercuryOutboardsOntarioSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-outboards-ontario#webpage`,
        "url": `${SITE_URL}/mercury-outboards-ontario`,
        "name": "Mercury Outboards Ontario: Full Lineup at Harris Boat Works | Platinum Dealer Since 1965",
        "description": "Mercury Marine outboards in Ontario, full lineup (portable, FourStroke, Pro XS, Command Thrust, SeaPro, ProKicker, V8). Real CAD pricing online. Mercury Platinum Dealer on Rice Lake, family-owned since 1947.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-outboards-ontario#localbusiness` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards Ontario", "item": `${SITE_URL}/mercury-outboards-ontario` }
        ]
      },
      {
        "@type": ["LocalBusiness", "AutomotiveBusiness"],
        "@id": `${SITE_URL}/mercury-outboards-ontario#localbusiness`,
        "name": "Harris Boat Works: Mercury Platinum Dealer",
        "description": "Mercury Marine Platinum Dealer serving Ontario. Full Mercury outboard lineup, real CAD pricing online, repower specialists. Family-owned since 1947, Mercury dealer since 1965.",
        "url": `${SITE_URL}/mercury-outboards-ontario`,
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "image": `${SITE_URL}/lovable-uploads/logo-dark.png`,
        "priceRange": "$$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 44.1147, "longitude": -78.2564 },
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Ontario, Canada" },
          { "@type": "Place", "name": "Greater Toronto Area" },
          { "@type": "Place", "name": "Peterborough, Ontario" },
          { "@type": "Place", "name": "Cobourg, Ontario" },
          { "@type": "Place", "name": "Kawartha Lakes" },
          { "@type": "Place", "name": "Northumberland County" },
          { "@type": "Place", "name": "Trent-Severn Waterway" },
          { "@type": "Place", "name": "Lake Simcoe" },
          { "@type": "Place", "name": "Lake Scugog" },
          { "@type": "Place", "name": "Rice Lake" }
        ],
        "award": [
          "Mercury Marine Platinum Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury FourStroke outboards",
          "Mercury Pro XS outboards",
          "Mercury Command Thrust",
          "Mercury SeaPro commercial outboards",
          "Mercury ProKicker trolling motors",
          "Mercury FourStroke V8",
          "Marine repower"
        ],
        "makesOffer": [
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Portable FourStroke 2.5–20 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Mid-Range FourStroke 25–115 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Pro XS 115–250 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Command Thrust 40–150 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury SeaPro Commercial Outboards" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury ProKicker 9.9 / 15 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury FourStroke V8 250–300 HP" } }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-outboards-ontario#faqpage`,
        "mainEntity": ONTARIO_HUB_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Batch 4: Pontoon outboards
// ============================================================

const PONTOON_FAQ_PRERENDER = [
  { question: "What size Mercury outboard do I need for a pontoon?", answer: "It depends on tube count, length, and load. Rule of thumb: 16–18 ft single-tube pontoons run 40–60 HP Command Thrust; 20–22 ft two-tube pontoons want 90–115 HP Command Thrust; 22–25 ft tri-toon take 150 HP and up. Heavier loads, water sports, or rougher water push you higher. Build a quote at mercuryrepower.ca and we'll confirm the right HP." },
  { question: "What is Mercury Command Thrust and why does it matter for pontoons?", answer: "Command Thrust (CT) pairs the engine with a larger gearcase, lower gear ratio, and bigger high-thrust prop. The same powerhead pushes more water at lower RPM, better hole shot with a heavy pontoon load, more pushing power at slow speeds, cleaner reverse at the dock. For pontoons, Command Thrust is almost always the right call." },
  { question: "Do I need a long shaft (20 in) or extra-long shaft (25 in) for my pontoon?", answer: "Most pontoons want a long shaft (20 in / 'L') because the transom on a pontoon log is taller than a typical aluminum tin boat. Some larger tri-toon platforms with a higher transom take an extra-long shaft (25 in / 'XL'). Measure from the top of the transom to the bottom of the hull at centerline. Send us a photo if unsure." },
  { question: "Will a Mercury Command Thrust fit my Legend, Princecraft, or Sylvan pontoon?", answer: "Yes: Mercury Command Thrust 40–150 HP is a common factory option on Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington pontoons. Harris Boat Works is an authorized Legend Boats dealer. For other brands we confirm bolt pattern, controls, and harness compatibility when you build your quote." },
  { question: "How much does a pontoon repower cost in Ontario?", answer: "Most pontoon repowers run $9,000 to $18,000 CAD installed, depending on horsepower (90–150 HP Command Thrust is typical), controls (mechanical vs digital), and rigging. That includes motor, controls/cables, propeller, install, lake test, and warranty registration. Build a quote at mercuryrepower.ca for live CAD pricing. Pickup only at Gores Landing." }
];

function mercuryPontoonOutboardsSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#webpage`,
        "url": `${SITE_URL}/mercury-pontoon-outboards`,
        "name": "Mercury Outboards for Pontoon Boats: Command Thrust, Big Tiller & High-Thrust Options | Harris Boat Works",
        "description": "Mercury Command Thrust outboards for pontoon boats, 40 to 150 HP. HP sizing, shaft length, and Legend/Princecraft pairings. Mercury Platinum Dealer on Rice Lake serving Kawarthas, GTA, and Ontario.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-pontoon-outboards#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-pontoon-outboards#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards for Pontoon Boats", "item": `${SITE_URL}/mercury-pontoon-outboards` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#service`,
        "name": "Mercury Pontoon Outboard Sales & Repower",
        "description": "Mercury Command Thrust outboards (40–150 HP) and high-thrust repower service for pontoon boats. Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington compatible.",
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": [
          { "@type": "Place", "name": "Rice Lake, Ontario" },
          { "@type": "Place", "name": "Kawartha Lakes" },
          { "@type": "Place", "name": "Trent-Severn Waterway" },
          { "@type": "Place", "name": "Greater Toronto Area" },
          { "@type": "AdministrativeArea", "name": "Ontario, Canada" }
        ],
        "serviceType": "Pontoon outboard repower",
        "url": `${SITE_URL}/mercury-pontoon-outboards`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#faqpage`,
        "mainEntity": PONTOON_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Promotions page (mirrors PromotionsPageSEO no-active-promo state, safe
// crawler snapshot; live React still hydrates dynamic offer catalog).
// ============================================================

function promotionsPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/promotions#webpage`,
        "url": `${SITE_URL}/promotions`,
        "name": "Mercury Outboard Promotions | Harris Boat Works",
        "description": "Current Mercury outboard motor promotions, rebates, and financing offers from Harris Boat Works: Mercury Marine Platinum Dealer on Rice Lake.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Promotions", "item": `${SITE_URL}/promotions` }
          ]
        }
      }
    ]
  };
}

// ============================================================
// Blog article schema, kept in sync with src/components/seo/BlogSEO.tsx
// ============================================================

function blogArticleSchema(article) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const wordCount = (article.content || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = parseInt(article.readTime, 10) || 5;
  const description = sanitizeSchemaText(article.description);

  const mentionsRiceLake = /rice lake/i.test(article.content || '') || /rice lake/i.test(article.title || '');
  const riceLakePlaceId = `${SITE_URL}/#rice-lake-ontario`;
  const riceLakePlace = {
    "@type": "Place",
    "@id": riceLakePlaceId,
    "name": "Rice Lake, Ontario",
    "alternateName": ["Rice Lake (Ontario)", "Rice Lake, Kawartha Lakes"],
    "description": "Freshwater lake in the Kawartha Lakes region, southern Ontario, Canada. Located approximately 90 minutes east of Toronto. Distinct from Rice Lake, Wisconsin and Rice Lake, Minnesota.",
    "geo": { "@type": "GeoCoordinates", "latitude": 44.1614, "longitude": -78.0369 },
    "containedInPlace": [
      { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
      { "@type": "AdministrativeArea", "name": "Ontario" },
      { "@type": "Country", "name": "Canada" }
    ],
    "sameAs": [
      "https://en.wikipedia.org/wiki/Rice_Lake_(Ontario)",
      "https://www.wikidata.org/wiki/Q1543290"
    ]
  };

  const articleNode = {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      "headline": sanitizeSchemaText(article.title),
      "description": description,
      "image": `${SITE_URL}${article.image}`,
      "author": /troubleshoot|alarm|wont-start|overheating|winterization|smartcraft-alarm|service-cost|electrical/.test(article.slug)
        ? { "@type": "Organization", "name": "Harris Boat Works Service Team", "url": `${SITE_URL}/about/jay-harris`, "parentOrganization": { "@type": "Organization", "name": "Harris Boat Works", "url": "https://harrisboatworks.ca" } }
        : { "@type": "Person", "name": "Jay Harris", "jobTitle": "Owner, Harris Boat Works", "url": `${SITE_URL}/about/jay-harris`, "worksFor": { "@type": "Organization", "name": "Harris Boat Works", "url": "https://harrisboatworks.ca" } },
      "publisher": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
      "datePublished": article.datePublished,
      "dateModified": article.dateModified,
      "mainEntityOfPage": url,
      "keywords": sanitizeSchemaText((article.keywords || []).join(", ")),
      "wordCount": wordCount,
      "inLanguage": "en-CA",
      "isAccessibleForFree": true,
      "timeRequired": `PT${readTimeMinutes}M`,
      "about": [
        { "@type": "Thing", "name": "Mercury Marine Outboard Motors" },
        { "@type": "Thing", "name": "Boat Motors" }
      ],
      "mentions": [
        { "@type": "Organization", "name": "Mercury Marine" },
        ...(mentionsRiceLake ? [{ "@id": riceLakePlaceId }] : [])
      ],
      ...(mentionsRiceLake ? { "contentLocation": { "@id": riceLakePlaceId } } : {})
  };

  const graph = [articleNode, ...(mentionsRiceLake ? [riceLakePlace] : []),
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      "url": url,
      "name": sanitizeSchemaText(article.title),
      "inLanguage": "en-CA",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
          { "@type": "ListItem", "position": 3, "name": article.title, "item": url }
        ]
      }
    }
  ];

  if (article.howToSteps && article.howToSteps.length > 0) {
    const howToNode = {
      "@type": "HowTo",
      "@id": `${url}#howto`,
      "name": sanitizeSchemaText(article.title),
      "description": description,
      "image": `${SITE_URL}${article.image}`,
      "totalTime": article.howToTotalTime || `PT${readTimeMinutes}M`,
      "step": article.howToSteps.map((step, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": sanitizeSchemaText(step.name),
        "text": sanitizeSchemaText(step.text),
        "url": `${url}#step-${i + 1}`,
        ...(step.image ? { "image": `${SITE_URL}${step.image}` } : {})
      }))
    };
    if (Array.isArray(article.howToSupplies) && article.howToSupplies.length > 0) {
      howToNode.supply = article.howToSupplies.map(name => ({
        "@type": "HowToSupply",
        "name": sanitizeSchemaText(name)
      }));
    }
    if (Array.isArray(article.howToTools) && article.howToTools.length > 0) {
      howToNode.tool = article.howToTools.map(name => ({
        "@type": "HowToTool",
        "name": sanitizeSchemaText(name)
      }));
    }
    graph.push(howToNode);
  }

  if (article.faqs && article.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      "mainEntity": article.faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function stripVisualDirectiveBlocks(text) {
  return String(text || '')
    .replace(/^:::[a-zA-Z0-9_-]+[\s\S]*?^:::\s*$/gm, ' ')
    .replace(/^::[a-zA-Z0-9_-]+[\s\S]*?^::\s*$/gm, ' ')
    .replace(/:::[a-zA-Z0-9_-]+[\s\S]*?:::(?=\s|$)/g, ' ')
    .replace(/::[a-zA-Z0-9_-]+\s+[\s\S]*?\s+::(?=\s|$|[^a-zA-Z0-9_-])/g, ' ');
}

// Extract first ~280 chars of plain text from blog content for noscript intro.
function firstParagraph(content, fallback) {
  if (!content) return sanitizeSchemaText(fallback);
  // Drop leading H1 heading line so it doesn't duplicate the rendered <h1>.
  const withoutH1 = stripVisualDirectiveBlocks(String(content).replace(/^\s*#\s+.+(?:\r?\n|$)/, ''));
  const stripped = withoutH1
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const plain = sanitizeSchemaText(stripped || fallback);
  if (!plain) return '';
  return plain.length > 280 ? plain.slice(0, 277).replace(/\s+\S*$/, '').trim() + '...' : plain;
}

// Per-blog-slug semantic <table> fallbacks. Injected into the prerendered
// <noscript> so crawlers and LLMs see real tabular data even when the
// markdown content rendered by React doesn't survive a no-JS fetch.
const BLOG_TABLE_FALLBACKS = {
  'mercury-repower-cost-ontario-2026-cad':
    '<table><caption>Mercury Repower Cost by Horsepower (CAD, Ontario, 2026)</caption>' +
    '<thead><tr><th scope="col">Project tier</th><th scope="col">HP range</th><th scope="col">All-in range (CAD before HST)</th><th scope="col">Common boats</th></tr></thead>' +
    '<tbody>' +
    '<tr><th scope="row">Tiller, motor-only</th><td>9.9 - 25 HP</td><td>$2,000 - $5,500</td><td>Tenders, dinghies, kickers, small aluminum tillers</td></tr>' +
    '<tr><th scope="row">Small remote</th><td>40 - 60 HP</td><td>$11,000 - $15,000</td><td>14-16 ft aluminum, small consoles</td></tr>' +
    '<tr><th scope="row">Mid</th><td>75 - 115 HP</td><td>$17,000 - $22,000</td><td>16-19 ft aluminum, small pontoons, fishing boats</td></tr>' +
    '<tr><th scope="row">150 HP</th><td>150 HP</td><td>$23,000 - $30,000</td><td>18-22 ft pontoons, runabouts, mid-size fishing</td></tr>' +
    '<tr><th scope="row">High-HP</th><td>200 - 300 HP</td><td>$35,000 - $40,000</td><td>Performance bass, large pontoons, center consoles</td></tr>' +
    '</tbody></table>',
  'cheapest-mercury-outboard-canada-2026':
    '<table><caption>Cheapest New Mercury Outboards in Canada (CAD, 2026)</caption>' +
    '<thead><tr><th scope="col">Model</th><th scope="col">HP</th><th scope="col">MSRP (CAD)</th><th scope="col">Sale price (CAD)</th></tr></thead>' +
    '<tbody>' +
    '<tr><th scope="row">2.5MH FourStroke</th><td>2.5</td><td>$1,385</td><td>$1,271</td></tr>' +
    '<tr><th scope="row">3.5MH FourStroke</th><td>3.5</td><td>$1,650</td><td>$1,499</td></tr>' +
    '<tr><th scope="row">5MH FourStroke</th><td>5</td><td>$1,950</td><td>$1,795</td></tr>' +
    '<tr><th scope="row">6MH FourStroke</th><td>6</td><td>$2,275</td><td>$2,085</td></tr>' +
    '<tr><th scope="row">9.9MH FourStroke</th><td>9.9</td><td>$3,150</td><td>$2,895</td></tr>' +
    '<tr><th scope="row">9.9EH FourStroke</th><td>9.9</td><td>$3,690</td><td>$3,399</td></tr>' +
    '<tr><th scope="row">9.9ELH FourStroke</th><td>9.9</td><td>$4,435</td><td>$3,399</td></tr>' +
    '</tbody></table>',
  'mercury-115-vs-150-hp-outboard-ontario':
    '<table><caption>Mercury 115 HP vs 150 HP FourStroke: Side-by-Side Comparison</caption>' +
    '<thead><tr><th scope="col">Spec</th><th scope="col">Mercury 115 HP FourStroke</th><th scope="col">Mercury 150 HP FourStroke</th></tr></thead>' +
    '<tbody>' +
    '<tr><th scope="row">Cylinders</th><td>4-cyl, 2.1 L</td><td>4-cyl, 3.0 L</td></tr>' +
    '<tr><th scope="row">Dry weight</th><td>359 lbs (163 kg)</td><td>455 lbs (206 kg)</td></tr>' +
    '<tr><th scope="row">Top boat speed (18 ft aluminum)</th><td>~38 mph</td><td>~47 mph</td></tr>' +
    '<tr><th scope="row">Cruise fuel burn @ 25 mph</th><td>~5.5 GPH</td><td>~5.8 GPH</td></tr>' +
    '<tr><th scope="row">Typical price (CAD)</th><td>$15,500</td><td>$18,000</td></tr>' +
    '<tr><th scope="row">Best for</th><td>16–19 ft tinnies, light pontoons</td><td>18–22 ft, tritoons, family runabouts</td></tr>' +
    '<tr><th scope="row">Warranty</th><td>3-year (up to 7 with promo)</td><td>3-year (up to 7 with promo)</td></tr>' +
    '</tbody></table>',
};

// ============================================================
// Hero <picture> + author byline noscript helpers
// Mirrors src/components/blog/BlogHeroPicture.tsx and AuthorByline.tsx
// so crawlers + LLMs see the responsive WebP srcset and credentials
// without executing JS. Keep in sync if those components change.
// ============================================================
function renderHeroPictureHtml(image, alt) {
  if (!image) return '';
  const safeAlt = escapeHtml(alt || '');
  const isLocalRaster = /^\/.+\.(png|jpe?g)$/i.test(image);
  if (!isLocalRaster) {
    return `<figure class="blog-hero"><img src="${escapeHtml(image)}" alt="${safeAlt}" loading="eager" fetchpriority="high" /></figure>`;
  }
  const base = image.replace(/\.(png|jpe?g)$/i, '');
  const srcSet = `${base}-640.webp 640w, ${base}-1024.webp 1024w, ${base}.webp 1920w`;
  const sizes = '(min-width: 1280px) 1024px, (min-width: 768px) 80vw, 100vw';
  return (
    `<figure class="blog-hero">` +
      `<picture>` +
        `<source srcset="${srcSet}" sizes="${sizes}" type="image/webp" />` +
        `<img src="${escapeHtml(image)}" alt="${safeAlt}" loading="eager" fetchpriority="high" />` +
      `</picture>` +
    `</figure>`
  );
}

function renderAuthorBylineHtml(authorName) {
  const name = escapeHtml(authorName || 'Jay Harris');
  const isJay = (authorName || 'Jay Harris') === 'Jay Harris';
  const credentials = isJay
    ? 'Owner, Harris Boat Works · 3rd-generation family marina since 1947 · Mercury Marine Platinum Dealer'
    : '';
  const link = isJay ? ` <a href="/about/jay-harris">View bio →</a>` : '';
  return (
    `<aside class="author-byline" itemscope itemtype="https://schema.org/Person">` +
      `<span>By <span itemprop="name">${name}</span>${credentials ? `, <span itemprop="description">${escapeHtml(credentials)}</span>` : ''}${link}</span>` +
    `</aside>`
  );
}

// Build blog article route configs.
const blogArticleRoutes = blogArticles.map(article => ({
  path: `/blog/${article.slug}`,
  title: `${article.seoTitle || article.title} | Harris Boat Works Blog`,
  description: article.description,
  ogImage: `${SITE_URL}${article.image}`,
  ogType: 'article',
  h1: article.title,
  intro: firstParagraph(article.content, article.description),
  schemas: [blogArticleSchema(article)],
  extraNoscript: () => {
    const heroHtml = renderHeroPictureHtml(article.image, article.title);
    const bylineHtml = renderAuthorBylineHtml(article.author);
    const bodyHtml = renderArticleBodyHtml(article.content);
    const faqHtml = (article.faqs && article.faqs.length > 0)
      ? '<section><h2>Frequently Asked Questions</h2><dl>' + article.faqs.map(f =>
          `<dt><strong>${f.questionHtml || escapeHtml(f.question)}</strong></dt><dd>${f.answerHtml || escapeHtml(f.answer)}</dd>`
        ).join('') + '</dl></section>'
      : '';
    const tableHtml = BLOG_TABLE_FALLBACKS[article.slug] || '';
    const dealerStripHtml = '<div class="dealer-confidence-strip"><span>Mercury Platinum Dealer</span><span>·</span><span>Since 1947</span><span>·</span><span>Gores Landing, ON</span><span>·</span><a href="/quote/motor-selection">Quote builder available</a></div>';
    return `${heroHtml}${bylineHtml}${dealerStripHtml}<article>${bodyHtml}</article>${tableHtml}${faqHtml}`;
  }
}));

// ============================================================
// Translated blog article routes (fr/ko/zh/es)
// Mirror the English blogArticleRoutes shape so SSG injects the
// full article body + a localized dealer-credentials strip into the
// noscript fallback for crawlers + LLM ingestion.
// ============================================================

function buildTranslatedBlogRoutes(articles, langCode, dealerStripHtml, ogLocale, inLanguage) {
  return articles.map(article => ({
    path: `/blog/${langCode}/${article.slug}`,
    title: `${article.seoTitle || article.title} | Harris Boat Works Blog`,
    description: article.description,
    ogImage: article.image ? (article.image.startsWith('http') ? article.image : `${SITE_URL}${article.image}`) : undefined,
    ogType: 'article',
    ogLocale,
    h1: article.title,
    intro: firstParagraph(article.content, article.description),
    htmlLang: inLanguage,
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "description": article.description,
        "inLanguage": inLanguage,
        "datePublished": article.datePublished,
        "dateModified": article.dateModified || article.datePublished,
        "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "publisher": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "mainEntityOfPage": `${SITE_URL}/blog/${langCode}/${article.slug}`
      },
      ...(Array.isArray(article.faqs) && article.faqs.length > 0 ? [{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "inLanguage": inLanguage,
        "mainEntity": article.faqs.map(f => ({
          "@type": "Question",
          "name": f.questionHtml || f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answerHtml || f.answer
          }
        }))
      }] : [])
    ],
    extraNoscript: () => {
      const bodyHtml = renderArticleBodyHtml(article.content);
      const faqHtml = (article.faqs && article.faqs.length > 0)
        ? '<section><h2>FAQ</h2><dl>' + article.faqs.map(f =>
            `<dt><strong>${f.questionHtml || escapeHtml(f.question)}</strong></dt><dd>${f.answerHtml || escapeHtml(f.answer)}</dd>`
          ).join('') + '</dl></section>'
        : '';
      return `${dealerStripHtml}<article>${bodyHtml}</article>${faqHtml}`;
    }
  }));
}

const frDealerStripHtml = '<div class="dealer-confidence-strip"><span>Concessionnaire Mercury Platinum</span><span>·</span><span>Depuis 1947</span><span>·</span><span>Gores Landing, ON</span><span>·</span><a href="/quote/motor-selection">Constructeur de devis disponible</a></div>';
const koDealerStripHtml = '<div class="dealer-confidence-strip"><span>Mercury 플래티넘 딜러</span><span>·</span><span>1947년부터</span><span>·</span><span>온타리오주 Gores Landing</span><span>·</span><a href="/quote/motor-selection">견적 도구 사용 가능</a></div>';
const zhDealerStripHtml = '<div class="dealer-confidence-strip"><span>水星白金经销商</span><span>·</span><span>自1947年</span><span>·</span><span>安大略省 Gores Landing</span><span>·</span><a href="/quote/motor-selection">在线报价工具</a></div>';
const esDealerStripHtml = '<div class="dealer-confidence-strip"><span>Distribuidor Mercury Platinum</span><span>·</span><span>Desde 1947</span><span>·</span><span>Gores Landing, ON</span><span>·</span><a href="/quote/motor-selection">Cotizador disponible</a></div>';

const frenchBlogArticleRoutes = buildTranslatedBlogRoutes(frenchBlogArticles, 'fr', frDealerStripHtml, 'fr_CA', 'fr');
const koreanBlogArticleRoutes = buildTranslatedBlogRoutes(koreanBlogArticles, 'ko', koDealerStripHtml, 'ko_KR', 'ko');
const mandarinBlogArticleRoutes = buildTranslatedBlogRoutes(mandarinBlogArticles, 'zh', zhDealerStripHtml, 'zh_CN', 'zh-Hans');
const spanishBlogArticleRoutes = buildTranslatedBlogRoutes(spanishBlogArticles, 'es', esDealerStripHtml, 'es_ES', 'es');
console.log(`[static-prerender] translated blog routes → fr:${frenchBlogArticleRoutes.length} ko:${koreanBlogArticleRoutes.length} zh:${mandarinBlogArticleRoutes.length} es:${spanishBlogArticleRoutes.length}`);


// ============================================================
// Per-motor /motors/{slug} routes: Product + Offer JSON-LD
// ============================================================

function motorSlug(modelKey) {
  return String(modelKey).toLowerCase().replace(/_/g, '-');
}

function resolveMotorSellingPrice(m) {
  if (typeof m._resolvedSellingPrice === 'number' && m._resolvedSellingPrice > 0) {
    return m._resolvedSellingPrice;
  }
  const overrides = m.manual_overrides || {};
  const candidates = [
    overrides.sale_price, overrides.base_price,
    m.sale_price, m.dealer_price, m.msrp, m.base_price,
  ];
  for (const v of candidates) {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n === 'number' && !isNaN(n) && n > 0) return n;
  }
  return null;
}

function detectMotorFamily(m) {
  if (m.family) return m.family;
  const s = (m.model_display || m.model || '').toLowerCase();
  if (s.includes('proxs') || s.includes('pro xs')) return 'Pro XS';
  if (s.includes('seapro') || s.includes('sea pro')) return 'SeaPro';
  if (s.includes('racing')) return 'Racing';
  if (s.includes('verado')) return 'Verado';
  return 'FourStroke';
}

// Returns true only for verified Mercury / Harris-hosted asset URLs.
// Image policy: never use synthesized, AI-generated, or placeholder images on
// /motors pages. If the upstream record has no real image, omit it entirely.
function isVerifiedMotorImage(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  if (!u.startsWith('http')) return false;
  // Allow only known-good asset hosts (Mercury official, Harris-hosted on the site,
  // or our Supabase storage CDN). Reject any random external host.
  const allowed = [
    'mercurymarine.com',
    'mercurymarine.ca',
    'cdn.mercurymarine.com',
    'mercuryrepower.ca',
    'harrisboatworks.ca',
    'eutsoqdpjurknjsshxes.supabase.co',
  ];
  try {
    const host = new URL(u).hostname.toLowerCase();
    return allowed.some(a => host === a || host.endsWith('.' + a));
  } catch {
    return false;
  }
}

function motorPageSchema(m, slug) {
  const url = `${SITE_URL}/motors/${slug}`;
  const display = m.model_display || m.model || `Mercury ${m.horsepower}HP`;
  const family = detectMotorFamily(m);
  const price = resolveMotorSellingPrice(m);
  const inStock = m.in_stock || m.availability === 'In Stock';
  const modelNo = m.model_number || m.mercury_model_no || null;
  const rawImage = m.hero_image_url || m.image_url || null;
  // Strict image policy: only include verified image. Otherwise omit.
  const image = isVerifiedMotorImage(rawImage) ? rawImage : null;
  const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const additionalProperty = [
    { "@type": "PropertyValue", "name": "Horsepower", "value": `${m.horsepower} HP` },
    { "@type": "PropertyValue", "name": "Family", "value": `Mercury ${family}` },
  ];
  if (m.shaft_code || m.shaft) additionalProperty.push({ "@type": "PropertyValue", "name": "Shaft", "value": m.shaft_code || m.shaft });
  if (m.start_type) additionalProperty.push({ "@type": "PropertyValue", "name": "Start", "value": m.start_type });
  if (m.control_type) additionalProperty.push({ "@type": "PropertyValue", "name": "Control", "value": m.control_type });

  const product = {
    "@type": "Product",
    "@id": `${url}#product`,
    "name": display,
    "description": `Mercury ${family} ${m.horsepower} HP outboard motor${modelNo ? ` (model ${modelNo})` : ''}. Sold and serviced by Harris Boat Works on Rice Lake, Ontario: Mercury Marine Platinum Dealer since 1965.`,
    "brand": { "@type": "Brand", "name": "Mercury Marine" },
    "manufacturer": { "@type": "Organization", "name": "Mercury Marine" },
    "category": "Outboard Motor",
    "url": url,
    ...(image ? { image } : {}),
    ...(modelNo ? { "mpn": modelNo, "sku": modelNo } : {}),
    "additionalProperty": additionalProperty,
  };

  if (price) {
    product.offers = {
      "@type": "Offer",
      "@id": `${url}#offer`,
      "url": url,
      "priceCurrency": "CAD",
      "price": price,
      "priceValidUntil": validUntil,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@id": `${SITE_URL}/#organization` },
      "areaServed": { "@type": "AdministrativeArea", "name": "Ontario, Canada" },
    };
  }

  const webPage = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    "url": url,
    "name": `${display}: Mercury Outboard | Harris Boat Works`,
    "isPartOf": { "@id": `${SITE_URL}/#website` },
    "about": { "@id": `${SITE_URL}/#organization` },
    "inLanguage": "en-CA",
    "mainEntity": { "@id": `${url}#product` },
    "breadcrumb": { "@id": `${url}#breadcrumb` },
  };
  if (image) webPage.primaryImageOfPage = image;

  return {
    "@context": "https://schema.org",
    "@graph": [
      product,
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards Ontario", "item": `${SITE_URL}/mercury-outboards-ontario` },
          { "@type": "ListItem", "position": 3, "name": `Mercury ${family}`, "item": `${SITE_URL}/quote/motor-selection?family=${encodeURIComponent(family)}` },
          { "@type": "ListItem", "position": 4, "name": display, "item": url },
        ],
      },
      webPage,
    ],
  };
}

const motorPageRoutes = motorRecords
  .filter(m => {
    if (!m.model_key) return false;
    // Skip Verado per company policy (special-order only, not promoted)
    const s = (m.model_display || m.model || '').toLowerCase();
    if (s.includes('verado')) return false;
    return true;
  })
  .map(m => {
    const slug = motorSlug(m.model_key);
    const display = m.model_display || m.model || `Mercury ${m.horsepower}HP`;
    const family = detectMotorFamily(m);
    const price = resolveMotorSellingPrice(m);
    const inStock = m.in_stock || m.availability === 'In Stock';
    const modelNo = m.model_number || m.mercury_model_no || '';
    const shaft = m.shaft_code || m.shaft || '';
    const rawImage = m.hero_image_url || m.image_url || null;
    const image = isVerifiedMotorImage(rawImage) ? rawImage : null;
    const priceStr = price
      ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price)
      : 'Contact for pricing';

    const title = `${display}: Mercury Outboard${modelNo ? ` ${modelNo}` : ''} | Harris Boat Works`;
    const description = `${display}: Mercury ${family} ${m.horsepower} HP${shaft ? ` ${shaft} shaft` : ''}${modelNo ? ` (${modelNo})` : ''}. ${priceStr} CAD · ${inStock ? 'In stock' : 'Special order'} · 7-yr warranty available · Pickup at Gores Landing, ON. Mercury Marine Platinum Dealer since 1965.`;

    return {
      path: `/motors/${slug}`,
      title,
      description: description.slice(0, 320),
      // Only emit og:image when we have a verified asset; otherwise let stamp()
      // fall back to the site-wide social-share image (a Harris-controlled asset),
      // never a guessed Mercury URL.
      ...(image ? { ogImage: image } : {}),
      ogType: 'product',
      h1: display,
      intro: `Mercury ${family} ${m.horsepower} HP outboard motor${modelNo ? ` (model ${modelNo})` : ''}. ${priceStr} CAD. ${inStock ? 'In stock at' : 'Special order from'} Harris Boat Works on Rice Lake, Ontario: Mercury Marine Platinum Dealer since 1965, family-owned since 1947. Pickup only at our Gores Landing location.`,
      schemas: [motorPageSchema(m, slug)],
      extraNoscript: () =>
        '<table><caption>Specifications</caption><tbody>' +
        `<tr><th scope="row">Horsepower</th><td>${m.horsepower} HP</td></tr>` +
        `<tr><th scope="row">Family</th><td>Mercury ${escapeHtml(family)}</td></tr>` +
        (shaft ? `<tr><th scope="row">Shaft</th><td>${escapeHtml(shaft)}</td></tr>` : '') +
        (m.start_type ? `<tr><th scope="row">Start</th><td>${escapeHtml(m.start_type)}</td></tr>` : '') +
        (m.control_type ? `<tr><th scope="row">Control</th><td>${escapeHtml(m.control_type)}</td></tr>` : '') +
        (modelNo ? `<tr><th scope="row">Model number</th><td>${escapeHtml(modelNo)}</td></tr>` : '') +
        `<tr><th scope="row">Price (CAD)</th><td>${escapeHtml(priceStr)}</td></tr>` +
        `<tr><th scope="row">Availability</th><td>${inStock ? 'In stock' : 'Special order'}</td></tr>` +
        `<tr><th scope="row">Warranty</th><td>3-year factory; up to 7 years available</td></tr>` +
        `<tr><th scope="row">Pickup</th><td>Gores Landing, ON (no shipping)</td></tr>` +
        '</tbody></table>' +
        `<p><a href="/quote/motor-selection?motor=${encodeURIComponent(m.id)}">Build a quote with this motor →</a></p>`,
    };
  });

console.log(`[static-prerender] generated ${motorPageRoutes.length} /motors/{slug} routes`);

// ============================================================
// Case study + location schemas and route generators
// ============================================================

function caseStudiesIndexSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/case-studies#webpage`,
    url: `${SITE_URL}/case-studies`,
    name: "Mercury Repower Case Studies",
    description: "Real Mercury outboard repower scenarios from Harris Boat Works, aluminum fishing, pontoon, bass boat, walkaround cuddy and small utility setups in Ontario.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en-CA",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: caseStudies.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/case-studies/${s.slug}`,
        name: s.title,
      })),
    },
  };
}

function caseStudyDetailSchema(study) {
  const url = `${SITE_URL}/case-studies/${study.slug}`;
  const image = study.heroImage
    ? (study.heroImage.startsWith('/') ? `${SITE_URL}${study.heroImage}` : study.heroImage)
    : undefined;
  // Stable publication date for case studies (not tied to build time so it doesn't churn).
  // Phase 1 launch baseline; can be overridden per-study via study.datePublished later.
  const datePublished = study.datePublished || '2026-04-01';
  const dateModified = study.dateModified || datePublished;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: study.title,
        description: study.excerpt,
        image,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        datePublished,
        dateModified,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        inLanguage: "en-CA",
        about: {
          "@type": "Thing",
          name: `${study.boatType} repower - ${study.beforeMotor} to ${study.afterMotor}`,
        },
        articleSection: "Mercury repower case study",
        keywords: [study.scenario, study.boatType, study.region, "Mercury", "repower", "Ontario"].join(", "),
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: study.title,
        description: study.excerpt,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "en-CA",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Case Studies", item: `${SITE_URL}/case-studies` },
          { "@type": "ListItem", position: 3, name: study.title, item: url },
        ],
      },
    ],
  };
}

function locationsIndexSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/locations#webpage`,
    url: `${SITE_URL}/locations`,
    name: "Mercury Outboard Pickup Areas: Harris Boat Works",
    description: "Regional Mercury buyer guides for Ontario customers, sales catchments only, with pickup at Gores Landing on Rice Lake. No mobile service or delivery.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en-CA",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: locations.map((loc, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/locations/${loc.slug}`,
        name: loc.title,
      })),
    },
  };
}

function locationDetailSchema(loc) {
  const url = `${SITE_URL}/locations/${loc.slug}`;
  const description = loc.metaDescription || loc.intro;
  const address = {
    "@type": "PostalAddress",
    streetAddress: "5369 Harris Boat Works Rd",
    addressLocality: "Gores Landing",
    addressRegion: "ON",
    postalCode: "K0K 2E0",
    addressCountry: "CA",
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: loc.title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${url}#localbusiness` },
        inLanguage: "en-CA",
      },
      {
        "@type": "LocalBusiness",
        "@id": `${url}#localbusiness`,
        name: "Harris Boat Works",
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        url,
        telephone: "+1-905-342-2153",
        email: "info@harrisboatworks.ca",
        priceRange: "$$",
        address,
        // Sales catchment / buyer catchment ONLY. NOT mobile service coverage.
        // All work happens on-site at Gores Landing.
        areaServed: {
          "@type": "AdministrativeArea",
          name: loc.region,
          description: "Sales catchment only, customers from this area travel to Gores Landing for pickup. No mobile service, no delivery.",
        },
      },
      {
        "@type": "Place",
        "@id": `${url}#place`,
        name: loc.region,
        containedInPlace: { "@type": "AdministrativeArea", name: "Ontario, Canada" },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: loc.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Pickup Areas", item: `${SITE_URL}/locations` },
          { "@type": "ListItem", position: 3, name: loc.title, item: url },
        ],
      },
    ],
  };
}


const caseStudyDetailRoutes = caseStudies.map((s) => ({
  path: `/case-studies/${s.slug}`,
  title: `${s.title} | Mercury Repower Case Study | Harris Boat Works`,
  description: `${s.excerpt} ${s.beforeMotor} to ${s.afterMotor}. Mercury repower case study from Harris Boat Works.`.slice(0, 320),
  h1: s.title,
  intro: `${s.excerpt} Scenario: ${s.scenario}. Boat type: ${s.boatType}. Region: ${s.region}. Repower path: ${s.beforeMotor} → ${s.afterMotor}.`,
  schemas: [caseStudyDetailSchema(s)],
  extraNoscript: () =>
    `<section><h2>What changed</h2><p><strong>Before:</strong> ${escapeHtml(s.beforeMotor)}. <strong>After:</strong> ${escapeHtml(s.afterMotor)}. <strong>Region:</strong> ${escapeHtml(s.region)}.</p></section>` +
    `<section><h2>Recommendation</h2><p>${escapeHtml(s.recommendation)}</p></section>` +
    `<section><h2>Why it worked</h2><ul>${s.whyItWorked.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></section>` +
    `<blockquote><p>${escapeHtml(s.customerQuote)}</p></blockquote>` +
    `<p><a href="${escapeHtml(s.quoteUrl)}">Build a Mercury quote based on this case study →</a></p>` +
    `<p><a href="/case-studies">← All Mercury repower case studies</a></p>` +
    (s.isIllustrative ? `<p><em>Note: imagery for this case study is illustrative pending real photography.</em></p>` : ''),
}));

const locationDetailRoutes = locations.map((loc) => ({
  path: `/locations/${loc.slug}`,
  title: `${loc.title} | Harris Boat Works`,
  description: loc.intro.slice(0, 300),
  h1: loc.title,
  intro: loc.intro,
  schemas: [locationDetailSchema(loc)],
  extraNoscript: () =>
    `<section><h2>About this pickup area</h2><p>${escapeHtml(loc.intro)} Travel: ${escapeHtml(loc.driveTime)}. Pickup only at 5369 Harris Boat Works Rd, Gores Landing, Ontario. Sales catchment only, no mobile service, no delivery.</p></section>` +
    `<section><h2>Popular boat uses in ${escapeHtml(loc.region)}</h2><ul>${loc.popularBoats.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul></section>` +
    `<section><h2>Recommended next steps</h2><ul>${loc.recommendedLinks.map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join('')}</ul></section>` +
    `<section><h2>FAQ</h2><dl>${loc.faqs.map((f) => `<dt><strong>${escapeHtml(f.question)}</strong></dt><dd>${escapeHtml(f.answer)}</dd>`).join('')}</dl></section>` +
    `<p><a href="/locations">← All Mercury pickup areas</a></p>`,
}));

console.log(`[static-prerender] generated ${caseStudyDetailRoutes.length} /case-studies/{slug} routes`);
console.log(`[static-prerender] generated ${locationDetailRoutes.length} /locations/{slug} routes`);

const caseStudiesIndexRoute = {
  path: '/case-studies',
  title: 'Mercury Outboard Repower Case Studies | Harris Boat Works',
  description: 'Real Mercury outboard repower case studies from Ontario, aluminum fishing boats, pontoons, bass boats, walkaround cuddies, and small utility setups.',
  h1: 'Mercury Repower Case Studies',
  intro: 'Real Ontario repower scenarios from Harris Boat Works showing where specific Mercury outboard recommendations make sense, aluminum fishing boats, pontoons, bass boats, walkaround cuddies, and small utility setups.',
  schemas: [caseStudiesIndexSchema()],
  extraNoscript: () =>
    `<ul>${caseStudies.map((s) => `<li><a href="/case-studies/${s.slug}"><strong>${escapeHtml(s.title)}</strong></a> - ${escapeHtml(s.excerpt)}</li>`).join('')}</ul>`,
};

const locationsIndexRoute = {
  path: '/locations',
  title: 'Mercury Outboard Pickup Areas in Ontario | Harris Boat Works',
  description: 'Regional Mercury buyer guides for Peterborough, Kawartha Lakes, Rice Lake, Cobourg & Northumberland, Durham & GTA. Sales catchments only, pickup at Gores Landing. No mobile service or delivery.',
  h1: 'Mercury Outboard Pickup Areas',
  intro: 'Harris Boat Works serves Mercury outboard buyers across central and eastern Ontario from our Gores Landing location on Rice Lake. These are pickup-only sales catchments. We do not perform mobile service, we do not ship, and we do not deliver.',
  schemas: [locationsIndexSchema()],
  extraNoscript: () =>
    `<ul>${locations.map((l) => `<li><a href="/locations/${l.slug}"><strong>${escapeHtml(l.title)}</strong></a> - ${escapeHtml(l.intro)}</li>`).join('')}</ul>`,
};

// ============================================================
// Hub pages (/repower, /motor-selection, /maintenance, /lakes)
// Source of truth for prerendered <title>, meta description, OG/Twitter,
// JSON-LD (WebPage + BreadcrumbList + FAQPage), and noscript fallback.
// Must stay in sync with src/pages/*Hub.tsx.
// ============================================================
function hubSchemas({ path, metaTitle, metaDescription, h1, breadcrumbName, faqs, lastReviewedISO }) {
  const url = `${SITE_URL}${path}`;
  return [{
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": metaTitle,
        "headline": h1,
        "description": metaDescription,
        "inLanguage": "en-CA",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "mainEntityOfPage": url,
        "dateModified": lastReviewedISO,
        "author": {
          "@type": "Person",
          "name": "Jay Harris",
          "jobTitle": "3rd-Generation Owner",
          "worksFor": { "@id": `${SITE_URL}/#organization` }
        },
        "breadcrumb": { "@id": `${url}#breadcrumb` },
        "primaryImageOfPage": { "@type": "ImageObject", "url": `${SITE_URL}/social-share.jpg` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": breadcrumbName, "item": url }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
      }
    ]
  }];
}

function hubTableHtml(caption, columns, rows) {
  return (
    `<table><caption>${escapeHtml(caption)}</caption>` +
    `<thead><tr>${columns.map(c => `<th scope="col">${escapeHtml(c.label)}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.map(r =>
      `<tr>${columns.map(c => `<td>${escapeHtml(String(r[c.key] ?? ''))}</td>`).join('')}</tr>`
    ).join('')}</tbody></table>`
  );
}

function hubFaqHtml(faqs) {
  return '<dl>' + faqs.map(f =>
    `<dt><strong>${escapeHtml(f.question)}</strong></dt><dd>${escapeHtml(f.answer)}</dd>`
  ).join('') + '</dl>';
}

function hubArticleListHtml(groups) {
  return groups.map(g =>
    `<section><h3>${escapeHtml(g.heading)}</h3><ul>` +
    g.cards.map(c => `<li><a href="${c.to}"><strong>${escapeHtml(c.title)}</strong></a>${c.description ? ' - ' + escapeHtml(c.description) : ''}</li>`).join('') +
    '</ul></section>'
  ).join('');
}

const HUB_DEFS = [
  {
    path: '/repower',
    metaTitle: 'Mercury Repower Ontario 2026: Cost, Process, Financing | HBW',
    metaDescription: 'Mercury repowers in Ontario typically run $11,000 to $40,000 CAD all-in. Get live pricing, the full repower process, and 7.99% financing options at Harris Boat Works.',
    breadcrumbName: 'Mercury Repower',
    h1: 'Mercury Repower Guide for Ontario Boaters (2026)',
    intro: "A Mercury repower means replacing your existing outboard with a new Mercury on your current boat. For most Ontario freshwater customers in 2026, all-in costs land between $11,000 and $40,000 CAD depending on HP class, hull, and rigging. The hull is the asset; the motor is the wear part. A repower on a solid hull gives you 80% of the new-boat experience for half the money. Live pricing on every Mercury we sell is at /quote/motor-selection.",
    table: {
      caption: 'Mercury Repower Cost by HP Class',
      columns: [
        { key: 'hp', label: 'HP Class' },
        { key: 'use', label: 'Typical Use' },
        { key: 'cost', label: 'All-in Cost (CAD before HST)' },
      ],
      rows: [
        { hp: '9.9 to 25 HP', use: 'Small tin boats, kickers', cost: 'Motor only, $2,000 to $5,500' },
        { hp: '40 to 60 HP', use: '14 to 16 ft aluminum console', cost: '$11,000 to $15,000' },
        { hp: '75 to 115 HP', use: '16 to 18 ft aluminum console (most common)', cost: '$17,000 to $22,000' },
        { hp: '150 HP', use: '18 to 20 ft, pontoons, water sports', cost: '$23,000 to $30,000' },
        { hp: '200 to 300 HP', use: 'Larger fiberglass, tritoons, performance', cost: '$35,000 to $40,000' },
      ],
    },
    articleGroups: [
      { heading: 'Repower decision', cards: [
        { title: 'Boat Repowering Guide: When to Replace Your Motor', to: '/blog/boat-repowering-guide-when-to-replace-motor', description: 'Warning signs, age thresholds, and the math.' },
        { title: 'Boat Hull Replacement vs Repower Decision', to: '/blog/boat-hull-replacement-vs-repower-decision', description: 'When the hull is worth keeping.' },
        { title: 'Ontario Cottage Boat Motor Repower Guide', to: '/blog/ontario-cottage-boat-motor-repower-guide', description: 'Cottage-use specifics.' },
      ]},
      { heading: 'Cost and financing', cards: [
        { title: 'Mercury Repower Cost Ontario 2026 (CAD)', to: '/blog/mercury-repower-cost-ontario-2026-cad', description: 'Detailed cost breakdown.' },
        { title: 'Mercury Outboard Financing Ontario 2026', to: '/blog/mercury-outboard-financing-ontario-2026', description: 'Rates, terms, applications.' },
        { title: 'Cheapest Mercury Outboard Canada 2026', to: '/blog/cheapest-mercury-outboard-canada-2026', description: 'Lowest entry points.' },
      ]},
      { heading: 'Process and execution', cards: [
        { title: 'Complete Guide to Boat Repower in the Kawarthas', to: '/blog/complete-guide-boat-repower-kawarthas', description: 'End-to-end process.' },
        { title: 'Evinrude to Mercury Repower Ontario Guide', to: '/blog/evinrude-to-mercury-repower-ontario-guide', description: 'Brand-conversion guide.' },
        { title: 'Pleasure Craft Licence Update During Repower', to: '/blog/pleasure-craft-licence-update-repower-ontario', description: 'Transport Canada paperwork.' },
      ]},
    ],
    faqs: [
      { question: 'How much does a Mercury repower cost in Ontario?', answer: 'Typical 2026 all-in repowers land $11,000 to $40,000 CAD depending on HP class. Smaller motors (40 to 60 HP) are at the low end; larger motors (200 to 300 HP) at the high end. Most Kawartha repowers are 75 to 115 HP and land $17,000 to $22,000 CAD. See live pricing at /quote/motor-selection.' },
      { question: 'Should I repower or buy a new boat?', answer: "For most boaters with a hull less than 20 years old that's structurally solid, repower wins on the math. A new comparable boat package costs $25,000 to $50,000 CAD more than a repower. The hull is the asset; the motor is the wear part." },
      { question: 'How long does a Mercury repower take?', answer: 'Mercury-to-Mercury repowers take 2 to 4 days of shop time. Brand conversions (Evinrude, Yamaha, Honda to Mercury) take longer. Spring rush (March to May) adds wait time before the shop starts.' },
      { question: 'Can I finance a Mercury repower?', answer: 'Yes. Mercury Repower Financing offers 7.99% APR for qualified buyers. We process applications in-shop. See our financing guide for details.' },
      { question: 'Should I switch from Evinrude to Mercury?', answer: 'For most Evinrude owners, yes. BRP shut down Evinrude outboard production in 2020 and parts/service support is shrinking. Brand conversion adds $1,500 to $3,000 CAD in rigging but pays back over the life of the new motor.' },
      { question: 'When is the best time to book a repower?', answer: 'Off-season (October through April). Mercury inventory is best, shop time is available, and the boat is ready for next season. Spring slots fill up by March.' },
      { question: 'Will my old controls and rigging work with a new Mercury?', answer: 'Mercury-to-Mercury repowers usually keep existing post-2010 controls. Older or non-Mercury rigging needs replacement. Brand conversions need new everything. We assess during the hull walk-around.' },
      { question: 'Do I need to update my Pleasure Craft Licence after a repower?', answer: 'Yes if motor HP, brand, or model changes. Updates are free and take 10 to 15 minutes online. We handle the paperwork for HBW customers.' },
    ],
  },
  {
    path: '/motor-selection',
    metaTitle: 'Choose the Right Mercury Outboard 2026: HP, Family, Prop | HBW',
    metaDescription: 'Mercury outboard selection by boat type, HP class, and use case. FourStroke vs Pro XS, prop selection, Command Thrust, and live CAD pricing from Harris Boat Works.',
    breadcrumbName: 'Mercury Motor Selection',
    h1: 'How to Choose the Right Mercury Outboard for Your Boat (2026)',
    intro: "The right Mercury for your boat depends on hull length and weight, intended use, passenger and gear loading, and the maximum HP rating on your boat's capacity plate. For most Ontario freshwater boats, the answer falls in the Mercury 60 to 150 HP FourStroke range, paired with a 9.9 ProKicker if you fish. Aim for 70 to 90% of your maximum rated HP for typical recreational use. Live pricing on every Mercury we sell is at /quote/motor-selection.",
    table: {
      caption: 'Mercury HP by Boat Type',
      columns: [
        { key: 'boat', label: 'Boat Type' },
        { key: 'len', label: 'Length' },
        { key: 'rec', label: 'Recommended Mercury' },
      ],
      rows: [
        { boat: 'Aluminum tin boat', len: '12 to 14 ft', rec: '9.9 to 25 HP tiller' },
        { boat: 'Aluminum console fishing', len: '14 to 16 ft', rec: '40 to 60 HP' },
        { boat: 'Aluminum console fishing', len: '16 to 18 ft', rec: '75 to 115 HP FourStroke' },
        { boat: 'Aluminum console fishing', len: '18 to 20 ft', rec: '115 to 150 HP FourStroke or Pro XS' },
        { boat: 'Pontoon (cruising)', len: '18 to 22 ft', rec: '90 to 115 HP Command Thrust' },
        { boat: 'Pontoon (water sports)', len: '20 to 22 ft', rec: '150 HP Command Thrust' },
        { boat: 'Tritoon', len: '22 to 24 ft', rec: '150 to 200 HP Command Thrust' },
        { boat: 'Bass boat (tournament)', len: '18 to 21 ft', rec: '200 to 250 HP Pro XS' },
        { boat: 'Center console (freshwater)', len: '22 to 26 ft', rec: '250 to 300 HP V8 FourStroke' },
      ],
    },
    articleGroups: [
      { heading: 'HP class selection', cards: [
        { title: 'How to Choose the Right Horsepower for Your Boat', to: '/blog/how-to-choose-right-horsepower-boat' },
        { title: 'Mercury 75 vs 90 vs 115 Comparison', to: '/blog/mercury-75-vs-90-vs-115-comparison' },
        { title: 'Mercury 115 vs 150 HP for Ontario Boats', to: '/blog/mercury-115-vs-150-hp-outboard-ontario' },
      ]},
      { heading: 'Motor family selection', cards: [
        { title: 'Mercury Motor Families: FourStroke vs Pro XS vs Verado', to: '/blog/mercury-motor-families-fourstroke-vs-pro-xs-vs-verado' },
        { title: 'Mercury 2026 Outboard Lineup Ontario', to: '/blog/mercury-2026-outboard-lineup-ontario' },
        { title: 'Portable Mercury Outboard Guide 2.5 to 20 HP', to: '/blog/portable-outboard-mercury-guide-2-20hp' },
      ]},
      { heading: 'Boat-type matching', cards: [
        { title: 'Best Mercury Outboard for Aluminum Fishing Boats', to: '/blog/best-mercury-outboard-aluminum-fishing-boats' },
        { title: 'Best Mercury Outboard for Pontoon Boats', to: '/blog/best-mercury-outboard-pontoon-boats' },
        { title: 'Mercury Command Thrust Guide for Pontoons', to: '/blog/mercury-command-thrust-guide-pontoon-boats' },
      ]},
      { heading: 'Configuration', cards: [
        { title: 'Mercury Propeller Selection Guide', to: '/blog/mercury-propeller-selection-guide' },
        { title: 'Mercury Outboard Fuel Efficiency Guide', to: '/blog/mercury-outboard-fuel-efficiency-guide' },
        { title: 'Tiller vs Remote Steering Outboard Guide', to: '/blog/tiller-vs-remote-steering-outboard-guide' },
      ]},
    ],
    faqs: [
      { question: 'What HP do I need for my boat?', answer: "Aim for 70 to 90% of your boat's maximum rated HP for typical recreational use. Specific answer depends on hull length, type, and use case." },
      { question: 'Should I get FourStroke or Pro XS?', answer: 'For most recreational use (fishing, cruising, family), FourStroke is the better value. Pro XS earns its premium on tournament hulls and performance applications. The Pro XS price difference is typically $1,000 to $1,500 CAD over FourStroke at the same HP.' },
      { question: 'Do I need Mercury Command Thrust?', answer: 'For pontoons 18 ft and up, yes. For aluminum console fishing boats under 18 ft, the standard gearcase is fine. Command Thrust is a gearcase option, not a separate motor family.' },
      { question: "What's the most popular Mercury at HBW?", answer: 'The 90 EXLPT FourStroke is the most-installed Mercury we sell. It fits the most common Kawartha boat (16 to 18 ft aluminum console) and the most common use case (family fishing). The 9.9 ProKicker is the most-installed kicker.' },
      { question: 'Will the wrong prop hurt my Mercury?', answer: 'Yes. A wrong prop can cost 4 mph in top speed and 15% in fuel economy. We test props on the water during sea-trial of every repower.' },
      { question: 'Is Mercury better than Yamaha or Honda?', answer: 'Mechanically, all three brands make excellent reliable outboards. In Ontario freshwater, Mercury wins on dealer network density, parts availability, and factory-OEM relationships with Canadian boat builders.' },
      { question: 'Can I run a bigger motor than my capacity plate says?', answer: 'No. The capacity plate sets the legal and warranty-backed ceiling. Mercury voids warranty on over-powered hulls. We will not install a motor above the rated HP.' },
      { question: 'Does HBW sell Verado?', answer: 'By special order. Verado is built for offshore center consoles and twin/triple installations. Most Ontario freshwater boaters do not need Verado.' },
    ],
  },
  {
    path: '/maintenance',
    metaTitle: 'Mercury Outboard Maintenance & Service Ontario | HBW',
    metaDescription: 'Mercury maintenance follows a four-part seasonal cycle. Spring commissioning, summer service, fall winterization, winter storage. Schedule service at Harris Boat Works.',
    breadcrumbName: 'Mercury Maintenance',
    h1: 'Mercury Outboard Maintenance & Service Guide for Ontario (2026)',
    intro: 'Mercury outboard maintenance in Ontario follows a four-part seasonal cycle: spring commissioning (April-May), summer mid-season check (July if running heavy hours), fall winterization (October-November), and winter storage. Skipped winterization is the leading cause of motor failure we see at HBW. Annual maintenance costs less than a single major repair on a neglected motor.',
    table: {
      caption: 'Annual Mercury Service Cycle',
      columns: [
        { key: 'season', label: 'Season' },
        { key: 'service', label: 'Service' },
        { key: 'crit', label: 'Critical?' },
      ],
      rows: [
        { season: 'Spring (April-May)', service: 'Commissioning: battery, fuel, cooling, spark, fluids', crit: 'Yes' },
        { season: 'Summer (July)', service: 'Mid-season check (heavy use only)', crit: 'Optional' },
        { season: 'Fall (Oct-Nov)', service: 'Winterization: stabilize fuel, fog engine, drain gearcase', crit: 'Critical' },
        { season: 'Winter', service: 'Storage: monthly visual check, battery trickle', crit: 'Light' },
      ],
    },
    articleGroups: [
      { heading: 'Seasonal cycles', cards: [
        { title: 'Mercury Motor Maintenance: Seasonal Care Tips', to: '/blog/mercury-motor-maintenance-seasonal-tips' },
        { title: 'Spring Outboard Commissioning Checklist', to: '/blog/spring-outboard-commissioning-checklist' },
        { title: 'DIY Mercury Outboard Winterization Guide', to: '/blog/diy-mercury-outboard-winterization-guide' },
        { title: 'How Much Does Boat Winterization Cost?', to: '/blog/boat-winterization-cost-ontario-2026' },
      ]},
      { heading: 'Troubleshooting', cards: [
        { title: "Mercury Outboard Won't Start Troubleshooting", to: '/blog/mercury-outboard-wont-start-troubleshooting' },
      ]},
      { heading: 'New motor care', cards: [
        { title: 'Breaking In a New Mercury Motor', to: '/blog/breaking-in-new-mercury-motor-guide' },
      ]},
      { heading: 'Pre-season prep', cards: [
        { title: 'Walleye Opener Boat Prep Checklist', to: '/blog/walleye-opener-boat-prep' },
      ]},
    ],
    faqs: [
      { question: 'How often should I service my Mercury?', answer: 'Annually at minimum. Spring commissioning to bring the motor back from winter, fall winterization to put it away. Boaters running 200+ hours per season should add a mid-season check in July.' },
      { question: "What's the most important Mercury maintenance task?", answer: 'Winterization. Skipping winterization is the single most common cause of motor failure we see at HBW. Done right, it protects against freeze damage, fuel system gum-up, and corrosion through the storage period.' },
      { question: 'How much does Mercury maintenance cost?', answer: "Varies by motor size, boat type, and what's included. Basic spring commissioning plus fall winterization is the smallest bill. Bundles with impeller replacement, anode replacement, and other wear items run more." },
      { question: 'Can I service my own Mercury?', answer: 'Some service yes, especially fluid changes, plug inspection, and visual maintenance. Tasks like water-pump impeller replacement, EFI fuel system service, and lower-unit work should be left to a Mercury dealer.' },
      { question: 'How long does a Mercury last with proper maintenance?', answer: "Modern Mercury FourStrokes properly maintained last 1,500 to 2,000+ engine hours. For a typical recreational boater (50 to 150 hours per season), that's 10 to 30 years." },
      { question: 'What kind of oil does my Mercury need?', answer: "Modern Mercury FourStrokes use full-synthetic Mercury 25W-50 four-stroke oil. Older motors and 2-strokes use different specifications. Check your owner's manual or contact HBW." },
      { question: "Why won't my Mercury start in spring?", answer: 'Most spring no-starts are battery (40%), stale fuel (25%), or skipped winterization (20%). Run through the basics first.' },
      { question: 'When should I book spring service?', answer: 'February or early March for a May 1 launch. Service slots fill up in March and the late-April bookings often push delivery into late May or June.' },
    ],
  },
  {
    path: '/lakes',
    metaTitle: 'Mercury Outboards for Ontario Lakes 2026: Rice Lake, Simcoe, Lake Ontario | HBW',
    metaDescription: 'The right Mercury depends on where you boat. Rice Lake, Lake Simcoe, Lake Ontario all reward different setups. Local expertise from Harris Boat Works since 1965.',
    breadcrumbName: 'Ontario Lakes Setup',
    h1: 'Mercury Outboards for Ontario Lakes: Local Setup Guide (2026)',
    intro: 'Different Ontario lakes reward different Mercury setups. Sheltered Rice Lake fishes best with 60 to 115 HP aluminum console boats and a 9.9 ProKicker for walleye trolling. Lake Simcoe needs 90 to 150 HP deep-V hulls for the bigger water. Lake Ontario salmon trolling wants 200 to 300 HP V8 setups with 15 HP ProKickers.',
    table: {
      caption: 'Lake-by-Lake Mercury Setup',
      columns: [
        { key: 'lake', label: 'Lake' },
        { key: 'hull', label: 'Hull Type' },
        { key: 'main', label: 'Main Motor' },
        { key: 'kicker', label: 'Kicker' },
      ],
      rows: [
        { lake: 'Rice Lake', hull: '16 to 18 ft aluminum console', main: '60 to 115 HP FourStroke', kicker: '9.9 ProKicker' },
        { lake: 'Kawarthas (Stoney, Pigeon, Buckhorn)', hull: '16 to 18 ft aluminum console', main: '60 to 115 HP FourStroke', kicker: '9.9 ProKicker' },
        { lake: 'Lake Simcoe', hull: '17 to 19 ft deep-V aluminum', main: '90 to 150 HP FourStroke', kicker: '9.9 ProKicker' },
        { lake: 'Lake Ontario', hull: '22 to 26 ft deep-V or walkaround', main: '250 to 300 HP V8 FourStroke', kicker: '15 HP ProKicker' },
        { lake: 'Bay of Quinte', hull: '18 to 22 ft aluminum or fiberglass', main: '115 to 200 HP FourStroke', kicker: '9.9 ProKicker' },
      ],
    },
    articleGroups: [
      { heading: 'Rice Lake', cards: [
        { title: 'Best Mercury Outboard for Rice Lake Fishing', to: '/blog/best-mercury-outboard-rice-lake-fishing' },
        { title: 'Mercury 9.9 ProKicker Rice Lake Fishing Guide', to: '/blog/mercury-prokicker-rice-lake-fishing-guide' },
        { title: '2026 Rice Lake Fishing Season Outlook', to: '/blog/2026-rice-lake-fishing-season-outlook' },
        { title: 'Best Pontoon Boats for Rice Lake Cottage Use', to: '/blog/best-pontoon-boats-rice-lake-cottage-use' },
        { title: 'Best Boats for Rice Lake Under $30,000', to: '/blog/best-boats-rice-lake-under-30000' },
      ]},
      { heading: 'Other Ontario lakes', cards: [
        { title: 'Best Mercury Outboard for Lake Simcoe Walleye Fishing', to: '/blog/best-mercury-outboard-lake-simcoe-walleye-fishing' },
        { title: 'Best Mercury Outboard for Lake Ontario Salmon and Trout', to: '/blog/best-mercury-outboard-lake-ontario-salmon-trout' },
      ]},
      { heading: 'Cottage and seasonal', cards: [
        { title: 'Ontario Cottage Boat Motor Repower Guide', to: '/blog/ontario-cottage-boat-motor-repower-guide' },
        { title: 'Walleye Opener Boat Prep Checklist', to: '/blog/walleye-opener-boat-prep' },
      ]},
    ],
    faqs: [
      { question: "What's the best Mercury for Rice Lake fishing?", answer: 'For most Rice Lake anglers, a 16 to 18 ft aluminum console with 60 to 115 HP FourStroke main + 9.9 ProKicker. The 90 EXLPT FourStroke is the sweet spot.' },
      { question: "What's the best Mercury for Lake Simcoe walleye?", answer: 'For Simcoe walleye, a 17 to 19 ft deep-V aluminum boat with 90 to 150 HP FourStroke + 9.9 ProKicker. The 115 EXLPT FourStroke is the sweet spot.' },
      { question: "What's the best Mercury for Lake Ontario salmon?", answer: 'For Lake Ontario salmon trolling, 22 to 26 ft deep-V or walkaround with 250 to 300 HP V8 FourStroke + 15 HP ProKicker.' },
      { question: 'Do I need a kicker for Ontario fishing?', answer: 'For walleye trolling on most Ontario lakes, yes. The 9.9 ProKicker is the standard for sheltered lakes; the 15 HP ProKicker is the standard for Lake Ontario salmon spreads.' },
      { question: 'Where do most Rice Lake anglers launch?', answer: 'Bewdley, Hastings, and Roseneath public ramps. Each has different characteristics. Many cottagers launch from private docks.' },
      { question: 'Can I fish Lake Simcoe with a Rice Lake setup?', answer: 'Sometimes, with caution. Boats under 17 ft are exposed in moderate Simcoe weather. Most serious Simcoe anglers run bigger.' },
      { question: 'When does walleye season open in Ontario?', answer: 'For Zone 17 (Kawartha lakes including Rice Lake), typically the second Saturday of May. Confirm current year dates from OMNR.' },
      { question: 'What about ice fishing season?', answer: 'Lake Simcoe is a major ice fishing destination. Rice Lake and Kawartha lakes have ice fishing seasons too. Boat-side, this is the time for repowers, winterization confirmation, and spring planning.' },
    ],
  },
];

const HUB_LAST_REVIEWED = '2026-05-05';

const HUB_ROUTES = HUB_DEFS.map(def => ({
  path: def.path,
  title: def.metaTitle,
  description: def.metaDescription,
  h1: def.h1,
  intro: def.intro,
  schemas: hubSchemas({
    path: def.path,
    metaTitle: def.metaTitle,
    metaDescription: def.metaDescription,
    h1: def.h1,
    breadcrumbName: def.breadcrumbName,
    faqs: def.faqs,
    lastReviewedISO: HUB_LAST_REVIEWED,
  }),
  extraNoscript: () =>
    hubTableHtml(def.table.caption, def.table.columns, def.table.rows) +
    hubArticleListHtml(def.articleGroups) +
    hubFaqHtml(def.faqs),
}));

const routes = [

  {
    path: '/',
    title: 'Mercury Repower Ontario: Trade-In, Financing & Online Quotes | Harris Boat Works',
    description: "Ontario's Mercury Repower Centre on Rice Lake. Family-owned since 1947, Mercury Platinum Dealer since 1965. Trade-in valuations, financing, and live CAD quotes, pickup at Gores Landing.",
    h1: 'Mercury Outboard Quotes: Real Prices, No Forms',
    intro: 'Build a real Mercury outboard quote online in three minutes. Live CAD pricing, financing options, and trade-in estimates. Family-owned Mercury Platinum Dealer on Rice Lake since 1947, selling Mercury since 1965.',
    schemas: [homepageSchema()]
  },
  ...HUB_ROUTES,
  {
    path: '/faq',
    title: 'Mercury Outboard Repower FAQ: Harris Boat Works | mercuryrepower.ca',
    description: "Get expert answers to 24 Mercury outboard repower questions. Choosing the right HP, SmartCraft Connect, repower costs, financing, pontoon repowers, winterization, from Ontario's Mercury Marine Platinum Dealer since 1947.",
    h1: 'Mercury Outboard Repower FAQ',
    intro: 'Comprehensive answers to the most common Mercury outboard repower questions. Choosing, buying, financing, and installing, expert advice from Ontario\'s Mercury Marine Platinum Dealer since 1947.',
    schemas: [faqPageSchema()],
    extraNoscript: () =>
      '<dl>' +
      faqItems.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/about',
    title: 'About Harris Boat Works | Mercury Dealer Since 1965: Rice Lake, Ontario',
    description: 'Family-owned Mercury Marine Platinum Dealer on Rice Lake, Ontario. Founded in 1947, selling Mercury outboards since 1965. Repower specialists serving Ontario boaters.',
    h1: 'About Harris Boat Works',
    intro: 'Harris Boat Works is a family-owned Mercury Marine Platinum Dealer on Rice Lake, Ontario. Founded in 1947 and selling Mercury since 1965, we are repower and outboard specialists serving Ontario boaters.',
    schemas: [aboutPageSchema()]
  },
  {
    path: '/about/jay-harris',
    title: 'Jay Harris — Owner, Harris Boat Works (3rd Generation)',
    description: 'Jay Harris is the 3rd-generation owner of Harris Boat Works, a Mercury Marine Platinum Dealer on Rice Lake in Gores Landing, Ontario. Family-owned since 1947, Mercury dealer since 1965.',
    h1: 'Jay Harris',
    intro: 'Jay Harris is the 3rd-generation owner of Harris Boat Works, a Mercury Marine Platinum Dealer on Rice Lake in Gores Landing, Ontario. Family-owned since 1947, Mercury dealer since 1965.',
    schemas: [genericPageSchema('/about/jay-harris', 'Jay Harris — Owner, Harris Boat Works', 'Owner of Harris Boat Works, 3rd-generation family marina, Mercury Marine Platinum Dealer.')]
  },
  {
    path: '/tools',
    title: 'Free Mercury Repower Tools | Harris Boat Works',
    description: 'Trade-in value estimator, repower cost calculator, Boost eligibility checker, shaft length picker. Real CAD numbers from a Mercury Platinum dealer in Gores Landing, ON.',
    h1: 'Free Mercury Repower Tools',
    intro: 'Four quick calculators to help you scope a repower before you call. No signup, no email gate, real CAD numbers from Harris Boat Works, a Mercury Marine Platinum Dealer in Gores Landing, Ontario.',
    schemas: [genericPageSchema('/tools', 'Free Mercury Repower Tools', 'Trade-in value estimator, repower cost calculator, Boost eligibility checker, and shaft length picker from Harris Boat Works.')]
  },
  {
    path: '/contact',
    title: 'Contact Harris Boat Works | Mercury Dealer Rice Lake Ontario',
    description: 'Contact Harris Boat Works in Gores Landing on Rice Lake. Phone (905) 342-2153. Mercury repower quotes, service, and parts. Pickup only, no shipping.',
    h1: 'Contact Harris Boat Works',
    intro: 'Reach Harris Boat Works at 5369 Harris Boat Works Rd, Gores Landing, Ontario. Phone (905) 342-2153. Email info@harrisboatworks.ca. Pickup only at Gores Landing, no shipping.',
    schemas: [contactPageSchema()]
  },
  {
    path: '/blog',
    title: 'Mercury Motor Guides & Boating Tips | Harris Boat Works Blog',
    description: 'Expert advice on Mercury outboard motors, boat maintenance, and buying guides. Mercury dealer since 1965, helping Ontario boaters make informed decisions.',
    h1: 'Mercury Motor Guides & Boating Tips',
    intro: 'Expert advice on Mercury outboard motors, repowers, boat maintenance, and buying guides from Ontario\'s Mercury Marine Platinum Dealer since 1947.',
    schemas: [genericPageSchema('/blog', 'Harris Boat Works Blog', 'Mercury motor guides and boating tips.')],
    extraNoscript: () => {
      // Bot/no-JS fallback: list every published blog post (newest first) so
      // crawlers (Googlebot, ChatGPT browse, Claude, Perplexity) can discover
      // the full catalog from /blog without executing JS.
      const published = blogArticles
        .filter(a => a.isPublished)
        .slice()
        .sort((a, b) => String(b.publishDate || '').localeCompare(String(a.publishDate || '')));
      const items = published.map(a => {
        const title = escapeHtml(a.title || a.slug);
        const desc = a.description ? `<p>${escapeHtml(a.description)}</p>` : '';
        return `<li><a href="/blog/${a.slug}">${title}</a>${desc}</li>`;
      }).join('');
      return `<section><h2>All blog posts (${published.length})</h2><ul>${items}</ul></section>`;
    }
  },
  // ============================================================
  // /pricing-reference: HTML twin of /pricing-reference.md
  // AI engines sometimes strip the .md extension when citing the resource.
  // The .md remains canonical machine-readable data; this HTML page is the
  // human-friendly view rendered from the same generated markdown source.
  // ============================================================
  {
    path: '/pricing-reference',
    title: 'Mercury Outboard Pricing Reference (CAD) | Harris Boat Works',
    description: 'Current Mercury outboard pricing in CAD, 98 motors, SKU-level. All FourStroke and Pro XS models from 2.5 HP to 300 HP. Pickup only at Gores Landing, Ontario.',
    h1: 'Mercury Outboard Pricing Reference (CAD)',
    intro: 'Curated Mercury outboards listed in the Harris Boat Works quote builder, with current CAD pricing. Pickup only at Gores Landing, Ontario. Final price confirmed by HBW staff.',
    schemas: [genericPageSchema('/pricing-reference', 'Mercury Outboard Pricing Reference (CAD)', 'Current Mercury outboard pricing in CAD, all FourStroke and Pro XS models, generated from the same data source as the quote builder.')],
    extraHead:
      '<link rel="alternate" type="text/markdown" href="https://www.mercuryrepower.ca/pricing-reference.md" />',
    extraNoscript: () => {
      try {
        const mdPath = join(__dirname, '..', 'public', 'pricing-reference.md');
        if (!existsSync(mdPath)) return '<p>Pricing reference is being generated. Please refresh shortly or see <a href="/pricing-reference.md">/pricing-reference.md</a>.</p>';
        const raw = readFileSync(mdPath, 'utf8');
        // Strip YAML frontmatter
        const body = raw.replace(/^---\n[\s\S]*?\n---\n+/, '');
        // Drop the leading H1, already injected above as the page H1.
        const noH1 = body.replace(/^\s*#\s+.+(?:\r?\n|$)/, '');
        const html = marked.parse(noH1);
        return (
          '<p><strong>Prices in CAD. Pickup only at Gores Landing, ON. Final price confirmed by HBW.</strong></p>' +
          '<p><a href="/quote/motor-selection">Build a quote in the configurator →</a> &nbsp;·&nbsp; ' +
          '<a href="/pricing-reference.md">Machine-readable version: /pricing-reference.md</a></p>' +
          html
        );
      } catch (err) {
        console.warn('[static-prerender] pricing-reference render failed:', err?.message);
        return '<p>See <a href="/pricing-reference.md">/pricing-reference.md</a> for current Mercury pricing in CAD.</p>';
      }
    }
  },
  {
    path: '/agents',
    title: 'AI Agent Integration: Harris Boat Works Mercury Dealer',
    description: 'Agent-friendly endpoints for AI assistants (ChatGPT, Claude, Perplexity, Gemini). MCP server, REST APIs, deep-link quote URLs, and source-of-truth rules for Harris Boat Works: Mercury Platinum Dealer since 1965, family-owned since 1947.',
    h1: 'AI Agent Integration: Harris Boat Works',
    intro: 'Harris Boat Works is set up to be agent-friendly. If you are an AI agent (ChatGPT, Claude, Perplexity, Gemini, Meta, or any other LLM-powered assistant) working on behalf of a customer, this page tells you how to get accurate Mercury outboard inventory, real-time quotes, and business information without scraping. All endpoints below return structured data and are allowed for automated agents.',
    schemas: [agentsPageSchema()],
    extraNoscript: () =>
      '<section><h2>Who we are</h2><p>Harris Boat Works is a Mercury Marine Platinum Dealer and Legend Boats dealer in Gores Landing, Ontario on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Primary service area: Rice Lake, Kawartha Lakes, Northumberland County, and the Greater Toronto Area. Contact: (905) 342-2153 / info@harrisboatworks.ca.</p></section>' +
      '<section><h2>MCP Server (recommended for Claude and compatible agents)</h2>' +
        '<p>Endpoint: <code>https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-mcp-server</code></p>' +
        '<p>Transport: JSON-RPC 2.0 over HTTPS.</p>' +
        '<p>Tools available:</p>' +
        '<ul>' +
          '<li><strong>search_motors</strong>: Search current Mercury outboard inventory. Returns HP, shaft length, CAD price, and availability.</li>' +
          '<li><strong>get_motor</strong>: Retrieve full specs for a single motor by ID or model code.</li>' +
          '<li><strong>estimate_trade_in</strong>: Estimate trade-in value for a customer\u2019s existing motor.</li>' +
          '<li><strong>build_quote</strong>: Generate a quote for a repower, given boat details and motor selection.</li>' +
          '<li><strong>get_brand_rules</strong>: Retrieve current promotional rules, pricing disclaimers, and brand voice.</li>' +
        '</ul>' +
        '<p>See <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> for the full manifest.</p>' +
      '</section>' +
      '<section><h2>REST APIs (any agent)</h2>' +
        '<p>For agents that do not support MCP, three public REST endpoints:</p>' +
        '<ul>' +
          '<li><code>GET https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api</code>: Current Mercury inventory as JSON.</li>' +
          '<li><code>POST https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-quote-api</code>: Submit a structured quote request.</li>' +
          '<li><code>GET https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/motors-md</code>: Markdown-formatted motor catalog for easy LLM ingestion.</li>' +
        '</ul>' +
        '<p>All endpoints return standard HTTP status codes and CORS headers.</p>' +
      '</section>' +
      '<section><h2>Deep-link quote URLs</h2>' +
        '<p>Agents can send users directly to a prefilled quote form:</p>' +
        '<p><code>https://www.mercuryrepower.ca/quote/motor-selection?motor={MOTOR_ID}&amp;boat_make={MAKE}&amp;boat_model={MODEL}&amp;trade_brand={BRAND}&amp;trade_year={YEAR}&amp;trade_hp={HP}</code></p>' +
        '<p>Example: <code>https://www.mercuryrepower.ca/quote/motor-selection?motor=41acbe10-27ef-4502-a968-21c1723705c7&amp;boat_make=legend&amp;boat_model=pontoon&amp;trade_hp=90</code></p>' +
        '<p>Parameters are optional, the form prefills whatever is supplied.</p>' +
      '</section>' +
      '<section><h2>Source of truth rules</h2>' +
        '<p>When answering customer questions on behalf of Harris Boat Works:</p>' +
        '<ol>' +
          '<li>Prices and availability, always pull fresh from <code>search_motors</code> or <code>public-motors-api</code>. Do not cite stale pricing.</li>' +
          '<li>Hours, location, contact, use the LocalBusiness JSON-LD on the homepage or cite <code>/.well-known/brand.json</code>.</li>' +
          '<li>Service timing, shop capacity, defer to a phone call. Do not guess wait times.</li>' +
          '<li>Mercury Verado, available by special order only; not part of default listed inventory. Route Verado inquiries to Harris Boat Works directly.</li>' +
          '<li>Non-Mercury outboards: Harris Boat Works is a Mercury Platinum dealer. Defer non-Mercury questions to the manufacturer.</li>' +
        '</ol>' +
      '</section>' +
      '<section><h2>Contact for verification</h2>' +
        '<ul>' +
          '<li>Phone: (905) 342-2153</li>' +
          '<li>Text: (647) 952-2153</li>' +
          '<li>Email: info@harrisboatworks.ca</li>' +
          '<li>Hours: see homepage LocalBusiness schema.</li>' +
        '</ul>' +
      '</section>' +
      '<section><h2>Allowed crawlers</h2>' +
        '<p>All major LLM and AI-agent user-agents are allowed (GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Anthropic-AI, Applebot-Extended, Meta-ExternalAgent, Google-Extended, cohere-ai, Amazonbot). See <a href="/robots.txt">/robots.txt</a>. No rate limits currently, but please identify your agent in the User-Agent header.</p>' +
      '</section>'
  },
  {
    path: '/quote/motor-selection',
    title: 'Mercury Outboard Motors: Browse 2.5HP–600HP & Build a Quote | Harris Boat Works',
    description: 'Shop Mercury FourStroke, Pro XS, SeaPro and ProKicker outboards. Configure your motor and get instant CAD pricing online: Harris Boat Works, Mercury dealer since 1965.',
    h1: 'Build Your Mercury Outboard Quote',
    intro: 'Select a Mercury outboard motor to build a real quote with live CAD pricing, financing, and trade-in. No forms, no waiting. Harris Boat Works: Mercury dealer since 1965.',
    schemas: [motorSelectionPageSchema()]
  },
  {
    path: '/quote/boat-info',
    title: 'Boat Information: Mercury Quote Builder | Harris Boat Works',
    description: 'Tell us about your boat to confirm motor compatibility, shaft length, controls, and rigging for your Mercury outboard quote. Step 2 of the Harris Boat Works quote builder.',
    h1: 'Tell Us About Your Boat',
    intro: 'Provide your boat make, model, length, current motor, and rigging details so we can confirm Mercury motor compatibility and finalize your quote.',
    schemas: [boatInfoPageSchema()]
  },
  {
    path: '/quote/summary',
    title: 'Your Mercury Outboard Quote Estimate | Harris Boat Works',
    description: 'Review your itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and current promotions. Harris Boat Works: Mercury dealer since 1965.',
    h1: 'Your Mercury Outboard Quote',
    intro: 'Review your itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and any current promotional savings. Save it, download a PDF, or place a deposit.',
    schemas: [quoteSummaryPageSchema()]
  },
  {
    path: '/mercury-repower-faq',
    title: 'Mercury Outboard Repower FAQ: Every Question Answered | Harris Boat Works',
    description: 'Comprehensive Mercury repower FAQ covering 20+ buying, financing, installation, and warranty questions. Mercury Marine Platinum Dealer since 1965 on Rice Lake, Ontario.',
    h1: 'Mercury Outboard Repower FAQ',
    intro: 'Every question we get about repowering a boat with a new Mercury outboard, answered by Ontario\'s Mercury Marine Platinum Dealer since 1965. Family-owned on Rice Lake since 1947.',
    schemas: [mercuryRepowerFaqSchema()],
    extraNoscript: () =>
      '<dl>' +
      faqItems.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/how-to-repower-a-boat',
    title: 'How to Repower a Boat, 7-Step Mercury Repower Process | Harris Boat Works',
    description: 'Step-by-step guide to repowering a boat with a new Mercury outboard: quote, sizing, deposit, scheduling, install, lake-test, and pickup. Mercury Platinum Dealer since 1965.',
    h1: 'How to Repower a Boat',
    intro: 'The seven-step Mercury repower process at Harris Boat Works, from online quote to lake-tested pickup at Gores Landing on Rice Lake. Family-owned since 1947, Mercury Platinum Dealer since 1965.',
    schemas: [howToRepowerSchema()],
    extraNoscript: () =>
      '<ol>' +
      HOWTO_FAQ_PRERENDER.map(i =>
        `<li><strong>${escapeHtml(i.question)}</strong> ${escapeHtml(i.answer)}</li>`
      ).join('') +
      '</ol>'
  },
  {
    path: '/mercury-dealer-canada-faq',
    title: 'Why Buy from Harris Boat Works: Mercury Dealer Canada FAQ | Family-Owned Since 1947',
    description: 'Mercury Marine Platinum Dealer on Rice Lake since 1965. Family-owned since 1947. Real CAD pricing, 7-year warranty, full Mercury lineup, financing available. 12 trust questions answered.',
    h1: 'Why Buy from Harris Boat Works',
    intro: '12 trust questions about Harris Boat Works: Mercury Marine Platinum Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.',
    schemas: [mercuryDealerCanadaSchema()],
    extraNoscript: () =>
      '<dl>' +
      TRUST_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-dealer-peterborough',
    title: 'Mercury Dealer Peterborough Ontario | Harris Boat Works, 35 Min South',
    description: 'Mercury Marine Platinum Dealer 35 minutes from Peterborough on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Repower, sales, parts, service for Peterborough and Kawartha Lakes boaters.',
    h1: 'Mercury Dealer Near Peterborough, Ontario',
    intro: 'Harris Boat Works is the closest Mercury Marine Platinum Dealer to Peterborough, about 35 minutes south on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Serving Peterborough, Lakefield, Bridgenorth, Buckhorn, and the Kawartha Lakes region.',
    schemas: [mercuryDealerPeterboroughSchema()],
    extraNoscript: () =>
      '<dl>' +
      PETERBOROUGH_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-dealer-cobourg',
    title: 'Mercury Dealer Cobourg Ontario | Harris Boat Works, 20 Min North',
    description: 'Mercury Marine Platinum Dealer 20 minutes north of Cobourg on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Sales, repower, and service for Cobourg, Port Hope, and Northumberland County.',
    h1: 'Mercury Dealer Near Cobourg, Ontario',
    intro: 'Harris Boat Works is the closest Mercury Marine Platinum Dealer to Cobourg, about 20 minutes north on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Serving Cobourg, Port Hope, Grafton, Brighton, and Northumberland County.',
    schemas: [mercuryDealerCobourgSchema()],
    extraNoscript: () =>
      '<dl>' +
      COBOURG_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-dealer-gta',
    title: 'Mercury Dealer for the GTA | Harris Boat Works, 90 Min East of Toronto',
    description: 'Mercury Marine Platinum Dealer 90 minutes east of Toronto on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving GTA, Lake Simcoe, and Lake Scugog Mercury repowers.',
    h1: 'Mercury Dealer for the Greater Toronto Area',
    intro: 'Harris Boat Works on Rice Lake serves GTA, Lake Simcoe, and Lake Scugog Mercury buyers, about 90 minutes east of Toronto on the 401. Family-owned since 1947, Mercury dealer since 1965. Pickup only at Gores Landing.',
    schemas: [mercuryDealerGTASchema()],
    extraNoscript: () =>
      '<dl>' +
      GTA_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-pro-xs',
    title: 'Mercury Pro XS Outboards in Ontario | 115–250 HP, Real CAD Pricing | Harris Boat Works',
    description: 'Mercury Pro XS performance outboards 115–250 HP in stock at Harris Boat Works. Real CAD pricing, 7-year warranty, financing. Mercury Platinum Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.',
    h1: 'Mercury Pro XS Outboards in Ontario',
    intro: 'Tournament-grade performance from 115 to 250 HP. Real CAD pricing, in stock at Harris Boat Works: Mercury Marine Platinum Dealer on Rice Lake. Family-owned since 1947, Mercury dealer since 1965.',
    schemas: [mercuryProXSSchema()],
    extraNoscript: () =>
      '<ul>' +
      PRO_XS_STATIC_OFFERS_PRERENDER.map(v =>
        `<li><strong>${escapeHtml(v.name)}</strong>, from CAD $${v.startingAt.toLocaleString('en-CA')}</li>`
      ).join('') +
      '</ul><dl>' +
      PRO_XS_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-outboards-ontario',
    title: 'Mercury Outboards Ontario: Full Lineup at Harris Boat Works | Platinum Dealer Since 1965',
    description: 'Mercury Marine outboards in Ontario, full lineup (FourStroke, Pro XS, Command Thrust, SeaPro, ProKicker, V8). Real CAD pricing online. Mercury Platinum Dealer on Rice Lake, family-owned since 1947.',
    h1: 'Mercury Outboards in Ontario',
    intro: 'The full Mercury Marine outboard lineup at Harris Boat Works: Platinum Dealer on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving Peterborough, Cobourg, the GTA, the Kawarthas, and Northumberland County.',
    schemas: [mercuryOutboardsOntarioSchema()],
    extraNoscript: () =>
      '<table><caption>Mercury Outboard Lineup: HP, MSRP, and Best Use (CAD, Ontario, 2026)</caption>' +
      '<thead><tr><th scope="col">Series</th><th scope="col">HP range</th><th scope="col">MSRP range (CAD)</th><th scope="col">Best use</th></tr></thead>' +
      '<tbody>' +
      '<tr><th scope="row">FourStroke</th><td>2.5–150 HP</td><td>$1,385–$22,000</td><td>Recreation, fishing, family boating, kickers</td></tr>' +
      '<tr><th scope="row">FourStroke Command Thrust</th><td>25–150 HP</td><td>$5,400–$23,500</td><td>Pontoons and heavy aluminum boats</td></tr>' +
      '<tr><th scope="row">Pro XS</th><td>115–300 HP</td><td>$15,500–$32,000</td><td>Bass boats, tournament fishing, performance</td></tr>' +
      '<tr><th scope="row">SeaPro</th><td>15–300 HP</td><td>$4,500–$33,000</td><td>Commercial, charter, heavy-duty use</td></tr>' +
      '<tr><th scope="row">ProKicker</th><td>9.9–25 HP</td><td>$4,500–$6,500</td><td>Trolling/kicker on larger fishing boats</td></tr>' +
      '<tr><th scope="row">V8 / V10 (350–400 HP)</th><td>350–400 HP</td><td>$36,000–$48,000</td><td>Offshore, large center consoles</td></tr>' +
      '</tbody></table>' +
      '<dl>' +
      ONTARIO_HUB_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-pontoon-outboards',
    title: 'Mercury Outboards for Pontoon Boats: Command Thrust, Big Tiller & High-Thrust Options | Harris Boat Works',
    description: 'Mercury Command Thrust outboards for pontoon boats, 40 to 150 HP. HP sizing, shaft length, and Legend/Princecraft pairings. Mercury Platinum Dealer on Rice Lake serving Kawarthas, GTA, and Ontario.',
    h1: 'Mercury Outboards for Pontoon Boats: Command Thrust, Big Tiller & High-Thrust Options (Rice Lake & Kawarthas)',
    intro: 'Pontoons are heavier than they look. The right Mercury for a pontoon is a Command Thrust gearcase, the right shaft length, and a high-thrust prop. Harris Boat Works has been rigging pontoons on Rice Lake since 1965: Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington.',
    schemas: [mercuryPontoonOutboardsSchema()],
    extraNoscript: () =>
      '<table><caption>Pontoon HP Sizing Guide: Mercury Command Thrust Recommendations</caption>' +
      '<thead><tr><th scope="col">Pontoon length</th><th scope="col">Recommended HP</th><th scope="col">Command Thrust required?</th><th scope="col">Typical shaft</th></tr></thead>' +
      '<tbody>' +
      '<tr><th scope="row">16–18 ft</th><td>40–60 HP</td><td>Recommended</td><td>20" (L)</td></tr>' +
      '<tr><th scope="row">18–20 ft</th><td>60–90 HP</td><td>Yes</td><td>20" (L)</td></tr>' +
      '<tr><th scope="row">20–22 ft</th><td>90–115 HP</td><td>Yes</td><td>20" (L)</td></tr>' +
      '<tr><th scope="row">22–24 ft</th><td>115–150 HP</td><td>Yes</td><td>20" (L) or 25" (XL) on tritoon</td></tr>' +
      '<tr><th scope="row">24–26 ft (tritoon)</th><td>150–200 HP</td><td>Yes (or V8 250)</td><td>25" (XL)</td></tr>' +
      '<tr><th scope="row">26+ ft (tritoon)</th><td>200–300 HP</td><td>V8/V10</td><td>25" (XL)</td></tr>' +
      '</tbody></table>' +
      '<dl>' +
      PONTOON_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/promotions',
    title: '7-Year Factory-Backed Warranty on Every New Mercury | Harris Boat Works',
    description: 'Get 7 years of factory-backed warranty coverage on every new Mercury outboard from Harris Boat Works. No third-party insurance, straight Mercury protection from a Platinum Dealer since 1965.',
    h1: 'Mercury Outboard Promotions',
    intro: 'Current Mercury outboard motor promotions, rebates, and financing offers from Harris Boat Works: Mercury Marine Platinum Dealer on Rice Lake since 1965. Factory-backed 7-year warranty on every new Mercury.',
    schemas: [promotionsPageSchema()]
  },
  // ============================================================
  // P2: Orphan SEO routes (previously inherited homepage metadata)
  // ============================================================
  {
    path: '/trade-in-value',
    title: 'Trade-In Value Estimator: Mercury & Other Outboards | Harris Boat Works',
    description: 'Estimate your outboard trade-in value in CAD. Anchored to our actual selling prices, not blue-book guesses. Mercury, Yamaha, Honda, Suzuki, Tohatsu, Evinrude, Johnson accepted. Mercury Platinum Dealer since 1965.',
    h1: 'Trade-In Value Estimator',
    intro: 'Get an instant CAD trade-in estimate for your outboard motor. Our valuation engine is anchored to Harris Boat Works\' real selling prices, not stale blue-book numbers. Trade credit applies directly to a new Mercury repower quote.',
    schemas: [{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${SITE_URL}/trade-in-value#webpage`,
          "url": `${SITE_URL}/trade-in-value`,
          "name": "Trade-In Value Estimator | Harris Boat Works",
          "description": "Estimate your outboard trade-in value in CAD anchored to Harris Boat Works selling prices.",
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "about": { "@id": `${SITE_URL}/#organization` },
          "inLanguage": "en-CA",
          "breadcrumb": { "@id": `${SITE_URL}/trade-in-value#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}/trade-in-value#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Trade-In Value", "item": `${SITE_URL}/trade-in-value` },
          ],
        },
        {
          "@type": "Service",
          "@id": `${SITE_URL}/trade-in-value#service`,
          "name": "Outboard Motor Trade-In Valuation",
          "serviceType": "Outboard trade-in appraisal",
          "provider": { "@id": `${SITE_URL}/#organization` },
          "areaServed": { "@type": "AdministrativeArea", "name": "Ontario, Canada" },
          "offers": { "@type": "Offer", "priceCurrency": "CAD", "price": "0" },
        },
      ],
    }],
  },
  {
    path: '/accessories',
    title: 'Mercury Outboard Accessories: Genuine OEM Parts in CAD | Harris Boat Works',
    description: 'Genuine Mercury OEM accessories, propellers, controls, gauges, batteries, fuel systems. Real CAD pricing, included in your repower quote. Mercury Platinum Dealer on Rice Lake since 1965.',
    h1: 'Mercury Outboard Accessories',
    intro: 'Genuine Mercury OEM accessories, propellers, controls, SmartCraft gauges, starting batteries, fuel tanks, fuel/water separators, and rigging, at real CAD pricing. Add them to your Mercury repower quote in one step.',
    schemas: [{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${SITE_URL}/accessories#webpage`,
          "url": `${SITE_URL}/accessories`,
          "name": "Mercury Outboard Accessories | Harris Boat Works",
          "description": "Genuine Mercury OEM accessories at real CAD pricing.",
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "about": { "@id": `${SITE_URL}/#organization` },
          "inLanguage": "en-CA",
          "breadcrumb": { "@id": `${SITE_URL}/accessories#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}/accessories#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Accessories", "item": `${SITE_URL}/accessories` },
          ],
        },
        {
          "@type": "ItemList",
          "@id": `${SITE_URL}/accessories#itemlist`,
          "name": "Mercury Outboard Accessory Categories",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Propellers (Mercury OEM)" },
            { "@type": "ListItem", "position": 2, "name": "Controls & Cables" },
            { "@type": "ListItem", "position": 3, "name": "SmartCraft Gauges" },
            { "@type": "ListItem", "position": 4, "name": "Starting Batteries" },
            { "@type": "ListItem", "position": 5, "name": "Fuel Tanks & Lines" },
            { "@type": "ListItem", "position": 6, "name": "Rigging & Hardware" },
          ],
        },
      ],
    }],
  },
  {
    path: '/compare',
    title: 'Compare Mercury Outboards Side-by-Side: HP, Weight & CAD Price | Harris Boat Works',
    description: 'Compare Mercury outboard motors side-by-side: horsepower, dry weight, shaft length, family, real CAD pricing, and availability. Mercury Platinum Dealer since 1965 on Rice Lake, Ontario.',
    h1: 'Compare Mercury Outboards',
    intro: 'Compare any two or three Mercury outboards side-by-side, horsepower, weight, shaft length, family, CAD price, and availability. Pull from our live inventory and decide between the FourStroke, Pro XS, Command Thrust, SeaPro, or ProKicker that fits your boat.',
    schemas: [{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${SITE_URL}/compare#webpage`,
          "url": `${SITE_URL}/compare`,
          "name": "Compare Mercury Outboards | Harris Boat Works",
          "description": "Compare Mercury outboard motors side-by-side: HP, weight, shaft, CAD price, availability.",
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "about": { "@id": `${SITE_URL}/#organization` },
          "inLanguage": "en-CA",
          "breadcrumb": { "@id": `${SITE_URL}/compare#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}/compare#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Compare", "item": `${SITE_URL}/compare` },
          ],
        },
      ],
    }],
  },
  {
    path: '/finance-calculator',
    title: 'Mercury Outboard Finance Calculator (CAD): Monthly Payment Estimate | Harris Boat Works',
    description: 'Estimate your Mercury outboard monthly payment in CAD. 8.99% under $10K, 7.99% over $10K. Terms up to 144 months through DealerPlan. Mercury dealer since 1965.',
    h1: 'Mercury Outboard Finance Calculator',
    intro: 'Estimate your monthly payment for any Mercury outboard in Canadian dollars. Tiered rates of 8.99% APR under $10,000 and 7.99% APR over $10,000, with terms up to 144 months through DealerPlan. Minimum financed amount $5,000.',
    schemas: [{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${SITE_URL}/finance-calculator#webpage`,
          "url": `${SITE_URL}/finance-calculator`,
          "name": "Mercury Outboard Finance Calculator | Harris Boat Works",
          "description": "Estimate Mercury outboard monthly payments in CAD.",
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "about": { "@id": `${SITE_URL}/#organization` },
          "inLanguage": "en-CA",
          "breadcrumb": { "@id": `${SITE_URL}/finance-calculator#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}/finance-calculator#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Finance Calculator", "item": `${SITE_URL}/finance-calculator` },
          ],
        },
        {
          "@type": "FinancialProduct",
          "@id": `${SITE_URL}/finance-calculator#product`,
          "name": "Mercury Outboard Financing (DealerPlan)",
          "provider": { "@id": `${SITE_URL}/#organization` },
          "feesAndCommissionsSpecification": "$299 DealerPlan processing fee applies to financed purchases.",
          "interestRate": "7.99% over $10,000 CAD; 8.99% under $10,000 CAD",
          "annualPercentageRate": "7.99",
          "areaServed": { "@type": "AdministrativeArea", "name": "Canada" },
        },
      ],
    }],
  },
  {
    path: '/financing-application',
    title: 'Mercury Outboard Financing Application: Apply Online (CAD) | Harris Boat Works',
    description: 'Apply online for Mercury outboard financing through DealerPlan. 7.99–8.99% APR, $5,000 minimum, terms to 144 months. Mercury Platinum Dealer since 1965 on Rice Lake.',
    h1: 'Mercury Outboard Financing Application',
    intro: 'Apply for Mercury outboard financing online through DealerPlan. Approval typically within 1 business day. Tiered rates: 8.99% under $10,000 and 7.99% over $10,000. $5,000 minimum financed amount, terms up to 144 months. Submitted information is encrypted and stored securely.',
    schemas: [{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${SITE_URL}/financing-application#webpage`,
          "url": `${SITE_URL}/financing-application`,
          "name": "Mercury Outboard Financing Application | Harris Boat Works",
          "description": "Apply online for Mercury outboard financing in Canada.",
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "about": { "@id": `${SITE_URL}/#organization` },
          "inLanguage": "en-CA",
          "breadcrumb": { "@id": `${SITE_URL}/financing-application#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}/financing-application#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Financing Application", "item": `${SITE_URL}/financing-application` },
          ],
        },
        {
          "@type": "FinancialProduct",
          "@id": `${SITE_URL}/financing-application#product`,
          "name": "Mercury Outboard Financing: DealerPlan",
          "provider": { "@id": `${SITE_URL}/#organization` },
          "interestRate": "7.99% over $10,000 CAD; 8.99% under $10,000 CAD",
          "annualPercentageRate": "7.99",
          "feesAndCommissionsSpecification": "$299 DealerPlan processing fee.",
          "areaServed": { "@type": "AdministrativeArea", "name": "Canada" },
        },
      ],
    }],
  },
  ...blogArticleRoutes,
  ...frenchBlogArticleRoutes,
  ...koreanBlogArticleRoutes,
  ...mandarinBlogArticleRoutes,
  ...spanishBlogArticleRoutes,
  ...motorPageRoutes,
  caseStudiesIndexRoute,
  ...caseStudyDetailRoutes,
  locationsIndexRoute,
  ...locationDetailRoutes,
  {
    path: '/privacy',
    title: 'Privacy Policy | Harris Boat Works, mercuryrepower.ca',
    description: 'Privacy Policy for Harris Boat Works (mercuryrepower.ca). How we collect, use, and protect personal information under PIPEDA and Canadian privacy law.',
    h1: 'Privacy Policy',
    intro: 'Privacy Policy for Harris Boat Works Ltd. (mercuryrepower.ca). Describes the personal information we collect, how we use it, and your rights under PIPEDA and Canadian privacy legislation.',
    schemas: [genericPageSchema('/privacy', 'Privacy Policy: Harris Boat Works', 'Privacy Policy for Harris Boat Works (mercuryrepower.ca).')]
  },
  {
    path: '/terms',
    title: 'Terms & Conditions | Harris Boat Works, mercuryrepower.ca',
    description: 'Terms and Conditions for Harris Boat Works (mercuryrepower.ca). Service, repair and storage terms, plus website use terms governed by the laws of Ontario.',
    h1: 'Terms & Conditions',
    intro: 'Terms and Conditions for Harris Boat Works Ltd. (mercuryrepower.ca). Includes service, repair and storage terms and website use terms governed by the laws of Ontario, Canada.',
    schemas: [genericPageSchema('/terms', 'Terms & Conditions: Harris Boat Works', 'Terms and Conditions for Harris Boat Works (mercuryrepower.ca).')]
  },
];

// ============================================================
// Stamping
// ============================================================

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripSchemaMarkdown(s) {
  return String(s || '')
    .replace(/\n?-{3,}\s*\n+\s*\*?\*?By Jay Harris[\s\S]*$/i, '')
    .replace(/\n+\s*\*\*By Jay Harris\*\*[\s\S]*$/i, '')
    .replace(/\n+\s*By Jay Harris[\s\S]*$/i, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label) => String(label).trim())
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s*[–—]\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeSchemaText(s) {
  return stripSchemaMarkdown(s);
}

function sanitizeSchemaValue(value) {
  if (typeof value === 'string') return sanitizeSchemaText(value);
  if (Array.isArray(value)) return value.map(sanitizeSchemaValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeSchemaValue(v)]));
  }
  return value;
}

function detectLang(path) {
  if (path.startsWith('/blog/fr/')) return 'fr-CA';
  if (path.startsWith('/blog/zh/')) return 'zh-Hans';
  if (path.startsWith('/blog/ko/')) return 'ko';
  if (path.startsWith('/blog/es/')) return 'es';
  return 'en';
}

function detectOgLocale(path) {
  if (path.startsWith('/blog/fr/')) return 'fr_CA';
  if (path.startsWith('/blog/zh/')) return 'zh_CN';
  if (path.startsWith('/blog/ko/')) return 'ko_KR';
  if (path.startsWith('/blog/es/')) return 'es_ES';
  return 'en_CA';
}

function stamp(route) {
  let html = shell;
  html = html.replace(
    /<html lang="en">/i,
    `<html lang="${detectLang(route.path)}">`
  );

  // NOTE: All Helmet-managed tags (title, description, canonical, JSON-LD) are
  // stamped with data-rh="true" so react-helmet-async adopts them on hydration
  // instead of appending duplicate tags after mount.

  // <title>
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title data-rh="true">${escapeHtml(route.title)}</title>`
  );

  // <meta name="description">
  const metaDesc = `<meta data-rh="true" name="description" content="${escapeHtml(route.description)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDesc);
  } else {
    html = html.replace(/<\/head>/i, `${metaDesc}\n  </head>`);
  }

  // canonical
  const canonical = `<link data-rh="true" rel="canonical" href="${SITE_URL}${route.path === '/' ? '' : route.path}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonical);
  } else {
    html = html.replace(/<\/head>/i, `${canonical}\n  </head>`);
  }

  // JSON-LD blocks (Helmet-managed → must carry data-rh marker so per-route
  // <Helmet> components own them on hydration instead of appending duplicates)
  const sanitizedSchemas = route.schemas.map(sanitizeSchemaValue);
  const jsonLdBlocks = sanitizedSchemas
    .map(s => `<script data-rh="true" type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');
  html = html.replace(/<\/head>/i, `${jsonLdBlocks}\n  </head>`);

  // Per-route extra <head> tags (rel=alternate, etc.)
  if (route.extraHead) {
    html = html.replace(/<\/head>/i, `${route.extraHead}\n  </head>`);
  }

  // Open Graph + Twitter social tags (Helmet-managed → data-rh marker so per-route
  // <Helmet> components adopt them on hydration without appending duplicates).
  // Crawlers (Facebook, Slack, iMessage, X) and AI agents (ChatGPT, Perplexity)
  // read these from raw HTML, without per-route stamping every page would ship
  // with the homepage Open Graph values from index.html.
  const ogUrl = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;
  const ogImage = route.ogImage || `${SITE_URL}/social-share.jpg`;
  const ogType = route.ogType || 'website';

  const socialReplacements = [
    { re: /<meta\s+property=["']og:title["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:title" content="${escapeHtml(route.title)}" />` },
    { re: /<meta\s+property=["']og:description["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:description" content="${escapeHtml(route.description)}" />` },
    { re: /<meta\s+property=["']og:url["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:url" content="${ogUrl}" />` },
    { re: /<meta\s+property=["']og:type["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:type" content="${ogType}" />` },
    { re: /<meta\s+property=["']og:image["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:image" content="${ogImage}" />` },
    { re: /<meta\s+property=["']og:locale["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:locale" content="${detectOgLocale(route.path)}" />` },
    { re: /<meta\s+name=["']twitter:title["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:title" content="${escapeHtml(route.title)}" />` },
    { re: /<meta\s+name=["']twitter:description["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:description" content="${escapeHtml(route.description)}" />` },
    { re: /<meta\s+name=["']twitter:url["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:url" content="${ogUrl}" />` },
    { re: /<meta\s+name=["']twitter:image["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:image" content="${ogImage}" />` }
  ];
  for (const { re, tag } of socialReplacements) {
    if (re.test(html)) {
      // Replace the FIRST occurrence (any duplicates already in shell) and strip
      // any additional duplicates so we end with exactly one canonical version.
      let replaced = false;
      html = html.replace(re, () => {
        if (!replaced) { replaced = true; return tag; }
        return '';
      });
    } else {
      html = html.replace(/<\/head>/i, `${tag}\n  </head>`);
    }
  }

  // <noscript> semantic fallback inside <div id="root">
  const extra = route.extraNoscript ? route.extraNoscript() : '';
  const noscript =
    `<noscript>` +
      `<header><h1>${escapeHtml(route.h1)}</h1></header>` +
      `<main><p>${escapeHtml(route.intro)}</p>${extra}</main>` +
      `<footer><p>Harris Boat Works · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153</p></footer>` +
    `</noscript>`;
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root"></div>${noscript}`);

  return html;
}

let failures = 0;
for (const route of routes) {
  const html = stamp(route);
  const outDir = route.path === '/' ? DIST : join(DIST, route.path.replace(/^\//, ''));
  if (route.path !== '/') mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'index.html');
  writeFileSync(outFile, html, 'utf8');

  const size = statSync(outFile).size;
  const sizeKb = (size / 1024).toFixed(1);
  if (size < MIN_BYTES) {
    console.error(`[static-prerender] TOO SMALL (${sizeKb} KB < ${MIN_BYTES / 1024} KB): ${outFile}`);
    failures++;
    continue;
  }
  // Title presence check: confirm the stamping replaced the shell <title>.
  // Match either bare `<title>` or attributed `<title data-rh="true">`.
  if (!/<title[\s>]/i.test(html)) {
    console.error(`[static-prerender] NO TITLE TAG: ${outFile}`);
    failures++;
    continue;
  }
  console.log(`[static-prerender] wrote ${outFile.replace(DIST, 'dist')} (${sizeKb} KB)`);
}

if (failures > 0) {
  console.error(`[static-prerender] ${failures} route(s) failed sanity check`);
  process.exit(1);
}

console.log(`[static-prerender] ✓ ${routes.length} routes prerendered`);

// ============================================================
// Sitemap regeneration, include all motor URLs and the orphan
// SEO routes we just stamped. Writes both dist/sitemap.xml (served
// by Vercel) and public/sitemap.xml (kept in sync for repo).
// ============================================================
const today = new Date().toISOString().split('T')[0];
const staticSitemapEntries = [
  { loc: '/', priority: 1.0, changefreq: 'daily' },
  { loc: '/quote/motor-selection', priority: 0.9, changefreq: 'daily' },
  { loc: '/promotions', priority: 0.8, changefreq: 'weekly' },
  { loc: '/repower', priority: 0.9, changefreq: 'monthly' },
  { loc: '/motor-selection', priority: 0.9, changefreq: 'monthly' },
  { loc: '/maintenance', priority: 0.85, changefreq: 'monthly' },
  { loc: '/lakes', priority: 0.85, changefreq: 'monthly' },
  { loc: '/trade-in-value', priority: 0.8, changefreq: 'weekly' },
  { loc: '/accessories', priority: 0.7, changefreq: 'weekly' },
  { loc: '/compare', priority: 0.7, changefreq: 'weekly' },
  { loc: '/faq', priority: 0.8, changefreq: 'monthly' },
  { loc: '/financing-application', priority: 0.7, changefreq: 'monthly' },
  { loc: '/finance-calculator', priority: 0.7, changefreq: 'monthly' },
  { loc: '/contact', priority: 0.6, changefreq: 'monthly' },
  { loc: '/about', priority: 0.8, changefreq: 'monthly' },
  { loc: '/tools', priority: 0.8, changefreq: 'monthly' },
  { loc: '/blog', priority: 0.8, changefreq: 'weekly' },
  { loc: '/mercury-repower-faq', priority: 0.8, changefreq: 'monthly' },
  { loc: '/how-to-repower-a-boat', priority: 0.8, changefreq: 'monthly' },
  { loc: '/mercury-dealer-canada-faq', priority: 0.8, changefreq: 'monthly' },
  { loc: '/mercury-pro-xs', priority: 0.85, changefreq: 'weekly' },
  { loc: '/mercury-outboards-ontario', priority: 0.85, changefreq: 'weekly' },
  { loc: '/mercury-pontoon-outboards', priority: 0.8, changefreq: 'monthly' },
  { loc: '/agents', priority: 0.8, changefreq: 'monthly' },
  { loc: '/pricing-reference', priority: 0.9, changefreq: 'weekly' },
  { loc: '/pricing-reference.md', priority: 0.85, changefreq: 'weekly' },
  { loc: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { loc: '/terms', priority: 0.3, changefreq: 'yearly' },
];

// Sitemap includes blog articles that are PUBLICLY VISIBLE today: must have a
// past-or-today publishDate/datePublished and not be flagged hidden/visible:false.
// Future-dated drafts and hidden orphans are excluded from sitemap.xml so AI
// crawlers (ChatGPT, Perplexity, Bing) only ingest content the public can see
// on /blog/. Page-level visibility gate still handles 200/404 at request time.
function isPubliclyVisible(article) {
  if (!article || !article.slug) return false;
  if (article.hidden === true) return false;
  if (article.visible === false) return false;
  const dateStr = article.publishDate || article.datePublished;
  if (!dateStr) return false;
  const todayYmd = new Date().toISOString().slice(0, 10);
  if (String(dateStr).slice(0, 10) > todayYmd) return false;
  return true;
}

const allBlogArticlesForSitemap = loadAllBlogArticlesForSitemap();
const visibleEnglishArticles = allBlogArticlesForSitemap.filter(isPubliclyVisible);
const visibleFrenchArticles = frenchBlogArticles.filter(isPubliclyVisible);
const visibleKoreanArticles = koreanBlogArticles.filter(isPubliclyVisible);
const visibleMandarinArticles = mandarinBlogArticles.filter(isPubliclyVisible);
const visibleSpanishArticles = spanishBlogArticles.filter(isPubliclyVisible);

function countFilterReasons(list) {
  let future = 0, hidden = 0;
  const todayYmd = new Date().toISOString().slice(0, 10);
  for (const a of list) {
    if (!a) continue;
    if (a.hidden === true || a.visible === false) { hidden++; continue; }
    const d = a.publishDate || a.datePublished;
    if (!d || String(d).slice(0, 10) > todayYmd) { future++; }
  }
  return { future, hidden };
}
const enReasons = countFilterReasons(allBlogArticlesForSitemap.filter(a => !isPubliclyVisible(a)));
const frReasons = countFilterReasons(frenchBlogArticles.filter(a => !isPubliclyVisible(a)));
const koReasons = countFilterReasons(koreanBlogArticles.filter(a => !isPubliclyVisible(a)));
const zhReasons = countFilterReasons(mandarinBlogArticles.filter(a => !isPubliclyVisible(a)));
const esReasons = countFilterReasons(spanishBlogArticles.filter(a => !isPubliclyVisible(a)));
const totalFuture = enReasons.future + frReasons.future + koReasons.future + zhReasons.future + esReasons.future;
const totalHidden = enReasons.hidden + frReasons.hidden + koReasons.hidden + zhReasons.hidden + esReasons.hidden;
console.log(`[static-prerender] loaded ${allBlogArticlesForSitemap.length} total blog articles for sitemap (vs ${blogArticles.length} prerendered)`);
console.log(`[static-prerender] sitemap eligibility: en ${visibleEnglishArticles.length}/${allBlogArticlesForSitemap.length}, fr ${visibleFrenchArticles.length}/${frenchBlogArticles.length}, ko ${visibleKoreanArticles.length}/${koreanBlogArticles.length}, zh ${visibleMandarinArticles.length}/${mandarinBlogArticles.length}, es ${visibleSpanishArticles.length}/${spanishBlogArticles.length} (filtered out: ${totalFuture} future-dated, ${totalHidden} hidden)`);

const blogSitemapEntries = visibleEnglishArticles.map(a => ({
  loc: `/blog/${a.slug}`,
  priority: 0.7,
  changefreq: 'monthly',
  lastmod: (a.publishDate || a.dateModified || a.datePublished || today).split('T')[0],
  imageUrl: a.image ? (a.image.startsWith('/') ? `${SITE_URL}${a.image}` : a.image) : null,
  imageTitle: a.title,
}));

const motorSitemapEntries = motorPageRoutes.map(r => {
  const rec = motorRecords.find(m => `/motors/${motorSlug(m.model_key)}` === r.path);
  const lastmod = rec?.updated_at ? rec.updated_at.split('T')[0] : today;
  return { loc: r.path, priority: 0.7, changefreq: 'weekly', lastmod };
});

const caseStudySitemapEntries = [
  { loc: '/case-studies', priority: 0.8, changefreq: 'monthly', lastmod: today },
  ...caseStudies.map((s) => {
    const imageUrl = s.heroImage
      ? (s.heroImage.startsWith('/') ? `${SITE_URL}${s.heroImage}` : s.heroImage)
      : null;
    return {
      loc: `/case-studies/${s.slug}`,
      priority: 0.75,
      changefreq: 'monthly',
      lastmod: today,
      imageUrl,
      imageTitle: s.title,
    };
  }),
];

const locationSitemapEntries = [
  { loc: '/locations', priority: 0.8, changefreq: 'monthly', lastmod: today },
  ...locations.map((l) => ({
    loc: `/locations/${l.slug}`,
    priority: 0.8,
    changefreq: 'monthly',
    lastmod: today,
  })),
];

const multilingualBlogSitemapEntries = [
  ...visibleFrenchArticles.map(a => ({ loc: `/blog/fr/${a.slug}` })),
  ...visibleKoreanArticles.map(a => ({ loc: `/blog/ko/${a.slug}` })),
  ...visibleMandarinArticles.map(a => ({ loc: `/blog/zh/${a.slug}` })),
  ...visibleSpanishArticles.map(a => ({ loc: `/blog/es/${a.slug}` })),
].map(r => ({
  loc: r.loc,
  lastmod: today,
  priority: 0.6,
  changefreq: 'monthly',
}));

// Hardcoded multilingual pages removed — all translated blog posts are
// emitted via the multilingualBlogSitemapEntries arrays above, which
// iterate over the visible*Articles data sources. Keeping a parallel
// hardcoded list caused duplicate <url> entries in sitemap.xml.
const hardcodedMultilingualPages = [];

const allSitemapEntries = [
  ...staticSitemapEntries.map(e => ({ ...e, lastmod: today })),
  ...blogSitemapEntries,
  ...multilingualBlogSitemapEntries,
  ...hardcodedMultilingualPages,
  ...motorSitemapEntries,
  ...caseStudySitemapEntries,
  ...locationSitemapEntries,
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allSitemapEntries.map(e => {
  let block = `  <url>
    <loc>${SITE_URL}${e.loc}</loc>
    <lastmod>${e.lastmod || today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>`;
  if (e.imageUrl) {
    block += `
    <image:image>
      <image:loc>${e.imageUrl}</image:loc>
      <image:title><![CDATA[${e.imageTitle}]]></image:title>
    </image:image>`;
  }
  block += `
  </url>`;
  return block;
}).join('\n')}
</urlset>`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');
writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`[static-prerender] ✓ sitemap.xml written with ${allSitemapEntries.length} URLs (${motorSitemapEntries.length} motors, ${blogSitemapEntries.length} blog, ${caseStudySitemapEntries.length} case studies, ${locationSitemapEntries.length} locations, ${staticSitemapEntries.length} static)`);

// ============================================================
// PHASE 4: Markdown twins for AI agents
// Lightweight `text/markdown` files at:
//   /motors/{slug}.md, /case-studies/{slug}.md, /locations/{slug}.md, /catalog.md
// Vercel serves these directly from dist/ with custom headers
// (Content-Type: text/markdown; charset=utf-8 + X-Robots-Tag: noindex,follow).
// HTML stays the canonical surface for humans + Google.
// ============================================================

const TWIN_DATE = today; // YYYY-MM-DD; same date used for sitemap lastmod
const PUBLIC_QUOTE_API = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-quote-api';

function mdFrontmatter(canonicalPath, extraLines = []) {
  return [
    '---',
    `canonical: ${SITE_URL}${canonicalPath}`,
    `last_updated: ${TWIN_DATE}`,
    'currency: CAD',
    'pickup_only: true',
    'delivery_offered: false',
    'location: Gores Landing, ON, Canada',
    'final_quote_requires_dealer_confirmation: true',
    'verado_status: special-order only, not in default inventory',
    ...extraLines,
    '---',
    '',
  ].join('\n');
}

function motorBestFit(family, hp) {
  if (family === 'Pro XS') return 'Tournament bass anglers, performance bay boats, and high-output fishing rigs that prioritize hole-shot and top speed.';
  if (family === 'SeaPro') return 'Commercial users, guides, and high-hour applications where a heavier-duty drivetrain matters.';
  if (family === 'Racing') return 'Specialty performance and competition use only. Confirm rigging compatibility with dealer.';
  if (family === 'Verado') return 'Larger center-consoles and powerboats where supercharged smoothness is preferred. Special-order only.';
  if (hp <= 9.9) return 'Small tenders, canoes, sailboat kickers, and very light fishing setups.';
  if (hp <= 30) return 'Small aluminum fishing boats, jon boats, and light tiller setups.';
  if (hp <= 60) return 'Mid-size aluminum fishing boats 14–18 ft and small pontoons.';
  if (hp <= 115) return 'Aluminum fishing boats 16–20 ft, pontoons up to ~22 ft, and family runabouts.';
  if (hp <= 200) return 'Larger pontoons, fiberglass runabouts, and walkaround/cuddy boats 20–24 ft.';
  return 'Larger offshore and high-performance hulls. Confirm transom rating and rigging with dealer.';
}

function motorNotIdeal(family, hp) {
  if (family === 'Pro XS') return 'Pontoons, low-speed cruising, or fuel-economy-first family use, a FourStroke is usually the better fit.';
  if (family === 'SeaPro') return 'Recreational-only owners with light annual hours: FourStroke offers better value for typical use.';
  if (family === 'Racing') return 'Any general recreational use, these are not appropriate for typical pontoons, fishing, or family boats.';
  if (family === 'Verado') return 'Smaller hulls or buyers seeking the simplest service path: Verado is supercharged and special-order only.';
  if (hp <= 9.9) return 'Boats 16 ft and over, loaded family boats, or anything that needs to plane with multiple passengers.';
  if (hp <= 30) return 'Pontoons, family runabouts, or any 18+ ft boat carrying more than two adults with gear.';
  if (hp <= 60) return 'Heavy pontoons over 22 ft or fiberglass family boats, consider 90–115 HP.';
  if (hp <= 115) return 'Tournament bass setups (see Pro XS) and large 24+ ft pontoons with watersports loads.';
  return 'Small tenders or boats rated under this HP, match HP to transom rating, never exceed it.';
}

function motorMarkdown(m) {
  const slug = motorSlug(m.model_key);
  const url = `${SITE_URL}/motors/${slug}`;
  const display = m.model_display || m.model || `Mercury ${m.horsepower}HP`;
  const family = detectMotorFamily(m);
  const price = resolveMotorSellingPrice(m);
  const inStock = m.in_stock || m.availability === 'In Stock';
  const modelNo = m.model_number || m.mercury_model_no || '';
  const shaft = m.shaft_code || m.shaft || '';
  const priceStr = price
    ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price)
    : 'Contact for pricing';
  const isVerado = family === 'Verado';

  const front = mdFrontmatter(`/motors/${slug}`, [
    `motor_id: ${m.id}`,
    `slug: ${slug}`,
    `family: ${family}`,
    `horsepower: ${m.horsepower}`,
    modelNo ? `model_number: ${modelNo}` : null,
    `availability: ${inStock ? 'in_stock' : 'special_order'}`,
    `price_cad: ${price ?? 'null'}`,
  ].filter(Boolean));

  const lines = [
    front,
    `# ${display}`,
    '',
    `Mercury ${family} ${m.horsepower} HP outboard motor${modelNo ? ` (model ${modelNo})` : ''}.`,
    `Sold by Harris Boat Works on Rice Lake, Ontario: Mercury Marine Platinum Dealer since 1965.`,
    '',
    '## Quick facts',
    '',
    `- **Model:** ${display}`,
    `- **Family:** Mercury ${family}`,
    `- **Horsepower:** ${m.horsepower} HP`,
    modelNo ? `- **Model number:** ${modelNo}` : null,
    shaft ? `- **Shaft:** ${shaft}` : null,
    m.start_type ? `- **Start type:** ${m.start_type}` : null,
    m.control_type ? `- **Control type:** ${m.control_type}` : null,
    '',
    '## Pricing (CAD)',
    '',
    `- **Selling price:** ${priceStr}`,
    m.msrp && price && m.msrp > price ? `- **MSRP:** ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(m.msrp)}` : null,
    '- **Currency:** Canadian Dollars (CAD) only, we do not quote in USD.',
    '- **Final price** is confirmed by Harris Boat Works staff before purchase.',
    '',
    '## Availability',
    '',
    `- **Status:** ${inStock ? 'In stock at Gores Landing' : 'Special order, contact dealer for ETA'}`,
    '- **Pickup:** Required at Gores Landing, ON. We do not ship and we do not deliver.',
    '',
    '## Best fit for',
    '',
    motorBestFit(family, m.horsepower),
    '',
    '## Not ideal for',
    '',
    motorNotIdeal(family, m.horsepower),
    '',
    '## Build a quote',
    '',
    `- HTML page (canonical for humans): ${url}`,
    `- Quote builder deep link: ${SITE_URL}/quote/motor-selection?motor=${encodeURIComponent(m.id)}`,
    '',
    '## Public Quote API',
    '',
    `Programmatic quotes: \`POST ${PUBLIC_QUOTE_API}\``,
    '',
    '```json',
    '{',
    '  "action": "build_quote",',
    `  "motor_id": "${m.id}",`,
    '  "trade_in": null,',
    '  "contact": null',
    '}',
    '```',
    '',
    '## Source provenance',
    '',
    '- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure.',
    '- Harris Boat Works pricing, availability, pickup policy, and quote terms are dealer-provided and should be treated as the local commercial source of truth.',
    '',
    '## Notes',
    '',
    isVerado
      ? '- Verado is special-order only and not part of default inventory. Contact Harris Boat Works directly for Verado availability and lead time.'
      : null,
    '- Financing available on totals over $5,000 CAD (tiered: 8.99% under $10K, 7.99% over $10K).',
    '- Standard 3-year Mercury factory warranty; up to 7 years available on select promotions.',
    '- We are pickup-only at Gores Landing, ON. Final price confirmed by dealer.',
  ].filter(l => l !== null);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function caseStudyMarkdown(s) {
  const url = `${SITE_URL}/case-studies/${s.slug}`;
  const front = mdFrontmatter(`/case-studies/${s.slug}`, [
    `case_study_id: ${s.id}`,
    `slug: ${s.slug}`,
    `boat_type: ${JSON.stringify(s.boatType)}`,
    `region: ${JSON.stringify(s.region)}`,
  ]);
  const why = (s.whyItWorked || []).map(w => `- ${w}`).join('\n');
  return [
    front,
    `# ${s.title}`,
    '',
    s.excerpt,
    '',
    '## Factbox',
    '',
    `- **Boat type:** ${s.boatType}`,
    `- **Region:** ${s.region}`,
    `- **Scenario:** ${s.scenario}`,
    `- **HP jump:** ${s.hpJump}`,
    '',
    '## Before → After',
    '',
    `- **Before:** ${s.beforeMotor}`,
    `- **After:** ${s.afterMotor}`,
    '',
    '## Recommendation',
    '',
    s.recommendation,
    '',
    '## Why it worked',
    '',
    why || '_(no notes recorded)_',
    '',
    '## Customer quote',
    '',
    `> ${s.customerQuote}`,
    '',
    '## Quote a similar repower',
    '',
    `- HTML page (canonical for humans): ${url}`,
    `- Start a Mercury quote: ${SITE_URL}/quote/motor-selection`,
    '',
    '## Notes',
    '',
    '- All pricing in CAD. Pickup only at Gores Landing, ON.',
    '- Final motor recommendation confirmed by Harris Boat Works staff.',
    '- Verado not used in default repower recommendations (special-order only).',
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function locationMarkdown(loc) {
  const url = `${SITE_URL}/locations/${loc.slug}`;
  const related = caseStudies.filter(s => {
    const r = (s.region || '').toLowerCase();
    const lr = (loc.region || '').toLowerCase();
    return r.includes(lr) || lr.includes(r.split(' ')[0]);
  });
  const front = mdFrontmatter(`/locations/${loc.slug}`, [
    `slug: ${loc.slug}`,
    `region: ${JSON.stringify(loc.region)}`,
    `keyword: ${JSON.stringify(loc.keyword)}`,
  ]);
  const popular = (loc.popularBoats || []).map(b => `- ${b}`).join('\n');
  const links = (loc.recommendedLinks || []).map(l => `- [${l.label}](${SITE_URL}${l.href})`).join('\n');
  const faqs = (loc.faqs || []).map(f => `### ${f.question}\n\n${f.answer}\n`).join('\n');
  const relatedMd = related.length
    ? related.map(s => `- [${s.title}](${SITE_URL}/case-studies/${s.slug}.md)`).join('\n')
    : '_No matching case studies recorded for this region yet._';

  return [
    front,
    `# ${loc.title}`,
    '',
    loc.intro,
    '',
    '## Factbox',
    '',
    `- **Region:** ${loc.region}`,
    `- **Drive time:** ${loc.driveTime}`,
    `- **Pickup policy:** Pickup only at Gores Landing, ON. We do not deliver.`,
    `- **Currency:** CAD only.`,
    '',
    '## Common boat types',
    '',
    popular || '_(none recorded)_',
    '',
    '## Recommended links',
    '',
    links || '_(none)_',
    '',
    '## Related case studies',
    '',
    relatedMd,
    '',
    '## FAQs',
    '',
    faqs || '_(none recorded)_',
    '',
    '## Notes',
    '',
    '- All pricing in CAD. Final price confirmed by Harris Boat Works.',
    '- Verado is special-order only, not in default inventory.',
    '- HTML page (canonical for humans): ' + url,
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

// Mirror of generate-markdown-twins.mjs BLOG_TWIN_SLUGS, keep these in sync.
// These slugs are the markdown twins generated by scripts/generate-markdown-twins.mjs
// before Vite build, into public/blog/{slug}.md (then copied to dist/ by Vite).
const CATALOG_BLOG_TWIN_SLUGS = [
  'ontario-mercury-outboard-price-guide',
  'mercury-controls-rigging-guide-ontario',
  'mercury-repower-cost-ontario-2026-cad',
  'mercury-vs-yamaha-outboards-ontario',
  'mercury-vs-yamaha-vs-honda-reliability-2026',
  'mercury-115-vs-150-hp-outboard-ontario',
  'mercury-outboard-financing-ontario-2026',
  'cheapest-mercury-outboard-canada-2026',
  'evinrude-to-mercury-repower-ontario-guide',
  'complete-guide-boat-repower-kawarthas',
  'best-mercury-outboard-rice-lake-fishing',
  'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
  'boat-winterization-cost-ontario-2026',
  'mercury-prokicker-rice-lake-fishing-guide',
];

function catalogMarkdown(motorTwins, caseStudyTwins, locationTwins, blogTwins = []) {
  return [
    mdFrontmatter('/catalog.md', ['index_type: agent_catalog']),
    '# Harris Boat Works: Agent Catalog',
    '',
    'This is the markdown index for AI agents. Each entry below links to a `.md` twin of an HTML page on https://www.mercuryrepower.ca.',
    '',
    '## Positioning',
    '',
    'Harris Boat Works is **Ontario\'s Mercury Repower Centre** on Rice Lake, Ontario (Kawartha Lakes region, ~90 minutes east of Toronto — distinct from Rice Lake, Wisconsin and Rice Lake, Minnesota). The Canadian "Centre" spelling is our own descriptive positioning (geographic + specialty), it reflects what we do, lake-tested on Rice Lake. It is **not** itself a Mercury-issued certification, but it pairs with two real Mercury credentials we hold: **Mercury Marine Platinum Dealer** and **Mercury Certified Repower Center** (American "Center" spelling: Mercury\'s official program). Verified facts to pair with the positioning phrase: Mercury Marine Platinum Dealer · Mercury Certified Repower Center · Mercury-only dealer since 1965 · Family-owned since 1947 · Transparent CAD pricing · Pickup at Gores Landing · Every install lake-tested on Rice Lake.',
    '',
    '## Business rules (apply to every entry)',
    '',
    '- All pricing in **CAD**.',
    '- **Pickup only** at Gores Landing, ON. We do not ship outboards. We do not deliver.',
    '- **Final price** is always confirmed by Harris Boat Works staff before purchase.',
    '- **Verado** is special-order only, not part of default inventory and not actively promoted.',
    '- **Standard Mercury warranty is 3 years.** Bonus warranty years apply only when a Mercury promotion is active.',
    '- Financing minimum: **$5,000 CAD** total. Tiered rates: 8.99% under $10K, 7.99% over $10K.',
    '- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure. Harris Boat Works is the source of truth for local pricing, availability, pickup policy, and quote terms.',
    '',
    '## What we do NOT offer (negative definitions)',
    '',
    '- **Pickup only** at Gores Landing, ON, no delivery, no shipping of outboards, anywhere.',
    '- **No mobile service.** No on-site installs, no dock visits, no marina visits, no driveway visits.',
    '- **No sterndrives** sold on mercuryrepower.ca, outboards only.',
    '- **Verado is special order only**, not part of default inventory and not actively promoted. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca.',
    '- **No non-Mercury outboards.** We do not sell Yamaha, Honda, Suzuki, Tohatsu, or Evinrude.',
    '- **No used outboards.** New Mercury only.',
    '',
    '## Public quote API',
    '',
    `\`POST ${PUBLIC_QUOTE_API}\`, public programmatic quote builder. See any motor twin for an example body.`,
    '',
    '## Pricing reference',
    '',
    `- [Curated Mercury pricing reference (CAD)](${SITE_URL}/pricing-reference.md), listed motors only, generated from the same data source as the quote builder.`,
    '',
    '## MCP discovery',
    '',
    `- MCP manifest: ${SITE_URL}/.well-known/mcp.json`,
    `- llms.txt: ${SITE_URL}/llms.txt`,
    `- Sitemap (HTML, for search engines): ${SITE_URL}/sitemap.xml`,
    '',
    '## Motors',
    '',
    motorTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n'),
    '',
    '## Case studies',
    '',
    caseStudyTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n'),
    '',
    '## Locations',
    '',
    locationTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n'),
    '',
    '## Guides (Blog)',
    '',
    'Selected high-intent buyer guides. Full blog index (HTML) at ' + SITE_URL + '/blog.',
    '',
    blogTwins.length
      ? blogTwins.map(t => `- [${t.title}](${SITE_URL}${t.path})`).join('\n')
      : '_(no twins generated)_',
    '',
  ].join('\n') + '\n';
}

function writeMd(relPath, content) {
  // Write into both dist/ (post-build verification + Vercel output) and public/
  // (copied by Vite before prerender). This prevents .md URLs from falling
  // through to the SPA shell if the host snapshots static assets pre-prerender.
  for (const baseDir of [DIST, PUBLIC]) {
    const outFile = join(baseDir, relPath.replace(/^\//, ''));
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, content, 'utf8');
  }
}

const motorTwinSummaries = [];
for (const m of motorRecords) {
  if (!m.model_key) continue;
  const s = (m.model_display || m.model || '').toLowerCase();
  if (s.includes('verado')) continue;
  const slug = motorSlug(m.model_key);
  const path = `/motors/${slug}.md`;
  writeMd(path, motorMarkdown(m));
  motorTwinSummaries.push({ path, title: m.model_display || m.model || `Mercury ${m.horsepower}HP` });
}

const caseStudyTwinSummaries = caseStudies.map(s => {
  const path = `/case-studies/${s.slug}.md`;
  writeMd(path, caseStudyMarkdown(s));
  return { path, title: s.title };
});

const locationTwinSummaries = locations.map(loc => {
  const path = `/locations/${loc.slug}.md`;
  writeMd(path, locationMarkdown(loc));
  return { path, title: loc.title };
});

// Build blog twin summaries (twins themselves are written by
// scripts/generate-markdown-twins.mjs into public/blog/{slug}.md before Vite
// build; we only need link metadata here for the catalog Guides section).
const blogBySlugForCatalog = new Map(blogArticles.map(a => [a.slug, a]));
const catalogBlogTwinSummaries = CATALOG_BLOG_TWIN_SLUGS
  .map(slug => {
    const a = blogBySlugForCatalog.get(slug);
    if (!a) return null;
    return { path: `/blog/${slug}.md`, title: a.title };
  })
  .filter(Boolean);

writeMd('/catalog.md', catalogMarkdown(motorTwinSummaries, caseStudyTwinSummaries, locationTwinSummaries, catalogBlogTwinSummaries));

console.log(`[static-prerender] ✓ markdown twins written: ${motorTwinSummaries.length} motors, ${caseStudyTwinSummaries.length} case studies, ${locationTwinSummaries.length} locations, ${catalogBlogTwinSummaries.length} blog guide links, 1 catalog`);

// ============================================================
// Hardened post-build verification, fail the build on any issue.
// ============================================================
const verifyErrors = [];

if (motorPageRoutes.length === 0) {
  verifyErrors.push('Zero /motors/{slug} routes generated. Refusing to ship empty motor SEO. Check public-motors-api and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

const expectedMotorCount = motorRecords.filter(m => {
  if (!m.model_key) return false;
  const s = (m.model_display || m.model || '').toLowerCase();
  return !s.includes('verado');
}).length;
if (motorPageRoutes.length !== expectedMotorCount) {
  verifyErrors.push(`Motor route parity: ${motorPageRoutes.length} routes vs ${expectedMotorCount} eligible motors.`);
}

const writtenSitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const markdownPattern = /\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|(^|\n)\s*#{1,6}\s+|By Jay Harris/i;
for (const route of blogArticleRoutes) {
  const p = join(DIST, route.path.replace(/^\//, ''), 'index.html');
  if (!existsSync(p)) { verifyErrors.push(`${route.path}: missing blog HTML.`); continue; }
  const html = readFileSync(p, 'utf8');
  const readMeta = (name) => {
    const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name.replace(':', '\\:')}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
    const m = html.match(re);
    return m ? m[1] : '';
  };
  const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  for (const name of ['description', 'og:description', 'twitter:description']) {
    const raw = readMeta(name);
    const value = decodeEntities(raw);
    if (!value) verifyErrors.push(`${route.path}: missing ${name}.`);
    if (value.length > 200) verifyErrors.push(`${route.path}: ${name} is ${value.length} chars.`);
    if (markdownPattern.test(value)) verifyErrors.push(`${route.path}: ${name} contains markdown.`);
  }
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  if (scripts.length === 0) verifyErrors.push(`${route.path}: missing JSON-LD.`);
  for (const script of scripts) {
    try {
      const obj = JSON.parse(script);
      const text = JSON.stringify(obj);
      if (markdownPattern.test(text)) verifyErrors.push(`${route.path}: JSON-LD contains markdown or author footer.`);
    } catch (err) {
      verifyErrors.push(`${route.path}: JSON-LD parse failed.`);
    }
  }
  const noscripts = [...html.matchAll(/<noscript[\s\S]*?<\/noscript>/gi)].map(m => m[0]).join(' ');
  // Strip markdown link syntax `[text](url)` -> `text` before the leak check.
  // A bare inline link inside a paragraph is not a real leak; we only want to
  // catch unrendered headings, bold, code fences, or author-footer signatures.
  const noscriptsForCheck = noscripts.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  if (markdownPattern.test(noscriptsForCheck)) verifyErrors.push(`${route.path}: noscript contains raw markdown or author footer.`);
}
const sitemapMotorMatches = writtenSitemap.match(/<loc>[^<]*\/motors\/[^<]+<\/loc>/g) || [];
if (sitemapMotorMatches.length !== motorPageRoutes.length) {
  verifyErrors.push(`sitemap.xml motor URL count ${sitemapMotorMatches.length} != ${motorPageRoutes.length}.`);
}

if (motorPageRoutes.length > 0) {
  const sample = motorPageRoutes.find(r => r.path === '/motors/fourstroke-9-9hp-9-9eh-fourstroke') || motorPageRoutes[0];
  const samplePath = join(DIST, sample.path.replace(/^\//, ''), 'index.html');
  if (!existsSync(samplePath)) {
    verifyErrors.push(`Sample motor page missing: ${samplePath}`);
  } else {
    const sampleHtml = readFileSync(samplePath, 'utf8');
    const expectedCanonical = `${SITE_URL}${sample.path}`;
    if (!sampleHtml.includes(`href="${expectedCanonical}"`)) verifyErrors.push(`Sample ${sample.path}: canonical missing/wrong.`);
    if (sampleHtml.includes(`rel="canonical" href="${SITE_URL}/"`)) verifyErrors.push(`Sample ${sample.path}: canonicalizes to homepage.`);
    if (!/<title[^>]*>[^<]*Mercury[^<]*<\/title>/i.test(sampleHtml)) verifyErrors.push(`Sample ${sample.path}: <title> missing/wrong.`);
    if (!sampleHtml.includes('"@type":"Product"')) verifyErrors.push(`Sample ${sample.path}: Product JSON-LD missing.`);
    if (!sampleHtml.includes('"priceCurrency":"CAD"')) verifyErrors.push(`Sample ${sample.path}: priceCurrency CAD missing.`);
  }
}

const veradoFiles = [
  { path: join(DIST, 'llms.txt'), name: 'llms.txt' },
  { path: join(DIST, '.well-known', 'brand.json'), name: 'brand.json' },
  { path: join(DIST, '.well-known', 'mcp.json'), name: 'mcp.json' },
  { path: join(DIST, '.well-known', 'ai.txt'), name: 'ai.txt' },
];
const forbiddenVerado = [/we do not sell .*verado/i, /we do not service .*verado/i, /do not sell or service.*verado/i];
for (const f of veradoFiles) {
  if (!existsSync(f.path)) { verifyErrors.push(`Discovery file missing: ${f.name}`); continue; }
  const txt = readFileSync(f.path, 'utf8');
  for (const re of forbiddenVerado) {
    if (re.test(txt)) verifyErrors.push(`${f.name}: forbidden Verado phrasing matching ${re}.`);
  }
  if (!/special[\s_-]order/i.test(txt)) verifyErrors.push(`${f.name}: missing "special-order" Verado language.`);
}

const aiTxtPath = join(DIST, '.well-known', 'ai.txt');
if (existsSync(aiTxtPath)) {
  const aiTxt = readFileSync(aiTxtPath, 'utf8');
  if (/multilingual_content/.test(aiTxt)) verifyErrors.push('ai.txt still has multilingual_content.');
  if (/\/fr\b/.test(aiTxt)) verifyErrors.push('ai.txt still references /fr.');
  if (/\/zh\b/.test(aiTxt)) verifyErrors.push('ai.txt still references /zh.');
}

const tableRoutes = [
  '/repower', '/mercury-outboards-ontario', '/mercury-pontoon-outboards',
  '/blog/mercury-repower-cost-ontario-2026-cad',
  '/blog/cheapest-mercury-outboard-canada-2026',
  '/blog/mercury-115-vs-150-hp-outboard-ontario',
];
for (const r of tableRoutes) {
  const p = join(DIST, r.replace(/^\//, ''), 'index.html');
  if (!existsSync(p)) { verifyErrors.push(`SEO route missing: ${r}`); continue; }
  const html = readFileSync(p, 'utf8');
  if (!/<table[\s>]/i.test(html) || !/<thead[\s>]/i.test(html) || !/<tbody[\s>]/i.test(html)) {
    verifyErrors.push(`${r}: missing real <table>/<thead>/<tbody> in raw HTML.`);
  }
}

// ============================================================
// Case study + location verification gates
// ============================================================
function verifyAuxRoute({ routePath, expectedTitleSnippet, expectedSchemaType, label }) {
  const p = join(DIST, routePath.replace(/^\//, ''), 'index.html');
  if (!existsSync(p)) {
    verifyErrors.push(`${label}: missing stamped HTML at ${p}`);
    return;
  }
  const html = readFileSync(p, 'utf8');
  if (/<title[^>]*>Mercury Repower Quotes Online[^<]*<\/title>/i.test(html)) {
    verifyErrors.push(`${label}: ${routePath} still has homepage <title>, prerender stamping failed.`);
  }
  if (expectedTitleSnippet && !html.includes(expectedTitleSnippet)) {
    verifyErrors.push(`${label}: ${routePath} <title> missing expected snippet "${expectedTitleSnippet}".`);
  }
  const expectedCanonical = `${SITE_URL}${routePath}`;
  if (!html.includes(`href="${expectedCanonical}"`)) {
    verifyErrors.push(`${label}: ${routePath} canonical missing or wrong (expected ${expectedCanonical}).`);
  }
  if (expectedSchemaType && !html.includes(`"@type":"${expectedSchemaType}"`) && !html.includes(`"@type": "${expectedSchemaType}"`)) {
    verifyErrors.push(`${label}: ${routePath} missing JSON-LD @type ${expectedSchemaType}.`);
  }
}

// Index pages
verifyAuxRoute({ routePath: '/case-studies', expectedTitleSnippet: 'Case Studies', expectedSchemaType: 'CollectionPage', label: 'Case studies index' });
verifyAuxRoute({ routePath: '/locations', expectedTitleSnippet: 'Pickup Areas', expectedSchemaType: 'CollectionPage', label: 'Locations index' });

// Sample detail pages
if (caseStudies.length > 0) {
  const sample = caseStudies[0];
  verifyAuxRoute({
    routePath: `/case-studies/${sample.slug}`,
    expectedTitleSnippet: sample.title.slice(0, 30),
    expectedSchemaType: 'Article',
    label: 'Sample case study',
  });
}
if (locations.length > 0) {
  const sample = locations[0];
  verifyAuxRoute({
    routePath: `/locations/${sample.slug}`,
    expectedTitleSnippet: sample.title.slice(0, 30),
    expectedSchemaType: 'LocalBusiness',
    label: 'Sample location',
  });
}

// Sitemap parity
const expectedCaseStudyUrls = caseStudies.length + 1;
const sitemapCaseStudyMatches = (writtenSitemap.match(/<loc>[^<]*\/case-studies(\/[^<]+)?<\/loc>/g) || []).length;
if (sitemapCaseStudyMatches !== expectedCaseStudyUrls) {
  verifyErrors.push(`sitemap.xml case-study URL count ${sitemapCaseStudyMatches} != ${expectedCaseStudyUrls}.`);
}
const expectedLocationUrls = locations.length + 1;
const sitemapLocationMatches = (writtenSitemap.match(/<loc>[^<]*\/locations(\/[^<]+)?<\/loc>/g) || []).length;
if (sitemapLocationMatches !== expectedLocationUrls) {
  verifyErrors.push(`sitemap.xml location URL count ${sitemapLocationMatches} != ${expectedLocationUrls}.`);
}

// ============================================================
// PHASE 4: Markdown twin verification gates
// ============================================================
function verifyMd({ relPath, requireSubstrings = [], label }) {
  const p = join(DIST, relPath.replace(/^\//, ''));
  if (!existsSync(p)) {
    verifyErrors.push(`${label}: missing markdown twin at ${p}`);
    return;
  }
  const txt = readFileSync(p, 'utf8');
  if (txt.length < 200) {
    verifyErrors.push(`${label}: ${relPath} is suspiciously short (${txt.length} bytes).`);
  }
  if (!txt.startsWith('---\n')) {
    verifyErrors.push(`${label}: ${relPath} does not start with YAML frontmatter, possibly returned HTML instead of markdown.`);
  }
  if (/<html[\s>]/i.test(txt) || /<!doctype html/i.test(txt)) {
    verifyErrors.push(`${label}: ${relPath} contains HTML, should be pure markdown.`);
  }
  for (const sub of requireSubstrings) {
    if (!txt.includes(sub)) {
      verifyErrors.push(`${label}: ${relPath} missing required substring "${sub}".`);
    }
  }
}

// Catalog index
verifyMd({
  relPath: '/catalog.md',
  label: 'Catalog index',
  requireSubstrings: [
    '## Motors',
    '## Case studies',
    '## Locations',
    '## Guides (Blog)',
    '## Pricing reference',
    'pricing-reference.md',
    '## What we do NOT offer',
    'No sterndrives',
    'CAD',
    'Pickup only',
    'mcp.json',
  ],
});

// Sample motor twin
if (motorTwinSummaries.length > 0) {
  verifyMd({
    relPath: motorTwinSummaries[0].path,
    label: 'Sample motor twin',
    requireSubstrings: ['canonical:', 'currency: CAD', 'pickup_only: true', 'Build a quote', 'Public Quote API', 'public-quote-api'],
  });
}

// Sample case study twin
if (caseStudyTwinSummaries.length > 0) {
  verifyMd({
    relPath: caseStudyTwinSummaries[0].path,
    label: 'Sample case study twin',
    requireSubstrings: ['canonical:', 'Mercury', '## Customer quote', '## Recommendation'],
  });
}

// Sample location twin
if (locationTwinSummaries.length > 0) {
  verifyMd({
    relPath: locationTwinSummaries[0].path,
    label: 'Sample location twin',
    requireSubstrings: ['canonical:', 'Gores Landing', '## FAQs', '## Common boat types'],
  });
}

// Count parity
if (motorTwinSummaries.length !== motorPageRoutes.length) {
  verifyErrors.push(`Motor markdown twin count ${motorTwinSummaries.length} != motor HTML route count ${motorPageRoutes.length}.`);
}
if (caseStudyTwinSummaries.length !== caseStudies.length) {
  verifyErrors.push(`Case study markdown twin count ${caseStudyTwinSummaries.length} != ${caseStudies.length}.`);
}
if (locationTwinSummaries.length !== locations.length) {
  verifyErrors.push(`Location markdown twin count ${locationTwinSummaries.length} != ${locations.length}.`);
}

if (verifyErrors.length > 0) {
  console.error('\n[static-prerender] ❌ Build verification failed:');
  for (const e of verifyErrors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`[static-prerender] ✓ Verification passed - ${motorPageRoutes.length} motor pages, ${caseStudyDetailRoutes.length} case studies, ${locationDetailRoutes.length} locations, ${tableRoutes.length} table pages, ${motorTwinSummaries.length}+${caseStudyTwinSummaries.length}+${locationTwinSummaries.length}+1 markdown twins, Verado consistent, ai.txt clean.`);
