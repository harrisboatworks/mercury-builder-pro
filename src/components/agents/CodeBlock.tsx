import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  language?: 'bash' | 'json' | 'http' | 'url';
  size?: 'sm' | 'xs';
  className?: string;
}

export interface CodeBlockToken {
  text: string;
  className?: string;
}

type CodeBlockLanguage = NonNullable<CodeBlockProps['language']>;

function isWordChar(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z0-9_]/.test(char));
}

function readQuoted(code: string, start: number, quote: '"' | "'"): string {
  let end = start + 1;
  while (end < code.length) {
    if (quote === '"' && code[end] === '\\' && end + 1 < code.length) {
      end += 2;
      continue;
    }
    if (code[end] === quote) {
      end += 1;
      break;
    }
    end += 1;
  }
  return code.slice(start, end);
}

function tokenizeJson(code: string): CodeBlockToken[] {
  const tokens: CodeBlockToken[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    if (char === '"') {
      const text = readQuoted(code, i, '"');
      i += text.length;
      let rest = i;
      while (rest < code.length && /\s/.test(code[rest])) rest += 1;
      const isKey = code[rest] === ':';
      tokens.push({
        text,
        className: isKey ? 'text-sky-300' : 'text-emerald-300',
      });
      continue;
    }

    if ((char === '-' && i + 1 < code.length && /\d/.test(code[i + 1])) || /\d/.test(char)) {
      const match = code.slice(i).match(/^-?\d+(?:\.\d+)?/);
      if (match) {
        tokens.push({ text: match[0], className: 'text-amber-300' });
        i += match[0].length;
        continue;
      }
    }

    const word = code.slice(i).match(/^(true|false|null)\b/);
    if (word) {
      tokens.push({ text: word[0], className: 'text-purple-300' });
      i += word[0].length;
      continue;
    }

    tokens.push({ text: char });
    i += 1;
  }

  return tokens;
}

function tokenizeBash(code: string): CodeBlockToken[] {
  const tokens: CodeBlockToken[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    if (char === "'" || char === '"') {
      const text = readQuoted(code, i, char);
      tokens.push({ text, className: 'text-emerald-300' });
      i += text.length;
      continue;
    }

    if (code.startsWith('https://', i) || code.startsWith('http://', i)) {
      let end = i;
      while (end < code.length && !/[\s'"\\]/.test(code[end])) end += 1;
      tokens.push({ text: code.slice(i, end), className: 'text-sky-300' });
      i = end;
      continue;
    }

    if (!isWordChar(code[i - 1])) {
      const keyword = code.slice(i).match(/^(curl|GET|POST|PUT|DELETE|PATCH)\b/);
      if (keyword) {
        tokens.push({ text: keyword[0], className: 'text-purple-300 font-semibold' });
        i += keyword[0].length;
        continue;
      }
    }

    if (i > 0 && /\s/.test(code[i - 1]) && char === '-') {
      const flag = code.slice(i).match(/^(-[A-Za-z]|--[A-Za-z-]+)/);
      if (flag) {
        tokens.push({ text: flag[0], className: 'text-amber-300' });
        i += flag[0].length;
        continue;
      }
    }

    tokens.push({ text: char });
    i += 1;
  }

  return tokens;
}

function tokenizeUrl(code: string): CodeBlockToken[] {
  const tokens: CodeBlockToken[] = [];
  let i = 0;

  while (i < code.length) {
    if (code.startsWith('https://', i) || code.startsWith('http://', i)) {
      let end = i;
      while (end < code.length && !/[\s?#]/.test(code[end])) end += 1;
      tokens.push({ text: code.slice(i, end), className: 'text-sky-300' });
      i = end;
      continue;
    }

    if (code.startsWith('//', i)) {
      let end = i;
      while (end < code.length && code[end] !== '\n') end += 1;
      tokens.push({ text: code.slice(i, end), className: 'text-repower-paper/50' });
      i = end;
      continue;
    }

    if ((code[i] === '?' || code[i] === '&') && i + 1 < code.length) {
      const param = code.slice(i + 1).match(/^[a-zA-Z_][\w]*=/);
      if (param) {
        tokens.push({ text: code[i] });
        tokens.push({
          text: param[0].slice(0, -1),
          className: 'text-amber-300',
        });
        tokens.push({ text: '=' });
        i += 1 + param[0].length;
        continue;
      }
    }

    tokens.push({ text: code[i] });
    i += 1;
  }

  return tokens;
}

function coalesceTokens(tokens: CodeBlockToken[]): CodeBlockToken[] {
  const merged: CodeBlockToken[] = [];
  for (const token of tokens) {
    const previous = merged[merged.length - 1];
    if (previous && previous.className === token.className) {
      previous.text += token.text;
    } else {
      merged.push({ text: token.text, className: token.className });
    }
  }
  return merged;
}

export function tokenizeCodeBlock(code: string, language: CodeBlockLanguage): CodeBlockToken[] {
  if (language === 'json') return coalesceTokens(tokenizeJson(code));
  if (language === 'bash' || language === 'http') return coalesceTokens(tokenizeBash(code));
  if (language === 'url') return coalesceTokens(tokenizeUrl(code));
  return [{ text: code }];
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

export function CodeBlock({ children, language = 'bash', size = 'sm', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const tokens = useMemo(() => tokenizeCodeBlock(children, language), [children, language]);

  const clearResetTimer = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  useEffect(() => () => clearResetTimer(), []);

  const markCopied = () => {
    setCopied(true);
    setCopyFailed(false);
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, 2000);
  };

  const markFailed = () => {
    clearResetTimer();
    setCopied(false);
    setCopyFailed(true);
  };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('clipboard-unavailable');
      }
      await navigator.clipboard.writeText(children);
      markCopied();
    } catch {
      if (fallbackCopy(children)) {
        markCopied();
        return;
      }
      markFailed();
    }
  };

  const highlighted: ReactNode = tokens.map((token, index) => (
    token.className
      ? <span key={index} className={token.className}>{token.text}</span>
      : <Fragment key={index}>{token.text}</Fragment>
  ));

  const copyLabel = copyFailed ? 'Copy failed' : copied ? 'Copied' : 'Copy to clipboard';

  return (
    <div className={cn('relative group my-4', className)}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copyLabel}
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
        <code className="block">{highlighted}</code>
      </pre>
      {copyFailed && (
        <p
          role="status"
          aria-live="polite"
          data-testid="code-block-copy-status"
          className="mt-2 text-xs font-medium text-red-300"
        >
          Copy failed
        </p>
      )}
    </div>
  );
}
