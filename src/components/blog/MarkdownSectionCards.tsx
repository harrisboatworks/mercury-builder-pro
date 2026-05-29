import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Phone, Calculator, MapPin } from 'lucide-react';
import {
  ImagePlaceholder,
  type ImagePlaceholderProps,
  type PlaceholderAspect,
  type PlaceholderType,
} from './ImagePlaceholder';
import { getPlaceholder } from '@/data/imagePlaceholders';
import {
  MotorPricingCards,
  type MotorPricingRow,
} from './MotorPricingCards';
import { RelatedPostsGrid } from './RelatedPostsGrid';
import { DecisionCard, type DecisionCardProps } from './DecisionCard';
import { DiagnosticFlowchart, type DiagnosticFlowchartProps } from './DiagnosticFlowchart';
import { CostStack, type CostStackProps, type CostStackItem } from './CostStack';
import { BilingualTrustCard, type BilingualTrustCardProps, type BilingualTrustItem } from './BilingualTrustCard';
import { PullQuote, type PullQuoteProps } from './PullQuote';
import { MercuryPriceTable, type MercuryPriceTableProps } from './MercuryPriceTable';
import WalkaroundLeadCapture from './WalkaroundLeadCapture';
import { MercuryVideo } from './MercuryVideo';
import { CustomerVoice, type CustomerVoiceProps, type CustomerVoiceItem } from './CustomerVoice';

// ---------------------------------------------------------------------------
// Special-block preprocessing
// ---------------------------------------------------------------------------
// We rewrite two markdown patterns into pseudo-directive blocks BEFORE the
// normal splitter runs:
//   1. Pricing tables  → `:::motor-pricing\n<JSON rows>\n:::`
//   2. Trailing "Related guides" bullet list → `:::related-posts\n<slugs>\n:::`
// The splitter below then dispatches them to dedicated React components.

const STRIP_BOLD = (s: string) => s.replace(/\*\*/g, '').trim();

function parseTableLines(lines: string[]):
  | { headers: string[]; rows: string[][] }
  | null {
  if (lines.length < 3) return null;
  const headerLine = lines[0];
  const sepLine = lines[1];
  if (!/^\s*\|.*\|\s*$/.test(headerLine)) return null;
  if (!/^\s*\|?\s*:?-{2,}/.test(sepLine.replace(/\|/g, ''))) {
    // looser check: separator row has dashes between pipes
    if (!/^[\s|:\-]+$/.test(sepLine) || !sepLine.includes('-')) return null;
  }
  const splitRow = (l: string) =>
    l
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((c) => c.trim());
  const headers = splitRow(headerLine);
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    if (cells.length !== headers.length) return null;
    rows.push(cells);
  }
  return { headers, rows };
}

function detectPricingTable(headers: string[]): {
  modelIdx: number;
  dealerIdx: number;
  msrpIdx: number;
  useCaseIdx: number;
} | null {
  const lower = headers.map((h) => h.toLowerCase());
  const findIdx = (...needles: string[]) =>
    lower.findIndex((h) => needles.some((n) => h.includes(n)));

  const dealerIdx = lower.findIndex(
    (h) => h.includes('dealer price') || h.includes('selling price'),
  );
  const msrpIdx = lower.findIndex((h) => /\bmsrp\b/.test(h));
  if (dealerIdx < 0 || msrpIdx < 0) return null;

  // Model column: prefer "model"/"motor", fallback to first non-numeric/non-price column.
  let modelIdx = findIdx('model', 'motor');
  if (modelIdx < 0) {
    modelIdx = lower.findIndex(
      (h, i) =>
        i !== dealerIdx &&
        i !== msrpIdx &&
        !/^hp\b|^horsepower|sku|code/.test(h),
    );
  }
  if (modelIdx < 0) return null;

  const useCaseIdx = findIdx('best for', 'use case', 'use-case', 'best fit');
  return { modelIdx, dealerIdx, msrpIdx, useCaseIdx };
}

/** Find every gfm pipe-table block in the markdown (fence-aware). */
function findTableBlocks(md: string): Array<{
  start: number;
  end: number;
  lines: string[];
}> {
  const lines = md.split('\n');
  const blocks: Array<{ start: number; end: number; lines: string[] }> = [];
  let inFence = false;
  let i = 0;
  // Track absolute char offsets per line.
  const offsets: number[] = [0];
  for (let k = 0; k < lines.length - 1; k++) {
    offsets.push(offsets[k] + lines[k].length + 1);
  }
  while (i < lines.length) {
    if (/^```/.test(lines[i])) {
      inFence = !inFence;
      i++;
      continue;
    }
    if (
      !inFence &&
      /^\s*\|.*\|\s*$/.test(lines[i]) &&
      i + 1 < lines.length &&
      /^[\s|:\-]+$/.test(lines[i + 1]) &&
      lines[i + 1].includes('-')
    ) {
      const start = i;
      let j = i + 2;
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) j++;
      const tableLines = lines.slice(start, j);
      const startOff = offsets[start];
      const endOff =
        j < lines.length
          ? offsets[j] - 1 // strip trailing \n
          : md.length;
      blocks.push({ start: startOff, end: endOff, lines: tableLines });
      i = j;
      continue;
    }
    i++;
  }
  return blocks;
}

function rewritePricingTables(md: string): string {
  const blocks = findTableBlocks(md);
  if (!blocks.length) return md;
  // Replace from end → start so offsets stay valid.
  let out = md;
  for (let b = blocks.length - 1; b >= 0; b--) {
    const block = blocks[b];
    const parsed = parseTableLines(block.lines);
    if (!parsed) continue;
    const cols = detectPricingTable(parsed.headers);
    if (!cols) continue;
    const rows: MotorPricingRow[] = parsed.rows
      .map((r) => ({
        model: STRIP_BOLD(r[cols.modelIdx] || ''),
        dealerPrice: STRIP_BOLD(r[cols.dealerIdx] || '') || undefined,
        msrp: STRIP_BOLD(r[cols.msrpIdx] || '') || undefined,
        useCase:
          cols.useCaseIdx >= 0
            ? STRIP_BOLD(r[cols.useCaseIdx] || '') || undefined
            : undefined,
      }))
      .filter((r) => r.model);
    if (!rows.length) continue;
    const directive = `:::motor-pricing\n${JSON.stringify(rows)}\n:::`;
    out = out.slice(0, block.start) + directive + out.slice(block.end);
  }
  return out;
}

const RELATED_HEADER_RE =
  /^\s*\*\*\s*Related(?:\s+(?:guides|posts|articles))?\s*:?\s*\*\*\s*$/i;

function rewriteRelatedGuides(md: string): string {
  const lines = md.split('\n');
  let inFence = false;
  let lastHeader = -1;
  let lastEnd = -1;
  let lastSlugs: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!RELATED_HEADER_RE.test(lines[i])) continue;
    // Walk forward over optional blank lines and bullet list.
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    const slugs: string[] = [];
    while (j < lines.length) {
      const m = /^\s*[-*]\s*\[[^\]]+\]\(\/blog\/([a-z0-9][a-z0-9-]*)\/?\)/i.exec(
        lines[j],
      );
      if (!m) break;
      slugs.push(m[1]);
      j++;
    }
    if (slugs.length >= 2) {
      lastHeader = i;
      lastEnd = j; // exclusive
      lastSlugs = slugs;
    }
  }
  if (lastHeader < 0) return md;
  const before = lines.slice(0, lastHeader).join('\n');
  const after = lines.slice(lastEnd).join('\n');
  const directive = `:::related-posts\n${lastSlugs.join('\n')}\n:::`;
  return (
    (before ? before + '\n' : '') +
    directive +
    (after ? '\n' + after : '')
  );
}

function rewriteDecisionCards(md: string): string {
  // Authors write `::decision-card\n...\n::` (double colon).
  // Convert to a triple-colon directive so the standard splitter handles it.
  const re = /^::decision-card\s*\n([\s\S]*?)\n::\s*$/gm;
  return md.replace(re, (_m, body) => `:::decision-card\n${body}\n:::`);
}

function rewriteDiagnosticFlow(md: string): string {
  const re = /^::diagnostic-flow\s*\n([\s\S]*?)\n::\s*$/gm;
  return md.replace(re, (_m, body) => `:::diagnostic-flow\n${body}\n:::`);
}

function rewriteCostStack(md: string): string {
  const re = /^::cost-stack\s*\n([\s\S]*?)\n::\s*$/gm;
  return md.replace(re, (_m, body) => `:::cost-stack\n${body}\n:::`);
}

function rewriteBilingualTrust(md: string): string {
  const re = /^::bilingual-trust\s*\n([\s\S]*?)\n::\s*$/gm;
  return md.replace(re, (_m, body) => `:::bilingual-trust\n${body}\n:::`);
}

function rewritePullQuote(md: string): string {
  const re = /^::pull-quote\s*\n([\s\S]*?)\n::\s*$/gm;
  return md.replace(re, (_m, body) => `:::pull-quote\n${body}\n:::`);
}

function rewriteCustomerVoice(md: string): string {
  const re = /^::customer-voice\s*\n([\s\S]*?)\n::\s*$/gm;
  return md.replace(re, (_m, body) => `:::customer-voice\n${body}\n:::`);
}


function rewriteWalkaroundLeadCapture(md: string): string {
  // Bodiless directive: a single line `::walkaround-lead-capture` becomes
  // `:::walkaround-lead-capture\n\n:::` so the standard splitter matches it.
  return md.replace(
    /^::walkaround-lead-capture\s*$/gm,
    ':::walkaround-lead-capture\n\n:::',
  );
}

function rewriteMercuryPriceTable(md: string): string {
  // Supports both bodied (`::mercury-price-table\nkey: value\n::`) and
  // bodiless (`::mercury-price-table`) forms. Bodiless => full list.
  let out = md.replace(
    /^::mercury-price-table\s*\n([\s\S]*?)\n::\s*$/gm,
    (_m, body) => `:::mercury-price-table\n${body}\n:::`,
  );
  out = out.replace(
    /^::mercury-price-table\s*$/gm,
    ':::mercury-price-table\n\n:::',
  );
  return out;
}

/**
 * Convert raw YouTube iframe HTML (with or without the responsive wrapper div)
 * into a sanitized `:::youtube-embed` directive. Non-YouTube iframes and any
 * leftover wrapper divs are stripped so raw HTML never reaches the renderer.
 *
 * Accepts iframes whose `src` begins with:
 *   - https://www.youtube.com/embed/
 *   - https://www.youtube-nocookie.com/embed/
 *   - https://youtube.com/embed/
 * Any other iframe is removed (security: no arbitrary embeds).
 */
function rewriteYouTubeEmbeds(md: string): string {
  let out = md;
  // 1. Wrapped form: <div ...><iframe ...></iframe></div>
  out = out.replace(
    /<div[^>]*>\s*<iframe\b([^>]*)>\s*<\/iframe>\s*<\/div>/gi,
    (_m, attrs) => buildYouTubeDirective(attrs) ?? '',
  );
  // 2. Bare iframe
  out = out.replace(
    /<iframe\b([^>]*)>\s*<\/iframe>/gi,
    (_m, attrs) => buildYouTubeDirective(attrs) ?? '',
  );
  return out;
}

function buildYouTubeDirective(attrs: string): string | null {
  const srcMatch = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
  if (!srcMatch) return '';
  const src = srcMatch[1];
  const ytMatch =
    /^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/embed\/([A-Za-z0-9_-]{6,})/.exec(
      src,
    );
  if (!ytMatch) return ''; // strip non-YouTube iframes
  const id = ytMatch[1];
  const titleMatch = /\btitle\s*=\s*["']([^"']+)["']/i.exec(attrs);
  const title = titleMatch ? titleMatch[1].replace(/\n/g, ' ') : '';
  return `\n\n:::youtube-embed\nid: ${id}${title ? `\ntitle: ${title}` : ''}\n:::\n\n`;
}

function preprocessSpecialBlocks(md: string): string {
  return rewriteCustomerVoice(rewriteYouTubeEmbeds(
    rewriteMercuryPriceTable(
      rewriteWalkaroundLeadCapture(
        rewritePullQuote(
          rewriteBilingualTrust(
            rewriteCostStack(
              rewriteDiagnosticFlow(
                rewriteDecisionCards(rewriteRelatedGuides(rewritePricingTables(md))),
              ),
            ),
          ),
        ),
      ),
    ),
  ));
}

/**
 * Parse a single :::image-placeholder ... ::: directive body into props.
 * Lines look like `key: value` (value may contain colons; only first split).
 */
function parseDirective(body: string): ImagePlaceholderProps | null {
  const out: Record<string, string> = {};
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  if (!out.slug || !out.type || !out.aspect) return null;

  // Allow registry to fill in description/prompt/image when absent.
  const reg = getPlaceholder(out.slug);
  return {
    slug: out.slug,
    type: (out.type as PlaceholderType) ?? reg?.type ?? 'photo',
    aspect: (out.aspect as PlaceholderAspect) ?? reg?.aspect ?? '16:9',
    description: out.description || reg?.description || out.slug,
    prompt: out.prompt || reg?.prompt,
    image: out.image || reg?.image || undefined,
    caption: out.caption,
  };
}

interface RenderChunk {
  kind: 'md' | 'placeholder' | 'motor-pricing' | 'related-posts' | 'decision-card' | 'diagnostic-flow' | 'cost-stack' | 'bilingual-trust' | 'pull-quote' | 'walkaround-lead-capture' | 'mercury-price-table' | 'youtube-embed' | 'customer-voice';
  content: string;
  props?: ImagePlaceholderProps;
  pricingRows?: MotorPricingRow[];
  relatedSlugs?: string[];
  decisionProps?: DecisionCardProps;
  diagnosticProps?: DiagnosticFlowchartProps;
  costStackProps?: CostStackProps;
  bilingualTrustProps?: BilingualTrustCardProps;
  pullQuoteProps?: PullQuoteProps;
  mercuryPriceTableProps?: MercuryPriceTableProps;
  youtubeProps?: { id: string; title?: string };
  customerVoiceProps?: CustomerVoiceProps;
}

const ANY_DIRECTIVE_RE =
  /:::(image-placeholder|motor-pricing|related-posts|decision-card|diagnostic-flow|cost-stack|bilingual-trust|pull-quote|walkaround-lead-capture|mercury-price-table|youtube-embed|customer-voice)\s*\n([\s\S]*?)\n:::/g;

function parseDecisionCardBody(body: string): DecisionCardProps | null {
  // YAML-ish: top-level `key: value` lines, plus list keys whose values are
  // indented `- item` lines. Keys: heading, eyebrow, subhead, leftLabel,
  // leftCriteria, leftOutcome, leftVariant, right*, whenInDoubt.
  const lines = body.split('\n');
  const flat: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  let currentList: string | null = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      currentList = null;
      continue;
    }
    const listItem = /^\s+-\s+(.*)$/.exec(line);
    if (listItem && currentList) {
      lists[currentList].push(listItem[1].trim());
      continue;
    }
    const kv = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) {
      currentList = null;
      continue;
    }
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
  if (!flat.heading) return null;
  const leftCriteria = lists.leftCriteria || [];
  const rightCriteria = lists.rightCriteria || [];
  const variantOf = (v?: string): 'recommended' | 'alternative' | undefined => {
    if (v === 'recommended' || v === 'alternative') return v;
    return undefined;
  };
  return {
    heading: flat.heading,
    eyebrow: flat.eyebrow,
    subhead: flat.subhead,
    leftColumn: {
      label: flat.leftLabel || '',
      criteria: leftCriteria,
      outcome: flat.leftOutcome || '',
      variant: variantOf(flat.leftVariant),
    },
    rightColumn: {
      label: flat.rightLabel || '',
      criteria: rightCriteria,
      outcome: flat.rightOutcome || '',
      variant: variantOf(flat.rightVariant),
    },
    whenInDoubt: flat.whenInDoubt,
  };
}

function parseDiagnosticFlowBody(body: string): DiagnosticFlowchartProps | null {
  const lines = body.split('\n');
  const flat: Record<string, string> = {};
  const stepsMap: Record<number, { label?: string; question?: string; tip?: string }> = {};
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    const val = kv[2];
    const stepLabel = /^step(\d+)Label$/.exec(key);
    const stepQuestion = /^step(\d+)Question$/.exec(key);
    const stepTip = /^step(\d+)Tip$/.exec(key);
    if (stepLabel) {
      const idx = Number(stepLabel[1]);
      stepsMap[idx] = stepsMap[idx] || {};
      stepsMap[idx].label = val;
    } else if (stepQuestion) {
      const idx = Number(stepQuestion[1]);
      stepsMap[idx] = stepsMap[idx] || {};
      stepsMap[idx].question = val;
    } else if (stepTip) {
      const idx = Number(stepTip[1]);
      stepsMap[idx] = stepsMap[idx] || {};
      stepsMap[idx].tip = val;
    } else {
      flat[key] = val;
    }
  }
  if (!flat.heading) return null;
  const steps = Object.keys(stepsMap)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((idx) => {
      const s = stepsMap[idx];
      if (!s.label || !s.question) return null;
      return { label: s.label, question: s.question, tip: s.tip };
    })
    .filter(Boolean) as DiagnosticFlowchartProps['steps'];
  const escalation = flat.escalationBody
    ? {
        label: flat.escalationLabel,
        body: flat.escalationBody,
      }
    : undefined;
  return {
    heading: flat.heading,
    eyebrow: flat.eyebrow,
    subhead: flat.subhead,
    steps,
    escalation,
  };
}

function parseCostStackBody(body: string): CostStackProps | null {
  const flat: Record<string, string> = {};
  const itemMap: Record<number, { label?: string; value?: string; note?: string; accent?: boolean }> = {};
  for (const raw of body.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([a-zA-Z0-9]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    const val = kv[2];
    const m = /^item(\d+)(Label|Value|Note|Accent)$/.exec(key);
    if (m) {
      const idx = Number(m[1]);
      itemMap[idx] = itemMap[idx] || {};
      const field = m[2];
      if (field === 'Label') itemMap[idx].label = val;
      else if (field === 'Value') itemMap[idx].value = val;
      else if (field === 'Note') itemMap[idx].note = val;
      else if (field === 'Accent') itemMap[idx].accent = /^(true|yes|1)$/i.test(val);
    } else {
      flat[key] = val;
    }
  }
  if (!flat.heading) return null;
  const items: CostStackItem[] = Object.keys(itemMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => itemMap[i])
    .filter((it) => it.label && it.value)
    .map((it) => ({ label: it.label!, value: it.value!, note: it.note, accent: it.accent }));
  const total = flat.totalLabel && flat.totalValue
    ? { label: flat.totalLabel, value: flat.totalValue }
    : undefined;
  return {
    heading: flat.heading,
    eyebrow: flat.eyebrow,
    subhead: flat.subhead,
    items,
    total,
    caveat: flat.caveat,
  };
}

function parseBilingualTrustBody(body: string): BilingualTrustCardProps | null {
  const flat: Record<string, string> = {};
  const itemMap: Record<number, { en?: string; zh?: string }> = {};
  for (const raw of body.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([a-zA-Z0-9]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    const val = kv[2];
    const m = /^item(\d+)(En|Zh)$/.exec(key);
    if (m) {
      const idx = Number(m[1]);
      itemMap[idx] = itemMap[idx] || {};
      if (m[2] === 'En') itemMap[idx].en = val;
      else itemMap[idx].zh = val;
    } else {
      flat[key] = val;
    }
  }
  if (!flat.heading || !flat.headingTranslated) return null;
  const items: BilingualTrustItem[] = Object.keys(itemMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => itemMap[i])
    .filter((it) => it.en && it.zh)
    .map((it) => ({ en: it.en!, zh: it.zh! }));
  const cta = flat.ctaEn && flat.ctaZh && flat.ctaHref
    ? { en: flat.ctaEn, zh: flat.ctaZh, href: flat.ctaHref }
    : undefined;
  return {
    eyebrow: flat.eyebrow,
    heading: flat.heading,
    headingTranslated: flat.headingTranslated,
    items,
    cta,
  };
}

function parsePullQuoteBody(body: string): PullQuoteProps | null {
  // Simple key/value parser. The `quote` value may continue on indented
  // continuation lines, mirroring how authors paste multi-sentence quotes.
  const lines = body.split('\n');
  const flat: Record<string, string> = {};
  let lastKey: string | null = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { lastKey = null; continue; }
    const kv = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(line);
    if (kv) {
      flat[kv[1]] = kv[2];
      lastKey = kv[1];
    } else if (lastKey && /^\s+/.test(raw)) {
      flat[lastKey] = (flat[lastKey] ? flat[lastKey] + ' ' : '') + line.trim();
    } else {
      lastKey = null;
    }
  }
  if (!flat.quote) return null;
  return {
    quote: flat.quote,
    attribution: flat.attribution || undefined,
    source: flat.source || undefined,
  };
}

/**
 * Parse a :::customer-voice body. Supports YAML-ish list items:
 *   - quote: "..."
 *     response: "..."
 *     isCTA: true
 * Also accepts unquoted values. Optional top-level `heading: ...`.
 */
function parseCustomerVoiceBody(body: string): CustomerVoiceProps | null {
  const lines = body.split('\n');
  const items: CustomerVoiceItem[] = [];
  let heading: string | undefined;
  let current: Partial<CustomerVoiceItem> | null = null;
  const flush = () => {
    if (current && current.quote && current.response) {
      items.push({
        quote: String(current.quote),
        response: String(current.response),
        isCTA: current.isCTA === true,
      });
    }
    current = null;
  };
  const stripQuotes = (v: string) => v.trim().replace(/^["'](.*)["']$/, '$1');
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const itemStart = /^-\s*([a-zA-Z]+)\s*:\s*(.*)$/.exec(raw);
    if (itemStart) {
      flush();
      current = {};
      const key = itemStart[1];
      const val = stripQuotes(itemStart[2]);
      if (key === 'quote' || key === 'response') (current as any)[key] = val;
      else if (key === 'isCTA') (current as any).isCTA = /^true$/i.test(val);
      continue;
    }
    const cont = /^\s+([a-zA-Z]+)\s*:\s*(.*)$/.exec(raw);
    if (cont && current) {
      const key = cont[1];
      const val = stripQuotes(cont[2]);
      if (key === 'quote' || key === 'response') (current as any)[key] = val;
      else if (key === 'isCTA') (current as any).isCTA = /^true$/i.test(val);
      continue;
    }
    const top = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(raw);
    if (top && !current) {
      if (top[1] === 'heading') heading = stripQuotes(top[2]);
    }
  }
  flush();
  if (!items.length) return null;
  return { items, heading };
}

function splitDirectives(md: string): RenderChunk[] {
  const chunks: RenderChunk[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  ANY_DIRECTIVE_RE.lastIndex = 0;
  while ((m = ANY_DIRECTIVE_RE.exec(md)) !== null) {
    if (m.index > last) {
      chunks.push({ kind: 'md', content: md.slice(last, m.index) });
    }
    const name = m[1];
    const body = m[2];
    if (name === 'image-placeholder') {
      const props = parseDirective(body);
      if (props) chunks.push({ kind: 'placeholder', content: '', props });
    } else if (name === 'motor-pricing') {
      try {
        const rows = JSON.parse(body) as MotorPricingRow[];
        if (Array.isArray(rows) && rows.length) {
          chunks.push({ kind: 'motor-pricing', content: '', pricingRows: rows });
        }
      } catch {
        /* ignore malformed */
      }
    } else if (name === 'related-posts') {
      const slugs = body
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length)
        chunks.push({ kind: 'related-posts', content: '', relatedSlugs: slugs });
    } else if (name === 'decision-card') {
      const props = parseDecisionCardBody(body);
      if (props) chunks.push({ kind: 'decision-card', content: '', decisionProps: props });
    } else if (name === 'diagnostic-flow') {
      const props = parseDiagnosticFlowBody(body);
      if (props) chunks.push({ kind: 'diagnostic-flow', content: '', diagnosticProps: props });
    } else if (name === 'cost-stack') {
      const props = parseCostStackBody(body);
      if (props) chunks.push({ kind: 'cost-stack', content: '', costStackProps: props });
    } else if (name === 'bilingual-trust') {
      const props = parseBilingualTrustBody(body);
      if (props) chunks.push({ kind: 'bilingual-trust', content: '', bilingualTrustProps: props });
    } else if (name === 'pull-quote') {
      const props = parsePullQuoteBody(body);
      if (props) chunks.push({ kind: 'pull-quote', content: '', pullQuoteProps: props });
    } else if (name === 'walkaround-lead-capture') {
      chunks.push({ kind: 'walkaround-lead-capture', content: '' });
    } else if (name === 'mercury-price-table') {
      const props: MercuryPriceTableProps = {};
      for (const raw of body.split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const kv = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(line);
        if (!kv) continue;
        const key = kv[1];
        const val = kv[2].trim();
        if (key === 'group' && /^(portable|mid-range|high-output|v6-v8)$/.test(val)) {
          props.group = val as MercuryPriceTableProps['group'];
        } else if (key === 'minHp') {
          const n = Number(val);
          if (Number.isFinite(n)) props.minHp = n;
        } else if (key === 'maxHp') {
          const n = Number(val);
          if (Number.isFinite(n)) props.maxHp = n;
        }
      }
      chunks.push({ kind: 'mercury-price-table', content: '', mercuryPriceTableProps: props });
    } else if (name === 'youtube-embed') {
      const idMatch = /^\s*id\s*:\s*([A-Za-z0-9_-]{6,})\s*$/m.exec(body);
      const titleMatch = /^\s*title\s*:\s*(.+)$/m.exec(body);
      if (idMatch) {
        chunks.push({
          kind: 'youtube-embed',
          content: '',
          youtubeProps: { id: idMatch[1], title: titleMatch?.[1]?.trim() },
        });
      }
    } else if (name === 'customer-voice') {
      const props = parseCustomerVoiceBody(body);
      if (props) chunks.push({ kind: 'customer-voice', content: '', customerVoiceProps: props });
    }
    last = m.index + m[0].length;
  }
  if (last < md.length) chunks.push({ kind: 'md', content: md.slice(last) });
  return chunks;
}

function renderMarkdownWithDirectives(
  md: string,
  components: Components,
  keyPrefix: string,
) {
  const chunks = splitDirectives(md);
  return chunks.map((chunk, i) => {
    if (chunk.kind === 'placeholder' && chunk.props) {
      return <ImagePlaceholder key={`${keyPrefix}-ph-${i}`} {...chunk.props} />;
    }
    if (chunk.kind === 'motor-pricing' && chunk.pricingRows) {
      return (
        <MotorPricingCards
          key={`${keyPrefix}-mp-${i}`}
          rows={chunk.pricingRows}
        />
      );
    }
    if (chunk.kind === 'related-posts' && chunk.relatedSlugs) {
      return (
        <RelatedPostsGrid
          key={`${keyPrefix}-rp-${i}`}
          slugs={chunk.relatedSlugs}
        />
      );
    }
    if (chunk.kind === 'decision-card' && chunk.decisionProps) {
      return <DecisionCard key={`${keyPrefix}-dc-${i}`} {...chunk.decisionProps} />;
    }
    if (chunk.kind === 'diagnostic-flow' && chunk.diagnosticProps) {
      return <DiagnosticFlowchart key={`${keyPrefix}-df-${i}`} {...chunk.diagnosticProps} />;
    }
    if (chunk.kind === 'cost-stack' && chunk.costStackProps) {
      return <CostStack key={`${keyPrefix}-cs-${i}`} {...chunk.costStackProps} />;
    }
    if (chunk.kind === 'bilingual-trust' && chunk.bilingualTrustProps) {
      return <BilingualTrustCard key={`${keyPrefix}-bt-${i}`} {...chunk.bilingualTrustProps} />;
    }
    if (chunk.kind === 'pull-quote' && chunk.pullQuoteProps) {
      return <PullQuote key={`${keyPrefix}-pq-${i}`} {...chunk.pullQuoteProps} />;
    }
    if (chunk.kind === 'walkaround-lead-capture') {
      return <WalkaroundLeadCapture key={`${keyPrefix}-wl-${i}`} />;
    }
    if (chunk.kind === 'mercury-price-table') {
      return <MercuryPriceTable key={`${keyPrefix}-mpt-${i}`} {...(chunk.mercuryPriceTableProps || {})} />;
    }
    if (chunk.kind === 'youtube-embed' && chunk.youtubeProps) {
      return (
        <MercuryVideo
          key={`${keyPrefix}-yt-${i}`}
          videoId={chunk.youtubeProps.id}
          title={chunk.youtubeProps.title || 'Mercury Marine video'}
        />
      );
    }
    if (chunk.kind === 'customer-voice' && chunk.customerVoiceProps) {
      return <CustomerVoice key={`${keyPrefix}-cv-${i}`} {...chunk.customerVoiceProps} />;
    }
    if (!chunk.content.trim()) return null;
    return (
      <ReactMarkdown
        key={`${keyPrefix}-md-${i}`}
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {chunk.content}
      </ReactMarkdown>
    );
  });
}

/**
 * Split markdown into ordered chunks, extracting top-level
 * `> **Quick answer:** ...` blockquote blocks as synthetic short-answer cards.
 * Respects fenced code blocks. Marker on the first line is stripped.
 */
type QAChunk =
  | { kind: 'md'; content: string }
  | { kind: 'quick-answer'; content: string };

const QUICK_ANSWER_RE = /^>\s*\*\*\s*Quick\s*answer\s*:?\s*\*\*\s*/i;

function extractQuickAnswerChunks(md: string): QAChunk[] {
  const lines = md.split('\n');
  const out: QAChunk[] = [];
  let buf: string[] = [];
  let inFence = false;
  const flush = () => {
    if (buf.length) {
      out.push({ kind: 'md', content: buf.join('\n') });
      buf = [];
    }
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      inFence = !inFence;
      buf.push(line);
      i++;
      continue;
    }
    if (!inFence && QUICK_ANSWER_RE.test(line)) {
      const bq: string[] = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        bq.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      bq[0] = bq[0].replace(/^\*\*\s*Quick\s*answer\s*:?\s*\*\*\s*/i, '');
      flush();
      out.push({ kind: 'quick-answer', content: bq.join('\n').trim() });
      continue;
    }
    buf.push(line);
    i++;
  }
  flush();
  return out;
}

/**
 * Renders article markdown, detecting specific H2/H3 heading patterns and
 * wrapping the section that follows in a styled card. Markdown content is
 * NOT modified — only its visual presentation.
 */

type CardKind =
  | 'short-answer'
  | 'hbw-note'
  | 'common-mistakes'
  | 'sources'
  | 'who-this-is-for'
  | 'when-to-call'
  | 'try-calculator'
  | 'dealer-note'
  | 'local-context'
  | 'choose-card'
  | null;

type InlineCardKind = 'recommended-choice' | null;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function detectH2Card(headingText: string): CardKind {
  const t = norm(headingText);
  if (
    t === 'quick recommendation' ||
    t === 'quick answer' ||
    t === 'short answer' ||
    t === 'direct answer' ||
    t === 'tldr' ||
    t === 'tl dr' ||
    t === 'bottom line' ||
    t === 'quick verdict' ||
    t === 'quick take' ||
    t === 'quick fix'
  )
    return 'short-answer';
  if (
    t.startsWith('what hbw checks before') ||
    t === 'what hbw does' ||
    t === 'what we do at hbw' ||
    t === 'what we actually see' ||
    t === 'what we see at hbw' ||
    t === 'hbw local note' ||
    t === 'hbw shop note' ||
    t === 'shop note' ||
    t === 'from the shop'
  )
    return 'hbw-note';
  if (
    t === 'common mistakes' ||
    t === 'mistakes to avoid' ||
    t === 'what goes wrong' ||
    t === 'common pitfalls' ||
    t.startsWith('watch out for')
  )
    return 'common-mistakes';
  if (
    t === 'sources and review notes' ||
    t === 'sources' ||
    t === 'review notes' ||
    t === 'verification'
  )
    return 'sources';
  if (
    t === 'who this guide is for' ||
    t === 'who this is for' ||
    t === 'who should read this'
  )
    return 'who-this-is-for';
  if (
    t === 'when to call hbw' ||
    t === 'when to call us' ||
    t === 'when to bring it in' ||
    t.startsWith('when to bring it to hbw')
  )
    return 'when-to-call';
  if (
    t === 'try the calculator' ||
    t === 'run the numbers' ||
    t === 'try the tool'
  )
    return 'try-calculator';
  if (t === 'dealer note' || t === 'hbw dealer note') return 'dealer-note';
  if (isLocalContextHeading(t)) return 'local-context';
  if (CHOOSE_HEADING_RE.test(headingText)) return 'choose-card';
  return null;
}

const CHOOSE_HEADING_RE = /^\s*Choose\s+.+\s+if\s*$/i;

const LOCAL_CONTEXT_HEADINGS = new Set([
  'rice lake note',
  'kawarthas note',
  'kawarthas fit',
  'ontario context',
  'ontario boating context',
  'trent severn note',
  'trent severn consideration',
  'gta buyer note',
  'local context',
]);

function isLocalContextHeading(normalized: string): boolean {
  return LOCAL_CONTEXT_HEADINGS.has(normalized);
}

function extractChooseLabel(heading: string): string {
  const m = /^\s*Choose\s+(.+?)\s+if\s*$/i.exec(heading);
  return m ? m[1].trim() : heading;
}

function detectInlineCard(headingText: string): InlineCardKind {
  const t = norm(headingText);
  if (
    t.startsWith('best fit') ||
    t.startsWith('recommended') ||
    t.startsWith('best for')
  )
    return 'recommended-choice';
  return null;
}

interface Section {
  heading: string; // raw heading text including markdown
  level: 2;
  body: string; // markdown body following the heading (until next H2)
  kind: CardKind;
}

function splitIntoH2Sections(markdown: string): { preamble: string; sections: Section[] } {
  const lines = markdown.split('\n');
  let preambleLines: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    const h2Match = !inFence && /^##\s+(.+?)\s*$/.exec(line);
    if (h2Match) {
      if (current) sections.push(current);
      current = {
        heading: h2Match[1].trim(),
        level: 2,
        body: '',
        kind: detectH2Card(h2Match[1]),
      };
      continue;
    }
    if (current) {
      current.body += (current.body ? '\n' : '') + line;
    } else {
      preambleLines.push(line);
    }
  }
  if (current) sections.push(current);
  return { preamble: preambleLines.join('\n'), sections };
}

const eyebrowBase =
  'block text-[11px] font-semibold uppercase tracking-[0.18em] mb-2';

const cardConfig: Record<
  Exclude<CardKind, null>,
  {
    wrapper: string;
    style?: React.CSSProperties;
    eyebrow: string;
    eyebrowClass: string;
    role: 'note' | 'complementary';
    aria: string;
    bodyClass?: string;
  }
> = {
  'short-answer': {
    wrapper:
      'my-6 rounded-lg p-4 md:p-6 border-l-4 shadow-sm not-prose-spacing',
    style: {
      backgroundColor: 'hsl(45 75% 52% / 0.06)',
      borderLeftColor: 'hsl(45 75% 45%)',
    },
    eyebrow: 'Quick Answer',
    eyebrowClass: 'text-[hsl(40_70%_35%)]',
    role: 'note',
    aria: 'Quick answer',
  },
  'hbw-note': {
    wrapper: 'my-6 rounded-lg p-4 md:p-6 border-l-[3px] shadow-sm',
    style: {
      backgroundColor: 'hsl(38 50% 92%)',
      borderLeftColor: 'hsl(var(--repower-mercury-red, 0 70% 45%))',
    },
    eyebrow: 'From the Shop',
    eyebrowClass: 'text-[hsl(0_65%_42%)]',
    role: 'complementary',
    aria: 'Note from Harris Boat Works',
    bodyClass: 'italic',
  },
  'common-mistakes': {
    wrapper: 'my-6 rounded-lg p-4 md:p-6 border-l-[3px] shadow-sm',
    style: {
      backgroundColor: 'hsl(38 65% 90%)',
      borderLeftColor: 'hsl(35 75% 50%)',
    },
    eyebrow: 'Watch Out',
    eyebrowClass: 'text-[hsl(28_75%_38%)]',
    role: 'note',
    aria: 'Common mistakes',
  },
  sources: {
    wrapper: 'my-6 rounded-md p-4 md:p-5 border-l-2 shadow-sm',
    style: {
      backgroundColor: 'hsl(220 10% 96%)',
      borderLeftColor: 'hsl(220 15% 30%)',
    },
    eyebrow: 'Verified',
    eyebrowClass: 'text-[hsl(220_15%_30%)]',
    role: 'note',
    aria: 'Sources and review notes',
  },
  'who-this-is-for': {
    wrapper: 'my-6 rounded-md p-4 md:p-5 shadow-sm text-[0.95em]',
    style: { backgroundColor: 'hsl(220 12% 97%)' },
    eyebrow: 'Who This Is For',
    eyebrowClass: 'text-[hsl(220_12%_40%)]',
    role: 'note',
    aria: 'Who this guide is for',
  },
  'when-to-call': {
    wrapper:
      'my-8 rounded-lg p-5 md:p-6 shadow-sm border text-white [&_*]:text-white [&_a]:text-[hsl(45_85%_60%)] [&_strong]:text-[hsl(45_85%_70%)]',
    style: {
      backgroundColor: 'hsl(220 25% 10%)',
      borderColor: 'hsl(45 75% 50%)',
    },
    eyebrow: 'Talk to Us',
    eyebrowClass: 'text-[hsl(45_85%_60%)]',
    role: 'complementary',
    aria: 'When to call HBW',
  },
  'try-calculator': {
    wrapper:
      'my-8 rounded-xl p-5 md:p-6 shadow-sm border-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:rounded-md [&_a]:bg-[hsl(220_55%_22%)] [&_a]:px-4 [&_a]:py-2 [&_a]:font-semibold [&_a]:!text-white [&_a]:no-underline [&_a]:shadow-sm hover:[&_a]:bg-[hsl(220_55%_18%)]',
    style: {
      background:
        'linear-gradient(135deg, hsl(220 40% 97%) 0%, hsl(45 70% 95%) 100%)',
      borderColor: 'hsl(45 75% 55%)',
    },
    eyebrow: 'Try the Calculator',
    eyebrowClass: 'text-[hsl(220_55%_22%)]',
    role: 'complementary',
    aria: 'Interactive calculator',
  },
  'dealer-note': {
    wrapper:
      'my-8 rounded-md p-5 md:p-6 border-l-[4px] shadow-sm bg-repower-gold/10 border-repower-navy-900',
    eyebrow: 'HBW Dealer Note',
    eyebrowClass: 'text-repower-navy-900',
    role: 'complementary',
    aria: 'Dealer note from Harris Boat Works',
  },
  'local-context': {
    wrapper: 'my-8 rounded-md p-5 md:p-6 shadow-sm bg-repower-gold/15',
    eyebrow: 'Local Context',
    eyebrowClass: 'text-repower-navy-900',
    role: 'note',
    aria: 'Local context note',
  },
  'choose-card': {
    // choose-card sections render via a custom grid path, not this config.
    // Stub kept so Record<CardKind> stays exhaustive.
    wrapper: '',
    eyebrow: '',
    eyebrowClass: '',
    role: 'note',
    aria: '',
  },
};

interface Props {
  content: string;
  markdownComponents: Components;
}

export function MarkdownSectionCards({ content, markdownComponents }: Props) {
  const { preamble, sections } = splitIntoH2Sections(
    preprocessSpecialBlocks(content),
  );

  // Inline H3/H4 "Recommended Choice" wrapping is handled via component overrides
  // (we wrap just the heading + immediate paragraph siblings is non-trivial in
  // react-markdown — for safety we apply a subtle inline style on the heading
  // via an extended override). Implemented below.
  const componentsWithInline: Components = {
    ...markdownComponents,
    h3: (props) => {
      const text = String((props as any).children ?? '');
      const kind = detectInlineCard(text);
      if (kind === 'recommended-choice') {
        return (
          <h3
            {...(props as any)}
            className="mt-6 mb-2 inline-block rounded-md px-3 py-1 text-base font-semibold"
            style={{
              backgroundColor: 'hsl(170 30% 92%)',
              color: 'hsl(170 40% 22%)',
              borderLeft: '3px solid hsl(170 40% 35%)',
            }}
          />
        );
      }
      // delegate to original
      const Original = markdownComponents.h3 as any;
      return Original ? <Original {...props} /> : <h3 {...(props as any)} />;
    },
  };

  // Render a synthetic short-answer (Quick Answer) card from a blockquote body.
  const renderQuickAnswerCard = (body: string, key: string) => {
    const cfg = cardConfig['short-answer'];
    return (
      <aside
        key={key}
        role={cfg.role}
        aria-label={cfg.aria}
        data-speakable="true"
        className={cfg.wrapper}
        style={cfg.style}
      >
        <span className={`${eyebrowBase} ${cfg.eyebrowClass}`} aria-hidden="true">
          {cfg.eyebrow}
        </span>
        <div className={cfg.bodyClass}>
          {renderMarkdownWithDirectives(body, componentsWithInline, `${key}-md`)}
        </div>
      </aside>
    );
  };

  // Render unstyled markdown while extracting any top-level
  // `> **Quick answer:**` blockquotes into Quick Answer cards in document order.
  const renderWithQuickAnswerExtraction = (md: string, keyPrefix: string) => {
    const chunks = extractQuickAnswerChunks(md);
    return chunks.map((c, i) => {
      if (c.kind === 'quick-answer') {
        return renderQuickAnswerCard(c.content, `${keyPrefix}-qa-${i}`);
      }
      if (!c.content.trim()) return null;
      return (
        <div key={`${keyPrefix}-md-${i}`}>
          {renderMarkdownWithDirectives(
            c.content,
            componentsWithInline,
            `${keyPrefix}-md-${i}`,
          )}
        </div>
      );
    });
  };

  // Render a single section as its configured aside card.
  const renderConfiguredCard = (section: Section, idx: number) => {
    const headingMd = `## ${section.heading}\n\n${section.body}`;
    const cfg = cardConfig[section.kind as Exclude<CardKind, null>];
    const isPhoneCard = section.kind === 'when-to-call';
    const isDealerNote = section.kind === 'dealer-note';
    const isLocalContext = section.kind === 'local-context';
    // For dealer-note and local-context, the eyebrow (and icon+heading)
    // replaces the H2, so render only the body markdown.
    const bodyMd =
      isDealerNote || isLocalContext ? section.body : headingMd;
    return (
      <aside
        key={idx}
        role={cfg.role}
        aria-label={cfg.aria}
        className={cfg.wrapper}
        style={cfg.style}
      >
        <span
          className={`${eyebrowBase} ${cfg.eyebrowClass} inline-flex items-center gap-1.5`}
          aria-hidden="true"
        >
          {section.kind === 'try-calculator' && (
            <Calculator className="h-3.5 w-3.5" />
          )}
          {isLocalContext && <MapPin className="h-3.5 w-3.5" />}
          {cfg.eyebrow}
        </span>
        {isLocalContext && (
          <h3 className="not-prose mt-1 mb-3 font-display text-lg md:text-xl font-semibold text-repower-navy-900">
            {section.heading}
          </h3>
        )}
        <div className={cfg.bodyClass}>
          {renderMarkdownWithDirectives(
            bodyMd,
            componentsWithInline,
            `c-${idx}`,
          )}
        </div>
        {isPhoneCard && (
          <a
            href="tel:9053422153"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-[hsl(45_85%_55%)] px-4 py-2 font-semibold !text-[hsl(220_25%_10%)] no-underline shadow-sm hover:bg-[hsl(45_85%_50%)]"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call 905-342-2153
          </a>
        )}
      </aside>
    );
  };

  // Render a run of consecutive choose-card sections as a decision-card grid.
  const renderChooseGrid = (group: Section[], startIdx: number) => {
    return (
      <div
        key={`choose-${startIdx}`}
        className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-8"
      >
        {group.map((sec, i) => {
          const label = extractChooseLabel(sec.heading);
          return (
            <div
              key={`${startIdx}-${i}`}
              className="flex flex-col h-full rounded-md p-5 shadow-sm bg-repower-gold/10 border-l-[4px] border-repower-navy-900"
            >
              <span
                className={`${eyebrowBase} text-repower-navy-900/70`}
                aria-hidden="true"
              >
                Choose this if
              </span>
              <h3 className="mt-1 mb-3 font-display text-lg font-bold text-repower-navy-900">
                {label}
              </h3>
              <div className="prose prose-sm max-w-none text-repower-navy-900/90 [&_ul]:my-0 [&_p]:my-0 [&_p+ul]:mt-2">
                {renderMarkdownWithDirectives(
                  sec.body,
                  componentsWithInline,
                  `cg-${startIdx}-${i}`,
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < sections.length) {
    const section = sections[i];

    // Group consecutive choose-card sections (only when 2+ in a row).
    if (section.kind === 'choose-card') {
      let j = i + 1;
      while (j < sections.length && sections[j].kind === 'choose-card') j++;
      const group = sections.slice(i, j);
      if (group.length >= 2) {
        nodes.push(renderChooseGrid(group, i));
        i = j;
        continue;
      }
      // Lone choose-card: fall through to default H2 rendering.
      const headingMd = `## ${section.heading}\n\n${section.body}`;
      nodes.push(
        <div key={i}>
          {renderWithQuickAnswerExtraction(headingMd, `s-${i}`)}
        </div>,
      );
      i++;
      continue;
    }

    if (!section.kind) {
      const headingMd = `## ${section.heading}\n\n${section.body}`;
      nodes.push(
        <div key={i}>
          {renderWithQuickAnswerExtraction(headingMd, `s-${i}`)}
        </div>,
      );
      i++;
      continue;
    }

    nodes.push(renderConfiguredCard(section, i));
    i++;
  }

  return (
    <>
      {preamble.trim() && renderWithQuickAnswerExtraction(preamble, 'pre')}
      {nodes}
    </>
  );
}
