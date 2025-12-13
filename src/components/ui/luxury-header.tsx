import { useState, useEffect, lazy, Suspense } from 'react';
import { User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { HamburgerMenu } from './hamburger-menu';
import { COMPANY_INFO } from '@/lib/companyInfo';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useNavigate, Link } from 'react-router-dom';

// Lazy load ChatWidget (~85KB)
const ChatWidget = lazy(() => import('@/components/chat/ChatWidget').then(m => ({ default: m.ChatWidget })));

interface LuxuryHeaderProps {
  onSearchFocus?: () => void;
  showUtilityBar?: boolean;
}

export function LuxuryHeader({ onSearchFocus, showUtilityBar = true }: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Utility Bar */}
      {showUtilityBar && (
        <div className="hidden md:block h-8 bg-white dark:bg-gray-900 border-b border-luxury-hairline dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
            <p className="text-xs text-luxury-gray dark:text-gray-300 uppercase tracking-wide font-medium">
              Mercury Premier Dealer • Award-Winning Service Team
            </p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-50 h-14 sm:h-16 md:h-[72px] transition-all duration-300 bg-white dark:bg-gray-900 border-b border-luxury-hairline dark:border-gray-800 ${
          isScrolled 
            ? 'shadow-sm backdrop-blur-md dark:shadow-gray-800/50 opacity-100' 
            : 'opacity-95'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-full">
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center h-full gap-2 md:gap-6 min-w-0">
            
            {/* Left: Mobile Menu Button */}
            <button
              className="md:hidden p-1.5 text-luxury-ink dark:text-white hover:text-luxury-gray dark:hover:text-gray-300 transition-colors justify-self-start"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Left: Logos (Desktop Only) */}
            <Link to="/" className="hidden md:flex items-center gap-2 lg:gap-4 justify-self-start keep-flex">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className="h-7 md:h-8 lg:h-9 transition-all duration-300 dark:invert"
              />
              <div className="w-px h-5 md:h-8 bg-luxury-hairline dark:bg-gray-700" />
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className="h-7 md:h-8 lg:h-9 transition-all duration-300 dark:invert"
              />
            </Link>

            {/* Center: Logos (Mobile Only) */}
            <Link to="/" className="flex md:hidden items-center justify-center gap-1.5">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className="h-6 sm:h-7 transition-all duration-300 dark:invert"
              />
              <div className="w-px h-4 sm:h-5 bg-luxury-hairline dark:bg-gray-700" />
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className="h-6 sm:h-7 transition-all duration-300 dark:invert"
              />
            </Link>

            {/* Center: Trust Badges - Desktop Only */}
            <div className="hidden lg:flex items-center justify-center space-x-6 text-base text-luxury-gray dark:text-gray-300 max-w-full overflow-hidden keep-flex">
              <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer transition-all duration-300 hover:scale-105">
                <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-6 md:h-8 lg:h-10 w-auto dark:bg-white dark:p-1 dark:rounded transition-all duration-300 group-hover:drop-shadow-lg" />
                <span className="hidden lg:inline font-medium transition-colors duration-300 group-hover:text-luxury-ink dark:group-hover:text-white">Award-Winning Service</span>
              </div>
              <div className="hidden lg:block text-luxury-hairline dark:text-gray-600">•</div>
              <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer transition-all duration-300 hover:scale-105">
                <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-6 md:h-8 lg:h-10 w-auto dark:bg-white dark:p-1 dark:rounded transition-all duration-300 group-hover:drop-shadow-lg" />
                <span className="hidden lg:inline font-medium transition-colors duration-300 group-hover:text-luxury-ink dark:group-hover:text-white">Certified Repower Center</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1 md:gap-2 min-w-[40px] keep-flex">
              {/* Chat Widget (Desktop) */}
              <div className="hidden md:block">
                <Suspense fallback={null}>
                  <ChatWidget />
                </Suspense>
              </div>

              {/* User Menu (Desktop) */}
              <div className="hidden md:flex items-center gap-2 keep-flex">
                {user ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="p-2 text-luxury-ink dark:text-white hover:text-luxury-gray dark:hover:text-gray-300 hover:bg-luxury-stage dark:hover:bg-gray-800"
                      title="View Dashboard"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => signOut()}
                      className="p-2 text-luxury-ink dark:text-white hover:text-luxury-gray dark:hover:text-gray-300 hover:bg-luxury-stage dark:hover:bg-gray-800"
                      title="Sign out"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="px-3 py-2 text-sm text-luxury-ink dark:text-white hover:text-luxury-gray dark:hover:text-gray-300 hover:bg-luxury-stage dark:hover:bg-gray-800"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 h-12">
              <Link 
                to="/" 
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                Engines
              </Link>
              <Link 
                to="/accessories" 
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                Accessories
              </Link>
              <Link 
                to="/promotions" 
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                Promotions
              </Link>
            <Link 
              to="/finance-calculator" 
              className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
            >
              Financing
            </Link>
            <Link 
              to="/contact" 
              className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        user={user}
        signOut={signOut}
      />
    </>
  );
}