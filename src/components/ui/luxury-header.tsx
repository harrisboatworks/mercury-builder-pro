import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { HamburgerMenu } from './hamburger-menu';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { COMPANY_INFO } from '@/lib/companyInfo';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useNavigate, Link } from 'react-router-dom';

interface LuxuryHeaderProps {
  onSearchFocus?: () => void;
  showUtilityBar?: boolean;
}

export function LuxuryHeader({ onSearchFocus, showUtilityBar = true }: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useQuote();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get quote item count
  const quoteItemCount = state.motor ? 1 : 0;

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
            ? 'shadow-sm backdrop-blur-md dark:shadow-gray-800/50' 
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-full">
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center h-full gap-2 md:gap-6">
            
            {/* Left: Mobile Menu Button */}
            <button
              className="md:hidden p-1.5 text-luxury-ink dark:text-white hover:text-luxury-gray dark:hover:text-gray-300 transition-colors justify-self-start"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Left: Logos (Desktop Only) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4 justify-self-start">
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
            </div>

            {/* Center: Logos (Mobile Only) */}
            <div className="flex md:hidden items-center justify-center gap-1.5">
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
            </div>

            {/* Center: Trust Badges - Compact on Tablet, Full on Desktop */}
            <div className="hidden md:flex items-center justify-center space-x-3 lg:space-x-6 text-sm lg:text-base lg:font-semibold text-luxury-gray dark:text-gray-300">
              <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer transition-all duration-300 hover:scale-105">
                <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-6 lg:h-10 w-auto dark:bg-white dark:p-1 dark:rounded transition-all duration-300 group-hover:drop-shadow-lg" />
                <span className="hidden lg:inline font-semibold transition-colors duration-300 group-hover:text-luxury-ink dark:group-hover:text-white">Award-Winning Service</span>
              </div>
              <div className="hidden lg:block text-luxury-hairline dark:text-gray-600">•</div>
              <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer transition-all duration-300 hover:scale-105">
                <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-6 lg:h-10 w-auto dark:bg-white dark:p-1 dark:rounded transition-all duration-300 group-hover:drop-shadow-lg" />
                <span className="hidden lg:inline font-semibold transition-colors duration-300 group-hover:text-luxury-ink dark:group-hover:text-white">Certified Repower Center</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-0 sm:gap-0.5 md:gap-1 min-w-[40px]">
              {/* Quote/Cart Button */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-luxury-ink dark:text-white hover:text-luxury-gray dark:hover:text-gray-300 hover:bg-luxury-stage dark:hover:bg-gray-800"
              >
                <ShoppingCart className="h-5 w-5" />
                {quoteItemCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-luxury-ink dark:bg-white text-white dark:text-gray-900 text-xs flex items-center justify-center"
                  >
                    {quoteItemCount}
                  </Badge>
                )}
              </Button>

              {/* Chat Widget (Desktop) */}
              <div className="hidden md:block">
                <ChatWidget />
              </div>

              {/* User Menu (Desktop) */}
              <div className="hidden md:flex items-center gap-2">
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
            <a 
              href="#engines" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Engines
            </a>
            <a 
              href="#accessories" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Accessories
            </a>
            <Link 
              to="/finance-calculator" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Financing
            </Link>
            <Link 
              to="/contact" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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