import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';

export function MandarinFaqAnswer({ answer }: { answer: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={defaultUrlTransform}
      components={{
        p: ({ children }) => <p className="m-0">{children}</p>,
        a: ({ href, children }) => {
          if (!href) return <span>{children}</span>;

          const isInternal =
            href.startsWith('/') ||
            href.startsWith('#') ||
            /^https?:\/\/([^/]*\.)?(mercuryrepower\.ca|mercuryquote\.ca|mercury-quote-tool\.lovable\.app)(\/|$)/i.test(
              href,
            );
          const className = 'font-semibold text-primary underline underline-offset-2 hover:no-underline';

          if (isInternal) {
            const to = href.startsWith('#')
              ? href
              : href.replace(/^https?:\/\/[^/]+/, '') || '/';
            return <Link to={to} className={className}>{children}</Link>;
          }

          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {answer}
    </ReactMarkdown>
  );
}
