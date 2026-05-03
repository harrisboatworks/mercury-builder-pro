import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo-white.png';
import { useAuth } from '@/components/auth/AuthProvider';
import { RepowerMobileMenu } from './RepowerMobileMenu';

const NAV_LINKS = [
  { to: '/quote/motor-selection', label: 'Engines' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/repower', label: 'Repower' },
  { to: '/trade-in-value', label: 'Trade-In Value' },
  { to: '/finance-calculator', label: 'Financing' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export function RepowerHeader({ solid = false }: { solid?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isSolid
            ? 'bg-[#050E1C] border-b border-[#F5F1EA]/10 py-3'
            : 'bg-gradient-to-b from-[#050E1C]/65 to-transparent py-5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 xl:px-14 flex flex-row flex-nowrap items-center justify-between gap-3 md:gap-4 xl:gap-6">
          {/* Logo lockup — always horizontal */}
          <Link to="/" className="flex flex-row flex-nowrap items-center justify-start gap-1.5 sm:gap-2 lg:gap-3 min-w-0 overflow-hidden shrink-0">
            <img src={harrisLogo} alt="Harris Boat Works" className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto shrink-0" />
            <div className="w-px h-6 sm:h-7 bg-[#F5F1EA]/20 shrink-0" />
            <img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-5 sm:h-6 md:h-7 w-auto shrink-0"
            />
            <div className="flex items-center pl-1.5 sm:pl-2 lg:pl-3 border-l border-[#F5F1EA]/15 shrink-0">
              <img
                src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
                alt="Mercury Repower Center"
                className="h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 w-auto"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-5 2xl:gap-7 min-w-0">
            {NAV_LINKS.map((link) => {
              const active =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`font-sans text-sm font-medium tracking-wide whitespace-nowrap transition-opacity duration-200 ${
                    active
                      ? 'text-[#F5F1EA] opacity-100'
                      : 'text-[#F5F1EA]/85 hover:opacity-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center justify-end gap-3 shrink-0">
            <Link
              to="/quote/motor-selection"
              className="hidden lg:inline-flex items-center gap-2 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded uppercase tracking-wider text-[11px] lg:text-xs font-semibold whitespace-nowrap transition-colors duration-200"
            >
              Build Quote
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className="hidden lg:inline-flex font-sans text-sm text-[#F5F1EA]/80 hover:text-[#F5F1EA] transition-colors"
              >
                Sign In
              </button>
            )}
            <button
              className="lg:hidden p-2 text-[#F5F1EA]"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
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
