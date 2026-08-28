import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseMessageText, type ParsedSegment, getInternalPath } from '@/lib/textParser';

interface MarkdownChatBodyProps {
  text: string;
  isUser: boolean;
  /**
   * Called when the user clicks an internal-path link (e.g. "/quote/...").
   * If provided, the link is rendered as a button that calls this callback
   * (lets the parent close/minimize the chat before navigating). If not
   * provided, the internal link falls through to a normal anchor.
   */
  onInternalLink?: (path: string) => void;
  className?: string;
}

/**
 * Renders a chat message body that supports BOTH:
 *  1) The existing parseMessageText pipeline for images, internal paths, and
 *     plain URLs (so CTA tag extraction and internal navigation still work).
 *  2) Markdown rendering (bold, italics, lists, inline code, line breaks,
 *     GFM features) on the plain-text segments — sanitized: raw HTML is NOT
 *     rendered by react-markdown unless rehype-raw is added, so we get safe
 *     defaults out of the box.
 *
 * Important: the AI prompts deliberately emit markdown like **bold** and
 * bullet lists. Before this component, the chat UIs wrapped messages in a
 * `<p className="whitespace-pre-wrap">` with NO markdown parser — so users
 * saw literal asterisks. This component is the fix.
 */
export const MarkdownChatBody: React.FC<MarkdownChatBodyProps> = ({
  text,
  isUser,
  onInternalLink,
  className,
}) => {
  const segments = parseMessageText(text);

  const linkClasses = isUser
    ? 'underline text-red-100 hover:text-white transition-colors'
    : 'underline text-primary hover:text-primary/80 transition-colors';

  return (
    <div className={className}>
      {segments.map((segment: ParsedSegment, index: number) => {
        if (segment.type === 'image') {
          return (
            <img
              key={index}
              src={segment.href}
              alt={segment.alt || 'Product image'}
              className="max-w-full rounded-lg my-2 border border-gray-200"
              style={{ maxHeight: '200px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          );
        }

        if (segment.type === 'internal-link' && segment.href) {
          if (onInternalLink) {
            return (
              <button
                key={index}
                onClick={() => onInternalLink(getInternalPath(segment.href!))}
                className={linkClasses}
                type="button"
              >
                {segment.content}
              </button>
            );
          }
          return (
            <a key={index} href={getInternalPath(segment.href)} className={linkClasses}>
              {segment.content}
            </a>
          );
        }

        if (segment.type === 'url') {
          return (
            <a
              key={index}
              href={segment.href}
              className={linkClasses}
              target="_blank"
              rel="noopener noreferrer"
            >
              {segment.content}
            </a>
          );
        }

        // Plain text → run through ReactMarkdown with GFM.
        // Raw HTML is sanitized out by react-markdown's default behavior
        // (rehype-raw is NOT enabled here intentionally).
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            // Keep the surrounding container's typography; render markdown
            // children inline-friendly so paragraphs don't double-wrap.
            components={{
              p: ({ children }) => (
                <span className="block whitespace-pre-wrap leading-relaxed">{children}</span>
              ),
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="px-1 py-0.5 rounded bg-black/5 text-[0.92em] font-mono">
                  {children}
                </code>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-snug">{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className={linkClasses}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              // Block raw HTML — react-markdown already skips it without
              // rehype-raw, but be explicit for headings/tables that we
              // don't want eating the bubble layout.
              h1: ({ children }) => <strong className="block font-semibold">{children}</strong>,
              h2: ({ children }) => <strong className="block font-semibold">{children}</strong>,
              h3: ({ children }) => <strong className="block font-semibold">{children}</strong>,
            }}
          >
            {segment.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
};

export default MarkdownChatBody;
