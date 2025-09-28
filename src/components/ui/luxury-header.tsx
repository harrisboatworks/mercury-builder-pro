import { useState, useEffect } from 'react';
import { Search, ShoppingCart, HelpCircle, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LuxurySearch } from './luxury-search';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { HamburgerMenu } from './hamburger-menu';
import { COMPANY_INFO } from '@/lib/companyInfo';

interface LuxuryHeaderProps {
  onSearchFocus?: () => void;
  showUtilityBar?: boolean;
}

export function LuxuryHeader({ onSearchFocus, showUtilityBar = true }: LuxuryHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { state } = useQuote();
  const { user, signOut } = useAuth();

  // Get quote item count
  const quoteItemCount = state.motor ? 1 : 0;

  // Compact header scroll behavior
  useEffect(() => {
    let lastScrollY = 0;
    let isCompact = false;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const header = document.querySelector('.site-header');
      
      if (!header) return;
      
      if (!isCompact && currentScrollY > 24 && currentScrollY > lastScrollY) {
        header.classList.add('compact');
        isCompact = true;
      }
      
      if (isCompact && currentScrollY < 16) {
        header.classList.remove('compact');
        isCompact = false;
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Utility Bar - Desktop Only */}
      {showUtilityBar && (
        <div className="utility-bar">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
            <p className="text-xs text-luxury-gray uppercase tracking-wide font-medium">
              Mercury Premier Dealer • Award-Winning Service Team
            </p>
          </div>
        </div>
      )}

      {/* Compact Sticky Header */}
      <header className="site-header">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden icon text-luxury-ink hover:text-luxury-gray transition-colors"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <img 
            src="/src/assets/harris-logo.png" 
            alt="Harris Boat Works" 
            className="h-8"
          />
        </div>

        {/* Center: Search Pill (collapses to icon) */}
        <div 
          className="search-pill"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search motors...</span>
        </div>

        <div 
          className="search-icon"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
        </div>

        {/* Right: Quote/Cart */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="relative btn text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
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
        </div>
      </header>

      {/* Mobile Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Search Sheet - Full Screen Mobile */}
      <div className={`search-sheet ${isSearchOpen ? 'open' : ''}`}>
        <div className="search-sheet-header">
          <input
            type="text"
            placeholder="Search Mercury motors..."
            className="search-sheet-input"
            autoFocus
          />
          <button
            className="search-sheet-close"
            onClick={() => setIsSearchOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-luxury-gray">
            Start typing to search motors by model, horsepower, or features...
          </p>
        </div>
      </div>
    </>
  );
}