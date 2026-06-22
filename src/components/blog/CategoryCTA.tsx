import { Link } from 'react-router-dom';

export type CategoryCTAVariant =
  | 'repower-buying'
  | 'service'
  | 'seasonal'
  | 'general';

export function getCTAVariant(category: string | undefined): CategoryCTAVariant {
  if (!category) return 'general';
  const c = category.toLowerCase();
  if (c.includes('service') || c.includes('troubleshoot') || c.includes('maintenance')) return 'service';
  if (c.includes('lifestyle') || c.includes('winteriz') || c.includes('seasonal')) return 'seasonal';
  if (c.includes('buying') || c.includes('mercury') || c.includes('repower') || c.includes('pricing')) return 'repower-buying';
  return 'general';
}

const SUPPRESS_MARKERS: RegExp[] = [
  /\/quote\/motor-selection/i,
  /\/trade-in-value/i,
  /hbw\.wiki\/service/i,
  /^##\s+Ready to\s+/im,
  /^##\s+When to Call/im,
  /^##\s+When to Use the Estimator/im,
];

export function shouldSuppressAutoCTA(content: string | undefined): boolean {
  if (!content) return false;
  return SUPPRESS_MARKERS.some((re) => re.test(content));
}

interface CategoryCTAProps {
  category?: string;
  className?: string;
}

const PHONE_HREF = 'tel:+19053422153';
const PHONE_LABEL = 'Call 905-342-2153';

const primaryBtn =
  'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep transition no-underline';
const secondaryBtn =
  'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border-2 border-white/80 text-white hover:bg-white hover:text-repower-navy-900 transition no-underline';
const tertiaryLink =
  'inline-flex items-center justify-center px-2 py-3 font-semibold text-white/90 hover:text-white underline-offset-4 hover:underline no-underline';

function CardShell({
  heading,
  body,
  children,
  className,
}: {
  heading: string;
  body: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={
        'mt-12 not-prose rounded-2xl bg-repower-navy-900 text-white p-8 md:p-10 shadow-lg ' +
        (className ?? '')
      }
    >
      <h2 className="font-display font-bold text-2xl md:text-3xl mb-3" style={{ letterSpacing: '-0.02em' }}>
        {heading}
      </h2>
      <p className="text-white/85 text-base md:text-lg mb-6 max-w-2xl">{body}</p>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
        {children}
      </div>
    </aside>
  );
}

export function CategoryCTA({ category, className }: CategoryCTAProps) {
  const variant = getCTAVariant(category);

  if (variant === 'service') {
    return (
      <CardShell
        heading="Need a Tech to Look at It?"
        body="Book service through HBW. Online intake is faster than the phone for most cases."
        className={className}
      >
        <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" className={primaryBtn}>
          Book service
        </a>
        <a href={PHONE_HREF} className={tertiaryLink}>{PHONE_LABEL}</a>
      </CardShell>
    );
  }

  if (variant === 'seasonal') {
    return (
      <CardShell
        heading="Plan the Next Season"
        body="Spring commissioning, winterization, mid-season checks. Lock the slot before the rush."
        className={className}
      >
        <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" className={primaryBtn}>
          Book service
        </a>
        <Link to="/quote/motor-selection" className={secondaryBtn}>
          Build a repower quote
        </Link>
      </CardShell>
    );
  }

  if (variant === 'repower-buying') {
    return (
      <CardShell
        heading="Ready to Price Your Repower?"
        body="Two minutes from now you can have a real number for your boat."
        className={className}
      >
        <Link to="/quote/motor-selection" className={primaryBtn}>Build your quote</Link>
        <Link to="/trade-in-value" className={secondaryBtn}>Instant trade estimate</Link>
        <a href={PHONE_HREF} className={tertiaryLink}>{PHONE_LABEL}</a>
      </CardShell>
    );
  }

  return (
    <CardShell
      heading="Ready to See Your Number?"
      body="Build a quote, check trade value, or call us."
      className={className}
    >
      <Link to="/quote/motor-selection" className={primaryBtn}>Build your quote</Link>
      <Link to="/trade-in-value" className={secondaryBtn}>Trade-in estimator</Link>
      <a href={PHONE_HREF} className={tertiaryLink}>{PHONE_LABEL}</a>
    </CardShell>
  );
}

export default CategoryCTA;
