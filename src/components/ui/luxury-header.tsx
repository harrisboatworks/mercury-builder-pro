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

interface LuxuryHeaderProps {
  onSearchFocus?: () => void;
  showUtilityBar?: boolean;
}

export function LuxuryHeader({ onSearchFocus, showUtilityBar = true }: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        className={`sticky top-0 z-50 h-[72px] transition-all duration-300 bg-white border-b border-luxury-hairline ${
          isScrolled 
            ? 'shadow-sm backdrop-blur-md' 
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] h-full gap-3 sm:gap-4 md:gap-6">
            
            {/* Left: Mobile Menu + Logos */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 -ml-3 text-luxury-ink hover:text-luxury-gray transition-colors"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Logos - Centered on Mobile, Left on Desktop */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Harris Logo */}
                <img 
                  src={harrisLogo} 
                  alt="Harris Boat Works" 
                  className="h-5 sm:h-6 md:h-7 lg:h-8 transition-all duration-300"
                />
                
                {/* Hairline Divider */}
                <div className="hidden md:block w-px h-6 md:h-8 bg-luxury-hairline" />
                
                {/* Mercury Logo - Show on all screens */}
                <img 
                  src={mercuryLogo} 
                  alt="Mercury Marine" 
                  className="h-5 sm:h-6 md:h-7 lg:h-8 transition-all duration-300"
                />
              </div>
            </div>

            {/* Center: Trust Badges - Desktop Only */}
            <div className="hidden md:flex items-center justify-center space-x-6 text-xs text-luxury-gray">
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-5 w-auto" />
                <span className="font-medium">Award-Winning Service</span>
              </div>
              <div className="text-luxury-hairline">•</div>
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-5 w-auto" />
                <span className="font-medium">Certified Repower Center</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1">
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
    </>
  );
}