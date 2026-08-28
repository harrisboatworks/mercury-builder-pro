import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  language?: 'bash' | 'json' | 'http' | 'url';
  size?: 'sm' | 'xs';
  className?: string;
}

// Lightweight tokenizer — no external highlighter, works in all browsers.
function highlight(code: string, lang: CodeBlockProps['language']): string {
  // Escape HTML first
  let s = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (lang === 'json') {
    s = s
      // strings (keys + values)
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)?/g, (_m, str, colon) =>
        colon
          ? `<span class="text-sky-300">"${str}"</span>${colon}`
          : `<span class="text-emerald-300">"${str}"</span>`
      )
      // numbers
      .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="text-amber-300">$1</span>')
      // booleans/null
      .replace(/\b(true|false|null)\b/g, '<span class="text-purple-300">$1</span>');
    return s;
  }

  if (lang === 'bash' || lang === 'http') {
    s = s
      // HTTP verbs / curl
      .replace(/\b(curl|GET|POST|PUT|DELETE|PATCH)\b/g, '<span class="text-purple-300 font-semibold">$1</span>')
      // flags
      .replace(/(\s)(-[A-Za-z]|--[A-Za-z-]+)/g, '$1<span class="text-amber-300">$2</span>')
      // single-quoted strings
      .replace(/'([^']*)'/g, "<span class=\"text-emerald-300\">'$1'</span>")
      // double-quoted strings
      .replace(/"([^"]*)"/g, '<span class="text-emerald-300">"$1"</span>')
      // urls
      .replace(/(https?:\/\/[^\s'"\\]+)/g, '<span class="text-sky-300">$1</span>');
    return s;
  }

  if (lang === 'url') {
    s = s
      .replace(/(https?:\/\/[^\s?#]+)/g, '<span class="text-sky-300">$1</span>')
      .replace(/([?&])([a-zA-Z_][\w]*)=/g, '$1<span class="text-amber-300">$2</span>=')
      .replace(/(\/\/[^\n]*)/g, '<span class="text-repower-paper/50">$1</span>');
    return s;
  }

  return s;
}

export function CodeBlock({ children, language = 'bash', size = 'sm', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(children, language), [children, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = children;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div className={cn('relative group my-4', className)}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        className={cn(
          'absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
          'bg-repower-navy-800 text-repower-paper border border-repower-paper/15',
          'hover:bg-repower-navy-700 hover:border-repower-paper/30 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-repower-paper/40',
          copied && 'bg-emerald-600 border-emerald-500 text-white'
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre
        className={cn(
          'bg-repower-navy-900 text-repower-paper rounded-md p-4 pr-14',
          'overflow-x-auto whitespace-pre',
          'sm:whitespace-pre',
          'max-sm:whitespace-pre-wrap max-sm:break-words',
          size === 'xs' ? 'text-xs' : 'text-sm',
          'leading-relaxed font-mono'
        )}
      >
        <code
          className="block"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
