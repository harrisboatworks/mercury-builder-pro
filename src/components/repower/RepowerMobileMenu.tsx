import { X, ChevronRight, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  signOut?: () => Promise<any>;
}

const NAV_LINKS = [
  { to: '/', label: 'Engines' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/repower', label: 'Repower' },
  { to: '/trade-in-value', label: 'Trade-In Value' },
  { to: '/finance-calculator', label: 'Financing' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export function RepowerMobileMenu({ isOpen, onClose, user, signOut }: Props) {
  const location = useLocation();
  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(to + '/');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#050E1C] text-[#F5F1EA] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5F1EA]/10">
        <img
          src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
          alt="Mercury Repower Centre"
          className="h-10 w-auto"
        />
        <button
          onClick={onClose}
          className="p-2 text-[#F5F1EA] hover:bg-[#F5F1EA]/10 rounded transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-6 py-10">
        <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
          Navigation
        </p>
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center justify-between py-4 border-b border-[#F5F1EA]/8 font-display text-2xl transition-colors ${
                    active
                      ? 'text-[#C9A24A]'
                      : 'text-[#F5F1EA] hover:text-[#C9A24A]'
                  }`}
                  style={{ letterSpacing: '-0.02em' }}
                >
                  <span className="flex items-center gap-3">
                    {active && (
                      <span
                        aria-hidden
                        className="inline-block h-[2px] w-6 bg-[#C8102E]"
                      />
                    )}
                    {link.label}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-[#C9A24A]' : 'text-[#F5F1EA]/40 group-hover:text-[#C9A24A]'
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTAs */}
        <div className="mt-10 space-y-3">
          <Link
            to="/quote/motor-selection"
            onClick={onClose}
            className="flex items-center justify-center gap-2 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-6 py-4 rounded uppercase tracking-wider text-sm font-semibold transition-colors"
          >
            Build Your Quote
            <ChevronRight className="w-4 h-4" />
          </Link>
          <a
            href="tel:9053422153"
            className="flex items-center justify-center gap-2 border border-[#F5F1EA]/25 text-[#F5F1EA] px-6 py-4 rounded uppercase tracking-wider text-sm font-semibold hover:bg-[#F5F1EA]/5 transition-colors"
          >
            <Phone className="w-4 h-4" />
            (905) 342-2153
          </a>
          {user ? (
            <button
              onClick={async () => {
                if (signOut) await signOut();
                onClose();
              }}
              className="w-full font-sans text-sm text-[#F5F1EA]/70 hover:text-[#F5F1EA] py-3 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={onClose}
              className="block text-center font-sans text-sm text-[#F5F1EA]/70 hover:text-[#F5F1EA] py-3 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#F5F1EA]/10 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#C9A24A] mb-2">
            Mercury Platinum Dealer · Since 1947
          </p>
          <p className="font-sans text-xs text-[#F5F1EA]/55 leading-relaxed">
            5369 Harris Boat Works Rd<br />
            Gores Landing, ON
          </p>
        </div>
      </nav>
    </div>
  );
}
