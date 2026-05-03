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
        <div className="bg-yellow-500 text-yellow-950 text-center text-sm py-1 font-medium z-50 relative">
          Admin Mode, Quote controls will appear on summary page
        </div>
      )}

      {/* Luxury Header System */}
      <LuxuryHeader 
        onSearchClick={onSearchClick}
        showSearchIcon={showSearchIcon}
      />

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