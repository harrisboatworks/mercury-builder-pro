import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import { OpeningHoursDisplay } from '@/components/business/OpeningHoursDisplay';

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className = '' }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();
  const { data: placeData, isLoading: hoursLoading, error: hoursError } = useGooglePlaceData();
  const sectionTitleClass = 'font-sans text-xs font-semibold uppercase tracking-[0.2em] text-repower-gold mb-5';
  const footerLinkClass = 'font-sans text-sm text-repower-cream/60 hover:text-repower-cream transition-colors';
  const footerTextClass = 'font-sans text-sm text-repower-cream/55 leading-relaxed';
  const footerIconClass = 'h-4 w-4 shrink-0 text-repower-gold';

  const navigationLinks = [
    { label: 'Motors', href: '/quote/motor-selection' },
    { label: 'Promotions', href: '/promotions' },
    { label: 'Financing', href: '/finance-calculator' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const toolsLinks = [
    { label: 'Free Mercury repower tools', href: '/tools' },
    { label: 'Trade-in value estimator', href: '/tools#trade-in-value' },
    { label: 'Repower cost estimator', href: '/tools#repower-cost' },
    { label: 'Boost eligibility checker', href: '/tools#boost-eligibility' },
    { label: 'Shaft length picker', href: '/tools#shaft-length' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/harrisboatworks', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/harrisboatworks', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/@harrisboatworks', label: 'YouTube' },
  ];

  // Format phone for tel: link (remove formatting)
  const phoneLink = COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '');

  return (
    <footer className={`bg-repower-navy-900 text-repower-cream border-t border-repower-cream/10 ${className}`}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 md:px-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Navigation - full width on mobile */}
          <div>
            <h3 className={sectionTitleClass}>
              Navigation
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={footerLinkClass}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className={`${sectionTitleClass} mt-8`}>
              Tools
            </h3>
            <ul className="space-y-2">
              {toolsLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className={sectionTitleClass}>
              Contact
            </h3>
            <ul className="space-y-3">
              <li className={`flex items-start gap-3 ${footerTextClass}`}>
                <MapPin className={`${footerIconClass} mt-0.5`} />
                <span>
                  {COMPANY_INFO.address.street}<br />
                  {COMPANY_INFO.address.city}, {COMPANY_INFO.address.province} {COMPANY_INFO.address.postal}
                </span>
              </li>
              <li>
                <a 
                  href={`tel:+1${phoneLink}`} 
                  className={`flex items-center gap-3 ${footerLinkClass}`}
                >
                  <Phone className={footerIconClass} />
                  {COMPANY_INFO.contact.phone}
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${COMPANY_INFO.contact.email}`} 
                  className={`flex items-center gap-3 ${footerLinkClass}`}
                >
                  <Mail className={footerIconClass} />
                  {COMPANY_INFO.contact.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours - Live from Google */}
          <div>
            <h3 className={sectionTitleClass}>
              Hours
            </h3>
            <OpeningHoursDisplay 
              openingHours={placeData?.openingHours}
              loading={hoursLoading}
              error={!!hoursError}
              tone="dark"
            />
          </div>

          {/* Social & Trust - full width on mobile */}
          <div>
            <div className="flex flex-row items-start justify-between gap-4 sm:flex-col">
              {/* Social Icons */}
              <div>
                <h3 className={sectionTitleClass}>
                  Follow Us
                </h3>
                <div className="flex flex-row gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-repower-cream/15 bg-repower-cream/[0.04] text-repower-cream/65 transition-colors hover:border-repower-gold hover:text-repower-cream"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-row items-center gap-3">
                <img 
                  src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" 
                  alt="Mercury CSI Award Winner" 
                  className="h-12 w-auto opacity-85 transition-opacity hover:opacity-100"
                />
                <img 
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                  alt="Mercury Certified Repower Center" 
                  className="h-12 w-auto opacity-85 transition-opacity hover:opacity-100"
                />
              </div>
            </div>
            <p className="mt-4 font-sans text-xs uppercase tracking-[0.18em] text-repower-cream/40">
              Serving Ontario Since 1947
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-repower-cream/10 pt-8 md:flex-row">
          <p className="font-sans text-sm text-repower-cream/45">
            © {currentYear} {COMPANY_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-6 font-sans text-sm text-repower-cream/45">
            <Link to="/privacy" className="transition-colors hover:text-repower-cream">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-repower-cream">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
