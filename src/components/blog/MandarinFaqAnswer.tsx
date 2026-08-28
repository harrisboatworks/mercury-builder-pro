import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MandarinMarkdownLink } from './MandarinMarkdownLink';

export function MandarinFaqAnswer({ answer }: { answer: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={defaultUrlTransform}
      components={{
        p: ({ children }) => <p className="m-0">{children}</p>,
        a: ({ href, children }) => (
          <MandarinMarkdownLink
            href={href}
            className="font-semibold text-primary underline underline-offset-2 hover:no-underline"
          >
            {children}
          </MandarinMarkdownLink>
        ),
      }}
    >
      {answer}
    </ReactMarkdown>
  );
}
