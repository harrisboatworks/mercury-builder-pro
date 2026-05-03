import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useAuth } from '@/components/auth/AuthProvider';
import { RepowerMobileMenu } from './RepowerMobileMenu';

const NAV_LINKS = [
  { to: '/', label: 'Engines' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/repower', label: 'Repower' },
  { to: '/trade-in-value', label: 'Trade-In' },
  { to: '/finance-calculator', label: 'Financing' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export function RepowerHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050E1C]/95 backdrop-blur-xl border-b border-[#F5F1EA]/10 py-3'
            : 'bg-gradient-to-b from-[#050E1C]/65 to-transparent py-5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-14 flex items-center justify-between gap-6">
          {/* Logo lockup */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 min-w-0">
            <img src={harrisLogo} alt="Harris Boat Works" className="h-8 md:h-9 w-auto shrink-0" />
            <div className="w-px h-6 sm:h-7 bg-[#F5F1EA]/20 shrink-0" />
            <img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-5 sm:h-7 md:h-8 w-auto brightness-0 invert shrink-0"
            />
            <div className="flex items-center sm:ml-1 md:ml-2 sm:border-l sm:border-[#F5F1EA]/15 sm:pl-3 md:pl-4 shrink-0">
              <img
                src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
                alt="Mercury Certified Repower Centre"
                className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
            {NAV_LINKS.map((link) => {
              const active =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`font-sans text-sm font-medium tracking-wide transition-opacity duration-200 ${
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
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/quote/motor-selection"
              className="hidden sm:inline-flex items-center gap-2 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-5 py-2.5 rounded uppercase tracking-wider text-xs font-semibold transition-colors duration-200"
            >
              Build Quote
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className="hidden md:inline-flex font-sans text-sm text-[#F5F1EA]/80 hover:text-[#F5F1EA] transition-colors"
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
