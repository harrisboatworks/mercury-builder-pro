import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo-white.png';
import { useAuth } from '@/components/auth/AuthProvider';
import { RepowerMobileMenu } from './RepowerMobileMenu';

const PRIMARY_NAV_LINKS = [
  { to: '/quote/motor-selection', label: 'Outboards' },
  { to: '/pricing-reference', label: 'Pricing' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/finance-calculator', label: 'Financing' },
  { to: '/trade-in-value', label: 'Trade-In', wideOnly: true },
];

export function RepowerHeader({ solid = false }: { solid?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isQuoteFlow = location.pathname.startsWith('/quote');

  // Transparent-fade behavior is reserved for the home page (over the video hero).
  // Every other route renders a solid navy header from first paint.
  const forceSolid = solid || location.pathname !== '/';

  useEffect(() => {
    if (forceSolid) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [forceSolid]);

  const isSolid = forceSolid || scrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 lg:h-[72px] ${
          isSolid
            ? 'bg-[#050E1C] border-b border-[#F5F1EA]/10'
            : 'bg-gradient-to-b from-[#050E1C]/65 to-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full px-4 md:px-8 xl:px-14 flex flex-row flex-nowrap items-center justify-between gap-4 md:gap-6 min-[1500px]:gap-8">
          {/* Logo lockup, always horizontal */}
          <Link to="/" className="flex flex-row flex-nowrap items-center justify-start gap-1.5 sm:gap-2 lg:gap-3 min-w-0 shrink-0">
            <img src={harrisLogo} alt="Harris Boat Works" className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto shrink-0" />
            <div className="w-px h-6 sm:h-7 bg-[#F5F1EA]/20 shrink-0" />
            <img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-5 sm:h-6 md:h-7 w-auto shrink-0 hidden min-[1500px]:block"
            />
            <div className="flex items-center pl-1.5 sm:pl-2 lg:pl-3 border-l border-[#F5F1EA]/15 shrink-0">
              <img
                src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
                alt="Mercury Repower Center"
                className="h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 w-auto"
              />
            </div>
          </Link>

          {/* Desktop orientation links. Secondary pages stay under More. */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex h-full flex-1 items-center justify-center gap-1 xl:gap-2 min-w-0"
          >
            {PRIMARY_NAV_LINKS.map((link) => {
              const active =
                link.to === '/quote/motor-selection'
                  ? location.pathname.startsWith('/quote')
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex h-full items-center px-2 xl:px-3 font-sans text-[11px] xl:text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-200 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[#C9A24A] after:transition-transform after:duration-200 xl:after:left-3 xl:after:right-3 ${
                    link.wideOnly ? 'hidden xl:inline-flex' : ''
                  } ${
                    active
                      ? 'text-[#F5F1EA] after:scale-x-100'
                      : 'text-[#F5F1EA]/70 hover:text-[#F5F1EA] after:scale-x-0 hover:after:scale-x-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center justify-end gap-3 shrink-0">
            {!isQuoteFlow && (
              <Link
                to="/quote/motor-selection"
                className="hidden md:inline-flex items-center gap-1.5 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-3 py-2 xl:px-4 xl:py-2.5 rounded uppercase tracking-wider text-[11px] xl:text-xs font-semibold whitespace-nowrap transition-colors duration-200"
              >
                Build Quote
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              className="inline-flex items-center gap-2 p-2 text-[#F5F1EA]/80 hover:text-[#F5F1EA] transition-colors"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="hidden lg:inline font-sans text-[11px] font-semibold uppercase tracking-[0.12em]">
                More
              </span>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <RepowerMobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        signOut={signOut}
      />
    </>
  );
}
