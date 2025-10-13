import { useState, useEffect } from 'react';
import { Search, ShoppingCart, HelpCircle, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LuxurySearch } from './luxury-search';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { HamburgerMenu } from './hamburger-menu';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { COMPANY_INFO } from '@/lib/companyInfo';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

interface LuxuryHeaderProps {
  onSearchFocus?: () => void;
  showUtilityBar?: boolean;
}

export function LuxuryHeader({ onSearchFocus, showUtilityBar = true }: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { state } = useQuote();
  const { user, signOut } = useAuth();

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
        <div className="hidden md:block h-8 bg-white border-b border-luxury-hairline">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
            <p className="text-xs text-luxury-gray uppercase tracking-wide font-medium">
              Mercury Premier Dealer • Award-Winning Service Team
            </p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 bg-white ${
          isScrolled 
            ? 'h-14 backdrop-blur-md shadow-sm border-b border-luxury-hairline' 
            : 'h-18 border-b border-luxury-hairline'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            
            {/* Left: Logos */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 -ml-3 text-luxury-ink hover:text-luxury-gray transition-colors"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Harris Logo */}
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className={`transition-all duration-300 ${
                  isScrolled ? 'h-6 sm:h-8' : 'h-7 sm:h-10'
                }`}
              />
              
              {/* Hairline Divider */}
              <div className="hidden md:block w-px h-8 bg-luxury-hairline" />
              
              {/* Mercury Logo + Subtitle */}
              <div className="hidden md:flex flex-col">
                <img 
                  src={mercuryLogo} 
                  alt="Mercury Marine" 
                  className={`transition-all duration-300 ${
                    isScrolled ? 'h-6' : 'h-7'
                  }`}
                />
                <span className="text-xs text-luxury-gray uppercase tracking-wide font-medium mt-0.5">
                  Premier Dealer
                </span>
              </div>
            </div>

            {/* Center: Search (Desktop) */}
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <LuxurySearch />
            </div>

            {/* Center: Search Icon (Mobile) */}
            <button
              className="md:hidden p-2 text-luxury-ink hover:text-luxury-gray transition-colors"
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Quote/Cart Button */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
              >
                <ShoppingCart className="h-5 w-5" />
                {quoteItemCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-luxury-ink text-white text-xs flex items-center justify-center"
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
                      className="p-2 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => signOut()}
                      className="p-2 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
                      title="Sign out"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-3 py-2 text-sm text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Mobile Search Sheet - TODO: Implement SearchSheet component */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-luxury-gray hover:text-luxury-ink"
              >
                ←
              </button>
              <div className="flex-1">
                <LuxurySearch autoFocus />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}