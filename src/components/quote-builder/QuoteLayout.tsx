import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign, Menu, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { useState } from 'react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { QuoteProgressStepper } from './QuoteProgressStepper';
import { useQuoteActivityTracker } from '@/hooks/useQuoteActivityTracker';
import { useQuote } from '@/contexts/QuoteContext';

interface QuoteLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}
export const QuoteLayout = ({
  children,
  showProgress = true,
  onSearchClick,
  showSearchIcon = false
}: QuoteLayoutProps) => {
  const {
    user,
    signOut,
    isAdmin
  } = useAuth();
  const { state } = useQuote();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Track anonymous quote-building activity in the background
  useQuoteActivityTracker();
  
  return <div className="min-h-screen bg-repower-paper relative">
      {/* Admin Mode Banner */}
      {state.isAdminQuote && isAdmin && (
        <div className="bg-repower-cream0 text-repower-gold text-center text-sm py-1 font-medium z-50 relative">
          Admin Mode, Quote controls will appear on summary page
        </div>
      )}

      {/* Site-wide solid navy header */}
      <RepowerHeader solid />

      {/* Spacer to offset fixed header */}
      <div className="h-[64px] lg:h-[72px]" aria-hidden />

      {/* Persistent trust strip */}
      <div className="bg-repower-cream border-b border-repower-navy-900/10">
        <div className="max-w-[1400px] mx-auto px-5 md:px-14 py-2 text-[12px] font-medium text-repower-navy-900/70 text-center">
          Harris Boat Works · Mercury dealer since 1965, current Premier tier · Family-owned since 1947 · Gores Landing, ON
        </div>
      </div>

      {/* Quote Progress Stepper */}
      {showProgress && <QuoteProgressStepper />}

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        signOut={signOut}
      />
    </div>;
};