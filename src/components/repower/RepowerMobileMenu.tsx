import { X, ChevronRight, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo-white.png';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  signOut?: () => Promise<any>;
}

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/quote/motor-selection', label: 'Motors' },
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
    <div className="fixed inset-0 z-[80] bg-[#050E1C] text-[#F5F1EA] flex flex-col overflow-hidden">
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(201,162,74,0.18),_transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(200,16,46,0.12),_transparent_70%)] blur-2xl"
      />

      {/* Header — full brand lockup */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-[#F5F1EA]/10 bg-[#050E1C]/80 backdrop-blur-sm">
        <Link to="/" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
          <img src={harrisLogo} alt="Harris Boat Works" className="h-8 w-auto shrink-0" />
          <div className="w-px h-6 bg-[#F5F1EA]/20 shrink-0" />
          <img
            src={mercuryLogo}
            alt="Mercury"
            className="h-5 w-auto shrink-0"
          />
          <div className="w-px h-6 bg-[#F5F1EA]/20 shrink-0" />
          <img
            src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
            alt="Mercury Certified Repower Centre"
            className="h-9 w-auto shrink-0"
          />
        </Link>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-[#F5F1EA] hover:bg-[#F5F1EA]/10 rounded transition-colors shrink-0"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Eyebrow strip */}
      <div className="relative px-6 py-3 border-b border-[#F5F1EA]/10 bg-gradient-to-r from-[#C9A24A]/[0.06] to-transparent">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#C9A24A]">
          Ontario's Mercury Repower Centre
        </p>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto px-6 pt-8 pb-10">
        <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.28em] text-[#C9A24A]/80 mb-4">
          Navigation
        </p>
        <ul>
          {NAV_LINKS.map((link) => {
            const active = isActive(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex items-center justify-between py-4 pl-5 pr-3 -mx-5 border-b border-[#F5F1EA]/[0.08] font-display text-[26px] leading-none transition-colors duration-300 ${
                    active ? 'text-[#C9A24A]' : 'text-[#F5F1EA] hover:text-[#C9A24A]'
                  }`}
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {/* Active indicator bar */}
                  <span
                    aria-hidden
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#C8102E] rounded-r origin-left transition-transform duration-300 ease-out ${
                      active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                  {/* Active gold tint */}
                  <span
                    aria-hidden
                    className={`absolute inset-0 bg-gradient-to-r from-[#C9A24A]/[0.08] to-transparent transition-opacity duration-300 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span className="relative flex items-center gap-3 transition-transform duration-300 ease-out group-hover:translate-x-1">
                    <span
                      aria-hidden
                      className={`inline-block h-[2px] bg-[#C9A24A] transition-all duration-300 ease-out ${
                        active ? 'w-7 opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                    {link.label}
                  </span>
                  <ChevronRight
                    className={`relative w-5 h-5 transition-all duration-300 ${
                      active
                        ? 'text-[#C9A24A]'
                        : 'text-[#F5F1EA]/40 group-hover:text-[#C9A24A] group-hover:translate-x-1'
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTAs */}
        <div className="mt-8 space-y-3">
          <Link
            to="/quote/motor-selection"
            onClick={onClose}
            className="flex items-center justify-center gap-2 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-6 py-4 rounded uppercase tracking-wider text-sm font-semibold transition-colors shadow-lg shadow-[#C8102E]/20"
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
        <div className="mt-10 pt-8 border-t border-[#F5F1EA]/10 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#C9A24A] mb-2">
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
