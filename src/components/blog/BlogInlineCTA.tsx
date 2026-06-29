import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface BlogInlineCTAProps {
  variant: 'inline' | 'banner';
  heading: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  phone?: string;
  /**
   * Footer line that may contain a single inline link in the form
   * `before [link text](/path) after`. Only one link is parsed.
   */
  footer?: string;
}

function renderInternal(href: string, label: React.ReactNode, kind: 'primary' | 'secondary') {
  const primaryClasses =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-repower-mercury-red text-white rounded-lg font-medium hover:bg-repower-mercury-red-deep transition-colors no-underline';
  const secondaryClasses =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-repower-navy-900 text-repower-navy-900 rounded-lg font-medium hover:bg-repower-navy-900 hover:text-white transition-colors no-underline';
  const cls = kind === 'primary' ? primaryClasses : secondaryClasses;
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {label}
        {kind === 'primary' && <ArrowRight className="h-4 w-4" />}
      </a>
    );
  }
  return (
    <Link to={href} className={cls}>
      {label}
      {kind === 'primary' && <ArrowRight className="h-4 w-4" />}
    </Link>
  );
}

function renderFooter(footer: string) {
  const m = /^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/.exec(footer);
  if (!m) {
    return <span>{footer}</span>;
  }
  const [, before, linkText, href, after] = m;
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <span>
      {before}
      {isExternal ? (
        <a href={href} className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">
          {linkText}
        </a>
      ) : (
        <Link to={href} className="underline hover:no-underline">
          {linkText}
        </Link>
      )}
      {after}
    </span>
  );
}

export function BlogInlineCTA(props: BlogInlineCTAProps) {
  const { variant, heading, body, primaryLabel, primaryHref, secondaryLabel, secondaryHref, phone, footer } = props;

  if (variant === 'inline') {
    return (
      <aside
        className="not-prose my-8 p-5 md:p-6 bg-repower-cream border border-repower-navy-900/10 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        aria-label="Call to action"
      >
        <div className="flex-1">
          <h3
            className="font-display font-bold text-repower-navy-900 text-lg md:text-xl mb-1"
            style={{ letterSpacing: '-0.02em' }}
          >
            {heading}
          </h3>
          <p className="font-sans text-repower-navy-900/70 text-[15px] mb-0">{body}</p>
        </div>
        <div className="shrink-0">{renderInternal(primaryHref, primaryLabel, 'primary')}</div>
      </aside>
    );
  }

  return (
    <aside
      className="not-prose mt-14 p-8 md:p-10 bg-repower-cream border border-repower-navy-900/10 rounded-lg text-center"
      aria-label="Call to action"
    >
      <div className="h-px w-12 bg-repower-gold mx-auto mb-6" />
      <h3
        className="font-display font-bold text-repower-navy-900 text-xl md:text-2xl mb-3"
        style={{ letterSpacing: '-0.02em' }}
      >
        {heading}
      </h3>
      <p className="font-sans text-repower-navy-900/70 mb-6 max-w-2xl mx-auto">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {renderInternal(primaryHref, primaryLabel, 'primary')}
        {secondaryLabel && secondaryHref && renderInternal(secondaryHref, secondaryLabel, 'secondary')}
      </div>
      {phone && (
        <p className="mt-4 text-sm text-repower-navy-900/70">
          Questions?{' '}
          <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="font-semibold underline hover:no-underline">
            Call {phone}
          </a>
        </p>
      )}
      {footer && <p className="mt-4 text-sm text-repower-navy-900/60">{renderFooter(footer)}</p>}
    </aside>
  );
}

export default BlogInlineCTA;
