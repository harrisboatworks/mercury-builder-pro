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

  const navigationLinks = [
    { label: 'Motors', href: '/quote/motor-selection' },
    { label: 'Promotions', href: '/promotions' },
    { label: 'Financing', href: '/financing' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/harrisboatworks', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/harrisboatworks', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/@harrisboatworks', label: 'YouTube' },
  ];

  // Format phone for tel: link (remove formatting)
  const phoneLink = COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '');

  return (
    <footer className={`bg-muted/50 border-t border-border ${className}`}>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
          {/* Navigation - full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>
                  {COMPANY_INFO.address.street}<br />
                  {COMPANY_INFO.address.city}, {COMPANY_INFO.address.province} {COMPANY_INFO.address.postal}
                </span>
              </li>
              <li>
                <a 
                  href={`tel:+1${phoneLink}`} 
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  {COMPANY_INFO.contact.phone}
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${COMPANY_INFO.contact.email}`} 
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  {COMPANY_INFO.contact.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours - Live from Google */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Hours
            </h3>
            <OpeningHoursDisplay 
              openingHours={placeData?.openingHours}
              loading={hoursLoading}
              error={!!hoursError}
            />
          </div>

          {/* Social & Trust - full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-row items-start justify-between md:flex-col gap-4">
              {/* Social Icons */}
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Follow Us
                </h3>
                <div className="flex flex-row gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
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
                  className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <img 
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                  alt="Mercury Certified Repower Center" 
                  className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Serving Ontario Since 1965
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {COMPANY_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
