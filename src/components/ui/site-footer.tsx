import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail, Clock } from 'lucide-react';

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className = '' }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { label: 'Motors', href: '/quote/motor-selection' },
    { label: 'Accessories', href: '/accessories' },
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

  return (
    <footer className={`bg-muted/50 border-t border-border ${className}`}>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
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
                  1234 Marina Drive<br />
                  Peterborough, ON K9J 7B5
                </span>
              </li>
              <li>
                <a 
                  href="tel:+17057421234" 
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  (705) 742-1234
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@harrisboatworks.ca" 
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  info@harrisboatworks.ca
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Hours
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p>Mon - Fri: 8am - 5pm</p>
                  <p>Saturday: 9am - 3pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Social & Trust */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Follow Us
            </h3>
            <div className="flex gap-3 mb-6">
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
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Mercury Authorized Dealer
              </p>
              <p className="text-xs text-muted-foreground">
                Serving Ontario Since 1965
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Harris Boat Works. All rights reserved.
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
