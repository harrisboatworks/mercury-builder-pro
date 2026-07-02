import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type CTAVariant = 'inline' | 'banner';

interface BlogCTAProps {
  category?: string;
  slug?: string;
  variant?: CTAVariant;
  className?: string;
}

interface CTAConfig {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  buttonLabel?: string;
}


function pickCTA(category = '', slug = '', variant: CTAVariant = 'banner'): CTAConfig {
  const cat = category.toLowerCase();
  const s = slug.toLowerCase();

  // Rentals: route to Harris rentals booking. For the GTA post we allow ONE
  // motor-pricing CTA at the very end (variant === 'banner') and use the
  // rentals CTA everywhere else. The shared-access post uses rentals for both.
  const isRentalGta = s === 'rice-lake-boat-rentals-from-toronto-gta';
  const isRentalShared = s === 'boat-rentals-shared-access-booming-2026';
  if (isRentalShared || (isRentalGta && variant === 'inline')) {
    return {
      title: 'Book a boat on Rice Lake',
      description:
        "Nine boats, live availability, life jackets included. Book online and you're on the water in minutes.",
      href: 'https://harrisboatworks.ca/rentals',
      external: true,
      buttonLabel: 'Check Availability',
    };
  }



  // Trade-in
  if (s.includes('trade-in') || cat.includes('trade')) {
    return {
      title: 'Value Your Trade-In',
      description: 'Get an instant estimate on your current outboard. Credit applies directly to your new Mercury.',
      href: '/trade-in-value',
    };
  }

  // Financing
  if (s.includes('financing') || s.includes('finance') || cat.includes('financing')) {
    return {
      title: 'Estimate Your Monthly Payment',
      description: 'See real Mercury financing options with current Ontario rates. No credit check to view.',
      href: '/financing',
    };
  }

  // Maintenance / winterization / troubleshooting / service
  if (
    s.includes('maintenance') ||
    s.includes('winteriz') ||
    s.includes('service') ||
    s.includes('commission') ||
    s.includes('break-in') ||
    s.includes('troubleshoot') ||
    cat.includes('maintenance') ||
    cat.includes('service')
  ) {
    return {
      title: 'Request Service',
      description: 'Book Mercury service with the Kawartha region\'s certified Mercury dealer. Family marina since 1947.',
      href: '/contact',
    };
  }

  // Repower / cost / comparison
  if (
    s.includes('repower') ||
    s.includes('cost') ||
    s.includes('vs-') ||
    s.includes('-vs') ||
    cat.includes('repower') ||
    cat.includes('compar')
  ) {
    return {
      title: 'Build Your Mercury Repower Quote',
      description: 'Live pricing on every Mercury we sell. Configure your repower in under 3 minutes.',
      href: '/quote/motor-selection',
    };
  }

  // Default - buying guides
  return {
    title: 'Browse Live Mercury Pricing',
    description: 'See real CAD pricing on every Mercury outboard we sell. Updated daily.',
    href: '/quote/motor-selection',
  };
}

export function BlogCTA({ category, slug, variant = 'banner', className = '' }: BlogCTAProps) {
  const cta = pickCTA(category, slug, variant);

  const button = (
    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-repower-mercury-red text-white rounded-lg font-medium hover:bg-repower-mercury-red-deep transition-colors">
      {cta.title}
      <ArrowRight className="h-4 w-4" />
    </span>
  );

  const wrapperClass =
    variant === 'inline'
      ? `my-8 p-5 md:p-6 bg-repower-cream border border-repower-navy-900/10 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`
      : `mt-14 p-8 md:p-10 bg-repower-cream border border-repower-navy-900/10 rounded-lg text-center ${className}`;

  return (
    <aside className={wrapperClass} aria-label="Call to action">
      {variant === 'banner' && <div className="h-px w-12 bg-repower-gold mx-auto mb-6" />}
      <div className={variant === 'banner' ? '' : 'flex-1'}>
        <h3
          className={`font-display font-bold text-repower-navy-900 ${
            variant === 'banner' ? 'text-xl md:text-2xl mb-3' : 'text-lg md:text-xl mb-1'
          }`}
          style={{ letterSpacing: '-0.02em' }}
        >
          {cta.title}
        </h3>
        <p
          className={`font-sans text-repower-navy-900/70 ${
            variant === 'banner' ? 'mb-6' : 'text-[15px] mb-0'
          }`}
        >
          {cta.description}
        </p>
      </div>
      <div className={variant === 'banner' ? 'flex justify-center' : ''}>
        {cta.external ? (
          <a href={cta.href} target="_blank" rel="noopener noreferrer">
            {button}
          </a>
        ) : (
          <Link to={cta.href}>{button}</Link>
        )}
      </div>
    </aside>
  );
}
