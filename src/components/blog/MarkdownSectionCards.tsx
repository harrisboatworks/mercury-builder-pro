import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Phone } from 'lucide-react';
import {
  ImagePlaceholder,
  type ImagePlaceholderProps,
  type PlaceholderAspect,
  type PlaceholderType,
} from './ImagePlaceholder';
import { getPlaceholder } from '@/data/imagePlaceholders';

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
  kind: 'md' | 'placeholder';
  content: string;
  props?: ImagePlaceholderProps;
}

function splitDirectives(md: string): RenderChunk[] {
  const re = /:::image-placeholder\s*\n([\s\S]*?)\n:::/g;
  const chunks: RenderChunk[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    if (m.index > last) {
      chunks.push({ kind: 'md', content: md.slice(last, m.index) });
    }
    const props = parseDirective(m[1]);
    if (props) {
      chunks.push({ kind: 'placeholder', content: '', props });
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
    t === 'tl dr'
  )
    return 'short-answer';
  if (
    t.startsWith('what hbw checks before') ||
    t === 'what hbw does' ||
    t === 'what we actually see' ||
    t === 'what we see at hbw' ||
    t === 'hbw local note' ||
    t === 'hbw shop note'
  )
    return 'hbw-note';
  if (
    t === 'common mistakes' ||
    t === 'mistakes to avoid' ||
    t === 'what goes wrong' ||
    t === 'common pitfalls'
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
  return null;
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
};

interface Props {
  content: string;
  markdownComponents: Components;
}

export function MarkdownSectionCards({ content, markdownComponents }: Props) {
  const { preamble, sections } = splitIntoH2Sections(content);

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

  return (
    <>
      {preamble.trim() && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentsWithInline}>
          {preamble}
        </ReactMarkdown>
      )}
      {sections.map((section, idx) => {
        const headingMd = `## ${section.heading}\n\n${section.body}`;
        if (!section.kind) {
          return (
            <ReactMarkdown
              key={idx}
              remarkPlugins={[remarkGfm]}
              components={componentsWithInline}
            >
              {headingMd}
            </ReactMarkdown>
          );
        }
        const cfg = cardConfig[section.kind];
        const isPhoneCard = section.kind === 'when-to-call';
        return (
          <aside
            key={idx}
            role={cfg.role}
            aria-label={cfg.aria}
            className={cfg.wrapper}
            style={cfg.style}
          >
            <span className={`${eyebrowBase} ${cfg.eyebrowClass}`} aria-hidden="true">
              {cfg.eyebrow}
            </span>
            <div className={cfg.bodyClass}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={componentsWithInline}
              >
                {headingMd}
              </ReactMarkdown>
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
      })}
    </>
  );
}
