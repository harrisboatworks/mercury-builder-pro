export type BlogSectionCardKind =
  | 'short-answer'
  | 'hbw-note'
  | 'common-mistakes'
  | 'sources'
  | 'who-this-is-for'
  | 'when-to-call'
  | 'when-to-service'
  | 'try-calculator'
  | 'dealer-note'
  | 'local-context'
  | 'choose-card'
  | null;

export const normalizeSectionCardHeading = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

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

export function detectH2Card(headingText: string): BlogSectionCardKind {
  const t = normalizeSectionCardHeading(headingText);
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
  ) return 'short-answer';
  if (
    t.startsWith('what hbw checks before') ||
    t === 'what hbw does' ||
    t === 'what we do at hbw' ||
    t === 'what we actually see' ||
    t.startsWith('what we see at hbw') ||
    t === 'hbw local note' ||
    t === 'hbw shop note' ||
    t === 'shop note' ||
    t.startsWith('from the shop')
  ) return 'hbw-note';
  if (
    t.startsWith('common mistakes') ||
    t === 'mistakes to avoid' ||
    t === 'what goes wrong' ||
    t === 'common pitfalls' ||
    (t.includes('mistake') &&
      (t.startsWith('common ') ||
        t.includes('mistakes we see') ||
        /^the \d+ mistakes\b/.test(t) ||
        t.startsWith('prop mistakes'))) ||
    t.startsWith('watch out for')
  ) return 'common-mistakes';
  if (
    t === 'sources and review notes' ||
    t === 'sources' ||
    t === 'review notes' ||
    t === 'verification' ||
    t.startsWith('official references')
  ) return 'sources';
  if (t === 'who this guide is for' || t === 'who this is for' || t === 'who should read this') {
    return 'who-this-is-for';
  }
  if (t === 'when to call hbw' || t === 'when to call us') return 'when-to-call';
  if (t === 'when to bring it in' || t.startsWith('when to bring it to hbw')) return 'when-to-service';
  if (t === 'try the calculator' || t === 'run the numbers' || t === 'try the tool') return 'try-calculator';
  if (t === 'dealer note' || t === 'hbw dealer note') return 'dealer-note';
  if (LOCAL_CONTEXT_HEADINGS.has(t)) return 'local-context';
  if (CHOOSE_HEADING_RE.test(headingText)) return 'choose-card';
  return null;
}
