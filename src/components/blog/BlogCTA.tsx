import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { isDiagnosticArticle } from '@/lib/isDiagnosticArticle';
import { BLOG_REVENUE_DRIVER, getBlogRevenueDriver } from '@/lib/blogRevenueDriver.js';

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

function pickCTA(category = '', slug = ''): CTAConfig | null {
  const revenueDriver = getBlogRevenueDriver(category, slug);

  if (revenueDriver === BLOG_REVENUE_DRIVER.NONE) return null;

  // Diagnostic content has one next step: the service intake. Keep phone,
  // sales, pricing, and "diagnose it remotely" language out of these posts.
  if (isDiagnosticArticle(category, slug)) {
    return {
      title: 'Need an In-Shop Diagnosis?',
      description:
        "HBW diagnoses faults at our Gores Landing shop. If you can bring the boat to us, include the code, engine serial number, hours, and a photo of the display with your service request. We don't diagnose faults remotely.",
      href: 'https://hbw.wiki/service',
      external: true,
      buttonLabel: 'Request Service in Gores Landing',
    };
  }

  if (revenueDriver === BLOG_REVENUE_DRIVER.RENTALS) {
    return {
      title: 'Book a boat on Rice Lake',
      description:
        "Live availability, life jackets and safety gear included. Book online to check the current fleet and rates.",
      href: 'https://harrisboatworks.ca/rentals',
      external: true,
      buttonLabel: 'Check Availability',
    };
  }



  if (revenueDriver === BLOG_REVENUE_DRIVER.SERVICE) {
    return {
      title: 'Request Service',
      description: 'Submit the boat, motor, symptoms, and photos before bringing it to our Gores Landing shop.',
      href: 'https://hbw.wiki/service',
      external: true,
      buttonLabel: 'Request Service in Gores Landing',
    };
  }

  if (revenueDriver === BLOG_REVENUE_DRIVER.AVATOR) {
    return {
      title: 'Explore Mercury Avator',
      description: 'Compare the electric lineup, battery options, charging, and current HBW availability.',
      href: '/electric/mercury-avator',
      buttonLabel: 'View the Avator Lineup',
    };
  }

  if (revenueDriver === BLOG_REVENUE_DRIVER.PRODUCT_PROTECTION) {
    return {
      title: 'Check Product Protection',
      description: 'Review the current Canadian rate card by horsepower and plan term before HBW confirms eligibility.',
      href: '/mercury-product-protection',
      buttonLabel: 'View Product Protection',
    };
  }

  if (revenueDriver === BLOG_REVENUE_DRIVER.COMMERCIAL) {
    return {
      title: 'Request a SeaPro Quote',
      description: 'Tell HBW about the boat, annual hours, load, and operating conditions so we can confirm the right commercial model.',
      href: '/contact',
      buttonLabel: 'Contact HBW About SeaPro',
    };
  }

  return {
    title: 'Build Your Mercury Quote',
    description: 'Choose the motor and options, then see the current CAD total before you send anything to HBW.',
    href: '/quote/motor-selection',
    buttonLabel: 'Build Your Own Quote',
  };
}

export function BlogCTA({ category, slug, variant = 'banner', className = '' }: BlogCTAProps) {
  const cta = pickCTA(category, slug);
  if (!cta) return null;

  const button = (
    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-repower-mercury-red text-white rounded-lg font-medium hover:bg-repower-mercury-red-deep transition-colors">
      {cta.buttonLabel ?? cta.title}
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
        <p
          className={`font-display font-bold text-repower-navy-900 ${
            variant === 'banner' ? 'text-xl md:text-2xl mb-3' : 'text-lg md:text-xl mb-1'
          }`}
          style={{ letterSpacing: '-0.02em' }}
        >
          {cta.title}
        </p>
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
